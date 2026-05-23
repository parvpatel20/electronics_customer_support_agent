import React from 'react';

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
      <section style={{ padding: '60px 20px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9375rem' }}>
          The support UI hit an unexpected error. Reload the page or come back in a moment.
        </p>
        <pre
          style={{
            marginTop: '20px',
            padding: '16px',
            background: 'var(--color-surface-2)',
            borderRadius: '12px',
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            textAlign: 'left',
            overflow: 'auto',
            maxHeight: '160px',
          }}
        >
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button
          className="btn-primary"
          style={{ marginTop: '20px' }}
          onClick={() => {
            this.reset();
            if (typeof window !== 'undefined') window.location.reload();
          }}
        >
          Reload
        </button>
      </section>
    );
  }
}
