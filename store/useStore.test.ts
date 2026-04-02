import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { Matter, Contact } from '../types';

describe('useStore', () => {
    // Reset store before each test
    beforeEach(() => {
        useStore.setState({
            matters: [],
            contacts: [],
            tasks: [],
            documents: [],
            timeEntries: [],
            expenses: [],
        });
    });

    it('should add a matter', () => {
        const newMatter: Matter = {
            id: '1',
            name: 'Test Matter',
            client: 'Test Client',
            status: 'Open',
            openDate: '2023-01-01',
            notes: '',
            billing: { type: 'Hourly' }
        };

        useStore.getState().addMatter(newMatter);

        const matters = useStore.getState().matters;
        expect(matters).toHaveLength(1);
        expect(matters[0]).toEqual(newMatter);
    });

    it('should update a matter', () => {
        const matter: Matter = {
            id: '1',
            name: 'Test Matter',
            client: 'Test Client',
            status: 'Open',
            openDate: '2023-01-01',
            notes: '',
            billing: { type: 'Hourly' }
        };

        useStore.getState().addMatter(matter);

        const updatedMatter = { ...matter, status: 'Closed' as const };
        useStore.getState().updateMatter(updatedMatter);

        const matters = useStore.getState().matters;
        expect(matters[0].status).toBe('Closed');
    });

    it('should delete a matter', () => {
        const matter: Matter = {
            id: '1',
            name: 'Test Matter',
            client: 'Test Client',
            status: 'Open',
            openDate: '2023-01-01',
            notes: '',
            billing: { type: 'Hourly' }
        };

        useStore.getState().addMatter(matter);
        useStore.getState().deleteMatter('1');

        const matters = useStore.getState().matters;
        expect(matters).toHaveLength(0);
    });

    it('should add a contact', () => {
        const newContact: Contact = {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            type: 'Client',
            associatedMatters: [],
            hasPortalAccess: false
        };

        useStore.getState().addContact(newContact);

        const contacts = useStore.getState().contacts;
        expect(contacts).toHaveLength(1);
        expect(contacts[0]).toEqual(newContact);
    });
});
