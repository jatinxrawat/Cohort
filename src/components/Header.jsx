import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Bell, MessageSquare, Search, LogOut, Sun, Moon, Sparkles, Users, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/Button';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, hasUnreadMessages, unreadCount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      let count = 0;
      snapshot.forEach(d => {
        const data = d.data();
        if ((!data.recipientUid || data.recipientUid === user.uid) && !data.read) {
          count++;
        }
      });
      setUnreadNotifs(count);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
      <div className="w-full px-md sm:px-lg py-sm flex items-center justify-between">
        {/* Brand Logo - Cohort (First Photo Style) */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d946ef] via-[#8b5cf6] to-[#0ea5e9] text-white flex items-center justify-center font-display font-black text-xl shadow-lg shadow-purple-500/25 transition-transform duration-200 group-hover:scale-105">
            C
          </div>
          <span className="font-display font-black text-2xl tracking-tight text-neutral-900 dark:text-white flex items-baseline">
            Cohort<span className="text-[#ff2a85] font-black text-2xl ml-0.5">.</span>
          </span>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-lg">
            <Link to="/search" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 p-md rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </Link>
            <Link to="/notifications" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 p-md rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-pulse">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </Link>
            <Link to="/messages" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 p-md rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 relative" aria-label="Messages">
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-primary-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-md">
          <button
            onClick={toggleTheme}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 p-md rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-md">
              <Link to="/profile" className="flex items-center gap-md px-md py-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-primary-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:inline">{user?.name?.split(' ')[0] || 'User'}</span>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-md">
              <Link to="/signup">
                <Button variant="primary" size="md">Signup</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-neutral-600 dark:text-neutral-400 p-md rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 md:hidden">
            <div className="p-lg space-y-md">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/search"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-md p-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-md p-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-md p-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative"
                  >
                    <div className="relative">
                      <MessageSquare className="w-5 h-5" />
                      {hasUnreadMessages && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
                      )}
                    </div>
                    <span>Messages</span>
                  </Link>
                  <Link
                    to="/saved-posts"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-md p-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <Bookmark className="w-5 h-5 text-amber-500" />
                    <span>Saved</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-md p-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-md p-md text-danger hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-md">
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button variant="primary" className="w-full">Signup</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
