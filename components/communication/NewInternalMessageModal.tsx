import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { InternalMessage } from '../../types';
import { MOCK_USERS } from '../../constants';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '../icons';

interface NewInternalMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewInternalMessageModal: React.FC<NewInternalMessageModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, sendInternalMessage, matters } = useStore();
    const [toUserId, setToUserId] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [matterId, setMatterId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!toUserId || !subject || !content) return;

        const newMessage: InternalMessage = {
            id: uuidv4(),
            fromUserId: currentUser.id,
            toUserIds: [toUserId],
            subject,
            content,
            timestamp: new Date().toISOString(),
            read: false,
            matterId: matterId || undefined,
        };

        sendInternalMessage(newMessage);
        onClose();
        setToUserId('');
        setSubject('');
        setContent('');
        setMatterId('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">New Internal Message</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                        <select
                            value={toUserId}
                            onChange={(e) => setToUserId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select recipient...</option>
                            {MOCK_USERS.filter(u => u.id !== currentUser.id).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Matter (Optional)</label>
                        <select
                            value={matterId}
                            onChange={(e) => setMatterId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select matter...</option>
                            {matters.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Subject"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type your message here..."
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
