import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  EyeOff,
  MessageSquare,
  User,
  Bookmark,
  ShoppingBag,
  Flame,
  Sparkles
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

const mainNavItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/anonymous', icon: EyeOff, label: 'Anonymous', special: true },
  { path: '/confessions', icon: Flame, label: 'Confessions', specialConfession: true },
  { path: '/make-friend', icon: Sparkles, label: 'Make Friend', specialFriend: true },
  { path: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { path: '/profile', icon: User, label: 'Profile', isProfile: true },
];

export const MobileNav = () => {
  const location = useLocation();
  const { user, unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (itemPath) => {
    return location.pathname === itemPath;
  };

  const quickActions = [
    { label: 'Saved Bookmarks', desc: 'View saved posts & discussions', link: '/saved-posts', icon: Bookmark, color: 'bg-amber-500' },
    { label: 'Post Anonymously', desc: 'Share confessions or thoughts safely', link: '/anonymous', icon: EyeOff, color: 'bg-purple-600' },
    { label: 'Make a Friend', desc: 'Find your campus vibe twins', link: '/make-friend', icon: Sparkles, color: 'bg-gradient-to-r from-vandal-pink to-topic-violet' },
    { label: 'Create Feed Post', desc: 'Share updates on campus', link: '/home', icon: MessageSquare, color: 'bg-primary-500' },
    { label: 'Sell on Market', desc: 'List old books or devices', link: '/marketplace', icon: ShoppingBag, color: 'bg-emerald-500' },
  ];

  return (
    <>
      <nav id="mobile-nav" className="fixed bottom-3.5 left-3 right-3 sm:bottom-5 sm:left-6 sm:right-6 lg:hidden z-40 max-w-xl mx-auto pointer-events-none">
        <div className="flex items-center pointer-events-auto w-full">
          {/* Merged Single Floating Glass Bar */}
          <div className="w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 rounded-full px-2 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-between transition-all">
            {mainNavItems.map(({ path, icon: Icon, label, special, specialConfession, specialFriend, badge, isProfile }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex-1 flex flex-col items-center justify-center gap-[2px] py-1 px-1 rounded-full transition-all duration-200 relative min-w-0 ${
                    active
                      ? special
                        ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
                        : specialConfession
                        ? 'text-rose-600 dark:text-rose-400 font-bold scale-105'
                        : specialFriend
                        ? 'text-vandal-pink font-bold scale-105'
                        : 'text-primary-600 dark:text-primary-400 font-bold scale-105'
                      : special
                      ? 'text-purple-400/80 dark:text-purple-400/80 hover:text-purple-500'
                      : specialConfession
                      ? 'text-rose-400/80 dark:text-rose-400/80 hover:text-rose-500'
                      : specialFriend
                      ? 'text-vandal-pink/80 hover:text-vandal-pink font-semibold'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  aria-label={label}
                >
                  {/* Active background glow */}
                  {active && (
                    <span
                      className={`absolute inset-0 rounded-full -z-10 opacity-15 dark:opacity-25 transition-all ${
                        special
                          ? 'bg-purple-500'
                          : specialConfession
                          ? 'bg-rose-500'
                          : specialFriend
                          ? 'bg-vandal-pink'
                          : 'bg-primary-500'
                      }`}
                    />
                  )}

                  <div className="relative flex items-center justify-center flex-shrink-0 min-w-[24px] min-h-[24px]">
                    {isProfile && user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'Profile'}
                        className={`w-5 h-5 rounded-full object-cover border transition-all ${
                          active
                            ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-500/40'
                            : 'border-neutral-300 dark:border-neutral-700'
                        } flex-shrink-0`}
                      />
                    ) : (
                      <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200" />
                    )}

                    {badge && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-0.5 bg-primary-500 text-white font-extrabold text-[8px] rounded-full flex items-center justify-center ring-1 ring-white dark:ring-neutral-900 shadow-md shadow-primary-500/30 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>

                  <span className="text-[9px] tracking-tight truncate w-full text-center font-medium leading-none mt-[1px]">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Quick Actions sheet */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Quick Campus Action" size="sm">
        <div className="space-y-md">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-md">
            Shortcut menu to post anonymously, create feeds, or sell items.
          </p>
          <div className="grid grid-cols-1 gap-md">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <Link
                  key={act.label}
                  to={act.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-lg p-md hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-800 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${act.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">{act.label}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs">{act.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <Button variant="secondary" className="w-full mt-lg" onClick={() => setIsOpen(false)}>
            Close Menu
          </Button>
        </div>
      </Modal>
    </>
  );
};
