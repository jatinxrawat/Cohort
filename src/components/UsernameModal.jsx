import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Button } from '@/components/Button';
import { Sparkles, AtSign } from 'lucide-react';

export const UsernameModal = () => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const { showSuccess } = useNotification();
  const [usernameInput, setUsernameInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthenticated || !user || user.username) {
    return null;
  }

  const handleCreateUsername = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long (letters, numbers, underscores).');
      return;
    }

    setChecking(true);
    try {
      // Query Firestore users collection for existing username
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnapshot = await getDocs(q);

      let isTaken = false;
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.uid) {
          isTaken = true;
        }
      });

      if (isTaken) {
        setErrorMsg(`Username "@${cleanUsername}" is already taken. Please try another.`);
        setChecking(false);
        return;
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: cleanUsername
      });

      await updateUser({ username: cleanUsername });
      showSuccess(`Welcome! Your unique username is @${cleanUsername}`);
    } catch (err) {
      console.error('Error saving username:', err);
      setErrorMsg('Failed to check username availability. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-2xl max-w-md w-full shadow-2xl space-y-xl animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-md">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/50 rounded-2xl flex items-center justify-center mx-auto text-primary-500 shadow-inner">
            <AtSign className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white">
            Choose Your Unique Username
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-xl leading-relaxed">
            Welcome to Cohort! Every student has a unique handle so classmates can search and message you directly.
          </p>
        </div>

        <form onSubmit={handleCreateUsername} className="space-y-lg">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
              Username Handle
            </label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">@</span>
              <input
                type="text"
                placeholder="e.g. jatin_rawat"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setErrorMsg('');
                }}
                className="input-base pl-2xl font-mono text-sm"
                autoFocus
              />
            </div>
            {errorMsg ? (
              <p className="text-xs text-danger mt-xs">{errorMsg}</p>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-xs">
                Letters, numbers, and underscores allowed. Must be unique.
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-md"
            disabled={checking || !usernameInput.trim()}
          >
            {checking ? 'Checking availability...' : <>Claim Username <Sparkles className="w-4 h-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};
