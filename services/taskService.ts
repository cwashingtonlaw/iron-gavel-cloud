import { Task } from '../types';
import { MOCK_TASKS } from '../constants';

export const taskService = {
    getTasks: (): Task[] => {
        return [...MOCK_TASKS];
    },

    addTask: (tasks: Task[], task: Task): Task[] => {
        return [task, ...tasks];
    },

    updateTask: (tasks: Task[], task: Task): Task[] => {
        return tasks.map((t) => (t.id === task.id ? task : t));
    },

    deleteTask: (tasks: Task[], id: string): Task[] => {
        return tasks.filter((t) => t.id !== id);
    },
};
