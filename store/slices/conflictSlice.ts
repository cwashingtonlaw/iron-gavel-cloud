import { StateCreator } from 'zustand';
import { ConflictSearchAudit } from '../../types';

export interface ConflictSlice {
    conflictSearchAudits: ConflictSearchAudit[];
    addConflictSearchAudit: (audit: ConflictSearchAudit) => void;
}

export const createConflictSlice: StateCreator<ConflictSlice> = (set) => ({
    conflictSearchAudits: [],
    addConflictSearchAudit: (audit) => set((state) => ({
        conflictSearchAudits: [...state.conflictSearchAudits, audit]
    })),
});
