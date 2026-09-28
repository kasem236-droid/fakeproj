import React, { useState } from 'react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { CustomerModal } from './CustomerModal';
import {
  ArrowRight,
  Phone,
  MessageCircle,
  Calendar,
  Tag,
  FileText,
  Edit3,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose
}) => {
  const { deleteCustomer } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!customer) return null;

  const getSectionBadge = (section: string) => {
    switch (section) {
      case 'sila':
        return { label: 'سيلا (Sila)', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'power':
        return { label: 'باور (Power)', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' };
      default:
        return { label: 'فيك (Fake)', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' };
    }
  };

  const badge = getSectionBadge(customer.section);

  const handleDelete = async () => {
    await deleteCustomer(customer.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
        {/* Top App Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold text-sm px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>العودة للبحث</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="تعديل بيانات العميل"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 transition-colors"
              title="حذف العميل"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 max-w-md w-full mx-auto p-4 space-y-4 pb-20">
          {/* Main Profile Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {customer.name}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-current/10 {badge.bg}">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <a
                href={`tel:${customer.primaryPhone}`}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال هاتفي</span>
              </a>

              <a
                href={`https://wa.me/2${customer.primaryPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/20"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              بيانات الاتصال
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">الهاتف الأساسي</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white" dir="ltr">
                    {customer.primaryPhone}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${customer.primaryPhone}`}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
              >
                اتصال
              </a>
            </div>

            {customer.secondaryPhone && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">الهاتف الإضافي</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white" dir="ltr">
                      {customer.secondaryPhone}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${customer.secondaryPhone}`}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                >
                  اتصال
                </a>
              </div>
            )}
          </div>

          {/* Notes Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>ملاحظات</span>
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl min-h-[60px]">
              {customer.notes ? customer.notes : 'لا توجد ملاحظات مسجلة لهذا العميل.'}
            </p>
          </div>

          {/* Timestamps */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>تاريخ الإضافة: {customer.createdAt}</span>
            </div>
            {customer.updatedAt && (
              <div>
                <span>آخر تحديث: {customer.updatedAt}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <CustomerModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          customerToEdit={customer}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">تأكيد حذف العميل</h4>
                <p className="text-xs text-slate-500">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              هل أنت متأكد من حذف العميل <span className="font-bold text-slate-900 dark:text-white">"{customer.name}"</span>؟
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
