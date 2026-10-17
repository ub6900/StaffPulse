import {
  AdvanceTransaction,
  AttendanceRecord,
  AttendanceStatus,
  CompanySettings,
  Employee,
  MonthlyAdjustment,
  PayrollItem,
  AccountingTransaction,
  MasterDataConfig,
} from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'staffpulse_employees_v1',
  ATTENDANCE: 'staffpulse_attendance_v1',
  ADVANCES: 'staffpulse_advances_v1',
  ADJUSTMENTS: 'staffpulse_adjustments_v1',
  PAYMENTS: 'staffpulse_payroll_payments_v1',
  SETTINGS: 'staffpulse_settings_v1',
  ACCOUNTING: 'staffpulse_accounting_v1',
  MASTER_DATA: 'staffpulse_master_data_v1',
};

export const DEFAULT_MASTER_DATA: MasterDataConfig = {
  attendanceTypes: [
    { id: 'att-1', code: 'P', label: 'Full Day', value: 1.0 },
    { id: 'att-2', code: 'H', label: 'Half Day', value: 0.5 },
    { id: 'att-3', code: 'A', label: 'Absent', value: 0.0 },
    { id: 'att-4', code: 'PL', label: 'Paid Leave', value: 1.0 },
    { id: 'att-5', code: 'D', label: 'Double', value: 2.0 },
  ],
  expenseCategories: [
    { id: 'cat-1', name: 'Sales / Revenue', type: 'credit' },
    { id: 'cat-2', name: 'Advance Recovery', type: 'credit' },
    { id: 'cat-3', name: 'Client Deposit', type: 'credit' },
    { id: 'cat-4', name: 'Other Income', type: 'credit' },
    { id: 'cat-5', name: 'Raw Materials', type: 'debit' },
    { id: 'cat-6', name: 'Staff Salaries & Wages', type: 'debit' },
    { id: 'cat-7', name: 'Utilities & Power', type: 'debit' },
    { id: 'cat-8', name: 'Rent & Lease', type: 'debit' },
    { id: 'cat-9', name: 'Maintenance & Repairs', type: 'debit' },
    { id: 'cat-10', name: 'Transportation & Logistics', type: 'debit' },
    { id: 'cat-11', name: 'Office Supplies', type: 'debit' },
    { id: 'cat-12', name: 'Miscellaneous Expense', type: 'debit' },
  ],
  paymentMethods: [
    { id: 'pm-1', name: 'cash', label: 'Cash' },
    { id: 'pm-2', name: 'bank', label: 'Bank Transfer' },
    { id: 'pm-3', name: 'upi', label: 'UPI' },
    { id: 'pm-4', name: 'cheque', label: 'Cheque' },
  ],
};

export const INITIAL_ACCOUNTING: AccountingTransaction[] = [];

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Apex Engineering & Fabrication',
  employerAddress: 'Plot 42, Industrial Area, Sector 8',
  employerTaxId: 'GSTIN-27AAAAA0000A1Z5',
  currency: '₹',
  workingDaysMode: 'standard_26',
  standardShiftHours: 8,
  autoMarkAbsent: false,
  themeColor: 'indigo',
  tableDensity: 'comfortable',
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    code: 'EMP-01',
    name: 'John Vance',
    department: 'Production',
    role: 'Senior CNC Machinist & Supervisor',
    phone: '+91 98765 43210',
    email: 'john.vance@apex-eng.com',
    joinDate: '2023-03-15',
    baseSalary: 34000,
    standardHoursPerDay: 8,
    otHourlyRate: 245,
    advanceBalance: 4000,
    defaultAllowance: 1500,
    defaultDeduction: 1200,
    status: 'active',
    notes: 'Handles precision milling machinery and floor shift scheduling.',
  },
  {
    id: 'emp-2',
    code: 'EMP-02',
    name: 'Elena Rostova',
    department: 'Production',
    role: 'Assembly & Welding Specialist',
    phone: '+91 98765 43211',
    email: 'elena.rostova@apex-eng.com',
    joinDate: '2023-08-01',
    baseSalary: 26000,
    standardHoursPerDay: 8,
    otHourlyRate: 185,
    advanceBalance: 0,
    defaultAllowance: 1000,
    defaultDeduction: 800,
    status: 'active',
    notes: 'TIG/MIG welding certified.',
  },
  {
    id: 'emp-3',
    code: 'EMP-03',
    name: 'Marcus Sterling',
    department: 'Logistics',
    role: 'Warehouse & Inventory Manager',
    phone: '+91 98765 43212',
    email: 'marcus.s@apex-eng.com',
    joinDate: '2024-01-10',
    baseSalary: 28000,
    standardHoursPerDay: 8,
    otHourlyRate: 200,
    advanceBalance: 3000,
    defaultAllowance: 1200,
    defaultDeduction: 950,
    status: 'active',
    notes: 'Forklift certified, leads raw material receiving and dispatch.',
  },
  {
    id: 'emp-4',
    code: 'EMP-04',
    name: 'Priya Sharma',
    department: 'Quality Assurance',
    role: 'QA / Quality Control Inspector',
    phone: '+91 98765 43213',
    email: 'priya.sharma@apex-eng.com',
    joinDate: '2024-04-20',
    baseSalary: 29500,
    standardHoursPerDay: 8,
    otHourlyRate: 210,
    advanceBalance: 1500,
    defaultAllowance: 1000,
    defaultDeduction: 1100,
    status: 'active',
    notes: 'ISO audit compliance officer.',
  },
  {
    id: 'emp-5',
    code: 'EMP-05',
    name: "David O'Connor",
    department: 'Maintenance',
    role: 'Electro-Mechanical Technician',
    phone: '+91 98765 43214',
    email: 'david.oc@apex-eng.com',
    joinDate: '2024-09-01',
    baseSalary: 23000,
    standardHoursPerDay: 8,
    otHourlyRate: 165,
    advanceBalance: 5000,
    defaultAllowance: 800,
    defaultDeduction: 700,
    status: 'active',
    notes: 'Took emergency vehicle repair advance upon joining.',
  },
  {
    id: 'emp-6',
    code: 'EMP-06',
    name: 'Sofia Morales',
    department: 'Operations',
    role: 'Packaging & Dispatch Associate',
    phone: '+91 98765 43215',
    email: 'sofia.m@apex-eng.com',
    joinDate: '2024-06-12',
    baseSalary: 22000,
    standardHoursPerDay: 8,
    otHourlyRate: 155,
    advanceBalance: 0,
    defaultAllowance: 800,
    defaultDeduction: 600,
    status: 'active',
  },
];

export function generateInitialAttendance(): AttendanceRecord[] {
  return [];
}

export const INITIAL_ADVANCE_TRANSACTIONS: AdvanceTransaction[] = [
  {
    id: 'adv-1',
    employeeId: 'emp-1',
    date: '2026-08-15',
    type: 'given',
    amount: 6000,
    note: 'Home renovation advance',
  },
  {
    id: 'adv-2',
    employeeId: 'emp-1',
    date: '2026-08-31',
    type: 'deducted',
    amount: 2000,
    note: 'August payroll deduction',
    payrollMonth: '2026-08',
  },
  {
    id: 'adv-3',
    employeeId: 'emp-3',
    date: '2026-09-02',
    type: 'given',
    amount: 3000,
    note: 'Family emergency advance',
  },
  {
    id: 'adv-4',
    employeeId: 'emp-4',
    date: '2026-09-05',
    type: 'given',
    amount: 1500,
    note: 'Festival travel advance',
  },
  {
    id: 'adv-5',
    employeeId: 'emp-5',
    date: '2026-09-03',
    type: 'given',
    amount: 5000,
    note: 'Vehicle repair advance on joining',
  },
];

export const INITIAL_ADJUSTMENTS: MonthlyAdjustment[] = [
  {
    id: 'adj-1',
    employeeId: 'emp-1',
    month: '2026-09',
    type: 'advance_deduction',
    amount: 2000,
    description: 'Scheduled monthly advance repayment (Remaining: ₹2,000)',
    date: '2026-09-24',
  },
  {
    id: 'adj-2',
    employeeId: 'emp-1',
    month: '2026-09',
    type: 'bonus',
    amount: 1500,
    description: 'Supervisor performance bonus for Q3 rush',
    date: '2026-09-22',
  },
  {
    id: 'adj-3',
    employeeId: 'emp-3',
    month: '2026-09',
    type: 'advance_deduction',
    amount: 1000,
    description: 'September advance installment (Remaining: ₹2,000)',
    date: '2026-09-24',
  },
  {
    id: 'adj-4',
    employeeId: 'emp-5',
    month: '2026-09',
    type: 'advance_deduction',
    amount: 1000,
    description: 'First installment of vehicle loan advance',
    date: '2026-09-24',
  },
  {
    id: 'adj-5',
    employeeId: 'emp-2',
    month: '2026-09',
    type: 'incentive',
    amount: 1000,
    description: 'Zero-defect assembly quality incentive',
    date: '2026-09-20',
  },
];

export const storage = {
  getEmployees(): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data === null) return INITIAL_EMPLOYEES;
      const parsed: Employee[] = JSON.parse(data);
      return parsed.map((e) => {
        if (e.baseSalary && e.baseSalary < 5000) {
          return {
            ...e,
            baseSalary: e.baseSalary * 10,
            otHourlyRate: e.otHourlyRate ? e.otHourlyRate * 10 : 0,
            advanceBalance: e.advanceBalance ? e.advanceBalance * 10 : 0,
            defaultAllowance: e.defaultAllowance ? e.defaultAllowance * 10 : 0,
            defaultDeduction: e.defaultDeduction ? e.defaultDeduction * 10 : 0,
          };
        }
        return e;
      });
    } catch {
      return INITIAL_EMPLOYEES;
    }
  },

  setEmployees(employees: Employee[]) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  getAttendance(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (data === null) return [];
      const records: AttendanceRecord[] = JSON.parse(data);
      if (records.some(r => r.id.startsWith('att-emp-'))) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
        return [];
      }
      return records.map((r) => ({ ...r, overtimeHours: 0 }));
    } catch {
      return [];
    }
  },

  setAttendance(records: AttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getAdvances(): AdvanceTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADVANCES);
      if (data === null) return INITIAL_ADVANCE_TRANSACTIONS;
      const parsed: AdvanceTransaction[] = JSON.parse(data);
      return parsed.map((a) => (a.amount < 1000 ? { ...a, amount: a.amount * 10 } : a));
    } catch {
      return INITIAL_ADVANCE_TRANSACTIONS;
    }
  },

  setAdvances(advances: AdvanceTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify(advances));
  },

  getAdjustments(): MonthlyAdjustment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
      if (data === null) return INITIAL_ADJUSTMENTS;
      const parsed: MonthlyAdjustment[] = JSON.parse(data);
      return parsed.map((a) => (a.amount < 1000 ? { ...a, amount: a.amount * 10 } : a));
    } catch {
      return INITIAL_ADJUSTMENTS;
    }
  },

  setAdjustments(adjustments: MonthlyAdjustment[]) {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  },

  getPayments(): Record<string, { status: 'pending' | 'approved' | 'paid'; paidAt?: string; paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi'; paymentRef?: string }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setPayments(payments: Record<string, { status: 'pending' | 'approved' | 'paid'; paidAt?: string; paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi'; paymentRef?: string }>) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getSettings(): CompanySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      if (!parsed.currency || parsed.currency === '$') {
        parsed.currency = '₹';
      }
      return { ...DEFAULT_SETTINGS, ...parsed, currency: '₹' };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  setSettings(settings: CompanySettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getAccounting(): AccountingTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTING);
      if (data === null) return [];
      const txs: AccountingTransaction[] = JSON.parse(data);
      if (txs.some(t => t.id === 'acc-1' || t.id === 'acc-2')) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTING, JSON.stringify([]));
        return [];
      }
      return txs;
    } catch {
      return [];
    }
  },

  setAccounting(transactions: AccountingTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTING, JSON.stringify(transactions));
  },

  getMasterData(): MasterDataConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTER_DATA);
      if (!data) return DEFAULT_MASTER_DATA;
      return JSON.parse(data);
    } catch {
      return DEFAULT_MASTER_DATA;
    }
  },

  setMasterData(config: MasterDataConfig) {
    localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(config));
  },

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTING, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(DEFAULT_MASTER_DATA));
  },

  exportAllData(): string {
    return JSON.stringify({
      employees: this.getEmployees(),
      attendance: this.getAttendance(),
      advances: this.getAdvances(),
      adjustments: this.getAdjustments(),
      payments: this.getPayments(),
      settings: this.getSettings(),
      accounting: this.getAccounting(),
      masterData: this.getMasterData(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.employees) this.setEmployees(data.employees);
      if (data.attendance) this.setAttendance(data.attendance);
      if (data.advances) this.setAdvances(data.advances);
      if (data.adjustments) this.setAdjustments(data.adjustments);
      if (data.payments) this.setPayments(data.payments);
      if (data.settings) this.setSettings(data.settings);
      if (data.accounting) this.setAccounting(data.accounting);
      if (data.masterData) this.setMasterData(data.masterData);
      return true;
    } catch {
      return false;
    }
  },
};
