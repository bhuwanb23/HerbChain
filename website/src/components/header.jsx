import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 text-sm font-medium text-gray-100 hover:text-white"
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="inline-block h-6 w-6 rounded bg-indigo-500"></span>
            <span className="font-semibold">HerbChain Admin</span>
          </Link>

          {isLoggedIn ? (
            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/trace">Traceability</NavLink>
              <NavLink to="/compliance">Compliance</NavLink>
              <NavLink to="/recall">Alerts & Recall</NavLink>
              <NavLink to="/reports">Reports</NavLink>
              <NavLink to="/incentives">Incentives</NavLink>
              <NavLink to="/support">Support</NavLink>
              {user?.role === 'admin' && <NavLink to="/users">Users</NavLink>}
              {user?.role === 'admin' && <NavLink to="/blockchain">Blockchain</NavLink>}
              {user?.role === 'admin' && <NavLink to="/investigations">Investigations</NavLink>}
              {user?.role === 'admin' && <NavLink to="/integrations">Integrations</NavLink>}
              <NavLink to="/settings">Settings</NavLink>

              <div className="relative ml-2">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
                >
                  <span className="font-semibold">
                    {user?.name?.[0]?.toUpperCase() || user?.role?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="hidden sm:inline">{user?.name || user?.user_id}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-30">
                    <div className="p-3 border-b">
                      <div className="text-sm font-semibold">{user?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{user?.role}</div>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={onLogout}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-4">
              <NavLink to="/trace">Traceability</NavLink>
              <Link
                to="/login"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Sign in
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
