import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import CustomerChat from './pages/CustomerChat.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LoginPage from './components/LoginPage.jsx';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('techcart_customer') || 'null');
    } catch {
      return null;
    }
  });

  function handleLogin(nextCustomer) {
    setCustomer(nextCustomer);
    localStorage.setItem('techcart_customer', JSON.stringify(nextCustomer));
    navigate('/chat');
  }

  function handleLogout() {
    setCustomer(null);
    localStorage.removeItem('techcart_customer');
    navigate('/');
  }

  const isAdmin = location.pathname.startsWith('/admin');
  const isChat = location.pathname.startsWith('/chat');

  return (
    <main className="grid-texture min-h-screen" style={{ background: 'var(--color-surface-0)' }}>
      {/* ─── Top Navigation ─── */}
      <nav className="glass sticky top-0 z-50" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3">
          <button
            onClick={() => navigate(customer ? '/chat' : '/')}
            className="flex items-center gap-3 group"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-tech-orange), #ea580c)' }}
            >
              <span className="text-white text-lg font-black">T</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                TechCart AI
              </p>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: 500 }}>
                Intelligent Support
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {customer && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)' }}>
                <div className="h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>{customer.name}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{customer.customer_id}</span>
              </div>
            )}

            {/* Page toggle */}
            <div className="flex rounded-lg p-0.5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)' }}>
              <button
                className="rounded-md px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                style={{
                  background: isChat ? 'linear-gradient(135deg, var(--color-tech-orange), #ea580c)' : 'transparent',
                  color: isChat ? 'white' : 'var(--color-text-secondary)',
                }}
                onClick={() => navigate(customer ? '/chat' : '/')}
              >
                Chat
              </button>
              <button
                className="rounded-md px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                style={{
                  background: isAdmin ? 'linear-gradient(135deg, var(--color-tech-orange), #ea580c)' : 'transparent',
                  color: isAdmin ? 'white' : 'var(--color-text-secondary)',
                }}
                onClick={() => navigate('/admin')}
              >
                Admin
              </button>
            </div>

            {customer && (
              <button className="btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Routes ─── */}
      <Routes>
        <Route path="/" element={customer ? <Navigate to="/chat" replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/chat" element={customer ? <CustomerChat customer={customer} /> : <Navigate to="/" replace />} />
        <Route path="/chat/*" element={<Navigate to="/chat" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
