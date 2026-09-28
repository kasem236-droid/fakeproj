import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, X, Check } from 'lucide-react';

export const ExitModal: React.FC = () => {
  const { isExitModalOpen, setIsExitModalOpen } = useApp();
  const [hasExited, setHasExited] = useState(false);

  if (!isExitModalOpen) return null;

  if (hasExited) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">تم إغلاق التطبيق</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            تم حفظ جميع البيانات بنجاح. يمكنك إعادة فتح التطبيق في أي وقت.
          </p>
          <button
            onClick={() => {
              setHasExited(false);
              setIsExitModalOpen(false);
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-lg shadow-emerald-600/20"
          >
            إعادة فتح Fake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-rose-500">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">تأكيد الخروج</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">إغلاق جلسة العمل الحالية</p>
          </div>
        </div>

        <p className="text-slate-700 dark:text-slate-200 text-base font-semibold mb-6 text-center py-2">
          هل تريد الخروج من التطبيق؟
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setHasExited(true);
            }}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-600/25 active:scale-95 flex items-center justify-center gap-1.5"
          >
            نعم
          </button>

          <button
            onClick={() => setIsExitModalOpen(false)}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
