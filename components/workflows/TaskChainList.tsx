import React from 'react';
import { TaskChain } from '../../types';
import { Edit2, Trash2, GitBranch, FileText } from 'lucide-react';

interface TaskChainListProps {
    taskChains: TaskChain[];
    onEdit: (chain: TaskChain) => void;
    onDelete: (id: string) => void;
    onCreateNew: () => void;
}

export const TaskChainList: React.FC<TaskChainListProps> = ({ taskChains, onEdit, onDelete, onCreateNew }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taskChains.map((chain) => (
                <div key={chain.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <GitBranch className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onEdit(chain)}
                                className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(chain.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{chain.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{chain.description || 'No description'}</p>
                    <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        <FileText className="w-4 h-4 mr-2" />
                        {chain.items.length} Tasks
                    </div>
                </div>
            ))}
            {taskChains.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Task Chains</h3>
                    <p className="text-gray-500 mt-1">Create a task chain to automate sequences of tasks.</p>
                    <button
                        onClick={onCreateNew}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Create your first chain
                    </button>
                </div>
            )}
        </div>
    );
};
