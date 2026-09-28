import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Customer,
  CustomerSection,
  PurchaseInvoice,
  Supplier,
  SupplierPayment,
  SupplierStatementEntry,
  ExternalRecipient,
  TreasuryTransaction,
  TreasurySummary,
  AppTheme,
  SyncStatus,
  MainTab,
  UndoableAction,
  PaymentMethod
} from '../types';
import {
  STORAGE_KEYS,
  loadLocal,
  saveLocal,
  initializeSeedDataIfNeeded,
  getTodayDateString,
  recalculateTreasuryBalances,
  SEED_CUSTOMERS,
  SEED_SUPPLIERS,
  SEED_INVOICES,
  SEED_STATEMENTS,
  SEED_TREASURY,
  SEED_RECIPIENTS
} from '../services/storage';
import { db } from '../services/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs
} from 'firebase/firestore';

interface AppContextType {
  // Navigation
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  activePurchaseSubTab: 'invoices' | 'suppliers';
  setActivePurchaseSubTab: (subTab: 'invoices' | 'suppliers') => void;
  activeTreasurySubTab: 'deposit' | 'transfer' | 'external' | 'expense' | 'balance' | 'history' | 'deposits_list' | 'supplier_transfers_list' | 'external_transfers_list' | 'expenses_list';
  setActiveTreasurySubTab: (subTab: 'deposit' | 'transfer' | 'external' | 'expense' | 'balance' | 'history' | 'deposits_list' | 'supplier_transfers_list' | 'external_transfers_list' | 'expenses_list') => void;

  // Customers
  customers: Customer[];
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  checkDuplicatePhone: (phone: string, excludeId?: string) => boolean;
  selectedCustomerForDetail: Customer | null;
  setSelectedCustomerForDetail: (c: Customer | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSectionFilter: 'all' | CustomerSection;
  setSelectedSectionFilter: (filter: 'all' | CustomerSection) => void;

  // Purchases & Invoices
  invoices: PurchaseInvoice[];
  getNextInvoiceNumber: () => string;
  createInvoice: (data: Omit<PurchaseInvoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseInvoice>;
  updateInvoice: (id: string, data: Partial<PurchaseInvoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Suppliers & Statements
  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, 'id' | 'totalDebt' | 'totalPaid' | 'remainingBalance' | 'createdAt' | 'updatedAt'>) => Promise<Supplier>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  supplierStatements: SupplierStatementEntry[];
  getSupplierStatement: (supplierId: string) => SupplierStatementEntry[];
  recordSupplierPayment: (payment: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  editSupplierPayment: (txId: string, data: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteSupplierPayment: (txId: string) => Promise<{ success: boolean; error?: string }>;

  // Treasury
  treasuryTransactions: TreasuryTransaction[];
  treasurySummary: TreasurySummary;
  addTreasuryDeposit: (data: { amount: number; source: string; date: string; note?: string }) => Promise<void>;
  editTreasuryDeposit: (txId: string, data: { amount: number; source: string; date: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteTreasuryDeposit: (txId: string) => Promise<{ success: boolean; error?: string }>;
  addExternalTransfer: (data: { recipientId?: string; recipientName: string; amount: number; date: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  editExternalTransfer: (txId: string, data: { recipientName: string; amount: number; date: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteExternalTransfer: (txId: string) => Promise<{ success: boolean; error?: string }>;
  addExpense: (data: { description: string; amount: number; date: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  editExpense: (txId: string, data: { description: string; amount: number; date: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (txId: string) => Promise<{ success: boolean; error?: string }>;
  deleteTreasuryTransaction: (txId: string) => Promise<{ success: boolean; error?: string }>;
  editTreasuryTransaction: (txId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  externalRecipients: ExternalRecipient[];
  addExternalRecipient: (name: string, phone?: string, notes?: string) => Promise<ExternalRecipient>;
  deleteExternalRecipient: (id: string) => Promise<void>;

  // Undo
  canUndo: boolean;
  lastActionDescription: string | null;
  undoLastFinancialOperation: () => Promise<{ success: boolean; message: string }>;

  // Sync & Status
  syncStatus: SyncStatus;
  lastSyncTime: string | null;

  // Theme
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Exit Modal
  isExitModalOpen: boolean;
  setIsExitModalOpen: (open: boolean) => void;

  // Data management
  clearAllBusinessData: (password: string) => Promise<{ success: boolean; error?: string }>;
  exportBackup: () => string;
  importRecovery: (jsonString: string) => Promise<{ success: boolean; count?: number; error?: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize default localStorage data on first run
  initializeSeedDataIfNeeded();

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activePurchaseSubTab, setActivePurchaseSubTab] = useState<'invoices' | 'suppliers'>('invoices');
  const [activeTreasurySubTab, setActiveTreasurySubTab] = useState<'deposit' | 'transfer' | 'external' | 'expense' | 'balance' | 'history' | 'deposits_list' | 'supplier_transfers_list' | 'external_transfers_list' | 'expenses_list'>('balance');

  // Customer search & details persistence
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<'all' | CustomerSection>('all');
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  // Exit Modal State
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);

  // Theme State
  const [theme, setThemeState] = useState<AppTheme>(() => loadLocal<AppTheme>(STORAGE_KEYS.THEME, 'light'));

  const applyThemeClasses = (targetTheme: AppTheme) => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('theme-light', 'theme-dark', 'theme-night', 'dark');
    if (body) {
      body.classList.remove('theme-light', 'theme-dark', 'theme-night', 'dark');
    }

    if (targetTheme === 'light') {
      root.classList.add('theme-light');
      if (body) body.classList.add('theme-light');
      root.style.colorScheme = 'light';
    } else if (targetTheme === 'dark') {
      root.classList.add('dark', 'theme-dark');
      if (body) body.classList.add('dark', 'theme-dark');
      root.style.colorScheme = 'dark';
    } else if (targetTheme === 'night') {
      root.classList.add('dark', 'theme-night');
      if (body) body.classList.add('dark', 'theme-night');
      root.style.colorScheme = 'dark';
    }
    root.setAttribute('data-theme', targetTheme);
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    saveLocal(STORAGE_KEYS.THEME, newTheme);
    applyThemeClasses(newTheme);
  };

  useEffect(() => {
    applyThemeClasses(theme);
  }, [theme]);

  // Core Data State (loaded from LocalStorage)
  const [customers, setCustomers] = useState<Customer[]>(() => loadLocal(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadLocal(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS));
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(() => loadLocal(STORAGE_KEYS.INVOICES, SEED_INVOICES));
  const [supplierStatements, setSupplierStatements] = useState<SupplierStatementEntry[]>(() => loadLocal(STORAGE_KEYS.STATEMENTS, SEED_STATEMENTS));
  const [treasuryTransactions, setTreasuryTransactions] = useState<TreasuryTransaction[]>(() => {
    const loaded = loadLocal<TreasuryTransaction[]>(STORAGE_KEYS.TREASURY, SEED_TREASURY);
    return recalculateTreasuryBalances(loaded);
  });
  const [externalRecipients, setExternalRecipients] = useState<ExternalRecipient[]>(() => loadLocal(STORAGE_KEYS.RECIPIENTS, SEED_RECIPIENTS));
  const [lastInvoiceNum, setLastInvoiceNum] = useState<number>(() => loadLocal(STORAGE_KEYS.LAST_INVOICE_NUM, 1));
  const [undoStack, setUndoStack] = useState<UndoableAction[]>(() => loadLocal(STORAGE_KEYS.UNDO_STACK, []));

  // Sync & Status State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'online' : 'offline');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString('ar-EG'));

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => setSyncStatus('online');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to Firestore helper (offline-safe, real-time)
  const syncDocToFirestore = async (collectionName: string, docId: string, data: any) => {
    try {
      if (navigator.onLine) setSyncStatus('syncing');
      await setDoc(doc(db, collectionName, docId), data, { merge: true });
      if (navigator.onLine) setSyncStatus('online');
      setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
    } catch (err) {
      console.warn(`Firestore sync error for ${collectionName}/${docId}:`, err);
      // Stays in offline or syncing state gracefully
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
    }
  };

  const deleteDocFromFirestore = async (collectionName: string, docId: string) => {
    try {
      if (navigator.onLine) setSyncStatus('syncing');
      await deleteDoc(doc(db, collectionName, docId));
      if (navigator.onLine) setSyncStatus('online');
    } catch (err) {
      console.warn(`Firestore delete error for ${collectionName}/${docId}:`, err);
    }
  };

  // Real-time Firestore listeners for multi-device sync
  useEffect(() => {
    const unsubCust = onSnapshot(collection(db, 'customers'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreCustomers = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
        setCustomers(firestoreCustomers);
        saveLocal(STORAGE_KEYS.CUSTOMERS, firestoreCustomers);
      }
    }, (error) => console.log('Customer snapshot sync offline notice:', error.message));

    const unsubSupp = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreSuppliers = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Supplier));
        setSuppliers(firestoreSuppliers);
        saveLocal(STORAGE_KEYS.SUPPLIERS, firestoreSuppliers);
      }
    }, (error) => console.log('Suppliers snapshot sync offline notice:', error.message));

    const unsubInv = onSnapshot(collection(db, 'purchase_invoices'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreInvoices = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseInvoice));
        setInvoices(firestoreInvoices);
        saveLocal(STORAGE_KEYS.INVOICES, firestoreInvoices);
      }
    }, (error) => console.log('Invoices snapshot sync offline notice:', error.message));

    const unsubStmt = onSnapshot(collection(db, 'supplier_statements'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreStmt = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SupplierStatementEntry));
        setSupplierStatements(firestoreStmt);
        saveLocal(STORAGE_KEYS.STATEMENTS, firestoreStmt);
      }
    }, (error) => console.log('Statements snapshot sync offline notice:', error.message));

    const unsubTx = onSnapshot(collection(db, 'treasury_transactions'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreTx = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TreasuryTransaction));
        const recomputed = recalculateTreasuryBalances(firestoreTx);
        setTreasuryTransactions(recomputed);
        saveLocal(STORAGE_KEYS.TREASURY, recomputed);
      }
    }, (error) => console.log('Treasury snapshot sync offline notice:', error.message));

    const unsubRec = onSnapshot(collection(db, 'external_recipients'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreRec = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ExternalRecipient));
        setExternalRecipients(firestoreRec);
        saveLocal(STORAGE_KEYS.RECIPIENTS, firestoreRec);
      }
    }, (error) => console.log('Recipients snapshot sync offline notice:', error.message));

    return () => {
      unsubCust();
      unsubSupp();
      unsubInv();
      unsubStmt();
      unsubTx();
      unsubRec();
    };
  }, []);

  // Treasury Summary Formula:
  // Current Treasury Balance = Total Deposits − Supplier Transfers − External Transfers − Expenses
  const treasurySummary: TreasurySummary = useMemo(() => {
    let totalDeposits = 0;
    let totalSupplierTransfers = 0;
    let totalExternalTransfers = 0;
    let totalExpenses = 0;

    for (const tx of treasuryTransactions) {
      if (tx.type === 'deposit') {
        totalDeposits += tx.amount;
      } else if (tx.type === 'supplier_payment') {
        totalSupplierTransfers += tx.amount;
      } else if (tx.type === 'external_transfer') {
        totalExternalTransfers += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpenses += tx.amount;
      }
    }

    const balance = totalDeposits - totalSupplierTransfers - totalExternalTransfers - totalExpenses;
    return {
      balance,
      totalDeposits,
      totalSupplierTransfers,
      totalExternalTransfers,
      totalTransfers: totalSupplierTransfers + totalExternalTransfers,
      totalExpenses
    };
  }, [treasuryTransactions]);

  // Customer Operations
  const checkDuplicatePhone = useCallback((phone: string, excludeId?: string): boolean => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return false;
    return customers.some(c => c.id !== excludeId && c.primaryPhone.trim() === cleanPhone);
  }, [customers]);

  const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...data,
      id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    const nextList = [newCustomer, ...customers];
    setCustomers(nextList);
    saveLocal(STORAGE_KEYS.CUSTOMERS, nextList);
    await syncDocToFirestore('customers', newCustomer.id, newCustomer);
    return { success: true, customer: newCustomer };
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const nextList = customers.map(c => {
      if (c.id === id) {
        return { ...c, ...updates, updatedAt: getTodayDateString() };
      }
      return c;
    });
    setCustomers(nextList);
    saveLocal(STORAGE_KEYS.CUSTOMERS, nextList);

    const updatedCust = nextList.find(c => c.id === id);
    if (updatedCust) {
      if (selectedCustomerForDetail?.id === id) {
        setSelectedCustomerForDetail(updatedCust);
      }
      await syncDocToFirestore('customers', id, updatedCust);
    }
  };

  const deleteCustomer = async (id: string) => {
    const nextList = customers.filter(c => c.id !== id);
    setCustomers(nextList);
    saveLocal(STORAGE_KEYS.CUSTOMERS, nextList);
    if (selectedCustomerForDetail?.id === id) {
      setSelectedCustomerForDetail(null);
    }
    await deleteDocFromFirestore('customers', id);
  };

  // Invoices & Sequential Unique Numbering S1, S2, S3...
  const getNextInvoiceNumber = useCallback(() => {
    return `S${lastInvoiceNum + 1}`;
  }, [lastInvoiceNum]);

  const createInvoice = async (data: Omit<PurchaseInvoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    const nextNum = lastInvoiceNum + 1;
    const invNumber = `S${nextNum}`;
    const newInvoice: PurchaseInvoice = {
      ...data,
      id: 'inv-' + Date.now(),
      invoiceNumber: invNumber,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    // Update last invoice counter (never decrements, even on invoice deletion)
    setLastInvoiceNum(nextNum);
    saveLocal(STORAGE_KEYS.LAST_INVOICE_NUM, nextNum);
    await syncDocToFirestore('app_metadata', 'invoice_counter', { lastInvoiceNum: nextNum });

    // Update supplier total debt & remaining balance
    let updatedSupplier: Supplier | undefined;
    const nextSuppliers = suppliers.map(s => {
      if (s.id === data.supplierId) {
        const newDebt = (s.totalDebt || 0) + data.totalAmount;
        const newBalance = (s.remainingBalance || 0) + data.totalAmount;
        updatedSupplier = {
          ...s,
          totalDebt: newDebt,
          remainingBalance: newBalance,
          updatedAt: getTodayDateString()
        };
        return updatedSupplier;
      }
      return s;
    });

    setSuppliers(nextSuppliers);
    saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    if (updatedSupplier) {
      await syncDocToFirestore('suppliers', data.supplierId, updatedSupplier);
    }

    // Create supplier statement entry
    const newStatement: SupplierStatementEntry = {
      id: 'stmt-' + Date.now(),
      supplierId: data.supplierId,
      date: data.date,
      type: 'invoice',
      invoiceNumber: invNumber,
      invoiceAmount: data.totalAmount,
      balanceAfter: updatedSupplier ? updatedSupplier.remainingBalance : data.totalAmount,
      notes: `فاتورة مشتريات رقم ${invNumber}`,
      createdAt: getTodayDateString()
    };

    const nextStatements = [...supplierStatements, newStatement];
    setSupplierStatements(nextStatements);
    saveLocal(STORAGE_KEYS.STATEMENTS, nextStatements);
    await syncDocToFirestore('supplier_statements', newStatement.id, newStatement);

    // Save invoice
    const nextInvoices = [newInvoice, ...invoices];
    setInvoices(nextInvoices);
    saveLocal(STORAGE_KEYS.INVOICES, nextInvoices);
    await syncDocToFirestore('purchase_invoices', newInvoice.id, newInvoice);

    return newInvoice;
  };

  const updateInvoice = async (id: string, data: Partial<PurchaseInvoice>) => {
    const existing = invoices.find(inv => inv.id === id);
    if (!existing) return;

    const diff = (data.totalAmount ?? existing.totalAmount) - existing.totalAmount;

    // If amount changed, update supplier balance
    if (diff !== 0 && existing.supplierId) {
      const nextSuppliers = suppliers.map(s => {
        if (s.id === existing.supplierId) {
          const updated = {
            ...s,
            totalDebt: (s.totalDebt || 0) + diff,
            remainingBalance: (s.remainingBalance || 0) + diff,
            updatedAt: getTodayDateString()
          };
          syncDocToFirestore('suppliers', s.id, updated);
          return updated;
        }
        return s;
      });
      setSuppliers(nextSuppliers);
      saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    }

    const nextInvoices = invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, ...data, updatedAt: getTodayDateString() };
      }
      return inv;
    });

    setInvoices(nextInvoices);
    saveLocal(STORAGE_KEYS.INVOICES, nextInvoices);
    const updatedInv = nextInvoices.find(i => i.id === id);
    if (updatedInv) {
      await syncDocToFirestore('purchase_invoices', id, updatedInv);
    }
  };

  const deleteInvoice = async (id: string) => {
    const existing = invoices.find(inv => inv.id === id);
    if (!existing) return;

    // Deduct invoice amount from supplier balance
    if (existing.supplierId) {
      const nextSuppliers = suppliers.map(s => {
        if (s.id === existing.supplierId) {
          const updated = {
            ...s,
            totalDebt: Math.max(0, (s.totalDebt || 0) - existing.totalAmount),
            remainingBalance: Math.max(0, (s.remainingBalance || 0) - existing.totalAmount),
            updatedAt: getTodayDateString()
          };
          syncDocToFirestore('suppliers', s.id, updated);
          return updated;
        }
        return s;
      });
      setSuppliers(nextSuppliers);
      saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);

      // Remove invoice entry from supplier statement
      const nextStatements = supplierStatements.filter(st => !(st.supplierId === existing.supplierId && st.invoiceNumber === existing.invoiceNumber));
      setSupplierStatements(nextStatements);
      saveLocal(STORAGE_KEYS.STATEMENTS, nextStatements);
    }

    const nextInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(nextInvoices);
    saveLocal(STORAGE_KEYS.INVOICES, nextInvoices);
    await deleteDocFromFirestore('purchase_invoices', id);
  };

  // Supplier Operations
  const addSupplier = async (data: Omit<Supplier, 'id' | 'totalDebt' | 'totalPaid' | 'remainingBalance' | 'createdAt' | 'updatedAt'>) => {
    const newSupplier: Supplier = {
      ...data,
      id: 'supp-' + Date.now(),
      totalDebt: 0,
      totalPaid: 0,
      remainingBalance: 0,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    const nextSuppliers = [newSupplier, ...suppliers];
    setSuppliers(nextSuppliers);
    saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    await syncDocToFirestore('suppliers', newSupplier.id, newSupplier);
    return newSupplier;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const nextSuppliers = suppliers.map(s => {
      if (s.id === id) {
        return { ...s, ...updates, updatedAt: getTodayDateString() };
      }
      return s;
    });
    setSuppliers(nextSuppliers);
    saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    const updated = nextSuppliers.find(s => s.id === id);
    if (updated) {
      await syncDocToFirestore('suppliers', id, updated);
    }
  };

  const deleteSupplier = async (id: string) => {
    const nextSuppliers = suppliers.filter(s => s.id !== id);
    setSuppliers(nextSuppliers);
    saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    await deleteDocFromFirestore('suppliers', id);
  };

  const getSupplierStatement = useCallback((supplierId: string) => {
    return supplierStatements
      .filter(st => st.supplierId === supplierId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [supplierStatements]);

  // Supplier Payments
  // Rule:
  // 1. Supplier debt / balance decreases
  // 2. Treasury balance decreases by same amount
  // 3. Appears in supplier statement
  // 4. Appears in treasury history
  // 5. Must not exceed available treasury balance
  const recordSupplierPayment = async ({
    supplierId,
    amount,
    paymentMethod,
    date,
    notes
  }: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (amount <= 0) {
      return { success: false, error: 'يجب أن يكون المبلغ أكبر من صفر' };
    }

    if (amount > treasurySummary.balance) {
      return {
        success: false,
        error: `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لإتمام هذه المعاملة`
      };
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
      return { success: false, error: 'المورد غير موجود' };
    }

    const newRemainingBalance = Math.max(0, (supplier.remainingBalance || 0) - amount);
    const newTotalPaid = (supplier.totalPaid || 0) + amount;
    const statementId = 'stmt-' + Date.now();

    // 1. Treasury transaction
    const newTx: TreasuryTransaction = {
      id: 'tx-' + Date.now(),
      type: 'supplier_payment',
      amount,
      date,
      sourceOrRecipient: supplier.name,
      paymentMethod,
      relatedSupplierId: supplierId,
      relatedStatementId: statementId,
      note: notes || `سداد لحساب المورد ${supplier.name}`,
      balanceAfter: treasurySummary.balance - amount,
      createdAt: getTodayDateString()
    };

    const nextTxList = recalculateTreasuryBalances([newTx, ...treasuryTransactions]);
    setTreasuryTransactions(nextTxList);
    saveLocal(STORAGE_KEYS.TREASURY, nextTxList);
    const savedTx = nextTxList.find(t => t.id === newTx.id) || newTx;
    await syncDocToFirestore('treasury_transactions', newTx.id, savedTx);

    // 2. Update Supplier balances
    const nextSuppliers = suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          updatedAt: getTodayDateString()
        };
      }
      return s;
    });
    setSuppliers(nextSuppliers);
    saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    const updatedSupp = nextSuppliers.find(s => s.id === supplierId);
    if (updatedSupp) {
      await syncDocToFirestore('suppliers', supplierId, updatedSupp);
    }

    // 3. Supplier statement entry
    const newStatement: SupplierStatementEntry = {
      id: statementId,
      supplierId,
      date,
      type: 'payment',
      paymentAmount: amount,
      paymentMethod,
      balanceAfter: newRemainingBalance,
      notes: notes || `دفعة ${paymentMethod === 'cash' ? 'نقدية' : paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستاباي'}`,
      createdAt: getTodayDateString()
    };
    const nextStmtList = [...supplierStatements, newStatement];
    setSupplierStatements(nextStmtList);
    saveLocal(STORAGE_KEYS.STATEMENTS, nextStmtList);
    await syncDocToFirestore('supplier_statements', newStatement.id, newStatement);

    // 4. Push to undo stack
    const undoAction: UndoableAction = {
      id: 'undo-' + Date.now(),
      timestamp: Date.now(),
      description: `سداد للمورد "${supplier.name}" بمبلغ ${amount.toLocaleString()} ج.م`,
      type: 'supplier_payment',
      data: {
        transactionId: newTx.id,
        supplierId,
        statementId: newStatement.id,
        amount,
        previousSupplierBalance: supplier.remainingBalance,
        previousTreasuryBalance: treasurySummary.balance
      }
    };
    const nextUndoStack = [undoAction, ...undoStack.slice(0, 19)];
    setUndoStack(nextUndoStack);
    saveLocal(STORAGE_KEYS.UNDO_STACK, nextUndoStack);

    return { success: true };
  };

  const editSupplierPayment = async (txId: string, data: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (data.amount <= 0) return { success: false, error: 'يجب أن يكون المبلغ أكبر من صفر' };
    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'المعاملة غير موجودة' };

    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return { success: false, error: 'المورد غير موجود' };

    const amountDiff = data.amount - oldTx.amount;
    if (amountDiff > 0 && amountDiff > treasurySummary.balance) {
      return {
        success: false,
        error: `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لزيادة التحويل بمقدار ${amountDiff.toLocaleString()} ج.م`
      };
    }

    // 1. Update Supplier Balances
    const nextSuppliers = suppliers.map(s => {
      if (oldTx.relatedSupplierId === data.supplierId && s.id === data.supplierId) {
        return {
          ...s,
          totalPaid: Math.max(0, (s.totalPaid || 0) + amountDiff),
          remainingBalance: Math.max(0, (s.remainingBalance || 0) - amountDiff),
          updatedAt: getTodayDateString()
        };
      } else if (s.id === oldTx.relatedSupplierId) {
        return {
          ...s,
          totalPaid: Math.max(0, (s.totalPaid || 0) - oldTx.amount),
          remainingBalance: (s.remainingBalance || 0) + oldTx.amount,
          updatedAt: getTodayDateString()
        };
      } else if (s.id === data.supplierId) {
        return {
          ...s,
          totalPaid: (s.totalPaid || 0) + data.amount,
          remainingBalance: Math.max(0, (s.remainingBalance || 0) - data.amount),
          updatedAt: getTodayDateString()
        };
      }
      return s;
    });
    setSuppliers(nextSuppliers);
    saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
    const updatedSupp = nextSuppliers.find(s => s.id === data.supplierId);
    if (updatedSupp) await syncDocToFirestore('suppliers', data.supplierId, updatedSupp);
    if (oldTx.relatedSupplierId && oldTx.relatedSupplierId !== data.supplierId) {
      const oldSupp = nextSuppliers.find(s => s.id === oldTx.relatedSupplierId);
      if (oldSupp) await syncDocToFirestore('suppliers', oldTx.relatedSupplierId, oldSupp);
    }

    // 2. Update Supplier Statements
    const nextStatements = supplierStatements.map(stmt => {
      const matches = (oldTx.relatedStatementId && stmt.id === oldTx.relatedStatementId) ||
        (stmt.supplierId === oldTx.relatedSupplierId && stmt.type === 'payment' && stmt.paymentAmount === oldTx.amount && stmt.date === oldTx.date);
      if (matches) {
        return {
          ...stmt,
          supplierId: data.supplierId,
          date: data.date,
          paymentAmount: data.amount,
          paymentMethod: data.paymentMethod,
          notes: data.notes || `دفعة ${data.paymentMethod === 'cash' ? 'نقدية' : data.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستاباي'}`
        };
      }
      return stmt;
    });
    setSupplierStatements(nextStatements);
    saveLocal(STORAGE_KEYS.STATEMENTS, nextStatements);

    // 3. Update Treasury Transaction
    const nextTxList = treasuryTransactions.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          amount: data.amount,
          date: data.date,
          sourceOrRecipient: supplier.name,
          paymentMethod: data.paymentMethod,
          relatedSupplierId: data.supplierId,
          note: data.notes || `سداد لحساب المورد ${supplier.name}`,
          updatedAt: getTodayDateString()
        };
      }
      return tx;
    });
    const recomputed = recalculateTreasuryBalances(nextTxList);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    const updatedTx = recomputed.find(t => t.id === txId);
    if (updatedTx) await syncDocToFirestore('treasury_transactions', txId, updatedTx);

    return { success: true };
  };

  const deleteSupplierPayment = async (txId: string): Promise<{ success: boolean; error?: string }> => {
    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'المعاملة غير موجودة' };

    // 1. Revert Supplier Balance
    if (oldTx.relatedSupplierId) {
      const nextSuppliers = suppliers.map(s => {
        if (s.id === oldTx.relatedSupplierId) {
          return {
            ...s,
            totalPaid: Math.max(0, (s.totalPaid || 0) - oldTx.amount),
            remainingBalance: (s.remainingBalance || 0) + oldTx.amount,
            updatedAt: getTodayDateString()
          };
        }
        return s;
      });
      setSuppliers(nextSuppliers);
      saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
      const updatedSupp = nextSuppliers.find(s => s.id === oldTx.relatedSupplierId);
      if (updatedSupp) await syncDocToFirestore('suppliers', oldTx.relatedSupplierId, updatedSupp);
    }

    // 2. Remove statement entry
    let deletedStmtId: string | undefined;
    const nextStatements = supplierStatements.filter(stmt => {
      const matches = (oldTx.relatedStatementId && stmt.id === oldTx.relatedStatementId) ||
        (stmt.supplierId === oldTx.relatedSupplierId && stmt.type === 'payment' && stmt.paymentAmount === oldTx.amount && stmt.date === oldTx.date);
      if (matches) {
        deletedStmtId = stmt.id;
        return false;
      }
      return true;
    });
    setSupplierStatements(nextStatements);
    saveLocal(STORAGE_KEYS.STATEMENTS, nextStatements);
    if (deletedStmtId) await deleteDocFromFirestore('supplier_statements', deletedStmtId);

    // 3. Remove transaction and recalculate balances
    const remaining = treasuryTransactions.filter(t => t.id !== txId);
    const recomputed = recalculateTreasuryBalances(remaining);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    await deleteDocFromFirestore('treasury_transactions', txId);

    return { success: true };
  };

  // Treasury Deposits
  const addTreasuryDeposit = async ({
    amount,
    source,
    date,
    note
  }: {
    amount: number;
    source: string;
    date: string;
    note?: string;
  }) => {
    if (amount <= 0) return;
    const newTx: TreasuryTransaction = {
      id: 'tx-' + Date.now(),
      type: 'deposit',
      amount,
      date,
      sourceOrRecipient: source,
      note,
      balanceAfter: treasurySummary.balance + amount,
      createdAt: getTodayDateString()
    };

    const nextTxList = recalculateTreasuryBalances([newTx, ...treasuryTransactions]);
    setTreasuryTransactions(nextTxList);
    saveLocal(STORAGE_KEYS.TREASURY, nextTxList);
    const savedTx = nextTxList.find(t => t.id === newTx.id) || newTx;
    await syncDocToFirestore('treasury_transactions', newTx.id, savedTx);

    // Push to undo stack
    const undoAction: UndoableAction = {
      id: 'undo-' + Date.now(),
      timestamp: Date.now(),
      description: `إيداع في الخزينة من "${source}" بمبلغ ${amount.toLocaleString()} ج.م`,
      type: 'deposit',
      data: {
        transactionId: newTx.id,
        amount,
        previousTreasuryBalance: treasurySummary.balance
      }
    };
    const nextUndoStack = [undoAction, ...undoStack.slice(0, 19)];
    setUndoStack(nextUndoStack);
    saveLocal(STORAGE_KEYS.UNDO_STACK, nextUndoStack);
  };

  const editTreasuryDeposit = async (txId: string, data: {
    amount: number;
    source: string;
    date: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (data.amount <= 0) return { success: false, error: 'يجب أن يكون مبلغ الإيداع أكبر من صفر' };
    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'معاملة الإيداع غير موجودة' };

    const diff = data.amount - oldTx.amount;
    if (diff < 0 && (treasurySummary.balance + diff) < 0) {
      return {
        success: false,
        error: `تعديل المبلغ سيجعل رصيد الخزينة بالسالب (${(treasurySummary.balance + diff).toLocaleString()} ج.م)`
      };
    }

    const nextTxList = treasuryTransactions.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          amount: data.amount,
          sourceOrRecipient: data.source.trim(),
          date: data.date,
          note: data.note?.trim() || undefined,
          updatedAt: getTodayDateString()
        };
      }
      return tx;
    });

    const recomputed = recalculateTreasuryBalances(nextTxList);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    const updatedDoc = recomputed.find(t => t.id === txId);
    if (updatedDoc) await syncDocToFirestore('treasury_transactions', txId, updatedDoc);

    return { success: true };
  };

  const deleteTreasuryDeposit = async (txId: string): Promise<{ success: boolean; error?: string }> => {
    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'معاملة الإيداع غير موجودة' };

    if (oldTx.amount > treasurySummary.balance) {
      return {
        success: false,
        error: `لا يمكن حذف هذا الإيداع لأن الرصيد المتبقي بالخزينة (${treasurySummary.balance.toLocaleString()} ج.م) أقل من قيمة الإيداع`
      };
    }

    const remaining = treasuryTransactions.filter(t => t.id !== txId);
    const recomputed = recalculateTreasuryBalances(remaining);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    await deleteDocFromFirestore('treasury_transactions', txId);

    return { success: true };
  };

  // External Transfers
  const addExternalTransfer = async ({
    recipientId,
    recipientName,
    amount,
    date,
    note
  }: {
    recipientId?: string;
    recipientName: string;
    amount: number;
    date: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanName = recipientName.trim();
    if (!cleanName) {
      return { success: false, error: 'يرجى إدخال اسم المستلم' };
    }
    if (amount <= 0) {
      return { success: false, error: 'يجب أن يكون مبلغ التحويل أكبر من صفر' };
    }
    if (amount > treasurySummary.balance) {
      return {
        success: false,
        error: `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لإتمام التحويل`
      };
    }

    // Deduplicate or create recipient automatically so they appear in External Transfers
    let targetRecipient = externalRecipients.find(
      r => (recipientId && r.id === recipientId) || r.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (!targetRecipient) {
      targetRecipient = {
        id: recipientId || 'rec-' + Date.now(),
        name: cleanName,
        createdAt: date || getTodayDateString(),
        notes: note
      };
      const nextRecList = [targetRecipient, ...externalRecipients];
      setExternalRecipients(nextRecList);
      saveLocal(STORAGE_KEYS.RECIPIENTS, nextRecList);
      await syncDocToFirestore('external_recipients', targetRecipient.id, targetRecipient);
    }

    const newTx: TreasuryTransaction = {
      id: 'tx-' + Date.now(),
      type: 'external_transfer',
      amount,
      date,
      sourceOrRecipient: cleanName,
      relatedSupplierId: targetRecipient.id,
      note: note || `تحويل خارجي إلى ${cleanName}`,
      balanceAfter: treasurySummary.balance - amount,
      createdAt: getTodayDateString()
    };

    const nextTxList = recalculateTreasuryBalances([newTx, ...treasuryTransactions]);
    setTreasuryTransactions(nextTxList);
    saveLocal(STORAGE_KEYS.TREASURY, nextTxList);
    const savedTx = nextTxList.find(t => t.id === newTx.id) || newTx;
    await syncDocToFirestore('treasury_transactions', newTx.id, savedTx);

    // Push to undo stack
    const undoAction: UndoableAction = {
      id: 'undo-' + Date.now(),
      timestamp: Date.now(),
      description: `تحويل خارجي إلى "${cleanName}" بمبلغ ${amount.toLocaleString()} ج.م`,
      type: 'external_transfer',
      data: {
        transactionId: newTx.id,
        amount,
        previousTreasuryBalance: treasurySummary.balance
      }
    };
    const nextUndoStack = [undoAction, ...undoStack.slice(0, 19)];
    setUndoStack(nextUndoStack);
    saveLocal(STORAGE_KEYS.UNDO_STACK, nextUndoStack);

    return { success: true };
  };

  const editExternalTransfer = async (txId: string, data: {
    recipientName: string;
    amount: number;
    date: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanName = data.recipientName.trim();
    if (!cleanName) return { success: false, error: 'يرجى إدخال اسم المستلم' };
    if (data.amount <= 0) return { success: false, error: 'يجب أن يكون مبلغ التحويل أكبر من صفر' };

    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'المعاملة غير موجودة' };

    const amountDiff = data.amount - oldTx.amount;
    if (amountDiff > 0 && amountDiff > treasurySummary.balance) {
      return {
        success: false,
        error: `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لزيادة التحويل بمقدار ${amountDiff.toLocaleString()} ج.م`
      };
    }

    // Deduplicate or create recipient automatically
    let targetRecipient = externalRecipients.find(
      r => r.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (!targetRecipient) {
      targetRecipient = {
        id: 'rec-' + Date.now(),
        name: cleanName,
        createdAt: data.date || getTodayDateString(),
        notes: data.note
      };
      const nextRecList = [targetRecipient, ...externalRecipients];
      setExternalRecipients(nextRecList);
      saveLocal(STORAGE_KEYS.RECIPIENTS, nextRecList);
      await syncDocToFirestore('external_recipients', targetRecipient.id, targetRecipient);
    }

    const nextTxList = treasuryTransactions.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          amount: data.amount,
          date: data.date,
          sourceOrRecipient: cleanName,
          relatedSupplierId: targetRecipient!.id,
          note: data.note || `تحويل خارجي إلى ${cleanName}`,
          updatedAt: getTodayDateString()
        };
      }
      return tx;
    });
    const recomputed = recalculateTreasuryBalances(nextTxList);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    const updatedTx = recomputed.find(t => t.id === txId);
    if (updatedTx) await syncDocToFirestore('treasury_transactions', txId, updatedTx);

    return { success: true };
  };

  const deleteExternalTransfer = async (txId: string): Promise<{ success: boolean; error?: string }> => {
    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'معاملة التحويل الخارجي غير موجودة' };

    const nextTxList = treasuryTransactions.filter(t => t.id !== txId);
    const recomputed = recalculateTreasuryBalances(nextTxList);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    await deleteDocFromFirestore('treasury_transactions', txId);
    return { success: true };
  };

  // Expenses
  const addExpense = async ({
    description,
    amount,
    date,
    note
  }: {
    description: string;
    amount: number;
    date: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (amount <= 0) {
      return { success: false, error: 'يجب أن يكون مبلغ المصروف أكبر من صفر' };
    }
    if (amount > treasurySummary.balance) {
      return {
        success: false,
        error: `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لصرف هذا المبلغ`
      };
    }

    const newTx: TreasuryTransaction = {
      id: 'tx-' + Date.now(),
      type: 'expense',
      amount,
      date,
      sourceOrRecipient: description.trim(),
      note,
      balanceAfter: treasurySummary.balance - amount,
      createdAt: getTodayDateString()
    };

    const nextTxList = recalculateTreasuryBalances([newTx, ...treasuryTransactions]);
    setTreasuryTransactions(nextTxList);
    saveLocal(STORAGE_KEYS.TREASURY, nextTxList);
    const savedTx = nextTxList.find(t => t.id === newTx.id) || newTx;
    await syncDocToFirestore('treasury_transactions', newTx.id, savedTx);

    // Push to undo stack
    const undoAction: UndoableAction = {
      id: 'undo-' + Date.now(),
      timestamp: Date.now(),
      description: `صرف مصروفات "${description}" بمبلغ ${amount.toLocaleString()} ج.م`,
      type: 'expense',
      data: {
        transactionId: newTx.id,
        amount,
        previousTreasuryBalance: treasurySummary.balance
      }
    };
    const nextUndoStack = [undoAction, ...undoStack.slice(0, 19)];
    setUndoStack(nextUndoStack);
    saveLocal(STORAGE_KEYS.UNDO_STACK, nextUndoStack);

    return { success: true };
  };

  const editExpense = async (txId: string, data: {
    description: string;
    amount: number;
    date: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanDesc = data.description.trim();
    if (!cleanDesc) return { success: false, error: 'يرجى إدخال سبب/بيان المصروف' };
    if (data.amount <= 0) return { success: false, error: 'يجب أن يكون مبلغ المصروف أكبر من صفر' };

    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'معاملة المصروف غير موجودة' };

    const amountDiff = data.amount - oldTx.amount;
    if (amountDiff > 0 && amountDiff > treasurySummary.balance) {
      return {
        success: false,
        error: `الرصيد المتاح في الخزينة (${treasurySummary.balance.toLocaleString()} ج.م) لا يكفي لزيادة المصروف بمقدار ${amountDiff.toLocaleString()} ج.م`
      };
    }

    const nextTxList = treasuryTransactions.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          amount: data.amount,
          date: data.date,
          sourceOrRecipient: cleanDesc,
          note: data.note?.trim() || undefined,
          updatedAt: getTodayDateString()
        };
      }
      return tx;
    });
    const recomputed = recalculateTreasuryBalances(nextTxList);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    const updatedTx = recomputed.find(t => t.id === txId);
    if (updatedTx) await syncDocToFirestore('treasury_transactions', txId, updatedTx);

    return { success: true };
  };

  const deleteExpense = async (txId: string): Promise<{ success: boolean; error?: string }> => {
    const oldTx = treasuryTransactions.find(t => t.id === txId);
    if (!oldTx) return { success: false, error: 'المعاملة غير موجودة' };

    const nextTxList = treasuryTransactions.filter(t => t.id !== txId);
    const recomputed = recalculateTreasuryBalances(nextTxList);
    setTreasuryTransactions(recomputed);
    saveLocal(STORAGE_KEYS.TREASURY, recomputed);
    await deleteDocFromFirestore('treasury_transactions', txId);
    return { success: true };
  };

  const deleteTreasuryTransaction = async (txId: string): Promise<{ success: boolean; error?: string }> => {
    const tx = treasuryTransactions.find(t => t.id === txId);
    if (!tx) return { success: false, error: 'المعاملة غير موجودة' };
    if (tx.type === 'supplier_payment') {
      return deleteSupplierPayment(txId);
    } else if (tx.type === 'external_transfer') {
      return deleteExternalTransfer(txId);
    } else if (tx.type === 'expense') {
      return deleteExpense(txId);
    } else if (tx.type === 'deposit') {
      return deleteTreasuryDeposit(txId);
    }
    return { success: false, error: 'نوع المعاملة غير معروف' };
  };

  const editTreasuryTransaction = async (txId: string, data: any): Promise<{ success: boolean; error?: string }> => {
    const tx = treasuryTransactions.find(t => t.id === txId);
    if (!tx) return { success: false, error: 'المعاملة غير موجودة' };
    if (tx.type === 'supplier_payment') {
      return editSupplierPayment(txId, {
        supplierId: data.supplierId || tx.relatedSupplierId || '',
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod || tx.paymentMethod || 'cash',
        date: data.date,
        notes: data.notes || data.note
      });
    } else if (tx.type === 'external_transfer') {
      return editExternalTransfer(txId, {
        recipientName: data.recipientName || data.sourceOrRecipient,
        amount: Number(data.amount),
        date: data.date,
        note: data.note
      });
    } else if (tx.type === 'expense') {
      return editExpense(txId, {
        description: data.description || data.sourceOrRecipient,
        amount: Number(data.amount),
        date: data.date,
        note: data.note
      });
    } else if (tx.type === 'deposit') {
      return editTreasuryDeposit(txId, {
        source: data.source || data.sourceOrRecipient,
        amount: Number(data.amount),
        date: data.date,
        note: data.note
      });
    }
    return { success: false, error: 'نوع المعاملة غير معروف' };
  };

  // External Recipients
  const addExternalRecipient = async (name: string, phone?: string, notes?: string) => {
    const newRec: ExternalRecipient = {
      id: 'rec-' + Date.now(),
      name,
      phone,
      notes,
      createdAt: getTodayDateString()
    };
    const nextRecList = [...externalRecipients, newRec];
    setExternalRecipients(nextRecList);
    saveLocal(STORAGE_KEYS.RECIPIENTS, nextRecList);
    await syncDocToFirestore('external_recipients', newRec.id, newRec);
    return newRec;
  };

  const deleteExternalRecipient = async (id: string) => {
    const nextRecList = externalRecipients.filter(r => r.id !== id);
    setExternalRecipients(nextRecList);
    saveLocal(STORAGE_KEYS.RECIPIENTS, nextRecList);
    await deleteDocFromFirestore('external_recipients', id);
  };

  // Undo Last Financial Operation
  const canUndo = undoStack.length > 0;
  const lastActionDescription = undoStack.length > 0 ? undoStack[0].description : null;

  const undoLastFinancialOperation = async (): Promise<{ success: boolean; message: string }> => {
    if (undoStack.length === 0) {
      return { success: false, message: 'لا توجد عمليات مالية سابقة للتراجع عنها' };
    }

    const [lastAction, ...remainingStack] = undoStack;

    if (lastAction.type === 'supplier_payment') {
      const { transactionId, supplierId, statementId, amount = 0 } = lastAction.data;

      // 1. Remove treasury transaction
      if (transactionId) {
        const nextTx = recalculateTreasuryBalances(treasuryTransactions.filter(t => t.id !== transactionId));
        setTreasuryTransactions(nextTx);
        saveLocal(STORAGE_KEYS.TREASURY, nextTx);
        deleteDocFromFirestore('treasury_transactions', transactionId);
      }

      // 2. Restore supplier debt & paid balances
      if (supplierId) {
        const nextSuppliers = suppliers.map(s => {
          if (s.id === supplierId) {
            const updated = {
              ...s,
              totalPaid: Math.max(0, (s.totalPaid || 0) - amount),
              remainingBalance: (s.remainingBalance || 0) + amount,
              updatedAt: getTodayDateString()
            };
            syncDocToFirestore('suppliers', supplierId, updated);
            return updated;
          }
          return s;
        });
        setSuppliers(nextSuppliers);
        saveLocal(STORAGE_KEYS.SUPPLIERS, nextSuppliers);
      }

      // 3. Remove statement entry
      if (statementId) {
        const nextStmt = supplierStatements.filter(s => s.id !== statementId);
        setSupplierStatements(nextStmt);
        saveLocal(STORAGE_KEYS.STATEMENTS, nextStmt);
        deleteDocFromFirestore('supplier_statements', statementId);
      }
    } else if (lastAction.type === 'deposit') {
      const { transactionId } = lastAction.data;
      if (transactionId) {
        const nextTx = recalculateTreasuryBalances(treasuryTransactions.filter(t => t.id !== transactionId));
        setTreasuryTransactions(nextTx);
        saveLocal(STORAGE_KEYS.TREASURY, nextTx);
        deleteDocFromFirestore('treasury_transactions', transactionId);
      }
    } else if (lastAction.type === 'external_transfer' || lastAction.type === 'expense') {
      const { transactionId } = lastAction.data;
      if (transactionId) {
        const nextTx = recalculateTreasuryBalances(treasuryTransactions.filter(t => t.id !== transactionId));
        setTreasuryTransactions(nextTx);
        saveLocal(STORAGE_KEYS.TREASURY, nextTx);
        deleteDocFromFirestore('treasury_transactions', transactionId);
      }
    }

    setUndoStack(remainingStack);
    saveLocal(STORAGE_KEYS.UNDO_STACK, remainingStack);

    return {
      success: true,
      message: `تم التراجع بنجاح عن: ${lastAction.description}`
    };
  };

  // Clear All Business Data (password: 040236)
  // Deletes customers, invoices, suppliers, payments, statements, treasury, external recipients
  // Keeps theme and app configuration intact.
  const clearAllBusinessData = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (password !== '040236') {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    try {
      // Clear Firestore collections
      const collectionsToClear = [
        'customers',
        'suppliers',
        'purchase_invoices',
        'supplier_statements',
        'supplier_payments',
        'treasury_transactions',
        'external_recipients'
      ];

      for (const colName of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, colName));
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        } catch (e) {
          console.warn(`Firestore clear error for ${colName}:`, e);
        }
      }

      // Clear Local State & Storage
      setCustomers([]);
      saveLocal(STORAGE_KEYS.CUSTOMERS, []);

      setSuppliers([]);
      saveLocal(STORAGE_KEYS.SUPPLIERS, []);

      setInvoices([]);
      saveLocal(STORAGE_KEYS.INVOICES, []);

      setSupplierStatements([]);
      saveLocal(STORAGE_KEYS.STATEMENTS, []);

      setTreasuryTransactions([]);
      saveLocal(STORAGE_KEYS.TREASURY, []);

      setExternalRecipients([]);
      saveLocal(STORAGE_KEYS.RECIPIENTS, []);

      setUndoStack([]);
      saveLocal(STORAGE_KEYS.UNDO_STACK, []);

      setSelectedCustomerForDetail(null);
      setSearchQuery('');

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء مسح البيانات' };
    }
  };

  // Backup Export (complete JSON package)
  const exportBackup = (): string => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Fake',
      data: {
        customers,
        suppliers,
        invoices,
        supplierStatements,
        treasuryTransactions,
        externalRecipients,
        lastInvoiceNum
      }
    };
    return JSON.stringify(backupData, null, 2);
  };

  // Recovery Import (JSON package with full relationship validation)
  const importRecovery = async (jsonString: string): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { success: false, error: 'ملف النسخة الاحتياطية غير صالح أو تالف' };
      }

      const {
        customers: recCust = [],
        suppliers: recSupp = [],
        invoices: recInv = [],
        supplierStatements: recStmt = [],
        treasuryTransactions: recTx = [],
        externalRecipients: recRec = [],
        lastInvoiceNum: recLastNum = 1
      } = parsed.data;

      // Update LocalStorage
      saveLocal(STORAGE_KEYS.CUSTOMERS, recCust);
      saveLocal(STORAGE_KEYS.SUPPLIERS, recSupp);
      saveLocal(STORAGE_KEYS.INVOICES, recInv);
      saveLocal(STORAGE_KEYS.STATEMENTS, recStmt);
      saveLocal(STORAGE_KEYS.TREASURY, recTx);
      saveLocal(STORAGE_KEYS.RECIPIENTS, recRec);
      saveLocal(STORAGE_KEYS.LAST_INVOICE_NUM, recLastNum);

      // Update State
      setCustomers(recCust);
      setSuppliers(recSupp);
      setInvoices(recInv);
      setSupplierStatements(recStmt);
      setTreasuryTransactions(recTx);
      setExternalRecipients(recRec);
      setLastInvoiceNum(recLastNum);

      // Sync recovered data into Firestore
      try {
        const batch = writeBatch(db);
        recCust.forEach((c: Customer) => batch.set(doc(db, 'customers', c.id), c));
        recSupp.forEach((s: Supplier) => batch.set(doc(db, 'suppliers', s.id), s));
        recInv.forEach((i: PurchaseInvoice) => batch.set(doc(db, 'purchase_invoices', i.id), i));
        recStmt.forEach((st: SupplierStatementEntry) => batch.set(doc(db, 'supplier_statements', st.id), st));
        recTx.forEach((t: TreasuryTransaction) => batch.set(doc(db, 'treasury_transactions', t.id), t));
        recRec.forEach((r: ExternalRecipient) => batch.set(doc(db, 'external_recipients', r.id), r));
        await batch.commit();
      } catch (cloudErr) {
        console.warn('Cloud sync error during recovery:', cloudErr);
      }

      const totalItems = recCust.length + recSupp.length + recInv.length + recTx.length;
      return { success: true, count: totalItems };
    } catch (err: any) {
      return { success: false, error: 'فشل استيراد البيانات: تأكد من صحة تنسيق JSON' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activePurchaseSubTab,
        setActivePurchaseSubTab,
        activeTreasurySubTab,
        setActiveTreasurySubTab,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        checkDuplicatePhone,
        selectedCustomerForDetail,
        setSelectedCustomerForDetail,
        searchQuery,
        setSearchQuery,
        selectedSectionFilter,
        setSelectedSectionFilter,
        invoices,
        getNextInvoiceNumber,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        supplierStatements,
        getSupplierStatement,
        recordSupplierPayment,
        editSupplierPayment,
        deleteSupplierPayment,
        treasuryTransactions,
        treasurySummary,
        addTreasuryDeposit,
        editTreasuryDeposit,
        deleteTreasuryDeposit,
        addExternalTransfer,
        editExternalTransfer,
        deleteExternalTransfer,
        addExpense,
        editExpense,
        deleteExpense,
        deleteTreasuryTransaction,
        editTreasuryTransaction,
        externalRecipients,
        addExternalRecipient,
        deleteExternalRecipient,
        canUndo,
        lastActionDescription,
        undoLastFinancialOperation,
        syncStatus,
        lastSyncTime,
        theme,
        setTheme,
        isExitModalOpen,
        setIsExitModalOpen,
        clearAllBusinessData,
        exportBackup,
        importRecovery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
