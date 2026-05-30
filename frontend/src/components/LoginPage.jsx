import { useState } from 'react';
import {
  Globe, Volume2, Headphones, Monitor, Watch,
  Package, CreditCard, RotateCcw, Wrench, ArrowRight, Loader2,
  ShieldCheck, Zap, Network, Check,
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
  { label: 'Orders & Shipping', desc: 'Track deliveries and resolve order issues', Icon: Package },
  { label: 'Billing & Refunds', desc: 'Disputes, invoices, and instant refunds', Icon: CreditCard },
  { label: 'Returns & RMA', desc: 'Start returns and follow replacement status', Icon: RotateCcw },
  { label: 'Technical Support', desc: 'Step-by-step troubleshooting that works', Icon: Wrench },
];

const trustPoints = [
  { label: 'Multi-agent AI', Icon: Network },
  { label: 'Secure & private', Icon: ShieldCheck },
  { label: 'Instant responses', Icon: Zap },
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
    <section className="fade-in" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="grid lg:grid-cols-[1.05fr_1fr]" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>

        {/* ───────────── Brand / hero panel ───────────── */}
        <aside
          className="login-hero hidden lg:flex flex-col justify-between"
          style={{ padding: '56px 56px 48px', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '56px' }}>
              <img src={logo} alt="TechCart" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
              <span className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)' }}>
                TechCart AI
              </span>
            </div>

            <p className="eyebrow" style={{ color: 'var(--primary)', marginBottom: '14px' }}>
              AI-Powered Electronics Support
            </p>
            <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.02em', maxWidth: '460px' }}>
              Support that actually resolves things.
            </h1>
            <p className="text-muted" style={{ marginTop: '16px', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px' }}>
              One intelligent thread for your whole account — routed to the right specialist agent,
              every time.
            </p>

            <div className="grid gap-3" style={{ marginTop: '36px', gridTemplateColumns: '1fr 1fr', maxWidth: '520px' }}>
              {features.map(({ label, desc, Icon }) => (
                <div key={label} className="flex items-start gap-3" style={{ padding: '4px 0' }}>
                  <span
                    style={{
                      width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: 'var(--primary-tint)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon size={19} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</span>
                    <span className="text-subtle" style={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.4, marginTop: '2px' }}>{desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2" style={{ position: 'relative', zIndex: 1, marginTop: '40px' }}>
            {trustPoints.map(({ label, Icon }) => (
              <span key={label} className="flex items-center gap-2 text-subtle" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                <Icon size={15} style={{ color: 'var(--accent)' }} /> {label}
              </span>
            ))}
          </div>
        </aside>

        {/* ───────────── Form panel ───────────── */}
        <div className="flex items-center justify-center" style={{ padding: '40px 24px', background: 'var(--bg)' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {/* Compact brand header (mobile only) */}
            <div className="flex lg:hidden items-center gap-3" style={{ marginBottom: '28px' }}>
              <img src={logo} alt="TechCart" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
              <span className="font-display" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>TechCart AI</span>
            </div>

            <h2 className="h1">Welcome back</h2>
            <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.9375rem' }}>
              Sign in with your customer ID or email to open your support thread.
            </p>

            <form onSubmit={submit} style={{ marginTop: '28px' }}>
              <div style={{ marginBottom: '16px' }}>
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
                    fontSize: '0.8125rem', fontWeight: 500, color: 'var(--error)',
                  }}
                >
                  {error}
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || !identifier.trim()}>
                {loading ? (<><Loader2 size={18} className="animate-spin" /> Signing in</>) : (<>Continue <ArrowRight size={18} /></>)}
              </button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop: '32px' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '14px' }}>
                <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>Quick access — demo accounts</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              <div className="flex flex-col gap-2">
                {demoCustomers.map(({ name, id, note, Icon }) => {
                  const active = identifier === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className="card-inset"
                      onClick={() => setIdentifier(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%',
                        background: active ? 'var(--primary-tint)' : 'var(--surface)',
                        borderColor: active ? 'var(--primary-border)' : 'var(--border)',
                        transition: 'background-color 150ms ease, border-color 150ms ease',
                      }}
                    >
                      <span
                        style={{
                          width: '34px', height: '34px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                          background: active ? 'var(--primary)' : 'var(--surface-2)',
                          color: active ? 'var(--primary-fg)' : 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)' }}>{name}</span>
                          <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 500 }}>{id}</span>
                        </span>
                        <span className="text-subtle" style={{ display: 'block', fontSize: '0.6875rem' }}>{note}</span>
                      </span>
                      {active && <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
