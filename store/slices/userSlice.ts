import { StateCreator } from 'zustand';
import { User } from '../../types';
import { CURRENT_USER } from '../../constants';

export interface UserSlice {
    currentUser: User;
    setCurrentUser: (user: User) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
    currentUser: CURRENT_USER,
    setCurrentUser: (user) => set({ currentUser: user }),
});
