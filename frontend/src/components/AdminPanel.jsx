import { useState } from 'react';
import {
  Shuffle, Star, MessagesSquare, DollarSign, ExternalLink, Loader2, Inbox,
  TrendingUp, Activity, ShieldCheck, Lock,
} from 'lucide-react';
import { API_BASE } from '../api.js';
import logo from '../assets/techcart-logo.png';

function scoreColor(val) {
  if (!val || val === '—') return {};
  const n = parseFloat(val);
  if (n >= 0.8) return { color: 'var(--success)' };
  if (n >= 0.5) return { color: 'var(--warning)' };
  return { color: 'var(--error)' };
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
    <div
      style={{
        padding: '14px', borderRadius: 'var(--radius-md)',
        background: 'var(--primary-tint)', border: '1px solid var(--primary-border)',
      }}
    >
      <p className="text-subtle" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
        Customer: <span className="text-mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{approval.customer_id}</span>
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: '12px' }}>
        {approval.description}
      </p>
      {result ? (
        <p
          className="flex items-center gap-1.5"
          style={{
            fontSize: '0.8125rem', fontWeight: 600,
            color: result.startsWith('Approved') ? 'var(--success)' : 'var(--error)',
          }}
        >
          <ShieldCheck size={14} /> {result}
        </p>
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

const metricGradients = {
  routing: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  quality: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  conversations: 'linear-gradient(135deg, #d946ef, #f472b6)',
  cost: 'linear-gradient(135deg, #10b981, #06b6d4)',
};

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
    <section className="page-shell fade-in" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      {/* Header */}
      <div
        className="card"
        style={{ padding: '24px', marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div
              style={{
                width: 42, height: 42, borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)', padding: 1.5,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '100%', height: '100%', borderRadius: 'calc(var(--radius-md) - 1.5px)',
                  background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img src={logo} alt="TechCart" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              </div>
            </div>
            <div>
              <div
                className="inline-flex items-center gap-1"
                style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-tint)', border: '1px solid var(--primary-border)',
                  color: 'var(--primary)', fontSize: '0.6875rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                <Activity size={10} /> Operations
              </div>
              <h1 className="font-display" style={{ fontSize: '1.375rem', fontWeight: 700 }}>
                Admin <span className="gradient-text">Dashboard</span>
              </h1>
            </div>
          </div>

          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={loadMetrics}>
            <div style={{ position: 'relative' }}>
              <Lock
                size={14}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              />
              <input
                type="password"
                className="input"
                style={{ width: '200px', height: '38px', paddingLeft: 34, fontSize: '0.8125rem' }}
                placeholder="Confirm password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" disabled={loading} style={{ height: '38px' }}>
              {loading ? (<><Loader2 size={14} className="animate-spin" /> Syncing</>) : 'Sync Metrics'}
            </button>
          </form>
        </div>

        {error && (
          <div
            className="fade-in"
            role="alert"
            style={{
              marginTop: '16px', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--error-tint)', border: '1px solid var(--error)',
              fontSize: '0.75rem', fontWeight: 500, color: 'var(--error)',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {metrics && (
        <>
          {/* Bento grid: stats */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}
          >
            <Metric
              label="Routing Accuracy"
              value={Number(metrics.evaluation.avg_routing_accuracy || 0).toFixed(2)}
              grad={metricGradients.routing}
              icon={<Shuffle size={16} />}
              delay={0}
            />
            <Metric
              label="Response Quality"
              value={Number(metrics.evaluation.avg_response_quality || 0).toFixed(2)}
              grad={metricGradients.quality}
              icon={<Star size={16} />}
              delay={80}
            />
            <Metric
              label="Conversations"
              value={metrics.totals.conversations_this_week || 0}
              grad={metricGradients.conversations}
              icon={<MessagesSquare size={16} />}
              delay={160}
            />
            <Metric
              label="Weekly Cost"
              value={`$${Number(metrics.usage.estimated_cost_usd || 0).toFixed(4)}`}
              grad={metricGradients.cost}
              icon={<DollarSign size={16} />}
              delay={240}
            />
          </div>

          {/* Bento grid: main content */}
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start' }}
          >
            <div
              className="lg:grid"
              style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px' }}
            >
              <div
                className="card"
                style={{ padding: '0', overflow: 'hidden' }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}
                >
                  <div>
                    <h2 className="h3" style={{ fontFamily: 'var(--font-display)' }}>Recent Conversations</h2>
                    <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                      Routing decisions and quality scores for the latest tickets.
                    </p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: 'var(--primary-tint)', color: 'var(--primary)',
                      border: '1px solid var(--primary-border)',
                    }}
                  >
                    <TrendingUp size={12} /> Live
                  </span>
                </div>
                <div style={{ overflow: 'auto' }}>
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
                            <div
                              className="flex flex-col items-center justify-center text-subtle"
                              style={{ padding: '40px 0', gap: '10px' }}
                            >
                              <div
                                style={{
                                  width: 56, height: 56, borderRadius: '50%',
                                  background: 'var(--surface-2)', color: 'var(--text-subtle)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Inbox size={26} />
                              </div>
                              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>No conversations yet this week.</span>
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
                            <td style={{ ...scoreColor(row.routing_accuracy_score), fontSize: '0.8125rem', fontWeight: 600 }}>{row.routing_accuracy_score || '—'}</td>
                            <td style={{ ...scoreColor(row.tool_precision_score), fontSize: '0.8125rem', fontWeight: 600 }}>{row.tool_precision_score || '—'}</td>
                            <td style={{ ...scoreColor(row.response_quality_score), fontSize: '0.8125rem', fontWeight: 600 }}>{row.response_quality_score || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="flex flex-col gap-4" style={{ marginTop: '20px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                    <span
                      style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Activity size={15} />
                    </span>
                    <h2 className="h4" style={{ fontFamily: 'var(--font-display)' }}>Phoenix Traces</h2>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Trace UI for observability and debugging.
                  </p>
                  <a
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '14px', textDecoration: 'none' }}
                    href="http://localhost:6006"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Phoenix <ExternalLink size={14} />
                  </a>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                          background: 'linear-gradient(135deg, #6366f1, #d946ef)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ShieldCheck size={15} />
                      </span>
                      <h2 className="h4" style={{ fontFamily: 'var(--font-display)' }}>Pending Approvals</h2>
                    </div>
                    {metrics.pending_approvals?.length > 0 && (
                      <span className="badge badge-primary">{metrics.pending_approvals.length}</span>
                    )}
                  </div>
                  {metrics.pending_approvals?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    <p className="text-subtle" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                      No pending approvals. All refund requests are processed.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </>
      )}

      {!metrics && !error && (
        <div className="flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '50vh', padding: '40px 16px' }}>
          {/* Central Logo Above Card (Marketing & Clean UI) */}
          <div className="flex flex-col items-center gap-2" style={{ marginBottom: '24px' }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)', padding: 1.5,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '100%', height: '100%', borderRadius: 'calc(var(--radius-md) - 1.5px)',
                  background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img src={logo} alt="TechCart" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              </div>
            </div>
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 700 }}>
              TechCart Admin Center
            </span>
          </div>

          <div
            className="card"
            style={{ width: '100%', maxWidth: '380px', padding: '28px 24px', background: 'var(--surface)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}
          >
            <div
              className="mx-auto flex items-center justify-center"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--primary-tint)', color: 'var(--primary)',
                marginBottom: '16px',
              }}
            >
              <Lock size={18} />
            </div>
            <h2 className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px' }}>
              Authentication Required
            </h2>
            <p className="text-muted" style={{ fontSize: '0.8125rem', maxWidth: '300px', margin: '0 auto 20px' }}>
              Enter the admin password to access metrics, traces, and pending approvals.
            </p>
            
            <form onSubmit={loadMetrics} className="flex flex-col gap-3">
              <input
                type="password"
                className="input"
                style={{ height: '40px', fontSize: '0.875rem', textAlign: 'center' }}
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="btn btn-primary" style={{ width: '100%', height: '40px' }} disabled={loading}>
                {loading ? (<><Loader2 size={15} className="animate-spin" /> Authenticating…</>) : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, icon, grad, delay = 0 }) {
  return (
    <div
      className="card stagger-in animate-fade-in"
      style={{
        padding: '20px',
        animationDelay: `${delay}ms`,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <p className="eyebrow" style={{ fontSize: '0.6875rem' }}>{label}</p>
        <span
          style={{
            width: 30, height: 30, borderRadius: 'var(--radius-md)',
            background: 'var(--primary-tint)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </span>
      </div>
      <p
        className="font-display"
        style={{
          fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </p>
    </div>
  );
}
