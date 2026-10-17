import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCheck,
  RotateCcw,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  UserX,
  UserPlus,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, CompanySettings, Employee } from '../types';
import { formatCurrency, formatDateDDMMYYYY } from '../utils/calculations';

interface DailyAttendanceProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateRecord: (record: AttendanceRecord) => void;
  onBulkUpdate: (records: AttendanceRecord[]) => void;
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  onOpenAddEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
}

export const DailyAttendance: React.FC<DailyAttendanceProps> = ({
  employees,
  attendanceRecords,
  onUpdateRecord,
  onBulkUpdate,
  settings,
  selectedMonth,
  onMonthChange,
  onOpenAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}) => {
  // Default to today if within selected month, else 1st of month
  const todayStr = '2026-09-24';
  const [currentDate, setCurrentDate] = useState<string>(() => {
    if (todayStr.startsWith(selectedMonth)) return todayStr;
    return `${selectedMonth}-01`;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Synchronize date if selectedMonth changes
  React.useEffect(() => {
    if (!currentDate.startsWith(selectedMonth)) {
      if (todayStr.startsWith(selectedMonth)) {
        setCurrentDate(todayStr);
      } else {
        setCurrentDate(`${selectedMonth}-01`);
      }
    }
  }, [selectedMonth]);

  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  // Navigate date
  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    const newDateStr = d.toISOString().split('T')[0];
    setCurrentDate(newDateStr);
    const newMonth = newDateStr.substring(0, 7);
    if (newMonth !== selectedMonth) {
      onMonthChange(newMonth);
    }
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const newDateStr = d.toISOString().split('T')[0];
    setCurrentDate(newDateStr);
    const newMonth = newDateStr.substring(0, 7);
    if (newMonth !== selectedMonth) {
      onMonthChange(newMonth);
    }
  };

  const handleJumpToday = () => {
    setCurrentDate(todayStr);
    const newMonth = todayStr.substring(0, 7);
    if (newMonth !== selectedMonth) {
      onMonthChange(newMonth);
    }
  };

  // Get records for currentDate
  const todayRecordsMap = new Map<string, AttendanceRecord>();
  attendanceRecords
    .filter((r) => r.date === currentDate)
    .forEach((r) => todayRecordsMap.set(r.employeeId, r));

  const getRecordForEmp = (empId: string): AttendanceRecord => {
    const existing = todayRecordsMap.get(empId);
    if (existing) return existing;
    return {
      id: `att-${empId}-${currentDate}`,
      employeeId: empId,
      date: currentDate,
      status: 'full',
      overtimeHours: 0,
    };
  };

  // Change status (Strictly 4 options: full, half, double, absent)
  const handleSetStatus = (employeeId: string, status: AttendanceStatus) => {
    const existing = todayRecordsMap.get(employeeId);
    const updated: AttendanceRecord = {
      id: existing ? existing.id : `att-${employeeId}-${currentDate}`,
      employeeId,
      date: currentDate,
      status,
      overtimeHours: 0,
      note: existing ? existing.note : undefined,
    };
    onUpdateRecord(updated);
  };

  // Change note
  const handleSetNote = (employeeId: string, note: string) => {
    const current = getRecordForEmp(employeeId);
    const updated: AttendanceRecord = {
      ...current,
      note,
    };
    onUpdateRecord(updated);
  };

  // Bulk actions
  const handleMarkAllFull = () => {
    const activeEmployees = employees.filter((e) => e.status === 'active');
    const newRecords: AttendanceRecord[] = activeEmployees.map((emp) => {
      const existing = todayRecordsMap.get(emp.id);
      return {
        id: existing ? existing.id : `att-${emp.id}-${currentDate}`,
        employeeId: emp.id,
        date: currentDate,
        status: 'full',
        overtimeHours: existing ? existing.overtimeHours : 0,
        note: existing ? existing.note : undefined,
      };
    });
    onBulkUpdate(newRecords);
  };

  const handleMarkAllAbsent = () => {
    const activeEmployees = employees.filter((e) => e.status === 'active');
    const newRecords: AttendanceRecord[] = activeEmployees.map((emp) => {
      const existing = todayRecordsMap.get(emp.id);
      return {
        id: existing ? existing.id : `att-${emp.id}-${currentDate}`,
        employeeId: emp.id,
        date: currentDate,
        status: 'absent',
        overtimeHours: existing ? existing.overtimeHours : 0,
        note: existing ? existing.note : undefined,
      };
    });
    onBulkUpdate(newRecords);
  };

  const handleMarkRemainingFull = () => {
    const activeEmployees = employees.filter((e) => e.status === 'active');
    const newRecords: AttendanceRecord[] = [];
    activeEmployees.forEach((emp) => {
      if (!todayRecordsMap.has(emp.id)) {
        newRecords.push({
          id: `att-${emp.id}-${currentDate}`,
          employeeId: emp.id,
          date: currentDate,
          status: 'full',
          overtimeHours: 0,
        });
      }
    });
    if (newRecords.length > 0) {
      onBulkUpdate(newRecords);
    }
  };



  // Compute daily metrics (Full, Half, Double, Absent)
  const activeEmployees = employees.filter((e) => e.status === 'active');
  let fullCount = 0;
  let halfCount = 0;
  let doubleCount = 0;
  let absentCount = 0;
  let paidLeaveCount = 0;
  let unmarkedCount = 0;

  activeEmployees.forEach((emp) => {
    const rec = todayRecordsMap.get(emp.id);
    if (!rec) {
      if (settings.autoMarkAbsent) {
        absentCount++;
      } else {
        unmarkedCount++;
      }
    } else {
      if (rec.status === 'full') fullCount++;
      else if (rec.status === 'half') halfCount++;
      else if (rec.status === 'double') doubleCount++;
      else if (rec.status === 'absent') absentCount++;
      else if (rec.status === 'paid_leave') paidLeaveCount++;
    }
  });

  // Filtered employees
  const filteredEmployees = activeEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    const rec = todayRecordsMap.get(emp.id);
    let matchesStatus = true;
    if (statusFilter === 'unmarked') {
      matchesStatus = !rec && !settings.autoMarkAbsent;
    } else if (statusFilter === 'full') {
      matchesStatus = rec ? rec.status === 'full' : (!settings.autoMarkAbsent && true);
    } else if (statusFilter === 'half') {
      matchesStatus = rec?.status === 'half';
    } else if (statusFilter === 'double') {
      matchesStatus = rec?.status === 'double';
    } else if (statusFilter === 'absent') {
      matchesStatus = rec?.status === 'absent' || (!rec && !!settings.autoMarkAbsent);
    } else if (statusFilter === 'paid_leave') {
      matchesStatus = rec?.status === 'paid_leave';
    }

    return matchesSearch && matchesDept && matchesStatus;
  });

  const dateObj = new Date(currentDate + 'T00:00:00');
  const formattedDayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedFullDate = formatDateDDMMYYYY(currentDate);
  const isSunday = dateObj.getDay() === 0;

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Date Navigator */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 gap-1">
              <button
                onClick={handlePrevDay}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="px-3 text-center">
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {formattedDayName} {isSunday && '(Weekend)'}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                  {formattedFullDate}
                </span>
              </div>

              <button
                onClick={handleNextDay}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="relative pl-1 border-l border-slate-200 ml-1">
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentDate(e.target.value);
                      const newM = e.target.value.substring(0, 7);
                      if (newM !== selectedMonth) onMonthChange(newM);
                    }
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  title="Select Date"
                />
                <button
                  type="button"
                  className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-white rounded-md transition-colors cursor-pointer flex items-center justify-center"
                  title="Select Date"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentDate !== todayStr && (
              <button
                onClick={handleJumpToday}
                className="px-2.5 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          {/* Employer Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddEmployee}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Add New Employee"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
            {settings.autoMarkAbsent && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
                title="Settings rule: Staff without attendance entries are automatically marked Absent"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Auto-Absent Active</span>
              </span>
            )}

            <button
              onClick={handleMarkAllFull}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Mark everyone as Full Day (1.0)"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>All Full Day</span>
            </button>

            <button
              onClick={handleMarkAllAbsent}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Mark everyone as Absent"
            >
              <UserX className="w-4 h-4 text-rose-600" />
              <span>All Absent</span>
            </button>

            {unmarkedCount > 0 && (
              <button
                onClick={handleMarkRemainingFull}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark {unmarkedCount} Unmarked Full</span>
              </button>
            )}
          </div>

        </div>

        {/* Daily Stats Bar: Roll Call States - Interactive Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* 1. Total Staff (All) */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
              statusFilter === 'ALL'
                ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
            }`}
            title="Show all employees"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="block text-xs text-slate-500 font-medium">Total Staff</span>
                {statusFilter === 'ALL' && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 bg-slate-800 text-white rounded">
                    All
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {activeEmployees.length}
              </span>
            </div>
            <Users className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          {/* 2. Full Day (1.0) */}
          <button
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === 'full' ? 'ALL' : 'full'))}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer active:scale-[0.98] ${
              statusFilter === 'full'
                ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-600 shadow-xs'
                : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300'
            }`}
            title={statusFilter === 'full' ? 'Click to show all employees' : 'Click to filter Full Day employees'}
          >
            <div className="flex items-center justify-between">
              <span className="block text-xs text-emerald-800 font-semibold">Full Day (1.0)</span>
              {statusFilter === 'full' && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-emerald-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-emerald-900 font-mono">
              {fullCount}
            </span>
          </button>

          {/* 3. Half Day (0.5) */}
          <button
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === 'half' ? 'ALL' : 'half'))}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer active:scale-[0.98] ${
              statusFilter === 'half'
                ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-600 shadow-xs'
                : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300'
            }`}
            title={statusFilter === 'half' ? 'Click to show all employees' : 'Click to filter Half Day employees'}
          >
            <div className="flex items-center justify-between">
              <span className="block text-xs text-amber-800 font-semibold">Half Day (0.5)</span>
              {statusFilter === 'half' && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-amber-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-amber-900 font-mono">
              {halfCount}
            </span>
          </button>

          {/* 4. Double (2.0) */}
          <button
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === 'double' ? 'ALL' : 'double'))}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer active:scale-[0.98] ${
              statusFilter === 'double'
                ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-600 shadow-xs'
                : 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/70 hover:border-indigo-300'
            }`}
            title={statusFilter === 'double' ? 'Click to show all employees' : 'Click to filter Double Day employees'}
          >
            <div className="flex items-center justify-between">
              <span className="block text-xs text-indigo-800 font-semibold">Double (2.0)</span>
              {statusFilter === 'double' && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-indigo-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-indigo-900 font-mono">
              {doubleCount}
            </span>
          </button>

          {/* 5. Absent (0.0) */}
          <button
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === 'absent' ? 'ALL' : 'absent'))}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer active:scale-[0.98] ${
              statusFilter === 'absent'
                ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-600 shadow-xs'
                : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70 hover:border-rose-300'
            }`}
            title={statusFilter === 'absent' ? 'Click to show all employees' : 'Click to filter Absent employees'}
          >
            <div className="flex items-center justify-between">
              <span className="block text-xs text-rose-800 font-semibold">Absent (0.0)</span>
              {statusFilter === 'absent' && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-rose-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-rose-900 font-mono">
              {absentCount}
            </span>
          </button>

          {/* 6. Paid Leave (1.0) */}
          <button
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === 'paid_leave' ? 'ALL' : 'paid_leave'))}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer active:scale-[0.98] ${
              statusFilter === 'paid_leave'
                ? 'bg-teal-100 border-teal-500 ring-2 ring-teal-600 shadow-xs'
                : 'bg-teal-50/70 border-teal-200 hover:bg-teal-100/70 hover:border-teal-300'
            }`}
            title={statusFilter === 'paid_leave' ? 'Click to show all employees' : 'Click to filter Paid Leave employees'}
          >
            <div className="flex items-center justify-between">
              <span className="block text-xs text-teal-800 font-semibold">Paid Leave</span>
              {statusFilter === 'paid_leave' && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-teal-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-teal-900 font-mono">
              {paidLeaveCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name, ID or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors ${
              statusFilter !== 'ALL'
                ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 font-semibold'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="full">Full Day (1.0)</option>
            <option value="half">Half Day (0.5)</option>
            <option value="double">Double (2.0)</option>
            <option value="absent">Absent (0.0)</option>
            <option value="unmarked">Unmarked Today</option>
          </select>

          {statusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              title="Clear status filter"
            >
              Show All Staff ✕
            </button>
          )}
        </div>
      </div>

      {/* Employee Attendance Marking Cards */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {activeEmployees.length === 0 ? 'No employees found' : 'No matching employees'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            {activeEmployees.length === 0
              ? 'Add a new employee to start taking attendance.'
              : statusFilter !== 'ALL'
              ? `No staff members are currently recorded as "${
                  statusFilter === 'full'
                    ? 'Full Day'
                    : statusFilter === 'half'
                    ? 'Half Day'
                    : statusFilter === 'double'
                    ? 'Double'
                    : statusFilter === 'absent'
                    ? 'Absent'
                    : 'Unmarked'
                }" for this date.`
              : 'No employees matched your search query or department filter.'}
          </p>
          {activeEmployees.length === 0 ? (
            <button
              onClick={onOpenAddEmployee}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create First Employee</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSelectedDept('ALL');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors"
            >
              <span>Show All Staff</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((employee) => {
            const record = todayRecordsMap.get(employee.id);
            const isAutoAbsent = !record && !!settings.autoMarkAbsent;
            const status: AttendanceStatus = record
              ? record.status
              : isAutoAbsent
              ? 'absent'
              : 'full';
            const isSaved = !!record;
            const note = record?.note || '';

            // Calculate daily earnings preview
            const divisor = settings.workingDaysMode === 'standard_26' ? 26 : 30;
            const dailyRate = employee.baseSalary / divisor;
            const earnedToday =
              status === 'full' || status === 'paid_leave'
                ? dailyRate
                : status === 'half'
                ? dailyRate * 0.5
                : status === 'double'
                ? dailyRate * 2.0
                : 0;

            return (
              <div
                key={employee.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Employee Identity & Info with Edit/Delete Affordances right on the card */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-sm text-slate-700 shrink-0 border border-slate-200">
                      {employee.code.replace('EMP-', '')}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-slate-900 leading-tight">
                          {employee.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          {employee.code}
                        </span>

                        {isAutoAbsent && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded"
                            title="Auto-marked Absent because no entry has been made for today"
                          >
                            Auto-Absent
                          </span>
                        )}



                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete employee "${employee.name}"?`)) {
                              onDeleteEmployee(employee.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title={`Delete ${employee.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        <span>{employee.department}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono text-slate-700 font-semibold">
                          {formatCurrency(employee.baseSalary, settings.currency)}/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Marking Buttons: EXACTLY 4 OPTIONS: full, half, double, absent */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    {/* 1. Full Day (Press once for Full Day 1.0, twice for Double 2.0) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (status === 'full' && isSaved) {
                          handleSetStatus(employee.id, 'double');
                        } else if (status === 'double' && isSaved) {
                          handleSetStatus(employee.id, 'full');
                        } else {
                          handleSetStatus(employee.id, 'full');
                        }
                      }}
                      className={`group px-3.5 py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        status === 'full' && isSaved
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                          : status === 'double' && isSaved
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                      title="Press once for Full Day, twice to mark double"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'full' && isSaved
                            ? 'bg-white'
                            : status === 'double' && isSaved
                            ? 'bg-white'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div className="text-left leading-tight">
                        <div>{status === 'double' && isSaved ? 'Double (2.0)' : 'Full Day (1.0)'}</div>
                        <div
                          className={`text-[9px] font-medium transition-colors ${
                            status === 'full' && isSaved
                              ? 'text-emerald-100'
                              : status === 'double' && isSaved
                              ? 'text-indigo-100'
                              : 'text-slate-500 group-hover:text-emerald-700'
                          }`}
                        >
                          Press twice to mark double
                        </div>
                      </div>
                    </button>

                    {/* 2. Half Day */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(employee.id, 'half')}
                      className={`px-3.5 py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        status === 'half' && isSaved
                          ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'half' && isSaved ? 'bg-white' : 'bg-amber-500'
                        }`}
                      />
                      <span>Half Day (0.5)</span>
                    </button>

                    {/* Paid Leave */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(employee.id, 'paid_leave')}
                      className={`px-3.5 py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        status === 'paid_leave' && isSaved
                          ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'paid_leave' && isSaved ? 'bg-white' : 'bg-teal-500'
                        }`}
                      />
                      <span>Paid Leave</span>
                    </button>

                    {/* 4. Absent */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(employee.id, 'absent')}
                      className={`px-3.5 py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        (status === 'absent' && isSaved) || isAutoAbsent
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          (status === 'absent' && isSaved) || isAutoAbsent ? 'bg-white' : 'bg-rose-500'
                        }`}
                      />
                      <span>Absent (0.0){isAutoAbsent ? ' (Auto)' : ''}</span>
                    </button>
                  </div>

                </div>

                {/* Bottom Row: Inline Notes and Daily Pay estimate */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add roll-call remark for today..."
                      value={note}
                      onChange={(e) => handleSetNote(employee.id, e.target.value)}
                      className="text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-slate-300 focus:outline-hidden w-full sm:max-w-md transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-3 font-mono text-slate-500 shrink-0 self-end sm:self-auto">
                    <span>
                      Day Wage:{' '}
                      <strong className="text-slate-800">
                        {formatCurrency(earnedToday, settings.currency)}
                      </strong>{' '}
                      {isAutoAbsent && (
                        <span className="text-rose-600 text-[11px] font-medium font-sans">(Auto-Absent)</span>
                      )}
                      {status === 'double' && (
                        <span className="text-indigo-600 font-semibold">(2x Double)</span>
                      )}
                    </span>
                    {employee.advanceBalance > 0 && (
                      <span className="text-amber-700 font-semibold">
                        Advance: {formatCurrency(employee.advanceBalance, settings.currency)}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
