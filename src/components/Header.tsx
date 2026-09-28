import React from 'react';
import { useApp } from '../context/AppContext';
import { Wifi, WifiOff, RefreshCw, LogOut, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { syncStatus, setIsExitModalOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 py-2.5 shadow-sm transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* App Title & Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <span className="font-extrabold text-sm tracking-wider">F</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Fake</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              إدارة الأعمال وحسابات العملاء
            </p>
          </div>
        </div>

        {/* Status Indicator & Exit Button */}
        <div className="flex items-center gap-2">
          {/* Strictly one active connection state shown */}
          {syncStatus === 'online' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Wifi className="w-3.5 h-3.5" />
              <span>ONLINE</span>
            </div>
          )}

          {syncStatus === 'offline' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <WifiOff className="w-3.5 h-3.5" />
              <span>OFFLINE</span>
            </div>
          )}

          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>SYNCING</span>
            </div>
          )}

          {/* Exit confirmation trigger */}
          <button
            onClick={() => setIsExitModalOpen(true)}
            title="الخروج من التطبيق"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
