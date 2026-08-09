import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { loginWithGoogle, setPasswordForUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleVerify = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      showSuccess('Google identity verified!');
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google verification failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await setPasswordForUser(newPassword);
      showSuccess('Password updated successfully! You can now log in using your new password.');
      navigate('/signup');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password. Try again.');
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
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-1 text-white">
            {step === 1 ? 'Reset Password' : 'Create New Password'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            {step === 1
              ? 'Verify your identity using Google to create a new password'
              : 'Set a new password for your username and email login'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-sky-500 shadow-sm shadow-sky-500/50' : 'bg-neutral-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-sky-500 shadow-sm shadow-sky-500/50' : 'bg-neutral-800'}`} />
        </div>

        {/* Elevated Glassmorphism Card */}
        <div className="relative bg-neutral-900/75 backdrop-blur-2xl border border-white/10 dark:border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6">
          {step === 1 ? (
            /* Step 1: Google Verification */
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-lg">
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-heading font-extrabold text-white mb-1">
                  Google Verification
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  To protect your account, verify your identity with Google before creating a new password.
                </p>
              </div>

              {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

              {/* Glowing Google Verification Button */}
              <button
                type="button"
                onClick={handleGoogleVerify}
                disabled={isGoogleLoading}
                className="w-full py-4 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_25px_rgba(14,165,233,0.35)] active:scale-[0.99] text-sm cursor-pointer"
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
                <span>{isGoogleLoading ? 'Verifying...' : 'Verify with Google'}</span>
              </button>
            </div>
          ) : (
            /* Step 2: Create New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Identity verified! Enter your new password below.</span>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  NEW PASSWORD
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-sky-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/15 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  CONFIRM PASSWORD
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-sky-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/15 transition-all shadow-inner"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-5 cursor-pointer"
              >
                {isLoading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to Sign In */}
        <div className="text-center mt-6">
          <Link to="/signup" className="text-sky-400 hover:text-sky-300 font-bold text-xs transition-colors underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
