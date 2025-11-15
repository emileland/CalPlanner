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

  const navClassName = ({ isActive }) => (isActive ? 'app-nav__link is-active' : 'app-nav__link');

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-header__brand">
          <p className="logo-text">CalPlanner</p>
        </div>
        <nav className="app-nav">
          <NavLink to="/app/projects" className={navClassName}>
            Mes projets
          </NavLink>
        </nav>
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

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
