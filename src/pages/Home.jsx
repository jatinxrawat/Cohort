import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { PostCard } from '@/components/PostCard';
import { Image, Smile, AlertCircle, X, Pin, BarChart3, Check, Camera, BarChart2, Paperclip, FileText, Plus } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { UserAvatar } from '@/components/UserAvatar';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import SEO from '@/components/SEO';
import HomeRightPanel from '@/components/HomeRightPanel';
import { MentionTextArea } from '@/components/MentionTextArea';
import FeedToggle from '@/components/FeedToggle';

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
  const { postId: paramPostId } = useParams();
  const [searchParams] = useSearchParams();
  const targetPostId = paramPostId || searchParams.get('post');
  
  const [posts, setPosts] = useState([]);
  const [feedType, setFeedType] = useState('public');
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [highlightedPostId, setHighlightedPostId] = useState(null);

  // Trigger subtle corner highlight (0.7s) and smooth scroll for shared post
  useEffect(() => {
    if (targetPostId) {
      setHighlightedPostId(targetPostId);
      const timer = setTimeout(() => {
        setHighlightedPostId(null);
      }, 700);

      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        clearTimeout(scrollTimer);
      };
    }
  }, [targetPostId]);

  // Image & Attachment Upload States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // Document Attachment State
  const [documentFile, setDocumentFile] = useState(null);

  // Poll Creation State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);


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

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      showSuccess(`Attached document: ${file.name}`);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !imageFile && !documentFile && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) return;

    setIsUploading(true);
    let uploadedImageUrl = null;

    try {
      if (imageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(imageFile);
      }

      const validPollOptions = pollOptions.filter(o => o.trim() !== '');
      const hasValidPoll = pollQuestion.trim() !== '' && validPollOptions.length >= 2;

      const postData = {
        authorUid: user?.uid || null,
        college: user?.college || 'KIET',
        author: {
          uid: user?.uid || null,
          username: user?.username || null,
          name: user?.name || 'Student',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
          role: user?.college || 'KIET',
          college: user?.college || 'KIET',
          email: user?.email || null,
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
        ...(hasValidPoll ? {
          poll: {
            question: pollQuestion.trim(),
            options: validPollOptions.map(t => ({ text: t.trim(), votes: 0 })),
            totalVotes: 0,
            votedUsers: [],
            userChoices: {}
          }
        } : {}),
        ...(documentFile ? {
          attachedFile: {
            name: documentFile.name,
            size: `${(documentFile.size / 1024).toFixed(1)} KB`
          }
        } : {})
      };

      await addDoc(collection(db, 'posts'), postData);
      setPostContent('');
      handleRemoveImage();
      setDocumentFile(null);
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      showSuccess('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post in Firestore:', error);
      showError('Failed to upload attachment or create post. Please try again.');
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

  const userCollege = user?.college || 'KIET';
  const displayedPosts = posts.filter(post => {
    if (feedType === 'public') return true;
    const postCollege = post.college || post.author?.college || post.author?.role;
    if (!postCollege) return true;
    const cleanPost = String(postCollege).toLowerCase().trim();
    const cleanUser = String(userCollege).toLowerCase().trim();
    return cleanPost.includes(cleanUser) || cleanUser.includes(cleanPost);
  });

  return (
    <div className="section-container !py-6 !px-4 xl:!px-6">
      <SEO title="Campus Feed" />
      {/* Desktop: 2-column layout (feed + right panel) | Mobile: single column */}
      <div className="flex gap-6 items-start w-full max-w-[1100px] ml-auto mr-2 xl:mr-4">
        {/* Main Feed Column */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {/* Feed Switcher (Public vs My College) */}
          <FeedToggle
            activeFeed={feedType}
            onChangeFeed={setFeedType}
            userCollege={userCollege}
          />

          {/* Create Post */}
          <div className="mb-lg p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-lg shadow-black/5 dark:shadow-black/30 transition-all">
            <div className="flex gap-3 sm:gap-4">
              <UserAvatar
                src={user?.avatar}
                name={user?.name || 'User'}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm ring-2 ring-neutral-200/50 dark:ring-neutral-700/50 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <MentionTextArea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening in your campus? Type #hashtag or @mention..."
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

                {/* Document Preview */}
                {documentFile && (
                  <div className="relative mt-3 p-3 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4.5 h-4.5 text-purple-500 flex-shrink-0" />
                      <span className="truncate text-neutral-800 dark:text-neutral-200">{documentFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentFile(null)}
                      className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Inline Campus Poll Creator */}
                {showPollCreator && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-purple-500/5 dark:bg-neutral-800/80 border border-purple-500/20 dark:border-neutral-700 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5" /> Create Campus Poll
                      </span>
                      <button
                        type="button"
                        onClick={() => { setShowPollCreator(false); setPollQuestion(''); setPollOptions(['', '']); }}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask your campus a question..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 font-medium"
                    />
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...pollOptions];
                              next[idx] = e.target.value;
                              setPollOptions(next);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 font-medium"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {pollOptions.length < 4 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Gallery Photo Input */}
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
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    imageFile
                      ? 'bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-sky-500/10 hover:text-sky-500 dark:hover:text-sky-400 border border-transparent'
                  }`}
                  title="Gallery Photos"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Photos</span>
                </button>

                {/* 3. Poll Share Creator */}
                <button
                  type="button"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    showPollCreator
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-purple-500/10 hover:text-purple-500 dark:hover:text-purple-400 border border-transparent'
                  }`}
                  title="Share Poll"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Poll</span>
                </button>

                {/* 4. Document/File Attachment */}
                <input
                  type="file"
                  ref={documentInputRef}
                  onChange={handleDocumentChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    documentFile
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400 border border-transparent'
                  }`}
                  title="Attach File / Document"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>File</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={(!postContent.trim() && !imageFile && !documentFile && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) || isUploading}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
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
          ) : displayedPosts.length > 0 ? (
            <div>
              {displayedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  onRepost={handleRepost}
                  onSave={handleSave}
                  isHighlighted={highlightedPostId === post.id || highlightedPostId === post.docId}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-5xl">
              <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
              <h3 className="font-bold text-lg mb-xs">
                {feedType === 'college' ? `No posts from ${userCollege} yet` : 'No posts yet'}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {feedType === 'college'
                  ? `Be the first student from ${userCollege} to share something with your campus!`
                  : 'Be the first one to share something with your campus community!'}
              </p>
            </Card>
          )}
        </div>

        {/* Desktop Right Panel — hidden on mobile/tablet */}
        <HomeRightPanel />
      </div>
    </div>
  );
}
