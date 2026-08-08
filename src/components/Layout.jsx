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
  const isCommunityPage = location.pathname === '/community';
  const isChatRoute = isMessagesPage || isCommunityPage;

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
    <div
      className={`flex flex-col bg-white dark:bg-neutral-900 overflow-hidden ${
        isChatRoute
          ? 'fixed inset-0 w-full h-full max-h-[100dvh] max-w-[100vw] z-10'
          : 'h-screen h-[100dvh]'
      }`}
    >
      <div className={isChatRoute ? 'hidden md:block' : 'block'}>
        <Header />
      </div>
      
      <div className="flex flex-1 overflow-hidden min-h-0 h-full w-full">
        {isAuthenticated && <Sidebar />}
        
        <main className={`flex-1 ${isChatRoute ? 'overflow-hidden h-full w-full' : 'overflow-y-auto'} ${isAuthenticated ? 'lg:ml-20' : ''} ${isChatRoute ? 'pb-0' : 'pb-16 lg:pb-0'}`}>
          {children}
        </main>
      </div>

      {isAuthenticated && (
        <div className={isChatRoute ? 'hidden lg:block' : 'block'}>
          <MobileNav />
        </div>
      )}
      <UsernameModal />
      <ToastContainer notifications={notifications} />
    </div>
  );
};
