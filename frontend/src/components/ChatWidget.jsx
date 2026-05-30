import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Wrench, CreditCard, Package, Shuffle, Send, Clock } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';
import { API_BASE } from '../api.js';
import logo from '../assets/techcart-logo.png';

function parseSseBlocks(buffer) {
  const blocks = buffer.split('\n\n');
  return [blocks.slice(0, -1), blocks.at(-1) || ''];
}

function parseSseBlock(block) {
  const lines = block.split('\n');
  const event = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
  const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();
  try {
    return { event, data: dataLine ? JSON.parse(dataLine) : {} };
  } catch {
    return { event, data: {} };
  }
}

function mapStoredMessages(rows) {
  return (rows || []).map((m) => ({
    role: m.role,
    content: m.content,
    agentName: m.agent_name || 'assistant',
    timestamp: m.created_at
      ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
  }));
}

export default function ChatWidget({ customer }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [hitlPending, setHitlPending] = useState(null);
  const [supportLoaded, setSupportLoaded] = useState(false);
  const viewportRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingAgentRef = useRef('triage');

  const samples = useMemo(
    () => [
      { label: 'Technical', color: 'var(--info)', Icon: Wrench, prompt: 'My Wi-Fi 6E router drops when the microwave runs — ORD-IN-001. What should I do?' },
      { label: 'Billing', color: 'var(--primary)', Icon: CreditCard, prompt: 'Process a full refund for order ORD-IN-004 now. Invoice INV-IN-004 was wrong.' },
      { label: 'Returns', color: 'var(--accent)', Icon: Package, prompt: 'Where is my soundbar? Order ORD-IN-002. I am in Bengaluru.' },
      { label: 'Mixed', color: 'var(--text-muted)', Icon: Shuffle, prompt: 'Hub HDMI black screen AND invoice INV-IN-004 is wrong.' },
    ],
    [],
  );

  useEffect(() => {
    if (!customer?.customer_id) return;

    let isSubscribed = true;
    async function loadSupportThread() {
      try {
        const response = await fetch(`${API_BASE}/customers/${customer.customer_id}/support`);
        if (!response.ok || !isSubscribed) return;
        const data = await response.json();
        setMessages(mapStoredMessages(data.messages));
        if (data.hitl_pending) {
          setHitlPending({
            description: data.hitl_pending.description,
            options: data.hitl_pending.options || ['approve', 'reject'],
          });
        }
      } catch {
        // Non-blocking
      } finally {
        if (isSubscribed) setSupportLoaded(true);
      }
    }

    loadSupportThread();
    return () => { isSubscribed = false; };
  }, [customer?.customer_id]);

  useEffect(() => {
    if (!hitlPending || !customer?.customer_id) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/customers/${customer.customer_id}/support`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.hitl_pending) {
          setMessages(mapStoredMessages(data.messages));
          setHitlPending(null);
        }
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [hitlPending, customer?.customer_id]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming, hitlPending]);

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [input, adjustTextarea]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!streaming && input.trim() && !hitlPending) {
        sendMessage();
      }
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || hitlPending) return;

    setError('');
    setInput('');
    setStreaming(true);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    pendingAgentRef.current = 'triage';
    setMessages((current) => [
      ...current,
      { role: 'user', content: text, timestamp: now },
    ]);

    let response;
    try {
      response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customer.customer_id, message: text }),
      });
    } catch {
      setStreaming(false);
      setError('Cannot reach the support backend. Please check your connection and try again.');
      setMessages((current) => current.slice(0, -1));
      return;
    }

    if (!response.ok || !response.body) {
      setStreaming(false);
      setError(`Request failed with HTTP ${response.status}. Please try again.`);
      setMessages((current) => current.slice(0, -1));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let sawHitl = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const [blocks, rest] = parseSseBlocks(buffer);
      buffer = rest;

      for (const block of blocks) {
        const parsed = parseSseBlock(block);

        if (parsed.event === 'agent_name') {
          const name = parsed.data.agent_name;
          pendingAgentRef.current = name;
          setMessages((current) => {
            const last = current[current.length - 1];
            if (last?.role === 'assistant') {
              const copy = [...current];
              copy[copy.length - 1] = { ...last, agentName: name };
              return copy;
            }
            return current;
          });
        }

        if (parsed.event === 'content') {
          const agentName = parsed.data.agent_name || pendingAgentRef.current;
          const chunk = parsed.data.content || '';
          setMessages((current) => {
            const last = current[current.length - 1];
            if (last?.role === 'assistant') {
              const copy = [...current];
              copy[copy.length - 1] = { ...last, agentName, content: `${last.content}${chunk}` };
              return copy;
            }
            const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return [...current, { role: 'assistant', content: chunk, agentName, timestamp: ts }];
          });
        }

        if (parsed.event === 'hitl_approval') {
          sawHitl = true;
          setHitlPending({
            description: parsed.data.description || 'This action requires your approval.',
            options: parsed.data.options || ['approve', 'reject'],
          });
        }

        if (parsed.event === 'error') {
          setError(parsed.data.message || 'An error occurred during processing.');
        }
      }
    }

    setStreaming(false);

    if (!sawHitl) {
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last?.role === 'assistant' && !String(last.content || '').trim()) {
          return current.slice(0, -1);
        }
        return current;
      });
    }
  }

  const showWelcome = supportLoaded && messages.length === 0 && !streaming;
  const canSend = input.trim() && !streaming && !hitlPending;

  if (!supportLoaded && customer?.customer_id) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center fade-in" style={{ minHeight: 0 }}>
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="text-subtle" style={{ marginTop: '16px', fontSize: '0.875rem' }}>
          Loading your support thread…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 fade-in" style={{ minHeight: 0 }}>
      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 16px', maxWidth: 'var(--chat-max)', width: '100%', margin: '0 auto' }}
      >
        {showWelcome && (
          <div className="stagger-in" style={{ maxWidth: '600px', margin: '64px auto 0', textAlign: 'center' }}>
            <img src={logo} alt="TechCart" className="mx-auto" style={{ height: '64px', objectFit: 'contain', marginBottom: '20px' }} />
            <h1 className="h2">
              Hi {customer?.name?.split(' ')[0] || 'there'}, how can we help?
            </h1>
            <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              One support thread for your account. Ask about orders, billing, returns, or troubleshooting.
            </p>

            <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {samples.map(({ label, color, Icon, prompt }) => (
                <button
                  key={label}
                  type="button"
                  className="card-inset card-hover"
                  style={{ textAlign: 'left', padding: '14px 16px', background: 'var(--surface)', cursor: 'pointer' }}
                  disabled={streaming || !!hitlPending}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                >
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-2)', color, flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)', marginTop: '10px' }}>
                    {label}
                  </p>
                  <p className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '4px', lineHeight: 1.45 }}>
                    {prompt.slice(0, 55)}…
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={`msg-${index}-${message.timestamp}`} message={message} />
        ))}

        {hitlPending && (
          <div
            className="stagger-in card"
            style={{ maxWidth: '480px', margin: '16px 0', padding: '18px', borderColor: 'var(--primary-border)' }}
          >
            <p className="flex items-center gap-2" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: 'var(--warning)' }} />
              Pending support team approval
            </p>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '12px', lineHeight: 1.5 }}>
              {hitlPending.description}
            </p>
            <p className="text-subtle flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              Waiting for our support team to review. You'll see the result here automatically.
            </p>
          </div>
        )}

        {streaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div style={{ margin: '12px 0' }}>
            <div className="typing-indicator stagger-in">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="fade-in"
          role="alert"
          style={{
            margin: '0 auto 8px', maxWidth: 'var(--chat-max)', width: '100%', padding: '10px 14px',
            borderRadius: 'var(--radius-md)', background: 'var(--error-tint)', border: '1px solid var(--error)',
            fontSize: '0.8125rem', fontWeight: 500, color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div className="composer" style={{ maxWidth: 'var(--chat-max)', margin: '0 auto' }}>
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none"
            style={{
              background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)',
              fontSize: '0.9375rem', lineHeight: 1.5, padding: '8px 0', minHeight: '24px', maxHeight: '160px',
            }}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hitlPending ? 'Use the buttons above to approve or reject…' : 'Type your message…'}
            disabled={streaming || !!hitlPending}
            rows={1}
          />
          <button
            className="flex items-center justify-center"
            style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0, border: 'none',
              background: canSend ? 'var(--primary)' : 'var(--surface-2)',
              color: canSend ? 'var(--primary-fg)' : 'var(--text-subtle)',
              cursor: canSend ? 'pointer' : 'default',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
            disabled={streaming || !input.trim() || !!hitlPending}
            onClick={sendMessage}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-subtle" style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.6875rem' }}>
          {hitlPending ? 'Approve or reject the pending action to continue' : 'Press Enter to send · Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}
