import React, { useState, useEffect } from 'react';
import { Supplier, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../services/storage';
import { X, CreditCard, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSupplierId?: string;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultSupplierId
}) => {
  const { suppliers, treasurySummary, recordSupplierPayment } = useApp();

  const [supplierId, setSupplierId] = useState(defaultSupplierId || '');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultSupplierId) {
      setSupplierId(defaultSupplierId);
    } else if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
    setDate(getTodayDateString());
    setAmount('');
    setNotes('');
    setErrorMsg(null);
  }, [defaultSupplierId, isOpen, suppliers]);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const numAmount = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!supplierId) {
      setErrorMsg('يرجى اختيار المورد المراد سداد الدفعة له');
      return;
    }
    if (numAmount <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (numAmount > treasurySummary.balance) {
      setErrorMsg(`رصيد الخزينة المتاح (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لإتمام هذه الدفعة!`);
      return;
    }

    setIsSubmitting(true);
    const result = await recordSupplierPayment({
      supplierId,
      amount: numAmount,
      paymentMethod,
      date,
      notes: notes.trim()
    });

    setIsSubmitting(false);
    if (!result.success) {
      setErrorMsg(result.error || 'فشلت عملية السداد');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              سداد دفعة لمورد
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Available Treasury Banner */}
        <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              الرصيد المتاح بالخزينة:
            </span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            {treasurySummary.balance.toLocaleString()} ج.م
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Supplier Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              المورد <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- اختر المورد --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (المتبقي له: {s.remainingBalance.toLocaleString()} ج.م)
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Current Balance Preview */}
          {selectedSupplier && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs">
              <span className="text-amber-800 dark:text-amber-300 font-medium">
                إجمالي الدين الحالي للمورد:
              </span>
              <span className="font-extrabold text-amber-900 dark:text-amber-200">
                {selectedSupplier.remainingBalance.toLocaleString()} ج.م
              </span>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              مبلغ الدفعة (ج.م) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              طريقة الدفع <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'cash', label: 'نقدي (Cash)' },
                  { id: 'vodafone_cash', label: 'فودافون كاش' },
                  { id: 'instapay', label: 'إنستاباي' }
                ] as const
              ).map((method) => (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                    paymentMethod === method.id
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date (no time!) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              تاريخ السداد <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظات الدفعة (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: دفعة تحت حساب توريد الأسبوع"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || numAmount > treasurySummary.balance}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد السداد والخصم من الخزينة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
