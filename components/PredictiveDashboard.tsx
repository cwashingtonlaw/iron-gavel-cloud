import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    BarChart3,
    LineChart,
    TrendingUp,
    Target,
    Calendar,
    DollarSign,
    Briefcase,
    Clock,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Scale,
    BrainCircuit,
    PieChart
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export const PredictiveDashboard: React.FC = () => {
    const { matters, currentUser } = useStore();
    const [selectedMatterId, setSelectedMatterId] = useState(matters[0]?.id || '');

    const selectedMatter = matters.find(m => m.id === selectedMatterId);
    const prediction = selectedMatter ? analyticsService.predictOutcome(selectedMatter) : null;
    const metrics = analyticsService.getAttorneyMetrics(currentUser.id);
    const trends = analyticsService.getPracticeTrends();

    const chartData = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 },
        { name: 'May', value: 500 },
        { name: 'Jun', value: 900 },
    ];

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl shadow-xl shadow-indigo-100">
                        <BrainCircuit className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Strategy Dashboard</h2>
                        <p className="text-slate-500 font-medium text-lg">Predictive case outcomes and practice area intelligence</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold shadow-sm text-sm border border-slate-200">Personal Performance</button>
                    <button className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 text-sm">Firm-wide Trends</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Attorney Metrics */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
                            label="Total Revenue"
                            value={`$${(metrics.totalRevenue / 1000000).toFixed(1)}M`}
                            trend="+15.4%"
                            positive
                        />
                        <MetricCard
                            icon={<Target className="w-6 h-6 text-indigo-500" />}
                            label="Win Rate"
                            value={`${metrics.winRate}%`}
                            trend="+2.1%"
                            positive
                        />
                        <MetricCard
                            icon={<Clock className="w-6 h-6 text-amber-500" />}
                            label="Billable Focus"
                            value={`${metrics.utilizationRate}%`}
                            trend="-1.2%"
                        />
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revenue Forecast</h3>
                                <p className="text-slate-500 font-medium">Projected billables vs historical settlement cycles</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actual</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-200" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Projected</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        hide
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                                        itemStyle={{ color: '#818cf8', fontWeight: 800 }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Case Prediction & Trends */}
                <div className="space-y-10">
                    {/* Case Prediction Widget */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000" />

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight">Case Outcome Intel</h3>
                            <p className="text-slate-400 text-sm font-medium italic">Simulated outcome for active matters</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Analyze Active Matter</label>
                            <select
                                value={selectedMatterId}
                                onChange={(e) => setSelectedMatterId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                {matters.map(m => (
                                    <option key={m.id} value={m.id} className="text-slate-900">{m.name}</option>
                                ))}
                            </select>
                        </div>

                        {prediction && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-center space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outcome Prob.</span>
                                        <div className="text-2xl font-black text-emerald-400">{prediction.probability}%</div>
                                        <div className="text-[10px] font-bold text-emerald-500/80"> {prediction.outcomeType} </div>
                                    </div>
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-center space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Settlement</span>
                                        <div className="text-2xl font-black text-indigo-400">${prediction.estimatedSettlementRange?.median.toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-indigo-500/80"> Confidence: {prediction.confidenceLevel} </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Strategy Factors</label>
                                    {prediction.basedOn.factors.slice(0, 3).map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Practice Trends Widget */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Practice Area Intelligence</h3>

                        <div className="space-y-6">
                            {trends.map(trend => (
                                <div key={trend.practiceArea} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-slate-800">{trend.practiceArea}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${trend.trend === 'Growing' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            <TrendingUp className="w-3 h-3" /> {trend.trend.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '70%' }} />
                                        </div>
                                        <div className="text-xs font-black text-slate-900">+{trend.volumeChange}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                            View Complete Firm Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, trend, positive }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-xl transition-all">
        <div className="p-3 bg-slate-50 rounded-2xl w-fit group-hover:bg-indigo-50 transition-all">{icon}</div>
        <div className="space-y-1">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <div className="flex items-baseline gap-3">
                <h4 className="text-3xl font-black text-slate-900">{value}</h4>
                <div className={`flex items-center gap-0.5 text-xs font-black ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
        </div>
    </div>
);
