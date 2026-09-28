import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerSection } from '../../types';
import { CustomerModal } from './CustomerModal';
import {
  Users,
  UserPlus,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  Tag,
  AlertCircle
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    deleteCustomer,
    setSelectedCustomerForDetail
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | CustomerSection>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => {
    if (activeFilter !== 'all' && c.section !== activeFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.primaryPhone.includes(q) ||
      (c.secondaryPhone && c.secondaryPhone.includes(q))
    );
  });

  const getSectionBadge = (section: CustomerSection) => {
    switch (section) {
      case 'sila':
        return { label: 'سيلا', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'power':
        return { label: 'باور', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' };
      default:
        return { label: 'فيك', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' };
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">دليل العملاء</h2>
            <p className="text-xs text-slate-400">إجمالي {customers.length} عميل مسجل</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>عميل جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهاتف..."
            className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: 'all', label: 'الكل' },
              { id: 'sila', label: 'سيلا' },
              { id: 'power', label: 'باور' },
              { id: 'fake', label: 'فيك' }
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === f.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-2 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">لا يوجد عملاء في هذه القائمة</p>
          </div>
        ) : (
          filtered.map((customer) => {
            const badge = getSectionBadge(customer.section);

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomerForDetail(customer)}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 shadow-sm cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-500" dir="ltr">
                        {customer.primaryPhone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${customer.primaryPhone}`}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                      title="اتصال"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setCustomerToEdit(customer)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {customer.notes && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                    {customer.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || customerToEdit) && (
        <CustomerModal
          isOpen={isAddModalOpen || Boolean(customerToEdit)}
          onClose={() => {
            setIsAddModalOpen(false);
            setCustomerToEdit(null);
          }}
          customerToEdit={customerToEdit}
        />
      )}

      {/* Delete Confirmation */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 dark:text-white">حذف العميل</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5">
              هل أنت متأكد من حذف العميل "{customerToDelete.name}" نهائياً؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  await deleteCustomer(customerToDelete.id);
                  setCustomerToDelete(null);
                }}
                className="py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setCustomerToDelete(null)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
