import React from 'react';
import { Plus } from 'lucide-react';

interface WorkflowHeaderProps {
    activeTab: 'chains' | 'templates';
    onCreateNew: () => void;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ activeTab, onCreateNew }) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
                <p className="text-gray-500 mt-1">Manage task chains and matter templates to automate your practice.</p>
            </div>
            <button
                onClick={onCreateNew}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <Plus className="w-5 h-5 mr-2" />
                Create {activeTab === 'chains' ? 'Task Chain' : 'Template'}
            </button>
        </div>
    );
};
