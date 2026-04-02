import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatLastSeen, getStatusColor, getStatusLabel } from '../utils/collaborationUtils';
import { UserIcon, BellIcon, XMarkIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

const CollaborationPanel: React.FC = () => {
    const {
        activeUsers,
        typingIndicators,
        recentActivities,
        markCollaborationActivityAsRead,
        clearCollaborationActivities,
        cleanupTypingIndicators,
        simulateUserActivity
    } = useStore();

    const [isExpanded, setIsExpanded] = useState(false);

    // Cleanup typing indicators every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            cleanupTypingIndicators();
        }, 2000);

        return () => clearInterval(interval);
    }, [cleanupTypingIndicators]);

    const unreadCount = recentActivities.filter(a => !a.read).length;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-[320px] w-full">
            {/* Typing Indicators - Floating Bubbles */}
            <div className="flex flex-col gap-2 mb-2">
                {typingIndicators.map(indicator => (
                    <div
                        key={`${indicator.userId}-${indicator.location.id}`}
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-3 animate-slide-in-right flex items-center gap-3"
                    >
                        <div className="flex space-x-1 py-1 px-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-full">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{indicator.userName}</span> is typing...
                        </span>
                    </div>
                ))}
            </div>

            {/* Main Collaboration Hub */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 ease-in-out">
                {/* Header / Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            {activeUsers.length > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                                    {activeUsers.length}
                                </div>
                            )}
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active Team</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time Presence</p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronDownIcon className="w-5 h-5 text-slate-400" /> : <ChevronUpIcon className="w-5 h-5 text-slate-400 group-hover:translate-y--0.5 transition-transform" />}
                </button>

                {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Users List */}
                        <div className="px-3 pb-2 max-h-48 overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                {activeUsers.map(user => (
                                    <div key={user.userId} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all group">
                                        <div className="relative">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold border border-white dark:border-slate-600 shadow-sm">
                                                {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div
                                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                                                style={{ backgroundColor: getStatusColor(user.status) }}
                                                title={getStatusLabel(user.status)}
                                            ></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {user.userName}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                                                {user.currentLocation?.name || formatLastSeen(user.lastSeen)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <BellIcon className="w-3 h-3" />
                                    Live Activity
                                </h4>
                                {unreadCount > 0 && (
                                    <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {unreadCount} NEW
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {recentActivities.length > 0 ? (
                                    recentActivities.slice(0, 8).map(activity => (
                                        <div
                                            key={activity.id}
                                            className={`p-3 rounded-2xl transition-all border ${activity.read
                                                ? 'bg-transparent border-transparent'
                                                : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 shadow-sm'
                                                }`}
                                            onClick={() => markCollaborationActivityAsRead(activity.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-[10px] font-black flex-shrink-0 border border-purple-200/50 dark:border-purple-700/50">
                                                    {activity.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-normal">
                                                        <span className="font-bold">{activity.userName}</span> {activity.message.replace(activity.userName, '').trim()}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                                                        {formatLastSeen(activity.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <SparklesIcon className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">No recent alerts</p>
                                    </div>
                                )}
                            </div>

                            {recentActivities.length > 0 && (
                                <button
                                    onClick={clearCollaborationActivities}
                                    className="w-full mt-4 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-red-500 transition-colors"
                                >
                                    Clear History
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Simulation Float - Always Visible */}
            <button
                onClick={simulateUserActivity}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
            >
                <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Simulate Presence
            </button>
        </div>
    );
};

export default CollaborationPanel;

