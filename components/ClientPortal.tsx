import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Contact, Matter, Document, Invoice, PortalMessage, Event } from '../types';
import { useStore } from '../store/useStore';
import { MOCK_FIRM_SETTINGS } from '../constants';
import {
    ScaleIcon, ArrowRightOnRectangleIcon, BriefcaseIcon, DocumentTextIcon,
    CurrencyDollarIcon, ChatBubbleLeftRightIcon, CreditCardIcon, PencilSquareIcon,
    BellIcon, CalendarIcon, ArrowDownTrayIcon, PlusIcon, ClockIcon,
    CheckCircleIcon, FunnelIcon, MapPinIcon, UserIcon, PaperAirplaneIcon,
    DocumentArrowUpIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon,
    PhoneIcon, EnvelopeIcon, ShieldCheckIcon
} from './icons';
import SignDocumentModal from './SignDocumentModal';

interface ClientPortalProps {
    client: Contact;
    onLogout: () => void;
}

type TabId = 'cases' | 'documents' | 'billing' | 'messages' | 'calendar';

interface Tab {
    id: TabId;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const TABS: Tab[] = [
    { id: 'cases', label: 'My Cases', icon: BriefcaseIcon },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { id: 'billing', label: 'Billing & Payments', icon: CurrencyDollarIcon },
    { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const STATUS_STAGES = ['Filed', 'Discovery', 'Motions', 'Trial Prep', 'Resolution'] as const;

function getStatusIndex(status: Matter['status']): number {
    switch (status) {
        case 'Open': return 2;
        case 'Pending': return 1;
        case 'Closed': return 4;
        default: return 0;
    }
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = now.getTime() - then.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}

// ============================================================================
// MAIN CLIENT PORTAL COMPONENT
// ============================================================================

const ClientPortal: React.FC<ClientPortalProps> = ({ client, onLogout }) => {
    const [activeTab, setActiveTab] = useState<TabId>('cases');
    const [docToSign, setDocToSign] = useState<Document | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);

    const { matters, documents, invoices, events, contacts, addTransaction, clientNotifications, addPortalPayment } = useStore();

    const clientMatters = useMemo(
        () => matters.filter(m => m.client === client.name),
        [matters, client.name]
    );
    const clientMatterIds = useMemo(
        () => clientMatters.map(m => m.id),
        [clientMatters]
    );
    const sharedDocuments = useMemo(
        () => documents.filter(d => clientMatterIds.includes(d.matterId) && d.sharedWithClient),
        [documents, clientMatterIds]
    );
    const clientInvoices = useMemo(
        () => invoices.filter(i => clientMatterIds.includes(i.matterId)),
        [invoices, clientMatterIds]
    );
    const clientEvents = useMemo(
        () => events.filter(e => clientMatterIds.includes(e.matterId)),
        [events, clientMatterIds]
    );

    const unreadNotifications = useMemo(
        () => clientNotifications.filter(n => n.clientId === client.id && !n.readAt),
        [clientNotifications, client.id]
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'documents':
                return <DocumentsTab documents={sharedDocuments} matters={clientMatters} onSignClick={setDocToSign} />;
            case 'billing':
                return <BillingTab invoices={clientInvoices} matters={clientMatters} clientId={client.id} />;
            case 'messages':
                return <MessagesTab clientName={client.name} />;
            case 'calendar':
                return <CalendarTab events={clientEvents} matters={clientMatters} />;
            case 'cases':
            default:
                return <CasesTab matters={clientMatters} contacts={contacts} events={clientEvents} />;
        }
    };

    return (
        <>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col">
                {/* ===== HEADER ===== */}
                <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {MOCK_FIRM_SETTINGS.logoUrl ? (
                                <img src={MOCK_FIRM_SETTINGS.logoUrl} alt="Firm Logo" className="w-9 h-9 rounded-lg object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <ScaleIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className="hidden sm:block">
                                <h1 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{MOCK_FIRM_SETTINGS.firmName}</h1>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Client Portal</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    aria-label={`Notifications${unreadNotifications.length > 0 ? ` (${unreadNotifications.length} unread)` : ''}`}
                                >
                                    <BellIcon className="w-5 h-5" />
                                    {unreadNotifications.length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                            {unreadNotifications.length}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                                        </div>
                                        {unreadNotifications.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No new notifications</div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {unreadNotifications.slice(0, 10).map(n => (
                                                    <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.sentAt)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Client Avatar & Name */}
                            <div className="flex items-center gap-2">
                                {client.photoUrl ? (
                                    <img src={client.photoUrl} alt={client.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                                            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </span>
                                    </div>
                                )}
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{client.name}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{client.email}</p>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                aria-label="Logout"
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5 rotate-180" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ===== WELCOME BANNER ===== */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                            Welcome back, {client.firstName || client.name.split(' ')[0]}
                        </h2>
                        <p className="text-blue-100 dark:text-blue-200 text-sm mt-1">
                            Here is the latest on your cases with {MOCK_FIRM_SETTINGS.firmName}.
                        </p>
                        <div className="flex gap-4 mt-4">
                            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                                <p className="text-2xl font-bold text-white">{clientMatters.filter(m => m.status === 'Open').length}</p>
                                <p className="text-[11px] text-blue-200 uppercase font-medium">Active Cases</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                                <p className="text-2xl font-bold text-white">{sharedDocuments.length}</p>
                                <p className="text-[11px] text-blue-200 uppercase font-medium">Documents</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                                <p className="text-2xl font-bold text-white">
                                    ${clientInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-blue-200 uppercase font-medium">Balance Due</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== TAB NAVIGATION ===== */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-[57px] z-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Portal tabs">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-3.5 px-3 sm:px-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                            isActive
                                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                        aria-selected={isActive}
                                        role="tab"
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                    {renderContent()}
                </main>

                {/* ===== FOOTER ===== */}
                <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{MOCK_FIRM_SETTINGS.firmName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-line">{MOCK_FIRM_SETTINGS.address}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                                    Privacy Policy
                                </button>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                                    <EnvelopeIcon className="w-3.5 h-3.5" />
                                    Support
                                </button>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                                    <PhoneIcon className="w-3.5 h-3.5" />
                                    Contact Us
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 text-center">
                            Secure client portal powered by CaseFlow. All communications are encrypted.
                        </p>
                    </div>
                </footer>
            </div>

            {/* Sign Document Modal */}
            {docToSign && (
                <SignDocumentModal
                    isOpen={!!docToSign}
                    onClose={() => setDocToSign(null)}
                    document={docToSign}
                />
            )}

            {/* Click-away for notifications */}
            {showNotifications && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowNotifications(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
};


// ============================================================================
// TAB: MY CASES
// ============================================================================

const CasesTab: React.FC<{
    matters: Matter[];
    contacts: Contact[];
    events: Event[];
}> = ({ matters, contacts, events }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (matters.length === 0) {
        return (
            <div className="text-center py-16">
                <BriefcaseIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">No Cases Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">You currently have no active cases on file.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {matters.map(matter => {
                const isExpanded = expandedId === matter.id;
                const attorney = matter.responsibleAttorneyId
                    ? contacts.find(c => c.id === matter.responsibleAttorneyId)
                    : null;
                const matterEvents = events
                    .filter(e => e.matterId === matter.id)
                    .sort((a, b) => a.date.localeCompare(b.date));
                const upcomingEvents = matterEvents.filter(e => e.date >= new Date().toISOString().split('T')[0]);
                const stageIndex = getStatusIndex(matter.status);

                return (
                    <div key={matter.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        {/* Matter Header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : matter.id)}
                            className="w-full p-5 flex items-start sm:items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            aria-expanded={isExpanded}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{matter.name}</h3>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                        matter.status === 'Open' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                        : matter.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        {matter.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                    <span className="font-mono">ID: {matter.id}</span>
                                    {matter.practiceArea && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <span>{matter.practiceArea}</span>
                                        </>
                                    )}
                                    {attorney && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <span className="flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" />
                                                {attorney.name}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {isExpanded ? (
                                <ChevronUpIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2" />
                            ) : (
                                <ChevronDownIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2" />
                            )}
                        </button>

                        {/* Progress Bar */}
                        <div className="px-5 pb-3">
                            <div className="flex items-center gap-1">
                                {STATUS_STAGES.map((stage, idx) => (
                                    <div key={stage} className="flex-1 flex flex-col items-center">
                                        <div className={`w-full h-1.5 rounded-full ${
                                            idx <= stageIndex
                                                ? 'bg-blue-500 dark:bg-blue-400'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                        }`} />
                                        <span className={`text-[9px] mt-1 font-medium ${
                                            idx <= stageIndex
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-slate-400 dark:text-slate-600'
                                        }`}>
                                            {stage}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                                    {/* Timeline */}
                                    <div className="p-5 md:border-r border-slate-200 dark:border-slate-700">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            Case Timeline
                                        </h4>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
                                            <div className="space-y-4">
                                                {[
                                                    ...(matter.status === 'Open' ? [{ date: 'Current', title: 'Case In Progress', completed: false }] : []),
                                                    { date: matter.openDate, title: 'Case Opened', completed: true },
                                                ].map((milestone, idx) => (
                                                    <div key={idx} className="relative pl-9">
                                                        <div className={`absolute left-2 top-1 w-3 h-3 rounded-full border-2 z-10 ${
                                                            milestone.completed
                                                                ? 'bg-green-500 border-green-500 dark:bg-green-400 dark:border-green-400'
                                                                : 'bg-blue-500 border-blue-500 dark:bg-blue-400 dark:border-blue-400 animate-pulse'
                                                        }`} />
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                                            {milestone.date === 'Current' ? 'In Progress' : formatDate(milestone.date)}
                                                        </p>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{milestone.title}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming Dates & Next Steps */}
                                    <div className="p-5 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            Important Dates
                                        </h4>
                                        {upcomingEvents.length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No upcoming dates scheduled.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {upcomingEvents.slice(0, 4).map(evt => (
                                                    <div key={evt.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex flex-col items-center justify-center flex-shrink-0">
                                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none">
                                                                {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                                            </span>
                                                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300 leading-none">
                                                                {new Date(evt.date + 'T00:00:00').getDate()}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{evt.title}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{evt.startTime} - {evt.endTime}</p>
                                                            {evt.location && (
                                                                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                                                    <MapPinIcon className="w-3 h-3" />{evt.location}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {matter.description && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{matter.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


// ============================================================================
// TAB: DOCUMENTS
// ============================================================================

const DocumentsTab: React.FC<{
    documents: Document[];
    matters: Matter[];
    onSignClick: (doc: Document) => void;
}> = ({ documents, matters, onSignClick }) => {
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [showUpload, setShowUpload] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(documents.map(d => d.category?.name || 'Uncategorized'));
        return ['All', ...Array.from(cats)];
    }, [documents]);

    const filteredDocs = useMemo(
        () => categoryFilter === 'All'
            ? documents
            : documents.filter(d => (d.category?.name || 'Uncategorized') === categoryFilter),
        [documents, categoryFilter]
    );

    const groupedByMatter = useMemo(() => {
        const groups: Record<string, { matter: Matter | undefined; docs: Document[] }> = {};
        for (const doc of filteredDocs) {
            if (!groups[doc.matterId]) {
                groups[doc.matterId] = {
                    matter: matters.find(m => m.id === doc.matterId),
                    docs: [],
                };
            }
            groups[doc.matterId].docs.push(doc);
        }
        return Object.values(groups);
    }, [filteredDocs, matters]);

    const needsSignature = documents.filter(d => d.esignStatus === 'Sent' || d.esignStatus === 'Delivered');

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <FunnelIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                categoryFilter === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    Upload Document
                </button>
            </div>

            {/* Upload Placeholder */}
            {showUpload && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-8 text-center">
                    <DocumentArrowUpIcon className="w-10 h-10 text-blue-400 mx-auto" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-3">Drag and drop files here, or click to browse</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">PDF, DOCX, JPG, PNG up to 25MB</p>
                    <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Choose File
                    </button>
                </div>
            )}

            {/* Needs Signature Banner */}
            {needsSignature.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            {needsSignature.length} document{needsSignature.length > 1 ? 's' : ''} require your signature
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Please review and sign to proceed with your case.</p>
                    </div>
                </div>
            )}

            {/* Documents Grouped by Matter */}
            {groupedByMatter.length === 0 ? (
                <div className="text-center py-16">
                    <DocumentTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">No Documents</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">No documents have been shared with you yet.</p>
                </div>
            ) : (
                groupedByMatter.map(group => (
                    <div key={group.matter?.id ?? 'unknown'} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                {group.matter?.name ?? 'Unknown Matter'}
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {group.docs.map(doc => (
                                <div key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <DocumentTextIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">{doc.size}</span>
                                                <span className="text-slate-300 dark:text-slate-600 text-[11px]">|</span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(doc.uploadDate)}</span>
                                                {doc.category?.name && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-600 text-[11px]">|</span>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{doc.category.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <EsignBadge status={doc.esignStatus} />
                                        {(doc.esignStatus === 'Sent' || doc.esignStatus === 'Delivered') ? (
                                            <button
                                                onClick={() => onSignClick(doc)}
                                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                                Review & Sign
                                            </button>
                                        ) : (
                                            <button className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                Download
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const EsignBadge: React.FC<{ status?: string }> = ({ status }) => {
    const label = status && status !== 'None' ? status : 'Shared';
    let classes = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    switch (status) {
        case 'Sent': classes = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'; break;
        case 'Delivered': classes = 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'; break;
        case 'Signed': classes = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'; break;
        case 'Completed': classes = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'; break;
        case 'Failed': classes = 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'; break;
        case 'Declined': classes = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'; break;
        case 'Voided': classes = 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'; break;
    }
    return (
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${classes}`}>
            {label}
        </span>
    );
};


// ============================================================================
// TAB: BILLING & PAYMENTS
// ============================================================================

const BillingTab: React.FC<{
    invoices: Invoice[];
    matters: Matter[];
    clientId: string;
}> = ({ invoices, matters, clientId }) => {
    const { addPortalPayment, addTransaction } = useStore();
    const [payingId, setPayingId] = useState<string | null>(null);
    const [showPaymentMethod, setShowPaymentMethod] = useState(false);

    const outstanding = useMemo(
        () => invoices.filter(i => i.status !== 'Paid'),
        [invoices]
    );
    const paid = useMemo(
        () => invoices.filter(i => i.status === 'Paid'),
        [invoices]
    );
    const totalOwed = outstanding.reduce((s, i) => s + i.amount, 0);
    const overdue = outstanding.filter(i => i.status === 'Overdue');

    const handlePayInvoice = useCallback((invoice: Invoice) => {
        setPayingId(invoice.id);
        // Simulate payment processing
        setTimeout(() => {
            addPortalPayment({
                id: `PPAY-${Date.now()}`,
                matterId: invoice.matterId,
                invoiceId: invoice.id,
                amount: invoice.amount,
                paymentMethod: 'Credit Card',
                status: 'Completed',
                transactionId: `TXN-${Date.now()}`,
                processedAt: new Date().toISOString(),
                fee: Math.round(invoice.amount * 0.029 * 100) / 100,
                netAmount: Math.round(invoice.amount * 0.971 * 100) / 100,
            });
            addTransaction({
                id: `TXN-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'Payment',
                ledger: 'Operating',
                matterId: invoice.matterId,
                description: `Client portal payment for invoice ${invoice.id}`,
                amount: invoice.amount,
            });
            // Update invoice status via store
            useStore.setState(state => ({
                invoices: state.invoices.map(inv =>
                    inv.id === invoice.id ? { ...inv, status: 'Paid' as const } : inv
                )
            }));
            setPayingId(null);
        }, 1200);
    }, [addPortalPayment, addTransaction]);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding Balance</p>
                        <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">${totalOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{outstanding.length} unpaid invoice{outstanding.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue</p>
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <p className={`text-2xl font-bold mt-2 ${overdue.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                        ${overdue.reduce((s, i) => s + i.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{overdue.length} overdue invoice{overdue.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Paid</p>
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                        ${paid.reduce((s, i) => s + i.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{paid.length} paid invoice{paid.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCardIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">Payment Method</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Visa ending in 4242</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPaymentMethod(!showPaymentMethod)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                        {showPaymentMethod ? 'Hide' : 'Manage'}
                    </button>
                </div>
                {showPaymentMethod && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Payment method management is not available in this demo. In production, clients can add/remove cards and bank accounts.
                        </p>
                    </div>
                )}
            </div>

            {/* Outstanding Invoices */}
            {outstanding.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Outstanding Invoices</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {outstanding.map(invoice => {
                                const matterName = matters.find(m => m.id === invoice.matterId)?.name ?? invoice.matterId;
                                return (
                                    <div key={invoice.id} className="px-5 py-4 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{invoice.id}</p>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                                    invoice.status === 'Overdue'
                                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {matterName} | Due: {formatDate(invoice.dueDate)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <p className="text-base font-bold text-slate-800 dark:text-white">${invoice.amount.toFixed(2)}</p>
                                            <button
                                                onClick={() => handlePayInvoice(invoice)}
                                                disabled={payingId === invoice.id}
                                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                {payingId === invoice.id ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCardIcon className="w-3.5 h-3.5" />
                                                        Pay Now
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History */}
            {paid.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Payment History</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {paid.map(invoice => {
                                const matterName = matters.find(m => m.id === invoice.matterId)?.name ?? invoice.matterId;
                                return (
                                    <div key={invoice.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{invoice.id}</p>
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                                                    Paid
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{matterName}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">${invoice.amount.toFixed(2)}</p>
                                            <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                Receipt
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {invoices.length === 0 && (
                <div className="text-center py-16">
                    <CurrencyDollarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">No Invoices</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">You have no invoices at this time.</p>
                </div>
            )}
        </div>
    );
};


// ============================================================================
// TAB: MESSAGES
// ============================================================================

const MessagesTab: React.FC<{ clientName: string }> = ({ clientName }) => {
    const [messages, setMessages] = useState<PortalMessage[]>([
        { id: 'MSG-WELCOME', from: 'Firm', text: `Welcome to the secure messaging portal, ${clientName.split(' ')[0]}. Feel free to reach out with any questions about your case.`, timestamp: new Date().toISOString() },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [attachFile, setAttachFile] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = useCallback(() => {
        if (!newMessage.trim()) return;
        const msg: PortalMessage = {
            id: `MSG-${Date.now()}`,
            from: 'Client',
            text: newMessage.trim(),
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        setAttachFile(false);

        // Simulate firm auto-reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: `MSG-${Date.now()}-reply`,
                from: 'Firm',
                text: 'Thank you for your message. An attorney will review and respond within one business day.',
                timestamp: new Date().toISOString(),
            }]);
        }, 1500);
    }, [newMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[600px]">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Secure Messages</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">All messages are encrypted end-to-end</p>
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.from === 'Client' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            msg.from === 'Client'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'
                        }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <div className={`flex items-center gap-1.5 mt-1 ${
                                msg.from === 'Client' ? 'justify-end' : 'justify-start'
                            }`}>
                                <p className={`text-[10px] ${
                                    msg.from === 'Client' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                    {timeAgo(msg.timestamp)}
                                </p>
                                {msg.from === 'Client' && (
                                    <CheckCircleIcon className="w-3 h-3 text-blue-200" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                {attachFile && (
                    <div className="mb-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">File attachment coming soon. This feature is a placeholder.</p>
                        <button
                            onClick={() => setAttachFile(false)}
                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                            Remove
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <button
                        onClick={() => setAttachFile(!attachFile)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                        aria-label="Attach file"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={2}
                        placeholder="Type a secure message..."
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors flex-shrink-0"
                        aria-label="Send message"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};


// ============================================================================
// TAB: CALENDAR
// ============================================================================

const CalendarTab: React.FC<{
    events: Event[];
    matters: Matter[];
}> = ({ events, matters }) => {
    const [showRequest, setShowRequest] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const sortedEvents = useMemo(
        () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
        [events]
    );
    const upcoming = sortedEvents.filter(e => e.date >= today);
    const past = sortedEvents.filter(e => e.date < today);

    const eventTypeColors: Record<string, string> = {
        'Meeting': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        'Deposition': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        'Court Hearing': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        'Call': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Your Appointments</h3>
                <button
                    onClick={() => setShowRequest(!showRequest)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Request Appointment
                </button>
            </div>

            {/* Request Appointment Form */}
            {showRequest && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-3">Request an Appointment</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1">Preferred Date</label>
                            <input type="date" className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1">Preferred Time</label>
                            <input type="time" className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1">Reason</label>
                            <textarea className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none" rows={2} placeholder="Brief description of what you'd like to discuss..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={() => setShowRequest(false)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { setShowRequest(false); alert('Appointment request submitted. The firm will confirm shortly.'); }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            {upcoming.length > 0 ? (
                <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Upcoming</h4>
                    <div className="space-y-3">
                        {upcoming.map(evt => {
                            const matterName = matters.find(m => m.id === evt.matterId)?.name ?? evt.matterId;
                            const colorClasses = eventTypeColors[evt.type] || eventTypeColors['Meeting'];
                            return (
                                <div key={evt.id} className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm`}>
                                    <div className="flex items-stretch">
                                        {/* Date sidebar */}
                                        <div className={`w-20 flex flex-col items-center justify-center py-4 flex-shrink-0 ${colorClasses}`}>
                                            <span className="text-[10px] font-bold uppercase leading-none">
                                                {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-bold leading-none mt-0.5">
                                                {new Date(evt.date + 'T00:00:00').getDate()}
                                            </span>
                                            <span className="text-[10px] font-medium leading-none mt-0.5">
                                                {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                        </div>
                                        {/* Details */}
                                        <div className="flex-1 p-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{evt.title}</h4>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${colorClasses}`}>
                                                    {evt.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {evt.startTime} - {evt.endTime} | {matterName}
                                            </p>
                                            {evt.location && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {evt.location}
                                                </p>
                                            )}
                                            {evt.description && (
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{evt.description}</p>
                                            )}
                                            {evt.attendees && evt.attendees.length > 0 && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {evt.attendees.length} attendee{evt.attendees.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                    <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">No Upcoming Appointments</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Request an appointment using the button above.</p>
                </div>
            )}

            {/* Past Events */}
            {past.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Past Events</h4>
                    <div className="space-y-2">
                        {past.slice(-5).reverse().map(evt => {
                            const matterName = matters.find(m => m.id === evt.matterId)?.name ?? evt.matterId;
                            return (
                                <div key={evt.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3 flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{evt.title}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(evt.date)} | {matterName}</p>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{evt.type}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


export default ClientPortal;
