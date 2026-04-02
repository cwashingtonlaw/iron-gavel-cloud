import { TimeEntry, Expense, Activity } from '../types';
import { MOCK_TIME_ENTRIES, MOCK_EXPENSES, MOCK_ACTIVITIES } from '../constants';

export const activityService = {
    getTimeEntries: (): TimeEntry[] => {
        return [...MOCK_TIME_ENTRIES];
    },

    getExpenses: (): Expense[] => {
        return [...MOCK_EXPENSES];
    },

    getActivities: (): Activity[] => {
        return [...MOCK_ACTIVITIES];
    },

    addTimeEntry: (entries: TimeEntry[], entry: TimeEntry): TimeEntry[] => {
        return [entry, ...entries];
    },

    updateTimeEntry: (entries: TimeEntry[], entry: TimeEntry): TimeEntry[] => {
        return entries.map((e) => (e.id === entry.id ? entry : e));
    },

    deleteTimeEntry: (entries: TimeEntry[], id: string): TimeEntry[] => {
        return entries.filter((e) => e.id !== id);
    },

    addExpense: (expenses: Expense[], expense: Expense): Expense[] => {
        return [expense, ...expenses];
    },

    updateExpense: (expenses: Expense[], expense: Expense): Expense[] => {
        return expenses.map((e) => (e.id === expense.id ? expense : e));
    },

    deleteExpense: (expenses: Expense[], id: string): Expense[] => {
        return expenses.filter((e) => e.id !== id);
    },

    addActivity: (activities: Activity[], activity: Activity): Activity[] => {
        return [activity, ...activities];
    },
};
