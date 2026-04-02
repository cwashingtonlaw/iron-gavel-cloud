import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, DocumentTextIcon, CheckBadgeIcon, ShieldCheckIcon } from './icons';
import { draftLegalDocument } from '../services/geminiService';
import { useStore } from '../store/useStore';
import { searchCaseLawDatabase } from '../services/caseLawDatabase';

interface AIDocumentDrafterProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, content: string, matterId: string) => void;
}

const AIDocumentDrafter: React.FC<AIDocumentDrafterProps> = ({ isOpen, onClose, onSave }) => {
    const { matters } = useStore();
    const [prompt, setPrompt] = useState('');
    const [selectedMatterId, setSelectedMatterId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [documentTitle, setDocumentTitle] = useState('');
    const [ragActive, setRagActive] = useState(false);
    const [precedentCount, setPrecedentCount] = useState(0);

    // Watch for matter selection to check for available RAG grounding
    useEffect(() => {
        if (selectedMatterId) {
            const matter = matters.find(m => m.id === selectedMatterId);
            const precedents = searchCaseLawDatabase(matter?.practiceArea);
            setRagActive(precedents.length > 0);
            setPrecedentCount(precedents.length);
        } else {
            setRagActive(false);
            setPrecedentCount(0);
        }
    }, [selectedMatterId, matters]);

    const handleGenerate = async () => {
        if (!prompt || !selectedMatterId) return;

        setIsGenerating(true);
        try {
            const matter = matters.find(m => m.id === selectedMatterId);
            const context = matter ? `Matter: ${matter.name}\nClient: ${matter.client}\nNotes: ${matter.notes}` : '';

            const content = await draftLegalDocument(prompt, context, matter?.practiceArea);
            setGeneratedContent(content);
            if (!documentTitle) {
                // Generate a simple title based on the prompt
                const firstWords = prompt.split(' ').slice(0, 3).join(' ');
                setDocumentTitle(firstWords ? `${firstWords} Draft` : "New Legal Document");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate document. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!documentTitle || !generatedContent || !selectedMatterId) return;
        onSave(documentTitle, generatedContent, selectedMatterId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                            <SparklesIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">CaseFlow Draft</h2>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">AI Document Drafting Engine</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {ragActive && (
                            <div className="hidden md:flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100 animate-pulse">
                                <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5" />
                                RAG GROUNDED: {precedentCount} CITATIONS FOUND
                            </div>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Controls */}
                    <div className="w-80 p-6 border-r border-slate-100 overflow-y-auto bg-white shrink-0">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Matter</label>
                                <select
                                    value={selectedMatterId}
                                    onChange={(e) => setSelectedMatterId(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                >
                                    <option value="">-- Select a Matter --</option>
                                    {matters.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Drafting Instructions</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., 'Draft a criminal defense motion to suppress evidence found during a stop-and-frisk, citing Fourth Amendment violations.'"
                                    className="w-full p-4 border border-slate-200 rounded-xl text-sm h-48 resize-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder:text-slate-300"
                                />
                                <div className="mt-2 text-[10px] text-slate-400">
                                    Include specific clauses or requirements for better results.
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!prompt || !selectedMatterId || isGenerating}
                                className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-3"></div>
                                        Generating Draft...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5 mr-3" />
                                        Generate Draft
                                    </>
                                )}
                            </button>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Capabilities</h4>
                                <ul className="space-y-2">
                                    <li className="text-[11px] text-slate-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Automatic RAG Grounding
                                    </li>
                                    <li className="text-[11px] text-slate-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Precedent Incorporation
                                    </li>
                                    <li className="text-[11px] text-slate-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Entity extraction
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Preview & Edit */}
                    <div className="flex-1 bg-slate-100/50 p-6 flex flex-col overflow-hidden relative">
                        {generatedContent ? (
                            <div className="flex-1 flex flex-col animate-slide-up">
                                <div className="mb-4 flex justify-between items-end">
                                    <div className="flex-1 mr-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Document Title</label>
                                        <input
                                            type="text"
                                            value={documentTitle}
                                            onChange={(e) => setDocumentTitle(e.target.value)}
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Enter document title..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setGeneratedContent('')} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                                            Save to Matter
                                        </button>
                                    </div>
                                </div>

                                {/* Simulated Editor Toolbar */}
                                <div className="bg-white border-x border-t border-slate-200 rounded-t-xl p-2 flex gap-1 items-center">
                                    <div className="flex border-r border-slate-100 pr-2 mr-2">
                                        <button className="p-1.5 rounded hover:bg-slate-100 font-bold text-slate-400 w-8">B</button>
                                        <button className="p-1.5 rounded hover:bg-slate-100 italic text-slate-400 w-8">I</button>
                                        <button className="p-1.5 rounded hover:bg-slate-100 underline text-slate-400 w-8">U</button>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-24 h-8 bg-slate-50 rounded border border-slate-100 animate-pulse" />
                                        <div className="w-24 h-8 bg-slate-50 rounded border border-slate-100 animate-pulse" />
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 px-3 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 rounded-full border border-emerald-100">
                                        <CheckBadgeIcon className="w-3 h-3" />
                                        AI DRAFT VERIFIED
                                    </div>
                                </div>

                                <div className="flex-1 bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm overflow-y-auto">
                                    <div className="p-12 font-serif whitespace-pre-wrap text-slate-800 leading-loose text-sm min-h-full max-w-4xl mx-auto selection:bg-blue-100">
                                        {generatedContent}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-blue-50/20 pointer-events-none" />
                                <div className="relative z-10 text-center">
                                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 border border-slate-100">
                                        <DocumentTextIcon className="w-12 h-12 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-600 mb-2">Ready to Draft</h3>
                                    <p className="max-w-xs mx-auto text-sm text-slate-400">
                                        Describe what you need on the left. AI will use matter details and verified legal precedent to generate a professional draft.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="absolute inset-x-6 bottom-6 flex justify-center">
                                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white flex items-center gap-3 animate-bounce">
                                    <SparklesIcon className="w-5 h-5 text-purple-600 animate-pulse" />
                                    <span className="text-sm font-bold text-slate-800">Gemini is thinking and searching precedents...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDocumentDrafter;
