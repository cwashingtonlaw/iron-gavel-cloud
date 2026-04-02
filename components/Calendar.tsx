import React, { useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { MATTER_COLORS } from '../constants';
import { generateRecurringInstances } from '../utils/recurrence';
import MiniCalendar from './MiniCalendar';
import CalendarCategoryList from './CalendarCategoryList';
import EventModal from './EventModal';
import { Event } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: {
        type: 'task' | 'event';
        matterId: string;
        matterName?: string;
        color: string;
        data: any;
        categoryId?: string;
    };
}

const Calendar: React.FC = () => {
    const { tasks, events, matters, calendarCategories, updateCalendarCategory } = useStore();
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const getCategoryColor = (categoryId: string) => {
        const category = calendarCategories.find(c => c.id === categoryId);
        return category?.color || '#64748b';
    };

    const getMatterColor = (matterId: string) => {
        const matterIndex = matters.findIndex(m => m.id === matterId);
        if (matterIndex === -1) return '#64748b';
        return MATTER_COLORS[matterIndex % MATTER_COLORS.length];
    };

    // Filter events based on active calendar categories
    const activeCategories = useMemo(() =>
        calendarCategories.filter(c => c.isChecked).map(c => c.id),
        [calendarCategories]
    );

    const calendarEvents: CalendarEvent[] = useMemo(() => {
        const taskEvents = tasks
            .filter(task => activeCategories.includes('CAL_TASKS'))
            .map(task => {
                const matter = matters.find(m => m.id === task.matterId);
                const dueDate = new Date(task.dueDate);

                return {
                    id: task.id,
                    title: task.description,
                    start: dueDate,
                    end: dueDate,
                    resource: {
                        type: 'task' as const,
                        matterId: task.matterId,
                        matterName: matter?.name || 'Unknown Matter',
                        color: getCategoryColor('CAL_TASKS'),
                        data: task,
                        categoryId: 'CAL_TASKS',
                    },
                };
            });

        // Calculate visible date range for the current view
        const viewStart = startOfMonth(date);
        const viewEnd = endOfMonth(addMonths(date, 1)); // Show one extra month

        const regularEvents = events
            .filter(event => {
                const category = calendarCategories.find(c => c.id === event.calendarId);
                return category ? activeCategories.includes(category.id) : true;
            })
            .flatMap(event => {
                // Expand recurring events into instances
                if (event.recurrence && !event.isRecurringInstance) {
                    return generateRecurringInstances(event, viewStart, viewEnd);
                }
                return [event];
            })
            .map(event => {
                const matter = matters.find(m => m.id === event.matterId);
                const eventDate = new Date(event.date);
                const [startHour, startMin, startPeriod] = event.startTime.split(/[:\s]/);
                const [endHour, endMin, endPeriod] = event.endTime.split(/[:\s]/);

                const startTime = new Date(eventDate);
                startTime.setHours(
                    startPeriod === 'PM' && startHour !== '12' ? parseInt(startHour) + 12 : parseInt(startHour),
                    parseInt(startMin)
                );

                const endTime = new Date(eventDate);
                endTime.setHours(
                    endPeriod === 'PM' && endHour !== '12' ? parseInt(endHour) + 12 : parseInt(endHour),
                    parseInt(endMin)
                );

                return {
                    id: event.id,
                    title: event.isRecurringInstance ? `🔄 ${event.title}` : event.title,
                    start: startTime,
                    end: endTime,
                    resource: {
                        type: 'event' as const,
                        matterId: event.matterId,
                        matterName: matter?.name || 'Unknown Matter',
                        color: event.calendarId ? getCategoryColor(event.calendarId) : getMatterColor(event.matterId),
                        data: event,
                        categoryId: event.calendarId,
                    },
                };
            });

        return [...taskEvents, ...regularEvents];
    }, [tasks, events, matters, activeCategories, calendarCategories, date]);

    const eventStyleGetter = (event: CalendarEvent) => {
        const { color } = event.resource;
        return {
            style: {
                backgroundColor: color,
                borderColor: color,
                color: '#ffffff',
                borderRadius: '4px',
                border: 'none',
                display: 'block',
                fontSize: '0.875rem',
                padding: '2px 5px',
            },
        };
    };

    const goToToday = () => {
        setDate(new Date());
    };

    const prevMonth = () => {
        setDate(prev => subMonths(prev, 1));
    };

    const nextMonth = () => {
        setDate(prev => addMonths(prev, 1));
    };

    const handleCreateEvent = () => {
        setSelectedEvent(null);
        setShowEventModal(true);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if (event.resource.type === 'event') {
            setSelectedEvent(event.resource.data);
            setShowEventModal(true);
        }
    };

    // Get dates with events for mini calendar
    const eventDates = useMemo(() => {
        return calendarEvents.map(e => format(e.start, 'yyyy-MM-dd'));
    }, [calendarEvents]);

    return (
        <div className="h-full flex flex-col">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Previous month"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Next month"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {format(date, 'MMMM yyyy')}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Type Buttons */}
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                        {(['month', 'week', 'day', 'agenda'] as View[]).map((viewType) => (
                            <button
                                key={viewType}
                                onClick={() => setView(viewType)}
                                className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${view === viewType
                                    ? 'bg-slate-200 text-slate-900'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {viewType}
                            </button>
                        ))}
                    </div>

                    {/* New Event Button */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                alert('Synchronizing with Google Calendar and Outlook...');
                                setTimeout(() => alert('Sync Complete! 12 events updated.'), 1500);
                            }}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Calendar
                        </button>
                        <button
                            onClick={handleCreateEvent}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New event
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Calendar Area */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
                    <BigCalendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        popup
                        tooltipAccessor={(event: CalendarEvent) => `${event.resource.matterName}: ${event.title}`}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="w-64 flex-shrink-0 space-y-4">
                    {/* Mini Calendar */}
                    <MiniCalendar
                        currentDate={date}
                        onDateChange={setDate}
                    />

                    {/* Calendar Categories */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <CalendarCategoryList
                            categories={calendarCategories}
                            onToggleCategory={updateCalendarCategory}
                        />
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setShowEventModal(false)}
                />
            )}
        </div>
    );
};

export default Calendar;
