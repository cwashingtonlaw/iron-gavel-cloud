import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { MOCK_USERS } from '../constants';
import {
    ArrowDownTrayIcon,
    CurrencyDollarIcon,
    SparklesIcon,
    ClockIcon,
    UsersIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    FunnelIcon,
    CalendarDaysIcon,
    ShieldCheckIcon,
    BanknotesIcon,
    ExclamationTriangleIcon,
} from './icons';
import Tooltip from './Tooltip';
import { generateReportInsight } from '../services/geminiService';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
// Types are inferred from the Zustand store selectors

// ============================================================================
// TYPES
// ============================================================================
type ReportTab = 'financial' | 'productivity' | 'matters' | 'trust' | 'custom';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#e11d48', '#6366f1'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// HELPERS
// ============================================================================
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtCurrency = (n: number) => `$${fmt(n)}`;
const fmtPercent = (n: number) => `${n.toFixed(1)}%`;

function daysBetween(a: string, b: string): number {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function getMonthKey(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function getLast12Months(): string[] {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys;
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: { value: number; label: string };
    tooltip?: string;
}> = ({ title, value, subtitle, icon, trend, tooltip }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
                {title}
                {tooltip && <Tooltip text={tooltip} />}
            </h3>
        </div>
        <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
            </p>
        )}
    </div>
);

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
    >
        {icon}
        {label}
    </button>
);

const SectionCard: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}> = ({ title, subtitle, children, action }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{title}</h3>
                {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

// ============================================================================
// TAB 1: FINANCIAL OVERVIEW
// ============================================================================
const FinancialOverview: React.FC = () => {
    const { invoices, expenses, timeEntries, matters, contacts } = useStore();

    const data = useMemo(() => {
        const paidInvoices = invoices.filter(i => i.status === 'Paid');
        const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
        const ar = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
        const wip = timeEntries.filter(e => !e.isBilled).reduce((s, e) => s + e.duration * e.rate, 0);
        const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
        const realizationRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 0;
        const totalCollectable = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0) + totalRevenue;
        const collectionRate = totalCollectable > 0 ? (totalRevenue / totalCollectable) * 100 : 0;

        // Monthly Revenue vs Expenses
        const last12 = getLast12Months();
        const monthlyData = last12.map(mk => {
            const monthRevenue = paidInvoices
                .filter(i => getMonthKey(i.issueDate) === mk)
                .reduce((s, i) => s + i.amount, 0);
            const monthExpenses = expenses
                .filter(e => getMonthKey(e.date) === mk)
                .reduce((s, e) => s + e.amount, 0);
            return { month: getMonthLabel(mk), Revenue: monthRevenue, Expenses: monthExpenses };
        });

        // Revenue by Practice Area
        const paRevenue: Record<string, number> = {};
        paidInvoices.forEach(inv => {
            const matter = matters.find(m => m.id === inv.matterId);
            const pa = matter?.practiceArea || 'Other';
            paRevenue[pa] = (paRevenue[pa] || 0) + inv.amount;
        });
        const practiceAreaData = Object.entries(paRevenue).map(([name, value]) => ({ name, value }));

        // AR Aging
        const now = new Date();
        const aging = { current: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
        invoices.filter(i => i.status !== 'Paid').forEach(inv => {
            const due = new Date(inv.dueDate);
            const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (days <= 0) aging.current += inv.amount;
            else if (days <= 60) aging.d31_60 += inv.amount;
            else if (days <= 90) aging.d61_90 += inv.amount;
            else aging.d90plus += inv.amount;
        });

        // Top 10 Clients by Revenue
        const clientRevenue: Record<string, number> = {};
        paidInvoices.forEach(inv => {
            const clientName = inv.clientName || matters.find(m => m.id === inv.matterId)?.client || 'Unknown';
            clientRevenue[clientName] = (clientRevenue[clientName] || 0) + inv.amount;
        });
        const topClients = Object.entries(clientRevenue)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([client, revenue]) => ({ client, revenue }));

        return { totalRevenue, ar, wip, realizationRate, collectionRate, monthlyData, practiceAreaData, aging, topClients, paidInvoices };
    }, [invoices, expenses, timeEntries, matters, contacts]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Total Revenue" value={fmtCurrency(data.totalRevenue)} icon={<CurrencyDollarIcon className="w-4 h-4" />} tooltip="Sum of all paid invoices." />
                <StatCard title="A/R Balance" value={fmtCurrency(data.ar)} icon={<BanknotesIcon className="w-4 h-4" />} tooltip="Total outstanding unpaid invoices." />
                <StatCard title="WIP (Unbilled)" value={fmtCurrency(data.wip)} tooltip="Value of time entries not yet billed." />
                <StatCard title="Collections" value={fmtCurrency(data.totalRevenue)} tooltip="Total payments collected." />
                <StatCard title="Realization Rate" value={fmtPercent(data.realizationRate)} tooltip="Paid / Total Billed." />
                <StatCard title="Collection Rate" value={fmtPercent(data.collectionRate)} tooltip="Revenue collected vs total collectable." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Monthly Revenue vs Expenses" subtitle="Last 12 months">
                    {data.monthlyData.some(d => d.Revenue > 0 || d.Expenses > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
                                <Legend />
                                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No financial data available yet. Add invoices and expenses to see trends.</p>
                    )}
                </SectionCard>

                <SectionCard title="Revenue by Practice Area">
                    {data.practiceAreaData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={data.practiceAreaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                                    {data.practiceAreaData.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No revenue data by practice area yet.</p>
                    )}
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Accounts Receivable Aging">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Aging Bucket</th>
                                    <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                                    <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: 'Current (Not Due)', amount: data.aging.current, color: 'text-green-600 dark:text-green-400' },
                                    { label: '31-60 Days', amount: data.aging.d31_60, color: 'text-yellow-600 dark:text-yellow-400' },
                                    { label: '61-90 Days', amount: data.aging.d61_90, color: 'text-orange-600 dark:text-orange-400' },
                                    { label: '90+ Days', amount: data.aging.d90plus, color: 'text-red-600 dark:text-red-400' },
                                ].map(row => {
                                    const total = data.ar || 1;
                                    return (
                                        <tr key={row.label} className="border-b border-slate-100 dark:border-slate-700/50">
                                            <td className="p-3 text-slate-700 dark:text-slate-300">{row.label}</td>
                                            <td className={`p-3 text-right font-medium ${row.color}`}>{fmtCurrency(row.amount)}</td>
                                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{((row.amount / total) * 100).toFixed(1)}%</td>
                                        </tr>
                                    );
                                })}
                                <tr className="font-bold">
                                    <td className="p-3 text-slate-800 dark:text-white">Total</td>
                                    <td className="p-3 text-right text-slate-800 dark:text-white">{fmtCurrency(data.ar)}</td>
                                    <td className="p-3 text-right text-slate-800 dark:text-white">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Top 10 Clients by Revenue"
                    action={
                        data.topClients.length > 0 ? (
                            <button
                                onClick={() => downloadCSV('top-clients.csv', ['Client', 'Revenue'], data.topClients.map(c => [c.client, String(c.revenue)]))}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <ArrowDownTrayIcon className="w-3.5 h-3.5" /> CSV
                            </button>
                        ) : undefined
                    }
                >
                    {data.topClients.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">#</th>
                                        <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                        <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topClients.map((c, i) => (
                                        <tr key={c.client} className="border-b border-slate-100 dark:border-slate-700/50">
                                            <td className="p-3 text-slate-400 dark:text-slate-500">{i + 1}</td>
                                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{c.client}</td>
                                            <td className="p-3 text-right text-slate-800 dark:text-white font-semibold">{fmtCurrency(c.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No paid invoices recorded yet.</p>
                    )}
                </SectionCard>
            </div>
        </div>
    );
};

// ============================================================================
// TAB 2: PRODUCTIVITY
// ============================================================================
const ProductivityTab: React.FC = () => {
    const { timeEntries, invoices, matters } = useStore();

    const data = useMemo(() => {
        // Timekeeper productivity
        const timekeepers = MOCK_USERS.filter(u => u.role === 'Attorney' || u.role === 'Paralegal' || u.role === 'Admin');
        const tkPerf = timekeepers.map(user => {
            const entries = timeEntries.filter(e => e.userId === user.id);
            const totalHours = entries.reduce((s, e) => s + e.duration, 0);
            const billableHours = entries.reduce((s, e) => s + e.duration, 0); // all entries are billable
            const utilization = totalHours > 0 ? (billableHours / 40) * 100 : 0; // vs 40h week
            const billedValue = entries.filter(e => e.isBilled).reduce((s, e) => s + e.duration * e.rate, 0);
            const totalValue = entries.reduce((s, e) => s + e.duration * e.rate, 0);
            const realizationRate = totalValue > 0 ? (billedValue / totalValue) * 100 : 0;
            return { user, totalHours, billableHours, utilization, realizationRate };
        });

        // Billable hours by month
        const last12 = getLast12Months();
        const monthlyHours = last12.map(mk => {
            const hours = timeEntries
                .filter(e => getMonthKey(e.date) === mk)
                .reduce((s, e) => s + e.duration, 0);
            return { month: getMonthLabel(mk), hours };
        });

        // Hours by practice area
        const paHours: Record<string, number> = {};
        timeEntries.forEach(e => {
            const matter = matters.find(m => m.id === e.matterId);
            const pa = matter?.practiceArea || 'Other';
            paHours[pa] = (paHours[pa] || 0) + e.duration;
        });
        const practiceAreaHours = Object.entries(paHours).map(([name, value]) => ({ name, value }));

        // Top matters by time
        const matterHours: Record<string, { name: string; hours: number; value: number }> = {};
        timeEntries.forEach(e => {
            const matter = matters.find(m => m.id === e.matterId);
            const key = e.matterId;
            if (!matterHours[key]) matterHours[key] = { name: matter?.name || key, hours: 0, value: 0 };
            matterHours[key].hours += e.duration;
            matterHours[key].value += e.duration * e.rate;
        });
        const topMatters = Object.values(matterHours).sort((a, b) => b.hours - a.hours).slice(0, 10);

        return { tkPerf, monthlyHours, practiceAreaHours, topMatters };
    }, [timeEntries, invoices, matters]);

    return (
        <div className="space-y-6">
            <SectionCard
                title="Timekeeper Productivity"
                action={
                    data.tkPerf.length > 0 ? (
                        <button
                            onClick={() => downloadCSV(
                                'timekeeper-productivity.csv',
                                ['Timekeeper', 'Role', 'Total Hours', 'Billable Hours', 'Utilization %', 'Realization %'],
                                data.tkPerf.map(t => [t.user.name, t.user.role, t.totalHours.toFixed(2), t.billableHours.toFixed(2), t.utilization.toFixed(1), t.realizationRate.toFixed(1)])
                            )}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> CSV
                        </button>
                    ) : undefined
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Timekeeper</th>
                                <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Total Hours</th>
                                <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Billable Hours</th>
                                <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                                    Utilization Rate <Tooltip text="Billable hours vs 40-hour work week." />
                                </th>
                                <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                                    Realization Rate <Tooltip text="Billed value vs total value of time." />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.tkPerf.map(({ user, totalHours, billableHours, utilization, realizationRate }) => (
                                <tr key={user.id} className="border-t border-slate-200 dark:border-slate-700">
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                        <span>{user.name}</span>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">({user.role})</span>
                                    </td>
                                    <td className="p-3 text-right text-slate-600 dark:text-slate-300">{totalHours.toFixed(2)}</td>
                                    <td className="p-3 text-right text-slate-600 dark:text-slate-300">{billableHours.toFixed(2)}</td>
                                    <td className="p-3 text-right font-medium">
                                        <span className={utilization >= 80 ? 'text-green-600 dark:text-green-400' : utilization >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}>
                                            {utilization.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-medium text-green-700 dark:text-green-400">{realizationRate.toFixed(1)}%</td>
                                </tr>
                            ))}
                            {data.tkPerf.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">No time entries logged yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Billable Hours by Month" subtitle="Last 12 months">
                    {data.monthlyHours.some(d => d.hours > 0) ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={data.monthlyHours}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}h`} />
                                <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No time data to chart yet.</p>
                    )}
                </SectionCard>

                <SectionCard title="Hours by Practice Area">
                    {data.practiceAreaHours.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={data.practiceAreaHours} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                                    {data.practiceAreaHours.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}h`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No hours by practice area yet.</p>
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Top Matters by Time Invested">
                {data.topMatters.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">#</th>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Hours</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topMatters.map((m, i) => (
                                    <tr key={m.name + i} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-3 text-slate-400 dark:text-slate-500">{i + 1}</td>
                                        <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{m.name}</td>
                                        <td className="p-3 text-right text-slate-600 dark:text-slate-300">{m.hours.toFixed(1)}h</td>
                                        <td className="p-3 text-right font-semibold text-slate-800 dark:text-white">{fmtCurrency(m.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No time entries to analyze yet.</p>
                )}
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB 3: MATTER ANALYTICS
// ============================================================================
const MatterAnalyticsTab: React.FC = () => {
    const { matters, invoices, expenses, potentialClients, timeEntries } = useStore();

    const data = useMemo(() => {
        // Status breakdown
        const statusCounts: Record<string, number> = {};
        matters.forEach(m => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        // By practice area
        const paCounts: Record<string, number> = {};
        matters.forEach(m => { const pa = m.practiceArea || 'Other'; paCounts[pa] = (paCounts[pa] || 0) + 1; });
        const practiceAreaData = Object.entries(paCounts).map(([name, value]) => ({ name, value }));

        // Average matter lifespan (closed matters)
        const closedMatters = matters.filter(m => m.status === 'Closed');
        let avgLifespan = 0;
        if (closedMatters.length > 0) {
            const totalDays = closedMatters.reduce((s, m) => {
                return s + daysBetween(m.openDate, m.lastStageChangeDate || new Date().toISOString());
            }, 0);
            avgLifespan = totalDays / closedMatters.length;
        }
        // If no closed matters, calculate from open matters as avg age
        if (avgLifespan === 0 && matters.length > 0) {
            const now = new Date().toISOString();
            avgLifespan = matters.reduce((s, m) => s + daysBetween(m.openDate, now), 0) / matters.length;
        }

        // Matter profitability
        const profitability = matters.map(m => {
            const revenue = invoices.filter(i => i.matterId === m.id && i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
            const expense = expenses.filter(e => e.matterId === m.id).reduce((s, e) => s + e.amount, 0);
            const timeValue = timeEntries.filter(e => e.matterId === m.id).reduce((s, e) => s + e.duration * e.rate, 0);
            return { name: m.name, client: m.client, revenue, expense, profit: revenue - expense, timeValue, status: m.status };
        }).sort((a, b) => b.profit - a.profit).slice(0, 10);

        // New matters trend (by month)
        const last12 = getLast12Months();
        const newMattersTrend = last12.map(mk => {
            const count = matters.filter(m => getMonthKey(m.openDate) === mk).length;
            return { month: getMonthLabel(mk), count };
        });

        // Pipeline conversion from potential clients
        const totalLeads = potentialClients.length;
        const converted = potentialClients.filter(pc => pc.status === 'Converted').length;
        const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

        // Pipeline status breakdown
        const pipelineStatus: Record<string, number> = {};
        potentialClients.forEach(pc => { pipelineStatus[pc.status] = (pipelineStatus[pc.status] || 0) + 1; });
        const pipelineData = Object.entries(pipelineStatus).map(([name, value]) => ({ name, value }));

        return { statusData, practiceAreaData, avgLifespan, profitability, newMattersTrend, conversionRate, totalLeads, converted, pipelineData };
    }, [matters, invoices, expenses, potentialClients, timeEntries]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Open Matters" value={String(matters.filter(m => m.status === 'Open').length)} icon={<BriefcaseIcon className="w-4 h-4" />} />
                <StatCard title="Avg. Lifespan" value={`${Math.round(data.avgLifespan)}d`} icon={<CalendarDaysIcon className="w-4 h-4" />} tooltip="Average days a matter has been open." />
                <StatCard title="Conversion Rate" value={fmtPercent(data.conversionRate)} icon={<UsersIcon className="w-4 h-4" />} tooltip="Potential clients converted to matters." subtitle={`${data.converted} of ${data.totalLeads} leads`} />
                <StatCard title="Total Matters" value={String(matters.length)} icon={<DocumentTextIcon className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Matters by Status">
                    {data.statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                                    {data.statusData.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No matters created yet.</p>
                    )}
                </SectionCard>

                <SectionCard title="Matters by Practice Area">
                    {data.practiceAreaData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data.practiceAreaData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                                <RechartsTooltip />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No practice area data yet.</p>
                    )}
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="New Matters Trend" subtitle="Last 12 months">
                    {data.newMattersTrend.some(d => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data.newMattersTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <RechartsTooltip />
                                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No new matters in the last 12 months.</p>
                    )}
                </SectionCard>

                <SectionCard title="Lead Pipeline" subtitle="Potential client status breakdown">
                    {data.pipelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={data.pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                                    {data.pipelineData.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No potential clients in the pipeline.</p>
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Matter Profitability" subtitle="Top matters by profit (Revenue - Expenses)">
                {data.profitability.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                    <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Revenue</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Expenses</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.profitability.map((m, i) => (
                                    <tr key={m.name + i} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{m.name}</td>
                                        <td className="p-3 text-slate-500 dark:text-slate-400">{m.client}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                m.status === 'Open' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                m.status === 'Closed' ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' :
                                                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                                {m.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-slate-600 dark:text-slate-300">{fmtCurrency(m.revenue)}</td>
                                        <td className="p-3 text-right text-slate-600 dark:text-slate-300">{fmtCurrency(m.expense)}</td>
                                        <td className={`p-3 text-right font-semibold ${m.profit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {m.profit >= 0 ? '+' : ''}{fmtCurrency(m.profit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No matter data to analyze yet.</p>
                )}
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB 4: TRUST & COMPLIANCE
// ============================================================================
const TrustComplianceTab: React.FC = () => {
    const { transactions, matters, getTotalTrustBalance, generateIOLTAReport, runComplianceCheck, ioltalViolations } = useStore();

    const data = useMemo(() => {
        const trustTxns = transactions.filter(t => t.ledger === 'Trust');
        const totalTrustBalance = getTotalTrustBalance();

        // Trust balance by matter
        const matterBalances: Record<string, { matterId: string; matterName: string; clientName: string; balance: number }> = {};
        trustTxns.forEach(t => {
            if (!matterBalances[t.matterId]) {
                const matter = matters.find(m => m.id === t.matterId);
                matterBalances[t.matterId] = {
                    matterId: t.matterId,
                    matterName: matter?.name || t.matterId,
                    clientName: matter?.client || 'Unknown',
                    balance: 0,
                };
            }
            if (t.type === 'Deposit') matterBalances[t.matterId].balance += t.amount;
            else if (t.type === 'Payment') matterBalances[t.matterId].balance -= t.amount;
        });
        const balanceByMatter = Object.values(matterBalances).sort((a, b) => b.balance - a.balance);

        const totalDeposits = trustTxns.filter(t => t.type === 'Deposit').reduce((s, t) => s + t.amount, 0);
        const totalPayments = trustTxns.filter(t => t.type === 'Payment').reduce((s, t) => s + t.amount, 0);

        return { totalTrustBalance, balanceByMatter, trustTxns, totalDeposits, totalPayments };
    }, [transactions, matters, getTotalTrustBalance]);

    const [complianceRun, setComplianceRun] = useState(false);

    const handleRunCompliance = useCallback(() => {
        runComplianceCheck();
        setComplianceRun(true);
    }, [runComplianceCheck]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Trust Balance" value={fmtCurrency(data.totalTrustBalance)} icon={<ShieldCheckIcon className="w-4 h-4" />} tooltip="Combined trust balance across all matters." />
                <StatCard title="Total Deposits" value={fmtCurrency(data.totalDeposits)} />
                <StatCard title="Total Disbursements" value={fmtCurrency(data.totalPayments)} />
                <StatCard
                    title="IOLTA Status"
                    value={ioltalViolations.length === 0 ? 'Compliant' : `${ioltalViolations.length} Issue(s)`}
                    icon={ioltalViolations.length > 0 ? <ExclamationTriangleIcon className="w-4 h-4 text-red-500" /> : <ShieldCheckIcon className="w-4 h-4 text-green-500" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Trust Balance by Client / Matter">
                    {data.balanceByMatter.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                        <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                        <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.balanceByMatter.map(m => (
                                        <tr key={m.matterId} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{m.matterName}</td>
                                            <td className="p-3 text-slate-500 dark:text-slate-400">{m.clientName}</td>
                                            <td className={`p-3 text-right font-semibold ${m.balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {fmtCurrency(m.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No trust transactions recorded.</p>
                    )}
                </SectionCard>

                <SectionCard
                    title="IOLTA Compliance"
                    action={
                        <button
                            onClick={handleRunCompliance}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Run Compliance Check
                        </button>
                    }
                >
                    {complianceRun && ioltalViolations.length === 0 && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-300">All Clear</p>
                                <p className="text-sm text-green-600 dark:text-green-400">No IOLTA compliance violations detected.</p>
                            </div>
                        </div>
                    )}
                    {ioltalViolations.length > 0 && (
                        <div className="space-y-3">
                            {ioltalViolations.map(v => (
                                <div key={v.id} className={`p-3 rounded-lg border ${
                                    v.severity === 'Critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className={`w-4 h-4 ${v.severity === 'Critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{v.type}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            v.severity === 'Critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                        }`}>{v.severity}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{v.description}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(v.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {!complianceRun && ioltalViolations.length === 0 && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">Click "Run Compliance Check" to scan for IOLTA violations.</p>
                    )}
                </SectionCard>
            </div>

            <SectionCard
                title="Trust Transaction History"
                action={
                    data.trustTxns.length > 0 ? (
                        <button
                            onClick={() => downloadCSV(
                                'trust-transactions.csv',
                                ['Date', 'Type', 'Matter', 'Description', 'Amount'],
                                data.trustTxns.map(t => {
                                    const matter = matters.find(m => m.id === t.matterId);
                                    return [t.date, t.type, matter?.name || t.matterId, t.description, String(t.amount)];
                                })
                            )}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> CSV
                        </button>
                    ) : undefined
                }
            >
                {data.trustTxns.length > 0 ? (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Type</th>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.trustTxns.slice(0, 50).map(t => {
                                    const matter = matters.find(m => m.id === t.matterId);
                                    return (
                                        <tr key={t.id} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    t.type === 'Deposit' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                    t.type === 'Payment' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>{t.type}</span>
                                            </td>
                                            <td className="p-3 text-slate-700 dark:text-slate-300">{matter?.name || t.matterId}</td>
                                            <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{t.description}</td>
                                            <td className={`p-3 text-right font-medium ${t.type === 'Deposit' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {t.type === 'Deposit' ? '+' : '-'}{fmtCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No trust transactions recorded.</p>
                )}
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB 5: CUSTOM REPORT BUILDER
// ============================================================================
type EntityType = 'Matters' | 'Time Entries' | 'Invoices' | 'Expenses';

const CustomReportBuilder: React.FC = () => {
    const { matters, timeEntries, invoices, expenses } = useStore();

    const [entityType, setEntityType] = useState<EntityType>('Matters');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterField, setFilterField] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [customQuery, setCustomQuery] = useState('');
    const [aiReportResult, setAiReportResult] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const filteredData = useMemo(() => {
        let rows: Record<string, any>[] = [];
        let headers: string[] = [];

        switch (entityType) {
            case 'Matters':
                headers = ['Name', 'Client', 'Status', 'Practice Area', 'Open Date', 'Billing Type'];
                rows = matters.map(m => ({
                    Name: m.name, Client: m.client, Status: m.status,
                    'Practice Area': m.practiceArea || '', 'Open Date': m.openDate,
                    'Billing Type': m.billing.type, _date: m.openDate,
                }));
                break;
            case 'Time Entries':
                headers = ['Date', 'Matter', 'Description', 'Duration (h)', 'Rate', 'Value', 'Billed'];
                rows = timeEntries.map(e => {
                    const matter = matters.find(m => m.id === e.matterId);
                    return {
                        Date: e.date, Matter: matter?.name || e.matterId, Description: e.description,
                        'Duration (h)': e.duration.toFixed(2), Rate: e.rate, Value: (e.duration * e.rate).toFixed(2),
                        Billed: e.isBilled ? 'Yes' : 'No', _date: e.date,
                    };
                });
                break;
            case 'Invoices':
                headers = ['Issue Date', 'Due Date', 'Matter', 'Amount', 'Status', 'Client'];
                rows = invoices.map(i => {
                    const matter = matters.find(m => m.id === i.matterId);
                    return {
                        'Issue Date': i.issueDate, 'Due Date': i.dueDate,
                        Matter: matter?.name || i.matterId, Amount: i.amount,
                        Status: i.status, Client: i.clientName || matter?.client || '',
                        _date: i.issueDate,
                    };
                });
                break;
            case 'Expenses':
                headers = ['Date', 'Matter', 'Description', 'Amount', 'Type', 'Billed'];
                rows = expenses.map(e => {
                    const matter = matters.find(m => m.id === e.matterId);
                    return {
                        Date: e.date, Matter: matter?.name || e.matterId,
                        Description: e.description, Amount: e.amount,
                        Type: e.type, Billed: e.isBilled ? 'Yes' : 'No', _date: e.date,
                    };
                });
                break;
        }

        // Date filter
        if (dateFrom) rows = rows.filter(r => r._date >= dateFrom);
        if (dateTo) rows = rows.filter(r => r._date <= dateTo);

        // Field filter
        if (filterField && filterValue) {
            rows = rows.filter(r => {
                const val = String(r[filterField] || '').toLowerCase();
                return val.includes(filterValue.toLowerCase());
            });
        }

        return { rows, headers };
    }, [entityType, dateFrom, dateTo, filterField, filterValue, matters, timeEntries, invoices, expenses]);

    const handleExportCSV = useCallback(() => {
        const { rows, headers } = filteredData;
        downloadCSV(
            `${entityType.toLowerCase().replace(/\s+/g, '-')}-report.csv`,
            headers,
            rows.map(r => headers.map(h => String(r[h] ?? '')))
        );
    }, [filteredData, entityType]);

    const handleAIInsight = useCallback(async () => {
        if (!customQuery) return;
        setIsGeneratingReport(true);
        try {
            const { rows, headers } = filteredData;
            const summaryLines = rows.slice(0, 20).map(r => headers.map(h => `${h}: ${r[h]}`).join(', '));
            const dataSummary = `Entity: ${entityType}, Total records: ${rows.length}, Sample: ${summaryLines.join(' | ')}`;
            const insight = await generateReportInsight(customQuery, dataSummary);
            setAiReportResult(insight);
        } catch {
            setAiReportResult('Failed to generate report insight. Check your API key configuration.');
        } finally {
            setIsGeneratingReport(false);
        }
    }, [customQuery, filteredData, entityType]);

    const filterableFields = filteredData.headers;

    return (
        <div className="space-y-6">
            {/* AI Insight */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                <div className="flex items-center mb-3">
                    <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Report Insight</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Ask questions about the filtered data below to uncover insights.</p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="e.g., Which practice area has the highest realization rate?"
                        className="flex-1 p-3 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAIInsight(); }}
                    />
                    <button
                        onClick={handleAIInsight}
                        disabled={isGeneratingReport || !customQuery}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {isGeneratingReport ? 'Analyzing...' : 'Generate Insight'}
                    </button>
                </div>
                {aiReportResult && (
                    <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm text-indigo-800 dark:text-indigo-300 font-bold mb-2 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" /> AI Insight
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{aiReportResult}</p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <SectionCard title="Report Builder" subtitle="Select data type, date range, and filters">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Entity Type</label>
                        <select
                            value={entityType}
                            onChange={e => setEntityType(e.target.value as EntityType)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option>Matters</option>
                            <option>Time Entries</option>
                            <option>Invoices</option>
                            <option>Expenses</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Filter Field</label>
                        <select
                            value={filterField}
                            onChange={e => setFilterField(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Fields</option>
                            {filterableFields.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Filter Value</label>
                        <input type="text" placeholder="Contains..." value={filterValue} onChange={e => setFilterValue(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
            </SectionCard>

            {/* Results */}
            <SectionCard
                title={`Results: ${filteredData.rows.length} ${entityType}`}
                action={
                    filteredData.rows.length > 0 ? (
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
                        </button>
                    ) : undefined
                }
            >
                {filteredData.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    {filteredData.headers.map(h => (
                                        <th key={h} className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.rows.slice(0, 100).map((row, i) => (
                                    <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                                        {filteredData.headers.map(h => (
                                            <td key={h} className="p-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(row[h] ?? '')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredData.rows.length > 100 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center p-3">Showing first 100 of {filteredData.rows.length} records. Export CSV for full data.</p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No records match the current filters. Adjust your criteria or add data.</p>
                )}
            </SectionCard>
        </div>
    );
};

// ============================================================================
// MAIN REPORTS COMPONENT
// ============================================================================
const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>('financial');

    const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
        { key: 'financial', label: 'Financial Overview', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
        { key: 'productivity', label: 'Productivity', icon: <ClockIcon className="w-4 h-4" /> },
        { key: 'matters', label: 'Matter Analytics', icon: <BriefcaseIcon className="w-4 h-4" /> },
        { key: 'trust', label: 'Trust & Compliance', icon: <ShieldCheckIcon className="w-4 h-4" /> },
        { key: 'custom', label: 'Custom Report Builder', icon: <FunnelIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive insights into your firm's performance, productivity, and compliance.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {tabs.map(tab => (
                    <TabButton
                        key={tab.key}
                        active={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        icon={tab.icon}
                        label={tab.label}
                    />
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'financial' && <FinancialOverview />}
            {activeTab === 'productivity' && <ProductivityTab />}
            {activeTab === 'matters' && <MatterAnalyticsTab />}
            {activeTab === 'trust' && <TrustComplianceTab />}
            {activeTab === 'custom' && <CustomReportBuilder />}
        </div>
    );
};

export default Reports;
