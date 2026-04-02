import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
    Search,
    FileText,
    Scale,
    Calendar,
    ChevronRight,
    ExternalLink,
    Loader2,
    Sparkles,
    Command,
    CheckCircle,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { advancedSearch, indexDocuments } from '../services/searchEngineService';
import { DocumentSearchResult } from '../types';

export const AdvancedSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DocumentSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { documents, addAuditLog, currentUser } = useStore();

    // Indexing on load (in practical use, this would be reactive or server-side)
    useEffect(() => {
        indexDocuments(documents, []); // Passing empty OCR results for now
    }, [documents]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);

        // Simulate deep indexing traversal
        setTimeout(() => {
            const searchResults = advancedSearch({
                query,
                filters: {},
                fuzzyMatch: true,
                maxResults: 10
            });
            setResults(searchResults);
            setIsSearching(false);

            addAuditLog({
                userId: currentUser.id,
                userName: currentUser.name,
                action: 'VIEW',
                entityType: 'Document',
                entityId: 'search',
                entityName: `Searched documents for: "${query}"`
            });
        }, 800);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div className="text-center space-y-4 pt-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3" /> OCR-Enabled Intelligence
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight">Search Case Intel</h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    Traverse thousands of documents, depositions, and pleadings with sub-second retrieval.
                </p>
            </div>

            <div className="relative group max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="relative z-10 flex items-center p-2 bg-white rounded-3xl border-2 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] focus-within:border-indigo-500 transition-all duration-300">
                    <div className="pl-6 text-slate-400">
                        <Command className="w-6 h-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search keywords, phrases, or entities across all discovery..."
                        className="flex-1 px-4 py-6 text-xl text-slate-900 placeholder:text-slate-400 outline-none font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all group-active:scale-95 shadow-lg shadow-indigo-100"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Discovery Search
                    </button>
                </form>
                <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-full -z-10 group-focus-within:bg-indigo-500/10 transition-colors" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{results.length} Intel Matches</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                            <CheckCircle className="w-3 h-3" /> AI Ranked by Relevance
                        </div>
                    </div>

                    <div className="space-y-4">
                        {results.map((res, i) => (
                            <div
                                key={res.documentId}
                                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer group animate-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                        <FileText className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{res.documentName}</h4>
                                            <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded tracking-tighter">
                                                MATCH: {Math.round((1 - res.score) * 100)}%
                                            </span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed italic text-sm border-l-2 border-slate-100 pl-4 py-1">
                                            "...{res.preview}..."
                                        </p>
                                        <div className="flex items-center gap-4 pt-2">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <Scale className="w-3.5 h-3.5" /> Matter No: 2026-PI-09
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <Calendar className="w-3.5 h-3.5" /> Filed Jan 15
                                            </span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {results.length === 0 && !isSearching && query && (
                            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">No deep-intel matches for "{query}"</p>
                                <p className="text-slate-400 text-sm">Try broader keywords or browse by matter</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Command className="w-5 h-5 text-indigo-400" />
                            Advanced Filters
                        </h3>

                        <div className="space-y-4">
                            <FilterGroup label="Intel Type" options={['Depositions', 'Pleadings', 'Evidence', 'Emails']} />
                            <FilterGroup label="Date Range" options={['Last 7 Days', 'Last 30 Days', 'Current Matter', 'All Time']} />
                            <FilterGroup label="Jurisdiction" options={['Federal', 'State', 'Appellate']} />
                        </div>

                        <div className="pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">Indexing Status</span>
                                <span className="text-xs text-emerald-400 font-black">ACTIVE</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-emerald-500" />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Last sync: 2 minutes ago
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FilterGroup = ({ label, options }: { label: string, options: string[] }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <div className="flex flex-wrap gap-2">
            {options.map((opt, i) => (
                <button key={opt} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                    {opt}
                </button>
            ))}
        </div>
    </div>
);
