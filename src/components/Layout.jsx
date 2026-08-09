import React, { useEffect } from 'react';
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
  const isAuthPage = location.pathname === '/signup' || location.pathname === '/login' || location.pathname === '/forgot-password';
  const isMessagesPage = location.pathname === '/messages';
  const isCommunityPage = location.pathname === '/community';
  const isChatRoute = isMessagesPage || isCommunityPage;

  useEffect(() => {
    if (!isChatRoute) {
      document.documentElement.classList.remove('chat-active', 'in-active-chat');
      document.body.classList.remove('chat-active', 'in-active-chat');
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      return;
    }

    document.documentElement.classList.add('chat-active');
    document.body.classList.add('chat-active');

    const handleScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      document.documentElement.classList.remove('chat-active', 'in-active-chat');
      document.body.classList.remove('chat-active', 'in-active-chat');
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isChatRoute, location.pathname]);

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[#edf4ed] dark:bg-neutral-950 font-sans overflow-x-hidden">
        <main className="w-full">
          {children}
        </main>
        <UsernameModal />
        <ToastContainer notifications={notifications} />
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-black font-sans">
        <main className="w-full h-full overflow-hidden">
          {children}
        </main>
        <UsernameModal />
        <ToastContainer notifications={notifications} />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-white dark:bg-neutral-900 ${
        isChatRoute
          ? 'fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] max-w-[100vw] z-10 overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      <div className={isChatRoute ? 'hidden md:block sticky top-0 z-50' : 'block sticky top-0 z-50'}>
        <Header />
      </div>
      
      <div className={`flex flex-1 ${isChatRoute ? 'overflow-hidden min-h-0 h-full w-full' : 'w-full'}`}>
        {isAuthenticated && <Sidebar />}
        
        <main className={`flex-1 ${isChatRoute ? 'overflow-hidden h-full w-full' : 'min-h-screen'} ${isAuthenticated ? 'lg:ml-20' : ''} ${isChatRoute ? 'pb-0' : 'pb-24 lg:pb-0'}`}>
          {children}
        </main>
      </div>

      {isAuthenticated && (
        <MobileNav />
      )}
      <UsernameModal />
      <ToastContainer notifications={notifications} />
    </div>
  );
};
