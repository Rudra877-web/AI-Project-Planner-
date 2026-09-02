import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-signal font-mono text-xs font-bold text-white">
              bf
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">BuildFlow</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/new"
              className="hidden items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal-dark sm:inline-flex"
            >
              <Plus size={15} /> New project
            </Link>
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-soft text-sm font-semibold text-signal-dark"
              >
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-line bg-panel py-1 text-sm shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <p className="truncate px-3 py-2 text-xs text-ink-soft">{user?.email}</p>
                  <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-ink hover:bg-line-soft">
                    <Settings size={14} /> Account settings
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-rust hover:bg-rust-soft"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
