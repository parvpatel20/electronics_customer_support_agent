import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const agentLabels = {
  billing: { label: 'Billing', color: '#f97316', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> },
  technical: { label: 'Technical', color: '#3b82f6', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  returns: { label: 'Returns', color: '#2dd4bf', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
  supervisor: { label: 'Supervisor', color: '#6b7280', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  triage: { label: 'Routing', color: '#94a3b8', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" x2="21" y1="20" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" x2="21" y1="15" y2="21"/><line x1="4" x2="9" y1="4" y2="9"/></svg> },
  human: { label: 'Human Agent', color: '#22c55e', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
};

const mdComponents = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 10px', lineHeight: 1.7, fontSize: '0.9375rem' }}>{children}</p>
  ),
  h1: ({ children }) => (
    <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '16px 0 8px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-display, inherit)' }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '14px 0 6px', color: 'var(--color-text-primary)' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '12px 0 4px', color: 'var(--color-text-primary)' }}>{children}</h3>
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
    <strong style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>{children}</em>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0.8125rem',
        padding: '2px 6px',
        borderRadius: '5px',
        background: 'rgba(249,115,22,0.1)',
        color: 'var(--color-tech-orange)',
        wordBreak: 'break-all',
      }}>{children}</code>
    ) : (
      <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}>{children}</code>
    ),
  pre: ({ children }) => (
    <pre style={{
      margin: '10px 0',
      padding: '14px 16px',
      borderRadius: '10px',
      background: 'var(--color-surface-1)',
      border: '1px solid var(--color-border-default)',
      overflowX: 'auto',
      fontSize: '0.8125rem',
      lineHeight: 1.6,
      fontFamily: 'ui-monospace, monospace',
      color: 'var(--color-text-primary)',
    }}>{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: '8px 0',
      padding: '8px 14px',
      borderLeft: '3px solid var(--color-tech-orange)',
      background: 'rgba(249,115,22,0.05)',
      borderRadius: '0 8px 8px 0',
      color: 'var(--color-text-secondary)',
      fontSize: '0.9rem',
    }}>{children}</blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: '12px 0' }} />
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '10px 0', borderRadius: '10px', border: '1px solid var(--color-border-default)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ background: 'var(--color-surface-2)' }}>{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th style={{
      padding: '8px 14px',
      textAlign: 'left',
      fontWeight: 700,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: 'var(--color-text-secondary)',
      whiteSpace: 'nowrap',
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{
      padding: '8px 14px',
      color: 'var(--color-text-primary)',
      fontSize: '0.875rem',
      verticalAlign: 'top',
    }}>{children}</td>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-tech-orange)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{children}</a>
  ),
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const agent = agentLabels[message.agentName] || { label: message.agentName || 'Assistant', color: '#6b7280', icon: '🤖' };

  return (
    <div
      className={`stagger-in flex ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ marginBottom: '16px', alignItems: 'flex-end', gap: '8px' }}
    >
      {!isUser && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}18)`,
          border: `1px solid ${agent.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.625rem',
        }}>
          {agent.icon}
        </div>
      )}
      <div
        className={isUser ? 'msg-user' : 'msg-assistant'}
        style={{ maxWidth: '82%', padding: '14px 18px' }}
      >
        {!isUser && (
          <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px 3px 8px',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: `${agent.color}15`,
              color: agent.color,
              borderLeft: `2px solid ${agent.color}`,
            }}>
              <span style={{ fontSize: '0.7rem' }}>{agent.icon}</span>
              {agent.label}
            </span>
            {message.timestamp && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
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
            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
              Thinking…
            </span>
          )}
        </div>

        {isUser && message.timestamp && (
          <div style={{ marginTop: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>{message.timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
