import { SecuritySession, SecurityAlert, TwoFactorAuth } from '../../types';

export interface SecurityState {
    activeSessions: SecuritySession[];
    securityAlerts: SecurityAlert[];
    tfaSettings: TwoFactorAuth | null;
    addSession: (session: SecuritySession) => void;
    removeSession: (sessionId: string) => void;
    addSecurityAlert: (alert: SecurityAlert) => void;
    resolveSecurityAlert: (alertId: string, resolvedBy: string) => void;
    updateTfaSettings: (settings: TwoFactorAuth) => void;
}

export const createSecuritySlice = (set: any, get: any, api: any): SecurityState => ({
    activeSessions: [],
    securityAlerts: [],
    tfaSettings: null,
    addSession: (session) => set((state: any) => ({
        activeSessions: [...state.activeSessions, session]
    })),
    removeSession: (sessionId) => set((state: any) => ({
        activeSessions: state.activeSessions.filter((s: any) => s.id !== sessionId)
    })),
    addSecurityAlert: (alert) => set((state: any) => ({
        securityAlerts: [alert, ...state.securityAlerts]
    })),
    resolveSecurityAlert: (alertId, resolvedBy) => set((state: any) => ({
        securityAlerts: state.securityAlerts.map((a: any) =>
            a.id === alertId ? { ...a, resolved: true, resolvedBy, resolvedAt: new Date().toISOString() } : a
        )
    })),
    updateTfaSettings: (settings) => set({ tfaSettings: settings }),
});
