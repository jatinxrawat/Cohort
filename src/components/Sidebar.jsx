import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  MessageSquare,
  EyeOff,
  Search,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/anonymous', label: 'Anonymous', icon: EyeOff, special: true },
  { path: '/messages', label: 'Messages', icon: MessageSquare, badge: true },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
];

export const Sidebar = () => {
  const location = useLocation();
  const { logout, hasUnreadMessages } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 z-20">
      <nav className="flex-1 p-lg space-y-xs overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon, special, badge }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-md px-lg py-md rounded-xl transition-all relative ${
              isActive(path)
                ? special
                  ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold'
                : special
                ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-semibold'
                : 'text-neutral-700 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon className="w-5 h-5" />
              {badge && hasUnreadMessages && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
              )}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 p-lg space-y-xs">
        <Link
          to="/profile"
          className={`flex items-center gap-md px-lg py-md rounded-xl transition-colors ${
            isActive('/profile')
              ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-neutral-700 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-medium">Profile</span>
        </Link>
        <Link
          to="/settings"
          className={`flex items-center gap-md px-lg py-md rounded-xl transition-colors ${
            isActive('/settings')
              ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-neutral-700 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-md px-lg py-md text-danger hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
