import React, { useState, useEffect } from 'react';
import { TimeEntry } from '../types';
import { useStore } from '../store/useStore';
import { MOCK_USERS } from '../constants';
import { XMarkIcon } from './icons';

interface AddTimeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddTimeEntryModal: React.FC<AddTimeEntryModalProps> = ({ isOpen, onClose }) => {
    const { matters, addTimeEntry, currentUser } = useStore();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [matterId, setMatterId] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [rate, setRate] = useState('');
    const [userId, setUserId] = useState(currentUser.id);
    const [error, setError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setMatterId('');
            setDescription('');
            setDuration('');
            setRate('');
            setUserId(currentUser.id);
            setError('');
        }
    }, [isOpen, currentUser.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!matterId || !description || !duration || !rate) {
            setError('All fields are required.');
            return;
        }

        const newEntry: TimeEntry = {
            id: `TE-${Date.now()}`,
            matterId,
            date,
            description,
            duration: parseFloat(duration),
            rate: parseFloat(rate),
            isBilled: false,
            userId,
        };

        addTimeEntry(newEntry);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">New Time Entry</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Matter <span className="text-red-500">*</span></label>
                            <select
                                value={matterId}
                                onChange={(e) => setMatterId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a matter...</option>
                                {matters.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} - {m.client}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe the activity..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Hours) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rate ($/hr) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">User <span className="text-red-500">*</span></label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                {MOCK_USERS.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
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
                            Save Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTimeEntryModal;
