import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { useNotification } from '@/contexts/NotificationContext';

export default function Signup() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, setPasswordForUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Password Modal States
  const [isCreatePasswordOpen, setIsCreatePasswordOpen] = useState(false);
  const [newGooglePassword, setNewGooglePassword] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      showSuccess('Signed in with Google successfully!');
      // Prompt user to set a password for username/password login
      setIsCreatePasswordOpen(true);
    } catch (error) {
      console.error(error);
      showError(error.message || 'Google sign in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleSaveGooglePassword = async () => {
    if (!newGooglePassword || newGooglePassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    setIsSavingPass(true);
    try {
      await setPasswordForUser(newGooglePassword);
      showSuccess('Password created successfully! You can now log in using your username and password.');
      setIsCreatePasswordOpen(false);
      navigate('/home');
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to set password. You can set it later in Settings.');
      setIsCreatePasswordOpen(false);
      navigate('/home');
    } finally {
      setIsSavingPass(false);
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email or Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email.trim(), formData.password);
      showSuccess('Welcome back to Cohort!');
      navigate('/home');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        showError('Email/Password provider is not enabled in Firebase Console. Please sign in via Google in "Create Account"!');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showError('Invalid email/username or password. Please check your details.');
      } else {
        showError(error.message || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 bg-neutral-950 text-white relative overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Ambient Background Glowing Orbs */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 bg-sky-500/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 w-96 h-96 bg-indigo-500/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo isLanding={false} iconSize="w-12 h-12" textSize="text-3xl" className="flex items-center gap-3 hover:scale-105 transition-transform" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-1.5 text-white">
            {isSignup ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            {isSignup ? 'Sign up using Google for instant campus verification' : 'Sign in to access your campus network & messages'}
          </p>
        </div>

        {/* Elevated Glassmorphism Auth Card */}
        <div className="relative bg-neutral-900/75 backdrop-blur-2xl border border-white/10 dark:border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Segmented Mode Switcher */}
          <div className="p-1 bg-neutral-950/90 border border-neutral-800/80 rounded-2xl flex items-center gap-1 mb-6 shadow-inner">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setErrors({}); }}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
                !isSignup
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setErrors({}); }}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
                isSignup
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {!isSignup ? (
            /* Sign In Mode (Username / Email & Password) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username Box */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  EMAIL OR USERNAME
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-sky-400 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="your@college.edu or handle"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full bg-neutral-950/80 border ${
                      errors.email ? 'border-rose-500/80' : 'border-neutral-800'
                    } rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/15 transition-all shadow-inner`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-sky-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full bg-neutral-950/80 border ${
                      errors.password ? 'border-rose-500/80' : 'border-neutral-800'
                    } rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/15 transition-all shadow-inner`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Glowing Main Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Create Account Mode (Google Sign-up Only) */
            <div className="text-center py-2 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-lg">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-heading font-extrabold text-white mb-2">
                  Instant Campus Verification
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  To keep Cohort safe & verified, all new student accounts sign up using their official Google account.
                </p>
              </div>

              {/* Glowing Sign Up with Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-4 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign Up with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-neutral-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Protected by Cohort Student Verification Protocol.
          </p>
        </div>
      </div>

      {/* Google Sign In Password Creation Modal */}
      {isCreatePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30 shadow-md">
              <Lock className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white">Create Account Password</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Create a password so you can also log in using your username or email anytime in the future!
            </p>

            <div className="text-left space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newGooglePassword}
                  onChange={(e) => setNewGooglePassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatePasswordOpen(false);
                  navigate('/home');
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleSaveGooglePassword}
                disabled={isSavingPass}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-xs font-extrabold text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                {isSavingPass ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
