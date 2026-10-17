import React, { useState, useEffect } from 'react';
import { X, UserPlus, Edit2, Plus, CreditCard, Check, AlertCircle } from 'lucide-react';
import { CompanySettings, Employee } from '../types';
import { formatCurrency, formatDateDDMMYYYY } from '../utils/calculations';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEmployee: Employee | null;
  onSave: (employee: Employee, initialAdvance?: { amount: number; note: string }) => void;
  settings: CompanySettings;
  existingEmployees: Employee[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  editingEmployee,
  onSave,
  settings,
  existingEmployees,
}) => {
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDept, setFormDept] = useState('Production');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJoinDate, setFormJoinDate] = useState('2026-09-01');
  const [formBaseSalary, setFormBaseSalary] = useState('25000');
  const [formAllowance, setFormAllowance] = useState('0');
  const [formDeduction, setFormDeduction] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  // Add to Advance state
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [addAdvanceAmount, setAddAdvanceAmount] = useState('');
  const [addAdvanceNote, setAddAdvanceNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setShowAddAdvance(false);
    setAddAdvanceAmount('');
    setAddAdvanceNote('');

    if (editingEmployee) {
      setFormName(editingEmployee.name);
      setFormCode(editingEmployee.code);
      setFormDept(editingEmployee.department || 'Production');
      setFormPhone(editingEmployee.phone || '');
      setFormEmail(editingEmployee.email || '');
      setFormJoinDate(editingEmployee.joinDate || new Date().toISOString().split('T')[0]);
      setFormBaseSalary(editingEmployee.baseSalary.toString());
      setFormAllowance((editingEmployee.defaultAllowance || 0).toString());
      setFormDeduction((editingEmployee.defaultDeduction || 0).toString());
      setFormNotes(editingEmployee.notes || '');
    } else {
      // Auto-generate code
      const maxNum = existingEmployees.reduce((max, e) => {
        const match = e.code.match(/EMP-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextCode = `EMP-${(maxNum + 1).toString().padStart(2, '0')}`;

      setFormName('');
      setFormCode(nextCode);
      setFormDept('Production');
      setFormPhone('');
      setFormEmail('');
      setFormJoinDate(new Date().toISOString().split('T')[0]);
      setFormBaseSalary('25000');
      setFormAllowance('0');
      setFormDeduction('0');
      setFormNotes('');
    }
  }, [isOpen, editingEmployee, existingEmployees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseSal = parseFloat(formBaseSalary) || 0;
    const addAmt = parseFloat(addAdvanceAmount) || 0;
    const currentAdvance = editingEmployee ? editingEmployee.advanceBalance : 0;
    const newAdvanceBalance = currentAdvance + (addAmt > 0 ? addAmt : 0);

    const empData: Employee = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      code: formCode.trim() || 'EMP-00',
      name: formName.trim(),
      department: formDept.trim() || 'General',
      role: editingEmployee?.role || formDept.trim() || 'Staff',
      phone: formPhone.trim(),
      email: formEmail.trim(),
      joinDate: formJoinDate,
      baseSalary: baseSal,
      standardHoursPerDay: 8,
      otHourlyRate: 0,
      advanceBalance: newAdvanceBalance,
      defaultAllowance: parseFloat(formAllowance) || 0,
      defaultDeduction: parseFloat(formDeduction) || 0,
      status: editingEmployee ? editingEmployee.status : 'active',
      notes: formNotes.trim(),
    };

    onSave(
      empData,
      addAmt > 0
        ? { amount: addAmt, note: addAdvanceNote.trim() || 'Advance disbursed' }
        : undefined,
    );

    onClose();
  };

  const currentAdvanceBalance = editingEmployee ? editingEmployee.advanceBalance : 0;
  const addedAdvanceAmt = parseFloat(addAdvanceAmount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            {editingEmployee ? (
              <Edit2 className="w-5 h-5 text-indigo-600" />
            ) : (
              <UserPlus className="w-5 h-5 text-indigo-600" />
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingEmployee ? `Edit Employee: ${editingEmployee.name}` : 'Create New Employee'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingEmployee
                  ? 'Update employee salary, advance, and details'
                  : 'Add a new worker to attendance roll call and payroll roster'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Code and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Employee Code / ID *
              </label>
              <input
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. EMP-07"
                className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-white text-slate-900 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Row 2: Department (Role / Designation label and text box removed) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Department
            </label>
            <input
              type="text"
              value={formDept}
              onChange={(e) => setFormDept(e.target.value)}
              placeholder="e.g. Production, Workshop, Maintenance, Warehouse"
              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-900"
            />
          </div>

          {/* Row 3: Salary Only (Daily shift hours and overtime rate removed) */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <label className="block text-slate-700 font-semibold mb-1">
              Base Monthly Salary ({settings.currency}) *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={formBaseSalary}
              onChange={(e) => setFormBaseSalary(e.target.value)}
              placeholder="25000"
              className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-white font-bold text-slate-900 text-sm"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Daily Rate: {formatCurrency(parseFloat(formBaseSalary) / 26 || 0, settings.currency)}/day (26-day basis)
            </span>
          </div>

          {/* Row 4: Advance Section with "+ Add to Advance" button */}
          <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  Employee Advance
                </span>
                <div className="text-[11px] text-amber-800 font-mono mt-0.5">
                  Current Balance:{' '}
                  <strong className="text-amber-950 font-bold">
                    {formatCurrency(currentAdvanceBalance, settings.currency)}
                  </strong>
                  {addedAdvanceAmt > 0 && (
                    <span className="text-emerald-700 font-bold ml-1.5">
                      (+{formatCurrency(addedAdvanceAmt, settings.currency)} pending addition)
                    </span>
                  )}
                </div>
              </div>

              {!showAddAdvance && (
                <button
                  type="button"
                  onClick={() => setShowAddAdvance(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Advance</span>
                </button>
              )}
            </div>

            {/* Expandable Add to Advance Input Form */}
            {showAddAdvance && (
              <div className="pt-2 border-t border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-amber-900">Enter Advance Details:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAdvance(false);
                      setAddAdvanceAmount('');
                      setAddAdvanceNote('');
                    }}
                    className="text-xs text-amber-700 hover:text-amber-900 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-amber-900 font-medium mb-1">
                      Advance Amount ({settings.currency})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 5000"
                      value={addAdvanceAmount}
                      onChange={(e) => setAddAdvanceAmount(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg p-2 font-mono bg-white text-amber-950 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-amber-900 font-medium mb-1">
                      Reason / Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Emergency advance, festival advance"
                      value={addAdvanceNote}
                      onChange={(e) => setAddAdvanceNote(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg p-2 bg-white text-slate-900"
                    />
                  </div>
                </div>

                {addedAdvanceAmt > 0 && (
                  <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    New Advance Balance will be{' '}
                    <strong>
                      {formatCurrency(currentAdvanceBalance + addedAdvanceAmt, settings.currency)}
                    </strong>{' '}
                    on save.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Row 5: Allowances & Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Default Holiday Allowance ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formAllowance}
                onChange={(e) => setFormAllowance(e.target.value)}
                placeholder="e.g. 1000 for holiday allowance"
                className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Default Monthly Deduction ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formDeduction}
                onChange={(e) => setFormDeduction(e.target.value)}
                placeholder="e.g. 500 for tax/insurance"
                className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-white"
              />
            </div>
          </div>

          {/* Row 6: Phone, Email, Join Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="employee@apex.com"
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  Joining Date
                </label>
                <span className="text-[11px] text-indigo-700 font-mono font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {formatDateDDMMYYYY(formJoinDate)}
                </span>
              </div>
              <input
                type="date"
                value={formJoinDate}
                onChange={(e) => setFormJoinDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Internal Remarks / Work Notes
            </label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Shift notes, worker remarks..."
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold cursor-pointer shadow-xs"
            >
              {editingEmployee ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
