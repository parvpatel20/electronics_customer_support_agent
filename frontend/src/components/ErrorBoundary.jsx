import React from 'react';
import { AlertTriangle, RotateCw, Sparkles } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined' && window.console) {
      // eslint-disable-next-line no-console
      console.error('UI error boundary caught', error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section
        className="aurora"
        style={{
          minHeight: 'calc(100vh - var(--nav-height))', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '64px 20px',
        }}
      >
        <div className="aurora-orbs" aria-hidden="true">
          <span className="orb-cyan" />
        </div>
        <div
          className="card-glass scale-in"
          style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <div
            className="mx-auto flex items-center justify-center float"
            style={{
              width: 64, height: 64, borderRadius: 'var(--radius-lg)',
              background: 'var(--grad-primary)', color: '#fff',
              boxShadow: 'var(--shadow-glow)', marginBottom: '20px',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <div
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              background: 'var(--primary-tint)', border: '1px solid var(--primary-border)',
              color: 'var(--primary)', fontSize: '0.6875rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: '14px',
            }}
          >
            <Sparkles size={12} /> Something went sideways
          </div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Unexpected</span> error
          </h1>
          <p className="text-muted" style={{ marginTop: '10px', fontSize: '0.9375rem' }}>
            The support UI hit an unexpected error. Reload the page or come back in a moment.
          </p>
          <pre
            className="text-mono"
            style={{
              marginTop: '20px',
              padding: '14px 16px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '160px',
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => {
              this.reset();
              if (typeof window !== 'undefined') window.location.reload();
            }}
          >
            <RotateCw size={16} /> Reload
          </button>
        </div>
      </section>
    );
  }
}
