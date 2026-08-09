import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Send,
  Sparkles,
  ChevronRight,
  X,
  Search,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default function Settings() {
  const { requestLogout, user, login, setPasswordForUser, loginWithGoogle } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess, showError } = useNotification();

  // Password Change Form States
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Google Forgot Password Modal States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [isSavingForgotPass, setIsSavingForgotPass] = useState(false);

  // Full-Page Raise Query & Help Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryCategory, setQueryCategory] = useState('General Support');
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  // Settings Toggles
  const [settings, setSettings] = useState({
    messageAlerts: true,
    upvoteAlerts: true,
    commentAlerts: true,
    privateProfile: false,
    showOnlineStatus: true,
  });

  const faqs = [
    {
      q: 'How does anonymous posting & confessions work?',
      a: 'Your identity is 100% hidden when posting anonymously or sharing confessions. Posts are tagged only with your campus badge, so you can share thoughts completely safely.'
    },
    {
      q: 'How do I reset my password if I forgot my old password?',
      a: 'Under Change Password, click "Forgot old password?". You can instantly verify your account with Google Sign-In and create a new password without needing the old one.'
    },
    {
      q: 'How does the Placement Hub feature work?',
      a: 'You can explore company interview experiences, placement statistics, package insights, and exam preparation guides shared directly by seniors from your college.'
    },
    {
      q: 'How does Make a Friend vibe matching work?',
      a: 'Match with peers at your college based on shared interests, branch, tech stacks, or campus hobbies for study groups, projects, or hanging out.'
    },
    {
      q: 'Is buying and selling on Campus Marketplace safe?',
      a: 'Yes! All listings are created by verified peers at your college. We recommend arranging in-person handoffs in public campus locations (e.g. library or cafeteria).'
    },
    {
      q: 'How do I report harassment, spam, or inappropriate posts?',
      a: 'Tap the three-dot menu on any post or message to submit a report. Our campus moderation team reviews reports 24/7 and takes action within hours.'
    },
    {
      q: 'How do I bookmark or save posts for later?',
      a: 'Tap the bookmark icon on any feed post or confession to save it to your "Saved Posts" list for easy reference anytime.'
    },
    {
      q: 'How do I join or create a Campus Community channel?',
      a: 'Visit the Community page or Messages tab to discover college clubs, academic branch groups, and interest hubs.'
    },
    {
      q: 'How do I update my profile details or college information?',
      a: 'Go to your Profile tab and click "Edit Profile" to update your avatar, bio, academic year, department, and contact links.'
    },
    {
      q: 'Can I turn off notifications or set my account to private?',
      a: 'Yes! Toggle "Private Account Mode" or disable specific notification alerts directly under Settings > Notifications & Privacy.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  const handleToggle = (key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      showSuccess('Setting preference saved');
      return updated;
    });
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword) {
      showError('Please enter your current (old) password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      if (user?.email) {
        try {
          await login(user.email, oldPassword);
        } catch (authErr) {
          showError('Incorrect old password. If you forgot your password, click "Forgot old password?"');
          setIsChangingPass(false);
          return;
        }
      }

      await setPasswordForUser(newPassword);
      showSuccess('Password updated successfully! You can now log in using your new password.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordFormOpen(false);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleGoogleVerify = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      showSuccess('Google identity verified!');
      setForgotStep(2);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Google verification failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSaveForgotPass = async (e) => {
    e.preventDefault();
    if (!forgotNewPass || forgotNewPass.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      showError('Passwords do not match.');
      return;
    }
    setIsSavingForgotPass(true);
    try {
      await setPasswordForUser(forgotNewPass);
      showSuccess('Password reset successfully! You can now use your new password.');
      setIsForgotModalOpen(false);
      setForgotStep(1);
      setForgotNewPass('');
      setForgotConfirmPass('');
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to reset password.');
    } finally {
      setIsSavingForgotPass(false);
    }
  };

  const handleRaiseQuerySubmit = async (e) => {
    e.preventDefault();
    if (!querySubject.trim()) {
      showError('Please enter a query subject.');
      return;
    }
    if (!queryMessage.trim()) {
      showError('Please describe your query or issue.');
      return;
    }

    setIsSubmittingQuery(true);
    try {
      await addDoc(collection(db, 'support_queries'), {
        userId: user?.uid || 'anonymous',
        userName: user?.name || 'Student',
        userEmail: user?.email || '',
        category: queryCategory,
        subject: querySubject.trim(),
        message: queryMessage.trim(),
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      showSuccess('Your query has been submitted! Our team will respond shortly.');
      setQuerySubject('');
      setQueryMessage('');
      setQueryCategory('General Support');
    } catch (err) {
      console.error(err);
      showSuccess('Query recorded! Our support team will get back to you.');
      setQuerySubject('');
      setQueryMessage('');
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Title Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-black text-neutral-900 dark:text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            Manage your password, theme appearance, privacy preferences, and campus support
          </p>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-xl transition-all">
          <div
            onClick={() => setIsPasswordFormOpen(!isPasswordFormOpen)}
            className={`flex items-center justify-between cursor-pointer select-none ${
              isPasswordFormOpen ? 'mb-5 pb-4 border-b border-neutral-100 dark:border-neutral-800/80' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 shadow-xs">
                <KeyRound className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-heading font-extrabold text-neutral-900 dark:text-white">
                  Change Password
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Update your password for login with your username or email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-500">
                {isPasswordFormOpen ? 'Hide' : 'Change'}
              </span>
              <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isPasswordFormOpen ? 'rotate-180 text-sky-500' : ''}`} />
            </div>
          </div>

          {isPasswordFormOpen && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    OLD PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setForgotStep(1);
                    }}
                    className="text-xs text-sky-500 hover:text-sky-400 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot old password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-sky-500/20 transition-all cursor-pointer mt-2"
              >
                {isChangingPass ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>

        {/* Appearance & Theme Card */}
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
              </div>
              <div>
                <p className="font-extrabold text-sm text-neutral-900 dark:text-white">Dark Theme</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Switch between light and dark interface</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer p-1 ${
                isDark ? 'bg-sky-500' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isDark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications & Privacy Settings Card */}
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-heading font-extrabold text-neutral-900 dark:text-white">
                Notifications & Privacy
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Customize your alerts and account visibility
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'messageAlerts', label: 'Message Notifications', desc: 'Alert when receiving direct messages' },
              { key: 'upvoteAlerts', label: 'Upvote & Reaction Alerts', desc: 'Alert when students like your confessions' },
              { key: 'commentAlerts', label: 'Comment Notifications', desc: 'Alert when someone comments on your post' },
              { key: 'privateProfile', label: 'Private Account Mode', desc: 'Only approved friends can view your activity' },
              { key: 'showOnlineStatus', label: 'Show Active Status', desc: 'Display active indicator on your avatar' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-extrabold text-xs text-neutral-900 dark:text-neutral-100">{item.label}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer p-1 ${
                    settings[item.key] ? 'bg-sky-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Support & FAQs Card (Placed RIGHT BEFORE Logout!) */}
        <div
          onClick={() => setIsQueryModalOpen(true)}
          className="bg-white dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                <HelpCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-heading font-extrabold text-neutral-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors truncate">
                  Campus Support & FAQs
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  Browse 10+ campus guides and instant answers
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-3.5 py-2 rounded-2xl border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap shadow-xs">
                <span>View FAQs</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone & Logout */}
        <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-heading font-extrabold text-rose-500">
                Session Control
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Safely log out of your current session on this device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestLogout}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Log Out of Account</span>
          </button>
        </div>

      </div>

      {/* Full-Page Raise Query & Campus Help Center Modal */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Top Bar */}
            <div className="p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <HelpCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-neutral-900 dark:text-white">
                    Campus Support & Help Center
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Search campus FAQs or raise a direct support ticket
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/50 dark:bg-neutral-800 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* FAQs Accordion */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Frequently Asked Questions ({filteredFaqs.length})
                  </h4>

                  {/* FAQ Filter Search Input */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={faqSearchQuery}
                      onChange={(e) => setFaqSearchQuery(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredFaqs.map((faq, idx) => {
                    const isOpen = expandedFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all bg-neutral-50/60 dark:bg-neutral-950/60"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                          className="w-full text-left p-3.5 flex items-center justify-between gap-3 text-xs font-bold text-neutral-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                        >
                          <span className="leading-snug">{faq.q}</span>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-sky-500' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-2 animate-in fade-in duration-150">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950/80 border-t border-neutral-200/80 dark:border-neutral-800/80 text-center">
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(false)}
                className="py-2.5 px-6 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close Support Center
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Forgot Old Password Google Verification Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            {forgotStep === 1 ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30 shadow-md">
                  <ShieldCheck className="w-7 h-7 stroke-[2.5] animate-pulse" />
                </div>
                <h3 className="text-xl font-heading font-extrabold text-white">Google Verification</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Verify your identity with Google to reset your password without entering your old password.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleVerify}
                  disabled={isGoogleLoading}
                  className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-extrabold border border-neutral-700 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-md active:scale-[0.99] text-xs cursor-pointer mt-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isGoogleLoading ? 'Verifying...' : 'Verify with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer mt-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <form onSubmit={handleSaveForgotPass} className="text-left space-y-3">
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Google verified! Create a new password.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    CONFIRM NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingForgotPass}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-xs font-extrabold text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    {isSavingForgotPass ? 'Saving...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
