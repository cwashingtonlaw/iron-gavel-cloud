import React from 'react';
import { CommunicationFeedItem } from '../../types';
import { CalendarIcon, DocumentTextIcon } from '../icons';

interface CommunicationFeedProps {
    feed: CommunicationFeedItem[];
}

export const CommunicationFeed: React.FC<CommunicationFeedProps> = ({ feed }) => {
    return (
        <div className="flex-1 overflow-y-auto bg-white">
            {feed.map(item => (
                <div key={item.id} className="flex p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-48 flex-shrink-0">
                        <a href="#" className="text-sm font-medium text-blue-600 hover:underline truncate block pr-4" title={item.senderName}>
                            {item.senderName.length > 20 ? item.senderName.substring(0, 18) + '...' : item.senderName}
                        </a>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 mb-1">
                            {item.type === 'Event' && (
                                <span className="inline-flex items-center mr-1">
                                    <CalendarIcon className="w-4 h-4 text-slate-500 mr-1" />
                                </span>
                            )}
                            {item.content}
                        </div>
                        {item.attachmentName && (
                            <div className="flex items-center text-sm text-blue-600 mb-1">
                                <DocumentTextIcon className="w-4 h-4 mr-1" />
                                <a href="#" className="hover:underline">{item.attachmentName}</a>
                            </div>
                        )}
                        <div className="flex items-center text-xs text-blue-600">
                            {item.attachmentName && <span className="text-slate-400 mr-1">•</span>}
                            <a href="#" className="hover:underline">{item.matterName}</a>
                        </div>
                    </div>
                    <div className="w-24 text-right flex-shrink-0">
                        <span className="text-sm text-slate-500">{item.date}</span>
                    </div>
                </div>
            ))}
            {feed.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No communications found.
                </div>
            )}
        </div>
    );
};
