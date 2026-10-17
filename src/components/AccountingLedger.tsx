import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Wallet, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit2,
  X, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Share2,
  FileText,
  Loader2
} from 'lucide-react';
import { AccountingTransaction, AccountingType, CompanySettings, MasterDataConfig } from '../types';
import { formatDateDDMMYYYY } from '../utils/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface AccountingLedgerProps {
  transactions: AccountingTransaction[];
  onAddTransaction: (transaction: AccountingTransaction) => void;
  onUpdateTransaction: (transaction: AccountingTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  settings: CompanySettings;
  masterData?: MasterDataConfig;
  onUpdateMasterData?: (config: MasterDataConfig) => void;
  onOpenMasterData?: (tab: 'attendance' | 'categories' | 'payments') => void;
}

const CATEGORIES_CREDIT = [
  'Sales / Revenue',
  'Advance Recovery',
  'Client Deposit',
  'Other Income',
  'Capital Injection',
  'Loan Received',
];

const CATEGORIES_DEBIT = [
  'Raw Materials',
  'Staff Salaries & Wages',
  'Utilities & Power',
  'Rent & Lease',
  'Maintenance & Repairs',
  'Transportation & Logistics',
  'Office Supplies',
  'Miscellaneous Expense',
  'Loan Repayment',
];

export const AccountingLedger: React.FC<AccountingLedgerProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  settings,
  masterData,
  onUpdateMasterData,
  onOpenMasterData,
}) => {
  const creditCategories = masterData?.expenseCategories
    ? masterData.expenseCategories.filter(c => c.type === 'credit').map(c => c.name)
    : CATEGORIES_CREDIT;
  const debitCategories = masterData?.expenseCategories
    ? masterData.expenseCategories.filter(c => c.type === 'debit').map(c => c.name)
    : CATEGORIES_DEBIT;
  const paymentMethodsList = masterData?.paymentMethods || [
    { id: 'pm-1', name: 'cash', label: 'Cash' },
    { id: 'pm-2', name: 'bank', label: 'Bank Transfer' },
    { id: 'pm-3', name: 'upi', label: 'UPI' },
    { id: 'pm-4', name: 'cheque', label: 'Cheque' },
  ];
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AccountingType>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Period filters
  const [periodFilter, setPeriodFilter] = useState<'all' | 'day' | 'month' | 'custom'>('all');
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filterStartDate, setFilterStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modal form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AccountingTransaction | null>(null);

  // Quick Add Modals inside AccountingLedger
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [quickCategoryType, setQuickCategoryType] = useState<AccountingType>('debit');

  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState(false);
  const [quickPaymentKey, setQuickPaymentKey] = useState('');
  const [quickPaymentLabel, setQuickPaymentLabel] = useState('');

  const handleQuickAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim() || !masterData || !onUpdateMasterData) return;
    const catName = quickCategoryName.trim();
    const newCat = {
      id: `cat-${Date.now()}`,
      name: catName,
      type: quickCategoryType,
    };
    const updated = {
      ...masterData,
      expenseCategories: [...masterData.expenseCategories, newCat],
    };
    onUpdateMasterData(updated);
    setNewCategory(catName);
    setNewType(quickCategoryType);
    setQuickCategoryName('');
    setIsQuickCategoryModalOpen(false);
  };

  const handleQuickAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPaymentKey.trim() || !quickPaymentLabel.trim() || !masterData || !onUpdateMasterData) return;
    const keyName = quickPaymentKey.trim().toLowerCase().replace(/\s+/g, '_');
    const label = quickPaymentLabel.trim();
    const newPm = {
      id: `pm-${Date.now()}`,
      name: keyName,
      label: label,
    };
    const updated = {
      ...masterData,
      paymentMethods: [...masterData.paymentMethods, newPm],
    };
    onUpdateMasterData(updated);
    setNewMethod(keyName as any);
    setQuickPaymentKey('');
    setQuickPaymentLabel('');
    setIsQuickPaymentModalOpen(false);
  };

  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<AccountingType>('debit');
  const [newCategory, setNewCategory] = useState(CATEGORIES_DEBIT[0]);
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDescription, setNewDescription] = useState('');
  const [newMethod, setNewMethod] = useState<'cash' | 'bank' | 'upi' | 'cheque'>('cash');

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewType('debit');
    setNewCategory(CATEGORIES_DEBIT[0]);
    setNewAmount('');
    setNewDescription('');
    setNewMethod('cash');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: AccountingTransaction) => {
    setEditingTransaction(t);
    setNewDate(t.date);
    setNewType(t.type);
    setNewCategory(t.category);
    setNewAmount(String(t.amount));
    setNewDescription(t.description);
    setNewMethod(t.paymentMethod as any);
    setIsAddModalOpen(true);
  };

  // Filtered transactions for KPIs and table
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;

    let matchesPeriod = true;
    if (periodFilter === 'day') {
      matchesPeriod = t.date === filterDate;
    } else if (periodFilter === 'month') {
      matchesPeriod = t.date.startsWith(filterMonth);
    } else if (periodFilter === 'custom') {
      matchesPeriod = t.date >= filterStartDate && t.date <= filterEndDate;
    }

    return matchesSearch && matchesType && matchesMethod && matchesPeriod;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleGeneratePdfReport = async (action: 'download' | 'share') => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imgRatio = canvas.height / canvas.width;
      let renderWidth = availableWidth;
      let renderHeight = renderWidth * imgRatio;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = renderHeight / imgRatio;
      }

      const posX = margin + (availableWidth - renderWidth) / 2;
      const posY = margin + Math.max(0, (availableHeight - renderHeight) / 8);

      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

      const fileName = `Expense_Report_${periodFilter}_${new Date().toISOString().split('T')[0]}.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (action === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Expense & Revenue Report',
          text: `Financial report generated for ${settings.companyName}`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error generating PDF report:', err);
      alert('Could not generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Calculations based on filtered transactions
  const totalCredit = filteredTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = filteredTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalCredit - totalDebit;

  const handleTypeChange = (t: AccountingType) => {
    setNewType(t);
    if (t === 'credit') {
      setNewCategory(CATEGORIES_CREDIT[0]);
    } else {
      setNewCategory(CATEGORIES_DEBIT[0]);
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!newDescription.trim()) {
      alert('Please enter a description for this transaction.');
      return;
    }

    if (editingTransaction) {
      const updatedTx: AccountingTransaction = {
        ...editingTransaction,
        date: newDate,
        type: newType,
        category: newCategory,
        amount: amountNum,
        description: newDescription.trim(),
        paymentMethod: newMethod,
      };
      onUpdateTransaction(updatedTx);
    } else {
      const tx: AccountingTransaction = {
        id: `acc-${Date.now()}`,
        date: newDate,
        type: newType,
        category: newCategory,
        amount: amountNum,
        description: newDescription.trim(),
        paymentMethod: newMethod,
      };
      onAddTransaction(tx);
    }

    setIsAddModalOpen(false);
    setEditingTransaction(null);
    setNewAmount('');
    setNewDescription('');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Payment Method', 'Amount'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type.toUpperCase(),
      `"${t.category}"`,
      `"${t.description}"`,
      t.paymentMethod.toUpperCase(),
      t.amount,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Accounting_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Daily Debit & Credit Ledger
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Period & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Period Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                periodFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriodFilter('day')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                periodFilter === 'day' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Specific Day
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                periodFilter === 'month' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Specific Month
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                periodFilter === 'custom' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Specific Period Range
            </button>
          </div>

          {/* Period Inputs */}
          {periodFilter === 'day' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Date:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}

          {periodFilter === 'month' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Month:</span>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}

          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-xs font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('credit')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'credit' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Credit
              </button>
              <button
                onClick={() => setTypeFilter('debit')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'debit' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Debit
              </button>
            </div>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Credit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Credit (Cash In)
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {settings.currency} {totalCredit.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Inflows & Revenues</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Total Debit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Debit (Cash Out)
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {settings.currency} {totalDebit.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Expenses & Payments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Balance
            </p>
            <p className={`text-2xl font-black mt-1 ${netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {settings.currency} {netBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cumulative Cash Flow</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount ({settings.currency})</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No accounting entries found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {formatDateDDMMYYYY(t.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        t.type === 'credit'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={t.description}>
                      <div>{t.description}</div>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                      {t.paymentMethod}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold text-sm whitespace-nowrap ${
                      t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {t.type === 'credit' ? '+' : '-'} {t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this accounting entry?')) {
                            onDeleteTransaction(t.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredTransactions.length}</span> transaction(s) for the selected period.
        </div>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Add / Edit Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingTransaction ? 'Edit Accounting Entry' : 'New Accounting Entry'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('credit')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newType === 'credit'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('debit')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newType === 'debit'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Debit
                  </button>
                </div>
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Category
                    </label>
                    {masterData && onUpdateMasterData && (
                      <button
                        type="button"
                        onClick={() => setIsQuickCategoryModalOpen(true)}
                        className="p-0.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        title="Add new category"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  >
                    {newType === 'credit'
                      ? creditCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                      : debitCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                    }
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 font-mono"
                />
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Payment Mode
                  </label>
                  {masterData && onUpdateMasterData && (
                    <button
                      type="button"
                      onClick={() => setIsQuickPaymentModalOpen(true)}
                      className="p-0.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      title="Add new payment mode"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 uppercase"
                >
                  {paymentMethodsList.map((pm) => <option key={pm.name} value={pm.name}>{pm.label}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter details about this transaction..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingTransaction ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Report PDF Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Expense & Revenue Report Preview</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
              {/* Printable container */}
              <div ref={reportRef} className="bg-white p-8 rounded-xl shadow-xs border border-slate-200 space-y-6 text-slate-800">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">{settings.companyName}</h2>
                    <p className="text-xs text-slate-500">{settings.employerAddress} | Tax ID: {settings.employerTaxId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">Financial Ledger Report</span>
                    <p className="text-xs text-slate-500 mt-1">Generated: {formatDateDDMMYYYY(new Date().toISOString().split('T')[0])}</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-emerald-800">Total Credits (Revenue)</div>
                    <div className="text-base font-bold text-emerald-900 font-mono mt-1">{settings.currency}{totalCredit.toLocaleString()}</div>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-rose-800">Total Debits (Expenses)</div>
                    <div className="text-base font-bold text-rose-900 font-mono mt-1">{settings.currency}{totalDebit.toLocaleString()}</div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-indigo-800">Net Balance</div>
                    <div className="text-base font-bold text-indigo-900 font-mono mt-1">{settings.currency}{netBalance.toLocaleString()}</div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Transactions Summary ({filteredTransactions.length} entries)</h4>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Description</th>
                        <th className="py-2.5 px-3 font-semibold">Mode</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600">{formatDateDDMMYYYY(t.date)}</td>
                          <td className="py-2 px-3 font-semibold">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{t.category}</td>
                          <td className="py-2 px-3 text-slate-600">{t.description}</td>
                          <td className="py-2 px-3 uppercase text-slate-500 font-mono text-[10px]">{t.paymentMethod}</td>
                          <td className={`py-2 px-3 text-right font-mono font-bold ${t.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {t.type === 'credit' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleGeneratePdfReport('download')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Download className="w-4 h-4 text-slate-500" />}
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleGeneratePdfReport('share')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Share2 className="w-4 h-4 text-white" />}
                  <span>Share PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {isQuickCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add New Category</h3>
              <button
                onClick={() => setIsQuickCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddCategory} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Supplies"
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={quickCategoryType}
                  onChange={(e) => setQuickCategoryType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-semibold text-slate-900"
                >
                  <option value="credit">Credit (Inflow)</option>
                  <option value="debit">Debit (Expense)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Payment Mode Modal */}
      {isQuickPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add New Payment Mode</h3>
              <button
                onClick={() => setIsQuickPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddPayment} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Key (e.g. card, paypal)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. card"
                  value={quickPaymentKey}
                  onChange={(e) => setQuickPaymentKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Credit Card"
                  value={quickPaymentLabel}
                  onChange={(e) => setQuickPaymentLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Add Payment Mode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
