import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    GitBranch,
    Play,
    Plus,
    Settings,
    Mail,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    ChevronRight,
    ArrowRight,
    UserPlus,
    Trash2,
    Zap,
    Box
} from 'lucide-react';
import { WorkflowTemplate, WorkflowStep } from '../types';

export const WorkflowBuilder: React.FC = () => {
    const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTemplate | null>(null);
    const { auditLogs } = useStore();

    const mockTemplates: WorkflowTemplate[] = [
        {
            id: 'wt-1',
            name: 'New Client Onboarding',
            description: 'Automated task chain for incoming matters',
            category: 'Litigation',
            trigger: { type: 'Matter Created' },
            steps: [
                { id: 's1', order: 1, name: 'Create Engagement Letter', type: 'Generate Document', config: {} },
                { id: 's2', order: 2, name: 'Send Client Welcome Email', type: 'Send Email', config: {}, dependsOn: ['s1'] },
                { id: 's3', order: 3, name: 'Setup Initial Discovery Task', type: 'Create Task', config: {}, dependsOn: ['s2'] }
            ],
            active: true,
            createdBy: 'user-1',
            createdAt: new Date().toISOString()
        },
        {
            id: 'wt-2',
            name: 'Summary Judgment Pipeline',
            description: 'Standardized motion practice workflow',
            category: 'Litigation',
            trigger: { type: 'Matter Status Change' },
            steps: [],
            active: false,
            createdBy: 'user-1',
            createdAt: new Date().toISOString()
        }
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100">
                        <GitBranch className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Legal Orchestration Engine</h2>
                        <p className="text-slate-500 font-medium text-lg">Build event-driven automations for your entire practice</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-indigo-100">
                    <Plus className="w-5 h-5 border-2 border-white rounded-md" />
                    Create Workflow
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Templates</h3>
                    <div className="space-y-3">
                        {mockTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => setActiveWorkflow(template)}
                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${activeWorkflow?.id === template.id
                                        ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-50'
                                        : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${template.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                        {template.active ? 'Active' : 'Draft'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{template.category}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">{template.name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1">{template.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold">Pro Automation Tip</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Use "Matter Created" triggers to automatically generate engagement letters and set conflict search tasks.</p>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    {activeWorkflow ? (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{activeWorkflow.name}</h3>
                                        <p className="text-lg text-slate-500 font-medium">{activeWorkflow.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200">
                                            <Settings className="w-5 h-5" />
                                        </button>
                                        <button className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100">
                                            <Play className="w-5 h-5 fill-emerald-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Box className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Mechanism</span>
                                            <h4 className="font-bold text-slate-900">{activeWorkflow.trigger.type}</h4>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>

                                <div className="space-y-4 relative">
                                    {/* Connector Line */}
                                    <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-slate-100 rounded-full" />

                                    {activeWorkflow.steps.map((step, i) => (
                                        <div key={step.id} className="relative z-10 flex gap-6 items-center translate-x-1 group">
                                            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-slate-50 shadow-md flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:border-indigo-500 transition-all">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between group-hover:border-indigo-100 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                                        {step.type === 'Generate Document' ? <FileText className="w-6 h-6 text-slate-400" /> : <Mail className="w-6 h-6 text-slate-400" />}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-slate-800 tracking-tight">{step.name}</h5>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.type}</span>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button className="w-full py-6 mt-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-3 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all group">
                                        <Plus className="w-5 h-5 border-2 border-slate-300 rounded-md group-hover:border-indigo-600" />
                                        Add Workflow Step
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <StatsCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} label="Successful Executions" value="1,200" />
                                <StatsCard icon={<AlertCircle className="w-5 h-5 text-rose-500" />} label="Failed Steps" value="2" />
                            </div>
                        </div>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-4 border border-slate-100">
                                <GitBranch className="w-10 h-10 text-indigo-500" />
                            </div>
                            <div className="max-w-md space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select a Workflow to Orchestrate</h3>
                                <p className="text-slate-500 font-medium">Design complex if-then logic to automate your firm's administrative burdens.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
);
