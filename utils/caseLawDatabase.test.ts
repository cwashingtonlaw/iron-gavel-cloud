import { describe, it, expect } from 'vitest';
import { searchCaseLawDatabase } from '../services/caseLawDatabase';

describe('caseLawDatabase', () => {
    it('should find cases by practice area', () => {
        const results = searchCaseLawDatabase('Criminal Defense');
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(r => r.practiceArea.includes('Criminal Defense'))).toBe(true);
    });

    it('should find cases by keywords in summary or holding', () => {
        const results = searchCaseLawDatabase(undefined, 'miranda');
        expect(results.length).toBe(1);
        expect(results[0].citation).toContain('Miranda v. Arizona');
    });

    it('should find cases by keywords in key holding', () => {
        const results = searchCaseLawDatabase(undefined, 'reasonable suspicion');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.citation.includes('Terry v. Ohio'))).toBe(true);
    });

    it('should return empty array for non-existent keywords', () => {
        const results = searchCaseLawDatabase(undefined, 'zxywvut');
        expect(results.length).toBe(0);
    });

    it('should handle case-insensitive searching', () => {
        const results = searchCaseLawDatabase('CRIMINAL');
        expect(results.length).toBeGreaterThan(0);
    });
});
