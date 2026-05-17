import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function ConversationSidebar({ customer, activeConversationId, onSelectConversation, onNewChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!customer?.customer_id) return;
    loadConversations();
  }, [customer?.customer_id, activeConversationId]);

  async function loadConversations() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/conversations/${customer.customer_id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Sidebar should never block the main flow.
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function truncate(text, max = 48) {
    if (!text) return 'New conversation';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  const routeColors = {
    billing: '#f97316',
    technical: '#3b82f6',
    returns: '#a855f7',
    supervisor: '#6b7280',
  };

  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center py-4 gap-3"
        style={{
          width: '56px',
          background: 'var(--color-surface-1)',
          borderRight: '1px solid var(--color-border-default)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'var(--color-surface-3)', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          title="Expand sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button
          onClick={onNewChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, var(--color-tech-orange), #ea580c)', border: 'none', cursor: 'pointer', color: 'white' }}
          title="New chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col fade-in"
      style={{
        width: '280px',
        background: 'var(--color-surface-1)',
        borderRight: '1px solid var(--color-border-default)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <h2 className="font-display text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Conversations
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-tech-orange), #ea580c)', border: 'none', cursor: 'pointer', color: 'white' }}
            title="New chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            title="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2" style={{ gap: '4px', display: 'flex', flexDirection: 'column' }}>
        {loading && conversations.length === 0 && (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer" style={{ height: '52px', borderRadius: '10px' }} />
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="p-4 text-center" style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            No conversations yet. Start a new chat!
          </div>
        )}

        {conversations.map((conv) => {
          const isActive = conv.conversation_id === activeConversationId;
          return (
            <button
              key={conv.conversation_id}
              onClick={() => onSelectConversation(conv.conversation_id)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid transparent',
                background: isActive ? 'var(--color-tech-orange-glow)' : 'transparent',
                borderColor: isActive ? 'rgba(249, 115, 22, 0.25)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  style={{
                    color: isActive ? 'var(--color-tech-orange-light)' : 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {truncate(conv.first_message)}
                </p>
                {conv.triage_result && (
                  <span
                    style={{
                      flexShrink: 0,
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: routeColors[conv.triage_result] || '#6b7280',
                    }}
                  />
                )}
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem', marginTop: '2px' }}>
                {formatTime(conv.started_at)}
                {conv.triage_result && (
                  <span style={{ marginLeft: '6px', textTransform: 'capitalize' }}> · {conv.triage_result}</span>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
