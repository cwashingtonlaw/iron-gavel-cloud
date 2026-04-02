import { StateCreator } from 'zustand';
import { Task } from '../../types';
import { taskService } from '../../services/taskService';

export interface TaskSlice {
    tasks: Task[];
    addTask: (task: Task) => void;
    updateTask: (task: Task) => void;
    deleteTask: (id: string) => void;
}

export const createTaskSlice: StateCreator<TaskSlice> = (set) => ({
    tasks: taskService.getTasks(),
    addTask: (task) => set((state) => ({
        tasks: taskService.addTask(state.tasks, task)
    })),
    updateTask: (task) => set((state) => ({
        tasks: taskService.updateTask(state.tasks, task)
    })),
    deleteTask: (id) => set((state) => ({
        tasks: taskService.deleteTask(state.tasks, id)
    })),
});
