import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Shield, Eye, FileJson, FileSpreadsheet, Search, Filter, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { exportAuditLogsToCSV, exportAuditLogsToJSON, verifyAuditChain } from '../services/auditService';

export const AuditLog: React.FC = () => {
    const { auditLogs } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [verificationResult, setVerificationResult] = useState<{ valid: boolean, tamperedEntries: string[] } | null>(null);

    const filteredLogs = auditLogs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleVerify = () => {
        const result = verifyAuditChain(auditLogs);
        setVerificationResult(result);
    };

    const downloadCSV = () => {
        const csv = exportAuditLogsToCSV(auditLogs);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl">
                        <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Compliance Audit Trail</h2>
                        <p className="text-slate-500 font-medium">Immutable record of all system activities</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleVerify}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-semibold transition-colors border border-indigo-100"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Verify Integrity
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black font-semibold transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {verificationResult && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${verificationResult.valid ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                    {verificationResult.valid ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <p className="font-bold">
                        {verificationResult.valid
                            ? 'Cryptographic Verification Success: Audit chain is intact and untampered.'
                            : `Tamper Detected: ${verificationResult.tamperedEntries.length} entries have mismatched hashes!`}
                    </p>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Filter by user, action, or entity..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 text-slate-500 hover:text-indigo-600">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Hash ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-slate-900 font-medium">{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <span className="text-slate-700 font-semibold">{log.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                                                log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-slate-500 text-xs font-bold uppercase bg-slate-100 px-2 py-1 rounded">
                                            {log.entityType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-600 text-sm leading-relaxed">{log.entityName || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                                        <div className="flex items-center gap-2 group-hover:text-indigo-500 transition-colors cursor-help" title={log.hash}>
                                            {log.hash.substring(0, 12)}...
                                            <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
