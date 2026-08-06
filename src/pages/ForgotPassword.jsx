import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { validateEmail } from '@/utils/helpers';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { requestPasswordReset } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      showSuccess('Reset email sent! Please check your inbox.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send reset email. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the reset code');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Code verified!');
      setStep(3);
      setError('');
    } catch (err) {
      setError('Invalid code. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Password reset successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      setError('Failed to reset password. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-lg py-3xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-3xl">
          <div className="flex justify-center mb-lg">
            <Logo isLanding={false} iconSize="w-10 h-10" textSize="text-3xl" className="flex items-center gap-3 hover:scale-105 transition-transform" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-md">Reset Password</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {step === 1 ? 'Enter your email to receive a reset code'
              : step === 2 ? 'Enter the code sent to your email'
              : 'Create a new password'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-md mb-3xl">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        <Card className="mb-lg">
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-lg">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-md"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : <>Send Reset Code <ArrowRight className="w-5 h-5" /></>}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-lg">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-md">
                  We sent a code to <strong>{email}</strong>
                </p>
                <Input
                  label="Reset Code"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-md"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : <>Verify Code <ArrowRight className="w-5 h-5" /></>}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setCode('');
                }}
              >
                Didn't receive code? Go back
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-lg">
              <Input
                label="New Password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-md"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : <>Reset Password <ArrowRight className="w-5 h-5" /></>}
              </Button>
            </form>
          )}
        </Card>

        {/* Back to Sign Up */}
        <div className="text-center">
          <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
            Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
