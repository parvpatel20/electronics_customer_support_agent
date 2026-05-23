import { useState } from 'react';
import { apiJson } from '../api.js';

const demoCustomers = [
  { name: 'Priya', id: 'CUST-IN-001', note: 'Router, paid order', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { name: 'Arjun', id: 'CUST-IN-002', note: 'Soundbar, shipped order', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> },
  { name: 'Kavya', id: 'CUST-IN-003', note: 'Earbuds, older order', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
  { name: 'Rohit', id: 'CUST-IN-004', note: 'Hub, disputed invoice', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg> },
  { name: 'Sneha', id: 'CUST-IN-005', note: 'Watch, active RMA', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/></svg> },
];

export default function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState('CUST-IN-001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const value = identifier.trim();
    if (!value || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiJson('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: value }),
      });
      onLogin(data.customer);
    } catch (err) {
      setError(err?.message || 'Cannot reach the backend. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="fade-in"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '60px 20px',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <div style={{ maxWidth: '880px', width: '100%', display: 'grid', gap: '24px', gridTemplateColumns: '1fr', }}>
        {/* ─── Main Card ─── */}
        <div
          className="glass-card gradient-border"
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'var(--color-tech-orange-glow)', border: '1px solid rgba(249, 115, 22, 0.2)' }}
          >
            <span style={{ color: 'var(--color-tech-orange)', display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
          </div>

          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-tech-orange)',
              marginBottom: '12px',
            }}
          >
            Authenticated Support Portal
          </p>
          <h1
            className="font-display"
            style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}
          >
            Sign in to get help
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '480px', margin: '12px auto 0' }}>
            Your identity is verified before chat starts. Every lookup stays scoped to your account.
          </p>

          <form
            className="mx-auto"
            style={{ maxWidth: '400px', marginTop: '32px' }}
            onSubmit={submit}
          >
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Customer ID or email
              </label>
              <input
                className="input-premium"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="CUST-IN-001 or priya.sharma@email.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="fade-in"
                style={{
                  marginBottom: '16px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#fca5a5',
                  textAlign: 'left',
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={loading || !identifier.trim()}
            >
              {loading ? (
                <>
                  <span className="typing-indicator" style={{ padding: '2px 8px', borderRadius: '8px', background: 'transparent', border: 'none' }}>
                    <span style={{ width: '5px', height: '5px', background: 'white' }}></span>
                    <span style={{ width: '5px', height: '5px', background: 'white' }}></span>
                    <span style={{ width: '5px', height: '5px', background: 'white' }}></span>
                  </span>
                  Signing in
                </>
              ) : (
                'Continue →'
              )}
            </button>
          </form>

          {/* ─── Demo Accounts ─── */}
          <div style={{ marginTop: '36px', borderTop: '1px solid var(--color-border-default)', paddingTop: '28px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Quick access — Demo accounts
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {demoCustomers.map((c) => (
                <button
                  key={c.id}
                  className="sidebar-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-default)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '200px',
                  }}
                  onClick={() => setIdentifier(c.id)}
                  type="button"
                >
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{c.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{c.name}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-tech-orange)', fontWeight: 600 }}>{c.id}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{c.note}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
