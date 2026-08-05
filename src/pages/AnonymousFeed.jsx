import React, { useState, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatRelativeTime } from '@/utils/helpers';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
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

export default function AnonymousFeed() {
  const { user } = useAuth();
  const { showSuccess, showWarning } = useNotification();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'confessions'
  const [posts, setPosts] = useState([]);
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postType, setPostType] = useState('feed'); // 'feed' | 'confession'
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Comment drawers
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({});

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
    setCommentText('');

    const targetColl = isConfession ? 'confessions' : 'anonymousPosts';
    const randomIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
    const chosenName = ANONYMOUS_NAMES[randomIndex];

    try {
      await addDoc(collection(db, targetColl, itemId, 'comments'), {
        authorUid: user?.uid || 'anonymous_guest',
        anonymousName: chosenName,
        text: textToSend,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-md md:p-xl space-y-xl pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto border-b border-zinc-800/80 pb-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Anonymous
          </h1>
          <p className="text-xs text-zinc-400 mt-xs font-medium tracking-wide">
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
      <div className="max-w-xs mx-auto p-xs bg-zinc-900/90 border border-zinc-800 rounded-full flex items-center relative shadow-inner">
        <button
          onClick={() => { setActiveTab('feed'); setActiveCommentPostId(null); }}
          className={`flex-1 py-xs rounded-full text-xs font-semibold flex items-center justify-center gap-xs transition-colors relative z-10 ${
            activeTab === 'feed' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
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
          onClick={() => { setActiveTab('confessions'); setActiveCommentPostId(null); }}
          className={`flex-1 py-xs rounded-full text-xs font-semibold flex items-center justify-center gap-xs transition-colors relative z-10 ${
            activeTab === 'confessions' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Confessions</span>
          <span className="text-[9px] font-mono px-xs py-[1px] rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">24h</span>
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
                const commentsList = commentsMap[post.id] || [];

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-zinc-800/90 hover:border-violet-500/40 bg-zinc-900/80 backdrop-blur-md rounded-2xl p-lg transition-all duration-300 space-y-md shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-full bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-violet-300 bg-violet-950/40 px-md py-xs rounded-full border border-violet-500/20">
                            {post.anonymousName || 'Anonymous Fox'}
                          </span>
                          <span className="text-[10px] text-zinc-500 block font-medium mt-xs ml-xs">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.text}
                    </p>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-zinc-800/80 pt-md text-xs font-semibold">
                      <div className="flex items-center gap-md">
                        <button
                          onClick={() => handleLikePost(post, false)}
                          className={`flex items-center gap-xs px-md py-xs rounded-full transition-all ${
                            isLiked
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                          <span>{post.likesCount || 0}</span>
                        </button>

                        <button
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                          className="flex items-center gap-xs px-md py-xs rounded-full text-zinc-400 hover:text-violet-300 hover:bg-zinc-800/60 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showSuccess('Post link copied!');
                          }}
                          className="flex items-center gap-xs px-md py-xs rounded-full text-zinc-400 hover:text-violet-300 hover:bg-zinc-800/60 transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleReport(post.id, false)}
                        className="text-zinc-500 hover:text-rose-400 p-xs transition-colors"
                        title="Report"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {activeCommentPostId === post.id && (
                      <div className="pt-md border-t border-zinc-800/80 space-y-md">
                        <div className="space-y-sm max-h-56 overflow-y-auto pr-xs">
                          {commentsList.length > 0 ? (
                            commentsList.map(c => (
                              <div key={c.id} className="bg-zinc-950/80 p-md rounded-xl border border-zinc-800 text-xs">
                                <div className="flex items-center justify-between mb-xs">
                                  <span className="font-semibold text-violet-400">{c.anonymousName || 'Anonymous'}</span>
                                  <span className="text-[10px] text-zinc-500">{formatRelativeTime(c.createdAt)}</span>
                                </div>
                                <p className="text-zinc-300">{c.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-500 italic">No replies yet. Be the first!</p>
                          )}
                        </div>

                        <div className="flex items-center gap-md">
                          <input
                            type="text"
                            placeholder="Reply anonymously..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id, false)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-lg py-xs text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id, false)}
                            disabled={!commentText.trim()}
                            className="p-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-full transition-all"
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

                return (
                  <motion.div
                    key={confession.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-3xl p-xl bg-gradient-to-br from-zinc-900 via-violet-950/30 to-zinc-900 border border-violet-500/30 shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:border-violet-500/50 hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] space-y-lg transition-all duration-300"
                  >
                    {/* Header Badges */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-rose-400 flex items-center gap-xs bg-rose-500/10 px-md py-xs rounded-full border border-rose-500/20">
                        <Flame className="w-3.5 h-3.5 text-rose-400" /> Confession
                      </span>

                      <span className="text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-xs bg-amber-500/10 px-md py-xs rounded-full border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        {getRemainingTimeStr(confession.expiresAtMs)}
                      </span>
                    </div>

                    {/* Centered Confession Text */}
                    <div className="py-md text-center">
                      <p className="text-lg md:text-xl font-heading font-semibold text-zinc-100 leading-relaxed px-sm">
                        "{confession.text}"
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-zinc-800/80 pt-md text-xs font-semibold">
                      <div className="flex items-center gap-md">
                        <button
                          onClick={() => setActiveCommentPostId(activeCommentPostId === confession.id ? null : confession.id)}
                          className="flex items-center gap-xs px-md py-xs rounded-full text-zinc-400 hover:text-violet-300 hover:bg-zinc-800/60 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{confession.comments || 0}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleReport(confession.id, true)}
                        className="text-zinc-500 hover:text-rose-400 p-xs transition-colors"
                        title="Report"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {activeCommentPostId === confession.id && (
                      <div className="pt-md border-t border-zinc-800/80 space-y-md">
                        <div className="space-y-sm max-h-56 overflow-y-auto pr-xs">
                          {commentsList.length > 0 ? (
                            commentsList.map(c => (
                              <div key={c.id} className="bg-zinc-950/80 p-md rounded-xl border border-zinc-800 text-xs">
                                <div className="flex items-center justify-between mb-xs">
                                  <span className="font-semibold text-violet-400">{c.anonymousName || 'Anonymous'}</span>
                                  <span className="text-[10px] text-zinc-500">{formatRelativeTime(c.createdAt)}</span>
                                </div>
                                <p className="text-zinc-300">{c.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-500 italic">No replies yet. Leave an anonymous response!</p>
                          )}
                        </div>

                        <div className="flex items-center gap-md">
                          <input
                            type="text"
                            placeholder="Reply to confession..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(confession.id, true)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-lg py-xs text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleAddComment(confession.id, true)}
                            disabled={!commentText.trim()}
                            className="p-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-full transition-all"
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
    </div>
  );
}
