import React from 'react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';
import { Search, Users, ShoppingBag, Send, Landmark, Settings } from 'lucide-react';

interface NavItem {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'الرئيسية', icon: Search },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'purchases', label: 'المشتريات', icon: ShoppingBag },
  { id: 'external_transfers', label: 'التحويلات', icon: Send },
  { id: 'treasury', label: 'الخزينة', icon: Landmark },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md px-1 py-1 shadow-lg transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-6 items-center">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-black scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tighter truncate max-w-full font-bold">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
