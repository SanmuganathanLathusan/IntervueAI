'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Shell } from '@/components/shell';

import { apiJson } from '@/lib/api';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { icon: '🎯', text: 'How do I use the STAR method effectively?', label: 'STAR Method' },
  { icon: '📄', text: 'Review my resume bullet points and improve them', label: 'Resume Tips' },
  { icon: '💰', text: 'How do I negotiate a higher salary offer?', label: 'Salary Negotiation' },
  { icon: '🧠', text: 'Explain system design interview approach', label: 'System Design' },
  { icon: '😟', text: 'I have interview anxiety. How do I stay calm?', label: 'Confidence' },
  { icon: '🏢', text: 'What questions should I ask the interviewer?', label: 'Questions to Ask' },
];

// Very lightweight markdown-like renderer (no deps needed)
function renderContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="chat-li">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="chat-li chat-oli"><span class="chat-num">$1.</span> $2</li>')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="chat-ul">$1</ul>')
    .replace(/\n\n/g, '</p><p class="chat-p">')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line;
      return line;
    });
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
        isUser
          ? 'bg-navy-900 text-white'
          : 'bg-gradient-to-br from-aqua-500 to-navy-800 text-white'
      }`}>
        {isUser ? 'U' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-navy-900 text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              className="chat-content"
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          )}
        </div>
        <span className="text-[10px] text-slate-400 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-aqua-500 to-navy-800 flex items-center justify-center text-sm">🤖</div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          <span className="w-2 h-2 bg-aqua-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-aqua-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-aqua-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your **IntervueAI Coach** — your personal interview prep expert.

I can help you with:
- **Interview preparation** — practice questions, STAR method, mock answers
- **Resume & CV review** — bullet rewrites and ATS optimization
- **Salary negotiation** — scripts and proven strategies
- **Technical interviews** — DSA, system design, coding concepts
- **Confidence & mindset** — beat interview anxiety

What would you like to work on today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const apiMessages = updatedMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      // Always include the welcome context minus the greeting
      const payload = apiMessages.length === 1
        ? [{ role: 'user', content: userText }]
        : apiMessages;

      const data = await apiJson<{ reply: string }>('/api/chat', {
        method: 'POST',
        body: { messages: payload },
        timeout: 45000, // Longer timeout for AI chat
      });
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your **IntervueAI Coach** — your personal interview prep expert.

I can help you with:
- **Interview preparation** — practice questions, STAR method, mock answers
- **Resume & CV review** — bullet rewrites and ATS optimization
- **Salary negotiation** — scripts and proven strategies
- **Technical interviews** — DSA, system design, coding concepts
- **Confidence & mindset** — beat interview anxiety

What would you like to work on today?`,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <Shell title="AI Coach Chat" subtitle="Advanced AI Assistant — Ask anything about interviews & careers">
      <style>{`
        .chat-content p.chat-p { margin-bottom: 0.5rem; }
        .chat-content ul.chat-ul { margin: 0.4rem 0; padding-left: 0; list-style: none; }
        .chat-content li.chat-li { display: flex; gap: 0.5rem; margin-bottom: 0.3rem; align-items: flex-start; }
        .chat-content li.chat-li::before { content: '•'; color: #06b6d4; font-weight: bold; flex-shrink: 0; }
        .chat-content li.chat-oli::before { display: none; }
        .chat-content .chat-num { color: #06b6d4; font-weight: 700; flex-shrink: 0; }
        .chat-content h2.chat-h2 { font-size: 1rem; font-weight: 700; color: #0B132B; margin: 0.75rem 0 0.4rem; }
        .chat-content h3.chat-h3 { font-size: 0.9rem; font-weight: 700; color: #1C2541; margin: 0.5rem 0 0.3rem; }
        .chat-content code.inline-code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0 0.3rem; font-family: monospace; font-size: 0.8em; color: #0B132B; }
        .chat-content strong { color: #0B132B; }
      `}</style>

      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aqua-500 to-navy-800 flex items-center justify-center text-lg shadow-soft">
              🤖
            </div>
            <div>
              <p className="font-semibold text-navy-900 text-sm">IntervueAI Coach</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs text-slate-500">AI Assistant • Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-navy-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-[#f4f7f6] rounded-2xl p-4 mb-3 scroll-smooth">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {showSuggestions && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => sendMessage(prompt.text)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-left text-xs text-slate-600 hover:border-aqua-500 hover:text-navy-900 hover:bg-aqua-50 transition-all duration-150 shadow-sm hover:shadow group"
              >
                <span className="text-base">{prompt.icon}</span>
                <span className="font-medium leading-tight">{prompt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-3 flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about interviews, resume, salary..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-h-[36px] max-h-[160px] py-1.5 leading-relaxed disabled:opacity-50"
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow active:scale-95"
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Press <kbd className="bg-slate-100 border border-slate-200 rounded px-1">Enter</kbd> to send · <kbd className="bg-slate-100 border border-slate-200 rounded px-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </Shell>
  );
}
