import { Matter, PracticeAreaPipeline } from '../types';
import { MOCK_MATTERS, MOCK_PIPELINES } from '../constants';

export const matterService = {
    getMatters: (): Matter[] => {
        return [...MOCK_MATTERS];
    },

    getPipelines: (): PracticeAreaPipeline[] => {
        return [...MOCK_PIPELINES];
    },

    addMatter: (matters: Matter[], matter: Matter): Matter[] => {
        return [...matters, matter];
    },

    updateMatter: (matters: Matter[], matter: Matter): Matter[] => {
        return matters.map((m) => (m.id === matter.id ? matter : m));
    },

    deleteMatter: (matters: Matter[], id: string): Matter[] => {
        return matters.filter((m) => m.id !== id);
    },
};
