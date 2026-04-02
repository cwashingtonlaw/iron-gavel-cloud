import { AuditLog, AuditAction, AuditEntityType, AuditChange } from '../../types';
import { createAuditLog } from '../../services/auditService';

export interface AuditState {
    auditLogs: AuditLog[];
    addAuditLog: (params: {
        userId: string;
        userName: string;
        action: AuditAction;
        entityType: AuditEntityType;
        entityId: string;
        entityName?: string;
        changes?: AuditChange[];
    }) => AuditLog;
    clearAuditLogs: () => void;
}

export const createAuditSlice = (set: any, get: any, api: any): AuditState => ({
    auditLogs: [],
    addAuditLog: (params) => {
        const newLog = createAuditLog(params);
        set((state: any) => ({
            auditLogs: [newLog, ...state.auditLogs]
        }));
        return newLog;
    },
    clearAuditLogs: () => set({ auditLogs: [] }),
});
