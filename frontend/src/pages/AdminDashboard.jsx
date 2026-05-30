import AdminPanel from '../components/AdminPanel.jsx';

export default function AdminDashboard() {
  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-height))', background: 'var(--bg)' }}>
      <AdminPanel />
    </div>
  );
}
