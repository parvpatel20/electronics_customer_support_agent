import { useState } from 'react';
import { apiJson } from '../api.js';
import logo from '../assets/techcart-logo.png';

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
          <img src={logo} alt="TechCart" className="mx-auto mb-4" style={{ height: '96px', objectFit: 'contain' }} />

          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-tech-teal)',
              marginBottom: '10px',
            }}
          >
            AI-Powered Electronics Support
          </p>
          <h1
            className="font-display"
            style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}
          >
            Get help instantly
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '480px', margin: '12px auto 0' }}>
            Intelligent support for orders, billing, returns, and troubleshooting — all in one thread, scoped to your account.
          </p>

          <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: '20px' }}>
            {[
              { label: 'Orders & Shipping', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
              { label: 'Billing & Refunds', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> },
              { label: 'Returns & RMA', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> },
              { label: 'Technical Support', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
            ].map((f) => (
              <span key={f.label} className="badge-pill" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-default)' }}>
                {f.icon} {f.label}
              </span>
            ))}
          </div>

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
            <p style={{ marginTop: '16px', fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
              Multi-agent AI · Secure & private · Instant responses
            </p>
          </form>

          {/* ─── Demo Accounts ─── */}
          <div style={{ marginTop: '36px', borderTop: '1px solid var(--color-border-default)', paddingTop: '28px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Quick access — Demo accounts
            </p>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', textAlign: 'left' }}
            >
              {demoCustomers.map((c) => (
                <button
                  key={c.id}
                  className="sidebar-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-default)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onClick={() => setIdentifier(c.id)}
                  type="button"
                >
                  <div
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, var(--color-tech-orange), #ea580c)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8125rem', fontWeight: 700, color: 'white',
                    }}
                  >
                    {c.name[0]}
                  </div>
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
