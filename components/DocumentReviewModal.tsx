
import React, { useState, useEffect } from 'react';
import { Document, DocumentAnalysis } from '../types';
import { reviewDocument } from '../services/geminiService';
import { XMarkIcon, EyeIcon } from './icons';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

// Mocking file content since we can't actually read files
const MOCK_FILE_CONTENT = "This is a sample employment agreement between Acme Corp and John Smith, starting on June 1, 2022. The agreement includes a non-compete clause for 12 months post-termination. A key deadline for review is May 15, 2022. Please schedule a call with legal to discuss the intellectual property clause.";

const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({ isOpen, onClose, document }) => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchAnalysis = async () => {
        setIsLoading(true);
        setError('');
        setAnalysis(null);
        try {
          const result = await reviewDocument(MOCK_FILE_CONTENT);
          setAnalysis(result);
        } catch (e) {
          setError((e as Error).message || 'Failed to analyze document.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <EyeIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold ml-3 text-slate-800">AI Document Analysis</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-slate-600 mb-4">
            AI-generated analysis for: <span className="font-semibold text-slate-800">{document.name}</span>
          </p>
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          {analysis && !isLoading && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-800">Summary</h3>
                <p className="text-sm text-slate-600 mt-1">{analysis.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-800">Key Entities</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.keyEntities.map((entity, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{entity.name} ({entity.type})</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-800">Important Dates</h3>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {analysis.importantDates.map((date, i) => (
                    <li key={i} className="text-sm text-slate-600"><span className="font-medium">{date.date}:</span> {date.description}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-800">Suggested Action Items</h3>
                 <ul className="list-disc list-inside mt-1 space-y-1">
                  {analysis.actionItems.map((item, i) => (
                    <li key={i} className="text-sm text-slate-600">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
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

export default DocumentReviewModal;
