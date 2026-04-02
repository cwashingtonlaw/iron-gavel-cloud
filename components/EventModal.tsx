import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { useStore } from '../store/useStore';
import { getRecurrenceDescription } from '../utils/recurrence';
import { XMarkIcon, TrashIcon, ClockIcon, MapPinIcon, BriefcaseIcon, CalendarIcon, DocumentDuplicateIcon, BellIcon, UserGroupIcon } from './icons';
import EventTypeManager from './EventTypeManager';

interface EventModalProps {
  event?: Event | null;
  onClose: () => void;
  date?: Date | null;
}

const EventModal: React.FC<EventModalProps> = ({ onClose, event, date }) => {
  const { addEvent, updateEvent, deleteEvent, matters, calendarCategories, eventTypes } = useStore();
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData(event);
      setShowRepeatOptions(!!event.recurrence);
    } else if (date) {
      setFormData({
        id: `EVT-${Date.now()}`,
        date: date.toISOString().split('T')[0],
        title: '',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        type: 'Meeting',
        location: '',
        matterId: matters[0]?.id || '',
        calendarId: 'CAL_USER',
        allDay: false,
        description: '',
        attendees: [],
        reminders: []
      });
    } else {
      setFormData({
        id: `EVT-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: '',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        type: 'Meeting',
        location: '',
        matterId: matters[0]?.id || '',
        calendarId: 'CAL_USER',
        allDay: false,
        description: '',
        attendees: [],
        reminders: []
      });
    }
  }, [event, date, matters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.matterId) {
      alert('Please fill in all required fields');
      return;
    }

    const eventData = formData as Event;
    if (event) {
      updateEvent(eventData);
    } else {
      addEvent(eventData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (formData.id) {
      if (confirm('Are you sure you want to delete this event?')) {
        deleteEvent(formData.id);
        onClose();
      }
    }
  };

  const handleDuplicate = () => {
    const newEvent = { ...formData, id: `EVT-${Date.now()}`, title: `${formData.title} (Copy)` };
    addEvent(newEvent as Event);
    onClose();
  };

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...(prev.reminders || []), { time: 1440, type: 'notification' as const }] // 1 day before
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">{event ? 'Edit event' : 'Add new event'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Two Column Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Event Details */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Event details</h3>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="Event title"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Start time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="date"
                      value={formData.date || ''}
                      onChange={handleChange}
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {!formData.allDay && (
                      <input
                        type="text"
                        name="startTime"
                        value={formData.startTime || ''}
                        onChange={handleChange}
                        placeholder="9:00 AM"
                        className="w-28 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    End time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={formData.date || ''}
                      readOnly
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50"
                    />
                    {!formData.allDay && (
                      <input
                        type="text"
                        name="endTime"
                        value={formData.endTime || ''}
                        onChange={handleChange}
                        placeholder="5:00 PM"
                        className="w-28 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* All Day and Repeat Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="allDay"
                    checked={formData.allDay || false}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                  />
                  <span className="text-sm text-slate-700">All Day</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRepeatOptions}
                    onChange={() => {
                      setShowRepeatOptions(!showRepeatOptions);
                      if (showRepeatOptions) {
                        setFormData(prev => ({ ...prev, recurrence: undefined }));
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                  />
                  <span className="text-sm text-slate-700">Repeat</span>
                </label>
              </div>

              {/* Repeat Options */}
              {showRepeatOptions && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <select
                    value={formData.recurrence?.frequency || 'Weekly'}
                    onChange={(e) => {
                      const freq = e.target.value as 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
                      setFormData(prev => ({
                        ...prev,
                        recurrence: {
                          frequency: freq,
                          interval: 1,
                          daysOfWeek: freq === 'Weekly' ? [new Date(prev.date || '').getDay()] : undefined
                        }
                      }));
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  {formData.recurrence && (
                    <p className="text-xs text-slate-600 mt-2">
                      {getRecurrenceDescription(formData.recurrence)}
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  placeholder="Add location"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Matter */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Matter</label>
                <select
                  name="matterId"
                  value={formData.matterId || ''}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a matter...</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.id} - {m.name}</option>)}
                </select>
              </div>

              {/* Reminders */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Reminders</label>
                <button
                  type="button"
                  onClick={addReminder}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  <BellIcon className="w-4 h-4 mr-1.5" />
                  Add new reminder
                </button>
                {formData.reminders && formData.reminders.length > 0 && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-blue-800">
                          Contacts who are notified by text will receive a text reminder 1 day(s) before this event.
                        </p>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1">
                          Change setting
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save to Calendar */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Save to this calendar <span className="text-red-500">*</span>
                </label>
                <select
                  name="calendarId"
                  value={formData.calendarId || 'CAL_USER'}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {calendarCategories.map(cal => <option key={cal.id} value={cal.id}>{cal.name}</option>)}
                </select>
                <label className="flex items-center mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                  />
                  <span className="text-sm text-slate-600">Add this event to the Firm calendar as well as the selected calendar</span>
                </label>
              </div>

              {/* Event Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center justify-between">
                  <span className="flex items-center">
                    Event type
                    <svg className="w-4 h-4 ml-1 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTypeManager(true)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    Manage event types
                  </button>
                </label>
                <select
                  name="eventTypeId"
                  value={formData.eventTypeId || ''}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an event type</option>
                  {eventTypes.map(et => (
                    <option key={et.id} value={et.id}>
                      {et.icon} {et.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Add description"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right Column - Invite Attendees */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Invite attendees</h3>
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Find firm users or contacts to invite</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type in name"
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Suggested Attendees */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Suggested attendees</label>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    <span>Franklin Felrman</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    <span>Jamir Williams</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="flex gap-3">
            {event && (
              <>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 text-sm transition-colors"
                >
                  Delete event
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm transition-colors"
            >
              Save event
            </button>
            {event && (
              <button
                onClick={handleDuplicate}
                className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-sm transition-colors"
              >
                Duplicate event
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Event Type Manager Modal */}
      <EventTypeManager
        isOpen={showTypeManager}
        onClose={() => setShowTypeManager(false)}
      />
    </div>
  );
};

export default EventModal;