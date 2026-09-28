import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Building2, Phone, FileText, CheckCircle2 } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit
}) => {
  const { addSupplier, updateSupplier } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setPhone(supplierToEdit.phone || '');
      setNotes(supplierToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setNotes('');
    }
    setErrorMsg(null);
  }, [supplierToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المورد');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف المورد');
      return;
    }

    try {
      if (supplierToEdit) {
        await updateSupplier(supplierToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim()
        });
      } else {
        await addSupplier({
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim()
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ بيانات المورد');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {supplierToEdit ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المورد / الشركة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شركة النور للتوريدات"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم الهاتف <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010XXXXXXXX"
              className="w-full text-right py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظات
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تفاصيل التوريد أو التعامل..."
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{supplierToEdit ? 'حفظ التعديلات' : 'إضافة المورد'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
