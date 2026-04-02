import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
    XMarkIcon, CheckIcon, ChevronDownIcon, QuestionMarkCircleIcon,
    DocumentTextIcon, BriefcaseIcon, LockClosedIcon, BellIcon,
    NoSymbolIcon, UserGroupIcon, AdjustmentsHorizontalIcon,
    CurrencyDollarIcon, ListBulletIcon, FolderIcon, ShieldCheckIcon,
    TrashIcon, UsersIcon, PlusIcon
} from './icons';
import { MOCK_USERS } from '../constants';
import { Matter, RelatedParty, ConflictSearchAudit } from '../types';

const EditMatter: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        matters, updateMatter, addToast, contacts,
        documentTemplates, addDocument,
        taskChains, addTask
    } = useStore();

    const [matter, setMatter] = useState<Matter | null>(null);
    const [activeSection, setActiveSection] = useState('Matter details');
    const [formData, setFormData] = useState<Partial<Matter>>({});
    const [updateNameOnSave, setUpdateNameOnSave] = useState(false);
    const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
    const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
    const [isCreateDocModalOpen, setIsCreateDocModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newDocData, setNewDocData] = useState({ name: '', templateId: '', folder: '' });
    const [isConflictAuditModalOpen, setIsConflictAuditModalOpen] = useState(false);

    const [newParty, setNewParty] = useState<Partial<RelatedParty>>({
        role: 'Opposing Counsel',
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        const foundMatter = matters.find(m => m.id === id);
        if (foundMatter) {
            setMatter(foundMatter);
            setFormData(foundMatter);
        } else {
            addToast('Matter not found', 'error');
            navigate('/matters');
        }
    }, [id, matters, navigate, addToast]);

    if (!matter) return null;

    const handleSave = () => {
        if (formData.name && formData.client) {
            updateMatter(formData as Matter);
            addToast('Matter updated successfully', 'success');
            navigate('/matters');
        } else {
            addToast('Please fill in required fields', 'error');
        }
    };

    const handleSectionClick = (sectionId: string) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleAddParty = () => {
        if (!newParty.name || !newParty.role) {
            addToast('Name and Role are required', 'error');
            return;
        }

        const partyToAdd: RelatedParty = {
            id: `RP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            name: newParty.name,
            role: newParty.role as any,
            email: newParty.email,
            phone: newParty.phone,
            notes: newParty.notes
        };

        const currentParties = formData.relatedParties || [];
        setFormData({
            ...formData,
            relatedParties: [...currentParties, partyToAdd]
        });

        setIsAddPartyModalOpen(false);
        setNewParty({ role: 'Opposing Counsel', name: '', email: '', phone: '' });
        addToast('Party added successfully', 'success');
    };

    const handleRemoveParty = (partyId: string) => {
        const currentParties = formData.relatedParties || [];
        setFormData({
            ...formData,
            relatedParties: currentParties.filter(p => p.id !== partyId)
        });
        addToast('Party removed', 'info');
    };

    const handleAddFolder = () => {
        if (!newFolderName.trim()) return;
        const currentFolders = formData.folderStructure || ['Pleadings', 'Correspondence', 'Medical Records', 'Expert Reports', 'Discovery Out', 'Discovery In', 'Exhibits'];
        if (currentFolders.includes(newFolderName)) {
            addToast('Folder already exists', 'error');
            return;
        }
        setFormData({ ...formData, folderStructure: [...currentFolders, newFolderName] });
        setNewFolderName('');
        setIsAddFolderModalOpen(false);
        addToast('Folder added', 'success');
    };

    const handleRemoveFolder = (folderName: string) => {
        const currentFolders = formData.folderStructure || ['Pleadings', 'Correspondence', 'Medical Records', 'Expert Reports', 'Discovery Out', 'Discovery In', 'Exhibits'];
        setFormData({ ...formData, folderStructure: currentFolders.filter(f => f !== folderName) });
        addToast('Folder removed', 'info');
    };

    const handleCreateDocument = () => {
        if (!newDocData.name || !newDocData.templateId) {
            addToast('Name and Template are required', 'error');
            return;
        }

        const template = documentTemplates.find(t => t.id === newDocData.templateId);

        const docToAdd = {
            id: `DOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            name: newDocData.name,
            matterId: id!,
            category: (template?.category as any) || 'Draft',
            uploadDate: new Date().toISOString(),
            size: '15 KB',
            version: 1,
            date: new Date().toLocaleDateString(),
            uploader: 'System',
            sharedWithClient: false,
            folder: newDocData.folder
        };

        addDocument(docToAdd as any);
        setIsCreateDocModalOpen(false);
        setNewDocData({ name: '', templateId: '', folder: '' });
        addToast('Document generated from template', 'success');
    };

    const handleApplyTaskChain = (chainId: string) => {
        const chain = taskChains.find(c => c.id === chainId);
        if (!chain) return;

        chain.items.forEach(item => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + item.dueInDays);

            const taskToAdd = {
                id: `TSK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                description: item.description,
                priority: item.priority,
                matterId: id!,
                dueDate: dueDate.toISOString().split('T')[0],
                completed: false,
                assignedUserId: formData.responsibleAttorneyId || 'USER_1',
                assignedByUserId: 'USER_1',
                notes: `Auto-generated from workflow: ${chain.name}`
            };

            addTask(taskToAdd as any);
        });

        addToast(`Applied workflow: ${chain.name} (${chain.items.length} tasks generated)`, 'success');
    };

    const sections = [
        { id: 'Template information', icon: <DocumentTextIcon className="w-4 h-4" /> },
        { id: 'Matter details', icon: <BriefcaseIcon className="w-4 h-4" /> },
        { id: 'Matter permissions', icon: <LockClosedIcon className="w-4 h-4" /> },
        { id: 'Matter notifications', icon: <BellIcon className="w-4 h-4" /> },
        { id: 'Block users', icon: <NoSymbolIcon className="w-4 h-4" /> },
        { id: 'Related contacts', icon: <UserGroupIcon className="w-4 h-4" /> },
        { id: 'Custom fields', icon: <AdjustmentsHorizontalIcon className="w-4 h-4" /> },
        { id: 'Billing preference', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
        { id: 'Task lists', icon: <ListBulletIcon className="w-4 h-4" /> },
        { id: 'Document folders', icon: <FolderIcon className="w-4 h-4" /> },
        { id: 'Conflict checks', icon: <ShieldCheckIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/matters')} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Edit matter: {matter.id}-{matter.name}</h1>
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={updateNameOnSave}
                            onChange={(e) => setUpdateNameOnSave(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Update matter name/number when saving changes</span>
                        <QuestionMarkCircleIcon className="w-4 h-4 text-blue-500" />
                    </label>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            Save matter
                        </button>
                        <button
                            onClick={() => navigate('/matters')}
                            className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 overflow-y-auto">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Sections</h2>
                    <nav className="space-y-1">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => handleSectionClick(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeSection === section.id
                                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                            >
                                <span className={activeSection === section.id ? 'text-blue-500' : 'text-slate-400'}>
                                    {section.icon}
                                </span>
                                {section.id}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-12 scroll-smooth bg-[#f8fafc]">
                    <div className="max-w-4xl mx-auto space-y-12 pb-24">

                        {/* Template Information Section */}
                        <section id="Template information" className="scroll-mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                    <DocumentTextIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Template information</h2>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                                    <div className="mt-1">
                                        <QuestionMarkCircleIcon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        Enhance your process by <a href="#" className="underline font-bold hover:text-blue-600">creating a template</a> that can be applied to any matter.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Use an existing template</label>
                                    <div className="relative group">
                                        <select
                                            value={formData.templateId || 'All'}
                                            onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all group-hover:border-slate-300"
                                        >
                                            <option value="All">Select your template</option>
                                            <option value="criminal">Criminal Defense Intake</option>
                                            <option value="pi">Personal Injury Workflow</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Matter Details Section */}
                        <section id="Matter details" className="scroll-mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <BriefcaseIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Matter details</h2>
                            </div>

                            <div className="p-8 grid grid-cols-2 gap-8">
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Client <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <select
                                            value={formData.client}
                                            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all group-hover:border-slate-300"
                                        >
                                            <option value="">Select a client</option>
                                            {contacts.map(contact => (
                                                <option key={contact.id} value={contact.name}>{contact.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Matter description <span className="text-red-500">*</span></label>
                                    <textarea
                                        rows={4}
                                        value={formData.description || formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-slate-300 resize-none"
                                        placeholder="Add a detailed description for this matter..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Responsible attorney</label>
                                    <div className="relative group">
                                        <select
                                            value={formData.responsibleAttorneyId || ''}
                                            onChange={(e) => setFormData({ ...formData, responsibleAttorneyId: e.target.value })}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all group-hover:border-slate-300"
                                        >
                                            <option value="">Select a firm user</option>
                                            {MOCK_USERS.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Originating attorney</label>
                                    <div className="relative group">
                                        <select
                                            value={formData.originatingAttorneyId || ''}
                                            onChange={(e) => setFormData({ ...formData, originatingAttorneyId: e.target.value })}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all group-hover:border-slate-300"
                                        >
                                            <option value="">Select a firm user</option>
                                            {MOCK_USERS.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                        Responsible staff <QuestionMarkCircleIcon className="w-4 h-4 text-blue-500" />
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={formData.responsibleStaffId || ''}
                                            onChange={(e) => setFormData({ ...formData, responsibleStaffId: e.target.value })}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all group-hover:border-slate-300"
                                        >
                                            <option value="">Find a firm user</option>
                                            {MOCK_USERS.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Client reference number</label>
                                    <input
                                        type="text"
                                        value={formData.clientReferenceNumber || ''}
                                        onChange={(e) => setFormData({ ...formData, clientReferenceNumber: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-slate-300"
                                        placeholder="Enter reference number"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="block text-sm font-bold text-slate-700">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location || ''}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-slate-300"
                                        placeholder="e.g. St. Mary Parish"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Matter Permissions Section */}
                        <section id="Matter permissions" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                                    <LockClosedIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Matter permissions</h2>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-3 gap-4">
                                    {['Firm', 'Private', 'Selective'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, permissions: type as any })}
                                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.permissions === type
                                                ? 'border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-50/50'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-xl ${formData.permissions === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {type === 'Firm' ? <UsersIcon className="w-6 h-6" /> : type === 'Private' ? <LockClosedIcon className="w-6 h-6" /> : <UserGroupIcon className="w-6 h-6" />}
                                            </div>
                                            <div className="text-center">
                                                <span className={`block font-bold text-sm ${formData.permissions === type ? 'text-blue-700' : 'text-slate-800'}`}>{type}</span>
                                                <span className="text-[10px] text-slate-500">{type === 'Firm' ? 'Everyone sees' : type === 'Private' ? 'Only assignees' : 'Chosen users'}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {formData.permissions === 'Selective' && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-bold text-slate-700 ml-1">Allowed users</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {MOCK_USERS.map(user => {
                                                const isAllowed = formData.allowedUserIds?.includes(user.id);
                                                return (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => {
                                                            const current = formData.allowedUserIds || [];
                                                            setFormData({
                                                                ...formData,
                                                                allowedUserIds: isAllowed ? current.filter(id => id !== user.id) : [...current, user.id]
                                                            });
                                                        }}
                                                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${isAllowed ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-400' : 'border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm ${isAllowed ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="text-left flex-1 min-w-0">
                                                            <span className={`block text-sm font-bold truncate ${isAllowed ? 'text-blue-700' : 'text-slate-700'}`}>{user.name}</span>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{user.role}</span>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isAllowed ? 'bg-blue-600 text-white scale-110 shadow-md' : 'bg-slate-100 text-transparent'}`}>
                                                            <CheckIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Matter Notifications Section */}
                        <section id="Matter notifications" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                                    <BellIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Matter notifications</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'tasks', label: 'Task updates', desc: 'When tasks are created or completed' },
                                        { id: 'docs', label: 'Document activity', desc: 'Edits, uploads, or signature status' },
                                        { id: 'billing', label: 'Billing & Payments', desc: 'Invoice status and trust deposits' },
                                        { id: 'comms', label: 'Client Communication', desc: 'New messages and meeting updates' }
                                    ].map(pref => (
                                        <div
                                            key={pref.id}
                                            onClick={() => {
                                                const current = formData.notificationPreferences || {};
                                                setFormData({ ...formData, notificationPreferences: { ...current, [pref.id]: !current[pref.id] } });
                                            }}
                                            className="group flex flex-col justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer select-none"
                                        >
                                            <div>
                                                <span className="block font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{pref.label}</span>
                                                <span className="text-xs text-slate-500 leading-relaxed font-medium">{pref.desc}</span>
                                            </div>
                                            <div className="flex justify-end mt-4">
                                                <div className={`w-12 h-6 rounded-full transition-all relative ${formData.notificationPreferences?.[pref.id] ? 'bg-blue-600 shadow-inner' : 'bg-slate-200'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.notificationPreferences?.[pref.id] ? 'left-7 ring-2 ring-blue-400' : 'left-1'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Block Users Section */}
                        <section id="Block users" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                                    <NoSymbolIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Block users</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">Blocked users will not be able to see this matter even if they have firm-wide permissions. Use this for sensitive conflict-of-interest cases.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {MOCK_USERS.map(user => {
                                        const isBlocked = formData.blockedUserIds?.includes(user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => {
                                                    const current = formData.blockedUserIds || [];
                                                    setFormData({
                                                        ...formData,
                                                        blockedUserIds: isBlocked ? current.filter(id => id !== user.id) : [...current, user.id]
                                                    });
                                                }}
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${isBlocked ? 'border-red-400 bg-red-50 shadow-sm ring-1 ring-red-400' : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="w-10 h-10 rounded-xl overflow-hidden opacity-80 grayscale-[0.5] ring-1 ring-slate-100 shadow-sm">
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <span className={`block text-sm font-bold truncate ${isBlocked ? 'text-red-700' : 'text-slate-700'}`}>{user.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{user.role}</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isBlocked ? 'bg-red-600 text-white scale-110 shadow-md' : 'bg-slate-100 text-transparent'}`}>
                                                    <XMarkIcon className="w-4 h-4" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Related Contacts Section */}
                        <section id="Related contacts" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
                                    <UserGroupIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Related contacts</h2>
                                <button
                                    onClick={() => setIsAddPartyModalOpen(true)}
                                    className="ml-auto text-blue-600 text-sm font-black uppercase tracking-widest hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                                >
                                    + Add Party
                                </button>
                            </div>
                            <div className="p-8 space-y-4">
                                {(formData.relatedParties || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {formData.relatedParties?.map(party => (
                                            <div key={party.id} className="flex items-center gap-6 p-5 bg-slate-50/50 border border-slate-200 rounded-3xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all group">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition-all">
                                                    {party.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="block font-black text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{party.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-widest ring-1 ring-blue-200 shadow-sm">{party.role}</span>
                                                        <span className="text-xs text-slate-400 font-medium truncate">{party.email}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveParty(party.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl">
                                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                                            <UserGroupIcon className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">No related parties added</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Custom Fields Section */}
                        <section id="Custom fields" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 shadow-sm">
                                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Custom fields</h2>
                            </div>
                            <div className="p-8 grid grid-cols-2 gap-8">
                                {[
                                    { label: 'Court Case #', value: '23-CR-9021', placeholder: 'Enter case number' },
                                    { label: 'Judge Assigned', value: 'Hon. Margaret Sullivan', placeholder: 'Select judge' },
                                    { label: 'Next Court Date', value: '2026-02-14', type: 'date' },
                                    { label: 'Discovery Status', value: 'In Progress', options: ['Not Started', 'In Progress', 'Completed'] }
                                ].map(field => (
                                    <div key={field.label} className="space-y-2.5">
                                        <label className="block text-sm font-bold text-slate-700 ml-1">{field.label}</label>
                                        {field.options ? (
                                            <div className="relative group">
                                                <select className="w-full appearance-none bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-slate-300 shadow-sm">
                                                    {field.options.map(opt => <option key={opt}>{opt}</option>)}
                                                </select>
                                                <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                defaultValue={field.value}
                                                placeholder={field.placeholder}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-slate-300 shadow-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Billing Preference Section */}
                        <section id="Billing preference" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                    <CurrencyDollarIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Billing preference</h2>
                            </div>
                            <div className="p-8 space-y-10">
                                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit shadow-inner">
                                    {['Hourly', 'Flat Fee', 'Contingency'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, billing: { ...formData.billing!, type: type as any } })}
                                            className={`px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${formData.billing?.type === type
                                                ? 'bg-white text-blue-600 shadow-lg ring-1 ring-slate-200'
                                                : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-8 animate-in fade-in duration-500">
                                    {formData.billing?.type === 'Hourly' && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-slate-700 ml-1">Hourly Rate ($)</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.billing.rate || ''}
                                                    onChange={(e) => setFormData({ ...formData, billing: { ...formData.billing!, rate: Number(e.target.value) } })}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-slate-300 shadow-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.billing?.type === 'Flat Fee' && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-slate-700 ml-1">Flat Fee ($)</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.billing.fee || ''}
                                                    onChange={(e) => setFormData({ ...formData, billing: { ...formData.billing!, fee: Number(e.target.value) } })}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-slate-300 shadow-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.billing?.type === 'Contingency' && (
                                        <>
                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold text-slate-700 ml-1">Fee Percentage (%)</label>
                                                <div className="relative group">
                                                    <input
                                                        type="number"
                                                        value={formData.settlement?.attorneyFeePercent || 33.3}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-slate-300 shadow-sm text-right pr-12"
                                                        placeholder="33.3"
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold text-slate-700 ml-1">Estimated Value ($)</label>
                                                <div className="relative group">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-slate-300 shadow-sm"
                                                        placeholder="500,000"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Task Lists Section */}
                        <section id="Task lists" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                                    <ListBulletIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Task lists</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-sm text-slate-500 italic">Select task lists to automatically generate for this matter.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {(taskChains.length > 0 ? taskChains : [
                                        { id: 'mock-1', name: 'Initial Intake Checklist', items: [] },
                                        { id: 'mock-2', name: 'Filing & Pleadings', items: [] },
                                        { id: 'mock-3', name: 'Discovery Phase 1', items: [] },
                                        { id: 'mock-4', name: 'Trial Preparation', items: [] }
                                    ]).map(chain => (
                                        <div
                                            key={chain.id}
                                            onClick={() => handleApplyTaskChain(chain.id)}
                                            className="flex items-center gap-4 p-5 rounded-3xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group cursor-pointer shadow-sm relative overflow-hidden"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <CheckIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="block font-bold text-slate-700 group-hover:text-blue-700 uppercase tracking-tight text-sm truncate">{chain.name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{chain.items?.length || 0} Tasks</span>
                                            </div>
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -rotate-45 translate-x-8 -translate-y-8 group-hover:bg-blue-500/10 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="Document folders" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-sm">
                                    <FolderIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Document folders</h2>
                                <button
                                    onClick={() => setIsCreateDocModalOpen(true)}
                                    className="ml-auto text-blue-600 text-sm font-black uppercase tracking-widest hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                                >
                                    + Create Doc
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="flex flex-wrap gap-4">
                                    {(formData.folderStructure || ['Pleadings', 'Correspondence', 'Medical Records', 'Expert Reports', 'Discovery Out', 'Discovery In', 'Exhibits']).map(folder => (
                                        <div key={folder} className="flex items-center gap-2.5 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-default group relative">
                                            <FolderIcon className="w-5 h-5 text-sky-500" />
                                            <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{folder}</span>
                                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={() => { setNewDocData({ ...newDocData, folder }); setIsCreateDocModalOpen(true); }}
                                                    className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700"
                                                >
                                                    <PlusIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFolder(folder)}
                                                    className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAddFolderModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all font-black uppercase tracking-widest text-[10px]"
                                    >
                                        + New Folder
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Conflict Checks Section */}
                        <section id="Conflict checks" className="scroll-mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-lg">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Conflict checks</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                        <CheckIcon className="w-6 h-6 font-bold" />
                                    </div>
                                    <div>
                                        <span className="block font-black text-emerald-800 uppercase tracking-widest text-xs">Clear of Conflicts</span>
                                        <p className="text-sm text-emerald-700 font-medium">Last check performed on Jan 15, 2026 by System Admin</p>
                                    </div>
                                    <button
                                        onClick={() => setIsConflictAuditModalOpen(true)}
                                        className="ml-auto bg-white border border-emerald-200 text-emerald-600 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                    >
                                        View Audit
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 text-center font-bold tracking-widest uppercase">Perform a new check before adding major parties</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Add Party Modal */}
            {isAddPartyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddPartyModalOpen(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Add Related Party</h3>
                            <button onClick={() => setIsAddPartyModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Party Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newParty.name}
                                    onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Role <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <select
                                        value={newParty.role}
                                        onChange={(e) => setNewParty({ ...newParty, role: e.target.value as any })}
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="Opposing Counsel">Opposing Counsel</option>
                                        <option value="Opposing Party">Opposing Party</option>
                                        <option value="Judge">Judge</option>
                                        <option value="Witness">Witness</option>
                                        <option value="Co-Counsel">Co-Counsel</option>
                                        <option value="Co-Defendant">Co-Defendant</option>
                                    </select>
                                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={newParty.email}
                                        onChange={(e) => setNewParty({ ...newParty, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={newParty.phone}
                                        onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="(555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Notes</label>
                                <textarea
                                    rows={3}
                                    value={newParty.notes}
                                    onChange={(e) => setNewParty({ ...newParty, notes: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none"
                                    placeholder="Add any additional context..."
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 flex gap-3 justify-end">
                            <button
                                onClick={() => setIsAddPartyModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddParty}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Save Party
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Folder Modal */}
            {isAddFolderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddFolderModalOpen(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">New Folder</h3>
                            <button onClick={() => setIsAddFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Folder Name</label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    placeholder="e.g. Expert Reports"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 flex gap-3 justify-end">
                            <button onClick={() => setIsAddFolderModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                            <button
                                onClick={handleAddFolder}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95"
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Document Modal */}
            {isCreateDocModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateDocModalOpen(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Create Document</h3>
                            <button onClick={() => setIsCreateDocModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Document Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newDocData.name}
                                    onChange={(e) => setNewDocData({ ...newDocData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    placeholder="e.g. Answer to Complaint"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Select Template <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <select
                                        value={newDocData.templateId}
                                        onChange={(e) => setNewDocData({ ...newDocData, templateId: e.target.value })}
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="">Select a template...</option>
                                        {documentTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Destination Folder</label>
                                <div className="relative group">
                                    <select
                                        value={newDocData.folder}
                                        onChange={(e) => setNewDocData({ ...newDocData, folder: e.target.value })}
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="">Root</option>
                                        {(formData.folderStructure || ['Pleadings', 'Correspondence', 'Medical Records', 'Expert Reports', 'Discovery Out', 'Discovery In', 'Exhibits']).map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 flex gap-3 justify-end">
                            <button onClick={() => setIsCreateDocModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                            <button
                                onClick={handleCreateDocument}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Generate Document
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Audit Modal */}
            {isConflictAuditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConflictAuditModalOpen(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-xl font-bold">Conflict Check Audit Trail</h3>
                            </div>
                            <button onClick={() => setIsConflictAuditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {[
                                {
                                    id: 'AUD-001',
                                    timestamp: '2026-01-15 14:30',
                                    user: 'Christopher Washington',
                                    query: formData.name,
                                    decision: 'Clear',
                                    score: 0.02,
                                    summary: 'Cross-referenced against 1,240 matters and 3,500 contacts. No fuzzy matches found for name or related entities.'
                                },
                                {
                                    id: 'AUD-002',
                                    timestamp: '2025-12-20 09:15',
                                    user: 'System Admin',
                                    query: formData.client,
                                    decision: 'Clear',
                                    score: 0.05,
                                    summary: 'Client entity verification complete. No previous adverse engagements found in historical database.'
                                }
                            ].map((audit, idx) => (
                                <div key={audit.id} className={`p-6 rounded-2xl border ${idx === 0 ? 'bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Audit ID: {audit.id}</span>
                                            <h4 className="font-bold text-slate-800 text-lg">Search Query: "{audit.query}"</h4>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${audit.decision === 'Clear' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-500 text-white'}`}>
                                            {audit.decision}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Performed By</span>
                                            <p className="text-sm font-bold text-slate-700">{audit.user}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Timestamp</span>
                                            <p className="text-sm font-bold text-slate-700">{audit.timestamp}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400">AI Risk Score</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full" style={{ width: `${(1 - audit.score) * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-black text-emerald-600">{(audit.score * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 p-4 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Findings Summary</span>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">"{audit.summary}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 flex justify-end">
                            <button
                                onClick={() => setIsConflictAuditModalOpen(false)}
                                className="bg-slate-800 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all shadow-lg active:scale-95"
                            >
                                Close Audit View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditMatter;
