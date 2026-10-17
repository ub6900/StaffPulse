import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, UserPlus, Users, Download, Layers, Sliders } from 'lucide-react';
import { CompanySettings } from '../types';
import { getMonthLabel } from '../utils/calculations';
import { StaffPulseLogo } from './StaffPulseLogo';

interface NavbarProps {
  currentTab: 'daily' | 'monthly' | 'payroll' | 'advances' | 'employees';
  setCurrentTab: (tab: 'daily' | 'monthly' | 'payroll' | 'advances' | 'employees') => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  settings: CompanySettings;
  employeeCount: number;
  onOpenSettings: () => void;
  onOpenMasterData: () => void;
  onOpenAddEmployee: () => void;
  onOpenDisburseAdvance: () => void;
  onUpdateSettings: (settings: CompanySettings) => void;
  activeModule: 'attendance' | 'accounting';
  onSelectModule: (mode: 'attendance' | 'accounting') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedMonth,
  setSelectedMonth,
  settings,
  employeeCount,
  onOpenSettings,
  onOpenMasterData,
  onOpenAddEmployee,
  onOpenDisburseAdvance,
  onUpdateSettings,
  activeModule,
  onSelectModule,
}) => {
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newY = nextDate.getFullYear();
    const newM = (nextDate.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const hasLeft = el.scrollLeft > 4;
      const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setCanScrollLeft(hasLeft);
      setCanScrollRight(hasRight);
    }
  };

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const navItems = [
    { id: 'daily', label: 'Daily Roll-Call' },
    { id: 'monthly', label: 'Monthly Grid' },
    { id: 'payroll', label: 'Payroll & Adjustments' },
    { id: 'advances', label: 'Advance Tracker' },
    { id: 'employees', label: `Employees (${employeeCount})` },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <StaffPulseLogo className="w-8 h-8 shrink-0 cursor-pointer" onClick={() => onSelectModule('attendance')} />
            <button 
              onClick={() => onSelectModule('attendance')}
              className="text-left group cursor-pointer focus:outline-hidden"
            >
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                StaffPulse
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-normal">
                {settings.companyName}
              </span>
            </button>
          </div>

          {/* Zone 2: Module Switcher Tabs & Settings */}
          <div className="hidden md:flex items-center gap-3">
            {/* Module Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => onSelectModule('attendance')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                  activeModule === 'attendance' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Attendance & Payroll
              </button>
              <button
                onClick={() => onSelectModule('accounting')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                  activeModule === 'accounting' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Accounting
              </button>
            </div>

            {/* Settings Dropdown Menu */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                onClick={() => {
                  setIsDesktopMenuOpen(!isDesktopMenuOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 bg-white shadow-2xs text-xs font-semibold px-3"
                title="Settings & Master Data"
              >
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>Settings</span>
              </button>

              {isDesktopMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuration</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDesktopMenuOpen(false);
                      onOpenMasterData();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="font-bold">Master Data</div>
                      <div className="text-[10px] text-slate-400">Attendance, Categories & Modes</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsDesktopMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-50"
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-bold">App Settings</div>
                      <div className="text-[10px] text-slate-400">Company profile & backup</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Sub-nav */}
            {activeModule === 'attendance' && (
              <nav className="flex items-center gap-1 lg:gap-1.5 border-l border-slate-200 pl-3">
                {navItems.map((item) => {
                  const isActive = currentTab === item.id;
                  const isEmpTab = item.id === 'employees';
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer rounded-lg flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold'
                          : isEmpTab
                          ? 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {isEmpTab && <Users className="w-3.5 h-3.5" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Zone 3: Month Selector & Settings */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Month Period Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs sm:text-sm">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleSetCurrentMonth}
                title="Jump to current month"
                className="px-2 py-0.5 font-medium text-slate-800 hover:text-indigo-600 whitespace-nowrap cursor-pointer"
              >
                {getMonthLabel(selectedMonth)}
              </button>

              <button
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Install PWA Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              title="Install StaffPulse App on your device"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Install App</span>
            </button>
          </div>

        </div>

        {/* Mobile secondary navigation tab bar */}
        <div className="md:hidden flex flex-col py-2 border-t border-slate-100 gap-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => onSelectModule('attendance')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  activeModule === 'attendance' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => onSelectModule('accounting')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  activeModule === 'accounting' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Accounting
              </button>
            </div>

            {/* Mobile Settings Dropdown Menu */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsDesktopMenuOpen(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Settings & Master Data"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Settings</span>
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuration</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenMasterData();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="font-bold">Master Data</div>
                      <div className="text-[10px] text-slate-400">Attendance, Categories & Modes</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-50"
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-bold">App Settings</div>
                      <div className="text-[10px] text-slate-400">Company profile & backup</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeModule === 'attendance' && (
            <div className="relative flex items-center">
              {canScrollLeft && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center bg-gradient-to-r from-white via-white/90 to-transparent pr-4 pl-1 py-1 z-10">
                  <ChevronLeft className="w-4 h-4 text-slate-400 animate-pulse" />
                </div>
              )}
              <div ref={scrollContainerRef} className="flex items-center overflow-x-auto gap-1.5 scrollbar-none px-1 flex-1">
                {navItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {canScrollRight && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center bg-gradient-to-l from-white via-white/90 to-transparent pl-4 pr-1 py-1 z-10">
                  <ChevronRight className="w-4 h-4 text-slate-400 animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
