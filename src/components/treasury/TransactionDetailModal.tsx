import React, { useState } from 'react';
import { TreasuryTransaction, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Receipt,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  FileText,
  Hash,
  Scale
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: TreasuryTransaction;
  onClose: () => void;
  initialMode?: 'view' | 'edit' | 'delete';
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  initialMode = 'view'
}) => {
  const {
    suppliers,
    treasurySummary,
    deleteTreasuryTransaction,
    editTreasuryTransaction
  } = useApp();

  const [isEditing, setIsEditing] = useState(initialMode === 'edit');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialMode === 'delete');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editAmount, setEditAmount] = useState(String(transaction.amount));
  const [editDate, setEditDate] = useState(transaction.date);
  const [editSourceOrRecipient, setEditSourceOrRecipient] = useState(transaction.sourceOrRecipient);
  const [editSupplierId, setEditSupplierId] = useState(transaction.relatedSupplierId || '');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod || 'cash');
  const [editNote, setEditNote] = useState(transaction.note || '');

  const isDeposit = transaction.type === 'deposit';
  const isSupplierPayment = transaction.type === 'supplier_payment';
  const isExternalTransfer = transaction.type === 'external_transfer';
  const isExpense = transaction.type === 'expense';

  const modalTitle = isDeposit
    ? 'تفاصيل الإيداع'
    : isSupplierPayment
    ? 'تفاصيل تحويل المورد'
    : isExternalTransfer
    ? 'تفاصيل التحويل الخارجي'
    : 'تفاصيل المصروف';

  const typeBadgeLabel = isDeposit
    ? 'إيداع'
    : isSupplierPayment
    ? 'تحويل إلى مورد'
    : isExternalTransfer
    ? 'تحويل خارجي'
    : 'مصروف';

  const handleDelete = async () => {
    setIsProcessing(true);
    setError(null);
    const res = await deleteTreasuryTransaction(transaction.id);
    setIsProcessing(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'حدث خطأ أثناء حذف المعاملة');
      setShowDeleteConfirm(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const updatePayload: any = {
      amount: numAmount,
      date: editDate,
      note: editNote.trim() || undefined
    };

    if (isDeposit) {
      updatePayload.source = editSourceOrRecipient.trim();
    } else if (isSupplierPayment) {
      updatePayload.supplierId = editSupplierId || transaction.relatedSupplierId;
      updatePayload.paymentMethod = editPaymentMethod;
      updatePayload.notes = editNote.trim() || undefined;
    } else if (isExternalTransfer) {
      updatePayload.recipientName = editSourceOrRecipient.trim();
    } else if (isExpense) {
      updatePayload.description = editSourceOrRecipient.trim();
    }

    const res = await editTreasuryTransaction(transaction.id, updatePayload);
    setIsProcessing(false);

    if (res.success) {
      setIsEditing(false);
      onClose();
    } else {
      setError(res.error || 'فشل حفظ التعديلات');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                isDeposit
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : isSupplierPayment
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : isExternalTransfer
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isDeposit && <ArrowDownLeft className="w-5 h-5" />}
              {isSupplierPayment && <ArrowUpRight className="w-5 h-5" />}
              {isExternalTransfer && <Send className="w-5 h-5" />}
              {isExpense && <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {modalTitle}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isDeposit
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {typeBadgeLabel}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                رقم المعاملة: {transaction.id}
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

        {/* Error notification */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Delete Confirmation Step */}
        {showDeleteConfirm ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>تأكيد حذف المعاملة المالية</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                هل أنت متأكد من حذف هذه المعاملة ({typeBadgeLabel}: {transaction.amount.toLocaleString()} جنيه)؟
                <br />
                <span className="text-slate-600 dark:text-slate-400 block mt-1.5">
                  {isDeposit && (
                    <>⚠️ سيتم خصم هذا المبلغ من الخزينة وإعادة احتساب الرصيد الحالي وجميع الأرصدة اللاحقة.</>
                  )}
                  {isSupplierPayment && (
                    <>⚠️ سيتم استعادة المبلغ إلى الخزينة، وإعادة زيادة مديونية المورد، وإلغاء هذه الدفعة من كشف حسابه.</>
                  )}
                  {isExternalTransfer && (
                    <>⚠️ سيتم استعادة المبلغ إلى الخزينة وتحديث كشف حساب المستلم وإجمالي تحويلاته فوراً.</>
                  )}
                  {isExpense && (
                    <>⚠️ سيتم استعادة المبلغ إلى الخزينة وإلغاء تسجيل هذا المصروف من السجلات.</>
                  )}
                </span>
                <strong className="text-rose-600 dark:text-rose-400 block mt-1">
                  لا يمكن التراجع عن هذا الإجراء إلا بإعادة تسجيل المعاملة.
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : isEditing ? (
          /* EDIT FORM */
          <form onSubmit={handleEditSubmit} className="p-4 space-y-3">
            {/* Amount */}
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
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full py-2.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Target name / reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isDeposit
                  ? 'مصدر الإيداع'
                  : isSupplierPayment
                  ? 'المورد'
                  : isExternalTransfer
                  ? 'اسم المستلم'
                  : 'سبب المصروف / البيان'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              {isSupplierPayment ? (
                <select
                  value={editSupplierId}
                  onChange={(e) => {
                    setEditSupplierId(e.target.value);
                    const s = suppliers.find(sup => sup.id === e.target.value);
                    if (s) setEditSourceOrRecipient(s.name);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (رصيد متبقي: {s.remainingBalance.toLocaleString()} ج.م)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editSourceOrRecipient}
                    onChange={(e) => setEditSourceOrRecipient(e.target.value)}
                    className="w-full py-2.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Payment Method (for supplier transfer) */}
            {isSupplierPayment && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  طريقة الدفع
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="cash">نقداً (Cash)</option>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                </select>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                التاريخ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full py-2.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات
              </label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="ملاحظات اختيارية..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Form actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          /* VIEW DETAILS */
          <div className="p-4 space-y-4">
            {/* Amount Banner */}
            <div
              className={`p-4 rounded-2xl text-center space-y-1 ${
                isDeposit
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                مبلغ المعاملة
              </span>
              <div
                className={`text-2xl font-black font-mono ${
                  isDeposit
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isDeposit ? '+' : '-'}
                {transaction.amount.toLocaleString('ar-EG')}{' '}
                <span className="text-sm font-bold">ج.م</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isDeposit
                    ? 'المصدر:'
                    : isSupplierPayment
                    ? 'المورد:'
                    : isExternalTransfer
                    ? 'المستلم:'
                    : 'السبب:'}
                </span>
                <strong className="text-slate-900 dark:text-white font-black text-sm">
                  {transaction.sourceOrRecipient}
                </strong>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">التاريخ:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {transaction.date}
                </span>
              </div>

              {isSupplierPayment && transaction.paymentMethod && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    طريقة الدفع:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {transaction.paymentMethod === 'cash'
                      ? 'Cash'
                      : transaction.paymentMethod === 'vodafone_cash'
                      ? 'Vodafone Cash'
                      : 'InstaPay'}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الرصيد بعد العملية:</span>
                </span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {transaction.balanceAfter.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              {transaction.note && (
                <div className="pt-2 flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                    البيان / الملاحظة:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 text-left">
                    {transaction.note}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>تاريخ التسجيل:</span>
                <span className="font-mono">{transaction.createdAt}</span>
              </div>
            </div>

            {/* Action Buttons: Edit & Delete */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <span>تعديل</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200/60 dark:border-rose-900/60"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
