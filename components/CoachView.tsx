import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserProfile, ChatMessage, ChatSession } from '../types';
import { getChatSessions, saveChatSessions } from '../services/storageService';
import { getCoachAdviceAIStream } from '../services/geminiService';
import { Mic, MicOff, MessageSquare, Sparkles, Loader2, Send, History, BrainCircuit, Headphones, Plus, ChevronLeft, Menu } from 'lucide-react';

interface CoachViewProps {
  profile: UserProfile;
}

const CoachView: React.FC<CoachViewProps> = ({ profile }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [transcription, setTranscription] = useState({ input: '', output: '' });
  const [mode, setMode] = useState<'voice' | 'chat'>('chat');
  const [isConnecting, setIsConnecting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSessions = getChatSessions();
    setSessions(savedSessions);
    if (savedSessions.length > 0) {
      setActiveSessionId(savedSessions[0].id);
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, transcription, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      lastModified: new Date().toISOString()
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    saveChatSessions(updated);
    setActiveSessionId(newSession.id);
    setShowSidebar(false);
  };

  const updateSessionMessages = (sessionId: string, newMessages: ChatMessage[]) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== sessionId) return s;
        // Generate a title based on the first message if it's still "New Conversation"
        let title = s.title;
        if (title === 'New Conversation' && newMessages.length > 0) {
          title = newMessages[0].text.slice(0, 30) + (newMessages[0].text.length > 30 ? '...' : '');
        }
        return { ...s, messages: newMessages, title, lastModified: new Date().toISOString() };
      });
      saveChatSessions(updated);
      return updated;
    });
  };

  const addMessageToActive = (role: 'user' | 'model', text: string) => {
    if (!activeSessionId) return;
    const newMessage: ChatMessage = { id: crypto.randomUUID(), role, text, timestamp: new Date().toISOString() };
    const currentMessages = activeSession?.messages || [];
    updateSessionMessages(activeSessionId, [...currentMessages, newMessage]);
  };

  const handleSendText = async () => {
    if (!textInput.trim() || isTyping || !activeSessionId) return;
    const userText = textInput.trim();
    setTextInput('');
    
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: userText, timestamp: new Date().toISOString() };
    const initialMessages = [...(activeSession?.messages || []), userMsg];
    updateSessionMessages(activeSessionId, initialMessages);
    
    setIsTyping(true);

    try {
      const history = initialMessages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      const stream = await getCoachAdviceAIStream(profile, userText, history.slice(0, -1));
      
      let fullModelText = '';
      const modelMsgId = crypto.randomUUID();
      
      // Initialize an empty model message to stream into
      const modelMsg: ChatMessage = { id: modelMsgId, role: 'model', text: '', timestamp: new Date().toISOString() };
      updateSessionMessages(activeSessionId, [...initialMessages, modelMsg]);

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullModelText += text;
          // Update the specific model message in state
          setSessions(prev => {
            const updated = prev.map(s => {
              if (s.id !== activeSessionId) return s;
              const msgs = s.messages.map(m => m.id === modelMsgId ? { ...m, text: fullModelText } : m);
              return { ...s, messages: msgs };
            });
            return updated;
          });
        }
      }
      // Save the final state to local storage
      saveChatSessions(sessions);
    } catch (e) {
      console.error(e);
      addMessageToActive('model', "Sorry, I hit a snag. Can you repeat that?");
    } finally {
      setIsTyping(false);
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    setShowSidebar(false);
    setMode('chat');
  };

  // Live Audio Helpers
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const stopLive = () => {
    setIsLive(false);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
  };

  const startLive = async () => {
    setIsConnecting(true);
    setMode('voice');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(session => session.sendRealtimeInput({ 
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => ({ ...prev, input: prev.input + message.serverContent?.inputTranscription?.text }));
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => ({ ...prev, output: prev.output + message.serverContent?.outputTranscription?.text }));
            }
            if (message.serverContent?.turnComplete) {
              setTranscription(curr => {
                if (curr.input && curr.output) {
                   addMessageToActive('user', curr.input);
                   addMessageToActive('model', curr.output);
                }
                return { input: '', output: '' };
              });
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopLive(),
          onerror: (e) => { console.error(e); stopLive(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are Zenith, an expert AI fitness coach. Talk humanly. Context: Goal ${profile.goal}, Level ${profile.level}, Format ${profile.currentFormat}.`
        }
      });
    } catch (e) {
      console.error(e);
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col max-w-4xl mx-auto overflow-hidden animate-in fade-in duration-700">
      
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* History Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 glass z-[70] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showSidebar ? 'translate-x-0' : '-translate-x-full'} flex flex-col p-6 shadow-2xl rounded-r-[3rem] border-r border-white/10`}>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-white flex items-center gap-2"><History className="text-indigo-400" /> History</h3>
           <button onClick={() => setShowSidebar(false)} className="p-2 bg-slate-900 rounded-xl text-slate-500"><ChevronLeft size={18} /></button>
        </div>
        
        <button 
          onClick={createNewSession}
          className="flex items-center gap-3 w-full p-4 bg-indigo-600 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all mb-6"
        >
          <Plus size={18} /> New Conversation
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {sessions.map(s => (
            <button 
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all border ${
                activeSessionId === s.id 
                ? 'bg-white/5 border-indigo-500/30' 
                : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                 <MessageSquare size={14} className={activeSessionId === s.id ? 'text-indigo-400' : 'text-slate-600'} />
                 <span className={`text-xs font-bold line-clamp-1 ${activeSessionId === s.id ? 'text-white' : 'text-slate-500'}`}>{s.title}</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 block mt-2">{new Date(s.lastModified).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
        <header className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSidebar(true)}
                className="p-3 bg-slate-900/50 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-2xl font-black text-white hidden sm:block">Zenith AI</h2>
           </div>

           <div className="bg-slate-900/50 backdrop-blur rounded-[1.2rem] p-1 flex border border-white/5">
              <button onClick={() => setMode('chat')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'chat' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Chat</button>
              <button onClick={() => setMode('voice')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'voice' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Voice</button>
           </div>
        </header>

        {mode === 'voice' ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            <div className="relative">
              <div className={`absolute -inset-20 bg-indigo-500/20 rounded-full blur-[80px] transition-opacity duration-1000 ${isLive ? 'opacity-100 scale-150 animate-pulse' : 'opacity-0 scale-50'}`}></div>
              <button 
                onClick={isLive ? stopLive : startLive} 
                disabled={isConnecting} 
                className={`relative w-48 h-48 rounded-[3.5rem] flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isLive ? 'bg-red-500 shadow-[0_0_80px_rgba(239,68,68,0.4)] rotate-90 scale-105' : 'bg-indigo-600 shadow-[0_20px_60px_rgba(79,70,229,0.3)] hover:scale-110 active:scale-95'
                }`}
              >
                {isConnecting ? <Loader2 className="w-16 h-16 text-white animate-spin" /> : isLive ? <MicOff className="w-16 h-16 text-white" /> : <Headphones className="w-16 h-16 text-white" />}
              </button>
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">{isLive ? 'Link Active' : 'Voice Core'}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed italic">"Ready to push the limits?"</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 scroll-smooth no-scrollbar">
              {activeSession?.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                   <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                      <Sparkles size={32} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-white mb-2">Initialize Session</h4>
                      <p className="text-slate-500 text-sm font-medium max-w-xs leading-relaxed uppercase tracking-widest text-[10px]">What are we building today?</p>
                   </div>
                </div>
              )}
              {activeSession?.messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'glass-card text-slate-200 rounded-tl-none border-indigo-500/10'
                  }`}>
                    <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{m.text}</p>
                    <span className={`text-[8px] font-black uppercase tracking-tighter block mt-2 opacity-50 ${m.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && activeSession?.messages[activeSession.messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="glass-card px-5 py-4 rounded-[1.8rem] rounded-tl-none flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 p-2.5 rounded-[2.5rem] shadow-2xl flex items-center group focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
              <button 
                onClick={createNewSession}
                className="p-3 text-slate-500 hover:text-white transition-colors"
                title="New Chat"
              >
                <Plus size={24} />
              </button>
              <input 
                type="text" 
                className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4 py-3 font-medium placeholder-slate-600" 
                placeholder="Message Zenith..." 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              />
              <button 
                onClick={handleSendText} 
                className="p-4 bg-indigo-600 rounded-[2rem] text-white shadow-lg shadow-indigo-900/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95" 
                disabled={!textInput.trim() || isTyping}
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachView;