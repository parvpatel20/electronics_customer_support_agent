import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

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
      <section style={{ padding: '64px 20px', maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
        <div
          className="mx-auto flex items-center justify-center"
          style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-lg)', background: 'var(--error-tint)', color: 'var(--error)', marginBottom: '16px' }}
        >
          <AlertTriangle size={26} />
        </div>
        <h1 className="h2">Something went wrong</h1>
        <p className="text-muted" style={{ marginTop: '10px', fontSize: '0.9375rem' }}>
          The support UI hit an unexpected error. Reload the page or come back in a moment.
        </p>
        <pre
          className="text-mono"
          style={{
            marginTop: '20px',
            padding: '16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
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
      </section>
    );
  }
}
