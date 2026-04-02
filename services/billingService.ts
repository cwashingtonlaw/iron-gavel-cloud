import {
    Invoice,
    Expense,
    TimeEntry,
    AutoInvoiceRule,
    ReconciliationRecord,
    IOLTAReport,
    Matter,
    Transaction
} from '../types';
import { MOCK_INVOICES, MOCK_EXPENSES } from '../constants';

/**
 * Advanced Billing & Financial Service
 * Handles IOLTA compliance, Auto-invoicing, and 3-way reconciliation
 */

export const billingService = {
    getInvoices: (): Invoice[] => {
        return [...MOCK_INVOICES];
    },

    getExpenses: (): Expense[] => {
        return [...MOCK_EXPENSES];
    },

    addInvoice: (invoices: Invoice[], invoice: Invoice): Invoice[] => {
        return [invoice, ...invoices];
    },

    addExpense: (expenses: Expense[], expense: Expense): Expense[] => {
        return [expense, ...expenses];
    },

    /**
     * Feature 5: Auto-generate invoice from unbilled time and expenses
     */
    generateAutoInvoice: (matterId: string, rule: AutoInvoiceRule, unbilledTime: TimeEntry[], unbilledExpenses: Expense[]): Invoice | null => {
        const relevantTime = unbilledTime.filter(t => t.matterId === matterId && !t.isBilled);
        const relevantExpenses = unbilledExpenses.filter(e => e.matterId === matterId && !e.isBilled);

        if (relevantTime.length === 0 && relevantExpenses.length === 0) return null;

        const timeTotal = relevantTime.reduce((sum, t) => sum + (t.duration * t.rate), 0);
        const expenseTotal = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
        const total = timeTotal + expenseTotal;

        if (rule.minimumAmount && total < rule.minimumAmount) return null;

        return {
            id: `inv-${Date.now()}`,
            matterId,
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: total,
            status: 'Unpaid',
            balance: total
        };
    },

    /**
     * Feature 5: 3-Way Reconciliation Logic
     */
    performReconciliation: (
        bankBalance: number,
        transactions: Transaction[],
        matters: Matter[]
    ): ReconciliationRecord => {
        const bookBalance = transactions.reduce((sum, t) => sum + (t.type === 'Deposit' ? t.amount : -t.amount), 0);
        const clientLedgerTotal = matters.reduce((sum, m) => sum + (m.trustBalance || 0), 0);

        const difference = bankBalance - bookBalance;

        return {
            id: `rec-${Date.now()}`,
            date: new Date().toISOString(),
            ledgerType: 'Trust',
            bankBalance,
            bookBalance,
            clientLedgerTotal,
            difference,
            status: difference === 0 && bookBalance === clientLedgerTotal ? 'Balanced' : 'Discrepancy',
            reconciliationItems: [],
            performedBy: 'System Admin'
        };
    },

    /**
     * Feature 5: IOLTA Compliance Report Generation
     */
    generateIOLTAReport: (jurisdiction: any, transactions: Transaction[], matters: Matter[]): IOLTAReport => {
        const trustTransactions = transactions.filter(t => t.ledger === 'Trust');
        const deposits = trustTransactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = trustTransactions.filter(t => t.type === 'Payment' || t.type === 'Transfer').reduce((sum, t) => sum + t.amount, 0);

        const clientLedgers = matters.map(m => ({
            matterId: m.id,
            clientName: m.client,
            balance: m.trustBalance || 0
        })).filter(l => l.balance > 0);

        return {
            id: `iolta-${Date.now()}`,
            reportDate: new Date().toISOString(),
            jurisdiction,
            trustAccountNumber: 'XXXX-1234',
            beginningBalance: 0, // In production, fetch from previous report
            deposits,
            withdrawals,
            endingBalance: deposits - withdrawals,
            clientLedgers,
            interestEarned: 0,
            complianceStatus: 'Compliant',
            issues: []
        };
    }
};
