const agentLabels = {
  billing: { label: 'Billing', color: '#f97316', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> },
  technical: { label: 'Technical', color: '#3b82f6', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  returns: { label: 'Returns', color: '#a855f7', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
  supervisor: { label: 'Supervisor', color: '#6b7280', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  triage: { label: 'Routing', color: '#64748b', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" x2="21" y1="20" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" x2="21" y1="15" y2="21"/><line x1="4" x2="9" y1="4" y2="9"/></svg> },
  human: { label: 'Human Agent', color: '#22c55e', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const agent = agentLabels[message.agentName] || { label: message.agentName || 'Assistant', color: '#6b7280', icon: '🤖' };

  return (
    <div
      className={`stagger-in flex ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ marginBottom: '12px' }}
    >
      <div
        className={isUser ? 'msg-user' : 'msg-assistant'}
        style={{
          maxWidth: '85%',
          padding: '14px 18px',
        }}
      >
        {/* Agent badge — assistants only */}
        {!isUser && (
          <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: `${agent.color}18`,
                color: agent.color,
              }}
            >
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

        {/* Content */}
        <div
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: '0.9375rem',
            wordBreak: 'break-word',
          }}
        >
          {message.content || (
            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
              Processing...
            </span>
          )}
        </div>

        {/* User timestamp */}
        {isUser && message.timestamp && (
          <div style={{ marginTop: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
              {message.timestamp}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
