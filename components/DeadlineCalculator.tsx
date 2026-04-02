import React, { useState } from 'react';
import { Jurisdiction, ServiceMethod } from '../types';
import {
    COURT_RULES,
    calculateDeadline,
    getCourtRule
} from '../utils/deadlineCalculator';
import { useStore } from '../store/useStore';
import { Calendar, Shield, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const DeadlineCalculator: React.FC = () => {
    const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('Federal');
    const [ruleId, setRuleId] = useState('');
    const [triggerDate, setTriggerDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [serviceMethod, setServiceMethod] = useState<ServiceMethod>('Personal');
    const [result, setResult] = useState<string | null>(null);

    const { addDeadline, addAuditLog, currentUser } = useStore();

    const rules = COURT_RULES.filter(r => r.jurisdiction === jurisdiction);

    const handleCalculate = () => {
        const rule = getCourtRule(ruleId);
        if (!rule) return;

        const dueDate = calculateDeadline(triggerDate, rule, serviceMethod);
        setResult(dueDate);

        // Add to store
        addDeadline({
            id: `dl-${Date.now()}`,
            matterId: 'manual', // or selected matter
            name: rule.ruleName,
            triggerDate,
            dueDate,
            ruleId,
            serviceMethod,
            priority: 'High',
            status: 'Pending',
            warnings: []
        });

        // Log the calculation
        addAuditLog({
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'CREATE',
            entityType: 'Event',
            entityId: ruleId,
            entityName: `Calculated Deadline: ${rule.ruleName}`
        });
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-8 shadow-2xl space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                    <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Deadline Engine</h2>
                    <p className="text-slate-500 font-medium">Jurisdiction-specific calculation with holiday exclusion</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Jurisdiction</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value as Jurisdiction)}
                    >
                        <option value="Federal">Federal</option>
                        <option value="California">California</option>
                        <option value="New York">New York</option>
                        <option value="Texas">Texas</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Court Rule</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={ruleId}
                        onChange={(e) => setRuleId(e.target.value)}
                    >
                        <option value="">Select a rule...</option>
                        {rules.map(r => (
                            <option key={r.id} value={r.id}>{r.ruleName} - {r.description}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Trigger Date (e.g., Service Date)</label>
                    <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={triggerDate}
                        onChange={(e) => setTriggerDate(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Service Method</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={serviceMethod}
                        onChange={(e) => setServiceMethod(e.target.value as ServiceMethod)}
                    >
                        <option value="Personal">Personal Delivery</option>
                        <option value="Mail">Mail (+3-5 days)</option>
                        <option value="Electronic Filing">Electronic Filing</option>
                        <option value="Email">Email</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleCalculate}
                disabled={!ruleId}
                className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold text-lg hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
                <Clock className="w-5 h-5" />
                Calculate Secure Deadline
            </button>

            {result && (
                <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Calculated Result</span>
                            <h3 className="text-4xl font-black text-slate-900">{format(new Date(result), 'MMMM d, yyyy')}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Shield className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700 font-medium text-sm">Verified against all {jurisdiction} holidays</span>
                            </div>
                        </div>
                        <div className="bg-indigo-600 text-white p-2 rounded-lg">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
