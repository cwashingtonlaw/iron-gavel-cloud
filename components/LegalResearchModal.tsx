import React, { useState } from 'react';
import { findLegalPrecedent } from '../services/geminiService';
import { Matter } from '../types';
import { XMarkIcon, ScaleIcon } from './icons';

interface LegalResearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    matter?: Matter; // Optional context
}

interface LegalPrecedent {
    citation: string;
    summary: string;
    holding: string;
}

const LegalResearchModal: React.FC<LegalResearchModalProps> = ({ isOpen, onClose, matter }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LegalPrecedent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            // If no matter is provided, we use a dummy matter for context or handle it in service
            // For now, let's assume we need a matter context, or we can make the service optional
            const contextMatter = matter || {
                id: 'temp',
                name: 'General Research',
                client: 'N/A',
                practiceArea: 'General',
                status: 'Open',
                notes: 'General legal research query.'
            } as Matter;

            const data = await findLegalPrecedent(contextMatter, query);
            setResults(data);
        } catch (err) {
            console.error(err);
            setError('Failed to retrieve legal precedents. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div className="flex items-center">
                        <ScaleIcon className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-lg font-semibold ml-3 text-slate-800">Vincent AI Legal Research</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Area */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Enter legal issue, case name, or statute (e.g., 'slip and fall comparative negligence California')"
                            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isLoading || !query.trim()}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isLoading ? 'Researching...' : 'Search Law'}
                        </button>
                    </div>
                    {matter && (
                        <p className="text-xs text-slate-500 mt-2">
                            Context: <span className="font-medium">{matter.name}</span> ({matter.practiceArea})
                        </p>
                    )}
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {isLoading && (
                        <div className="space-y-6 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-3"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-center">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && results.length === 0 && (
                        <div className="text-center text-slate-500 mt-20">
                            <ScaleIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-lg font-medium">No research results yet</p>
                            <p className="text-sm">Enter a query above to search the global legal library.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <div key={index} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-indigo-700 mb-2 font-serif">{result.citation}</h3>
                                <div className="mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Summary</span>
                                    <p className="text-slate-700 mt-1 leading-relaxed">{result.summary}</p>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Key Holding</span>
                                    <p className="text-indigo-900 mt-1 text-sm font-medium">{result.holding}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalResearchModal;
