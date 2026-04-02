import React from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
            <div className="flex gap-1 bg-white dark:bg-slate-700 p-1 rounded-md border border-slate-200 dark:border-slate-600">
                <button
                    onClick={() => setTheme('light')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${theme === 'light'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                    aria-label="Light mode"
                >
                    ☀️
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${theme === 'dark'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                    aria-label="Dark mode"
                >
                    🌙
                </button>
                <button
                    onClick={() => setTheme('system')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${theme === 'system'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                    aria-label="System mode"
                >
                    💻
                </button>
            </div>
        </div>
    );
}
