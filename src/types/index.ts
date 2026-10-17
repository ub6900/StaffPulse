export type AttendanceStatus = 'full' | 'half' | 'double' | 'absent' | 'paid_leave';

export interface Employee {
  id: string;
  code: string;
  name: string;
  department: string;
  role: string;
  phone: string;
  email: string;
  joinDate: string;
  baseSalary: number; // Monthly base salary
  standardHoursPerDay: number; // Typically 8
  otHourlyRate?: number; // Deprecated - overtime payment removed
  advanceBalance: number; // Current outstanding advance balance
  defaultAllowance: number; // Recurring monthly allowance (holiday allowance)
  defaultDeduction: number; // Recurring monthly deduction (tax/social)
  status: 'active' | 'inactive';
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  overtimeHours?: number;
  note?: string;
}

export type AdjustmentType =
  | 'bonus'
  | 'incentive'
  | 'advance_deduction'
  | 'penalty'
  | 'reimbursement'
  | 'other_deduction';

export interface MonthlyAdjustment {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  type: AdjustmentType;
  amount: number;
  description: string;
  date: string;
}

export interface AdvanceTransaction {
  id: string;
  employeeId: string;
  date: string;
  type: 'given' | 'deducted';
  amount: number;
  note: string;
  payrollMonth?: string; // YYYY-MM if recorded during payroll processing
}

export interface PayrollItem {
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  totalDaysInMonth: number;
  standardWorkingDays: number;
  fullDays: number;
  halfDays: number;
  doubleDays: number;
  absentDays: number;
  unrecordedDays: number;
  payableDays: number; // full + (half * 0.5) + (double * 2.0)
  dailyRate: number;
  earnedBaseSalary: number;
  totalOtHours?: number;
  otHourlyRate?: number;
  otPay?: number;
  defaultAllowance: number;
  bonusAdjustments: number;
  reimbursements: number;
  grossSalary: number;
  advanceDeduction: number;
  defaultDeduction: number;
  penaltyAdjustments: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'pending' | 'approved' | 'paid';
  paidAt?: string;
  paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
  paymentRef?: string;
}

export interface CompanySettings {
  companyName: string;
  employerAddress: string;
  employerTaxId: string;
  currency: string;
  workingDaysMode: 'standard_26' | 'standard_30' | 'calendar_days' | 'exclude_sundays';
  standardShiftHours: number;
  defaultOtMultiplier?: number;
  autoMarkAbsent?: boolean; // When true, unrecorded roll-call entries are automatically marked/treated as Absent (0.0)
  themeStyle?: 'slate' | 'emerald_indigo' | 'warm_amber' | 'corporate_blue';
  themeColor?: string;
  tableDensity?: string;
}

export type AccountingType = 'credit' | 'debit';

export interface AccountingTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: AccountingType;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  reference?: string;
}

export interface MasterAttendanceType {
  id: string;
  code: string;
  label: string;
  value: number; // e.g. 1.0, 0.5, 0.0
}

export interface MasterExpenseCategory {
  id: string;
  name: string;
  type: AccountingType;
}

export interface MasterPaymentMethod {
  id: string;
  name: string;
  label: string;
}

export interface MasterDataConfig {
  attendanceTypes: MasterAttendanceType[];
  expenseCategories: MasterExpenseCategory[];
  paymentMethods: MasterPaymentMethod[];
}

