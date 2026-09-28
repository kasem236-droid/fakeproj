import React, { useState, useEffect } from 'react';
import { PurchaseInvoice, InvoiceItem, Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../services/storage';
import { X, Plus, Trash2, Calendar, User, Phone, FileText, Check, AlertCircle } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: PurchaseInvoice | null;
  onSaved?: (invoice: PurchaseInvoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  onSaved
}) => {
  const { suppliers, addSupplier, createInvoice, updateInvoice, getNextInvoiceNumber } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 'item-' + Date.now(), name: '', quantity: 1, purchasePrice: 0, itemTotal: 0 }
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceToEdit) {
      setSelectedSupplierId(invoiceToEdit.supplierId);
      setSupplierName(invoiceToEdit.supplierName);
      setSupplierPhone(invoiceToEdit.supplierPhone || '');
      setDate(invoiceToEdit.date);
      setNotes(invoiceToEdit.notes || '');
      setItems(invoiceToEdit.items && invoiceToEdit.items.length ? invoiceToEdit.items : [
        { id: 'item-' + Date.now(), name: '', quantity: 1, purchasePrice: 0, itemTotal: 0 }
      ]);
    } else {
      setSelectedSupplierId('');
      setSupplierName('');
      setSupplierPhone('');
      setDate(getTodayDateString());
      setNotes('');
      setItems([
        { id: 'item-' + Date.now(), name: '', quantity: 1, purchasePrice: 0, itemTotal: 0 }
      ]);
    }
    setErrorMsg(null);
  }, [invoiceToEdit, isOpen]);

  const handleSupplierSelect = (suppId: string) => {
    setSelectedSupplierId(suppId);
    const supp = suppliers.find(s => s.id === suppId);
    if (supp) {
      setSupplierName(supp.name);
      setSupplierPhone(supp.phone);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Automatic item total calculation: Quantity * PurchasePrice
    if (field === 'quantity' || field === 'purchasePrice') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(current.quantity) || 0;
      const p = field === 'purchasePrice' ? Number(value) || 0 : Number(current.purchasePrice) || 0;
      current.itemTotal = q * p;
    }

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { id: 'item-' + Date.now() + Math.random(), name: '', quantity: 1, purchasePrice: 0, itemTotal: 0 }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      // Clear row instead of removing last row
      setItems([{ id: 'item-' + Date.now(), name: '', quantity: 1, purchasePrice: 0, itemTotal: 0 }]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Automatic invoice total: sum of item totals
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.itemTotal) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!supplierName.trim()) {
      setErrorMsg('يرجى تحديد أو إدخال اسم المورد');
      return;
    }
    if (!date) {
      setErrorMsg('يرجى تحديد تاريخ الفاتورة');
      return;
    }
    if (items.length === 0 || !items.some(i => i.name.trim() && i.quantity > 0 && i.purchasePrice > 0)) {
      setErrorMsg('يرجى إدخال صنف واحد على الأقل مع الاسم والكمية وسعر الشراء');
      return;
    }

    try {
      let finalSupplierId = selectedSupplierId;

      // If new supplier entered manually, create supplier
      if (!finalSupplierId) {
        const newSupp = await addSupplier({
          name: supplierName.trim(),
          phone: supplierPhone.trim(),
          notes: ''
        });
        finalSupplierId = newSupp.id;
      }

      const validItems = items.filter(i => i.name.trim());

      if (invoiceToEdit) {
        await updateInvoice(invoiceToEdit.id, {
          supplierId: finalSupplierId,
          supplierName: supplierName.trim(),
          supplierPhone: supplierPhone.trim(),
          date,
          items: validItems,
          totalAmount,
          notes: notes.trim()
        });
        if (onSaved) {
          onSaved({
            ...invoiceToEdit,
            supplierId: finalSupplierId,
            supplierName: supplierName.trim(),
            supplierPhone: supplierPhone.trim(),
            date,
            items: validItems,
            totalAmount,
            notes: notes.trim()
          });
        }
      } else {
        const savedInvoice = await createInvoice({
          supplierId: finalSupplierId,
          supplierName: supplierName.trim(),
          supplierPhone: supplierPhone.trim(),
          date,
          items: validItems,
          totalAmount,
          notes: notes.trim()
        });
        if (onSaved) {
          onSaved(savedInvoice);
        }
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>{invoiceToEdit ? `تعديل فاتورة ${invoiceToEdit.invoiceNumber}` : 'فاتورة مشتريات جديدة'}</span>
              {!invoiceToEdit && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold">
                  {getNextInvoiceNumber()}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">حسابات التوريد والكميات التلقائية</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Supplier Selector or Manual Entry */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                اختيار مورد مسجل
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- مورد جديد / يدوي --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاريخ الفاتورة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المورد <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="اسم المورد أو الشركة"
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                هاتف المورد
              </label>
              <input
                type="tel"
                dir="ltr"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
              />
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                بنود ومحتويات الفاتورة
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة صنف</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      placeholder="اسم الصنف / البيان..."
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="حذف البند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">الكمية</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="1"
                        className="w-full py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-center font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">سعر الشراء</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.purchasePrice || ''}
                        onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                        placeholder="0"
                        className="w-full py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-center font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">الإجمالي (ج.م)</span>
                      <div className="py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black text-center">
                        {item.itemTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Total Banner */}
          <div className="p-3 rounded-xl bg-emerald-600 text-white flex items-center justify-between shadow-md shadow-emerald-600/20">
            <span className="text-xs font-bold">إجمالي الفاتورة:</span>
            <span className="text-lg font-black">{totalAmount.toLocaleString()} ج.م</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات الفاتورة (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم الاستلام بمخزن القاهرة..."
              className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{invoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
