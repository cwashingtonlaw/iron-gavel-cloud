import { Transaction, Matter } from '../types';

/**
 * F8: Trust Accounting & IOLTA Compliance Utilities
 * 
 * This module provides comprehensive trust accounting functionality
 * to ensure IOLTA (Interest on Lawyers' Trust Accounts) compliance.
 */

export interface TrustAccountReconciliation {
    matterId: string;
    matterName: string;
    clientName: string;
    bookBalance: number; // Balance per firm's records
    bankBalance?: number; // Balance per bank statement (optional for reconciliation)
    lastReconciled?: string; // ISO date
    discrepancies: TrustDiscrepancy[];
    status: 'Balanced' | 'Discrepancy' | 'Needs Review';
}

export interface TrustDiscrepancy {
    id: string;
    type: 'Missing Transaction' | 'Amount Mismatch' | 'Duplicate Entry' | 'Unauthorized Withdrawal';
    description: string;
    amount: number;
    date: string;
    resolved: boolean;
    notes?: string;
}

export interface TrustTransferRequest {
    id: string;
    fromLedger: 'Trust' | 'Operating';
    toLedger: 'Trust' | 'Operating';
    matterId: string;
    amount: number;
    reason: string;
    requestedBy: string;
    requestedDate: string;
    approvedBy?: string;
    approvedDate?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
    rejectionReason?: string;
}

export interface IOLTAComplianceReport {
    reportDate: string;
    reportPeriodStart: string;
    reportPeriodEnd: string;
    totalTrustBalance: number;
    matterBalances: {
        matterId: string;
        matterName: string;
        clientName: string;
        balance: number;
    }[];
    violations: IOLTAViolation[];
    transactionCount: number;
    complianceScore: number; // 0-100
}

export interface IOLTAViolation {
    id: string;
    type: 'Overdraft Attempt' | 'Commingling' | 'Unauthorized Transfer' | 'Missing Documentation';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    matterId: string;
    date: string;
    resolved: boolean;
    resolutionNotes?: string;
}

/**
 * Calculate the trust balance for a specific matter
 */
export const calculateTrustBalance = (
    matterId: string,
    transactions: Transaction[]
): number => {
    return transactions
        .filter(t => t.matterId === matterId && t.ledger === 'Trust')
        .reduce((balance, t) => {
            if (t.type === 'Deposit') return balance + t.amount;
            if (t.type === 'Payment') return balance - t.amount;
            return balance;
        }, 0);
};

/**
 * Calculate total trust balance across all matters
 */
export const calculateTotalTrustBalance = (
    transactions: Transaction[]
): number => {
    return transactions
        .filter(t => t.ledger === 'Trust')
        .reduce((balance, t) => {
            if (t.type === 'Deposit') return balance + t.amount;
            if (t.type === 'Payment') return balance - t.amount;
            return balance;
        }, 0);
};

/**
 * Validate a trust transaction before processing
 */
export const validateTrustTransaction = (
    transaction: Transaction,
    currentBalance: number
): { valid: boolean; error?: string } => {
    // Only validate withdrawals from trust
    if (transaction.ledger !== 'Trust' || transaction.type !== 'Payment') {
        return { valid: true };
    }

    // Check for overdraft
    if (currentBalance < transaction.amount) {
        return {
            valid: false,
            error: `IOLTA VIOLATION: Insufficient trust balance. Current: $${currentBalance.toFixed(2)}, Requested: $${transaction.amount.toFixed(2)}`
        };
    }

    // Check for negative amounts
    if (transaction.amount <= 0) {
        return {
            valid: false,
            error: 'Transaction amount must be positive'
        };
    }

    return { valid: true };
};

/**
 * Validate a trust-to-operating transfer
 * Trust funds can only be transferred to operating when earned
 */
export const validateTrustTransfer = (
    transfer: TrustTransferRequest,
    currentTrustBalance: number
): { valid: boolean; error?: string } => {
    // Only validate trust-to-operating transfers
    if (transfer.fromLedger !== 'Trust' || transfer.toLedger !== 'Operating') {
        return { valid: true };
    }

    // Check sufficient balance
    if (currentTrustBalance < transfer.amount) {
        return {
            valid: false,
            error: `Insufficient trust balance for transfer. Available: $${currentTrustBalance.toFixed(2)}, Requested: $${transfer.amount.toFixed(2)}`
        };
    }

    // Require reason for transfer
    if (!transfer.reason || transfer.reason.trim().length < 10) {
        return {
            valid: false,
            error: 'Transfer reason must be at least 10 characters (e.g., "Legal fees earned for services rendered")'
        };
    }

    return { valid: true };
};

/**
 * Generate IOLTA compliance report
 */
export const generateIOLTAReport = (
    transactions: Transaction[],
    matters: Matter[],
    periodStart: string,
    periodEnd: string
): IOLTAComplianceReport => {
    const periodTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= new Date(periodStart) && txDate <= new Date(periodEnd);
    });

    const matterBalances = matters.map(matter => ({
        matterId: matter.id,
        matterName: matter.name,
        clientName: matter.client,
        balance: calculateTrustBalance(matter.id, transactions)
    })).filter(mb => mb.balance !== 0); // Only show matters with trust balances

    const totalTrustBalance = calculateTotalTrustBalance(transactions);

    // Calculate compliance score (simplified)
    const violations: IOLTAViolation[] = []; // Would be populated from actual violation tracking
    const complianceScore = violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 10));

    return {
        reportDate: new Date().toISOString(),
        reportPeriodStart: periodStart,
        reportPeriodEnd: periodEnd,
        totalTrustBalance,
        matterBalances,
        violations,
        transactionCount: periodTransactions.filter(t => t.ledger === 'Trust').length,
        complianceScore
    };
};

/**
 * Detect potential IOLTA violations in transaction history
 */
export const detectViolations = (
    transactions: Transaction[],
    matters: Matter[]
): IOLTAViolation[] => {
    const violations: IOLTAViolation[] = [];

    // Check for negative balances (overdrafts)
    matters.forEach(matter => {
        const balance = calculateTrustBalance(matter.id, transactions);
        if (balance < 0) {
            violations.push({
                id: `VIOL-${matter.id}-OVERDRAFT`,
                type: 'Overdraft Attempt',
                severity: 'Critical',
                description: `Matter "${matter.name}" has negative trust balance: $${balance.toFixed(2)}`,
                matterId: matter.id,
                date: new Date().toISOString(),
                resolved: false
            });
        }
    });

    return violations;
};

/**
 * Generate three-way reconciliation report
 * Compares: Book Balance vs Bank Balance vs Matter Balances
 */
export const performThreeWayReconciliation = (
    transactions: Transaction[],
    matters: Matter[],
    bankBalance: number
): {
    bookBalance: number;
    bankBalance: number;
    sumOfMatterBalances: number;
    balanced: boolean;
    discrepancy: number;
} => {
    const bookBalance = calculateTotalTrustBalance(transactions);
    const sumOfMatterBalances = matters.reduce((sum, matter) => {
        return sum + calculateTrustBalance(matter.id, transactions);
    }, 0);

    const balanced = Math.abs(bookBalance - bankBalance) < 0.01 &&
        Math.abs(bookBalance - sumOfMatterBalances) < 0.01;

    return {
        bookBalance,
        bankBalance,
        sumOfMatterBalances,
        balanced,
        discrepancy: Math.max(
            Math.abs(bookBalance - bankBalance),
            Math.abs(bookBalance - sumOfMatterBalances)
        )
    };
};
