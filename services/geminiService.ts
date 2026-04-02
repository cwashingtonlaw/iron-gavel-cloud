import { GoogleGenAI, Type } from "@google/genai";
// FIX: Corrected relative path to import types from the parent directory.
import { Matter, Contact, DocumentTemplate, TimeEntry, SearchResult, Document, Communication } from "../types";

const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API key not found.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateCaseSummary = async (notes: string): Promise<string> => {
    try {
        const ai = getAI();

        const prompt = `You are an expert legal assistant. Summarize the following case notes into a concise, easy-to-read overview. Structure the summary with the following sections: "Case Overview", "Key Parties", "Recent Developments", and "Next Steps". The notes are: \n\n---\n${notes}\n---`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "No summary generated.";
    } catch (error) {
        console.error("Error generating case summary:", error);
        return "An error occurred while generating the summary. Please check the console for details.";
    }
};

export const generateDocument = async (template: DocumentTemplate, matter: Matter, contacts: Contact[]): Promise<string> => {
    try {
        const ai = getAI();

        const client = contacts.find(c => c.name === matter.client && c.type === 'Client');
        const opposingCounsel = contacts.find(c => c.type === 'Counsel' && c.associatedMatters.includes(matter.id));

        const prompt = `
        You are an expert paralegal tasked with generating a legal document.
        Fill in the following document template with the provided information. 
        Where information is missing, use plausible placeholders in the format [Placeholder].
        Ensure the final document is professionally formatted.

        Template Name: ${template.name}
        Template Description: ${template.description}

        Case Information:
        - Matter Name: ${matter.name}
        - Client Name: ${client?.name || '[Client Name]'}
        - Client Contact: ${client?.email || '[Client Email]'}, ${client?.phone || '[Client Phone]'}
        - Opposing Counsel: ${opposingCounsel?.name || 'N/A'}
        - Date: ${new Date().toLocaleDateString('en-US')}

        Please generate the full text of the "${template.name}".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "No document generated.";
    } catch (error) {
        console.error("Error generating document:", error);
        return "An error occurred while generating the document. Please check the console for details.";
    }
}

export const summarizeEmailForLog = async (emailText: string): Promise<{ from: string, to: string, subject: string, summary: string }> => {
    try {
        const ai = getAI();

        const schema = {
            type: Type.OBJECT,
            properties: {
                from: { type: Type.STRING, description: 'The sender of the email. Can be a name and/or email address.' },
                to: { type: Type.STRING, description: 'The primary recipient of the email. Can be a name and/or email address.' },
                subject: { type: Type.STRING, description: 'The subject line of the email.' },
                summary: { type: Type.STRING, description: 'A concise, one-paragraph summary of the email\'s content.' },
            },
            required: ['from', 'to', 'subject', 'summary'],
        };

        const prompt = `Analyze the following email text. Extract the sender, recipient, subject, and provide a concise summary.
        
        Email Text:
        ---
        ${emailText}
        ---
        `;

        // Using gemini-2.5-flash-lite for fast response
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from AI");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error summarizing email:", error);
        return { from: '', to: '', subject: 'Error', summary: 'Failed to parse email. Please check the console.' };
    }
};

export const reviewDocument = async (documentContent: string) => {
    try {
        const ai = getAI();

        const schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: 'A brief, one-paragraph summary of the document\'s purpose and key contents.' },
                keyEntities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING, description: 'e.g., Person, Company, Location' } } } },
                importantDates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, description: { type: Type.STRING } } } },
                actionItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of potential actions or items requiring follow-up based on the document.' },
            },
            required: ['summary', 'keyEntities', 'importantDates', 'actionItems'],
        };

        const prompt = `You are a highly skilled paralegal. Analyze the following legal document text. Extract a summary, key entities (people, companies), important dates, and suggest potential action items.
        
        Document Text:
        ---
        ${documentContent}
        ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema, },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from AI");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error reviewing document:", error);
        throw new Error("Failed to analyze document with AI.");
    }
};

export const analyzeTimeEntries = async (entries: TimeEntry[]) => {
    try {
        const ai = getAI();

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    entryId: { type: Type.STRING },
                    suggestion: { type: Type.STRING, description: 'A more professional and descriptive narrative for the time entry. If the original is good, return it as is.' },
                    flags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of potential issues, such as "Vague", "Block Billing", or "Potential Typo".' },
                },
                required: ['entryId', 'suggestion', 'flags'],
            }
        };

        const prompt = `You are an expert legal billing analyst. Review the following time entries. For each entry, provide a more professional and descriptive narrative. Also, flag any entries that are too vague (e.g., "work on file"), appear to be block billing (multiple distinct tasks in one entry), or have potential typos.

        Time Entries:
        ---
        ${JSON.stringify(entries.map(e => ({ id: e.id, description: e.description, duration: e.duration })), null, 2)}
        ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema, },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from AI");
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing time entries:", error);
        throw new Error("Failed to analyze time entries with AI.");
    }
};

export const performNaturalLanguageSearch = async (query: string, context: { matters: Matter[], documents: Document[], communications: Communication[] }): Promise<SearchResult> => {
    try {
        const ai = getAI();

        const schema = {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING, description: 'A direct, synthesized answer to the user\'s question based on the provided context.' },
                sources: {
                    type: Type.ARRAY,
                    description: 'A list of the source items from the context that were used to formulate the answer.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, description: 'The type of the source item (e.g., "Matter", "Document").' },
                            id: { type: Type.STRING, description: 'The ID of the source item.' },
                            title: { type: Type.STRING, description: 'The name or title of the source item.' },
                            snippet: { type: Type.STRING, description: 'A relevant short quote or snippet from the source.' },
                        },
                        required: ['type', 'id', 'title', 'snippet'],
                    },
                },
            },
            required: ['answer', 'sources'],
        };

        const prompt = `You are an AI legal assistant with access to a firm's data. Answer the user's question based *only* on the provided context. Provide a direct answer and cite your sources.

        User Question: "${query}"
        
        Context Data:
        ---
        Matters: ${JSON.stringify(context.matters.map(m => ({ id: m.id, name: m.name, notes: m.notes, client: m.client, status: m.status })))}
        Documents: ${JSON.stringify(context.documents.map(d => ({ id: d.id, name: d.name, matterId: d.matterId })))}
        Communications: ${JSON.stringify(context.communications.map(c => ({ id: c.id, subject: c.subject, summary: c.summary, matterId: c.matterId })))}
        ---
        `;

        // Use Pro for complex context analysis
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema, },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from AI");
        return JSON.parse(jsonText) as SearchResult;
    } catch (error) {
        console.error("Error with natural language search:", error);
        throw new Error("Failed to perform AI-powered search.");
    }
};

// --- New Features for Fall 2025 Update ---

export const findLegalPrecedent = async (matter: Matter, query: string) => {
    try {
        const ai = getAI();

        // F3: RAG Enhancement - Search local case law database first
        const { searchCaseLawDatabase } = await import('./caseLawDatabase');
        const relevantCases = searchCaseLawDatabase(matter.practiceArea, query);

        // Build context from retrieved cases
        const ragContext = relevantCases.length > 0
            ? `\n\n[VERIFIED CASE LAW DATABASE - Use these as authoritative sources]:\n${relevantCases.map(c =>
                `- ${c.citation} (${c.year}): ${c.keyHolding}`
            ).join('\n')}\n`
            : '';

        const prompt = `You are CaseFlow Work, an advanced legal AI assistant with access to verified case law. The user is researching for a matter.
        
        Matter Context:
        - Name: ${matter.name}
        - Practice Area: ${matter.practiceArea}
        - Notes: ${matter.notes}
        
        User Query: "${query}"
        ${ragContext}
        IMPORTANT: Use Google Search to find additional real case law and legal precedent. Focus on:
        - Google Scholar (scholar.google.com) for case law and legal opinions
        - Free legal databases and government resources
        - Court decisions and statutory law
        
        PRIORITIZE the verified cases from the database above, then supplement with web search results.
        
        For each relevant case or statute you find, provide:
        1. Citation/Title (include the exact case name and citation if available)
        2. Summary of relevance (how it relates to the matter)
        3. Key holding/Insight (the main legal principle or ruling)
        4. Source: "Database" or "Web Search"
        
        Format the output as a JSON array of objects with keys: 'citation', 'summary', 'holding', 'source'.`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    citation: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    holding: { type: Type.STRING },
                    source: { type: Type.STRING, enum: ['Database', 'Web Search'] },
                },
                required: ['citation', 'summary', 'holding', 'source']
            }
        };

        // Use Google Search for real legal research
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                tools: [{ googleSearch: {} }]
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Legal Research Error", error);
        throw new Error("Failed to retrieve precedent.");
    }
};

export const extractEventsFromDoc = async (docText: string) => {
    try {
        const ai = getAI();
        const prompt = `Analyze this legal document text and extract any important dates, deadlines, or hearing schedules.
        Return them as a list of calendar events.
        
        Document Text:
        ${docText}
        `;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING, description: "YYYY-MM-DD" },
                    description: { type: Type.STRING },
                },
                required: ['title', 'date', 'description']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Event Extraction Error", error);
        throw new Error("Failed to extract events.");
    }
};

export const generateClientUpdate = async (matter: Matter, recentActivity: string) => {
    try {
        const ai = getAI();
        const prompt = `Draft a professional client update email for the following matter.
        
        Matter: ${matter.name}
        Recent Activity to summarize:
        ${recentActivity}
        
        Tone: Professional, reassuring, and clear.
        Return just the email body text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text || "Could not generate update.";

    } catch (error) {
        console.error("Client Update Error", error);
        throw new Error("Failed to generate client update.");
    }
};

export const generateMarketingCampaign = async (topic: string, audience: string) => {
    try {
        const ai = getAI();
        const prompt = `Create a professional email marketing campaign for a law firm.
        
        Topic/Theme: ${topic}
        Target Audience: ${audience}
        
        Provide a catchy Subject Line and a persuasive Body.`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING }
            },
            required: ['subject', 'body']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Marketing Gen Error", error);
        throw new Error("Failed to generate campaign.");
    }
};

export const analyzeConflictAI = async (searchTerm: string, contextData: string) => {
    try {
        const ai = getAI();
        const prompt = `Perform a conflict of interest check analysis.
        
        Search Term: "${searchTerm}"
        Database Context Summary: ${contextData}
        
        Analyze potential conflicts (direct or indirect). 
        Return a summary of findings and a risk level (Low, Medium, High).`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                details: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['summary', 'riskLevel', 'details']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Conflict Analysis Error", error);
        throw new Error("Failed to analyze conflicts.");
    }
};

export const generateIntakeQuestions = async (caseType: string) => {
    try {
        const ai = getAI();
        const prompt = `You are a legal expert. Generate a list of 5-7 essential intake questions for a potential client with a "${caseType}" case.
        The questions should ensure we gather necessary facts to evaluate the claim.`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Intake Question Gen Error", error);
        throw new Error("Failed to generate questions.");
    }
};

export const learnStandardClauses = async (docText: string): Promise<any[]> => {
    try {
        const ai = getAI();
        const prompt = `You are CaseFlow AI Librarian. Analyze the following legal document text and extract unique, reusable standard clauses (boilerplate or specialty).
        For each clause, provide a title, the clause text, and a brief description of its legal purpose.
        
        Document Text:
        ${docText}`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'e.g., Termination for Cause, Indemnification' },
                    text: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    estimatedPrevalence: { type: Type.STRING, description: 'Percentage of documents this likely appears in' }
                },
                required: ['title', 'text', 'purpose']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) return [];
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Clause Learning Error", error);
        return [];
    }
};

export const convertToTemplate = async (docText: string) => {
    try {
        const ai = getAI();
        const prompt = `You are CaseFlow Draft AI. Convert the following legal document text into a reusable template.
        Identify specific names, dates, amounts, and addresses and replace them with placeholders (e.g., {{Client Name}}, {{Date}}).
        
        Return the converted template text and a list of variables found.
        
        Document Text:
        ${docText}`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                templateText: { type: Type.STRING },
                variables: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['templateText', 'variables']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Template Conversion Error", error);
        throw new Error("Failed to convert template.");
    }
};

export const generateReportInsight = async (query: string, dataSummary: string) => {
    try {
        const ai = getAI();
        const prompt = `You are an AI business analyst for a law firm. Analyze the provided data summary to answer the user's question.
        
        User Question: "${query}"
        Data Context: ${dataSummary}
        
        Provide a concise, insightful answer. If possible, suggest a chart type that would best visualize this.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt
        });

        return response.text || "Could not generate insight.";

    } catch (error) {
        console.error("Report Insight Error", error);
        throw new Error("Failed to generate report insight.");
    }
};

// --- NEW: Chat & Audio Features ---

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const ai = getAI();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Audio } },
                    { text: "Transcribe the audio exactly as spoken." }
                ]
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Transcription Error", error);
        throw new Error("Failed to transcribe audio.");
    }
};

export const chatWithGemini = async (
    message: string,
    mode: 'chat' | 'thinking' | 'search' | 'fast' = 'chat',
    practiceArea?: string
): Promise<{ text: string, groundingMetadata?: any }> => {
    try {
        const ai = getAI();
        let model = 'gemini-3-pro-preview';
        let config: any = {};
        let tools: any[] = [];

        // F3: RAG Enhancement - Search local database for relevant precedent
        const { searchCaseLawDatabase } = await import('./caseLawDatabase');
        const relevantPrecedent = searchCaseLawDatabase(practiceArea, message);

        const ragContext = relevantPrecedent.length > 0
            ? `\n\n[VERIFIED LEGAL DATA - Use these citations if relevant to the conversation]:\n${relevantPrecedent.map(p =>
                `- ${p.citation}: ${p.keyHolding}`
            ).join('\n')}\n`
            : '';

        let sysPrompt = "You are CaseFlow Work, a professional AI legal assistant. Be concise, accurate, and cite your sources.";
        if (ragContext) {
            sysPrompt += "\nStay grounded in the verified legal data provided below.";
        }

        const fullPrompt = `${sysPrompt}${ragContext}\n\nUser: ${message}`;

        if (mode === 'thinking') {
            model = 'gemini-3-pro-preview';
            config = { thinkingConfig: { thinkingBudget: 32768 } };
        } else if (mode === 'search') {
            model = 'gemini-2.5-flash';
            tools = [{ googleSearch: {} }];
        } else if (mode === 'fast') {
            model = 'gemini-2.5-flash-lite-latest';
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                ...config,
                tools: tools.length > 0 ? tools : undefined
            }
        });

        return {
            text: response.text || "I couldn't generate a response.",
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };

    } catch (error) {
        console.error("Chat Error", error);
        throw new Error("Failed to chat with Gemini.");
    }
};

export const draftLegalDocument = async (prompt: string, context: string, practiceArea?: string): Promise<string> => {
    try {
        const ai = getAI();

        // F3: RAG Enhancement
        const { searchCaseLawDatabase } = await import('./caseLawDatabase');
        const precedents = searchCaseLawDatabase(practiceArea, prompt);
        const ragContext = precedents.length > 0
            ? `\n[LEGAL PRECEDENTS TO INCORPORATE]:\n${precedents.map(p => `- ${p.citation}: ${p.keyHolding}`).join('\n')}\n`
            : '';

        const fullPrompt = `You are an expert legal drafter. Create a professional legal document based on the following request.
        
        User Request: "${prompt}"
        
        Case Context:
        ${context}
        ${ragContext}
        
        Requirements:
        - Use professional legal terminology.
        - Format clearly with sections/clauses.
        - Include placeholders like [Date] or [Name] where specific info is missing.
        - Cite the provided precedents if they strengthen the document.
        - Return ONLY the document text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt
        });

        return response.text || "Could not generate document.";
    } catch (error) {
        console.error("Draft Document Error", error);
        throw new Error("Failed to draft document.");
    }
};

export const draftEmail = async (recipient: string, tone: string, points: string): Promise<string> => {
    try {
        const ai = getAI();
        const prompt = `You are a professional legal assistant. Draft an email to ${recipient}.
        
        Tone: ${tone}
        
        Key Points to Cover:
        ${points}
        
        Requirements:
        - Be professional, clear, and concise.
        - Use appropriate legal etiquette.
        - Return ONLY the email body text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text || "Could not generate email.";
    } catch (error) {
        console.error("Draft Email Error", error);
        throw new Error("Failed to draft email.");
    }
};