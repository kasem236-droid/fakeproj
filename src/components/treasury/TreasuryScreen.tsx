import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, TreasuryTransaction, ExternalRecipient } from '../../types';
import { getTodayDateString } from '../../services/storage';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Receipt,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Search,
  X,
  Scale,
  FileText,
  Filter,
  Users,
  Eye,
  History
} from 'lucide-react';
import { TransactionDetailModal } from './TransactionDetailModal';
import { RecipientStatementModal } from '../transfers/RecipientStatementModal';
import { TreasuryTransactionCard } from './TreasuryTransactionCard';

export const TreasuryScreen: React.FC = () => {
  const {
    setActiveTab,
    activeTreasurySubTab,
    setActiveTreasurySubTab,
    treasurySummary,
    treasuryTransactions,
    suppliers,
    recordSupplierPayment,
    addTreasuryDeposit,
    addExternalTransfer,
    addExpense,
    externalRecipients
  } = useApp();

  // Selected transaction for details / edit / delete modal
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<TreasuryTransaction | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'delete'>('view');

  // Selected recipient for statement modal
  const [selectedRecipientForStatement, setSelectedRecipientForStatement] = useState<ExternalRecipient | null>(null);

  const handleOpenView = (tx: TreasuryTransaction) => {
    setSelectedTxForDetail(tx);
    setModalMode('view');
  };

  const handleOpenEdit = (tx: TreasuryTransaction) => {
    setSelectedTxForDetail(tx);
    setModalMode('edit');
  };

  const handleOpenDelete = (tx: TreasuryTransaction) => {
    setSelectedTxForDetail(tx);
    setModalMode('delete');
  };

  const handleOpenStatementByName = (recipientName: string) => {
    const clean = recipientName.trim().toLowerCase();
    let rec = externalRecipients.find(r => r.name.trim().toLowerCase() === clean);
    if (!rec) {
      rec = {
        id: 'rec-' + Date.now(),
        name: recipientName.trim(),
        createdAt: getTodayDateString()
      };
    }
    setSelectedRecipientForStatement(rec);
  };

  // Search & Filter State for Treasury History
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'deposit' | 'supplier_payment' | 'external_transfer' | 'expense'>('all');
  const [historyDateMode, setHistoryDateMode] = useState<'all' | 'specific' | 'range'>('all');
  const [specificDate, setSpecificDate] = useState(() => getTodayDateString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Action Form States
  // 1. Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSource, setDepositSource] = useState('');
  const [depositDate, setDepositDate] = useState(() => getTodayDateString());
  const [depositNote, setDepositNote] = useState('');
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // 2. Transfer to Supplier
  const [suppTransferId, setSuppTransferId] = useState('');
  const [suppTransferAmount, setSuppTransferAmount] = useState('');
  const [suppTransferMethod, setSuppTransferMethod] = useState<PaymentMethod>('cash');
  const [suppTransferDate, setSuppTransferDate] = useState(() => getTodayDateString());
  const [suppTransferNote, setSuppTransferNote] = useState('');
  const [suppTransferError, setSuppTransferError] = useState<string | null>(null);
  const [suppTransferSuccess, setSuppTransferSuccess] = useState<string | null>(null);

  // 3. External Transfer
  const [extRecipientName, setExtRecipientName] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [extTransferAmount, setExtTransferAmount] = useState('');
  const [extTransferDate, setExtTransferDate] = useState(() => getTodayDateString());
  const [extTransferNote, setExtTransferNote] = useState('');
  const [extTransferError, setExtTransferError] = useState<string | null>(null);
  const [extTransferSuccess, setExtTransferSuccess] = useState<string | null>(null);

  // 4. Expense
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => getTodayDateString());
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);

  // Active form view or list view
  const [activeView, setActiveView] = useState<'history' | 'deposits' | 'supplier_transfers' | 'external_transfers' | 'expenses'>('history');

  // Filtered & sorted lists
  // Chronological sort: newest first for list views
  const sortedTransactions = useMemo(() => {
    return [...treasuryTransactions].sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [treasuryTransactions]);

  // Unified History list with search & filters
  const filteredHistory = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      // 1. Type filter
      if (historyTypeFilter !== 'all' && tx.type !== historyTypeFilter) {
        return false;
      }

      // 2. Date filter
      if (historyDateMode === 'specific' && specificDate) {
        if (tx.date !== specificDate) return false;
      } else if (historyDateMode === 'range') {
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      // 3. Search query filter
      const q = historySearchQuery.trim().toLowerCase();
      if (!q) return true;

      const typeArabic =
        tx.type === 'deposit'
          ? 'إيداع'
          : tx.type === 'supplier_payment'
          ? 'تحويل مورد سداد'
          : tx.type === 'external_transfer'
          ? 'تحويل خارجي'
          : 'مصروف';

      return (
        tx.sourceOrRecipient.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        typeArabic.includes(q) ||
        tx.amount.toString().includes(q) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q))
      );
    });
  }, [
    sortedTransactions,
    historyTypeFilter,
    historyDateMode,
    specificDate,
    startDate,
    endDate,
    historySearchQuery
  ]);

  // Dedicated filtered lists
  const depositsList = useMemo(() => {
    return sortedTransactions.filter((tx) => tx.type === 'deposit');
  }, [sortedTransactions]);

  const supplierTransfersList = useMemo(() => {
    return sortedTransactions.filter((tx) => tx.type === 'supplier_payment');
  }, [sortedTransactions]);

  const externalTransfersList = useMemo(() => {
    return sortedTransactions.filter((tx) => tx.type === 'external_transfer');
  }, [sortedTransactions]);

  const expensesList = useMemo(() => {
    return sortedTransactions.filter((tx) => tx.type === 'expense');
  }, [sortedTransactions]);

  // Form Handlers
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    const num = Number(depositAmount);
    if (isNaN(num) || num <= 0) {
      setDepositError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!depositSource.trim()) {
      setDepositError('يرجى إدخال مصدر الإيداع (مثل: رأس المال، مبيعات نقدية)');
      return;
    }

    await addTreasuryDeposit({
      amount: num,
      source: depositSource.trim(),
      date: depositDate,
      note: depositNote.trim() || undefined
    });

    setDepositAmount('');
    setDepositSource('');
    setDepositNote('');
    setDepositSuccess(`تم إيداع مبلغ ${num.toLocaleString()} ج.م في الخزينة بنجاح`);
    setTimeout(() => setDepositSuccess(null), 3500);
  };

  const handleSupplierTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuppTransferError(null);
    const num = Number(suppTransferAmount);

    if (!suppTransferId) {
      setSuppTransferError('يرجى اختيار المورد المراد التحويل إليه');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setSuppTransferError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (num > treasurySummary.balance) {
      setSuppTransferError(`الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لإتمام التحويل!`);
      return;
    }

    const res = await recordSupplierPayment({
      supplierId: suppTransferId,
      amount: num,
      paymentMethod: suppTransferMethod,
      date: suppTransferDate,
      notes: suppTransferNote.trim() || undefined
    });

    if (!res.success) {
      setSuppTransferError(res.error || 'فشلت عملية التحويل');
    } else {
      const supp = suppliers.find(s => s.id === suppTransferId);
      setSuppTransferAmount('');
      setSuppTransferNote('');
      setSuppTransferSuccess(`تم تحويل ${num.toLocaleString()} ج.م للمورد "${supp?.name}" بنجاح، وخفض المديونية`);
      setTimeout(() => setSuppTransferSuccess(null), 3500);
    }
  };

  const handleExternalTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtTransferError(null);
    const num = Number(extTransferAmount);

    const nameToUse = extRecipientName.trim() || externalRecipients.find(r => r.id === selectedRecipientId)?.name || '';
    if (!nameToUse) {
      setExtTransferError('يرجى إدخال أو اختيار اسم المستلم (مثل: أيمن)');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setExtTransferError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (num > treasurySummary.balance) {
      setExtTransferError(`الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لإتمام التحويل!`);
      return;
    }

    const res = await addExternalTransfer({
      recipientId: selectedRecipientId || undefined,
      recipientName: nameToUse,
      amount: num,
      date: extTransferDate,
      note: extTransferNote.trim() || undefined
    });

    if (!res.success) {
      setExtTransferError(res.error || 'فشلت عملية التحويل الخارجي');
    } else {
      setExtTransferAmount('');
      setExtTransferNote('');
      setExtRecipientName('');
      setSelectedRecipientId('');
      setExtTransferSuccess(`تم التحويل الخارجي بمبلغ ${num.toLocaleString()} ج.م إلى "${nameToUse}" بنجاح وتحديث كشف حسابه`);
      setTimeout(() => setExtTransferSuccess(null), 4000);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);
    const num = Number(expenseAmount);

    if (!expenseDesc.trim()) {
      setExpenseError('يرجى إدخال سبب أو بيان المصروف');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setExpenseError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (num > treasurySummary.balance) {
      setExpenseError(`الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لصرف هذا المبلغ!`);
      return;
    }

    const res = await addExpense({
      description: expenseDesc.trim(),
      amount: num,
      date: expenseDate,
      note: expenseNote.trim() || undefined
    });

    if (!res.success) {
      setExpenseError(res.error || 'فشلت عملية إضافة المصروف');
    } else {
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseNote('');
      setExpenseSuccess(`تم تسجيل صرف ${num.toLocaleString()} ج.م بنجاح وخصمها من الخزينة`);
      setTimeout(() => setExpenseSuccess(null), 3500);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* 1. TOP SUMMARY CARD */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 p-4 text-white shadow-xl shadow-emerald-700/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-100">رصيد الخزينة الحالي</span>
              <p className="text-[10px] text-emerald-200">معادلة ديناميكية مباشرة من السجلات</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black tracking-wider uppercase">
            Active Cash
          </div>
        </div>

        {/* Current Balance */}
        <div className="text-3xl font-black tracking-tight my-1">
          {treasurySummary.balance.toLocaleString('ar-EG')}{' '}
          <span className="text-sm font-semibold text-emerald-200">ج.م</span>
        </div>

        {/* 4 Metric Cards: Deposits, Supplier Transfers, External Transfers, Expenses */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-white/20 text-center">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200 block mb-0.5">(+) الإيداعات</span>
            <span className="text-xs font-black font-mono">
              {treasurySummary.totalDeposits.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200 block mb-0.5">(−) تحويل الموردين</span>
            <span className="text-xs font-black font-mono">
              {treasurySummary.totalSupplierTransfers.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200 block mb-0.5">(−) تحويل خارجي</span>
            <span className="text-xs font-black font-mono">
              {treasurySummary.totalExternalTransfers.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200 block mb-0.5">(−) المصروفات</span>
            <span className="text-xs font-black font-mono">
              {treasurySummary.totalExpenses.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN ACTION BUTTONS (Quick Creation) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block px-1">
          إجراء معاملة مالية سريعة:
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => setActiveTreasurySubTab(activeTreasurySubTab === 'deposit' ? 'balance' : 'deposit')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeTreasurySubTab === 'deposit'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold">إيداع من</span>
          </button>

          <button
            onClick={() => setActiveTreasurySubTab(activeTreasurySubTab === 'transfer' ? 'balance' : 'transfer')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeTreasurySubTab === 'transfer'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold">تحويل لمورد</span>
          </button>

          <button
            onClick={() => setActiveTreasurySubTab(activeTreasurySubTab === 'external' ? 'balance' : 'external')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeTreasurySubTab === 'external'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
            }`}
          >
            <Send className="w-4 h-4 text-teal-500" />
            <span className="text-[10px] font-bold">تحويل خارجي</span>
          </button>

          <button
            onClick={() => setActiveTreasurySubTab(activeTreasurySubTab === 'expense' ? 'balance' : 'expense')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeTreasurySubTab === 'expense'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
            }`}
          >
            <Receipt className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-bold">مصروفات</span>
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE CREATION FORMS */}
      {/* ACTION FORM 1: DEPOSIT */}
      {activeTreasurySubTab === 'deposit' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 shadow-lg space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">إيداع في الخزينة</h3>
            </div>
            <button
              onClick={() => setActiveTreasurySubTab('balance')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {depositError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{depositError}</span>
            </div>
          )}

          {depositSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{depositSuccess}</span>
            </div>
          )}

          <form onSubmit={handleDepositSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                مبلغ الإيداع (ج.م) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                مصدر الإيداع (إيداع من) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={depositSource}
                onChange={(e) => setDepositSource(e.target.value)}
                placeholder="مثال: رأس المال، مبيعات نقدية، تحصيل..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                التاريخ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات
              </label>
              <input
                type="text"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                placeholder="تفاصيل اختيارية حول الإيداع..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد الإيداع في الخزينة</span>
            </button>
          </form>
        </div>
      )}

      {/* ACTION FORM 2: SUPPLIER TRANSFER */}
      {activeTreasurySubTab === 'transfer' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/80 shadow-lg space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ArrowUpRight className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">تحويل إلى مورد (سداد)</h3>
            </div>
            <button
              onClick={() => setActiveTreasurySubTab('balance')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs">
            <span className="text-blue-900 dark:text-blue-200 font-bold">الرصيد المتاح بالخزينة:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {treasurySummary.balance.toLocaleString()} ج.م
            </span>
          </div>

          {suppTransferError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{suppTransferError}</span>
            </div>
          )}

          {suppTransferSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{suppTransferSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSupplierTransferSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اختيار المورد <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={suppTransferId}
                onChange={(e) => setSuppTransferId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="">-- اختر المورد المطلوب السداد له --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (مديونية: {s.remainingBalance.toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={suppTransferAmount}
                  onChange={(e) => setSuppTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                    Number(suppTransferAmount) > treasurySummary.balance
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } text-sm font-black text-slate-900 dark:text-white`}
                />
                {Number(suppTransferAmount) > treasurySummary.balance && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                    ⚠️ المبلغ يتجاوز الرصيد المتاح ({treasurySummary.balance.toLocaleString()} ج.م)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  طريقة الدفع <span className="text-rose-500">*</span>
                </label>
                <select
                  value={suppTransferMethod}
                  onChange={(e) => setSuppTransferMethod(e.target.value as PaymentMethod)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="cash">نقداً (Cash)</option>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                التاريخ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={suppTransferDate}
                onChange={(e) => setSuppTransferDate(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات أو بيان الدفعة
              </label>
              <input
                type="text"
                value={suppTransferNote}
                onChange={(e) => setSuppTransferNote(e.target.value)}
                placeholder="رقم العملية، إيصال التحويل..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد التحويل للمورد وخصم المبلغ وتحديث كشف حسابه</span>
            </button>
          </form>
        </div>
      )}

      {/* ACTION FORM 3: EXTERNAL TRANSFER */}
      {activeTreasurySubTab === 'external' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/80 shadow-lg space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Send className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">تحويل مالي خارجي</h3>
            </div>
            <button
              onClick={() => setActiveTreasurySubTab('balance')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 flex items-center justify-between text-xs">
            <span className="text-teal-900 dark:text-teal-200 font-bold">الرصيد المتاح بالخزينة:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {treasurySummary.balance.toLocaleString()} ج.م
            </span>
          </div>

          {extTransferError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{extTransferError}</span>
            </div>
          )}

          {extTransferSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{extTransferSuccess}</span>
            </div>
          )}

          <form onSubmit={handleExternalTransferSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المستلم <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={extRecipientName}
                onChange={(e) => setExtRecipientName(e.target.value)}
                placeholder="أدخل اسم المستلم (مثل: أيمن، محمد...)"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
              {externalRecipients.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">سابقون:</span>
                  {externalRecipients.slice(0, 4).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setExtRecipientName(r.name)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-emerald-50"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={extTransferAmount}
                  onChange={(e) => setExtTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                    Number(extTransferAmount) > treasurySummary.balance
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } text-sm font-black text-slate-900 dark:text-white`}
                />
                {Number(extTransferAmount) > treasurySummary.balance && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                    ⚠️ المبلغ يتجاوز الرصيد المتاح ({treasurySummary.balance.toLocaleString()} ج.م)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  التاريخ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={extTransferDate}
                  onChange={(e) => setExtTransferDate(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات
              </label>
              <input
                type="text"
                value={extTransferNote}
                onChange={(e) => setExtTransferNote(e.target.value)}
                placeholder="سبب التحويل أو وسيلة التحويل..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد التحويل الخارجي والخصم من الخزينة</span>
            </button>
          </form>
        </div>
      )}

      {/* ACTION FORM 4: EXPENSES */}
      {activeTreasurySubTab === 'expense' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80 shadow-lg space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Receipt className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">صرف مصروفات</h3>
            </div>
            <button
              onClick={() => setActiveTreasurySubTab('balance')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 flex items-center justify-between text-xs">
            <span className="text-rose-900 dark:text-rose-200 font-bold">الرصيد المتاح بالخزينة:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {treasurySummary.balance.toLocaleString()} ج.م
            </span>
          </div>

          {expenseError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{expenseError}</span>
            </div>
          )}

          {expenseSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{expenseSuccess}</span>
            </div>
          )}

          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                بيان المصروف / السبب <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="مثال: بنزين، أدوات، صيانة، مواصلات..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                    Number(expenseAmount) > treasurySummary.balance
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } text-sm font-black text-slate-900 dark:text-white`}
                />
                {Number(expenseAmount) > treasurySummary.balance && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                    ⚠️ مبلغ المصروف يتجاوز الرصيد المتاح ({treasurySummary.balance.toLocaleString()} ج.م)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  التاريخ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات
              </label>
              <input
                type="text"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                placeholder="رقم الإيصال أو تفاصيل إضافية..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد صرف المصروف من الخزينة</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. SECTION / TAB NAVIGATION FOR LISTS */}
      <div className="space-y-3">
        {/* Navigation Selector Bar */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar shadow-inner text-xs font-bold">
          {[
            { id: 'history', label: 'سجل الخزينة', count: treasuryTransactions.length },
            { id: 'deposits', label: 'الإيداعات', count: depositsList.length },
            { id: 'supplier_transfers', label: 'تحويلات الموردين', count: supplierTransfersList.length },
            { id: 'external_transfers', label: 'التحويلات الخارجية', count: externalTransfersList.length },
            { id: 'expenses', label: 'المصروفات', count: expensesList.length },
          ].map((tab) => {
            const isSelected = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`py-2 px-3 rounded-xl flex items-center gap-1.5 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-black scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* SECTION A: UNIFIED TREASURY HISTORY (سجل الخزينة)                          */}
        {/* ========================================================================= */}
        {activeView === 'history' && (
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="ابحث في سجل الخزينة (المورد، المستلم، المصدر، السبب، الملاحظة)..."
                className="w-full py-2.5 pr-9 pl-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="p-1 absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'deposit', label: 'الإيداعات' },
                { id: 'supplier_payment', label: 'تحويلات الموردين' },
                { id: 'external_transfer', label: 'التحويلات الخارجية' },
                { id: 'expense', label: 'المصروفات' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setHistoryTypeFilter(f.id as any)}
                  className={`py-1 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-colors ${
                    historyTypeFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Date Filters Bar */}
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصفية حسب التاريخ:</span>
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setHistoryDateMode('all')}
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      historyDateMode === 'all'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    كل التواريخ
                  </button>
                  <button
                    onClick={() => setHistoryDateMode('specific')}
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      historyDateMode === 'specific'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    تاريخ محدد
                  </button>
                  <button
                    onClick={() => setHistoryDateMode('range')}
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      historyDateMode === 'range'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    من - إلى
                  </button>
                </div>
              </div>

              {historyDateMode === 'specific' && (
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-[11px] text-slate-400">التاريخ:</label>
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              )}

              {historyDateMode === 'range' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">من تاريخ:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">إلى تاريخ:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500">
                <span>سجل الخزينة الكامل ({filteredHistory.length})</span>
                <span>اضغط على أي عملية لعرض تفاصيلها أو تعديلها أو حذفها</span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto opacity-30 text-emerald-500" />
                  <p className="text-xs font-bold">لا توجد معاملات مطابقة للبحث أو التصفية</p>
                </div>
              ) : (
                filteredHistory.map((tx) => (
                  <TreasuryTransactionCard
                    key={tx.id}
                    transaction={tx}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onOpenStatement={handleOpenStatementByName}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION B: DEPOSITS LIST (الإيداعات)                                        */}
        {/* ========================================================================= */}
        {activeView === 'deposits' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  إجمالي مبالغ الإيداعات
                </span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {treasurySummary.totalDeposits.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
              <button
                onClick={() => setActiveTreasurySubTab('deposit')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إيداع جديد</span>
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-500 px-1 block">
                سجل الإيداعات المفصل ({depositsList.length})
              </span>

              {depositsList.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لا توجد إيداعات مسجلة
                </div>
              ) : (
                depositsList.map((dep) => (
                  <TreasuryTransactionCard
                    key={dep.id}
                    transaction={dep}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION C: SUPPLIER TRANSFERS LIST (تحويلات الموردين)                      */}
        {/* ========================================================================= */}
        {activeView === 'supplier_transfers' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  إجمالي تحويلات وسداد الموردين
                </span>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                  {treasurySummary.totalSupplierTransfers.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
              <button
                onClick={() => setActiveTreasurySubTab('transfer')}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تحويل جديد</span>
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-500 px-1 block">
                سجل تحويلات الموردين المفصل ({supplierTransfersList.length})
              </span>

              {supplierTransfersList.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لا توجد تحويلات لموردين مسجلة
                </div>
              ) : (
                supplierTransfersList.map((tx) => (
                  <TreasuryTransactionCard
                    key={tx.id}
                    transaction={tx}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION D: EXTERNAL TRANSFERS LIST (التحويلات الخارجية)                     */}
        {/* ========================================================================= */}
        {activeView === 'external_transfers' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  إجمالي التحويلات الخارجية
                </span>
                <div className="text-xl font-black text-teal-700 dark:text-teal-300 font-mono mt-0.5">
                  {treasurySummary.totalExternalTransfers.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTreasurySubTab('external')}
                  className="py-2 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تحويل</span>
                </button>
                <button
                  onClick={() => setActiveTab('external_transfers')}
                  className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1"
                  title="الانتقال إلى شاشة التحويلات الخارجية وكشوف الحسابات"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>الحسابات</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-500 px-1 block">
                سجل التحويلات الخارجية المفصل ({externalTransfersList.length})
              </span>

              {externalTransfersList.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لا توجد تحويلات خارجية مسجلة
                </div>
              ) : (
                externalTransfersList.map((tx) => (
                  <TreasuryTransactionCard
                    key={tx.id}
                    transaction={tx}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onOpenStatement={handleOpenStatementByName}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION E: EXPENSES LIST (المصروفات)                                       */}
        {/* ========================================================================= */}
        {activeView === 'expenses' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  إجمالي المصروفات
                </span>
                <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                  {treasurySummary.totalExpenses.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
              <button
                onClick={() => setActiveTreasurySubTab('expense')}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>صرف جديد</span>
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-500 px-1 block">
                قائمة المصروفات المفصلة ({expensesList.length})
              </span>

              {expensesList.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لا توجد مصروفات مسجلة
                </div>
              ) : (
                expensesList.map((exp) => (
                  <TreasuryTransactionCard
                    key={exp.id}
                    transaction={exp}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* TRANSACTION DETAIL & EDIT / DELETE MODAL */}
      {selectedTxForDetail && (
        <TransactionDetailModal
          transaction={selectedTxForDetail}
          initialMode={modalMode}
          onClose={() => setSelectedTxForDetail(null)}
        />
      )}

      {/* RECIPIENT STATEMENT MODAL (if triggered) */}
      {selectedRecipientForStatement && (
        <RecipientStatementModal
          recipient={selectedRecipientForStatement}
          onClose={() => setSelectedRecipientForStatement(null)}
        />
      )}
    </div>
  );
};
