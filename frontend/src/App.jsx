import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MessagesSquare, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';
import logo from './assets/techcart-logo.png';
import CustomerChat from './pages/CustomerChat.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LoginPage from './components/LoginPage.jsx';
import useTheme from './useTheme.js';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
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
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ─── Top Navigation ─── */}
      <nav className="nav-shell">
        <div
          className="mx-auto flex items-center justify-between gap-3 px-6"
          style={{ maxWidth: 'var(--content-max)', minHeight: 'var(--nav-height)' }}
        >
          <button
            onClick={() => navigate(customer ? '/chat' : '/')}
            className="flex items-center gap-3"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <img src={logo} alt="TechCart" style={{ height: '36px', width: '36px', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <p className="font-display" style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.15 }}>
                TechCart AI
              </p>
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', fontWeight: 500 }}>
                Intelligent Support
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {customer && (
              <div
                className="hidden sm:flex items-center gap-2 rounded-lg px-3"
                style={{ height: '38px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700,
                    color: 'var(--primary-fg)', flexShrink: 0,
                  }}
                >
                  {customer.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.8125rem' }}>{customer.name}</span>
                <span className="text-mono" style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', paddingLeft: '8px', borderLeft: '1px solid var(--border)' }}>
                  {customer.customer_id}
                </span>
              </div>
            )}

            {/* Page toggle */}
            <div className="nav-toggle" role="tablist" aria-label="Switch view">
              <button
                role="tab"
                aria-selected={isChat}
                className={isChat ? 'active' : ''}
                onClick={() => navigate(customer ? '/chat' : '/')}
              >
                <span className="hidden sm:inline">Chat</span>
                <MessagesSquare size={16} className="sm:hidden" />
              </button>
              <button
                role="tab"
                aria-selected={isAdmin}
                className={isAdmin ? 'active' : ''}
                onClick={() => navigate('/admin')}
              >
                <span className="hidden sm:inline">Admin</span>
                <LayoutDashboard size={16} className="sm:hidden" />
              </button>
            </div>

            <button
              className="btn-icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {customer && (
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
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
