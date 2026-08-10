import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';

import { Capacitor } from '@capacitor/core';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <>
      <SEO noindex={true} />
      {children}
    </>
  );
};

export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  // Show app loader only on native apps to hide initialization layout flashes.
  // On web, render the page immediately to keep first-paint speed high.
  if (isLoading && isNative) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      {children}
    </>
  );
};

