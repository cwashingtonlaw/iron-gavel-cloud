import { StateCreator } from 'zustand';
import { Communication, CommunicationFeedItem, InternalMessage } from '../../types';
import { communicationService } from '../../services/communicationService';

export interface CommunicationSlice {
    communications: Communication[];
    communicationFeed: CommunicationFeedItem[];
    addCommunication: (comm: Communication) => void;
    deleteCommunication: (id: string) => void;
    addToFeed: (item: CommunicationFeedItem) => void;
    internalMessages: InternalMessage[];
    sendInternalMessage: (message: InternalMessage) => void;
}

export const createCommunicationSlice: StateCreator<CommunicationSlice> = (set) => ({
    communications: communicationService.getCommunications(),
    communicationFeed: communicationService.getFeed(),
    addCommunication: (comm) => set((state) => ({
        communications: communicationService.addCommunication(state.communications, comm)
    })),
    deleteCommunication: (id) => set((state) => ({
        communications: communicationService.deleteCommunication(state.communications, id)
    })),
    addToFeed: (item) => set((state) => ({
        communicationFeed: communicationService.addToFeed(state.communicationFeed, item)
    })),
    internalMessages: communicationService.getInternalMessages(),
    sendInternalMessage: (message) => set((state) => ({
        internalMessages: communicationService.sendInternalMessage(state.internalMessages, message)
    })),
});
