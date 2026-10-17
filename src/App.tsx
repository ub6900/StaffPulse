import React, { useState, useEffect } from 'react';
import {
  AdvanceTransaction,
  AttendanceRecord,
  CompanySettings,
  Employee,
  MonthlyAdjustment,
  PayrollItem,
  AccountingTransaction,
  MasterDataConfig,
} from './types';
import { storage } from './utils/storage';
import { getThemeConfig } from './utils/themeHelper';
import { Navbar } from './components/Navbar';
import { AccountingLedger } from './components/AccountingLedger';
import { DailyAttendance } from './components/DailyAttendance';
import { MonthlyMatrix } from './components/MonthlyMatrix';
import { PayrollSummary } from './components/PayrollSummary';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { AdvanceTracker } from './components/AdvanceTracker';
import { PayslipModal } from './components/PayslipModal';
import { SettingsModal } from './components/SettingsModal';
import { MasterDataModal } from './components/MasterDataModal';
import { EmployeeModal } from './components/EmployeeModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

export default function App() {
  // Global States
  const [employees, setEmployees] = useState<Employee[]>(() => storage.getEmployees());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    storage.getAttendance(),
  );
  const [advanceTransactions, setAdvanceTransactions] = useState<AdvanceTransaction[]>(() =>
    storage.getAdvances(),
  );
  const [adjustments, setAdjustments] = useState<MonthlyAdjustment[]>(() =>
    storage.getAdjustments(),
  );
  const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>(() =>
    storage.getAccounting(),
  );
  const [masterData, setMasterData] = useState<MasterDataConfig>(() =>
    storage.getMasterData(),
  );
  const [payments, setPayments] = useState<
    Record<
      string,
      {
        status: 'pending' | 'approved' | 'paid';
        paidAt?: string;
        paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
        paymentRef?: string;
      }
    >
  >(() => storage.getPayments());
  const [settings, setSettings] = useState<CompanySettings>(() => storage.getSettings());

  const themeConfig = getThemeConfig(settings.themeStyle);

  // Navigation and active view / starting page mode
  const [activeModule, setActiveModule] = useState<'attendance' | 'accounting'>('attendance');
  const [currentTab, setCurrentTab] = useState<
    'daily' | 'monthly' | 'payroll' | 'advances' | 'employees'
  >('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // Modal dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [masterDataInitialTab, setMasterDataInitialTab] = useState<'attendance' | 'categories' | 'payments'>('attendance');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleOpenMasterData = (tab: 'attendance' | 'categories' | 'payments' = 'attendance') => {
    setMasterDataInitialTab(tab);
    setIsMasterDataOpen(true);
  };

  const [activePayslip, setActivePayslip] = useState<{
    item: PayrollItem;
    emp: Employee;
  } | null>(null);

  // Sync state changes with LocalStorage
  useEffect(() => {
    storage.setEmployees(employees);
  }, [employees]);

  useEffect(() => {
    storage.setAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    storage.setAdvances(advanceTransactions);
  }, [advanceTransactions]);

  useEffect(() => {
    storage.setAdjustments(adjustments);
  }, [adjustments]);

  useEffect(() => {
    storage.setPayments(payments);
  }, [payments]);

  useEffect(() => {
    storage.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    storage.setAccounting(accountingTransactions);
  }, [accountingTransactions]);

  useEffect(() => {
    storage.setMasterData(masterData);
  }, [masterData]);

  const handleAddAccountingTransaction = (tx: AccountingTransaction) => {
    setAccountingTransactions((prev) => [tx, ...prev]);
  };

  const handleUpdateAccountingTransaction = (tx: AccountingTransaction) => {
    setAccountingTransactions((prev) => prev.map((t) => t.id === tx.id ? tx : t));
  };

  const handleDeleteAccountingTransaction = (id: string) => {
    setAccountingTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Attendance update handlers
  const handleUpdateRecord = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex(
        (r) => r.employeeId === record.employeeId && r.date === record.date,
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });
  };

  const handleBulkUpdate = (records: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => {
      const copy = [...prev];
      records.forEach((newRec) => {
        const idx = copy.findIndex(
          (r) => r.employeeId === newRec.employeeId && r.date === newRec.date,
        );
        if (idx >= 0) {
          copy[idx] = newRec;
        } else {
          copy.push(newRec);
        }
      });
      return copy;
    });
  };

  // Employee creation / update
  const handleSaveEmployee = (
    employee: Employee,
    initialAdvance?: { amount: number; note: string },
  ) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === employee.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = employee;
        return copy;
      }
      return [...prev, employee];
    });

    // If new employee has an initial advance, log the disbursement transaction
    if (initialAdvance && initialAdvance.amount > 0) {
      const newTxn: AdvanceTransaction = {
        id: `adv-${Date.now()}`,
        employeeId: employee.id,
        date: new Date().toISOString().split('T')[0],
        type: 'given',
        amount: initialAdvance.amount,
        note: initialAdvance.note || 'Initial joining advance',
      };
      setAdvanceTransactions((prev) => [...prev, newTxn]);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    // Also clean up future attendance records or keep history
    setAttendanceRecords((prev) => prev.filter((r) => r.employeeId !== id));
  };

  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setIsAddEmployeeOpen(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsAddEmployeeOpen(true);
  };

  // Disburse advance to an employee
  const handleDisburseAdvance = (employeeId: string, amount: number, note: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newTxn: AdvanceTransaction = {
      id: `adv-${Date.now()}`,
      employeeId,
      date: today,
      type: 'given',
      amount,
      note,
    };

    setAdvanceTransactions((prev) => [...prev, newTxn]);

    // Update employee balance
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, advanceBalance: (emp.advanceBalance || 0) + amount }
          : emp,
      ),
    );
  };

  // Monthly Adjustments
  const handleAddAdjustment = (adj: MonthlyAdjustment) => {
    setAdjustments((prev) => [...prev, adj]);
  };

  const handleDeleteAdjustment = (id: string) => {
    setAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  // Payment Status Management
  const handleUpdatePayment = (
    empId: string,
    data: {
      status: 'pending' | 'approved' | 'paid';
      paidAt?: string;
      paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
      paymentRef?: string;
    },
  ) => {
    const key = `${empId}_${selectedMonth}`;
    setPayments((prev) => ({
      ...prev,
      [key]: data,
    }));

    // If newly marked as PAID, check if there's an advance deduction adjustment to log as transaction & deduct from balance
    if (data.status === 'paid') {
      const empAdjs = adjustments.filter(
        (a) => a.employeeId === empId && a.month === selectedMonth && a.type === 'advance_deduction',
      );
      const totalDed = empAdjs.reduce((acc, a) => acc + a.amount, 0);
      if (totalDed > 0) {
        const exists = advanceTransactions.some(
          (t) => t.employeeId === empId && t.payrollMonth === selectedMonth && t.type === 'deducted',
        );
        if (!exists) {
          const deductTxn: AdvanceTransaction = {
            id: `adv-ded-${empId}-${selectedMonth}-${Date.now()}`,
            employeeId: empId,
            date: data.paidAt || new Date().toISOString().split('T')[0],
            type: 'deducted',
            amount: totalDed,
            note: `${selectedMonth} payroll deduction`,
            payrollMonth: selectedMonth,
          };
          setAdvanceTransactions((prev) => [...prev, deductTxn]);

          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === empId
                ? { ...emp, advanceBalance: Math.max(0, emp.advanceBalance - totalDed) }
                : emp,
            ),
          );
        }
      }
    }
  };

  const handleBatchUpdatePayments = (
    updates: Record<
      string,
      {
        status: 'pending' | 'approved' | 'paid';
        paidAt?: string;
        paymentMethod?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
        paymentRef?: string;
      }
    >,
  ) => {
    setPayments((prev) => ({
      ...prev,
      ...updates,
    }));

    Object.entries(updates).forEach(([key, payData]) => {
      if (payData.status === 'paid') {
        const [empId, month] = key.split('_');
        const empAdjs = adjustments.filter(
          (a) => a.employeeId === empId && a.month === month && a.type === 'advance_deduction',
        );
        const totalDed = empAdjs.reduce((acc, a) => acc + a.amount, 0);
        if (totalDed > 0) {
          const exists = advanceTransactions.some(
            (t) => t.employeeId === empId && t.payrollMonth === month && t.type === 'deducted',
          );
          if (!exists) {
            const deductTxn: AdvanceTransaction = {
              id: `adv-ded-${empId}-${month}-${Date.now()}`,
              employeeId: empId,
              date: payData.paidAt || new Date().toISOString().split('T')[0],
              type: 'deducted',
              amount: totalDed,
              note: `${month} batch payroll deduction`,
              payrollMonth: month,
            };
            setAdvanceTransactions((prev) => [...prev, deductTxn]);
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.id === empId
                  ? { ...emp, advanceBalance: Math.max(0, emp.advanceBalance - totalDed) }
                  : emp,
              ),
            );
          }
        }
      }
    });
  };

  return (
    <div className={`min-h-screen ${themeConfig.bgApp} flex flex-col`}>
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        settings={settings}
        employeeCount={employees.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMasterData={() => setIsMasterDataOpen(true)}
        onOpenAddEmployee={handleOpenAddEmployee}
        onOpenDisburseAdvance={() => setCurrentTab('advances')}
        onUpdateSettings={setSettings}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
      />

      {/* Main Content Viewport */}
      {activeModule === 'accounting' ? (
        <main className="flex-1 w-full py-6">
          <AccountingLedger
            transactions={accountingTransactions}
            onAddTransaction={handleAddAccountingTransaction}
            onUpdateTransaction={handleUpdateAccountingTransaction}
            onDeleteTransaction={handleDeleteAccountingTransaction}
            settings={settings}
            masterData={masterData}
            onUpdateMasterData={setMasterData}
            onOpenMasterData={handleOpenMasterData}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'daily' && (
            <DailyAttendance
              employees={employees}
              attendanceRecords={attendanceRecords}
              onUpdateRecord={handleUpdateRecord}
              onBulkUpdate={handleBulkUpdate}
              settings={settings}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onOpenAddEmployee={handleOpenAddEmployee}
              onEditEmployee={handleOpenEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {currentTab === 'monthly' && (
            <MonthlyMatrix
              employees={employees}
              attendanceRecords={attendanceRecords}
              onUpdateRecord={handleUpdateRecord}
              settings={settings}
              selectedMonth={selectedMonth}
            />
          )}

          {currentTab === 'payroll' && (
            <PayrollSummary
              employees={employees}
              attendanceRecords={attendanceRecords}
              adjustments={adjustments}
              onAddAdjustment={handleAddAdjustment}
              onDeleteAdjustment={handleDeleteAdjustment}
              payments={payments}
              onUpdatePayment={handleUpdatePayment}
              onBatchUpdatePayments={handleBatchUpdatePayments}
              settings={settings}
              selectedMonth={selectedMonth}
              onViewPayslip={(item, employee) =>
                setActivePayslip({ item, emp: employee })
              }
              onOpenAdvanceModal={() => setCurrentTab('advances')}
            />
          )}

          {currentTab === 'advances' && (
            <AdvanceTracker
              employees={employees}
              advanceTransactions={advanceTransactions}
              onDisburseAdvance={handleDisburseAdvance}
              settings={settings}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeeDirectory
              employees={employees}
              onOpenAddEmployee={handleOpenAddEmployee}
              onEditEmployee={handleOpenEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              advanceTransactions={advanceTransactions}
              onDisburseAdvance={handleDisburseAdvance}
              settings={settings}
            />
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {settings.companyName} · Employer Attendance & Monthly Payroll System
          </span>
          <span className="text-slate-400">
            Active Period: {selectedMonth} · Total Staff: {employees.length}
          </span>
        </div>
      </footer>

      {/* Universal Add / Edit Employee Modal - Accessible from all tabs */}
      <EmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => {
          setIsAddEmployeeOpen(false);
          setEditingEmployee(null);
        }}
        editingEmployee={editingEmployee}
        onSave={handleSaveEmployee}
        settings={settings}
        existingEmployees={employees}
      />

      {/* Payslip Voucher Modal */}
      {activePayslip && (
        <PayslipModal
          payrollItem={activePayslip.item}
          employee={activePayslip.emp}
          settings={settings}
          onClose={() => setActivePayslip(null)}
        />
      )}

      {/* Company Settings & Backup Modal */}
      <SettingsModal
        settings={settings}
        onSaveSettings={setSettings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Master Data Management Modal */}
      <MasterDataModal
        isOpen={isMasterDataOpen}
        onClose={() => setIsMasterDataOpen(false)}
        masterData={masterData}
        onUpdateMasterData={setMasterData}
        attendanceRecords={attendanceRecords}
        accountingTransactions={accountingTransactions}
        onUpdateAttendanceRecords={setAttendanceRecords}
        onUpdateAccountingTransactions={setAccountingTransactions}
        initialTab={masterDataInitialTab}
      />

      {/* PWA Install Notification Banner & Prompt */}
      <PWAInstallBanner />
    </div>
  );
}
