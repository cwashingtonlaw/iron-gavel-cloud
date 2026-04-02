import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './CommandPalette.css';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { matters, contacts, tasks } = useStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [onClose]);

    if (!isOpen) return null;

    const handleSelect = (callback: () => void) => {
        callback();
        setSearch('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
                <Command
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-700 px-4">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        />
                    </div>
                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Universal Commands" className="text-xs font-semibold text-purple-600 dark:text-purple-400 px-2 pt-2 pb-1">
                            <Command.Item
                                onSelect={() => handleSelect(() => alert("Opening AI Time Entry..."))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span className="text-purple-500">✨</span> "Find unbilled time for Smith"
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => alert("Opening Expense Form..."))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span className="text-purple-500">✨</span> "Add $500 expense to Jones matter"
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => alert("Searching global repository..."))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span className="text-purple-500">✨</span> "Find contract for Doe"
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Pages" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 pt-2 pb-1">
                            <Command.Item
                                onSelect={() => handleSelect(() => navigate('/dashboard'))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span>🏠</span> Dashboard
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => navigate('/matters'))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span>💼</span> Matters
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => navigate('/contacts'))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span>👥</span> Contacts
                            </Command.Item>
                            <Command.Item
                                onSelect={() => handleSelect(() => navigate('/tasks'))}
                                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                            >
                                <span>✅</span> Tasks
                            </Command.Item>
                        </Command.Group>

                        {matters.length > 0 && (
                            <Command.Group heading="Matters" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 pt-2 pb-1">
                                {matters.slice(0, 5).map((matter) => (
                                    <Command.Item
                                        key={matter.id}
                                        onSelect={() => handleSelect(() => navigate('/matters'))}
                                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                                    >
                                        <span>📁</span> {matter.name}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {contacts.length > 0 && (
                            <Command.Group heading="Contacts" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 pt-2 pb-1">
                                {contacts.slice(0, 5).map((contact) => (
                                    <Command.Item
                                        key={contact.id}
                                        onSelect={() => handleSelect(() => navigate('/contacts'))}
                                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                                    >
                                        <span>👤</span> {contact.name}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {tasks.length > 0 && (
                            <Command.Group heading="Tasks" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 pt-2 pb-1">
                                {tasks.slice(0, 5).map((task) => (
                                    <Command.Item
                                        key={task.id}
                                        onSelect={() => handleSelect(() => navigate('/tasks'))}
                                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                                    >
                                        <span>✅</span> {task.description}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                    <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">↑↓</kbd>
                        <span>Navigate</span>
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">↵</kbd>
                        <span>Select</span>
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">Esc</kbd>
                        <span>Close</span>
                    </div>
                </Command>
            </div>
        </div>
    );
}
