import React, { useState } from 'react';
import { Bell, Lock, Eye, Users, Trash2, LogOut } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function Settings() {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess } = useNotification();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    privateProfile: false,
    allowMessages: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    showSuccess('Setting updated!');
  };

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = () => {
    if (confirm('This action cannot be undone. Are you sure?')) {
      showSuccess('Account deletion initiated...');
    }
  };

  return (
    <div className="section-container">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold mb-3xl">Settings</h1>

        {/* Appearance */}
        <Card className="mb-lg">
          <h2 className="text-xl font-heading font-bold mb-lg">Appearance</h2>
          <div className="space-y-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Switch between light and dark theme</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isDark ? 'bg-primary-500' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="mb-lg">
          <h2 className="text-xl font-heading font-bold mb-lg flex items-center gap-md">
            <Bell className="w-6 h-6" /> Notifications
          </h2>
          <div className="space-y-lg">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Get email for important updates' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings[item.key] ? 'bg-primary-500' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings[item.key] ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy */}
        <Card className="mb-lg">
          <h2 className="text-xl font-heading font-bold mb-lg flex items-center gap-md">
            <Lock className="w-6 h-6" /> Privacy & Security
          </h2>
          <div className="space-y-lg">
            {[
              { key: 'privateProfile', label: 'Private Profile', desc: 'Only friends can see your posts' },
              { key: 'allowMessages', label: 'Allow Messages', desc: 'Control who can message you' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings[item.key] ? 'bg-primary-500' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings[item.key] ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Account */}
        <Card className="mb-lg">
          <h2 className="text-xl font-heading font-bold mb-lg">Account</h2>
          <div className="space-y-md">
            <div className="pb-md border-b border-neutral-100 dark:border-neutral-800">
              <p className="font-medium mb-xs">Email: {user?.email}</p>
              <Button variant="secondary" size="sm">Change Email</Button>
            </div>
            <div>
              <p className="font-medium mb-md">Password</p>
              <Button variant="secondary" size="sm">Change Password</Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger/20 bg-red-50 dark:bg-red-950/20">
          <h2 className="text-xl font-heading font-bold mb-lg text-danger">Danger Zone</h2>
          <div className="space-y-md">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-md px-lg py-md text-danger hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-md px-lg py-md text-danger hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
