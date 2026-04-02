import React from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircleIcon, ExclamationCircleIcon } from '../icons';

interface TasksWidgetProps {
    title?: string;
    filterUserId?: string;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ title = 'Upcoming Tasks', filterUserId }) => {
    const { tasks, updateTask } = useStore();
    const upcomingTasks = tasks
        .filter(t => !t.completed && (!filterUserId || t.assignedUserId === filterUserId))
        .slice(0, 5);

    const handleComplete = (task: any) => {
        updateTask({ ...task, completed: true });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <button className="text-sm text-blue-600 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
                {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleComplete(task)}
                                    className="text-slate-400 hover:text-green-500 transition-colors"
                                    title="Mark as complete"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{task.description}</span>
                            </div>
                            <span className="text-xs text-slate-500">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500">No upcoming tasks.</p>
                )}
            </div>
        </div>
    );
};

export default TasksWidget;
