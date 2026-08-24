import { Link, useLocation } from 'react-router-dom';
import { Map, LayoutDashboard, FileText, Zap } from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { to: '/',          label: 'Home',      Icon: Zap },
  { to: '/report',    label: 'Report',    Icon: FileText },
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/map',       label: 'Live Map',  Icon: Map },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 glass border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg group-hover:animate-glow transition-all">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            NA<span className="text-brand-400">SMR</span>
          </span>
          <span className="hidden sm:block text-xs text-dark-muted font-medium ml-1 mt-0.5">
            Civic Intelligence
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="live-dot" />
          <span className="hidden sm:block text-green-400 font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
