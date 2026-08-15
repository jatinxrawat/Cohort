import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, UserPlus, Bell, Eye, Trash2, Inbox, Repeat, ExternalLink, Users, Check, X } from 'lucide-react';
import { formatRelativeTime } from '@/utils/helpers';
import { UserAvatar } from '@/components/UserAvatar';
import SEO from '@/components/SEO';
import { collection, onSnapshot, doc, updateDoc, writeBatch, deleteDoc, addDoc } from 'firebase/firestore';
import { arrayUnion } from 'firebase/firestore';
import { db } from '@/utils/firebase';

const iconMap = {
  like: Heart,
  reply: MessageSquare,
  follow: UserPlus,
  reshare: Repeat,
  system: Bell,
  community_invite: Users
};

const iconStyleMap = {
  like: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', color: 'text-rose-500' },
  reply: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', color: 'text-sky-500' },
  follow: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', color: 'text-emerald-500' },
  reshare: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', color: 'text-indigo-500' },
  system: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', color: 'text-amber-500' },
  community_invite: { bg: 'bg-violet-500/10 dark:bg-violet-500/20', color: 'text-violet-500' }
};

export default function Notifications() {
  const { showSuccess } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Real-time Firestore Listener for User Notifications
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const parseNotifTime = (data) => {
      if (data.time?.toDate) return data.time.toDate();
      if (data.time) {
        const d = new Date(data.time);
        if (!isNaN(d.getTime())) return d;
      }
      if (data.createdAt) {
        const d = new Date(data.createdAt);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    };

    setLoading(true);
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const loaded = [];
      const unreadDocsToMark = [];

      snapshot.forEach(d => {
        const data = d.data();
        const isForMe = !data.recipientUid || data.recipientUid === user.uid || data.recipientUid === 'all';
        if (isForMe) {
          const notifTime = parseNotifTime(data);
          loaded.push({
            id: d.id,
            docId: d.id,
            ...data,
            time: notifTime
          });
          if (!data.read) {
            unreadDocsToMark.push(d.id);
          }
        }
      });

      loaded.sort((a, b) => b.time - a.time);
      setList(loaded);
      setLoading(false);

      // Automatically mark unread notifications as read upon opening the Notifications page
      if (unreadDocsToMark.length > 0) {
        const batch = writeBatch(db);
        unreadDocsToMark.forEach(docId => {
          batch.update(doc(db, 'notifications', docId), { read: true });
        });
        batch.commit().catch(e => console.error('Failed auto-marking notifications as read:', e));
      }
    }, (err) => {
      console.error('Error listening to notifications:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const handleMarkAsRead = async (id) => {
    setList(prev => prev.map(notif => {
      if (notif.id === id) return { ...notif, read: true };
      return notif;
    }));

    const target = list.find(n => n.id === id);
    if (target && target.docId) {
      try {
        const docRef = doc(db, 'notifications', target.docId);
        await updateDoc(docRef, { read: true });
      } catch (e) {
        console.error('Failed to update read status:', e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    setList(prev => prev.map(notif => ({ ...notif, read: true })));
    showSuccess('All notifications marked as read.');

    const batch = writeBatch(db);
    list.forEach(n => {
      if (n.docId && !n.read) {
        const docRef = doc(db, 'notifications', n.docId);
        batch.update(docRef, { read: true });
      }
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error('Failed to update all statuses in Firestore:', e);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setList(prev => prev.filter(notif => notif.id !== id));
    showSuccess('Notification deleted.');

    const target = list.find(n => n.id === id);
    if (target && target.docId) {
      try {
        const docRef = doc(db, 'notifications', target.docId);
        await deleteDoc(docRef);
      } catch (e) {
        console.error('Failed to delete notification in Firestore:', e);
      }
    }
  };

  const handleAcceptInvite = async (e, notif) => {
    e.stopPropagation();
    if (!user?.uid || !notif.communityId) return;
    try {
      // Add user to community members
      await updateDoc(doc(db, 'userCommunities', notif.communityId), {
        members: arrayUnion(user.uid)
      });
      // Mark notification as accepted and read
      await updateDoc(doc(db, 'notifications', notif.docId), {
        status: 'accepted',
        read: true
      });
      setList(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'accepted', read: true } : n));
      showSuccess(`Joined "${notif.communityName}"!`);
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleRejectInvite = async (e, notif) => {
    e.stopPropagation();
    if (!notif.docId) return;
    try {
      await updateDoc(doc(db, 'notifications', notif.docId), {
        status: 'rejected',
        read: true
      });
      setList(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'rejected', read: true } : n));
      showSuccess('Invite declined.');
    } catch (err) {
      console.error('Failed to reject invite:', err);
    }
  };

  const handleClearAll = async () => {
    setList([]);
    showSuccess('All notifications cleared.');

    const batch = writeBatch(db);
    list.forEach(n => {
      if (n.docId) {
        const docRef = doc(db, 'notifications', n.docId);
        batch.delete(docRef);
      }
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error('Failed to clear database logs:', e);
    }
  };

  const categories = ['All', 'likes', 'replies', 'follows', 'reshares', 'invites', 'system'];

  const filteredList = list.filter(notif => {
    if (filter === 'All') return true;
    if (filter === 'likes') return notif.type === 'like';
    if (filter === 'replies') return notif.type === 'reply';
    if (filter === 'follows') return notif.type === 'follow';
    if (filter === 'reshares') return notif.type === 'reshare';
    if (filter === 'invites') return notif.type === 'community_invite';
    if (filter === 'system') return notif.type === 'system';
    return true;
  });

  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div className="section-container max-w-3xl w-full overflow-x-hidden">
      <SEO title="Notifications" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-3xl">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-md">
            Notifications {unreadCount > 0 && <span className="bg-danger text-white text-xs px-md py-xs rounded-full font-bold">{unreadCount} new</span>}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-xs text-sm">
            Manage likes, comments, reshares, followers, and system alerts
          </p>
        </div>
        
        {list.length > 0 && (
          <div className="flex gap-md self-start sm:self-center">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-xs p-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" /> Mark all read
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-danger hover:text-red-600 dark:hover:text-red-400 flex items-center gap-xs p-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter tab bar */}
      <Card className="mb-2xl py-md px-lg w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-sm overflow-x-auto scrollbar-none pb-xs">
          {categories.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-lg py-md rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                filter === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {tab === 'replies' ? 'Comments' : tab}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-md">
          <div className="h-16 w-full skeleton" />
          <div className="h-16 w-full skeleton" />
          <div className="h-16 w-full skeleton" />
        </div>
      ) : (
        /* Notifications List */
        <AnimatePresence mode="popLayout">
          {filteredList.length > 0 ? (
            <motion.div
              layout
              className="space-y-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredList.map((notif) => {
                const Icon = iconMap[notif.type] || Bell;
                const style = iconStyleMap[notif.type] || iconStyleMap.system;

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`w-full max-w-full overflow-hidden flex flex-col sm:flex-row sm:items-center gap-md sm:gap-lg hover:shadow-md cursor-pointer transition-all border-neutral-100 dark:border-neutral-800 relative group pb-12 sm:pb-md ${
                        !notif.read ? 'border-l-4 border-l-primary-500 bg-primary-50/20 dark:bg-primary-950/20' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      {/* Avatar & Text content wrapper */}
                      <div className="flex items-start gap-md sm:gap-lg flex-1 min-w-0 pr-xl">
                        {/* Avatar with type badge overlay */}
                        <div className="relative flex-shrink-0">
                          <UserAvatar
                            src={notif.senderAvatar}
                            name={notif.senderName || 'Student'}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${style.bg} ${style.color} ring-2 ring-white dark:ring-neutral-900`}>
                            <Icon className="w-3 h-3" />
                          </div>
                        </div>

                        {/* Content text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-normal">
                            <strong
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.senderUid) navigate(`/profile?uid=${notif.senderUid}`);
                              }}
                              className="text-neutral-900 dark:text-white font-bold hover:text-primary-500 transition-colors mr-xs"
                            >
                              {notif.senderName || notif.user || 'A Student'}
                            </strong>
                            {notif.text}
                          </p>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold block mt-xs">
                            {formatRelativeTime(notif.time)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {notif.type === 'community_invite' && notif.communityId && notif.status === 'pending' && (
                        <div className="flex gap-xs flex-shrink-0 self-end sm:self-center mt-xs sm:mt-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleAcceptInvite(e, notif)}
                            className="flex items-center gap-xs px-md py-xs bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={(e) => handleRejectInvite(e, notif)}
                            className="flex items-center gap-xs px-md py-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold rounded-xl transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}
                      {notif.type === 'community_invite' && notif.status === 'accepted' && (
                        <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-md py-xs rounded-xl flex-shrink-0 self-end sm:self-center mt-xs sm:mt-0">
                          <Check className="w-3.5 h-3.5" /> Joined
                        </span>
                      )}
                      {notif.type === 'community_invite' && notif.status === 'rejected' && (
                        <span className="text-xs font-semibold text-neutral-400 px-md py-xs flex-shrink-0 self-end sm:self-center mt-xs sm:mt-0">Declined</span>
                      )}
                      {notif.type === 'follow' && notif.senderUid && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile?uid=${notif.senderUid}`);
                          }}
                          className="text-xs flex-shrink-0 self-end sm:self-center mt-xs sm:mt-0"
                        >
                          View Profile
                        </Button>
                      )}

                      {/* Trash Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 absolute right-lg top-lg sm:top-1/2 sm:-translate-y-1/2 p-md rounded-lg text-neutral-400 hover:text-danger hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-5xl"
            >
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-lg">
                <Inbox className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-bold text-lg mb-xs">All caught up!</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No notifications in this category.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
