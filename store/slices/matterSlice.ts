import { StateCreator } from 'zustand';
import { Matter, PracticeAreaPipeline } from '../../types';
import { matterService } from '../../services/matterService';

export interface MatterSlice {
    matters: Matter[];
    pipelines: PracticeAreaPipeline[];
    addMatter: (matter: Matter) => void;
    updateMatter: (matter: Matter) => void;
    deleteMatter: (id: string) => void;
    setPipelines: (pipelines: PracticeAreaPipeline[]) => void;
}

export const createMatterSlice: StateCreator<MatterSlice> = (set) => ({
    matters: matterService.getMatters(),
    pipelines: matterService.getPipelines(),
    addMatter: (matter) => set((state) => ({
        matters: matterService.addMatter(state.matters, matter)
    })),
    updateMatter: (matter) => set((state) => ({
        matters: matterService.updateMatter(state.matters, matter)
    })),
    deleteMatter: (id) => set((state) => ({
        matters: matterService.deleteMatter(state.matters, id)
    })),
    setPipelines: (pipelines) => set({ pipelines }),
});
