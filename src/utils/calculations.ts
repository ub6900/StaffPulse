import {
  AttendanceRecord,
  CompanySettings,
  Employee,
  MonthlyAdjustment,
  PayrollItem,
} from '../types';

export function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getMonthDaysArray(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const days = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 1; i <= totalDays; i++) {
    const dayStr = i.toString().padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;
    const dateObj = new Date(year, month - 1, i);
    const dayOfWeekIdx = dateObj.getDay();

    days.push({
      date: dateStr,
      dayNum: i,
      dayOfWeek: dayNames[dayOfWeekIdx],
      isSunday: dayOfWeekIdx === 0,
      isSaturday: dayOfWeekIdx === 6,
    });
  }

  return days;
}

export function calculateWorkingDaysInMonth(
  yearMonth: string,
  mode: CompanySettings['workingDaysMode'],
): number {
  const totalDays = getDaysInMonth(yearMonth);
  if (mode === 'standard_26') return 26;
  if (mode === 'standard_30') return 30;
  if (mode === 'calendar_days') return totalDays;

  // exclude_sundays
  const days = getMonthDaysArray(yearMonth);
  return days.filter((d) => !d.isSunday).length;
}

export function calculatePayrollItem(
  employee: Employee,
  yearMonth: string,
  records: AttendanceRecord[],
  adjustments: MonthlyAdjustment[],
  settings: CompanySettings,
  storedPayment?: {
    status?: 'pending' | 'approved' | 'paid';
    paidAt?: string;
    paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
    paymentRef?: string;
  },
): PayrollItem {
  const totalDaysInMonth = getDaysInMonth(yearMonth);
  const standardWorkingDays = calculateWorkingDaysInMonth(yearMonth, settings.workingDaysMode);

  // Filter attendance records for this employee in this month
  const empRecords = records.filter(
    (r) => r.employeeId === employee.id && r.date.startsWith(yearMonth),
  );

  let fullDays = 0;
  let halfDays = 0;
  let doubleDays = 0;
  let absentDays = 0;

  for (const rec of empRecords) {
    if (rec.status === 'full') fullDays++;
    else if (rec.status === 'half') halfDays++;
    else if (rec.status === 'double') doubleDays++;
    else if (rec.status === 'absent') absentDays++;
  }

  const recordedCount = fullDays + halfDays + doubleDays + absentDays;
  const unrecordedDays = Math.max(0, totalDaysInMonth - recordedCount);
  const effectiveAbsentDays = settings.autoMarkAbsent ? absentDays + unrecordedDays : absentDays;

  // Payable days: Full Day = 1.0, Half Day = 0.5, Double Day = 2.0
  const payableDays = fullDays + halfDays * 0.5 + doubleDays * 2.0;

  // Daily rate calculation
  const divisor = Math.max(1, standardWorkingDays);
  const dailyRate = Math.round((employee.baseSalary / divisor) * 100) / 100;

  // Earned base salary based on payable days
  const earnedBaseSalary = Math.round(dailyRate * payableDays);

  // No overtime payment system
  const totalOtHours = 0;
  const otHourlyRate = 0;
  const otPay = 0;

  // Adjustments in this month
  const empAdjustments = adjustments.filter(
    (a) => a.employeeId === employee.id && a.month === yearMonth,
  );

  let bonusAdjustments = 0;
  let reimbursements = 0;
  let advanceDeduction = 0;
  let penaltyAdjustments = 0;
  let otherDeductions = 0;

  for (const adj of empAdjustments) {
    if (adj.type === 'bonus' || adj.type === 'incentive') {
      bonusAdjustments += adj.amount;
    } else if (adj.type === 'reimbursement') {
      reimbursements += adj.amount;
    } else if (adj.type === 'advance_deduction') {
      advanceDeduction += adj.amount;
    } else if (adj.type === 'penalty') {
      penaltyAdjustments += adj.amount;
    } else if (adj.type === 'other_deduction') {
      otherDeductions += adj.amount;
    }
  }

  const defaultAllowance = employee.defaultAllowance || 0;
  const grossSalary = earnedBaseSalary + defaultAllowance + bonusAdjustments + reimbursements;

  const defaultDeduction = employee.defaultDeduction || 0;
  const totalDeductions = advanceDeduction + defaultDeduction + penaltyAdjustments + otherDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    employeeId: employee.id,
    month: yearMonth,
    baseSalary: employee.baseSalary,
    totalDaysInMonth,
    standardWorkingDays,
    fullDays,
    halfDays,
    doubleDays,
    absentDays: effectiveAbsentDays,
    unrecordedDays: settings.autoMarkAbsent ? 0 : unrecordedDays,
    payableDays,
    dailyRate,
    earnedBaseSalary,
    totalOtHours,
    otHourlyRate,
    otPay,
    defaultAllowance,
    bonusAdjustments,
    reimbursements,
    grossSalary,
    advanceDeduction,
    defaultDeduction,
    penaltyAdjustments,
    otherDeductions,
    totalDeductions,
    netSalary,
    paymentStatus: storedPayment?.status || 'pending',
    paidAt: storedPayment?.paidAt,
    paymentMethod: storedPayment?.paymentMethod || 'bank_transfer',
    paymentRef: storedPayment?.paymentRef,
  };
}

export function formatCurrency(amount: number | undefined, symbol = '₹'): string {
  if (amount === undefined || isNaN(amount)) return `${symbol}0.00`;
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  const formatted = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatNumber(val: number): string {
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' ' + inWords(n % 100) : '')
      );
    if (n < 1000000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
      );
    if (n < 1000000000)
      return (
        inWords(Math.floor(n / 1000000)) +
        ' Million' +
        (n % 1000000 !== 0 ? ' ' + inWords(n % 1000000) : '')
      );
    return n.toString();
  }

  const rounded = Math.floor(Math.abs(num));
  return inWords(rounded);
}

const HINDI_NUMBERS = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छ्यासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
];

export function numberToWordsHindi(num: number): string {
  const rounded = Math.floor(Math.abs(num));
  if (rounded === 0) return 'शून्य';

  function inWordsHindi(n: number): string {
    if (n < 100) return HINDI_NUMBERS[n] || n.toString();
    if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const rem = n % 100;
      return (
        HINDI_NUMBERS[hundreds] +
        ' सौ' +
        (rem > 0 ? ' ' + inWordsHindi(rem) : '')
      );
    }
    if (n < 100000) {
      const thousands = Math.floor(n / 1000);
      const rem = n % 1000;
      return (
        inWordsHindi(thousands) +
        ' हज़ार' +
        (rem > 0 ? ' ' + inWordsHindi(rem) : '')
      );
    }
    if (n < 10000000) {
      const lakhs = Math.floor(n / 100000);
      const rem = n % 100000;
      return (
        inWordsHindi(lakhs) +
        ' लाख' +
        (rem > 0 ? ' ' + inWordsHindi(rem) : '')
      );
    }
    const crores = Math.floor(n / 10000000);
    const rem = n % 10000000;
    return (
      inWordsHindi(crores) +
      ' करोड़' +
      (rem > 0 ? ' ' + inWordsHindi(rem) : '')
    );
  }

  return inWordsHindi(rounded);
}

export function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getMonthLabelHindi(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const hindiMonths = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];
  const monthName = hindiMonths[(month - 1) % 12] || '';
  return `${monthName} ${year}`;
}

/**
 * Strictly format dates as DD-MM-YYYY across the application
 * e.g., '2026-09-24' -> '24-09-2026'
 */
export function formatDateDDMMYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    // If it's already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
      return dateInput;
    }
    // If it's in YYYY-MM-DD or ISO format
    const match = dateInput.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${day}-${month}-${year}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format date as DD-MM-YYYY with day name, e.g. "24-09-2026 (Thursday)"
 */
export function formatDateWithDay(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  const d =
    typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
      ? new Date(dateInput + 'T00:00:00')
      : new Date(dateInput);

  if (isNaN(d.getTime())) return formatDateDDMMYYYY(dateInput);

  const formatted = formatDateDDMMYYYY(d);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${formatted} (${dayName})`;
}
