import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Zap, Shield, Brain, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { icon: <Zap size={14} />, text: "What's my best feature to highlight?" },
  { icon: <Shield size={14} />, text: 'Build me a skincare routine' },
  { icon: <Brain size={14} />, text: 'How do I improve my jawline?' },
];

const API = import.meta.env.VITE_API_URL || '';

export default function LynxChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          messages: messages.slice(-10), // Send last 10 for context
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that right now. Try again in a moment! 🔄",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="chat-title">Lynx AI</div>
            <div className="chat-status">
              <span className="chat-status-dot" />
              Online
            </div>
          </div>
        </div>
        {hasMessages && (
          <button className="chat-clear-btn" onClick={clearChat} title="Clear chat">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-messages" ref={scrollRef}>
        {!hasMessages ? (
          /* Empty state */
          <div className="chat-empty">
            <div className="chat-empty-blob">
              <Sparkles size={36} color="rgba(255,255,255,0.9)" />
            </div>
            <div className="chat-empty-title">Hey! I'm Lynx 👋</div>
            <div className="chat-empty-sub">
              Your AI glow-up companion. Ask me anything about skincare, jawline, fitness, or style.
            </div>

            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chat-suggestion"
                  onClick={() => sendMessage(s.text)}
                >
                  <span className="chat-suggestion-icon">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-bubble-avatar">
                    <Sparkles size={12} />
                  </div>
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-bubble-row assistant">
                <div className="chat-bubble-avatar">
                  <Sparkles size={12} />
                </div>
                <div className="chat-bubble assistant">
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Bar */}
      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder="Ask Lynx anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          autoComplete="off"
        />
        <button
          className="chat-send-btn"
          type="submit"
          disabled={!input.trim() || loading}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
