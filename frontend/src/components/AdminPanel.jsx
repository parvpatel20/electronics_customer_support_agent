import { useState } from 'react';
import {
  Shuffle, Star, MessagesSquare, DollarSign, ExternalLink, Loader2, Inbox,
} from 'lucide-react';
import { API_BASE } from '../api.js';

function scoreColor(val) {
  if (!val || val === '—') return {};
  const n = parseFloat(val);
  if (n >= 0.8) return { color: 'var(--success)', fontWeight: 600 };
  if (n >= 0.5) return { color: 'var(--warning)', fontWeight: 600 };
  return { color: 'var(--error)', fontWeight: 600 };
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
    <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--primary-tint)', border: '1px solid var(--primary-border)' }}>
      <p className="text-subtle" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
        Customer: <span className="text-mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{approval.customer_id}</span>
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.45, marginBottom: '10px' }}>
        {approval.description}
      </p>
      {result ? (
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: result.startsWith('Approved') ? 'var(--success)' : 'var(--error)' }}>{result}</p>
      ) : (
        <div className="flex gap-2">
          <button className="hitl-btn hitl-btn-approve" disabled={acting} onClick={() => decide('approve')}>
            {acting ? '…' : 'Approve'}
          </button>
          <button className="hitl-btn hitl-btn-reject" disabled={acting} onClick={() => decide('reject')}>
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
    <section className="page-shell fade-in" style={{ paddingTop: '28px', paddingBottom: '40px' }}>
      <div className="card" style={{ padding: '28px' }}>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="h2">Admin Dashboard</h1>
            <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.875rem' }}>
              Routing quality, response evaluation, token cost, and recent conversations.
            </p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={loadMetrics}>
            <input
              type="password"
              className="input"
              style={{ width: '200px' }}
              placeholder="Admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button className="btn btn-primary" disabled={loading}>
              {loading ? (<><Loader2 size={16} className="animate-spin" /> Loading</>) : 'Load Metrics'}
            </button>
          </form>
        </div>

        {error && (
          <div
            className="fade-in"
            role="alert"
            style={{
              marginTop: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--error-tint)', border: '1px solid var(--error)',
              fontSize: '0.8125rem', fontWeight: 500, color: 'var(--error)',
            }}
          >
            {error}
          </div>
        )}

        {metrics && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <Metric label="Routing Accuracy" value={Number(metrics.evaluation.avg_routing_accuracy || 0).toFixed(2)} icon={<Shuffle size={16} />} />
              <Metric label="Response Quality" value={Number(metrics.evaluation.avg_response_quality || 0).toFixed(2)} icon={<Star size={16} />} />
              <Metric label="Conversations" value={metrics.totals.conversations_this_week || 0} icon={<MessagesSquare size={16} />} />
              <Metric label="Weekly Cost" value={`$${Number(metrics.usage.estimated_cost_usd || 0).toFixed(4)}`} icon={<DollarSign size={16} />} />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="card-inset" style={{ overflow: 'auto' }}>
                <table className="data-table" style={{ minWidth: '720px' }}>
                  <thead>
                    <tr>
                      <th>Conversation</th>
                      <th>Route</th>
                      <th>Routing</th>
                      <th>Tools</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent_conversations.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="flex flex-col items-center justify-center text-subtle" style={{ padding: '32px 0', gap: '8px' }}>
                            <Inbox size={28} />
                            <span style={{ fontSize: '0.8125rem' }}>No conversations yet this week.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      metrics.recent_conversations.map((row) => (
                        <tr key={row.conversation_id}>
                          <td className="text-mono" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem' }}>
                            {row.conversation_id.slice(0, 18)}…
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                            {row.triage_result || 'pending'}
                          </td>
                          <td style={{ ...scoreColor(row.routing_accuracy_score), fontSize: '0.8125rem' }}>{row.routing_accuracy_score || '—'}</td>
                          <td style={{ ...scoreColor(row.tool_precision_score), fontSize: '0.8125rem' }}>{row.tool_precision_score || '—'}</td>
                          <td style={{ ...scoreColor(row.response_quality_score), fontSize: '0.8125rem' }}>{row.response_quality_score || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="card-inset" style={{ padding: '20px' }}>
                  <h2 className="h3">Phoenix Traces</h2>
                  <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Trace UI for observability and debugging.
                  </p>
                  <a
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '12px', textDecoration: 'none' }}
                    href="http://localhost:6006"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Phoenix <ExternalLink size={15} />
                  </a>
                </div>
                <div className="card-inset" style={{ padding: '20px' }}>
                  <h2 className="h3 flex items-center gap-2">
                    Pending Approvals
                    {metrics.pending_approvals?.length > 0 && (
                      <span className="badge badge-primary">{metrics.pending_approvals.length}</span>
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
                    <p className="text-subtle" style={{ marginTop: '6px', fontSize: '0.8125rem', lineHeight: 1.5 }}>
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
    <div className="card-inset card-hover" style={{ padding: '18px 20px', background: 'var(--surface)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
        <p className="eyebrow">{label}</p>
        <span style={{ color: 'var(--text-subtle)' }}>{icon}</span>
      </div>
      <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </p>
    </div>
  );
}
