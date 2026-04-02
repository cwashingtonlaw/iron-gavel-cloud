import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  ScaleIcon, CalendarIcon, CheckCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, Squares2X2Icon,
  HomeIcon, BriefcaseIcon, UsersIcon, UserPlusIcon, MagnifyingGlassIcon,
  CurrencyDollarIcon, BanknotesIcon, BoltIcon, Cog6ToothIcon, ClockIcon, CreditCardIcon, ReceiptPercentIcon, ChartBarIcon,
  XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon, ExclamationTriangleIcon
} from './icons';
import { ThemeToggle } from './ThemeToggle';

const NAV_STRUCTURE = [
  {
    title: 'Core',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
      { path: '/matters', label: 'Matters', icon: <BriefcaseIcon /> },
      { path: '/contacts', label: 'Contacts', icon: <UsersIcon /> },
      { path: '/tasks', label: 'Tasks', icon: <CheckCircleIcon /> },
      { path: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
      { path: '/documents', label: 'Documents', icon: <DocumentTextIcon /> },
      { path: '/communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon /> },
    ]
  },
  {
    title: 'Billing & Finance',
    items: [
      { path: '/billing', label: 'Time & Billing', icon: <ClockIcon /> },
      { path: '/bills', label: 'Invoices', icon: <ReceiptPercentIcon /> },
      { path: '/reports', label: 'Reports', icon: <ChartBarIcon /> },
    ]
  },
  {
    title: 'Growth (CRM)',
    items: [
      { path: '/intake', label: 'Client Intake', icon: <UserPlusIcon /> },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/search', label: 'Advanced Search', icon: <MagnifyingGlassIcon /> },
      { path: '/deadlines', label: 'Deadline Engine', icon: <ExclamationTriangleIcon /> },
      { path: '/conflicts', label: 'Conflict Check', icon: <ScaleIcon /> },
      { path: '/analytics', label: 'Analytics', icon: <ChartBarIcon /> },
      { path: '/automation', label: 'Auto Billing', icon: <BoltIcon /> },
      { path: '/workflow-builder', label: 'Workflows', icon: <Squares2X2Icon /> },
    ]
  },
  {
    title: 'Administration',
    items: [
      { path: '/audit', label: 'Audit Trail', icon: <ShieldCheckIcon /> },
      { path: '/security', label: 'Security', icon: <ShieldCheckIcon /> },
      { path: '/settings', label: 'Settings', icon: <Cog6ToothIcon /> },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isSidebarCollapsed, toggleSidebarCollapse, matters, tasks } = useStore();

  const openMatters = matters.filter(m => m.status === 'Open').length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const getBadge = (path: string) => {
    if (path === '/matters' && openMatters > 0) return openMatters;
    if (path === '/tasks' && pendingTasks > 0) return pendingTasks;
    return null;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-40 transform transition-all duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'w-[68px]' : 'w-60'}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-700 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ScaleIcon className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="ml-3 min-w-0">
                <h1 className="text-sm font-bold text-slate-800 dark:text-white truncate">CaseFlow</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Legal Practice Management</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400" aria-label="Close sidebar">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin">
          {NAV_STRUCTURE.map((group) => (
            <div key={group.title}>
              {!isSidebarCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{group.title}</h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const badge = getBadge(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                      <span className={`w-5 h-5 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {badge !== null && (
                            <span className="ml-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className={`border-t border-slate-200 dark:border-slate-700 p-3 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <ThemeToggle />
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 z-50"
        >
          {isSidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
