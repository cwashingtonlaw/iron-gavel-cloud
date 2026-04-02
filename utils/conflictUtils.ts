import Fuse from 'fuse.js';
import { Matter, Contact, PotentialClient, RelatedParty } from '../types';

export interface ConflictResult {
    type: 'Matter' | 'Contact' | 'Potential Client' | 'Related Party';
    item: Matter | Contact | PotentialClient | RelatedParty;
    matchField: string;
    score: number; // 0 (perfect match) to 1 (no match)
}

export const checkConflicts = (
    searchTerm: string,
    contacts: Contact[],
    matters: Matter[],
    potentialClients: PotentialClient[] = []
): ConflictResult[] => {
    if (!searchTerm || searchTerm.trim().length < 3) return [];

    const foundResults: ConflictResult[] = [];

    // F2: Extract all Related Parties from all matters
    const allRelatedParties: { party: RelatedParty, matterName: string }[] = matters.flatMap(m =>
        (m.relatedParties || []).map(p => ({ party: p, matterName: m.name }))
    );

    // F1: Initialize Fuse.js for high-precision fuzzy matching
    const fuseOptions = {
        includeScore: true,
        threshold: 0.3, // Precision vs. Recall
        keys: ['name', 'client', 'email', 'companyName']
    };

    const matterFuse = new Fuse(matters, { ...fuseOptions, keys: ['name', 'client'] });
    const contactFuse = new Fuse(contacts, { ...fuseOptions, keys: ['name', 'companyName', 'email'] });
    const pcFuse = new Fuse(potentialClients, { ...fuseOptions, keys: ['name', 'email'] });
    const rpFuse = new Fuse(allRelatedParties, { ...fuseOptions, keys: ['party.name'] });

    // Search Matters
    matterFuse.search(searchTerm).forEach(res => {
        foundResults.push({
            type: 'Matter',
            item: res.item,
            matchField: 'Matter/Client Name',
            score: res.score || 0
        });
    });

    // Search Contacts
    contactFuse.search(searchTerm).forEach(res => {
        foundResults.push({
            type: 'Contact',
            item: res.item,
            matchField: 'Contact/Company Name',
            score: res.score || 0
        });
    });

    // Search Potential Clients
    pcFuse.search(searchTerm).forEach(res => {
        foundResults.push({
            type: 'Potential Client',
            item: res.item,
            matchField: 'Lead Name',
            score: res.score || 0
        });
    });

    // Search Related Parties (F2)
    rpFuse.search(searchTerm).forEach(res => {
        foundResults.push({
            type: 'Related Party',
            item: res.item.party,
            matchField: `Related to Matter: ${res.item.matterName}`,
            score: res.score || 0
        });
    });

    // Sort by best score
    return foundResults.sort((a, b) => a.score - b.score);
};
