import { OCRResult, Document } from '../types';

/**
 * OCR Service - Handles text extraction and metadata generation from legal documents
 */

export const processOCR = async (document: Document): Promise<OCRResult> => {
    // Simulating high-precision legal OCR processing
    console.log(`[OCR] Processing document: ${document.name}`);

    // In a real app, this would call Tesseract.js or a cloud vision API
    await new Promise(resolve => setTimeout(resolve, 2000));

    const processedAt = new Date().toISOString();

    // Mocking extracted data based on a hypothetical legal document
    return {
        id: `ocr-${Date.now()}`,
        documentId: document.id,
        text: `CASE NO: 22-CV-1234. IN THE SUPERIOR COURT... This is a simulated transcription of ${document.name}... Findings of fact and conclusions of law...`,
        confidence: 98.4,
        language: 'en',
        processedAt,
        metadata: {
            pageCount: Math.floor(Math.random() * 20) + 1,
            extractedDates: [
                { date: '2025-05-15', context: 'Date of occurrence' },
                { date: '2026-01-20', context: 'Filing date' }
            ],
            extractedEntities: [
                { name: 'John Doe', type: 'Person' },
                { name: 'Acme Corp', type: 'Organization' },
                { name: '22-CV-1234', type: 'Case Number' }
            ],
            extractedAmounts: [
                { amount: 250000.00, context: 'Judgment amount' }
            ]
        }
    };
};

/**
 * Auto-detect and extract key legal entities from text
 */
export const extractLegalEntities = (text: string) => {
    // More sophisticated regex-based extraction for legal patterns
    const caseNumberPattern = /\d{2}-\w{2,4}-\d{4,}/g;
    const currencyPattern = /\$\d{1,3}(,\d{3})*(\.\d{2})?/g;

    return {
        caseNumbers: text.match(caseNumberPattern) || [],
        monetaryValues: text.match(currencyPattern) || []
    };
};
