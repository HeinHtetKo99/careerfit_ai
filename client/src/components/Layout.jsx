import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { Button, LogoutIcon } from './ui';

const navLinkClass = ({ isActive }) =>
  `nav-pill ${isActive ? 'nav-pill-active' : ''}`;

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell relative">
      <header className="header-glass">
        <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Logo />

          <nav className="flex items-center gap-1">
            <NavLink to="/analyze" className={navLinkClass}>
              {t('nav.analyze')}
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              {t('nav.history')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="user-avatar">{getInitials(user?.name)}</span>
              <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">
                {user?.name}
              </span>
            </div>
            <Button variant="logout" size="sm" onClick={handleLogout} className="group">
              <LogoutIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
