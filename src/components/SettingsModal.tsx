import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Download, Upload, Check } from 'lucide-react';
import { CompanySettings } from '../types';
import { storage } from '../utils/storage';
import { formatDateDDMMYYYY } from '../utils/calculations';

interface SettingsModalProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  isOpen,
  onClose,
}) => {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [address, setAddress] = useState(settings.employerAddress);
  const [taxId, setTaxId] = useState(settings.employerTaxId);
  const [currency, setCurrency] = useState(settings.currency);
  const [workingDaysMode, setWorkingDaysMode] = useState(settings.workingDaysMode);
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(settings.autoMarkAbsent ?? false);
  const [themeColor, setThemeColor] = useState<'indigo' | 'emerald' | 'slate' | 'amber'>(((settings.themeColor as any) || 'indigo'));
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>(((settings.tableDensity as any) || 'comfortable'));
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanySettings = {
      companyName: companyName.trim() || 'WorkLedger Employer',
      employerAddress: address.trim(),
      employerTaxId: taxId.trim(),
      currency: currency.trim() || '₹',
      workingDaysMode,
      standardShiftHours: settings.standardShiftHours || 8,
      autoMarkAbsent,
      themeColor,
      tableDensity,
    };
    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleExportBackup = () => {
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const todayFormatted = formatDateDDMMYYYY(new Date().toISOString().split('T')[0]);
    link.download = `WorkLedger_Backup_${todayFormatted}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && storage.importAllData(content)) {
        alert('Data successfully restored from backup! Reloading view...');
        window.location.reload();
      } else {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Employer Company & Payroll Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Company Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Company / Employer Business Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Precision Engineering Ltd."
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Business Address (For Payslips)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 42 Industrial Hub, Sector 4"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tax / Registration ID
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. TAX-991823"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Wage & Calculation Rules */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Payroll Calculation Logic
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono text-center font-bold"
                />
                <span className="text-[10px] text-slate-400">e.g. ₹, Rs., INR</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Standard Monthly Working Days
                </label>
                <select
                  value={workingDaysMode}
                  onChange={(e) => setWorkingDaysMode(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                >
                  <option value="standard_26">Fixed 26 Days / Month (Standard Industrial)</option>
                  <option value="standard_30">Fixed 30 Days / Month (Commercial)</option>
                  <option value="calendar_days">Actual Calendar Days (28-31 Days)</option>
                  <option value="exclude_sundays">Exclude Sundays in Month</option>
                </select>
              </div>
            </div>


          </div>



          {/* Backup, Restore & Reset */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Data Backup & Maintenance
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings Saved!
              </span>
            ) : (
              <span className="text-slate-400">Settings persist locally in your browser.</span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
