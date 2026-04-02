import { StateCreator } from 'zustand';
import { TimeEntry, Expense, Activity } from '../../types';
import { activityService } from '../../services/activityService';

export interface ActivitySlice {
    timeEntries: TimeEntry[];
    expenses: Expense[];
    activities: Activity[];
    addTimeEntry: (entry: TimeEntry) => void;
    updateTimeEntry: (entry: TimeEntry) => void;
    deleteTimeEntry: (id: string) => void;
    addExpense: (expense: Expense) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
    addActivity: (activity: Activity) => void;
}

export const createActivitySlice: StateCreator<ActivitySlice> = (set) => ({
    timeEntries: activityService.getTimeEntries(),
    expenses: activityService.getExpenses(),
    activities: activityService.getActivities(),
    addTimeEntry: (entry) => set((state) => ({
        timeEntries: activityService.addTimeEntry(state.timeEntries, entry)
    })),
    updateTimeEntry: (entry) => set((state) => ({
        timeEntries: activityService.updateTimeEntry(state.timeEntries, entry)
    })),
    deleteTimeEntry: (id) => set((state) => ({
        timeEntries: activityService.deleteTimeEntry(state.timeEntries, id)
    })),
    addExpense: (expense) => set((state) => ({
        expenses: activityService.addExpense(state.expenses, expense)
    })),
    updateExpense: (expense) => set((state) => ({
        expenses: activityService.updateExpense(state.expenses, expense)
    })),
    deleteExpense: (id) => set((state) => ({
        expenses: activityService.deleteExpense(state.expenses, id)
    })),
    addActivity: (activity) => set((state) => ({
        activities: activityService.addActivity(state.activities, activity)
    })),
});
