import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/utils/firebase';
import { Camera, AlertTriangle } from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import { UserAvatar } from '@/components/UserAvatar';
import SEO from '@/components/SEO';
import CollegeSelector from '@/components/CollegeSelector';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Image Upload States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [cropperSrc, setCropperSrc] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    college: user?.college || 'Delhi University',
    gender: user?.gender || 'Prefer not to say',
    year: user?.year || '1st Year',
    dob: user?.dob || '',
  });

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    const defaultUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`;
    setAvatarPreviewUrl(defaultUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let uploadedAvatarUrl = user?.avatar || '';
      
      // If a preview URL is a default Dicebear URL and avatarFile is null, it means they clicked "Remove Photo"
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('https://api.dicebear.com')) {
        uploadedAvatarUrl = avatarPreviewUrl;
      } else if (avatarFile) {
        uploadedAvatarUrl = await uploadImageToCloudinary(avatarFile);
      }

      const updatedData = {
        ...formData,
        avatar: uploadedAvatarUrl,
      };

      await updateUser(updatedData);
      showSuccess('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      showError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "WARNING: Are you sure you want to permanently delete your Cohort profile and account? This action is irreversible."
    );
    if (!confirmation) return;

    setIsDeleting(true);
    try {
      if (user?.uid) {
        // 1. Delete from Firestore users collection
        const userRef = doc(db, 'users', user.uid);
        await deleteDoc(userRef);
      }

      // 2. Delete from Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.delete();
      }

      // 3. Logout & redirect
      await logout();
      showSuccess('Your account was successfully deleted.');
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      // Fallback: If delete requires re-login, log out anyway after deleting Firestore doc
      await logout();
      showSuccess('Your profile was removed.');
      navigate('/');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="section-container max-w-2xl">
      <SEO title="Edit Profile" />
      <h1 className="text-3xl font-heading font-bold mb-lg">Edit Profile</h1>
      
      <Card className="mb-lg">
        <form onSubmit={handleSubmit} className="space-y-lg">
          {/* Profile Picture */}
          <div>
            <label className="block font-semibold mb-md text-sm text-neutral-700 dark:text-neutral-300">
              Profile Picture
            </label>
            <div className="flex items-center gap-lg">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <UserAvatar
                  src={avatarPreviewUrl || user?.avatar}
                  name={user?.name || 'User'}
                  className="w-20 h-20 rounded-full border-2 border-primary-500 object-cover shadow-sm group-hover:opacity-85 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setCropperSrc(URL.createObjectURL(file));
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <div className="flex gap-md">
                  <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Upload New
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={handleRemovePhoto}
                  >
                    Remove Photo
                  </Button>
                </div>
                <span className="text-[10px] text-neutral-400">JPG, PNG or SVG. Max 5MB.</span>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          {/* Bio */}
          <div>
            <label className="block font-semibold mb-md text-sm text-neutral-700 dark:text-neutral-300">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input-base resize-none text-sm px-lg py-md"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* College / University Selector with Toggle */}
          <CollegeSelector
            value={formData.college}
            onChange={(newCollege) => setFormData({ ...formData, college: newCollege })}
          />

          {/* Gender and Year of Study */}
          <div className="grid grid-cols-2 gap-lg">
            <div>
              <label className="block font-semibold mb-md text-sm text-neutral-700 dark:text-neutral-300">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-base text-sm h-10 py-0"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-md text-sm text-neutral-700 dark:text-neutral-300">
                Year of Study
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="input-base text-sm h-10 py-0"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block font-semibold mb-md text-sm text-neutral-700 dark:text-neutral-300">
              Date of Birth (DOB)
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="input-base text-sm h-10"
              required
            />
          </div>

          <div className="flex gap-md pt-md border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-950 bg-red-50/20 dark:bg-red-950/10">
        <div className="flex items-start gap-md">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-xs flex-shrink-0" />
          <div className="space-y-md flex-1">
            <div>
              <h3 className="text-base font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
              <p className="text-xs text-neutral-500 mt-xs">
                Deleting your profile will permanently remove your user credentials and profile details. All your personal discussions will be disassociated.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="border-red-300 hover:border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              {isDeleting ? 'Deleting Account...' : 'Delete Profile & Account'}
            </Button>
          </div>
        </div>
      </Card>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCrop={(croppedFile) => {
            setAvatarFile(croppedFile);
            setAvatarPreviewUrl(URL.createObjectURL(croppedFile));
            setCropperSrc(null);
          }}
          onCancel={() => {
            setCropperSrc(null);
          }}
        />
      )}
    </div>
  );
}
