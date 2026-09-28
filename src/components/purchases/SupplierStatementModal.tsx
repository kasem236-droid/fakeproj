import React, { useState } from 'react';
import { Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Share2, MessageCircle, FileText, Calendar, Building2, CreditCard, ArrowDownRight, ArrowUpRight, Copy, Check } from 'lucide-react';

interface SupplierStatementModalProps {
  supplier: Supplier | null;
  onClose: () => void;
  onMakePayment: (supplierId: string) => void;
}

export const SupplierStatementModal: React.FC<SupplierStatementModalProps> = ({
  supplier,
  onClose,
  onMakePayment
}) => {
  const { getSupplierStatement } = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!supplier) return null;

  const statements = getSupplierStatement(supplier.id);

  const generateShareText = () => {
    let text = `📊 *كشف حساب مورد: ${supplier.name}*\n`;
    if (supplier.phone) text += `📞 *الهاتف:* ${supplier.phone}\n`;
    text += `💰 *إجمالي المسحوبات:* ${supplier.totalDebt.toLocaleString()} ج.م\n`;
    text += `💵 *إجمالي المسدد:* ${supplier.totalPaid.toLocaleString()} ج.م\n`;
    text += `📌 *الرصيد المتبقي المستحق:* ${supplier.remainingBalance.toLocaleString()} ج.م\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n`;
    text += `*حركة المعاملات المالية (مرتبة بالتاريخ):*\n`;

    if (statements.length === 0) {
      text += `لا توجد حركات مسجلة حتى الآن.\n`;
    } else {
      statements.forEach((st, idx) => {
        const isInvoice = st.type === 'invoice';
        const typeLabel = isInvoice ? `فاتورة شراء ${st.invoiceNumber || ''}` : `دفعة مسددة (${st.paymentMethod === 'cash' ? 'نقدي' : st.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستاباي'})`;
        const amount = isInvoice ? `+${st.invoiceAmount?.toLocaleString()} ج.م` : `-${st.paymentAmount?.toLocaleString()} ج.م`;
        text += `${idx + 1}. [${st.date}] ${typeLabel} | المبلغ: ${amount} | الرصيد بعد الحركة: ${st.balanceAfter.toLocaleString()} ج.م\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━\n`;
    text += `*صادر من تطبيق Fake*`;
    return text;
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `كشف حساب المورد ${supplier.name}`,
          text: text
        });
        setFeedback('تمت المشاركة بنجاح');
        setTimeout(() => setFeedback(null), 3000);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') console.warn(err);
      }
    }

    // Fallback: clipboard
    try {
      await navigator.clipboard.writeText(text);
      setFeedback('تم نسخ كشف الحساب للحافظة');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('يرجى نسخ النص يدوياً');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                كشف حساب المورد: {supplier.name}
              </h3>
              <p className="text-[10px] text-slate-400">سجل المعاملات والمدفوعات الزمني</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className="mb-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
            <span>{feedback}</span>
            <Check className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">إجمالي الفواتير</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {supplier.totalDebt.toLocaleString()} ج.م
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">إجمالي المسدد</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {supplier.totalPaid.toLocaleString()} ج.م
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 block mb-0.5">المتبقي له</span>
            <span className="text-xs font-black text-amber-800 dark:text-amber-200">
              {supplier.remainingBalance.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* Statement Timeline / Table */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              حركة الحساب مرتبة بالتاريخ (بدون وقت):
            </span>
            <span className="text-[10px] text-slate-400">{statements.length} حركة</span>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {statements.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                لا توجد حركات مسجلة لهذا المورد حتى الآن
              </div>
            ) : (
              statements.map((st) => {
                const isInvoice = st.type === 'invoice';

                return (
                  <div key={st.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isInvoice
                            ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                        }`}
                      >
                        {isInvoice ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {isInvoice ? `فاتورة شراء ${st.invoiceNumber || ''}` : 'دفعة سداد'}
                          </span>
                          {!isInvoice && st.paymentMethod && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                              {st.paymentMethod === 'cash' ? 'نقدي' : st.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستاباي'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{st.date}</span>
                          {st.notes && <span>• {st.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className={`font-black ${isInvoice ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isInvoice ? `+${st.invoiceAmount?.toLocaleString()}` : `-${st.paymentAmount?.toLocaleString()}`} ج.م
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        الرصيد: {st.balanceAfter.toLocaleString()} ج.م
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Share and Action buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة كشف الحساب</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال واتساب</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onMakePayment(supplier.id);
              }}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>سداد دفعة للمورد</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
