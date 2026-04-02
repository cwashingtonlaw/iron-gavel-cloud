import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import {
    UserPresence,
    TypingIndicator,
    ActivityNotification,
    generateMockPresence,
    generateMockTyping,
    generateMockActivity,
    isTypingActive
} from '../../utils/collaborationUtils';

export interface CollaborationSlice {
    // State
    activeUsers: UserPresence[];
    typingIndicators: TypingIndicator[];
    recentActivities: ActivityNotification[];

    // Actions
    updateUserPresence: (presence: UserPresence) => void;
    removeUserPresence: (userId: string) => void;
    addTypingIndicator: (indicator: TypingIndicator) => void;
    removeTypingIndicator: (userId: string, locationId: string) => void;
    cleanupTypingIndicators: () => void;
    addCollaborationActivity: (activity: ActivityNotification) => void;
    markCollaborationActivityAsRead: (activityId: string) => void;
    clearCollaborationActivities: () => void;

    // F9: Mock Collaboration Features
    simulateUserActivity: () => void;
    simulateTyping: (matterId: string) => void;
}

export const createCollaborationSlice: StateCreator<AppState, [], [], CollaborationSlice> = (set, get) => ({
    // Initial State
    activeUsers: [],
    typingIndicators: [],
    recentActivities: [],

    // Update or add user presence
    updateUserPresence: (presence) => set((state) => {
        const existingIndex = state.activeUsers.findIndex(u => u.userId === presence.userId);

        if (existingIndex >= 0) {
            const updated = [...state.activeUsers];
            updated[existingIndex] = presence;
            return { activeUsers: updated };
        } else {
            return { activeUsers: [...state.activeUsers, presence] };
        }
    }),

    // Remove user presence
    removeUserPresence: (userId) => set((state) => ({
        activeUsers: state.activeUsers.filter(u => u.userId !== userId)
    })),

    // Add typing indicator
    addTypingIndicator: (indicator) => set((state) => {
        // Remove existing indicator for same user/location
        const filtered = state.typingIndicators.filter(
            t => !(t.userId === indicator.userId && t.location.id === indicator.location.id)
        );

        return { typingIndicators: [...filtered, indicator] };
    }),

    // Remove typing indicator
    removeTypingIndicator: (userId, locationId) => set((state) => ({
        typingIndicators: state.typingIndicators.filter(
            t => !(t.userId === userId && t.location.id === locationId)
        )
    })),

    // Clean up old typing indicators (> 5 seconds)
    cleanupTypingIndicators: () => set((state) => ({
        typingIndicators: state.typingIndicators.filter(isTypingActive)
    })),

    // Add activity notification
    addCollaborationActivity: (activity) => set((state) => ({
        recentActivities: [activity, ...state.recentActivities].slice(0, 50) // Keep last 50
    })),

    // Mark activity as read
    markCollaborationActivityAsRead: (activityId) => set((state) => ({
        recentActivities: state.recentActivities.map(a =>
            a.id === activityId ? { ...a, read: true } : a
        )
    })),

    // Clear all activities
    clearCollaborationActivities: () => set({ recentActivities: [] }),

    // F9: Simulate user activity for demonstration
    simulateUserActivity: () => {
        const mockUsers = [
            { id: 'USER-001', name: 'Sarah Johnson' },
            { id: 'USER-002', name: 'Michael Chen' },
            { id: 'USER-003', name: 'Emily Rodriguez' }
        ];

        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const activityTypes: ActivityNotification['type'][] = [
            'user_joined',
            'document_updated',
            'comment_added',
            'status_changed'
        ];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

        // Add presence
        const presence = generateMockPresence(randomUser.id, randomUser.name);
        (get() as any).updateUserPresence(presence);

        // Add activity
        const activity = generateMockActivity(randomUser.id, randomUser.name, randomType);
        (get() as any).addCollaborationActivity(activity);

        // Simulate user leaving after 10-30 seconds
        const leaveDelay = 10000 + Math.random() * 20000;
        setTimeout(() => {
            (get() as any).removeUserPresence(randomUser.id);
            const leaveActivity = generateMockActivity(randomUser.id, randomUser.name, 'user_left');
            (get() as any).addCollaborationActivity(leaveActivity);
        }, leaveDelay);
    },

    // Simulate typing indicator
    simulateTyping: (matterId) => {
        const mockUsers = [
            { id: 'USER-001', name: 'Sarah Johnson' },
            { id: 'USER-002', name: 'Michael Chen' }
        ];

        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const typingIndicator = generateMockTyping(randomUser.id, randomUser.name, matterId);

        (get() as any).addTypingIndicator(typingIndicator);

        // Remove after 3 seconds
        setTimeout(() => {
            (get() as any).removeTypingIndicator(randomUser.id, matterId);
        }, 3000);
    },
});
