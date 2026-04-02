import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCollaborationSlice } from './collaborationSlice';

// Mock simple store setup for testing slice in isolation if needed, 
// but we'll just test the logic via a manual mock of state
describe('collaborationSlice', () => {
    let slice: any;
    let set: any;
    let get: any;

    beforeEach(() => {
        let state = {
            activeUsers: [],
            typingIndicators: [],
            recentActivities: []
        };
        set = vi.fn((fn) => {
            const nextState = typeof fn === 'function' ? fn(state) : fn;
            state = { ...state, ...nextState };
        });
        get = () => state;
        slice = createCollaborationSlice(set, get, {} as any);
    });

    it('should update user presence', () => {
        slice.updateUserPresence({ userId: 'u1', name: 'John', status: 'online', lastSeen: 'now', location: 'Matters' });
        expect(get().activeUsers.length).toBe(1);
        expect(get().activeUsers[0].name).toBe('John');
    });

    it('should add and remove typing indicators', () => {
        const indicator = { userId: 'u1', userName: 'John', timestamp: Date.now(), location: { id: 'm1', type: 'matter', name: 'Matter 1' } };
        slice.addTypingIndicator(indicator);
        expect(get().typingIndicators.length).toBe(1);
        expect(get().typingIndicators[0].userName).toBe('John');

        slice.removeTypingIndicator('u1', 'm1');
        expect(get().typingIndicators.length).toBe(0);
    });

    it('should add and clear collaboration activities', () => {
        slice.addCollaborationActivity({ id: 'a1', type: 'user_joined', userId: 'u1', userName: 'John', timestamp: 'now' });
        expect(get().recentActivities.length).toBe(1);

        slice.clearCollaborationActivities();
        expect(get().recentActivities.length).toBe(0);
    });

    it('should mark activities as read', () => {
        slice.addCollaborationActivity({ id: 'a1', type: 'user_joined', userId: 'u1', userName: 'John', timestamp: 'now' });
        slice.markCollaborationActivityAsRead('a1');
        expect(get().recentActivities[0].read).toBe(true);
    });
});
