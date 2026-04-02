import { CalculatedDeadline, DeadlineWarning } from '../../types';

export interface DeadlineState {
    deadlines: CalculatedDeadline[];
    addDeadline: (deadline: CalculatedDeadline) => void;
    updateDeadline: (deadline: CalculatedDeadline) => void;
    removeDeadline: (id: string) => void;
    acknowledgeWarning: (warningId: string) => void;
}

export const createDeadlineSlice = (set: any, get: any, api: any): DeadlineState => ({
    deadlines: [],
    addDeadline: (deadline) => set((state: any) => ({
        deadlines: [...state.deadlines, deadline]
    })),
    updateDeadline: (deadline) => set((state: any) => ({
        deadlines: state.deadlines.map((d: any) => d.id === deadline.id ? deadline : d)
    })),
    removeDeadline: (id) => set((state: any) => ({
        deadlines: state.deadlines.filter((d: any) => d.id !== id)
    })),
    acknowledgeWarning: (warningId) => set((state: any) => ({
        deadlines: state.deadlines.map((d: any) => ({
            ...d,
            warnings: d.warnings.map((w: any) =>
                w.id === warningId ? { ...w, acknowledged: true } : w
            )
        }))
    })),
});
