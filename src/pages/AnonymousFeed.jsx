import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Flag,
  Send,
  Plus,
  Clock,
  Flame,
  EyeOff,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertCircle,
  Repeat,
  Zap,
  PenSquare,
  CornerDownRight,
  X
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatRelativeTime } from '@/utils/helpers';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, increment, arrayUnion, arrayRemove, getDocs, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';

const ANONYMOUS_NAMES = [
  'Anonymous Fox',
  'Anonymous Owl',
  'Anonymous Tiger',
  'Anonymous Wolf',
  'Anonymous Falcon',
  'Anonymous Bear',
  'Anonymous Lynx',
  'Anonymous Panther',
];

const renderGenderBadge = (gender) => {
  if (!gender || gender === 'Prefer not to say') return null;
  const g = gender.toLowerCase();
  if (g === 'male') {
    return (
      <span
        title="Gender: Male"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 shadow-xs"
      >
        <span className="font-mono text-xs font-black">♂</span>
        <span>Male</span>
      </span>
    );
  }
  if (g === 'female') {
    return (
      <span
        title="Gender: Female"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-500 dark:text-pink-400 border border-pink-500/30 shadow-xs"
      >
        <span className="font-mono text-xs font-black">♀</span>
        <span>Female</span>
      </span>
    );
  }
  if (g === 'non-binary') {
    return (
      <span
        title="Gender: Non-binary"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30 shadow-xs"
      >
        <span className="font-mono text-xs font-black">⚧</span>
        <span>Non-binary</span>
      </span>
    );
  }
  return null;
};

export default function AnonymousFeed({ defaultTab }) {
  const { user } = useAuth();
  const { showSuccess, showWarning } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = () => {
    if (defaultTab) return defaultTab;
    if (location.pathname === '/confessions') return 'confessions';
    return 'feed';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [posts, setPosts] = useState([]);
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname === '/confessions') {
      setActiveTab('confessions');
    } else if (location.pathname === '/anonymous') {
      setActiveTab('feed');
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postType, setPostType] = useState('feed'); // 'feed' | 'confession'
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Comment drawers
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({});

  // Edit & Delete Post State
  const [editingPost, setEditingPost] = useState(null);
  const [editedPostText, setEditedPostText] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);

  // Delete Comment State
  const [deletingComment, setDeletingComment] = useState(null);

  // Reply & Comment Likes State
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [expandedRepliesMap, setExpandedRepliesMap] = useState({});
  const commentInputRef = useRef(null);

  // Reshare State
  const [reshareTargetPost, setReshareTargetPost] = useState(null);
  const [showReshareModal, setShowReshareModal] = useState(false);
  const [reshareMode, setReshareMode] = useState(null);
  const [thoughtCaption, setThoughtCaption] = useState('');
  const [isSubmittingReshare, setIsSubmittingReshare] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState(null);

  // Edit Post Handler
  const handleOpenEditPost = (post) => {
    setEditingPost(post);
    setEditedPostText(post.text || '');
    setOpenPostMenuId(null);
  };

  const handleSaveEditedPost = async () => {
    if (!editingPost || !editedPostText.trim()) return;
    setIsSubmittingEdit(true);
    const targetColl = editingPost.expiresAtMs ? 'confessions' : 'anonymousPosts';
    try {
      await updateDoc(doc(db, targetColl, editingPost.id), {
        text: editedPostText.trim()
      });
      showSuccess('Post updated successfully!');
      setEditingPost(null);
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Post Handler
  const confirmDeletePost = async () => {
    if (!deletingPost) return;
    const targetColl = deletingPost.expiresAtMs ? 'confessions' : 'anonymousPosts';
    try {
      await deleteDoc(doc(db, targetColl, deletingPost.id));

      if (deletingPost.isReshare && deletingPost.originalPostId) {
        try {
          await updateDoc(doc(db, targetColl, deletingPost.originalPostId), {
            repostsCount: increment(-1),
            resharedUsers: user?.uid ? arrayRemove(user.uid) : []
          });
        } catch (e) {
          console.error('Failed to update repost count:', e);
        }
      }

      showSuccess('Post deleted successfully!');
      setDeletingPost(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Delete Comment Handler
  const confirmDeleteComment = async () => {
    if (!deletingComment) return;
    const { commentId, postId, isConfession } = deletingComment;
    const targetColl = isConfession ? 'confessions' : 'anonymousPosts';
    try {
      await deleteDoc(doc(db, targetColl, postId, 'comments', commentId));

      const countKey = isConfession ? 'comments' : 'commentsCount';
      const targetList = isConfession ? confessions : posts;
      const targetObj = targetList.find(p => p.id === postId);
      const currentCount = targetObj ? (targetObj[countKey] || 1) : 1;

      await updateDoc(doc(db, targetColl, postId), {
        [countKey]: Math.max(0, currentCount - 1)
      });

      showSuccess('Comment deleted successfully.');
      setDeletingComment(null);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Reshare Handlers
  const handleOpenReshare = (post) => {
    setReshareTargetPost(post);
    setShowReshareModal(true);
    setReshareMode(null);
    setThoughtCaption('');
  };

  const handleReshareInstant = async () => {
    if (!reshareTargetPost) return;
    const targetColl = reshareTargetPost.expiresAtMs ? 'confessions' : 'anonymousPosts';
    const rootOriginalPostId = reshareTargetPost.originalPostId || reshareTargetPost.id;
    const origAuthorName = reshareTargetPost.originalPost?.anonymousName || reshareTargetPost.anonymousName || 'Anonymous Fox';
    const origText = reshareTargetPost.originalPost?.text || reshareTargetPost.text;
    const myUid = user?.uid || 'anonymous_guest';
    const randomIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
    const chosenName = ANONYMOUS_NAMES[randomIndex];

    setIsSubmittingReshare(true);
    try {
      await addDoc(collection(db, targetColl), {
        authorUid: myUid,
        anonymousName: chosenName,
        isReshare: true,
        originalPostId: rootOriginalPostId,
        originalPost: {
          id: rootOriginalPostId,
          anonymousName: origAuthorName,
          text: origText,
          createdAt: reshareTargetPost.createdAt
        },
        resharedBy: {
          uid: myUid,
          name: chosenName
        },
        thought: '',
        text: '',
        likesCount: 0,
        likedUsers: [],
        commentsCount: 0,
        repostsCount: 0,
        resharedUsers: [],
        createdAt: new Date()
      });

      await updateDoc(doc(db, targetColl, rootOriginalPostId), {
        repostsCount: increment(1),
        resharedUsers: arrayUnion(myUid)
      });

      showSuccess('Post reshared anonymously!');
      setShowReshareModal(false);
      setReshareTargetPost(null);
    } catch (err) {
      console.error('Failed to reshare post:', err);
    } finally {
      setIsSubmittingReshare(false);
    }
  };

  const handleReshareWithThoughts = async () => {
    if (!reshareTargetPost || !thoughtCaption.trim()) return;
    const targetColl = reshareTargetPost.expiresAtMs ? 'confessions' : 'anonymousPosts';
    const rootOriginalPostId = reshareTargetPost.originalPostId || reshareTargetPost.id;
    const origAuthorName = reshareTargetPost.originalPost?.anonymousName || reshareTargetPost.anonymousName || 'Anonymous Fox';
    const origText = reshareTargetPost.originalPost?.text || reshareTargetPost.text;
    const myUid = user?.uid || 'anonymous_guest';
    const randomIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
    const chosenName = ANONYMOUS_NAMES[randomIndex];

    setIsSubmittingReshare(true);
    try {
      await addDoc(collection(db, targetColl), {
        authorUid: myUid,
        anonymousName: chosenName,
        isReshare: true,
        originalPostId: rootOriginalPostId,
        originalPost: {
          id: rootOriginalPostId,
          anonymousName: origAuthorName,
          text: origText,
          createdAt: reshareTargetPost.createdAt
        },
        resharedBy: {
          uid: myUid,
          name: chosenName
        },
        thought: thoughtCaption.trim(),
        text: thoughtCaption.trim(),
        likesCount: 0,
        likedUsers: [],
        commentsCount: 0,
        repostsCount: 0,
        resharedUsers: [],
        createdAt: new Date()
      });

      await updateDoc(doc(db, targetColl, rootOriginalPostId), {
        repostsCount: increment(1),
        resharedUsers: arrayUnion(myUid)
      });

      showSuccess('Post reshared with thoughts!');
      setShowReshareModal(false);
      setReshareTargetPost(null);
      setThoughtCaption('');
    } catch (err) {
      console.error('Failed to reshare post:', err);
    } finally {
      setIsSubmittingReshare(false);
    }
  };

  const handleUnreshare = async (post) => {
    const targetColl = post.expiresAtMs ? 'confessions' : 'anonymousPosts';
    const rootOriginalPostId = post.originalPostId || post.id;
    const myUid = user?.uid || 'anonymous_guest';

    try {
      await updateDoc(doc(db, targetColl, rootOriginalPostId), {
        repostsCount: increment(-1),
        resharedUsers: arrayRemove(myUid)
      });

      const q = query(
        collection(db, targetColl),
        where('isReshare', '==', true),
        where('originalPostId', '==', rootOriginalPostId),
        where('authorUid', '==', myUid)
      );
      const snap = await getDocs(q);
      snap.forEach(async (docSnap) => {
        await deleteDoc(doc(db, targetColl, docSnap.id));
      });

      showSuccess('Reshare removed.');
      setShowReshareModal(false);
      setReshareTargetPost(null);
    } catch (err) {
      console.error('Failed to unreshare:', err);
    }
  };

  // 1. Real-time listener for Feed Posts (anonymousPosts)
  useEffect(() => {
    const q = query(collection(db, 'anonymousPosts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const loaded = [];
      snapshot.forEach(d => {
        const data = d.data();
        loaded.push({
          id: d.id,
          docId: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        });
      });
      setPosts(loaded);
      setLoading(false);
    }, err => {
      console.error('Error fetching anonymousPosts:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Real-time listener for Confessions (confessions collection)
  useEffect(() => {
    const q = query(collection(db, 'confessions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const loaded = [];
      snapshot.forEach(d => {
        const data = d.data();
        const expiresAtMs = data.expiresAt?.toDate
          ? data.expiresAt.toDate().getTime()
          : new Date(data.expiresAt || (data.createdAt?.toDate ? data.createdAt.toDate().getTime() + 86400000 : now + 86400000)).getTime();

        if (expiresAtMs > now) {
          loaded.push({
            id: d.id,
            docId: d.id,
            ...data,
            expiresAtMs,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
          });
        }
      });
      setConfessions(loaded);
    }, err => {
      console.error('Error fetching confessions:', err);
    });

    return () => unsub();
  }, []);

  // Listen to comments subcollection for open post/confession
  useEffect(() => {
    if (!activeCommentPostId) return;

    const targetColl = activeTab === 'confessions' ? 'confessions' : 'anonymousPosts';
    const commentsRef = collection(db, targetColl, activeCommentPostId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const loaded = [];
      snapshot.forEach(d => {
        const data = d.data();
        loaded.push({
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        });
      });
      setCommentsMap(prev => ({ ...prev, [activeCommentPostId]: loaded }));
    });

    return () => unsub();
  }, [activeCommentPostId, activeTab]);

  const getRemainingTimeStr = (expiresAtMs) => {
    const diffSec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const handleOpenCreateModal = () => {
    setPostType(activeTab === 'confessions' ? 'confession' : 'feed');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    const randomIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
    const chosenName = ANONYMOUS_NAMES[randomIndex];

    try {
      if (postType === 'confession' || activeTab === 'confessions') {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        await addDoc(collection(db, 'confessions'), {
          authorUid: user?.uid || 'anonymous_guest',
          gender: user?.gender || 'Prefer not to say',
          text: inputText.trim(),
          createdAt: now,
          expiresAt: expiresAt,
          likes: 0,
          likedUsers: [],
          comments: 0,
          reports: false
        });
        showSuccess('24-Hour Confession published!');
      } else {
        await addDoc(collection(db, 'anonymousPosts'), {
          authorUid: user?.uid || 'anonymous_guest',
          gender: user?.gender || 'Prefer not to say',
          anonymousName: chosenName,
          text: inputText.trim(),
          likesCount: 0,
          likedUsers: [],
          commentsCount: 0,
          reported: false,
          createdAt: new Date()
        });
        showSuccess('Anonymous post published!');
      }

      setInputText('');
      setIsCreateOpen(false);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (item, isConfession) => {
    const targetColl = isConfession ? 'confessions' : 'anonymousPosts';
    const myUid = user?.uid || 'guest';
    let likedList = [...(item.likedUsers || [])];

    if (likedList.includes(myUid)) {
      likedList = likedList.filter(u => u !== myUid);
    } else {
      likedList.push(myUid);
    }

    try {
      const docRef = doc(db, targetColl, item.docId);
      if (isConfession) {
        await updateDoc(docRef, { likes: likedList.length, likedUsers: likedList });
      } else {
        await updateDoc(docRef, { likesCount: likedList.length, likedUsers: likedList });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async (itemId, isConfession) => {
    if (!commentText.trim()) return;

    const textToSend = commentText.trim();
    const targetReply = replyingToComment;
    setCommentText('');
    setReplyingToComment(null);

    const parentId = targetReply?.parentId || null;
    const targetColl = isConfession ? 'confessions' : 'anonymousPosts';
    const randomIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
    const chosenName = ANONYMOUS_NAMES[randomIndex];

    try {
      await addDoc(collection(db, targetColl, itemId, 'comments'), {
        authorUid: user?.uid || 'anonymous_guest',
        anonymousName: chosenName,
        text: textToSend,
        parentId: parentId,
        replyToAuthorUid: targetReply?.authorUid || null,
        replyToAuthorName: targetReply?.author || null,
        likes: 0,
        likedBy: [],
        createdAt: new Date()
      });

      const docRef = doc(db, targetColl, itemId);
      const currentItem = (isConfession ? confessions : posts).find(i => i.id === itemId);
      const countKey = isConfession ? 'comments' : 'commentsCount';
      const prevCount = currentItem ? (currentItem[countKey] || 0) : 0;

      await updateDoc(docRef, { [countKey]: prevCount + 1 });
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleToggleCommentLike = async (commentId, postId, isConfession) => {
    const targetColl = isConfession ? 'confessions' : 'anonymousPosts';
    const myUid = user?.uid || 'guest';

    const commentsList = commentsMap[postId] || [];
    const targetComment = commentsList.find(c => c.id === commentId);
    if (!targetComment) return;

    let likedBy = Array.isArray(targetComment.likedBy) ? [...targetComment.likedBy] : [];
    if (likedBy.includes(myUid)) {
      likedBy = likedBy.filter(u => u !== myUid);
    } else {
      likedBy.push(myUid);
    }

    try {
      await updateDoc(doc(db, targetColl, postId, 'comments', commentId), {
        likedBy: likedBy,
        likes: likedBy.length
      });
    } catch (err) {
      console.error('Error toggling comment like:', err);
    }
  };

  const renderTaggedCommentText = (text) => {
    if (!text) return '';
    const mentionRegex = /(@[a-zA-Z0-9_\s]+?)(?=\s|$|[.,!?])/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="font-bold text-violet-400 bg-violet-950/40 px-1 py-0.5 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const toggleReplies = (commentId) => {
    setExpandedRepliesMap(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleInitiateReplyToComment = (c, postId) => {
    const name = c.anonymousName || 'Anonymous';
    setReplyingToComment({
      commentId: c.id,
      authorUid: c.authorUid,
      author: name,
      parentId: c.parentId || c.id
    });
    setCommentText(`@${name} `);

    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleReport = async (itemId, isConfession) => {
    const targetColl = isConfession ? 'confessions' : 'anonymousPosts';
    try {
      const docRef = doc(db, targetColl, itemId);
      await updateDoc(docRef, { [isConfession ? 'reports' : 'reported']: true });
      showWarning('Report submitted for moderation.');
    } catch (err) {
      console.error('Error reporting:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-900 dark:text-zinc-100 p-md md:p-xl space-y-xl pb-24 lg:pb-12 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto border-b border-neutral-200 dark:border-zinc-800/80 pb-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 dark:from-violet-400 dark:via-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
            Anonymous
          </h1>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-xs font-medium tracking-wide">
            Share freely. Nobody knows it’s you.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs px-lg py-md rounded-full shadow-[0_0_20px_rgba(139,92,246,0.35)] border border-violet-400/30 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>{activeTab === 'confessions' ? 'Post Confession' : 'Create Post'}</span>
        </button>
      </div>

      {/* Segmented Switcher */}
      <div className="max-w-xs mx-auto p-xs bg-neutral-200/80 dark:bg-zinc-900/90 border border-neutral-300 dark:border-zinc-800 rounded-full flex items-center relative shadow-inner">
        <button
          onClick={() => { setActiveTab('feed'); setActiveCommentPostId(null); navigate('/anonymous'); }}
          className={`flex-1 py-xs rounded-full text-xs font-semibold flex items-center justify-center gap-xs transition-colors relative z-10 ${
            activeTab === 'feed' ? 'text-white' : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Feed</span>
          {activeTab === 'feed' && (
            <motion.div
              layoutId="anonSegment"
              className="absolute inset-0 bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.5)] rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('confessions'); setActiveCommentPostId(null); navigate('/confessions'); }}
          className={`flex-1 py-xs rounded-full text-xs font-semibold flex items-center justify-center gap-xs transition-colors relative z-10 ${
            activeTab === 'confessions' ? 'text-white' : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span>Confessions</span>
          <span className="text-[9px] font-mono px-xs py-[1px] rounded-full bg-neutral-300 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border border-neutral-400 dark:border-zinc-700">24h</span>
          {activeTab === 'confessions' && (
            <motion.div
              layoutId="anonSegment"
              className="absolute inset-0 bg-rose-600/90 shadow-[0_0_15px_rgba(244,63,94,0.5)] rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-lg">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'feed' ? (
          /* FEED TAB */
          posts.length > 0 ? (
            <div className="space-y-lg">
              {posts.map(post => {
                const isLiked = (post.likedUsers || []).includes(user?.uid || 'guest');
                const isPostOwner = post.authorUid === user?.uid;
                const isResharedByMe = Boolean(user?.uid && (post.resharedUsers || []).includes(user.uid));
                const reshareCount = post.repostsCount || post.reposts || 0;
                const commentsList = commentsMap[post.id] || [];

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-neutral-200 dark:border-zinc-800/90 hover:border-violet-500/40 bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-lg transition-all duration-300 space-y-md shadow-xs dark:shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                  >
                    {/* Reshared By Header Strip */}
                    {post.isReshare && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-zinc-400 mb-2 pb-2 border-b border-neutral-200 dark:border-zinc-800/60">
                        <Repeat className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                        <span>Reshared by <strong className="text-neutral-800 dark:text-zinc-200 font-bold">{post.resharedBy?.name || 'Anonymous'}</strong></span>
                        <span>•</span>
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-500">{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-300">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-xs flex-wrap">
                            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/40 px-md py-xs rounded-full border border-violet-200 dark:border-violet-500/20">
                              {post.anonymousName || 'Anonymous Fox'}
                            </span>
                            {renderGenderBadge(post.gender || (isPostOwner ? user?.gender : null))}
                            {isPostOwner && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shadow-xs">
                                Posted by You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block font-medium mt-xs ml-xs">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Options Dropdown Menu for Post Owner */}
                      {isPostOwner && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openPostMenuId === post.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden text-xs">
                              <button
                                onClick={() => handleOpenEditPost(post)}
                                className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-neutral-800 dark:text-zinc-200 font-semibold cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" /> Edit Post
                              </button>
                              <button
                                onClick={() => { setDeletingPost(post); setOpenPostMenuId(null); }}
                                className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content / Thoughts & Embedded Preview */}
                    {post.thought && (
                      <p className="text-neutral-900 dark:text-zinc-100 text-sm font-semibold leading-relaxed">
                        {post.thought}
                      </p>
                    )}

                    {post.isReshare ? (
                      <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-md bg-neutral-50 dark:bg-zinc-950/60 space-y-xs my-xs">
                        <div className="flex items-center gap-xs text-xs font-bold text-violet-600 dark:text-violet-300">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{post.originalPost?.anonymousName || 'Anonymous Fox'}</span>
                        </div>
                        <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                          {post.originalPost?.text || post.text}
                        </p>
                      </div>
                    ) : (
                      <p className="text-neutral-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {post.text}
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-neutral-200 dark:border-zinc-800/80 pt-md text-xs font-semibold">
                      <div className="flex items-center gap-md">
                        <button
                          onClick={() => handleLikePost(post, false)}
                          className={`flex items-center gap-xs px-md py-xs rounded-full transition-all ${
                            isLiked
                              ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                              : 'text-neutral-500 dark:text-zinc-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                          <span>{post.likesCount || 0}</span>
                        </button>

                        <button
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                          className="flex items-center gap-xs px-md py-xs rounded-full text-neutral-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        {/* Repost Pill Button */}
                        {!isPostOwner && (
                          <button
                            onClick={() => {
                              if (isResharedByMe) {
                                handleUnreshare(post);
                              } else {
                                handleOpenReshare(post);
                              }
                            }}
                            className={`flex items-center gap-xs px-md py-xs rounded-full transition-all cursor-pointer ${
                              isResharedByMe
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                                : 'text-neutral-500 dark:text-zinc-400 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-zinc-800/60'
                            }`}
                            title={isResharedByMe ? "Click to unreshare" : "Reshare post"}
                          >
                            <Repeat className="w-4 h-4" />
                            <span>{reshareCount}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showSuccess('Post link copied!');
                          }}
                          className="flex items-center gap-xs px-md py-xs rounded-full text-neutral-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleReport(post.id, false)}
                        className="text-neutral-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 p-xs transition-colors"
                        title="Report"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {activeCommentPostId === post.id && (
                      <div className="pt-md border-t border-zinc-800/80 space-y-md">
                        <div className="space-y-sm max-h-72 overflow-y-auto pr-xs">
                          {commentsList.length > 0 ? (
                            (() => {
                              const topComments = commentsList.filter(c => !c.parentId);
                              return topComments.map(c => {
                                const repliesForThis = commentsList.filter(r => r.parentId === c.id);
                                const isLikedByMe = Array.isArray(c.likedBy) && c.likedBy.includes(user?.uid);
                                const cLikeCount = c.likes || (c.likedBy ? c.likedBy.length : 0);
                                const isExpanded = Boolean(expandedRepliesMap[c.id]);

                                return (
                                  <div key={c.id} className="space-y-xs">
                                    {/* Main Parent Comment */}
                                    <div className="bg-zinc-950/90 p-md rounded-xl border border-zinc-800 text-xs flex items-start justify-between gap-md group">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-xs">
                                          <span className="font-semibold text-violet-400">{c.anonymousName || 'Anonymous'}</span>
                                          {c.authorUid === user?.uid && (
                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">You</span>
                                          )}
                                          <span className="text-[10px] text-zinc-500">{formatRelativeTime(c.createdAt)}</span>
                                        </div>
                                        <p className="text-zinc-200 leading-relaxed">{renderTaggedCommentText(c.text)}</p>

                                        {/* Action row: Reply, Likes, Delete */}
                                        <div className="flex items-center gap-md mt-2 text-[10px] text-zinc-400 font-semibold">
                                          {cLikeCount > 0 && (
                                            <span>{cLikeCount} {cLikeCount === 1 ? 'like' : 'likes'}</span>
                                          )}
                                          <button
                                            onClick={() => handleInitiateReplyToComment(c, post.id)}
                                            className="hover:text-violet-300 transition-colors cursor-pointer"
                                          >
                                            Reply
                                          </button>
                                          {c.authorUid === user?.uid && (
                                            <button
                                              onClick={() => setDeletingComment({ commentId: c.id, postId: post.id, isConfession: false })}
                                              className="hover:text-rose-400 transition-colors cursor-pointer"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Comment Heart Like Button */}
                                      <button
                                        onClick={() => handleToggleCommentLike(c.id, post.id, false)}
                                        className="p-1 text-zinc-500 hover:text-rose-400 transition-all flex-shrink-0 cursor-pointer"
                                        title={isLikedByMe ? "Unlike" : "Like"}
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                                      </button>
                                    </div>

                                    {/* Nested Replies Section */}
                                    {repliesForThis.length > 0 && (
                                      <div className="pl-6 space-y-xs">
                                        <button
                                          onClick={() => toggleReplies(c.id)}
                                          className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors py-0.5 cursor-pointer"
                                        >
                                          <span className="w-5 h-[1px] bg-zinc-700 inline-block" />
                                          <span>
                                            {isExpanded
                                              ? 'Hide replies'
                                              : `View ${repliesForThis.length} ${repliesForThis.length === 1 ? 'reply' : 'replies'}`}
                                          </span>
                                        </button>

                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="space-y-xs border-l-2 border-zinc-800/80 ml-2 pl-2"
                                            >
                                              {repliesForThis.map(r => {
                                                const isReplyLiked = Array.isArray(r.likedBy) && r.likedBy.includes(user?.uid);
                                                const rLikeCount = r.likes || (r.likedBy ? r.likedBy.length : 0);

                                                return (
                                                  <div key={r.id} className="bg-zinc-950/60 p-sm rounded-lg border border-zinc-800/80 text-xs flex items-start justify-between gap-md">
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2 mb-xs">
                                                        <span className="font-semibold text-violet-400">{r.anonymousName || 'Anonymous'}</span>
                                                        <span className="text-[10px] text-zinc-500">{formatRelativeTime(r.createdAt)}</span>
                                                      </div>
                                                      <p className="text-zinc-300 leading-relaxed">{renderTaggedCommentText(r.text)}</p>

                                                      <div className="flex items-center gap-md mt-1.5 text-[10px] text-zinc-400 font-semibold">
                                                        {rLikeCount > 0 && (
                                                          <span>{rLikeCount} {rLikeCount === 1 ? 'like' : 'likes'}</span>
                                                        )}
                                                        <button
                                                          onClick={() => handleInitiateReplyToComment(r, post.id)}
                                                          className="hover:text-violet-300 transition-colors cursor-pointer"
                                                        >
                                                          Reply
                                                        </button>
                                                        {r.authorUid === user?.uid && (
                                                          <button
                                                            onClick={() => setDeletingComment({ commentId: r.id, postId: post.id, isConfession: false })}
                                                            className="hover:text-rose-400 transition-colors cursor-pointer"
                                                          >
                                                            Delete
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>

                                                    <button
                                                      onClick={() => handleToggleCommentLike(r.id, post.id, false)}
                                                      className="p-1 text-zinc-500 hover:text-rose-400 transition-all flex-shrink-0 cursor-pointer"
                                                    >
                                                      <Heart className={`w-3 h-3 ${isReplyLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()
                          ) : (
                            <p className="text-xs text-zinc-500 italic">No replies yet. Be the first!</p>
                          )}
                        </div>

                        {/* Replying Banner Above Input */}
                        <AnimatePresence>
                          {replyingToComment && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="flex items-center justify-between px-md py-xs bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-300"
                            >
                              <span className="flex items-center gap-xs">
                                <CornerDownRight className="w-3.5 h-3.5 text-violet-400" />
                                Replying to <strong className="text-white font-bold">@{replyingToComment.author}</strong>
                              </span>
                              <button
                                onClick={() => setReplyingToComment(null)}
                                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Input Box */}
                        <div className="flex items-center gap-md">
                          <input
                            ref={commentInputRef}
                            type="text"
                            placeholder={replyingToComment ? `Reply to @${replyingToComment.author}...` : "Reply anonymously..."}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id, false)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-lg py-xs text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id, false)}
                            disabled={!commentText.trim()}
                            className="p-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-full transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5xl border border-zinc-800/80 bg-zinc-900/40 rounded-3xl p-2xl space-y-lg shadow-xl">
              <div className="w-14 h-14 bg-violet-950/40 rounded-full border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto">
                <EyeOff className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">No anonymous posts yet</h3>
                <p className="text-xs text-zinc-400 mt-xs">
                  Be the first student to start the conversation safely and anonymously.
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-md rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-violet-400/30 text-xs transition-all hover:scale-[1.02]"
              >
                Create Anonymous Post
              </button>
            </div>
          )
        ) : (
          /* CONFESSIONS TAB (NGL Inspired Disappearing Cards) */
          confessions.length > 0 ? (
            <div className="space-y-lg">
              {confessions.map(confession => {
                const commentsList = commentsMap[confession.id] || [];
                const isConfessionOwner = confession.authorUid === user?.uid;
                const isResharedByMe = Boolean(user?.uid && (confession.resharedUsers || []).includes(user.uid));
                const reshareCount = confession.repostsCount || confession.reposts || 0;

                return (
                  <motion.div
                    key={confession.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-3xl p-xl bg-gradient-to-br from-white via-violet-50/40 to-white dark:from-zinc-900 dark:via-violet-950/30 dark:to-zinc-900 border border-violet-200 dark:border-violet-500/30 shadow-md dark:shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:border-violet-400/50 hover:shadow-lg dark:hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] space-y-lg transition-all duration-300"
                  >
                    {/* Header Badges */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-xs flex-wrap">
                        <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-xs bg-rose-500/10 px-md py-xs rounded-full border border-rose-500/20">
                          <Flame className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Confession
                        </span>
                        {renderGenderBadge(confession.gender || (isConfessionOwner ? user?.gender : null))}
                        {isConfessionOwner && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shadow-xs">
                            Posted by You
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-sm">
                        <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-xs bg-amber-500/10 px-md py-xs rounded-full border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          {getRemainingTimeStr(confession.expiresAtMs)}
                        </span>

                        {isConfessionOwner && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenPostMenuId(openPostMenuId === confession.id ? null : confession.id)}
                              className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openPostMenuId === confession.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden text-xs">
                                <button
                                  onClick={() => handleOpenEditPost(confession)}
                                  className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-neutral-800 dark:text-zinc-200 font-semibold cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" /> Edit Confession
                                </button>
                                <button
                                  onClick={() => { setDeletingPost(confession); setOpenPostMenuId(null); }}
                                  className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Confession
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Centered Confession Text */}
                    <div className="py-md text-center">
                      <p className="text-lg md:text-xl font-heading font-semibold text-neutral-900 dark:text-zinc-100 leading-relaxed px-sm">
                        "{confession.text}"
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-neutral-200 dark:border-zinc-800/80 pt-md text-xs font-semibold">
                      <div className="flex items-center gap-md">
                        <button
                          onClick={() => setActiveCommentPostId(activeCommentPostId === confession.id ? null : confession.id)}
                          className="flex items-center gap-xs px-md py-xs rounded-full text-neutral-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{confession.comments || 0}</span>
                        </button>

                        {!isConfessionOwner && (
                          <button
                            onClick={() => {
                              if (isResharedByMe) {
                                handleUnreshare(confession);
                              } else {
                                handleOpenReshare(confession);
                              }
                            }}
                            className={`flex items-center gap-xs px-md py-xs rounded-full transition-all cursor-pointer ${
                              isResharedByMe
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                                : 'text-neutral-500 dark:text-zinc-400 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-zinc-800/60'
                            }`}
                            title={isResharedByMe ? "Click to unreshare" : "Reshare confession"}
                          >
                            <Repeat className="w-4 h-4" />
                            <span>{reshareCount}</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleReport(confession.id, true)}
                        className="text-neutral-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 p-xs transition-colors"
                        title="Report"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {activeCommentPostId === confession.id && (
                      <div className="pt-md border-t border-zinc-800/80 space-y-md">
                        <div className="space-y-sm max-h-72 overflow-y-auto pr-xs">
                          {commentsList.length > 0 ? (
                            (() => {
                              const topComments = commentsList.filter(c => !c.parentId);
                              return topComments.map(c => {
                                const repliesForThis = commentsList.filter(r => r.parentId === c.id);
                                const isLikedByMe = Array.isArray(c.likedBy) && c.likedBy.includes(user?.uid);
                                const cLikeCount = c.likes || (c.likedBy ? c.likedBy.length : 0);
                                const isExpanded = Boolean(expandedRepliesMap[c.id]);

                                return (
                                  <div key={c.id} className="space-y-xs">
                                    {/* Main Parent Comment */}
                                    <div className="bg-zinc-950/90 p-md rounded-xl border border-zinc-800 text-xs flex items-start justify-between gap-md group">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-xs">
                                          <span className="font-semibold text-violet-400">{c.anonymousName || 'Anonymous'}</span>
                                          <span className="text-[10px] text-zinc-500">{formatRelativeTime(c.createdAt)}</span>
                                        </div>
                                        <p className="text-zinc-200 leading-relaxed">{renderTaggedCommentText(c.text)}</p>

                                        {/* Action row: Reply, Likes, Delete */}
                                        <div className="flex items-center gap-md mt-2 text-[10px] text-zinc-400 font-semibold">
                                          {cLikeCount > 0 && (
                                            <span>{cLikeCount} {cLikeCount === 1 ? 'like' : 'likes'}</span>
                                          )}
                                          <button
                                            onClick={() => handleInitiateReplyToComment(c, confession.id)}
                                            className="hover:text-violet-300 transition-colors cursor-pointer"
                                          >
                                            Reply
                                          </button>
                                          {c.authorUid === user?.uid && (
                                            <button
                                              onClick={() => setDeletingComment({ commentId: c.id, postId: confession.id, isConfession: true })}
                                              className="hover:text-rose-400 transition-colors cursor-pointer"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Comment Heart Like Button */}
                                      <button
                                        onClick={() => handleToggleCommentLike(c.id, confession.id, true)}
                                        className="p-1 text-zinc-500 hover:text-rose-400 transition-all flex-shrink-0 cursor-pointer"
                                        title={isLikedByMe ? "Unlike" : "Like"}
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                                      </button>
                                    </div>

                                    {/* Nested Replies Section */}
                                    {repliesForThis.length > 0 && (
                                      <div className="pl-6 space-y-xs">
                                        <button
                                          onClick={() => toggleReplies(c.id)}
                                          className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors py-0.5 cursor-pointer"
                                        >
                                          <span className="w-5 h-[1px] bg-zinc-700 inline-block" />
                                          <span>
                                            {isExpanded
                                              ? 'Hide replies'
                                              : `View ${repliesForThis.length} ${repliesForThis.length === 1 ? 'reply' : 'replies'}`}
                                          </span>
                                        </button>

                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="space-y-xs border-l-2 border-zinc-800/80 ml-2 pl-2"
                                            >
                                              {repliesForThis.map(r => {
                                                const isReplyLiked = Array.isArray(r.likedBy) && r.likedBy.includes(user?.uid);
                                                const rLikeCount = r.likes || (r.likedBy ? r.likedBy.length : 0);

                                                return (
                                                  <div key={r.id} className="bg-zinc-950/60 p-sm rounded-lg border border-zinc-800/80 text-xs flex items-start justify-between gap-md">
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2 mb-xs">
                                                        <span className="font-semibold text-violet-400">{r.anonymousName || 'Anonymous'}</span>
                                                        <span className="text-[10px] text-zinc-500">{formatRelativeTime(r.createdAt)}</span>
                                                      </div>
                                                      <p className="text-zinc-300 leading-relaxed">{renderTaggedCommentText(r.text)}</p>

                                                      <div className="flex items-center gap-md mt-1.5 text-[10px] text-zinc-400 font-semibold">
                                                        {rLikeCount > 0 && (
                                                          <span>{rLikeCount} {rLikeCount === 1 ? 'like' : 'likes'}</span>
                                                        )}
                                                        <button
                                                          onClick={() => handleInitiateReplyToComment(r, confession.id)}
                                                          className="hover:text-violet-300 transition-colors cursor-pointer"
                                                        >
                                                          Reply
                                                        </button>
                                                        {r.authorUid === user?.uid && (
                                                          <button
                                                            onClick={() => setDeletingComment({ commentId: r.id, postId: confession.id, isConfession: true })}
                                                            className="hover:text-rose-400 transition-colors cursor-pointer"
                                                          >
                                                            Delete
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>

                                                    <button
                                                      onClick={() => handleToggleCommentLike(r.id, confession.id, true)}
                                                      className="p-1 text-zinc-500 hover:text-rose-400 transition-all flex-shrink-0 cursor-pointer"
                                                    >
                                                      <Heart className={`w-3 h-3 ${isReplyLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()
                          ) : (
                            <p className="text-xs text-zinc-500 italic">No replies yet. Leave an anonymous response!</p>
                          )}
                        </div>

                        {/* Replying Banner Above Input */}
                        <AnimatePresence>
                          {replyingToComment && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="flex items-center justify-between px-md py-xs bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-300"
                            >
                              <span className="flex items-center gap-xs">
                                <CornerDownRight className="w-3.5 h-3.5 text-violet-400" />
                                Replying to <strong className="text-white font-bold">@{replyingToComment.author}</strong>
                              </span>
                              <button
                                onClick={() => setReplyingToComment(null)}
                                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Input Box */}
                        <div className="flex items-center gap-md">
                          <input
                            ref={commentInputRef}
                            type="text"
                            placeholder={replyingToComment ? `Reply to @${replyingToComment.author}...` : "Reply to confession..."}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(confession.id, true)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-lg py-xs text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleAddComment(confession.id, true)}
                            disabled={!commentText.trim()}
                            className="p-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-full transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5xl border border-zinc-800/80 bg-zinc-900/40 rounded-3xl p-2xl space-y-lg shadow-xl">
              <div className="w-14 h-14 bg-rose-950/30 rounded-full border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <Flame className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">No active 24h confessions</h3>
                <p className="text-xs text-zinc-400 mt-xs">
                  Share a secret confession. It automatically disappears after 24 hours.
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-md rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-violet-400/30 text-xs transition-all hover:scale-[1.02]"
              >
                Post 24h Confession
              </button>
            </div>
          )
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={activeTab === 'confessions' ? 'Post 24h Confession' : 'Create Anonymous Post'}
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-lg">
          {activeTab === 'confessions' && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-xs rounded-lg font-medium text-center flex items-center justify-center gap-xs">
              <Clock className="w-3.5 h-3.5" /> This confession disappears automatically after 24 hours.
            </p>
          )}

          <div>
            <textarea
              rows={4}
              placeholder={
                activeTab === 'confessions'
                  ? "Share your secret confession..."
                  : "What's on your mind? Share anonymously..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-md text-sm text-white resize-none placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1 text-xs" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || !inputText.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs"
            >
              {isSubmitting ? 'Publishing...' : activeTab === 'confessions' ? 'Publish Confession' : 'Publish Anonymously'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Post Modal */}
      {editingPost && (
        <Modal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          title="Edit Anonymous Post"
          size="md"
        >
          <div className="space-y-md py-xs">
            <textarea
              value={editedPostText}
              onChange={(e) => setEditedPostText(e.target.value)}
              rows={4}
              className="w-full p-md bg-zinc-900 border border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 text-white leading-relaxed resize-none"
              placeholder="Edit your post content..."
            />
            <div className="flex items-center justify-end gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingPost(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!editedPostText.trim() || isSubmittingEdit}
                onClick={handleSaveEditedPost}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Post UI Confirmation Modal */}
      {deletingPost && (
        <Modal
          isOpen={Boolean(deletingPost)}
          onClose={() => setDeletingPost(null)}
          title="Delete Post"
          size="sm"
        >
          <div className="text-center py-sm space-y-md">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Are you sure?</h4>
              <p className="text-xs text-zinc-400 mt-xs leading-relaxed">
                This post will be permanently deleted from the anonymous feed. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingPost(null)}
                className="w-full text-xs"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeletePost}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Comment UI Confirmation Modal */}
      {deletingComment && (
        <Modal
          isOpen={Boolean(deletingComment)}
          onClose={() => setDeletingComment(null)}
          title="Delete Comment"
          size="sm"
        >
          <div className="text-center py-sm space-y-md">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Delete this comment?</h4>
              <p className="text-xs text-zinc-400 mt-xs leading-relaxed">
                This comment will be permanently removed. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingComment(null)}
                className="w-full text-xs"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeleteComment}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reshare Modal (LinkedIn Style for Anonymous Posts) */}
      {showReshareModal && reshareTargetPost && (
        <Modal
          isOpen={showReshareModal}
          onClose={() => {
            setShowReshareModal(false);
            setReshareTargetPost(null);
            setReshareMode(null);
            setThoughtCaption('');
          }}
          title={reshareMode === 'thoughts' ? "Reshare with your thoughts" : "Reshare Anonymous Post"}
          size="md"
        >
          {reshareMode === 'thoughts' ? (
            <div className="space-y-md py-xs">
              <div className="flex items-center gap-md">
                <div className="w-8 h-8 rounded-full bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Post Anonymously
                  </h4>
                  <span className="text-[10px] text-zinc-400">
                    Posting to anonymous feed
                  </span>
                </div>
              </div>

              <textarea
                value={thoughtCaption}
                onChange={(e) => setThoughtCaption(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                autoFocus
                className="w-full p-md bg-zinc-900 border border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 text-white leading-relaxed resize-none placeholder-zinc-500"
              />

              <div className="border border-zinc-800 rounded-2xl p-md bg-zinc-950/60 space-y-xs opacity-95">
                <div className="flex items-center gap-xs text-xs font-bold text-violet-300">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{reshareTargetPost.originalPost?.anonymousName || reshareTargetPost.anonymousName || 'Anonymous Fox'}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                  {reshareTargetPost.originalPost?.text || reshareTargetPost.text}
                </p>
              </div>

              <div className="flex items-center justify-end gap-md pt-sm">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReshareMode(null)}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!thoughtCaption.trim() || isSubmittingReshare}
                  onClick={handleReshareWithThoughts}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  Post Reshare
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-md py-sm">
              <button
                type="button"
                onClick={handleReshareInstant}
                disabled={isSubmittingReshare}
                className="w-full p-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-2xl flex items-start gap-md text-left transition-all active:scale-[0.99] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-xs">
                    Reshare Instantly
                  </h4>
                  <p className="text-xs text-zinc-400 mt-xs leading-normal">
                    Post directly to anonymous feed without adding a caption.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReshareMode('thoughts')}
                className="w-full p-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-2xl flex items-start gap-md text-left transition-all active:scale-[0.99] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <PenSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-xs">
                    Reshare with Your Thoughts
                  </h4>
                  <p className="text-xs text-zinc-400 mt-xs leading-normal">
                    Add your own commentary or opinion above the original post preview.
                  </p>
                </div>
              </button>

              {Boolean(user?.uid && (reshareTargetPost.resharedUsers || []).includes(user.uid)) && (
                <button
                  type="button"
                  onClick={() => handleUnreshare(reshareTargetPost)}
                  disabled={isSubmittingReshare}
                  className="w-full p-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-start gap-md text-left transition-all active:scale-[0.99] group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-400 flex items-center gap-xs">
                      Undo Reshare
                    </h4>
                    <p className="text-xs text-rose-300/80 mt-xs leading-normal">
                      Remove your reshare from feed and decrease reshare count.
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
