import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { TimeEntry, Expense } from '../types';
import { PlusIcon, ClockIcon } from './icons';
import { useStore } from '../store/useStore';
import AddTimeEntryModal from './AddTimeEntryModal';
import AddExpenseModal from './AddExpenseModal';
import TimeDiscovery from './TimeDiscovery';

type ActivityType = 'All' | 'Time' | 'Expense';

const Activities: React.FC = () => {
  const { timeEntries, expenses, matters } = useStore();
  const [activeType, setActiveType] = useState<ActivityType>('All');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [keyword, setKeyword] = useState('');
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Combine Time Entries and Expenses into a single list for display
  const allActivities = [
    ...timeEntries.map(t => ({ ...t, activityType: 'Time' as const })),
    ...expenses.map(e => ({ ...e, activityType: 'Expense' as const }))
  ];

  const filteredActivities = allActivities.filter(item => {
    const itemDate = new Date(item.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const inDateRange = itemDate.getTime() >= start.getTime() && itemDate.getTime() <= end.getTime();
    const matchesType = activeType === 'All' || item.activityType === activeType;
    const matchesKeyword = item.description.toLowerCase().includes(keyword.toLowerCase());
    return inDateRange && matchesType && matchesKeyword;
  });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="flex flex-col h-full space-y-4">
      <TimeDiscovery />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Activities</h1>
        <div className="flex items-center space-x-2">
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-slate-50">
            Manage categories
          </button>
          <button
            onClick={() => setIsTimeModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700"
          >
            New time entry
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700"
          >
            New expense
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-t-lg p-2 flex flex-wrap gap-3 items-center">
        <div className="flex rounded-md overflow-hidden border border-slate-300">
          <button
            onClick={() => setActiveType('All')}
            className={`px-4 py-2 text-sm font-medium ${activeType === 'All' ? 'bg-blue-50 text-blue-600 z-10 border-b-2 border-b-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveType('Time')}
            className={`px-4 py-2 text-sm font-medium border-l border-slate-300 ${activeType === 'Time' ? 'bg-blue-50 text-blue-600 z-10 border-b-2 border-b-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <span className="text-orange-500 mr-1">🕒</span> Time
          </button>
          <button
            onClick={() => setActiveType('Expense')}
            className={`px-4 py-2 text-sm font-medium border-l border-slate-300 ${activeType === 'Expense' ? 'bg-blue-50 text-blue-600 z-10 border-b-2 border-b-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <span className="text-purple-500 mr-1">$</span> Expense
          </button>
        </div>

        <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
          <input
            type="text"
            className="bg-white text-slate-900 px-3 py-2 text-sm w-32 focus:outline-none border-r border-slate-300"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="YYYY-MM-DD"
          />
          <div className="px-2 text-slate-400 text-sm bg-white">-</div>
          <input
            type="text"
            className="bg-white text-slate-900 px-3 py-2 text-sm w-32 focus:outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="YYYY-MM-DD"
          />
          <div className="px-2 text-slate-500 bg-slate-50 border-l border-slate-300 h-full flex items-center cursor-pointer">
            📅
          </div>
        </div>

        <div className="flex border border-slate-300 rounded-md overflow-hidden">
          <button className="px-3 py-2 bg-white hover:bg-slate-50 border-r border-slate-300 text-slate-500">◀</button>
          <button className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-500">▶</button>
        </div>

        <div className="relative">
          <select className="appearance-none bg-white border border-slate-300 rounded-md pl-3 pr-8 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>Last Week</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        <div className="flex-grow"></div>

        <input
          type="text"
          placeholder="Filter by keyword"
          className="bg-white text-slate-900 pl-3 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 flex items-center">
          Columns <span className="ml-1 text-xs">▼</span>
        </button>

        <button className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 flex items-center">
          <span className="mr-1 text-blue-600">✓</span> Filters <span className="ml-1 text-xs">▼</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white border-x border-b border-slate-200 shadow-sm flex-1 min-h-[400px] relative">
        {filteredActivities.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full py-20">
            <div className="relative w-24 h-24 mb-6">
              {/* Simplified CSS illustration of the folder/clock icon from screenshot */}
              <div className="absolute inset-0 bg-blue-600 rounded-lg transform -rotate-6 opacity-10"></div>
              <div className="absolute inset-0 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <ClockIcon className="w-12 h-12 opacity-20" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white w-8 h-8 rounded flex items-center justify-center font-bold text-xl shadow-lg">
                +
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">No time or expense entries found.</h3>
            <p className="text-slate-500 mt-2 text-center max-w-md">Bill for every minute by tracking all of your time and expenses.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsTimeModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700"
              >
                New time entry
              </button>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700"
              >
                New expense
              </button>
            </div>
          </div>
        ) : (
          // Table View
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Activity</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Matter</th>
                  <th className="p-3">User</th>
                  <th className="p-3 text-right">Duration/Qty</th>
                  <th className="p-3 text-right">Rate/Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((item) => {
                  const matter = matters.find(m => m.id === item.matterId);
                  const isTime = item.activityType === 'Time';
                  const user = isTime
                    ? MOCK_USERS.find(u => u.id === (item as TimeEntry).userId)
                    : null; // Expenses might not have a user attached in our simplified model, or we assume Admin

                  const total = isTime
                    ? (item as TimeEntry).duration * (item as TimeEntry).rate
                    : (item as Expense).amount;

                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                      <td className="p-3 text-slate-600">{item.date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${isTime ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                          {item.activityType}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800 max-w-xs truncate" title={item.description}>{item.description}</td>
                      <td className="p-3 text-blue-600">{matter?.name}</td>
                      <td className="p-3 text-slate-600">{user?.name || '-'}</td>
                      <td className="p-3 text-right text-slate-600">
                        {isTime ? `${(item as TimeEntry).duration.toFixed(1)}h` : '-'}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {isTime ? formatCurrency((item as TimeEntry).rate) : '-'}
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-800">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  )
                })}
                {/* Total Row (Simplified) */}
                <tr className="bg-slate-50 font-semibold text-slate-700">
                  <td colSpan={8} className="p-3 text-right">Total</td>
                  <td className="p-3 text-right">
                    {formatCurrency(filteredActivities.reduce((sum, item) => {
                      const val = item.activityType === 'Time'
                        ? (item as TimeEntry).duration * (item as TimeEntry).rate
                        : (item as Expense).amount;
                      return sum + val;
                    }, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex border border-slate-300 rounded">
            <button className="px-3 py-1 text-slate-400 hover:bg-slate-50 border-r border-slate-300">◀</button>
            <button className="px-3 py-1 text-slate-700 hover:bg-slate-50">▶</button>
          </div>
          <span className="text-sm text-slate-700">
            {filteredActivities.length === 0 ? 'No results found' : `1-${filteredActivities.length} of ${filteredActivities.length}`}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-slate-700 cursor-pointer">
            <div className="w-8 h-4 bg-slate-400 rounded-full relative mr-2">
              <div className="w-4 h-4 bg-white rounded-full shadow absolute right-0 border border-slate-300"></div>
            </div>
            Expand rows
          </div>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-slate-50">
            Export
          </button>
        </div>
      </div>

      <AddTimeEntryModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
      />
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
};

export default Activities;
