import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sprout, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface GeminiHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// ─── Utility: parse markdown-lite formatting ─────────────────────────────────

function formatBotMessage(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-3 mb-1">{line.slice(3)}</h3>;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-semibold text-slate-800 dark:text-slate-100 mt-1">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} className="ml-4 text-slate-700 dark:text-slate-300 list-disc leading-relaxed">
          {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
        </li>
      );
    }
    if (line.startsWith('* ')) {
      return (
        <li key={i} className="ml-4 text-slate-700 dark:text-slate-300 list-disc leading-relaxed">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === '') {
      return <br key={i} />;
    }
    // Bold inline **text**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-slate-900 dark:text-slate-100">{part}</strong> : part
        )}
      </p>
    );
  });
}

// ─── Suggested Questions ─────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "What is PM-Kisan and how do I apply?",
  "What crop insurance schemes are available for wheat farmers?",
  "How can I get a Kisan Credit Card?",
  "What are the eligibility criteria for soil health card?",
  "Tell me about PMFBY crop insurance scheme",
  "How to apply for irrigation subsidy in my state?",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FarmerAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `🌾 **Namaste! I'm your AgriSense Farmer Assistant.**\n\nI can help you with:\n- Government agricultural schemes & subsidies\n- PM-Kisan, PMFBY crop insurance details\n- Kisan Credit Card & loan schemes\n- Irrigation & soil health programs\n- Eligibility criteria & application steps\n\nHow can I help you today? You can also use the suggestions below to get started.`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiHistory, setGeminiHistory] = useState<GeminiHistoryItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('farmer-chat', {
        message: messageText,
        history: geminiHistory,
      });

      const reply = res.data.reply;

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);

      // Update Gemini conversation history for multi-turn
      setGeminiHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: messageText }] },
        { role: 'model', parts: [{ text: reply }] },
      ]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to get a response. Please try again.';
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: detail,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `🌾 **Namaste! I'm your AgriSense Farmer Assistant.**\n\nI can help you with:\n- Government agricultural schemes & subsidies\n- PM-Kisan, PMFBY crop insurance details\n- Kisan Credit Card & loan schemes\n- Irrigation & soil health programs\n- Eligibility criteria & application steps\n\nHow can I help you today? You can also use the suggestions below to get started.`,
      timestamp: new Date(),
    }]);
    setGeminiHistory([]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Farmer Scheme Assistant</h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Powered by Groq AI
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ${
                msg.role === 'assistant'
                  ? msg.isError
                    ? 'bg-red-500'
                    : 'bg-emerald-500'
                  : 'bg-slate-700 dark:bg-slate-600'
              }`}>
                {msg.role === 'assistant'
                  ? (msg.isError ? <AlertCircle className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />)
                  : <User className="h-4 w-4 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-sm'
                  : msg.isError
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-tl-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="text-sm space-y-1">
                    {formatBotMessage(msg.content)}
                  </div>
                )}
                <p className={`text-[10px] mt-1.5 ${
                  msg.role === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions (shown only when only welcome message exists) */}
      {messages.length === 1 && !loading && (
        <div className="mb-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-2 uppercase tracking-wider">Quick Questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="flex gap-3 items-end bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm focus-within:border-emerald-500 dark:focus-within:border-emerald-600 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any government scheme, subsidy, or farming program..."
            rows={1}
            maxLength={2000}
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none leading-relaxed min-h-[24px] max-h-32 overflow-y-auto disabled:opacity-50"
            style={{ scrollbarWidth: 'none' }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin text-white" />
              : <Send className="h-4 w-4 text-white" />
            }
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center mt-2">
          Press Enter to send · Shift+Enter for new line · AI may make mistakes, verify important information
        </p>
      </div>
    </div>
  );
}
