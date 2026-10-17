import React, { useState } from 'react';
import {
  Download,
  Filter,
  Check,
  Clock,
  X,
  Plus,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, CompanySettings, Employee } from '../types';
import { getMonthDaysArray, getMonthLabel, formatDateDDMMYYYY } from '../utils/calculations';

interface MonthlyMatrixProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateRecord: (record: AttendanceRecord) => void;
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
}

export const MonthlyMatrix: React.FC<MonthlyMatrixProps> = ({
  employees,
  attendanceRecords,
  onUpdateRecord,
  settings,
  selectedMonth,
}) => {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');
  const [activeCell, setActiveCell] = useState<{
    employeeId: string;
    date: string;
    dayNum: number;
    employeeName: string;
  } | null>(null);

  const daysInMonth = getMonthDaysArray(selectedMonth);

  const currentDayDate = selectedDayDate && daysInMonth.some(d => d.date === selectedDayDate) 
    ? selectedDayDate 
    : (daysInMonth[0]?.date || selectedMonth + '-01');

  let filteredDays = daysInMonth;
  if (viewMode === 'week') {
    const startIndex = (selectedWeek - 1) * 7;
    filteredDays = daysInMonth.slice(startIndex, startIndex + 7);
  } else if (viewMode === 'day') {
    filteredDays = daysInMonth.filter((d) => d.date === currentDayDate);
    if (filteredDays.length === 0 && daysInMonth.length > 0) {
      filteredDays = [daysInMonth[0]];
    }
  }

  const departments = ['ALL', ...Array.from(new Set(employees.map((e) => e.department)))];

  const activeEmployees = employees.filter(
    (e) => e.status === 'active' && (selectedDept === 'ALL' || e.department === selectedDept),
  );

  // Map of `empId_date` -> AttendanceRecord
  const recordsMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    recordsMap.set(`${r.employeeId}_${r.date}`, r);
  });

  // Cell status updater
  // If user presses Full Day button twice when status is already 'full', it sets 'double'
  const handleCellStatusChange = (status: AttendanceStatus) => {
    if (!activeCell) return;
    const key = `${activeCell.employeeId}_${activeCell.date}`;
    const existing = recordsMap.get(key);
    const currentStatus = existing?.status;

    let targetStatus = status;
    if (status === 'full' && currentStatus === 'full') {
      targetStatus = 'double';
    }

    const updated: AttendanceRecord = {
      id: existing ? existing.id : `att-${activeCell.employeeId}-${activeCell.date}`,
      employeeId: activeCell.employeeId,
      date: activeCell.date,
      status: targetStatus,
      overtimeHours: 0,
      note: existing?.note,
    };
    onUpdateRecord(updated);
  };

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Employee Name', 'Department'];
    filteredDays.forEach((d) => {
      headers.push(`${formatDateDDMMYYYY(d.date)} (${d.dayOfWeek})`);
    });
    headers.push('Full Days', 'Paid Leave', 'Half Days', 'Double Days', 'Absent', 'Payable Days');

    const rows = activeEmployees.map((emp) => {
      let full = 0;
      let paidLeave = 0;
      let half = 0;
      let double = 0;
      let absent = 0;

      const dayCells = filteredDays.map((d) => {
        const rec = recordsMap.get(`${emp.id}_${d.date}`);
        const isAutoAbsent = !rec && !!settings.autoMarkAbsent && (!settings.workingDaysMode.includes('sundays') || !d.isSunday);
        
        if (!rec && !isAutoAbsent) return '-';
        if (rec?.status === 'full') full++;
        else if (rec?.status === 'paid_leave') paidLeave++;
        else if (rec?.status === 'half') half++;
        else if (rec?.status === 'double') double++;
        else if (rec?.status === 'absent' || isAutoAbsent) absent++;

        if (isAutoAbsent) return 'A';
        return rec?.status === 'full'
          ? 'F'
          : rec?.status === 'paid_leave'
          ? 'PL'
          : rec?.status === 'half'
          ? 'H'
          : rec?.status === 'double'
          ? 'D'
          : 'A';
      });

      const payableDays = full + paidLeave + half * 0.5 + double * 2.0;

      return [
        `"${emp.code}"`,
        `"${emp.name}"`,
        `"${emp.department}"`,
        ...dayCells.map((c) => `"${c}"`),
        full,
        paidLeave,
        half,
        double,
        absent,
        payableDays,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Matrix_${selectedMonth}_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header controls & filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Monthly Attendance Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Viewing <strong className="text-slate-700">{viewMode.toUpperCase()}</strong> mode for <strong className="text-slate-700">{getMonthLabel(selectedMonth)}</strong>. Click any cell to quickly change status (F, PL, H, D, A).
            {settings.autoMarkAbsent && (
              <span className="ml-2 text-rose-700 font-medium inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Auto-mark absent active for unrecorded days
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Segmented Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>

          {/* Week Selector */}
          {viewMode === 'week' && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value={1}>Week 1 (Days 1–7)</option>
              <option value={2}>Week 2 (Days 8–14)</option>
              <option value={3}>Week 3 (Days 15–21)</option>
              <option value={4}>Week 4 (Days 22–End)</option>
            </select>
          )}

          {/* Day Selector */}
          {viewMode === 'day' && (
            <select
              value={currentDayDate}
              onChange={(e) => setSelectedDayDate(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
            >
              {daysInMonth.map((d) => (
                <option key={d.date} value={d.date}>
                  {formatDateDDMMYYYY(d.date)} ({d.dayOfWeek})
                </option>
              ))}
            </select>
          )}

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-50 py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 min-w-[125px] sm:min-w-[145px]">
                  Employee
                </th>
                {filteredDays.map((d) => (
                  <th
                    key={d.date}
                    className={`py-2 px-1 text-center font-mono font-medium border-r border-slate-200 min-w-[36px] max-w-[36px] ${
                      d.isSunday ? 'bg-slate-100 text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 uppercase">{d.dayOfWeek[0]}</div>
                    <div className="text-xs font-bold text-slate-800">{d.dayNum}</div>
                  </th>
                ))}
                <th className="py-2 px-2 text-center font-semibold text-emerald-800 bg-emerald-50 border-l border-slate-200 min-w-[45px]">
                  Full (F)
                </th>
                <th className="py-2 px-2 text-center font-semibold text-teal-800 bg-teal-50 border-l border-slate-200 min-w-[45px]">
                  Paid (PL)
                </th>
                <th className="py-2 px-2 text-center font-semibold text-amber-800 bg-amber-50 border-l border-slate-200 min-w-[45px]">
                  Half (H)
                </th>
                <th className="py-2 px-2 text-center font-semibold text-indigo-800 bg-indigo-50 border-l border-slate-200 min-w-[45px]">
                  Dbl (D)
                </th>
                <th className="py-2 px-2.5 text-center font-semibold text-rose-800 bg-rose-50 border-l border-slate-200 min-w-[45px]">
                  Abs (A)
                </th>
                <th className="py-2 px-3 text-center font-bold text-slate-900 bg-slate-100 border-l border-slate-200 min-w-[65px]">
                  Payable
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {activeEmployees.map((emp) => {
                let full = 0;
                let paidLeave = 0;
                let half = 0;
                let double = 0;
                let absent = 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Fixed Left Header for employee: just employee name and department */}
                    <td className="sticky left-0 z-10 bg-white py-2 px-2.5 border-r border-slate-200 font-medium w-24 sm:w-32 min-w-[85px] sm:min-w-[125px] max-w-[95px] sm:max-w-[140px]">
                      <div className="truncate leading-tight">
                        <div className="font-semibold text-slate-900 text-xs truncate" title={emp.name}>
                          {emp.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5" title={emp.department}>
                          {emp.department}
                        </div>
                      </div>
                    </td>

                    {/* Day Cells */}
                    {filteredDays.map((day) => {
                      const rec = recordsMap.get(`${emp.id}_${day.date}`);
                      const isAutoAbsent = !rec && !!settings.autoMarkAbsent && (!settings.workingDaysMode.includes('sundays') || !day.isSunday);
                      const status = rec?.status || (isAutoAbsent ? 'absent' : undefined);

                      if (status === 'full') full++;
                      else if (status === 'paid_leave') paidLeave++;
                      else if (status === 'half') half++;
                      else if (status === 'double') double++;
                      else if (status === 'absent') absent++;

                      return (
                        <td
                          key={day.date}
                          onClick={() =>
                            setActiveCell({
                              employeeId: emp.id,
                              date: day.date,
                              dayNum: day.dayNum,
                              employeeName: emp.name,
                            })
                          }
                          className={`p-1 text-center cursor-pointer border-r border-slate-100 last:border-r-0 transition-colors relative hover:ring-2 hover:ring-indigo-400 hover:z-10 ${
                            day.isSunday ? 'bg-slate-50/80' : ''
                          }`}
                          title={`${emp.name} on ${formatDateDDMMYYYY(day.date)}: ${
                            status ? status.toUpperCase() : 'Unmarked'
                          }${isAutoAbsent ? ' (Auto-marked Absent)' : ''}`}
                        >
                          <div className="flex flex-col items-center justify-center h-7 w-7 mx-auto rounded">
                            {status === 'full' && (
                              <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                                F
                              </span>
                            )}
                            {status === 'paid_leave' && (
                              <span className="w-6 h-6 rounded bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200" title="Paid Leave">
                                PL
                              </span>
                            )}
                            {status === 'half' && (
                              <span className="w-6 h-6 rounded bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200">
                                H
                              </span>
                            )}
                            {status === 'double' && (
                              <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center border border-indigo-200">
                                D
                              </span>
                            )}
                            {status === 'absent' && (
                              <span
                                className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center border ${
                                  isAutoAbsent
                                    ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                    : 'bg-rose-100 text-rose-800 border-rose-200'
                                }`}
                              >
                                A
                              </span>
                            )}
                            {!status && (
                              <span className="text-slate-300 text-xs">·</span>
                            )}

                          </div>
                        </td>
                      );
                    })}

                    {/* Summary Calculations */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-200">
                      {full}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-700 bg-teal-50/40 border-l border-slate-200">
                      {paidLeave}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-700 bg-amber-50/40 border-l border-slate-200">
                      {half}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-indigo-700 bg-indigo-50/40 border-l border-slate-200">
                      {double}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-700 bg-rose-50/40 border-l border-slate-200">
                      {absent}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50 border-l border-slate-200">
                      {(full + paidLeave + half * 0.5 + double * 2.0).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popover / Quick Edit Modal when clicking on any cell */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Day {activeCell.dayNum} Attendance
                </h4>
                <p className="text-xs text-slate-500">
                  {activeCell.employeeName} · {formatDateDDMMYYYY(activeCell.date)}
                </p>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const currentRec = recordsMap.get(
                `${activeCell.employeeId}_${activeCell.date}`,
              );
              const currentStatus = currentRec?.status;

              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Mark Roll Call (Press Full Day twice for Double)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Full Day / Double (Press twice) */}
                      <button
                        type="button"
                        onClick={() => handleCellStatusChange('full')}
                        className={`p-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'full' || currentStatus === 'double'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title="Click once for Full Day (1.0), click twice for Double (2.0)"
                      >
                        {currentStatus === 'double' ? 'Double (2.0)' : 'Full Day (1.0)'}
                      </button>

                      {/* Half Day */}
                      <button
                        type="button"
                        onClick={() => handleCellStatusChange('half')}
                        className={`p-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'half'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        Half Day (0.5)
                      </button>

                      {/* Absent */}
                      <button
                        type="button"
                        onClick={() => handleCellStatusChange('absent')}
                        className={`p-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        Absent (0.0)
                      </button>

                      {/* Paid Leave (Replacing Double) */}
                      <button
                        type="button"
                        onClick={() => handleCellStatusChange('paid_leave')}
                        className={`p-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'paid_leave'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        Paid Leave (1.0)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveCell(null)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
