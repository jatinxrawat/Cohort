import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy load pages
const Landing = lazy(() => import('@/pages/Landing'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Home = lazy(() => import('@/pages/Home'));
const AnonymousFeed = lazy(() => import('@/pages/AnonymousFeed'));
const Community = lazy(() => import('@/pages/Community'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Placement = lazy(() => import('@/pages/Placement'));
const Profile = lazy(() => import('@/pages/Profile'));
const EditProfile = lazy(() => import('@/pages/EditProfile'));
const SavedPosts = lazy(() => import('@/pages/SavedPosts'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Messages = lazy(() => import('@/pages/Messages'));
const Search = lazy(() => import('@/pages/Search'));
const Settings = lazy(() => import('@/pages/Settings'));
const MakeAFriend = lazy(() => import('@/pages/MakeAFriend'));
const Help = lazy(() => import('@/pages/Help'));
const About = lazy(() => import('@/pages/About'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Contact = lazy(() => import('@/pages/Contact'));
const NotFound = lazy(() => import('@/pages/NotFound'));

import { SplashScreen as CapacitorSplashScreen } from '@capacitor/splash-screen';
import { SplashScreen } from '@/components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide the native OS-level splash screen immediately on mount
    CapacitorSplashScreen.hide().catch(err => {
      console.warn('Native splash hide failed:', err);
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Keep custom splash screen visible for 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AnimatePresence>
            {showSplash && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="fixed inset-0 z-[9999]"
              >
                <SplashScreen />
              </motion.div>
            )}
          </AnimatePresence>
          <BrowserRouter>
            <Layout>
              <Suspense fallback={null}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Navigate to="/signup" replace />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Protected Routes */}
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/anonymous"
                    element={
                      <ProtectedRoute>
                        <AnonymousFeed />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/confessions"
                    element={
                      <ProtectedRoute>
                        <AnonymousFeed defaultTab="confessions" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/community"
                    element={
                      <ProtectedRoute>
                        <Community />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/events" element={<Navigate to="/home" replace />} />
                  <Route path="/notes" element={<Navigate to="/home" replace />} />
                  <Route path="/clubs" element={<Navigate to="/home" replace />} />
                  
                  <Route
                    path="/marketplace"
                    element={
                      <ProtectedRoute>
                        <Marketplace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/placement"
                    element={
                      <ProtectedRoute>
                        <Placement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/edit-profile"
                    element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/saved-posts"
                    element={
                      <ProtectedRoute>
                        <SavedPosts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/make-friend"
                    element={
                      <ProtectedRoute>
                        <MakeAFriend />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Info Pages */}
                  <Route path="/help" element={<Help />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
