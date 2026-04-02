import { Document, DocumentTemplate } from '../types';
import { MOCK_DOCUMENTS, MOCK_DOCUMENT_TEMPLATES } from '../constants';

export const documentService = {
    getDocuments: (): Document[] => {
        return [...MOCK_DOCUMENTS];
    },

    getDocumentTemplates: (): DocumentTemplate[] => {
        return [...MOCK_DOCUMENT_TEMPLATES];
    },

    addDocument: (documents: Document[], doc: Document): Document[] => {
        return [...documents, doc];
    },

    updateDocument: (documents: Document[], doc: Document): Document[] => {
        return documents.map((d) => (d.id === doc.id ? doc : d));
    },

    deleteDocument: (documents: Document[], id: string): Document[] => {
        return documents.filter((d) => d.id !== id);
    },

    addDocumentTemplate: (templates: DocumentTemplate[], template: DocumentTemplate): DocumentTemplate[] => {
        return [...templates, template];
    },
};
