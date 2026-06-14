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
    <section className="fade-in aurora animate-fade-in" style={{ minHeight: 'calc(100vh - var(--nav-height))', position: 'relative' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} aria-hidden="true" />

      <div
        className="grid lg:grid-cols-[1.1fr_1fr] relative"
        style={{ minHeight: 'calc(100vh - var(--nav-height))', zIndex: 1 }}
      >

        {/* ───────────── Brand / Hero Panel (Marketing) ───────────── */}
        <aside
          className="hidden lg:flex flex-col justify-between"
          style={{
            padding: '48px 48px 40px', position: 'relative', overflow: 'hidden',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Elegant Header with Logo */}
            <div className="flex items-center gap-3" style={{ marginBottom: '48px' }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: 'var(--radius-md)',
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
              <span className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                TechCart <span className="gradient-text">AI</span>
              </span>
            </div>

            {/* AI Highlight Badge */}
            <div
              className="inline-flex items-center gap-1.5"
              style={{
                padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-tint)', border: '1px solid var(--primary-border)',
                color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <Sparkles size={12} className="text-primary" />
              Smarter Support, Instant Resolutions
            </div>
            
            <h1
              className="font-display"
              style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text)', maxWidth: '480px' }}
            >
              Support that
              <br />
              <span className="gradient-text">actually resolves</span>
              <br />
              your issues.
            </h1>
            
            <p className="text-muted" style={{ marginTop: '16px', fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: '440px' }}>
              Ask questions about your orders, invoices, or technical issues in one place. Our multi-agent AI automatically routes your thread to the right specialist.
            </p>

            {/* Clean Capability Showcase List */}
            <div className="grid gap-3" style={{ marginTop: '36px', gridTemplateColumns: '1fr 1fr', maxWidth: '520px' }}>
              {features.map(({ label, desc, Icon }, i) => (
                <div
                  key={label}
                  className="stagger-in"
                  style={{
                    padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px',
                    animationDelay: `${i * 60}ms`,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      background: 'var(--primary-tint)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)' }}>{label}</span>
                    <span className="text-subtle" style={{ display: 'block', fontSize: '0.6875rem', lineHeight: 1.35, marginTop: '2px' }}>{desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clean Trust Points */}
          <div className="flex flex-wrap gap-x-5 gap-y-2" style={{ position: 'relative', zIndex: 1, marginTop: '30px' }}>
            {trustPoints.map(({ label, Icon }) => (
              <span key={label} className="flex items-center gap-1.5 text-subtle" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                <Icon size={13} style={{ color: 'var(--primary)' }} /> {label}
              </span>
            ))}
          </div>
        </aside>

        {/* ───────────── Form Panel (Customer Login) ───────────── */}
        <div className="flex flex-col items-center justify-center" style={{ padding: '40px 24px', background: 'var(--bg)' }}>
          {/* Central Logo Above Card (Marketing & Clean UI) */}
          <div className="flex flex-col items-center gap-2" style={{ marginBottom: '24px' }}>
            <div
              style={{
                width: 50, height: 50, borderRadius: 'var(--radius-lg)',
                background: 'var(--grad-primary)', padding: 2,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '100%', height: '100%', borderRadius: 'calc(var(--radius-lg) - 2px)',
                  background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img src={logo} alt="TechCart Logo" style={{ width: 30, height: 30, objectFit: 'contain' }} />
              </div>
            </div>
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              TechCart Support
            </span>
          </div>

          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '28px 28px', background: 'var(--surface)', boxShadow: 'var(--shadow-md)' }}>
            <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Sign In</h2>
            <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>
              Enter your Customer ID to access your ongoing support thread.
            </p>

            <form onSubmit={submit} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="login-identifier" className="field-label" style={{ fontSize: '0.75rem' }}>Customer ID or Email</label>
                <input
                  id="login-identifier"
                  className={`input${error ? ' input-error' : ''}`}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="CUST-IN-001 or name@email.com"
                  disabled={loading}
                  style={{ height: '42px', fontSize: '0.875rem' }}
                />
              </div>

              {error && (
                <div
                  className="fade-in"
                  role="alert"
                  style={{
                    marginBottom: '16px', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--error-tint)', border: '1px solid var(--error)',
                    fontSize: '0.75rem', fontWeight: 500, color: 'var(--error)',
                  }}
                >
                  {error}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', height: '42px' }} disabled={loading || !identifier.trim()}>
                {loading ? (<><Loader2 size={16} className="animate-spin" /> Signing in…</>) : (<>Sign In <ArrowRight size={16} /></>)}
              </button>
            </form>

            {/* Redesigned Compact Quick Access Selector */}
            <div style={{ marginTop: '24px' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                <span className="eyebrow" style={{ whiteSpace: 'nowrap', fontSize: '0.625rem' }}>Quick access Demo Accounts</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoCustomers.map(({ name, id, note, Icon, grad }) => {
                  const active = identifier === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setIdentifier(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', cursor: 'pointer', textAlign: 'left', width: '100%',
                        background: active ? 'var(--primary-tint)' : 'var(--surface)',
                        border: active ? '1.5px solid var(--primary-border)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span
                        className="avatar-gradient"
                        style={{ background: grad, width: 24, height: 24, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <Icon size={11} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                        <span className="text-mono" style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{id}</span>
                      </span>
                      {active && (
                        <span
                          className="flex items-center justify-center"
                          style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)', color: '#fff', flexShrink: 0 }}
                        >
                          <Check size={9} strokeWidth={3.5} />
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
