import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '@/utils/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          // Get user metadata from Firestore
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              ...docSnap.data()
            });
            setIsAuthenticated(true);
          } else {
            // New Google user or profile missing in Firestore
            const newProfile = {
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              college: 'Delhi University',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.email)}`,
              joinedDate: new Date().toISOString()
            };
            await setDoc(docRef, newProfile);
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              ...newProfile
            });
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to retrieve user profile from Firestore:', error);
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            college: 'Delhi University',
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.email)}`
          });
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

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (userData) => {
    const { email, password, name, college } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const profile = {
      name: name || 'Student',
      email: email,
      college: college || 'Delhi University',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
      joinedDate: new Date().toISOString()
    };

    // Save profile metadata inside Firestore
    await setDoc(doc(db, 'users', uid), profile);
    setUser({ id: uid, uid, ...profile });
    setIsAuthenticated(true);
    return userCredential.user;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setHasUnreadMessages(false);
    return signOut(auth);
  };

  const updateUser = async (updates) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, updates);
    setUser(prev => ({ ...prev, ...updates }));
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
        logout,
        updateUser,
        requestPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
