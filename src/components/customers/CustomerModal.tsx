import React, { useState, useEffect } from 'react';
import { Customer, CustomerSection } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, AlertTriangle, User, Phone, Tag, FileText, CheckCircle2 } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit
}) => {
  const { addCustomer, updateCustomer, checkDuplicatePhone } = useApp();

  const [name, setName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [section, setSection] = useState<CustomerSection>('fake');
  const [notes, setNotes] = useState('');

  // Duplicate warning acknowledgment state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isDuplicateAcknowledged, setIsDuplicateAcknowledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPrimaryPhone(customerToEdit.primaryPhone);
      setSecondaryPhone(customerToEdit.secondaryPhone || '');
      setSection(customerToEdit.section);
      setNotes(customerToEdit.notes || '');
      setDuplicateWarning(null);
      setIsDuplicateAcknowledged(true);
    } else {
      setName('');
      setPrimaryPhone('');
      setSecondaryPhone('');
      setSection('fake');
      setNotes('');
      setDuplicateWarning(null);
      setIsDuplicateAcknowledged(false);
    }
    setErrorMsg(null);
  }, [customerToEdit, isOpen]);

  // Check duplicate phone on blur or change
  const handlePhoneBlur = () => {
    if (!primaryPhone.trim()) return;
    const isDup = checkDuplicatePhone(primaryPhone.trim(), customerToEdit?.id);
    if (isDup) {
      setDuplicateWarning(`تنبيه: رقم الهاتف (${primaryPhone}) مسجل بالفعل لعميل آخر في النظام.`);
      setIsDuplicateAcknowledged(false);
    } else {
      setDuplicateWarning(null);
      setIsDuplicateAcknowledged(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم العميل');
      return;
    }
    if (!primaryPhone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف الأساسي');
      return;
    }

    // Check duplicate phone if not acknowledged
    const isDup = checkDuplicatePhone(primaryPhone.trim(), customerToEdit?.id);
    if (isDup && !isDuplicateAcknowledged) {
      setDuplicateWarning(`تنبيه: رقم الهاتف (${primaryPhone}) مسجل مسبقاً! يجب الموافقة على المتابعة.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (customerToEdit) {
        await updateCustomer(customerToEdit.id, {
          name: name.trim(),
          primaryPhone: primaryPhone.trim(),
          secondaryPhone: secondaryPhone.trim(),
          section,
          notes: notes.trim()
        });
      } else {
        await addCustomer({
          name: name.trim(),
          primaryPhone: primaryPhone.trim(),
          secondaryPhone: secondaryPhone.trim(),
          section,
          notes: notes.trim()
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {customerToEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
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
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم العميل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم العميل ثلاثي أو اسم المنشأة"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              القسم التابع له <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'sila', label: 'سيلا (Sila)', color: 'border-purple-300 text-purple-600' },
                  { id: 'power', label: 'باور (Power)', color: 'border-amber-300 text-amber-600' },
                  { id: 'fake', label: 'فيك (Fake)', color: 'border-emerald-300 text-emerald-600' }
                ] as const
              ).map((sec) => (
                <button
                  type="button"
                  key={sec.id}
                  onClick={() => setSection(sec.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    section === sec.id
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم الهاتف الأساسي <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                dir="ltr"
                value={primaryPhone}
                onChange={(e) => {
                  setPrimaryPhone(e.target.value);
                  setDuplicateWarning(null);
                }}
                onBlur={handlePhoneBlur}
                placeholder="010XXXXXXXX"
                className="w-full text-right py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Duplicate Phone Warning */}
            {duplicateWarning && (
              <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                <div className="flex items-start gap-2 mb-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>{duplicateWarning}</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-1 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                  <input
                    type="checkbox"
                    checked={isDuplicateAcknowledged}
                    onChange={(e) => setIsDuplicateAcknowledged(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    أقر بتكرار رقم الهاتف وأريد المتابعة والحفظ
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Secondary Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم هاتف إضافي (اختياري)
            </label>
            <input
              type="tel"
              dir="ltr"
              value={secondaryPhone}
              onChange={(e) => setSecondaryPhone(e.target.value)}
              placeholder="011XXXXXXXX"
              className="w-full text-right py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظات
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="العنوان، المواعيد، أو أي تفاصيل خاصة..."
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || (Boolean(duplicateWarning) && !isDuplicateAcknowledged)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{customerToEdit ? 'حفظ التعديلات' : 'إضافة العميل'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
