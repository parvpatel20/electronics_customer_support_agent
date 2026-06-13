import { useState } from 'react';
import {
  Globe, Volume2, Headphones, Monitor, Watch,
  Package, CreditCard, RotateCcw, Wrench, ArrowRight, Loader2,
  ShieldCheck, Zap, Network, Check, Sparkles,
} from 'lucide-react';
import { apiJson } from '../api.js';
import logo from '../assets/techcart-logo.png';

const demoCustomers = [
  { name: 'Priya', id: 'CUST-IN-001', note: 'Router, paid order', Icon: Globe, grad: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { name: 'Arjun', id: 'CUST-IN-002', note: 'Soundbar, shipped order', Icon: Volume2, grad: 'linear-gradient(135deg, #06b6d4, #6366f1)' },
  { name: 'Kavya', id: 'CUST-IN-003', note: 'Earbuds, older order', Icon: Headphones, grad: 'linear-gradient(135deg, #d946ef, #f472b6)' },
  { name: 'Rohit', id: 'CUST-IN-004', note: 'Hub, disputed invoice', Icon: Monitor, grad: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Sneha', id: 'CUST-IN-005', note: 'Watch, active RMA', Icon: Watch, grad: 'linear-gradient(135deg, #10b981, #06b6d4)' },
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

  async function loginWith(value) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setIdentifier(trimmed);
    setLoading(true);
    setError('');
    try {
      const data = await apiJson('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmed }),
      });
      onLogin(data.customer);
    } catch (err) {
      setError(err?.message || 'Cannot reach the backend. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    await loginWith(identifier);
  }

  return (
    <section className="fade-in aurora" style={{ minHeight: 'calc(100vh - var(--nav-height))', position: 'relative' }}>
      <div className="aurora-orbs" aria-hidden="true">
        <span className="orb-cyan" />
      </div>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} aria-hidden="true" />

      <div
        className="grid lg:grid-cols-[1.05fr_1fr] relative"
        style={{ minHeight: 'calc(100vh - var(--nav-height))', zIndex: 1 }}
      >

        {/* ───────────── Brand / hero panel ───────────── */}
        <aside
          className="hidden lg:flex flex-col justify-between"
          style={{
            padding: '56px 56px 48px', position: 'relative', overflow: 'hidden',
            background: 'var(--bg-subtle)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'var(--grad-mesh-1), var(--grad-mesh-2)', pointerEvents: 'none' }} aria-hidden="true" />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '56px' }}>
              <div
                className="float"
                style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'var(--grad-primary)', padding: 2,
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <div
                  style={{
                    width: '100%', height: '100%', borderRadius: 'calc(var(--radius-md) - 2px)',
                    background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img src={logo} alt="TechCart" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                </div>
              </div>
              <span className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                TechCart <span className="gradient-text">AI</span>
              </span>
            </div>

            <div
              className="inline-flex items-center gap-1.5"
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary-tint)', border: '1px solid var(--primary-border)',
                color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <Sparkles size={13} />
              AI-Powered Electronics Support
            </div>
            <h1
              className="font-display"
              style={{ fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em', maxWidth: '480px' }}
            >
              Support that
              <br />
              <span className="gradient-text animate-gradient">actually resolves</span>
              <br />
              things.
            </h1>
            <p className="text-muted" style={{ marginTop: '20px', fontSize: '1.0625rem', lineHeight: 1.6, maxWidth: '460px' }}>
              One intelligent thread for your whole account — routed to the right specialist agent, every time.
            </p>

            <div className="grid gap-4" style={{ marginTop: '40px', gridTemplateColumns: '1fr 1fr', maxWidth: '540px' }}>
              {features.map(({ label, desc, Icon }, i) => (
                <div
                  key={label}
                  className="card-glass stagger-in"
                  style={{
                    padding: '16px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      background: 'var(--grad-primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--shadow-glow)',
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</span>
                    <span className="text-subtle" style={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.45, marginTop: '3px' }}>{desc}</span>
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
        <div className="flex items-center justify-center" style={{ padding: '40px 24px' }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '36px 32px' }}>
            {/* Compact brand header (mobile only) */}
            <div className="flex lg:hidden items-center gap-3" style={{ marginBottom: '28px' }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--grad-primary)', padding: 2,
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <div
                  style={{
                    width: '100%', height: '100%', borderRadius: 'calc(var(--radius-md) - 2px)',
                    background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img src={logo} alt="TechCart" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                </div>
              </div>
              <span className="font-display" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>TechCart AI</span>
            </div>

            <h2 className="h1" style={{ fontSize: '1.75rem' }}>Welcome back</h2>
            <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.9375rem' }}>
              Sign in to open your support thread — orders, billing, returns, and tech help in one place.
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
            <div style={{ marginTop: '28px' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '14px' }}>
                <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>Quick access — demo</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              <div className="flex flex-col gap-2">
                {demoCustomers.map(({ name, id, note, Icon, grad }) => {
                  const active = identifier === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setIdentifier(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%',
                        background: active ? 'var(--primary-tint)' : 'var(--surface)',
                        border: active ? '1.5px solid var(--primary-border)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 180ms ease',
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <span
                        className="avatar-gradient"
                        style={{ background: grad, width: 36, height: 36 }}
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
                      {active && (
                        <span
                          className="flex items-center justify-center"
                          style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', flexShrink: 0 }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
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
