import Fuse from 'fuse.js';
import { Document, DocumentSearchResult, OCRResult, AdvancedSearchQuery } from '../types';

/**
 * Advanced Search Engine Service - Full-text indexing and fuzzy retrieval
 */

let documentIndex: any[] = [];

/**
 * Index documents for search. In production, this would use Elasticsearch or a Vector DB.
 */
export const indexDocuments = (documents: Document[], ocrResults: OCRResult[]) => {
    documentIndex = documents.map(doc => {
        const ocr = ocrResults.find(r => r.documentId === doc.id);
        return {
            documentId: doc.id,
            name: doc.name,
            content: ocr?.text || '',
            matterId: doc.matterId,
            category: doc.category.name,
            metadata: {
                uploadDate: doc.uploadDate,
                author: 'System',
                tags: doc.isPrivileged ? ['Privileged'] : []
            }
        };
    });
};

/**
 * Perform an advanced search across indexed documents
 */
export const advancedSearch = (query: AdvancedSearchQuery): DocumentSearchResult[] => {
    const options = {
        includeScore: true,
        includeMatches: true,
        threshold: query.fuzzyMatch ? 0.4 : 0.1,
        keys: ['name', 'content', 'category']
    };

    const fuse = new Fuse(documentIndex, options);
    const results = fuse.search(query.query);

    // Filter and map results to DocumentSearchResult
    return results
        .filter(res => {
            if (query.filters.matterIds?.length && !query.filters.matterIds.includes(res.item.matterId)) return false;
            if (query.filters.categories?.length && !query.filters.categories.includes(res.item.category)) return false;
            return true;
        })
        .map(res => ({
            documentId: res.item.documentId,
            documentName: res.item.name,
            matterId: res.item.matterId,
            matterName: 'Linked Matter', // In production, resolve matter name
            score: res.score || 0,
            highlights: (res.matches || []).map(m => ({
                field: m.key as string,
                snippet: m.value as string,
                startIndex: m.indices[0][0],
                endIndex: m.indices[0][1]
            })),
            preview: res.item.content.substring(0, 150) + '...'
        }))
        .slice(0, query.maxResults);
};
