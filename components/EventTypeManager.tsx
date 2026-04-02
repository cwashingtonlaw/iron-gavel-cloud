import React, { useState } from 'react';
import { EventType } from '../types';
import { useStore } from '../store/useStore';
import { XMarkIcon, TrashIcon, PlusIcon } from './icons';

interface EventTypeManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const EventTypeManager: React.FC<EventTypeManagerProps> = ({ isOpen, onClose }) => {
    const { eventTypes, addEventType, updateEventType, deleteEventType } = useStore();
    const [editingType, setEditingType] = useState<EventType | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<EventType>>({
        name: '',
        color: '#3b82f6',
        icon: '📌'
    });

    if (!isOpen) return null;

    const handleEdit = (eventType: EventType) => {
        setEditingType(eventType);
        setFormData(eventType);
        setIsAdding(false);
    };

    const handleAdd = () => {
        setIsAdding(true);
        setEditingType(null);
        setFormData({
            name: '',
            color: '#3b82f6',
            icon: '📌'
        });
    };

    const handleSave = () => {
        if (!formData.name) {
            alert('Please enter a name for the event type');
            return;
        }

        if (editingType) {
            // Update existing
            updateEventType({ ...editingType, ...formData });
        } else {
            // Add new
            addEventType({
                id: `ET_${Date.now()}`,
                name: formData.name!,
                color: formData.color || '#3b82f6',
                icon: formData.icon,
                isDefault: false
            });
        }

        setIsAdding(false);
        setEditingType(null);
        setFormData({ name: '', color: '#3b82f6', icon: '📌' });
    };

    const handleDelete = (id: string, isDefault?: boolean) => {
        if (isDefault) {
            alert('Cannot delete default event types');
            return;
        }
        if (confirm('Are you sure you want to delete this event type?')) {
            deleteEventType(id);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingType(null);
        setFormData({ name: '', color: '#3b82f6', icon: '📌' });
    };

    const commonEmojis = ['📌', '👥', '⚖️', '📝', '⏰', '📞', '💬', '📋', '📧', '🎯', '💼', '📊', '🔔', '✅', '❗', '⭐', '🏛️', '📄', '🔍', '💰'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">Manage Event Types</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Add/Edit Form */}
                    {(isAdding || editingType) && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">
                                {editingType ? 'Edit Event Type' : 'Add New Event Type'}
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Client Meeting"
                                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                                            Color <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.color || '#3b82f6'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                className="h-10 w-16 rounded border border-slate-300 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.color || '#3b82f6'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                placeholder="#3b82f6"
                                                className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Icon (Emoji)</label>
                                    <input
                                        type="text"
                                        value={formData.icon || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                        placeholder="Pick an emoji"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                                        maxLength={2}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {commonEmojis.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                                                className={`w-10 h-10 rounded-lg border-2 hover:border-blue-500 transition-colors flex items-center justify-center text-xl ${formData.icon === emoji ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                    >
                                        {editingType ? 'Save Changes' : 'Add Event Type'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Button */}
                    {!isAdding && !editingType && (
                        <button
                            onClick={handleAdd}
                            className="w-full mb-6 p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Custom Event Type
                        </button>
                    )}

                    {/* Event Types List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Event Types</h3>
                        {eventTypes.map((eventType) => (
                            <div
                                key={eventType.id}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                                        style={{ backgroundColor: `${eventType.color}20`, color: eventType.color }}
                                    >
                                        {eventType.icon || '📌'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800 flex items-center gap-2">
                                            {eventType.name}
                                            {eventType.isDefault && (
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-500">{eventType.color}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(eventType)}
                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    {!eventType.isDefault && (
                                        <button
                                            onClick={() => handleDelete(eventType.id, eventType.isDefault)}
                                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventTypeManager;
