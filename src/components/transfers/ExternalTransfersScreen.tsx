import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExternalRecipient } from '../../types';
import {
  Send,
  Plus,
  Search,
  X,
  FileText,
  User,
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  Share2,
  Receipt,
  Users
} from 'lucide-react';
import { RecipientStatementModal } from './RecipientStatementModal';
import { NewExternalTransferModal } from './NewExternalTransferModal';

export const ExternalTransfersScreen: React.FC = () => {
  const {
    externalRecipients,
    treasuryTransactions,
    treasurySummary
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipientForStatement, setSelectedRecipientForStatement] = useState<ExternalRecipient | null>(null);
  const [isNewTransferModalOpen, setIsNewTransferModalOpen] = useState(false);
  const [targetRecipientForTransfer, setTargetRecipientForTransfer] = useState<string>('');

  // Calculate statistics for each recipient
  const recipientsWithStats = useMemo(() => {
    // 1. Gather all unique recipient names and IDs from external transactions as well
    const recipientMap = new Map<string, ExternalRecipient>();

    // Seed/Saved recipients
    externalRecipients.forEach(r => {
      recipientMap.set(r.name.trim().toLowerCase(), r);
    });

    // Also scan treasury transactions for any external transfers that might have been recorded
    treasuryTransactions
      .filter(tx => tx.type === 'external_transfer')
      .forEach(tx => {
        const key = tx.sourceOrRecipient.trim().toLowerCase();
        if (!recipientMap.has(key)) {
          recipientMap.set(key, {
            id: tx.relatedSupplierId || 'rec-' + tx.id,
            name: tx.sourceOrRecipient.trim(),
            createdAt: tx.date
          });
        }
      });

    const allRecipients = Array.from(recipientMap.values());

    return allRecipients.map(recipient => {
      const transfers = treasuryTransactions.filter(
        tx =>
          tx.type === 'external_transfer' &&
          (tx.relatedSupplierId === recipient.id ||
            tx.sourceOrRecipient.trim().toLowerCase() === recipient.name.trim().toLowerCase())
      );

      const totalTransferred = transfers.reduce((sum, tx) => sum + tx.amount, 0);
      const count = transfers.length;
      const sorted = [...transfers].sort((a, b) => b.date.localeCompare(a.date));
      const lastDate = sorted[0]?.date || recipient.createdAt;

      return {
        recipient,
        transfers,
        totalTransferred,
        count,
        lastDate
      };
    });
  }, [externalRecipients, treasuryTransactions]);

  // Overall totals for external transfers
  const totalExternalTransfersAmount = useMemo(() => {
    return treasuryTransactions
      .filter(tx => tx.type === 'external_transfer')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [treasuryTransactions]);

  const totalExternalTransactionsCount = useMemo(() => {
    return treasuryTransactions.filter(tx => tx.type === 'external_transfer').length;
  }, [treasuryTransactions]);

  // Filtered by search query
  const filteredRecipients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipientsWithStats;
    return recipientsWithStats.filter(item =>
      item.recipient.name.toLowerCase().includes(q) ||
      (item.recipient.phone && item.recipient.phone.includes(q)) ||
      (item.recipient.notes && item.recipient.notes.toLowerCase().includes(q))
    );
  }, [recipientsWithStats, searchQuery]);

  const handleOpenTransferModalForRecipient = (recipientName: string) => {
    setTargetRecipientForTransfer(recipientName);
    setIsNewTransferModalOpen(true);
  };

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-3 space-y-4">
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-700/15 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black">التحويلات الخارجية</h1>
              <p className="text-[11px] text-emerald-100 font-medium">
                إدارة مستلمي التحويلات وكشوف الحسابات
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setTargetRecipientForTransfer('');
              setIsNewTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>تحويل جديد</span>
          </button>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-center">
          <div className="p-2 rounded-xl bg-white/10">
            <span className="text-[10px] block opacity-85">المستلمون</span>
            <strong className="text-sm font-black font-mono">
              {recipientsWithStats.length}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-white/10">
            <span className="text-[10px] block opacity-85">إجمالي التحويلات</span>
            <strong className="text-sm font-black font-mono">
              {totalExternalTransfersAmount.toLocaleString()} ج.م
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-white/10">
            <span className="text-[10px] block opacity-85">عدد العمليات</span>
            <strong className="text-sm font-black font-mono">
              {totalExternalTransactionsCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن مستلم بالاسم (مثل: أيمن، محمد...)..."
          className="w-full py-3 pr-10 pl-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recipient Count Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-bold">
        <span>المستلمون المسجلون ({filteredRecipients.length})</span>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
          رصيد الخزينة: {treasurySummary.balance.toLocaleString()} ج.م
        </span>
      </div>

      {/* Recipients List */}
      <div className="space-y-3">
        {filteredRecipients.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                {searchQuery ? 'لا يوجد مستلم مطابق للبحث' : 'لا يوجد مستلمون مسجلون بعد'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'جرّب كتابة اسم آخر أو مسح حقل البحث'
                  : 'ابدأ بإجراء أول تحويل خارجي وسيتم إنشاء كشف حسابه تلقائياً'}
              </p>
            </div>
            <button
              onClick={() => {
                setTargetRecipientForTransfer('');
                setIsNewTransferModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء أول تحويل خارجي</span>
            </button>
          </div>
        ) : (
          filteredRecipients.map(({ recipient, totalTransferred, count, lastDate }) => (
            <div
              key={recipient.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 shadow-xs hover:shadow-md transition-all duration-150 space-y-3"
            >
              {/* Top row: Name & Avatar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base border border-emerald-100 dark:border-emerald-900">
                    {recipient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {recipient.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                      {recipient.phone ? (
                        <span className="font-mono">{recipient.phone}</span>
                      ) : (
                        <span>مستلم خارجي</span>
                      )}
                      <span>•</span>
                      <span>آخر تحويل: {lastDate}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-medium">إجمالي المحول</span>
                  <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {totalTransferred.toLocaleString('ar-EG')} ج.م
                  </strong>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{count} عمليات تحويل مسجلة</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenTransferModalForRecipient(recipient.name)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="تحويل مالي جديد"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تحويل</span>
                  </button>

                  <button
                    onClick={() => setSelectedRecipientForStatement(recipient)}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>كشف الحساب</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recipient Account Statement Modal (View / Preview / Share) */}
      {selectedRecipientForStatement && (
        <RecipientStatementModal
          recipient={selectedRecipientForStatement}
          onClose={() => setSelectedRecipientForStatement(null)}
          onOpenNewTransfer={(name) => handleOpenTransferModalForRecipient(name)}
        />
      )}

      {/* New External Transfer Modal */}
      {isNewTransferModalOpen && (
        <NewExternalTransferModal
          initialRecipientName={targetRecipientForTransfer}
          onClose={() => setIsNewTransferModalOpen(false)}
        />
      )}
    </div>
  );
};
