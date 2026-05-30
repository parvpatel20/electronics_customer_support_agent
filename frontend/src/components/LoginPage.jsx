import { useState } from 'react';
import {
  Globe, Volume2, Headphones, Monitor, Watch,
  Package, CreditCard, RotateCcw, Wrench, ArrowRight, Loader2,
} from 'lucide-react';
import { apiJson } from '../api.js';
import logo from '../assets/techcart-logo.png';

const demoCustomers = [
  { name: 'Priya', id: 'CUST-IN-001', note: 'Router, paid order', Icon: Globe },
  { name: 'Arjun', id: 'CUST-IN-002', note: 'Soundbar, shipped order', Icon: Volume2 },
  { name: 'Kavya', id: 'CUST-IN-003', note: 'Earbuds, older order', Icon: Headphones },
  { name: 'Rohit', id: 'CUST-IN-004', note: 'Hub, disputed invoice', Icon: Monitor },
  { name: 'Sneha', id: 'CUST-IN-005', note: 'Watch, active RMA', Icon: Watch },
];

const features = [
  { label: 'Orders & Shipping', Icon: Package },
  { label: 'Billing & Refunds', Icon: CreditCard },
  { label: 'Returns & RMA', Icon: RotateCcw },
  { label: 'Technical Support', Icon: Wrench },
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
        padding: '48px 20px',
        minHeight: 'calc(100vh - var(--nav-height))',
      }}
    >
      <div style={{ maxWidth: '560px', width: '100%' }}>
        <div className="card" style={{ padding: '40px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <img src={logo} alt="TechCart" className="mx-auto" style={{ height: '64px', objectFit: 'contain', marginBottom: '20px' }} />
            <p className="eyebrow" style={{ color: 'var(--primary)', marginBottom: '8px' }}>
              AI-Powered Electronics Support
            </p>
            <h1 className="h1">Get help instantly</h1>
            <p className="text-muted" style={{ marginTop: '10px', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Intelligent support for orders, billing, returns, and troubleshooting — all in one
              thread, scoped to your account.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: '20px' }}>
            {features.map(({ label, Icon }) => (
              <span key={label} className="badge badge-neutral">
                <Icon size={14} /> {label}
              </span>
            ))}
          </div>

          {/* Form */}
          <form className="mx-auto" style={{ maxWidth: '380px', marginTop: '28px' }} onSubmit={submit}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label htmlFor="login-identifier" className="field-label">Customer ID or email</label>
              <input
                id="login-identifier"
                className={`input${error ? ' input-error' : ''}`}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="CUST-IN-001 or priya.sharma@email.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="fade-in"
                role="alert"
                style={{
                  marginBottom: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--error-tint)', border: '1px solid var(--error)',
                  fontSize: '0.8125rem', fontWeight: 500, color: 'var(--error)', textAlign: 'left',
                }}
              >
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || !identifier.trim()}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Signing in
                </>
              ) : (
                <>
                  Continue <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="text-subtle" style={{ marginTop: '14px', fontSize: '0.6875rem', textAlign: 'center' }}>
              Multi-agent AI · Secure &amp; private · Instant responses
            </p>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <p className="eyebrow" style={{ marginBottom: '14px' }}>Quick access — demo accounts</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {demoCustomers.map(({ name, id, note, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="card-inset card-hover"
                  onClick={() => setIdentifier(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', background: 'var(--surface)', cursor: 'pointer',
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <span
                    style={{
                      width: '34px', height: '34px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: 'var(--primary-tint)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)' }}>{name}</span>
                    <span className="text-mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 500 }}>{id}</span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>{note}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
