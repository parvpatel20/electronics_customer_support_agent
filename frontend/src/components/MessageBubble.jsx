import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CreditCard, Wrench, RotateCcw, UserCog, Shuffle, Headset, Bot,
} from 'lucide-react';

const agentLabels = {
  billing:    { label: 'Billing',     color: 'var(--primary)', Icon: CreditCard },
  technical:  { label: 'Technical',   color: 'var(--info)',    Icon: Wrench },
  returns:    { label: 'Returns',     color: 'var(--accent)',  Icon: RotateCcw },
  supervisor: { label: 'Supervisor',  color: 'var(--text-muted)', Icon: UserCog },
  triage:     { label: 'Routing',     color: 'var(--text-subtle)', Icon: Shuffle },
  human:      { label: 'Human Agent', color: 'var(--success)', Icon: Headset },
};

const mdComponents = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 10px', lineHeight: 1.65, fontSize: '0.9375rem' }}>{children}</p>
  ),
  h1: ({ children }) => (
    <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '16px 0 8px', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '14px 0 6px', color: 'var(--text)' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '12px 0 4px', color: 'var(--text)' }}>{children}</h3>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '6px 0 10px', paddingLeft: '20px', listStyleType: 'disc' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '6px 0 10px', paddingLeft: '20px', listStyleType: 'decimal' }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ margin: '3px 0', lineHeight: 1.6, fontSize: '0.9375rem' }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{children}</em>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="text-mono" style={{
        fontSize: '0.8125rem',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--primary-tint)',
        color: 'var(--primary)',
        wordBreak: 'break-all',
      }}>{children}</code>
    ) : (
      <code className="text-mono" style={{ fontSize: '0.8125rem' }}>{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="text-mono" style={{
      margin: '10px 0',
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      overflowX: 'auto',
      fontSize: '0.8125rem',
      lineHeight: 1.6,
      color: 'var(--text)',
    }}>{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: '8px 0',
      padding: '8px 14px',
      borderLeft: '3px solid var(--primary)',
      background: 'var(--primary-tint)',
      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
    }}>{children}</blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '10px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ background: 'var(--surface-2)' }}>{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th style={{
      padding: '8px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.6875rem',
      textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap',
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ padding: '8px 14px', color: 'var(--text)', fontSize: '0.875rem', verticalAlign: 'top' }}>{children}</td>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{children}</a>
  ),
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const agent = agentLabels[message.agentName] || { label: message.agentName || 'Assistant', color: 'var(--text-muted)', Icon: Bot };
  const AgentIcon = agent.Icon;

  return (
    <div
      className={`stagger-in flex ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ marginBottom: '16px', alignItems: 'flex-end', gap: '8px' }}
    >
      {!isUser && (
        <div
          style={{
            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: agent.color, boxShadow: 'var(--shadow-sm)',
          }}
        >
          <AgentIcon size={15} />
        </div>
      )}
      <div className={isUser ? 'msg-user' : 'msg-assistant'} style={{ maxWidth: '82%', padding: '12px 16px' }}>
        {!isUser && (
          <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
            <span
              className="badge"
              style={{
                background: 'transparent', color: agent.color,
                borderColor: 'transparent', paddingLeft: 0, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6875rem',
              }}
            >
              <AgentIcon size={13} />
              {agent.label}
            </span>
            {message.timestamp && (
              <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                {message.timestamp}
              </span>
            )}
          </div>
        )}

        <div style={{ wordBreak: 'break-word' }}>
          {isUser ? (
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>
              {message.content}
            </p>
          ) : message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {message.content}
            </ReactMarkdown>
          ) : (
            <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
              Thinking…
            </span>
          )}
        </div>

        {isUser && message.timestamp && (
          <div style={{ marginTop: '6px', textAlign: 'right' }}>
            <span className="text-mono" style={{ fontSize: '0.6875rem', opacity: 0.8 }}>{message.timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
