import {
    SecureShare,
    ReadReceipt,
    PortalPayment,
    ClientNotification,
    Document
} from '../types';

/**
 * Enhanced Client Portal Service - Handles secure document sharing, payments, and client comms
 */

const SHARES: Map<string, SecureShare> = new Map();
const RECEIPTS: ReadReceipt[] = [];

export const portalService = {
    /**
     * Create a secure sharing link for a document
     */
    shareDocument: (documentId: string, sharedWith: string, expiresDays: number = 7): SecureShare => {
        const share: SecureShare = {
            id: `share-${Date.now()}`,
            documentId,
            sharedBy: 'current-user-id', // In production, get from state
            sharedWith,
            shareDate: new Date().toISOString(),
            expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString(),
            allowDownload: true,
            allowPrint: false,
            requiresAuth: true,
            viewCount: 0,
            status: 'Active'
        };
        SHARES.set(share.id, share);
        return share;
    },

    /**
     * Record a read receipt when a client views a shared document
     */
    recordView: (shareId: string, userId: string): void => {
        const share = SHARES.get(shareId);
        if (share) {
            share.viewCount++;
            share.lastViewed = new Date().toISOString();

            RECEIPTS.push({
                id: `receipt-${Date.now()}`,
                documentId: share.documentId,
                userId,
                viewedAt: new Date().toISOString(),
                duration: 0, // In production, track session duration
                deviceType: 'Desktop'
            });
        }
    },

    /**
     * Process a client payment through the portal
     */
    processPortalPayment: async (matterId: string, amount: number, method: any): Promise<PortalPayment> => {
        // Simulating payment gateway integration
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            id: `pay-${Date.now()}`,
            matterId,
            amount,
            paymentMethod: method,
            status: 'Completed',
            transactionId: `tx-${Math.random().toString(36).substring(7)}`,
            processedAt: new Date().toISOString(),
            fee: amount * 0.029 + 0.30, // Mock Stripe fee
            netAmount: amount - (amount * 0.029 + 0.30)
        };
    },

    /**
     * Send an automated status update to a client
     */
    notifyClient: (matterId: string, clientId: string, type: any, title: string, message: string): ClientNotification => {
        const notification: ClientNotification = {
            id: `notif-${Date.now()}`,
            matterId,
            clientId,
            type,
            title,
            message,
            sentAt: new Date().toISOString(),
            priority: 'Medium'
        };
        console.log(`[Portal] Notification sent to client: ${title}`);
        return notification;
    }
};
