
import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { checkConflicts } from '../utils/conflictUtils';
import { ExclamationTriangleIcon, SparklesIcon } from './icons';

interface ConflictAlertProps {
    name: string;
    excludeId?: string;
}

const ConflictAlert: React.FC<ConflictAlertProps> = ({ name, excludeId }) => {
    const { contacts, matters, potentialClients } = useStore();

    const conflicts = useMemo(() => {
        const results = checkConflicts(name, contacts, matters, potentialClients);
        return results.filter(r => (r.item as any).id !== excludeId);
    }, [name, contacts, matters, potentialClients, excludeId]);

    if (conflicts.length === 0) return null;

    return (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-wider">High Risk Conflict Alert</span>
                </div>
                <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded text-[10px] font-black text-red-600 dark:text-red-400 uppercase">
                    AI Scanned
                </div>
            </div>

            <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                Found {conflicts.length} matching records for <span className="font-bold">"{name}"</span>.
                Please perform due diligence before proceeding.
            </p>

            <div className="space-y-2">
                {conflicts.slice(0, 3).map((c, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 flex justify-between items-center group">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">{c.type}</span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-red-600 transition-colors">{(c.item as any).name || (c.item as any).id}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-0.5">{c.matchField}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-bold ${c.score < 0.1 ? 'text-red-600' : 'text-orange-500'}`}>
                                    {Math.round((1 - c.score) * 100)}% Match
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Confidence Score</span>
                        </div>
                    </div>
                ))}
            </div>

            {conflicts.length > 3 && (
                <button className="mt-3 w-full text-center text-[11px] font-bold text-red-700 dark:text-red-400 hover:underline">
                    View {conflicts.length - 3} more potential conflicts
                </button>
            )}
        </div>
    );
};

export default ConflictAlert;
