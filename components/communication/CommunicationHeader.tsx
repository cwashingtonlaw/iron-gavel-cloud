import React from 'react';

interface CommunicationHeaderProps {
    activeTab: 'My client portals' | 'All';
    setActiveTab: (tab: 'My client portals' | 'All') => void;
}

export const CommunicationHeader: React.FC<CommunicationHeaderProps> = ({ activeTab, setActiveTab }) => {
    return (
        <>
            <div className="border-b border-slate-200 px-6 pt-4">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('My client portals')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'My client portals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        My client portals
                    </button>
                    <button
                        onClick={() => setActiveTab('All')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'All' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            <div className="p-4 border-b border-slate-200 flex justify-end items-center bg-white">
                <button className="text-slate-500 hover:text-slate-700 mr-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                </button>
                <button className="border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 bg-white hover:bg-slate-50 flex items-center">
                    Newest <span className="ml-2 text-xs">▼</span>
                </button>
            </div>
        </>
    );
};
