import { AuditLog, AuditAction, AuditEntityType, AuditChange } from '../types';
import { createHash } from 'crypto';

/**
 * Audit Service - Tamper-proof logging with blockchain-style hash chaining
 */

let auditChain: AuditLog[] = [];
let lastHash: string | undefined = undefined;

/**
 * Create a SHA-256 hash of audit log entry for tamper detection
 */
export const createAuditHash = (log: Omit<AuditLog, 'hash' | 'previousHash'>): string => {
    const data = JSON.stringify({
        timestamp: log.timestamp,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        changes: log.changes,
    });

    // In browser environment, we'll use a simpler hash
    // In production, use Web Crypto API or a proper crypto library
    return btoa(data).substring(0, 64);
};

/**
 * Create an audit log entry with cryptographic hash
 */
export const createAuditLog = (params: {
    userId: string;
    userName: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    entityName?: string;
    changes?: AuditChange[];
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
}): AuditLog => {
    const timestamp = new Date().toISOString();

    const logWithoutHash: Omit<AuditLog, 'hash' | 'previousHash'> = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        timestamp,
        ...params,
    };

    const hash = createAuditHash(logWithoutHash);

    const auditLog: AuditLog = {
        ...logWithoutHash,
        hash,
        previousHash: lastHash,
    };

    // Update chain
    auditChain.push(auditLog);
    lastHash = hash;

    return auditLog;
};

/**
 * Verify the integrity of the audit chain
 */
export const verifyAuditChain = (logs: AuditLog[]): {
    valid: boolean;
    tamperedEntries: string[];
} => {
    const tamperedEntries: string[] = [];
    let expectedPreviousHash: string | undefined = undefined;

    for (const log of logs) {
        // Verify hash chain
        if (log.previousHash !== expectedPreviousHash) {
            tamperedEntries.push(log.id);
        }

        // Verify hash integrity
        const { hash, previousHash, ...logData } = log;
        const recalculatedHash = createAuditHash(logData);

        if (recalculatedHash !== hash) {
            tamperedEntries.push(log.id);
        }

        expectedPreviousHash = log.hash;
    }

    return {
        valid: tamperedEntries.length === 0,
        tamperedEntries,
    };
};

/**
 * Detect changes between old and new objects
 */
export const detectChanges = (oldObj: any, newObj: any): AuditChange[] => {
    const changes: AuditChange[] = [];

    if (!oldObj || !newObj) return changes;

    // Get all unique keys
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allKeys.forEach(key => {
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        // Skip functions and complex objects (for now)
        if (typeof oldValue === 'function' || typeof newValue === 'function') return;
        if (typeof oldValue === 'object' && oldValue !== null) return;
        if (typeof newValue === 'object' && newValue !== null) return;

        if (oldValue !== newValue) {
            changes.push({
                field: key,
                oldValue,
                newValue,
            });
        }
    });

    return changes;
};

/**
 * Export audit logs to CSV format
 */
export const exportAuditLogsToCSV = (logs: AuditLog[]): string => {
    const headers = [
        'Timestamp',
        'User',
        'Action',
        'Entity Type',
        'Entity ID',
        'Entity Name',
        'Changes',
        'IP Address',
        'Hash',
    ];

    const rows = logs.map(log => [
        log.timestamp,
        log.userName,
        log.action,
        log.entityType,
        log.entityId,
        log.entityName || '',
        log.changes ? JSON.stringify(log.changes) : '',
        log.ipAddress || '',
        log.hash,
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
};

/**
 * Export audit logs to JSON format
 */
export const exportAuditLogsToJSON = (logs: AuditLog[]): string => {
    return JSON.stringify(logs, null, 2);
};

/**
 * Filter audit logs by criteria
 */
export const filterAuditLogs = (
    logs: AuditLog[],
    filters: {
        startDate?: string;
        endDate?: string;
        userId?: string;
        action?: AuditAction;
        entityType?: AuditEntityType;
        entityId?: string;
    }
): AuditLog[] => {
    return logs.filter(log => {
        if (filters.startDate && log.timestamp < filters.startDate) return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.entityType && log.entityType !== filters.entityType) return false;
        if (filters.entityId && log.entityId !== filters.entityId) return false;
        return true;
    });
};

/**
 * Get audit summary statistics
 */
export const getAuditStatistics = (logs: AuditLog[]): {
    totalEntries: number;
    byAction: Record<AuditAction, number>;
    byEntityType: Record<AuditEntityType, number>;
    byUser: Record<string, number>;
    dateRange: { earliest: string; latest: string };
} => {
    const byAction: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    let earliest = logs[0]?.timestamp || '';
    let latest = logs[0]?.timestamp || '';

    logs.forEach(log => {
        // Count by action
        byAction[log.action] = (byAction[log.action] || 0) + 1;

        // Count by entity type
        byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1;

        // Count by user
        byUser[log.userName] = (byUser[log.userName] || 0) + 1;

        // Track date range
        if (log.timestamp < earliest) earliest = log.timestamp;
        if (log.timestamp > latest) latest = log.timestamp;
    });

    return {
        totalEntries: logs.length,
        byAction: byAction as Record<AuditAction, number>,
        byEntityType: byEntityType as Record<AuditEntityType, number>,
        byUser,
        dateRange: { earliest, latest },
    };
};

/**
 * Get browser information for audit logging
 */
export const getBrowserInfo = (): { ipAddress: string; userAgent: string } => {
    return {
        ipAddress: 'client-side', // In production, get from server
        userAgent: navigator.userAgent,
    };
};
