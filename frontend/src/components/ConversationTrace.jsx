export default function ConversationTrace({ events }) {
  const counts = events.reduce(
    (acc, event) => {
      if (event.type === 'routing') acc.routing += 1;
      if (event.type === 'tool_start') acc.tools += 1;
      if (event.type === 'error') acc.errors += 1;
      return acc;
    },
    { routing: 0, tools: 0, errors: 0 },
  );

  return (
    <section className="glass-card" style={{ padding: '20px' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Live Trace</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Routing, tools, and recovery events</p>
        </div>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            background: counts.errors ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            color: counts.errors ? '#fca5a5' : '#86efac',
          }}
        >
          {counts.errors ? 'Error' : 'Healthy'}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          <span className="block text-lg gradient-text">{counts.routing}</span>Routes
        </div>
        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          <span className="block text-lg gradient-text">{counts.tools}</span>Tools
        </div>
        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          <span className="block text-lg gradient-text">{counts.errors}</span>Errors
        </div>
      </div>
      <div className="mt-4 max-h-[58vh] space-y-2 overflow-auto pr-2">
        {events.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tool and routing events appear here during a run.</p>}
        {events.map((event, index) => (
          <div key={`${event.type}-${index}`} className="rounded-lg p-3" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', fontSize: '0.8125rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{event.type}</p>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '2px', wordBreak: 'break-word' }}>{event.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
