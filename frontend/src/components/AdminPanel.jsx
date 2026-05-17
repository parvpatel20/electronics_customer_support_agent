import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadMetrics(event) {
    event.preventDefault();
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
    <section className="mx-auto max-w-7xl px-5 py-6 fade-in">
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
              <Metric label="Routing Accuracy" value={Number(metrics.evaluation.avg_routing_accuracy || 0).toFixed(2)} />
              <Metric label="Response Quality" value={Number(metrics.evaluation.avg_response_quality || 0).toFixed(2)} />
              <Metric label="Conversations" value={metrics.totals.conversations_this_week || 0} />
              <Metric label="Weekly Cost" value={`$${Number(metrics.usage.estimated_cost_usd || 0).toFixed(4)}`} />
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
                      <tr key={row.conversation_id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--color-tech-orange)', fontWeight: 600, fontSize: '0.8125rem' }}>
                          {row.conversation_id.slice(0, 18)}…
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                          {row.triage_result || 'pending'}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{row.routing_accuracy_score || '—'}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{row.tool_precision_score || '—'}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{row.response_quality_score || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e293b)', border: '1px solid var(--color-border-default)' }}>
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
                  <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Pending Approvals</h2>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '6px', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Refund approvals appear here when LangGraph returns an interrupt. Use the backend approval endpoint to resume.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)' }}>
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="font-display gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>
        {value}
      </p>
    </div>
  );
}
