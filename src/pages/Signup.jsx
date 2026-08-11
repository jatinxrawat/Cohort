import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo, LogoIcon } from '@/components/Logo';
import { useNotification } from '@/contexts/NotificationContext';
import SpecularButton from '@/components/SpecularButton';
import Scanner from '@/components/Scanner';
import SEO from '@/components/SEO';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, setPasswordForUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  const [isSignup, setIsSignup] = useState(location.pathname === '/signup');

  useEffect(() => {
    setIsSignup(location.pathname === '/signup');
  }, [location.pathname]);

  const toggleAuthMode = () => {
    const nextIsSignup = !isSignup;
    setIsSignup(nextIsSignup);
    navigate(nextIsSignup ? '/signup' : '/login');
  };
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
      showSuccess('Password created successfully!');
      setIsCreatePasswordOpen(false);
      navigate('/home');
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to set password.');
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
        showError('Please sign in via Google below!');
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
    <div className="relative min-h-screen w-full bg-[#08080C] text-neutral-100 flex flex-col justify-between overflow-x-hidden select-none pb-12 sm:pb-16 lg:pb-24">
      <SEO 
        title={isSignup ? "Sign Up" : "Log In"} 
        description="Connect with your university campus community on Cohort. Log in or create a new student account." 
      />
      
      {/* Full-Screen React Bits <Scanner /> WebGL Component Background */}
      <div className="absolute inset-0 z-0 opacity-65 pointer-events-none">
        <Scanner
          color1="#963BFF"
          color2="#FF2A85"
          color3="#00F0FF"
          speed={0.4}
          sweepSpeed={0.3}
          sweepWidth={1.4}
          sweepFalloff={5}
          scale={1.4}
          frequency={2.2}
          ripple={0.25}
          bandDensity={10}
          lineSharpness={5.0}
          glow={0.3}
          scanDirection="diagonal"
          colorSpread={0.8}
          brightness={1.1}
          contrast={1.2}
          softness={1.3}
          vignette={0.4}
          scanline={true}
          grain={true}
          grainIntensity={0.04}
          opacity={0.85}
          mouseInteraction={true}
          mouseRadius={0.6}
          mouseStrength={0.6}
        />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* --- TOP NAVBAR --- */}
      <header className="relative z-30 px-6 sm:px-12 py-3 flex items-center justify-end flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleAuthMode}
            className="text-xs sm:text-sm font-extrabold px-5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 transition-all cursor-pointer"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </header>

      {/* --- MAIN HERO 2-COLUMN SPLIT GRID --- */}
      <main className="relative z-20 max-w-7xl w-full mx-auto px-6 sm:px-12 pt-2 pb-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12 flex-1 overflow-y-auto">
        
        {/* LEFT COLUMN: TYPOGRAPHY + AUTH FORM */}
        <div className="lg:col-span-6 space-y-5 text-left max-w-xl">
          
          <div>
            <h1 className="font-unbounded font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.05] mb-3">
              Join the <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">hub.</span>
            </h1>
            <p className="font-jakarta text-base sm:text-lg text-neutral-300 font-bold tracking-tight">
              {isSignup ? 'Join your campus community today.' : 'Sign in to access your campus world.'}
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="max-w-sm space-y-2.5 pt-1">
            
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-6 bg-white hover:bg-neutral-100 text-neutral-900 font-extrabold text-sm rounded-full shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer border border-white"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Apple Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-6 bg-white hover:bg-neutral-100 text-neutral-900 font-extrabold text-sm rounded-full shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer border border-white"
            >
              <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.11-.98.04-2.19.66-2.88 1.47-.62.72-1.16 1.88-1.01 3 .01.01 1.09.08 2.9-.36z"/>
              </svg>
              <span>Continue with Apple</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-black px-3 text-[11px] font-bold text-neutral-500 uppercase tracking-widest absolute">or</span>
            </div>

            {/* Form Inputs for Email / Password */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Email or username"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full bg-black border ${
                    errors.email ? 'border-rose-500' : 'border-neutral-800 focus:border-purple-500'
                  } rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all`}
                />
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email}</p>
                )}
              </div>

              {!isSignup && (
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full bg-black border ${
                        errors.password ? 'border-rose-500' : 'border-neutral-800 focus:border-purple-500'
                      } rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.password}</p>
                  )}
                  <div className="text-right mt-1">
                    <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
                      Forgot password?
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-sm rounded-full transition-all cursor-pointer border border-neutral-700 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isLoading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-[10px] text-neutral-500 font-medium leading-relaxed pt-1">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>,{' '}
              <Link to="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>, and Cookie Use.
            </p>

            <div className="pt-2 border-t border-neutral-900 pb-6 mb-4">
              <p className="text-xs font-bold text-neutral-400">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-purple-400 hover:text-purple-300 font-black cursor-pointer hover:underline"
                >
                  {isSignup ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: REAL BRAND LOGO */}
        <div className="lg:col-span-6 hidden lg:flex items-center justify-center relative">
          <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10 p-6">
            {/* Glowing Backdrop & Real Badge LogoIcon */}
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-6 bg-gradient-to-tr from-pink-500/40 via-purple-500/50 to-cyan-500/40 rounded-[35%] blur-3xl opacity-80 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
              <LogoIcon 
                className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-[0_20px_60px_rgba(150,59,255,0.6)] transform group-hover:scale-105 transition-transform duration-300 relative z-10" 
                variant="badge" 
                glow={true} 
              />
            </div>

            {/* Cool Brand Font Typography */}
            <div className="flex items-center justify-center gap-3 relative z-10">
              <span className="font-display font-black text-4xl sm:text-5xl tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                Cohort<span className="text-pink-500">.</span>
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Google Sign In Password Creation Modal */}
      {isCreatePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30 shadow-md">
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
                  className="w-full bg-black border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
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
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs font-extrabold text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
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
