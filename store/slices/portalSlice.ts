import { SecureShare, ReadReceipt, ClientNotification, PortalPayment } from '../../types';

export interface PortalState {
    secureShares: SecureShare[];
    readReceipts: ReadReceipt[];
    clientNotifications: ClientNotification[];
    portalPayments: PortalPayment[];
    addShare: (share: SecureShare) => void;
    addReceipt: (receipt: ReadReceipt) => void;
    addClientNotification: (notification: ClientNotification) => void;
    addPortalPayment: (payment: PortalPayment) => void;
    revokeShare: (shareId: string) => void;
}

export const createPortalSlice = (set: any, get: any, api: any): PortalState => ({
    secureShares: [],
    readReceipts: [],
    clientNotifications: [],
    portalPayments: [],
    addShare: (share) => set((state: any) => ({
        secureShares: [...state.secureShares, share]
    })),
    addReceipt: (receipt) => set((state: any) => ({
        readReceipts: [...state.readReceipts, receipt]
    })),
    addClientNotification: (notification) => set((state: any) => ({
        clientNotifications: [notification, ...state.clientNotifications]
    })),
    addPortalPayment: (payment) => set((state: any) => ({
        portalPayments: [payment, ...state.portalPayments]
    })),
    revokeShare: (shareId) => set((state: any) => ({
        secureShares: state.secureShares.map((s: any) =>
            s.id === shareId ? { ...s, status: 'Revoked' } : s
        )
    })),
});
