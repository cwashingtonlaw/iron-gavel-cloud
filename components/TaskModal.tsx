
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { MOCK_MATTERS, MOCK_USERS, CURRENT_USER } from '../constants';
import { XMarkIcon } from './icons';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [matterId, setMatterId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState(CURRENT_USER.id);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setMatterId(task.matterId);
      setAssignedUserId(task.assignedUserId || CURRENT_USER.id);
      setNotes(task.notes || '');
    } else {
      setDescription('');
      // Default to today for new tasks
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('Medium');
      setMatterId('');
      setAssignedUserId(CURRENT_USER.id);
      setNotes('');
    }
    setError('');
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Task description is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    const newTask: Task = {
      id: task ? task.id : `TSK-${Date.now()}`,
      description,
      dueDate,
      priority,
      matterId,
      assignedUserId,
      assignedByUserId: task ? task.assignedByUserId : CURRENT_USER.id,
      completed: task ? task.completed : false,
      notes,
    };

    onSave(newTask);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Task Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Draft Motion for Summary Judgment"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                    <input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value as Task['priority'])}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Matter</label>
              <select 
                value={matterId} 
                onChange={(e) => setMatterId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a matter...</option>
                {MOCK_MATTERS.length > 0 ? (
                    MOCK_MATTERS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                ) : (
                    <option disabled>No matters found. Create a matter first.</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
              <select 
                value={assignedUserId} 
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add details about this task..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
