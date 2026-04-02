import { StateCreator } from 'zustand';
import { TaskChain, MatterTemplate } from '../../types';
import { workflowService } from '../../services/workflowService';

export interface WorkflowSlice {
    taskChains: TaskChain[];
    matterTemplates: MatterTemplate[];
    addTaskChain: (chain: TaskChain) => void;
    updateTaskChain: (chain: TaskChain) => void;
    deleteTaskChain: (id: string) => void;
    addMatterTemplate: (template: MatterTemplate) => void;
    updateMatterTemplate: (template: MatterTemplate) => void;
    deleteMatterTemplate: (id: string) => void;
}

export const createWorkflowSlice: StateCreator<WorkflowSlice> = (set) => ({
    taskChains: workflowService.getTaskChains(),
    matterTemplates: workflowService.getMatterTemplates(),
    addTaskChain: (chain) => set((state) => ({
        taskChains: [...state.taskChains, chain]
    })),
    updateTaskChain: (chain) => set((state) => ({
        taskChains: state.taskChains.map(c => c.id === chain.id ? chain : c)
    })),
    deleteTaskChain: (id) => set((state) => ({
        taskChains: state.taskChains.filter(c => c.id !== id)
    })),
    addMatterTemplate: (template) => set((state) => ({
        matterTemplates: [...state.matterTemplates, template]
    })),
    updateMatterTemplate: (template) => set((state) => ({
        matterTemplates: state.matterTemplates.map(t => t.id === template.id ? template : t)
    })),
    deleteMatterTemplate: (id) => set((state) => ({
        matterTemplates: state.matterTemplates.filter(t => t.id !== id)
    })),
});
