export type CustomerSection = 'sila' | 'power' | 'fake';

export interface Customer {
  id: string;
  name: string;
  primaryPhone: string;
  secondaryPhone: string;
  section: CustomerSection;
  notes: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  itemTotal: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string; // S1, S2, S3...
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  date: string; // YYYY-MM-DD
  items: InvoiceItem[];
  totalAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'vodafone_cash' | 'instapay';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  notes: string;
  totalDebt: number;
  totalPaid: number;
  remainingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}

export interface SupplierStatementEntry {
  id: string;
  supplierId: string;
  date: string; // YYYY-MM-DD
  type: 'invoice' | 'payment';
  invoiceNumber?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod | string;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export interface ExternalRecipient {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export type TreasuryTransactionType =
  | 'deposit'
  | 'supplier_payment'
  | 'external_transfer'
  | 'expense';

export interface TreasuryTransaction {
  id: string;
  type: TreasuryTransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  sourceOrRecipient: string;
  paymentMethod?: PaymentMethod;
  relatedSupplierId?: string;
  relatedInvoiceId?: string;
  relatedStatementId?: string;
  note?: string;
  balanceAfter: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TreasurySummary {
  balance: number;
  totalDeposits: number;
  totalSupplierTransfers: number;
  totalExternalTransfers: number;
  totalTransfers: number; // supplier payments + external transfers
  totalExpenses: number;
}

export type AppTheme = 'light' | 'dark' | 'night';

export type SyncStatus = 'online' | 'offline' | 'syncing';

export type MainTab = 'home' | 'customers' | 'purchases' | 'external_transfers' | 'treasury' | 'settings';

export interface UndoableAction {
  id: string;
  timestamp: number;
  description: string;
  type: TreasuryTransactionType | 'invoice_create';
  data: {
    transactionId?: string;
    invoiceId?: string;
    paymentId?: string;
    statementId?: string;
    supplierId?: string;
    amount?: number;
    previousSupplierBalance?: number;
    previousTreasuryBalance?: number;
  };
}
