import React, { useState, useEffect } from 'react';
import { Matter, Contact, DocumentTemplate } from '../types';
import { generateDocument, convertToTemplate } from '../services/geminiService';
import { XMarkIcon, SparklesIcon, DocumentPlusIcon } from './icons';
import { useStore } from '../store/useStore';

interface DocumentAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter: Matter;
  contacts: Contact[];
}

const DocumentAutomationModal: React.FC<DocumentAutomationModalProps> = ({ isOpen, onClose, matter, contacts }) => {
  const { documentTemplates, addDocumentTemplate } = useStore();
  const [activeTab, setActiveTab] = useState<'generate' | 'create'>('generate');

  // Generate State
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  // Create Template State
  const [newTemplateText, setNewTemplateText] = useState('');
  const [convertedTemplate, setConvertedTemplate] = useState<{ templateText: string, variables: string[] } | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError("Please select a template.");
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedDoc('');
    try {
      const result = await generateDocument(selectedTemplate, matter, contacts);
      setGeneratedDoc(result);
    } catch (e) {
      setError('Failed to generate document.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToTemplate = async () => {
    if (!newTemplateText.trim()) return;
    setIsConverting(true);
    setError('');
    try {
      const result = await convertToTemplate(newTemplateText);
      setConvertedTemplate(result);
    } catch (e) {
      setError('Failed to convert text to template.');
      console.error(e);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!convertedTemplate || !newTemplateName) return;

    const newTemplate: DocumentTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      description: newTemplateDesc || 'Custom template',
      content: convertedTemplate.templateText,
      variables: convertedTemplate.variables,
      category: 'Custom',
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: 'Current User'
    };

    addDocumentTemplate(newTemplate);
    setActiveTab('generate');
    // Reset create state
    setNewTemplateText('');
    setConvertedTemplate(null);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setSelectedTemplate(newTemplate); // Auto-select the new template
  };

  useEffect(() => {
    // Reset state when modal is closed or matter changes
    if (!isOpen) {
      setGeneratedDoc('');
      setError('');
      setSelectedTemplate(null);
      setActiveTab('generate');
      setNewTemplateText('');
      setConvertedTemplate(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold ml-3 text-slate-800">AI Document Automation</h2>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'generate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Generate
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Create Template
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'generate' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Select Template</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {documentTemplates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-100'}`}
                    >
                      <p className="font-medium text-sm text-slate-800">{template.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedTemplate || isLoading}
                  className="w-full mt-4 flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate Document'}
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Generated Document Preview</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 h-96 overflow-y-auto">
                  {isLoading && (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                  )}
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {generatedDoc && (
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{generatedDoc}</pre>
                  )}
                  {!generatedDoc && !isLoading && !error && (
                    <p className="text-sm text-slate-400 text-center pt-16">Preview will appear here.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="flex flex-col h-full">
                <h3 className="font-semibold text-slate-800 mb-2">Paste Document Text</h3>
                <p className="text-xs text-slate-500 mb-2">Paste an existing document here. AI will identify variables (names, dates, etc.) and create a reusable template.</p>
                <textarea
                  value={newTemplateText}
                  onChange={(e) => setNewTemplateText(e.target.value)}
                  placeholder="Paste legal document text here..."
                  className="flex-1 w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                />
                <button
                  onClick={handleConvertToTemplate}
                  disabled={!newTemplateText.trim() || isConverting}
                  className="w-full flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isConverting ? (
                    <span className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 animate-spin" /> Converting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4" /> Convert to Template
                    </span>
                  )}
                </button>
              </div>
              <div className="flex flex-col h-full">
                <h3 className="font-semibold text-slate-800 mb-2">Template Preview</h3>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-y-auto mb-4">
                  {convertedTemplate ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Variables Found</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {convertedTemplate.variables.map((v, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-mono">{v}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Template Text</label>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans mt-1 p-2 bg-white border border-slate-200 rounded">{convertedTemplate.templateText}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <DocumentPlusIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">Converted template will appear here</p>
                    </div>
                  )}
                </div>
                {convertedTemplate && (
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      placeholder="Template Name (e.g., NDA Agreement)"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description (Optional)"
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                    <button
                      onClick={handleSaveTemplate}
                      disabled={!newTemplateName}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-slate-400"
                    >
                      Save Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            disabled={!generatedDoc}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm disabled:bg-slate-400"
          >
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAutomationModal;
