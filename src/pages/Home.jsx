import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { PostCard } from '@/components/PostCard';
import { Image, Smile, AlertCircle, X, Pin, BarChart3, Check } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { UserAvatar } from '@/components/UserAvatar';
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

  // Pinned Daily Poll State
  const [selectedHomePollIndex, setSelectedHomePollIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('cohort_home_poll_selected');
      return saved !== null ? Number(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [homePollVotes, setHomePollVotes] = useState(() => {
    try {
      const saved = localStorage.getItem('cohort_home_poll_votes');
      return saved ? JSON.parse(saved) : [
        { label: 'Only if there is free double shot espresso', count: 84 },
        { label: 'Yes, sleep is for the weak', count: 36 },
        { label: 'I study CS. The sun is a myth.', count: 80 }
      ];
    } catch (e) {
      return [
        { label: 'Only if there is free double shot espresso', count: 84 },
        { label: 'Yes, sleep is for the weak', count: 36 },
        { label: 'I study CS. The sun is a myth.', count: 80 }
      ];
    }
  });

  const handleToggleHomePollVote = (index) => {
    setHomePollVotes(prev => {
      const updated = prev.map((opt, i) => {
        if (i === index) {
          const isRemoving = selectedHomePollIndex === index;
          return { ...opt, count: isRemoving ? Math.max(0, opt.count - 1) : opt.count + 1 };
        } else if (selectedHomePollIndex === i) {
          return { ...opt, count: Math.max(0, opt.count - 1) };
        }
        return opt;
      });
      try {
        localStorage.setItem('cohort_home_poll_votes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setSelectedHomePollIndex(prev => {
      const next = (prev === index ? null : index);
      try {
        if (next !== null) {
          localStorage.setItem('cohort_home_poll_selected', String(next));
        } else {
          localStorage.removeItem('cohort_home_poll_selected');
        }
      } catch (e) {}
      return next;
    });
  };

  const totalHomePollVotes = homePollVotes.reduce((acc, curr) => acc + curr.count, 0);

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

    // 1. Optimistic local state update (0ms UI latency)
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId
          ? {
              ...p,
              upvotes: newUpvotesCount,
              downvotes: newDownvotesCount,
              upvotedUsers: upvoted,
              downvotedUsers: downvoted
            }
          : p
      )
    );

    // 2. Firestore async persistence
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
        <div className="mb-lg p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-lg shadow-black/5 dark:shadow-black/30 transition-all">
          <div className="flex gap-3 sm:gap-4">
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'User'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm ring-2 ring-neutral-200/50 dark:ring-neutral-700/50 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's happening in your campus?"
                className="w-full bg-transparent text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none outline-none border-none focus:ring-0 leading-relaxed p-1"
                rows={3}
              />
              {imagePreviewUrl && (
                <div className="relative mt-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 max-h-60 shadow-md group">
                  <img src={imagePreviewUrl} alt="Preview" className="object-contain max-h-60 w-full" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-rose-600 text-white rounded-full p-1.5 transition-all shadow-lg backdrop-blur-xs cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
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
                className={`px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                  imageFile
                    ? 'bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)] scale-[1.02]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-sky-500/10 hover:text-sky-500 dark:hover:text-sky-400 border border-transparent hover:border-sky-500/20'
                }`}
                title="Add Photos"
              >
                <Image className={`w-4 h-4 transition-transform duration-300 ${imageFile ? 'scale-110 text-sky-500' : ''}`} />
                <span>Add Photos</span>
                {imageFile && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCreatePost}
              disabled={(!postContent.trim() && !imageFile) || isUploading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isUploading ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </div>

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
