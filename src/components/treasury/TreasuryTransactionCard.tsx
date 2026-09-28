import React from 'react';
import { TreasuryTransaction } from '../../types';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Receipt,
  Calendar,
  CreditCard,
  User,
  Scale,
  Hash,
  Eye,
  Edit2,
  Trash2,
  FileText
} from 'lucide-react';

interface TreasuryTransactionCardProps {
  transaction: TreasuryTransaction;
  onView: (tx: TreasuryTransaction) => void;
  onEdit: (tx: TreasuryTransaction) => void;
  onDelete: (tx: TreasuryTransaction) => void;
  onOpenStatement?: (recipientName: string) => void;
}

// Convert YYYY-MM-DD to DD/MM/YYYY for Arabic display
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const TreasuryTransactionCard: React.FC<TreasuryTransactionCardProps> = ({
  transaction,
  onView,
  onEdit,
  onDelete,
  onOpenStatement
}) => {
  const isDeposit = transaction.type === 'deposit';
  const isSupplierPayment = transaction.type === 'supplier_payment';
  const isExternalTransfer = transaction.type === 'external_transfer';
  const isExpense = transaction.type === 'expense';

  const typeTitle = isDeposit
    ? 'إيداع'
    : isSupplierPayment
    ? 'تحويل إلى مورد'
    : isExternalTransfer
    ? 'تحويل خارجي'
    : 'مصروف';

  const badgeColor = isDeposit
    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    : isSupplierPayment
    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    : isExternalTransfer
    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';

  const amountColor = isDeposit
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400';

  const formattedDate = formatDisplayDate(transaction.date);

  const paymentMethodLabel =
    transaction.paymentMethod === 'cash'
      ? 'Cash (نقداً)'
      : transaction.paymentMethod === 'vodafone_cash'
      ? 'Vodafone Cash'
      : transaction.paymentMethod === 'instapay'
      ? 'InstaPay'
      : transaction.paymentMethod;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs hover:shadow-md transition-all space-y-3">
      {/* Header: Type, ID & Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${badgeColor}`}
          >
            {isDeposit && <ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
            {isSupplierPayment && <ArrowUpRight className="w-5 h-5 text-blue-600" />}
            {isExternalTransfer && <Send className="w-5 h-5 text-teal-600" />}
            {isExpense && <Receipt className="w-5 h-5 text-rose-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {typeTitle}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                #{transaction.id}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>التاريخ: {formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Large Prominent Amount */}
        <div className="text-left shrink-0">
          <div className={`text-base font-black font-mono tracking-tight ${amountColor}`}>
            {isDeposit ? '+' : '−'}
            {transaction.amount.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold font-sans">جنيه</span>
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
        {/* Source / Supplier / Recipient / Reason */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {isDeposit && 'المصدر:'}
            {isSupplierPayment && 'المورد:'}
            {isExternalTransfer && 'المستلم:'}
            {isExpense && 'السبب / بيان المصروف:'}
          </span>
          <span className="font-black text-slate-900 dark:text-white">
            {transaction.sourceOrRecipient}
          </span>
        </div>

        {/* Payment Method (for supplier payments) */}
        {isSupplierPayment && transaction.paymentMethod && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span>طريقة الدفع:</span>
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
              {paymentMethodLabel}
            </span>
          </div>
        )}

        {/* Optional Note */}
        {transaction.note && (
          <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
              ملاحظة:
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-left text-[11px] leading-tight">
              {transaction.note}
            </span>
          </div>
        )}

        {/* Balance After Transaction (الرصيد بعد العملية) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>الرصيد بعد العملية:</span>
          </span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
            {transaction.balanceAfter.toLocaleString('ar-EG')} جنيه
          </span>
        </div>
      </div>

      {/* Action Buttons: View Details, Edit, Delete, Statement */}
      <div className="flex items-center justify-between pt-1 gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => onView(transaction)}
            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>تفاصيل</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>تعديل</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(transaction)}
            className="flex-1 py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors border border-rose-200/50 dark:border-rose-900/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف</span>
          </button>
        </div>

        {/* Quick Statement Button for External Transfers */}
        {isExternalTransfer && onOpenStatement && (
          <button
            type="button"
            onClick={() => onOpenStatement(transaction.sourceOrRecipient)}
            className="py-1.5 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-[11px] flex items-center gap-1 transition-colors border border-teal-200 dark:border-teal-900/50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>كشف حسابه</span>
          </button>
        )}
      </div>
    </div>
  );
};
