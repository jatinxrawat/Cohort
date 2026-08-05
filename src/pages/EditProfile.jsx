import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || 'Computer Science Student & Developer',
    college: user?.college || 'Delhi University',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUser(formData);
      showSuccess('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      showError('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-container max-w-2xl">
      <h1 className="text-3xl font-heading font-bold mb-lg">Edit Profile</h1>
      
      <Card>
        <form onSubmit={handleSubmit} className="space-y-lg">
          <div>
            <label className="block font-medium mb-md text-sm">Profile Picture</label>
            <div className="flex items-center gap-lg">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
                alt={user?.name || 'User'}
                className="w-20 h-20 rounded-full border-2 border-primary-500"
              />
              <span className="text-xs text-neutral-500">Avatar generated from profile name</span>
            </div>
          </div>

          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block font-medium mb-md text-sm">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input-base resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          <Input
            label="College / University"
            value={formData.college}
            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
          />

          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
