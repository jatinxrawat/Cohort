import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, MessageSquare, Search, LogOut, Sun, Moon, Sparkles, Users, Bookmark, Settings as SettingsIcon, BookOpen, Send, ShoppingBag, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/UserAvatar';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import DownloadAppModal from '@/components/DownloadAppModal';

export const Header = () => {
  const location = useLocation();
  const isProfilePage = location.pathname.startsWith('/profile');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, hasUnreadMessages, unreadCount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      let count = 0;
      snapshot.forEach(d => {
        const data = d.data();
        const isForMe = data.recipientUid === user.uid || data.recipientUid === 'all' || !data.recipientUid;
        if (isForMe && !data.read) {
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
    <>
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-black border-none shadow-none transition-all duration-300 pt-safe">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand Logo - Cohort */}
        <Logo isLanding={false} iconSize="w-9 h-9" textSize="text-2xl" />

        {/* Desktop Quick Nav */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/search"
              className="p-2.5 text-neutral-600 dark:text-neutral-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 rounded-full transition-all duration-200 cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              to="/notifications"
              className="p-2.5 text-neutral-600 dark:text-neutral-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all duration-200 relative cursor-pointer"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-4.5 px-1 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950 animate-pulse shadow-sm">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </Link>
            <Link
              to="/messages"
              className="p-2.5 text-neutral-600 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all duration-200 relative cursor-pointer"
              aria-label="Messages"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-4.5 px-1 bg-sky-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950 animate-pulse shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/uncut"
              className="flex flex-col items-center justify-center px-2.5 py-1 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-all duration-200 cursor-pointer"
              title="Cohort Uncut"
            >
              <BookOpen className="w-5 h-5 text-pink-500 dark:text-pink-400" />
              <span className="text-[8px] font-black tracking-wider leading-none mt-1 uppercase text-pink-500 dark:text-pink-400">UNCUT</span>
            </Link>
            {/* Download App — desktop nav */}
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              title="Download App"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-violet-600 dark:text-violet-400 text-xs font-bold bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 hover:border-violet-500/50 rounded-full shadow-sm hover:shadow-violet-500/20 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Download App</span>
            </button>
          </div>
        )}

        {/* Right Actions (Theme toggle, Search, Profile, Mobile Menu) */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <Link
                to="/search"
                className="md:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 rounded-full transition-all cursor-pointer"
                aria-label="Search"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </Link>
              <Link
                to="/notifications"
                className="md:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all relative cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950 animate-pulse">
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </span>
                )}
              </Link>
              <Link
                to="/messages"
                className="md:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all relative cursor-pointer"
                aria-label="Messages"
                title="Messages"
              >
                <Send className="w-6 h-6 rotate-12 stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-sky-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950 animate-pulse shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              {/* Download App — mobile */}
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                title="Download App"
                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-violet-600 dark:text-violet-400 text-[10px] font-bold bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 hover:border-violet-500/50 rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
                aria-label="Download App"
              >
                <Smartphone className="w-3 h-3" />
                <span>Download</span>
              </button>
            </>
          )}

          {/* Glowing Theme Toggle Button - hidden on mobile per layout requests */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden md:flex p-2.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 bg-neutral-100/80 dark:bg-neutral-900/80 hover:bg-amber-500/10 border border-neutral-200/60 dark:border-neutral-800/80 rounded-full transition-all duration-300 cursor-pointer shadow-xs active:scale-90 items-center justify-center"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="hidden md:flex items-center">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100/80 dark:bg-neutral-900/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-800/80 rounded-full transition-all cursor-pointer shadow-xs group"
              >
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 transition-colors">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/signup">
                <Button variant="primary" size="sm" className="rounded-full px-5">Signup</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button - only shown on Profile page */}
          {isProfilePage && (
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-neutral-700 dark:text-neutral-300 hover:text-sky-500 dark:hover:text-sky-400 bg-neutral-100/80 dark:bg-neutral-900/80 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-800/80 rounded-full transition-all duration-300 cursor-pointer shadow-xs active:scale-90 flex items-center justify-center ml-1"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-300" />
              )}
            </button>
          )}
        </div>

        {/* Translucent Glass Mobile Dropdown Overlay */}
        {isProfilePage && isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl md:hidden animate-in fade-in slide-in-from-top-3 duration-200 rounded-b-3xl">
            <div className="p-4 space-y-1.5">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/messages?tab=community"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 text-neutral-700 dark:text-neutral-200 hover:bg-purple-500/10 hover:text-purple-500 dark:hover:text-purple-400 rounded-2xl transition-all font-medium text-sm"
                  >
                    <Users className="w-5 h-5 text-purple-500" />
                    <span>Community</span>
                  </Link>
                  <Link
                    to="/saved-posts"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 text-neutral-700 dark:text-neutral-200 hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400 rounded-2xl transition-all font-medium text-sm"
                  >
                    <Bookmark className="w-5 h-5 text-amber-500" />
                    <span>Saved Posts</span>
                  </Link>
                  <Link
                    to="/marketplace"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 text-neutral-700 dark:text-neutral-200 hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-2xl transition-all font-medium text-sm"
                  >
                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                    <span>Marketplace</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 text-neutral-700 dark:text-neutral-200 hover:bg-sky-500/10 hover:text-sky-500 dark:hover:text-sky-400 rounded-2xl transition-all font-medium text-sm"
                  >
                    <SettingsIcon className="w-5 h-5 text-sky-500" />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl text-left font-medium text-sm transition-all cursor-pointer mt-1"
                  >
                    <LogOut className="w-5 h-5 text-rose-500" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="p-2">
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button variant="primary" className="w-full rounded-2xl">Signup</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>

    <DownloadAppModal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} />
    </>
  );
};
