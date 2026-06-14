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
    <section className="fade-in aurora flex items-center justify-center" style={{ minHeight: 'calc(100vh - var(--nav-height))', position: 'relative', background: 'var(--bg)', padding: '24px 16px' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} aria-hidden="true" />

      {/* Centered Login Box */}
      <div className="flex flex-col items-center gap-6 relative" style={{ zIndex: 1, width: '100%', maxWidth: '420px' }}>
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <div
            style={{
              width: 46, height: 46, borderRadius: 'var(--radius-md)',
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
              <img src={logo} alt="TechCart Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
          </div>
          <span className="font-display" style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)' }}>
            TechCart <span className="gradient-text">AI</span>
          </span>
        </div>

        <div className="card" style={{ width: '100%', padding: '32px 28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
          <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Sign In</h2>
          <p className="text-subtle" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>
            Enter your Customer ID to access your support thread.
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

          {/* Quick Access Demo accounts */}
          <div style={{ marginTop: '24px' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
              <span className="eyebrow" style={{ whiteSpace: 'nowrap', fontSize: '0.625rem' }}>Demo Accounts</span>
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {demoCustomers.map(({ name, id, Icon, grad }) => {
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
                        style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', color: '#fff', flexShrink: 0 }}
                      >
                        <Check size={8} strokeWidth={4} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
