import ChatWidget from '../components/ChatWidget.jsx';

export default function CustomerChat({ customer }) {
  return (
    <div
      className="aurora"
      style={{
        height: 'calc(100vh - var(--nav-height))',
        minHeight: 0,
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      <div className="aurora-orbs" aria-hidden="true">
        <span className="orb-cyan" />
      </div>
      <div
        className="flex flex-1"
        style={{ height: '100%', minHeight: 0, position: 'relative', zIndex: 1 }}
      >
        <ChatWidget customer={customer} />
      </div>
    </div>
  );
}
