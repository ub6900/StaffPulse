import React, { useRef, useState } from 'react';
import { Download, X, Share2, Loader2, Check, AlertCircle } from 'lucide-react';
import { CompanySettings, Employee, PayrollItem } from '../types';
import {
  formatCurrency,
  getMonthLabel,
  getMonthLabelHindi,
  numberToWords,
  numberToWordsHindi,
  formatDateDDMMYYYY,
} from '../utils/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface PayslipModalProps {
  payrollItem: PayrollItem | null;
  employee: Employee | null;
  settings: CompanySettings;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  payrollItem,
  employee,
  settings,
  onClose,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!payrollItem || !employee) return null;

  const isHindi = language === 'hi';

  const generatePdfBlob = async (): Promise<{ blob: Blob; file: File; fileName: string }> => {
    if (!printableRef.current) throw new Error('Voucher element not found');

    // Render with html2canvas-pro enforcing standard document width
    // This ensures on mobile screens the PDF layout remains uncompressed and beautifully formatted
    const canvas = await html2canvas(printableRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (_clonedDoc, clonedElement) => {
        // Enforce standard document dimensions on the clone
        clonedElement.style.width = '780px';
        clonedElement.style.minWidth = '780px';
        clonedElement.style.maxWidth = '780px';
        clonedElement.style.padding = '36px 40px';
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.backgroundColor = '#ffffff';

        // Force employee info grid to 3 equal columns in clone
        const empGrid = clonedElement.querySelector('.emp-info-grid') as HTMLElement | null;
        if (empGrid) {
          empGrid.style.display = 'grid';
          empGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
          empGrid.style.gap = '16px';
        }

        // Force attendance grid to 6 equal columns in clone
        const attGrid = clonedElement.querySelector('.attendance-grid') as HTMLElement | null;
        if (attGrid) {
          attGrid.style.display = 'grid';
          attGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
          attGrid.style.gap = '8px';
        }

        // Force earnings & deductions to 2 equal columns in clone
        const tablesGrid = clonedElement.querySelector('.tables-grid') as HTMLElement | null;
        if (tablesGrid) {
          tablesGrid.style.display = 'grid';
          tablesGrid.style.gridTemplateColumns = '1fr 1fr';
          tablesGrid.style.gap = '20px';
        }

        // Force net salary container to clean flex row
        const netBox = clonedElement.querySelector('.net-salary-box') as HTMLElement | null;
        if (netBox) {
          netBox.style.display = 'flex';
          netBox.style.flexDirection = 'row';
          netBox.style.alignItems = 'center';
          netBox.style.justifyContent = 'space-between';
        }

        // Force signatures to 2 equal columns in clone
        const sigGrid = clonedElement.querySelector('.signatures-grid') as HTMLElement | null;
        if (sigGrid) {
          sigGrid.style.display = 'grid';
          sigGrid.style.gridTemplateColumns = '1fr 1fr';
          sigGrid.style.gap = '48px';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 12; // 12mm margins around the page
    const availableWidth = pageWidth - margin * 2; // 186mm
    const availableHeight = pageHeight - margin * 2; // 273mm

    // Calculate aspect ratio so image is never compressed, squished, or stretched
    const imgRatio = canvas.height / canvas.width;
    let renderWidth = availableWidth;
    let renderHeight = renderWidth * imgRatio;

    // Scale down proportionally if the voucher is taller than page bounds
    if (renderHeight > availableHeight) {
      renderHeight = availableHeight;
      renderWidth = renderHeight / imgRatio;
    }

    // Center horizontally with generous margins
    const posX = margin + (availableWidth - renderWidth) / 2;
    const posY = margin + Math.max(0, (availableHeight - renderHeight) / 8);

    pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

    const cleanCode = employee.code.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Payslip_${cleanCode}_${payrollItem.month}_${language.toUpperCase()}.pdf`;
    const blob = pdf.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });
    return { blob, file, fileName };
  };

  const handleSharePdf = async () => {
    setIsGenerating(true);
    setFeedbackMessage(null);
    setIsError(false);
    try {
      const { file, fileName, blob } = await generatePdfBlob();
      const monthTitle = isHindi ? getMonthLabelHindi(payrollItem.month) : getMonthLabel(payrollItem.month);
      const shareTitle = isHindi
        ? `वेतन पर्ची - ${employee.name} (${monthTitle})`
        : `Payslip - ${employee.name} (${payrollItem.month})`;
      const shareText = isHindi
        ? `वेतन पर्ची: ${employee.name} (${employee.code}) - ${monthTitle}। शुद्ध देय राशि: ${formatCurrency(payrollItem.netSalary, settings.currency)}`
        : `Salary voucher for ${employee.name} (${employee.code}) - ${getMonthLabel(payrollItem.month)}. Net Salary: ${formatCurrency(payrollItem.netSalary, settings.currency)}`;

      // Check if Web Share API with files is supported
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        setIsError(false);
        setFeedbackMessage(isHindi ? 'वेतन पर्ची PDF सफलतापूर्वक शेयर की गई!' : 'Payslip PDF shared successfully!');
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        // Native share supported for text, download file simultaneously
        const fileUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(fileUrl);

        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        setIsError(false);
        setFeedbackMessage(isHindi ? 'PDF डाउनलोड हो गई और शेयर मेनू खुल गया!' : 'PDF downloaded and share menu opened!');
      } else {
        // Direct download fallback
        const fileUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(fileUrl);
        setIsError(false);
        setFeedbackMessage(isHindi ? 'PDF सीधे आपके डिवाइस पर डाउनलोड हो गई!' : 'PDF downloaded directly to your device!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share PDF error:', err);
        setIsError(true);
        setFeedbackMessage(isHindi ? 'PDF शेयर करने में विफल। कृपया डाउनलोड करें।' : 'Failed to share PDF. Please try downloading instead.');
      }
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFeedbackMessage(null), 4500);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setIsError(false);
    try {
      const { blob, fileName } = await generatePdfBlob();
      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(fileUrl);
      setIsError(false);
      setFeedbackMessage(isHindi ? 'वेतन पर्ची PDF सफलतापूर्वक डाउनलोड हो गई!' : 'PDF downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      setIsError(true);
      setFeedbackMessage(isHindi ? 'PDF डाउनलोड विफल। कृपया पुनः प्रयास करें।' : 'Failed to download PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const periodLabel = isHindi ? getMonthLabelHindi(payrollItem.month) : getMonthLabel(payrollItem.month);
  const wordsAmount = isHindi
    ? `${numberToWordsHindi(payrollItem.netSalary)} ${settings.currency === '₹' ? 'रुपये' : settings.currency} मात्र`
    : `${numberToWords(payrollItem.netSalary)} ${
        settings.currency === '₹' ? 'Rupees' : settings.currency === '$' ? 'Dollars' : settings.currency
      } Only`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-4 sm:my-6 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Dialog Header Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {isHindi ? 'वेतन पर्ची पूर्वावलोकन' : 'Salary Voucher Preview'}
            </span>
            <span className="text-xs text-slate-400">({payrollItem.month})</span>
          </div>

          <div className="flex items-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg ml-1 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner if share or download triggered */}
        {feedbackMessage && (
          <div
            className={`border-b px-6 py-2.5 flex items-center justify-between text-xs font-medium shrink-0 ${
              isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              ) : (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
              <span>{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="hover:opacity-75 cursor-pointer ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Printable Payslip Preview Body */}
        <div className="overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-slate-100 flex-1">
          <div
            ref={printableRef}
            className="p-6 sm:p-8 space-y-5 bg-white text-slate-900 rounded-lg shadow-xs border border-slate-200 mx-auto max-w-[740px]"
          >
            {/* Header Section */}
            <div className="flex flex-row items-start justify-between border-b-2 border-slate-900 pb-4 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {settings.companyName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{settings.employerAddress}</p>
                {settings.employerTaxId && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi ? 'कर / GSTIN पहचान: ' : 'Tax ID: '}{settings.employerTaxId}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider rounded border border-slate-200">
                  {isHindi ? 'मासिक वेतन पर्ची' : 'Monthly Payslip'}
                </span>
                <div className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 font-mono">
                  {periodLabel}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {isHindi ? 'संदर्भ: ' : 'Ref: '}PAY-{payrollItem.month.replace('-', '')}-{employee.code.replace('EMP-', '')}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {isHindi ? 'जारी करने की तिथि: ' : 'Issue Date: '}{formatDateDDMMYYYY(new Date().toISOString().split('T')[0])}
                </div>
              </div>
            </div>

            {/* Employee Identification Grid */}
            <div className="emp-info-grid grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="block text-slate-400 font-medium">
                  {isHindi ? 'कर्मचारी का नाम' : 'Employee Name'}
                </span>
                <strong className="text-slate-900 text-sm block mt-0.5">{employee.name}</strong>
              </div>

              <div>
                <span className="block text-slate-400 font-medium">
                  {isHindi ? 'कर्मचारी कोड' : 'Employee ID'}
                </span>
                <strong className="text-slate-900 font-mono text-sm block mt-0.5">{employee.code}</strong>
              </div>

              <div>
                <span className="block text-slate-400 font-medium">
                  {isHindi ? 'विभाग' : 'Department'}
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5">{employee.department}</span>
              </div>
            </div>

            {/* Attendance Breakdown Summary */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                {isHindi ? 'मासिक उपस्थिति सारांश' : 'Monthly Attendance Summary'}
              </h4>
              <div className="attendance-grid grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 border border-slate-200 rounded-md bg-white">
                  <span className="block text-[10px] text-slate-400">
                    {isHindi ? 'मानक दिन' : 'Standard'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{payrollItem.standardWorkingDays}d</span>
                </div>
                <div className="p-2 border border-emerald-200 rounded-md bg-emerald-50/70">
                  <span className="block text-[10px] text-emerald-700 font-medium">
                    {isHindi ? 'पूरा दिन (1.0)' : 'Full (1.0)'}
                  </span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{payrollItem.fullDays}</span>
                </div>
                <div className="p-2 border border-amber-200 rounded-md bg-amber-50/70">
                  <span className="block text-[10px] text-amber-700 font-medium">
                    {isHindi ? 'आधा दिन (0.5)' : 'Half (0.5)'}
                  </span>
                  <span className="font-mono font-bold text-amber-800 text-sm">{payrollItem.halfDays}</span>
                </div>
                <div className="p-2 border border-indigo-200 rounded-md bg-indigo-50/70">
                  <span className="block text-[10px] text-indigo-700 font-medium">
                    {isHindi ? 'दोहरा दिन (2.0)' : 'Double (2.0)'}
                  </span>
                  <span className="font-mono font-bold text-indigo-800 text-sm">{payrollItem.doubleDays}</span>
                </div>
                <div className="p-2 border border-rose-200 rounded-md bg-rose-50/70">
                  <span className="block text-[10px] text-rose-700 font-medium">
                    {isHindi ? 'अनुपस्थित (0.0)' : 'Absent (0.0)'}
                  </span>
                  <span className="font-mono font-bold text-rose-800 text-sm">{payrollItem.absentDays}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-md bg-slate-100 font-medium">
                  <span className="block text-[10px] text-slate-700 font-bold">
                    {isHindi ? 'कुल देय दिन' : 'Payable'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{payrollItem.payableDays.toFixed(1)}d</span>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Two-Column Layout */}
            <div className="tables-grid grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* Earnings Column */}
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800">
                    {isHindi ? 'आय / अर्जित वेतन (Earnings)' : 'Earnings'}
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="px-3.5 py-2 flex justify-between items-center">
                      <span className="text-slate-600">
                        {isHindi ? 'मूल मासिक वेतन' : 'Base Monthly Salary'}
                      </span>
                      <span className="font-mono">{formatCurrency(payrollItem.baseSalary, settings.currency)}</span>
                    </div>
                    <div className="px-3.5 py-2 flex justify-between items-center font-semibold bg-slate-50/40">
                      <span className="text-slate-800">
                        {isHindi
                          ? `अर्जित मूल वेतन (${payrollItem.payableDays.toFixed(1)} दिन)`
                          : `Earned Basic (${payrollItem.payableDays.toFixed(1)} days)`}
                      </span>
                      <span className="font-mono">{formatCurrency(payrollItem.earnedBaseSalary, settings.currency)}</span>
                    </div>
                    {payrollItem.defaultAllowance > 0 && (
                      <div className="px-3.5 py-2 flex justify-between items-center">
                        <span className="text-slate-600">
                          {isHindi ? 'अवकाश / विशेष भत्ता' : 'Holiday Allowance'}
                        </span>
                        <span className="font-mono">+{formatCurrency(payrollItem.defaultAllowance, settings.currency)}</span>
                      </div>
                    )}
                    {payrollItem.bonusAdjustments > 0 && (
                      <div className="px-3.5 py-2 flex justify-between items-center text-emerald-700 font-semibold">
                        <span>{isHindi ? 'बोनस एवं प्रोत्साहन' : 'Bonus & Incentives'}</span>
                        <span className="font-mono">+{formatCurrency(payrollItem.bonusAdjustments, settings.currency)}</span>
                      </div>
                    )}
                    {payrollItem.reimbursements > 0 && (
                      <div className="px-3.5 py-2 flex justify-between items-center">
                        <span className="text-slate-600">
                          {isHindi ? 'प्रतिपूर्ति एवं भत्ते' : 'Reimbursements'}
                        </span>
                        <span className="font-mono">+{formatCurrency(payrollItem.reimbursements, settings.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 px-3.5 py-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-xs">
                  <span>{isHindi ? 'कुल सकल आय (Total Gross)' : 'Total Gross Earnings'}</span>
                  <span className="font-mono text-sm text-slate-900">
                    {formatCurrency(payrollItem.grossSalary, settings.currency)}
                  </span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800">
                    {isHindi ? 'कटौती विवरण (Deductions)' : 'Deductions'}
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {payrollItem.advanceDeduction > 0 ? (
                      <div className="px-3.5 py-2 flex justify-between items-center text-amber-800 font-semibold bg-amber-50/50">
                        <span>{isHindi ? 'अग्रिम कटौती (Advance)' : 'Advance Recovery'}</span>
                        <span className="font-mono">-{formatCurrency(payrollItem.advanceDeduction, settings.currency)}</span>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 flex justify-between items-center text-slate-400">
                        <span>{isHindi ? 'अग्रिम कटौती (Advance)' : 'Advance Recovery'}</span>
                        <span className="font-mono">{formatCurrency(0, settings.currency)}</span>
                      </div>
                    )}
                    {payrollItem.defaultDeduction > 0 && (
                      <div className="px-3.5 py-2 flex justify-between items-center">
                        <span className="text-slate-600">
                          {isHindi ? 'मानक कटौती' : 'Standard Deductions'}
                        </span>
                        <span className="font-mono">-{formatCurrency(payrollItem.defaultDeduction, settings.currency)}</span>
                      </div>
                    )}
                    {payrollItem.penaltyAdjustments > 0 && (
                      <div className="px-3.5 py-2 flex justify-between items-center text-rose-700">
                        <span>{isHindi ? 'जुर्माना / क्षतिपूर्ति' : 'Penalties / Damages'}</span>
                        <span className="font-mono">-{formatCurrency(payrollItem.penaltyAdjustments, settings.currency)}</span>
                      </div>
                    )}
                    {payrollItem.otherDeductions > 0 && (
                      <div className="px-3.5 py-2 flex justify-between items-center text-slate-600">
                        <span>{isHindi ? 'अन्य कटौती' : 'Other Deductions'}</span>
                        <span className="font-mono">-{formatCurrency(payrollItem.otherDeductions, settings.currency)}</span>
                      </div>
                    )}
                    {employee.advanceBalance > 0 && (
                      <div className="px-3.5 py-1.5 text-[10px] text-amber-700 bg-amber-50/30">
                        {isHindi ? 'शेष अग्रिम बकाया: ' : 'Remaining Advance Balance: '}
                        {formatCurrency(Math.max(0, employee.advanceBalance - (payrollItem.paymentStatus === 'paid' ? 0 : payrollItem.advanceDeduction)), settings.currency)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 px-3.5 py-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-xs">
                  <span>{isHindi ? 'कुल कटौती (Total Deductions)' : 'Total Deductions'}</span>
                  <span className="font-mono text-sm text-rose-700">
                    -{formatCurrency(payrollItem.totalDeductions, settings.currency)}
                  </span>
                </div>
              </div>

            </div>

            {/* Net Salary Payable Banner */}
            <div className="net-salary-box p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg flex flex-row items-center justify-between gap-3">
              <div>
                <span className="block text-xs uppercase font-bold tracking-wider text-emerald-800">
                  {isHindi ? 'शुद्ध देय वेतन (Net Salary Payable)' : 'Net Salary Payable'}
                </span>
                <span className="text-xs text-emerald-700 italic block mt-0.5 font-medium leading-relaxed">
                  {isHindi ? 'अक्षरों में राशि: ' : 'Amount in words: '}{wordsAmount}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-900 block">
                  {formatCurrency(payrollItem.netSalary, settings.currency)}
                </span>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {isHindi ? (
                    <>
                      स्थिति: {payrollItem.paymentStatus === 'paid' ? 'भुगतान पूर्ण (PAID)' : 'लंबित (PENDING)'}{' '}
                      {payrollItem.paymentMethod &&
                        `(${
                          payrollItem.paymentMethod === 'bank_transfer'
                            ? 'बैंक ट्रांसफर'
                            : payrollItem.paymentMethod === 'cash'
                            ? 'नकद'
                            : payrollItem.paymentMethod === 'upi'
                            ? 'UPI'
                            : 'चेक'
                        })`}
                    </>
                  ) : (
                    <>Status: {payrollItem.paymentStatus.toUpperCase()} {payrollItem.paymentMethod && `via ${payrollItem.paymentMethod.replace('_', ' ')}`}</>
                  )}
                </div>
              </div>
            </div>

            {/* Signatures & Footer */}
            <div className="signatures-grid pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-2">
                <span className="font-semibold text-slate-800">
                  {isHindi ? 'नियोक्ता / अधिकृत हस्ताक्षर' : 'Employer / Authorized Signature'}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{settings.companyName}</p>
              </div>

              <div className="border-t border-slate-300 pt-2">
                <span className="font-semibold text-slate-800">
                  {isHindi ? 'कर्मचारी के हस्ताक्षर' : 'Employee Signature'}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isHindi ? 'सधन्यवाद प्राप्त किया' : 'Received with thanks'}
                </p>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-100">
              {isHindi
                ? 'यह कंप्यूटर द्वारा जनरेट की गई वेतन पर्ची है और इसे भौतिक हस्ताक्षर की आवश्यकता नहीं है।'
                : 'This is a computer-generated salary slip and does not require a physical signature if digitally authorized.'}
            </div>

          </div>
        </div>

        {/* Bottom Dialog Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Language Selector on Bottom */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              {isHindi ? 'भाषा (Language):' : 'Language:'}
            </span>
            <div className="flex items-center bg-slate-200/90 p-0.5 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  language === 'hi'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>हिंदी</span>
                <span className="text-[10px] opacity-90">(Hindi)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              {isHindi ? 'बंद करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHindi ? 'PDF डाउनलोड करें' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleSharePdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isHindi ? 'PDF तैयार हो रही है...' : 'Preparing PDF...'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'सीधे PDF शेयर करें' : 'Share PDF Directly'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
