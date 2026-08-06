import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { PostCard } from '@/components/PostCard';
import { Image, Smile, AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { uploadImageToCloudinary } from '@/utils/cloudinary';

const FAKE_NAMES = [
  'priya sharma',
  'arjun kumar',
  'neha patel',
  'rohan verma',
  'rohan sen',
  'abhishek roy',
  'aditya das',
  'riya gupta',
  'prof. s. r. rao',
  'senior batch 2024',
  'google',
  'amazon',
  'microsoft',
  'uber',
  'razorpay'
];

export default function Home() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Image Upload States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Subscribe to real-time posts from Firestore on mount
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const authorName = (data.author?.name || '').toLowerCase();
        const isFake = FAKE_NAMES.some(fake => authorName.includes(fake));

        if (isFake) {
          deleteDoc(doc(db, 'posts', docSnap.id)).catch(err => console.error('Purging fake post:', err));
        } else {
          loaded.push({
            id: docSnap.id,
            docId: docSnap.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
          });
        }
      });

      setPosts(loaded);
      setLoading(false);
    }, (err) => {
      console.error('Real-time posts error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!postContent.trim() && !imageFile) return;

    setIsUploading(true);
    let uploadedImageUrl = null;

    try {
      if (imageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(imageFile);
      }

      const postData = {
        author: {
          uid: user?.uid || null,
          username: user?.username || null,
          name: user?.name || 'Student',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
          role: user?.college || 'Student',
        },
        content: postContent.trim(),
        imageUrl: uploadedImageUrl,
        timestamp: new Date(),
        upvotes: 0,
        downvotes: 0,
        upvotedUsers: [],
        downvotedUsers: [],
        comments: 0,
        reposts: 0,
        saved: false,
      };

      await addDoc(collection(db, 'posts'), postData);
      setPostContent('');
      handleRemoveImage();
      showSuccess('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post in Firestore:', error);
      showError('Failed to upload image or create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVote = async (postId, direction) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost || !targetPost.docId) return;

    const myUid = user?.uid || 'guest';
    let upvoted = [...(targetPost.upvotedUsers || [])];
    let downvoted = [...(targetPost.downvotedUsers || [])];

    if (direction === 'up') {
      if (upvoted.includes(myUid)) {
        // Toggle off upvote
        upvoted = upvoted.filter(u => u !== myUid);
      } else {
        upvoted.push(myUid);
        downvoted = downvoted.filter(u => u !== myUid);
      }
    } else if (direction === 'down') {
      if (downvoted.includes(myUid)) {
        // Toggle off downvote
        downvoted = downvoted.filter(u => u !== myUid);
      } else {
        downvoted.push(myUid);
        upvoted = upvoted.filter(u => u !== myUid);
      }
    }

    const newUpvotesCount = upvoted.length;
    const newDownvotesCount = downvoted.length;

    try {
      const docRef = doc(db, 'posts', targetPost.docId);
      await updateDoc(docRef, {
        upvotes: newUpvotesCount,
        downvotes: newDownvotesCount,
        upvotedUsers: upvoted,
        downvotedUsers: downvoted
      });
    } catch (error) {
      console.error('Failed to update votes in Firestore:', error);
    }
  };

  const handleRepost = async (postId) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost || !targetPost.docId) return;

    const newRepostsCount = (targetPost.reposts || 0) + 1;
    showSuccess('Reposted to your feed!');

    try {
      const docRef = doc(db, 'posts', targetPost.docId);
      await updateDoc(docRef, {
        reposts: newRepostsCount
      });
    } catch (error) {
      console.error('Failed to update reposts in Firestore:', error);
    }
  };

  const handleSave = (postId) => {
    let nextSavedStatus = false;
    const updated = posts.map(post => {
      if (post.id === postId) {
        nextSavedStatus = !post.saved;
        return { ...post, saved: nextSavedStatus };
      }
      return post;
    });

    setPosts(updated);

    // Sync saved posts list in localStorage
    const savedItems = updated.filter(p => p.saved);
    localStorage.setItem('collex-saved-posts', JSON.stringify(savedItems));

    showSuccess(nextSavedStatus ? 'Post saved to bookmarks!' : 'Post removed from bookmarks!');
  };

  return (
    <div className="section-container">
      <div className="max-w-2xl mx-auto">
        {/* Create Post */}
        <Card className="mb-lg">
          <div className="flex gap-md mb-lg">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
              alt={user?.name || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's happening in your campus?"
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-lg py-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-neutral-400 text-sm"
                rows={3}
              />
              {imagePreviewUrl && (
                <div className="relative mt-md rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 max-h-60 flex items-center justify-center">
                  <img src={imagePreviewUrl} alt="Preview" className="object-contain max-h-60 w-full" />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-full p-1.5 transition-colors shadow-md"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-lg border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex gap-md">
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="text-neutral-500 hover:text-primary-500 p-md rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                title="Add Image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button className="text-neutral-500 hover:text-primary-500 p-md rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreatePost}
              disabled={(!postContent.trim() && !imageFile) || isUploading}
            >
              {isUploading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </Card>

        {/* Feed */}
        {loading ? (
          <div className="space-y-md">
            <div className="h-32 skeleton rounded-xl" />
            <div className="h-32 skeleton rounded-xl" />
          </div>
        ) : posts.length > 0 ? (
          <div>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={handleVote}
                onRepost={handleRepost}
                onSave={handleSave}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-5xl">
            <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
            <h3 className="font-bold text-lg mb-xs">No posts yet</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Be the first one to share something with your campus community!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
