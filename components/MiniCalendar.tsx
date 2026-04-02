
import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface MiniCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ currentDate, onDateChange }) => {
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-mini-${i}`}></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();
    days.push(
      <div key={i} className="flex justify-center items-center h-8 text-xs">
        <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'}`}>
            {i}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
        <div className="flex items-center justify-between mb-2 px-1">
             <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ArrowLeftIcon className="w-3 h-3 text-slate-500"/></button>
             <span className="text-sm font-bold text-slate-800">{monthName} {year}</span>
             <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ArrowRightIcon className="w-3 h-3 text-slate-500"/></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-400">
                    {day}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7">
            {days}
        </div>
    </div>
  );
};

export default MiniCalendar;
