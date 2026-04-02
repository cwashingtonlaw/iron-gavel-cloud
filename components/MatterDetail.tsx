
import React, { useState, useEffect } from 'react';
import { Matter, Task, Document, Communication, Contact, User, InternalNote } from '../types';
import { MOCK_TASKS, MOCK_DOCUMENTS, MOCK_COMMUNICATIONS, MOCK_CONTACTS, MOCK_TRANSACTIONS, MOCK_CUSTOM_FIELDS, MOCK_USERS, MOCK_INTERNAL_NOTES, CURRENT_USER, MOCK_PIPELINES } from '../constants';
import { ArrowLeftIcon, PlusIcon, DocumentTextIcon, EnvelopeIcon, PhoneIcon, UsersIcon, DocumentDuplicateIcon, LockClosedIcon, BanknotesIcon, FolderIcon, ClockIcon, DocumentArrowUpIcon, PencilSquareIcon, EyeIcon, AtSymbolIcon, BriefcaseIcon, CheckCircleIcon, MagnifyingGlassIcon, SparklesIcon, ShieldCheckIcon, ScaleIcon, CheckBadgeIcon } from './icons';
import DocumentAutomationModal from './DocumentAutomationModal';
import LogEmailModal from './LogEmailModal';
import DocumentReviewModal from './DocumentReviewModal';
import RequestSignatureModal from './RequestSignatureModal';
import MatterAccessTab from './MatterAccessTab';
import CaseSummaryModal from './CaseSummaryModal';
import { findLegalPrecedent, generateClientUpdate } from '../services/geminiService';
import DiscoveryTab from './DiscoveryTab';
import SettlementCalculator from './SettlementCalculator';
import { searchCaseLawDatabase } from '../services/caseLawDatabase';

interface MatterDetailProps {
    matter: Matter;
    onBack: () => void;
}

const TABS = ['Overview', 'Stages', 'Research', 'Responsible Attorney', 'Practice Area', 'Tasks', 'Documents', 'Communications', 'Contacts', 'Discovery', 'Settlement', 'Access'];

const MatterDetail: React.FC<MatterDetailProps> = ({ matter, onBack }) => {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isLogEmailModalOpen, setIsLogEmailModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [selectedDocToReview, setSelectedDocToReview] = useState<Document | null>(null);
    const [selectedDocToSign, setSelectedDocToSign] = useState<Document | null>(null);

    const relatedTasks = MOCK_TASKS.filter(task => task.matterId === matter.id);
    const relatedDocuments = MOCK_DOCUMENTS.filter(doc => doc.matterId === matter.id);
    const relatedCommunications = MOCK_COMMUNICATIONS.filter(comm => comm.matterId === matter.id);
    const relatedContacts = MOCK_CONTACTS.filter(contact => contact.associatedMatters.includes(matter.id));

    const getStatusPill = (status: Matter['status']) => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-slate-100 text-slate-600';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Stages':
                return <StagesTab matter={matter} />;
            case 'Research':
                return <ResearchTab matter={matter} />;
            case 'Responsible Attorney':
                return <ResponsibleAttorneyTab matter={matter} />;
            case 'Practice Area':
                return <PracticeAreaTab matter={matter} />;
            case 'Tasks':
                return <TasksTab tasks={relatedTasks} />;
            case 'Documents':
                return <DocumentsTab documents={relatedDocuments} onGenerateClick={() => setIsDocModalOpen(true)} onReviewClick={setSelectedDocToReview} onRequestSignature={setSelectedDocToSign} />;
            case 'Communications':
                return <CommunicationsTab communications={relatedCommunications} onLogEmailClick={() => setIsLogEmailModalOpen(true)} matter={matter} />;
            case 'Contacts':
                return <ContactsTab contacts={relatedContacts} />;
            case 'Discovery':
                return <DiscoveryTab matter={matter} />;
            case 'Settlement':
                return <SettlementCalculator matter={matter} />;
            case 'Access':
                return <MatterAccessTab matter={matter} />;
            case 'Overview':
            default:
                return <OverviewTab matter={matter} />;
        }
    };

    return (
        <>
            <div className="space-y-6">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to All Matters
                </button>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{matter.name}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <p className="text-slate-500 text-sm sm:text-base">Client: <span className="font-medium text-slate-700">{matter.client}</span></p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusPill(matter.status)}`}>{matter.status}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSummaryModalOpen(true)}
                        className="flex items-center bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Generate AI Summary
                    </button>
                </div>

                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6">
                    {renderContent()}
                </div>
            </div>
            {isDocModalOpen && (<DocumentAutomationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} matter={matter} contacts={relatedContacts} />)}
            {isLogEmailModalOpen && (<LogEmailModal isOpen={isLogEmailModalOpen} onClose={() => setIsLogEmailModalOpen(false)} />)}
            {isSummaryModalOpen && (<CaseSummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} matter={matter} />)}
            {selectedDocToReview && <DocumentReviewModal isOpen={!!selectedDocToReview} onClose={() => setSelectedDocToReview(null)} document={selectedDocToReview} />}
            {selectedDocToSign && <RequestSignatureModal isOpen={!!selectedDocToSign} onClose={() => setSelectedDocToSign(null)} document={selectedDocToSign} contacts={relatedContacts} />}
        </>
    );
};

// --- New Research Tab (CaseFlow Work) ---
const ResearchTab: React.FC<{ matter: Matter }> = ({ matter }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGrounded, setIsGrounded] = useState(false);

    useEffect(() => {
        const localPrecedents = searchCaseLawDatabase(matter.practiceArea);
        setIsGrounded(localPrecedents.length > 0);
    }, [matter.practiceArea]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;
        setIsLoading(true);
        try {
            const data = await findLegalPrecedent(matter, query);
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    {isGrounded ? (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                            <ShieldCheckIcon className="w-4 h-4" />
                            RAG Enabled: Local Grounding
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                            <SparklesIcon className="w-4 h-4" />
                            Gemini Global Search
                        </div>
                    )}
                </div>

                <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2.5 rounded-xl mr-4">
                        <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Legal Research</h2>
                        <p className="text-sm text-slate-500">Search for precedents and statutes relevant to this matter.</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-4 mb-8 mt-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., standard for summary judgment in contract disputes"
                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <button disabled={isLoading} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center gap-2">
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-4 h-4" />
                                Find Precedent
                            </>
                        )}
                    </button>
                </form>

                <div className="space-y-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
                                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                                <div className="h-3 bg-slate-200 rounded w-5/6" />
                            </div>
                        ))
                    ) : results.length > 0 ? (
                        results.map((res, idx) => (
                            <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-sm group">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-blue-800 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{res.citation}</h3>
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                        <ScaleIcon className="w-3.5 h-3.5" />
                                        Verified Citation
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4">{res.summary}</p>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                        <CheckBadgeIcon className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                                        Key Holding
                                    </p>
                                    <p className="text-sm font-medium text-slate-800">{res.holding}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Enter a legal question above to begin research.</p>
                            <p className="text-xs text-slate-400 mt-2">AI will search the firm's global legal library and indexed precedents.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const StagesTab: React.FC<{ matter: Matter }> = ({ matter }) => {
    const pipeline = MOCK_PIPELINES.find(p => p.practiceArea === matter.practiceArea);

    if (!pipeline) {
        return <div className="text-center py-8 text-slate-500">No workflow pipeline defined for this practice area.</div>;
    }

    const currentStageIndex = pipeline.stages.findIndex(s => s.id === matter.stageId);
    const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Matter Progress</h2>
                    <div className="text-sm text-slate-500">Practice Area: <span className="font-medium text-slate-700">{pipeline.practiceArea}</span></div>
                </div>

                <nav aria-label="Progress">
                    <ol role="list" className="overflow-hidden rounded-md lg:flex lg:rounded-none lg:border-l lg:border-r lg:border-slate-200">
                        {pipeline.stages.map((stage, stepIdx) => {
                            const isCompleted = stepIdx < activeIndex;
                            const isCurrent = stepIdx === activeIndex;

                            return (
                                <li key={stage.id} className="relative overflow-hidden lg:flex-1">
                                    <div className={`border border-slate-200 overflow-hidden lg:border-0 ${stepIdx === 0 ? 'rounded-t-md lg:rounded-none' : ''} ${stepIdx === pipeline.stages.length - 1 ? 'rounded-b-md lg:rounded-none' : ''}`}>
                                        <div className="group">
                                            <span
                                                className={`absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-slate-200 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full ${isCurrent ? 'bg-blue-600' : isCompleted ? 'bg-green-600' : ''
                                                    }`}
                                                aria-hidden="true"
                                            />
                                            <span className={`flex items-start px-6 py-5 text-sm font-medium ${isCurrent ? 'bg-blue-50' : ''}`}>
                                                <span className="flex-shrink-0">
                                                    {isCompleted ? (
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                                                            <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                                        </span>
                                                    ) : isCurrent ? (
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600">
                                                            <span className="text-blue-600">{stepIdx + 1}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300">
                                                            <span className="text-slate-500">{stepIdx + 1}</span>
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                                    <span className={`text-sm font-medium ${isCompleted ? 'text-slate-900' : isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>{stage.name}</span>
                                                    <span className="text-xs text-slate-500">{isCurrent ? 'Current Stage' : isCompleted ? 'Completed' : 'Upcoming'}</span>
                                                </span>
                                            </span>
                                        </div>
                                        {stepIdx !== 0 && (
                                            <>
                                                <div className="absolute left-0 top-0 hidden -ml-px mt-0.5 h-full w-0.5 bg-slate-200 lg:block" aria-hidden="true" />
                                            </>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                </nav>

                <div className="mt-8 flex justify-end">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                        Advance to Next Stage
                    </button>
                </div>
            </div>
        </div>
    )
}

const ResponsibleAttorneyTab: React.FC<{ matter: Matter }> = ({ matter }) => {
    const attorney = MOCK_USERS.find(u => u.id === matter.responsibleAttorneyId);

    if (!attorney) return <div className="p-6 text-slate-500">No responsible attorney assigned.</div>;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl">
            <div className="flex items-start gap-6">
                <img src={attorney.avatarUrl} alt={attorney.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50" />
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{attorney.name}</h3>
                    <p className="text-blue-600 font-medium">{attorney.role}</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p className="flex items-center"><EnvelopeIcon className="w-4 h-4 mr-2" /> {attorney.email}</p>
                        <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2" /> 555-0123 (Ext. 10{attorney.id.split('_')[1]})</p>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">Attorney Bio</h4>
                <p className="text-sm text-slate-600">
                    {attorney.name} is a seasoned {attorney.role.toLowerCase()} at Great Elephant Law, specializing in complex matters.
                    With a focus on client success, they bring extensive experience to this case.
                </p>
            </div>
        </div>
    )
}

const PracticeAreaTab: React.FC<{ matter: Matter }> = ({ matter }) => {
    const resources = [
        "Standard Operating Procedures",
        "Relevant Case Law Database",
        "Practice Area Guidelines",
        "Document Templates"
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                        <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{matter.practiceArea || 'General Practice'}</h2>
                        <p className="text-slate-500">Practice Area Overview</p>
                    </div>
                </div>
                <div className="prose prose-sm text-slate-600 max-w-none">
                    <p>
                        This matter falls under the <strong>{matter.practiceArea || 'General'}</strong> practice area.
                        Ensure all filings and procedures adhere to the firm's standards for this specific domain.
                    </p>
                    <p>
                        Key compliance requirements and statutory deadlines for {matter.practiceArea || 'this area'} should be monitored closely in the Tasks tab.
                    </p>
                </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                <h3 className="font-semibold text-slate-800 mb-4">Quick Resources</h3>
                <ul className="space-y-3">
                    {resources.map((resource, idx) => (
                        <li key={idx} className="flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors">
                            <DocumentTextIcon className="w-5 h-5 text-slate-400 mr-3" />
                            <span className="text-sm font-medium text-slate-700">{resource}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

const OverviewTab: React.FC<{ matter: Matter }> = ({ matter }) => {
    const matterTrustBalance = MOCK_TRANSACTIONS.reduce((balance, transaction) => {
        if (transaction.matterId !== matter.id) { return balance; }
        if (transaction.toAccount === 'ACC_TR_1') return balance + transaction.amount;
        if (transaction.fromAccount === 'ACC_TR_1') return balance - transaction.amount;
        return balance;
    }, 0);

    const customFieldsToShow = MOCK_CUSTOM_FIELDS.filter(field => matter.customFields && matter.customFields[field.id]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Case Notes</h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap">{matter.notes}</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-500">Trust Account Balance</h3>
                        <div className="text-slate-400"><BanknotesIcon className="w-6 h-6" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-800">${matterTrustBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-slate-500 mt-1">Available funds for this matter.</p>
                </div>
                {customFieldsToShow.length > 0 && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200">
                        <h3 className="font-medium text-slate-800 mb-3">Custom Fields</h3>
                        <div className="space-y-2">
                            {customFieldsToShow.map(field => (
                                <div key={field.id}>
                                    <p className="text-sm text-slate-500">{field.name}</p>
                                    <p className="font-medium text-slate-700">{matter.customFields![field.id]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const TasksTab: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const getPriorityPill = (priority: Task['priority']) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Low': return 'bg-green-100 text-green-800';
        }
    };
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                    <tr>
                        <th className="p-4 font-semibold text-slate-600">Status</th>
                        <th className="p-4 font-semibold text-slate-600">Description</th>
                        <th className="p-4 font-semibold text-slate-600">Due Date</th>
                        <th className="p-4 font-semibold text-slate-600">Priority</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => (
                        <tr key={task.id} className="border-t border-slate-200">
                            <td className="p-4"><input type="checkbox" defaultChecked={task.completed} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                            <td className={`p-4 font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>{task.description}</td>
                            <td className="p-4 text-slate-600">{task.dueDate}</td>
                            <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityPill(task.priority)}`}>{task.priority}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const DocumentsTab: React.FC<{ documents: Document[], onGenerateClick: () => void, onReviewClick: (doc: Document) => void, onRequestSignature: (doc: Document) => void }> = ({ documents, onGenerateClick, onReviewClick, onRequestSignature }) => {
    const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

    const documentsByFolder = documents.reduce((acc, doc) => {
        const folder = doc.folder || 'Uncategorized';
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    const getEsignStatusPill = (status: Document['esignStatus']) => {
        if (!status || status === 'None') return null;
        switch (status) {
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Delivered': return 'bg-indigo-100 text-indigo-800';
            case 'Signed': return 'bg-emerald-100 text-emerald-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Failed': return 'bg-red-100 text-red-800';
            case 'Declined': return 'bg-orange-100 text-orange-800';
            case 'Voided': return 'bg-slate-300 text-slate-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-wrap justify-between items-center border-b border-slate-200 gap-2">
                <h3 className="font-semibold text-base sm:text-lg">Matter Documents</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={onGenerateClick} className="flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <DocumentDuplicateIcon className="w-4 h-4 mr-2" /> Generate
                    </button>
                    <button className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        <PlusIcon className="w-4 h-4 mr-2" /> Upload
                    </button>
                </div>
            </div>
            {Object.entries(documentsByFolder).map(([folder, docs]) => (
                <div key={folder}>
                    <div className="px-4 py-2 bg-slate-50 border-b border-t border-slate-200">
                        <h4 className="font-semibold text-sm text-slate-600 flex items-center">
                            <FolderIcon className="w-5 h-5 mr-2 text-slate-400" /> {folder}
                        </h4>
                    </div>
                    {/* FIX: Cast `docs` to `Document[]` to resolve a type inference issue where it was being treated as 'unknown'. */}
                    {(docs as Document[]).map((doc) => (
                        <React.Fragment key={doc.id}>
                            <div className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer p-4" onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="font-medium text-blue-600 flex items-center">
                                        <DocumentTextIcon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{doc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
                                        {getEsignStatusPill(doc.esignStatus) && <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEsignStatusPill(doc.esignStatus)}`}>{doc.esignStatus}</span>}
                                        <span className="text-xs text-slate-500">Uploaded: {doc.uploadDate}</span>
                                        <span className="text-xs font-medium text-slate-500">v{doc.versions.length}.0</span>
                                    </div>
                                </div>
                            </div>
                            {expandedDocId === doc.id && (
                                <div className="bg-slate-100 p-4 border-t border-slate-200">
                                    <h5 className="font-semibold text-xs mb-2 text-slate-600">Version History</h5>
                                    <ul className="space-y-2 mb-3">
                                        {doc.versions.sort((a, b) => b.version - a.version).map(v => (
                                            <li key={v.version} className="flex justify-between items-center text-xs p-2 rounded-md bg-white border border-slate-200">
                                                <div className="flex items-center">
                                                    <ClockIcon className="w-4 h-4 mr-2 text-slate-400" />
                                                    Version {v.version}.0 uploaded by <span className="font-medium mx-1 text-slate-800">{v.uploader}</span> on {v.date}
                                                </div>
                                                <button className="text-slate-500 hover:text-blue-600 font-medium">Download</button>
                                            </li>
                                        ))}
                                    </ul>
                                    <h5 className="font-semibold text-xs mb-2 mt-4 text-slate-600">Actions</h5>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><DocumentArrowUpIcon className="w-4 h-4 mr-1" /> Upload New Version</button>
                                        <button onClick={() => onRequestSignature(doc)} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><PencilSquareIcon className="w-4 h-4 mr-1" /> Request Signature</button>
                                        <button onClick={() => onReviewClick(doc)} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><EyeIcon className="w-4 h-4 mr-1" /> Review with AI</button>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            ))}
        </div>
    );
};


const CommunicationsTab: React.FC<{ communications: Communication[], onLogEmailClick: () => void, matter: Matter }> = ({ communications, onLogEmailClick, matter }) => {
    const [draftUpdate, setDraftUpdate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDraftUpdate = async () => {
        setIsGenerating(true);
        try {
            // Simulate recent activity from mock tasks/notes
            const recentActivity = `Case opened on ${matter.openDate}. Current status: ${matter.status}. Notes: ${matter.notes}`;
            const update = await generateClientUpdate(matter, recentActivity);
            setDraftUpdate(update);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const CommIcon = ({ type }: { type: Communication['type'] }) => {
        if (type === 'Email') return <EnvelopeIcon className="w-5 h-5 text-blue-500" />;
        if (type === 'Call') return <PhoneIcon className="w-5 h-5 text-green-500" />;
        if (type === 'Meeting') return <UsersIcon className="w-5 h-5 text-purple-500" />;
        return null;
    }
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Internal Notes</h3>
                </div>
                <div className="space-y-4 h-96 flex flex-col">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {MOCK_INTERNAL_NOTES.map(note => {
                            const user = MOCK_USERS.find(u => u.id === note.userId);
                            return (
                                <div key={note.id} className="flex items-start gap-3">
                                    <img src={user?.avatarUrl} alt={user?.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-sm">{user?.name} <span className="text-xs text-slate-400 font-normal">{note.timestamp}</span></p>
                                        <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: note.text.replace(/@(\w+)/g, '<strong class="text-blue-600">@$1</strong>') }}></p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-200">
                        <textarea className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" rows={2} placeholder="Add an internal note... use @ to mention a colleague."></textarea>
                        <button className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add Note</button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Communication Log</h3>
                    <div className="flex gap-2">
                        <button onClick={handleDraftUpdate} disabled={isGenerating} className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50">
                            <SparklesIcon className="w-4 h-4 mr-1" /> {isGenerating ? 'Drafting...' : 'Draft Client Update'}
                        </button>
                        <button onClick={onLogEmailClick} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                            <PlusIcon className="w-4 h-4 mr-1" /> Log Email
                        </button>
                    </div>
                </div>
                {draftUpdate && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg relative">
                        <p className="text-xs font-bold text-purple-700 mb-1">AI Drafted Update:</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{draftUpdate}</p>
                        <button onClick={() => setDraftUpdate('')} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><span className="sr-only">Close</span>×</button>
                    </div>
                )}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {communications.map(comm => (
                        <div key={comm.id} className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50/70">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200"><CommIcon type={comm.type} /></div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800">{comm.subject}</p>
                                <p className="text-sm text-slate-500 mt-1">{comm.summary}</p>
                                <p className="text-xs text-slate-400 mt-2">{comm.date} - with {comm.participants.join(', ')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ContactsTab: React.FC<{ contacts: Contact[] }> = ({ contacts }) => {
    const getTypePill = (type: Contact['type']) => {
        switch (type) {
            case 'Client': case 'Potential Client': return 'bg-blue-100 text-blue-800';
            case 'Counsel': return 'bg-purple-100 text-purple-800';
            case 'Witness': return 'bg-orange-100 text-orange-800';
        }
    };
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                    <tr>
                        <th className="p-4 font-semibold text-slate-600">Name</th>
                        <th className="p-4 font-semibold text-slate-600">Email</th>
                        <th className="p-4 font-semibold text-slate-600 hidden sm:table-cell">Phone</th>
                        <th className="p-4 font-semibold text-slate-600">Type</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact) => (
                        <tr key={contact.id} className="border-t border-slate-200 bg-white hover:bg-slate-50">
                            <td className="p-4 font-medium text-slate-800">{contact.name}</td>
                            <td className="p-4 text-slate-600">{contact.email}</td>
                            <td className="p-4 text-slate-600 hidden sm:table-cell">{contact.phone}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypePill(contact.type)}`}>
                                    {contact.type}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MatterDetail;
