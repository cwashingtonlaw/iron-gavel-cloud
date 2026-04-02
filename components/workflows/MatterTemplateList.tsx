import React from 'react';
import { MatterTemplate } from '../../types';
import { Edit2, Trash2, Layers } from 'lucide-react';

interface MatterTemplateListProps {
    matterTemplates: MatterTemplate[];
    onEdit: (template: MatterTemplate) => void;
    onDelete: (id: string) => void;
    onCreateNew: () => void;
}

export const MatterTemplateList: React.FC<MatterTemplateListProps> = ({ matterTemplates, onEdit, onDelete, onCreateNew }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matterTemplates.map((template) => (
                <div key={template.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Layers className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onEdit(template)}
                                className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(template.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description || 'No description'}</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Practice Area</span>
                            <span className="font-medium text-gray-900">{template.defaultPracticeArea || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Billing</span>
                            <span className="font-medium text-gray-900">{template.defaultBillingType}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Chains</span>
                            <span className="font-medium text-gray-900">{template.taskChainIds.length}</span>
                        </div>
                    </div>
                </div>
            ))}
            {matterTemplates.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Matter Templates</h3>
                    <p className="text-gray-500 mt-1">Create templates to standardize new matters.</p>
                    <button
                        onClick={onCreateNew}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Create your first template
                    </button>
                </div>
            )}
        </div>
    );
};
