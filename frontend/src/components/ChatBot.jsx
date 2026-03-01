import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Lightbulb, ChevronDown } from 'lucide-react';
import { chatWithBot } from '../services/taxApi';

// ─── Simple markdown renderer ─────────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table
    if (line.includes('|') && lines[i + 1] && lines[i + 1].includes('---')) {
      const headers = line.split('|').filter(c => c.trim()).map(c => c.trim());
      i += 2; // skip separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-2">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-blue-50">
                {headers.map((h, j) => (
                  <th key={j} className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-gray-200 px-2 py-1 text-gray-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) { i++; continue; }

    // Bullet point
    if (line.startsWith('• ') || line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('• ') || lines[i].startsWith('- '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-none space-y-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start space-x-1 text-xs text-gray-700">
              <span className="text-blue-400 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ol>
      );
      continue;
    }

    // Regular line
    elements.push(
      <p key={i} className="text-xs text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};

// Inline formatting: **bold**, `code`
const inlineFormat = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-blue-700 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/✅/g, '<span class="text-green-600">✅</span>')
    .replace(/❌/g, '<span class="text-red-500">❌</span>')
    .replace(/⭐/g, '<span class="text-yellow-500">⭐</span>')
    .replace(/🎉/g, '<span>🎉</span>')
    .replace(/⚠️/g, '<span class="text-amber-500">⚠️</span>');

// ─── Message bubble ───────────────────────────────────────────────────────────
const Message = ({ msg }) => {
  const isBot = msg.role === 'bot';
  return (
    <div className={`flex items-start space-x-2 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-blue-100' : 'bg-gray-200'}`}>
        {isBot ? <Bot className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-gray-600" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isBot ? 'bg-white border border-gray-100 shadow-sm' : 'bg-blue-600 text-white'}`}>
        {isBot ? (
          renderMarkdown(msg.text)
        ) : (
          <p className="text-xs text-white">{msg.text}</p>
        )}
        <p className={`text-xs mt-1 ${isBot ? 'text-gray-400' : 'text-blue-200'}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-start space-x-2">
    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-blue-600" />
    </div>
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-3 py-2">
      <div className="flex space-x-1 items-center h-4">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ─── Main ChatBot Component ───────────────────────────────────────────────────
const WELCOME_MSG = {
  role: 'bot',
  text: `👋 **Hello! I'm OJ Gnan Tax Assistant.**\n\nI can answer questions about:\n• Indian income tax & deductions\n• Old vs New tax regime\n• ITR filing guidance\n• TDS & refunds\n\nUpload your Form 16 for **personalized answers** about your specific tax situation!`,
  time: '',
};

const ChatBot = ({ taxResult }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasForm16 = !!(taxResult?.taxData && taxResult?.comparisonResult);

  // Update suggestions when Form 16 data changes
  useEffect(() => {
    if (hasForm16) {
      setSuggestions(['How much tax do I owe?', 'Am I eligible for a refund?', 'Which regime is better for me?', 'What are my deductions?']);
    } else {
      setSuggestions(['What is Form 16?', 'Old regime vs new regime?', 'What is Section 80C?', 'How to file ITR?']);
    }
  }, [hasForm16]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: question, time: now }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithBot(
        question,
        taxResult?.taxData || null,
        taxResult?.comparisonResult || null
      );
      const botTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      if (res.success) {
        setMessages(prev => [...prev, { role: 'bot', text: res.data.answer, time: botTime }]);
        if (res.data.suggestions) setSuggestions(res.data.suggestions);
        if (!open) setUnread(u => u + 1);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.', time: botTime }]);
      }
    } catch {
      const botTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.', time: botTime }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, taxResult, open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95"
        title="Tax Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">OJ Gnan Tax Assistant</p>
                <p className="text-blue-200 text-xs">
                  {hasForm16 ? '✅ Form 16 loaded — personalized answers' : 'General tax Q&A'}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div className="px-3 py-2 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-1 mb-1.5">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-gray-500 font-medium">Suggested questions</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-full transition border border-blue-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a tax question..."
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0
                  ${input.trim() && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">
              For general guidance only — not professional tax advice
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;

// Made with Bob