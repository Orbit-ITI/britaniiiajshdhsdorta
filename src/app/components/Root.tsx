import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MapIcon, User, Briefcase, LogOut, Shield, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, GOV_ROLES } from '../../lib/types';

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isGov = profile && GOV_ROLES.includes(profile.role);

  return (
    <div className="min-h-screen bg-[#2d5016] text-white" style={{ fontFamily: "'Press Start 2P', cursive" }}>
      <header className="bg-[#1a3010] border-b-4 border-[#0f1e09] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-[#c7a565] border-4 border-[#8b7355] flex items-center justify-center text-2xl">🏰</div>
              <div>
                <h1 className="text-xs md:text-sm text-[#ffd700]">Британская Империя</h1>
                <p className="text-[7px] md:text-[9px] text-gray-300 mt-1">Государственный портал</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {user && profile ? (
                <>
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[9px] text-white">{profile.nickname}</span>
                    <span className="text-[7px] text-gray-400">{ROLE_LABELS[profile.role]}</span>
                  </div>
                  <button onClick={handleLogout} title="Выйти" className="bg-[#2d5016] border-2 border-[#4a7c1f] hover:border-red-500 hover:bg-red-900/30 transition-all p-2">
                    <LogOut size={14} className="text-gray-400" />
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-[#4a7c1f] border-2 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[8px] px-3 py-2">ВОЙТИ</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-[#1f4012] border-b-4 border-[#0f1e09] sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-1 py-3 overflow-x-auto">
            {[
              { to: '/', icon: Home, label: 'Главная', show: true },
              { to: '/map', icon: MapIcon, label: 'Карта', show: true },
              { to: '/services', icon: Briefcase, label: 'Услуги', show: true },
              { to: '/profile', icon: User, label: 'Профиль', show: !!user },
              { to: '/notifications', icon: Bell, label: 'Уведомления', show: !!user },
              { to: '/admin', icon: Shield, label: 'Управление', show: !!isGov },
            ].filter(l => l.show).map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className={`flex items-center gap-2 px-3 py-2 border-2 transition-all text-[8px] whitespace-nowrap ${isActive(to) && (to !== '/' || location.pathname === '/') ? 'bg-[#8b7355] border-[#5a4a3a] text-[#ffd700]' : 'bg-[#4a7c1f] border-[#2d5016] hover:bg-[#5a8c2f] text-white'}`}>
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 animate-fade-in">
        <Outlet />
      </main>

      <footer className="bg-[#1a3010] border-t-4 border-[#0f1e09] mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-[7px] md:text-[9px] text-gray-500">© 2026 Британская Империя. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
