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
  getDocs,
  writeBatch
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

  const ensureCohortOfficialAndAutoFollow = async (currentProfile) => {
    if (!currentProfile || !currentProfile.uid) return;

    try {
      const cohortDocRef = doc(db, 'users', 'cohort_official');
      const cohortSnap = await getDoc(cohortDocRef);

      let cohortFollowers = [];
      if (!cohortSnap.exists()) {
        const cohortOfficialData = {
          uid: 'cohort_official',
          id: 'cohort_official',
          name: 'Cohort',
          username: 'cohort',
          email: 'cohort@official.com',
          college: 'Cohort Official Platform',
          isOfficial: true,
          bio: 'The official Cohort platform account. Connecting students across campuses. Follow for official feature updates, campus drops, and 24/7 support.',
          followers: currentProfile.uid !== 'cohort_official' ? [currentProfile.uid] : [],
          following: [],
          avatar: 'https://ui-avatars.com/api/?name=Cohort&background=9333ea&color=fff&bold=true&size=128',
          joinedDate: new Date().toISOString()
        };
        await setDoc(cohortDocRef, cohortOfficialData);
        cohortFollowers = cohortOfficialData.followers;
      } else {
        const data = cohortSnap.data();
        cohortFollowers = Array.isArray(data.followers) ? data.followers : [];
        if (currentProfile.uid !== 'cohort_official' && !cohortFollowers.includes(currentProfile.uid)) {
          cohortFollowers.push(currentProfile.uid);
          await updateDoc(cohortDocRef, { followers: cohortFollowers });
        }
      }

      // Auto-follow from current user perspective
      if (currentProfile.uid !== 'cohort_official') {
        const userFollowing = Array.isArray(currentProfile.following) ? currentProfile.following : [];
        if (!userFollowing.includes('cohort_official')) {
          const nextFollowing = [...userFollowing, 'cohort_official'];
          await updateDoc(doc(db, 'users', currentProfile.uid), { following: nextFollowing });
          setUser(prev => prev ? ({ ...prev, following: nextFollowing }) : prev);
        }
      }
    } catch (err) {
      console.error('Error in ensureCohortOfficialAndAutoFollow:', err);
    }
  };

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
            ensureCohortOfficialAndAutoFollow(profileData);
          } else {
            // New Google user or profile missing in Firestore
            const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
            const newProfile = {
              name: displayName,
              email: firebaseUser.email,
              college: 'KIET',
              avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&bold=true&size=128`,
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
            ensureCohortOfficialAndAutoFollow(profileData);
          }
        } catch (error) {
          console.error('Failed to retrieve user profile from Firestore:', error);
          const cached = localStorage.getItem(`user_profile_${firebaseUser.uid}`);
          if (cached) {
            setUser(JSON.parse(cached));
          } else {
            const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: displayName,
              college: 'KIET',
              avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&bold=true&size=128`
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
      const threads = [];

      snapshot.forEach(d => {
        const data = d.data();
        const isParticipant = (data.participants && data.participants.includes(user.uid)) ||
                              data.recipientUid === user.uid ||
                              data.createdBy === user.uid;

        if (isParticipant && data.hiddenFor?.[user.uid] !== true) {
          threads.push({
            id: d.id,
            ...data
          });
        }
      });

      // Deduplicate conversation threads for the same user pair (matching Messages.jsx logic)
      const uniqueThreadsMap = new Map();
      threads.forEach(t => {
        const otherUid = (t.participants || []).find(p => p !== user.uid) || t.recipientUid;
        const key = otherUid || t.name || t.id;
        if (!uniqueThreadsMap.has(key)) {
          uniqueThreadsMap.set(key, t);
        } else {
          const prev = uniqueThreadsMap.get(key);
          const tMsgCount = t.messages?.length || 0;
          const prevMsgCount = prev.messages?.length || 0;
          if (tMsgCount > prevMsgCount) {
            uniqueThreadsMap.set(key, t);
          }
        }
      });

      let totalUnread = 0;
      uniqueThreadsMap.forEach(t => {
        const msgs = t.messages || [];
        const unreadMsgsInThread = msgs.filter(m => {
          if (!m) return false;
          const senderId = m.senderUid || m.sender?.uid || m.uid || m.authorUid;
          const isFromOther = senderId
            ? senderId !== user.uid
            : (m.senderName && m.senderName !== user?.name);
          const isRead = Array.isArray(m.readBy) && m.readBy.includes(user.uid);
          const isDeleted = Array.isArray(m.deletedFor) && m.deletedFor.includes(user.uid);
          return isFromOther && !isRead && !isDeleted;
        }).length;

        totalUnread += unreadMsgsInThread;
      });

      setUnreadCount(totalUnread);
      setHasUnreadMessages(totalUnread > 0);
    }, (err) => {
      console.error('Unread messages listener error:', err);
    });

    return () => unsub();
  }, [user?.uid, user?.name, user?.email]);

  // Register for push notifications on native mobile when logged in
  useEffect(() => {
    if (!user?.uid || !Capacitor.isNativePlatform()) return;

    const registerPush = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        
        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
          
          await PushNotifications.addListener('registration', async (token) => {
            if (token?.value && user?.uid) {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, { fcmToken: token.value }).catch(err => {
                console.warn('Failed to save FCM token to Firestore:', err);
              });
            }
          });

          await PushNotifications.addListener('registrationError', (err) => {
            console.error('FCM registration error:', err);
          });
        }
      } catch (err) {
        console.warn('Push registration hook error:', err);
      }
    };

    registerPush();
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

  const syncUserProfileAcrossFirestore = async (uid, newName, newAvatar, newUsername) => {
    if (!uid) return;

    try {
      const batch = writeBatch(db);
      let batchCount = 0;

      // 1. Sync Posts where user is author or has comments
      const postsRef = collection(db, 'posts');
      const postsSnap = await getDocs(postsRef);
      
      postsSnap.forEach((docSnap) => {
        const post = docSnap.data();
        let postUpdated = false;
        const postRef = doc(db, 'posts', docSnap.id);
        const updatePayload = {};

        // Author sync
        if (post.author?.uid === uid || post.authorUid === uid) {
          if (newName) updatePayload['author.name'] = newName;
          if (newAvatar) updatePayload['author.avatar'] = newAvatar;
          if (newUsername) updatePayload['author.username'] = newUsername;
          postUpdated = true;
        }

        // Comments array sync
        if (Array.isArray(post.comments) && post.comments.length > 0) {
          let commentsUpdated = false;
          const updatedComments = post.comments.map(c => {
            if (c.authorUid === uid || c.author?.uid === uid || c.uid === uid) {
              commentsUpdated = true;
              return {
                ...c,
                authorName: newName || c.authorName,
                authorAvatar: newAvatar || c.authorAvatar,
                author: {
                  ...(c.author || {}),
                  name: newName || c.author?.name,
                  avatar: newAvatar || c.author?.avatar
                }
              };
            }
            return c;
          });

          if (commentsUpdated) {
            updatePayload.comments = updatedComments;
            postUpdated = true;
          }
        }

        if (postUpdated) {
          batch.update(postRef, updatePayload);
          batchCount++;
        }
      });

      // 2. Sync Messages / Conversations collection
      const messagesRef = collection(db, 'messages');
      const messagesSnap = await getDocs(messagesRef);

      messagesSnap.forEach((docSnap) => {
        const chat = docSnap.data();
        const chatRef = doc(db, 'messages', docSnap.id);
        let chatUpdated = false;
        const updatePayload = {};

        // Sync participant maps
        if (Array.isArray(chat.participants) && chat.participants.includes(uid)) {
          if (chat.participantNames) {
            updatePayload[`participantNames.${uid}`] = newName;
            chatUpdated = true;
          }
          if (chat.participantAvatars) {
            updatePayload[`participantAvatars.${uid}`] = newAvatar;
            chatUpdated = true;
          }
          if (chat.lastSenderUid === uid) {
            if (newName) updatePayload.lastSenderName = newName;
            if (newAvatar) updatePayload.lastSenderAvatar = newAvatar;
            chatUpdated = true;
          }
        }

        // Sync message array inside thread
        if (Array.isArray(chat.messages) && chat.messages.length > 0) {
          let msgsUpdated = false;
          const updatedMsgs = chat.messages.map(m => {
            if (m.senderUid === uid || m.sender?.uid === uid) {
              msgsUpdated = true;
              return {
                ...m,
                senderName: newName || m.senderName,
                senderAvatar: newAvatar || m.senderAvatar,
                sender: m.sender ? {
                  ...m.sender,
                  name: newName || m.sender.name,
                  avatar: newAvatar || m.sender.avatar
                } : undefined
              };
            }
            return m;
          });

          if (msgsUpdated) {
            updatePayload.messages = updatedMsgs;
            chatUpdated = true;
          }
        }

        if (chatUpdated) {
          batch.update(chatRef, updatePayload);
          batchCount++;
        }
      });

      // 3. Sync Community Messages collection
      const commMsgsRef = collection(db, 'community-messages');
      const commMsgsSnap = await getDocs(commMsgsRef);

      commMsgsSnap.forEach((docSnap) => {
        const msg = docSnap.data();
        if (msg.senderUid === uid || msg.sender?.uid === uid) {
          const msgRef = doc(db, 'community-messages', docSnap.id);
          const msgUpdate = {};
          if (newName) {
            msgUpdate.senderName = newName;
            msgUpdate['sender.name'] = newName;
          }
          if (newAvatar) {
            msgUpdate.senderAvatar = newAvatar;
            msgUpdate['sender.avatar'] = newAvatar;
          }
          batch.update(msgRef, msgUpdate);
          batchCount++;
        }
      });

      // 4. Sync Notifications
      const notifsRef = collection(db, 'notifications');
      const notifsSnap = await getDocs(notifsRef);

      notifsSnap.forEach((docSnap) => {
        const notif = docSnap.data();
        if (notif.senderUid === uid) {
          const notifRef = doc(db, 'notifications', docSnap.id);
          const notifUpdate = {};
          if (newName) notifUpdate.senderName = newName;
          if (newAvatar) notifUpdate.senderAvatar = newAvatar;
          batch.update(notifRef, notifUpdate);
          batchCount++;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
        console.log(`Synced user profile across ${batchCount} Firestore documents.`);
      }
    } catch (err) {
      console.error('Error syncing profile across Firestore:', err);
    }
  };

  const updateUser = async (updates) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, updates);

    const newName = updates.name;
    const newAvatar = updates.avatar;
    const newUsername = updates.username;

    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(`user_profile_${uid}`, JSON.stringify(updated));
      return updated;
    });

    if (newName || newAvatar || newUsername) {
      syncUserProfileAcrossFirestore(uid, newName, newAvatar, newUsername);
    }
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
