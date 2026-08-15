import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { ToastContainer } from '@/components/Toast';
import { UsernameModal } from '@/components/UsernameModal';
import { KycVerificationModal } from '@/components/KycVerificationModal';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { WifiOff } from 'lucide-react';

export const Layout = ({ children }) => {
  const { notifications } = useNotification();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const isUncutPage = location.pathname.startsWith('/uncut');
  const isLandingPage = location.pathname === '/' || isUncutPage;
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

  let wrapperClass = "";
  if (isLandingPage) {
    wrapperClass = "min-h-screen bg-neutral-950 font-sans overflow-x-hidden w-full";
  } else if (isAuthPage) {
    wrapperClass = "h-screen w-screen overflow-hidden bg-black font-sans w-full";
  } else {
    wrapperClass = `flex flex-col bg-white dark:bg-black ${
      isChatRoute
        ? 'fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] max-w-[100vw] z-10 overflow-hidden'
        : 'min-h-screen'
    }`;
  }

  return (
    <div className={wrapperClass}>
      {isOffline && (
        <div className="bg-rose-500/90 dark:bg-rose-950/90 backdrop-blur-md text-white text-[11px] font-extrabold py-2 px-4 text-center sticky top-0 z-[9999] flex items-center justify-center gap-2 border-b border-rose-500/30 transition-all duration-300">
          <WifiOff className="w-4 h-4 stroke-[2.5] text-rose-200 animate-pulse" />
          <span className="tracking-wide">No Internet Connection. Showing offline data.</span>
        </div>
      )}
      
      {/* Header (Only on standard dashboard / other pages) */}
      {!isLandingPage && !isAuthPage && (
        <div className={isChatRoute ? 'hidden md:block sticky top-0 z-50' : 'block sticky top-0 z-50'}>
          <Header />
        </div>
      )}

      {/* Main Content Layout */}
      {isLandingPage || isAuthPage ? (
        <main className={isAuthPage ? "w-full h-full overflow-hidden" : "w-full"}>
          {children}
        </main>
      ) : (
        <div className={`flex flex-1 max-w-full ${isChatRoute ? 'overflow-hidden min-h-0 h-full w-full' : 'w-full'}`}>
          {isAuthenticated && <Sidebar />}
          
          <main
            className={`flex-1 min-w-0 w-full ${isChatRoute ? 'overflow-hidden h-full w-full' : 'min-h-screen'} ${isAuthenticated ? 'lg:ml-20' : ''} ${isChatRoute ? 'pb-0' : 'pb-24 lg:pb-0'}`}
            style={!isChatRoute ? { overflowX: 'clip' } : undefined}
          >
            {children}
          </main>
        </div>
      )}

      {/* Mobile nav (Dashboard only) */}
      {!isLandingPage && !isAuthPage && isAuthenticated && (
        <MobileNav />
      )}
      <UsernameModal />
      <KycVerificationModal />
      <ToastContainer notifications={notifications} />
    </div>
  );
};
