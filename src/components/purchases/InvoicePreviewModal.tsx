import React, { useState } from 'react';
import { PurchaseInvoice } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Share2, Edit, Trash2, Printer, MessageCircle, Copy, Check, FileText } from 'lucide-react';

interface InvoicePreviewModalProps {
  invoice: PurchaseInvoice | null;
  onClose: () => void;
  onEdit: (invoice: PurchaseInvoice) => void;
  onDelete: (id: string) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  onClose,
  onEdit,
  onDelete
}) => {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!invoice) return null;

  const generateShareText = () => {
    let text = `📄 *فاتورة مشتريات رقم ${invoice.invoiceNumber}*\n`;
    text += `🏢 *المورد:* ${invoice.supplierName}\n`;
    if (invoice.supplierPhone) text += `📞 *الهاتف:* ${invoice.supplierPhone}\n`;
    text += `📅 *التاريخ:* ${invoice.date}\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n`;
    text += `*البنود:*\n`;

    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.quantity} × ${item.purchasePrice} ج.م) = ${item.itemTotal.toLocaleString()} ج.م\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *الإجمالي الكلي:* ${invoice.totalAmount.toLocaleString()} ج.م\n`;
    if (invoice.notes) text += `📝 *ملاحظات:* ${invoice.notes}\n`;
    text += `\n*صادر من تطبيق Fake*`;
    return text;
  };

  const handleShare = async () => {
    const text = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`,
          text: text
        });
        setShareFeedback('تم فتح خيارات المشاركة');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: any) {
        // Fallback if dismissed or not allowed
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShareFeedback('تم نسخ تفاصيل الفاتورة للحافظة للمشاركة بأي تطبيق');
      setTimeout(() => {
        setCopied(false);
        setShareFeedback(null);
      }, 3000);
    } catch {
      setShareFeedback('يرجى نسخ النص يدوياً');
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                معاينة فاتورة مشتريات
              </h3>
              <p className="text-[10px] text-slate-400">رقم الفاتورة: {invoice.invoiceNumber}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {shareFeedback && (
          <div className="mb-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>{shareFeedback}</span>
            <Check className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Printable/Preview Invoice Sheet */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          {/* Invoice Header Details */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <span className="text-[10px] text-slate-400 block">رقم الفاتورة</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">التاريخ</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.date}</span>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] text-slate-400">بيانات المورد</p>
            <p className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
              {invoice.supplierName}
            </p>
            {invoice.supplierPhone && (
              <p className="text-slate-500 font-semibold mt-0.5" dir="ltr">
                {invoice.supplierPhone}
              </p>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">بنود الفاتورة</p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  <tr>
                    <th className="py-2 px-2.5">الصنف</th>
                    <th className="py-2 px-1 text-center">الكمية</th>
                    <th className="py-2 px-1 text-center">السعر</th>
                    <th className="py-2 px-2.5 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2 px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </td>
                      <td className="py-2 px-1 text-center text-slate-600 dark:text-slate-400">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-1 text-center text-slate-600 dark:text-slate-400">
                        {item.purchasePrice.toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-left font-bold text-slate-900 dark:text-white">
                        {item.itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="p-3 rounded-xl bg-emerald-600 text-white flex items-center justify-between">
            <span className="font-bold text-xs">إجمالي الفاتورة النهائي:</span>
            <span className="text-base font-black">{invoice.totalAmount.toLocaleString()} ج.م</span>
          </div>

          {invoice.notes && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <p className="text-[10px] text-slate-400">ملاحظات</p>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Share & Action Buttons */}
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Native Android Share */}
            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة (Android)</span>
            </button>

            {/* Direct WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال واتساب</span>
            </button>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onEdit(invoice)}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>

            <button
              onClick={() => onDelete(invoice.id)}
              className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-bold text-xs hover:bg-rose-100 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
