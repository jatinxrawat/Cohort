import React, { useState } from 'react';
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
  User,
  Bookmark,
  Flame,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';

const navItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/make-friend', label: 'Make a Friend', icon: Sparkles, specialFriend: true },
  { path: '/anonymous', label: 'Anonymous', icon: EyeOff, special: true },
  { path: '/confessions', label: 'Confessions', icon: Flame, specialConfession: true },
  { path: '/messages', label: 'Messages', icon: MessageSquare, badge: true },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { path: '/saved-posts', label: 'Saved', icon: Bookmark },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, logout, hasUnreadMessages, unreadCount } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] bg-white dark:bg-black border-none z-40 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64 shadow-2xl' : 'w-20'
      }`}
    >
      <nav className="flex-1 p-md space-y-xs overflow-y-auto overflow-x-hidden">
        {navItems.map(({ path, label, icon: Icon, special, specialConfession, specialFriend, badge }) => (
          <Link
            key={path}
            to={path}
            title={!isExpanded ? label : undefined}
            className={`flex items-center gap-md px-md py-md rounded-xl transition-all relative ${
              isActive(path)
                ? special
                  ? 'bg-purple-500/20 dark:bg-purple-500/25 text-purple-300 border border-purple-500/40 font-bold shadow-[0_0_15px_rgba(168,85,247,0.25)] backdrop-blur-md'
                  : specialConfession
                  ? 'bg-rose-500/20 dark:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold shadow-[0_0_15px_rgba(244,63,94,0.25)] backdrop-blur-md'
                  : specialFriend
                  ? 'bg-gradient-to-r from-pink-500/25 via-rose-500/20 to-purple-500/25 text-pink-300 border border-pink-500/40 font-bold shadow-[0_0_18px_rgba(236,72,153,0.3)] backdrop-blur-md'
                  : 'bg-primary-500/15 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 border border-primary-500/30 font-semibold backdrop-blur-md'
                : special
                ? 'text-purple-300 dark:text-purple-300 hover:bg-purple-500/10 font-semibold'
                : specialConfession
                ? 'text-rose-400 dark:text-rose-400 hover:bg-rose-500/10 font-semibold'
                : specialFriend
                ? 'text-pink-400 dark:text-pink-300 hover:bg-pink-500/10 font-bold'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            } ${!isExpanded ? 'justify-center' : ''}`}
          >
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
              {badge && unreadCount > 0 && !isExpanded && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 bg-primary-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-md shadow-primary-500/30 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'
              }`}
            >
              {label}
            </span>

            {badge && unreadCount > 0 && isExpanded && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-primary-500 text-white font-extrabold text-xs rounded-full flex items-center justify-center shadow-md shadow-primary-500/30 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-md space-y-xs">
        <Link
          to="/profile"
          title={!isExpanded ? 'Profile' : undefined}
          className={`flex items-center gap-md px-md py-md rounded-xl transition-colors ${
            isActive('/profile')
              ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-neutral-700 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          } ${!isExpanded ? 'justify-center' : ''}`}
        >
          <UserAvatar
            src={user?.avatar}
            name={user?.name || 'Profile'}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
          <span
            className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'
            }`}
          >
            Profile
          </span>
        </Link>
        <Link
          to="/settings"
          title={!isExpanded ? 'Settings' : undefined}
          className={`flex items-center gap-md px-md py-md rounded-xl transition-colors ${
            isActive('/settings')
              ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-neutral-700 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          } ${!isExpanded ? 'justify-center' : ''}`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span
            className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'
            }`}
          >
            Settings
          </span>
        </Link>
        <button
          onClick={logout}
          title={!isExpanded ? 'Logout' : undefined}
          className={`w-full flex items-center gap-md px-md py-md text-danger hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors font-medium text-sm ${
            !isExpanded ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};
