import React from 'react';
import { useStore } from '../../store/useStore';
import { MatterTemplate } from '../../types';
import { Save, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { matterTemplateSchema, MatterTemplateFormData } from '../../schemas/workflowSchemas';

interface MatterTemplateBuilderProps {
    existingTemplate?: MatterTemplate;
    onSave: () => void;
    onCancel: () => void;
}

export const MatterTemplateBuilder: React.FC<MatterTemplateBuilderProps> = ({ existingTemplate, onSave, onCancel }) => {
    const { addMatterTemplate, updateMatterTemplate, currentUser, taskChains, pipelines } = useStore();

    const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<MatterTemplateFormData>({
        resolver: zodResolver(matterTemplateSchema),
        defaultValues: existingTemplate || {
            id: uuidv4(),
            name: '',
            description: '',
            defaultPracticeArea: '',
            defaultBillingType: 'Hourly',
            defaultBillingRate: 0,
            taskChainIds: [],
            createdBy: currentUser.id,
            customFieldDefaults: {},
        },
    });

    const selectedTaskChainIds = watch('taskChainIds');
    const defaultBillingType = watch('defaultBillingType');

    const onSubmit = (data: MatterTemplateFormData) => {
        const processedData: MatterTemplate = {
            ...data,
            description: data.description || '',
            defaultPracticeArea: data.defaultPracticeArea || undefined,
            defaultBillingType: data.defaultBillingType || undefined,
            defaultBillingRate: data.defaultBillingRate || undefined,
            customFieldDefaults: data.customFieldDefaults as { [fieldId: string]: string | number } | undefined,
        };

        if (existingTemplate) {
            updateMatterTemplate(processedData);
        } else {
            addMatterTemplate(processedData);
        }
        onSave();
    };

    const toggleTaskChain = (chainId: string) => {
        const currentIds = selectedTaskChainIds || [];
        if (currentIds.includes(chainId)) {
            setValue('taskChainIds', currentIds.filter(id => id !== chainId));
        } else {
            setValue('taskChainIds', [...currentIds, chainId]);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {existingTemplate ? 'Edit Matter Template' : 'New Matter Template'}
                    </h2>
                </div>
                <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Info</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <input
                                {...register('name')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g., Standard Divorce"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                {...register('description')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                placeholder="Describe this template..."
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Defaults</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Practice Area</label>
                            <select
                                {...register('defaultPracticeArea')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select Practice Area</option>
                                {pipelines.map(p => (
                                    <option key={p.id} value={p.practiceArea}>{p.practiceArea}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                                <select
                                    {...register('defaultBillingType')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="Hourly">Hourly</option>
                                    <option value="Flat Fee">Flat Fee</option>
                                    <option value="Contingency">Contingency</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {defaultBillingType === 'Hourly' ? 'Rate ($/hr)' : 'Fee/Percentage'}
                                </label>
                                <input
                                    type="number"
                                    {...register('defaultBillingRate', { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Chains</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Select task chains to automatically apply when a matter is created from this template.
                        </p>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {taskChains.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No task chains available. Create one first.</p>
                            ) : (
                                taskChains.map(chain => (
                                    <label key={chain.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedTaskChainIds?.includes(chain.id)}
                                            onChange={() => toggleTaskChain(chain.id)}
                                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{chain.name}</p>
                                            <p className="text-xs text-gray-500">{chain.items.length} tasks</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};
