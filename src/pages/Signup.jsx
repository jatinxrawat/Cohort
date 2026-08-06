import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { useNotification } from '@/contexts/NotificationContext';
import { validateEmail, validatePassword } from '@/utils/helpers';
import { useDebounce } from '@/hooks';

const COLLEGES = [
  { id: 1, name: 'Delhi University', abbr: 'DU', location: 'Delhi' },
  { id: 2, name: 'IIT Mumbai', abbr: 'IITB', location: 'Mumbai' },
  { id: 3, name: 'BITS Pilani', abbr: 'BITS', location: 'Pilani' },
  { id: 4, name: 'Ashoka University', abbr: 'AU', location: 'Delhi' },
  { id: 5, name: 'Delhi School of Economics', abbr: 'DSE', location: 'Delhi' },
  { id: 6, name: 'IIT Delhi', abbr: 'IITD', location: 'Delhi' },
  { id: 7, name: 'Presidency University', abbr: 'PU', location: 'Bangalore' },
  { id: 8, name: 'Christ University', abbr: 'CU', location: 'Bangalore' },
  { id: 9, name: 'VIT Vellore', abbr: 'VIT', location: 'Vellore' },
  { id: 10, name: 'Manipal Academy', abbr: 'MAHE', location: 'Manipal' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: null,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const debouncedSearch = useDebounce(collegeSearch, 300);

  const filteredColleges = useMemo(() => {
    if (!debouncedSearch) return COLLEGES;
    return COLLEGES.filter(college =>
      college.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      college.abbr.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch]);

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

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.college) newErrors.college = 'Please select your college';
    if (!formData.agreeToTerms) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        college: formData.college.name
      };

      await signup(userData);
      showSuccess('Account created successfully!');
      navigate('/home');
    } catch (error) {
      console.error(error);
      showError(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
          <h1 className="text-3xl font-heading font-bold mb-md">Join Cohort</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Create your account in {step === 1 ? 'two' : 'one'} step</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-md mb-3xl">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* Signup Form */}
        <Card className="mb-lg">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-md px-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-all flex items-center justify-center gap-md shadow-sm hover:shadow active:scale-[0.99] mb-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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

              <div className="relative flex items-center justify-center my-lg">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="bg-white dark:bg-neutral-900 px-md text-xs text-neutral-400 uppercase font-semibold absolute">
                  Or register with email
                </span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-lg">
            {step === 1 ? (
              <>
                <Input
                  label="Full Name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  icon={User}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@college.edu"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  icon={Mail}
                />

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center gap-md"
                  onClick={handleNext}
                >
                  Next <ArrowRight className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      error={errors.password}
                      icon={Lock}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
                    Your College
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
                      className="input-base text-left flex items-center justify-between"
                    >
                      {formData.college ? (
                        <span>{formData.college.name}</span>
                      ) : (
                        <span className="text-neutral-400">Select your college</span>
                      )}
                      <Building2 className="w-5 h-5 text-neutral-400" />
                    </button>

                    {showCollegeDropdown && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg">
                        <div className="p-md border-b border-neutral-100 dark:border-neutral-800">
                          <input
                            type="text"
                            placeholder="Search colleges..."
                            value={collegeSearch}
                            onChange={(e) => setCollegeSearch(e.target.value)}
                            className="input-base text-sm"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredColleges.map(college => (
                            <button
                              key={college.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('college', college);
                                setShowCollegeDropdown(false);
                                setCollegeSearch('');
                              }}
                              className="w-full text-left px-lg py-md hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                            >
                              <p className="font-medium text-neutral-900 dark:text-white">{college.name}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{college.location}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.college && (
                      <p className="text-xs text-danger mt-xs">{errors.college}</p>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-md">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 mt-xs"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary-500 hover:text-primary-600 font-medium">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary-500 hover:text-primary-600 font-medium">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-danger">{errors.terms}</p>}

                <div className="flex gap-md">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="flex-1 flex items-center justify-center gap-md"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : <>Create Account <ArrowRight className="w-5 h-5" /></>}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
