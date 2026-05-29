import { useState } from 'react';
import { API_BASE } from '../api.js';

function scoreColor(val) {
  if (!val || val === '—') return {};
  const n = parseFloat(val);
  if (n >= 0.8) return { color: '#4ade80', fontWeight: 600 };
  if (n >= 0.5) return { color: '#fbbf24', fontWeight: 600 };
  return { color: '#f87171', fontWeight: 600 };
}

function PendingApproval({ approval, adminPassword, onDone }) {
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState('');

  async function decide(decision) {
    if (acting) return;
    setActing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/approve-refund/${approval.conversation_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        setResult('Failed. Check password or retry.');
      } else {
        setResult(decision === 'approve' ? 'Approved.' : 'Rejected.');
        setTimeout(onDone, 800);
      }
    } catch {
      setResult('Network error.');
    } finally {
      setActing(false);
    }
  }

  return (
    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
        Customer: <strong style={{ color: 'var(--color-text-secondary)' }}>{approval.customer_id}</strong>
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', lineHeight: 1.4, marginBottom: '10px' }}>
        {approval.description}
      </p>
      {result ? (
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: result.startsWith('Approved') ? '#4ade80' : '#fca5a5' }}>{result}</p>
      ) : (
        <div className="flex gap-2">
          <button
            className="hitl-btn hitl-btn-approve"
            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
            disabled={acting}
            onClick={() => decide('approve')}
          >
            {acting ? '…' : 'Approve'}
          </button>
          <button
            className="hitl-btn hitl-btn-reject"
            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
            disabled={acting}
            onClick={() => decide('reject')}
          >
            {acting ? '…' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadMetrics(event) {
    event?.preventDefault();
    setError('');
    setLoading(true);
    let response;
    try {
      response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'X-Admin-Password': password },
      });
    } catch {
      setLoading(false);
      setError('Cannot reach the backend. Please make sure the API is running.');
      return;
    }
    setLoading(false);
    if (!response.ok) {
      setError('Admin password rejected.');
      return;
    }
    setMetrics(await response.json());
  }

  return (
    <section className="page-shell fade-in" style={{ paddingTop: '28px', paddingBottom: '32px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.875rem' }}>
              Routing quality, response evaluation, token cost, and recent conversations.
            </p>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={loadMetrics}>
            <input
              type="password"
              className="input-premium"
              style={{ width: '200px' }}
              placeholder="Admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load Metrics'}
            </button>
          </form>
        </div>

        {error && (
          <div
            className="fade-in"
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        {metrics && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <Metric label="Routing Accuracy" value={Number(metrics.evaluation.avg_routing_accuracy || 0).toFixed(2)} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" x2="21" y1="20" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" x2="21" y1="15" y2="21"/><line x1="4" x2="9" y1="4" y2="9"/></svg>} />
              <Metric label="Response Quality" value={Number(metrics.evaluation.avg_response_quality || 0).toFixed(2)} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
              <Metric label="Conversations" value={metrics.totals.conversations_this_week || 0} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>} />
              <Metric label="Weekly Cost" value={`$${Number(metrics.usage.estimated_cost_usd || 0).toFixed(4)}`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="overflow-auto rounded-xl" style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border-default)' }}>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                      <th className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Conversation</th>
                      <th className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Route</th>
                      <th className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Routing</th>
                      <th className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tools</th>
                      <th className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent_conversations.map((row) => (
                      <tr key={row.conversation_id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 150ms ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3" style={{ color: 'var(--color-tech-orange)', fontWeight: 600, fontSize: '0.8125rem' }}>
                          {row.conversation_id.slice(0, 18)}…
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                          {row.triage_result || 'pending'}
                        </td>
                        <td className="px-4 py-3" style={{ ...scoreColor(row.routing_accuracy_score), fontSize: '0.8125rem' }}>{row.routing_accuracy_score || '—'}</td>
                        <td className="px-4 py-3" style={{ ...scoreColor(row.tool_precision_score), fontSize: '0.8125rem' }}>{row.tool_precision_score || '—'}</td>
                        <td className="px-4 py-3" style={{ ...scoreColor(row.response_quality_score), fontSize: '0.8125rem' }}>{row.response_quality_score || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, var(--color-tech-navy), #1e293b)', border: '1px solid var(--color-border-default)' }}>
                  <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Phoenix Traces</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '6px', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Trace UI for observability and debugging.
                  </p>
                  <a
                    className="btn-primary"
                    style={{ display: 'inline-flex', marginTop: '12px', padding: '8px 16px', fontSize: '0.8125rem', textDecoration: 'none' }}
                    href="http://localhost:6006"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Phoenix →
                  </a>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)' }}>
                  <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Pending Approvals
                    {metrics.pending_approvals?.length > 0 && (
                      <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-tech-orange)', color: 'white', fontSize: '0.6875rem', fontWeight: 700 }}>
                        {metrics.pending_approvals.length}
                      </span>
                    )}
                  </h2>
                  {metrics.pending_approvals?.length > 0 ? (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {metrics.pending_approvals.map((approval) => (
                        <PendingApproval
                          key={approval.conversation_id}
                          approval={approval}
                          adminPassword={password}
                          onDone={loadMetrics}
                        />
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '6px', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                      No pending approvals.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="rounded-xl p-5 card-hover" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        {icon && <span style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>{icon}</span>}
      </div>
      <p className="font-display gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
        {value}
      </p>
    </div>
  );
}
