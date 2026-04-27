import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Shield, Brain, RotateCcw } from 'lucide-react';
import { LynxBubbleIcon } from '../components/TabBar';
import { supabase, getScanHistory, getScanCount } from '../lib/api';
import { pushField } from '../lib/sync';
import type { FaceScores } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LynxChatProps {
  scores: FaceScores | null;
}

const SUGGESTIONS = [
  { icon: <Zap size={14} />, text: "Based on my scores, what should I focus on?" },
  { icon: <Shield size={14} />, text: 'Build me a skincare routine' },
  { icon: <Brain size={14} />, text: 'How do I improve my weakest area?' },
];

const API = import.meta.env.VITE_API_URL || '';
const LS_CHAT = 'lynx_chat_history';

// Load persisted chat
function loadChat(): Message[] {
  try {
    const raw = localStorage.getItem(LS_CHAT);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Build user context string from all available data
async function buildUserContext(scores: FaceScores | null): Promise<string> {
  const parts: string[] = [];

  // User identity
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0];
      if (name) parts.push(`User's name: ${name}`);
    }
  } catch {}

  // Latest face scan scores
  if (scores) {
    parts.push(`Latest Face Scan Results:
- Jawline: ${scores.jawline}/100
- Skin Quality: ${scores.skin_quality}/100
- Eyes: ${scores.eyes}/100
- Lips: ${scores.lips}/100
- Facial Symmetry: ${scores.facial_symmetry}/100
- Hair Quality: ${scores.hair_quality}/100
- Overall Score: ${scores.overall}/100
- Potential Improvement: +${scores.potential} points`);

    if (scores.tips?.length) {
      parts.push(`AI Tips from scan: ${scores.tips.join('; ')}`);
    }

    // Identify weak and strong areas
    const metrics = [
      { name: 'Jawline', val: scores.jawline },
      { name: 'Skin Quality', val: scores.skin_quality },
      { name: 'Eyes', val: scores.eyes },
      { name: 'Lips', val: scores.lips },
      { name: 'Facial Symmetry', val: scores.facial_symmetry },
      { name: 'Hair Quality', val: scores.hair_quality },
    ];
    const sorted = [...metrics].sort((a, b) => a.val - b.val);
    const weakest = sorted.slice(0, 2).map(m => `${m.name} (${m.val})`);
    const strongest = sorted.slice(-2).map(m => `${m.name} (${m.val})`);
    parts.push(`Weakest areas: ${weakest.join(', ')}`);
    parts.push(`Strongest areas: ${strongest.join(', ')}`);
  } else {
    parts.push('User has NOT done a face scan yet.');
  }

  // Scan history stats
  const scanCount = getScanCount();
  parts.push(`Total scans completed: ${scanCount}`);

  if (scanCount > 1) {
    const history = getScanHistory();
    const first = history[history.length - 1];
    const latest = history[0];
    if (first && latest && first.scores && latest.scores) {
      const diff = latest.scores.overall - first.scores.overall;
      parts.push(`Progress since first scan: ${diff > 0 ? '+' : ''}${diff} points overall`);
      parts.push(`First scan date: ${new Date(first.timestamp).toLocaleDateString()}`);
      parts.push(`Latest scan date: ${new Date(latest.timestamp).toLocaleDateString()}`);
    }
  }

  return parts.join('\n');
}

export default function LynxChat({ scores }: LynxChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => loadChat());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build user context on mount / when scores change
  useEffect(() => {
    buildUserContext(scores).then(setUserContext);
  }, [scores]);

  // Persist chat to localStorage + cloud
  useEffect(() => {
    if (messages.length > 0) {
      const trimmed = messages.slice(-50);
      localStorage.setItem(LS_CHAT, JSON.stringify(trimmed));
      pushField('chat_history', trimmed).catch(() => {});
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, typingText]);

  // Typewriter effect
  const typewriterRef = useRef<number | null>(null);

  const startTypewriter = (fullText: string) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;

    const tick = () => {
      i++;
      setTypingText(fullText.slice(0, i));
      if (i < fullText.length) {
        // Variable speed: faster for spaces/punctuation
        const ch = fullText[i];
        const delay = ch === ' ' ? 8 : ch === '\n' ? 30 : 18;
        typewriterRef.current = window.setTimeout(tick, delay);
      } else {
        // Done typing — commit to messages
        setIsTyping(false);
        setTypingText('');
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
      }
    };
    tick();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, []);

  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading || isTyping) return;

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
          messages: messages.slice(-10),
          userContext: userContext,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setLoading(false);
      startTypewriter(data.reply);
    } catch {
      setLoading(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that right now. Try again in a moment! 🔄",
      }]);
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
    setTypingText('');
    setIsTyping(false);
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    localStorage.removeItem(LS_CHAT);
    pushField('chat_history', []).catch(() => {});
  };

  const hasMessages = messages.length > 0 || isTyping;

  // Helper to render message text with line breaks
  const renderText = (text: string) =>
    text.split('\n').map((line, j, arr) => (
      <span key={j}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="lynx-icon-sm">
            <LynxBubbleIcon size={22} />
          </div>
          <div>
            <div className="chat-title">Lynx AI</div>
            <div className="chat-status">
              <span className="chat-status-dot" />
              {scores ? `Score: ${scores.overall}` : 'Online'}
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
            <div className="lynx-icon-lg">
              <LynxBubbleIcon size={48} />
            </div>
            <div className="chat-empty-title">Hey! I'm Lynx 👋</div>
            <div className="chat-empty-sub">
              {scores
                ? `I can see your scan data (Score: ${scores.overall}). Ask me anything and I'll give you personalized advice!`
                : 'Your AI glow-up companion. Do a face scan first for personalized advice, or ask me anything!'}
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
                    <LynxBubbleIcon size={16} />
                  </div>
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  {renderText(msg.content)}
                </div>
              </div>
            ))}

            {/* Typewriter — current reply being typed */}
            {isTyping && typingText && (
              <div className="chat-bubble-row assistant">
                <div className="chat-bubble-avatar">
                  <LynxBubbleIcon size={16} />
                </div>
                <div className="chat-bubble assistant">
                  {renderText(typingText)}
                  <span className="typewriter-cursor" />
                </div>
              </div>
            )}

            {/* Typing dots — waiting for API response */}
            {loading && (
              <div className="chat-bubble-row assistant">
                <div className="chat-bubble-avatar">
                    <LynxBubbleIcon size={16} />
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
