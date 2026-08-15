import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Button } from '@/components/Button';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import { Camera, AtSign, Sparkles, Building2, User, GraduationCap, Calendar, Eye, EyeOff } from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import CollegeSelector from '@/components/CollegeSelector';
import { isCollegeEmail, verifyEmailMatchesCollege, predictGenderFromName } from '@/utils/helpers';

export const UsernameModal = () => {
  const { user, updateUser, isAuthenticated, setPasswordForUser } = useAuth();
  const { showSuccess } = useNotification();

  const [usernameInput, setUsernameInput] = useState('');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extended Onboarding States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [cropperSrc, setCropperSrc] = useState(null);

  const [collegeInput, setCollegeInput] = useState(user?.college || '');

  const [gender, setGender] = useState('Prefer not to say');
  const [year, setYear] = useState('1st Year');
  const [dob, setDob] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync name input when user profile is loaded
  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setCollegeInput(user.college || '');
    }
  }, [user]);

  // Keep modal open if authenticated and either username or onboarding incomplete
  if (!isAuthenticated || !user || (user.username && user.onboarded)) {
    return null;
  }

  const handleCreateUsername = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = nameInput.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Display Name must be at least 2 characters long.');
      return;
    }

    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long (letters, numbers, underscores).');
      return;
    }

    if (!user.hasPassword) {
      if (!passwordInput || passwordInput.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    if (!collegeInput.trim()) {
      setErrorMsg('Please select or enter your college / university name.');
      return;
    }

    if (!dob) {
      setErrorMsg('Please select your Date of Birth.');
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

      // 1. Set chosen password in Firebase Auth first if user does not have a password
      if (!user.hasPassword) {
        await setPasswordForUser(passwordInput);
      }

      // 2. Upload profile picture if selected
      let uploadedAvatarUrl = user.avatar || null;
      if (avatarFile) {
        setIsUploading(true);
        uploadedAvatarUrl = await uploadImageToCloudinary(avatarFile);
      }

      // 3. Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      const isCollege = isCollegeEmail(user.email);
      const isMatching = isCollege && verifyEmailMatchesCollege(user.email, collegeInput);

      const onboardingData = {
        name: cleanName,
        username: cleanUsername,
        avatar: uploadedAvatarUrl || avatarPreviewUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        college: collegeInput,
        gender: gender,
        year: year,
        dob: dob,
        onboarded: true,
        kycVerified: isMatching,
        kycEmail: isMatching ? user.email : null,
        kycGender: isMatching ? predictGenderFromName(user.email) : null
      };

      await updateDoc(userRef, onboardingData);
      await updateUser(onboardingData);
      showSuccess(`Welcome! Your unique username is @${cleanUsername}`);
    } catch (err) {
      console.error('Error during onboarding setup:', err);
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setChecking(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex justify-center items-start sm:items-center p-md sm:p-lg py-xl">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-lg sm:p-xl max-w-md w-full shadow-2xl my-auto space-y-md sm:space-y-lg animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-sm">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/50 rounded-xl flex items-center justify-center mx-auto text-primary-500 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-neutral-900 dark:text-white">
            Complete Your Profile Setup
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Welcome to Cohort! Let's set up your campus profile so classmates can connect with you directly.
          </p>
        </div>

        <form onSubmit={handleCreateUsername} className="space-y-md">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-sm pb-xs">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatarPreviewUrl || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full border-4 border-primary-500 object-cover shadow-md group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setCropperSrc(URL.createObjectURL(file));
                  }
                }}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="flex gap-sm">
              <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload Photo
              </Button>
              {(avatarPreviewUrl || user?.avatar) && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreviewUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-xs">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Vansh"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setErrorMsg('');
                }}
                className="input-base text-sm"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-xs">
              Username Handle
            </label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">@</span>
              <input
                type="text"
                placeholder="e.g. alex_student"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setErrorMsg('');
                }}
                className="input-base pl-2xl font-mono text-sm"
                required
              />
            </div>
            {errorMsg ? (
              <p className="text-xs text-danger mt-xs">{errorMsg}</p>
            ) : (
              <p className="text-[10px] text-neutral-400 mt-xs">
                Letters, numbers, and underscores allowed. Must be unique.
              </p>
            )}
          </div>

          {/* Choose Password (only shown if not set) */}
          {!user.hasPassword && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-xs">
                Choose Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose password (min 6 chars)"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  className="input-base pr-2xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-md flex items-center text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* University/College */}
          <CollegeSelector
            value={collegeInput}
            onChange={(newCollege) => setCollegeInput(newCollege)}
          />

          {/* Gender and Year */}
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-xs">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-base text-sm h-10 py-0"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-xs">
                Year of Study
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-base text-sm h-10 py-0"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>
          </div>

          {/* DOB */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-xs">
              Date of Birth (DOB)
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="input-base text-sm h-10"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-md pt-xs"
            disabled={checking || isUploading || !usernameInput.trim()}
          >
            {checking || isUploading ? (
              'Completing onboarding...'
            ) : (
              <>
                Let's Get Started <Sparkles className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCrop={(croppedFile) => {
            setAvatarFile(croppedFile);
            setAvatarPreviewUrl(URL.createObjectURL(croppedFile));
            setCropperSrc(null);
          }}
          onCancel={() => {
            setCropperSrc(null);
          }}
        />
      )}
    </div>
  );
};
