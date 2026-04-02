import { Communication, CommunicationFeedItem, InternalMessage } from '../types';
import { MOCK_COMMUNICATIONS, MOCK_COMMUNICATION_FEED } from '../constants';

export const communicationService = {
    getCommunications: (): Communication[] => {
        return [...MOCK_COMMUNICATIONS];
    },

    getFeed: (): CommunicationFeedItem[] => {
        return [...MOCK_COMMUNICATION_FEED];
    },

    addCommunication: (communications: Communication[], comm: Communication): Communication[] => {
        return [comm, ...communications];
    },

    deleteCommunication: (communications: Communication[], id: string): Communication[] => {
        return communications.filter((c) => c.id !== id);
    },

    addToFeed: (feed: CommunicationFeedItem[], item: CommunicationFeedItem): CommunicationFeedItem[] => {
        return [item, ...feed];
    },

    getInternalMessages: (): InternalMessage[] => {
        return []; // Start with empty list or mock data if desired
    },

    sendInternalMessage: (messages: InternalMessage[], message: InternalMessage): InternalMessage[] => {
        return [message, ...messages];
    },
};
