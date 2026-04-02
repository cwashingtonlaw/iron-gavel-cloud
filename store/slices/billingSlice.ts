import { StateCreator } from 'zustand';
import { Invoice, Expense, SuggestedTimeEntry, SettlementStatement, Transaction } from '../../types';
import { billingService } from '../../services/billingService';
import { AppState } from '../useStore';
import {
    TrustTransferRequest,
    IOLTAViolation,
    IOLTAComplianceReport,
    validateTrustTransaction,
    validateTrustTransfer,
    calculateTrustBalance,
    calculateTotalTrustBalance,
    generateIOLTAReport,
    detectViolations,
    performThreeWayReconciliation
} from '../../utils/trustAccountingUtils';

export interface BillingSlice {
    invoices: Invoice[];
    expenses: Expense[];
    suggestedTimeEntries: SuggestedTimeEntry[];
    settlementStatements: SettlementStatement[];
    transactions: Transaction[];
    trustTransferRequests: TrustTransferRequest[];
    ioltalViolations: IOLTAViolation[];

    // Existing actions
    addInvoice: (invoice: Invoice) => void;
    addExpense: (expense: Expense) => void;
    addSuggestedTimeEntry: (entry: SuggestedTimeEntry) => void;
    updateSuggestedTimeEntry: (entry: SuggestedTimeEntry) => void;
    addSettlementStatement: (statement: SettlementStatement) => void;
    addTransaction: (transaction: Transaction) => void;
    getMatterBalance: (matterId: string, ledger: 'Operating' | 'Trust') => number;

    // F8: Enhanced Trust Accounting Actions
    requestTrustTransfer: (transfer: TrustTransferRequest) => { success: boolean; error?: string };
    approveTrustTransfer: (transferId: string, approvedBy: string) => void;
    rejectTrustTransfer: (transferId: string, reason: string) => void;
    getTotalTrustBalance: () => number;
    generateIOLTAReport: (periodStart: string, periodEnd: string) => IOLTAComplianceReport;
    runComplianceCheck: () => IOLTAViolation[];
    performReconciliation: (bankBalance: number) => {
        bookBalance: number;
        bankBalance: number;
        sumOfMatterBalances: number;
        balanced: boolean;
        discrepancy: number;
    };
}

export const createBillingSlice: StateCreator<AppState, [], [], BillingSlice> = (set, get) => ({
    invoices: billingService.getInvoices(),
    expenses: billingService.getExpenses(),
    suggestedTimeEntries: [],
    settlementStatements: [],
    transactions: [],
    trustTransferRequests: [],
    ioltalViolations: [],

    addInvoice: (invoice) => set((state) => ({
        invoices: billingService.addInvoice(state.invoices, invoice)
    })),

    addExpense: (expense) => set((state) => ({
        expenses: billingService.addExpense(state.expenses, expense)
    })),

    addSuggestedTimeEntry: (entry) => set((state) => ({
        suggestedTimeEntries: [...state.suggestedTimeEntries, entry]
    })),

    updateSuggestedTimeEntry: (entry) => set((state) => ({
        suggestedTimeEntries: state.suggestedTimeEntries.map(e => e.id === entry.id ? entry : e)
    })),

    addSettlementStatement: (statement) => set((state) => ({
        settlementStatements: [...state.settlementStatements, statement]
    })),

    addTransaction: (transaction) => {
        // F8: Enhanced IOLTA Compliance - Validate before adding
        const state = get() as any;
        const currentBalance = state.getMatterBalance(transaction.matterId, transaction.ledger);
        const validation = validateTrustTransaction(transaction, currentBalance);

        if (!validation.valid) {
            console.error(validation.error);
            // Log as violation
            const violation: IOLTAViolation = {
                id: `VIOL-${Date.now()}`,
                type: 'Overdraft Attempt',
                severity: 'Critical',
                description: validation.error || 'Transaction validation failed',
                matterId: transaction.matterId,
                date: new Date().toISOString(),
                resolved: false
            };
            set((state) => ({
                ioltalViolations: [...state.ioltalViolations, violation]
            }));
            return;
        }

        set((state) => ({ transactions: [transaction, ...state.transactions] }));
    },

    getMatterBalance: (matterId, ledger) => {
        const state = get() as any;
        // Calculate balance for the specified ledger
        return (state.transactions || [])
            .filter((t: Transaction) => t.matterId === matterId && t.ledger === ledger)
            .reduce((acc: number, t: Transaction) => {
                if (t.type === 'Deposit') return acc + t.amount;
                if (t.type === 'Payment') return acc - t.amount;
                return acc;
            }, 0);
    },

    // F8: Trust Transfer Management
    requestTrustTransfer: (transfer) => {
        const state = get() as any;
        const currentBalance = state.getMatterBalance(transfer.matterId, transfer.fromLedger);
        const validation = validateTrustTransfer(transfer, currentBalance);

        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        set((state) => ({
            trustTransferRequests: [...state.trustTransferRequests, transfer]
        }));

        return { success: true };
    },

    approveTrustTransfer: (transferId, approvedBy) => {
        set((state) => {
            const transfer = state.trustTransferRequests.find(t => t.id === transferId);
            if (!transfer) return state;

            // Update transfer status
            const updatedTransfers = state.trustTransferRequests.map(t =>
                t.id === transferId
                    ? { ...t, status: 'Approved' as const, approvedBy, approvedDate: new Date().toISOString() }
                    : t
            );

            // Create corresponding transactions
            const withdrawalTx: Transaction = {
                id: `TXN-${Date.now()}-W`,
                date: new Date().toISOString(),
                type: 'Payment',
                ledger: transfer.fromLedger,
                matterId: transfer.matterId,
                description: `Transfer to ${transfer.toLedger}: ${transfer.reason}`,
                amount: transfer.amount
            };

            const depositTx: Transaction = {
                id: `TXN-${Date.now()}-D`,
                date: new Date().toISOString(),
                type: 'Deposit',
                ledger: transfer.toLedger,
                matterId: transfer.matterId,
                description: `Transfer from ${transfer.fromLedger}: ${transfer.reason}`,
                amount: transfer.amount
            };

            return {
                trustTransferRequests: updatedTransfers,
                transactions: [depositTx, withdrawalTx, ...state.transactions]
            };
        });
    },

    rejectTrustTransfer: (transferId, reason) => {
        set((state) => ({
            trustTransferRequests: state.trustTransferRequests.map(t =>
                t.id === transferId
                    ? { ...t, status: 'Rejected' as const, rejectionReason: reason }
                    : t
            )
        }));
    },

    getTotalTrustBalance: () => {
        const state = get() as any;
        return calculateTotalTrustBalance(state.transactions);
    },

    generateIOLTAReport: (periodStart, periodEnd) => {
        const state = get() as any;
        return generateIOLTAReport(state.transactions, state.matters || [], periodStart, periodEnd);
    },

    runComplianceCheck: () => {
        const state = get() as any;
        const violations = detectViolations(state.transactions, state.matters || []);

        // Update stored violations
        set({ ioltalViolations: violations });

        return violations;
    },

    performReconciliation: (bankBalance) => {
        const state = get() as any;
        return performThreeWayReconciliation(state.transactions, state.matters || [], bankBalance);
    },
});

