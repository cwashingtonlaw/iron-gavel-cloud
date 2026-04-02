/**
 * F9: Real-time Collaboration Indicators
 * 
 * This module provides types and utilities for real-time collaboration features,
 * including presence indicators, typing indicators, and activity notifications.
 */

export interface UserPresence {
    userId: string;
    userName: string;
    userAvatar?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    lastSeen: string; // ISO timestamp
    currentLocation?: {
        type: 'Matter' | 'Document' | 'Contact' | 'Task';
        id: string;
        name: string;
    };
}

export interface TypingIndicator {
    userId: string;
    userName: string;
    location: {
        type: 'Matter' | 'Document' | 'Note';
        id: string;
    };
    startedAt: string; // ISO timestamp
}

export interface ActivityNotification {
    id: string;
    type: 'user_joined' | 'user_left' | 'document_updated' | 'comment_added' | 'status_changed';
    userId: string;
    userName: string;
    userAvatar?: string;
    message: string;
    timestamp: string; // ISO timestamp
    relatedItem?: {
        type: 'Matter' | 'Document' | 'Contact' | 'Task';
        id: string;
        name: string;
    };
    read: boolean;
}

export interface CollaborationState {
    activeUsers: UserPresence[];
    typingIndicators: TypingIndicator[];
    recentActivities: ActivityNotification[];
}

/**
 * Mock data generator for demonstration purposes
 */
export const generateMockPresence = (userId: string, userName: string): UserPresence => {
    const statuses: UserPresence['status'][] = ['online', 'away', 'busy'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
        userId,
        userName,
        status: randomStatus,
        lastSeen: new Date().toISOString(),
        currentLocation: Math.random() > 0.5 ? {
            type: 'Matter',
            id: 'MAT-001',
            name: 'Smith v. Johnson'
        } : undefined
    };
};

/**
 * Generate mock typing indicator
 */
export const generateMockTyping = (userId: string, userName: string, locationId: string): TypingIndicator => {
    return {
        userId,
        userName,
        location: {
            type: 'Matter',
            id: locationId
        },
        startedAt: new Date().toISOString()
    };
};

/**
 * Generate mock activity notification
 */
export const generateMockActivity = (
    userId: string,
    userName: string,
    type: ActivityNotification['type']
): ActivityNotification => {
    const messages = {
        user_joined: `${userName} joined the workspace`,
        user_left: `${userName} left the workspace`,
        document_updated: `${userName} updated a document`,
        comment_added: `${userName} added a comment`,
        status_changed: `${userName} changed matter status`
    };

    return {
        id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        userId,
        userName,
        message: messages[type],
        timestamp: new Date().toISOString(),
        read: false
    };
};

/**
 * Check if a typing indicator is still active (< 5 seconds old)
 */
export const isTypingActive = (indicator: TypingIndicator): boolean => {
    const startTime = new Date(indicator.startedAt).getTime();
    const now = new Date().getTime();
    const fiveSecondsInMs = 5000;

    return (now - startTime) < fiveSecondsInMs;
};

/**
 * Get active users for a specific location
 */
export const getActiveUsersAtLocation = (
    presence: UserPresence[],
    locationType: string,
    locationId: string
): UserPresence[] => {
    return presence.filter(p =>
        p.status === 'online' &&
        p.currentLocation?.type === locationType &&
        p.currentLocation?.id === locationId
    );
};

/**
 * Format last seen timestamp
 */
export const formatLastSeen = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

/**
 * Get status color for presence indicator
 */
export const getStatusColor = (status: UserPresence['status']): string => {
    switch (status) {
        case 'online': return '#10b981'; // green
        case 'away': return '#f59e0b'; // yellow
        case 'busy': return '#ef4444'; // red
        case 'offline': return '#94a3b8'; // gray
    }
};

/**
 * Get status label
 */
export const getStatusLabel = (status: UserPresence['status']): string => {
    switch (status) {
        case 'online': return 'Online';
        case 'away': return 'Away';
        case 'busy': return 'Busy';
        case 'offline': return 'Offline';
    }
};
