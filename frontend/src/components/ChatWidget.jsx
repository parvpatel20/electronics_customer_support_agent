import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
      { label: 'Technical', color: '#3b82f6', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, prompt: 'My Wi-Fi 6E router drops when the microwave runs — ORD-IN-001. What should I do?' },
      { label: 'Billing', color: '#f97316', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>, prompt: 'Process a full refund for order ORD-IN-004 now. Invoice INV-IN-004 was wrong.' },
      { label: 'Returns', color: '#2dd4bf', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>, prompt: 'Where is my soundbar? Order ORD-IN-002. I am in Bengaluru.' },
      { label: 'Mixed', color: '#a855f7', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" x2="21" y1="20" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" x2="21" y1="15" y2="21"/><line x1="4" x2="9" y1="4" y2="9"/></svg>, prompt: 'Hub HDMI black screen AND invoice INV-IN-004 is wrong.' },
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

  if (!supportLoaded && customer?.customer_id) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center fade-in" style={{ minHeight: 0 }}>
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '16px', fontSize: '0.875rem' }}>
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
        style={{ padding: '24px 16px', maxWidth: '860px', width: '100%', margin: '0 auto' }}
      >
        {showWelcome && (
          <div className="stagger-in" style={{ maxWidth: '640px', margin: '80px auto 0', textAlign: 'center' }}>
            <img src={logo} alt="TechCart" className="mx-auto mb-5" style={{ height: '88px', objectFit: 'contain' }} />
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Hi {customer?.name?.split(' ')[0] || 'there'}, how can we help?
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              One support thread for your account. Ask about orders, billing, returns, or troubleshooting.
            </p>

            <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {samples.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="sidebar-item"
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-default)',
                    cursor: 'pointer',
                  }}
                  disabled={streaming || !!hitlPending}
                  onClick={() => { setInput(s.prompt); textareaRef.current?.focus(); }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px', height: '32px',
                    borderRadius: '8px',
                    background: `${s.color}18`,
                    color: s.color,
                    flexShrink: 0,
                  }}>
                    {s.icon}
                  </span>
                  <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: s.color, marginTop: '8px' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {s.prompt.slice(0, 55)}…
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
          <div className="stagger-in" style={{ maxWidth: '480px', margin: '16px 0', padding: '20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid rgba(249, 115, 22, 0.35)' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Pending support team approval
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              {hitlPending.description}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
        <div className="fade-in" style={{ margin: '0 16px 8px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8125rem', fontWeight: 500, color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--color-border-default)' }}>
        <div
          className="flex items-end gap-3 chat-composer"
          style={{ maxWidth: '860px', margin: '0 auto', background: 'var(--color-surface-2)', borderRadius: '16px', border: '1px solid var(--color-border-default)', padding: '8px 8px 8px 16px', transition: 'border-color 200ms' }}
        >
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              padding: '6px 0',
              minHeight: '24px',
              maxHeight: '160px',
            }}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hitlPending ? 'Use the buttons above to approve or reject…' : 'Type your message...'}
            disabled={streaming || !!hitlPending}
            rows={1}
          />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: input.trim() && !streaming && !hitlPending
                ? 'linear-gradient(135deg, var(--color-tech-orange), #ea580c)'
                : 'var(--color-surface-3)',
              border: 'none',
              cursor: input.trim() && !streaming && !hitlPending ? 'pointer' : 'default',
              color: input.trim() && !streaming && !hitlPending ? 'white' : 'var(--color-text-muted)',
              flexShrink: 0,
            }}
            disabled={streaming || !input.trim() || !!hitlPending}
            onClick={sendMessage}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
          {hitlPending ? 'Approve or reject the pending action to continue' : 'Press Enter to send · Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}
