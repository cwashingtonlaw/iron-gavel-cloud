import React, { useState, useMemo, useEffect } from 'react';
import { Contact } from '../types';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon,
  UserCircleIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon,
  XMarkIcon, TrashIcon, PencilSquareIcon, TagIcon, CheckCircleIcon,
  EllipsisHorizontalIcon, BriefcaseIcon, ListBulletIcon, Squares2X2Icon
} from './icons';
import AddContactModal from './AddContactModal';

const Contacts: React.FC = () => {
  const { addContact, updateContact, deleteContact } = useStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contacts').then(setContacts).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/matters').then(setMatters).catch(console.error);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredContacts = useMemo(() => {
    let result = contacts;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterType !== 'All') {
      if (filterType === 'Companies') result = result.filter(c => c.isCompany);
      else result = result.filter(c => c.type === filterType);
    }
    result.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type));
    return result;
  }, [contacts, searchTerm, filterType, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredContacts.map(c => c.id)));
  };

  const handleExportCSV = () => {
    const data = (selectedIds.size > 0 ? filteredContacts.filter(c => selectedIds.has(c.id)) : filteredContacts);
    const header = 'Name,Email,Phone,Type,Company,Tags\n';
    const rows = data.map(c => `"${c.name}","${c.email}","${c.phone}","${c.type}","${c.companyName || ''}","${c.tags?.join(';') || ''}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteContact(id));
    setSelectedIds(new Set());
  };

  const getTypePill = (type: Contact['type']) => {
    switch (type) {
      case 'Client': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      case 'Potential Client': return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300';
      case 'Counsel': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300';
      case 'Witness': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const contactMatters = (c: Contact) => matters.filter(m => c.associatedMatters?.includes(m.id) || m.client === c.name);

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Contacts</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{contacts.length} total contacts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
              <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" /> Export
            </button>
            <button onClick={() => { setEditingContact(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm">
              <PlusIcon className="w-4 h-4 mr-1.5" /> Add Contact
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, phone, tag..." className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
            <option value="All">All Types</option>
            <option value="Client">Clients</option>
            <option value="Counsel">Counsel</option>
            <option value="Witness">Witnesses</option>
            <option value="Potential Client">Potential Clients</option>
            <option value="Companies">Companies</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
          </select>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-white dark:bg-slate-900 text-slate-500'}`}><ListBulletIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-white dark:bg-slate-900 text-slate-500'}`}><Squares2X2Icon className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg flex items-center gap-4 text-sm">
            <span className="font-medium text-blue-800 dark:text-blue-300">{selectedIds.size} selected</span>
            <button onClick={handleDeleteSelected} className="flex items-center gap-1 text-red-600 hover:underline"><TrashIcon className="w-4 h-4" /> Delete</button>
            <button onClick={handleExportCSV} className="flex items-center gap-1 text-blue-600 hover:underline"><ArrowDownTrayIcon className="w-4 h-4" /> Export</button>
            <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-slate-500 hover:text-slate-700"><XMarkIcon className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex gap-4">
          {/* Main content */}
          <div className={`flex-1 ${selectedContact ? 'hidden lg:block' : ''}`}>
            {viewMode === 'table' ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
                    <tr>
                      <th className="p-3 w-10"><input type="checkbox" checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300" /></th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Email</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Phone</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Type</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Matters</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(contact => (
                      <tr key={contact.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedContact(contact)}>
                        <td className="p-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded border-slate-300" /></td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                              {contact.isCompany ? <BuildingOfficeIcon className="w-4 h-4" /> : contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{contact.name}</p>
                              {contact.companyName && <p className="text-xs text-slate-500">{contact.companyName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">{contact.email}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">{contact.phone}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getTypePill(contact.type)}`}>{contact.type}</span></td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 hidden lg:table-cell">{contactMatters(contact).length}</td>
                        <td className="p-3 hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {contact.tags?.slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] rounded">{t}</span>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredContacts.length === 0 && (
                  <div className="text-center py-12">
                    <UserCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No contacts found.</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredContacts.map(contact => (
                  <div key={contact.id} onClick={() => setSelectedContact(contact)} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                        {contact.isCompany ? <BuildingOfficeIcon className="w-5 h-5" /> : contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{contact.name}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getTypePill(contact.type)}`}>{contact.type}</span>
                      </div>
                    </div>
                    {contact.email && <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><EnvelopeIcon className="w-3 h-3" />{contact.email}</p>}
                    {contact.phone && <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><PhoneIcon className="w-3 h-3" />{contact.phone}</p>}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{contactMatters(contact).length} matters</span>
                      <div className="flex gap-1">{contact.tags?.slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-[10px] rounded text-slate-600 dark:text-slate-400">{t}</span>)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Sidebar */}
          {selectedContact && (
            <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex-shrink-0 h-fit sticky top-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400">
                    {selectedContact.isCompany ? <BuildingOfficeIcon className="w-6 h-6" /> : selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{selectedContact.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getTypePill(selectedContact.type)}`}>{selectedContact.type}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-sm">
                {selectedContact.email && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><EnvelopeIcon className="w-4 h-4 text-slate-400" />{selectedContact.email}</div>}
                {selectedContact.phone && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><PhoneIcon className="w-4 h-4 text-slate-400" />{selectedContact.phone}</div>}
                {selectedContact.companyName && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><BuildingOfficeIcon className="w-4 h-4 text-slate-400" />{selectedContact.companyName}</div>}
                {selectedContact.title && <p className="text-slate-500 text-xs italic">{selectedContact.title}</p>}
              </div>

              {/* Tags */}
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedContact.tags.map(t => <span key={t} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedContact.notes && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedContact.notes}</p>
                </div>
              )}

              {/* Associated Matters */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Associated Matters</h4>
                <div className="space-y-2">
                  {contactMatters(selectedContact).map(m => (
                    <div key={m.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-sm">
                      <BriefcaseIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 truncate">{m.name}</span>
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${m.status === 'Open' ? 'bg-green-100 text-green-700' : m.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>{m.status}</span>
                    </div>
                  ))}
                  {contactMatters(selectedContact).length === 0 && <p className="text-xs text-slate-400 italic">No associated matters.</p>}
                </div>
              </div>

              {/* Portal Access */}
              <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Client Portal Access</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${selectedContact.hasPortalAccess ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {selectedContact.hasPortalAccess ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setEditingContact(selectedContact); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  <PencilSquareIcon className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { deleteContact(selectedContact.id); setSelectedContact(null); }} className="flex items-center justify-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddContactModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingContact(null); }}
        onAddContact={addContact}
        contact={editingContact}
        onUpdateContact={updateContact}
      />
    </>
  );
};

export default Contacts;
