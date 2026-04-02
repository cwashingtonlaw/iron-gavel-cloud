import { StateCreator } from 'zustand';

export interface UiSlice {
    isSidebarCollapsed: boolean;
    toggleSidebarCollapse: () => void;
    toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
    isSidebarCollapsed: false,
    toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    toasts: [],
    addToast: (message, type) => set((state) => ({
        toasts: [...state.toasts, { id: Math.random().toString(36).substring(7), message, type }]
    })),
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    })),
});
