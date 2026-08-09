import React, { createContext, useState, useContext, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  updatePassword
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '@/utils/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          // Get user metadata from Firestore
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              ...docSnap.data()
            };
            setUser(profileData);
            localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileData));
            setIsAuthenticated(true);
          } else {
            // New Google user or profile missing in Firestore
            const newProfile = {
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              college: 'KIET',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.email)}`,
              joinedDate: new Date().toISOString()
            };
            await setDoc(docRef, newProfile);
            const profileData = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              ...newProfile
            };
            setUser(profileData);
            localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileData));
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to retrieve user profile from Firestore:', error);
          const cached = localStorage.getItem(`user_profile_${firebaseUser.uid}`);
          if (cached) {
            setUser(JSON.parse(cached));
          } else {
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              college: 'KIET',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.email)}`
            });
          }
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Listener for Unread Direct Messages & Count
  useEffect(() => {
    if (!user?.uid) {
      setHasUnreadMessages(false);
      setUnreadCount(0);
      return;
    }

    const unsub = onSnapshot(collection(db, 'messages'), (snapshot) => {
      let totalUnread = 0;

      snapshot.forEach(d => {
        const data = d.data();
        const isParticipant = (data.participants && data.participants.includes(user.uid)) ||
                              data.recipientUid === user.uid ||
                              data.createdBy === user.uid;

        if (isParticipant && data.hiddenFor?.[user.uid] !== true) {
          const msgs = data.messages || [];
          const unreadMsgsInThread = msgs.filter(m => {
            if (!m) return false;
            const isFromOther = m.senderUid ? m.senderUid !== user.uid : m.senderName !== (user?.name || user?.email?.split('@')[0]);
            const isRead = Array.isArray(m.readBy) && m.readBy.includes(user.uid);
            const isDeleted = Array.isArray(m.deletedFor) && m.deletedFor.includes(user.uid);
            return isFromOther && !isRead && !isDeleted;
          }).length;

          totalUnread += unreadMsgsInThread;
        }
      });

      setUnreadCount(totalUnread);
      setHasUnreadMessages(totalUnread > 0);
    }, (err) => {
      console.error('Unread messages listener error:', err);
    });

    return () => unsub();
  }, [user?.uid, user?.name, user?.email]);

  // Handle Mobile Push Notification registration and permissions
  useEffect(() => {
    if (user?.uid && Capacitor.isNativePlatform()) {
      const setupPushNotifications = async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');

          let permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            await PushNotifications.register();

            // Clear listeners to avoid duplicated event registrations
            await PushNotifications.removeAllListeners();

            // Store FCM token to Firestore
            await PushNotifications.addListener('registration', async (token) => {
              console.log('Mobile Push Registration success, token:', token.value);
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, { fcmToken: token.value }).catch(err => {
                console.error('Failed to update FCM token in user document:', err);
              });
            });

            await PushNotifications.addListener('registrationError', (error) => {
              console.error('FCM registration error:', error);
            });

            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
              console.log('Foreground push notification received:', notification);
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
              console.log('Push notification action tapped:', action);
            });
          } else {
            console.warn('Push notification permissions denied by user');
          }
        } catch (error) {
          console.error('Failed to register push notifications:', error);
        }
      };

      setupPushNotifications();
    }
  }, [user?.uid]);

  const loginWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken || result.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token received from native SDK.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
  };

  const login = async (emailOrUsername, password) => {
    let emailToUse = emailOrUsername.trim();
    if (!emailToUse.includes('@')) {
      const cleanUsername = emailToUse.replace(/^@/, '').toLowerCase();
      try {
        const usersRef = collection(db, 'users');
        const q1 = query(usersRef, where('username', '==', cleanUsername));
        const snap1 = await getDocs(q1);
        if (!snap1.empty && snap1.docs[0].data()?.email) {
          emailToUse = snap1.docs[0].data().email;
        } else {
          const q2 = query(usersRef, where('usernameHandle', '==', cleanUsername));
          const snap2 = await getDocs(q2);
          if (!snap2.empty && snap2.docs[0].data()?.email) {
            emailToUse = snap2.docs[0].data().email;
          } else {
            emailToUse = `${cleanUsername}@student.edu`;
          }
        }
      } catch (err) {
        console.error('Username lookup error:', err);
        emailToUse = `${cleanUsername}@student.edu`;
      }
    }
    return signInWithEmailAndPassword(auth, emailToUse, password);
  };

  const setPasswordForUser = async (newPassword) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updatePassword(auth.currentUser, newPassword);
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { hasPassword: true });
    setUser(prev => ({ ...prev, hasPassword: true }));
  };

  const signup = async (userData) => {
    const { email, password, name, college } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const profile = {
      name: name || 'Student',
      email: email,
      college: college || 'KIET',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
      joinedDate: new Date().toISOString(),
      hasPassword: true
    };

    // Save profile metadata inside Firestore
    await setDoc(doc(db, 'users', uid), profile);
    setUser({ id: uid, uid, ...profile });
    setIsAuthenticated(true);
    return userCredential.user;
  };

  const requestLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    if (user?.uid) {
      localStorage.removeItem(`user_profile_${user.uid}`);
    }
    setUser(null);
    setIsAuthenticated(false);
    setHasUnreadMessages(false);
    return await signOut(auth);
  };

  const logout = () => {
    requestLogout();
  };

  const forceLogout = async () => {
    setIsLogoutModalOpen(false);
    if (auth.currentUser?.uid) {
      localStorage.removeItem(`user_profile_${auth.currentUser.uid}`);
    }
    setUser(null);
    setIsAuthenticated(false);
    setHasUnreadMessages(false);
    return await signOut(auth);
  };

  const updateUser = async (updates) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, updates);
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(`user_profile_${uid}`, JSON.stringify(updated));
      return updated;
    });
  };

  const requestPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        hasUnreadMessages,
        setHasUnreadMessages,
        unreadCount,
        setUnreadCount,
        loginWithGoogle,
        login,
        signup,
        setPasswordForUser,
        logout,
        requestLogout,
        confirmLogout,
        cancelLogout,
        forceLogout,
        updateUser,
        requestPasswordReset
      }}
    >
      {children}

      {/* Modern Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          {/* Dark Glass Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={cancelLogout}
          />

          {/* Elevated Glass Card */}
          <div className="relative bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center z-10 my-auto transform transition-all scale-100 backdrop-blur-2xl">
            {/* Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/30 shadow-md">
              <LogOut className="w-8 h-8 stroke-[2.5] animate-pulse" />
            </div>

            <h3 className="text-xl font-heading font-extrabold text-neutral-900 dark:text-white tracking-tight mb-2">
              Confirm Logout
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              Are you sure you want to log out? You will need to log back in to access your campus messages and posts.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelLogout}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
