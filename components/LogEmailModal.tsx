import React, { useState } from 'react';
import { summarizeEmailForLog } from '../services/geminiService';
import { XMarkIcon, SparklesIcon } from './icons';

interface LogEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogEmailModal: React.FC<LogEmailModalProps> = ({ isOpen, onClose }) => {
  const [emailText, setEmailText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState<{ from: string, to: string, subject: string, summary: string } | null>(null);

  const handleSummarize = async () => {
    if (!emailText.trim()) {
        setError("Please paste the email content first.");
        return;
    }
    setIsLoading(true);
    setError('');
    setParsedData(null);
    try {
      const result = await summarizeEmailForLog(emailText);
      setParsedData(result);
    } catch (e) {
      setError('Failed to summarize email.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Log Email Communication</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Paste Email Content</label>
                <textarea 
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    rows={8}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="Paste the full email content here, including headers..."
                />
            </div>
            <button
                onClick={handleSummarize}
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400"
            >
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isLoading ? 'Analyzing...' : 'Summarize with AI'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {parsedData && (
                 <div className="space-y-3 pt-4 border-t border-slate-200">
                     <h3 className="font-semibold text-slate-800">Generated Log Entry</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-500">From</label>
                            <input type="text" value={parsedData.from} readOnly className="w-full p-2 mt-1 bg-slate-100 border border-slate-300 rounded-lg text-sm"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">To</label>
                            <input type="text" value={parsedData.to} readOnly className="w-full p-2 mt-1 bg-slate-100 border border-slate-300 rounded-lg text-sm"/>
                        </div>
                     </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Subject</label>
                        <input type="text" value={parsedData.subject} readOnly className="w-full p-2 mt-1 bg-slate-100 border border-slate-300 rounded-lg text-sm"/>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Summary</label>
                        <textarea rows={4} value={parsedData.summary} readOnly className="w-full p-2 mt-1 bg-slate-100 border border-slate-300 rounded-lg text-sm"/>
                      </div>
                 </div>
            )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm">Cancel</button>
            <button disabled={!parsedData} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm disabled:bg-slate-400">Save to Communications</button>
        </div>
      </div>
    </div>
  );
};

export default LogEmailModal;