import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { Task } from '../types';
import { PlusIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from './icons';
import TaskModal from './TaskModal';
import { useStore } from '../store/useStore';
import EmptyState from './EmptyState';

interface TasksProps {
  filters?: { status?: 'Due' | 'Overdue' };
}

const Tasks: React.FC<TasksProps> = ({ filters }) => {
  const { tasks, addTask, updateTask, matters, addToast } = useStore();
  const [activeTab, setActiveTab] = useState<'Outstanding' | 'Completed'>('Outstanding');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Advanced Filters State
  const [filtersState, setFiltersState] = useState({
    assignedBy: 'All',
    assignedTo: 'All',
    responsibleAttorney: 'All',
    priority: 'All',
    matter: 'All',
    permissions: 'All',
    relatedTime: 'All',
    client: 'All'
  });

  const [tempFiltersState, setTempFiltersState] = useState(filtersState);

  const handleApplyFilters = () => {
    setFiltersState(tempFiltersState);
    setIsFilterPopoverOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = {
      assignedBy: 'All',
      assignedTo: 'All',
      responsibleAttorney: 'All',
      priority: 'All',
      matter: 'All',
      permissions: 'All',
      relatedTime: 'All',
      client: 'All'
    };
    setTempFiltersState(cleared);
    setFiltersState(cleared);
  };

  const hasActiveFilters = Object.values(filtersState).some(v => v !== 'All');

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'Action', 'Due date', 'Priority', 'Name and description', 'Matter', 'Assigned by', 'Assigned to', 'Recorded time'
  ]);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<string[]>(visibleColumns);

  const toggleColumn = (column: string) => {
    setTempVisibleColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const handleUpdateColumns = () => {
    setVisibleColumns(tempVisibleColumns);
    setIsColumnSelectorOpen(false);
  };

  const isVisible = (column: string) => visibleColumns.includes(column);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task; direction: 'asc' | 'desc' } | null>(null);

  // In a real app, these would be controlled components
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('2025-11-17');

  const handleSaveTask = (task: Task) => {
    if (selectedTask) {
      // Update existing task
      updateTask(task);
      addToast('Task updated successfully', 'success');
    } else {
      // Add new task
      addTask(task);
      addToast('Task created successfully', 'success');
    }
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleEditClick = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleNewTaskClick = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  }

  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'Outstanding' && task.completed) return false;
    if (activeTab === 'Completed' && !task.completed) return false;

    // Apply Advanced Filters
    if (filtersState.assignedBy !== 'All' && task.assignedByUserId !== filtersState.assignedBy) return false;
    if (filtersState.assignedTo !== 'All' && task.assignedUserId !== filtersState.assignedTo) return false;
    if (filtersState.priority !== 'All' && task.priority !== filtersState.priority) return false;
    if (filtersState.matter !== 'All' && task.matterId !== filtersState.matter) return false;

    if (filtersState.responsibleAttorney !== 'All') {
      const matter = matters.find(m => m.id === task.matterId);
      if (matter?.responsibleAttorneyId !== filtersState.responsibleAttorney) return false;
    }

    if (filtersState.client !== 'All') {
      const matter = matters.find(m => m.id === task.matterId);
      if (matter?.client !== filtersState.client) return false;
    }

    // Original assignee/priority selects in toolbar (could be unified, but keeping for compatibility)
    if (selectedAssignee !== 'All' && task.assignedUserId !== selectedAssignee) return false;
    if (selectedPriority !== 'All' && task.priority !== selectedPriority) return false;

    return true;
  }).sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue: any = a[sortConfig.key];
    let bValue: any = b[sortConfig.key];

    // Special handling for sorting by Matter Name instead of ID
    if (sortConfig.key === 'matterId') {
      aValue = matters.find(m => m.id === a.matterId)?.name || '';
      bValue = matters.find(m => m.id === b.matterId)?.name || '';
    }

    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const getOverdueStyle = (date: string, completed: boolean) => {
    if (completed) return 'text-slate-600';
    const isOverdue = new Date(date) < new Date();
    return isOverdue ? 'text-red-600 font-semibold flex items-center' : 'text-slate-600';
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
        <div className="flex items-center space-x-2">
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-slate-50">
            Task lists
          </button>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-slate-50">
            Task feeds
          </button>
          <button
            onClick={handleNewTaskClick}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700"
          >
            New task
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-t-lg p-2 flex flex-wrap gap-3 items-center">
        <div className="flex rounded-md overflow-hidden border border-slate-300">
          <button
            onClick={() => setActiveTab('Outstanding')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'Outstanding' ? 'bg-blue-50 text-blue-600 z-10 border-b-2 border-b-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Outstanding
          </button>
          <button
            onClick={() => setActiveTab('Completed')}
            className={`px-4 py-2 text-sm font-medium border-l border-slate-300 ${activeTab === 'Completed' ? 'bg-blue-50 text-blue-600 z-10 border-b-2 border-b-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Completed
          </button>
        </div>

        <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
          <input
            type="text"
            placeholder="MM/DD/YYYY"
            className="px-3 py-2 text-sm w-32 focus:outline-none border-r border-slate-300"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <div className="px-2 text-slate-400 text-sm">-</div>
          <input
            type="text"
            className="px-3 py-2 text-sm w-32 focus:outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="px-2 text-slate-500 bg-slate-50 border-l border-slate-300 h-full flex items-center">
            📅
          </div>
        </div>

        <select className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option>Past due</option>
          <option>Upcoming</option>
          <option>No due date</option>
        </select>

        <select
          className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value as any)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
        >
          <option value="All">All Assignees</option>
          {MOCK_USERS.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        <div className="flex-grow"></div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-3 pr-8 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setTempVisibleColumns(visibleColumns);
              setIsColumnSelectorOpen(!isColumnSelectorOpen);
            }}
            className={`border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 flex items-center ${isColumnSelectorOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          >
            Columns <span className="ml-1 text-xs">▼</span>
          </button>

          {isColumnSelectorOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-6 animate-in fade-in zoom-in duration-200 origin-top-right">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Visible columns</h3>
              <div className="space-y-4 mb-8">
                {[
                  'Action', 'Due date', 'Completed', 'Name and description', 'Matter', 'Assigned by', 'Assigned to', 'Recorded time'
                ].map((column) => (
                  <label key={column} className="flex items-center group cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={tempVisibleColumns.includes(column)}
                        onChange={() => toggleColumn(column)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${tempVisibleColumns.includes(column) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400 bg-white'}`}>
                        {tempVisibleColumns.includes(column) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`ml-3 text-base font-medium transition-colors ${tempVisibleColumns.includes(column) ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      {column}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleUpdateColumns}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Update columns
                </button>
                <button
                  onClick={() => setIsColumnSelectorOpen(false)}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setTempFiltersState(filtersState);
              setIsFilterPopoverOpen(!isFilterPopoverOpen);
            }}
            className={`border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 flex items-center ${isFilterPopoverOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          >
            <span className={`mr-1 ${hasActiveFilters ? 'text-blue-600' : 'text-slate-400'}`}>✓</span> Filters <span className="ml-1 text-xs">▼</span>
          </button>

          {isFilterPopoverOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-6 animate-in fade-in zoom-in duration-200 origin-top-right overflow-y-auto max-h-[80vh]">
              <div className="space-y-6">
                {/* Assigned By */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Assigned by</label>
                  <div className="relative">
                    <select
                      value={tempFiltersState.assignedBy}
                      onChange={(e) => setTempFiltersState({ ...tempFiltersState, assignedBy: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Find a firm user</option>
                      {MOCK_USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Assigned to</label>
                  <div className="relative">
                    <select
                      value={tempFiltersState.assignedTo}
                      onChange={(e) => setTempFiltersState({ ...tempFiltersState, assignedTo: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Select an assignee</option>
                      {MOCK_USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Responsible Attorney */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Responsible attorney</label>
                  <div className="relative">
                    <select
                      value={tempFiltersState.responsibleAttorney}
                      onChange={(e) => setTempFiltersState({ ...tempFiltersState, responsibleAttorney: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Select a firm user</option>
                      {MOCK_USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Priority</label>
                  <div className="relative">
                    <select
                      value={tempFiltersState.priority}
                      onChange={(e) => setTempFiltersState({ ...tempFiltersState, priority: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Select a priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Matter */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Matter</label>
                  <div className="relative">
                    <select
                      value={tempFiltersState.matter}
                      onChange={(e) => setTempFiltersState({ ...tempFiltersState, matter: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Find a matter</option>
                      {matters.map(matter => <option key={matter.id} value={matter.id}>{matter.name}</option>)}
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Permissions</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Select a permission</option>
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Related Time */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Related time</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Select an option</option>
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Client</label>
                  <div className="relative">
                    <select
                      value={tempFiltersState.client}
                      onChange={(e) => setTempFiltersState({ ...tempFiltersState, client: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">Find a contact</option>
                      {Array.from(new Set(matters.map(m => m.client))).map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center border-l border-slate-300 pointer-events-none">
                      <span className="text-slate-500 text-xs">▼</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Apply filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Table */}
      {/* Task Table */}
      <div className="bg-white border-x border-b border-slate-200 shadow-sm overflow-x-auto flex-1">
        {filteredTasks.length > 0 ? (
          <>
            <table className="w-full text-sm text-left hidden md:table">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  {isVisible('Action') && <th className="p-3 w-40">Action</th>}
                  {isVisible('Due date') && (
                    <th
                      className="p-3 w-32 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due date <span className="text-xs text-slate-400">{sortConfig?.key === 'dueDate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}</span>
                    </th>
                  )}
                  {isVisible('Completed') && <th className="p-3 w-24">Completed</th>}
                  {isVisible('Priority') && (
                    <th
                      className="p-3 w-24 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('priority')}
                    >
                      Priority <span className="text-xs text-slate-400">{sortConfig?.key === 'priority' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}</span>
                    </th>
                  )}
                  {isVisible('Name and description') && (
                    <th
                      className="p-3 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('description')}
                    >
                      Name and description <span className="text-xs text-slate-400">{sortConfig?.key === 'description' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}</span>
                    </th>
                  )}
                  {isVisible('Matter') && (
                    <th
                      className="p-3 w-48 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('matterId')}
                    >
                      Matter <span className="text-xs text-slate-400">{sortConfig?.key === 'matterId' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}</span>
                    </th>
                  )}
                  {isVisible('Assigned by') && <th className="p-3 w-40 cursor-pointer hover:bg-slate-100">Assigned by</th>}
                  {isVisible('Assigned to') && <th className="p-3 w-40 cursor-pointer hover:bg-slate-100">Assigned to</th>}
                  {isVisible('Recorded time') && <th className="p-3 w-32 text-center">Recorded time</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const matter = matters.find(m => m.id === task.matterId);
                  const assignedTo = MOCK_USERS.find(u => u.id === task.assignedUserId);
                  const assignedBy = MOCK_USERS.find(u => u.id === task.assignedByUserId);
                  const isOverdue = new Date(task.dueDate) < new Date();

                  return (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                      <td className="p-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                      {isVisible('Action') && (
                        <td className="p-3">
                          <div className="flex">
                            <button className="bg-white border border-slate-300 text-slate-700 px-2 py-1 rounded-l text-xs font-medium hover:bg-slate-50 whitespace-nowrap">
                              Mark complete
                            </button>
                            <button className="bg-white border-t border-r border-b border-slate-300 text-slate-700 px-1 py-1 rounded-r text-xs hover:bg-slate-50">
                              ▼
                            </button>
                          </div>
                        </td>
                      )}
                      {isVisible('Due date') && (
                        <td className="p-3">
                          <span className={getOverdueStyle(task.dueDate, task.completed)}>
                            {isOverdue && !task.completed && <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-500" />}
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                          </span>
                        </td>
                      )}
                      {isVisible('Completed') && (
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => updateTask({ ...task, completed: !task.completed })}
                            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      {isVisible('Priority') && (
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {task.priority}
                          </span>
                        </td>
                      )}
                      {isVisible('Name and description') && (
                        <td className="p-3 max-w-md">
                          <a href="#" onClick={(e) => handleEditClick(e, task)} className="text-blue-600 hover:underline font-medium block">{task.description}</a>
                          {task.notes && <p className="text-slate-500 text-xs mt-1 truncate">{task.notes}</p>}
                        </td>
                      )}
                      {isVisible('Matter') && (
                        <td className="p-3">
                          {matter ? (
                            <>
                              <a href="#" className="text-blue-600 hover:underline block truncate">{matter.name}</a>
                              <p className="text-slate-500 text-xs mt-1 truncate">Client: <a href="#" className="text-blue-600 hover:underline">{matter.client}</a></p>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No matter linked</span>
                          )}
                        </td>
                      )}
                      {isVisible('Assigned by') && <td className="p-3 text-slate-700">{assignedBy?.name || '-'}</td>}
                      {isVisible('Assigned to') && <td className="p-3 text-slate-700">{assignedTo?.name.substring(0, 18) + (assignedTo?.name.length! > 18 ? '...' : '')}</td>}
                      {isVisible('Recorded time') && (
                        <td className="p-3 text-center">
                          <button className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-slate-50">
                            Add time
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {filteredTasks.map(task => {
                const matter = matters.find(m => m.id === task.matterId);
                const isOverdue = new Date(task.dueDate) < new Date();
                return (
                  <div key={task.id} className="p-4 border-b border-slate-200 bg-white" onClick={(e) => handleEditClick(e, task)}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-800 text-sm">{task.description}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                      <span className={getOverdueStyle(task.dueDate, task.completed)}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {matter && <span className="text-blue-600">{matter.name}</span>}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <button className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-50 w-full justify-center flex items-center">
                        Mark Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No tasks found"
              description="Get started by creating a new task."
              icon={<ArrowDownTrayIcon />}
              action={{
                label: "New Task",
                onClick: handleNewTaskClick
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      < div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center" >
        <div className="flex items-center space-x-4">
          <div className="flex border border-slate-300 rounded">
            <button className="px-3 py-1 text-slate-400 hover:bg-slate-50 border-r border-slate-300">◀</button>
            <button className="px-3 py-1 text-slate-700 hover:bg-slate-50">▶</button>
          </div>
          <span className="text-sm text-slate-700">1-{filteredTasks.length} of {tasks.length}</span>
          <select className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none">
            <option>50</option>
            <option>100</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-slate-700">
            <div className="w-8 h-4 bg-slate-400 rounded-full relative mr-2 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full shadow absolute right-0 border border-slate-300"></div>
            </div>
            Expand rows
          </div>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-slate-50">
            Export
          </button>
        </div>
      </div >

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}
        onSave={handleSaveTask}
        task={selectedTask}
      />
    </div >
  );
};

export default Tasks;
