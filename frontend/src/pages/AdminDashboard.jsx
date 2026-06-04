import AdminPanel from '../components/AdminPanel.jsx';

export default function AdminDashboard() {
  return (
    <div
      className="aurora"
      style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      <div className="aurora-orbs" aria-hidden="true">
        <span className="orb-cyan" />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminPanel />
      </div>
    </div>
  );
}
