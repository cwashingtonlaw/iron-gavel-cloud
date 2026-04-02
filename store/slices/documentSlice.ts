import { StateCreator } from 'zustand';
import { Document, DocumentTemplate } from '../../types';
import { documentService } from '../../services/documentService';

export interface DocumentSlice {
    documents: Document[];
    documentTemplates: DocumentTemplate[];
    addDocument: (doc: Document) => void;
    updateDocument: (doc: Document) => void;
    deleteDocument: (id: string) => void;
    addDocumentTemplate: (template: DocumentTemplate) => void;
    produceDocuments: (documentIds: string[], startBates: string) => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice> = (set) => ({
    documents: documentService.getDocuments(),
    documentTemplates: documentService.getDocumentTemplates(),
    addDocument: (doc) => set((state) => ({
        documents: documentService.addDocument(state.documents, doc)
    })),
    updateDocument: (doc) => set((state) => ({
        documents: documentService.updateDocument(state.documents, doc)
    })),
    deleteDocument: (id) => set((state) => ({
        documents: documentService.deleteDocument(state.documents, id)
    })),
    addDocumentTemplate: (template) => set((state) => ({
        documentTemplates: documentService.addDocumentTemplate(state.documentTemplates, template)
    })),
    produceDocuments: (documentIds, startBates) => set((state) => {
        const prefix = startBates.replace(/[0-9]/g, '');
        const number = parseInt(startBates.replace(/[^0-9]/g, '')) || 1;

        const updatedDocs = state.documents.map(doc => {
            const index = documentIds.indexOf(doc.id);
            if (index !== -1) {
                const batesSuffix = String(number + index).padStart(6, '0');
                return {
                    ...doc,
                    batesNumber: `${prefix}${batesSuffix}`,
                    discoveryStatus: 'Produced' as const
                };
            }
            return doc;
        });

        return { documents: updatedDocs };
    }),
});
