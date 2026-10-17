import React, { useState } from 'react';
import {
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Share2,
  Sliders,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  CheckCheck,
  Search,
} from 'lucide-react';
import {
  CompanySettings,
  Employee,
  AttendanceRecord,
  MonthlyAdjustment,
  PayrollItem,
} from '../types';
import {
  calculatePayrollItem,
  formatCurrency,
  getMonthLabel,
  formatDateDDMMYYYY,
} from '../utils/calculations';

interface PayrollSummaryProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  adjustments: MonthlyAdjustment[];
  onAddAdjustment: (adj: MonthlyAdjustment) => void;
  onDeleteAdjustment: (id: string) => void;
  payments: Record<
    string,
    {
      status: 'pending' | 'approved' | 'paid';
      paidAt?: string;
      paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
      paymentRef?: string;
    }
  >;
  onUpdatePayment: (
    empId: string,
    data: {
      status: 'pending' | 'approved' | 'paid';
      paidAt?: string;
      paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
      paymentRef?: string;
    },
  ) => void;
  onBatchUpdatePayments: (
    updates: Record<
      string,
      {
        status: 'pending' | 'approved' | 'paid';
        paidAt?: string;
        paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
        paymentRef?: string;
      }
    >,
  ) => void;
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
  onViewPayslip: (payrollItem: PayrollItem, employee: Employee) => void;
  onOpenAdvanceModal: (employee: Employee) => void;
}

export const PayrollSummary: React.FC<PayrollSummaryProps> = ({
  employees,
  attendanceRecords,
  adjustments,
  onAddAdjustment,
  onDeleteAdjustment,
  payments,
  onUpdatePayment,
  onBatchUpdatePayments,
  settings,
  selectedMonth,
  onViewPayslip,
  onOpenAdvanceModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal for adding a monthly adjustment to an employee
  const [adjustingEmp, setAdjustingEmp] = useState<Employee | null>(null);
  const [adjType, setAdjType] = useState<MonthlyAdjustment['type']>('bonus');
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjDesc, setAdjDesc] = useState<string>('');

  // Payment confirmation modal
  const [payingEmp, setPayingEmp] = useState<{ emp: Employee; item: PayrollItem } | null>(null);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'cash' | 'cheque' | 'upi'>('bank_transfer');
  const [payRef, setPayRef] = useState('');

  const activeEmployees = employees.filter((e) => e.status === 'active');
  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  // Calculate payroll items for all active employees
  const payrollItems: { employee: Employee; item: PayrollItem }[] = activeEmployees.map((emp) => {
    const stored = payments[`${emp.id}_${selectedMonth}`];
    const item = calculatePayrollItem(
      emp,
      selectedMonth,
      attendanceRecords,
      adjustments,
      settings,
      stored,
    );
    return { employee: emp, item };
  });

  // Aggregated totals
  let totalGross = 0;
  let totalNet = 0;
  let totalAdvanceDeductions = 0;
  let totalOutstandingAdvances = 0;
  let totalPaidCount = 0;

  payrollItems.forEach(({ employee, item }) => {
    totalGross += item.grossSalary;
    totalNet += item.netSalary;
    totalAdvanceDeductions += item.advanceDeduction;
    totalOutstandingAdvances += employee.advanceBalance;
    if (item.paymentStatus === 'paid') totalPaidCount++;
  });

  // Filtered rows
  const filteredList = payrollItems.filter(({ employee, item }) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || employee.department === selectedDept;

    const matchesStatus =
      statusFilter === 'ALL' || item.paymentStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Handle submit adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingEmp) return;
    const amt = parseFloat(adjAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;

    const newAdj: MonthlyAdjustment = {
      id: `adj-${Date.now()}`,
      employeeId: adjustingEmp.id,
      month: selectedMonth,
      type: adjType,
      amount: amt,
      description: adjDesc.trim() || `${adjType.replace('_', ' ')} adjustment`,
      date: new Date().toISOString().split('T')[0],
    };

    onAddAdjustment(newAdj);
    setAdjAmount('');
    setAdjDesc('');
  };

  // Quick batch approve
  const handleBatchApproveAll = () => {
    const updates: Record<
      string,
      {
        status: 'pending' | 'approved' | 'paid';
        paidAt?: string;
        paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
        paymentRef?: string;
      }
    > = {};

    payrollItems.forEach(({ employee, item }) => {
      if (item.paymentStatus === 'pending') {
        updates[`${employee.id}_${selectedMonth}`] = {
          status: 'approved',
          paidAt: undefined,
          paymentMethod: 'bank_transfer',
        };
      }
    });

    onBatchUpdatePayments(updates);
  };

  // Quick batch mark paid
  const handleBatchMarkAllPaid = () => {
    if (!confirm('Mark all approved and pending payroll entries as Paid via Bank Transfer?')) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updates: Record<
      string,
      {
        status: 'pending' | 'approved' | 'paid';
        paidAt?: string;
        paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
        paymentRef?: string;
      }
    > = {};

    payrollItems.forEach(({ employee, item }) => {
      if (item.paymentStatus !== 'paid') {
        updates[`${employee.id}_${selectedMonth}`] = {
          status: 'paid',
          paidAt: nowStr,
          paymentMethod: 'bank_transfer',
          paymentRef: `BATCH-TRANSFER-${selectedMonth}`,
        };
      }
    });

    onBatchUpdatePayments(updates);
  };

  // Export Payroll to CSV
  const handleExportPayrollCSV = () => {
    const headers = [
      'Emp Code',
      'Employee Name',
      'Department',
      'Base Monthly Salary',
      'Standard Working Days',
      'Payable Days',
      'Earned Base Pay',
      'Allowances & Bonuses',
      'Gross Salary',
      'Advance Deducted',
      'Other Deductions',
      'Total Deductions',
      'Net Payable Salary',
      'Payment Status',
      'Payment Mode',
      'Reference',
    ];

    const rows = payrollItems.map(({ employee, item }) => [
      `"${employee.code}"`,
      `"${employee.name}"`,
      `"${employee.department}"`,
      item.baseSalary,
      item.standardWorkingDays,
      item.payableDays,
      item.earnedBaseSalary,
      item.defaultAllowance + item.bonusAdjustments + item.reimbursements,
      item.grossSalary,
      item.advanceDeduction,
      item.defaultDeduction + item.penaltyAdjustments + item.otherDeductions,
      item.totalDeductions,
      item.netSalary,
      item.paymentStatus.toUpperCase(),
      item.paymentMethod || '-',
      item.paymentRef || '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Monthly_Payroll_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Month Total Metrics */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-bold text-slate-900">
                Monthly Payroll Calculation: {getMonthLabel(selectedMonth)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated compilation based on daily roll-call attendance (Full, Half, Double, Absent), advance deductions, and adjustments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleBatchApproveAll}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Approve All Pending
            </button>

            <button
              onClick={handleBatchMarkAllPaid}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Paid</span>
            </button>

            <button
              onClick={handleExportPayrollCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Payroll CSV</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="block text-xs font-medium text-slate-500">
              Total Gross Payroll
            </span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {formatCurrency(totalGross, settings.currency)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Before deductions
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100">
            <span className="block text-xs font-medium text-emerald-800">
              Total Net Payout
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700">
              {formatCurrency(totalNet, settings.currency)}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">
              Payable to employees
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-100">
            <span className="block text-xs font-medium text-amber-800">
              Advances Recovered
            </span>
            <span className="text-xl font-bold font-mono text-amber-700">
              {formatCurrency(totalAdvanceDeductions, settings.currency)}
            </span>
            <span className="text-[11px] text-amber-600 block mt-0.5">
              Deducted this month
            </span>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100">
            <span className="block text-xs font-medium text-indigo-800">
              Disbursement Status
            </span>
            <span className="text-xl font-bold font-mono text-indigo-900">
              {totalPaidCount} / {payrollItems.length}
            </span>
            <span className="text-[11px] text-indigo-600 block mt-0.5">
              Employees paid
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name, ID or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Employee</th>
                <th className="py-3 px-3 text-center">Days Worked</th>
                <th className="py-3 px-3 text-right">Base Earned</th>
                <th className="py-3 px-3 text-right">Allowances</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Gross</th>
                <th className="py-3 px-3 text-right text-amber-700">Advance Ded.</th>
                <th className="py-3 px-3 text-right text-rose-700">Other Ded.</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-800 bg-emerald-50/50">
                  Net Salary
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredList.map(({ employee, item }) => {
                const empAdjustments = adjustments.filter(
                  (a) => a.employeeId === employee.id && a.month === selectedMonth,
                );

                return (
                  <tr
                    key={employee.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Employee info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                          {employee.code.replace('EMP-', '')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {employee.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            <span>{employee.code}</span>
                            <span className="mx-1" aria-hidden="true">·</span>
                            <span>{employee.department}</span>
                            <span className="mx-1" aria-hidden="true">·</span>
                            <span className="font-mono">
                              {formatCurrency(employee.baseSalary, settings.currency)}/mo
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Days Worked Breakdown */}
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="text-slate-900 font-bold">
                        {item.payableDays.toFixed(1)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          / {item.standardWorkingDays}d
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.fullDays}F · {item.halfDays}H · {item.doubleDays}D · {item.absentDays}A
                      </div>
                    </td>

                    {/* Base Earned Pay */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(item.earnedBaseSalary, settings.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        @{formatCurrency(item.dailyRate, settings.currency)}/d
                      </div>
                    </td>

                    {/* Allowances & Bonuses */}
                    <td className="py-3 px-3 text-right font-mono">
                      {item.defaultAllowance + item.bonusAdjustments + item.reimbursements > 0 ? (
                        <>
                          <div className="font-semibold text-indigo-700">
                            +{formatCurrency(
                              item.defaultAllowance + item.bonusAdjustments + item.reimbursements,
                              settings.currency,
                            )}
                          </div>
                          {item.bonusAdjustments > 0 && (
                            <div className="text-[10px] text-indigo-500">
                              (incl. {formatCurrency(item.bonusAdjustments, settings.currency)} adj)
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Gross Salary */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatCurrency(item.grossSalary, settings.currency)}
                    </td>

                    {/* Advance Deductions */}
                    <td className="py-3 px-3 text-right font-mono">
                      {item.advanceDeduction > 0 ? (
                        <div>
                          <span className="font-semibold text-amber-700">
                            -{formatCurrency(item.advanceDeduction, settings.currency)}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Bal: {formatCurrency(Math.max(0, employee.advanceBalance - (item.paymentStatus === 'paid' ? 0 : item.advanceDeduction)), settings.currency)}
                          </div>
                        </div>
                      ) : employee.advanceBalance > 0 ? (
                        <button
                          onClick={() => {
                            setAdjustingEmp(employee);
                            setAdjType('advance_deduction');
                            setAdjAmount(Math.min(200, employee.advanceBalance).toString());
                            setAdjDesc(`Advance recovery (${selectedMonth})`);
                          }}
                          className="text-[10px] text-amber-600 hover:text-amber-800 underline cursor-pointer"
                        >
                          Deduct (Bal {formatCurrency(employee.advanceBalance, settings.currency)})
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Other Deductions */}
                    <td className="py-3 px-3 text-right font-mono">
                      {item.defaultDeduction + item.penaltyAdjustments + item.otherDeductions > 0 ? (
                        <span className="text-rose-700 font-semibold">
                          -{formatCurrency(
                            item.defaultDeduction + item.penaltyAdjustments + item.otherDeductions,
                            settings.currency,
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Net Payable Salary */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-800 bg-emerald-50/60">
                      {formatCurrency(item.netSalary, settings.currency)}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {item.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : item.paymentStatus === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Adjustments button */}
                        <button
                          onClick={() => {
                            setAdjustingEmp(employee);
                            setAdjType('bonus');
                            setAdjAmount('');
                            setAdjDesc('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Add / View Adjustments"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        {/* Share Payslip */}
                        <button
                          onClick={() => onViewPayslip(item, employee)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Share Payslip PDF"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Mark Paid action */}
                        {item.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => {
                              setPayingEmp({ emp: employee, item });
                              setPayMethod('bank_transfer');
                              setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onUpdatePayment(employee.id, { status: 'pending' })
                            }
                            className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Reset to Pending"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustments Modal for Selected Employee */}
      {adjustingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Monthly Adjustments: {adjustingEmp.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {adjustingEmp.code} · Period: {getMonthLabel(selectedMonth)}
                </p>
              </div>
              <button
                onClick={() => setAdjustingEmp(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Advance Status Alert if exists */}
            {adjustingEmp.advanceBalance > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-amber-800">
                    Outstanding Advance Balance:
                  </span>{' '}
                  <span className="font-mono font-bold text-amber-900">
                    {formatCurrency(adjustingEmp.advanceBalance, settings.currency)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdjType('advance_deduction');
                    setAdjAmount(Math.min(200, adjustingEmp.advanceBalance).toString());
                    setAdjDesc(`Advance recovery installment`);
                  }}
                  className="px-2 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded font-medium cursor-pointer"
                >
                  Quick Deduct
                </button>
              </div>
            )}

            {/* Existing Adjustments for this month */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Current Adjustments for {selectedMonth}
              </h4>
              {(() => {
                const currentEmpAdjs = adjustments.filter(
                  (a) => a.employeeId === adjustingEmp.id && a.month === selectedMonth,
                );
                if (currentEmpAdjs.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic py-2">
                      No adjustments logged for this month yet.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentEmpAdjs.map((adj) => {
                      const isPositive = ['bonus', 'incentive', 'reimbursement'].includes(adj.type);
                      return (
                        <div
                          key={adj.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {adj.description}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Type: {adj.type.replace('_', ' ')} · Date: {formatDateDDMMYYYY(adj.date)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono font-bold ${
                                isPositive ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isPositive ? '+' : '-'}
                              {formatCurrency(adj.amount, settings.currency)}
                            </span>
                            <button
                              onClick={() => onDeleteAdjustment(adj.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete adjustment"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Add New Adjustment Form */}
            <form onSubmit={handleSaveAdjustment} className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Add New Adjustment
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as MonthlyAdjustment['type'])}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="bonus">Bonus (+ Earnings)</option>
                    <option value="incentive">Quality / Productivity Incentive (+)</option>
                    <option value="reimbursement">Expense Reimbursement (+)</option>
                    <option value="advance_deduction">Advance Recovery (- Deduction)</option>
                    <option value="penalty">Penalty / Late Fine (- Deduction)</option>
                    <option value="other_deduction">Other Deduction (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Amount ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 150.00"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 safety incentive, or advance installment #2..."
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingEmp(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  Add Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {payingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Disburse Salary Payment
                </h3>
                <p className="text-xs text-slate-500">
                  {payingEmp.emp.name} ({payingEmp.emp.code}) · {getMonthLabel(selectedMonth)}
                </p>
              </div>
              <button
                onClick={() => setPayingEmp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <span className="block text-xs text-emerald-700 font-medium">Net Payout Amount</span>
              <span className="text-2xl font-bold font-mono text-emerald-800">
                {formatCurrency(payingEmp.item.netSalary, settings.currency)}
              </span>
              <div className="text-[11px] text-emerald-600 mt-1">
                Gross: {formatCurrency(payingEmp.item.grossSalary, settings.currency)} · Deductions: {formatCurrency(payingEmp.item.totalDeductions, settings.currency)}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                >
                  <option value="bank_transfer">Bank Direct Transfer (NEFT/ACH/Wire)</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="cheque">Company Cheque</option>
                  <option value="upi">UPI / Instant Digital Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Transaction / Cheque Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-892401 or Cheque #4928"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingEmp(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdatePayment(payingEmp.emp.id, {
                    status: 'paid',
                    paidAt: new Date().toISOString().split('T')[0],
                    paymentMethod: payMethod,
                    paymentRef: payRef,
                  });
                  setPayingEmp(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
