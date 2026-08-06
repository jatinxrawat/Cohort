import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  EyeOff,
  MessageSquare,
  User,
  Users,
  ShoppingBag
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

const mobileNavItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/anonymous', icon: EyeOff, label: 'Anonymous', special: true },
  { path: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const MobileNav = () => {
  const location = useLocation();
  const { hasUnreadMessages, unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const quickActions = [
    { label: 'Post Anonymously', desc: 'Share confessions or thoughts safely', link: '/anonymous', icon: EyeOff, color: 'bg-purple-600' },
    { label: 'Create Feed Post', desc: 'Share updates on campus', link: '/home', icon: MessageSquare, color: 'bg-primary-500' },
    { label: 'Community Hub', desc: 'Connect with your college', link: '/community', icon: Users, color: 'bg-indigo-500' },
    { label: 'Sell on Market', desc: 'List old books or devices', link: '/marketplace', icon: ShoppingBag, color: 'bg-emerald-500' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 z-40 shadow-2xl px-xs">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map(({ path, icon: Icon, label, special, badge }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-[2px] py-xs px-2 rounded-xl transition-all relative ${
                isActive(path)
                  ? special
                    ? 'text-purple-500 font-bold scale-105'
                    : 'text-primary-500 dark:text-primary-400 font-bold'
                  : special
                  ? 'text-purple-400/80 hover:text-purple-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              aria-label={label}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 bg-primary-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-md shadow-primary-500/30 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{label}</span>
            </Link>
          ))}
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
