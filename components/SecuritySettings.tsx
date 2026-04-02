import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    ShieldCheck,
    Smartphone,
    Key,
    LogOut,
    AlertCircle,
    ShieldAlert,
    Globe,
    Laptop,
    History,
    Lock,
    Unlock,
    ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { generateTOTPSecret, generateBackupCodes } from '../services/securityService';

export const SecuritySettings: React.FC = () => {
    const {
        activeSessions,
        securityAlerts,
        tfaSettings,
        updateTfaSettings,
        removeSession,
        resolveSecurityAlert,
        currentUser
    } = useStore();

    const [setupMode, setSetupMode] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const handleEnable2FA = () => {
        const secret = generateTOTPSecret();
        const codes = generateBackupCodes();
        setBackupCodes(codes);

        updateTfaSettings({
            userId: currentUser.id,
            enabled: true,
            method: 'Authenticator App',
            secret,
            backupCodes: codes,
            lastVerified: new Date().toISOString()
        });
        setSetupMode(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100">
                    <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security & Governance</h2>
                    <p className="text-slate-500 font-medium text-lg">Manage your identity, encryption, and sessions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 2FA Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="flex items-start justify-between mb-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h3>
                            <p className="text-slate-500 text-sm">Add an extra layer of protection to your account</p>
                        </div>
                        {tfaSettings?.enabled ? (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> ENABLED
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Unlock className="w-3 h-3" /> DISABLED
                            </span>
                        )}
                    </div>

                    {!tfaSettings?.enabled ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3">
                                <Smartphone className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                                <p className="text-sm text-indigo-700 leading-snug">
                                    Use an authenticator app (like Authy or Google Authenticator) to generate secure login codes.
                                </p>
                            </div>
                            <button
                                onClick={handleEnable2FA}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                <Key className="w-5 h-5" />
                                Setup Authentication
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-2">
                                {tfaSettings.backupCodes.slice(0, 4).map((code, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-mono text-center text-xs font-bold text-slate-600">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 text-center">Backup codes stored securely. Keep them in a safe place.</p>
                            <button className="w-full border border-rose-200 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-50 transition-all">
                                Disable 2FA
                            </button>
                        </div>
                    )}
                </div>

                {/* Security Alerts Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <ShieldAlert className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-bold text-slate-900">Security Alerts</h3>
                    </div>

                    <div className="space-y-4">
                        {securityAlerts.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No suspicious activity detected</p>
                            </div>
                        ) : (
                            securityAlerts.map(alert => (
                                <div key={alert.id} className={`p-4 rounded-2xl border ${alert.resolved ? 'bg-slate-50 border-slate-100 grayscale' : 'bg-amber-50 border-amber-100 animate-pulse'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{alert.type}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{alert.description}</p>
                                            <span className="text-[10px] text-slate-400 mt-2 block">{format(new Date(alert.timestamp), 'MMM d, HH:mm')}</span>
                                        </div>
                                        {!alert.resolved && (
                                            <button
                                                onClick={() => resolveSecurityAlert(alert.id, currentUser.name)}
                                                className="text-amber-700 bg-amber-200 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-6 h-6 text-indigo-600" />
                        <h3 className="text-xl font-bold text-slate-900">Active Sessions</h3>
                    </div>
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Logout everywhere</button>
                </div>

                <div className="divide-y divide-slate-100">
                    {activeSessions.map(session => (
                        <div key={session.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                                    {session.userAgent.includes('Mobile') ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900">{session.deviceName}</h4>
                                        {session.isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-400" /> {session.ipAddress}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span>Last active {format(new Date(session.lastActivity), 'HH:mm')}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => removeSession(session.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Revoke session"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {activeSessions.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-medium italic">
                            No active sessions found. How are you here?
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
