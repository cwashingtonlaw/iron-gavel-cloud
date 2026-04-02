import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SparklesIcon, XMarkIcon, UserCircleIcon, ComputerDesktopIcon, ClipboardDocumentListIcon, EnvelopeIcon } from './icons';
import { chatWithGemini, transcribeAudio } from '../services/geminiService';
import { useStore } from '../store/useStore';
import { searchCaseLawDatabase } from '../services/caseLawDatabase';

// Microphone Icon (Simple SVG)
const MicrophoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
);

// Stop Icon
const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
    </svg>
);

// Paper Airplane / Send Icon
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    groundingChunks?: any[];
    action?: {
        type: 'create_task' | 'draft_email';
        data: any;
    };
}

const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: 'Welcome to CaseFlow Work. I am your Gemini-powered legal assistant. How can I assist you with your matters today?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [mode, setMode] = useState<'chat' | 'thinking' | 'search' | 'fast'>('chat');
    const [ragActive, setRagActive] = useState(false);

    // Context
    const location = useLocation();
    const { matters } = useStore();

    // Watch for location changes to update RAG status
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        if (pathParts[1] === 'matters' && pathParts[2]) {
            const matterId = pathParts[2];
            const currentMatter = matters.find(m => m.id === matterId);
            if (currentMatter) {
                const precedents = searchCaseLawDatabase(currentMatter.practiceArea);
                setRagActive(precedents.length > 0);
            }
        } else {
            setRagActive(false);
        }
    }, [location.pathname, matters]);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Context Injection
            let contextPrompt = "";
            let practiceAreaContext = "";
            const pathParts = location.pathname.split('/');
            if (pathParts[1] === 'matters' && pathParts[2]) {
                const matterId = pathParts[2];
                const currentMatter = matters.find(m => m.id === matterId);
                if (currentMatter) {
                    practiceAreaContext = currentMatter.practiceArea || "";
                    contextPrompt = `\n[Context: User is viewing matter "${currentMatter.name}" (ID: ${currentMatter.id}). Practice Area: ${currentMatter.practiceArea}. Notes: ${currentMatter.notes}]`;
                }
            }

            // Action Instructions
            const actionInstructions = `\n[System: Respond concisely. If requested to create a task/draft email, include a JSON block: \`\`\`json { "action": "create_task" | "draft_email", "data": { ... } } \`\`\`]`;

            const fullPrompt = input + contextPrompt + actionInstructions;

            const response = await chatWithGemini(fullPrompt, mode, practiceAreaContext);

            // Parse Action
            let actionData = undefined;
            let cleanText = response.text;
            const jsonMatch = response.text.match(/```json\s*({[\s\S]*?})\s*```/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    if (parsed.action) {
                        actionData = parsed;
                        cleanText = response.text.replace(jsonMatch[0], '').trim();
                    }
                } catch (e) {
                    console.error("Failed to parse action JSON", e);
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: cleanText,
                groundingChunks: response.groundingMetadata?.groundingChunks,
                action: actionData
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "Sorry, I encountered an error processing your request." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64Audio = (reader.result as string).split(',')[1];
                    setIsTyping(true);
                    try {
                        const text = await transcribeAudio(base64Audio, 'audio/webm');
                        setInput(text);
                    } catch (err) {
                        console.error("Transcription failed", err);
                    } finally {
                        setIsTyping(false);
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 border border-white/20 group"
            >
                {isOpen ? <XMarkIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[400px] h-[650px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="bg-slate-900 px-6 py-5 text-white flex flex-col gap-1 shadow-md">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="bg-blue-500/20 p-1.5 rounded-lg mr-2 border border-blue-500/30">
                                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                                </div>
                                <h3 className="font-bold text-sm tracking-tight text-white">Gemini Pro Assistant</h3>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as any)}
                                    className="bg-slate-800 text-[10px] font-bold uppercase tracking-widest rounded-lg border-none text-blue-400 px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                                >
                                    <option value="chat">Standard</option>
                                    <option value="thinking">Thoughtful</option>
                                    <option value="search">Live Web</option>
                                    <option value="fast">Lite</option>
                                </select>
                            </div>
                        </div>
                        {ragActive && (
                            <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Grounded: Firm Precedents Active</span>
                            </div>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-sm transition-all duration-300 ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/10'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grounding Sources</p>
                                            <ul className="space-y-1.5">
                                                {msg.groundingChunks.map((chunk, idx) => chunk.web?.uri && (
                                                    <li key={idx} className="flex items-center gap-2 group">
                                                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                                                        <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors block truncate max-w-[200px] font-medium">
                                                            {chunk.web.title || chunk.web.uri}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {msg.action && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm animate-in zoom-in-95">
                                            <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Gemini Action</p>
                                            {msg.action.type === 'create_task' && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="text-[11px] text-slate-600 font-bold truncate">
                                                        Task: {msg.action.data.description || 'New Assignment'}
                                                    </div>
                                                    <button className="shrink-0 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                                                        Execute
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                    <div className="flex space-x-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.15s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-5 bg-white border-t border-slate-100">
                        <div className="relative flex items-center bg-slate-100 rounded-2xl p-1 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:border-slate-200 border border-transparent">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isRecording ? "I'm listening..." : "Ask anything about your matters..."}
                                className="w-full pl-4 pr-24 py-3 bg-transparent border-none rounded-xl text-sm outline-none resize-none h-12 max-h-32 disabled:opacity-50"
                                disabled={isRecording || isTyping}
                            />
                            <div className="absolute right-2 flex items-center gap-1">
                                <button
                                    onClick={toggleRecording}
                                    className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                >
                                    {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isRecording}
                                    className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:scale-95 transition-all shadow-lg shadow-blue-600/20"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbot;