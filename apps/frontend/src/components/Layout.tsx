import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';
import { logoutApi } from '../api/auth.api';

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore API errors on logout
    }
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    color: isActive ? '#fff' : '#c7d2fe',
    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
    fontWeight: '500' as const,
    fontSize: '14px',
    transition: 'all 0.2s',
    textDecoration: 'none',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{
        width: '240px',
        background: 'linear-gradient(180deg, #4f46e5 0%, #3730a3 100%)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '32px', paddingLeft: '16px' }}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>🗄️ FileVault360</div>
          <div style={{ fontSize: '12px', color: '#a5b4fc', marginTop: '2px' }}>Cloud File Management</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink to="/" end style={navLinkStyle}>
            🏠 Dashboard
          </NavLink>
          <NavLink to="/files" style={navLinkStyle}>
            📁 My Files
          </NavLink>
          <NavLink to="/shared" style={navLinkStyle}>
            🔗 Shared Files
          </NavLink>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <div style={{ color: '#c7d2fe', fontSize: '13px', paddingLeft: '16px', marginBottom: '8px' }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </nav>

      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '32px',
        overflowY: 'auto',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
