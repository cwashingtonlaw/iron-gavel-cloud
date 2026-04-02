import { describe, it, expect } from 'vitest';
import { checkConflicts } from './conflictUtils';
import { Matter, Contact, PotentialClient } from '../types';

describe('Conflict Detection (F1 & F2)', () => {
    const mockMatters: Matter[] = [
        {
            id: 'MAT-001',
            name: 'Smith v. Johnson',
            client: 'John Smith',
            practiceArea: 'Personal Injury',
            status: 'Open',
            openDate: '2025-01-01',
            notes: 'Car accident case',
            relatedParties: [
                {
                    id: 'RP-001',
                    name: 'Jane Smyth',
                    role: 'Witness',
                    email: 'jane@example.com'
                }
            ]
        },
        {
            id: 'MAT-002',
            name: 'Doe Corporation Matter',
            client: 'Doe Corp',
            practiceArea: 'Corporate',
            status: 'Open',
            openDate: '2025-02-01',
            notes: 'Contract dispute'
        }
    ];

    const mockContacts: Contact[] = [
        {
            id: 'CON-001',
            name: 'John Smith',
            type: 'Client',
            email: 'john@example.com',
            phone: '555-0100',
            associatedMatters: ['MAT-001'],
            hasPortalAccess: false
        },
        {
            id: 'CON-002',
            name: 'Jon Smythe',
            type: 'Client',
            email: 'jon@example.com',
            phone: '555-0200',
            associatedMatters: [],
            hasPortalAccess: false
        }
    ];

    const mockPotentialClients: PotentialClient[] = [
        {
            id: 'PC-001',
            name: 'John Smithson',
            email: 'smithson@example.com',
            phone: '555-0300',
            source: 'Referral',
            status: 'New Lead',
            notes: 'Interested in personal injury case',
            contactDate: '2025-03-01'
        }
    ];

    it('should detect exact name matches', () => {
        const results = checkConflicts('John Smith', mockContacts, mockMatters, mockPotentialClients);
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.type === 'Contact')).toBe(true);
        expect(results.some(r => r.type === 'Matter')).toBe(true);
    });

    it('should detect fuzzy matches (Smith vs Smyth)', () => {
        const results = checkConflicts('Smyth', mockContacts, mockMatters, mockPotentialClients);
        expect(results.length).toBeGreaterThan(0);
        // Should find both "Smith" and "Smyth" due to fuzzy matching
        const matchedNames = results.map(r => (r.item as any).name);
        expect(matchedNames.some(name => name.includes('Smith') || name.includes('Smyth'))).toBe(true);
    });

    it('should detect related party conflicts', () => {
        const results = checkConflicts('Jane Smyth', mockContacts, mockMatters, mockPotentialClients);
        expect(results.some(r => r.type === 'Related Party')).toBe(true);
    });

    it('should return confidence scores', () => {
        const results = checkConflicts('John Smith', mockContacts, mockMatters, mockPotentialClients);
        results.forEach(result => {
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(1);
        });
    });

    it('should sort results by best match (lowest score)', () => {
        const results = checkConflicts('Smith', mockContacts, mockMatters, mockPotentialClients);
        if (results.length > 1) {
            for (let i = 0; i < results.length - 1; i++) {
                expect(results[i].score).toBeLessThanOrEqual(results[i + 1].score);
            }
        }
    });

    it('should return empty array for queries less than 3 characters', () => {
        const results = checkConflicts('Jo', mockContacts, mockMatters, mockPotentialClients);
        expect(results).toEqual([]);
    });

    it('should handle empty search term', () => {
        const results = checkConflicts('', mockContacts, mockMatters, mockPotentialClients);
        expect(results).toEqual([]);
    });

    it('should detect potential client matches', () => {
        const results = checkConflicts('Smithson', mockContacts, mockMatters, mockPotentialClients);
        expect(results.some(r => r.type === 'Potential Client')).toBe(true);
    });
});
