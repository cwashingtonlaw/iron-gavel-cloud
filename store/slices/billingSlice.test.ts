import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createBillingSlice, BillingSlice } from './billingSlice';
import { Transaction } from '../../types';

// Create a test store
type TestStore = BillingSlice;

describe('Trust Accounting (F8 - IOLTA Compliance)', () => {
    let store: ReturnType<typeof create<TestStore>>;

    beforeEach(() => {
        // Create a fresh store for each test
        store = create<TestStore>((set, get) => ({
            ...createBillingSlice(set, get, {} as any)
        }));
    });

    it('should allow trust deposits', () => {
        const deposit: Transaction = {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Client retainer',
            amount: 5000
        };

        store.getState().addTransaction(deposit);
        expect(store.getState().transactions).toHaveLength(1);
        expect(store.getState().transactions[0]).toEqual(deposit);
    });

    it('should calculate correct trust balance', () => {
        const deposit: Transaction = {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Client retainer',
            amount: 5000
        };

        const payment: Transaction = {
            id: 'TXN-002',
            date: '2025-01-20',
            type: 'Payment',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Legal fees',
            amount: 1500
        };

        store.getState().addTransaction(deposit);
        store.getState().addTransaction(payment);

        const balance = store.getState().getMatterBalance('MAT-001', 'Trust');
        expect(balance).toBe(3500); // 5000 - 1500
    });

    it('should prevent trust overdraft (IOLTA violation)', () => {
        const deposit: Transaction = {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Client retainer',
            amount: 1000
        };

        const overdraftPayment: Transaction = {
            id: 'TXN-002',
            date: '2025-01-20',
            type: 'Payment',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Attempted overdraft',
            amount: 2000
        };

        store.getState().addTransaction(deposit);

        // Capture console.error to verify warning
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        store.getState().addTransaction(overdraftPayment);

        // Should still only have 1 transaction (deposit)
        expect(store.getState().transactions).toHaveLength(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('IOLTA VIOLATION')
        );

        consoleErrorSpy.mockRestore();
    });

    it('should allow operating account transactions without restriction', () => {
        const payment: Transaction = {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Payment',
            ledger: 'Operating',
            matterId: 'MAT-001',
            description: 'Office supplies',
            amount: 500
        };

        store.getState().addTransaction(payment);
        expect(store.getState().transactions).toHaveLength(1);
    });

    it('should maintain separate balances for Trust and Operating', () => {
        const trustDeposit: Transaction = {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Client retainer',
            amount: 5000
        };

        const operatingDeposit: Transaction = {
            id: 'TXN-002',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Operating',
            matterId: 'MAT-001',
            description: 'Fee payment',
            amount: 3000
        };

        store.getState().addTransaction(trustDeposit);
        store.getState().addTransaction(operatingDeposit);

        const trustBalance = store.getState().getMatterBalance('MAT-001', 'Trust');
        const operatingBalance = store.getState().getMatterBalance('MAT-001', 'Operating');

        expect(trustBalance).toBe(5000);
        expect(operatingBalance).toBe(3000);
    });

    it('should handle multiple matters with separate trust accounts', () => {
        const matter1Deposit: Transaction = {
            id: 'TXN-001',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-001',
            description: 'Matter 1 retainer',
            amount: 5000
        };

        const matter2Deposit: Transaction = {
            id: 'TXN-002',
            date: '2025-01-15',
            type: 'Deposit',
            ledger: 'Trust',
            matterId: 'MAT-002',
            description: 'Matter 2 retainer',
            amount: 3000
        };

        store.getState().addTransaction(matter1Deposit);
        store.getState().addTransaction(matter2Deposit);

        expect(store.getState().getMatterBalance('MAT-001', 'Trust')).toBe(5000);
        expect(store.getState().getMatterBalance('MAT-002', 'Trust')).toBe(3000);
    });

    it('should return 0 balance for matters with no transactions', () => {
        const balance = store.getState().getMatterBalance('MAT-999', 'Trust');
        expect(balance).toBe(0);
    });
});
