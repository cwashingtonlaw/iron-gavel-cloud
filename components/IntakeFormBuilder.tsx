
import React, { useState } from 'react';
import { PlusIcon, TrashIcon, ArrowsUpDownIcon, EyeIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface IntakeField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required: boolean;
    options?: string[];
}

interface IntakeForm {
    id: string;
    title: string;
    description: string;
    fields: IntakeField[];
    practiceArea?: string;
}

const IntakeFormBuilder: React.FC = () => {
    const [forms, setForms] = useState<IntakeForm[]>([
        {
            id: 'intake-1',
            title: 'Initial Criminal Defense Intake',
            description: 'Standard questions for potential criminal defense clients.',
            fields: [
                { id: uuidv4(), label: 'Full Legal Name', type: 'text', required: true },
                { id: uuidv4(), label: 'Date of Birth', type: 'date', required: true },
                { id: uuidv4(), label: 'Case Number (if known)', type: 'text', required: false },
                { id: uuidv4(), label: 'Details of Incident', type: 'textarea', required: true },
                { id: uuidv4(), label: 'Referral Source', type: 'select', required: false, options: ['Google', 'Referral', 'Social Media', 'Other'] }
            ]
        }
    ]);

    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const selectedForm = forms.find(f => f.id === selectedFormId);

    const handleAddField = () => {
        if (!selectedFormId) return;
        const newField: IntakeField = { id: uuidv4(), label: 'New Field', type: 'text', required: false };
        setForms(forms.map(f => f.id === selectedFormId ? { ...f, fields: [...f.fields, newField] } : f));
    };

    const handleRemoveField = (fieldId: string) => {
        if (!selectedFormId) return;
        setForms(forms.map(f => f.id === selectedFormId ? { ...f, fields: f.fields.filter(fld => fld.id !== fieldId) } : f));
    };

    const handleUpdateField = (fieldId: string, updates: Partial<IntakeField>) => {
        if (!selectedFormId) return;
        setForms(forms.map(f => f.id === selectedFormId ? {
            ...f,
            fields: f.fields.map(fld => fld.id === fieldId ? { ...fld, ...updates } : fld)
        } : f));
    };

    const handleCreateForm = () => {
        const newForm: IntakeForm = {
            id: `intake-${Date.now()}`,
            title: 'New Intake Form',
            description: 'Describe the purpose of this form...',
            fields: []
        };
        setForms([...forms, newForm]);
        setSelectedFormId(newForm.id);
    };

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar - Forms List */}
            <div className="w-64 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Intake Forms</h3>
                    <button onClick={handleCreateForm} className="p-1 hover:bg-slate-200 rounded transition-colors text-blue-600">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {forms.map(form => (
                        <button
                            key={form.id}
                            onClick={() => { setSelectedFormId(form.id); setIsPreviewMode(false); }}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${selectedFormId === form.id ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {form.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Area - Builder / Preview */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
                {selectedForm ? (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <input
                                    value={selectedForm.title}
                                    onChange={(e) => setForms(forms.map(f => f.id === selectedForm.id ? { ...f, title: e.target.value } : f))}
                                    className="bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                />
                                <p className="text-xs text-slate-500 mt-1">{selectedForm.fields.length} fields</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isPreviewMode ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                    {isPreviewMode ? 'Back to Editor' : 'Preview Form'}
                                </button>
                                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Publish Link
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {isPreviewMode ? (
                                <div className="max-w-xl mx-auto bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedForm.title}</h2>
                                    <p className="text-slate-500 mb-8">{selectedForm.description}</p>
                                    <form className="space-y-6">
                                        {selectedForm.fields.map(field => (
                                            <div key={field.id}>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={4} />
                                                ) : field.type === 'select' ? (
                                                    <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                                        <option value="">Select option...</option>
                                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input type={field.type} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Submit Intake</button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-3xl mx-auto">
                                    <div className="mb-8">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Form Description</label>
                                        <textarea
                                            value={selectedForm.description}
                                            onChange={(e) => setForms(forms.map(f => f.id === selectedForm.id ? { ...f, description: e.target.value } : f))}
                                            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-700">Form Fields</h4>
                                        <button onClick={handleAddField} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                            <PlusIcon className="w-4 h-4" /> Add Field
                                        </button>
                                    </div>

                                    {selectedForm.fields.map((field, index) => (
                                        <div key={field.id} className="group p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 transition-all hover:bg-white hover:shadow-md">
                                            <div className="p-2 text-slate-300 cursor-move">
                                                <ArrowsUpDownIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="md:col-span-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label</label>
                                                    <input
                                                        value={field.label}
                                                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                        <option value="date">Date</option>
                                                        <option value="select">Select</option>
                                                        <option value="textarea">Text Area</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-4 pt-5">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                                            className="rounded border-slate-300 text-blue-600"
                                                        />
                                                        <span className="text-xs font-medium text-slate-600">Required</span>
                                                    </label>
                                                    <button onClick={() => handleRemoveField(field.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {selectedForm.fields.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                                            <p className="text-slate-400 text-sm">No fields added yet. Click "Add Field" to start building.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <PlusIcon className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Select or create an intake form to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntakeFormBuilder;
