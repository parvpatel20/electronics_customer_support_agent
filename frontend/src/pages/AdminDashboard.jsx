import AdminPanel from '../components/AdminPanel.jsx';

export default function AdminDashboard() {
  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 57px)', overflow: 'hidden' }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-100px', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '45%', left: '40%', width: '500px', height: '280px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(22,37,88,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminPanel />
      </div>
    </div>
  );
}
