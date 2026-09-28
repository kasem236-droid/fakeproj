import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Send, AlertTriangle, CheckCircle2, User, DollarSign, Calendar, FileText } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';

interface NewExternalTransferModalProps {
  onClose: () => void;
  initialRecipientName?: string;
  onSuccess?: (recipientName: string) => void;
}

export const NewExternalTransferModal: React.FC<NewExternalTransferModalProps> = ({
  onClose,
  initialRecipientName = '',
  onSuccess
}) => {
  const { externalRecipients, treasurySummary, addExternalTransfer } = useApp();

  const [recipientName, setRecipientName] = useState(initialRecipientName);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => getTodayDateString());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggestions filtered by what user types
  const suggestions = externalRecipients.filter(r =>
    recipientName.trim() &&
    r.name.toLowerCase().includes(recipientName.trim().toLowerCase()) &&
    r.name.toLowerCase() !== recipientName.trim().toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = recipientName.trim();
    if (!cleanName) {
      setError('يرجى إدخال اسم المستلم (مثل: أيمن)');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (amountNum > treasurySummary.balance) {
      setError(
        `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لإتمام هذا التحويل`
      );
      return;
    }

    setIsSubmitting(true);
    const res = await addExternalTransfer({
      recipientName: cleanName,
      amount: amountNum,
      date,
      note: note.trim() || undefined
    });
    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) {
        onSuccess(cleanName);
      }
      onClose();
    } else {
      setError(res.error || 'فشل إجراء التحويل الخارجي');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                إنشاء تحويل خارجي جديد
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                خصم فوري من الخزينة وتحديث كشف حساب المستلم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Treasury Balance Pill */}
        <div className="px-4 pt-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
            <span className="text-emerald-800 dark:text-emerald-300 font-bold">
              رصيد الخزينة المتاح حالياً:
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono text-sm">
              {treasurySummary.balance.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transfer Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Recipient Name */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم المستلم <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="أدخل اسم المستلم (مثل: أيمن، محمد...)"
                className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Auto-suggest dropdown if matching existing recipients */}
            {suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden max-h-32 overflow-y-auto">
                <div className="text-[10px] px-3 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-500 font-bold">
                  مستلمون مسجلون سابقاً:
                </div>
                {suggestions.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setRecipientName(rec.name)}
                    className="w-full text-right px-3 py-1.5 text-xs hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold">{rec.name}</span>
                    {rec.phone && <span className="text-[10px] text-slate-400">{rec.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount & Date in grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المبلغ (ج.م) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full py-2.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                التاريخ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات أو بيان التحويل (اختياري)
            </label>
            <div className="relative">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="مثال: دفعة تحت الحساب، مصاريف..."
                className="w-full py-2.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التحويل...' : 'تأكيد التحويل والخصم'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
