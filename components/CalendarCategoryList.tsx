import React from 'react';
import { CalendarCategory } from '../types';

interface CalendarCategoryListProps {
    categories: CalendarCategory[];
    onToggleCategory: (category: CalendarCategory) => void;
}

const CalendarCategoryList: React.FC<CalendarCategoryListProps> = ({
    categories,
    onToggleCategory
}) => {
    const myCalendars = categories.filter(c => c.type === 'User' || c.type === 'System' || c.type === 'Firm');
    const otherCalendars = categories.filter(c => c.type === 'User' && !c.isDefault);

    const renderCategory = (category: CalendarCategory) => (
        <div key={category.id} className="flex items-center gap-2 py-1.5 hover:bg-slate-50 rounded px-2 cursor-pointer transition-colors">
            <input
                type="checkbox"
                id={`cal-${category.id}`}
                checked={category.isChecked}
                onChange={() => onToggleCategory({ ...category, isChecked: !category.isChecked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: category.color }}
            />
            <label
                htmlFor={`cal-${category.id}`}
                className="text-sm text-slate-700 flex-1 cursor-pointer truncate"
            >
                {category.name}
            </label>
            <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                aria-label="Calendar options"
            >
                <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* My calendars section */}
            <div>
                <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-sm font-semibold text-slate-700">My calendars</h3>
                    <button className="text-slate-500 hover:text-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-0.5">
                    {myCalendars.map(renderCategory)}
                </div>
            </div>

            {/* Other calendars section */}
            {otherCalendars.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-sm font-semibold text-slate-700">Other calendars</h3>
                        <button className="text-slate-500 hover:text-slate-700">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-0.5">
                        {otherCalendars.map(renderCategory)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarCategoryList;
