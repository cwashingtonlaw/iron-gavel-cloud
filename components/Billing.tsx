
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { TimeEntry, Invoice, Expense, Transaction, Matter } from '../types';
import {
    PlusIcon, ClockIcon, PaintBrushIcon, CurrencyDollarIcon, BanknotesIcon,
    CreditCardIcon, ArrowDownTrayIcon, CheckCircleIcon, ExclamationTriangleIcon,
    TrashIcon, PencilSquareIcon, XMarkIcon, ChartBarIcon, ArrowUpCircleIcon,
    ArrowDownCircleIcon, ArrowsRightLeftIcon, ShieldCheckIcon, EnvelopeIcon,
    DocumentTextIcon, ReceiptPercentIcon, EyeIcon, CheckIcon, NoSymbolIcon
} from './icons';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceCustomizationModal from './InvoiceCustomizationModal';
import AddTimeEntryModal from './AddTimeEntryModal';
import AddExpenseModal from './AddExpenseModal';

// --- Timer Types ---
interface TimerInstance {
    id: string;
    matterId: string;
    description: string;
    seconds: number;
    isRunning: boolean;
    rate: number;
    roundingRule: 6 | 10 | 15;
}

// --- Helpers ---
const formatTimerDisplay = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => (v < 10 ? '0' + v : '' + v)).join(':');
};

const roundDuration = (hours: number, rule: 6 | 10 | 15): number => {
    const increment = rule / 60;
    return Math.ceil(hours / increment) * increment;
};

const fmtCurrency = (n: number): string =>
    '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        Paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        Unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
};

// ============================================================================
// MAIN BILLING COMPONENT
// ============================================================================
const Billing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'time' | 'invoices' | 'trust' | 'payments'>('time');
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    // Store selectors
    const matters = useStore(s => s.matters);
    const timeEntries = useStore(s => s.timeEntries);
    const expenses = useStore(s => s.expenses);
    const invoices = useStore(s => s.invoices);
    const transactions = useStore(s => s.transactions);
    const currentUser = useStore(s => s.currentUser);
    const addTimeEntry = useStore(s => s.addTimeEntry);
    const deleteTimeEntry = useStore(s => s.deleteTimeEntry);
    const addExpense = useStore(s => s.addExpense);
    const deleteExpense = useStore(s => s.deleteExpense);
    const addInvoice = useStore(s => s.addInvoice);
    const addTransaction = useStore(s => s.addTransaction);
    const getMatterBalance = useStore(s => s.getMatterBalance);
    const getTotalTrustBalance = useStore(s => s.getTotalTrustBalance);
    const performReconciliation = useStore(s => s.performReconciliation);
    const addToast = useStore(s => s.addToast);

    // --- Summary Metrics ---
    const summaryMetrics = useMemo(() => {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

        const paidInvoices = invoices.filter(i => i.status === 'Paid');
        const totalBilled = invoices
            .filter(i => i.issueDate >= yearStart)
            .reduce((s, i) => s + i.amount, 0);
        const totalCollected = paidInvoices
            .filter(i => i.issueDate >= yearStart)
            .reduce((s, i) => s + i.amount, 0);
        const outstandingAR = invoices
            .filter(i => i.status !== 'Paid')
            .reduce((s, i) => s + (i.balance ?? i.amount), 0);
        const unbilledTime = timeEntries
            .filter(te => !te.isBilled)
            .reduce((s, te) => s + te.duration * te.rate, 0);
        const unbilledExpenses = expenses
            .filter(e => !e.isBilled)
            .reduce((s, e) => s + e.amount, 0);
        const wip = unbilledTime + unbilledExpenses;
        const trustBalance = getTotalTrustBalance();
        const realizationRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

        return { totalBilled, totalCollected, outstandingAR, wip, trustBalance, realizationRate };
    }, [invoices, timeEntries, expenses, getTotalTrustBalance]);

    // --- Tab definitions ---
    const tabs = [
        { id: 'time' as const, label: 'Time & Expenses', icon: ClockIcon },
        { id: 'invoices' as const, label: 'Invoices', icon: DocumentTextIcon },
        { id: 'trust' as const, label: 'Trust Accounting', icon: BanknotesIcon },
        { id: 'payments' as const, label: 'Payment History', icon: CreditCardIcon },
    ];

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Billing & Time Tracking</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Capture every billable second and manage invoices.</p>
                    </div>
                    <button
                        onClick={() => setIsCustomizeModalOpen(true)}
                        className="flex items-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                        <PaintBrushIcon className="w-5 h-5 mr-2" /> Invoice Settings
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <SummaryCard label="Total Billed (YTD)" value={fmtCurrency(summaryMetrics.totalBilled)} icon={CurrencyDollarIcon} color="blue" />
                    <SummaryCard label="Total Collected" value={fmtCurrency(summaryMetrics.totalCollected)} icon={CheckCircleIcon} color="green" />
                    <SummaryCard label="Outstanding A/R" value={fmtCurrency(summaryMetrics.outstandingAR)} icon={ExclamationTriangleIcon} color="yellow" />
                    <SummaryCard label="WIP (Unbilled)" value={fmtCurrency(summaryMetrics.wip)} icon={ClockIcon} color="purple" />
                    <SummaryCard label="Trust Balance" value={fmtCurrency(summaryMetrics.trustBalance)} icon={BanknotesIcon} color="indigo" />
                    <SummaryCard label="Realization Rate" value={`${summaryMetrics.realizationRate.toFixed(1)}%`} icon={ChartBarIcon} color="emerald" />
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="flex space-x-1 overflow-x-auto" aria-label="Billing tabs">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                        isActive
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'time' && (
                    <TimeAndExpensesTab
                        matters={matters}
                        timeEntries={timeEntries}
                        expenses={expenses}
                        currentUser={currentUser}
                        addTimeEntry={addTimeEntry}
                        deleteTimeEntry={deleteTimeEntry}
                        deleteExpense={deleteExpense}
                        addToast={addToast}
                        onOpenTimeEntryModal={() => setIsTimeEntryModalOpen(true)}
                        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
                    />
                )}
                {activeTab === 'invoices' && (
                    <InvoicesTab
                        invoices={invoices}
                        matters={matters}
                        timeEntries={timeEntries}
                        expenses={expenses}
                        addInvoice={addInvoice}
                        addToast={addToast}
                        onCreateInvoice={() => setIsInvoiceModalOpen(true)}
                    />
                )}
                {activeTab === 'trust' && (
                    <TrustAccountingTab
                        matters={matters}
                        transactions={transactions}
                        getMatterBalance={getMatterBalance}
                        getTotalTrustBalance={getTotalTrustBalance}
                        performReconciliation={performReconciliation}
                        addTransaction={addTransaction}
                        addToast={addToast}
                    />
                )}
                {activeTab === 'payments' && (
                    <PaymentHistoryTab
                        transactions={transactions}
                        matters={matters}
                    />
                )}
            </div>

            {/* Modals */}
            {isInvoiceModalOpen && <CreateInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} />}
            {isCustomizeModalOpen && <InvoiceCustomizationModal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} />}
            {isTimeEntryModalOpen && <AddTimeEntryModal isOpen={isTimeEntryModalOpen} onClose={() => setIsTimeEntryModalOpen(false)} />}
            {isExpenseModalOpen && <AddExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />}
        </>
    );
};

// ============================================================================
// SUMMARY CARD
// ============================================================================
const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500 dark:text-blue-400' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', icon: 'text-green-500 dark:text-green-400' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', icon: 'text-yellow-500 dark:text-yellow-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-500 dark:text-purple-400' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', icon: 'text-indigo-500 dark:text-indigo-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-500 dark:text-emerald-400' },
};

interface SummaryCardProps {
    label: string;
    value: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: Icon, color }) => {
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`${c.bg} rounded-xl p-4 border border-slate-200 dark:border-slate-700`}>
            <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${c.icon}`} />
            </div>
            <p className={`text-xl font-bold ${c.text}`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
        </div>
    );
};

// ============================================================================
// TIME & EXPENSES TAB
// ============================================================================
interface TimeExpensesTabProps {
    matters: Matter[];
    timeEntries: TimeEntry[];
    expenses: Expense[];
    currentUser: { id: string; name: string; defaultRate?: number };
    addTimeEntry: (entry: TimeEntry) => void;
    deleteTimeEntry: (id: string) => void;
    deleteExpense: (id: string) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onOpenTimeEntryModal: () => void;
    onOpenExpenseModal: () => void;
}

const TimeAndExpensesTab: React.FC<TimeExpensesTabProps> = ({
    matters, timeEntries, expenses, currentUser,
    addTimeEntry, deleteTimeEntry, deleteExpense, addToast,
    onOpenTimeEntryModal, onOpenExpenseModal,
}) => {
    // -- Multiple timers --
    const [timers, setTimers] = useState<TimerInstance[]>([]);
    const intervalRef = useRef<number | null>(null);

    // Tick all running timers every second
    useEffect(() => {
        intervalRef.current = window.setInterval(() => {
            setTimers(prev => prev.map(t => t.isRunning ? { ...t, seconds: t.seconds + 1 } : t));
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const addTimer = useCallback(() => {
        const defaultRate = currentUser.defaultRate ?? 250;
        setTimers(prev => [
            ...prev,
            {
                id: `timer-${Date.now()}`,
                matterId: '',
                description: '',
                seconds: 0,
                isRunning: false,
                rate: defaultRate,
                roundingRule: 6,
            },
        ]);
    }, [currentUser.defaultRate]);

    const updateTimer = useCallback((id: string, patch: Partial<TimerInstance>) => {
        setTimers(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    }, []);

    const removeTimer = useCallback((id: string) => {
        setTimers(prev => prev.filter(t => t.id !== id));
    }, []);

    const toggleTimer = useCallback((id: string) => {
        setTimers(prev =>
            prev.map(t => (t.id === id ? { ...t, isRunning: !t.isRunning } : t)),
        );
    }, []);

    const logTimer = useCallback(
        (timer: TimerInstance) => {
            if (!timer.matterId) {
                addToast('Please select a matter before logging time.', 'error');
                return;
            }
            if (timer.seconds < 1) {
                addToast('Timer has no time recorded.', 'error');
                return;
            }
            const rawHours = timer.seconds / 3600;
            const rounded = roundDuration(rawHours, timer.roundingRule);

            const entry: TimeEntry = {
                id: `TE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                matterId: timer.matterId,
                date: new Date().toISOString().split('T')[0],
                description: timer.description || 'Timer entry',
                duration: rounded,
                rate: timer.rate,
                isBilled: false,
                userId: currentUser.id,
            };
            addTimeEntry(entry);
            removeTimer(timer.id);
            addToast(`Logged ${rounded.toFixed(2)}h to matter.`, 'success');
        },
        [addTimeEntry, currentUser.id, removeTimer, addToast],
    );

    // -- Manual entry inline form --
    const [showManual, setShowManual] = useState(false);
    const [manualForm, setManualForm] = useState({
        matterId: '', description: '', hours: '', rate: '', date: new Date().toISOString().split('T')[0], roundingRule: 6 as 6 | 10 | 15,
    });

    const submitManualEntry = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.matterId || !manualForm.description || !manualForm.hours || !manualForm.rate) {
            addToast('All fields are required.', 'error');
            return;
        }
        const rawH = parseFloat(manualForm.hours);
        const rounded = roundDuration(rawH, manualForm.roundingRule);
        const entry: TimeEntry = {
            id: `TE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            matterId: manualForm.matterId,
            date: manualForm.date,
            description: manualForm.description,
            duration: rounded,
            rate: parseFloat(manualForm.rate),
            isBilled: false,
            userId: currentUser.id,
        };
        addTimeEntry(entry);
        setManualForm({ matterId: '', description: '', hours: '', rate: '', date: new Date().toISOString().split('T')[0], roundingRule: 6 });
        setShowManual(false);
        addToast('Time entry saved.', 'success');
    };

    return (
        <div className="space-y-6">
            {/* Live Timers */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-blue-500" /> Live Timers
                    </h2>
                    <button
                        onClick={addTimer}
                        className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-1" /> New Timer
                    </button>
                </div>

                {timers.length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                        No active timers. Click "New Timer" to start tracking time.
                    </p>
                )}

                <div className="space-y-3">
                    {timers.map(timer => (
                        <div
                            key={timer.id}
                            className={`flex flex-col lg:flex-row items-start lg:items-center gap-3 p-4 rounded-lg border ${
                                timer.isRunning
                                    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50'
                            }`}
                        >
                            {/* Timer display */}
                            <div className="flex items-center gap-2 font-mono text-2xl min-w-[120px] text-slate-800 dark:text-white">
                                <ClockIcon className={`w-6 h-6 ${timer.isRunning ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
                                {formatTimerDisplay(timer.seconds)}
                            </div>

                            {/* Matter */}
                            <select
                                value={timer.matterId}
                                onChange={e => updateTimer(timer.id, { matterId: e.target.value })}
                                className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 w-full lg:w-48"
                            >
                                <option value="">Select matter...</option>
                                {matters.filter(m => m.status === 'Open').map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>

                            {/* Description */}
                            <input
                                type="text"
                                placeholder="Activity description..."
                                value={timer.description}
                                onChange={e => updateTimer(timer.id, { description: e.target.value })}
                                className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 flex-1 w-full lg:w-auto"
                            />

                            {/* Rate */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500 dark:text-slate-400">$/hr:</span>
                                <input
                                    type="number"
                                    value={timer.rate}
                                    onChange={e => updateTimer(timer.id, { rate: parseFloat(e.target.value) || 0 })}
                                    className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white w-20"
                                />
                            </div>

                            {/* Rounding */}
                            <select
                                value={timer.roundingRule}
                                onChange={e => updateTimer(timer.id, { roundingRule: Number(e.target.value) as 6 | 10 | 15 })}
                                className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white w-24"
                                title="Rounding increment"
                            >
                                <option value={6}>6-min</option>
                                <option value={10}>10-min</option>
                                <option value={15}>15-min</option>
                            </select>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleTimer(timer.id)}
                                    className={`px-3 py-2 rounded-lg font-medium text-white text-sm transition-colors ${
                                        timer.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                >
                                    {timer.isRunning ? 'Stop' : 'Start'}
                                </button>
                                <button
                                    onClick={() => logTimer(timer)}
                                    className="px-3 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
                                >
                                    Log
                                </button>
                                <button
                                    onClick={() => removeTimer(timer.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove timer"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Manual Entry Toggle */}
            {showManual && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-md font-semibold text-slate-800 dark:text-white mb-4">Manual Time Entry</h3>
                    <form onSubmit={submitManualEntry} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
                            <input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Matter</label>
                            <select value={manualForm.matterId} onChange={e => setManualForm(f => ({ ...f, matterId: e.target.value }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">Select...</option>
                                {matters.filter(m => m.status === 'Open').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                            <input type="text" placeholder="Activity description..." value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hours</label>
                                <input type="number" step="0.1" placeholder="0.0" value={manualForm.hours} onChange={e => setManualForm(f => ({ ...f, hours: e.target.value }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rate</label>
                                <input type="number" step="0.01" placeholder="250" value={manualForm.rate} onChange={e => setManualForm(f => ({ ...f, rate: e.target.value }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Round</label>
                                <select value={manualForm.roundingRule} onChange={e => setManualForm(f => ({ ...f, roundingRule: Number(e.target.value) as 6 | 10 | 15 }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value={6}>6m</option>
                                    <option value={10}>10m</option>
                                    <option value={15}>15m</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Save</button>
                            <button type="button" onClick={() => setShowManual(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Time Entries + Expenses Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Time Entries */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white">Time Entries</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setShowManual(true)} className="flex items-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                Manual Entry
                            </button>
                            <button onClick={onOpenTimeEntryModal} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                <PlusIcon className="w-4 h-4 mr-1" /> Add Entry
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Duration</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">No time entries yet.</td>
                                    </tr>
                                )}
                                {timeEntries.slice(0, 20).map(entry => {
                                    const matter = matters.find(m => m.id === entry.matterId);
                                    return (
                                        <tr key={entry.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{entry.date}</td>
                                            <td className="p-3 text-slate-700 dark:text-slate-200 font-medium">{matter?.name || entry.matterId}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{entry.description}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{entry.duration.toFixed(2)}h</td>
                                            <td className="p-3 text-slate-800 dark:text-white font-medium text-right">{fmtCurrency(entry.duration * entry.rate)}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${entry.isBilled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                                                    {entry.isBilled ? 'Billed' : 'Unbilled'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <button onClick={() => { deleteTimeEntry(entry.id); addToast('Time entry deleted.', 'info'); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete entry">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {timeEntries.length > 20 && (
                        <div className="p-3 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                            Showing 20 of {timeEntries.length} entries.
                        </div>
                    )}
                </div>

                {/* Expenses */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white">Expenses</h3>
                        <button onClick={onOpenExpenseModal} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-4 h-4 mr-1" /> Log Expense
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-400 dark:text-slate-500">No expenses yet.</td>
                                    </tr>
                                )}
                                {expenses.slice(0, 15).map(expense => (
                                    <tr key={expense.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3">
                                            <p className="font-medium text-slate-800 dark:text-white">{expense.description}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{expense.date} -- {expense.type}</p>
                                        </td>
                                        <td className="p-3 text-slate-800 dark:text-white font-medium text-right">{fmtCurrency(expense.amount)}</td>
                                        <td className="p-3">
                                            <button onClick={() => { deleteExpense(expense.id); addToast('Expense deleted.', 'info'); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete expense">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// INVOICES TAB
// ============================================================================
interface InvoicesTabProps {
    invoices: Invoice[];
    matters: Matter[];
    timeEntries: TimeEntry[];
    expenses: Expense[];
    addInvoice: (invoice: Invoice) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onCreateInvoice: () => void;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({
    invoices, matters, timeEntries, expenses, addInvoice, addToast, onCreateInvoice,
}) => {
    const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue'>('All');
    const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
    const [batchMode, setBatchMode] = useState(false);
    const [batchSelected, setBatchSelected] = useState<string[]>([]);

    const filtered = useMemo(() => {
        if (filterStatus === 'All') return invoices;
        return invoices.filter(i => i.status === filterStatus);
    }, [invoices, filterStatus]);

    const detailInvoice = selectedDetail ? invoices.find(i => i.id === selectedDetail) : null;

    const handleBatchGenerate = () => {
        let count = 0;
        for (const matterId of batchSelected) {
            const unbilledTE = timeEntries.filter(t => t.matterId === matterId && !t.isBilled);
            const unbilledExp = expenses.filter(e => e.matterId === matterId && !e.isBilled);
            const timeTotal = unbilledTE.reduce((s, t) => s + t.duration * t.rate, 0);
            const expTotal = unbilledExp.reduce((s, e) => s + e.amount, 0);
            const total = timeTotal + expTotal;
            if (total <= 0) continue;
            const inv: Invoice = {
                id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                matterId,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                amount: total,
                status: 'Unpaid',
                balance: total,
            };
            addInvoice(inv);
            count++;
        }
        addToast(`Generated ${count} invoice(s).`, count > 0 ? 'success' : 'info');
        setBatchMode(false);
        setBatchSelected([]);
    };

    // Invoice detail view
    if (detailInvoice) {
        const matter = matters.find(m => m.id === detailInvoice.matterId);
        const relatedTime = timeEntries.filter(t => t.matterId === detailInvoice.matterId);
        const relatedExpenses = expenses.filter(e => e.matterId === detailInvoice.matterId);
        return (
            <div className="space-y-4">
                <button onClick={() => setSelectedDetail(null)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">&larr; Back to invoices</button>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{detailInvoice.id}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{matter?.name} -- {matter?.client}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge(detailInvoice.status)}`}>{detailInvoice.status}</span>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">{fmtCurrency(detailInvoice.amount)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div><span className="text-slate-500 dark:text-slate-400">Issue Date:</span> <span className="font-medium text-slate-800 dark:text-white">{detailInvoice.issueDate}</span></div>
                        <div><span className="text-slate-500 dark:text-slate-400">Due Date:</span> <span className="font-medium text-slate-800 dark:text-white">{detailInvoice.dueDate}</span></div>
                        <div><span className="text-slate-500 dark:text-slate-400">Balance:</span> <span className="font-medium text-slate-800 dark:text-white">{fmtCurrency(detailInvoice.balance ?? detailInvoice.amount)}</span></div>
                        <div><span className="text-slate-500 dark:text-slate-400">Last Sent:</span> <span className="font-medium text-slate-800 dark:text-white">{detailInvoice.lastSentDate || 'Never'}</span></div>
                    </div>

                    {/* Line items */}
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Time Entries</h3>
                    <table className="w-full text-sm mb-4">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-2 text-left text-slate-600 dark:text-slate-300">Date</th>
                                <th className="p-2 text-left text-slate-600 dark:text-slate-300">Description</th>
                                <th className="p-2 text-right text-slate-600 dark:text-slate-300">Hours</th>
                                <th className="p-2 text-right text-slate-600 dark:text-slate-300">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedTime.map(t => (
                                <tr key={t.id} className="border-t border-slate-100 dark:border-slate-700">
                                    <td className="p-2 text-slate-600 dark:text-slate-300">{t.date}</td>
                                    <td className="p-2 text-slate-800 dark:text-white">{t.description}</td>
                                    <td className="p-2 text-right text-slate-600 dark:text-slate-300">{t.duration.toFixed(2)}</td>
                                    <td className="p-2 text-right font-medium text-slate-800 dark:text-white">{fmtCurrency(t.duration * t.rate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Expenses</h3>
                    <table className="w-full text-sm mb-6">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-2 text-left text-slate-600 dark:text-slate-300">Date</th>
                                <th className="p-2 text-left text-slate-600 dark:text-slate-300">Description</th>
                                <th className="p-2 text-left text-slate-600 dark:text-slate-300">Type</th>
                                <th className="p-2 text-right text-slate-600 dark:text-slate-300">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedExpenses.map(e => (
                                <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700">
                                    <td className="p-2 text-slate-600 dark:text-slate-300">{e.date}</td>
                                    <td className="p-2 text-slate-800 dark:text-white">{e.description}</td>
                                    <td className="p-2 text-slate-600 dark:text-slate-300">{e.type}</td>
                                    <td className="p-2 text-right font-medium text-slate-800 dark:text-white">{fmtCurrency(e.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                            <CreditCardIcon className="w-4 h-4 mr-2" /> Record Payment
                        </button>
                        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            <EnvelopeIcon className="w-4 h-4 mr-2" /> Send Invoice
                        </button>
                        <button className="flex items-center bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Download PDF
                        </button>
                        <button className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
                            <NoSymbolIcon className="w-4 h-4 mr-2" /> Write Off
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Batch invoice generation */}
            {batchMode && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3">Batch Invoice Generation</h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-3">Select matters with unbilled time/expenses to generate invoices:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
                        {matters.filter(m => m.status === 'Open').map(m => {
                            const unbilled = timeEntries.filter(t => t.matterId === m.id && !t.isBilled).reduce((s, t) => s + t.duration * t.rate, 0)
                                + expenses.filter(e => e.matterId === m.id && !e.isBilled).reduce((s, e) => s + e.amount, 0);
                            if (unbilled <= 0) return null;
                            const isChecked = batchSelected.includes(m.id);
                            return (
                                <label key={m.id} className="flex items-center p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => setBatchSelected(prev => isChecked ? prev.filter(x => x !== m.id) : [...prev, m.id])}
                                        className="h-4 w-4 mr-3 rounded border-slate-300"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Unbilled: {fmtCurrency(unbilled)}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleBatchGenerate} disabled={batchSelected.length === 0} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Generate {batchSelected.length} Invoice(s)
                        </button>
                        <button onClick={() => { setBatchMode(false); setBatchSelected([]); }} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Invoice List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Invoices</h3>
                        <div className="flex gap-1 ml-4">
                            {(['All', 'Unpaid', 'Paid', 'Overdue'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        filterStatus === s
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setBatchMode(true)} className="flex items-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                            <ReceiptPercentIcon className="w-4 h-4 mr-1" /> Batch Generate
                        </button>
                        <button onClick={onCreateInvoice} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-4 h-4 mr-1" /> Create Invoice
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Issue Date</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Due Date</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Balance</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">No invoices found.</td>
                                </tr>
                            )}
                            {filtered.map(inv => {
                                const matter = matters.find(m => m.id === inv.matterId);
                                return (
                                    <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3">
                                            <button onClick={() => setSelectedDetail(inv.id)} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                                {inv.id}
                                            </button>
                                        </td>
                                        <td className="p-3 text-slate-700 dark:text-slate-200">{matter?.name || inv.matterId}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{inv.issueDate}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{inv.dueDate}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(inv.status)}`}>{inv.status}</span>
                                        </td>
                                        <td className="p-3 text-slate-800 dark:text-white font-medium text-right">{fmtCurrency(inv.amount)}</td>
                                        <td className="p-3 text-slate-800 dark:text-white font-medium text-right">{fmtCurrency(inv.balance ?? inv.amount)}</td>
                                        <td className="p-3">
                                            <button onClick={() => setSelectedDetail(inv.id)} className="text-slate-400 hover:text-blue-500 transition-colors" title="View details">
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// TRUST ACCOUNTING TAB
// ============================================================================
interface TrustAccountingTabProps {
    matters: Matter[];
    transactions: Transaction[];
    getMatterBalance: (matterId: string, ledger: 'Operating' | 'Trust') => number;
    getTotalTrustBalance: () => number;
    performReconciliation: (bankBalance: number) => {
        bookBalance: number; bankBalance: number; sumOfMatterBalances: number; balanced: boolean; discrepancy: number;
    };
    addTransaction: (tx: Transaction) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const TrustAccountingTab: React.FC<TrustAccountingTabProps> = ({
    matters, transactions, getMatterBalance, getTotalTrustBalance,
    performReconciliation, addTransaction, addToast,
}) => {
    const [txForm, setTxForm] = useState({ matterId: '', type: 'Deposit' as 'Deposit' | 'Payment', amount: '', description: '' });
    const [reconBankBalance, setReconBankBalance] = useState('');
    const [reconResult, setReconResult] = useState<{ bookBalance: number; bankBalance: number; sumOfMatterBalances: number; balanced: boolean; discrepancy: number } | null>(null);

    const trustTransactions = useMemo(() => transactions.filter(t => t.ledger === 'Trust'), [transactions]);
    const totalTrust = getTotalTrustBalance();

    const matterBalances = useMemo(() => {
        return matters
            .filter(m => m.status === 'Open')
            .map(m => ({ matter: m, balance: getMatterBalance(m.id, 'Trust') }))
            .filter(x => x.balance !== 0 || trustTransactions.some(t => t.matterId === x.matter.id));
    }, [matters, getMatterBalance, trustTransactions]);

    const handleSubmitTx = (e: React.FormEvent) => {
        e.preventDefault();
        if (!txForm.matterId || !txForm.amount || !txForm.description) {
            addToast('All fields are required.', 'error');
            return;
        }
        const tx: Transaction = {
            id: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            date: new Date().toISOString(),
            type: txForm.type,
            ledger: 'Trust',
            matterId: txForm.matterId,
            description: txForm.description,
            amount: Math.abs(parseFloat(txForm.amount)),
        };
        addTransaction(tx);
        addToast(`Trust ${txForm.type.toLowerCase()} recorded.`, 'success');
        setTxForm({ matterId: '', type: 'Deposit', amount: '', description: '' });
    };

    const handleReconciliation = () => {
        if (!reconBankBalance) { addToast('Enter the bank statement balance.', 'error'); return; }
        const result = performReconciliation(parseFloat(reconBankBalance));
        setReconResult(result);
    };

    return (
        <div className="space-y-6">
            {/* Trust Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <BanknotesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Trust Balance</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{fmtCurrency(totalTrust)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ArrowUpCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Deposits</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {fmtCurrency(trustTransactions.filter(t => t.type === 'Deposit').reduce((s, t) => s + t.amount, 0))}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ArrowDownCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Withdrawals</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {fmtCurrency(trustTransactions.filter(t => t.type === 'Payment').reduce((s, t) => s + t.amount, 0))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deposit / Withdrawal Form */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                        <ArrowsRightLeftIcon className="w-5 h-5 mr-2 text-indigo-500" /> Trust Deposit / Withdrawal
                    </h3>
                    <form onSubmit={handleSubmitTx} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Matter</label>
                            <select value={txForm.matterId} onChange={e => setTxForm(f => ({ ...f, matterId: e.target.value }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">Select matter...</option>
                                {matters.filter(m => m.status === 'Open').map(m => <option key={m.id} value={m.id}>{m.name} - {m.client}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                                <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value as 'Deposit' | 'Payment' }))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="Deposit">Deposit</option>
                                    <option value="Payment">Withdrawal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Amount ($)</label>
                                <input type="number" step="0.01" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                            <input type="text" value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g., Retainer deposit" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                            Record Transaction
                        </button>
                    </form>
                </div>

                {/* Three-Way Reconciliation */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                        <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-500" /> Three-Way Reconciliation
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bank Statement Balance ($)</label>
                            <input type="number" step="0.01" value={reconBankBalance} onChange={e => setReconBankBalance(e.target.value)} placeholder="Enter bank balance..." className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <button onClick={handleReconciliation} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                            Run Reconciliation
                        </button>
                        {reconResult && (
                            <div className={`p-4 rounded-lg border ${reconResult.balanced ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {reconResult.balanced
                                        ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        : <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    }
                                    <span className={`font-semibold text-sm ${reconResult.balanced ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {reconResult.balanced ? 'Balanced -- Accounts Reconciled' : 'Discrepancy Detected'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div>Book Balance: <span className="font-medium">{fmtCurrency(reconResult.bookBalance)}</span></div>
                                    <div>Bank Balance: <span className="font-medium">{fmtCurrency(reconResult.bankBalance)}</span></div>
                                    <div>Client Ledger Total: <span className="font-medium">{fmtCurrency(reconResult.sumOfMatterBalances)}</span></div>
                                    <div>Discrepancy: <span className={`font-medium ${reconResult.discrepancy !== 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{fmtCurrency(reconResult.discrepancy)}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Matter Trust Balances */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Trust Balance by Matter</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 dark:text-green-400 font-medium">IOLTA Compliant</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Trust Balance</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matterBalances.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500">No trust activity yet.</td>
                                </tr>
                            )}
                            {matterBalances.map(({ matter, balance }) => (
                                <tr key={matter.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="p-3 text-slate-800 dark:text-white font-medium">{matter.name}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{matter.client}</td>
                                    <td className={`p-3 font-bold text-right ${balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {fmtCurrency(balance)}
                                    </td>
                                    <td className="p-3 text-center">
                                        {balance >= 0
                                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400"><CheckCircleIcon className="w-3 h-3" /> OK</span>
                                            : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><ExclamationTriangleIcon className="w-3 h-3" /> Overdraft</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Trust Ledger */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Trust Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trustTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">No trust transactions yet.</td>
                                </tr>
                            )}
                            {trustTransactions.slice(0, 30).map(tx => {
                                const matter = matters.find(m => m.id === tx.matterId);
                                return (
                                    <tr key={tx.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-slate-700 dark:text-slate-200 font-medium">{matter?.name || tx.matterId}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{tx.description}</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                                tx.type === 'Deposit' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {tx.type === 'Deposit' ? <ArrowUpCircleIcon className="w-3 h-3" /> : <ArrowDownCircleIcon className="w-3 h-3" />}
                                                {tx.type === 'Deposit' ? 'Deposit' : 'Withdrawal'}
                                            </span>
                                        </td>
                                        <td className={`p-3 font-medium text-right ${tx.type === 'Deposit' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {tx.type === 'Deposit' ? '+' : '-'}{fmtCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// PAYMENT HISTORY TAB
// ============================================================================
interface PaymentHistoryTabProps {
    transactions: Transaction[];
    matters: Matter[];
}

const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ transactions, matters }) => {
    const [filterLedger, setFilterLedger] = useState<'All' | 'Trust' | 'Operating'>('All');

    const filtered = useMemo(() => {
        if (filterLedger === 'All') return transactions;
        return transactions.filter(t => t.ledger === filterLedger);
    }, [transactions, filterLedger]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">All Transactions</h3>
                <div className="flex gap-1">
                    {(['All', 'Trust', 'Operating'] as const).map(l => (
                        <button
                            key={l}
                            onClick={() => setFilterLedger(l)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                filterLedger === l
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                        <tr>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Matter</th>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Ledger</th>
                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">No transactions recorded.</td>
                            </tr>
                        )}
                        {filtered.slice(0, 50).map(tx => {
                            const matter = matters.find(m => m.id === tx.matterId);
                            return (
                                <tr key={tx.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{tx.id}</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-200 font-medium">{matter?.name || tx.matterId}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{tx.description}</td>
                                    <td className="p-3">
                                        <span className={`text-xs font-semibold ${
                                            tx.type === 'Deposit' ? 'text-green-700 dark:text-green-400' : tx.type === 'Payment' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            tx.ledger === 'Trust' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                                        }`}>
                                            {tx.ledger}
                                        </span>
                                    </td>
                                    <td className={`p-3 font-medium text-right ${tx.type === 'Deposit' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {tx.type === 'Deposit' ? '+' : '-'}{fmtCurrency(tx.amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {filtered.length > 50 && (
                <div className="p-3 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                    Showing 50 of {filtered.length} transactions.
                </div>
            )}
        </div>
    );
};

export default Billing;
