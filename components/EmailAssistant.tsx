import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, PaperAirplaneIcon } from './icons';
import { draftEmail } from '../services/geminiService';

interface EmailAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (content: string) => void;
}

const EmailAssistant: React.FC<EmailAssistantProps> = ({ isOpen, onClose, onInsert }) => {
    const [recipient, setRecipient] = useState('');
    const [tone, setTone] = useState('Professional');
    const [points, setPoints] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState('');

    const handleGenerate = async () => {
        if (!points) return;

        setIsGenerating(true);
        try {
            const content = await draftEmail(recipient || 'Client', tone, points);
            setGeneratedEmail(content);
        } catch (error) {
            console.error(error);
            alert("Failed to generate email. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsert = () => {
        if (!generatedEmail) return;
        onInsert(generatedEmail);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div className="flex items-center">
                        <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
                        <h2 className="text-lg font-bold text-slate-800">Smart Email Assistant</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name (Optional)</label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="e.g. Mr. Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="Professional">Professional</option>
                                    <option value="Empathetic">Empathetic</option>
                                    <option value="Firm">Firm</option>
                                    <option value="Concise">Concise</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Key Points to Cover</label>
                            <textarea
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                placeholder="E.g., 'Confirm receipt of documents, schedule a meeting for next Tuesday at 2 PM, and remind about the upcoming court date.'"
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm h-32 resize-none focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        {!generatedEmail && (
                            <button
                                onClick={handleGenerate}
                                disabled={!points || isGenerating}
                                className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Drafting...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5 mr-2" />
                                        Generate Draft
                                    </>
                                )}
                            </button>
                        )}

                        {generatedEmail && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Generated Draft</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 whitespace-pre-wrap mb-4">
                                    {generatedEmail}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setGeneratedEmail('')}
                                        className="flex-1 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={handleInsert}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                                    >
                                        <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                                        Insert into Email
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailAssistant;
