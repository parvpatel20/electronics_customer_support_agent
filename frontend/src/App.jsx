import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Sun, Moon, Sparkles } from 'lucide-react';
import logo from './assets/techcart-logo.png';
import CustomerChat from './pages/CustomerChat.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LoginPage from './components/LoginPage.jsx';
import useTheme from './useTheme.js';
import useKeepAlive from './useKeepAlive.js';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  useKeepAlive(true);
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
  const showChrome = customer || isAdmin;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ─── Top Navigation ─── */}
      {showChrome && (
        <nav className="nav-shell">
          <div
            className="mx-auto flex items-center justify-between gap-3 px-4 sm:px-6"
            style={{ maxWidth: 'var(--content-max)', minHeight: 'var(--nav-height)' }}
          >
            <button
              onClick={() => navigate(customer ? '/chat' : '/')}
              className="flex items-center gap-3"
              style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, minWidth: 0 }}
            >
              <div
                className="relative"
                style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--grad-primary)', padding: 2,
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <div
                  style={{
                    width: '100%', height: '100%', borderRadius: 'calc(var(--radius-md) - 2px)',
                    background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img src={logo} alt="TechCart" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <p
                  className="font-display"
                  style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
                >
                  TechCart <span className="gradient-text">AI</span>
                </p>
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', fontWeight: 500 }}>
                  AI Support Portal
                </span>
              </div>
            </button>

            <div className="flex items-center gap-2 sm:gap-3" style={{ flexShrink: 0 }}>
              {customer && (
                <div
                  className="hidden md:flex items-center gap-2"
                  style={{
                    height: 40, padding: '0 12px 0 6px', borderRadius: 'var(--radius-full)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="avatar-gradient"
                    style={{
                      background: 'var(--grad-primary)',
                      width: 28, height: 28, fontSize: '0.75rem',
                    }}
                  >
                    {customer.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.8125rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customer.name}
                  </span>
                  <span
                    className="text-mono"
                    style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', paddingLeft: '8px', borderLeft: '1px solid var(--border)', flexShrink: 0 }}
                  >
                    {customer.customer_id}
                  </span>
                </div>
              )}



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
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

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
