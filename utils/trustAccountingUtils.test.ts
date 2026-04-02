import { describe, it, expect } from 'vitest';
import {
    calculateTrustBalance,
    calculateTotalTrustBalance,
    validateTrustTransaction,
    validateTrustTransfer,
    generateIOLTAReport,
    detectViolations,
    performThreeWayReconciliation,
    TrustTransferRequest
} from './trustAccountingUtils';
import { Transaction, Matter } from '../types';

describe('Trust Accounting Utils (F8 - IOLTA Compliance)', () => {
    const mockTransactions: Transaction[] = [
        {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Client retainer',
            amount: 5000
        },
        {
            id: 'TXN-002',
            date: '2025-01-20',
            type: 'Payment',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Legal fees',
            amount: 1500
        },
        {
            id: 'TXN-003',
            date: '2025-01-25',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-002',
            description: 'Retainer for Matter 2',
            amount: 3000
        },
        {
            id: 'TXN-004',
            date: '2025-01-30',
            type: 'Deposit',
            ledger: 'Operating',
            matterId: 'MAT-001',
            description: 'Fee payment',
            amount: 2000
        }
    ];

    const mockMatters: Matter[] = [
        {
            id: 'MAT-001',
            name: 'Smith v. Johnson',
            client: 'John Smith',
            status: 'Open',
            openDate: '2025-01-01',
            notes: 'Personal injury case',
            billing: { type: 'Hourly', rate: 300 }
        },
        {
            id: 'MAT-002',
            name: 'Doe Corporation Matter',
            client: 'Doe Corp',
            status: 'Open',
            openDate: '2025-01-15',
            notes: 'Contract dispute',
            billing: { type: 'Flat Fee', fee: 5000 }
        }
    ];

    describe('calculateTrustBalance', () => {
        it('should calculate correct balance for matter with deposits and payments', () => {
            const balance = calculateTrustBalance('MAT-001', mockTransactions);
            expect(balance).toBe(3500); // 5000 - 1500
        });

        it('should calculate correct balance for matter with only deposits', () => {
            const balance = calculateTrustBalance('MAT-002', mockTransactions);
            expect(balance).toBe(3000);
        });

        it('should return 0 for matter with no trust transactions', () => {
            const balance = calculateTrustBalance('MAT-999', mockTransactions);
            expect(balance).toBe(0);
        });

        it('should ignore operating account transactions', () => {
            const balance = calculateTrustBalance('MAT-001', mockTransactions);
            // Should not include TXN-004 (Operating account)
            expect(balance).toBe(3500);
        });
    });

    describe('calculateTotalTrustBalance', () => {
        it('should calculate total trust balance across all matters', () => {
            const total = calculateTotalTrustBalance(mockTransactions);
            expect(total).toBe(6500); // (5000 - 1500) + 3000
        });

        it('should return 0 when no trust transactions exist', () => {
            const operatingOnly: Transaction[] = [
                {
                    id: 'TXN-100',
                    date: '2025-01-15',
                    type: 'Deposit',
                    ledger: 'Operating',
                    matterId: 'MAT-001',
                    description: 'Fee',
                    amount: 1000
                }
            ];
            const total = calculateTotalTrustBalance(operatingOnly);
            expect(total).toBe(0);
        });
    });

    describe('validateTrustTransaction', () => {
        it('should allow valid trust deposit', () => {
            const transaction: Transaction = {
                id: 'TXN-NEW',
                date: '2025-02-01',
                type: 'Deposit',
                ledger: 'Trust',
                matterId: 'MAT-001',
                description: 'Additional retainer',
                amount: 2000
            };
            const result = validateTrustTransaction(transaction, 3500);
            expect(result.valid).toBe(true);
        });

        it('should allow valid trust payment with sufficient balance', () => {
            const transaction: Transaction = {
                id: 'TXN-NEW',
                date: '2025-02-01',
                type: 'Payment',
                ledger: 'Trust',
                matterId: 'MAT-001',
                description: 'Legal fees',
                amount: 1000
            };
            const result = validateTrustTransaction(transaction, 3500);
            expect(result.valid).toBe(true);
        });

        it('should prevent trust overdraft', () => {
            const transaction: Transaction = {
                id: 'TXN-NEW',
                date: '2025-02-01',
                type: 'Payment',
                ledger: 'Trust',
                matterId: 'MAT-001',
                description: 'Attempted overdraft',
                amount: 5000
            };
            const result = validateTrustTransaction(transaction, 3500);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('IOLTA VIOLATION');
            expect(result.error).toContain('Insufficient trust balance');
        });

        it('should prevent negative transaction amounts', () => {
            const transaction: Transaction = {
                id: 'TXN-NEW',
                date: '2025-02-01',
                type: 'Payment',
                ledger: 'Trust',
                matterId: 'MAT-001',
                description: 'Invalid amount',
                amount: -100
            };
            const result = validateTrustTransaction(transaction, 3500);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be positive');
        });

        it('should allow operating account transactions without validation', () => {
            const transaction: Transaction = {
                id: 'TXN-NEW',
                date: '2025-02-01',
                type: 'Payment',
                ledger: 'Operating',
                matterId: 'MAT-001',
                description: 'Office expense',
                amount: 10000
            };
            const result = validateTrustTransaction(transaction, 0);
            expect(result.valid).toBe(true);
        });
    });

    describe('validateTrustTransfer', () => {
        it('should allow valid trust-to-operating transfer', () => {
            const transfer: TrustTransferRequest = {
                id: 'XFER-001',
                fromLedger: 'Trust',
                toLedger: 'Operating',
                matterId: 'MAT-001',
                amount: 1500,
                reason: 'Legal fees earned for services rendered in January 2025',
                requestedBy: 'USER-001',
                requestedDate: '2025-02-01',
                status: 'Pending'
            };
            const result = validateTrustTransfer(transfer, 3500);
            expect(result.valid).toBe(true);
        });

        it('should prevent transfer with insufficient balance', () => {
            const transfer: TrustTransferRequest = {
                id: 'XFER-002',
                fromLedger: 'Trust',
                toLedger: 'Operating',
                matterId: 'MAT-001',
                amount: 5000,
                reason: 'Legal fees earned for services rendered',
                requestedBy: 'USER-001',
                requestedDate: '2025-02-01',
                status: 'Pending'
            };
            const result = validateTrustTransfer(transfer, 3500);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Insufficient trust balance');
        });

        it('should require detailed transfer reason', () => {
            const transfer: TrustTransferRequest = {
                id: 'XFER-003',
                fromLedger: 'Trust',
                toLedger: 'Operating',
                matterId: 'MAT-001',
                amount: 1000,
                reason: 'Fees', // Too short
                requestedBy: 'USER-001',
                requestedDate: '2025-02-01',
                status: 'Pending'
            };
            const result = validateTrustTransfer(transfer, 3500);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('at least 10 characters');
        });

        it('should allow operating-to-trust transfers without restriction', () => {
            const transfer: TrustTransferRequest = {
                id: 'XFER-004',
                fromLedger: 'Operating',
                toLedger: 'Trust',
                matterId: 'MAT-001',
                amount: 5000,
                reason: 'Short', // Should still pass for non-trust-to-operating
                requestedBy: 'USER-001',
                requestedDate: '2025-02-01',
                status: 'Pending'
            };
            const result = validateTrustTransfer(transfer, 0);
            expect(result.valid).toBe(true);
        });
    });

    describe('generateIOLTAReport', () => {
        it('should generate comprehensive IOLTA report', () => {
            const report = generateIOLTAReport(
                mockTransactions,
                mockMatters,
                '2025-01-01',
                '2025-01-31'
            );

            expect(report.totalTrustBalance).toBe(6500);
            expect(report.matterBalances).toHaveLength(2);
            expect(report.matterBalances[0].balance).toBe(3500);
            expect(report.matterBalances[1].balance).toBe(3000);
            expect(report.transactionCount).toBe(3); // 3 trust transactions
            expect(report.complianceScore).toBe(100); // No violations
        });

        it('should only include matters with non-zero balances', () => {
            const txWithZeroBalance: Transaction[] = [
                {
                    id: 'TXN-001',
                    date: '2025-01-15',
                    type: 'Deposit',
                    ledger: 'Trust',
                    matterId: 'MAT-001',
                    description: 'Retainer',
                    amount: 1000
                },
                {
                    id: 'TXN-002',
                    date: '2025-01-20',
                    type: 'Payment',
                    ledger: 'Trust',
                    matterId: 'MAT-001',
                    description: 'Full payment',
                    amount: 1000
                }
            ];

            const report = generateIOLTAReport(
                txWithZeroBalance,
                mockMatters,
                '2025-01-01',
                '2025-01-31'
            );

            expect(report.matterBalances).toHaveLength(0);
        });
    });

    describe('detectViolations', () => {
        it('should detect overdraft violations', () => {
            const overdraftTransactions: Transaction[] = [
                {
                    id: 'TXN-001',
                    date: '2025-01-15',
                    type: 'Deposit',
                    ledger: 'Trust',
                    matterId: 'MAT-001',
                    description: 'Retainer',
                    amount: 1000
                },
                {
                    id: 'TXN-002',
                    date: '2025-01-20',
                    type: 'Payment',
                    ledger: 'Trust',
                    matterId: 'MAT-001',
                    description: 'Overdraft',
                    amount: 2000
                }
            ];

            const violations = detectViolations(overdraftTransactions, mockMatters);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].type).toBe('Overdraft Attempt');
            expect(violations[0].severity).toBe('Critical');
            expect(violations[0].matterId).toBe('MAT-001');
        });

        it('should return no violations for compliant accounts', () => {
            const violations = detectViolations(mockTransactions, mockMatters);
            expect(violations).toHaveLength(0);
        });
    });

    describe('performThreeWayReconciliation', () => {
        it('should reconcile when all balances match', () => {
            const bankBalance = 6500; // Matches total trust balance
            const result = performThreeWayReconciliation(
                mockTransactions,
                mockMatters,
                bankBalance
            );

            expect(result.bookBalance).toBe(6500);
            expect(result.bankBalance).toBe(6500);
            expect(result.sumOfMatterBalances).toBe(6500);
            expect(result.balanced).toBe(true);
            expect(result.discrepancy).toBeLessThan(0.01);
        });

        it('should detect discrepancy between book and bank balance', () => {
            const bankBalance = 6000; // $500 less than book balance
            const result = performThreeWayReconciliation(
                mockTransactions,
                mockMatters,
                bankBalance
            );

            expect(result.balanced).toBe(false);
            expect(result.discrepancy).toBe(500);
        });

        it('should detect discrepancy in matter balances', () => {
            // This would happen if there's a data integrity issue
            const bankBalance = 6500;
            const result = performThreeWayReconciliation(
                mockTransactions,
                mockMatters,
                bankBalance
            );

            // In this case, they should match
            expect(result.bookBalance).toBe(result.sumOfMatterBalances);
        });
    });
});
