import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Matter, Contact } from '../types';
import { useStore } from '../store/useStore';
import { MOCK_USERS } from '../constants';
import {
    PlusIcon, MagnifyingGlassIcon, FunnelIcon, EllipsisHorizontalIcon,
    ClockIcon, CheckCircleIcon, ExclamationCircleIcon, CurrencyDollarIcon,
    CalendarIcon, UserIcon, TrashIcon, ListBulletIcon, Squares2X2Icon, SparklesIcon, BriefcaseIcon, XMarkIcon, PencilSquareIcon
} from './icons';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
// react-window v2 uses different exports
// import { FixedSizeList as List } from 'react-window';
// ... other imports
import AddMatterModal from './AddMatterModal';
import AddContactModal from './AddContactModal';
import CaseSummaryModal from './CaseSummaryModal';
import TimelineView from './TimelineView';
import MatterDetail from './MatterDetail';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

interface MattersProps {
    filters?: any;
}

const Matters: React.FC<MattersProps> = ({ filters }) => {
    const navigate = useNavigate();
    const { matters, pipelines, addMatter, updateMatter, deleteMatter, contacts, updateContact, addToast } = useStore();
    const [viewMode, setViewMode] = useState<'Board' | 'List' | 'Timeline'>('Board');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || '');
    const [isAddMatterModalOpen, setIsAddMatterModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Summary Modal State
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [matterForSummary, setMatterForSummary] = useState<Matter | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [matterToDelete, setMatterToDelete] = useState<string | null>(null);

    // Context Menu State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Viewing Matter Detail
    const [viewingMatter, setViewingMatter] = useState<Matter | null>(null);

    // Contact Modal State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const activePipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
    const currentStages = activePipeline ? activePipeline.stages : [];

    const handleAddMatter = (newMatter: Matter) => {
        addMatter(newMatter);
        addToast('Matter created successfully', 'success');
    };

    const handleDeleteMatter = (matterId: string) => {
        setMatterToDelete(matterId);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmDeleteMatter = () => {
        if (matterToDelete) {
            deleteMatter(matterToDelete);
            setMatterToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleClientClick = (e: React.MouseEvent, clientName: string) => {
        e.stopPropagation();
        const contact = contacts.find(c => c.name === clientName);
        if (contact) {
            setSelectedContact(contact);
            setIsContactModalOpen(true);
        }
    };

    const handleGenerateSummary = (e: React.MouseEvent, matter: Matter) => {
        e.stopPropagation();
        setMatterForSummary(matter);
        setIsSummaryModalOpen(true);
    };

    const toggleMatterStatus = (matterId: string, currentStatus: Matter['status']) => {
        const matter = matters.find(m => m.id === matterId);
        if (matter) {
            const newStatus = currentStatus === 'Open' ? 'Pending' : 'Open';
            updateMatter({ ...matter, status: newStatus });
        }
        setOpenMenuId(null);
    };

    const closeMatter = (matterId: string) => {
        const matter = matters.find(m => m.id === matterId);
        if (matter) {
            updateMatter({ ...matter, status: 'Closed' });
        }
        setOpenMenuId(null);
    };

    const calculateDaysInStage = (dateStr?: string) => {
        if (!dateStr) return 0;
        const start = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const matter = matters.find(m => m.id === draggableId);
        if (matter) {
            const updatedMatter = {
                ...matter,
                stageId: destination.droppableId,
                lastStageChangeDate: new Date().toISOString().split('T')[0]
            };
            updateMatter(updatedMatter);
        }
    };

    const getStatusPill = (status: Matter['status']) => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-slate-100 text-slate-600';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
        }
    };

    // Filter matters based on search and pipeline
    const filteredMatters = matters.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.client.toLowerCase().includes(searchTerm.toLowerCase());
        // For board view, we might want to filter by pipeline practice area if needed
        // But currently matters don't strictly link to a pipeline ID, just practice area string
        // We'll assume for now we show all matters in list, and filter by stage in board
        return matchesSearch;
    });

    const boardMatters = filteredMatters.filter(m =>
        m.practiceArea === activePipeline?.practiceArea && m.status !== 'Closed'
    );

    const unassignedMatters = boardMatters.filter(m => !m.stageId || !currentStages.find(s => s.id === m.stageId));

    if (viewingMatter) {
        return <MatterDetail matter={viewingMatter} onBack={() => setViewingMatter(null)} />;
    }

    return (
        <>
            <div className="flex flex-col h-full space-y-6" onClick={() => setOpenMenuId(null)}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Matters</h1>
                        <p className="text-slate-500 mt-1">Manage all your cases from a single dashboard.</p>
                    </div>
                    <button
                        onClick={() => setIsAddMatterModalOpen(true)}
                        className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New Matter
                    </button>
                </div>

                {/* Navigation & Filters Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4 flex-shrink-0">
                    <div className="flex space-x-6">
                        <button
                            onClick={() => setViewMode('List')}
                            className={`flex items-center pb-1 text-sm font-medium border-b-2 transition-colors ${viewMode === 'List' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <ListBulletIcon className="w-4 h-4 mr-2" />
                            Matters
                        </button>
                        <button
                            onClick={() => setViewMode('Board')}
                            className={`flex items-center pb-1 text-sm font-medium border-b-2 transition-colors ${viewMode === 'Board' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <Squares2X2Icon className="w-4 h-4 mr-2" />
                            Board
                        </button>
                        <button
                            onClick={() => setViewMode('Timeline')}
                            className={`flex items-center pb-1 text-sm font-medium border-b-2 transition-colors ${viewMode === 'Timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Timeline
                        </button>
                    </div>
                    {viewMode === 'Board' && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600 font-medium">Practice Area:</label>
                                <select
                                    value={selectedPipelineId}
                                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                                    className="text-sm border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
                                >
                                    {pipelines.map(pipeline => (
                                        <option key={pipeline.id} value={pipeline.id}>{pipeline.practiceArea}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {viewMode === 'List' ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-12 w-full" count={5} />
                            </div>
                        ) : filteredMatters.length > 0 ? (
                            <>
                                {filteredMatters.length > 0 && (
                                    <div className="p-3 bg-blue-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter italic">Collaborator Updating Records...</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">Showing {filteredMatters.length} results</span>
                                    </div>
                                )}
                                {/* Desktop Table Header */}
                                <table className="w-full text-sm hidden md:table">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-left">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-1/5">Matter Name</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-1/8">Client</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-1/8">Practice Area</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-1/6">Resp. Attorney</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-1/12">Status</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-1/10">Open Date</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="hidden md:block max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {filteredMatters.map((matter, index) => (
                                                <MatterRow key={matter.id} index={index} style={{}} data={{ filteredMatters, setViewingMatter, handleClientClick, handleGenerateSummary, getStatusPill, navigate }} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Card View */}
                                <div className="md:hidden">
                                    {filteredMatters.map(matter => (
                                        <div key={matter.id} className="p-4 border-b border-slate-200" onClick={() => setViewingMatter(matter)}>
                                            <div className="flex justify-between items-center">
                                                <p className="font-medium text-blue-600">{matter.name}</p>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusPill(matter.status)}`}>{matter.status}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Client: <button onClick={(e) => handleClientClick(e, matter.client)} className="text-blue-600 hover:underline">{matter.client}</button>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Attorney: <span className="font-medium text-slate-700 dark:text-slate-300">{MOCK_USERS.find(u => u.id === matter.responsibleAttorneyId)?.name || 'Unassigned'}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">Opened: {matter.openDate}</p>
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/matters/edit/${matter.id}`); }}
                                                    className="flex-1 flex items-center justify-center bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4 mr-1.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => handleGenerateSummary(e, matter)}
                                                    className="flex-1 flex items-center justify-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                                                    Summary
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <EmptyState
                                title="No matters found"
                                description="Get started by adding a new matter to track your cases."
                                icon={<BriefcaseIcon />}
                                action={{
                                    label: "Create First Matter",
                                    onClick: () => setIsAddMatterModalOpen(true)
                                }}
                            />
                        )}
                    </div>
                ) : viewMode === 'Timeline' ? (
                    <TimelineView />
                ) : (
                    // KANBAN VIEW
                    <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-100 rounded-xl border border-slate-200">
                        {isLoading ? (
                            <div className="flex space-x-4 p-4">
                                <Skeleton className="h-full w-80" count={3} />
                            </div>
                        ) : (
                            <div className="h-full flex space-x-4 p-4 min-w-max">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    {/* No Stage Assigned Column */}
                                    {unassignedMatters.length > 0 && (
                                        <Droppable droppableId="unassigned">
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className="w-80 flex-shrink-0 flex flex-col h-full max-h-full bg-slate-200/50 rounded-xl border-2 border-dashed border-slate-300"
                                                >
                                                    <div className="p-3 font-semibold text-slate-700 flex justify-between items-center border-b border-slate-300 bg-slate-200/50 rounded-t-lg">
                                                        No Stage Assigned
                                                        <span className="bg-slate-300 text-slate-700 text-xs px-2 py-0.5 rounded-full">{unassignedMatters.length}</span>
                                                    </div>
                                                    <div className="p-2 overflow-y-auto flex-1 space-y-3">
                                                        {unassignedMatters.map((matter, index) => (
                                                            <Draggable key={matter.id} draggableId={matter.id} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                    >
                                                                        <MatterCard
                                                                            matter={matter}
                                                                            onClick={() => setViewingMatter(matter)}
                                                                            daysInStage={calculateDaysInStage(matter.lastStageChangeDate)}
                                                                            onToggleStatus={() => toggleMatterStatus(matter.id, matter.status)}
                                                                            onCloseMatter={() => closeMatter(matter.id)}
                                                                            onDeleteMatter={() => handleDeleteMatter(matter.id)}
                                                                            isMenuOpen={openMenuId === matter.id}
                                                                            onToggleMenu={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === matter.id ? null : matter.id); }}
                                                                            onClientClick={(e) => handleClientClick(e, matter.client)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                    )}

                                    {currentStages.map(stage => {
                                        const stageMatters = boardMatters.filter(m => m.stageId === stage.id);
                                        return (
                                            <Droppable key={stage.id} droppableId={stage.id}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className="w-80 flex-shrink-0 flex flex-col h-full max-h-full bg-slate-100 rounded-xl border border-slate-200"
                                                    >
                                                        <div className="p-3 font-semibold text-slate-700 flex justify-between items-center border-b border-slate-200 bg-slate-200 rounded-t-lg">
                                                            <span>{stage.name}</span>
                                                            <span className="bg-white text-slate-600 text-xs px-2 py-0.5 rounded-full">{stageMatters.length}</span>
                                                        </div>
                                                        <div className="p-2 overflow-y-auto flex-1 space-y-3 min-h-[100px]">
                                                            {stageMatters.map((matter, index) => (
                                                                <Draggable key={matter.id} draggableId={matter.id} index={index}>
                                                                    {(provided) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                        >
                                                                            <MatterCard
                                                                                matter={matter}
                                                                                onClick={() => setViewingMatter(matter)}
                                                                                daysInStage={calculateDaysInStage(matter.lastStageChangeDate)}
                                                                                onToggleStatus={() => toggleMatterStatus(matter.id, matter.status)}
                                                                                onCloseMatter={() => closeMatter(matter.id)}
                                                                                onDeleteMatter={() => handleDeleteMatter(matter.id)}
                                                                                isMenuOpen={openMenuId === matter.id}
                                                                                onToggleMenu={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === matter.id ? null : matter.id); }}
                                                                                onClientClick={(e) => handleClientClick(e, matter.client)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    </div>
                                                )}
                                            </Droppable>
                                        );
                                    })}
                                </DragDropContext>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {matterForSummary && (
                <CaseSummaryModal
                    isOpen={isSummaryModalOpen}
                    onClose={() => setIsSummaryModalOpen(false)}
                    matter={matterForSummary}
                />
            )}

            <AddMatterModal
                isOpen={isAddMatterModalOpen}
                onClose={() => setIsAddMatterModalOpen(false)}
                onAddMatter={handleAddMatter}
            />

            {selectedContact && (
                <AddContactModal
                    isOpen={isContactModalOpen}
                    onClose={() => { setIsContactModalOpen(false); setSelectedContact(null); }}
                    onAddContact={() => { }}
                    contact={selectedContact}
                    onUpdateContact={updateContact}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Matter</h3>
                        <p className="text-slate-600 mb-6">Are you sure you want to delete this matter? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteMatter}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

interface MatterCardProps {
    matter: Matter;
    onClick: () => void;
    daysInStage: number;
    onToggleStatus: () => void;
    onCloseMatter: () => void;
    onDeleteMatter: () => void;
    isMenuOpen: boolean;
    onToggleMenu: (e: React.MouseEvent) => void;
    onClientClick: (e: React.MouseEvent) => void;
}

const MatterCard: React.FC<MatterCardProps> = ({ matter, onClick, daysInStage, onToggleStatus, onCloseMatter, onDeleteMatter, isMenuOpen, onToggleMenu, onClientClick }) => {
    return (
        <div
            onClick={onClick}
            className="bg-white p-3 rounded border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
            style={{ borderLeft: `4px solid ${matter.status === 'Open' ? '#22c55e' : '#eab308'}` }} // Green for Open, Yellow for Pending
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-blue-600 text-sm hover:underline truncate pr-6" title={matter.name}>{matter.name}</h4>
                <button
                    className="text-slate-400 hover:text-slate-600 p-1 absolute top-2 right-2"
                    onClick={onToggleMenu}
                >
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-2 top-8 bg-white rounded shadow-lg border border-slate-100 z-20 w-40 py-1">
                        <button onClick={(e) => { e.stopPropagation(); onToggleStatus(); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700">
                            Mark as {matter.status === 'Open' ? 'pending' : 'open'}
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); onCloseMatter(); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600">Close matter</button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteMatter(); }} className="block w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 font-medium">Delete matter</button>
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-800 font-medium mb-1">
                <button onClick={onClientClick} className="hover:text-blue-600 hover:underline text-left">
                    {matter.client}
                </button>
            </p>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8">{matter.notes}</p>
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{daysInStage} DAYS IN STAGE</span>
                {matter.responsibleAttorneyId && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-white shadow-sm" title="Responsible Attorney">
                        {(matter.responsibleAttorneyId.split('_')[1] || matter.responsibleAttorneyId.charAt(0) || '?').toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

interface MatterRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        filteredMatters: Matter[];
        setViewingMatter: (matter: Matter) => void;
        handleClientClick: (e: React.MouseEvent, clientName: string) => void;
        handleGenerateSummary: (e: React.MouseEvent, matter: Matter) => void;
        getStatusPill: (status: Matter['status']) => string;
        navigate: (path: string) => void;
    };
}

const MatterRow: React.FC<MatterRowProps> = ({ index, style, data }) => {
    const { filteredMatters, setViewingMatter, handleClientClick, handleGenerateSummary, getStatusPill, navigate } = data;
    const matter = filteredMatters[index];
    if (!matter) return null;
    const respAttorney = MOCK_USERS.find(u => u.id === matter.responsibleAttorneyId);

    return (
        <div style={style} className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="p-4 font-medium text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 w-1/5 truncate" onClick={() => setViewingMatter(matter)}>{matter.name}</div>
            <div className="p-4 text-slate-600 dark:text-slate-400 w-1/8">
                <button
                    onClick={(e) => handleClientClick(e, matter.client)}
                    className="hover:text-blue-600 hover:underline text-left truncate w-full"
                >
                    {matter.client}
                </button>
            </div>
            <div className="p-4 text-slate-600 dark:text-slate-400 w-1/8 truncate">{matter.practiceArea || '-'}</div>
            <div className="p-4 text-slate-600 dark:text-slate-400 w-1/6 truncate">{respAttorney?.name || '-'}</div>
            <div className="p-4 w-1/12">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${getStatusPill(matter.status)}`}>
                    {matter.status}
                </span>
            </div>
            <div className="p-4 text-slate-600 dark:text-slate-400 w-1/10 text-xs">{matter.openDate}</div>
            <div className="p-4 text-right flex-1 pr-8 flex items-center justify-end gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/matters/edit/${matter.id}`); }}
                    className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Edit Matter"
                >
                    <PencilSquareIcon className="w-3 h-3 mr-1.5" />
                    Edit
                </button>
                <button
                    onClick={(e) => handleGenerateSummary(e, matter)}
                    className="inline-flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                    <SparklesIcon className="w-3 h-3 mr-1.5" />
                    Summary
                </button>
            </div>
        </div>
    );
};

export default Matters;
