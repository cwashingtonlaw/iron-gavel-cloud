import React, { useMemo } from 'react';
import { Matter, Task, Event } from '../types';
import { MOCK_MATTERS, MOCK_TASKS, MOCK_EVENTS } from '../constants';
import { CalendarIcon, CheckCircleIcon, ScaleIcon } from './icons';

interface TimelineViewProps {
    matterId?: string; // If provided, show only for this matter. If null, show all.
}

interface TimelineItem {
    id: string;
    date: Date;
    title: string;
    description: string;
    type: 'Matter' | 'Task' | 'Event';
    matterName?: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ matterId }) => {

    const timelineItems = useMemo(() => {
        let items: TimelineItem[] = [];

        // 1. Matters (Open Date)
        MOCK_MATTERS.forEach(m => {
            if (matterId && m.id !== matterId) return;
            items.push({
                id: m.id,
                date: new Date(m.openDate),
                title: `Matter Opened: ${m.name}`,
                description: m.notes,
                type: 'Matter',
                matterName: m.name
            });
        });

        // 2. Tasks (Due Date)
        MOCK_TASKS.forEach(t => {
            if (matterId && t.matterId !== matterId) return;
            const matter = MOCK_MATTERS.find(m => m.id === t.matterId);
            items.push({
                id: t.id,
                date: new Date(t.dueDate),
                title: `Task Due: ${t.description}`,
                description: t.notes || '',
                type: 'Task',
                matterName: matter?.name
            });
        });

        // 3. Events (Date)
        MOCK_EVENTS.forEach(e => {
            if (matterId && e.matterId !== matterId) return;
            const matter = MOCK_MATTERS.find(m => m.id === e.matterId);
            items.push({
                id: e.id,
                date: new Date(`${e.date}T${e.startTime ? convertTime(e.startTime) : '00:00'}`),
                title: `${e.type}: ${e.title}`,
                description: e.location,
                type: 'Event',
                matterName: matter?.name
            });
        });

        // Sort by date descending (newest first)
        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [matterId]);

    // Helper to convert "09:00 AM" to "09:00" for Date parsing
    function convertTime(timeStr: string) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
        }
        return `${hours}:${minutes}`;
    }

    if (timelineItems.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                <p>No timeline events found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Case Timeline</h2>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                {timelineItems.map((item, index) => (
                    <div key={item.id} className="relative pl-8">
                        {/* Dot */}
                        <div className={`absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 border-white ${item.type === 'Matter' ? 'bg-blue-600' :
                                item.type === 'Task' ? 'bg-green-500' : 'bg-purple-500'
                            }`}></div>

                        {/* Content */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start group hover:bg-slate-50 p-3 rounded-lg transition-colors -mt-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.type === 'Matter' ? 'bg-blue-100 text-blue-700' :
                                            item.type === 'Task' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>
                                <h3 className="text-base font-semibold text-slate-800">{item.title}</h3>
                                {item.description && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}
                                {!matterId && item.matterName && (
                                    <p className="text-xs text-slate-400 mt-2 flex items-center">
                                        <ScaleIcon className="w-3 h-3 mr-1" /> {item.matterName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineView;
