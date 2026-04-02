import { StateCreator } from 'zustand';
import { Contact, PotentialClient } from '../../types';
import { contactService } from '../../services/contactService';

export interface ContactSlice {
    contacts: Contact[];
    potentialClients: PotentialClient[];
    addContact: (contact: Contact) => void;
    updateContact: (contact: Contact) => void;
    deleteContact: (id: string) => void;
    addPotentialClient: (pc: PotentialClient) => void;
    updatePotentialClient: (pc: PotentialClient) => void;
}

export const createContactSlice: StateCreator<ContactSlice> = (set) => ({
    contacts: contactService.getContacts(),
    potentialClients: [], // Initialize with empty or from service
    addContact: (contact) => set((state) => ({
        contacts: contactService.addContact(state.contacts, contact)
    })),
    updateContact: (contact) => set((state) => ({
        contacts: contactService.updateContact(state.contacts, contact)
    })),
    deleteContact: (id) => set((state) => ({
        contacts: contactService.deleteContact(state.contacts, id)
    })),
    addPotentialClient: (pc) => set((state) => ({
        potentialClients: [...state.potentialClients, pc]
    })),
    updatePotentialClient: (pc) => set((state) => ({
        potentialClients: state.potentialClients.map(p => p.id === pc.id ? pc : p)
    })),
});
