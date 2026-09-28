import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppTheme, TreasuryTransaction, TreasuryTransactionType } from '../../types';
import {
  Settings,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  History,
  Download,
  Upload,
  Trash2,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  KeyRound,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Receipt,
  Copy,
  Check
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    theme,
    setTheme,
    syncStatus,
    lastSyncTime,
    treasuryTransactions,
    canUndo,
    lastActionDescription,
    undoLastFinancialOperation,
    clearAllBusinessData,
    exportBackup,
    importRecovery,
    setIsExitModalOpen
  } = useApp();

  // Undo Confirmation State
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  // Clear Data Modal State (Password 040236)
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearStep, setClearStep] = useState<'password' | 'confirm'>('password');
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  // Backup & Recovery State
  const [backupJson, setBackupJson] = useState<string | null>(null);
  const [backupCopied, setBackupCopied] = useState(false);
  const [recoveryJsonInput, setRecoveryJsonInput] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Treasury History Filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | TreasuryTransactionType>('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [showHistorySection, setShowHistorySection] = useState(false);

  // Filtered Treasury History
  const filteredHistory = useMemo(() => {
    return treasuryTransactions.filter((tx) => {
      if (historyTypeFilter !== 'all' && tx.type !== historyTypeFilter) return false;
      if (historyStartDate && tx.date < historyStartDate) return false;
      if (historyEndDate && tx.date > historyEndDate) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [treasuryTransactions, historyTypeFilter, historyStartDate, historyEndDate]);

  // Handler: Undo
  const handleUndo = async () => {
    const res = await undoLastFinancialOperation();
    setShowUndoConfirm(false);
    setUndoMessage(res.message);
    setTimeout(() => setUndoMessage(null), 4000);
  };

  // Handler: Clear Data Password Check
  const handleVerifyClearPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setClearError(null);
    if (clearPassword === '040236') {
      setClearStep('confirm');
    } else {
      setClearError('كلمة المرور غير صحيحة! لن يتم مسح أي بيانات.');
    }
  };

  const handleExecuteClear = async () => {
    const res = await clearAllBusinessData(clearPassword);
    if (res.success) {
      setShowClearModal(false);
      setClearPassword('');
      setClearStep('password');
      setClearSuccess('تم مسح جميع بيانات الأعمال بنجاح وتصفير السجلات.');
      setTimeout(() => setClearSuccess(null), 5000);
    } else {
      setClearError(res.error || 'حدث خطأ أثناء المسح');
    }
  };

  // Handler: Export Backup
  const handleExportBackup = () => {
    const json = exportBackup();
    setBackupJson(json);
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fake_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Direct file download fallback:', e);
    }
  };

  // Handler: Recovery Import
  const handleRecoverySubmit = async () => {
    if (!recoveryJsonInput.trim()) {
      setRecoveryMessage({ success: false, text: 'يرجى لصق نص النسخة الاحتياطية (JSON)' });
      return;
    }
    const res = await importRecovery(recoveryJsonInput.trim());
    if (res.success) {
      setRecoveryMessage({
        success: true,
        text: `تم استعادة البيانات بنجاح (${res.count} عنصر تم استرجاعه).`
      });
      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoveryJsonInput('');
        setRecoveryMessage(null);
      }, 3000);
    } else {
      setRecoveryMessage({ success: false, text: res.error || 'فشلت الاستعادة' });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">الإعدادات وإدارة البيانات</h2>
            <p className="text-xs text-slate-400">المظهر، الأمان، المزامنة، والنسخ الاحتياطي</p>
          </div>
        </div>

        <button
          onClick={() => setIsExitModalOpen(true)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors"
          title="الخروج من التطبيق"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      {undoMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{undoMessage}</span>
        </div>
      )}

      {clearSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{clearSuccess}</span>
        </div>
      )}

      {/* 27. THEMES: Light, Dark, Night (Separate AMOLED theme) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            المظهر والألوان (Theme)
          </span>
          <span className="text-[10px] text-slate-400">
            {theme === 'light' ? 'فاتح' : theme === 'dark' ? 'داكن' : 'ليلي ناصع'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Light Theme */}
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition-all ${
              theme === 'light'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">فاتح (Light)</span>
          </button>

          {/* Dark Theme (Slate) */}
          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition-all ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold">داكن (Dark)</span>
          </button>

          {/* Night Theme (True AMOLED Pitch Black) */}
          <button
            onClick={() => setTheme('night')}
            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition-all ${
              theme === 'night'
                ? 'border-emerald-400 bg-black text-emerald-300 shadow-sm ring-2 ring-emerald-400/30'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">ليلي (Night)</span>
          </button>
        </div>
      </div>

      {/* 22. UNDO LAST FINANCIAL OPERATION */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              التراجع عن آخر عملية مالية
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${canUndo ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-400'}`}>
            {canUndo ? 'متاح' : 'لا توجد عمليات'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {lastActionDescription
            ? `آخر عملية: "${lastActionDescription}". التراجع يعيد تصحيح رصيد الخزينة، ومديونية المورد، وكشف الحساب بدون أي خلل.`
            : 'لا توجد معاملات مسجلة في قائمة التراجع حالياً.'}
        </p>

        <button
          disabled={!canUndo}
          onClick={() => setShowUndoConfirm(true)}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تأكيد التراجع عن آخر معاملة مالية</span>
        </button>
      </div>

      {/* 20. TREASURY TRANSACTION HISTORY (Date only, no time!) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div
          onClick={() => setShowHistorySection(!showHistorySection)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <History className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              سجل حركات الخزينة الكامل
            </span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {showHistorySection ? 'إخفاء' : `عرض السجل (${treasuryTransactions.length})`}
          </span>
        </div>

        {showHistorySection && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Filter by Type & Date Range */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'deposit', label: 'إيداعات' },
                  { id: 'supplier_payment', label: 'دفعات' },
                  { id: 'expense', label: 'مصروفات' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryTypeFilter(f.id as any)}
                    className={`py-1.5 rounded-lg transition-colors ${
                      historyTypeFilter === f.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">من تاريخ:</span>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  لا توجد معاملات مسجلة مطابقة للفلاتر
                </div>
              ) : (
                filteredHistory.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  return (
                    <div key={tx.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isDeposit
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                          }`}
                        >
                          {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {tx.sourceOrRecipient}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                              {tx.type === 'deposit'
                                ? 'إيداع'
                                : tx.type === 'supplier_payment'
                                ? 'سداد مورد'
                                : tx.type === 'external_transfer'
                                ? 'تحويل خارجي'
                                : 'مصروف'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{tx.date}</span>
                            {tx.note && <span>• {tx.note}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className={`font-black ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isDeposit ? `+${tx.amount.toLocaleString()}` : `-${tx.amount.toLocaleString()}`} ج.م
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          رصيد: {tx.balanceAfter.toLocaleString()} ج.م
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 25. CONNECTION & CLOUD SYNC INFORMATION */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          حالة الاتصال والمزامنة السحابية (Firebase)
        </span>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            {syncStatus === 'online' && <Wifi className="w-4 h-4 text-emerald-500" />}
            {syncStatus === 'offline' && <WifiOff className="w-4 h-4 text-amber-500" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />}
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {syncStatus === 'online' ? 'متصل بالسحابة (ONLINE)' : syncStatus === 'offline' ? 'وضع عدم الاتصال (OFFLINE)' : 'جاري مزامنة السجلات (SYNCING)'}
              </p>
              <p className="text-[10px] text-slate-400">
                يعمل التطبيق والبحث بكفاءة أوفلاين مع المزامنة التلقائية فور توفر الإنترنت.
              </p>
            </div>
          </div>
          {lastSyncTime && (
            <span className="text-[10px] text-slate-400 shrink-0">{lastSyncTime}</span>
          )}
        </div>
      </div>

      {/* 29 & 30. BACKUP & RECOVERY */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          النسخ الاحتياطي والاستعادة (Backup & Recovery)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>نسخ احتياطي</span>
          </button>

          <button
            onClick={() => setShowRecoveryModal(true)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>استعادة البيانات</span>
          </button>
        </div>
      </div>

      {/* 28. CLEAR DATA (Password 040236) */}
      <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
        <div className="flex items-center gap-2 text-rose-600">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold">مسح البيانات بالكامل (Clear Data)</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          حذف كافة سجلات العملاء، الفواتير، الموردين، الخزينة، والمستلمين، مع الإبقاء على إعدادات المظهر وتهيئة التطبيق. يتطلب كلمة المرور الخاصة.
        </p>
        <button
          onClick={() => {
            setClearPassword('');
            setClearStep('password');
            setClearError(null);
            setShowClearModal(true);
          }}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>مسح البيانات</span>
        </button>
      </div>

      {/* UNDO CONFIRMATION MODAL */}
      {showUndoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <RotateCcw className="w-6 h-6" />
              <h4 className="font-bold text-slate-900 dark:text-white">تأكيد التراجع</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              هل أنت متأكد من التراجع عن المعاملة التالية:
              <br />
              <strong className="text-amber-600 block mt-1">"{lastActionDescription}"</strong>
              <span className="text-[11px] text-slate-400 block mt-1">
                سيتم استرداد الرصيد وتصحيح المديونيات وكشف الحساب بدقة.
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleUndo}
                className="py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
              >
                تأكيد التراجع
              </button>
              <button
                onClick={() => setShowUndoConfirm(false)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR DATA MODAL (PASSWORD 040236) */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl my-auto animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                {clearStep === 'password' ? 'أدخل كلمة مرور مسح البيانات' : 'تأكيد نهائي لمسح السجلات'}
              </h4>
            </div>

            {clearError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {clearError}
              </div>
            )}

            {clearStep === 'password' ? (
              <form onSubmit={handleVerifyClearPassword} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  لحماية بيانات النشاط التجاري، يرجى كتابة كلمة المرور المعتمدة:
                </p>

                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={clearPassword}
                    onChange={(e) => setClearPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold tracking-widest text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="submit"
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    التحقق
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(false)}
                    className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs leading-relaxed font-semibold">
                  تحذير: سيتم حذف كافة العملاء، الفواتير، الموردين، الخزينة، والمستلمين، وتصفير قاعدة البيانات السحابية. لا يمكن التراجع عن هذا الإجراء!
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExecuteClear}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20"
                  >
                    نعم، امسح كل السجلات
                  </button>
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECOVERY MODAL */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl my-auto animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-600 mb-3">
              <Upload className="w-5 h-5" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                استعادة نسخة احتياطية
              </h4>
            </div>

            {recoveryMessage && (
              <div className={`mb-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                recoveryMessage.success
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
              }`}>
                {recoveryMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{recoveryMessage.text}</span>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-2">
              الصق نص كود JSON للنسخة الاحتياطية أو اختر ملفاً:
            </p>

            <div className="space-y-3">
              <textarea
                rows={6}
                value={recoveryJsonInput}
                onChange={(e) => setRecoveryJsonInput(e.target.value)}
                placeholder='{"version": "1.0", "appName": "Fake", "data": { ... }}'
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white resize-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRecoverySubmit}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  بدء الاستعادة
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
