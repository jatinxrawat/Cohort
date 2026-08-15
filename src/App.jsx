import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AnimatePresence, motion } from 'framer-motion';

import Landing from '@/pages/Landing';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
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
const Uncut = lazy(() => import('@/pages/Uncut'));
const CollegeLove = lazy(() => import('@/pages/uncut/CollegeLove'));
const CoffeeClub = lazy(() => import('@/pages/uncut/CoffeeClub'));
const IntrovertGuide = lazy(() => import('@/pages/uncut/IntrovertGuide'));
const UnwrittenRules = lazy(() => import('@/pages/uncut/UnwrittenRules'));
const CollegePublic = lazy(() => import('@/pages/CollegePublic'));
const NotFound = lazy(() => import('@/pages/NotFound'));

import { SplashScreen as CapacitorSplashScreen } from '@capacitor/splash-screen';
import { SplashScreen } from '@/components/SplashScreen';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Track page views on route change using Google Analytics (GA4)
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only send analytics page views in production to prevent local development pollution
    if (import.meta.env.PROD && typeof window.gtag === 'function') {
      window.gtag('config', 'G-P06KWK4X10', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

// Check for Cohort updates via self-hosted manifest.json
async function checkForCohortUpdate() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const res = await fetch('https://cohortnow.online/ota/manifest.json?t=' + Date.now(), {
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch manifest: ${res.status} ${res.statusText}`);
    }
    const manifest = await res.json();
    if (
      !manifest ||
      typeof manifest.version !== 'string' ||
      typeof manifest.url !== 'string' ||
      typeof manifest.checksum !== 'string'
    ) {
      throw new Error('Invalid manifest structure');
    }

    const currentInfo = await CapacitorUpdater.current();
    const currentVersion = (currentInfo?.bundle?.version && currentInfo?.bundle?.version !== '')
      ? currentInfo.bundle.version
      : currentInfo?.native;

    // Helper function for semantic-version comparison
    const isNewerVersion = (currentVer, manifestVer) => {
      if (!currentVer || currentVer === '') return true;
      if (!manifestVer) return false;
      const currentParts = currentVer.split('.').map(Number);
      const manifestParts = manifestVer.split('.').map(Number);
      const maxLength = Math.max(currentParts.length, manifestParts.length);
      for (let i = 0; i < maxLength; i++) {
        const currentPart = currentParts[i] || 0;
        const manifestPart = manifestParts[i] || 0;
        if (manifestPart > currentPart) return true;
        if (currentPart > manifestPart) return false;
      }
      return false;
    };

    if (isNewerVersion(currentVersion, manifest.version)) {
      console.log(`[Cohort OTA] New update available: ${manifest.version}. Downloading...`);
      const bundle = await CapacitorUpdater.download({
        url: manifest.url,
        version: manifest.version,
        checksum: manifest.checksum
      });

      console.log(`[Cohort OTA] Activating new update bundle ${bundle.id}...`);
      await CapacitorUpdater.set({
        id: bundle.id
      });
    } else {
      console.log(`[Cohort OTA] App is up to date. Current version: ${currentVersion || 'builtin'}`);
    }
  } catch (error) {
    console.warn('[Cohort OTA]', error);
  }
}

function App() {
  const isNative = Capacitor.isNativePlatform();
  const [showSplash, setShowSplash] = useState(isNative);

  useEffect(() => {
    // Hide the native OS-level splash screen immediately on mount
    CapacitorSplashScreen.hide().catch(err => {
      console.warn('Native splash hide failed:', err);
    });

    if (isNative) {
      CapacitorUpdater.notifyAppReady().catch(err => {
        console.warn('Capacitor Updater app ready notification failed:', err);
      });

      checkForCohortUpdate();
    }

    if (isNative) {
      // Request push notification permissions on first launch
      const requestNotificationPermission = async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            await PushNotifications.requestPermissions();
          }
        } catch (e) {
          console.warn('FCM startup permissions request error:', e);
        }
      };
      requestNotificationPermission();

      const setupBackButton = async () => {
        try {
          const { App: CapacitorApp } = await import('@capacitor/app');
          CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
            } else {
              CapacitorApp.exitApp();
            }
          });
        } catch (e) {
          console.warn('Android back button registration error:', e);
        }
      };
      setupBackButton();

      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500); // Keep custom splash screen visible for 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isNative]);

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
            <AnalyticsTracker />
            <Layout>
              <Suspense fallback={null}>
                <Routes>
                  {/* Public Routes (Auto-redirects to /home if logged in) */}
                  <Route path="/" element={<PublicOnlyRoute>{Capacitor.isNativePlatform() ? <Navigate to="/signup" replace /> : <Landing />}</PublicOnlyRoute>} />
                  <Route path="/login" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
                  <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
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
                    path="/post/:postId"
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
                  <Route path="/uncut" element={<Uncut />} />
                  <Route path="/uncut/college-love" element={<CollegeLove />} />
                  <Route path="/uncut/3am-coffee-club" element={<CoffeeClub />} />
                  <Route path="/uncut/introvert-guide" element={<IntrovertGuide />} />
                  <Route path="/uncut/unwritten-rules" element={<UnwrittenRules />} />

                  {/* College Pages */}
                  <Route path="/colleges/:collegeId" element={<CollegePublic />} />

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
