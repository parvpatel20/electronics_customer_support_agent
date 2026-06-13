import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Wrench, CreditCard, Package, Shuffle, Send, Clock, Sparkles, ArrowDown } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';
import { API_BASE } from '../api.js';

const supportAgents = [
  { name: 'Billing specialist', img: 'https://i.pravatar.cc/96?img=12' },
  { name: 'Technical specialist', img: 'https://i.pravatar.cc/96?img=32' },
  { name: 'Returns specialist', img: 'https://i.pravatar.cc/96?img=45' },
  { name: 'Support supervisor', img: 'https://i.pravatar.cc/96?img=68' },
];

const sampleGradients = {
  Technical: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  Billing: 'linear-gradient(135deg, #6366f1, #d946ef)',
  Returns: 'linear-gradient(135deg, #10b981, #06b6d4)',
  Mixed: 'linear-gradient(135deg, #f59e0b, #ef4444)',
};

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

  const samples = useMemo(() => {
    const id = customer?.customer_id;
    const map = {
      'CUST-IN-001': [
        { label: 'Technical', Icon: Wrench, prompt: 'My Wi-Fi 6E router drops when the microwave runs — ORD-IN-001. What should I do?' },
        { label: 'Refund', Icon: CreditCard, prompt: 'Am I eligible for a refund on ORD-IN-001?' },
        { label: 'Track', Icon: Package, prompt: 'Where is my router order ORD-IN-001?' },
        { label: 'Mixed', Icon: Shuffle, prompt: 'Router drops constantly AND honestly I just want my money back ORD-IN-001' },
      ],
      'CUST-IN-002': [
        { label: 'Track', Icon: Package, prompt: 'Where is my soundbar? Order ORD-IN-002. I am in Bengaluru.' },
        { label: 'Billing', Icon: CreditCard, prompt: 'Why is INV-IN-002 still unpaid? I thought my netbanking went through.' },
        { label: 'Technical', Icon: Wrench, prompt: 'How do I pair the soundbar with my TV over HDMI eARC?' },
        { label: 'Return', Icon: Shuffle, prompt: 'The soundbar box looks crushed, I want to return ORD-IN-002.' },
      ],
      'CUST-IN-003': [
        { label: 'Return', Icon: Package, prompt: 'I want to return my earbuds ORD-IN-003, wrong colour came.' },
        { label: 'Technical', Icon: Wrench, prompt: 'Are my TN-200 earbuds compatible with iPhone 15 Pro? Bluetooth codec wise.' },
        { label: 'Refund', Icon: CreditCard, prompt: 'Process a refund for ORD-IN-003, I want my money back.' },
        { label: 'Warranty', Icon: Shuffle, prompt: 'Is ORD-IN-003 still under warranty for the earbuds?' },
      ],
      'CUST-IN-004': [
        { label: 'Billing', Icon: CreditCard, prompt: 'Bank just charged me twice for INV-IN-004? Please fix it.' },
        { label: 'Technical', Icon: Wrench, prompt: 'Will TC-USB-C-HUB-PRO HDMI work with my laptop without USB-C DisplayPort alt mode?' },
        { label: 'Track', Icon: Package, prompt: 'Track my USB-C hub order ORD-IN-004.' },
        { label: 'Dispute', Icon: Shuffle, prompt: 'Open a dispute: INV-IN-004 — bank says duplicate debit.' },
      ],
      'CUST-IN-005': [
        { label: 'RMA', Icon: Package, prompt: 'Any update on my watch return? RMA-IN-SNEHA01.' },
        { label: 'Technical', Icon: Wrench, prompt: 'My Fit V3 watch shows weird gaps in SpO2 during sleep, how do I fix this?' },
        { label: 'Warranty', Icon: CreditCard, prompt: 'Is my watch still under warranty? ORD-IN-005.' },
        { label: 'Refund', Icon: Shuffle, prompt: 'I want a refund AND to return my watch, how does that work?' },
      ],
    };
    return map[id] || [
      { label: 'Technical', Icon: Wrench, prompt: 'I need help with my product.' },
      { label: 'Billing', Icon: CreditCard, prompt: 'I have a billing question.' },
      { label: 'Track', Icon: Package, prompt: 'Where is my order?' },
      { label: 'Returns', Icon: Shuffle, prompt: 'I want to return something.' },
    ];
  }, [customer?.customer_id]);

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
          <div className="stagger-in" style={{ maxWidth: '680px', margin: '48px auto 0', textAlign: 'center' }}>
            <div className="flex flex-col items-center" style={{ marginBottom: '24px' }}>
              <div className="avatar-stack" aria-hidden="true">
                {supportAgents.map((a) => (
                  <img
                    key={a.img}
                    src={a.img}
                    alt=""
                    loading="lazy"
                    title={a.name}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ))}
              </div>
              <span
                className="flex items-center gap-2 text-muted"
                style={{ marginTop: '12px', fontSize: '0.8125rem', fontWeight: 500 }}
              >
                <span className="status-dot" /> Specialist agents online · typically replies in seconds
              </span>
            </div>

            <div
              className="inline-flex items-center gap-1.5"
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary-tint)', border: '1px solid var(--primary-border)',
                color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <Sparkles size={13} />
              One thread · many specialists
            </div>

            <h1 className="font-display" style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.03em' }}>
              Hi {customer?.name?.split(' ')[0] || 'there'},{' '}
              <span className="gradient-text">how can we help?</span>
            </h1>
            <p className="text-muted" style={{ marginTop: '12px', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
              One support thread for your account. Ask about orders, billing, returns, or troubleshooting — we'll route to the right specialist.
            </p>

            <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {samples.map(({ label, Icon, prompt }, i) => (
                <button
                  key={label}
                  type="button"
                  className="card-elevated stagger-in"
                  style={{
                    textAlign: 'left', padding: '16px', cursor: 'pointer',
                    animationDelay: `${i * 80}ms`,
                  }}
                  disabled={streaming || !!hitlPending}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                >
                  <span
                    className="avatar-gradient"
                    style={{
                      background: sampleGradients[label] || 'var(--grad-primary)',
                      width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginTop: '12px' }}>
                    {label}
                  </p>
                  <p className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '4px', lineHeight: 1.5 }}>
                    {prompt.slice(0, 60)}…
                  </p>
                  <div className="flex items-center gap-1" style={{ marginTop: '10px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                    Try it <ArrowDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                  </div>
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
            style={{ maxWidth: '480px', margin: '16px 0', padding: '20px', borderColor: 'var(--warning)' }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
              <span
                className="flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--warning-tint)', color: 'var(--warning)' }}
              >
                <Clock size={15} />
              </span>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
                Pending support team approval
              </p>
            </div>
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

      <div style={{ padding: '12px 16px 16px' }}>
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
              width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0, border: 'none',
              background: canSend ? 'var(--grad-primary)' : 'var(--surface-2)',
              color: canSend ? '#ffffff' : 'var(--text-subtle)',
              cursor: canSend ? 'pointer' : 'default',
              transition: 'all 200ms ease',
              boxShadow: canSend ? 'var(--shadow-glow)' : 'none',
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
