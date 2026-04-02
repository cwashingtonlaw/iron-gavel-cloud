
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, Bars3Icon, ScaleIcon, PlusIcon, BriefcaseIcon, ClockIcon, UsersIcon, CheckCircleIcon, DocumentTextIcon, MagnifyingGlassIcon } from './icons';
import { useStore } from '../store/useStore';
import { performNaturalLanguageSearch } from '../services/geminiService';
import { SearchResult, Matter, Contact, Document } from '../types';
import LegalResearchModal from './LegalResearchModal';
import GlobalTimer from './GlobalTimer';

interface HeaderProps {
  onMenuClick: () => void;
  onOpenCommandPalette: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const { currentUser, matters, contacts, documents } = useStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLegalResearchOpen, setIsLegalResearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotificationsOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) setIsQuickAddOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Notifications from store activities
  const { activities } = useStore();
  const recentNotifications = activities.slice(0, 10);
  const unreadCount = Math.min(recentNotifications.length, 5);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);

    const accessibleMatters = matters.filter(m => !m.allowedUserIds || m.allowedUserIds.includes(currentUser.id));
    const accessibleMatterIds = accessibleMatters.map(m => m.id);
    const accessibleDocuments = documents.filter(d => accessibleMatterIds.includes(d.matterId));
    const accessibleContacts = contacts.filter(c => c.associatedMatters.some(mId => accessibleMatterIds.includes(mId)) || c.type === 'Client');

    try {
      if (query.endsWith('?')) {
        const results = await performNaturalLanguageSearch(query, {
          matters: accessibleMatters,
          documents: accessibleDocuments,
          communications: [],
        });
        setSearchResults(results);
      } else {
        const lowerQuery = query.toLowerCase();
        const results = {
          keywordResults: {
            matters: accessibleMatters.filter(m => m.name.toLowerCase().includes(lowerQuery) || m.client.toLowerCase().includes(lowerQuery)),
            contacts: accessibleContacts.filter(c => c.name.toLowerCase().includes(lowerQuery) || c.email?.toLowerCase().includes(lowerQuery)),
            documents: accessibleDocuments.filter(d => d.name.toLowerCase().includes(lowerQuery)),
          }
        };
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const quickAddItems = [
    { label: 'New Matter', icon: <BriefcaseIcon className="w-4 h-4" />, path: '/matters', color: 'text-blue-600' },
    { label: 'New Contact', icon: <UsersIcon className="w-4 h-4" />, path: '/contacts', color: 'text-emerald-600' },
    { label: 'New Task', icon: <CheckCircleIcon className="w-4 h-4" />, path: '/tasks', color: 'text-purple-600' },
    { label: 'Log Time', icon: <ClockIcon className="w-4 h-4" />, path: '/billing', color: 'text-amber-600' },
    { label: 'Upload Document', icon: <DocumentTextIcon className="w-4 h-4" />, path: '/documents', color: 'text-rose-600' },
  ];

  const SearchResultsDropdown = () => {
    if (!searchResults) return null;

    if ('answer' in searchResults) {
      return (
        <div className="absolute top-full mt-2 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50">
          <p className="text-sm font-semibold text-blue-600 mb-2">AI Answer:</p>
          <p className="text-sm text-slate-800 dark:text-slate-200">{searchResults.answer}</p>
          <div className="mt-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Sources</h4>
            <ul className="mt-2 space-y-2">
              {searchResults.sources.map(source => (
                <li key={source.id} className="text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{source.title}</p>
                  <p className="text-slate-500 italic">"{source.snippet}"</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    const { matters: mResults, contacts: cResults, documents: dResults } = (searchResults as any).keywordResults;
    if (mResults.length === 0 && cResults.length === 0 && dResults.length === 0) {
      return (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50">
          <p className="text-sm text-slate-500 text-center">No results found. Try ending with ? for AI search.</p>
        </div>
      );
    }

    return (
      <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto z-50">
        {mResults.length > 0 && (
          <div>
            <h3 className="p-3 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900">Matters ({mResults.length})</h3>
            <ul>{mResults.slice(0, 5).map((m: Matter) => (
              <li key={m.id} className="p-3 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2" onClick={() => { navigate(`/matters/edit/${m.id}`); setSearchResults(null); setSearchQuery(''); }}>
                <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                  <span className="text-slate-500 ml-2 text-xs">{m.client}</span>
                </div>
              </li>
            ))}</ul>
          </div>
        )}
        {cResults.length > 0 && (
          <div>
            <h3 className="p-3 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900">Contacts ({cResults.length})</h3>
            <ul>{cResults.slice(0, 5).map((c: Contact) => (
              <li key={c.id} className="p-3 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2" onClick={() => { navigate('/contacts'); setSearchResults(null); setSearchQuery(''); }}>
                <UsersIcon className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                  <span className="text-slate-500 ml-2 text-xs">{c.type}</span>
                </div>
              </li>
            ))}</ul>
          </div>
        )}
        {dResults.length > 0 && (
          <div>
            <h3 className="p-3 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900">Documents ({dResults.length})</h3>
            <ul>{dResults.slice(0, 5).map((d: Document) => (
              <li key={d.id} className="p-3 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2" onClick={() => { navigate('/documents'); setSearchResults(null); setSearchQuery(''); }}>
                <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{d.name}</span>
              </li>
            ))}</ul>
          </div>
        )}
      </div>
    );
  };


  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 z-40">
      <div className="flex items-center flex-1">
        <button onClick={onMenuClick} className="md:hidden mr-4 text-slate-500 hover:text-slate-800 dark:text-slate-400" aria-label="Open sidebar">
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search matters, contacts, documents..."
            className="w-full pl-9 pr-16 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setSearchResults(null), 200)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching && <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
            {!isSearching && !searchQuery && (
              <button
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[10px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-xs">⌘</span>K
              </button>
            )}
          </div>
          {searchResults && <SearchResultsDropdown />}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Quick Add */}
        <div className="relative" ref={quickAddRef}>
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
          {isQuickAddOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
              {quickAddItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setIsQuickAddOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className={item.color}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <GlobalTimer />

        <button
          onClick={() => setIsLegalResearchOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
        >
          <ScaleIcon className="w-4 h-4" />
          <span>Research</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 relative p-1" aria-label="Notifications">
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
              <div className="p-3 font-semibold border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex justify-between items-center">
                <span>Notifications</span>
                <button className="text-xs text-blue-600 hover:underline">Mark all read</button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 && (
                  <li className="p-4 text-sm text-slate-500 text-center">No notifications yet.</li>
                )}
                {recentNotifications.map((activity, i) => (
                  <li key={activity.id || i} className={`p-3 border-b border-slate-100 dark:border-slate-700 ${i < 3 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.date ? new Date(activity.date).toLocaleString() : ''}</p>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                <button onClick={() => { navigate('/activities'); setIsNotificationsOpen(false); }} className="w-full text-center text-sm text-blue-600 hover:underline py-1">
                  View All Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/settings')}>
          <img
            src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`}
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
          />
          <div className="hidden lg:block">
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500">{currentUser.role}</p>
          </div>
        </div>
      </div>
      <LegalResearchModal isOpen={isLegalResearchOpen} onClose={() => setIsLegalResearchOpen(false)} />
    </header>
  );
};

export default Header;
