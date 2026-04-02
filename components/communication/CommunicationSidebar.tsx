import React, { useState } from 'react';
import { PlusIcon, ComputerDesktopIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, SparklesIcon } from '../icons';

type NavItem = 'Client portals' | 'Text messages' | 'Internal messages' | 'Logs';

interface CommunicationSidebarProps {
    activeNav: NavItem;
    setActiveNav: (nav: NavItem) => void;
    onOpenEmailAssistant: () => void;
    onNewInternalMessage: () => void;
}

export const CommunicationSidebar: React.FC<CommunicationSidebarProps> = ({ activeNav, setActiveNav, onOpenEmailAssistant, onNewInternalMessage }) => {
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

    const navItems: { id: NavItem, icon: React.ReactNode, label: string }[] = [
        { id: 'Client portals', icon: <ComputerDesktopIcon className="w-5 h-5" />, label: 'Client portals' },
        { id: 'Text messages', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, label: 'Text messages' },
        { id: 'Internal messages', icon: <EnvelopeIcon className="w-5 h-5" />, label: 'Internal messages' },
        { id: 'Logs', icon: <EnvelopeIcon className="w-5 h-5" />, label: 'Logs' },
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
            <div className="p-6 pb-2">
                <h1 className="text-2xl font-bold text-slate-800">Communications</h1>
                <div className="relative mt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsNewMenuOpen(!isNewMenuOpen); }}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" /> New <span className="ml-2 text-xs border-l border-blue-500 pl-2">▼</span>
                    </button>
                    {isNewMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsNewMenuOpen(false)}></div>
                            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1 text-left">
                                <button className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Client portal</button>
                                <button className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Text message</button>
                                <button onClick={() => { onNewInternalMessage(); setIsNewMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Internal message</button>
                                <button className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Email</button>
                                <button onClick={() => { onOpenEmailAssistant(); setIsNewMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50">
                                    <SparklesIcon className="w-4 h-4 mr-2" /> AI Draft Email
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Phone log</button>
                                <button className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Email log</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveNav(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeNav === item.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <span className="mr-3 text-slate-500">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};
