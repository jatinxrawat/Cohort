import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { ToastContainer } from '@/components/Toast';
import { UsernameModal } from '@/components/UsernameModal';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

export const Layout = ({ children }) => {
  const { notifications } = useNotification();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isMessagesPage = location.pathname === '/messages';

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[#edf4ed] dark:bg-neutral-950 font-sans">
        <main className="w-full">
          {children}
        </main>
        <UsernameModal />
        <ToastContainer notifications={notifications} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
      <div className={isMessagesPage ? 'hidden md:block' : 'block'}>
        <Header />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        
        <main className={`flex-1 overflow-y-auto ${isAuthenticated ? 'lg:ml-20' : ''} ${isMessagesPage ? 'pb-0' : 'pb-16 lg:pb-0'}`}>
          {children}
        </main>
      </div>

      {isAuthenticated && (
        <div className={isMessagesPage ? 'hidden lg:block' : 'block'}>
          <MobileNav />
        </div>
      )}
      <UsernameModal />
      <ToastContainer notifications={notifications} />
    </div>
  );
};
