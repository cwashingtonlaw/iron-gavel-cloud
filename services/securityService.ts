import { TwoFactorAuth, SecuritySession, SecurityAlert } from '../types';

/**
 * Security Service - 2FA, Session Management, and Security Monitoring
 */

// ============================================================================
// TWO-FACTOR AUTHENTICATION
// ============================================================================

/**
 * Generate backup codes for 2FA
 */
export const generateBackupCodes = (count: number = 10): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
};

/**
 * Generate TOTP secret for authenticator apps
 */
export const generateTOTPSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
};

/**
 * Verify TOTP code (simplified - in production use a proper TOTP library)
 */
export const verifyTOTPCode = (secret: string, code: string): boolean => {
    // In production, use a library like 'otplib' or 'speakeasy'
    // This is a simplified mock for demonstration
    return code.length === 6 && /^\d{6}$/.test(code);
};

/**
 * Send 2FA code via SMS (mock)
 */
export const sendSMSCode = async (phoneNumber: string): Promise<string> => {
    // In production, integrate with Twilio, AWS SNS, etc.
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[MOCK SMS] Sending code ${code} to ${phoneNumber}`);
    return code;
};

/**
 * Send 2FA code via Email (mock)
 */
export const sendEmailCode = async (email: string): Promise<string> => {
    // In production, integrate with SendGrid, AWS SES, etc.
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[MOCK EMAIL] Sending code ${code} to ${email}`);
    return code;
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const SESSIONS: Map<string, SecuritySession> = new Map();
const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_MAX_LIFETIME_HOURS = 8;

/**
 * Create a new security session
 */
export const createSession = (userId: string, deviceInfo: {
    deviceName: string;
    userAgent: string;
    ipAddress: string;
}): SecuritySession => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_LIFETIME_HOURS * 60 * 60 * 1000);

    const session: SecuritySession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        deviceId: generateDeviceId(deviceInfo.userAgent),
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        loginTime: now.toISOString(),
        lastActivity: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
    };

    SESSIONS.set(session.id, session);
    return session;
};

/**
 * Update session activity
 */
export const updateSessionActivity = (sessionId: string): boolean => {
    const session = SESSIONS.get(sessionId);
    if (!session || !session.isActive) return false;

    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    // Check if session timed out
    if (minutesSinceActivity > SESSION_TIMEOUT_MINUTES) {
        session.isActive = false;
        return false;
    }

    // Check if session expired
    if (now > new Date(session.expiresAt)) {
        session.isActive = false;
        return false;
    }

    session.lastActivity = now.toISOString();
    return true;
};

/**
 * Terminate a session
 */
export const terminateSession = (sessionId: string): void => {
    const session = SESSIONS.get(sessionId);
    if (session) {
        session.isActive = false;
    }
};

/**
 * Get all active sessions for a user
 */
export const getUserSessions = (userId: string): SecuritySession[] => {
    return Array.from(SESSIONS.values()).filter(
        s => s.userId === userId && s.isActive
    );
};

/**
 * Terminate all sessions for a user (useful for "logout everywhere")
 */
export const terminateAllUserSessions = (userId: string): void => {
    SESSIONS.forEach(session => {
        if (session.userId === userId) {
            session.isActive = false;
        }
    });
};

/**
 * Generate a unique device ID from user agent
 */
const generateDeviceId = (userAgent: string): string => {
    // Simple hash of user agent
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
        const char = userAgent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `device-${Math.abs(hash)}`;
};

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

/**
 * Simple encryption (in production, use Web Crypto API)
 */
export const encryptData = async (data: string, key: string): Promise<string> => {
    // In production, use Web Crypto API:
    // const encoder = new TextEncoder();
    // const data = encoder.encode(plaintext);
    // const encrypted = await crypto.subtle.encrypt(algorithm, key, data);

    // Mock encryption (base64 encoding)
    return btoa(data);
};

/**
 * Simple decryption (in production, use Web Crypto API)
 */
export const decryptData = async (encryptedData: string, key: string): Promise<string> => {
    // Mock decryption
    return atob(encryptedData);
};

/**
 * Generate encryption key pair (mock)
 */
export const generateKeyPair = async (): Promise<{
    publicKey: string;
    privateKey: string;
}> => {
    // In production, use Web Crypto API:
    // const keyPair = await crypto.subtle.generateKey(
    //   { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    //   true,
    //   ["encrypt", "decrypt"]
    // );

    return {
        publicKey: btoa(`public-${Date.now()}`),
        privateKey: btoa(`private-${Date.now()}`),
    };
};

// ============================================================================
// SECURITY MONITORING
// ============================================================================

const SECURITY_ALERTS: SecurityAlert[] = [];
const LOGIN_ATTEMPTS: Map<string, { count: number; lastAttempt: Date }> = new Map();

/**
 * Record a failed login attempt
 */
export const recordFailedLogin = (userId: string, ipAddress: string): SecurityAlert | null => {
    const key = `${userId}-${ipAddress}`;
    const attempts = LOGIN_ATTEMPTS.get(key) || { count: 0, lastAttempt: new Date() };

    attempts.count++;
    attempts.lastAttempt = new Date();
    LOGIN_ATTEMPTS.set(key, attempts);

    // Create alert if too many failed attempts
    if (attempts.count >= 5) {
        const alert: SecurityAlert = {
            id: `alert-${Date.now()}`,
            type: 'Multiple Failed Attempts',
            severity: 'High',
            userId,
            description: `${attempts.count} failed login attempts from IP ${ipAddress}`,
            timestamp: new Date().toISOString(),
            resolved: false,
        };

        SECURITY_ALERTS.push(alert);
        return alert;
    }

    return null;
};

/**
 * Clear failed login attempts (after successful login)
 */
export const clearFailedLogins = (userId: string, ipAddress: string): void => {
    const key = `${userId}-${ipAddress}`;
    LOGIN_ATTEMPTS.delete(key);
};

/**
 * Detect suspicious login patterns
 */
export const detectSuspiciousLogin = (
    userId: string,
    ipAddress: string,
    userAgent: string,
    recentSessions: SecuritySession[]
): SecurityAlert | null => {
    // Check for login from new location
    const knownIPs = new Set(recentSessions.map(s => s.ipAddress));

    if (!knownIPs.has(ipAddress) && recentSessions.length > 0) {
        const alert: SecurityAlert = {
            id: `alert-${Date.now()}`,
            type: 'Suspicious Login',
            severity: 'Medium',
            userId,
            description: `Login from new IP address: ${ipAddress}`,
            timestamp: new Date().toISOString(),
            resolved: false,
        };

        SECURITY_ALERTS.push(alert);
        return alert;
    }

    return null;
};

/**
 * Get all unresolved security alerts
 */
export const getUnresolvedAlerts = (): SecurityAlert[] => {
    return SECURITY_ALERTS.filter(a => !a.resolved);
};

/**
 * Resolve a security alert
 */
export const resolveAlert = (alertId: string, resolvedBy: string): void => {
    const alert = SECURITY_ALERTS.find(a => a.id === alertId);
    if (alert) {
        alert.resolved = true;
        alert.resolvedBy = resolvedBy;
        alert.resolvedAt = new Date().toISOString();
    }
};

/**
 * Check if data access should be allowed
 */
export const checkDataAccess = (
    userId: string,
    documentId: string,
    accessType: 'View' | 'Download' | 'Print' | 'Share',
    userPermissions: string[]
): { allowed: boolean; reason?: string } => {
    // Implement your access control logic here
    // This is a simplified example

    const requiredPermissions: Record<string, string> = {
        'View': 'documents:read',
        'Download': 'documents:download',
        'Print': 'documents:print',
        'Share': 'documents:share',
    };

    const required = requiredPermissions[accessType];
    if (!required) {
        return { allowed: false, reason: 'Invalid access type' };
    }

    if (!userPermissions.includes(required) && !userPermissions.includes('admin')) {
        return { allowed: false, reason: `Missing permission: ${required}` };
    }

    return { allowed: true };
};
