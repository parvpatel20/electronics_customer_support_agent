import ChatWidget from '../components/ChatWidget.jsx';

export default function CustomerChat({ customer }) {
  return (
    <div className="flex flex-1" style={{ height: 'calc(100vh - var(--nav-height))', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-140px', right: '-80px', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '-120px', width: '460px', height: '460px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', top: '30%', left: '45%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flex: 1, minHeight: 0 }}>
        <ChatWidget customer={customer} />
      </div>
    </div>
  );
}
