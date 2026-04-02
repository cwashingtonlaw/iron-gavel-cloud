
import React, { useState, useEffect } from 'react';
import { Matter } from '../types';
import { generateCaseSummary } from '../services/geminiService';
import { XMarkIcon, SparklesIcon } from './icons';

interface CaseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter: Matter;
}

const CaseSummaryModal: React.FC<CaseSummaryModalProps> = ({ isOpen, onClose, matter }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');
        try {
          const result = await generateCaseSummary(matter.notes);
          setSummary(result);
        } catch (e) {
          setError('Failed to generate summary.');
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [isOpen, matter]);

  if (!isOpen) {
    return null;
  }
  
  const formattedSummary = summary
    .replace(/(\bCase Overview\b|\bKey Parties\b|\bRecent Developments\b|\bNext Steps\b)/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold ml-3 text-slate-800">AI Case Summary</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-slate-600 mb-4">
              AI-generated summary for matter: <span className="font-semibold text-slate-800">{matter.name}</span>
            </p>
          {isLoading && (
            <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                <div className="h-4 bg-slate-200 rounded w-full mt-6"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          {summary && !isLoading && (
            <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: formattedSummary }} />
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right rounded-b-xl">
            <button
                onClick={onClose}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors text-sm"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default CaseSummaryModal;
