import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SparklesIcon, PlusIcon, XMarkIcon } from './icons';
import { SuggestedTimeEntry, TimeEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TimeDiscovery: React.FC = () => {
    const { suggestedTimeEntries, updateSuggestedTimeEntry, addTimeEntry, matters } = useStore();

    // For demo purposes, if suggestedTimeEntries is empty, let's show some mock ones
    const displaySuggestions = suggestedTimeEntries.length > 0 ? suggestedTimeEntries : [
        {
            id: 'suggest-1',
            activityId: 'act-1',
            userId: 'user-1',
            matterId: matters[0]?.id || 'm1',
            description: 'Drafting Motion to Suppress (Detected from Document Edit)',
            suggestedDuration: 2.5,
            status: 'Pending' as const,
            timestamp: new Date().toISOString()
        },
        {
            id: 'suggest-2',
            activityId: 'act-2',
            userId: 'user-1',
            matterId: matters[1]?.id || 'm2',
            description: 'Client Meeting: Smith Case Strategy (Detected from Calendar)',
            suggestedDuration: 1.0,
            status: 'Pending' as const,
            timestamp: new Date().toISOString()
        }
    ];

    const handleAccept = (suggestion: SuggestedTimeEntry) => {
        const newTimeEntry: TimeEntry = {
            id: uuidv4(),
            matterId: suggestion.matterId,
            date: new Date().toISOString().split('T')[0],
            description: suggestion.description,
            duration: suggestion.suggestedDuration,
            rate: 350, // Default rate
            isBilled: false,
            userId: suggestion.userId
        };
        addTimeEntry(newTimeEntry);
        updateSuggestedTimeEntry({ ...suggestion, status: 'Accepted' });
        alert('Time entry accepted and added to billing!');
    };

    const handleIgnore = (suggestionId: string) => {
        const suggestion = displaySuggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            updateSuggestedTimeEntry({ ...suggestion, status: 'Ignored' });
        }
    };

    const pendingSuggestions = displaySuggestions.filter(s => s.status === 'Pending');

    if (pendingSuggestions.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 mb-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <SparklesIcon className="w-24 h-24 text-indigo-600" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-indigo-900">AI Time Discovery</h2>
                    <span className="bg-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
                </div>

                <p className="text-sm text-indigo-700/80 mb-6 max-w-2xl">
                    Our AI has detected unbilled activity across your documents, calendar, and emails. Confirm these entries to recapture lost revenue.
                </p>

                <div className="space-y-3">
                    {pendingSuggestions.map((suggestion) => {
                        const matter = matters.find(m => m.id === suggestion.matterId);
                        return (
                            <div key={suggestion.id} className="bg-white/80 backdrop-blur-sm border border-indigo-200 p-4 rounded-xl flex items-center justify-between hover:bg-white transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {suggestion.suggestedDuration}h
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 text-sm">{suggestion.description}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-medium text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded border border-indigo-100 italic">{matter?.name || 'Unknown Matter'}</span>
                                            <span className="text-[10px] text-slate-400">Detected 2 hours ago</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAccept(suggestion)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleIgnore(suggestion.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TimeDiscovery;
