import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Phone,
  Mail,
  Calendar,
  Clock,
  History,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
  Briefcase,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { AdvanceTransaction, CompanySettings, Employee } from '../types';
import { formatCurrency, formatDateDDMMYYYY } from '../utils/calculations';

interface EmployeeDirectoryProps {
  employees: Employee[];
  onOpenAddEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  advanceTransactions: AdvanceTransaction[];
  onDisburseAdvance: (employeeId: string, amount: number, note: string) => void;
  settings: CompanySettings;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  onOpenAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  advanceTransactions,
  onDisburseAdvance,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Advance disbursement modal state
  const [advanceEmp, setAdvanceEmp] = useState<Employee | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');

  // Ledger history modal state
  const [historyEmp, setHistoryEmp] = useState<Employee | null>(null);

  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmp) return;
    const amt = parseFloat(advanceAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;

    onDisburseAdvance(advanceEmp.id, amt, advanceNote.trim() || 'Advance disbursed');
    setAdvanceEmp(null);
    setAdvanceAmount('');
    setAdvanceNote('');
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-5">
      {/* Top action header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Employee Directory & Wage Profiles ({employees.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add new workers, edit monthly base salary, manage employee advances, or remove records.
          </p>
        </div>

        <button
          onClick={onOpenAddEmployee}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New Employee</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee code, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
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

          <button
            onClick={onOpenAddEmployee}
            className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Worker</span>
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-right">Base Salary</th>
                <th className="py-3 px-3 text-right">Advance Balance</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right min-w-[200px]">Actions (Edit / Delete)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No employees match filters</p>
                    <button
                      onClick={onOpenAddEmployee}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                    >
                      + Add New Employee
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                          {emp.code.replace('EMP-', '')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              {emp.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => onEditEmployee(emp)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer transition-colors"
                              title={`Edit ${emp.name}`}
                            >
                              <Edit2 className="w-3 h-3 text-indigo-600" />
                              <span>Edit</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {emp.code} · Joined {formatDateDDMMYYYY(emp.joinDate)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dept */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800">{emp.department}</div>
                    </td>

                    {/* Base Salary */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(emp.baseSalary, settings.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Per Day: {formatCurrency(emp.baseSalary / 26, settings.currency)}
                      </div>
                    </td>

                    {/* Advance Balance */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      {emp.advanceBalance > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {formatCurrency(emp.advanceBalance, settings.currency)}
                          </span>
                          <button
                            onClick={() => setHistoryEmp(emp)}
                            className="text-[10px] text-slate-500 hover:text-indigo-600 underline mt-0.5 cursor-pointer"
                          >
                            View Ledger
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">{formatCurrency(0, settings.currency)}</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="truncate max-w-[130px]">{emp.phone || '-'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {emp.email || '-'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          emp.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions: EDIT & DELETE clearly exposed */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Disburse Advance Button */}
                        <button
                          onClick={() => {
                            setAdvanceEmp(emp);
                            setAdvanceAmount('');
                            setAdvanceNote('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                          title="Give Advance Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                          <span>Advance</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          title="Edit Employee Salary, Role, Advance or Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete employee "${emp.name}" (${emp.code})? This will remove all their records.`)) {
                              onDeleteEmployee(emp.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Advance Modal */}
      {advanceEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Disburse Advance Payment
                </h3>
                <p className="text-xs text-slate-500">
                  {advanceEmp.name} ({advanceEmp.code})
                </p>
              </div>
              <button
                onClick={() => setAdvanceEmp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-amber-800 font-medium">Current Advance Balance:</span>
              <span className="font-mono font-bold text-amber-900 text-sm">
                {formatCurrency(advanceEmp.advanceBalance, settings.currency)}
              </span>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Advance Amount to Disburse ({settings.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 200"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono text-sm font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason / Repayment Agreement
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festival advance, deducted ₹2,000/mo"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceEmp(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold cursor-pointer"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Employee Advance Ledger Modal */}
      {historyEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Advance Ledger: {historyEmp.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {historyEmp.code} · Outstanding Balance:{' '}
                  <strong className="text-amber-800 font-mono">
                    {formatCurrency(historyEmp.advanceBalance, settings.currency)}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryEmp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {(() => {
                const empTxns = advanceTransactions.filter(
                  (t) => t.employeeId === historyEmp.id,
                );
                if (empTxns.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No advance transactions recorded for this employee.
                    </p>
                  );
                }

                return empTxns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {txn.type === 'given' ? 'Advance Disbursed' : 'Payroll Deduction'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDateDDMMYYYY(txn.date)} {txn.note && `· ${txn.note}`}
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        txn.type === 'given' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {txn.type === 'given' ? '+' : '-'}
                      {formatCurrency(txn.amount, settings.currency)}
                    </span>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryEmp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
