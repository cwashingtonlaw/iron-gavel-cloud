import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TaskChain, MatterTemplate } from '../../types';
import { TaskChainBuilder } from './TaskChainBuilder';
import { MatterTemplateBuilder } from './MatterTemplateBuilder';
import { WorkflowHeader } from './WorkflowHeader';
import { TaskChainList } from './TaskChainList';
import { MatterTemplateList } from './MatterTemplateList';
import { GitBranch, Layers } from 'lucide-react';

export const WorkflowsPage: React.FC = () => {
    const { taskChains, deleteTaskChain, matterTemplates, deleteMatterTemplate } = useStore();
    const [activeTab, setActiveTab] = useState<'chains' | 'templates'>('chains');
    const [editingChain, setEditingChain] = useState<TaskChain | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<MatterTemplate | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleEditChain = (chain: TaskChain) => {
        setEditingChain(chain);
        setIsCreating(true);
    };

    const handleEditTemplate = (template: MatterTemplate) => {
        setEditingTemplate(template);
        setIsCreating(true);
    };

    const handleCreateNew = () => {
        setEditingChain(null);
        setEditingTemplate(null);
        setIsCreating(true);
    };

    const handleCloseBuilder = () => {
        setIsCreating(false);
        setEditingChain(null);
        setEditingTemplate(null);
    };

    if (isCreating) {
        if (activeTab === 'chains') {
            return (
                <TaskChainBuilder
                    existingChain={editingChain || undefined}
                    onSave={handleCloseBuilder}
                    onCancel={handleCloseBuilder}
                />
            );
        } else {
            return (
                <MatterTemplateBuilder
                    existingTemplate={editingTemplate || undefined}
                    onSave={handleCloseBuilder}
                    onCancel={handleCloseBuilder}
                />
            );
        }
    }

    return (
        <div className="space-y-6">
            <WorkflowHeader activeTab={activeTab} onCreateNew={handleCreateNew} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('chains')}
                            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'chains'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <GitBranch className="w-4 h-4 mr-2" />
                            Task Chains
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'templates'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Layers className="w-4 h-4 mr-2" />
                            Matter Templates
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'chains' ? (
                        <TaskChainList
                            taskChains={taskChains}
                            onEdit={handleEditChain}
                            onDelete={deleteTaskChain}
                            onCreateNew={handleCreateNew}
                        />
                    ) : (
                        <MatterTemplateList
                            matterTemplates={matterTemplates}
                            onEdit={handleEditTemplate}
                            onDelete={deleteMatterTemplate}
                            onCreateNew={handleCreateNew}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
