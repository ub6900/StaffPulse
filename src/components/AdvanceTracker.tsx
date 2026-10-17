import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  User,
  Search,
  CheckCircle,
} from 'lucide-react';
import { AdvanceTransaction, CompanySettings, Employee } from '../types';
import { formatCurrency, formatDateDDMMYYYY } from '../utils/calculations';

interface AdvanceTrackerProps {
  employees: Employee[];
  advanceTransactions: AdvanceTransaction[];
  onDisburseAdvance: (employeeId: string, amount: number, note: string) => void;
  settings: CompanySettings;
}

export const AdvanceTracker: React.FC<AdvanceTrackerProps> = ({
  employees,
  advanceTransactions,
  onDisburseAdvance,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'given' | 'deducted'>('all');

  const activeEmployees = employees.filter((e) => e.status === 'active');

  // Total company advance exposure
  const totalOutstanding = activeEmployees.reduce((acc, e) => acc + (e.advanceBalance || 0), 0);
  const totalGivenAllTime = advanceTransactions
    .filter((t) => t.type === 'given')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalRecoveredAllTime = advanceTransactions
    .filter((t) => t.type === 'deducted')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt) || amt <= 0 || !selectedEmpId) return;

    onDisburseAdvance(selectedEmpId, amt, note.trim() || 'Staff cash advance');
    setIsDisburseModalOpen(false);
    setAmount('');
    setNote('');
  };

  // Filtered transactions
  const filteredTransactions = advanceTransactions
    .filter((t) => {
      const emp = employees.find((e) => e.id === t.employeeId);
      const matchesSearch =
        !searchQuery ||
        emp?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.note.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Employee Advance & Loan Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track salary advances disbursed, monthly recovery installments, and current company balance.
            </p>
          </div>

          <button
            onClick={() => {
              if (activeEmployees.length > 0) {
                setSelectedEmpId(activeEmployees[0].id);
              }
              setIsDisburseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Disburse New Advance</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg">
            <span className="block text-xs font-medium text-amber-800">
              Current Outstanding Balance
            </span>
            <span className="text-2xl font-bold font-mono text-amber-900">
              {formatCurrency(totalOutstanding, settings.currency)}
            </span>
            <span className="text-[11px] text-amber-700 block mt-0.5">
              Owed by employees across company
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="block text-xs font-medium text-slate-600">
              Total Advances Given (Recorded)
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {formatCurrency(totalGivenAllTime, settings.currency)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Historical disbursements
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <span className="block text-xs font-medium text-emerald-800">
              Total Recovered via Payroll
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-800">
              {formatCurrency(totalRecoveredAllTime, settings.currency)}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">
              Deducted at month ends
            </span>
          </div>
        </div>
      </div>

      {/* Outstanding Balance Breakdown by Employee */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Outstanding Advance Balances by Employee
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activeEmployees.map((emp) => {
            const hasAdvance = emp.advanceBalance > 0;
            return (
              <div
                key={emp.id}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  hasAdvance
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900">{emp.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {emp.code} · {emp.department}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div
                    className={`font-bold ${
                      hasAdvance ? 'text-amber-800 text-sm' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(emp.advanceBalance, settings.currency)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Base: {formatCurrency(emp.baseSalary, settings.currency)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Advance Transaction Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Audit record of all disbursements and monthly payroll deduction recoveries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="all">All Transactions</option>
              <option value="given">Advances Disbursed (+)</option>
              <option value="deducted">Payroll Deductions (-)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No advance transactions match criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const emp = employees.find((e) => e.id === t.employeeId);
                  const isGiven = t.type === 'given';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {formatDateDDMMYYYY(t.date)}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        {emp ? (
                          <div>
                            <span className="font-semibold">{emp.name}</span>
                            <span className="ml-1.5 text-[11px] text-slate-500 font-mono">
                              ({emp.code})
                            </span>
                          </div>
                        ) : (
                          'Unknown Employee'
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {isGiven ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            <ArrowUpRight className="w-3 h-3 text-amber-700" />
                            <span>Disbursed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            <ArrowDownRight className="w-3 h-3 text-emerald-700" />
                            <span>Deducted</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {t.note}
                        {t.payrollMonth && (
                          <span className="ml-1 text-[10px] text-indigo-600 font-medium">
                            [Payroll: {t.payrollMonth}]
                          </span>
                        )}
                      </td>

                      <td
                        className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                          isGiven ? 'text-amber-800' : 'text-emerald-800'
                        }`}
                      >
                        {isGiven ? '+' : '-'}
                        {formatCurrency(t.amount, settings.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Modal */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Disburse Employee Advance
                </h3>
                <p className="text-xs text-slate-500">
                  Record advance money given to an employee.
                </p>
              </div>
              <button
                onClick={() => setIsDisburseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.code}) — Current Bal:{' '}
                      {formatCurrency(emp.advanceBalance, settings.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Advance Amount ({settings.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 300"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono text-sm font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Purpose / Repayment Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical emergency advance, deduct in 2 installments"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
