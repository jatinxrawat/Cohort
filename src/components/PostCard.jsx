import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Repeat,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { Card } from '@/components/Card';
import { formatRelativeTime } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { createNotification } from '@/utils/notifications';

export const PostCard = ({ post, onVote, onRepost, onSave }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);

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

  const handleOpenAuthorProfile = (authorUid, authorName) => {
    if (authorUid) {
      navigate(`/profile?uid=${authorUid}`);
    } else if (authorName) {
      navigate(`/profile?name=${encodeURIComponent(authorName)}`);
    } else {
      navigate(`/profile`);
    }
  };

  const handleAddComment = async (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newComment.trim()) {
      const postId = post.docId || post.id;
      if (!postId) return;

      const textToSend = newComment.trim();
      setNewComment('');

      const commentData = {
        authorUid: user?.uid || null,
        authorUsername: user?.username || null,
        author: user?.name || user?.email?.split('@')[0] || 'Student',
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
        text: textToSend,
        timestamp: new Date()
      };

      try {
        // Add comment to Firestore subcollection
        await addDoc(collection(db, 'posts', postId, 'comments'), commentData);

        // Update comment count on post
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          comments: (comments.length || 0) + 1
        });

        // Dispatch Comment Notification to post author
        const postAuthorUid = post.author?.uid || post.authorUid || post.uid;
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
      } catch (err) {
        console.error('Failed to add reply comment in Firestore:', err);
      }
    }
  };

  const myUid = user?.uid || 'guest';
  const userVote = post.upvotedUsers?.includes(myUid)
    ? 'up'
    : post.downvotedUsers?.includes(myUid)
    ? 'down'
    : null;

  const voteScore = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <Card className="mb-lg border-neutral-100 dark:border-neutral-800 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-lg">
        <div
          onClick={() => handleOpenAuthorProfile(post.author?.uid, post.author?.name)}
          className="flex items-center gap-md cursor-pointer group"
        >
          <img
            src={post.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
            alt={post.author?.name || 'Student'}
            className="w-12 h-12 rounded-full ring-2 ring-transparent group-hover:ring-primary-500 transition-all object-cover"
          />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors">
              {post.author?.name || 'Student'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {post.author?.role || 'Student'} • {formatRelativeTime(post.timestamp)}
            </p>
          </div>
        </div>

        <button className="p-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <p className="text-neutral-800 dark:text-neutral-200 mb-xl leading-relaxed text-base">
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mb-xl rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="w-full h-auto object-cover max-h-96 hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {/* Modern Pill Action Bar */}
      <div className="flex items-center gap-sm flex-wrap pt-xs">
        {/* Upvote / Downvote Pill */}
        <div className={`flex items-center gap-xs px-md py-xs rounded-full border transition-all ${
          userVote === 'up'
            ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
            : userVote === 'down'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
            : 'bg-neutral-100 dark:bg-neutral-800/80 border-transparent text-neutral-700 dark:text-neutral-300'
        }`}>
          <button
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
            className={`p-xs rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ${
              userVote === 'up' ? 'text-orange-500 font-bold' : ''
            }`}
            title="Upvote"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <span className="font-bold text-xs px-xs min-w-[20px] text-center">
            {voteScore}
          </span>

          <button
            onClick={() => onVote(post.id, 'down')}
            className={`p-xs rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ${
              userVote === 'down' ? 'text-blue-500 font-bold' : ''
            }`}
            title="Downvote"
          >
            <ArrowDown className="w-4 h-4" />
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

        {/* Repost Pill */}
        <button
          onClick={() => {
            onRepost(post.id);
            const postAuthorUid = post.author?.uid || post.authorUid || post.uid;
            if (postAuthorUid && postAuthorUid !== user?.uid) {
              createNotification({
                recipientUid: postAuthorUid,
                senderUid: user?.uid,
                senderName: user?.name || 'Student',
                senderAvatar: user?.avatar,
                type: 'reshare',
                text: 'reshared your post.',
                postId: post.docId || post.id
              });
            }
          }}
          className="flex items-center gap-xs px-md py-sm rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/80 border border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
          title="Repost"
        >
          <Repeat className="w-4 h-4" />
          {post.reposts > 0 && <span>{post.reposts}</span>}
        </button>

        {/* Share Pill */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Post link copied to clipboard!');
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

      {/* Replies / Comments Section */}
      {showComments && (
        <div className="mt-lg pt-lg border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-md font-semibold">{comments.length} replies</p>
          
          <div className="space-y-md mb-lg">
            {comments.length > 0 ? (
              comments.map(c => (
                <div key={c.id} className="flex gap-md items-start">
                  <img
                    src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.author)}`}
                    alt={c.author}
                    onClick={() => handleOpenAuthorProfile(c.authorUid, c.author)}
                    className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="bg-neutral-50 dark:bg-neutral-800/80 rounded-xl px-md py-sm text-sm border border-neutral-100/50 dark:border-neutral-800/50 leading-relaxed">
                      <strong
                        onClick={() => handleOpenAuthorProfile(c.authorUid, c.author)}
                        className="text-xs text-neutral-900 dark:text-white mr-xs font-bold cursor-pointer hover:text-primary-500 hover:underline"
                      >
                        {c.author}
                      </strong>
                      {c.text}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-xs font-semibold">{c.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 italic py-xs">No replies yet. Be the first to leave a reply!</p>
            )}
          </div>

          {/* Reply Input */}
          <div className="flex gap-md items-center">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
              alt="You"
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
            />
            <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/80 rounded-full px-md py-sm flex items-center gap-md border border-neutral-200 dark:border-neutral-700">
              <input
                type="text"
                placeholder="Write a reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleAddComment}
                className="bg-transparent text-sm outline-none flex-1 focus:ring-0 focus:border-transparent py-xs"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-primary-500 hover:text-primary-600 disabled:opacity-40 p-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
