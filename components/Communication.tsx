import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import EmailAssistant from './EmailAssistant';
import { CommunicationSidebar } from './communication/CommunicationSidebar';
import { CommunicationHeader } from './communication/CommunicationHeader';
import { CommunicationFeed } from './communication/CommunicationFeed';
import { NewInternalMessageModal } from './communication/NewInternalMessageModal';
import { CommunicationFeedItem } from '../types';
import { MOCK_USERS } from '../constants';

type NavItem = 'Client portals' | 'Text messages' | 'Internal messages' | 'Logs';

const Communication: React.FC = () => {
    const { communicationFeed, internalMessages, currentUser, matters } = useStore();
    const [activeNav, setActiveNav] = useState<NavItem>('Client portals');
    const [activeTab, setActiveTab] = useState<'My client portals' | 'All'>('My client portals');
    const [isEmailAssistantOpen, setIsEmailAssistantOpen] = useState(false);
    const [isInternalMessageModalOpen, setIsInternalMessageModalOpen] = useState(false);

    // Filter feed based on active navigation
    const getFilteredFeed = (): CommunicationFeedItem[] => {
        if (activeNav === 'Internal messages') {
            // Convert internal messages to feed items
            return internalMessages
                .filter(msg => msg.toUserIds.includes(currentUser.id) || msg.fromUserId === currentUser.id)
                .map(msg => {
                    const sender = MOCK_USERS.find(u => u.id === msg.fromUserId);
                    const matter = matters.find(m => m.id === msg.matterId);
                    return {
                        id: msg.id,
                        senderName: sender ? sender.name : 'Unknown User',
                        content: msg.content,
                        type: 'Message',
                        matterId: msg.matterId || '',
                        matterName: matter ? matter.name : msg.subject, // Use matter name if available, else subject
                        date: new Date(msg.timestamp).toLocaleDateString(),
                    };
                });
        }
        // Default feed for other tabs (mock data for now)
        return communicationFeed;
    };

    return (
        <div className="flex h-full bg-white border-l border-slate-200 -m-4 sm:-m-6 md:-m-8 lg:-m-10">
            <CommunicationSidebar
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                onOpenEmailAssistant={() => setIsEmailAssistantOpen(true)}
                onNewInternalMessage={() => setIsInternalMessageModalOpen(true)}
            />

            <div className="flex-1 flex flex-col">
                <CommunicationHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
                <CommunicationFeed feed={getFilteredFeed()} />
            </div>

            <EmailAssistant
                isOpen={isEmailAssistantOpen}
                onClose={() => setIsEmailAssistantOpen(false)}
                onInsert={(content) => {
                    alert(`Email content generated:\n\n${content}\n\n(In a real app, this would be inserted into the email editor)`);
                }}
            />

            <NewInternalMessageModal
                isOpen={isInternalMessageModalOpen}
                onClose={() => setIsInternalMessageModalOpen(false)}
            />
        </div>
    );
};

export default Communication;
