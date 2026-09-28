import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerSection } from '../../types';
import { CustomerModal } from '../customers/CustomerModal';
import {
  Search,
  UserPlus,
  Phone,
  MessageCircle,
  Tag,
  X,
  ChevronLeft,
  Users,
  AlertCircle
} from 'lucide-react';

interface HighlightProps {
  text: string;
  query: string;
}

const HighlightText: React.FC<HighlightProps> = ({ text, query }) => {
  if (!query || !query.trim() || !text) {
    return <span>{text}</span>;
  }

  const cleanQuery = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(cleanQuery);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + cleanQuery.length);
  const after = text.substring(index + cleanQuery.length);

  return (
    <span>
      {before}
      <span className="bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 font-black px-0.5 rounded">
        {match}
      </span>
      <HighlightText text={after} query={query} />
    </span>
  );
};

export const HomeSearchScreen: React.FC = () => {
  const {
    customers,
    searchQuery,
    setSearchQuery,
    selectedSectionFilter,
    setSelectedSectionFilter,
    setSelectedCustomerForDetail
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Live dynamic customer counts for all sections (synced with Firebase and updates immediately)
  const sectionCounts = useMemo(() => {
    return {
      all: customers.length,
      sila: customers.filter(c => c.section === 'sila').length,
      power: customers.filter(c => c.section === 'power').length,
      fake: customers.filter(c => c.section === 'fake').length,
    };
  }, [customers]);

  // Fast search & filter across all customer fields
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      // 1. Section filtering
      if (selectedSectionFilter !== 'all' && customer.section !== selectedSectionFilter) {
        return false;
      }

      // 2. Query search
      if (!q) return true;

      const nameMatch = customer.name.toLowerCase().includes(q);
      const primaryPhoneMatch = customer.primaryPhone.toLowerCase().includes(q);
      const secondaryPhoneMatch = Boolean(customer.secondaryPhone && customer.secondaryPhone.toLowerCase().includes(q));

      return nameMatch || primaryPhoneMatch || secondaryPhoneMatch;
    });
  }, [customers, searchQuery, selectedSectionFilter]);

  const getSectionBadge = (section: CustomerSection) => {
    switch (section) {
      case 'sila':
        return { label: 'سيلا', bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'power':
        return { label: 'باور', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'fake':
      default:
        return { label: 'فيك', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] max-w-md mx-auto px-4 pt-3 pb-24">
      {/* Central Search Section */}
      <div className="w-full space-y-3 pt-1">
        {/* Large Prominent Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم الكامل أو الجزئي أو رقم الهاتف..."
            className="w-full py-3.5 pr-11 pl-10 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm transition-all"
            autoFocus
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <X className="w-3 h-3" />
              </div>
            </button>
          )}
        </div>

        {/* Live Customer Counts Banner */}
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar shadow-inner">
          <span className={selectedSectionFilter === 'all' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
            All ({sectionCounts.all})
          </span>
          <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
          <span className={selectedSectionFilter === 'sila' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
            Sila ({sectionCounts.sila})
          </span>
          <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
          <span className={selectedSectionFilter === 'power' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
            Power ({sectionCounts.power})
          </span>
          <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
          <span className={selectedSectionFilter === 'fake' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
            Fake ({sectionCounts.fake})
          </span>
        </div>

        {/* Section Filters directly underneath the search bar */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          {(
            [
              { id: 'all', label: 'All', arabic: 'الكل', count: sectionCounts.all },
              { id: 'sila', label: 'Sila', arabic: 'سيلا', count: sectionCounts.sila },
              { id: 'power', label: 'Power', arabic: 'باور', count: sectionCounts.power },
              { id: 'fake', label: 'Fake', arabic: 'فيك', count: sectionCounts.fake }
            ] as const
          ).map((filter) => {
            const isSelected = selectedSectionFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedSectionFilter(filter.id)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02] font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 font-bold'
                }`}
              >
                <span className="text-xs font-bold leading-tight">
                  {filter.label} ({filter.count})
                </span>
                <span className="text-[10px] opacity-75 font-normal mt-0.5">
                  {filter.arabic}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter & Fast Add Button */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              نتائج البحث:{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {filteredCustomers.length}
              </strong>{' '}
              عميل
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Customer Results List */}
      <div className="mt-3 flex-1 space-y-2.5">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-14 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              لا توجد نتائج مطابقة
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
              لم نعثر على أي عميل يطابق بحثك "{searchQuery}" في هذا القسم.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة هذا العميل الآن</span>
            </button>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const badge = getSectionBadge(customer.section);

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomerForDetail(customer)}
                className="w-full text-right p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        <HighlightText text={customer.name} query={searchQuery} />
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Phones */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span className="font-semibold">
                          <HighlightText text={customer.primaryPhone} query={searchQuery} />
                        </span>
                      </div>

                      {customer.secondaryPhone && (
                        <div className="flex items-center gap-1 text-slate-400" dir="ltr">
                          <span className="text-[10px]">إضافي:</span>
                          <span className="font-medium">
                            <HighlightText text={customer.secondaryPhone} query={searchQuery} />
                          </span>
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {customer.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${customer.primaryPhone}`}
                      title="اتصال هاتفي"
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <a
                      href={`https://wa.me/2${customer.primaryPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="مراسلة واتساب"
                      className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <div className="p-1 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) for quick customer adding */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-16 left-4 z-20 w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
        title="إضافة عميل جديد"
      >
        <UserPlus className="w-6 h-6" />
      </button>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <CustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};
