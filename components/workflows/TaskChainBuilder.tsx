import React from 'react';
import { useStore } from '../../store/useStore';
import { TaskChain, TaskChainItem } from '../../types';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskChainSchema, TaskChainFormData } from '../../schemas/workflowSchemas';

interface TaskChainBuilderProps {
    existingChain?: TaskChain;
    onSave: () => void;
    onCancel: () => void;
}

export const TaskChainBuilder: React.FC<TaskChainBuilderProps> = ({ existingChain, onSave, onCancel }) => {
    const { addTaskChain, updateTaskChain, currentUser } = useStore();

    const { control, handleSubmit, register, formState: { errors } } = useForm<TaskChainFormData>({
        resolver: zodResolver(taskChainSchema),
        defaultValues: existingChain || {
            id: uuidv4(),
            name: '',
            description: '',
            items: [],
            createdBy: currentUser.id,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const onSubmit = (data: TaskChainFormData) => {
        // Ensure items have IDs if they were added without one (though uuidv4() in append handles this)
        const processedData: TaskChain = {
            ...data,
            description: data.description || '', // Ensure string
        };

        if (existingChain) {
            updateTaskChain(processedData);
        } else {
            addTaskChain(processedData);
        }
        onSave();
    };

    const handleAddItem = () => {
        append({
            id: uuidv4(),
            description: '',
            priority: 'Medium',
            dueInDays: 0,
            notes: '',
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {existingChain ? 'Edit Task Chain' : 'New Task Chain'}
                    </h2>
                </div>
                <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Chain
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chain Name</label>
                    <input
                        {...register('name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Civil Litigation Phase 1"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        {...register('description')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="Describe what this chain is for..."
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </button>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-4">
                            <div className="flex-shrink-0 pt-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                    {index + 1}
                                </span>
                            </div>

                            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Task Description</label>
                                    <input
                                        {...register(`items.${index}.description`)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="e.g., File Complaint"
                                    />
                                    {errors.items?.[index]?.description && (
                                        <p className="text-red-500 text-xs mt-1">{errors.items[index]?.description?.message}</p>
                                    )}
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Due In (Days)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register(`items.${index}.dueInDays`, { valueAsNumber: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-400">days</span>
                                    </div>
                                    {errors.items?.[index]?.dueInDays && (
                                        <p className="text-red-500 text-xs mt-1">{errors.items[index]?.dueInDays?.message}</p>
                                    )}
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                                    <select
                                        {...register(`items.${index}.priority`)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-400 hover:text-red-500 pt-2"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-gray-500">No tasks in this chain yet.</p>
                            <button type="button" onClick={handleAddItem} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2">
                                Add your first task
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};
