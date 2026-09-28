import {
  Customer,
  PurchaseInvoice,
  Supplier,
  SupplierPayment,
  SupplierStatementEntry,
  ExternalRecipient,
  TreasuryTransaction,
  UndoableAction,
  AppTheme
} from '../types';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

const STORAGE_KEYS = {
  CUSTOMERS: 'fake_app_customers',
  SUPPLIERS: 'fake_app_suppliers',
  INVOICES: 'fake_app_invoices',
  PAYMENTS: 'fake_app_payments',
  STATEMENTS: 'fake_app_statements',
  TREASURY: 'fake_app_treasury_tx',
  RECIPIENTS: 'fake_app_recipients',
  LAST_INVOICE_NUM: 'fake_app_last_invoice_num',
  THEME: 'fake_app_theme',
  UNDO_STACK: 'fake_app_undo_stack'
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Recomputes running balance for all treasury transactions in chronological order.
 * Deposits increase the balance (+), transfers and expenses decrease the balance (-).
 */
export const recalculateTreasuryBalances = (transactions: TreasuryTransaction[]): TreasuryTransaction[] => {
  // Sort chronologically: date ascending, then createdAt ascending, then id ascending
  const sorted = [...transactions].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    const c = (a.createdAt || '').localeCompare(b.createdAt || '');
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });

  let balance = 0;
  return sorted.map((tx) => {
    if (tx.type === 'deposit') {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
    return {
      ...tx,
      balanceAfter: balance
    };
  });
};

// Initial Seed Data if app is first run
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'أحمد محمود الشرقاوي',
    primaryPhone: '01012345678',
    secondaryPhone: '01223456789',
    section: 'fake',
    notes: 'عميل مميز - توريدات خاصة',
    createdAt: '2026-09-20',
    updatedAt: '2026-09-20'
  },
  {
    id: 'cust-2',
    name: 'شركة باور تك للتجارة',
    primaryPhone: '01123456780',
    secondaryPhone: '01098765432',
    section: 'power',
    notes: 'حساب قطاع تجاري',
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'cust-3',
    name: 'مؤسسة سيلا العالمية',
    primaryPhone: '01555544433',
    secondaryPhone: '',
    section: 'sila',
    notes: 'طلبات دورية أسبوعية',
    createdAt: '2026-09-23',
    updatedAt: '2026-09-23'
  },
  {
    id: 'cust-4',
    name: 'محمود عبد الرحيم فيك',
    primaryPhone: '01033322211',
    secondaryPhone: '01144455566',
    section: 'fake',
    notes: 'فرع الجيزة',
    createdAt: '2026-09-24',
    updatedAt: '2026-09-24'
  }
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    name: 'شركة النور للمهمات',
    phone: '01011122233',
    notes: 'المورد الرئيسي لمستلزمات الإنتاج',
    totalDebt: 100000,
    totalPaid: 45000,
    remainingBalance: 55000,
    createdAt: '2026-09-10',
    updatedAt: '2026-09-25'
  },
  {
    id: 'supp-2',
    name: 'مؤسسة الأهرام للتوريدات',
    phone: '01233344455',
    notes: 'دفعات نقدية وفودافون كاش',
    totalDebt: 60000,
    totalPaid: 20000,
    remainingBalance: 40000,
    createdAt: '2026-09-15',
    updatedAt: '2026-09-26'
  }
];

export const SEED_RECIPIENTS: ExternalRecipient[] = [
  { id: 'rec-1', name: 'أيمن', phone: '01099887766', notes: 'شريك خارجي', createdAt: '2026-09-10' },
  { id: 'rec-2', name: 'محمد', phone: '01122334455', notes: 'سائق ومندوب نقليات', createdAt: '2026-09-12' },
  { id: 'rec-3', name: 'شركة الصيانة والتطوير', phone: '01288776655', notes: 'عقد صيانة شهري', createdAt: '2026-09-15' }
];

export const SEED_TREASURY: TreasuryTransaction[] = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 150000,
    date: '2026-09-18',
    sourceOrRecipient: 'رأس مال افتتاحي',
    note: 'إيداع بدء التشغيل في الخزينة',
    balanceAfter: 150000,
    createdAt: '2026-09-18'
  },
  {
    id: 'tx-2',
    type: 'supplier_payment',
    amount: 45000,
    date: '2026-09-20',
    sourceOrRecipient: 'شركة النور للمهمات',
    paymentMethod: 'cash',
    relatedSupplierId: 'supp-1',
    note: 'دفعة نقدية تحت حساب الفاتورة',
    balanceAfter: 105000,
    createdAt: '2026-09-20'
  },
  {
    id: 'tx-3',
    type: 'external_transfer',
    amount: 3000,
    date: '2026-09-22',
    sourceOrRecipient: 'أيمن',
    note: 'مصروفات تشغيل ومستحقات',
    balanceAfter: 102000,
    createdAt: '2026-09-22'
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 1500,
    date: '2026-09-24',
    sourceOrRecipient: 'فاتورة كهرباء وإنترنت',
    note: 'مصروفات مقر العمل',
    balanceAfter: 100500,
    createdAt: '2026-09-24'
  }
];

export const SEED_INVOICES: PurchaseInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'S1',
    supplierId: 'supp-1',
    supplierName: 'شركة النور للمهمات',
    supplierPhone: '01011122233',
    date: '2026-09-19',
    items: [
      { id: 'item-1', name: 'خامات أولية فئة أ', quantity: 200, purchasePrice: 350, itemTotal: 70000 },
      { id: 'item-2', name: 'ملحقات ومواد تعبئة', quantity: 150, purchasePrice: 200, itemTotal: 30000 }
    ],
    totalAmount: 100000,
    notes: 'تم استلام البضاعة بالمخزن الرئيسي',
    createdAt: '2026-09-19',
    updatedAt: '2026-09-19'
  }
];

export const SEED_STATEMENTS: SupplierStatementEntry[] = [
  {
    id: 'stmt-1',
    supplierId: 'supp-1',
    date: '2026-09-19',
    type: 'invoice',
    invoiceNumber: 'S1',
    invoiceAmount: 100000,
    balanceAfter: 100000,
    notes: 'فاتورة مشتريات رقم S1',
    createdAt: '2026-09-19'
  },
  {
    id: 'stmt-2',
    supplierId: 'supp-1',
    date: '2026-09-20',
    type: 'payment',
    paymentAmount: 45000,
    paymentMethod: 'cash',
    balanceAfter: 55000,
    notes: 'سداد نقدي من الخزينة',
    createdAt: '2026-09-20'
  }
];

// Helper to safely load from LocalStorage
export function loadLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

// Helper to safely write to LocalStorage
export function saveLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

// Check initial seed
export function initializeSeedDataIfNeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    saveLocal(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
    saveLocal(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    saveLocal(STORAGE_KEYS.INVOICES, SEED_INVOICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STATEMENTS)) {
    saveLocal(STORAGE_KEYS.STATEMENTS, SEED_STATEMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TREASURY)) {
    saveLocal(STORAGE_KEYS.TREASURY, SEED_TREASURY);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECIPIENTS)) {
    saveLocal(STORAGE_KEYS.RECIPIENTS, SEED_RECIPIENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LAST_INVOICE_NUM)) {
    saveLocal(STORAGE_KEYS.LAST_INVOICE_NUM, 1);
  }
  if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
    saveLocal(STORAGE_KEYS.THEME, 'light');
  }
}

export { STORAGE_KEYS };
