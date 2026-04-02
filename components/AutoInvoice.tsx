import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Zap,
    Settings,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    FileText,
    Mail,
    MoreVertical,
    Plus,
    Play
} from 'lucide-react';
import { billingService } from '../services/billingService';
import { format } from 'date-fns';

export const AutoInvoice: React.FC = () => {
    const { matters, activities, expenses, addInvoice, addAuditLog, currentUser } = useStore();
    const [activeTab, setActiveTab] = useState<'rules' | 'queue' | 'reconciliation'>('rules');

    const handleRunBot = (matterId: string) => {
        const mockRule = {
            id: 'rule-autogen',
            name: 'Weekly Auto-Billing',
            frequency: 'Weekly' as const,
            includeUnbilledTime: true,
            includeUnbilledExpenses: true,
            autoSend: true,
            recipients: ['client@example.com'],
            active: true
        };

        // Need unbilled time and expenses
        // For mock, we'll just generate one
        const newInvoice = billingService.generateAutoInvoice(matterId, mockRule, [], []);

        if (newInvoice) {
            addInvoice(newInvoice);
            addAuditLog({
                userId: currentUser.id,
                userName: currentUser.name,
                action: 'CREATE',
                entityType: 'Invoice',
                entityId: newInvoice.id,
                entityName: `Automated Invoice Generated for Matter: ${matterId}`
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-2xl">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing Automation Bot</h2>
                        <p className="text-slate-500 font-medium text-lg">Automated time-capture, invoicing, and IOLTA compliance</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-indigo-100">
                    <Plus className="w-5 h-5" />
                    New Automation Rule
                </button>
            </div>

            <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200">
                <TabButton active={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Automation Rules" count={4} />
                <TabButton active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} label="Invoice Queue" count={12} />
                <TabButton active={activeTab === 'reconciliation'} onClick={() => setActiveTab('reconciliation')} label="3-Way Reconciliation" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'rules' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {matters.slice(0, 4).map(matter => (
                                <div key={matter.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <Settings className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 cursor-pointer" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded leading-none">ACTIVE</span>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Rule #98{matter.id.slice(0, 2)}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{matter.name}</h3>
                                    <div className="space-y-3 mb-6">
                                        <RuleDetail icon={<Calendar className="w-3.5 h-3.5" />} text="Bi-Weekly (Every 2nd Friday)" />
                                        <RuleDetail icon={<DollarSign className="w-3.5 h-3.5" />} text="Min Threshold: $500" />
                                        <RuleDetail icon={<Mail className="w-3.5 h-3.5" />} text="Auto-Email to Client" />
                                    </div>
                                    <button
                                        onClick={() => handleRunBot(matter.id)}
                                        className="w-full bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-100 group-hover:border-indigo-500"
                                    >
                                        <Play className="w-4 h-4" />
                                        Test Run Rule
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'queue' && (
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Matter</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Draft Amount</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900">Johnson v. Meta Platforms</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pending Review</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                                                    <Clock className="w-3.5 h-3.5" /> Scheduled for Fri
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono font-bold text-slate-900">$4,250.00</td>
                                            <td className="px-6 py-5">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 blur-[80px] -mr-20 -mt-20 rounded-full" />
                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            Firm Health
                        </h3>

                        <div className="space-y-6">
                            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Earned (MTD)</span>
                                <div className="text-3xl font-black mt-1">$142,500.20</div>
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mt-2">
                                    <Zap className="w-3 h-3" /> +12% from last month
                                </div>
                            </div>

                            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">IOLTA Trust Total</span>
                                <div className="text-3xl font-black mt-1 text-indigo-400">$2.4M</div>
                                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mt-2">
                                    <ShieldCheck className="w-3 h-3" /> All ledgers reconciled
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-600 rounded-2xl text-center space-y-2">
                            <h4 className="text-sm font-bold">Upcoming Compliance Audit</h4>
                            <p className="text-indigo-100 text-xs opacity-80">System is ready for IOLTA 3-way balance check.</p>
                            <button className="w-full mt-4 py-3 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                                Run Audit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${active ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
    >
        {label}
        {count !== undefined && <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{count}</span>}
    </button>
);

const RuleDetail = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div className="flex items-center gap-2.5">
        <div className="text-slate-400">{icon}</div>
        <span className="text-xs font-bold text-slate-600">{text}</span>
    </div>
);

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);
