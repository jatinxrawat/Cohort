import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Link as LinkIcon,
  Check,
  Send,
  Mail,
  MessageCircle,
  MessageSquare,
  Share2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { db } from '@/utils/firebase';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

export default function ShareModal({ isOpen, onClose, post, shareUrl: customShareUrl, title: customTitle }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sentMap, setSentMap] = useState({});
  const [copied, setCopied] = useState(false);

  // Determine canonical share URL & text
  const shareUrl =
    customShareUrl ||
    (post?.id
      ? `${window.location.origin}/post/${post.id}`
      : window.location.href);

  const rawAuthorName = post?.author?.name || post?.authorName || '';
  const shareTitle =
    customTitle ||
    (rawAuthorName ? (rawAuthorName.toLowerCase().startsWith('post by') ? rawAuthorName : `Post by ${rawAuthorName}`) : 'Campus Post');

  const shareText = post?.content || post?.text || post?.caption || 'Check out this post on Cohort!';

  // Fetch recent chat members and campus users when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUsers([]);
      setSentMap({});
      setCopied(false);
      return;
    }

    const fetchContacts = async () => {
      setLoadingUsers(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const list = [];
        usersSnap.forEach((d) => {
          const uid = d.id;
          if (
            user?.uid &&
            uid !== user.uid &&
            uid !== 'cohort_official' &&
            d.data()?.username !== 'cohort'
          ) {
            const data = d.data();
            list.push({
              uid,
              name: data.name || data.username || 'Campus Student',
              username: data.username || '',
              avatar:
                data.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`,
              college: data.college || 'KIET'
            });
          }
        });

        setRecentUsers(list);
      } catch (err) {
        console.error('Error fetching share contacts:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchContacts();
  }, [isOpen, user]);

  // Filter contacts by search query
  const filteredUsers = recentUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.college.toLowerCase().includes(q)
    );
  });

  // Toggle user selection
  const toggleSelectUser = (targetUser) => {
    if (sentMap[targetUser.uid]) return;
    if (selectedUsers.some((u) => u.uid === targetUser.uid)) {
      setSelectedUsers(selectedUsers.filter((u) => u.uid !== targetUser.uid));
    } else {
      setSelectedUsers([...selectedUsers, targetUser]);
    }
  };

  // Batch send direct message to all selected contacts
  const handleSendBatch = async () => {
    if (!user) {
      showError('Please sign in to send direct messages.');
      return;
    }

    if (selectedUsers.length === 0) return;

    setIsSending(true);

    const cleanStr = (val, fallback = '') => (val === undefined || val === null ? fallback : String(val));

    try {
      const myUid = cleanStr(user?.uid);
      const myName = cleanStr(user?.name || user?.displayName || user?.email?.split('@')[0], 'Me');
      const myAvatar = cleanStr(
        user?.avatar || user?.photoURL,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(myUid)}`
      );

      const safeTitle = cleanStr(shareTitle, 'Campus Post');
      const safeText = cleanStr(shareText, 'Check out this post on Cohort!');
      const safeUrl = cleanStr(shareUrl, window.location.href);
      const safeMediaUrl = cleanStr(
        post?.image || post?.imageUrl || post?.mediaUrl || post?.photo || post?.media || post?.coverImage || post?.author?.avatar,
        ''
      );
      const lastMsgSummary = `Shared a post: ${safeText.slice(0, 35)}${safeText.length > 35 ? '...' : ''}`;
      const nowIso = new Date().toISOString();

      // Fetch existing conversations for matching
      const messagesSnap = await getDocs(collection(db, 'messages'));
      const existingDocsMap = new Map();

      messagesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const parts = Array.isArray(data.participants) ? data.participants : [];
        
        // Match by participants array or createdBy/recipientUid fields
        selectedUsers.forEach((tUser) => {
          const targetUid = cleanStr(tUser.uid);
          const isMatch =
            (parts.includes(myUid) && parts.includes(targetUid)) ||
            (data.createdBy === myUid && data.recipientUid === targetUid) ||
            (data.createdBy === targetUid && data.recipientUid === myUid);

          if (isMatch && !existingDocsMap.has(targetUid)) {
            existingDocsMap.set(targetUid, { id: docSnap.id, ...data });
          }
        });
      });

      const sendPromises = selectedUsers.map(async (targetUser) => {
        const targetUid = cleanStr(targetUser.uid);
        const targetName = cleanStr(targetUser.name, 'Campus Student');
        const targetAvatar = cleanStr(
          targetUser.avatar,
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetUid)}`
        );

        const messageObj = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: myUid,
          senderUid: myUid,
          senderName: myName,
          senderAvatar: myAvatar,
          text: `Shared post by ${safeTitle}:\n"${safeText.slice(0, 120)}${safeText.length > 120 ? '...' : ''}"\n${safeUrl}`,
          time: nowIso,
          createdAt: nowIso,
          deletedFor: [],
          isSharedPost: true,
          sharedPostData: {
            id: cleanStr(post?.id, ''),
            title: safeTitle,
            content: safeText,
            url: safeUrl,
            mediaUrl: safeMediaUrl
          }
        };

        const existingDoc = existingDocsMap.get(targetUid);

        if (existingDoc) {
          const chatRef = doc(db, 'messages', existingDoc.id);
          const freshSnap = await getDoc(chatRef);
          const rawData = freshSnap.exists() ? freshSnap.data() : existingDoc;

          const rawMsgs = Array.isArray(rawData.messages) ? rawData.messages : [];
          const cleanExistingMsgs = rawMsgs.map((m) => ({
            ...m,
            time: m.time?.toDate ? m.time.toDate().toISOString() : (m.time ? String(m.time) : nowIso)
          }));

          const resetHidden = {};
          if (rawData.hiddenFor) {
            Object.keys(rawData.hiddenFor).forEach((k) => {
              resetHidden[`hiddenFor.${k}`] = false;
            });
          }

          await updateDoc(chatRef, {
            messages: [...cleanExistingMsgs, messageObj],
            lastMessage: lastMsgSummary,
            time: new Date(),
            readBy: [myUid],
            [`participantMap.${myUid}`]: { name: myName, avatar: myAvatar },
            [`participantMap.${targetUid}`]: { name: targetName, avatar: targetAvatar },
            ...resetHidden
          });
        } else {
          const newConvData = {
            recipientUid: targetUid,
            recipientName: targetName,
            recipientAvatar: targetAvatar,
            participants: [myUid, targetUid],
            participantMap: {
              [myUid]: { name: myName, avatar: myAvatar },
              [targetUid]: { name: targetName, avatar: targetAvatar }
            },
            createdBy: myUid,
            createdByName: myName,
            createdByAvatar: myAvatar,
            readBy: [myUid],
            avatar: targetAvatar,
            lastMessage: lastMsgSummary,
            time: new Date(),
            messages: [messageObj]
          };
          await addDoc(collection(db, 'messages'), newConvData);
        }
      });

      await Promise.all(sendPromises);

      const newSentMap = { ...sentMap };
      selectedUsers.forEach((u) => {
        newSentMap[u.uid] = true;
      });

      setSentMap(newSentMap);
      showSuccess(
        selectedUsers.length === 1
          ? `Sent to ${selectedUsers[0].name}!`
          : `Sent to ${selectedUsers.length} contacts!`
      );
      setSelectedUsers([]);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error sending batch messages:', err);
      showError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showSuccess('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // External Social Sharing Handlers
  const handleSocialShare = async (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${shareTitle}: ${shareText}\n${shareUrl}`);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
        break;
      case 'whatsapp-status': {
        showSuccess('Opening WhatsApp Status share...');
        const mediaUrl = post?.image || post?.imageUrl || post?.mediaUrl || post?.photo || post?.media || post?.coverImage;
        const formattedStatusText = `${shareTitle}\n"${shareText}"\n\n👇 View post on Cohort:\n${shareUrl}`;

        // 1. Mobile Web Share API with image file if available
        if (navigator.canShare && mediaUrl) {
          try {
            const resp = await fetch(mediaUrl);
            const blob = await resp.blob();
            const file = new File([blob], 'cohort_post.jpg', { type: blob.type || 'image/jpeg' });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: shareTitle,
                text: formattedStatusText,
                files: [file]
              });
              break;
            }
          } catch (err) {
            console.warn('Native status image share failed, falling back:', err);
          }
        }

        // 2. Native Web Share API text fallback
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareTitle,
              text: formattedStatusText,
              url: shareUrl
            });
            break;
          } catch (err) {
            console.warn('Native share error:', err);
          }
        }

        // 3. WhatsApp protocol fallback
        window.location.href = `whatsapp://send?text=${encodeURIComponent(formattedStatusText)}`;
        break;
      }
      case 'instagram':
        navigator.clipboard.writeText(shareUrl);
        showSuccess('Link copied! Opening Instagram...');
        setTimeout(() => {
          window.open('https://www.instagram.com/direct/inbox/', '_blank');
        }, 600);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'messenger':
        window.open(`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodedText}`, '_blank');
        break;
      case 'threads':
        window.open(`https://www.threads.net/intent/post?text=${encodedText}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
        break;
      default:
        handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-center">
            <button
              onClick={onClose}
              className="absolute left-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h3 className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white">
              Share
            </h3>
          </div>

          {/* Search Bar */}
          <div className="p-4 pb-2">
            <div className="relative flex items-center bg-neutral-100 dark:bg-zinc-800/80 border border-neutral-200 dark:border-zinc-700/60 rounded-xl px-3.5 py-2.5 focus-within:border-purple-500 dark:focus-within:border-purple-400 transition-all">
              <Search className="w-4 h-4 text-neutral-400 dark:text-zinc-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-neutral-600 dark:text-zinc-400 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Contact Members Grid */}
          <div className="px-4 py-2 flex-1 overflow-y-auto max-h-[300px] scrollbar-thin">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-10 text-neutral-400 text-xs font-semibold">
                Loading contacts...
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="grid grid-cols-4 gap-y-5 gap-x-3 py-2">
                {filteredUsers.map((u) => {
                  const isSent = sentMap[u.uid];
                  const isSelected = selectedUsers.some((sel) => sel.uid === u.uid);

                  return (
                    <div
                      key={u.uid}
                      onClick={() => toggleSelectUser(u)}
                      className="flex flex-col items-center cursor-pointer group text-center"
                    >
                      {/* Avatar Wrapper with Selection Badge */}
                      <div className="relative mb-1.5 flex-shrink-0">
                        <div
                          className={`w-16 h-16 rounded-full p-0.5 transition-all duration-200 group-hover:scale-105 ${
                            isSent
                              ? 'bg-emerald-500'
                              : isSelected
                              ? 'bg-purple-600 ring-2 ring-purple-500/80 scale-105'
                              : 'bg-neutral-200 dark:bg-zinc-700/60 group-hover:bg-neutral-400 dark:group-hover:bg-zinc-500'
                          }`}
                        >
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-full h-full rounded-full object-cover bg-neutral-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900"
                          />
                        </div>

                        {/* Badge overlay */}
                        {isSent ? (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md border border-white dark:border-zinc-900">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isSelected ? (
                          <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-full shadow-md border border-white dark:border-zinc-900">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 bg-neutral-800 dark:bg-zinc-700 text-white p-1 rounded-full shadow-md border border-white dark:border-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Send className="w-2.5 h-2.5 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <span className={`text-[11px] font-bold leading-tight line-clamp-2 w-full px-0.5 transition-colors ${
                        isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white'
                      }`}>
                        {u.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-400 text-xs">
                No users found
              </div>
            )}
          </div>

          {/* Action Send Button Bar when contacts are selected */}
          {selectedUsers.length > 0 && (
            <div className="px-5 py-3 bg-neutral-100 dark:bg-zinc-800/90 border-t border-neutral-200 dark:border-zinc-700/80 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-xs font-bold text-neutral-700 dark:text-zinc-200 truncate max-w-[200px]">
                To: {selectedUsers.map((u) => u.name.split(' ')[0]).join(', ')}
              </span>
              <button
                onClick={handleSendBatch}
                disabled={isSending}
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <span>Send ({selectedUsers.length})</span>
                    <Send className="w-3.5 h-3.5 fill-current" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* External Platform Apps Horizontal Share Row */}
          <div className="p-4 border-t border-neutral-100 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
              
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-500 stroke-[2.5]" />
                  ) : (
                    <LinkIcon className="w-5 h-5 stroke-[2]" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  {copied ? 'Copied' : 'Copy Link'}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414zM12.042 2c-5.503 0-9.972 4.469-9.972 9.974 0 1.758.459 3.473 1.33 4.982L2 22l5.176-1.358a9.924 9.924 0 004.866 1.272c5.504 0 9.973-4.469 9.973-9.974C22.015 6.469 17.546 2 12.042 2zm0 18.067c-1.583 0-3.132-.424-4.481-1.228l-.322-.191-3.33.873.888-3.246-.21-.334a8.083 8.083 0 01-1.238-4.301c0-4.463 3.632-8.094 8.097-8.094 4.464 0 8.096 3.631 8.096 8.094 0 4.463-3.632 8.094-8.096 8.094z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  WhatsApp
                </span>
              </button>

              {/* WhatsApp Status (Mobile Devices Only) */}
              <button
                onClick={() => handleSocialShare('whatsapp-status')}
                className="flex sm:hidden flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs relative">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-500 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
                    </svg>
                    <svg className="w-3.5 h-3.5 fill-current text-neutral-800 dark:text-white absolute" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  WA Status
                </span>
              </button>

              {/* Instagram */}
              <button
                onClick={() => handleSocialShare('instagram')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  Instagram
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleSocialShare('facebook')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  Facebook
                </span>
              </button>

              {/* Messenger */}
              <button
                onClick={() => handleSocialShare('messenger')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <MessageSquare className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  Messenger
                </span>
              </button>

              {/* Email */}
              <button
                onClick={() => handleSocialShare('email')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <Mail className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  Email
                </span>
              </button>

              {/* Threads */}
              <button
                onClick={() => handleSocialShare('threads')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <span className="font-mono text-base font-black">@</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  Threads
                </span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={() => handleSocialShare('twitter')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 flex items-center justify-center border border-neutral-200 dark:border-zinc-700/80 group-hover:bg-neutral-200 dark:group-hover:bg-zinc-700 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <span className="font-mono text-sm font-black">𝕏</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  X
                </span>
              </button>

            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
