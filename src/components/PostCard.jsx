import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Repeat,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  CornerDownRight,
  X,
  Heart,
  Edit2,
  Trash2,
  AlertCircle,
  Zap,
  PenSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { UserAvatar } from '@/components/UserAvatar';
import { formatRelativeTime } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, increment, arrayUnion, arrayRemove, getDocs, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { createNotification } from '@/utils/notifications';

export const PostCard = ({ post, onVote, onRepost, onSave }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const commentInputRef = useRef(null);

  const [showPostMenu, setShowPostMenu] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState(post.content || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // LinkedIn-style Reshare State & Tracking
  const [showReshareModal, setShowReshareModal] = useState(false);
  const [reshareMode, setReshareMode] = useState(null); // null | 'thoughts'
  const [thoughtCaption, setThoughtCaption] = useState('');
  const [isSubmittingReshare, setIsSubmittingReshare] = useState(false);

  const [localReposts, setLocalReposts] = useState(post.reposts || 0);
  const [localResharedUsers, setLocalResharedUsers] = useState(post.resharedUsers || []);

  useEffect(() => {
    setLocalReposts(post.reposts || 0);
    setLocalResharedUsers(post.resharedUsers || []);
  }, [post.reposts, post.resharedUsers]);

  const isResharedByMe = Boolean(user?.uid && localResharedUsers.includes(user.uid));

  const isOfficialAdmin =
    (user?.username || '').toLowerCase() === 'cohort' ||
    (user?.name || '').toLowerCase() === 'cohort' ||
    user?.isOfficial === true ||
    user?.uid === 'cohort_official' ||
    user?.email === 'cohort@official.com';

  const isActualPostOwner = (post.author?.uid && post.author.uid === user?.uid) ||
                            (post.authorUid && post.authorUid === user?.uid) ||
                            (user?.name && post.author?.name === user?.name);

  const isPostOwner = isActualPostOwner || isOfficialAdmin;

  const isCohortOfficialPost =
    (post.author?.name || '').toLowerCase() === 'cohort' ||
    (post.author?.username || '').toLowerCase() === 'cohort' ||
    post.authorUid === 'cohort_official' ||
    post.author?.uid === 'cohort_official';

  // Real-time resolution of post author profile from Firestore
  const [liveAuthorProfile, setLiveAuthorProfile] = useState(null);
  const targetAuthorUid = isCohortOfficialPost
    ? 'cohort_official'
    : (post.author?.uid || post.authorUid || post.uid);

  useEffect(() => {
    if (!targetAuthorUid) return;

    const unsub = onSnapshot(doc(db, 'users', targetAuthorUid), (snap) => {
      if (snap.exists()) {
        setLiveAuthorProfile(snap.data());
      }
    }, (err) => console.error('Error listening to post author profile:', err));

    return () => unsub();
  }, [targetAuthorUid]);

  const authorAvatar = isCohortOfficialPost
    ? (liveAuthorProfile?.avatar || post.author?.avatar)
    : ((isActualPostOwner && user?.avatar) || liveAuthorProfile?.avatar || post.author?.avatar);

  const authorName = isCohortOfficialPost
    ? 'Cohort'
    : ((isActualPostOwner && user?.name) || liveAuthorProfile?.name || post.author?.name || 'Student');

  const handleSaveInlineEdit = async () => {
    if (!editPostContent.trim()) return;
    try {
      const postId = post.docId || post.id;
      await updateDoc(doc(db, 'posts', postId), { content: editPostContent.trim() });
      post.content = editPostContent.trim();
      setIsEditingPost(false);
      setShowPostMenu(false);
      showSuccess('Post updated successfully!');
    } catch (err) {
      console.error('Failed to edit post:', err);
    }
  };

  const confirmDeletePostDoc = async () => {
    try {
      const postId = post.docId || post.id;
      await deleteDoc(doc(db, 'posts', postId));

      // If deleting a reshare, decrement original post's reshare counter
      if (post.isReshare && post.originalPostId) {
        try {
          const origPostRef = doc(db, 'posts', post.originalPostId);
          await updateDoc(origPostRef, {
            reposts: increment(-1),
            resharedUsers: user?.uid ? arrayRemove(user.uid) : []
          });
        } catch (e) {
          console.error('Failed to decrement original post repost count:', e);
        }
      }

      setShowDeleteModal(false);
      setShowPostMenu(false);
      showSuccess('Post deleted permanently.');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleUnreshare = async () => {
    const rootOriginalPostId = post.originalPostId || post.docId || post.id;
    const myUid = user?.uid;
    if (!myUid || !rootOriginalPostId) return;

    setIsSubmittingReshare(true);
    setLocalReposts(prev => Math.max(0, prev - 1));
    setLocalResharedUsers(prev => prev.filter(u => u !== myUid));

    try {
      // 1. Decrement repost count and remove UID from original post
      const origPostRef = doc(db, 'posts', rootOriginalPostId);
      await updateDoc(origPostRef, {
        reposts: increment(-1),
        resharedUsers: arrayRemove(myUid)
      });

      // 2. Query and delete the reshare document created by this user for rootOriginalPostId
      const q = query(
        collection(db, 'posts'),
        where('isReshare', '==', true),
        where('originalPostId', '==', rootOriginalPostId),
        where('resharedBy.uid', '==', myUid)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, 'posts', docSnap.id));
      });

      showSuccess('Reshare removed.');
      setShowReshareModal(false);
    } catch (err) {
      console.error('Failed to unreshare post:', err);
      setLocalReposts(post.reposts || 0);
      setLocalResharedUsers(post.resharedUsers || []);
    } finally {
      setIsSubmittingReshare(false);
    }
  };

  const handleReshareInstant = async () => {
    const rootOriginalPostId = post.originalPostId || post.docId || post.id;
    const origAuthor = post.originalPost?.author || post.author;
    const origContent = post.originalPost?.content || post.content;
    const origTimestamp = post.originalPost?.timestamp || post.timestamp;
    const myUid = user?.uid;

    setIsSubmittingReshare(true);
    setLocalReposts(prev => prev + 1);
    if (myUid) setLocalResharedUsers(prev => [...prev, myUid]);

    try {
      const reshareDocData = {
        isReshare: true,
        originalPostId: rootOriginalPostId,
        originalPost: {
          id: rootOriginalPostId,
          author: origAuthor,
          content: origContent,
          timestamp: origTimestamp
        },
        resharedBy: {
          uid: myUid || null,
          name: user?.name || 'Student',
          username: user?.username || null,
          avatar: user?.avatar || null
        },
        author: {
          uid: myUid || null,
          name: user?.name || 'Student',
          username: user?.username || null,
          avatar: user?.avatar || null,
          role: user?.college || 'KIET'
        },
        thought: '',
        content: '',
        timestamp: new Date(),
        upvotes: 0,
        downvotes: 0,
        upvotedUsers: [],
        downvotedUsers: [],
        comments: 0,
        reposts: 0,
        saved: false
      };

      await addDoc(collection(db, 'posts'), reshareDocData);

      // Increment reshare count and add user UID to root original post
      const origPostRef = doc(db, 'posts', rootOriginalPostId);
      await updateDoc(origPostRef, {
        reposts: increment(1),
        resharedUsers: myUid ? arrayUnion(myUid) : []
      });

      if (onRepost) onRepost(rootOriginalPostId);

      const origAuthorUid = origAuthor?.uid || post.author?.uid;
      if (origAuthorUid && origAuthorUid !== myUid) {
        createNotification({
          recipientUid: origAuthorUid,
          senderUid: myUid,
          senderName: user?.name || 'Student',
          senderAvatar: user?.avatar,
          type: 'reshare',
          text: 'reshared your post.',
          postId: rootOriginalPostId
        });
      }

      showSuccess('Post reshared successfully.');
      setShowReshareModal(false);
      setReshareMode(null);
    } catch (err) {
      console.error('Failed to reshare post:', err);
      setLocalReposts(post.reposts || 0);
      setLocalResharedUsers(post.resharedUsers || []);
    } finally {
      setIsSubmittingReshare(false);
    }
  };

  const handleReshareWithThoughtsSubmit = async () => {
    if (!thoughtCaption.trim()) return;
    const rootOriginalPostId = post.originalPostId || post.docId || post.id;
    const origAuthor = post.originalPost?.author || post.author;
    const origContent = post.originalPost?.content || post.content;
    const origTimestamp = post.originalPost?.timestamp || post.timestamp;
    const myUid = user?.uid;

    setIsSubmittingReshare(true);
    setLocalReposts(prev => prev + 1);
    if (myUid) setLocalResharedUsers(prev => [...prev, myUid]);

    try {
      const reshareDocData = {
        isReshare: true,
        originalPostId: rootOriginalPostId,
        originalPost: {
          id: rootOriginalPostId,
          author: origAuthor,
          content: origContent,
          timestamp: origTimestamp
        },
        resharedBy: {
          uid: myUid || null,
          name: user?.name || 'Student',
          username: user?.username || null,
          avatar: user?.avatar || null
        },
        author: {
          uid: myUid || null,
          name: user?.name || 'Student',
          username: user?.username || null,
          avatar: user?.avatar || null,
          role: user?.college || 'KIET'
        },
        thought: thoughtCaption.trim(),
        content: thoughtCaption.trim(),
        timestamp: new Date(),
        upvotes: 0,
        downvotes: 0,
        upvotedUsers: [],
        downvotedUsers: [],
        comments: 0,
        reposts: 0,
        saved: false
      };

      await addDoc(collection(db, 'posts'), reshareDocData);

      const origPostRef = doc(db, 'posts', rootOriginalPostId);
      await updateDoc(origPostRef, {
        reposts: increment(1),
        resharedUsers: myUid ? arrayUnion(myUid) : []
      });

      if (onRepost) onRepost(rootOriginalPostId);

      const origAuthorUid = origAuthor?.uid || post.author?.uid;
      if (origAuthorUid && origAuthorUid !== myUid) {
        createNotification({
          recipientUid: origAuthorUid,
          senderUid: myUid,
          senderName: user?.name || 'Student',
          senderAvatar: user?.avatar,
          type: 'reshare',
          text: 'reshared your post with their thoughts.',
          postId: rootOriginalPostId
        });
      }

      showSuccess('Post reshared with thoughts successfully.');
      setShowReshareModal(false);
      setReshareMode(null);
      setThoughtCaption('');
    } catch (err) {
      console.error('Failed to reshare post with thoughts:', err);
      setLocalReposts(post.reposts || 0);
      setLocalResharedUsers(post.resharedUsers || []);
    } finally {
      setIsSubmittingReshare(false);
    }
  };

  const confirmDeleteCommentDoc = async () => {
    if (!commentToDelete) return;
    const commentId = commentToDelete.id || commentToDelete;
    try {
      const postId = post.docId || post.id;
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: Math.max(0, (comments.length || 1) - 1)
      });

      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
      setCommentToDelete(null);
      showSuccess('Comment deleted successfully.');
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Subscribe to real-time comments subcollection for this post in Firestore
  useEffect(() => {
    if (!post?.docId && !post?.id) return;
    const postId = post.docId || post.id;
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = [];
      snapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: d.id,
          ...data,
          time: data.timestamp?.toDate ? formatRelativeTime(data.timestamp.toDate()) : 'Just now'
        });
      });
      setComments(loaded);
    }, (err) => {
      console.error('Error fetching comments from Firestore:', err);
    });

    return () => unsubscribe();
  }, [post?.id, post?.docId]);

  const toggleReplies = (parentCommentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [parentCommentId]: !prev[parentCommentId]
    }));
  };

  const handleOpenAuthorProfile = (authorUid, authorName) => {
    if (authorUid) {
      navigate(`/profile?uid=${authorUid}`);
    } else if (authorName) {
      navigate(`/profile?name=${encodeURIComponent(authorName)}`);
    } else {
      navigate(`/profile`);
    }
  };

  const handleInitiateReplyToComment = (targetComment) => {
    const parentId = targetComment.parentId || targetComment.id;
    const usernameHandle = targetComment.authorUsername || targetComment.author?.replace(/\s+/g, '');

    setReplyingToComment({
      parentId: parentId,
      commentId: targetComment.id,
      authorUid: targetComment.authorUid,
      author: targetComment.author,
      username: usernameHandle
    });

    const tag = `@${usernameHandle} `;
    let updatedText = newComment;
    if (!newComment.includes(tag.trim())) {
      const cleanedText = newComment.replace(/^@\S+\s*/, '');
      updatedText = `${tag}${cleanedText}`;
      setNewComment(updatedText);
    }

    setTimeout(() => {
      if (commentInputRef.current) {
        const el = commentInputRef.current;
        el.focus();
        const len = updatedText.length;
        el.setSelectionRange(len, len);
      }
    }, 50);
  };

  const handleCancelReplyMode = () => {
    if (replyingToComment) {
      const username = replyingToComment.username;
      if (username) {
        const tagPattern = new RegExp(`^@${username}\\s*`, 'i');
        setNewComment(prev => prev.replace(tagPattern, ''));
      }
    }
    setReplyingToComment(null);
  };

  const handleToggleCommentLike = async (commentId) => {
    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment || !user?.uid) return;

    const currentLikedBy = targetComment.likedBy || [];
    const isAlreadyLiked = currentLikedBy.includes(user.uid);
    const updatedLikedBy = isAlreadyLiked
      ? currentLikedBy.filter(uid => uid !== user.uid)
      : [...currentLikedBy, user.uid];

    const updatedLikesCount = updatedLikedBy.length;

    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likedBy: updatedLikedBy,
          likes: updatedLikesCount
        };
      }
      return c;
    }));

    try {
      const postId = post.docId || post.id;
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        likedBy: updatedLikedBy,
        likes: updatedLikesCount
      });

      if (!isAlreadyLiked && targetComment.authorUid && targetComment.authorUid !== user.uid) {
        createNotification({
          recipientUid: targetComment.authorUid,
          senderUid: user.uid,
          senderName: user.name || 'Student',
          senderAvatar: user.avatar,
          type: 'like',
          text: `liked your comment: "${targetComment.text?.slice(0, 30)}..."`,
          postId: postId
        });
      }
    } catch (err) {
      console.error('Failed to update comment like:', err);
    }
  };

  const renderTaggedCommentText = (text) => {
    if (!text) return '';
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (token.startsWith('@') && token.length > 1) {
        const cleanName = token.replace(/^@|\W+$/g, '');
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (cleanName) navigate(`/profile?name=${encodeURIComponent(cleanName)}`);
            }}
            className="text-primary-500 font-bold hover:underline cursor-pointer mr-1 inline-block"
          >
            {token}
          </span>
        );
      }
      return token;
    });
  };

  const handleAddComment = async (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newComment.trim()) {
      const postId = post.docId || post.id;
      if (!postId) return;

      const textToSend = newComment.trim();
      const targetReply = replyingToComment;
      setNewComment('');
      setReplyingToComment(null);

      const parentId = targetReply?.parentId || null;
      const tempId = `temp_${Date.now()}`;

      const newCommentObj = {
        id: tempId,
        authorUid: user?.uid || null,
        authorUsername: user?.username || null,
        author: user?.name || user?.email?.split('@')[0] || 'Student',
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
        text: textToSend,
        parentId: parentId,
        replyToAuthorUid: targetReply?.authorUid || null,
        replyToAuthorName: targetReply?.author || null,
        likes: 0,
        likedBy: [],
        timestamp: new Date(),
        time: 'Just now'
      };

      // Optimistic UI Update
      setComments(prev => [...prev, newCommentObj]);

      // Auto-expand parent replies so newly added reply is immediately visible
      if (parentId) {
        setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
      }

      const commentData = {
        authorUid: newCommentObj.authorUid,
        authorUsername: newCommentObj.authorUsername,
        author: newCommentObj.author,
        avatar: newCommentObj.avatar,
        text: textToSend,
        parentId: parentId,
        replyToAuthorUid: targetReply?.authorUid || null,
        replyToAuthorName: targetReply?.author || null,
        likes: 0,
        likedBy: [],
        timestamp: new Date()
      };

      try {
        await addDoc(collection(db, 'posts', postId, 'comments'), commentData);

        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          comments: (comments.length || 0) + 1
        });

        const postAuthorUid = post.author?.uid || post.authorUid || post.uid;

        // 1. Dispatch Comment Notification to post author (if not self)
        if (postAuthorUid && postAuthorUid !== user?.uid) {
          createNotification({
            recipientUid: postAuthorUid,
            senderUid: user?.uid,
            senderName: user?.name || 'Student',
            senderAvatar: user?.avatar,
            type: 'reply',
            text: `commented: "${textToSend.slice(0, 35)}${textToSend.length > 35 ? '...' : ''}"`,
            postId: postId
          });
        }

        // 2. Dispatch Reply Notification to the specific comment author tagged/replied to
        const commentAuthorUid = targetReply?.authorUid;
        if (
          commentAuthorUid &&
          commentAuthorUid !== user?.uid &&
          commentAuthorUid !== postAuthorUid
        ) {
          createNotification({
            recipientUid: commentAuthorUid,
            senderUid: user?.uid,
            senderName: user?.name || 'Student',
            senderAvatar: user?.avatar,
            type: 'reply',
            text: `replied to your comment: "${textToSend.slice(0, 35)}${textToSend.length > 35 ? '...' : ''}"`,
            postId: postId
          });
        }
      } catch (err) {
        console.error('Failed to add reply comment in Firestore:', err);
      }
    }
  };

  const myUid = user?.uid || 'guest';
  const userVote = Array.isArray(post.upvotedUsers) && post.upvotedUsers.includes(myUid)
    ? 'up'
    : Array.isArray(post.downvotedUsers) && post.downvotedUsers.includes(myUid)
    ? 'down'
    : null;

  const upvotesCount = Array.isArray(post.upvotedUsers)
    ? post.upvotedUsers.length
    : (typeof post.upvotes === 'number' ? post.upvotes : 0);

  const downvotesCount = Array.isArray(post.downvotedUsers)
    ? post.downvotedUsers.length
    : (typeof post.downvotes === 'number' ? post.downvotes : 0);

  const topLevelComments = comments.filter(c => !c.parentId);



  return (
    <Card
      className={
        isCohortOfficialPost
          ? "mb-lg border-purple-500/50 dark:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-white dark:bg-neutral-900"
          : "mb-lg border-neutral-100 dark:border-neutral-800 shadow-sm"
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-lg">
        <div
          onClick={() => handleOpenAuthorProfile(post.author?.uid, post.author?.name)}
          className="flex items-center gap-md cursor-pointer group"
        >
          <UserAvatar
            src={authorAvatar}
            name={authorName}
            className="w-12 h-12 rounded-full ring-2 ring-transparent group-hover:ring-primary-500 transition-all object-cover"
          />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors flex items-center gap-1">
              <span>{authorName}</span>
              {isCohortOfficialPost && (
                <ShieldCheck className="w-4 h-4 text-purple-400 fill-purple-500/20 inline-block stroke-[2.5]" title="Verified Cohort Official Account" />
              )}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isCohortOfficialPost
                ? 'Cohort Official'
                : ((post.author?.role && post.author.role !== 'Student' && post.author.role !== 'Delhi University')
                    ? post.author.role
                    : (post.author?.college || user?.college || 'KIET'))} • {formatRelativeTime(post.timestamp)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPostMenu(!showPostMenu)}
            className="p-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showPostMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden text-xs">
              {isPostOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setIsEditingPost(true); setShowPostMenu(false); }}
                    className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary-500" /> Edit Post
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(true); setShowPostMenu(false); }}
                    className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-rose-500 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Post
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { showSuccess('Post reported to campus moderators.'); setShowPostMenu(false); }}
                  className="w-full px-md py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 font-medium"
                >
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reshared By Header Strip */}
      {post.isReshare && (
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-sm pb-xs border-b border-neutral-100 dark:border-neutral-800">
          <Repeat className="w-3.5 h-3.5 text-primary-500" />
          <span>
            Reshared by{' '}
            <strong
              onClick={() => handleOpenAuthorProfile(post.resharedBy?.uid || post.author?.uid, post.resharedBy?.name || post.author?.name)}
              className="text-neutral-800 dark:text-neutral-200 font-bold hover:underline cursor-pointer"
            >
              {post.resharedBy?.name || post.author?.name || 'Student'}
            </strong>
          </span>
          <span>•</span>
          <span className="text-[11px] text-neutral-400">{formatRelativeTime(post.timestamp)}</span>
        </div>
      )}

      {/* Content / Thoughts */}
      {isEditingPost ? (
        <div className="mb-xl space-y-sm">
          <textarea
            value={editPostContent}
            onChange={(e) => setEditPostContent(e.target.value)}
            className="w-full p-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white leading-relaxed resize-none"
            rows={3}
          />
          <div className="flex items-center justify-end gap-md">
            <button
              type="button"
              onClick={() => setIsEditingPost(false)}
              className="px-md py-xs text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveInlineEdit}
              className="px-md py-xs text-xs font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.thought && (
            <p className="text-neutral-800 dark:text-neutral-200 mb-md leading-relaxed text-base font-normal">
              {post.thought}
            </p>
          )}

          {post.isReshare ? (
            /* Embedded Original Post Card */
            <div
              onClick={() => {
                const rootId = post.originalPostId || post.id;
                navigate(`/home#post-${rootId}`);
              }}
              className="border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-md sm:p-lg bg-neutral-50/60 dark:bg-neutral-800/40 hover:border-primary-500/40 transition-all cursor-pointer space-y-sm mb-lg shadow-2xs group/embedded"
            >
              <div className="flex items-center gap-md">
                <img
                  src={post.originalPost?.author?.avatar || post.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={post.originalPost?.author?.name || post.author?.name || 'Student'}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
                <div>
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white group-hover/embedded:text-primary-500 transition-colors">
                    {post.originalPost?.author?.name || post.author?.name || 'Student'}
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {post.originalPost?.author?.role || post.originalPost?.author?.college || 'KIET'} • {formatRelativeTime(post.originalPost?.timestamp || post.timestamp)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed pt-xs whitespace-pre-wrap break-words">
                {post.originalPost?.content || post.content}
              </p>
            </div>
          ) : (
            <p className="text-neutral-800 dark:text-neutral-200 mb-xl leading-relaxed text-base whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}
        </>
      )}

      {post.imageUrl && (
        <div className="mb-xl rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800/80 bg-neutral-950/20 dark:bg-neutral-950/60 flex items-center justify-center">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="w-full h-auto max-h-[700px] object-contain rounded-2xl transition-transform duration-300 hover:scale-[1.005]"
          />
        </div>
      )}

      {/* Modern Pill Action Bar */}
      <div className="flex items-center gap-sm flex-wrap pt-xs">
        {/* Upvote / Downvote Pill showing separate Like & Dislike counts */}
        <div className="flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60 p-1 text-xs font-bold shadow-xs">
          {/* Like / Upvote Button */}
          <button
            type="button"
            onClick={() => {
              onVote(post.id, 'up');
              const postAuthorUid = post.author?.uid || post.authorUid || post.uid;
              if (postAuthorUid && postAuthorUid !== user?.uid && userVote !== 'up') {
                createNotification({
                  recipientUid: postAuthorUid,
                  senderUid: user?.uid,
                  senderName: user?.name || 'Student',
                  senderAvatar: user?.avatar,
                  type: 'like',
                  text: 'liked your post.',
                  postId: post.docId || post.id
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
              userVote === 'up'
                ? 'bg-orange-500 text-white font-extrabold shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 hover:text-orange-500'
            }`}
            title="Like / Upvote"
          >
            <ArrowUp className={`w-4 h-4 ${userVote === 'up' ? 'stroke-[2.5]' : ''}`} />
            <span>{upvotesCount}</span>
          </button>

          {/* Vertical Divider */}
          <div className="w-px h-3.5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

          {/* Dislike / Downvote Button */}
          <button
            type="button"
            onClick={() => onVote(post.id, 'down')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
              userVote === 'down'
                ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 hover:text-rose-500'
            }`}
            title="Dislike / Downvote"
          >
            <ArrowDown className={`w-4 h-4 ${userVote === 'down' ? 'stroke-[2.5]' : ''}`} />
            <span>{downvotesCount}</span>
          </button>
        </div>

        {/* Reply Pill */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-xs px-lg py-sm rounded-full text-xs font-semibold border transition-all ${
            showComments
              ? 'bg-primary-500 text-white border-primary-600'
              : 'bg-neutral-100 dark:bg-neutral-800/80 border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length || post.comments || 0}</span>
        </button>

        {/* Repost / Reshare Pill */}
        <button
          type="button"
          onClick={() => {
            if (isResharedByMe) {
              handleUnreshare();
            } else {
              setShowReshareModal(true);
              setReshareMode(null);
            }
          }}
          className={`flex items-center gap-xs px-md py-sm rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            isResharedByMe
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          title={isResharedByMe ? "Click to unreshare" : "Reshare post"}
        >
          <Repeat className={`w-4 h-4 ${isResharedByMe ? 'text-emerald-500 fill-emerald-500/20' : 'text-primary-500'}`} />
          <span>{localReposts}</span>
        </button>

        {/* Share Pill */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            showSuccess('Post link copied to clipboard!');
          }}
          className="flex items-center gap-xs px-lg py-sm rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/80 border border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Bookmark / Save Pill */}
        <button
          onClick={() => onSave(post.id)}
          className={`p-sm rounded-full text-xs font-semibold border transition-all ml-auto ${
            post.saved
              ? 'bg-primary-500/10 text-primary-500 border-primary-500/30'
              : 'bg-neutral-100 dark:bg-neutral-800/80 border-transparent text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          title="Save post"
        >
          <Bookmark className="w-4 h-4" fill={post.saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Instagram-Style Comments & Replies Section */}
      {showComments && (
        <div className="mt-lg pt-lg border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-md font-semibold">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </p>

          <div className="space-y-lg mb-lg">
            {topLevelComments.length > 0 ? (
              topLevelComments.map(c => {
                const repliesForThisComment = comments.filter(r => r.parentId === c.id);
                const isRepliesExpanded = expandedReplies[c.id] === true;
                const isLikedByMe = Array.isArray(c.likedBy) && c.likedBy.includes(user?.uid);
                const likeCount = c.likes || (c.likedBy ? c.likedBy.length : 0);

                return (
                  <div key={c.id} className="group/comment space-y-sm">
                    {/* Top Level Comment Item */}
                    <div className="flex items-start justify-between gap-md">
                      <div className="flex items-start gap-md flex-1 min-w-0">
                        <UserAvatar
                          src={c.avatar}
                          name={c.author || 'Student'}
                          className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all object-cover mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs leading-relaxed text-neutral-900 dark:text-white">
                            <strong
                              onClick={() => handleOpenAuthorProfile(c.authorUid, c.author)}
                              className="font-bold text-neutral-900 dark:text-white mr-2 cursor-pointer hover:text-primary-500 hover:underline inline-block"
                            >
                              {c.author}
                            </strong>
                            <span className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-words block mt-0.5">
                              {renderTaggedCommentText(c.text)}
                            </span>
                          </div>

                          {/* Sub-bar: Time, Likes Count, Reply Button */}
                          <div className="flex items-center gap-md mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold">
                            <span>{c.time}</span>
                            {likeCount > 0 && (
                              <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleInitiateReplyToComment(c)}
                              className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                            {(c.authorUid === user?.uid || c.author === user?.name || isPostOwner) && (
                              <button
                                type="button"
                                onClick={() => setCommentToDelete(c)}
                                className="hover:text-rose-500 transition-colors cursor-pointer text-neutral-400 dark:text-neutral-500"
                                title="Delete comment"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Independent Like Heart Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleCommentLike(c.id)}
                        className="p-1 text-neutral-400 hover:text-rose-500 transition-all active:scale-125 flex-shrink-0 mt-1"
                        title={isLikedByMe ? "Unlike" : "Like"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Nested Replies Section (1 level deep) */}
                    {repliesForThisComment.length > 0 && (
                      <div className="pl-8">
                        {/* View / Hide Replies Button with subtle horizontal line */}
                        <button
                          type="button"
                          onClick={() => toggleReplies(c.id)}
                          className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors py-1 cursor-pointer"
                        >
                          <span className="w-6 h-[1px] bg-neutral-300 dark:bg-neutral-700 inline-block" />
                          <span>
                            {isRepliesExpanded
                              ? 'Hide replies'
                              : `View ${repliesForThisComment.length} ${repliesForThisComment.length === 1 ? 'reply' : 'replies'}`}
                          </span>
                        </button>

                        {/* Expanded Nested Replies */}
                        <AnimatePresence>
                          {isRepliesExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="space-y-md pt-sm border-l-2 border-neutral-100 dark:border-neutral-800/80 ml-3 pl-3"
                            >
                              {repliesForThisComment.map(r => {
                                const isReplyLikedByMe = Array.isArray(r.likedBy) && r.likedBy.includes(user?.uid);
                                const replyLikeCount = r.likes || (r.likedBy ? r.likedBy.length : 0);

                                return (
                                  <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-start justify-between gap-md group/reply"
                                  >
                                    <div className="flex items-start gap-sm flex-1 min-w-0">
                                      <UserAvatar
                                        src={r.avatar}
                                        name={r.author || 'Student'}
                                        className="w-6 h-6 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all object-cover mt-0.5"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs leading-relaxed text-neutral-900 dark:text-white">
                                          <strong
                                            onClick={() => handleOpenAuthorProfile(r.authorUid, r.author)}
                                            className="font-bold text-neutral-900 dark:text-white mr-2 cursor-pointer hover:text-primary-500 hover:underline inline-block"
                                          >
                                            {r.author}
                                          </strong>
                                          <span className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-words block mt-0.5">
                                            {renderTaggedCommentText(r.text)}
                                          </span>
                                        </div>

                                        {/* Sub-bar: Time, Likes Count, Reply Button, Delete Button */}
                                        <div className="flex items-center gap-md mt-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">
                                          <span>{r.time}</span>
                                          {replyLikeCount > 0 && (
                                            <span>{replyLikeCount} {replyLikeCount === 1 ? 'like' : 'likes'}</span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleInitiateReplyToComment(r)}
                                            className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                                          >
                                            Reply
                                          </button>
                                          {(r.authorUid === user?.uid || r.author === user?.name || isPostOwner) && (
                                            <button
                                              type="button"
                                              onClick={() => setCommentToDelete(r)}
                                              className="hover:text-rose-500 transition-colors cursor-pointer text-neutral-400 dark:text-neutral-500"
                                              title="Delete reply"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Reply Independent Heart Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCommentLike(r.id)}
                                      className="p-1 text-neutral-400 hover:text-rose-500 transition-all active:scale-125 flex-shrink-0 mt-0.5"
                                      title={isReplyLikedByMe ? "Unlike" : "Like"}
                                    >
                                      <Heart className={`w-3 h-3 ${isReplyLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-400 italic py-xs">No comments yet. Be the first to start the discussion!</p>
            )}
          </div>

          {/* Replying Banner Above Input */}
          <AnimatePresence>
            {replyingToComment && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center justify-between px-md py-xs bg-neutral-100 dark:bg-neutral-800/90 rounded-xl mb-xs border border-neutral-200 dark:border-neutral-700 text-xs shadow-sm"
              >
                <span className="text-neutral-600 dark:text-neutral-300 font-medium flex items-center gap-xs">
                  <CornerDownRight className="w-3.5 h-3.5 text-primary-500" />
                  Replying to <strong className="font-bold text-neutral-900 dark:text-white">@{replyingToComment.username || replyingToComment.author}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCancelReplyMode}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  title="Cancel reply"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single Bottom Input Bar */}
          <div className="flex gap-md items-center sticky bottom-0 z-10 bg-white dark:bg-neutral-900 py-xs">
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'You'}
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
            />
            <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/80 rounded-full px-md py-sm flex items-center gap-md border border-neutral-200 dark:border-neutral-700 transition-all focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/20">
              <input
                ref={commentInputRef}
                type="text"
                placeholder={replyingToComment ? `Reply to @${replyingToComment.username || replyingToComment.author}...` : "Add a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleAddComment}
                className="bg-transparent text-sm outline-none flex-1 focus:ring-0 focus:border-transparent py-xs placeholder-neutral-400"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-primary-500 hover:text-primary-600 disabled:opacity-40 p-xs font-bold text-xs flex items-center gap-xs transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post UI Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Post"
          size="sm"
        >
          <div className="text-center py-sm space-y-md">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Are you sure?</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs leading-relaxed">
                This post will be permanently deleted from the campus feed. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeletePostDoc}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Comment UI Confirmation Modal */}
      {commentToDelete && (
        <Modal
          isOpen={Boolean(commentToDelete)}
          onClose={() => setCommentToDelete(null)}
          title="Delete Comment"
          size="sm"
        >
          <div className="text-center py-sm space-y-md">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Delete this comment?</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs leading-relaxed">
                This comment will be permanently removed. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCommentToDelete(null)}
                className="w-full"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeleteCommentDoc}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reshare Bottom Sheet / Modal (LinkedIn Style) */}
      {showReshareModal && (
        <Modal
          isOpen={showReshareModal}
          onClose={() => {
            setShowReshareModal(false);
            setReshareMode(null);
            setThoughtCaption('');
          }}
          title={reshareMode === 'thoughts' ? "Reshare with your thoughts" : "Reshare Post"}
          size="md"
        >
          {reshareMode === 'thoughts' ? (
            /* Reshare with Your Thoughts Composer View */
            <div className="space-y-md py-xs">
              <div className="flex items-center gap-md">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
                  alt={user?.name || 'You'}
                  className="w-10 h-10 rounded-full object-cover border border-primary-500/30"
                />
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {user?.name || 'Student'}
                  </h4>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Posting publicly to campus feed
                  </span>
                </div>
              </div>

              <textarea
                value={thoughtCaption}
                onChange={(e) => setThoughtCaption(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                autoFocus
                className="w-full p-md bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white leading-relaxed resize-none placeholder-neutral-400"
              />

              {/* Non-editable Bordered Original Post Preview */}
              <div className="border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-md bg-neutral-100/50 dark:bg-neutral-800/40 space-y-xs opacity-95">
                <div className="flex items-center gap-md">
                  <img
                    src={post.originalPost?.author?.avatar || post.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                    alt={post.originalPost?.author?.name || post.author?.name || 'Student'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900 dark:text-white">
                      {post.originalPost?.author?.name || post.author?.name || 'Student'}
                    </h5>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {post.originalPost?.author?.role || post.originalPost?.author?.college || 'KIET'} • {formatRelativeTime(post.originalPost?.timestamp || post.timestamp)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pt-xs line-clamp-3">
                  {post.originalPost?.content || post.content}
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
                  onClick={handleReshareWithThoughtsSubmit}
                >
                  Post Reshare
                </Button>
              </div>
            </div>
          ) : (
            /* Reshare Options View (Instant vs Thoughts) */
            <div className="space-y-md py-sm">
              <button
                type="button"
                onClick={handleReshareInstant}
                disabled={isSubmittingReshare}
                className="w-full p-lg bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex items-start gap-md text-left transition-all active:scale-[0.99] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-xs">
                    Reshare Instantly
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs leading-normal">
                    Post directly to your campus feed without adding a caption.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReshareMode('thoughts')}
                className="w-full p-lg bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex items-start gap-md text-left transition-all active:scale-[0.99] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <PenSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-xs">
                    Reshare with Your Thoughts
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs leading-normal">
                    Add your own commentary or opinion above the original post preview.
                  </p>
                </div>
              </button>

              {isResharedByMe && (
                <button
                  type="button"
                  onClick={handleUnreshare}
                  disabled={isSubmittingReshare}
                  className="w-full p-lg bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex items-start gap-md text-left transition-all active:scale-[0.99] group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-xs">
                      Undo Reshare
                    </h4>
                    <p className="text-xs text-rose-500/80 dark:text-rose-400/80 mt-xs leading-normal">
                      Remove your reshare from feed and decrease reshare count.
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}
        </Modal>
      )}
    </Card>
  );
};
