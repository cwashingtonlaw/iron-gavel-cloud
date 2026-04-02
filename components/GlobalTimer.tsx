
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { ClockIcon, PlusIcon, XMarkIcon } from './icons';

const GlobalTimer: React.FC = () => {
    const { matters, addActivity } = useStore();
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [selectedMatterId, setSelectedMatterId] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning]);

    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStop = () => {
        setIsRunning(false);
        setIsMenuOpen(true);
    };

    const handleSave = () => {
        if (!selectedMatterId) {
            alert('Please select a matter to link this time entry.');
            return;
        }

        const matter = matters.find(m => m.id === selectedMatterId);
        const durationHrs = seconds / 3600;

        addActivity({
            id: `ACT_${Date.now()}`,
            description: `Time entry: ${formatTime(seconds)} billed to ${matter?.name || selectedMatterId}`,
            date: new Date().toISOString(),
            user: 'Christopher Washington'
        });

        setSeconds(0);
        setIsMenuOpen(false);
        setSelectedMatterId('');
    };

    const handleDiscard = () => {
        if (confirm('Are you sure you want to discard this timer?')) {
            setSeconds(0);
            setIsRunning(false);
            setIsMenuOpen(false);
            setSelectedMatterId('');
        }
    };

    return (
        <div className="relative flex items-center">
            <div
                className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all ${isRunning ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                    }`}
            >
                <div className="flex items-center gap-1.5">
                    <ClockIcon className={`w-4 h-4 ${isRunning ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                    <span className={`text-sm font-mono font-medium ${isRunning ? 'text-red-700' : 'text-slate-700'}`}>
                        {formatTime(seconds)}
                    </span>
                </div>

                {isRunning ? (
                    <button
                        onClick={handleStop}
                        className="w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                    </button>
                ) : (
                    <button
                        onClick={() => setIsRunning(true)}
                        className="w-6 h-6 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700"
                    >
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                    </button>
                )}
            </div>

            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 text-sm">Save Time Entry</h3>
                        <button onClick={() => setIsMenuOpen(false)}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
                    </div>

                    <div className="mb-4">
                        <p className="text-2xl font-mono font-bold text-slate-800 text-center py-2 bg-slate-50 rounded">
                            {formatTime(seconds)}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Link to Matter</label>
                            <select
                                value={selectedMatterId}
                                onChange={(e) => setSelectedMatterId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                            >
                                <option value="">Select matter...</option>
                                {matters.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleDiscard}
                                className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-slate-50"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                            >
                                Save Activity
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalTimer;
