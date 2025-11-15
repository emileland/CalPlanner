import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="logo-text">CalPlanner</p>
          <p className="logo-subtitle">Optimisez vos semaines en un clin d’œil</p>
        </div>
        <div className="header-actions">
          <p className="user-chip">
            <span className="user-chip__name">{user?.username}</span>
            <span className="user-chip__email">{user?.email}</span>
          </p>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="app-shell__body">
        <aside className="sidebar">
          <NavLink to="/app/projects" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            Mes projets
          </NavLink>
        </aside>
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
