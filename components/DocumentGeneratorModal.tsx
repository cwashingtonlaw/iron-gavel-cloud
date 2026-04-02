
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { XMarkIcon, DocumentTextIcon, ChevronRightIcon } from './icons';
import { MOCK_DOCUMENT_TEMPLATES } from '../constants';
import { DocumentTemplate } from '../types';

interface DocumentGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({ isOpen, onClose }) => {
    const { matters, addDocument } = useStore();
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [selectedMatterId, setSelectedMatterId] = useState('');
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [step, setStep] = useState<1 | 2>(1);

    const handleNext = () => {
        if (!selectedTemplate || !selectedMatterId) return;
        setStep(2);

        // Auto-fill variables if possible
        const matter = matters.find(m => m.id === selectedMatterId);
        const newValues = { ...variableValues };
        if (matter) {
            if (selectedTemplate.variables.includes('Client Name')) newValues['Client Name'] = matter.client;
            if (selectedTemplate.variables.includes('Date')) newValues['Date'] = new Date().toLocaleDateString();
            if (selectedTemplate.variables.includes('Case Number')) newValues['Case Number'] = matter.id;
            if (selectedTemplate.variables.includes('Case Name')) newValues['Case Name'] = matter.name;
        }
        setVariableValues(newValues);
    };

    const handleGenerate = () => {
        if (!selectedTemplate) return;

        let content = selectedTemplate.content;
        Object.entries(variableValues).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });

        const newDoc = {
            id: `DOC_${Date.now()}`,
            name: `${selectedTemplate.name.replace('.docx', '')} - ${variableValues['Client Name'] || 'Generated'}.docx`,
            category: { id: 'DC_3', name: 'Contracts' },
            uploadDate: new Date().toISOString().split('T')[0],
            size: '24 KB',
            matterId: selectedMatterId,
            versions: [{ version: 1, date: new Date().toISOString(), uploader: 'Christopher Washington' }],
            sharedWithClient: false,
            esignStatus: 'None' as const
        };

        addDocument(newDoc);
        alert('Document generated and added to matter!');
        onClose();
        reset();
    };

    const reset = () => {
        setSelectedTemplate(null);
        setSelectedMatterId('');
        setVariableValues({});
        setStep(1);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Generate from Template</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">1. Select Template</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {MOCK_DOCUMENT_TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template)}
                                            className={`flex items-center p-3 rounded-lg border text-left transition-colors ${selectedTemplate?.id === template.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <DocumentTextIcon className={`w-5 h-5 mr-3 ${selectedTemplate?.id === template.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                            <div>
                                                <p className="font-medium text-sm text-slate-800">{template.name}</p>
                                                <p className="text-xs text-slate-500">{template.category}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">2. Select Matter</label>
                                <select
                                    value={selectedMatterId}
                                    onChange={(e) => setSelectedMatterId(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="">Select a matter...</option>
                                    {matters.map(matter => (
                                        <option key={matter.id} value={matter.id}>{matter.id} - {matter.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center text-sm font-medium text-blue-600 mb-4 cursor-pointer" onClick={() => setStep(1)}>
                                <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Selection
                            </div>

                            <h3 className="font-semibold text-slate-800">Fill Template Variables</h3>
                            <p className="text-xs text-slate-500">Provide values for the placeholders in {selectedTemplate?.name}</p>

                            <div className="space-y-4">
                                {selectedTemplate?.variables.map(variable => (
                                    <div key={variable}>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">{variable}</label>
                                        <input
                                            type="text"
                                            value={variableValues[variable] || ''}
                                            onChange={(e) => setVariableValues(prev => ({ ...prev, [variable]: e.target.value }))}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                            placeholder={`Enter ${variable}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    {step === 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!selectedTemplate || !selectedMatterId}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                        >
                            Next <ChevronRightIcon className="ml-2 w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                            Generate Document
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentGeneratorModal;

import { ArrowLeftIcon } from './icons';
