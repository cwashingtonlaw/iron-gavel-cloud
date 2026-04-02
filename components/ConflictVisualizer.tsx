import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Network,
    Search,
    ShieldCheck,
    AlertTriangle,
    Users,
    Building2,
    ChevronRight,
    Info,
    Maximize2,
    Share2,
    Trash2,
    Zap,
    Filter,
    CheckCircle2
} from 'lucide-react';
import { conflictGraphService } from '../services/conflictGraphService';
import { ConflictRiskScore } from '../types';

export const ConflictVisualizer: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [riskScore, setRiskScore] = useState<ConflictRiskScore | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsAnalyzing(true);
        setTimeout(() => {
            const score = conflictGraphService.calculateRiskScore(searchTerm);
            setRiskScore(score);
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200">
                        <Network className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Conflict Graph</h2>
                        <p className="text-slate-500 font-medium text-lg">Deep-relationship analysis and corporate family mapping</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter className="w-5 h-5" />
                        Graph Filters
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200">
                        <Maximize2 className="w-5 h-5" />
                        Fullscreen View
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-3 space-y-8">
                    {/* Search Input Area */}
                    <div className="bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]">
                        <form onSubmit={handleAnalyze} className="flex items-center">
                            <div className="pl-6 pr-4">
                                <Search className="w-6 h-6 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Analyze relationship risk for party, subsidiary, or alias..."
                                className="flex-1 py-6 text-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={isAnalyzing}
                                className="mr-2 px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95"
                            >
                                {isAnalyzing ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                                Run AI Analysis
                            </button>
                        </form>
                    </div>

                    {/* Main Graph Visualization Area */}
                    <div className="relative aspect-[16/9] bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden group shadow-inner">
                        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-50" />

                        {riskScore ? (
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-10 animate-in zoom-in-95 duration-1000">
                                {/* Mock Graph Layout */}
                                <div className="relative w-full h-full">
                                    <Node x="50%" y="50%" label={searchTerm} type="Primary" active />
                                    <Connection from="50%,50%" to="20%,30%" />
                                    <Node x="20%" y="30%" label="Former Co-Counsel" type="Person" />

                                    <Connection from="50%,50%" to="80%,40%" />
                                    <Node x="80%" y="40%" label="Subsidiary: Alpha Tech" type="Organization" danger />

                                    <Connection from="80%,40%" to="85%,80%" />
                                    <Node x="85%" y="80%" label="CEO: Sarah Jenkins" type="Person" />

                                    <Connection from="50%,50%" to="35%,85%" />
                                    <Node x="35%" y="85%" label="Matter: 21-CV-009" type="Matter" />
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-20 space-y-6">
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
                                    <Network className="w-12 h-12 text-indigo-500 animate-pulse" />
                                </div>
                                <div className="max-w-md space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Global Party Network</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">Enter a party name to analyze 3+ degrees of relationship separation across the firm's global database.</p>
                                </div>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="absolute bottom-10 left-10 p-4 bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-xl flex gap-6 text-[10px] font-black tracking-widest uppercase">
                            <LegendItem color="bg-indigo-500" label="Party" />
                            <LegendItem color="bg-rose-500" label="High Risk" />
                            <LegendItem color="bg-emerald-500" label="Matter" />
                            <LegendItem color="bg-slate-400" label="Person" />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {riskScore && (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl space-y-8 sticky top-8">
                            <div className="text-center space-y-2">
                                <div className={`text-6xl font-black tracking-tighter ${riskScore.overallRisk > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {riskScore.overallRisk}%
                                </div>
                                <div className="text-sm font-black text-slate-500 uppercase tracking-widest">Conflict Risk Index</div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Threat Factors</h4>
                                {riskScore.riskFactors.map((f, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border ${f.severity === 'High' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {f.severity === 'High' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <Info className="w-4 h-4 text-slate-400" />}
                                            <span className={`text-[10px] font-black uppercase ${f.severity === 'High' ? 'text-rose-700' : 'text-slate-600'}`}>{f.factor}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 leading-normal font-medium">{f.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-900 rounded-3xl text-center space-y-4">
                                <h5 className="text-white text-sm font-bold tracking-tight">AI Recommendation</h5>
                                <div className="py-2 px-4 bg-white/10 rounded-xl text-indigo-400 font-bold uppercase text-xs tracking-widest border border-white/10">
                                    {riskScore.recommendation}
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed italic">
                                    "A relationship check reveals a 2nd-degree link via a corporate subsidiary formerly represented by the firm."
                                </p>
                                <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:text-indigo-600 hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Generate Formal Waiver
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Node = ({ x, y, label, type, active, danger }: any) => (
    <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 p-4 rounded-3xl border shadow-2xl transition-all hover:scale-110 cursor-pointer group ${active ? 'bg-indigo-600 border-indigo-500 text-white ring-8 ring-indigo-500/10' :
                danger ? 'bg-rose-50 border-rose-200 text-rose-800' :
                    'bg-white border-slate-200 text-slate-700'
            }`}
        style={{ left: x, top: y }}
    >
        <div className="flex items-center gap-3 whitespace-nowrap">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : danger ? 'bg-rose-100' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors'}`}>
                {type === 'Person' ? <Users className="w-5 h-5" /> : type === 'Organization' ? <Building2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div className="pr-4">
                <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-0.5">{type}</div>
                <div className="text-sm font-black">{label}</div>
            </div>
            <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${active ? 'text-white/50' : 'text-slate-300'}`} />
        </div>
    </div>
);

const Connection = ({ from, to }: { from: string, to: string }) => {
    const [fromX, fromY] = from.split(',').map(v => v.trim());
    const [toX, toY] = to.split(',').map(v => v.trim());

    return (
        <svg className="absolute inset-0 w-full h-full -z-10 overflow-visible pointer-events-none">
            <line
                x1={fromX} y1={fromY} x2={toX} y2={toY}
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="8 8"
                className="animate-[dash_20s_linear_infinite]"
            />
        </svg>
    );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-slate-500">{label}</span>
    </div>
);
