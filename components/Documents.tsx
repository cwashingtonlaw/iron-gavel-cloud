import React, { useState, useMemo, useCallback } from 'react';
import { MOCK_DOCUMENT_TEMPLATES, MOCK_DOCUMENT_CATEGORIES } from '../constants';
import {
  PlusIcon, DocumentTextIcon, MagnifyingGlassIcon, XMarkIcon, FolderIcon,
  TrashIcon, ArrowDownTrayIcon, EyeIcon, PencilSquareIcon, CheckCircleIcon,
  TagIcon, ChevronRightIcon, ChevronDownIcon, Squares2X2Icon, ListBulletIcon,
  FunnelIcon, ClockIcon, DocumentDuplicateIcon, LockClosedIcon, SparklesIcon,
  CheckIcon, CubeIcon, PrinterIcon, DocumentArrowUpIcon, UserGroupIcon,
  EllipsisHorizontalIcon, ChevronLeftIcon,
} from './icons';
import { Document, DocumentCategory, DocumentTemplate, EsignStatus } from '../types';
import DocumentGeneratorModal from './DocumentGeneratorModal';
import { useStore } from '../store/useStore';

// ============================================================================
// TYPES
// ============================================================================
type TabId = 'all' | 'templates' | 'esign' | 'discovery';
type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'uploadDate' | 'size' | 'matter';
type SortDir = 'asc' | 'desc';

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

// ============================================================================
// HELPERS
// ============================================================================
const formatFileSize = (size: string) => size || '--';

const esignStatusColor = (status?: EsignStatus) => {
  switch (status) {
    case 'Sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'Delivered': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    case 'Signed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'Declined': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
    case 'Voided': return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    default: return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }
};

const discoveryStatusColor = (status?: string) => {
  switch (status) {
    case 'Produced': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'Received': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    default: return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }
};

const buildFolderTree = (documents: Document[], matters: { id: string; name: string }[]): FolderNode[] => {
  const matterMap = new Map(matters.map(m => [m.id, m.name]));
  const tree: FolderNode[] = [];
  const matterFolders = new Map<string, Set<string>>();

  documents.forEach(doc => {
    if (!matterFolders.has(doc.matterId)) matterFolders.set(doc.matterId, new Set());
    if (doc.folder) matterFolders.get(doc.matterId)!.add(doc.folder);
  });

  matterFolders.forEach((folders, matterId) => {
    const matterName = matterMap.get(matterId) || matterId;
    const children: FolderNode[] = Array.from(folders).sort().map(f => ({
      name: f, path: `${matterId}/${f}`, children: [],
    }));
    tree.push({ name: matterName, path: matterId, children });
  });

  return tree.sort((a, b) => a.name.localeCompare(b.name));
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- Tab Bar ---
const TabBar: React.FC<{ active: TabId; onChange: (t: TabId) => void; counts: Record<TabId, number> }> = ({ active, onChange, counts }) => {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'All Documents' },
    { id: 'templates', label: 'Templates' },
    { id: 'esign', label: 'E-Signatures' },
    { id: 'discovery', label: 'Discovery' },
  ];
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <nav className="-mb-px flex space-x-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${active === t.id
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              }`}
          >
            {t.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active === t.id
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// --- Folder Sidebar ---
const FolderSidebar: React.FC<{
  tree: FolderNode[];
  selectedFolder: string | null;
  onSelect: (path: string | null) => void;
  onCreateFolder: () => void;
}> = ({ tree, selectedFolder, onSelect, onCreateFolder }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 pr-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Folders</h3>
        <button onClick={onCreateFolder} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" title="Create folder">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors ${selectedFolder === null
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
      >
        <FolderIcon className="w-4 h-4" /> All Files
      </button>
      {tree.map(node => (
        <div key={node.path}>
          <button
            onClick={() => { toggle(node.path); onSelect(node.path); }}
            className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors ${selectedFolder === node.path
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            {node.children.length > 0 ? (
              expanded.has(node.path)
                ? <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
                : <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
            ) : <span className="w-3" />}
            <FolderIcon className="w-4 h-4 flex-shrink-0 text-amber-500" />
            <span className="truncate">{node.name}</span>
          </button>
          {expanded.has(node.path) && node.children.map(child => (
            <button
              key={child.path}
              onClick={() => onSelect(child.path)}
              className={`w-full flex items-center gap-1.5 pl-8 pr-2 py-1.5 rounded text-sm transition-colors ${selectedFolder === child.path
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <FolderIcon className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span className="truncate">{child.name}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

// --- Document Detail Panel ---
const DetailPanel: React.FC<{
  doc: Document;
  matterName: string;
  onClose: () => void;
  onUpdate: (doc: Document) => void;
  onDelete: (id: string) => void;
}> = ({ doc, matterName, onClose, onUpdate, onDelete }) => {
  const [editingCategory, setEditingCategory] = useState(false);

  return (
    <div className="w-80 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{doc.name}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-5">
        {/* Metadata */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matter</label>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{matterName}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Category</label>
            {editingCategory ? (
              <select
                value={doc.category?.id || ''}
                onChange={(e) => {
                  const cat = MOCK_DOCUMENT_CATEGORIES.find(c => c.id === e.target.value);
                  if (cat) onUpdate({ ...doc, category: cat });
                  setEditingCategory(false);
                }}
                className="w-full mt-1 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 dark:text-slate-200"
                autoFocus
                onBlur={() => setEditingCategory(false)}
              >
                {MOCK_DOCUMENT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setEditingCategory(true)}>
                {doc.category?.name || 'Uncategorized'} <PencilSquareIcon className="w-3 h-3 inline ml-1" />
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Upload Date</label>
              <p className="text-sm text-slate-700 dark:text-slate-300">{doc.uploadDate}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Size</label>
              <p className="text-sm text-slate-700 dark:text-slate-300">{formatFileSize(doc.size)}</p>
            </div>
          </div>
          {doc.folder && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Folder</label>
              <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1"><FolderIcon className="w-3.5 h-3.5 text-amber-500" />{doc.folder}</p>
            </div>
          )}
        </div>

        {/* E-Sign Status */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">E-Sign Status</label>
          <div className="mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${esignStatusColor(doc.esignStatus)}`}>
              {doc.esignStatus || 'None'}
            </span>
          </div>
          {doc.esignRequestedDate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requested: {doc.esignRequestedDate}</p>
          )}
          {doc.esignCompletedDate && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed: {doc.esignCompletedDate}</p>
          )}
          {doc.esignRecipient && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Recipient: {doc.esignRecipient}</p>
          )}
        </div>

        {/* Share with Client Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shared with Client</label>
          <button
            onClick={() => onUpdate({ ...doc, sharedWithClient: !doc.sharedWithClient })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${doc.sharedWithClient ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${doc.sharedWithClient ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Version History */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Version History</label>
          {doc.versions && doc.versions.length > 0 ? (
            <div className="mt-2 space-y-2">
              {doc.versions.map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">v{v.version}</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2">{v.date}</span>
                    <p className="text-slate-500 dark:text-slate-400">{v.uploader}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No version history</p>
          )}
        </div>

        {/* Discovery Fields */}
        {(doc.batesNumber || doc.exhibitNumber || doc.isPrivileged) && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Discovery</label>
            {doc.batesNumber && (
              <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-mono text-blue-600 dark:text-blue-400">{doc.batesNumber}</span></p>
            )}
            {doc.exhibitNumber && (
              <p className="text-xs text-slate-600 dark:text-slate-300">Exhibit: {doc.exhibitNumber}</p>
            )}
            {doc.isPrivileged && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <LockClosedIcon className="w-3 h-3" /> Privileged: {doc.privilegeReason}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download
          </button>
          <button
            onClick={() => { onDelete(doc.id); onClose(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Documents: React.FC = () => {
  const { documents, addDocument, deleteDocument, updateDocument, matters } = useStore();

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState<TabId>('all');

  // --- All Documents State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [matterFilter, setMatterFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFolders, setShowFolders] = useState(true);

  // --- Template State ---
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [selectedTemplateForMerge, setSelectedTemplateForMerge] = useState<DocumentTemplate | null>(null);
  const [mergeValues, setMergeValues] = useState<Record<string, string>>({});

  // --- Discovery State ---
  const [discoveryStartBates, setDiscoveryStartBates] = useState('BATES-000001');
  const [discoverySelectedDocs, setDiscoverySelectedDocs] = useState<Set<string>>(new Set());

  // --- Upload Modal State ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadMatterId, setUploadMatterId] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState('');
  const [uploadFolder, setUploadFolder] = useState('');

  // --- Create Folder State ---
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderMatterId, setNewFolderMatterId] = useState('');

  // ============================================================================
  // DERIVED DATA
  // ============================================================================
  const matterMap = useMemo(() => new Map(matters.map(m => [m.id, m])), [matters]);

  const folderTree = useMemo(() => buildFolderTree(documents, matters), [documents, matters]);

  const filteredDocuments = useMemo(() => {
    let docs = [...documents];

    // Folder filter
    if (selectedFolder) {
      if (selectedFolder.includes('/')) {
        const [matterId, folder] = selectedFolder.split('/');
        docs = docs.filter(d => d.matterId === matterId && d.folder === folder);
      } else {
        docs = docs.filter(d => d.matterId === selectedFolder);
      }
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (matterMap.get(d.matterId)?.name || '').toLowerCase().includes(q) ||
        (d.category?.name || '').toLowerCase().includes(q)
      );
    }

    // Matter filter
    if (matterFilter) docs = docs.filter(d => d.matterId === matterFilter);

    // Category filter
    if (categoryFilter) docs = docs.filter(d => d.category?.id === categoryFilter);

    // Date range
    if (dateFrom) docs = docs.filter(d => d.uploadDate >= dateFrom);
    if (dateTo) docs = docs.filter(d => d.uploadDate <= dateTo);

    // Sort
    docs.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'uploadDate': cmp = a.uploadDate.localeCompare(b.uploadDate); break;
        case 'size': cmp = (a.size || '').localeCompare(b.size || ''); break;
        case 'matter': cmp = (matterMap.get(a.matterId)?.name || '').localeCompare(matterMap.get(b.matterId)?.name || ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return docs;
  }, [documents, searchQuery, matterFilter, categoryFilter, dateFrom, dateTo, sortField, sortDir, selectedFolder, matterMap]);

  const esignDocuments = useMemo(() =>
    documents.filter(d => d.esignStatus && d.esignStatus !== 'None'),
    [documents]
  );

  const pendingSignature = useMemo(() => esignDocuments.filter(d => d.esignStatus === 'Sent' || d.esignStatus === 'Delivered'), [esignDocuments]);
  const completedSignature = useMemo(() => esignDocuments.filter(d => d.esignStatus === 'Completed' || d.esignStatus === 'Signed'), [esignDocuments]);

  const discoveryDocuments = useMemo(() =>
    documents.filter(d => d.batesNumber || d.isPrivileged || d.exhibitNumber || d.discoveryStatus),
    [documents]
  );

  const privilegeLog = useMemo(() => documents.filter(d => d.isPrivileged), [documents]);

  const tabCounts: Record<TabId, number> = {
    all: documents.length,
    templates: MOCK_DOCUMENT_TEMPLATES.length,
    esign: esignDocuments.length,
    discovery: discoveryDocuments.length,
  };

  const filteredTemplates = useMemo(() => {
    let tpls = [...MOCK_DOCUMENT_TEMPLATES];
    if (templateSearch) {
      const q = templateSearch.toLowerCase();
      tpls = tpls.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    if (templateCategory) tpls = tpls.filter(t => t.category === templateCategory);
    return tpls;
  }, [templateSearch, templateCategory]);

  const templateCategories = useMemo(() =>
    Array.from(new Set(MOCK_DOCUMENT_TEMPLATES.map(t => t.category))).sort(),
    []
  );

  // ============================================================================
  // CALLBACKS
  // ============================================================================
  const toggleSelect = useCallback((id: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
    }
  }, [selectedDocs.size, filteredDocuments]);

  const handleBulkDelete = useCallback(() => {
    if (!window.confirm(`Delete ${selectedDocs.size} documents?`)) return;
    selectedDocs.forEach(id => deleteDocument(id));
    setSelectedDocs(new Set());
    setDetailDoc(null);
  }, [selectedDocs, deleteDocument]);

  const handleBulkShare = useCallback(() => {
    selectedDocs.forEach(id => {
      const doc = documents.find(d => d.id === id);
      if (doc) updateDocument({ ...doc, sharedWithClient: true });
    });
    setSelectedDocs(new Set());
  }, [selectedDocs, documents, updateDocument]);

  const handleBulkSetCategory = useCallback((catId: string) => {
    const cat = MOCK_DOCUMENT_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    selectedDocs.forEach(id => {
      const doc = documents.find(d => d.id === id);
      if (doc) updateDocument({ ...doc, category: cat });
    });
    setSelectedDocs(new Set());
  }, [selectedDocs, documents, updateDocument]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const handleUpload = useCallback(() => {
    if (!uploadName.trim() || !uploadMatterId) return;
    const cat = MOCK_DOCUMENT_CATEGORIES.find(c => c.id === uploadCategoryId) || MOCK_DOCUMENT_CATEGORIES[0];
    const newDoc: Document = {
      id: `DOC_${Date.now()}`,
      name: uploadName.trim(),
      matterId: uploadMatterId,
      category: cat,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${Math.floor(Math.random() * 500 + 50)} KB`,
      versions: [{ version: 1, date: new Date().toISOString(), uploader: 'Christopher Washington' }],
      sharedWithClient: false,
      folder: uploadFolder || undefined,
      esignStatus: 'None',
    };
    addDocument(newDoc);
    setShowUploadModal(false);
    setUploadName('');
    setUploadMatterId('');
    setUploadCategoryId('');
    setUploadFolder('');
  }, [uploadName, uploadMatterId, uploadCategoryId, uploadFolder, addDocument]);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim() || !newFolderMatterId) return;
    // Create a placeholder doc in that folder to make the folder visible
    const cat = MOCK_DOCUMENT_CATEGORIES[0];
    const newDoc: Document = {
      id: `DOC_FOLDER_${Date.now()}`,
      name: `${newFolderName} - placeholder`,
      matterId: newFolderMatterId,
      category: cat,
      uploadDate: new Date().toISOString().split('T')[0],
      size: '0 KB',
      versions: [],
      sharedWithClient: false,
      folder: newFolderName.trim(),
    };
    addDocument(newDoc);
    setShowCreateFolder(false);
    setNewFolderName('');
    setNewFolderMatterId('');
  }, [newFolderName, newFolderMatterId, addDocument]);

  const handleMergeGenerate = useCallback(() => {
    if (!selectedTemplateForMerge) return;
    const docName = `${selectedTemplateForMerge.name.replace(/\.\w+$/, '')} - ${mergeValues[selectedTemplateForMerge.variables[0]] || 'Generated'}.docx`;
    const cat = MOCK_DOCUMENT_CATEGORIES.find(c => c.name === selectedTemplateForMerge.category) || MOCK_DOCUMENT_CATEGORIES[0];
    const newDoc: Document = {
      id: `DOC_${Date.now()}`,
      name: docName,
      matterId: matters[0]?.id || 'UNKNOWN',
      category: cat,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${Math.floor(Math.random() * 200 + 20)} KB`,
      versions: [{ version: 1, date: new Date().toISOString(), uploader: 'Christopher Washington' }],
      sharedWithClient: false,
    };
    addDocument(newDoc);
    setSelectedTemplateForMerge(null);
    setMergeValues({});
  }, [selectedTemplateForMerge, mergeValues, addDocument, matters]);

  const handleBulkBatesNumber = useCallback(() => {
    if (discoverySelectedDocs.size === 0) return;
    const prefix = discoveryStartBates.replace(/[0-9]/g, '');
    const startNum = parseInt(discoveryStartBates.replace(/[^0-9]/g, '')) || 1;
    let idx = 0;
    discoverySelectedDocs.forEach(id => {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        const batesNum = String(startNum + idx).padStart(6, '0');
        updateDocument({ ...doc, batesNumber: `${prefix}${batesNum}`, discoveryStatus: 'Produced' as const });
        idx++;
      }
    });
    setDiscoverySelectedDocs(new Set());
  }, [discoverySelectedDocs, discoveryStartBates, documents, updateDocument]);

  const handleSendForSignature = useCallback((doc: Document) => {
    updateDocument({ ...doc, esignStatus: 'Sent', esignRequestedDate: new Date().toISOString().split('T')[0] });
  }, [updateDocument]);

  // ============================================================================
  // SORT INDICATOR
  // ============================================================================
  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => (
    <span className="ml-1 text-[10px]">{sortField === field ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25BC'}</span>
  );

  // ============================================================================
  // RENDER: ALL DOCUMENTS TAB
  // ============================================================================
  const renderAllDocuments = () => (
    <div className="flex gap-4">
      {/* Folder Sidebar */}
      {showFolders && (
        <FolderSidebar
          tree={folderTree}
          selectedFolder={selectedFolder}
          onSelect={setSelectedFolder}
          onCreateFolder={() => setShowCreateFolder(true)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500'
              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <FunnelIcon className="w-4 h-4" /> Filters
          </button>
          <button
            onClick={() => setShowFolders(!showFolders)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFolders
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500'
              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <FolderIcon className="w-4 h-4" /> Folders
          </button>
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> Upload
          </button>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <select
              value={matterFilter}
              onChange={e => setMatterFilter(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Matters</option>
              {matters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Categories</option>
              {MOCK_DOCUMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <span>From</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 dark:text-slate-200" />
              <span>To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 dark:text-slate-200" />
            </div>
            {(matterFilter || categoryFilter || dateFrom || dateTo) && (
              <button onClick={() => { setMatterFilter(''); setCategoryFilter(''); setDateFrom(''); setDateTo(''); }} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedDocs.size > 0 && (
          <div className="flex items-center gap-3 p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{selectedDocs.size} selected</span>
            <button onClick={handleBulkDelete} className="px-3 py-1 text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/60">Delete</button>
            <button onClick={handleBulkShare} className="px-3 py-1 text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/60">Share with Client</button>
            <div className="relative group">
              <button className="px-3 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60">Set Category</button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 hidden group-hover:block py-1">
                {MOCK_DOCUMENT_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => handleBulkSetCategory(c.id)} className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <button className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600">Download</button>
            <button onClick={() => setSelectedDocs(new Set())} className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
          </div>
        )}

        {/* Document List/Grid */}
        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600"
                    />
                  </th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('name')}>
                    Name <SortIndicator field="name" />
                  </th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('matter')}>
                    Matter <SortIndicator field="matter" />
                  </th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Category</th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('uploadDate')}>
                    Upload Date <SortIndicator field="uploadDate" />
                  </th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('size')}>
                    Size <SortIndicator field="size" />
                  </th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Shared</th>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length > 0 ? filteredDocuments.map(doc => {
                  const matter = matterMap.get(doc.matterId);
                  const isSelected = selectedDocs.has(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(doc.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600"
                        />
                      </td>
                      <td className="p-3" onClick={() => setDetailDoc(doc)}>
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]">{doc.name}</span>
                          {doc.isPrivileged && <span title="Privileged"><LockClosedIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /></span>}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{matter?.name || 'N/A'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {doc.category?.name || 'None'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{doc.uploadDate}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{formatFileSize(doc.size)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${esignStatusColor(doc.esignStatus)}`}>
                          {doc.esignStatus || 'None'}
                        </span>
                      </td>
                      <td className="p-3">
                        {doc.sharedWithClient ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="w-4 h-4 block rounded-full border-2 border-slate-300 dark:border-slate-600" />
                        )}
                      </td>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button onClick={() => setDetailDoc(doc)} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" title="View Details">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Download">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => { deleteDocument(doc.id); if (detailDoc?.id === doc.id) setDetailDoc(null); }} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No documents found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Upload a document or adjust your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredDocuments.length > 0 ? filteredDocuments.map(doc => {
              const matter = matterMap.get(doc.matterId);
              const isSelected = selectedDocs.has(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => setDetailDoc(doc)}
                  className={`bg-white dark:bg-slate-800 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600"
                      />
                    </div>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{matter?.name || 'N/A'}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{doc.uploadDate}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${esignStatusColor(doc.esignStatus)}`}>
                        {doc.esignStatus || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No documents found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {detailDoc && (
        <DetailPanel
          doc={detailDoc}
          matterName={matterMap.get(detailDoc.matterId)?.name || 'Unknown'}
          onClose={() => setDetailDoc(null)}
          onUpdate={(d) => { updateDocument(d); setDetailDoc(d); }}
          onDelete={(id) => { deleteDocument(id); setDetailDoc(null); }}
        />
      )}
    </div>
  );

  // ============================================================================
  // RENDER: TEMPLATES TAB
  // ============================================================================
  const renderTemplates = () => (
    <div className="space-y-4">
      {/* Merge Field Modal */}
      {selectedTemplateForMerge && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Generate: {selectedTemplateForMerge.name}</h3>
              <button onClick={() => { setSelectedTemplateForMerge(null); setMergeValues({}); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the merge fields to generate this document.</p>
              {selectedTemplateForMerge.variables.map(v => (
                <div key={v}>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{v}</label>
                  <input
                    type="text"
                    value={mergeValues[v] || ''}
                    onChange={e => setMergeValues(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Enter ${v}...`}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Generated Name</label>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                  {selectedTemplateForMerge.name.replace(/\.\w+$/, '')} - {mergeValues[selectedTemplateForMerge.variables[0]] || '...'}.docx
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => { setSelectedTemplateForMerge(null); setMergeValues({}); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeGenerate}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Generate Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={templateCategory}
          onChange={e => setTemplateCategory(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All Categories</option>
          {templateCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setGeneratorOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Template Categories Summary */}
      <div className="flex flex-wrap gap-2">
        {templateCategories.map(cat => {
          const count = MOCK_DOCUMENT_TEMPLATES.filter(t => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setTemplateCategory(templateCategory === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${templateCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Template Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
            <tr>
              <th className="p-3 w-40 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Template Name</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Category</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Variables</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Last Edited</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Edited By</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map(tpl => (
              <tr key={tpl.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setSelectedTemplateForMerge(tpl); setMergeValues({}); }}
                      className="px-2.5 py-1 text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Generate
                    </button>
                    <button className="px-2.5 py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                      Edit
                    </button>
                  </div>
                </td>
                <td className="p-3 font-medium text-blue-600 dark:text-blue-400">{tpl.name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {tpl.category}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {tpl.variables.map(v => (
                      <span key={v} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{tpl.lastEditedAt}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{tpl.lastEditedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredTemplates.length} of {MOCK_DOCUMENT_TEMPLATES.length} templates
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: E-SIGNATURES TAB
  // ============================================================================
  const renderEsign = () => {
    const noSignatureDocs = documents.filter(d => !d.esignStatus || d.esignStatus === 'None');

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: pendingSignature.length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Completed', count: completedSignature.length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Failed / Declined', count: esignDocuments.filter(d => d.esignStatus === 'Failed' || d.esignStatus === 'Declined').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Total Sent', count: esignDocuments.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-slate-200 dark:border-slate-700`}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.count}</p>
            </div>
          ))}
        </div>

        {/* Send for Signature */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Send for Signature</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select a document to send for e-signature.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {noSignatureDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <DocumentTextIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{doc.name}</span>
                </div>
                <button
                  onClick={() => handleSendForSignature(doc)}
                  className="flex-shrink-0 ml-2 px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            ))}
            {noSignatureDocs.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 col-span-full text-center py-4">All documents already have signature requests.</p>
            )}
          </div>
        </div>

        {/* Pending Signatures */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Signature Status Timeline</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {esignDocuments.length > 0 ? esignDocuments.map(doc => {
              const matter = matterMap.get(doc.matterId);
              const steps: { status: EsignStatus; label: string }[] = [
                { status: 'Sent', label: 'Sent' },
                { status: 'Delivered', label: 'Delivered' },
                { status: 'Signed', label: 'Signed' },
                { status: 'Completed', label: 'Completed' },
              ];
              const statusOrder: Record<string, number> = { Sent: 0, Delivered: 1, Signed: 2, Completed: 3, Failed: -1, Declined: -1, Voided: -1 };
              const currentStep = statusOrder[doc.esignStatus || 'None'] ?? -1;

              return (
                <div key={doc.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">{doc.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{matter?.name || 'N/A'}{doc.esignRecipient ? ` \u2022 ${doc.esignRecipient}` : ''}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${esignStatusColor(doc.esignStatus)}`}>
                      {doc.esignStatus}
                    </span>
                  </div>
                  {/* Timeline */}
                  {currentStep >= 0 && (
                    <div className="flex items-center gap-0">
                      {steps.map((step, i) => {
                        const done = i <= currentStep;
                        return (
                          <React.Fragment key={step.status}>
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`}>
                                {done ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                              </div>
                              <span className={`text-[9px] mt-1 ${done ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{step.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                              <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                  {(doc.esignStatus === 'Failed' || doc.esignStatus === 'Declined' || doc.esignStatus === 'Voided') && (
                    <div className="mt-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400 font-medium">
                      Status: {doc.esignStatus}{doc.esignStatus === 'Failed' ? ' - Please retry sending the signature request.' : ''}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="p-12 text-center">
                <PencilSquareIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No signature requests yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Send a document for signature to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: DISCOVERY TAB
  // ============================================================================
  const renderDiscovery = () => (
    <div className="space-y-6">
      {/* Discovery Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4 flex-1">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Starting Bates Number</label>
            <input
              type="text"
              value={discoveryStartBates}
              onChange={e => setDiscoveryStartBates(e.target.value)}
              className="block mt-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono bg-white dark:bg-slate-700 dark:text-slate-200 w-48"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">{discoverySelectedDocs.size} documents selected</p>
          </div>
        </div>
        <button
          onClick={handleBulkBatesNumber}
          disabled={discoverySelectedDocs.size === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircleIcon className="w-4 h-4" /> Apply Bates Numbers
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
          <PrinterIcon className="w-4 h-4" /> Export Privilege Log
        </button>
      </div>

      {/* Discovery Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', count: documents.length, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-white dark:bg-slate-800' },
          { label: 'Produced', count: documents.filter(d => d.discoveryStatus === 'Produced').length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Privileged', count: privilegeLog.length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'With Exhibits', count: documents.filter(d => d.exhibitNumber).length, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-slate-200 dark:border-slate-700`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.count}</p>
          </div>
        ))}
      </div>

      {/* Discovery Documents Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Documents & Bates Numbering</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  onChange={e => setDiscoverySelectedDocs(e.target.checked ? new Set(documents.map(d => d.id)) : new Set())}
                  checked={discoverySelectedDocs.size === documents.length && documents.length > 0}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
              </th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Document</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Matter</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 text-center">Privileged</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Privilege Reason</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Bates Number</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
              <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Exhibit #</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => {
              const matter = matterMap.get(doc.matterId);
              return (
                <tr key={doc.id} className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${doc.isPrivileged ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={discoverySelectedDocs.has(doc.id)}
                      onChange={() => {
                        setDiscoverySelectedDocs(prev => {
                          const next = new Set(prev);
                          next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id);
                          return next;
                        });
                      }}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{doc.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{matter?.name || 'N/A'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateDocument({
                        ...doc,
                        isPrivileged: !doc.isPrivileged,
                        privilegeReason: !doc.isPrivileged ? 'Attorney-Client Privilege' : undefined,
                      })}
                      className={`p-1.5 rounded-md border ${doc.isPrivileged
                        ? 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-red-200 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400'
                        }`}
                    >
                      <TagIcon className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="p-3">
                    {doc.isPrivileged ? (
                      <input
                        type="text"
                        value={doc.privilegeReason || ''}
                        onChange={e => updateDocument({ ...doc, privilegeReason: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-red-200 dark:border-red-700 rounded bg-white dark:bg-slate-700 dark:text-slate-200 text-red-700 dark:text-red-300"
                        placeholder="Enter reason..."
                      />
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">--</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                    {doc.batesNumber || '---'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${discoveryStatusColor(doc.discoveryStatus)}`}>
                      {doc.discoveryStatus || 'Draft'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="text"
                      placeholder="Exh A"
                      value={doc.exhibitNumber || ''}
                      onChange={e => updateDocument({ ...doc, exhibitNumber: e.target.value })}
                      className="w-20 text-right px-2 py-1 text-xs bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:outline-none dark:text-slate-200"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {documents.length === 0 && (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">No documents available for discovery.</div>
        )}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          {documents.length} total documents
        </div>
      </div>

      {/* Privilege Log */}
      {privilegeLog.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <LockClosedIcon className="w-4 h-4 text-red-500" /> Privilege Log
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{privilegeLog.length} documents</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {privilegeLog.map(doc => (
              <div key={doc.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.name}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{doc.privilegeReason}</p>
                </div>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{doc.batesNumber || 'No Bates #'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER: MODALS
  // ============================================================================
  const renderModals = () => (
    <>
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <DocumentArrowUpIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, DOCX, XLSX, images up to 25MB</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="e.g. Motion to Dismiss.pdf"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Matter *</label>
                <select
                  value={uploadMatterId}
                  onChange={e => setUploadMatterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                >
                  <option value="">Select a matter...</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={uploadCategoryId}
                  onChange={e => setUploadCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                >
                  <option value="">Select category...</option>
                  {MOCK_DOCUMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Folder (optional)</label>
                <input
                  type="text"
                  value={uploadFolder}
                  onChange={e => setUploadFolder(e.target.value)}
                  placeholder="e.g. Pleadings"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
              <button
                onClick={handleUpload}
                disabled={!uploadName.trim() || !uploadMatterId}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Create Folder</h3>
              <button onClick={() => setShowCreateFolder(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. Pleadings"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Matter</label>
                <select
                  value={newFolderMatterId}
                  onChange={e => setNewFolderMatterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                >
                  <option value="">Select a matter...</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowCreateFolder(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || !newFolderMatterId}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Generator Modal */}
      <DocumentGeneratorModal isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
    </>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Documents</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all firm and case-related documents, templates, signatures, and discovery.</p>
        </div>
      </div>

      {/* Tabs */}
      <TabBar active={activeTab} onChange={setActiveTab} counts={tabCounts} />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'all' && renderAllDocuments()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'esign' && renderEsign()}
        {activeTab === 'discovery' && renderDiscovery()}
      </div>

      {/* Modals */}
      {renderModals()}
    </div>
  );
};

export default Documents;
