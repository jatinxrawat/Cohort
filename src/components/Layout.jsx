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
  const isMessagesPage = location.pathname === '/messages';
  const isCommunityPage = location.pathname === '/community';
  const isChatRoute = isMessagesPage || isCommunityPage;

  useEffect(() => {
    if (!isChatRoute) {
      document.documentElement.classList.remove('chat-active');
      document.body.classList.remove('chat-active');
      return;
    }

    document.documentElement.classList.add('chat-active');
    document.body.classList.add('chat-active');

    const updateViewport = () => {
      if (window.visualViewport && window.innerWidth < 1024) {
        const vh = window.visualViewport.height;
        const vt = window.visualViewport.offsetTop;
        document.documentElement.style.setProperty('--vv-height', `${vh}px`);
        document.documentElement.style.setProperty('--vv-top', `${vt}px`);
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
      updateViewport();
    }

    window.addEventListener('scroll', updateViewport);

    return () => {
      document.documentElement.classList.remove('chat-active');
      document.body.classList.remove('chat-active');
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('scroll', updateViewport);
    };
  }, [isChatRoute]);

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
          ? 'fixed inset-x-0 top-0 w-full z-10'
          : 'h-screen h-[100dvh]'
      }`}
      style={
        isChatRoute && typeof window !== 'undefined' && window.innerWidth < 1024
          ? {
              height: 'var(--vv-height, 100dvh)',
              top: 'var(--vv-top, 0px)'
            }
          : {}
      }
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
