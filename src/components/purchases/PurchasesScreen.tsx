import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseInvoice, Supplier } from '../../types';
import { InvoiceModal } from './InvoiceModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { SupplierModal } from './SupplierModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { SupplierStatementModal } from './SupplierStatementModal';
import {
  ShoppingBag,
  FileText,
  Building2,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Share2,
  Trash2,
  Eye,
  AlertCircle,
  Filter
} from 'lucide-react';

export const PurchasesScreen: React.FC = () => {
  const {
    activePurchaseSubTab,
    setActivePurchaseSubTab,
    invoices,
    suppliers,
    deleteInvoice,
    deleteSupplier
  } = useApp();

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<PurchaseInvoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<PurchaseInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<PurchaseInvoice | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);
  const [paymentSupplierId, setPaymentSupplierId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Invoices Search and Filter States
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStartDate, setInvoiceStartDate] = useState('');
  const [invoiceEndDate, setInvoiceEndDate] = useState('');

  // Suppliers Search
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = invoiceSearchQuery.trim().toLowerCase();
      if (q) {
        const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
        const suppNameMatch = inv.supplierName.toLowerCase().includes(q);
        const suppPhoneMatch = inv.supplierPhone && inv.supplierPhone.includes(q);
        const dateMatch = inv.date.includes(q);
        if (!numMatch && !suppNameMatch && !suppPhoneMatch && !dateMatch) return false;
      }

      if (invoiceStartDate && inv.date < invoiceStartDate) return false;
      if (invoiceEndDate && inv.date > invoiceEndDate) return false;

      return true;
    });
  }, [invoices, invoiceSearchQuery, invoiceStartDate, invoiceEndDate]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    const q = supplierSearchQuery.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q))
    );
  }, [suppliers, supplierSearchQuery]);

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-3">
      {/* Top Header & SubTabs Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">المشتريات والتوريدات</h2>
            <p className="text-xs text-slate-400">إدارة الفواتير وحسابات الموردين</p>
          </div>
        </div>

        {activePurchaseSubTab === 'invoices' ? (
          <button
            onClick={() => {
              setInvoiceToEdit(null);
              setIsInvoiceModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>فاتورة جديدة</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setSupplierToEdit(null);
              setIsSupplierModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>مورد جديد</span>
          </button>
        )}
      </div>

      {/* Sub Tabs: فواتير المشتريات | الموردين */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActivePurchaseSubTab('invoices')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activePurchaseSubTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>فواتير المشتريات ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActivePurchaseSubTab('suppliers')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activePurchaseSubTab === 'suppliers'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>الموردين ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE INVOICES */}
      {activePurchaseSubTab === 'invoices' && (
        <div className="space-y-3">
          {/* Invoice Search & Date Range Filters */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة (S1...)، اسم أو هاتف المورد..."
                className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Date range filter */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">من تاريخ:</span>
                <input
                  type="date"
                  value={invoiceStartDate}
                  onChange={(e) => setInvoiceStartDate(e.target.value)}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">إلى تاريخ:</span>
                <input
                  type="date"
                  value={invoiceEndDate}
                  onChange={(e) => setInvoiceEndDate(e.target.value)}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {(invoiceSearchQuery || invoiceStartDate || invoiceEndDate) && (
              <button
                onClick={() => {
                  setInvoiceSearchQuery('');
                  setInvoiceStartDate('');
                  setInvoiceEndDate('');
                }}
                className="text-[11px] font-bold text-rose-500 hover:underline pt-1 block text-left"
              >
                إلغاء الفلاتر
              </button>
            )}
          </div>

          {/* Invoices List */}
          <div className="space-y-2">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">لا توجد فواتير مطابقة للبحث</p>
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setPreviewInvoice(inv)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 shadow-sm transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {inv.invoiceNumber}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {inv.supplierName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{inv.date}</span>
                        {inv.supplierPhone && (
                          <span dir="ltr" className="text-[11px]">
                            • {inv.supplierPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {inv.totalAmount.toLocaleString()} ج.م
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {inv.items?.length || 0} أصناف
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div
                    className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة ومشاركة</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setInvoiceToEdit(inv);
                          setIsInvoiceModalOpen(true);
                        }}
                        className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
                      >
                        تعديل
                      </button>

                      <button
                        onClick={() => setInvoiceToDelete(inv)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                        title="حذف الفاتورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {activePurchaseSubTab === 'suppliers' && (
        <div className="space-y-3">
          {/* Supplier Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={supplierSearchQuery}
              onChange={(e) => setSupplierSearchQuery(e.target.value)}
              placeholder="ابحث باسم المورد أو رقم الهاتف..."
              className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Suppliers List */}
          <div className="space-y-2">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">لا يوجد موردين مسجلين</p>
              </div>
            ) : (
              filteredSuppliers.map((supp) => (
                <div
                  key={supp.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {supp.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
                        {supp.phone}
                      </p>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">الرصيد المتبقي له</span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {supp.remainingBalance.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Financial Mini Summary */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">إجمالي المسحوبات</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {supp.totalDebt.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">إجمالي المسدد</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {supp.totalPaid.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => setStatementSupplier(supp)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>كشف حساب</span>
                    </button>

                    <button
                      onClick={() => setPaymentSupplierId(supp.id)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>سداد دفعة</span>
                    </button>

                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => {
                          setSupplierToEdit(supp);
                          setIsSupplierModalOpen(true);
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(supp)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                        title="حذف المورد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Invoice Modals */}
      {isInvoiceModalOpen && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setInvoiceToEdit(null);
          }}
          invoiceToEdit={invoiceToEdit}
          onSaved={(savedInv) => setPreviewInvoice(savedInv)}
        />
      )}

      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onEdit={(inv) => {
            setPreviewInvoice(null);
            setInvoiceToEdit(inv);
            setIsInvoiceModalOpen(true);
          }}
          onDelete={(id) => {
            const inv = invoices.find(i => i.id === id);
            if (inv) {
              setPreviewInvoice(null);
              setInvoiceToDelete(inv);
            }
          }}
        />
      )}

      {/* Delete Invoice Confirmation */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 dark:text-white">تأكيد حذف الفاتورة</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              هل أنت متأكد من حذف الفاتورة رقم{' '}
              <span className="font-bold text-emerald-600">{invoiceToDelete.invoiceNumber}</span>{' '}
              للمورد "{invoiceToDelete.supplierName}"؟
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                ملاحظة: رقم الفاتورة لن يتم إعادة استخدامه حفاظاً على التسلسل الحسابي.
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  await deleteInvoice(invoiceToDelete.id);
                  setInvoiceToDelete(null);
                }}
                className="py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modals */}
      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setSupplierToEdit(null);
          }}
          supplierToEdit={supplierToEdit}
        />
      )}

      {statementSupplier && (
        <SupplierStatementModal
          supplier={statementSupplier}
          onClose={() => setStatementSupplier(null)}
          onMakePayment={(sId) => setPaymentSupplierId(sId)}
        />
      )}

      {paymentSupplierId && (
        <SupplierPaymentModal
          isOpen={Boolean(paymentSupplierId)}
          onClose={() => setPaymentSupplierId(null)}
          defaultSupplierId={paymentSupplierId}
        />
      )}

      {/* Delete Supplier Confirmation */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 dark:text-white">حذف المورد</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              هل تريد بالتأكيد حذف المورد "{supplierToDelete.name}"؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  await deleteSupplier(supplierToDelete.id);
                  setSupplierToDelete(null);
                }}
                className="py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setSupplierToDelete(null)}
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
