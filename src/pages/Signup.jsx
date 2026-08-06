import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function Signup() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      navigate('/home');
    } catch (error) {
      console.error(error);
      showError(error.message || 'Google sign in failed. Please try again.');
    } finally {
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
      let loginEmail = formData.email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@student.edu`;
      }
      await login(loginEmail, formData.password);
      showSuccess('Welcome back to Cohort!');
      navigate('/home');
    } catch (error) {
      console.error(error);
      showError(error.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 bg-black text-white relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d946ef] via-[#8b5cf6] to-[#0ea5e9] text-white flex items-center justify-center font-display font-black text-2xl shadow-xl shadow-purple-500/25 transition-transform duration-300 group-hover:scale-105">
              C
            </div>
            <span className="font-display font-black text-3xl tracking-tight text-white flex items-baseline">
              Cohort<span className="text-[#ff2a85] font-black text-3xl ml-0.5">.</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-1 text-white">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Sign in to access your campus network & messages
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0b0b0e] border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 bg-black hover:bg-neutral-900 text-white font-bold border border-neutral-800 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] mb-6 text-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-neutral-800 w-full" />
            <span className="bg-[#0b0b0e] px-3 text-[10px] text-neutral-500 tracking-wider uppercase font-bold absolute">
              OR WITH EMAIL / USERNAME
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email / Username Box */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-2 uppercase tracking-wider">
                EMAIL OR USERNAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="your@college.edu or handle"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full bg-[#131318] border ${
                    errors.email ? 'border-red-500/80' : 'border-neutral-800'
                  } rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full bg-[#131318] border ${
                    errors.password ? 'border-red-500/80' : 'border-neutral-800'
                  } rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all`}
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
                <p className="text-xs text-red-400 mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-neutral-500 font-medium">
            Protected by Cohort Student Verification Protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
