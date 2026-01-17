import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserProfile, ChatMessage, ChatSession } from '../types';
// Fixed imports to match your new storageService
import { getChatSessions, saveChatSessionMetadata, appendMessageToSession } from '../services/storageService'; 
import { getCoachAdviceAIStream } from '../services/geminiService';
import { Mic, MicOff, MessageSquare, Sparkles, Loader2, Send, History, Headphones, Plus, ChevronLeft, Menu } from 'lucide-react';

interface CoachViewProps {
  profile: UserProfile;
}

const CoachView: React.FC<CoachViewProps> = ({ profile }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [mode, setMode] = useState<'voice' | 'chat'>('chat');
  const [isConnecting, setIsConnecting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Load all previous sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      const savedSessions = await getChatSessions();
      if (savedSessions.length > 0) {
        setSessions(savedSessions);
        setActiveSessionId(savedSessions[0].id);
      } else {
        createNewSession();
      }
    };
    loadSessions();
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // 2. Create a new independent session
  const createNewSession = async () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      lastModified: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    await saveChatSessionMetadata(newSession);
    setShowSidebar(false);
  };

  const handleSendText = async () => {
    if (!textInput.trim() || isTyping || !activeSessionId) return;
    const userText = textInput.trim();
    setTextInput('');
    
    const userMsg: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      text: userText, 
      timestamp: new Date().toISOString() 
    };

    // Update UI immediately
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
    ));
    
    setIsTyping(true);

    try {
      const history = activeSession?.messages.slice(-10).map(m => ({ role: m.role, text: m.text })) || [];
      const stream = await getCoachAdviceAIStream(profile, userText, history);
      
      let fullModelText = '';
      const modelMsgId = crypto.randomUUID();
      
      // Initialize model message in UI
      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s;
        const modelMsg: ChatMessage = { id: modelMsgId, role: 'model', text: '', timestamp: new Date().toISOString() };
        return { ...s, messages: [...s.messages, modelMsg] };
      }));

      for await (const chunk of stream) {
        fullModelText += chunk.text;
        setSessions(prev => prev.map(s => {
          if (s.id !== activeSessionId) return s;
          const msgs = s.messages.map(m => m.id === modelMsgId ? { ...m, text: fullModelText } : m);
          return { ...s, messages: msgs };
        }));
      }

      // 3. Persist the pair to this specific session document
      await appendMessageToSession(activeSessionId, userText, fullModelText);

    } catch (e) {
      console.error(e); // Likely 429 error
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col max-w-4xl mx-auto overflow-hidden animate-in fade-in duration-700">
      
      {/* History Sidebar */}
      {showSidebar && <div className="fixed inset-0 bg-black/60 z-[60]" onClick={() => setShowSidebar(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-72 glass z-[70] transition-transform duration-500 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} flex flex-col p-6 border-r border-white/10`}>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-white flex items-center gap-2"><History className="text-indigo-400" /> History</h3>
           <button onClick={() => setShowSidebar(false)} className="p-2 text-slate-500"><ChevronLeft size={18} /></button>
        </div>
        <button onClick={createNewSession} className="flex items-center gap-3 w-full p-4 bg-indigo-600 rounded-2xl text-white font-black text-xs uppercase mb-6">
          <Plus size={18} /> New Conversation
        </button>
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {sessions.map(s => (
            <button key={s.id} onClick={() => { setActiveSessionId(s.id); setShowSidebar(false); }} className={`w-full text-left p-4 rounded-2xl border ${activeSessionId === s.id ? 'bg-white/5 border-indigo-500/30' : 'border-transparent'}`}>
              <span className={`text-xs font-bold line-clamp-1 ${activeSessionId === s.id ? 'text-white' : 'text-slate-500'}`}>{s.title || 'Conversation'}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
        <header className="flex items-center justify-between mb-8">
           <button onClick={() => setShowSidebar(true)} className="p-3 bg-slate-900 rounded-2xl text-slate-400 border border-white/5"><Menu size={20} /></button>
           <h2 className="text-2xl font-black text-white">Zenith AI</h2>
           <div className="bg-slate-900/50 rounded-xl p-1 flex">
              <button onClick={() => setMode('chat')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${mode === 'chat' ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>Chat</button>
              <button onClick={() => setMode('voice')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${mode === 'voice' ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>Voice</button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-6 mb-6 no-scrollbar">
          {activeSession?.messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'glass-card text-slate-200'}`}>
                <p className="text-sm font-medium">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-slate-900/80 border border-white/5 p-2.5 rounded-[2.5rem] flex items-center">
          <input type="text" className="flex-1 bg-transparent border-none text-white px-6" placeholder="Message Zenith..." value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendText()} />
          <button onClick={handleSendText} disabled={isTyping} className="p-4 bg-indigo-600 rounded-[2rem] text-white">
            {isTyping ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachView;