import { Contact } from '../types';
import { MOCK_CONTACTS } from '../constants';

// In a real app, these would be API calls
// For now, we'll just return the mock data or simulate async operations if needed

export const contactService = {
    getContacts: (): Contact[] => {
        return [...MOCK_CONTACTS];
    },

    addContact: (contacts: Contact[], contact: Contact): Contact[] => {
        return [...contacts, contact];
    },

    updateContact: (contacts: Contact[], contact: Contact): Contact[] => {
        return contacts.map((c) => (c.id === contact.id ? contact : c));
    },

    deleteContact: (contacts: Contact[], id: string): Contact[] => {
        return contacts.filter((c) => c.id !== id);
    },
};
