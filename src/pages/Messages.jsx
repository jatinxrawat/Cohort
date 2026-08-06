import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, deleteDoc, updateDoc, getDocs, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { motion } from 'framer-motion';
import { Send, ChevronLeft, Search, Plus, MessageSquare, Trash2, MoreVertical, Eraser, User, Users, Sparkles, X, Pin, PinOff, Bell, BellOff, Ban, ShieldCheck, Star, CheckSquare, Square, Check, Flame, Clock, Infinity as InfinityIcon, Lock, Shield, CornerUpLeft, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatRelativeTime } from '@/utils/helpers';

const FAKE_CHAT_NAMES = [
  'priya sharma',
  'arjun kumar',
  'neha patel',
  'rahul roy',
  'aditya gupta',
  'rohan verma'
];

const SwipeableMessageRow = ({ children, onReply, isMe }) => {
  const [dragOffset, setDragOffset] = useState(0);

  return (
    <div className="relative w-full flex items-center">
      {/* Visual Reply Icon Indicator behind bubble */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 z-0 transition-opacity duration-150 flex items-center justify-center ${
          isMe ? 'right-2' : 'left-2'
        }`}
        style={{
          opacity: Math.min(Math.abs(dragOffset) / 35, 1),
          transform: `translateY(-50%) scale(${Math.min(0.6 + Math.abs(dragOffset) / 50, 1.15)})`
        }}
      >
        <div className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-neutral-900">
          <CornerUpLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDrag={(e, info) => {
          setDragOffset(info.offset.x);
        }}
        onDragEnd={(e, info) => {
          setDragOffset(0);
          if (Math.abs(info.offset.x) > 35) {
            onReply();
          }
        }}
        className="w-full relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetRecipientUid = searchParams.get('recipientUid');
  const targetRecipientName = searchParams.get('recipientName');

  const { user } = useAuth();
  const { showSuccess } = useNotification();

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [mobileView, setMobileView] = useState('list'); // list, chat
  
  // New Chat Modal & Context Menu States
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Chat Search, Starred, Select Mode & Profile Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMsgKeys, setSelectedMsgKeys] = useState([]);
  const [replyToMsg, setReplyToMsg] = useState(null);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const [isGlobalStarredModalOpen, setIsGlobalStarredModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState(null);
  const [highlightedMsgKey, setHighlightedMsgKey] = useState(null);

  // Optional Vanish Mode States
  const [isVanishModalOpen, setIsVanishModalOpen] = useState(false);
  const [isKeepForeverActive, setIsKeepForeverActive] = useState(false);
  const [vanishDurationInput, setVanishDurationInput] = useState(3600); // Default 1 hour (3600s)
  const [vanishKeepPermissionInput, setVanishKeepPermissionInput] = useState('always'); // 'always' | 'ask' | 'never'
  const [customVanishInput, setCustomVanishInput] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());

  // My Side Only (Local Auto-Delete) States
  const [isMySideOnlyModalOpen, setIsMySideOnlyModalOpen] = useState(false);
  const [mySideOnlyDurationInput, setMySideOnlyDurationInput] = useState(300); // Default 5 minutes (300s)

  // ── Confirmation Popups
  const [confirmClearChatConv, setConfirmClearChatConv] = useState(null);
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(null);

  const [loading, setLoading] = useState(true);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const myUid = user?.uid || 'guest';

  // Live ticker for second-by-second vanish countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format vanish duration
  const formatVanishDurationLabel = (sec) => {
    if (!sec) return '1 Hour';
    if (sec < 60) return `${sec} Sec${sec === 1 ? '' : 's'}`;
    if (sec < 3600) return `${Math.floor(sec / 60)} Min${Math.floor(sec / 60) === 1 ? '' : 's'}`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} Hour${Math.floor(sec / 3600) === 1 ? '' : 's'}`;
    return `${Math.floor(sec / 86400)} Day${Math.floor(sec / 86400) === 1 ? '' : 's'}`;
  };

  // Helper to compute live remaining countdown
  const getRemainingVanishTime = (expiresAtTime) => {
    if (!expiresAtTime) return null;
    const targetMs = expiresAtTime.toDate ? expiresAtTime.toDate().getTime() : new Date(expiresAtTime).getTime();
    const diffMs = targetMs - nowTick;
    if (diffMs <= 0) return 'Expired';
    const totalSec = Math.floor(diffMs / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    if (totalSec < 3600) {
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}m ${s}s`;
    }
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Load matching users from Firestore when searchUserQuery or Modal opens
  useEffect(() => {
    if (!isNewChatOpen) return;

    const fetchUsers = async () => {
      setSearchingUsers(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const loaded = [];
        const cleanQuery = searchUserQuery.toLowerCase().replace('@', '').trim();

        usersSnap.forEach(d => {
          if (d.id === user?.uid) return; // Skip self

          const data = d.data();
          const nameMatch = !cleanQuery || (data.name && data.name.toLowerCase().includes(cleanQuery));
          const usernameMatch = cleanQuery && data.username && data.username.toLowerCase().includes(cleanQuery);
          const collegeMatch = cleanQuery && data.college && data.college.toLowerCase().includes(cleanQuery);

          if (nameMatch || usernameMatch || collegeMatch) {
            loaded.push({ id: d.id, uid: d.id, ...data });
          }
        });

        setMatchingUsers(loaded);
      } catch (err) {
        console.error('Failed to search users in modal:', err);
      } finally {
        setSearchingUsers(false);
      }
    };

    fetchUsers();
  }, [searchUserQuery, isNewChatOpen, user?.uid]);

  // Real-time Firestore Listener for User Conversations
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const messagesCollection = collection(db, 'messages');

    const unsubscribe = onSnapshot(messagesCollection, (snapshot) => {
      const loaded = [];
      snapshot.forEach(d => {
        const data = d.data();
        const convName = (data.name || '').toLowerCase();
        const isFake = FAKE_CHAT_NAMES.some(fake => convName.includes(fake));

        if (isFake) {
          deleteDoc(doc(db, 'messages', d.id)).catch(err => console.error('Purging fake chat thread:', err));
        } else {
          const isParticipant = (data.participants && data.participants.includes(user.uid)) ||
                                data.recipientUid === user.uid ||
                                data.createdBy === user.uid;

          // Check if conversation is hidden specifically for current user
          const isHiddenForMe = data.hiddenFor?.[user.uid] === true;

          if (isParticipant && !isHiddenForMe) {
            const parsedMsgs = (data.messages || []).map(m => ({
              ...m,
              time: m.time?.toDate ? m.time.toDate() : new Date(m.time || Date.now())
            }));

            // Determine other participant's UID and details
            const otherUid = (data.participants || []).find(pUid => pUid !== user.uid);
            let displayTitle = '';
            let avatarUrl = '';

            if (otherUid && data.participantMap && data.participantMap[otherUid]) {
              displayTitle = data.participantMap[otherUid].name;
              avatarUrl = data.participantMap[otherUid].avatar;
            } else if (data.createdBy && data.createdBy !== user.uid) {
              displayTitle = data.createdByName || 'Chat';
              avatarUrl = data.createdByAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayTitle)}`;
            } else if (data.recipientUid && data.recipientUid !== user.uid) {
              displayTitle = data.recipientName || data.name || 'Chat';
              avatarUrl = data.recipientAvatar || data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayTitle)}`;
            } else {
              const otherMsg = parsedMsgs.find(m => m.senderUid && m.senderUid !== user.uid);
              if (otherMsg && otherMsg.senderName) {
                displayTitle = otherMsg.senderName;
                avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayTitle)}`;
              } else {
                displayTitle = data.name || 'Chat';
                avatarUrl = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayTitle)}`;
              }
            }

            loaded.push({
              id: d.id,
              docId: d.id,
              ...data,
              name: displayTitle,
              avatar: avatarUrl,
              time: data.time?.toDate ? data.time.toDate() : new Date(data.time || Date.now()),
              messages: parsedMsgs
            });
          }
        }
      });

      loaded.sort((a, b) => {
        const isAPinned = a.pinnedFor?.[user.uid] === true;
        const isBPinned = b.pinnedFor?.[user.uid] === true;
        if (isAPinned && !isBPinned) return -1;
        if (!isAPinned && isBPinned) return 1;
        return b.time - a.time;
      });
      setConversations(loaded);
      setLoading(false);

      // Handle query param target recipient
      if (targetRecipientUid) {
        const existing = loaded.find(c =>
          c.participants?.includes(targetRecipientUid) ||
          c.recipientUid === targetRecipientUid ||
          c.name.toLowerCase() === targetRecipientName?.toLowerCase()
        );

        if (existing) {
          setSelectedId(existing.id);
          setMobileView('chat');
        } else if (targetRecipientName) {
          const createThread = async () => {
            const newConvData = {
              name: decodeURIComponent(targetRecipientName),
              recipientUid: targetRecipientUid,
              participants: [user.uid, targetRecipientUid],
              createdBy: user.uid,
              readBy: [user.uid],
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetRecipientName)}`,
              lastMessage: 'Started a new conversation',
              time: new Date(),
              messages: []
            };
            const docRef = await addDoc(collection(db, 'messages'), newConvData);
            setSelectedId(docRef.id);
            setMobileView('chat');
          };
          createThread();
        }
      }
    }, (error) => {
      console.error('Real-time messages listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetRecipientUid, targetRecipientName, user]);

  // Find currently active conversation
  const activeConversation = conversations.find(c => c.id === selectedId);

  // Fetch real recipient user profile from Firestore when profile modal is open
  useEffect(() => {
    if (!isProfileModalOpen || !activeConversation) return;

    const recipientUid = activeConversation.recipientUid ||
                         (activeConversation.participants || []).find(p => p !== myUid) ||
                         activeConversation.createdBy;

    if (recipientUid) {
      getDoc(doc(db, 'users', recipientUid)).then(snap => {
        if (snap.exists()) {
          setRecipientProfile(snap.data());
        }
      }).catch(err => console.error('Error fetching recipient profile:', err));
    }
  }, [isProfileModalOpen, activeConversation?.id, myUid]);

  // Filter messages visible to current user (WhatsApp 1-side delete/clear model)
  const clearedTimeMs = activeConversation?.clearedFor?.[myUid]
    ? (activeConversation.clearedFor[myUid]?.toDate
        ? activeConversation.clearedFor[myUid].toDate().getTime()
        : new Date(activeConversation.clearedFor[myUid]).getTime())
    : 0;

  // Auto-mark ALL incoming messages as read for active open conversation
  useEffect(() => {
    if (!activeConversation || !activeConversation.docId || !user?.uid) return;

    const unreadMsgs = (activeConversation.messages || []).filter(msg => {
      const isFromOther = msg.senderUid ? msg.senderUid !== user.uid : msg.senderName !== (user?.name || user?.email?.split('@')[0]);
      const isRead = Array.isArray(msg.readBy) && msg.readBy.includes(user.uid);
      return isFromOther && !isRead;
    });

    if (unreadMsgs.length > 0) {
      const updated = activeConversation.messages.map(msg => {
        const isFromOther = msg.senderUid ? msg.senderUid !== user.uid : msg.senderName !== (user?.name || user?.email?.split('@')[0]);
        if (isFromOther && (!msg.readBy || !msg.readBy.includes(user.uid))) {
          return {
            ...msg,
            readBy: [...(msg.readBy || []), user.uid]
          };
        }
        return msg;
      });

      const docRef = doc(db, 'messages', activeConversation.docId);
      updateDoc(docRef, {
        readBy: arrayUnion(user.uid),
        messages: updated
      }).catch(e => console.error('Failed auto marking read:', e));
    }
  }, [activeConversation?.id, activeConversation?.messages?.length, user?.uid]);

  // Auto-mark vanish messages as seen for current user when conversation is open
  useEffect(() => {
    if (!activeConversation || !activeConversation.docId || !user?.uid) return;

    const unreadVanishMsgs = (activeConversation.messages || []).filter(msg => {
      if (!msg.isVanish || msg.isPermanent) return false;
      if (msg.senderUid === user.uid) return false;
      const seenList = msg.seenBy || [];
      return !seenList.includes(user.uid);
    });

    if (unreadVanishMsgs.length > 0) {
      const updated = activeConversation.messages.map(msg => {
        if (msg.isVanish && !msg.isPermanent && msg.senderUid !== user.uid && (!msg.seenBy || !msg.seenBy.includes(user.uid))) {
          const durationSec = msg.vanishDuration || activeConversation.vanishDuration || 3600;
          const seenAtDate = new Date();
          const expiresAtDate = new Date(seenAtDate.getTime() + durationSec * 1000);
          const scopeUser = msg.vanishScopeUser || activeConversation.vanishScopeUser || msg.senderUid;

          return {
            ...msg,
            seenBy: [...(msg.seenBy || []), user.uid],
            seenAt: { ...(msg.seenAt || {}), [user.uid]: seenAtDate, [scopeUser]: seenAtDate },
            expiresAt: { ...(msg.expiresAt || {}), [user.uid]: expiresAtDate, [scopeUser]: expiresAtDate }
          };
        }
        return msg;
      });

      const docRef = doc(db, 'messages', activeConversation.docId);
      updateDoc(docRef, { messages: updated }).catch(e => console.error('Failed marking vanish seen:', e));
    }
  }, [activeConversation?.id, activeConversation?.messages?.length, user?.uid]);

  // Auto-set My Side Only expiration for received messages if current user has My Side Only enabled
  useEffect(() => {
    if (!activeConversation || !activeConversation.docId || !user?.uid) return;

    const mySideConfig = activeConversation.mySideOnlyMap?.[user.uid];
    if (!mySideConfig?.enabled) return;

    const durationSec = mySideConfig.duration || 300;
    const unMarkedReceivedMsgs = (activeConversation.messages || []).filter(msg => {
      if (msg.isPermanent) return false;
      if (msg.senderUid === user.uid) return false;
      const expDate = msg.mySideOnlyExpiresAt?.[user.uid];
      return !expDate;
    });

    if (unMarkedReceivedMsgs.length > 0) {
      const updated = activeConversation.messages.map(msg => {
        if (!msg.isPermanent && msg.senderUid !== user.uid && !msg.mySideOnlyExpiresAt?.[user.uid]) {
          const nowMs = Date.now();
          const expiresAtDate = new Date(nowMs + durationSec * 1000);
          return {
            ...msg,
            isMySideOnly: true,
            mySideOnlyExpiresAt: { ...(msg.mySideOnlyExpiresAt || {}), [user.uid]: expiresAtDate }
          };
        }
        return msg;
      });

      const docRef = doc(db, 'messages', activeConversation.docId);
      updateDoc(docRef, { messages: updated }).catch(e => console.error('Failed setting My Side Only received timer:', e));
    }
  }, [activeConversation?.id, activeConversation?.messages?.length, user?.uid, activeConversation?.mySideOnlyMap?.[user?.uid]?.enabled]);

  const visibleMessages = (activeConversation?.messages || []).filter(msg => {
    if (msg.deletedFor && Array.isArray(msg.deletedFor) && msg.deletedFor.includes(myUid)) {
      return false;
    }
    if (clearedTimeMs) {
      const msgTimeMs = msg.time?.getTime ? msg.time.getTime() : new Date(msg.time || 0).getTime();
      if (msgTimeMs <= clearedTimeMs) return false;
    }
    if (msg.isVanish && !msg.isPermanent) {
      const isKept = Array.isArray(msg.keptBy) && msg.keptBy.includes(myUid);
      if (!isKept) {
        const scope = msg.vanishScope || activeConversation?.vanishScope || 'everyone';
        const scopeUser = msg.vanishScopeUser || activeConversation?.vanishScopeUser || msg.senderUid;

        if (scope === 'me') {
          // 'My Side Only': Message ONLY disappears for the user who enabled/sent 'me' scope!
          // If current user is the scopeUser: check expiration!
          // If current user is NOT scopeUser (recipient): DO NOT expire!
          if (myUid === scopeUser) {
            const myExpire = msg.expiresAt?.[myUid] || msg.expiresAt?.[scopeUser];
            if (myExpire) {
              const expMs = myExpire.toDate ? myExpire.toDate().getTime() : new Date(myExpire).getTime();
              if (nowTick >= expMs) return false;
            }
          }
        } else {
          // 'Both Sides (Everyone)': Message disappears for BOTH users after being seen!
          const myExpire = msg.expiresAt?.[myUid];
          if (myExpire) {
            const expMs = myExpire.toDate ? myExpire.toDate().getTime() : new Date(myExpire).getTime();
            if (nowTick >= expMs) return false;
          }
        }
      }
    }

    // 4. My Side Only Local Auto-Delete Check for BOTH Sent & Received Messages
    if ((msg.isMySideOnly || msg.mySideOnlyExpiresAt?.[myUid]) && !msg.isPermanent) {
      const isKept = Array.isArray(msg.keptBy) && msg.keptBy.includes(myUid);
      if (!isKept) {
        const myExpire = msg.mySideOnlyExpiresAt?.[myUid];
        if (myExpire) {
          const expMs = myExpire.toDate ? myExpire.toDate().getTime() : new Date(myExpire).getTime();
          if (nowTick >= expMs) return false;
        }
      }
    }

    return true;
  });

  const filteredVisibleMessages = visibleMessages.filter(msg => {
    if (!isSearchOpen || !chatSearchQuery.trim()) return true;
    return (msg.text || '').toLowerCase().includes(chatSearchQuery.toLowerCase().trim());
  });

  const starredMessages = visibleMessages.filter(msg =>
    Array.isArray(msg.starredBy) && msg.starredBy.includes(myUid)
  );

  // Toggle Star on Single Message
  const handleToggleStarMessage = async (msgToStar) => {
    if (!activeConversation || !activeConversation.docId) return;

    const currentMsgs = activeConversation.messages || [];
    const updatedMsgs = currentMsgs.map(m => {
      const isTarget = m === msgToStar ||
        (m.text === msgToStar.text && Math.abs(new Date(m.time).getTime() - new Date(msgToStar.time).getTime()) < 2000);
      if (isTarget) {
        const starList = m.starredBy || [];
        const isStarred = starList.includes(myUid);
        const newStarList = isStarred
          ? starList.filter(u => u !== myUid)
          : [...starList, myUid];
        return { ...m, starredBy: newStarList };
      }
      return m;
    });

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, { messages: updatedMsgs });
      const wasStarred = (msgToStar.starredBy || []).includes(myUid);
      showSuccess(wasStarred ? 'Message unstarred' : 'Message starred ⭐');
    } catch (err) {
      console.error('Failed to toggle star message:', err);
    }
  };

  // Toggle Message Selection in Multi-Select Mode
  const handleToggleSelectMsg = (msgKey) => {
    if (selectedMsgKeys.includes(msgKey)) {
      setSelectedMsgKeys(selectedMsgKeys.filter(k => k !== msgKey));
    } else {
      setSelectedMsgKeys([...selectedMsgKeys, msgKey]);
    }
  };

  // Bulk Delete Selected Messages
  const handleBulkDeleteSelected = async () => {
    if (!activeConversation || !activeConversation.docId || selectedMsgKeys.length === 0) return;

    const currentMsgs = activeConversation.messages || [];
    const updatedMsgs = currentMsgs.map(m => {
      const msgKey = `${m.text}_${new Date(m.time).getTime()}`;
      if (selectedMsgKeys.includes(msgKey)) {
        const delList = m.deletedFor || [];
        if (!delList.includes(myUid)) {
          return { ...m, deletedFor: [...delList, myUid] };
        }
      }
      return m;
    });

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, { messages: updatedMsgs });
      showSuccess(`${selectedMsgKeys.length} messages deleted for you`);
      setSelectedMsgKeys([]);
      setIsSelectMode(false);
    } catch (err) {
      console.error('Failed to bulk delete messages:', err);
    }
  };

  // Bulk Star Selected Messages
  const handleBulkStarSelected = async () => {
    if (!activeConversation || !activeConversation.docId || selectedMsgKeys.length === 0) return;

    const currentMsgs = activeConversation.messages || [];
    const updatedMsgs = currentMsgs.map(m => {
      const msgKey = `${m.text}_${new Date(m.time).getTime()}`;
      if (selectedMsgKeys.includes(msgKey)) {
        const starList = m.starredBy || [];
        if (!starList.includes(myUid)) {
          return { ...m, starredBy: [...starList, myUid] };
        }
      }
      return m;
    });

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, { messages: updatedMsgs });
      showSuccess(`${selectedMsgKeys.length} messages starred ⭐`);
      setSelectedMsgKeys([]);
      setIsSelectMode(false);
    } catch (err) {
      console.error('Failed to bulk star messages:', err);
    }
  };

  // Jump to and highlight message in active chat
  const handleJumpToMessage = (msg) => {
    setIsStarredModalOpen(false);
    const msgKey = `${msg.text}_${new Date(msg.time).getTime()}`;
    setHighlightedMsgKey(msgKey);

    setTimeout(() => {
      const el = document.getElementById(`msg-${msgKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedMsgKey(null);
    }, 2500);
  };

  // Compute ALL starred messages across all chats
  const allStarredMessages = conversations.flatMap(conv => {
    const clearedTimeMs = conv.clearedFor?.[myUid]
      ? (conv.clearedFor[myUid]?.toDate ? conv.clearedFor[myUid].toDate().getTime() : new Date(conv.clearedFor[myUid]).getTime())
      : 0;

    const msgs = (conv.messages || []).filter(msg => {
      if (msg.deletedFor && Array.isArray(msg.deletedFor) && msg.deletedFor.includes(myUid)) return false;
      if (clearedTimeMs) {
        const msgTimeMs = msg.time?.getTime ? msg.time.getTime() : new Date(msg.time || 0).getTime();
        if (msgTimeMs <= clearedTimeMs) return false;
      }
      return Array.isArray(msg.starredBy) && msg.starredBy.includes(myUid);
    });

    return msgs.map(m => ({
      ...m,
      convId: conv.id,
      convName: conv.name,
      convAvatar: conv.avatar
    }));
  });

  // Jump to starred message from global list across chats
  const handleGlobalJumpToMessage = (sMsg) => {
    setIsGlobalStarredModalOpen(false);
    setSelectedId(sMsg.convId);
    setMobileView('chat');

    setTimeout(() => {
      handleJumpToMessage(sMsg);
    }, 250);
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedId) return;

    const targetConv = conversations.find(c => c.id === selectedId);
    if (!targetConv) return;

    const isVanish = targetConv.isVanishMode === true;
    const vanishDuration = targetConv.vanishDuration || 3600;
    const vanishScope = targetConv.vanishScope || 'everyone';

    const mySideOnlyConfig = targetConv.mySideOnlyMap?.[user?.uid];
    const isMySideOnly = mySideOnlyConfig?.enabled === true;
    const mySideOnlyDuration = mySideOnlyConfig?.duration || 300;

    const myName = user?.name || user?.email?.split('@')[0] || 'Me';
    const newMsg = {
      sender: user?.uid || 'me',
      senderUid: user?.uid || null,
      senderName: myName,
      text: messageText.trim(),
      time: new Date(),
      deletedFor: [],
      replyTo: replyToMsg ? {
        msgKey: replyToMsg.msgKey,
        senderName: replyToMsg.senderName || (replyToMsg.senderUid === user?.uid ? 'You' : targetConv.name),
        text: replyToMsg.text || 'Message'
      } : null,
      ...(isVanish ? {
        isVanish: true,
        vanishDuration: vanishDuration,
        vanishScope: vanishScope,
        vanishScopeUser: targetConv.vanishScopeUser || user?.uid,
        isPermanent: isKeepForeverActive,
        seenBy: [user?.uid].filter(Boolean),
        seenAt: { [user?.uid]: new Date() },
        expiresAt: null,
        keptBy: []
      } : {}),
      ...(isMySideOnly ? {
        isMySideOnly: true,
        mySideOnlySender: user?.uid,
        mySideOnlyDuration: mySideOnlyDuration,
        mySideOnlyExpiresAt: {
          [user?.uid]: new Date(Date.now() + mySideOnlyDuration * 1000)
        }
      } : {})
    };

    setIsKeepForeverActive(false);
    setReplyToMsg(null);

    const updatedMsgs = [...(targetConv.messages || []), newMsg];
    const sentText = messageText.trim();
    setMessageText('');

    if (targetConv.docId) {
      try {
        const docRef = doc(db, 'messages', targetConv.docId);
        const resetHidden = {};
        if (targetConv.hiddenFor) {
          Object.keys(targetConv.hiddenFor).forEach(k => {
            resetHidden[`hiddenFor.${k}`] = false;
          });
        }

        const myName = user?.name || user?.email?.split('@')[0] || 'User';
        const myAvatar = user?.photoURL || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(myName)}`;

        await updateDoc(docRef, {
          messages: updatedMsgs,
          lastMessage: sentText,
          time: new Date(),
          readBy: [user?.uid].filter(Boolean),
          [`participantMap.${user.uid}`]: { name: myName, avatar: myAvatar },
          ...resetHidden
        });
      } catch (error) {
        console.error('Failed to save message in Firestore:', error);
      }
    }
  };

  // Keep Vanish Message for current user only
  const handleKeepMessageForever = async (msgToKeep) => {
    if (!activeConversation || !activeConversation.docId) return;

    const keepPermission = activeConversation.vanishKeepPermission || 'always';
    if (keepPermission === 'never' && msgToKeep.senderUid !== myUid) {
      showSuccess('Sender does not allow keeping disappearing messages ❌');
      return;
    }

    const currentMsgs = activeConversation.messages || [];
    const updatedMsgs = currentMsgs.map(m => {
      const isTarget = m === msgToKeep ||
        (m.text === msgToKeep.text && Math.abs(new Date(m.time).getTime() - new Date(msgToKeep.time).getTime()) < 2000);
      if (isTarget) {
        const keptList = Array.isArray(m.keptBy) ? m.keptBy : [];
        return {
          ...m,
          keptBy: Array.from(new Set([...keptList, myUid]))
        };
      }
      return m;
    });

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, { messages: updatedMsgs });
      showSuccess('Message saved for your chat history 📌');
    } catch (err) {
      console.error('Failed to keep message:', err);
    }
  };

  // Bulk Keep Selected Messages for current user only
  const handleBulkKeepSelected = async () => {
    if (!activeConversation || !activeConversation.docId || selectedMsgKeys.length === 0) return;

    const keepPermission = activeConversation.vanishKeepPermission || 'always';
    if (keepPermission === 'never') {
      showSuccess('Sender does not allow keeping disappearing messages ❌');
      return;
    }

    const currentMsgs = activeConversation.messages || [];
    const updatedMsgs = currentMsgs.map(m => {
      const msgKey = `${m.text}_${new Date(m.time).getTime()}`;
      if (selectedMsgKeys.includes(msgKey)) {
        const keptList = Array.isArray(m.keptBy) ? m.keptBy : [];
        return {
          ...m,
          keptBy: Array.from(new Set([...keptList, myUid]))
        };
      }
      return m;
    });

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, { messages: updatedMsgs });
      setIsSelectMode(false);
      setSelectedMsgKeys([]);
      showSuccess(`Saved ${selectedMsgKeys.length} message(s) for your chat history 📌`);
    } catch (err) {
      console.error('Failed to keep selected messages:', err);
    }
  };

  // Save Vanish Mode Settings to Firestore
  const handleSaveVanishSettings = async (enabled, duration, keepPerm, scope = 'everyone') => {
    if (!activeConversation || !activeConversation.docId) return;

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      const updates = {
        isVanishMode: enabled,
        vanishDuration: duration,
        vanishKeepPermission: keepPerm,
        vanishScope: scope,
        vanishScopeUser: user?.uid
      };
      if (enabled && myUid) {
        updates[`mySideOnlyMap.${myUid}.enabled`] = false;
      }
      await updateDoc(docRef, updates);
      setIsVanishModalOpen(false);
      showSuccess(enabled ? `🔥 Vanish Mode ON (${formatVanishDurationLabel(duration)})` : 'Vanish Mode turned OFF');
    } catch (err) {
      console.error('Failed to save Vanish Mode settings:', err);
    }
  };

  // Save My Side Only Settings to Firestore (Strictly Per-User)
  const handleSaveMySideOnlySettings = async (enabled, duration) => {
    if (!activeConversation || !activeConversation.docId || !myUid) return;

    if (enabled && activeConversation.isVanishMode) {
      showSuccess('Cannot enable Auto Clear Chat while Vanish Mode is ON ❌');
      return;
    }

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, {
        [`mySideOnlyMap.${myUid}`]: {
          enabled: enabled,
          duration: duration
        }
      });
      setIsMySideOnlyModalOpen(false);
      showSuccess(enabled ? `👁️ Auto Clear Chat ON (${formatVanishDurationLabel(duration)})` : 'Auto Clear Chat turned OFF');
    } catch (err) {
      console.error('Failed to save Auto Clear Chat settings:', err);
    }
  };

  // WhatsApp-style: Delete Individual Message ONLY FOR ME
  const handleDeleteMessage = async (msgToDelete) => {
    if (!activeConversation || !activeConversation.docId) return;

    const currentMsgs = activeConversation.messages || [];
    const updatedMsgs = currentMsgs.map(m => {
      const isTarget = m === msgToDelete ||
                       (m.text === msgToDelete.text && Math.abs(new Date(m.time).getTime() - new Date(msgToDelete.time).getTime()) < 2000);
      if (isTarget) {
        const delList = m.deletedFor || [];
        if (!delList.includes(myUid)) {
          return { ...m, deletedFor: [...delList, myUid] };
        }
      }
      return m;
    });

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, { messages: updatedMsgs });
      showSuccess('Message deleted for you');
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Toggle Pin Chat
  const handleTogglePin = async (targetConv, e) => {
    if (e) e.stopPropagation();
    if (!targetConv || !targetConv.docId) return;
    setOpenMenuId(null);
    const currentlyPinned = targetConv.pinnedFor?.[myUid] === true;
    try {
      const docRef = doc(db, 'messages', targetConv.docId);
      await updateDoc(docRef, {
        [`pinnedFor.${myUid}`]: !currentlyPinned
      });
      showSuccess(currentlyPinned ? 'Chat unpinned' : 'Chat pinned to top');
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Toggle Mute Notifications
  const handleToggleMute = async (targetConv, e) => {
    if (e) e.stopPropagation();
    if (!targetConv || !targetConv.docId) return;
    setOpenMenuId(null);
    const currentlyMuted = targetConv.mutedFor?.[myUid] === true;
    try {
      const docRef = doc(db, 'messages', targetConv.docId);
      await updateDoc(docRef, {
        [`mutedFor.${myUid}`]: !currentlyMuted
      });
      showSuccess(currentlyMuted ? 'Notifications unmuted' : 'Notifications muted');
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  // Toggle Block User
  const handleToggleBlock = async (targetConv, e) => {
    if (e) e.stopPropagation();
    if (!targetConv || !targetConv.docId) return;
    setOpenMenuId(null);
    const currentlyBlocked = targetConv.blockedBy?.[myUid] === true;
    try {
      const docRef = doc(db, 'messages', targetConv.docId);
      await updateDoc(docRef, {
        [`blockedBy.${myUid}`]: !currentlyBlocked
      });
      showSuccess(currentlyBlocked ? 'User unblocked' : 'User blocked');
    } catch (err) {
      console.error('Failed to toggle block:', err);
    }
  };

  // Open User Profile
  const handleOpenProfile = (targetConv, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    const recipientUid = targetConv.recipientUid || (targetConv.participants?.find(p => p !== myUid));
    if (recipientUid) {
      navigate(`/profile?uid=${recipientUid}`);
    } else {
      showSuccess(`Viewing ${targetConv.name}'s profile`);
    }
  };

  // WhatsApp-style: Clear Chat History ONLY FOR ME
  const handleClearChat = async (targetConv = activeConversation, e = null, forceConfirmed = false) => {
    if (e) e.stopPropagation();
    const convToClear = targetConv || activeConversation;
    if (!convToClear || !convToClear.docId) return;
    setOpenMenuId(null);
    setShowHeaderMenu(false);

    if (!forceConfirmed) {
      setConfirmClearChatConv(convToClear);
      return;
    }

    try {
      const docRef = doc(db, 'messages', convToClear.docId);
      await updateDoc(docRef, {
        [`clearedFor.${myUid}`]: new Date()
      });
      showSuccess('Chat history cleared for you');
      setConfirmClearChatConv(null);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // WhatsApp-style: Delete Entire Conversation Thread ONLY FOR ME
  const handleDeleteConversation = async (targetConv = activeConversation, e = null, forceConfirmed = false) => {
    if (e) e.stopPropagation();
    const convToDelete = targetConv || activeConversation;
    if (!convToDelete || !convToDelete.docId) return;
    setShowHeaderMenu(false);

    if (!forceConfirmed) {
      setConfirmDeleteConv(convToDelete);
      return;
    }

    try {
      const docRef = doc(db, 'messages', convToDelete.docId);
      await updateDoc(docRef, {
        [`hiddenFor.${myUid}`]: true,
        [`clearedFor.${myUid}`]: new Date()
      });
      if (selectedId === convToDelete.id) {
        setSelectedId(null);
        setMobileView('list');
      }
      showSuccess('Conversation deleted');
      setConfirmDeleteConv(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Select or Create chat with user from Modal search result
  const handleSelectUserToChat = async (targetUser) => {
    setIsNewChatOpen(false);
    setSearchUserQuery('');

    // Check if conversation already exists with this student
    const existingConv = conversations.find(c =>
      c.participants?.includes(targetUser.uid) ||
      c.recipientUid === targetUser.uid ||
      c.name.toLowerCase() === targetUser.name.toLowerCase()
    );

    if (existingConv) {
      setSelectedId(existingConv.id);
      setMobileView('chat');
      // Unhide if previously deleted for me
      if (existingConv.hiddenFor?.[myUid]) {
        try {
          await updateDoc(doc(db, 'messages', existingConv.docId), {
            [`hiddenFor.${myUid}`]: false
          });
        } catch (e) {
          console.error('Error unhiding conversation:', e);
        }
      }
    } else {
      // Create new conversation thread in Firestore
      try {
        const myName = user?.name || user?.email?.split('@')[0] || 'User';
        const myAvatar = user?.photoURL || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(myName)}`;
        const targetName = targetUser.name || 'User';
        const targetAvatar = targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetName)}`;

        const newConvData = {
          name: targetName,
          avatar: targetAvatar,
          recipientUid: targetUser.uid,
          recipientName: targetName,
          recipientAvatar: targetAvatar,
          participants: [user?.uid, targetUser.uid].filter(Boolean),
          participantMap: {
            [user.uid]: { name: myName, avatar: myAvatar },
            [targetUser.uid]: { name: targetName, avatar: targetAvatar }
          },
          createdBy: user?.uid || null,
          createdByName: myName,
          createdByAvatar: myAvatar,
          readBy: [user?.uid].filter(Boolean),
          lastMessage: 'Started a new conversation',
          time: new Date(),
          messages: []
        };
        const docRef = await addDoc(collection(db, 'messages'), newConvData);
        setSelectedId(docRef.id);
        setMobileView('chat');
        showSuccess(`Started chat with ${targetName}`);
      } catch (err) {
        console.error('Error starting new chat thread:', err);
      }
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedId(conv.id);
    setMobileView('chat');
    setShowHeaderMenu(false);

    if (conv.docId && user?.uid) {
      try {
        const docRef = doc(db, 'messages', conv.docId);
        const updatedMsgs = (conv.messages || []).map(m => {
          const isFromOther = m.senderUid ? m.senderUid !== myUid : m.senderName !== (user?.name || user?.email?.split('@')[0]);
          if (isFromOther && (!m.readBy || !m.readBy.includes(myUid))) {
            return {
              ...m,
              readBy: [...(m.readBy || []), myUid]
            };
          }
          return m;
        });

        await updateDoc(docRef, {
          readBy: arrayUnion(user.uid),
          messages: updatedMsgs
        });
      } catch (e) {
        console.error('Error marking conversation read:', e);
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(search.toLowerCase()) ||
    (conv.lastMessage && conv.lastMessage.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-0 md:px-lg md:py-3xl h-[100dvh] md:h-[calc(100vh-5rem)]">
      <div className="flex flex-col md:flex-row gap-0 md:gap-lg h-full">
        {/* Left Sidebar - Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col h-full ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          <Card className="flex-1 flex flex-col p-md overflow-hidden rounded-none md:rounded-xl border-none md:border">
            {/* Header & Search Bar */}
            <div className="p-md space-y-md border-b border-neutral-100 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-sm">
                <div className="flex items-center gap-xs">
                  <button
                    onClick={() => navigate(-1)}
                    className="md:hidden p-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Go Back"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-2xl font-heading font-extrabold text-neutral-900 dark:text-white tracking-tight">Messages</h1>
                </div>

                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-lg py-xs bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-xs flex-shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> New Chat
                </button>
              </div>

              {/* Compact Side-by-Side Search Bar & Starred Button */}
              <div className="flex items-center gap-xs">
                <div className="relative flex-1 group">
                  <Search className="absolute left-md top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-2xl pr-xl py-xs text-xs font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-white placeholder-neutral-400 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-md top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsGlobalStarredModalOpen(true)}
                  className="px-md py-xs bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-500 font-semibold text-xs rounded-xl transition-all flex items-center gap-xs flex-shrink-0 whitespace-nowrap"
                  title="View all starred messages"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Starred</span>
                  <span className="px-1.5 py-[1px] text-[10px] bg-amber-500/20 rounded-full font-bold">
                    {allStarredMessages.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-xs space-y-xs">
              {loading ? (
                <div className="space-y-sm py-md">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 skeleton rounded-xl" />
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map(conv => {
                  const isSelected = selectedId === conv.id;
                  const isPinned = conv.pinnedFor?.[myUid] === true;
                  const isMuted = conv.mutedFor?.[myUid] === true;
                  const isBlocked = conv.blockedBy?.[myUid] === true;
                  const isMenuOpen = openMenuId === conv.id;

                  // Compute unread messages count for current user (0 if conversation is currently open/selected)
                  const unreadCount = isSelected ? 0 : (conv.messages || []).filter(m => {
                    if (!m) return false;
                    const isFromOther = m.senderUid ? m.senderUid !== myUid : m.senderName !== (user?.name || user?.email?.split('@')[0]);
                    const isRead = Array.isArray(m.readBy) && m.readBy.includes(myUid);
                    const isDeleted = Array.isArray(m.deletedFor) && m.deletedFor.includes(myUid);
                    return isFromOther && !isRead && !isDeleted;
                  }).length;

                  return (
                    <div key={conv.id} className="relative group flex items-center">
                      <button
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full p-md rounded-xl text-left flex items-center gap-md transition-colors pr-10 ${
                          isSelected
                            ? 'bg-primary-100/70 dark:bg-neutral-800 border-l-4 border-primary-500 shadow-sm'
                            : unreadCount > 0
                              ? 'bg-sky-50/80 dark:bg-neutral-800/90'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={conv.avatar}
                            alt={conv.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {isBlocked && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-danger text-white rounded-full p-0.5" title="Blocked">
                              <Ban className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span className={`font-semibold text-sm truncate flex items-center gap-xs ${
                              isSelected
                                ? 'text-primary-950 dark:text-white font-bold'
                                : unreadCount > 0
                                  ? 'text-neutral-900 dark:text-white font-extrabold'
                                  : 'text-neutral-900 dark:text-neutral-200'
                            }`}>
                              {conv.name}
                              {isPinned && (
                                <Pin className="w-3 h-3 text-primary-500 fill-primary-500/20 flex-shrink-0" title="Pinned" />
                              )}
                              {isMuted && (
                                <BellOff className="w-3 h-3 text-neutral-400 flex-shrink-0" title="Muted" />
                              )}
                            </span>

                            {/* Vibrant Blue Circle Badge with Unread Count */}
                            {unreadCount > 0 && !isSelected ? (
                              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary-500 text-white font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/30 animate-pulse ring-2 ring-white dark:ring-neutral-900 ml-xs">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            ) : (
                              <span className={`text-[10px] font-medium ml-xs flex-shrink-0 ${
                                isSelected
                                  ? 'text-primary-700 dark:text-primary-400'
                                  : 'text-neutral-400'
                              }`}>
                                {formatRelativeTime(conv.time)}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-xs">
                            <p className={`text-xs truncate ${
                              unreadCount > 0 && !isSelected
                                ? 'text-primary-600 dark:text-primary-400 font-bold'
                                : isSelected
                                  ? 'text-primary-800 dark:text-neutral-300 font-medium'
                                  : 'text-neutral-500'
                            }`}>
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* 3-Dots Action Menu Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : conv.id);
                        }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all z-20 ${
                          isMenuOpen
                            ? 'opacity-100 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                            : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                        }`}
                        title="Chat options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Contextual Action Menu Dropdown */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />
                          <div className="absolute right-2 top-10 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-40 py-1 text-xs font-medium space-y-0.5 animate-slide-up">
                            {/* 📌 Pin / Unpin */}
                            <button
                              onClick={(e) => handleTogglePin(conv, e)}
                              className="w-full px-md py-xs text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 flex items-center gap-sm transition-colors"
                            >
                              {isPinned ? (
                                <>
                                  <PinOff className="w-3.5 h-3.5 text-amber-500" /> Unpin Chat
                                </>
                              ) : (
                                <>
                                  <Pin className="w-3.5 h-3.5 text-primary-500" /> Pin Chat
                                </>
                              )}
                            </button>

                            {/* 🔕 Mute / Unmute */}
                            <button
                              onClick={(e) => handleToggleMute(conv, e)}
                              className="w-full px-md py-xs text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 flex items-center gap-sm transition-colors"
                            >
                              {isMuted ? (
                                <>
                                  <Bell className="w-3.5 h-3.5 text-emerald-500" /> Unmute Notifications
                                </>
                              ) : (
                                <>
                                  <BellOff className="w-3.5 h-3.5 text-neutral-500" /> Mute Notifications
                                </>
                              )}
                            </button>

                            {/* 👤 Open Profile */}
                            <button
                              onClick={(e) => handleOpenProfile(conv, e)}
                              className="w-full px-md py-xs text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 flex items-center gap-sm transition-colors"
                            >
                              <User className="w-3.5 h-3.5 text-blue-500" /> Open Profile
                            </button>

                            {/* 🧹 Clear Chat */}
                            <button
                              onClick={(e) => handleClearChat(conv, e)}
                              className="w-full px-md py-xs text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 flex items-center gap-sm transition-colors"
                            >
                              <Eraser className="w-3.5 h-3.5 text-amber-500" /> Clear Chat
                            </button>

                            <div className="my-1 border-t border-neutral-100 dark:border-neutral-700/60" />

                            {/* 🚫 Block / Unblock */}
                            <button
                              onClick={(e) => handleToggleBlock(conv, e)}
                              className="w-full px-md py-xs text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 flex items-center gap-sm transition-colors"
                            >
                              {isBlocked ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Unblock User
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 text-amber-600" /> Block User
                                </>
                              )}
                            </button>

                            {/* 🗑️ Delete Chat */}
                            <button
                              onClick={(e) => handleDeleteConversation(conv, e)}
                              className="w-full px-md py-xs text-left text-danger hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-sm transition-colors font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-danger" /> Delete Chat
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4xl px-md">
                  <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                  <p className="text-sm font-bold mb-xs">No Direct Messages</p>
                  <p className="text-xs text-neutral-500 mb-md">Search for a student or classmate to message them!</p>
                  <Button size="xs" variant="primary" onClick={() => setIsNewChatOpen(true)}>
                    Start Chat
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Main Chat Panel */}
        <div className={`flex-1 h-full ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeConversation ? (
            <Card className="flex-1 flex flex-col p-0 overflow-hidden border-none md:border rounded-none md:rounded-xl border-neutral-100 dark:border-neutral-800">
              {/* WhatsApp-Style Chat Header */}
              <div className="p-lg border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 relative">
                {/* Standard or Select Mode Header Bar */}
                {isSelectMode ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <button
                        onClick={() => { setIsSelectMode(false); setSelectedMsgKeys([]); }}
                        className="p-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedMsgKeys.length} Selected
                      </span>
                    </div>

                    <div className="flex items-center gap-xs">
                      <Button
                        size="xs"
                        variant="secondary"
                        disabled={selectedMsgKeys.length === 0}
                        onClick={handleBulkKeepSelected}
                        className="flex items-center gap-xs text-emerald-500 hover:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        title="Keep selected messages permanently"
                      >
                        <InfinityIcon className="w-4 h-4" /> Keep
                      </Button>
                      <Button
                        size="xs"
                        variant="secondary"
                        disabled={selectedMsgKeys.length === 0}
                        onClick={handleBulkStarSelected}
                        className="flex items-center gap-xs text-amber-500"
                      >
                        <Star className="w-4 h-4 fill-amber-400" /> Star
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        disabled={selectedMsgKeys.length === 0}
                        onClick={handleBulkDeleteSelected}
                        className="flex items-center gap-xs"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {/* User Info (Clicking opens Profile Modal) */}
                    <div
                      onClick={() => setIsProfileModalOpen(true)}
                      className="flex items-center gap-md cursor-pointer group"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setMobileView('list'); }}
                        className="md:hidden p-xs text-neutral-500 hover:text-neutral-900"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <div className="relative">
                        <img
                          src={activeConversation.avatar}
                          alt={activeConversation.name}
                          className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary-500 transition-all"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors flex items-center gap-xs truncate">
                          <span className="truncate">{activeConversation.name}</span>
                          {activeConversation.mutedFor?.[myUid] && (
                            <BellOff className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" title="Muted" />
                          )}
                        </h2>
                        {activeConversation.isVanishMode && (
                          <div
                            onClick={(e) => { e.stopPropagation(); setIsVanishModalOpen(true); }}
                            className="flex items-center gap-xs text-[10px] sm:text-[11px] font-semibold text-amber-500 hover:text-amber-400 mt-[1px] truncate"
                            title="Click to change Vanish Mode Settings"
                          >
                            <Flame className="w-3 h-3 fill-amber-400 animate-pulse flex-shrink-0" />
                            <span className="truncate">Vanish Mode ON • {formatVanishDurationLabel(activeConversation.vanishDuration)}</span>
                          </div>
                        )}
                        {!activeConversation.isVanishMode && activeConversation?.mySideOnlyMap?.[myUid]?.enabled && (
                          <div
                            onClick={(e) => { e.stopPropagation(); setIsMySideOnlyModalOpen(true); }}
                            className="flex items-center gap-xs text-[10px] sm:text-[11px] font-semibold text-purple-400 hover:text-purple-300 mt-[1px] truncate"
                            title="Click to change Auto Clear Chat Settings"
                          >
                            <EyeOff className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            <span className="truncate">Auto Clear • {formatVanishDurationLabel(activeConversation.mySideOnlyMap?.[myUid]?.duration || 300)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Header Actions */}
                    <div className="flex items-center gap-1 sm:gap-xs flex-shrink-0">
                      {/* 👁️ Auto Clear Chat Button */}
                      <button
                        onClick={() => setIsMySideOnlyModalOpen(true)}
                        className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center ${
                          activeConversation?.mySideOnlyMap?.[myUid]?.enabled
                            ? 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 shadow-xs'
                            : 'text-neutral-500 hover:text-purple-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title="Auto Clear Chat Settings (Local Auto-Delete)"
                      >
                        <EyeOff className={`w-4 h-4 sm:w-5 sm:h-5 ${activeConversation?.mySideOnlyMap?.[myUid]?.enabled ? 'text-purple-400' : ''}`} />
                      </button>

                      {/* 🔥 Vanish Mode Button */}
                      <button
                        onClick={() => setIsVanishModalOpen(true)}
                        className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center ${
                          activeConversation.isVanishMode
                            ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                            : 'text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title="Vanish Mode Settings"
                      >
                        <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${activeConversation.isVanishMode ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* In-Chat Search Button */}
                      <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 sm:p-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                          isSearchOpen ? 'bg-neutral-100 dark:bg-neutral-800 text-primary-500' : ''
                        }`}
                        title="Search messages"
                      >
                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      {/* Header Options Dropdown Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                          className="p-2 sm:p-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Chat Options"
                        >
                          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        {/* Dropdown Menu Items */}
                        {showHeaderMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setShowHeaderMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-xs w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-xs text-xs font-medium space-y-xs">
                            <button
                              onClick={() => { setShowHeaderMenu(false); setIsMySideOnlyModalOpen(true); }}
                              className="w-full px-lg py-md text-left text-purple-400 hover:bg-purple-500/10 flex items-center gap-md font-semibold"
                            >
                              <EyeOff className="w-4 h-4 text-purple-400" />
                              <span>Auto Clear Chat Settings</span>
                              {activeConversation?.mySideOnlyMap?.[myUid]?.enabled && (
                                <span className="ml-auto text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">ON</span>
                              )}
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); setIsVanishModalOpen(true); }}
                              className="w-full px-lg py-md text-left text-amber-500 hover:bg-amber-500/10 flex items-center gap-md font-semibold"
                            >
                              <Flame className="w-4 h-4 fill-amber-400" />
                              <span>Vanish Mode Settings</span>
                              {activeConversation.isVanishMode && (
                                <span className="ml-auto text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">ON</span>
                              )}
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); setIsProfileModalOpen(true); }}
                              className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <User className="w-4 h-4 text-blue-500" /> View User Profile
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); setIsSearchOpen(true); }}
                              className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <Search className="w-4 h-4 text-primary-500" /> Search Messages
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); setIsStarredModalOpen(true); }}
                              className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Starred Messages ({starredMessages.length})
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); setIsSelectMode(true); }}
                              className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <CheckSquare className="w-4 h-4 text-indigo-500" /> Select Messages
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); handleToggleMute(activeConversation); }}
                              className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              {activeConversation.mutedFor?.[myUid] ? (
                                <>
                                  <Bell className="w-4 h-4 text-emerald-500" /> Unmute Notifications
                                </>
                              ) : (
                                <>
                                  <BellOff className="w-4 h-4 text-neutral-500" /> Mute Notifications
                                </>
                              )}
                            </button>
                            <div className="my-xs border-t border-neutral-100 dark:border-neutral-700" />
                            <button
                              onClick={() => { setShowHeaderMenu(false); handleClearChat(activeConversation); }}
                              className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <Eraser className="w-4 h-4 text-amber-500" /> Clear Chat (For Me)
                            </button>
                            <button
                              onClick={() => { setShowHeaderMenu(false); handleDeleteConversation(activeConversation); }}
                              className="w-full px-lg py-md text-left text-danger hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-md font-semibold"
                            >
                              <Trash2 className="w-4 h-4 text-danger" /> Delete Chat (For Me)
                            </button>
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                )}

                {/* In-Chat Search Input Bar */}
                {isSearchOpen && (
                  <div className="mt-md pt-md border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-md transition-all">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-lg top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search in conversation..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full pl-3xl pr-2xl py-xs text-xs font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-white placeholder-neutral-400 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all shadow-inner"
                        autoFocus
                      />
                      {chatSearchQuery && (
                        <button
                          onClick={() => setChatSearchQuery('')}
                          className="absolute right-md top-1/2 -translate-y-1/2 p-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {chatSearchQuery && (
                      <span className="text-xs text-primary-500 font-semibold flex-shrink-0 bg-primary-500/10 px-md py-xs rounded-lg">
                        {filteredVisibleMessages.length} match{filteredVisibleMessages.length !== 1 ? 'es' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => { setIsSearchOpen(false); setChatSearchQuery(''); }}
                      className="p-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                      title="Close Search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Messages Log with Immersive Secret Theme in Vanish Mode */}
              <div className={`flex-1 overflow-y-auto p-md sm:p-lg space-y-md transition-colors duration-500 ${
                activeConversation.isVanishMode
                  ? 'bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-neutral-950 to-black'
                  : 'bg-neutral-50/50 dark:bg-neutral-950/40'
              }`}>
                {filteredVisibleMessages.length > 0 ? (
                  filteredVisibleMessages.map((msg, idx) => {
                    const myName = user?.name || user?.email?.split('@')[0];
                    const isMe = msg.senderUid
                      ? msg.senderUid === user?.uid
                      : (msg.senderName && myName ? msg.senderName === myName : (msg.sender === 'me' && activeConversation?.createdBy === user?.uid));

                    const msgKey = `${msg.text}_${new Date(msg.time).getTime()}`;
                    const isMsgSelected = selectedMsgKeys.includes(msgKey);
                    const isStarred = Array.isArray(msg.starredBy) && msg.starredBy.includes(myUid);
                    const isHighlighted = highlightedMsgKey === msgKey;

                    return (
                      <div
                        key={idx}
                        id={`msg-${msgKey}`}
                        className={`group flex items-center gap-md max-w-[85%] relative transition-all duration-300 ${
                          isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                        } ${isHighlighted ? 'ring-4 ring-amber-400/80 rounded-2xl p-1 bg-amber-500/15 scale-[1.03] shadow-xl z-20 animate-pulse' : ''}`}
                      >
                        {/* Multi-Select Checkbox */}
                        {isSelectMode && (
                          <button
                            onClick={() => handleToggleSelectMsg(msgKey)}
                            className="p-xs text-primary-500 hover:scale-110 transition-transform"
                          >
                            {isMsgSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary-500 fill-primary-500/10" />
                            ) : (
                              <Square className="w-5 h-5 text-neutral-400" />
                            )}
                          </button>
                        )}

                        <div className={`flex flex-col flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          <SwipeableMessageRow
                            isMe={isMe}
                            onReply={() => setReplyToMsg({ ...msg, msgKey, senderName: isMe ? 'You' : activeConversation.name })}
                          >
                            <div className={`flex items-end gap-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Avatar for recipient (left side) */}
                              {!isMe && (
                                <img
                                  src={activeConversation.avatar}
                                  alt={activeConversation.name}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-0.5"
                                />
                              )}

                              {/* Message Bubble */}
                              <div
                                className={`p-md rounded-2xl text-sm shadow-sm relative ${
                                  isMe
                                    ? 'bg-primary-500 text-white rounded-br-xs'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700/80 rounded-bl-xs'
                                }`}
                              >
                                {/* Quoted Reply Box if replying to another message */}
                                {msg.replyTo && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (msg.replyTo.msgKey) handleJumpToMessage(msg.replyTo.msgKey);
                                    }}
                                    className={`mb-xs p-xs px-sm rounded-lg border-l-4 text-xs cursor-pointer transition-all hover:opacity-90 ${
                                      isMe
                                        ? 'bg-black/25 text-white border-white/90'
                                        : 'bg-primary-500/10 text-neutral-800 dark:text-neutral-100 border-primary-500'
                                    }`}
                                  >
                                    <p className="font-bold text-[11px] flex items-center gap-1 opacity-95">
                                      <CornerUpLeft className="w-3 h-3 text-primary-400" />
                                      {msg.replyTo.senderName}
                                    </p>
                                    <p className="truncate text-[11px] opacity-85 mt-0.5 font-medium">
                                      {msg.replyTo.text}
                                    </p>
                                  </div>
                                )}

                                <span>{msg.text}</span>
                                {isStarred && (
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline-block ml-xs" title="Starred message" />
                                )}

                                {/* Vanish Mode Indicators & Per-User Keep Status */}
                                {msg.isVanish && (() => {
                                  const isKeptByMe = Array.isArray(msg.keptBy) && msg.keptBy.includes(myUid);
                                  const keptOthersList = Array.isArray(msg.keptBy) ? msg.keptBy.filter(id => id !== myUid) : [];
                                  const wasSavedByOther = keptOthersList.length > 0;

                                  return (
                                    <div className="mt-xs pt-xs border-t border-white/20 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-xs text-[10px] opacity-90 font-medium">
                                      {isKeptByMe ? (
                                        <span className="flex items-center gap-0.5 text-emerald-400 font-bold" title="Message saved for your chat history">
                                          <InfinityIcon className="w-3 h-3" /> Saved for you
                                        </span>
                                      ) : msg.isPermanent ? (
                                        <span className="flex items-center gap-0.5 text-emerald-400 font-bold" title="Permanent Message">
                                          <InfinityIcon className="w-3 h-3" /> Permanent
                                        </span>
                                      ) : msg.expiresAt?.[myUid] ? (
                                        <span className="flex items-center gap-0.5 text-amber-300 font-bold" title="Expiring Soon">
                                          <Clock className="w-3 h-3" /> Disappears in {getRemainingVanishTime(msg.expiresAt[myUid])}
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-0.5 text-neutral-300 dark:text-neutral-400" title="Timer starts after recipient views text">
                                          <Clock className="w-3 h-3" /> Waiting until seen
                                        </span>
                                      )}

                                      {/* Inline notification tag if saved by the other user */}
                                      {wasSavedByOther && !isKeptByMe && (
                                        <span className="flex items-center gap-0.5 text-purple-300 font-semibold bg-purple-500/20 px-1.5 py-0.5 rounded" title="Other user saved this message on their device">
                                          📌 Saved by {activeConversation.name?.split(' ')[0] || 'other user'}
                                        </span>
                                      )}

                                      {!isKeptByMe && !msg.isPermanent && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleKeepMessageForever(msg); }}
                                          className="px-2 py-0.5 rounded-md bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 ml-auto flex-shrink-0"
                                          title="Save message for your chat"
                                        >
                                          <InfinityIcon className="w-3 h-3" />
                                          <span>Save</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* My Side Only Local Auto-Delete Indicator (Strictly for user with active timer on their side) */}
                                {!msg.isVanish && msg.mySideOnlyExpiresAt?.[myUid] && (
                                  <div className="mt-xs pt-xs border-t border-white/20 dark:border-neutral-700/60 flex items-center justify-between gap-sm text-[10px] opacity-90 font-medium">
                                    {msg.isPermanent ? (
                                      <span className="flex items-center gap-0.5 text-emerald-400 font-bold" title="Keep Forever Enabled">
                                        <InfinityIcon className="w-3 h-3" /> Permanent
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-0.5 text-purple-300 font-bold" title="Local Auto-Delete timer running for your side">
                                        <User className="w-3 h-3 text-purple-300" /> Disappears from my side in {getRemainingVanishTime(msg.mySideOnlyExpiresAt[myUid])}
                                      </span>
                                    )}

                                    {!msg.isPermanent && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleKeepMessageForever(msg); }}
                                        className="px-2 py-0.5 rounded-md bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 ml-auto flex-shrink-0"
                                        title="Cancel timer and keep message permanently"
                                      >
                                        <InfinityIcon className="w-3 h-3" />
                                        <span>Keep</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Message Action Buttons (Reply, Keep Forever, Star & Delete) on Hover */}
                              {!isSelectMode && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-xs">
                                  <button
                                    type="button"
                                    onClick={() => setReplyToMsg({ ...msg, msgKey, senderName: isMe ? 'You' : activeConversation.name })}
                                    className="p-xs text-neutral-400 hover:text-primary-500 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                    title="Reply to message ↩️"
                                  >
                                    <CornerUpLeft className="w-3.5 h-3.5" />
                                  </button>
                                  {msg.isVanish && !msg.isPermanent && (
                                    <button
                                      onClick={() => handleKeepMessageForever(msg)}
                                      className="p-xs text-emerald-400 hover:text-emerald-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                      title="Keep Forever (Save Message ♾️)"
                                    >
                                      <InfinityIcon className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleToggleStarMessage(msg)}
                                    className={`p-xs rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
                                      isStarred ? 'text-amber-400' : 'text-neutral-400 hover:text-amber-400'
                                    }`}
                                    title={isStarred ? 'Unstar message' : 'Star message'}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(msg)}
                                    className="p-xs text-neutral-400 hover:text-danger rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                    title="Delete for me"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </SwipeableMessageRow>

                          <span className={`text-[10px] text-neutral-400 mt-xs px-xs font-medium ${isMe ? 'text-right' : 'text-left pl-8'}`}>
                            {formatRelativeTime(msg.time)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-5xl">
                    <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                    <p className="text-sm font-semibold text-neutral-500">
                      {chatSearchQuery ? `No messages matching "${chatSearchQuery}"` : `This is the start of your direct message history with ${activeConversation.name}.`}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying Preview Banner */}
              {replyToMsg && (
                <div className="px-lg py-sm bg-neutral-100 dark:bg-neutral-800/90 border-t border-b border-primary-500/30 flex items-center justify-between text-xs transition-all shadow-inner">
                  <div className="flex items-center gap-md border-l-4 border-primary-500 pl-md py-0.5 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold text-primary-600 dark:text-primary-400 text-xs flex items-center gap-xs">
                        <CornerUpLeft className="w-3.5 h-3.5" />
                        Replying to {replyToMsg.senderName || (replyToMsg.senderUid === user?.uid ? 'You' : activeConversation.name)}
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-300 truncate text-[11px] mt-0.5">
                        {replyToMsg.text || 'Message'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyToMsg(null)}
                    className="p-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors ml-md"
                    title="Cancel reply"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className={`p-xs sm:p-md border-t flex gap-xs sm:gap-md items-center transition-all ${
                  activeConversation.isVanishMode
                    ? 'bg-neutral-900/95 border-amber-500/30 dark:border-amber-500/20 shadow-[0_-4px_20px_rgba(245,158,11,0.15)]'
                    : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800'
                }`}
              >
                {activeConversation.isVanishMode && (
                  <button
                    type="button"
                    onClick={() => setIsKeepForeverActive(!isKeepForeverActive)}
                    className={`p-2 sm:px-md sm:py-xs rounded-xl border text-xs font-semibold flex items-center gap-xs transition-all flex-shrink-0 ${
                      isKeepForeverActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Toggle Keep Forever for this message"
                  >
                    <InfinityIcon className="w-4 h-4" />
                    <span className="hidden xs:inline text-[11px] font-bold">Keep</span>
                  </button>
                )}
                <input
                  type="text"
                  placeholder={`Message ${activeConversation.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="input-base text-sm flex-1"
                />
                <Button type="submit" variant="primary" size="md" disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center p-2xl text-center">
              <div>
                <MessageSquare className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                <h3 className="font-bold text-xl mb-xs">Select a Conversation</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-lg">
                  Choose a direct message thread from the sidebar or search for a classmate to start chatting.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsNewChatOpen(true)}>
                  <Plus className="w-4 h-4 mr-xs inline" /> New Conversation
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Conversation Modal with Live User Search */}
      <Modal
        isOpen={isNewChatOpen}
        onClose={() => { setIsNewChatOpen(false); setSearchUserQuery(''); }}
        title="New Direct Message"
        size="md"
      >
        <div className="space-y-lg">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="absolute left-lg top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="@username"
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="input-base pl-3xl pr-xl py-md text-sm w-full"
              autoFocus
            />
            {searchUserQuery && (
              <button
                onClick={() => setSearchUserQuery('')}
                className="absolute right-md top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Student Search Results List */}
          <div className="max-h-72 overflow-y-auto space-y-xs pr-xs">
            {searchingUsers ? (
              <div className="space-y-sm py-md">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 skeleton rounded-xl" />
                ))}
              </div>
            ) : matchingUsers.length > 0 ? (
              matchingUsers.map(st => (
                <div
                  key={st.id}
                  onClick={() => handleSelectUserToChat(st)}
                  className="p-md rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-primary-500/40 bg-white dark:bg-neutral-900/80 hover:bg-primary-50/40 dark:hover:bg-neutral-800 flex items-center justify-between gap-md cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-md min-w-0">
                    <img
                      src={st.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(st.email || 'user')}`}
                      alt={st.name}
                      className="w-10 h-10 rounded-full flex-shrink-0 border border-neutral-200 dark:border-neutral-700 object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors truncate">
                        {st.name}
                      </h4>
                      {st.username && (
                        <p className="text-xs font-mono text-primary-500 font-bold">
                          @{st.username}
                        </p>
                      )}
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-[1px]">
                        {st.college || 'KIET'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="xs"
                    className="flex-shrink-0 pointer-events-none"
                  >
                    Chat
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4xl text-neutral-500 dark:text-neutral-400">
                <User className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-xs" />
                <p className="text-xs font-semibold">No students found matching "{searchUserQuery}"</p>
                <p className="text-[11px] text-neutral-400 mt-xs">Try searching by full name or @username</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Recipient User Profile Modal */}
      {activeConversation && (() => {
        const userCollege = recipientProfile?.college || activeConversation?.college || 'KIET';

        return (
          <Modal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            title="Student Profile"
            size="md"
          >
            <div className="space-y-xl py-md">
              {/* Avatar Header */}
              <div className="text-center">
                <div className="relative inline-block group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-600 blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                  <img
                    src={activeConversation.avatar}
                    alt={activeConversation.name}
                    className="relative w-28 h-28 rounded-full mx-auto object-cover border-4 border-white dark:border-neutral-900 shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 absolute bottom-1 right-2 shadow-md" title="Active now" />
                </div>

                <div className="mt-md space-y-xs">
                  <h3 className="text-2xl font-heading font-extrabold text-neutral-900 dark:text-white flex items-center justify-center gap-xs">
                    {activeConversation.name}
                    <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-500/10" title="Cohort Verified Student" />
                  </h3>
                  <div className="inline-flex items-center gap-xs px-3.5 py-1 rounded-full bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold text-xs border border-primary-500/20 shadow-xs">
                    <span>{userCollege} Student</span>
                  </div>
                </div>
              </div>

              {/* Glowing Cohort Verified Campus Badge Card */}
              <div className="p-lg rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-between gap-md shadow-sm">
                <div className="flex items-center gap-md">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-heading font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-xs">
                      Cohort Verified
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Official {userCollege} Campus Member
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1 flex-shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Verified
                </span>
              </div>

            {/* Cool Quick Chat Toggles Box */}
            <div className="space-y-sm">
              {/* Mute Notifications Toggle Switch */}
              <div className="p-md rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between gap-md transition-all hover:border-primary-500/30">
                <div className="flex items-center gap-md">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    activeConversation.mutedFor?.[myUid]
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                      : 'bg-primary-500/10 text-primary-500'
                  }`}>
                    {activeConversation.mutedFor?.[myUid] ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-xs text-neutral-900 dark:text-white">Mute Notifications</h5>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Silence chat alerts</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleMute(activeConversation)}
                  className={`w-12 h-7 rounded-full p-1 transition-all duration-300 relative ${
                    activeConversation.mutedFor?.[myUid] ? 'bg-amber-500 shadow-sm' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                    activeConversation.mutedFor?.[myUid] ? 'translate-x-5' : 'translate-x-0'
                  }`}>
                    {activeConversation.mutedFor?.[myUid] && <BellOff className="w-3 h-3 text-amber-600" />}
                  </div>
                </button>
              </div>

              {/* Vanish Mode Quick Toggle Switch */}
              <div className="p-md rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between gap-md transition-all hover:border-amber-500/30">
                <div className="flex items-center gap-md">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    activeConversation.isVanishMode
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                  }`}>
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-xs text-neutral-900 dark:text-white">Vanish Mode</h5>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Disappearing chat messages</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newIsVanish = !activeConversation.isVanishMode;
                    handleSaveVanishSettings(
                      newIsVanish,
                      activeConversation.vanishDuration || 3600,
                      activeConversation.vanishKeepPermission || 'always',
                      activeConversation.vanishScope || 'everyone'
                    );
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-all duration-300 relative ${
                    activeConversation.isVanishMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                    activeConversation.isVanishMode ? 'translate-x-5' : 'translate-x-0'
                  }`}>
                    {activeConversation.isVanishMode && <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-sm border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  const recipientUid = activeConversation.recipientUid || (activeConversation.participants?.find(p => p !== myUid));
                  if (recipientUid) navigate(`/profile?uid=${recipientUid}`);
                }}
                className="w-full py-3.5 px-lg rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-md"
              >
                <User className="w-4 h-4" />
                <span>Open Full Profile</span>
              </button>
            </div>
          </div>
        </Modal>
      );
    })()}

      {/* Starred Messages Modal */}
      {activeConversation && (
        <Modal
          isOpen={isStarredModalOpen}
          onClose={() => setIsStarredModalOpen(false)}
          title={`Starred Messages (${starredMessages.length})`}
          size="md"
        >
          <div className="max-h-[60vh] overflow-y-auto space-y-md p-xs">
            {starredMessages.length > 0 ? (
              starredMessages.map((sMsg, idx) => (
                <div
                  key={idx}
                  onClick={() => handleJumpToMessage(sMsg)}
                  className="p-lg rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex justify-between items-start gap-lg hover:border-amber-500/60 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 cursor-pointer transition-all group"
                >
                  <div className="space-y-xs min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-500">{sMsg.senderName || 'Message'}</span>
                      <span className="text-[11px] text-neutral-400 font-medium">{formatRelativeTime(sMsg.time)}</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white leading-relaxed">{sMsg.text}</p>
                    <span className="text-[11px] text-amber-500 font-semibold inline-flex items-center gap-xs mt-xs group-hover:underline">
                      Jump to message in chat →
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStarMessage(sMsg); }}
                    className="p-md text-amber-400 hover:text-red-500 rounded-xl hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                    title="Unstar message"
                  >
                    <Star className="w-5 h-5 fill-amber-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4xl px-lg">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-lg ring-8 ring-amber-500/5">
                  <Star className="w-8 h-8 fill-amber-400" />
                </div>
                <h4 className="text-lg font-heading font-bold text-neutral-900 dark:text-white mb-xs">
                  No Starred Messages
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  Hover over any message bubble in your chat and click the <span className="text-amber-400 font-semibold">⭐ Star</span> button to save important notes or links here.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Global All Starred Messages Across All Chats Modal */}
      <Modal
        isOpen={isGlobalStarredModalOpen}
        onClose={() => setIsGlobalStarredModalOpen(false)}
        title={`All Starred Messages (${allStarredMessages.length})`}
        size="lg"
      >
        <div className="max-h-[65vh] overflow-y-auto space-y-md p-xs">
          {allStarredMessages.length > 0 ? (
            allStarredMessages.map((sMsg, idx) => (
              <div
                key={idx}
                onClick={() => handleGlobalJumpToMessage(sMsg)}
                className="p-lg rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-start gap-lg hover:border-amber-500/60 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 cursor-pointer transition-all group"
              >
                <img
                  src={sMsg.convAvatar}
                  alt={sMsg.convName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5 border border-neutral-200 dark:border-neutral-700"
                />
                <div className="space-y-xs min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-xs">
                      {sMsg.convName}
                      <span className="text-[10px] text-primary-500 font-semibold">• {sMsg.senderName || 'Message'}</span>
                    </span>
                    <span className="text-[11px] text-neutral-400 font-medium">{formatRelativeTime(sMsg.time)}</span>
                  </div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">{sMsg.text}</p>
                  <span className="text-[11px] text-amber-500 font-semibold inline-flex items-center gap-xs mt-xs group-hover:underline">
                    Jump to chat conversation →
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetConv = conversations.find(c => c.id === sMsg.convId);
                    if (targetConv) handleToggleStarMessage(sMsg);
                  }}
                  className="p-md text-amber-400 hover:text-red-500 rounded-xl hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                  title="Unstar message"
                >
                  <Star className="w-5 h-5 fill-amber-400" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4xl px-lg">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-lg ring-8 ring-amber-500/5">
                <Star className="w-8 h-8 fill-amber-400" />
              </div>
              <h4 className="text-lg font-heading font-bold text-neutral-900 dark:text-white mb-xs">
                No Starred Messages Yet
              </h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                You haven't starred any messages in any conversation yet. Star important messages inside any chat thread to quickly view them all here!
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Vanish Mode Settings Modal */}
      {activeConversation && (
        <Modal
          isOpen={isVanishModalOpen}
          onClose={() => setIsVanishModalOpen(false)}
          title="Vanish Mode Settings"
          size="lg"
        >
          <div className="space-y-xl py-xs">
            {/* Enable Toggle Switch */}
            <div className="p-lg rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeConversation.isVanishMode ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-500/15' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                }`}>
                  <Flame className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-xs">
                    Enable Vanish Mode
                    {activeConversation.isVanishMode && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    New messages disappear after being viewed by the recipient.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newIsVanish = !activeConversation.isVanishMode;
                  handleSaveVanishSettings(
                    newIsVanish,
                    activeConversation.vanishDuration || 3600,
                    activeConversation.vanishKeepPermission || 'always',
                    activeConversation.vanishScope || 'everyone'
                  );
                }}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${
                  activeConversation.isVanishMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/30' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                  activeConversation.isVanishMode ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  {activeConversation.isVanishMode && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                </div>
              </button>
            </div>

            {/* Vanish Timer Duration Presets */}
            <div className="space-y-md pt-sm border-t border-neutral-100 dark:border-neutral-800">
              <label className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-xs">
                <Clock className="w-4 h-4 text-amber-500" /> Choose Disappearing Timer
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-xs sm:gap-sm">
                {[
                  { label: '30 Sec', sec: 30 },
                  { label: '1 Min', sec: 60 },
                  { label: '5 Min', sec: 300 },
                  { label: '10 Min', sec: 600 },
                  { label: '30 Min', sec: 1800 },
                  { label: '1 Hour', sec: 3600 },
                  { label: '6 Hours', sec: 21600 },
                  { label: '12 Hours', sec: 43200 },
                  { label: '24 Hours', sec: 86400 },
                  { label: '3 Days', sec: 259200 },
                  { label: '7 Days', sec: 604800 },
                ].map(opt => {
                  const isSelected = (activeConversation.vanishDuration || 3600) === opt.sec;
                  return (
                    <button
                      key={opt.sec}
                      onClick={() => handleSaveVanishSettings(
                        true,
                        opt.sec,
                        activeConversation.vanishKeepPermission || 'always',
                        activeConversation.vanishScope || 'everyone'
                      )}
                      className={`py-2.5 px-1 sm:p-md rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-center relative ${
                        isSelected
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Keep Permissions */}
            <div className="space-y-md pt-sm border-t border-neutral-100 dark:border-neutral-800">
              <label className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-xs">
                <Shield className="w-4 h-4 text-indigo-500" /> Allow Recipient to Keep Messages
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {[
                  { id: 'always', label: 'Always Allow', desc: 'Recipient can keep any message' },
                  { id: 'never', label: 'Never Allow', desc: 'Prevent recipient from saving' },
                ].map(perm => {
                  const isSelected = (activeConversation.vanishKeepPermission || 'always') === perm.id;
                  return (
                    <button
                      key={perm.id}
                      onClick={() => handleSaveVanishSettings(
                        activeConversation.isVanishMode ?? true,
                        activeConversation.vanishDuration || 3600,
                        perm.id,
                        activeConversation.vanishScope || 'everyone'
                      )}
                      className={`p-md rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-500/40'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-indigo-500/50'
                      }`}
                    >
                      <span className="block text-xs font-bold flex items-center justify-between">
                        {perm.label}
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">{perm.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* My Side Only Settings Modal */}
      {activeConversation && (() => {
        const myConfig = activeConversation.mySideOnlyMap?.[myUid];
        const isEnabled = myConfig?.enabled === true;
        const currentDuration = myConfig?.duration || 300;

        return (
          <Modal
            isOpen={isMySideOnlyModalOpen}
            onClose={() => setIsMySideOnlyModalOpen(false)}
            title="Auto Clear Chat Settings"
            size="lg"
          >
            <div className="space-y-xl py-xs">
              {/* Vanish Mode Active Conflict Banner */}
              {activeConversation.isVanishMode && (
                <div className="p-lg rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-md shadow-sm">
                  <Flame className="w-5 h-5 flex-shrink-0 fill-amber-400 animate-pulse" />
                  <span className="font-semibold leading-relaxed">
                    Vanish Mode is currently active for both participants. Turn off Vanish Mode to enable Auto Clear Chat mode.
                  </span>
                </div>
              )}

              {/* Enable Toggle Switch Main Hero Card */}
              <div className={`p-lg sm:p-xl rounded-2xl transition-all duration-300 border ${
                isEnabled
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                  : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700/80'
              }`}>
                <div className="flex items-center justify-between gap-lg">
                  <div className="flex items-center gap-lg">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isEnabled
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}>
                      <EyeOff className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-sm">
                        Auto Clear Chat Mode
                        {isEnabled && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Active For You
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed max-w-md">
                        Messages automatically vanish ONLY from your screen. The recipient keeps them permanently as normal chat messages.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveMySideOnlySettings(!isEnabled, currentDuration)}
                    disabled={activeConversation.isVanishMode}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative flex-shrink-0 ${
                      isEnabled
                        ? 'bg-indigo-600 shadow-md shadow-indigo-500/30'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                    } ${activeConversation.isVanishMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      {isEnabled && <EyeOff className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Timer Duration Presets Grid */}
              <div className="space-y-md pt-md border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-xs">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Choose Auto-Delete Timer
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Selected: {formatVanishDurationLabel(currentDuration)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
                  {[
                    { label: '30 Seconds', sec: 30 },
                    { label: '1 Minute', sec: 60 },
                    { label: '5 Minutes', sec: 300 },
                    { label: '10 Minutes', sec: 600 },
                    { label: '30 Minutes', sec: 1800 },
                    { label: '1 Hour', sec: 3600 },
                  ].map(opt => {
                    const isSelected = currentDuration === opt.sec;
                    return (
                      <button
                        key={opt.sec}
                        onClick={() => handleSaveMySideOnlySettings(true, opt.sec)}
                        disabled={activeConversation.isVanishMode}
                        className={`py-3.5 px-md rounded-xl text-xs font-bold transition-all duration-200 border flex items-center justify-center gap-xs ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 scale-[1.02]'
                            : 'bg-white dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700/80 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-neutral-700/60'
                        } ${activeConversation.isVanishMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3] text-white" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clean Info Box */}
              <div className="p-lg rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/30 flex items-start gap-md">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex-shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-neutral-900 dark:text-white">Local Auto-Delete Feature</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    This feature deletes messages only from your own device history after the selected timer. The recipient's copy remains completely unchanged and visible forever unless they delete it themselves.
                  </p>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── CONFIRM CLEAR CHAT MODAL ── */}
      <Modal isOpen={!!confirmClearChatConv} onClose={() => setConfirmClearChatConv(null)} title="Clear Chat History?" size="sm">
        <div className="space-y-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to clear chat history for <span className="font-bold text-neutral-900 dark:text-white">"{confirmClearChatConv?.name}"</span>? Messages will be cleared for you.
          </p>
          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmClearChatConv(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-amber-500 hover:bg-amber-600 border-amber-500" onClick={() => handleClearChat(confirmClearChatConv, null, true)}>Clear Chat</Button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM DELETE CONVERSATION MODAL ── */}
      <Modal isOpen={!!confirmDeleteConv} onClose={() => setConfirmDeleteConv(null)} title="Delete Conversation?" size="sm">
        <div className="space-y-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete your conversation with <span className="font-bold text-neutral-900 dark:text-white">"{confirmDeleteConv?.name}"</span>? This chat will be hidden for you.
          </p>
          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeleteConv(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-rose-600 hover:bg-rose-700 border-rose-600 text-white" onClick={() => handleDeleteConversation(confirmDeleteConv, null, true)}>Delete Chat</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
