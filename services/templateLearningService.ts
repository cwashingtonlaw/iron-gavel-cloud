import { GoogleGenAI, Type } from "@google/genai";
import { DocumentTemplate } from "../types";

const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API key not found.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * F10: AI Template Learning
 * Analyzes an existing document and extracts its structure to create a reusable template
 */
export const convertDocumentToTemplate = async (
    documentText: string,
    documentName: string
): Promise<DocumentTemplate> => {
    try {
        const ai = getAI();

        const schema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'A descriptive name for the template' },
                description: { type: Type.STRING, description: 'A brief description of what this template is for' },
                category: { type: Type.STRING, description: 'The category of document (e.g., Contract, Motion, Letter)' },
                content: { type: Type.STRING, description: 'The template content with placeholders like {{ClientName}}, {{Date}}, etc.' },
                variables: {
                    type: Type.ARRAY,
                    description: 'List of variable placeholders found in the document',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: 'Variable name (e.g., ClientName)' },
                            description: { type: Type.STRING, description: 'What this variable represents' },
                            defaultValue: { type: Type.STRING, description: 'Optional default value' }
                        },
                        required: ['name', 'description']
                    }
                }
            },
            required: ['name', 'description', 'category', 'content', 'variables']
        };

        const prompt = `You are an expert legal document analyst. Analyze the following document and convert it into a reusable template.

Original Document Name: "${documentName}"

Document Content:
---
${documentText}
---

Your task:
1. Identify the document type and create an appropriate template name
2. Extract the structure and convert specific details (names, dates, amounts, etc.) into variables using {{VariableName}} format
3. List all variables you created with descriptions
4. Preserve the professional formatting and legal language

Example variable format: "Dear {{ClientName}}" instead of "Dear John Smith"

Return a structured template that can be reused for similar documents.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from AI");

        const parsed = JSON.parse(jsonText);

        // Convert to DocumentTemplate format
        const template: DocumentTemplate = {
            id: `TPL-${Date.now()}`,
            name: parsed.name,
            description: parsed.description,
            category: parsed.category,
            content: parsed.content,
            variables: parsed.variables.map((v: any) => ({
                name: v.name,
                label: v.description,
                type: 'text' as const,
                required: true,
                defaultValue: v.defaultValue
            })),
            lastEditedBy: 'AI Template Learning',
            lastEditedAt: new Date().toISOString()
        };

        return template;

    } catch (error) {
        console.error("Template Learning Error", error);
        throw new Error("Failed to convert document to template.");
    }
};

/**
 * F10: Extract Document Structure
 * Analyzes a document and returns its structural components
 */
export const analyzeDocumentStructure = async (documentText: string): Promise<{
    sections: string[];
    keyTerms: string[];
    documentType: string;
    complexity: 'Simple' | 'Moderate' | 'Complex';
}> => {
    try {
        const ai = getAI();

        const schema = {
            type: Type.OBJECT,
            properties: {
                sections: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Main sections or headings found in the document'
                },
                keyTerms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Important legal terms or defined terms in the document'
                },
                documentType: {
                    type: Type.STRING,
                    description: 'The type of legal document (e.g., Contract, Motion, Brief)'
                },
                complexity: {
                    type: Type.STRING,
                    enum: ['Simple', 'Moderate', 'Complex'],
                    description: 'Overall complexity of the document'
                }
            },
            required: ['sections', 'keyTerms', 'documentType', 'complexity']
        };

        const prompt = `Analyze the following legal document and extract its structure:

${documentText.substring(0, 5000)} ${documentText.length > 5000 ? '...(truncated)' : ''}

Identify:
1. Main sections/headings
2. Key legal terms or defined terms
3. Document type
4. Complexity level`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Document Analysis Error", error);
        throw new Error("Failed to analyze document structure.");
    }
};
