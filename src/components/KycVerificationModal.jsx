import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { isCollegeEmail, verifyEmailMatchesCollege, predictGenderFromName } from '@/utils/helpers';
import { Button } from '@/components/Button';
import { Building2, Mail, ShieldAlert, CheckCircle, RefreshCw, Sparkles, X, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';

export const KycVerificationModal = () => {
  const { user, isKycModalOpen, closeKycModal, setKycVerified } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter otp, 3 = success
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef(null);

  // Sync timers
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  // Clean states on modal close/open
  useEffect(() => {
    if (isKycModalOpen) {
      setStep(1);
      setEmailInput('');
      setOtpInput('');
      setErrorMsg('');
      setResendTimer(0);
    }
  }, [isKycModalOpen]);

  if (!isKycModalOpen || !user) return null;

  const currentCollege = user.college || 'KIET';

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const targetEmail = emailInput.trim();

    if (!targetEmail) {
      setErrorMsg('Email address is required.');
      return;
    }

    if (!isCollegeEmail(targetEmail)) {
      setErrorMsg('Please enter a valid student/college email address (e.g. ends with .edu, .ac.in, etc.).');
      return;
    }

    // Verify it matches the user's selected college
    const isMatching = verifyEmailMatchesCollege(targetEmail, currentCollege);
    if (!isMatching) {
      setErrorMsg(`This email does not seem to belong to "${currentCollege}". Please use your official email for this campus.`);
      return;
    }

    setIsLoading(true);
    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const emailKey = targetEmail.toLowerCase();

      // 1. Store verification OTP in Firestore
      await setDoc(doc(db, 'otps', `kyc_${user.uid}`), {
        otp: generatedOtp,
        email: emailKey,
        createdAt: new Date().toISOString()
      });

      // 2. Dispatch email via send-otp API
      const origin = window.location.origin;
      const isMobileApp = origin.startsWith('capacitor://') || (origin.startsWith('http://localhost') && !window.location.port) || origin.startsWith('file://');
      const apiUrl = isMobileApp ? `https://cohortnow.online/api/send-otp` : '/api/send-otp';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailKey, otp: generatedOtp }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to dispatch email.');
      }

      showSuccess('Verification code sent to your student email!');
      
      // Developer Mode convenience
      if (resData.otp) {
        console.log(`%c[KYC OTP Code (Dev Mode)] ${resData.otp}`, 'color: #ea580c; font-size: 16px; font-weight: bold;');
        if (resData.previewUrl) {
          console.log(`[Email Preview Link] ${resData.previewUrl}`);
        }
        showSuccess(`[Dev Mode] OTP is ${resData.otp} (Logged to console)`);
      }

      setStep(2);
      setResendTimer(30);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to send OTP code. Please try again.');
      showError('Failed to send OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const targetOtp = otpInput.trim();

    if (!targetOtp || targetOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const otpDocRef = doc(db, 'otps', `kyc_${user.uid}`);
      const otpSnap = await getDoc(otpDocRef);

      if (!otpSnap.exists()) {
        setErrorMsg('Verification code not found. Please request a new one.');
        return;
      }

      const otpData = otpSnap.data();

      // Check if OTP matches
      if (otpData.otp !== targetOtp) {
        setErrorMsg('Invalid verification code. Please check your email and try again.');
        return;
      }

      // Check expiration (10 minutes)
      const createdAt = new Date(otpData.createdAt);
      const now = new Date();
      const diffMinutes = (now - createdAt) / 1000 / 60;
      if (diffMinutes > 10) {
        setErrorMsg('Verification code has expired. Please request a new one.');
        return;
      }

      // 3. Mark user as KYC verified in database and auth context
      const predicted = predictGenderFromName(otpData.email);
      await setKycVerified(otpData.email, predicted);

      showSuccess('Student email verified successfully!');
      setStep(3);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to verify OTP. Please try again.');
      showError('Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Dark blur backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
        onClick={step === 3 ? closeKycModal : undefined} 
      />

      {/* Glassmorphic Modal Body */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 z-10 my-auto transform transition-all backdrop-blur-2xl overflow-hidden"
      >
        {/* Glow backgrounds */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-44 h-44 rounded-full bg-primary-500/10 dark:bg-primary-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-44 h-44 rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-3xl pointer-events-none" />

        {/* Close Button */}
        {step !== 3 && (
          <button 
            onClick={closeKycModal}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5 text-left"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-neutral-900 dark:text-white">
                  Verify Student Identity
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Join the official <strong className="text-neutral-900 dark:text-white font-bold">{currentCollege}</strong> community. Verify your student email to post on the college wall, confessions tab, and unlock matchmaking.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                    Official College Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="e.g. kushal@kiet.edu"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 text-neutral-900 dark:text-neutral-100 transition-all font-medium"
                    />
                    <Mail className="w-4.5 h-4.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5 text-left"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-neutral-900 dark:text-white">
                  Enter Verification Code
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  We sent a 6-digit code to <strong className="text-neutral-900 dark:text-white font-bold">{emailInput}</strong>. Enter it below to complete your campus verification.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                      setErrorMsg('');
                    }}
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 text-center text-xl font-black font-mono tracking-[0.4em] rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100 transition-all font-medium"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verify Code</span>
                  )}
                </Button>

                <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 pt-2 font-medium">
                  <button 
                    type="button" 
                    onClick={() => { setStep(1); setErrorMsg(''); }}
                    className="hover:underline text-primary-500 hover:text-primary-600 cursor-pointer"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || isLoading}
                    onClick={handleResend}
                    className={`flex items-center gap-1 cursor-pointer font-bold ${
                      resendTimer > 0 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'text-primary-500 hover:underline hover:text-primary-600'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-4"
            >
              <div className="relative inline-flex mb-2">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border-2 border-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 animate-bounce text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 text-primary-500 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-heading font-extrabold text-neutral-900 dark:text-white">
                  Profile Verified! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Congratulations! You have successfully verified your enrollment at <strong className="text-neutral-900 dark:text-white font-bold">{currentCollege}</strong>. All campus walls, confessions, and matchmaking are now fully unlocked.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={closeKycModal}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                  Enter Campus Wall
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
