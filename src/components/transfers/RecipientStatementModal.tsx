import React, { useState, useMemo } from 'react';
import { ExternalRecipient, TreasuryTransaction } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Share2,
  Printer,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Plus,
  ArrowRight,
  CheckCircle2,
  Copy,
  Receipt,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface RecipientStatementModalProps {
  recipient: ExternalRecipient;
  onClose: () => void;
  onOpenNewTransfer?: (recipientName: string) => void;
}

type ViewMode = 'view' | 'preview';

export const RecipientStatementModal: React.FC<RecipientStatementModalProps> = ({
  recipient,
  onClose,
  onOpenNewTransfer
}) => {
  const { treasuryTransactions, addExternalTransfer, treasurySummary } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Quick transfer modal inside statement
  const [isQuickTransferOpen, setIsQuickTransferOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickNote, setQuickNote] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all transfers made to this recipient
  const recipientTransfers = useMemo(() => {
    return treasuryTransactions.filter(
      (tx) =>
        tx.type === 'external_transfer' &&
        (tx.relatedSupplierId === recipient.id ||
          tx.sourceOrRecipient.trim().toLowerCase() === recipient.name.trim().toLowerCase())
    );
  }, [treasuryTransactions, recipient]);

  // Chronological transaction history (oldest to newest for chronological flow)
  const chronologicalTransfers = useMemo(() => {
    return [...recipientTransfers].sort((a, b) => a.date.localeCompare(b.date));
  }, [recipientTransfers]);

  // Total amount transferred to this recipient
  const totalAmountTransferred = useMemo(() => {
    return recipientTransfers.reduce((sum, tx) => sum + tx.amount, 0);
  }, [recipientTransfers]);

  // Format Statement text for Android Sharing
  const formatStatementShareText = (): string => {
    const today = new Date().toISOString().split('T')[0];
    let text = `════════════════════════════════\n`;
    text += ` كشف حساب تحويلات خارجية - Fake \n`;
    text += `════════════════════════════════\n`;
    text += `المستلم: ${recipient.name}\n`;
    if (recipient.phone) text += `الهاتف: ${recipient.phone}\n`;
    text += `تاريخ الاستخراج: ${today}\n`;
    text += `إجمالي المبالغ المحولة: ${totalAmountTransferred.toLocaleString('ar-EG')} ج.م\n`;
    text += `إجمالي عدد العمليات: ${recipientTransfers.length}\n`;
    text += `────────────────────────────────\n`;
    text += `سجل العمليات (مرتب زمنياً):\n`;

    if (chronologicalTransfers.length === 0) {
      text += `لا توجد تحويلات مسجلة بعد.\n`;
    } else {
      chronologicalTransfers.forEach((tx, idx) => {
        text += `${idx + 1}. التاريخ: ${tx.date}\n`;
        text += `   المبلغ: ${tx.amount.toLocaleString('ar-EG')} ج.م\n`;
        if (tx.note) text += `   البيان: ${tx.note}\n`;
      });
    }

    text += `════════════════════════════════\n`;
    text += `تم الاستخراج بواسطة تطبيق إدارة الأعمال Fake`;
    return text;
  };

  // Android System Share
  const handleShare = async () => {
    const shareText = formatStatementShareText();
    const shareTitle = `كشف حساب تحويلات - ${recipient.name}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText
        });
        setShareSuccess('تمت المشاركة بنجاح عبر النظام');
        setTimeout(() => setShareSuccess(null), 3500);
        return;
      } catch (err: unknown) {
        // Fall back if user cancelled or error
        if ((err as Error)?.name !== 'AbortError') {
          // fallback to clipboard
        }
      }
    }

    // Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess('تم نسخ كشف الحساب للحافظة لمشاركته');
      setTimeout(() => setShareSuccess(null), 3500);
    } catch {
      setShareSuccess('تعذر النسخ تلقائياً، يرجى النسخ اليدوي');
      setTimeout(() => setShareSuccess(null), 3500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    const amountNum = parseFloat(quickAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setQuickError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (amountNum > treasurySummary.balance) {
      setQuickError(`رصيد الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي`);
      return;
    }

    setIsSubmitting(true);
    const res = await addExternalTransfer({
      recipientId: recipient.id,
      recipientName: recipient.name,
      amount: amountNum,
      date: quickDate,
      note: quickNote.trim() || undefined
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsQuickTransferOpen(false);
      setQuickAmount('');
      setQuickNote('');
      setShareSuccess(`تم تسجيل تحويل بمبلغ ${amountNum.toLocaleString()} ج.م بنجاح`);
      setTimeout(() => setShareSuccess(null), 3500);
    } else {
      setQuickError(res.error || 'حدث خطأ أثناء إجراء التحويل');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
              {recipient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {recipient.name}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  كشف حساب
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {recipient.phone ? `هاتف: ${recipient.phone} • ` : ''}
                {chronologicalTransfers.length} عملية تحويل
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast inside modal */}
        {shareSuccess && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{shareSuccess}</span>
          </div>
        )}

        {/* View / Preview Toggle Tabs */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setViewMode('view')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'view'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>عرض (View)</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>معاينة (Preview)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              title="مشاركة عبر تطبيق أندرويد"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة (Share)</span>
            </button>

            <button
              onClick={() => setIsQuickTransferOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              title="إجراء تحويل جديد لهذا المستلم"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تحويل جديد</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Transfer Form (Collapsible) */}
          {isQuickTransferOpen && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  تحويل مالي سريع إلى: {recipient.name}
                </span>
                <button
                  onClick={() => setIsQuickTransferOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>

              {quickError && (
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  {quickError}
                </div>
              )}

              <form onSubmit={handleQuickTransferSubmit} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      المبلغ (ج.م) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      التاريخ *
                    </label>
                    <input
                      type="date"
                      required
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="ملاحظات أو سبب التحويل..."
                    className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري التحويل...' : 'تأكيد الخصم والتحويل'}
                </button>
              </form>
            </div>
          )}

          {/* MODE 1: VIEW (عرض كشف الحساب) */}
          {viewMode === 'view' && (
            <div className="space-y-4">
              {/* Financial Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs opacity-90">
                  <span>إجمالي المبالغ المحولة لهذا الحساب</span>
                  <span className="font-mono bg-white/20 px-2 py-0.5 rounded-full">
                    {chronologicalTransfers.length} تحويلات
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  {totalAmountTransferred.toLocaleString('ar-EG')} <span className="text-sm font-bold">ج.م</span>
                </div>
                <div className="text-[11px] pt-1 border-t border-white/20 flex items-center justify-between opacity-85">
                  <span>تاريخ أول تحويل: {chronologicalTransfers[0]?.date || '—'}</span>
                  <span>آخر تحويل: {chronologicalTransfers[chronologicalTransfers.length - 1]?.date || '—'}</span>
                </div>
              </div>

              {/* Chronological List of Transfers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    السجل الزمني للتحويلات (Chronological History)
                  </h3>
                  <span className="text-[10px] text-slate-400">مرتب حسب تاريخ التحويل</span>
                </div>

                {chronologicalTransfers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <Send className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      لا توجد تحويلات مسجلة للمستلم {recipient.name}
                    </p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      اضغط على &ldquo;تحويل جديد&rdquo; لإجراء أول تحويل مالي
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chronologicalTransfers.map((tx, index) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{tx.note || `تحويل خارجي`}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3" />
                                {tx.date}
                              </span>
                              <span>•</span>
                              <span>الرصيد بعد: {tx.balanceAfter?.toLocaleString() || 0} ج.م</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                            - {tx.amount.toLocaleString('ar-EG')}{' '}
                            <span className="text-[10px] font-bold">ج.م</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: PREVIEW (معاينة كشف الحساب الرسمي) */}
          {viewMode === 'preview' && (
            <div className="space-y-3">
              <div className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-slate-300 shadow-md font-sans space-y-4 print:p-0 print:border-none print:shadow-none">
                {/* Official Statement Header */}
                <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                  <h1 className="text-lg font-black tracking-wide text-slate-900">
                    كشف حساب تحويلات مالية
                  </h1>
                  <p className="text-xs font-bold text-slate-600">
                    تطبيق Fake لإدارة الأعمال والمالية
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}
                  </p>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[11px] block">اسم المستلم:</span>
                    <strong className="text-sm font-black text-slate-900">{recipient.name}</strong>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-500 text-[11px] block">رقم الهاتف:</span>
                    <strong className="font-mono text-xs">{recipient.phone || 'غير مسجل'}</strong>
                  </div>
                </div>

                {/* Statement Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700">
                        <th className="py-2 px-2 font-black">#</th>
                        <th className="py-2 px-2 font-black">التاريخ</th>
                        <th className="py-2 px-2 font-black">البيان / الملاحظات</th>
                        <th className="py-2 px-2 font-black text-left">المبلغ (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {chronologicalTransfers.map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-2 px-2 font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-2 font-mono">{tx.date}</td>
                          <td className="py-2 px-2 text-slate-700">{tx.note || 'تحويل خارجي'}</td>
                          <td className="py-2 px-2 text-left font-black text-slate-900">
                            {tx.amount.toLocaleString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                      {chronologicalTransfers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            لا توجد تحويلات مسجلة لهذا الحساب
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 bg-slate-100 font-black">
                        <td colSpan={3} className="py-2.5 px-2 text-slate-900">
                          إجمالي المبالغ المحولة:
                        </td>
                        <td className="py-2.5 px-2 text-left text-sm text-emerald-700">
                          {totalAmountTransferred.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signature / Note Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <div>
                    <span>توقيع وختم الإدارة: </span>
                    <span className="font-bold text-slate-800">إدارة Fake المالية</span>
                  </div>
                  <div>
                    <span className="font-mono">معتمد نظاماً</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Preview */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة كشف الحساب عبر أندرويد</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            حساب: <strong className="text-slate-800 dark:text-slate-200">{recipient.name}</strong>
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
