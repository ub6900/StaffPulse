import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Layers, 
  Tag, 
  CreditCard, 
  Check, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MasterDataConfig, MasterAttendanceType, MasterExpenseCategory, MasterPaymentMethod, AttendanceRecord, AccountingTransaction } from '../types';

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterData: MasterDataConfig;
  onUpdateMasterData: (updated: MasterDataConfig) => void;
  attendanceRecords: AttendanceRecord[];
  accountingTransactions: AccountingTransaction[];
  onUpdateAttendanceRecords: (records: AttendanceRecord[]) => void;
  onUpdateAccountingTransactions: (txs: AccountingTransaction[]) => void;
  initialTab?: 'attendance' | 'categories' | 'payments';
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  masterData,
  onUpdateMasterData,
  attendanceRecords,
  accountingTransactions,
  onUpdateAttendanceRecords,
  onUpdateAccountingTransactions,
  initialTab = 'attendance',
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'categories' | 'payments'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [data, setData] = useState<MasterDataConfig>({ ...masterData });

  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -180 : 180, behavior: 'smooth' });
    }
  };

  // Modal for adding/editing items
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<'attendance' | 'categories' | 'payments' | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('1.0');
  const [formName, setFormName] = useState('');
  const [formCategoryType, setFormCategoryType] = useState<'credit' | 'debit'>('debit');

  if (!isOpen) return null;

  const handleOpenAdd = (type: 'attendance' | 'categories' | 'payments') => {
    setEditingType(type);
    setEditItem(null);
    setFormCode('');
    setFormLabel('');
    setFormValue('1.0');
    setFormName('');
    setFormCategoryType('debit');
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (type: 'attendance' | 'categories' | 'payments', item: any) => {
    setEditingType(type);
    setEditItem(item);
    if (type === 'attendance') {
      setFormCode(item.code);
      setFormLabel(item.label);
      setFormValue(String(item.value));
    } else if (type === 'categories') {
      setFormName(item.name);
      setFormCategoryType(item.type);
    } else if (type === 'payments') {
      setFormName(item.name);
      setFormLabel(item.label);
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...data };

    if (editingType === 'attendance') {
      if (!formCode || !formLabel) return;
      const numVal = parseFloat(formValue);
      if (isNaN(numVal)) return;

      if (editItem) {
        updated.attendanceTypes = updated.attendanceTypes.map(it => 
          it.id === editItem.id ? { ...it, code: formCode, label: formLabel, value: numVal } : it
        );
      } else {
        const newItem: MasterAttendanceType = {
          id: `att-${Date.now()}`,
          code: formCode.toUpperCase(),
          label: formLabel,
          value: numVal,
        };
        updated.attendanceTypes = [...updated.attendanceTypes, newItem];
      }
    } else if (editingType === 'categories') {
      if (!formName) return;
      if (editItem) {
        updated.expenseCategories = updated.expenseCategories.map(it =>
          it.id === editItem.id ? { ...it, name: formName, type: formCategoryType } : it
        );
      } else {
        const newItem: MasterExpenseCategory = {
          id: `cat-${Date.now()}`,
          name: formName,
          type: formCategoryType,
        };
        updated.expenseCategories = [...updated.expenseCategories, newItem];
      }
    } else if (editingType === 'payments') {
      if (!formName || !formLabel) return;
      if (editItem) {
        updated.paymentMethods = updated.paymentMethods.map(it =>
          it.id === editItem.id ? { ...it, name: formName.toLowerCase(), label: formLabel } : it
        );
      } else {
        const newItem: MasterPaymentMethod = {
          id: `pm-${Date.now()}`,
          name: formName.toLowerCase().replace(/\s+/g, '_'),
          label: formLabel,
        };
        updated.paymentMethods = [...updated.paymentMethods, newItem];
      }
    }

    setData(updated);
    onUpdateMasterData(updated);
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (type: 'attendance' | 'categories' | 'payments', item: any) => {
    let connectedCount = 0;

    if (type === 'attendance') {
      // Check attendance records matching value or code/status
      connectedCount = attendanceRecords.filter(r => r.status === item.value || (r as any).statusLabel === item.label).length;
    } else if (type === 'categories') {
      connectedCount = accountingTransactions.filter(t => t.category === item.name).length;
    } else if (type === 'payments') {
      connectedCount = accountingTransactions.filter(t => t.paymentMethod === item.name).length;
    }

    const confirmMsg = connectedCount > 0
      ? `Warning: This master item is associated with ${connectedCount} existing record(s). Deleting it will also remove or reset those connected records to maintain data integrity. Proceed?`
      : `Are you sure you want to delete "${item.label || item.name || item.code}"?`;

    if (!confirm(confirmMsg)) return;

    const updated = { ...data };
    if (type === 'attendance') {
      updated.attendanceTypes = updated.attendanceTypes.filter(it => it.id !== item.id);
      // Clean up connected attendance records
      const cleanedAtt = attendanceRecords.map(r => {
        if (r.status === item.value) {
          return { ...r, status: 0.0 as any, note: `[Removed status ${item.label}]` };
        }
        return r;
      });
      onUpdateAttendanceRecords(cleanedAtt);
    } else if (type === 'categories') {
      updated.expenseCategories = updated.expenseCategories.filter(it => it.id !== item.id);
      // Remove connected accounting transactions or reassign category
      const cleanedTxs = accountingTransactions.filter(t => t.category !== item.name);
      onUpdateAccountingTransactions(cleanedTxs);
    } else if (type === 'payments') {
      updated.paymentMethods = updated.paymentMethods.filter(it => it.id !== item.id);
      const cleanedTxs = accountingTransactions.map(t => {
        if (t.paymentMethod === item.name) {
          return { ...t, paymentMethod: 'cash' }; // Fallback to cash
        }
        return t;
      });
      onUpdateAccountingTransactions(cleanedTxs);
    }

    setData(updated);
    onUpdateMasterData(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Master Data Management
              </h3>
              <p className="text-xs text-slate-500">
                Configure core application lookup tables, statuses, categories, and payment methods.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs with scroll indicators & arrow buttons */}
        <div className="relative flex items-center border-b border-slate-200 bg-slate-50/50 px-2 sm:px-4">
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white/80 hover:bg-white shadow-xs rounded-lg z-10 mr-1 shrink-0 cursor-pointer border border-slate-200 transition-colors"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={tabsRef}
            className="flex flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1 px-1"
          >
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Attendance Status Types</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                {data.attendanceTypes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Expense / Revenue Categories</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                {data.expenseCategories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Payment Modes</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                {data.paymentMethods.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white/80 hover:bg-white shadow-xs rounded-lg z-10 ml-1 shrink-0 cursor-pointer border border-slate-200 transition-colors"
            title="Scroll right for more items"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {activeTab === 'attendance' && 'Manage roll-call status codes, display labels, and multiplier values.'}
              {activeTab === 'categories' && 'Manage credit & debit transaction categories for accounting ledger.'}
              {activeTab === 'payments' && 'Manage accepted payment channels and settlement modes.'}
            </p>

            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  {activeTab === 'attendance' && (
                    <>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Label</th>
                      <th className="py-3 px-4">Multiplier Value</th>
                    </>
                  )}
                  {activeTab === 'categories' && (
                    <>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Type</th>
                    </>
                  )}
                  {activeTab === 'payments' && (
                    <>
                      <th className="py-3 px-4">System Key</th>
                      <th className="py-3 px-4">Display Label</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab === 'attendance' && data.attendanceTypes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.label}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{item.value}x</td>
                    <td className="py-3 px-4 text-center flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit('attendance', item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('attendance', item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete (Integrity check applied)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'categories' && data.expenseCategories.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit('categories', item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('categories', item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'payments' && data.paymentMethods.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600">{item.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.label}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit('payments', item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('payments', item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Data Integrity Notice: Deleting master items verifies and cascades cleanup on connected attendance records or transactions automatically.</span>
        </div>

      </div>

      {/* Add / Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-sm text-slate-900">
                {editItem ? 'Edit Master Item' : 'Add Master Item'}
              </h4>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 space-y-3">
              {editingType === 'attendance' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code / Symbol (e.g. P, H)</label>
                    <input
                      type="text"
                      maxLength={5}
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Display Label</label>
                    <input
                      type="text"
                      required
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Wage Multiplier Value (e.g. 1.0, 0.5, 0.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      required
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </>
              )}

              {editingType === 'categories' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={formCategoryType}
                      onChange={(e) => setFormCategoryType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-semibold"
                    >
                      <option value="credit">Credit (Inflow)</option>
                      <option value="debit">Debit (Expense)</option>
                    </select>
                  </div>
                </>
              )}

              {editingType === 'payments' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">System Key (e.g. bank, cash)</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Display Label</label>
                    <input
                      type="text"
                      required
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
