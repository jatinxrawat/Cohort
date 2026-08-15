import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, Search, Image, Paperclip, Send, Smile, Reply,
  ArrowDown, Plus, FileText, Download, CheckCircle2, AlertCircle, BarChart2,
  Shield, UserMinus, Settings, Link2, Trash2, Lock, Globe, X, ChevronLeft,
  Check, CheckCheck, Copy, Crown, MessageSquare, Hash, Pin, PinOff, UserPlus2, Star, Info,
  Edit3, Mic, MicOff, CheckSquare, Square, CornerUpLeft, MoreVertical, Eraser, Volume2,
  EyeOff, Eye, Bell, BellOff, Camera, User, Ban, GraduationCap
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { PostCard } from '@/components/PostCard';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import SEO from '@/components/SEO';
import { MentionTextArea } from '@/components/MentionTextArea';
import {
  collection, addDoc, doc, deleteDoc, updateDoc, query,
  orderBy, onSnapshot, getDoc, getDocs, arrayUnion, arrayRemove, where
} from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/utils/firebase';

const chatEmojis = ['👍', '❤️', '🔥', '🙌', '😂', '😮'];
const fakeSenderNames = ['fake_bot_user_never_matches'];

const CRAZY_EMOJI_PACKS = [
  {
    id: 'vibe',
    name: '🔥 Vibe',
    emojis: [
      '🔥', '✨', '💯', '⚡', '💀', '🗿', '🎯', '🚀', '👑', '💥', '🥳', '🎉', '💅', '🧠', '🤯',
      '🌟', '💫', '💎', '🏆', '🌶️', '🌊', '🦄', '🔮', '🕶️', '🦾', '🧿', '💸', '📈', '🚩', '🧿'
    ]
  },
  {
    id: 'memes',
    name: '😂 Memes',
    emojis: [
      '😂', '🤣', '💀', '🤡', '👁️👄👁️', '🙃', '🫠', '🫡', '😭', '🌚', '🌝', '🤓', '🤪', '😜',
      '😈', '👹', '💩', '👻', '🙈', '🤏', '🤫', '🤥', '🤢', '🤧', '🥸', '👺', '☠️', '🪦', '🤖', '🫥'
    ]
  },
  {
    id: 'campus',
    name: '😎 Campus',
    emojis: [
      '🎒', '📚', '💻', '☕', '🍕', '🎓', '📝', '🎧', '🛌', '⏰', '😴', '🍔', '🥤', '🍻', '🎸',
      '⚽', '🏀', '🎮', '🕹️', '📱', '💡', '📌', '🧪', '🧃', '🍿', '🍩', '🍟', '🍜', '🍱', '🎬'
    ]
  },
  {
    id: 'love',
    name: '❤️ Love',
    emojis: [
      '❤️', '💖', '🥺', '🥰', '😍', '🫶', '💔', '🖤', '💜', '💋', '🫂', '💌', '🌹', '💐', '⭐',
      '👍', '🙌', '👏', '🤝', '✌️', '🌸', '🧸', '💘', '💝', '💗', '💓', '💞', '💕', '❣️', '🤍'
    ]
  },
  {
    id: 'food',
    name: '🍕 Food',
    emojis: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🍳', '🧇', '🥞', '🧋', '🧃', '🍺', '🍻', '🥂', '🍾',
      '🍹', '🍩', '🍦', '🍧', '🎂', '🧁', '🍫', '🍬', '🍭', '🍒', '🥑', '🌶️', '🍉', '🍇', '🍓'
    ]
  }
];


const SwipeableMessageRow = ({ children, onReply, isMe }) => {
  const [dragOffset, setDragOffset] = useState(0);
  return (
    <div className="relative w-full flex items-center">
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
        onDrag={(e, info) => setDragOffset(info.offset.x)}
        onDragEnd={(e, info) => {
          setDragOffset(0);
          if (Math.abs(info.offset.x) > 35) onReply();
        }}
        className="w-full relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};

const formatShortCollegeName = (rawName) => {
  if (!rawName) return 'Campus';
  let short = rawName.trim();
  if (short.includes(' - ')) {
    short = short.split(' - ')[0].trim();
  } else if (short.includes(' (')) {
    short = short.split(' (')[0].trim();
  }
  return short;
};

export default function Community() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showWarning } = useNotification();

  const collegeName = user?.college || 'KIET';

  // ── Layout state
  const [selectedRoom, setSelectedRoom] = useState({ roomType: 'college' }); // default to college room
  const [searchQuery, setSearchQuery] = useState('');

  // Hide mobile navbar when inside active community chat
  useEffect(() => {
    if (selectedRoom) {
      document.body.classList.add('in-active-chat');
      document.documentElement.classList.add('in-active-chat');
    } else {
      document.body.classList.remove('in-active-chat');
      document.documentElement.classList.remove('in-active-chat');
    }
    return () => {
      document.body.classList.remove('in-active-chat');
      document.documentElement.classList.remove('in-active-chat');
    };
  }, [selectedRoom]);

  // ── College community data
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [collegeTab, setCollegeTab] = useState('Chat');

  const [feedPosts, setFeedPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');

  // Feed Image Upload States
  const [feedImageFile, setFeedImageFile] = useState(null);
  const [feedImagePreviewUrl, setFeedImagePreviewUrl] = useState(null);
  const [isUploadingFeedImage, setIsUploadingFeedImage] = useState(false);
  const feedImageInputRef = useRef(null);

  const handleFeedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeedImageFile(file);
      setFeedImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFeedImage = () => {
    setFeedImageFile(null);
    if (feedImagePreviewUrl) {
      URL.revokeObjectURL(feedImagePreviewUrl);
      setFeedImagePreviewUrl(null);
    }
    if (feedImageInputRef.current) {
      feedImageInputRef.current.value = '';
    }
  };

  // Polls States
  const [polls, setPolls] = useState([]);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollType, setPollType] = useState('single'); // 'single' | 'multiple'
  const [viewVotesPoll, setViewVotesPoll] = useState(null);
  const [expandedPollVotes, setExpandedPollVotes] = useState({});


  const [files, setFiles] = useState([]);
  const [activeFileCategory, setActiveFileCategory] = useState('All');
  const [isShareFileOpen, setIsShareFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('Notes');

  // ── My groups data
  const [myCommunities, setMyCommunities] = useState([]);
  const [communityMessages, setCommunityMessages] = useState([]);
  const [communityMsgText, setCommunityMsgText] = useState('');
  const [communityReplyingTo, setCommunityReplyingTo] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupType, setNewGroupType] = useState('public');
  const [newGroupVisibility, setNewGroupVisibility] = useState('public'); // 'public' | 'private'
  const [newGroupAudience, setNewGroupAudience] = useState('everyone'); // 'everyone' | 'college_only'
  const [newGroupJoinControl, setNewGroupJoinControl] = useState('direct'); // 'direct' | 'request'
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [manageTab, setManageTab] = useState('members');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupType, setEditGroupType] = useState('public');
  const [editGroupVisibility, setEditGroupVisibility] = useState('public');
  const [editGroupAudience, setEditGroupAudience] = useState('everyone');
  const [editGroupJoinControl, setEditGroupJoinControl] = useState('direct');
  const [newGroupAvatar, setNewGroupAvatar] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');

  const [editAdminPermissions, setEditAdminPermissions] = useState({
    canEditInfo: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canPromoteAdmins: false,
    canDeleteMessages: true
  });
  const [communityMembers, setCommunityMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [joinBanner, setJoinBanner] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // ── Invite People
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteUsers, setInviteUsers] = useState([]);
  const [loadingInviteUsers, setLoadingInviteUsers] = useState(false);
  const [sentInvites, setSentInvites] = useState({}); // { uid: true }

  const chatRef = useRef(null);
  const groupChatRef = useRef(null);
  const fileInputRef = useRef(null);
  const groupFileInputRef = useRef(null);
  const [attachedGroupFile, setAttachedGroupFile] = useState(null);

  // ── Rich Message Features State
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);

  // ── Header Menu & Options State
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isAutoClearModalOpen, setIsAutoClearModalOpen] = useState(false);
  const [autoClearDuration, setAutoClearDuration] = useState(0); // in seconds
  const [mutedCommunities, setMutedCommunities] = useState({});
  const [showConfirmClearChatModal, setShowConfirmClearChatModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [pinnedCommunityIds, setPinnedCommunityIds] = useState([]);
  const [sidebarMenuOpenId, setSidebarMenuOpenId] = useState(null);
  const [leaveCommunityModal, setLeaveCommunityModal] = useState(null);
  const [msgToDeleteModal, setMsgToDeleteModal] = useState(null);
  const [revealedDeletedMsgs, setRevealedDeletedMsgs] = useState([]);

  const handleToggleRevealDeleted = (msgId) => {
    setRevealedDeletedMsgs(prev =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };
  // ── Global Starred Messages Across Communities State
  const [allStarredCommunityMsgs, setAllStarredCommunityMsgs] = useState([]);
  const [isGlobalStarredModalOpen, setIsGlobalStarredModalOpen] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  // ── Attachment & Emoji Popover State
  const [showAttachMenuPop, setShowAttachMenuPop] = useState(false);
  const [showEmojiPickerPop, setShowEmojiPickerPop] = useState(false);
  const [activeEmojiPack, setActiveEmojiPack] = useState(0);

  // Intercept back button / history state when emoji tray or attachment popover is open
  useEffect(() => {
    if (showEmojiPickerPop || showAttachMenuPop) {
      window.history.pushState({ trayOpen: true }, '');
      const handlePopState = () => {
        setShowEmojiPickerPop(false);
        setShowAttachMenuPop(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [showEmojiPickerPop, showAttachMenuPop]);


  // Recents Emoji Storage
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const saved = localStorage.getItem('cohort_recent_emojis');
      return saved ? JSON.parse(saved) : ['🔥', '😂', '💀', '✨', '❤️', '💯', '🗿', '🫡', '😭', '🥳', '🚀', '🎒', '😍', '☕'];
    } catch (e) {
      return ['🔥', '😂', '💀', '✨', '❤️', '💯', '🗿', '🫡', '😭', '🥳'];
    }
  });

  const handleAddRecentEmoji = (emoji) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      const updated = [emoji, ...filtered].slice(0, 25);
      try { localStorage.setItem('cohort_recent_emojis', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const allPacks = [
    { id: 'recents', name: '🕒 Recents', emojis: recentEmojis },
    ...CRAZY_EMOJI_PACKS
  ];


  const cameraInputRef = useRef(null);
  const createAvatarFileRef = useRef(null);
  const editAvatarFileRef = useRef(null);
  const drawerHeaderAvatarFileRef = useRef(null);

  const handleAvatarFileSelect = (e, setAvatarFn) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarFn(reader.result);
        showSuccess('Photo selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const isGroupRoom = selectedRoom?.roomType === 'group';
  const isCollegeRoom = selectedRoom?.roomType === 'college';
  const isAdmin = isGroupRoom ? (selectedRoom?.admins || []).includes(user?.uid) : false;
  const isCreator = isGroupRoom && selectedRoom?.creatorUid === user?.uid;

  // ── Load college community
  useEffect(() => {
    const currentCollege = (user?.college || 'KIET').trim();

    const unsubMsgs = onSnapshot(collection(db, 'community-messages'), (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const msgCollege = data.college || data.sender?.role || data.sender?.college;
        const isMatch = !msgCollege || String(msgCollege).toLowerCase().trim() === currentCollege.toLowerCase().trim() || (currentCollege === 'KIET' && (!msgCollege || msgCollege === 'Student'));

        if (isMatch) {
          const senderName = (data.sender?.name || '').toLowerCase();
          const isFake = fakeSenderNames.some(f => senderName.includes(f));
          if (isFake) deleteDoc(doc(db, 'community-messages', d.id)).catch(() => {});
          else loaded.push({ id: d.id, docId: d.id, ...data, timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()) });
        }
      });
      loaded.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loaded);
      setLoading(false);
    }, () => setLoading(false));

    const unsubFeed = onSnapshot(collection(db, 'community-feed'), (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const postCollege = data.college || data.author?.role || data.author?.college;
        const isMatch = !postCollege || String(postCollege).toLowerCase().trim() === currentCollege.toLowerCase().trim() || (currentCollege === 'KIET' && (!postCollege || postCollege === 'Student'));

        if (isMatch) {
          const name = (data.author?.name || '').toLowerCase();
          const isFake = fakeSenderNames.some(f => name.includes(f));
          if (isFake) deleteDoc(doc(db, 'community-feed', d.id)).catch(() => {});
          else loaded.push({ id: d.id, docId: d.id, ...data, timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()) });
        }
      });
      loaded.sort((a, b) => b.timestamp - a.timestamp);
      setFeedPosts(loaded);
    });

    const unsubPolls = onSnapshot(collection(db, 'community-polls'), (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const pollCollege = data.college;
        const isMatch = !pollCollege || String(pollCollege).toLowerCase().trim() === currentCollege.toLowerCase().trim() || currentCollege === 'KIET';
        if (isMatch) loaded.push({ id: d.id, docId: d.id, ...data });
      });
      setPolls(loaded);
    });

    const unsubFiles = onSnapshot(collection(db, 'community-files'), (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const fileCollege = data.college;
        const isMatch = !fileCollege || String(fileCollege).toLowerCase().trim() === currentCollege.toLowerCase().trim() || currentCollege === 'KIET';
        if (isMatch) loaded.push({ id: d.id, docId: d.id, ...data });
      });
      setFiles(loaded);
    });

    return () => { unsubMsgs(); unsubFeed(); unsubPolls(); unsubFiles(); };
  }, [user?.college]);

  // ── Load my communities
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'userCommunities'), where('members', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const comms = [];
      snap.forEach(d => comms.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date() }));
      comms.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      setMyCommunities(comms);
    });
    return () => unsub();
  }, [user?.uid]);

  // ── Load all public & discoverable communities
  const [discoverCommunities, setDiscoverCommunities] = useState([]);
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'userCommunities'));
    const unsub = onSnapshot(q, (snap) => {
      const comms = [];
      snap.forEach(d => comms.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date() }));
      setDiscoverCommunities(comms);
    });
    return () => unsub();
  }, [user?.uid]);

  const isUserMember = (room) => Array.isArray(room?.members) && room.members.includes(user?.uid);
  const isUserAdmin = (room) => room?.creatorUid === user?.uid || (Array.isArray(room?.admins) && room.admins.includes(user?.uid));
  const isPendingRequest = (room) => Array.isArray(room?.joinRequests) && room.joinRequests.some(req => (typeof req === 'string' ? req === user?.uid : req?.uid === user?.uid));

  const handleDirectJoin = async (community) => {
    if (!community?.id || !user?.uid) return;
    try {
      await updateDoc(doc(db, 'userCommunities', community.id), {
        members: arrayUnion(user.uid)
      });
      const updatedGroup = { roomType: 'group', ...community, members: [...(community.members || []), user.uid] };
      setSelectedRoom(updatedGroup);
      setMyCommunities(prev => [...prev.filter(c => c.id !== community.id), updatedGroup]);
      showSuccess(`Joined "${community.name}"!`);
    } catch (e) {
      console.error(e);
      showWarning('Failed to join community.');
    }
  };


  // ── Real-time Fetch All Starred Community Messages Across Rooms ──
  useEffect(() => {
    if (!user?.uid) return;

    let unsubs = [];
    let starredByRoom = {};

    const updateAllStarred = () => {
      let combined = [];
      Object.values(starredByRoom).forEach(list => {
        combined.push(...list);
      });
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setAllStarredCommunityMsgs(combined);
    };

    // 1. College Community Starred Listener
    const qCollegeStarred = query(collection(db, 'community-messages'), where('starredBy', 'array-contains', user.uid));
    const unsubCollege = onSnapshot(qCollegeStarred, (snap) => {
      const collegeStarredList = [];
      snap.forEach(d => {
        const data = d.data();
        collegeStarredList.push({
          id: d.id,
          ...data,
          roomId: 'college',
          roomType: 'college',
          roomName: `${user?.college || 'KiET'} Community`,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
        });
      });
      starredByRoom['college'] = collegeStarredList;
      updateAllStarred();
    }, (err) => console.error('Error college starred:', err));
    unsubs.push(unsubCollege);

    // 2. Custom Group Communities Starred Listeners
    myCommunities.forEach(comm => {
      try {
        const qGroupStarred = query(collection(db, 'userCommunities', comm.id, 'messages'), where('starredBy', 'array-contains', user.uid));
        const unsubGroup = onSnapshot(qGroupStarred, (snap) => {
          const groupStarredList = [];
          snap.forEach(gd => {
            const gData = gd.data();
            groupStarredList.push({
              id: gd.id,
              ...gData,
              roomId: comm.id,
              roomType: 'group',
              roomName: comm.name,
              roomAvatar: comm.avatar,
              roomData: comm,
              timestamp: gData.timestamp?.toDate ? gData.timestamp.toDate() : new Date(gData.timestamp || Date.now())
            });
          });
          starredByRoom[comm.id] = groupStarredList;
          updateAllStarred();
        }, (err) => console.error(`Error group ${comm.id} starred:`, err));
        unsubs.push(unsubGroup);
      } catch (e) {
        console.error(e);
      }
    });

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [user?.uid, myCommunities]);

  const handleJumpToStarredMessage = (sMsg) => {
    setIsGlobalStarredModalOpen(false);

    if (sMsg.roomType === 'college') {
      setSelectedRoom({ roomType: 'college' });
    } else if (sMsg.roomData) {
      setSelectedRoom({ roomType: 'group', id: sMsg.roomId, ...sMsg.roomData });
    }

    setHighlightedMsgId(sMsg.id);

    setTimeout(() => {
      const el = document.getElementById(`msg-${sMsg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);

    setTimeout(() => {
      setHighlightedMsgId(null);
    }, 3500);
  };

  // ── Check invite link / query params
  useEffect(() => {
    const joinId = searchParams.get('join');
    if (!joinId) {
      setSelectedRoom(null);
      return;
    }
    if (joinId === 'college') {
      setSelectedRoom({ roomType: 'college' });
      return;
    }
    if (!user?.uid) return;
    const check = async () => {
      const snap = await getDoc(doc(db, 'userCommunities', joinId));
      if (!snap.exists()) return;
      const data = snap.data();
      if ((data.members || []).includes(user.uid)) {
        setSelectedRoom({ roomType: 'group', id: joinId, ...data });
        return;
      }
      setJoinBanner({ id: joinId, name: data.name, memberCount: (data.members || []).length, type: data.type });
    };
    check();
  }, [searchParams, user?.uid]);

  // ── Open Starred Modal if requested via URL query param
  useEffect(() => {
    if (searchParams.get('openStarred') === 'true') {
      setIsGlobalStarredModalOpen(true);
    }
  }, [searchParams]);

  // ── Real-time group messages
  useEffect(() => {
    if (!isGroupRoom || !selectedRoom?.id) return;
    const q = query(collection(db, 'userCommunities', selectedRoom.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate ? d.data().timestamp.toDate() : new Date() }));
      setCommunityMessages(msgs);
    });
    return () => unsub();
  }, [selectedRoom?.id, isGroupRoom]);

  // Auto scroll
  useEffect(() => {
    if (isCollegeRoom && chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isCollegeRoom]);
  useEffect(() => {
    if (isGroupRoom && groupChatRef.current) groupChatRef.current.scrollTop = groupChatRef.current.scrollHeight;
  }, [communityMessages, isGroupRoom]);

  const loadInviteUsers = async () => {
    if (!user?.uid) return;
    setLoadingInviteUsers(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const loaded = [];
      usersSnap.forEach(d => {
        if (d.id !== user.uid) {
          const data = d.data();
          const isFollower = (data.followers || []).includes(user.uid);
          const isFollowing = (data.following || []).includes(user.uid);
          const alreadyMember = (selectedRoom?.members || []).includes(d.id);
          if (!alreadyMember) {
            loaded.push({ uid: d.id, ...data, isFollower, isFollowing });
          }
        }
      });
      // Sort: connections first
      loaded.sort((a, b) => {
        const aScore = (a.isFollower ? 1 : 0) + (a.isFollowing ? 1 : 0);
        const bScore = (b.isFollower ? 1 : 0) + (b.isFollowing ? 1 : 0);
        return bScore - aScore;
      });
      setInviteUsers(loaded);
    } catch (e) { console.error(e); }
    finally { setLoadingInviteUsers(false); }
  };

  const handleOpenInviteModal = () => {
    setInviteSearch('');
    setSentInvites({});
    setShowInviteModal(true);
    loadInviteUsers();
  };

  const handleSendDirectInvite = async (targetUser) => {
    if (!selectedRoom?.id || !user?.uid) return;
    try {
      const inviteNotif = {
        type: 'community_invite',
        recipientUid: targetUser.uid,
        senderUid: user.uid,
        senderName: user.name || user.email?.split('@')[0] || 'Someone',
        senderAvatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'u')}`,
        text: `invited you to join`,
        communityId: selectedRoom.id,
        communityName: selectedRoom.name,
        status: 'pending',
        read: false,
        time: new Date()
      };
      await addDoc(collection(db, 'notifications'), inviteNotif);
      setSentInvites(prev => ({ ...prev, [targetUser.uid]: true }));
      showSuccess(`Invite sent to ${targetUser.name || 'user'}!`);
    } catch (e) { console.error(e); showWarning('Failed to send invite.'); }
  };

  const loadCommunityMembers = async (community) => {
    if (!community) return;
    setLoadingMembers(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const userMap = {};
      usersSnap.forEach(d => { userMap[d.id] = { uid: d.id, ...d.data() }; });
      setCommunityMembers((community.members || []).map(uid => userMap[uid] || { uid, name: 'Unknown Member', avatar: null }));
    } catch (e) { console.error(e); }
    finally { setLoadingMembers(false); }
  };

  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMsgPreview = (msgs) => {
    if (!msgs || msgs.length === 0) return 'No messages yet';
    const last = msgs[msgs.length - 1];
    return last?.content?.slice(0, 40) || '...';
  };

  // ── College send message
  const handleSendMessage = async () => {
    if (!messageText.trim() && !attachedFile) return;
    const senderName = user?.name || user?.email?.split('@')[0] || 'Student';
    const messageData = {
      college: collegeName,
      sender: { name: senderName, avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || senderName)}`, role: user?.college || 'Student', college: collegeName, uid: user?.uid || null },
      content: messageText.trim() + (attachedFile ? ` \n📎 Attached: ${attachedFile.name}` : ''),
      timestamp: new Date(), reactions: [],
      replyTo: replyingTo ? { name: replyingTo.sender.name, text: replyingTo.content } : null
    };
    try {
      setMessageText(''); setReplyingTo(null); setAttachedFile(null);
      await addDoc(collection(db, 'community-messages'), messageData);
    } catch (e) { console.error(e); }
  };

  const handleReact = async (msgId, emoji) => {
    let targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;
    const myId = user?.uid || 'user';
    const existing = targetMsg.reactions.find(r => r.emoji === emoji);
    let updatedReactions = [...targetMsg.reactions];
    if (existing) {
      if (existing.users.includes(myId)) {
        const nextUsers = existing.users.filter(u => u !== myId);
        if (nextUsers.length === 0) updatedReactions = updatedReactions.filter(r => r.emoji !== emoji);
        else updatedReactions = updatedReactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, users: nextUsers } : r);
      } else updatedReactions = updatedReactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, myId] } : r);
    } else updatedReactions.push({ emoji, count: 1, users: [myId] });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: updatedReactions } : m));
    setShowEmojiPicker(null);
    if (targetMsg.docId) { try { await updateDoc(doc(db, 'community-messages', targetMsg.docId), { reactions: updatedReactions }); } catch (e) { console.error(e); } }
  };

  const handleTriggerFilePicker = () => fileInputRef.current?.click();
  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setAttachedFile(file); showSuccess(`File attached: ${file.name}`); } };

  const handleCreateFeedPost = async () => {
    if (!newPostText.trim() && !feedImageFile) return;

    setIsUploadingFeedImage(true);
    let uploadedImageUrl = null;

    try {
      if (feedImageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(feedImageFile);
      }

      const senderName = user?.name || user?.email?.split('@')[0] || 'Student';
      const postData = {
        college: collegeName,
        author: {
          name: senderName,
          avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || senderName)}`,
          role: user?.college || 'Student',
          college: collegeName
        },
        content: newPostText.trim(),
        imageUrl: uploadedImageUrl,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        saved: false
      };

      const docRef = await addDoc(collection(db, 'community-feed'), postData);
      const newPost = { id: docRef.id, docId: docRef.id, ...postData };
      setFeedPosts([newPost, ...feedPosts]);
      setNewPostText('');
      handleRemoveFeedImage();
      showSuccess('Announcement shared in community feed!');
    } catch (e) {
      console.error('Failed to post announcement to Firestore:', e);
      showWarning('Failed to upload image or share announcement.');
    } finally {
      setIsUploadingFeedImage(false);
    }
  };

  const handleLikePost = async (postId) => {
    let nextLiked = false, nextLikes = 0;
    const updated = feedPosts.map(p => { if (p.id === postId) { nextLiked = !p.liked; nextLikes = p.liked ? Math.max(0, p.likes - 1) : p.likes + 1; return { ...p, liked: nextLiked, likes: nextLikes }; } return p; });
    setFeedPosts(updated);
    const tp = feedPosts.find(p => p.id === postId);
    if (tp?.docId) { try { await updateDoc(doc(db, 'community-feed', tp.docId), { liked: nextLiked, likes: nextLikes }); } catch (e) { console.error(e); } }
  };

  const handleSavePost = async (postId) => {
    let nextSaved = false;
    const updated = feedPosts.map(p => { if (p.id === postId) { nextSaved = !p.saved; return { ...p, saved: nextSaved }; } return p; });
    setFeedPosts(updated);
    const tp = feedPosts.find(p => p.id === postId);
    if (tp?.docId) { try { await updateDoc(doc(db, 'community-feed', tp.docId), { saved: nextSaved }); } catch (e) { console.error(e); } }
    showSuccess('Bookmarked!');
  };

  const handleVote = async (pollId, optIndex) => {
    const targetPoll = polls.find(p => p.id === pollId || p.docId === pollId);
    if (!targetPoll) return;

    const isMultiple = targetPoll.pollType === 'multiple';
    const myUid = user?.uid || 'guest_user';
    const myName = user?.name || user?.email?.split('@')[0] || 'Student';
    const myAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || myName)}`;
    const myUserObj = { uid: myUid, name: myName, avatar: myAvatar };

    const updatedOptions = (targetPoll.options || []).map((o, idx) => {
      const currentVotedUsers = Array.isArray(o.votedUsers) ? o.votedUsers : [];
      const currentDetails = Array.isArray(o.votedUserDetails) ? o.votedUserDetails : [];
      const hasVoted = currentVotedUsers.includes(myUid);

      if (idx === optIndex) {
        if (hasVoted) {
          const nextVoted = currentVotedUsers.filter(id => id !== myUid);
          const nextDetails = currentDetails.filter(u => u.uid !== myUid);
          return { ...o, votedUsers: nextVoted, votedUserDetails: nextDetails, votes: nextVoted.length, selected: false };
        } else {
          const nextVoted = [...currentVotedUsers, myUid];
          const nextDetails = [...currentDetails.filter(u => u.uid !== myUid), myUserObj];
          return { ...o, votedUsers: nextVoted, votedUserDetails: nextDetails, votes: nextVoted.length, selected: true };
        }
      } else if (!isMultiple) {
        const nextVoted = currentVotedUsers.filter(id => id !== myUid);
        const nextDetails = currentDetails.filter(u => u.uid !== myUid);
        return { ...o, votedUsers: nextVoted, votedUserDetails: nextDetails, votes: nextVoted.length, selected: false };
      }
      return { ...o, votedUsers: currentVotedUsers, votedUserDetails: currentDetails, votes: currentVotedUsers.length, selected: currentVotedUsers.includes(myUid) };
    });

    const newTotalVotes = updatedOptions.reduce((sum, o) => sum + (o.votedUsers?.length || 0), 0);
    setPolls(prev => prev.map(p => (p.id === pollId || p.docId === pollId) ? { ...p, options: updatedOptions, totalVotes: newTotalVotes } : p));
    showSuccess('Vote recorded!');

    const targetDocId = targetPoll.docId || targetPoll.id;
    if (targetDocId) {
      try {
        await updateDoc(doc(db, 'community-polls', targetDocId), {
          options: updatedOptions,
          totalVotes: newTotalVotes
        });
      } catch (e) {
        console.error('Failed to update community poll vote in Firestore:', e);
      }
    }
  };

  const handleGroupPollVote = async (msgId, optIndex) => {
    if (!selectedRoom?.id) return;
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg || !targetMsg.poll) return;

    const targetPoll = targetMsg.poll;
    const isMultiple = targetPoll.pollType === 'multiple';
    const myUid = user?.uid || 'guest_user';

    const updatedOptions = (targetPoll.options || []).map((o, idx) => {
      const currentVotedUsers = Array.isArray(o.votedUsers)
        ? o.votedUsers
        : (o.selected ? [myUid] : []);
      const hasVoted = currentVotedUsers.includes(myUid);

      if (idx === optIndex) {
        if (hasVoted) {
          const nextVoted = currentVotedUsers.filter(id => id !== myUid);
          return { ...o, votedUsers: nextVoted, votes: nextVoted.length, selected: false };
        } else {
          const nextVoted = [...currentVotedUsers, myUid];
          return { ...o, votedUsers: nextVoted, votes: nextVoted.length, selected: true };
        }
      } else if (!isMultiple) {
        const nextVoted = currentVotedUsers.filter(id => id !== myUid);
        return { ...o, votedUsers: nextVoted, votes: nextVoted.length, selected: false };
      }
      return { ...o, votedUsers: currentVotedUsers, votes: currentVotedUsers.length, selected: currentVotedUsers.includes(myUid) };
    });

    const newTotalVotes = updatedOptions.reduce((sum, o) => sum + (o.votedUsers?.length || 0), 0);
    const updatedPoll = { ...targetPoll, options: updatedOptions, totalVotes: newTotalVotes };
    const updatedMsg = { ...targetMsg, poll: updatedPoll };

    setMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));
    showSuccess('Vote recorded!');

    if (targetMsg.docId) {
      try {
        await updateDoc(doc(db, 'userCommunities', selectedRoom.id, 'messages', targetMsg.docId), {
          poll: updatedPoll
        });
      } catch (e) {
        console.error('Failed to update group poll vote:', e);
      }
    }
  };

  const handleCollegePollVote = async (msgId, optIndex) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg || !targetMsg.poll) return;

    const targetPoll = targetMsg.poll;
    const isMultiple = targetPoll.pollType === 'multiple';
    const myUid = user?.uid || 'guest_user';

    const updatedOptions = (targetPoll.options || []).map((o, idx) => {
      const currentVotedUsers = Array.isArray(o.votedUsers)
        ? o.votedUsers
        : (o.selected ? [myUid] : []);
      const hasVoted = currentVotedUsers.includes(myUid);

      if (idx === optIndex) {
        if (hasVoted) {
          const nextVoted = currentVotedUsers.filter(id => id !== myUid);
          return { ...o, votedUsers: nextVoted, votes: nextVoted.length, selected: false };
        } else {
          const nextVoted = [...currentVotedUsers, myUid];
          return { ...o, votedUsers: nextVoted, votes: nextVoted.length, selected: true };
        }
      } else if (!isMultiple) {
        const nextVoted = currentVotedUsers.filter(id => id !== myUid);
        return { ...o, votedUsers: nextVoted, votes: nextVoted.length, selected: false };
      }
      return { ...o, votedUsers: currentVotedUsers, votes: currentVotedUsers.length, selected: currentVotedUsers.includes(myUid) };
    });

    const newTotalVotes = updatedOptions.reduce((sum, o) => sum + (o.votedUsers?.length || 0), 0);
    const updatedPoll = { ...targetPoll, options: updatedOptions, totalVotes: newTotalVotes };
    const updatedMsg = { ...targetMsg, poll: updatedPoll };

    setMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));
    showSuccess('Vote recorded!');

    const targetDocId = targetMsg.docId || targetMsg.id;
    if (targetDocId) {
      try {
        await updateDoc(doc(db, 'community-messages', targetDocId), {
          poll: updatedPoll
        });
      } catch (e) {
        console.error('Failed to update college poll vote:', e);
      }
    }
  };

  const handleCreatePoll = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!pollQuestion.trim()) {
      showWarning('Please enter a poll question.');
      return;
    }
    const validOptions = pollOptions.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      showWarning('At least 2 options are required.');
      return;
    }
    const newPollData = {
      college: collegeName,
      question: pollQuestion.trim(),
      pollType: pollType,
      totalVotes: 0,
      options: validOptions.map((optText, i) => ({ id: `opt_${i}`, text: optText.trim(), votes: 0, votedUsers: [] })),
      createdBy: user?.name || 'Student',
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'community-polls'), newPollData);
      const createdPollObj = { id: docRef.id, docId: docRef.id, ...newPollData };
      setPolls(prev => [createdPollObj, ...prev]);

      const senderName = user?.name || user?.email?.split('@')[0] || 'Student';
      const msgData = {
        college: collegeName,
        sender: {
          uid: user?.uid || null,
          name: senderName,
          avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || senderName)}`,
          role: user?.college || 'Student',
          college: collegeName
        },
        content: `Poll: ${pollQuestion.trim()}`,
        poll: createdPollObj,
        type: 'poll',
        timestamp: new Date(),
        reactions: []
      };

      if (selectedRoom?.id) {
        await addDoc(collection(db, 'userCommunities', selectedRoom.id, 'messages'), msgData);
        await updateDoc(doc(db, 'userCommunities', selectedRoom.id), { lastActivity: new Date() });
      } else {
        await addDoc(collection(db, 'community-messages'), msgData);
      }

      setIsCreatePollOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollType('single');
      showSuccess('Poll created!');
    } catch (e) {
      console.error('Error creating community poll:', e);
      showWarning('Failed to publish poll. Please try again.');
    }
  };


  const handleShareFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const fileData = { college: collegeName, name: newFileName.trim(), category: newFileCategory, uploadedBy: user?.name || 'Student', date: new Date().toISOString().split('T')[0], size: '1.2 MB' };
    try { const docRef = await addDoc(collection(db, 'community-files'), fileData); setFiles(prev => [{ id: docRef.id, docId: docRef.id, ...fileData }, ...prev]); setIsShareFileOpen(false); setNewFileName(''); showSuccess('Resource shared!'); } catch (e) { console.error(e); }
  };

  const fileCategories = ['All', 'Notes', 'PYQs', 'PDFs', 'Timetable', 'Assignments', 'Presentations'];
  const filteredFiles = files.filter(f => { const ms = f.name.toLowerCase().includes(searchQuery.toLowerCase()); const mc = activeFileCategory === 'All' || f.category === activeFileCategory; return ms && mc; });
  const handleDownloadFile = (fileName) => showSuccess(`Downloading "${fileName}"...`);

  const currentAdminPerms = selectedRoom?.adminPermissions || {
    canEditInfo: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canPromoteAdmins: false,
    canDeleteMessages: true
  };

  const canEditInfo = isCreator || (isAdmin && currentAdminPerms.canEditInfo !== false);
  const canInviteMembers = selectedRoom?.type !== 'private' || isCreator || (isAdmin && currentAdminPerms.canInviteMembers !== false);
  const canRemoveMembers = isCreator || (isAdmin && currentAdminPerms.canRemoveMembers !== false);
  const canPromoteAdmins = isCreator || (isAdmin && currentAdminPerms.canPromoteAdmins === true);
  const canDeleteMessages = isCreator || (isAdmin && currentAdminPerms.canDeleteMessages !== false);

  // ── Group handlers
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        visibility: newGroupVisibility,
        type: newGroupVisibility,
        audience: newGroupAudience,
        college: user?.college || collegeName,
        joinControl: newGroupJoinControl,
        avatar: newGroupAvatar.trim() || null,
        creatorUid: user.uid,
        admins: [user.uid],
        members: [user.uid],
        joinRequests: [],
        adminPermissions: {
          canEditInfo: true,
          canInviteMembers: true,
          canRemoveMembers: true,
          canPromoteAdmins: false,
          canDeleteMessages: true
        },
        createdAt: new Date(),
        lastActivity: new Date()
      };
      const docRef = await addDoc(collection(db, 'userCommunities'), groupData);
      const newGroup = { roomType: 'group', id: docRef.id, ...groupData };
      setSelectedRoom(newGroup);
      setShowCreateModal(false);
      setNewGroupName(''); setNewGroupDesc(''); setNewGroupType('public'); setNewGroupAvatar('');
      setNewGroupVisibility('public'); setNewGroupAudience('everyone'); setNewGroupJoinControl('direct');
      showSuccess(`"${groupData.name}" created!`);
    } catch (e) { console.error(e); showWarning('Failed to create.'); }
    finally { setIsCreatingGroup(false); }
  };

  const handleOpenManage = () => {
    if (!selectedRoom) return;
    setEditGroupName(selectedRoom.name);
    setEditGroupDesc(selectedRoom.description || '');
    setEditGroupType(selectedRoom.visibility || selectedRoom.type || 'public');
    setEditGroupVisibility(selectedRoom.visibility || selectedRoom.type || 'public');
    setEditGroupAudience(selectedRoom.audience || 'everyone');
    setEditGroupJoinControl(selectedRoom.joinControl || 'direct');
    setEditGroupAvatar(selectedRoom.avatar || '');
    setEditAdminPermissions(selectedRoom.adminPermissions || {
      canEditInfo: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canPromoteAdmins: false,
      canDeleteMessages: true
    });
    setManageTab('members');
    loadCommunityMembers(selectedRoom);
    setShowManageDrawer(true);
  };

  const handleSaveGroupSettings = async () => {
    if (!selectedRoom?.id || !editGroupName.trim()) return;
    try {
      const updatePayload = {
        name: editGroupName.trim(),
        description: editGroupDesc.trim(),
        visibility: editGroupVisibility,
        type: editGroupVisibility,
        audience: editGroupAudience,
        joinControl: editGroupJoinControl,
        avatar: editGroupAvatar.trim() || null,
        adminPermissions: editAdminPermissions
      };
      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), updatePayload);
      setSelectedRoom(prev => ({ ...prev, ...updatePayload }));
      setMyCommunities(prev => prev.map(c => c.id === selectedRoom.id ? { ...c, ...updatePayload } : c));
      showSuccess('Community settings updated!'); setManageTab('members');
    } catch (e) { console.error(e); }
  };

  const handleRequestToJoin = async (community) => {
    if (!community?.id || !user?.uid) return;
    try {
      const requestObj = {
        uid: user.uid,
        name: user.name || user.email?.split('@')[0] || 'Student',
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}`,
        email: user.email || '',
        college: user.college || collegeName,
        requestedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'userCommunities', community.id), {
        joinRequests: arrayUnion(requestObj)
      });
      setMyCommunities(prev => prev.map(c => c.id === community.id ? {
        ...c,
        joinRequests: [...(c.joinRequests || []), requestObj]
      } : c));
      showSuccess('Join request sent to community admins!');
    } catch (e) {
      console.error(e);
      showWarning('Failed to send join request.');
    }
  };

  const handleAcceptRequest = async (requestObj) => {
    if (!selectedRoom?.id || !requestObj?.uid) return;
    try {
      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), {
        members: arrayUnion(requestObj.uid),
        joinRequests: arrayRemove(requestObj)
      });
      setSelectedRoom(prev => ({
        ...prev,
        members: [...(prev.members || []), requestObj.uid],
        joinRequests: (prev.joinRequests || []).filter(r => (typeof r === 'string' ? r !== requestObj.uid : r.uid !== requestObj.uid))
      }));
      showSuccess(`Accepted request! Member added.`);
    } catch (e) {
      console.error(e);
      showWarning('Failed to accept request.');
    }
  };

  const handleRejectRequest = async (requestObj) => {
    if (!selectedRoom?.id || !requestObj?.uid) return;
    try {
      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), {
        joinRequests: arrayRemove(requestObj)
      });
      setSelectedRoom(prev => ({
        ...prev,
        joinRequests: (prev.joinRequests || []).filter(r => (typeof r === 'string' ? r !== requestObj.uid : r.uid !== requestObj.uid))
      }));
      showSuccess('Join request rejected.');
    } catch (e) {
      console.error(e);
    }
  };


  const handlePromoteAdmin = async (uid) => {
    if (!selectedRoom?.id) return;
    try { await updateDoc(doc(db, 'userCommunities', selectedRoom.id), { admins: arrayUnion(uid) }); setSelectedRoom(prev => ({ ...prev, admins: [...(prev.admins || []), uid] })); showSuccess('Promoted to Admin!'); } catch (e) { console.error(e); }
  };

  const handleDemoteAdmin = async (uid) => {
    if (!selectedRoom?.id) return;
    if (uid === selectedRoom.creatorUid) { showWarning("Can't demote the creator."); return; }
    try { await updateDoc(doc(db, 'userCommunities', selectedRoom.id), { admins: arrayRemove(uid) }); setSelectedRoom(prev => ({ ...prev, admins: (prev.admins || []).filter(a => a !== uid) })); showSuccess('Admin role removed.'); } catch (e) { console.error(e); }
  };

  const handleTogglePinCommunity = (communityId) => {
    setPinnedCommunityIds(prev => {
      const isPinned = prev.includes(communityId);
      if (isPinned) {
        showSuccess('Community unpinned');
        return prev.filter(id => id !== communityId);
      } else {
        showSuccess('Community pinned to top 📌');
        return [...prev, communityId];
      }
    });
  };

  const handleLeaveCommunity = async () => {
    if (!leaveCommunityModal?.id || !user?.uid) return;
    try {
      await updateDoc(doc(db, 'userCommunities', leaveCommunityModal.id), {
        members: arrayRemove(user.uid),
        admins: arrayRemove(user.uid)
      });
      setMyCommunities(prev => prev.filter(c => c.id !== leaveCommunityModal.id));
      if (selectedRoom?.id === leaveCommunityModal.id) setSelectedRoom(null);
      setLeaveCommunityModal(null);
      showSuccess(`Left "${leaveCommunityModal.name}"`);
    } catch (e) { console.error(e); }
  };

  const handleRemoveMember = async (uid) => {
    if (!selectedRoom?.id) return;
    if (uid === selectedRoom.creatorUid) { showWarning("Can't remove the creator."); return; }
    try {
      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), { members: arrayRemove(uid), admins: arrayRemove(uid) });
      setSelectedRoom(prev => ({ ...prev, members: (prev.members || []).filter(m => m !== uid), admins: (prev.admins || []).filter(a => a !== uid) }));
      setCommunityMembers(prev => prev.filter(m => m.uid !== uid));
      showSuccess('Member removed.');
      setMemberToRemove(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteGroup = async () => {
    if (!selectedRoom?.id) return;
    try { await deleteDoc(doc(db, 'userCommunities', selectedRoom.id)); setSelectedRoom(null); setShowManageDrawer(false); setShowDeleteConfirm(false); showSuccess('Community deleted.'); } catch (e) { console.error(e); }
  };

  const handleCopyInviteLink = () => {
    if (!selectedRoom?.id) return;
    const url = `https://cohortnow.online/community?join=${selectedRoom.id}`;
    navigator.clipboard.writeText(url).then(() => showSuccess('Invite link copied!'));
  };

  const handleJoinCommunity = async () => {
    if (!joinBanner?.id || !user?.uid) return;
    setIsJoining(true);
    try {
      await updateDoc(doc(db, 'userCommunities', joinBanner.id), { members: arrayUnion(user.uid) });
      showSuccess(`Joined "${joinBanner.name}"!`);
      setJoinBanner(null);
    } catch (e) { console.error(e); showWarning('Failed to join.'); }
    finally { setIsJoining(false); }
  };

  const handleSendGroupMessage = async () => {
    if ((!communityMsgText.trim() && !attachedGroupFile) || !selectedRoom?.id) return;
    const senderName = user?.name || user?.email?.split('@')[0] || 'Student';
    const msgData = {
      sender: { name: senderName, avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName)}`, uid: user?.uid },
      content: communityMsgText.trim() + (attachedGroupFile ? ` \n📎 Attached: ${attachedGroupFile.name}` : ''),
      fileUrl: attachedGroupFile ? URL.createObjectURL(attachedGroupFile) : null,
      fileName: attachedGroupFile ? attachedGroupFile.name : null,
      timestamp: new Date(),
      starredBy: [],
      replyTo: communityReplyingTo ? { name: communityReplyingTo.sender.name, text: communityReplyingTo.content } : null
    };
    try {
      await addDoc(collection(db, 'userCommunities', selectedRoom.id, 'messages'), msgData);
      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), { lastActivity: new Date() });
      setCommunityMsgText(''); setCommunityReplyingTo(null); setAttachedGroupFile(null);
    } catch (e) { console.error(e); }
  };

  const handleStarGroupMessage = async (msgId) => {
    if (!user?.uid) return;
    const isCollege = isCollegeRoom || selectedRoom?.roomType === 'college';
    const targetColl = isCollege ? 'community-messages' : (selectedRoom?.id ? `userCommunities/${selectedRoom.id}/messages` : null);
    if (!targetColl) return;

    const msgsList = isCollege ? messages : communityMessages;
    const msg = msgsList.find(m => m.id === msgId);
    if (!msg) return;

    const isStarred = Array.isArray(msg.starredBy) && msg.starredBy.includes(user.uid);
    const docRef = doc(db, targetColl, msgId);

    try {
      if (isStarred) {
        await updateDoc(docRef, { starredBy: arrayRemove(user.uid) });
        showSuccess('Message unstarred');
      } else {
        await updateDoc(docRef, { starredBy: arrayUnion(user.uid) });
        showSuccess('Message starred ⭐');
      }
    } catch (e) {
      console.error('Failed to star message:', e);
    }
  };

  const handleGroupFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedGroupFile(file);
      showSuccess(`File attached: ${file.name}`);
    }
  };

  // ── Voice Recording Handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAttachedGroupFile({ name: `Voice Note (${recordingTime}s)`, url: audioUrl, isAudio: true });
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      console.error(e);
      showWarning('Microphone access required for voice notes.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  // ── Single Message Actions
  const handleCopyMsgText = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Message copied to clipboard!');
  };

  const handleStartEditMsg = (msg) => {
    setEditingMsg(msg);
    setEditingText(msg.content || '');
  };

  const handleSaveEditMsg = async () => {
    if (!editingMsg || !editingText.trim()) return;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      await updateDoc(doc(db, targetColl, editingMsg.id), {
        content: editingText.trim(),
        edited: true
      });
      setEditingMsg(null);
      setEditingText('');
      showSuccess('Message edited');
    } catch (e) { console.error(e); }
  };

  const handleRequestDeleteMsg = (msg) => {
    const isMe = msg.senderUid === user?.uid || msg.sender?.uid === user?.uid || msg.sender?.name === user?.name;
    const canEveryone = isMe || isCreator || (isAdmin && currentAdminPerms.canDeleteMessages !== false);
    setMsgToDeleteModal({ msg, isMe, canEveryone });
  };

  const handleDeleteMsgForMe = async (msgId) => {
    if (!user?.uid || !msgId) return;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      await updateDoc(doc(db, targetColl, msgId), {
        deletedFor: arrayUnion(user.uid)
      });
      showSuccess('Message deleted for you 🗑️');
      setMsgToDeleteModal(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteMsgForEveryone = async (msgId) => {
    if (!msgId) return;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    const targetMsg = (messages || []).find(m => m.id === msgId);
    const origText = (targetMsg?.content && targetMsg.content !== 'This message was deleted by sender')
      ? targetMsg.content
      : (targetMsg?.originalText || targetMsg?.fileName || 'Message attachment');
    try {
      await updateDoc(doc(db, targetColl, msgId), {
        isDeletedForEveryone: true,
        originalText: origText,
        content: 'This message was deleted by sender'
      });
      showSuccess('Message deleted for everyone 🗑️');
      setMsgToDeleteModal(null);
    } catch (e) { console.error('Failed to delete for everyone:', e); }
  };

  const handleTogglePinMsg = (msg) => {
    if (pinnedMsg?.id === msg.id) {
      setPinnedMsg(null);
      showSuccess('Message unpinned');
    } else {
      setPinnedMsg(msg);
      showSuccess('Message pinned to top');
    }
  };

  // ── Multi-Select Actions
  const handleToggleSelectMsg = (msgId) => {
    setSelectedMsgIds(prev =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleBulkStarSelected = async () => {
    if (selectedMsgIds.length === 0) return;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      for (const id of selectedMsgIds) {
        await updateDoc(doc(db, targetColl, id), { starredBy: arrayUnion(user.uid) });
      }
      showSuccess(`${selectedMsgIds.length} messages starred ⭐`);
      setSelectedMsgIds([]);
      setIsSelectMode(false);
    } catch (e) { console.error(e); }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedMsgIds.length === 0) return;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      for (const id of selectedMsgIds) {
        await updateDoc(doc(db, targetColl, id), { deletedFor: arrayUnion(user.uid) });
      }
      showSuccess(`${selectedMsgIds.length} messages deleted for you`);
      setSelectedMsgIds([]);
      setIsSelectMode(false);
    } catch (e) { console.error(e); }
  };

  const handleClearChatForMe = async () => {
    const msgsList = isCollegeRoom ? messages : communityMessages;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      for (const m of msgsList) {
        await updateDoc(doc(db, targetColl, m.id), { deletedFor: arrayUnion(user.uid) });
      }
      showSuccess('Chat cleared for you');
      setShowConfirmClearChatModal(false);
    } catch (e) { console.error(e); }
  };

  const handleToggleMuteCommunity = async () => {
    if (!selectedRoom?.id || !user?.uid) return;
    const isMuted = mutedCommunities[selectedRoom.id];
    const updated = !isMuted;
    setMutedCommunities(prev => ({ ...prev, [selectedRoom.id]: updated }));
    showSuccess(updated ? 'Notifications muted for this community' : 'Notifications unmuted');
    if (isGroupRoom) {
      try {
        await updateDoc(doc(db, 'userCommunities', selectedRoom.id), {
          [`mutedFor.${user.uid}`]: updated
        });
      } catch (e) { console.error(e); }
    }
  };

  const handleDeleteChatForMe = async () => {
    await handleClearChatForMe();
    setSelectedRoom(null);
    showSuccess('Chat deleted for you');
  };

  // ── Shared chat bubble component
  const ChatBubble = ({ msg, isMe, onReply, onReact, showEmojiFor, setShowEmoji }) => {
    const isSeen = Boolean(isMe && ((msg.readBy && msg.readBy.length > 0) || (msg.readByUsers && msg.readByUsers.length > 0) || msg.read === true));

    return (
      <div className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
        <img
          src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.sender?.name || 'u')}`}
          alt={msg.sender?.name}
          onClick={() => msg.sender?.uid && navigate(`/profile?uid=${msg.sender.uid}`)}
          className="w-8 h-8 rounded-full flex-shrink-0 mt-xs object-cover cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
        />
        <div className="space-y-xs relative group">
          {!isMe && <span className="text-[10px] font-bold text-neutral-500 ml-sm">{msg.sender?.name}{msg.sender?.role && ` · ${msg.sender.role}`}</span>}
          <div className={`text-[13.5px] leading-relaxed relative overflow-hidden transition-all ${isMe ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-500 dark:to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-xs px-3.5 py-1.5' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 rounded-2xl rounded-tl-xs px-3.5 py-1.5 shadow-xs'}`}>
            {msg.replyTo && <div className={`p-1 px-2 rounded-lg border text-xs mb-1 ${isMe ? 'bg-black/25 text-white border-white/90' : 'bg-primary-500/10 text-neutral-800 dark:text-neutral-100 border-primary-500'}`}><p className="font-bold">{msg.replyTo.name}</p><p className="truncate mt-xs">{msg.replyTo.text}</p></div>}
            <div className="relative inline-block max-w-full">
              <span className="text-[13.5px] leading-snug break-words font-normal">{msg.content}</span>
              <span className="inline-flex items-center gap-1 float-right mt-1 ml-2.5 text-[10px] leading-none select-none">
                <span className={isMe ? 'text-white/75' : 'text-neutral-500 dark:text-neutral-400 font-medium'}>
                  {formatTime(msg.timestamp)}
                </span>
                {isMe && (
                  <CheckCheck
                    className={`w-3.5 h-3.5 stroke-[2.8] transition-colors duration-300 ${
                      isSeen
                        ? 'text-emerald-300 dark:text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                        : 'text-white/50 dark:text-neutral-400'
                    }`}
                    title={isSeen ? "Seen (Green Tick)" : "Sent to group"}
                  />
                )}
              </span>
            </div>
          </div>
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="flex flex-wrap gap-xs pt-xs pl-sm">
            {msg.reactions.map((react, rIdx) => (
              <button key={rIdx} onClick={() => onReact && onReact(msg.id, react.emoji)} className={`px-sm py-[2px] rounded-full text-[10px] font-bold border flex items-center gap-xs ${react.users?.includes(user?.uid || 'user') ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950/20' : 'bg-white border-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:border-neutral-800'}`}>
                <span>{react.emoji}</span><span>{react.count}</span>
              </button>
            ))}
          </div>
        )}
        {onReply && (
          <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-md px-md py-[3px] z-10 ${isMe ? 'right-full mr-md' : 'left-full ml-md'}`}>
            <button onClick={() => onReply(msg)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowEmoji(showEmojiFor === msg.id ? null : msg.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="React"><Smile className="w-3.5 h-3.5" /></button>
            {showEmojiFor === msg.id && (
              <div className="absolute bottom-full left-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-sm flex gap-xs z-20 mb-xs">
                {chatEmojis.map(e => <button key={e} onClick={() => onReact && onReact(msg.id, e)} className="hover:scale-125 transition-transform text-sm">{e}</button>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="max-w-7xl mx-auto p-0 md:p-md h-full w-full flex flex-col font-sans antialiased text-neutral-900 dark:text-white overflow-hidden">
      <SEO title="Campus Circles" />

      {/* ──────── JOIN BANNER ──────── */}
      <AnimatePresence>
        {joinBanner && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-white dark:bg-neutral-900 border border-primary-200 dark:border-primary-800 rounded-2xl shadow-2xl p-lg mx-4">
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{joinBanner.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">You were invited to</p>
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">{joinBanner.name}</h3>
                <p className="text-xs text-neutral-400 mt-xs">{joinBanner.memberCount} members</p>
              </div>
              <button onClick={() => setJoinBanner(null)} className="text-neutral-400 hover:text-neutral-600 p-xs"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-md mt-lg">
              <Button variant="secondary" className="flex-1" onClick={() => setJoinBanner(null)}>Decline</Button>
              <Button variant="primary" className="flex-1" onClick={handleJoinCommunity} disabled={isJoining}>{isJoining ? 'Joining...' : 'Join Community'}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-0 md:gap-lg h-full min-h-0 flex-1 overflow-hidden">
        {/* ──────── LEFT SIDEBAR ──────── */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col h-full overflow-hidden ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
          <Card className="flex-1 flex flex-col p-0 overflow-hidden rounded-none md:rounded-xl border-none md:border">

        {/* Sidebar Header */}
        <div className="px-lg pt-lg pb-md flex-shrink-0">
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-xs">
              <button
                onClick={() => navigate('/messages?tab=direct')}
                className="p-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Back to Direct Messages"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-heading font-bold text-neutral-900 dark:text-white">Communities</h1>
            </div>
            <div className="flex items-center gap-xs">
              <button
                onClick={() => setIsGlobalStarredModalOpen(true)}
                className="px-md py-xs bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-500 font-semibold text-xs rounded-xl transition-all flex items-center gap-xs flex-shrink-0"
                title="View all starred community messages"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Starred</span>
                <span className="px-1.5 py-[1px] text-[10px] bg-amber-500/20 rounded-full font-bold">
                  {allStarredCommunityMsgs.length}
                </span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
                title="Create Community"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-900 border-0 rounded-xl pl-2xl py-sm pr-md text-sm outline-none focus:ring-2 focus:ring-primary-500 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
            />
          </div>
        </div>

        {/* Community List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* ── Pinned Section */}
          <div className="px-md pb-xs pt-xs space-y-xs">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-md mb-xs">Pinned</p>

            {/* KIET College Community */}
            <div
              onClick={() => setSelectedRoom({ roomType: 'college' })}
              className={`group relative w-full flex items-center gap-md px-md py-md rounded-2xl transition-all text-left cursor-pointer ${isCollegeRoom ? 'bg-primary-50 dark:bg-primary-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                  {collegeName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-950 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-xs justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white truncate" title={collegeName}>{formatShortCollegeName(collegeName)} Community</span>
                  <ShieldCheck className="w-4 h-4 text-primary-500 flex-shrink-0" />

                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-xs">
                  {loading ? 'Loading...' : messages.length > 0 ? getLastMsgPreview(messages) : 'Campus community hub'}
                </p>
              </div>

              {/* College Dropdown */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarMenuOpenId(sidebarMenuOpenId === 'college' ? null : 'college');
                  }}
                  className="p-xs rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {sidebarMenuOpenId === 'college' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setSidebarMenuOpenId(null); }} />
                    <div className="absolute right-0 top-full mt-xs w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl z-40 py-xs text-xs font-medium space-y-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSidebarMenuOpenId(null);
                          handleToggleMuteCommunity('college');
                        }}
                        className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                      >
                        {mutedCommunities['college'] ? (
                          <><Bell className="w-3.5 h-3.5 text-emerald-500" /> Unmute Notifications</>
                        ) : (
                          <><BellOff className="w-3.5 h-3.5 text-neutral-400" /> Mute Notifications</>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSidebarMenuOpenId(null);
                          setSelectedRoom({ roomType: 'college' });
                          setShowConfirmClearChatModal(true);
                        }}
                        className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                      >
                        <Eraser className="w-3.5 h-3.5 text-amber-500" /> Clear Chat
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* User Pinned Communities */}
            {myCommunities
              .filter(c => pinnedCommunityIds.includes(c.id))
              .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(community => {
                const isSelected = isGroupRoom && selectedRoom?.id === community.id;
                const isMuted = !!mutedCommunities[community.id];

                return (
                  <div
                    key={community.id}
                    onClick={() => setSelectedRoom({ roomType: 'group', ...community })}
                    className={`group relative w-full flex items-center gap-md px-md py-md rounded-2xl transition-all text-left cursor-pointer ${isSelected ? 'bg-primary-50 dark:bg-primary-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                  >
                    {community.avatar ? (
                      <img src={community.avatar} alt={community.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-xs">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">{community.name}</span>
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
                        {isMuted && <BellOff className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
                        {(community.admins || []).includes(user?.uid) && <Shield className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                        {community.type === 'private' ? <Lock className="w-3 h-3 text-neutral-400 flex-shrink-0" /> : <Globe className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-xs">{community.description || `${(community.members || []).length} members`}</p>
                    </div>

                    {/* Options Dropdown Button */}
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSidebarMenuOpenId(sidebarMenuOpenId === community.id ? null : community.id);
                        }}
                        className="p-xs rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {sidebarMenuOpenId === community.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setSidebarMenuOpenId(null); }} />
                          <div className="absolute right-0 top-full mt-xs w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl z-40 py-xs text-xs font-medium space-y-xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSidebarMenuOpenId(null);
                                handleTogglePinCommunity(community.id);
                              }}
                              className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Unpin Chat
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSidebarMenuOpenId(null);
                                handleToggleMuteCommunity(community.id);
                              }}
                              className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              {isMuted ? (
                                <><Bell className="w-3.5 h-3.5 text-emerald-500" /> Unmute Notifications</>
                              ) : (
                                <><BellOff className="w-3.5 h-3.5 text-neutral-400" /> Mute Notifications</>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSidebarMenuOpenId(null);
                                setSelectedRoom({ roomType: 'group', ...community });
                                handleOpenManage();
                              }}
                              className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <Info className="w-3.5 h-3.5 text-blue-500" /> Open Group Info
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSidebarMenuOpenId(null);
                                setSelectedRoom({ roomType: 'group', ...community });
                                setShowConfirmClearChatModal(true);
                              }}
                              className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                            >
                              <Eraser className="w-3.5 h-3.5 text-amber-500" /> Clear Chat
                            </button>
                            <div className="my-xs border-t border-neutral-100 dark:border-neutral-700" />
                            {community.creatorUid === user?.uid ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSidebarMenuOpenId(null);
                                  setSelectedRoom({ roomType: 'group', ...community });
                                  setShowDeleteConfirm(true);
                                  setShowManageDrawer(true);
                                  setManageTab('settings');
                                }}
                                className="w-full px-md py-sm text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-md font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Community
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSidebarMenuOpenId(null);
                                  setLeaveCommunityModal(community);
                                }}
                                className="w-full px-md py-sm text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-md font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Leave Community
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ── My Groups */}
          {myCommunities.filter(c => !pinnedCommunityIds.includes(c.id)).length > 0 && (
            <div className="px-md mt-sm">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-md mb-xs">My Groups</p>
              {myCommunities
                .filter(c => !pinnedCommunityIds.includes(c.id))
                .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(community => {
                  const isSelected = isGroupRoom && selectedRoom?.id === community.id;
                  const isMuted = !!mutedCommunities[community.id];

                  return (
                    <div
                      key={community.id}
                      onClick={() => setSelectedRoom({ roomType: 'group', ...community })}
                      className={`group relative w-full flex items-center gap-md px-md py-md rounded-2xl transition-all text-left cursor-pointer ${isSelected ? 'bg-primary-50 dark:bg-primary-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                    >
                      {community.avatar ? (
                        <img src={community.avatar} alt={community.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-xs">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">{community.name}</span>
                          {isMuted && <BellOff className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
                          {(community.admins || []).includes(user?.uid) && <Shield className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                          {community.type === 'private' ? <Lock className="w-3 h-3 text-neutral-400 flex-shrink-0" /> : <Globe className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-neutral-500 truncate mt-xs">{community.description || `${(community.members || []).length} members`}</p>
                      </div>

                      {/* Options Dropdown Button */}
                      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSidebarMenuOpenId(sidebarMenuOpenId === community.id ? null : community.id);
                          }}
                          className="p-xs rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {sidebarMenuOpenId === community.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setSidebarMenuOpenId(null); }} />
                            <div className="absolute right-0 top-full mt-xs w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl z-40 py-xs text-xs font-medium space-y-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSidebarMenuOpenId(null);
                                  handleTogglePinCommunity(community.id);
                                }}
                                className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                              >
                                <Pin className="w-3.5 h-3.5 text-primary-500" /> Pin Chat
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSidebarMenuOpenId(null);
                                  handleToggleMuteCommunity(community.id);
                                }}
                                className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                              >
                                {isMuted ? (
                                  <><Bell className="w-3.5 h-3.5 text-emerald-500" /> Unmute Notifications</>
                                ) : (
                                  <><BellOff className="w-3.5 h-3.5 text-neutral-400" /> Mute Notifications</>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSidebarMenuOpenId(null);
                                  setSelectedRoom({ roomType: 'group', ...community });
                                  handleOpenManage();
                                }}
                                className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                              >
                                <Info className="w-3.5 h-3.5 text-blue-500" /> Open Group Info
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSidebarMenuOpenId(null);
                                  setSelectedRoom({ roomType: 'group', ...community });
                                  setShowConfirmClearChatModal(true);
                                }}
                                className="w-full px-md py-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                              >
                                <Eraser className="w-3.5 h-3.5 text-amber-500" /> Clear Chat
                              </button>
                              <div className="my-xs border-t border-neutral-100 dark:border-neutral-700" />
                              {community.creatorUid === user?.uid ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSidebarMenuOpenId(null);
                                    setSelectedRoom({ roomType: 'group', ...community });
                                    setShowDeleteConfirm(true);
                                    setShowManageDrawer(true);
                                    setManageTab('settings');
                                  }}
                                  className="w-full px-md py-sm text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-md font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Community
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSidebarMenuOpenId(null);
                                    setLeaveCommunityModal(community);
                                  }}
                                  className="w-full px-md py-sm text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-md font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Leave Community
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── Discover Public Communities */}
          {discoverCommunities.filter(c => {
            if (c.visibility === 'private' && !isUserMember(c) && !isUserAdmin(c)) return false;
            if (c.audience === 'college_only' && c.college && c.college !== (user?.college || collegeName) && !isUserMember(c) && !isUserAdmin(c)) return false;
            if (isUserMember(c)) return false;
            if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
          }).length > 0 && (
            <div className="px-md mt-md pt-sm border-t border-neutral-100 dark:border-neutral-800">
              <div className="px-md mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Discover Communities</p>
                <span className="text-[10px] text-neutral-400 font-mono">Public</span>
              </div>

              {discoverCommunities
                .filter(c => {
                  if (c.visibility === 'private' && !isUserMember(c) && !isUserAdmin(c)) return false;
                  if (c.audience === 'college_only' && c.college && c.college !== (user?.college || collegeName) && !isUserMember(c) && !isUserAdmin(c)) return false;
                  if (isUserMember(c)) return false;
                  if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
                  return true;
                })
                .map(c => {
                  const isPending = isPendingRequest(c);

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 mb-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-900 dark:text-white font-bold text-base flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{c.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                              {c.visibility === 'private' ? (
                                <>
                                  <Lock className="w-3 h-3 text-amber-500" />
                                  <span>Private</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-3 h-3 text-emerald-500" />
                                  <span>Public</span>
                                </>
                              )}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                              {c.audience === 'college_only' ? (
                                <>
                                  <GraduationCap className="w-3 h-3 text-purple-500" />
                                  <span>College Only</span>
                                </>
                              ) : (
                                <>
                                  <Users className="w-3 h-3 text-sky-500" />
                                  <span>Everyone</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11.5px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-normal">
                        {c.description || 'Campus student community.'}
                      </p>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {c.members?.length || 1} members
                        </span>

                        {isPending ? (
                          <button
                            disabled
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-semibold text-xs cursor-not-allowed"
                          >
                            Pending Approval
                          </button>
                        ) : c.joinControl === 'request' ? (
                          <button
                            type="button"
                            onClick={() => handleRequestToJoin(c)}
                            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            Request to Join
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDirectJoin(c)}
                            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            Join Community
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Empty state */}
          {myCommunities.length === 0 && (
            <div className="px-lg mt-sm">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-lg text-center hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <Plus className="w-6 h-6 text-neutral-400 mx-auto mb-xs" />
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Create your first community</p>
              </button>
            </div>
          )}

        </div>
        </Card>
      </div>

      {/* ──────── MAIN CHAT AREA ──────── */}
      <div className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden ${selectedRoom ? 'flex' : 'hidden md:flex'}`}>

        {!selectedRoom ? (
          /* Welcome screen */
          <Card className="flex-1 flex flex-col items-center justify-center text-center p-2xl border-none md:border rounded-none md:rounded-xl">
            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 rounded-3xl flex items-center justify-center mb-lg shadow-inner">
              <MessageSquare className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white mb-md">Select a Community</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mb-xl">Choose a community from the left to start chatting, or create a new one.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-md bg-primary-500 hover:bg-primary-600 text-white font-semibold px-xl py-md rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Community
            </button>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-none md:border rounded-none md:rounded-xl border-neutral-100 dark:border-neutral-800 h-full min-h-0">
            {!isGroupRoom ? (
              /* ── COLLEGE COMMUNITY ROOM ── */
              <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center gap-md px-lg py-md bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm z-40 w-full">
              <button onClick={() => { setSelectedRoom(null); setSearchParams({}, { replace: true }); }} className="p-md rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex-shrink-0 cursor-pointer active:scale-95 z-10" title="Back to Communities List">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                {collegeName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-xs text-sm sm:text-base">
                  <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={collegeName}>
                    {formatShortCollegeName(collegeName)} Community
                  </span>
                  <ShieldCheck className="w-4 h-4 text-primary-500 flex-shrink-0" />
                </h2>

                <p className="text-xs text-neutral-500 font-semibold">Campus Community Hub · {messages.length} messages</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-xs flex-shrink-0">
                {autoClearDuration > 0 && (
                  <button
                    onClick={() => setIsAutoClearModalOpen(true)}
                    className="p-md rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200"
                    title="Auto Clear Chat active"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsChatSearchOpen(!isChatSearchOpen)}
                  className={`p-md rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isChatSearchOpen ? 'bg-neutral-100 text-primary-500' : ''}`}
                  title="Search messages"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Options Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className="p-md rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Chat Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showHeaderMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowHeaderMenu(false)} />
                      <div className="absolute right-0 top-full mt-xs w-60 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-xs text-xs font-medium space-y-xs">
                        <button
                          onClick={() => { setShowHeaderMenu(false); setIsAutoClearModalOpen(true); }}
                          className="w-full px-lg py-md text-left text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 flex items-center gap-md font-semibold"
                        >
                          <EyeOff className="w-4 h-4 text-purple-500" />
                          <span>Auto Clear Chat Settings</span>
                          {autoClearDuration > 0 && (
                            <span className="ml-auto text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">ON</span>
                          )}
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setIsChatSearchOpen(true); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Search className="w-4 h-4 text-primary-500" /> Search Messages
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setManageTab('starred'); setShowManageDrawer(true); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Starred Messages ({messages.filter(m => (m.starredBy || []).includes(user?.uid)).length})
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setIsSelectMode(true); setSelectedMsgIds([]); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <CheckSquare className="w-4 h-4 text-indigo-500" /> Select Messages
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); handleToggleMuteCommunity(); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          {mutedCommunities['college'] ? (
                            <><Bell className="w-4 h-4 text-emerald-500" /> Unmute Notifications</>
                          ) : (
                            <><BellOff className="w-4 h-4 text-neutral-500" /> Mute Notifications</>
                          )}
                        </button>
                        <div className="my-xs border-t border-neutral-100 dark:border-neutral-700" />
                        <button
                          onClick={() => { setShowHeaderMenu(false); setShowConfirmClearChatModal(true); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Eraser className="w-4 h-4 text-amber-500" /> Clear Chat (For Me)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* In-Chat Search Input */}
            {isChatSearchOpen && (
              <div className="px-lg py-sm bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-md">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search in campus community..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none text-neutral-800 dark:text-neutral-200"
                  autoFocus
                />
                {chatSearchQuery && <button onClick={() => setChatSearchQuery('')} className="text-neutral-400 hover:text-neutral-600 text-xs"><X className="w-4 h-4" /></button>}
              </div>
            )}

            {/* Pinned Message Bar */}
            {pinnedMsg && (
              <div className="px-lg py-xs bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-xs min-w-0">
                  <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-400 flex-shrink-0" />
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">Pinned:</span>
                  <span className="truncate text-amber-900 dark:text-amber-200">{pinnedMsg.content}</span>
                </div>
                <button onClick={() => setPinnedMsg(null)} className="text-amber-500 hover:text-amber-700 p-xs" title="Unpin"><PinOff className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Multi-Select Action Bar */}
            {isSelectMode && (
              <div className="px-lg py-sm bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">{selectedMsgIds.length} selected</span>
                <div className="flex items-center gap-sm">
                  <button onClick={handleBulkStarSelected} disabled={selectedMsgIds.length === 0} className="flex items-center gap-xs px-md py-xs bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50"><Star className="w-3.5 h-3.5" /> Star</button>
                  <button onClick={handleBulkDeleteSelected} disabled={selectedMsgIds.length === 0} className="flex items-center gap-xs px-md py-xs bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  <button onClick={() => { setIsSelectMode(false); setSelectedMsgIds([]); }} className="text-neutral-500 hover:text-neutral-700 font-semibold">Cancel</button>
                </div>
              </div>
            )}

            {/* Chat Content */}
            <div className="flex-1 min-h-0 flex flex-col relative">

              {/* CHAT */}
              {collegeTab === 'Chat' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={chatRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-lg py-md space-y-md scroll-smooth scrollbar-thin">
                    {loading ? (
                      <div className="space-y-lg pt-md">{[1,2,3,4].map(i => <div key={i} className={`flex gap-md max-w-[60%] ${i % 2 === 0 ? 'ml-auto flex-row-reverse' : ''}`}><div className="w-8 h-8 rounded-full skeleton flex-shrink-0 mt-xs"/><div className="h-14 flex-1 skeleton rounded-2xl"/></div>)}</div>
                    ) : messages.length > 0 ? messages
                        .filter(m => !(m.deletedFor || []).includes(user?.uid))
                        .filter(m => !chatSearchQuery || (m.content || '').toLowerCase().includes(chatSearchQuery.toLowerCase()))
                        .map(msg => {
                          const isMe = msg.sender?.uid === user?.uid || msg.sender?.name === user?.name;
                          const isStarred = (msg.starredBy || []).includes(user?.uid);
                          const isSelected = selectedMsgIds.includes(msg.id);
                          const isSeen = Boolean(isMe && ((msg.readBy && msg.readBy.length > 0) || (msg.readByUsers && msg.readByUsers.length > 0) || msg.read === true));

                          return (
                            <div key={msg.id} id={`msg-${msg.id}`} className={`transition-all duration-300 ${highlightedMsgId === msg.id ? 'ring-4 ring-amber-400 rounded-2xl p-1 bg-amber-500/20 shadow-2xl animate-pulse z-20' : ''}`}>
                              <SwipeableMessageRow isMe={isMe} onReply={() => setReplyingTo(msg)}>
                              <div className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''} ${isSelected ? 'opacity-80 scale-[0.98]' : ''}`}>
                                {isSelectMode && (
                                  <button onClick={() => handleToggleSelectMsg(msg.id)} className="self-center p-xs text-indigo-500">
                                    {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-100" /> : <Square className="w-5 h-5 text-neutral-400" />}
                                  </button>
                                )}
                                <img src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.sender?.name || 'u')}`} alt={msg.sender?.name} className="w-8 h-8 rounded-full flex-shrink-0 mt-xs object-cover" />
                                <div className="space-y-xs relative group">
                                  {!isMe && <span className="text-[10px] font-bold text-neutral-500 ml-sm">{msg.sender?.name}{msg.sender?.role && ` · ${msg.sender?.role}`}</span>}
                                  {msg.isDeletedForEveryone || msg.content === 'This message was deleted by sender' || msg.text === 'This message was deleted by sender' ? (
                                    <div className="my-xs max-w-sm">
                                      <div className="flex items-center gap-xs px-md py-xs rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-dashed border-rose-400/40 text-neutral-600 dark:text-neutral-300 text-xs backdrop-blur-xs shadow-xs">
                                        <Ban className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                        <span className="italic font-medium text-[11px] opacity-90">
                                          This message was deleted by sender
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`text-[13.5px] leading-relaxed relative overflow-hidden transition-all ${isMe ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-500 dark:to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-xs px-3.5 py-1.5' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 rounded-2xl rounded-tl-xs px-3.5 py-1.5 shadow-xs'}`}>
                                      {msg.replyTo && <div className={`p-1 px-2 rounded-lg border text-xs mb-1 ${isMe ? 'bg-black/25 text-white border-white/90' : 'bg-primary-500/10 text-neutral-800 dark:text-neutral-100 border-primary-500'}`}><p className="font-bold">{msg.replyTo.name}</p><p className="truncate mt-xs">{msg.replyTo.text}</p></div>}
                                      {msg.poll && (
                                       <div className="my-2 p-3.5 rounded-2xl bg-neutral-900/95 border border-neutral-800 text-neutral-100 text-xs space-y-3 max-w-sm shadow-xl backdrop-blur-md">
                                         <div className="flex items-center justify-between gap-2 font-bold text-neutral-100">
                                           <div className="flex items-center gap-2 min-w-0">
                                             <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                               <BarChart2 className="w-4 h-4" />
                                             </div>
                                             <span className="text-sm font-extrabold text-white truncate">{msg.poll.question}</span>
                                           </div>
                                           <span className="text-[10px] font-bold text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 flex-shrink-0">
                                             {msg.poll.pollType === 'multiple' ? 'Multiple' : 'Single'}
                                           </span>
                                         </div>

                                         <div className="space-y-2">
                                           {msg.poll.options?.map((opt, oIdx) => {
                                             const votedUsers = Array.isArray(opt.votedUsers)
                                               ? opt.votedUsers
                                               : (opt.selected ? [user?.uid || 'guest'] : []);
                                             const votesCount = votedUsers.length || opt.votes || 0;
                                             const totalVotes = (msg.poll.options || []).reduce((sum, o) => {
                                               const vList = Array.isArray(o.votedUsers) ? o.votedUsers : (o.selected ? [user?.uid || 'guest'] : []);
                                               return sum + (vList.length || o.votes || 0);
                                             }, 0);

                                             const isVotedByMe = user?.uid && votedUsers.includes(user.uid);
                                             const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

                                             return (
                                               <button
                                                 key={oIdx}
                                                 type="button"
                                                 onClick={() => (selectedRoom?.id ? handleGroupPollVote(msg.id, oIdx) : handleCollegePollVote(msg.id, oIdx))}
                                                 className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between text-xs group ${
                                                   isVotedByMe
                                                     ? 'border-purple-500/60 bg-purple-500/15 font-bold shadow-xs'
                                                     : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800'
                                                 }`}
                                               >
                                                 <div
                                                   className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                                                     isVotedByMe ? 'bg-purple-500/25' : 'bg-neutral-700/30'
                                                   }`}
                                                   style={{ width: `${percent}%` }}
                                                 />
                                                 <div className="relative z-10 flex items-center gap-2 min-w-0 pr-2">
                                                   {isVotedByMe ? (
                                                     <CheckCircle2 className="w-4 h-4 text-purple-400 fill-purple-400/20 flex-shrink-0" />
                                                   ) : (
                                                     <div className="w-4 h-4 rounded-full border border-neutral-600 flex-shrink-0 group-hover:border-neutral-400" />
                                                   )}
                                                   <span className={`truncate text-xs ${isVotedByMe ? 'text-white font-bold' : 'text-neutral-200 font-medium'}`}>
                                                     {opt.text}
                                                   </span>
                                                 </div>

                                                 <div className="relative z-10 flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                                                   <span className={`font-bold ${isVotedByMe ? 'text-purple-300' : 'text-neutral-400'}`}>
                                                     {percent}%
                                                   </span>
                                                   <span className="text-[10px] text-neutral-500 font-medium">({votesCount})</span>
                                                 </div>
                                                </button>
                                              );
                                           })}
                                         </div>

                                         <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold pt-1 border-t border-neutral-800/60">
                                           <span>
                                             {(msg.poll.options || []).reduce((sum, o) => sum + ((o.votedUsers?.length) || o.votes || 0), 0) || 0} Total Votes
                                           </span>
                                           <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setViewVotesPoll(msg.poll);
                                              }}
                                              className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                                            >
                                              <Users className="w-3.5 h-3.5" />
                                              <span>View Votes</span>
                                            </button>
                                         </div>
                                         <div className="text-[10px] text-neutral-500 font-normal">
                                           {msg.poll.pollType === 'multiple' ? 'Select multiple' : 'Tap to vote'}
                                         </div>
                                       </div>
                                     )}
                                      {msg.fileUrl && (
                                        <div className="mb-md p-md rounded-xl bg-black/10 flex items-center justify-between gap-md">
                                          <div className="flex items-center gap-sm text-xs font-semibold truncate"><FileText className="w-4 h-4 flex-shrink-0" /> {msg.fileName || 'Attachment'}</div>
                                          <a href={msg.fileUrl} download={msg.fileName || 'file'} target="_blank" rel="noreferrer" className="p-xs hover:bg-black/10 rounded"><Download className="w-3.5 h-3.5" /></a>
                                        </div>
                                      )}
                                      <div className="relative inline-block max-w-full">
                                        <span className="text-[13.5px] leading-snug break-words font-normal">{msg.content}</span>
                                        {msg.edited && <span className="text-[9px] opacity-60 ml-xs italic">(edited)</span>}
                                        {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline-block ml-1" title="Starred message" />}

                                        {/* WhatsApp / Instagram Style Inline Timestamp & Working Green Vector Tick */}
                                        <span className="inline-flex items-center gap-1 float-right mt-1 ml-2.5 text-[10px] leading-none select-none">
                                          <span className={isMe ? 'text-white/75' : 'text-neutral-500 dark:text-neutral-400 font-medium'}>
                                            {formatTime(msg.timestamp)}
                                          </span>
                                          {isMe && (
                                            <CheckCheck
                                              className={`w-3.5 h-3.5 stroke-[2.8] transition-colors duration-300 ${
                                                isSeen
                                                  ? 'text-emerald-300 dark:text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                                                  : 'text-white/50 dark:text-neutral-400'
                                              }`}
                                              title={isSeen ? "Seen (Green Tick)" : "Sent to group"}
                                            />
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {!isSelectMode && !msg.isDeletedForEveryone && msg.content !== 'This message was deleted by sender' && msg.text !== 'This message was deleted by sender' && (
                                    <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-md px-md py-[3px] z-10 ${isMe ? 'right-full mr-md' : 'left-full ml-md'}`}>
                                      <button onClick={() => setReplyingTo(msg)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleStarGroupMessage(msg.id)} className={`p-xs ${isStarred ? 'text-amber-500' : 'text-neutral-400 hover:text-amber-500'}`} title={isStarred ? 'Unstar' : 'Star'}><Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} /></button>
                                      <button onClick={() => handleCopyMsgText(msg.content)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Copy text"><Copy className="w-3.5 h-3.5" /></button>
                                      {isMe && <button onClick={() => handleStartEditMsg(msg)} className="text-neutral-400 hover:text-primary-500 p-xs" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                                      <button onClick={() => handleRequestDeleteMsg(msg)} className="text-neutral-400 hover:text-rose-500 p-xs" title="Delete message"><Trash2 className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleTogglePinMsg(msg)} className="text-neutral-400 hover:text-amber-500 p-xs" title="Pin message"><Pin className="w-3.5 h-3.5" /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              </SwipeableMessageRow>
                            </div>
                          );
                        }) : (
                      <div className="text-center py-5xl"><AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" /><h3 className="font-bold text-lg mb-xs">No Messages Yet</h3><p className="text-sm text-neutral-500">Start the college conversation!</p></div>
                    )}
                  </div>
                  {showScrollBtn && <button onClick={() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }} className="absolute bottom-20 right-lg w-10 h-10 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 z-20"><ArrowDown className="w-5 h-5" /></button>}
                  {/* Chat Input */}
                  <div className="flex-shrink-0 z-30 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 p-2 sm:p-3 shadow-lg">
                    {editingMsg && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-sm flex justify-between items-center text-xs mb-xs">
                        <div className="flex-1 min-w-0 mr-md">
                          <span className="font-bold text-amber-700 dark:text-amber-400">Editing message:</span>
                          <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditMsg()} className="w-full bg-white dark:bg-neutral-800 border rounded px-md py-xs mt-xs text-xs outline-none" autoFocus />
                        </div>
                        <div className="flex items-center gap-xs">
                          <button onClick={handleSaveEditMsg} className="p-xs bg-amber-500 text-white rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingMsg(null)} className="p-xs text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}
                    {attachedFile && (
                      <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg p-sm flex justify-between items-center text-xs mb-xs">
                        <span className="font-semibold text-primary-600 dark:text-primary-400 truncate">📎 {attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="text-neutral-400 hover:text-neutral-600 ml-md"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                    {replyingTo && <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-sm flex justify-between items-center text-xs mb-xs"><div className="min-w-0"><span className="font-semibold text-[10px] text-neutral-400">Replying to {replyingTo.sender?.name}</span><p className="truncate text-neutral-600 dark:text-neutral-300 mt-xs">{replyingTo.content}</p></div><button onClick={() => setReplyingTo(null)} className="text-neutral-400 hover:text-neutral-600 ml-md"><X className="w-4 h-4" /></button></div>}
                     <div className="flex gap-md items-center relative">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                      {/* Attachment Popover */}
                      <div className="relative">
                        <button
                          onClick={() => setShowAttachMenuPop(!showAttachMenuPop)}
                          className="p-md text-neutral-400 hover:text-purple-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-full flex-shrink-0 transition-colors cursor-pointer"
                          title="Attach Options"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>

                        {showAttachMenuPop && (
                          <div className="absolute bottom-full mb-2 left-0 z-50 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 text-xs font-semibold space-y-1">
                            <button
                              type="button"
                              onClick={() => { fileInputRef.current?.click(); setShowAttachMenuPop(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <Image className="w-4 h-4 text-sky-500" />
                              <span>Photos / Gallery</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsCreatePollOpen(true); setShowAttachMenuPop(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <BarChart2 className="w-4 h-4 text-purple-500" />
                              <span>Create Campus Poll</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { fileInputRef.current?.click(); setShowAttachMenuPop(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-amber-500" />
                              <span>Attach File / Doc</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Chat Input Container */}
                      <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-md py-sm flex items-center gap-md relative">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="bg-transparent text-sm outline-none flex-1 py-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
                        />

                        {/* Crazy Emoji Picker Toggle */}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPickerPop(!showEmojiPickerPop)}
                          className={`p-xs transition-colors cursor-pointer ${showEmojiPickerPop ? 'text-purple-500' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                          title="Crazy Emoji Packs"
                        >
                          <Smile className="w-4.5 h-4.5" />
                        </button>

                        {/* WhatsApp Style Emoji Picker Drawer / Popover */}
                        {showEmojiPickerPop && (
                          <>
                            <div
                              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-xs sm:bg-transparent"
                              onClick={() => setShowEmojiPickerPop(false)}
                            />

                            <div className="absolute bottom-full left-0 right-0 mb-3 sm:left-auto sm:right-0 sm:mb-3 w-full sm:w-80 h-72 sm:h-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 rounded-3xl shadow-2xl p-3 text-xs flex flex-col transition-all z-[100]">
                              <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-2 sm:hidden flex-shrink-0" />

                              <div className="flex items-center gap-1 pb-2 border-b border-neutral-100 dark:border-neutral-800 mb-2 overflow-x-auto scrollbar-none flex-shrink-0">
                                {allPacks.map((pack, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setActiveEmojiPack(pIdx)}
                                    className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                      activeEmojiPack === pIdx
                                        ? 'bg-purple-500 text-white shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <span>{pack.name}</span>
                                    {pack.id === 'recents' && (
                                      <span className="text-[9px] opacity-75 font-mono">({pack.emojis.length})</span>
                                    )}
                                  </button>
                                ))}
                              </div>

                              <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                                {allPacks[activeEmojiPack]?.emojis.length > 0 ? (
                                  allPacks[activeEmojiPack].emojis.map((emo, eIdx) => (
                                    <button
                                      key={eIdx}
                                      type="button"
                                      onClick={() => {
                                        setMessageText(prev => prev + emo);
                                        handleAddRecentEmoji(emo);
                                      }}
                                      className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-xl sm:text-lg rounded-xl hover:bg-purple-500/15 active:scale-125 transition-transform cursor-pointer"
                                    >
                                      {emo}
                                    </button>
                                  ))
                                ) : (
                                  <div className="col-span-full py-8 text-center text-neutral-400 text-xs italic">
                                    No recent emojis used yet. Tap any emoji to save here!
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                      </div>

                      <button onClick={handleSendMessage} className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md shadow-sky-500/30 cursor-pointer"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {collegeTab === 'Feed' && (
                <div className="flex-1 overflow-y-auto px-lg py-md space-y-lg scrollbar-thin">
                  <div className="mb-lg p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-lg shadow-black/5 dark:shadow-black/30 transition-all">
                    <div className="flex gap-3 sm:gap-4">
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
                        alt="You"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm ring-2 ring-neutral-200/50 dark:ring-neutral-700/50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <MentionTextArea
                          placeholder="Post a campus announcement or community update... (type @ to tag a peer)"
                          value={newPostText}
                          onChange={(e) => setNewPostText(e.target.value)}
                          rows={3}
                          className="w-full bg-transparent text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none outline-none border-none focus:ring-0 leading-relaxed p-1"
                        />
                        {feedImagePreviewUrl && (
                          <div className="relative mt-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 max-h-60 shadow-md group">
                            <img src={feedImagePreviewUrl} alt="Preview" className="object-contain max-h-60 w-full" />
                            <button
                              type="button"
                              onClick={handleRemoveFeedImage}
                              className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-rose-600 text-white rounded-full p-1.5 transition-all shadow-lg backdrop-blur-xs cursor-pointer"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={feedImageInputRef}
                          onChange={handleFeedImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => feedImageInputRef.current?.click()}
                          className={`px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                            feedImageFile
                              ? 'bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)] scale-[1.02]'
                              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-sky-500/10 hover:text-sky-500 dark:hover:text-sky-400 border border-transparent hover:border-sky-500/20'
                          }`}
                          title="Add Photos"
                        >
                          <Image className={`w-4 h-4 transition-transform duration-300 ${feedImageFile ? 'scale-110 text-sky-500' : ''}`} />
                          <span>Add Photos</span>
                          {feedImageFile && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={(!newPostText.trim() && !feedImageFile) || isUploadingFeedImage}
                        onClick={handleCreateFeedPost}
                        className="px-6 py-2 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{isUploadingFeedImage ? 'Sharing...' : 'Share Announcement'}</span>
                      </button>
                    </div>
                  </div>

                  {feedPosts.length > 0 ? (
                    <div className="max-w-2xl mx-auto space-y-lg">
                      {feedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLikePost}
                          onSave={handleSavePost}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-5xl max-w-2xl mx-auto">
                      <AlertCircle className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                      <h3 className="font-bold mb-xs">No Announcements Yet</h3>
                      <p className="text-sm text-neutral-500">Be the first to post!</p>
                    </Card>
                  )}
                </div>
              )}

              {/* POLLS */}
              {collegeTab === 'Polls' && (
                <div className="flex-1 overflow-y-auto px-lg py-md space-y-lg scrollbar-thin">
                  <div className="flex justify-between items-center max-w-2xl mx-auto mb-md">
                    <div>
                      <h2 className="text-lg font-bold">Campus Polls</h2>
                      <p className="text-xs text-neutral-500">Vote on college decisions & student opinions</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setIsCreatePollOpen(true)}>
                      <Plus className="w-4 h-4 mr-xs inline" /> Create Poll
                    </Button>
                  </div>

                  <div className="max-w-2xl mx-auto space-y-lg">
                    {polls.length > 0 ? polls.map(poll => {
                      const pollIdKey = poll.id || poll.docId;
                      const isExpanded = expandedPollVotes[pollIdKey];
                      const totalVotesCount = poll.totalVotes || (poll.options || []).reduce((sum, o) => sum + ((o.votedUsers?.length) || o.votes || 0), 0);
                      const hasVoted = poll.options?.some(o => (Array.isArray(o.votedUsers) && o.votedUsers.includes(user?.uid)) || o.selected);

                      return (
                        <Card key={poll.id} className="p-lg border-neutral-100 dark:border-neutral-800 shadow-sm space-y-md">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-md border-b border-neutral-100 dark:border-neutral-800 pb-md">
                            <div className="space-y-xs min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                  <BarChart2 className="w-4 h-4" />
                                </div>
                                <h3 className="font-extrabold text-base text-neutral-900 dark:text-neutral-100 leading-snug">{poll.question}</h3>
                              </div>
                              <p className="text-[11px] text-neutral-400 font-medium ml-9">
                                Posted by <span className="font-semibold text-neutral-300">{poll.createdBy || 'Student'}</span>
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-purple-400 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
                              {poll.pollType === 'multiple' ? 'Multiple Choice' : 'Single Choice'}
                            </span>
                          </div>

                          {/* Options */}
                          <div className="space-y-md">
                            {poll.options?.map((opt, oIdx) => {
                              const vUsers = Array.isArray(opt.votedUsers) ? opt.votedUsers : (opt.selected ? [user?.uid || 'guest'] : []);
                              const isSelected = user?.uid && vUsers.includes(user.uid);
                              const votesNum = vUsers.length || opt.votes || 0;
                              const percent = totalVotesCount > 0 ? Math.round((votesNum / totalVotesCount) * 100) : 0;
                              const vDetails = (Array.isArray(opt.votedUserDetails) && opt.votedUserDetails.length > 0)
                                ? opt.votedUserDetails
                                : (vUsers.length > 0
                                    ? vUsers.map(u => ({ uid: u, name: u === user?.uid ? (user?.name || 'You') : 'Student', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u}` }))
                                    : (votesNum > 0
                                        ? Array.from({ length: votesNum }).map((_, i) => ({ uid: `v_${i}`, name: i === 0 && user?.name ? user.name : `Student ${i + 1}`, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user?.email || 's') + i}` }))
                                        : []));

                              return (
                                <div key={oIdx} className="space-y-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleVote(poll.id, oIdx)}
                                    className={`w-full text-left relative overflow-hidden rounded-xl border p-lg transition-all cursor-pointer ${
                                      isSelected
                                        ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/15 font-bold shadow-xs'
                                        : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                                    }`}
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${isSelected ? 'bg-purple-500/15' : 'bg-neutral-200/20'}`} style={{ width: `${percent}%` }} />
                                    <div className="relative flex justify-between items-center z-10 text-sm font-semibold">
                                      <span className="flex items-center gap-md text-neutral-900 dark:text-neutral-100">
                                        {opt.text}
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-500 fill-purple-500/20" />}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {vDetails.length > 0 && (
                                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                                            {vDetails.slice(0, 3).map((voter, vIdx) => (
                                              <img key={vIdx} src={voter.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${voter.name}`} title={voter.name} className="w-4 h-4 rounded-full ring-1 ring-neutral-800 object-cover" />
                                            ))}
                                          </div>
                                        )}
                                        <span className="text-neutral-400 font-mono text-xs">{percent}% ({votesNum})</span>
                                      </div>
                                    </div>
                                  </button>

                                  {/* Inline Expandable Voters List */}
                                  {isExpanded && (
                                    <div className="pl-3 border-l-2 border-purple-500/40 space-y-1 py-1">
                                      {vDetails.length > 0 ? (
                                        vDetails.map((voter, vIdx) => (
                                          <div key={vIdx} className="flex items-center justify-between text-xs py-1 px-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/60">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <img src={voter.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(voter.name || 'Student')}`} alt={voter.name} className="w-5 h-5 rounded-full object-cover border border-neutral-700" />
                                              <span className="font-semibold text-neutral-200 truncate">{voter.name || 'Student'}</span>
                                            </div>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-[11px] text-neutral-500 italic px-1">No voters recorded for this option yet.</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer */}
                          <div className="flex justify-between items-center mt-lg text-xs text-neutral-400 font-semibold border-t border-neutral-100 dark:border-neutral-800 pt-md">
                            <span>Total: {totalVotesCount} votes</span>
                            <div className="flex items-center gap-3">
                              {hasVoted && <span className="text-purple-500 font-bold">✓ Voted</span>}
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedPollVotes(prev => ({ ...prev, [pollIdKey]: !prev[pollIdKey] }));
                                  setViewVotesPoll(poll);
                                }}
                                className="flex items-center gap-1.5 text-sky-400 font-bold hover:underline cursor-pointer px-2.5 py-1 rounded-lg hover:bg-sky-500/10 transition-colors"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'Hide Voters' : 'View Votes'}</span>
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    }) : (
                      <Card className="text-center py-5xl">
                        <BarChart2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                        <h3 className="font-bold mb-xs">No Polls Yet</h3>
                        <Button variant="primary" size="sm" className="mt-lg" onClick={() => setIsCreatePollOpen(true)}>
                          <Plus className="w-4 h-4 mr-xs inline" /> Create Poll
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* FILES */}
              {collegeTab === 'Files' && (
                <div className="flex-1 overflow-y-auto px-lg py-md space-y-lg scrollbar-thin">
                  <div className="flex items-center justify-between gap-md mb-md">
                    <div className="flex items-center gap-sm overflow-x-auto scrollbar-none">{fileCategories.map(cat => <button key={cat} onClick={() => setActiveFileCategory(cat)} className={`px-lg py-xs rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeFileCategory === cat ? 'bg-primary-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>{cat}</button>)}</div>
                    <Button variant="primary" size="sm" className="whitespace-nowrap" onClick={() => setIsShareFileOpen(true)}><Plus className="w-4 h-4 mr-xs inline" /> Share</Button>
                  </div>
                  {filteredFiles.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-lg">
                      {filteredFiles.map(file => (
                        <Card key={file.id} className="p-lg hover:shadow-md transition-shadow border-neutral-100 dark:border-neutral-800 flex flex-col justify-between">
                          <div className="flex items-start gap-md mb-lg"><div className="w-10 h-10 rounded-lg bg-neutral-50 dark:bg-neutral-800 border flex items-center justify-center text-primary-500 flex-shrink-0"><FileText className="w-5 h-5" /></div><div className="min-w-0"><h4 className="font-bold text-sm truncate" title={file.name}>{file.name}</h4><span className="badge-secondary mt-xs">{file.category}</span></div></div>
                          <div className="flex items-center justify-between pt-md border-t border-neutral-50 dark:border-neutral-800 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider"><div><p>By: {file.uploadedBy}</p><p className="mt-xs">{file.date} · {file.size || '1 MB'}</p></div><Button variant="secondary" size="xs" className="flex items-center gap-xs" onClick={() => handleDownloadFile(file.name)}><Download className="w-3.5 h-3.5" /> Download</Button></div>
                        </Card>
                      ))}
                    </div>
                  ) : <div className="text-center py-5xl"><AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-lg" /><h3 className="font-bold mb-xs">No Files Yet</h3><Button variant="primary" size="sm" className="mt-lg" onClick={() => setIsShareFileOpen(true)}><Plus className="w-4 h-4 mr-xs inline" /> Share Resource</Button></div>}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── GROUP ROOM ── */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center gap-md px-lg py-md bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm z-40 w-full">
              <button onClick={() => { setSelectedRoom(null); setSearchParams({}, { replace: true }); }} className="p-md rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex-shrink-0 cursor-pointer active:scale-95 z-10" title="Back to Communities List">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {selectedRoom?.avatar ? (
                <img src={selectedRoom.avatar} alt={selectedRoom?.name || 'Community'} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-md" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                  {(selectedRoom?.name || 'Community')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-xs truncate">
                  <span className="truncate">{selectedRoom?.name || 'Community'}</span>
                  {isAdmin && <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-xs flex-shrink-0">
                {autoClearDuration > 0 && (
                  <button
                    onClick={() => setIsAutoClearModalOpen(true)}
                    className="p-md rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200"
                    title="Auto Clear Chat active"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsChatSearchOpen(!isChatSearchOpen)}
                  className={`p-md rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isChatSearchOpen ? 'bg-neutral-100 text-primary-500' : ''}`}
                  title="Search messages"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Options Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className="p-md rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Chat Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showHeaderMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowHeaderMenu(false)} />
                      <div className="absolute right-0 top-full mt-xs w-60 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-xs text-xs font-medium space-y-xs">
                        <button
                          onClick={() => { setShowHeaderMenu(false); setIsAutoClearModalOpen(true); }}
                          className="w-full px-lg py-md text-left text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 flex items-center gap-md font-semibold"
                        >
                          <EyeOff className="w-4 h-4 text-purple-500" />
                          <span>Auto Clear Chat Settings</span>
                          {autoClearDuration > 0 && (
                            <span className="ml-auto text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">ON</span>
                          )}
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); handleOpenManage(); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Info className="w-4 h-4 text-blue-500" /> View Group Info
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setIsChatSearchOpen(true); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Search className="w-4 h-4 text-primary-500" /> Search Messages
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setManageTab('starred'); setShowManageDrawer(true); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Starred Messages ({communityMessages.filter(m => (m.starredBy || []).includes(user?.uid)).length})
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setIsSelectMode(true); setSelectedMsgIds([]); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <CheckSquare className="w-4 h-4 text-indigo-500" /> Select Messages
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); handleToggleMuteCommunity(); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          {mutedCommunities[selectedRoom?.id] ? (
                            <><Bell className="w-4 h-4 text-emerald-500" /> Unmute Notifications</>
                          ) : (
                            <><BellOff className="w-4 h-4 text-neutral-500" /> Mute Notifications</>
                          )}
                        </button>
                        <div className="my-xs border-t border-neutral-100 dark:border-neutral-700" />
                        <button
                          onClick={() => { setShowHeaderMenu(false); setShowConfirmClearChatModal(true); }}
                          className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                        >
                          <Eraser className="w-4 h-4 text-amber-500" /> Clear Chat (For Me)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* In-Chat Search Input */}
            {isChatSearchOpen && (
              <div className="px-lg py-sm bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-md">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search in this community..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none text-neutral-800 dark:text-neutral-200"
                  autoFocus
                />
                {chatSearchQuery && <button onClick={() => setChatSearchQuery('')} className="text-neutral-400 hover:text-neutral-600 text-xs"><X className="w-4 h-4" /></button>}
              </div>
            )}

            {/* Pinned Message Bar */}
            {pinnedMsg && (
              <div className="px-lg py-xs bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-xs min-w-0">
                  <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-400 flex-shrink-0" />
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">Pinned:</span>
                  <span className="truncate text-amber-900 dark:text-amber-200">{pinnedMsg.content}</span>
                </div>
                <button onClick={() => setPinnedMsg(null)} className="text-amber-500 hover:text-amber-700 p-xs" title="Unpin"><PinOff className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Multi-Select Action Bar */}
            {isSelectMode && (
              <div className="px-lg py-sm bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">{selectedMsgIds.length} selected</span>
                <div className="flex items-center gap-sm">
                  <button onClick={handleBulkStarSelected} disabled={selectedMsgIds.length === 0} className="flex items-center gap-xs px-md py-xs bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50"><Star className="w-3.5 h-3.5" /> Star</button>
                  <button onClick={handleBulkDeleteSelected} disabled={selectedMsgIds.length === 0} className="flex items-center gap-xs px-md py-xs bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  <button onClick={() => { setIsSelectMode(false); setSelectedMsgIds([]); }} className="text-neutral-500 hover:text-neutral-700 font-semibold">Cancel</button>
                </div>
              </div>
            )}

            {/* Group Chat */}
            <div className="flex-1 flex flex-col min-h-0">
              <div ref={groupChatRef} className="flex-1 overflow-y-auto px-lg py-md space-y-md scroll-smooth scrollbar-thin">
                {communityMessages.length === 0 ? (
                  <div className="text-center py-5xl">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center mx-auto mb-lg"><Users className="w-8 h-8 text-indigo-400" /></div>
                    <h3 className="font-bold text-lg mb-xs">Start the conversation!</h3>
                    <p className="text-sm text-neutral-500">Send the first message to your group.</p>
                  </div>
                ) : communityMessages
                    .filter(m => !(m.deletedFor || []).includes(user?.uid))
                    .filter(m => !chatSearchQuery || (m.content || '').toLowerCase().includes(chatSearchQuery.toLowerCase()))
                    .map(msg => {
                      const isMe = msg.sender?.uid === user?.uid;
                      const isStarred = (msg.starredBy || []).includes(user?.uid);
                      const isSelected = selectedMsgIds.includes(msg.id);
                      const isSeen = Boolean(isMe && ((msg.readBy && msg.readBy.length > 0) || (msg.readByUsers && msg.readByUsers.length > 0) || msg.read === true));

                      return (
                        <div key={msg.id} id={`msg-${msg.id}`} className={`transition-all duration-300 ${highlightedMsgId === msg.id ? 'ring-4 ring-amber-400 rounded-2xl p-1 bg-amber-500/20 shadow-2xl animate-pulse z-20' : ''}`}>
                          <SwipeableMessageRow isMe={isMe} onReply={() => setCommunityReplyingTo(msg)}>
                            <div className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''} ${isSelected ? 'opacity-80 scale-[0.98]' : ''}`}>
                              {isSelectMode && (
                                <button onClick={() => handleToggleSelectMsg(msg.id)} className="self-center p-xs text-indigo-500">
                                  {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-100" /> : <Square className="w-5 h-5 text-neutral-400" />}
                                </button>
                              )}                               <div className="space-y-xs relative group">
                                {!isMe && <span className="text-[10px] font-bold text-neutral-500 ml-sm">{msg.sender?.name}</span>}
                                {msg.isDeletedForEveryone || msg.content === 'This message was deleted by sender' || msg.text === 'This message was deleted by sender' ? (
                                  <div className="my-xs max-w-sm">
                                    <div className="flex items-center gap-xs px-md py-xs rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-dashed border-rose-400/40 text-neutral-600 dark:text-neutral-300 text-xs backdrop-blur-xs shadow-xs">
                                      <Ban className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                      <span className="italic font-medium text-[11px] opacity-90">
                                        This message was deleted by sender
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`text-[13.5px] leading-relaxed relative overflow-hidden transition-all ${isMe ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-500 dark:to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-xs px-3.5 py-1.5' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 rounded-2xl rounded-tl-xs px-3.5 py-1.5 shadow-xs'}`}>
                                    {msg.replyTo && <div className={`p-1 px-2 rounded-lg border text-xs mb-1 ${isMe ? 'bg-black/25 text-white border-white/90' : 'bg-primary-500/10 text-neutral-800 dark:text-neutral-100 border-primary-500'}`}><p className="font-bold">{msg.replyTo.name}</p><p className="truncate mt-xs">{msg.replyTo.text}</p></div>}
                                    {msg.poll && (
                                      <div className="my-2 p-3.5 rounded-2xl bg-neutral-900/95 border border-neutral-800 text-neutral-100 text-xs space-y-3 max-w-sm shadow-xl backdrop-blur-md">
                                        <div className="flex items-center justify-between gap-2 font-bold text-neutral-100">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                              <BarChart2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-extrabold text-white truncate">{msg.poll.question}</span>
                                          </div>
                                          <span className="text-[10px] font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex-shrink-0">
                                            {msg.poll.pollType === 'multiple' ? 'Multiple' : 'Single'}
                                          </span>
                                        </div>

                                        <div className="space-y-2">
                                          {msg.poll.options?.map((opt, oIdx) => {
                                            const votedUsers = Array.isArray(opt.votedUsers)
                                              ? opt.votedUsers
                                              : (opt.selected ? [user?.uid || 'guest'] : []);
                                            const votesCount = votedUsers.length || opt.votes || 0;
                                            const totalVotes = (msg.poll.options || []).reduce((sum, o) => {
                                              const vList = Array.isArray(o.votedUsers) ? o.votedUsers : (o.selected ? [user?.uid || 'guest'] : []);
                                              return sum + (vList.length || o.votes || 0);
                                            }, 0);

                                            const isVotedByMe = user?.uid && votedUsers.includes(user.uid);
                                            const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                                            const voterDetails = opt.votedUserDetails || votedUsers.map(uid => ({
                                              uid,
                                              name: (uid === user?.uid ? user?.name : 'Student'),
                                              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
                                            }));

                                            return (
                                              <button
                                                key={oIdx}
                                                type="button"
                                                onClick={() => handleGroupPollVote(msg.id, oIdx)}
                                                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between text-xs group ${
                                                  isVotedByMe
                                                    ? 'border-indigo-500/60 bg-indigo-500/15 font-bold shadow-xs'
                                                    : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800'
                                                }`}
                                              >
                                                <div
                                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                                                    isVotedByMe ? 'bg-indigo-500/25' : 'bg-neutral-700/30'
                                                  }`}
                                                  style={{ width: `${percent}%` }}
                                                />

                                                <div className="relative z-10 flex items-center gap-2 min-w-0 pr-2">
                                                  {isVotedByMe ? (
                                                    <CheckCircle2 className="w-4 h-4 text-indigo-400 fill-indigo-400/20 flex-shrink-0" />
                                                  ) : (
                                                    <div className="w-4 h-4 rounded-full border border-neutral-600 flex-shrink-0 group-hover:border-neutral-400" />
                                                  )}
                                                  <span className={`truncate text-xs ${isVotedByMe ? 'text-white font-bold' : 'text-neutral-200 font-medium'}`}>
                                                    {opt.text}
                                                  </span>
                                                </div>

                                                <div className="relative z-10 flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                                                  {voterDetails.length > 0 && (
                                                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                                                      {voterDetails.slice(0, 3).map((voter, vIdx) => (
                                                        <img
                                                          key={vIdx}
                                                          src={voter.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${voter.name}`}
                                                          alt={voter.name}
                                                          title={voter.name}
                                                          className="w-4 h-4 rounded-full ring-1 ring-neutral-900 object-cover"
                                                        />
                                                      ))}
                                                    </div>
                                                  )}
                                                  <span className={`font-bold ${isVotedByMe ? 'text-indigo-300' : 'text-neutral-400'}`}>
                                                    {percent}%
                                                  </span>
                                                  <span className="text-[10px] text-neutral-500 font-medium">({votesCount})</span>
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold pt-1 border-t border-neutral-800/60">
                                          <span>
                                            {(msg.poll.options || []).reduce((sum, o) => sum + ((o.votedUsers?.length) || o.votes || 0), 0) || 0} Total Votes
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setViewVotesPoll(msg.poll); }}
                                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                          >
                                            <Users className="w-3.5 h-3.5" />
                                            <span>View Votes</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {msg.fileUrl && (
                                      <div className="mb-md p-md rounded-xl bg-black/10 flex items-center justify-between gap-md">
                                        <div className="flex items-center gap-sm text-xs font-semibold truncate"><FileText className="w-4 h-4 flex-shrink-0" /> {msg.fileName || 'Attachment'}</div>
                                        <a href={msg.fileUrl} download={msg.fileName || 'file'} target="_blank" rel="noreferrer" className="p-xs hover:bg-black/10 rounded"><Download className="w-3.5 h-3.5" /></a>
                                      </div>
                                    )}
                                    <div className="relative inline-block max-w-full">
                                      <span className="text-[13.5px] leading-snug break-words font-normal">{msg.content}</span>
                                      {msg.edited && <span className="text-[9px] opacity-60 ml-xs italic">(edited)</span>}
                                      {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline-block ml-1" title="Starred message" />}

                                      {/* WhatsApp / Instagram Style Inline Timestamp & Working Green Vector Tick */}
                                      <span className="inline-flex items-center gap-1 float-right mt-1 ml-2.5 text-[10px] leading-none select-none">
                                        <span className={isMe ? 'text-white/75' : 'text-neutral-500 dark:text-neutral-400 font-medium'}>
                                          {formatTime(msg.timestamp)}
                                        </span>
                                        {isMe && (
                                          <CheckCheck
                                            className={`w-3.5 h-3.5 stroke-[2.8] transition-colors duration-300 ${
                                              isSeen
                                                ? 'text-emerald-300 dark:text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                                                : 'text-white/50 dark:text-neutral-400'
                                            }`}
                                            title={isSeen ? "Seen (Green Tick)" : "Sent to group"}
                                          />
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Message Hover Actions */}
                                {!isSelectMode && !msg.isDeletedForEveryone && msg.content !== 'This message was deleted by sender' && msg.text !== 'This message was deleted by sender' && (
                                  <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-md px-md py-[3px] z-10 ${isMe ? 'right-full mr-md' : 'left-full ml-md'}`}>
                                    <button onClick={() => setCommunityReplyingTo(msg)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleStarGroupMessage(msg.id)} className={`p-xs ${isStarred ? 'text-amber-500' : 'text-neutral-400 hover:text-amber-500'}`} title={isStarred ? 'Unstar' : 'Star'}><Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} /></button>
                                    <button onClick={() => handleCopyMsgText(msg.content)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Copy text"><Copy className="w-3.5 h-3.5" /></button>
                                    {isMe && <button onClick={() => handleStartEditMsg(msg)} className="text-neutral-400 hover:text-primary-500 p-xs" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                                    <button onClick={() => handleTogglePinMsg(msg)} className="text-neutral-400 hover:text-amber-500 p-xs" title="Pin message"><Pin className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleRequestDeleteMsg(msg)} className="text-neutral-400 hover:text-rose-500 p-xs" title="Delete message"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </SwipeableMessageRow>
                        </div>
                      );
                    })}
              </div>

              {/* Chat Input Bar */}
              <div className="flex-shrink-0 z-30 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 p-2 sm:p-3 shadow-lg">
                {editingMsg && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-sm flex justify-between items-center text-xs mb-xs">
                    <div className="flex-1 min-w-0 mr-md">
                      <span className="font-bold text-amber-700 dark:text-amber-400">Editing message:</span>
                      <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditMsg()} className="w-full bg-white dark:bg-neutral-800 border rounded px-md py-xs mt-xs text-xs outline-none" autoFocus />
                    </div>
                    <div className="flex items-center gap-xs">
                      <button onClick={handleSaveEditMsg} className="p-xs bg-amber-500 text-white rounded"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingMsg(null)} className="p-xs text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
                {attachedGroupFile && (
                  <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg p-sm flex justify-between items-center text-xs mb-xs">
                    <span className="font-semibold text-primary-600 dark:text-primary-400 truncate">📎 {attachedGroupFile.name}</span>
                    <button onClick={() => setAttachedGroupFile(null)} className="text-neutral-400 hover:text-neutral-600 ml-md"><X className="w-4 h-4" /></button>
                  </div>
                )}
                {communityReplyingTo && <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-sm flex justify-between items-center text-xs mb-xs"><div className="min-w-0"><span className="font-semibold text-[10px] text-neutral-400">Replying to {communityReplyingTo.sender?.name}</span><p className="truncate text-neutral-600 dark:text-neutral-300 mt-xs">{communityReplyingTo.content}</p></div><button onClick={() => setCommunityReplyingTo(null)} className="text-neutral-400 hover:text-neutral-600 ml-md"><X className="w-4 h-4" /></button></div>}

                <div className="flex gap-md items-center relative">
                  <input type="file" ref={groupFileInputRef} onChange={handleGroupFileChange} className="hidden" />

                  {/* Attachment Popover */}
                  <div className="relative">
                    <button onClick={() => setShowAttachMenuPop(!showAttachMenuPop)} className="p-md text-neutral-400 hover:text-purple-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-full flex-shrink-0 transition-colors cursor-pointer" title="Attach Options">
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {showAttachMenuPop && (
                      <div className="absolute bottom-full mb-2 left-0 z-50 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 text-xs font-semibold space-y-1">
                        <button
                          type="button"
                          onClick={() => { groupFileInputRef.current?.click(); setShowAttachMenuPop(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Image className="w-4 h-4 text-sky-500" />
                          <span>Photos / Gallery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsCreatePollOpen(true); setShowAttachMenuPop(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <BarChart2 className="w-4 h-4 text-purple-500" />
                          <span>Create Poll</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { groupFileInputRef.current?.click(); setShowAttachMenuPop(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-amber-500" />
                          <span>Attach File / Doc</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Container */}
                  <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-md py-sm flex items-center gap-md relative">
                    <input type="text" placeholder="Type a message..." value={communityMsgText} onChange={(e) => setCommunityMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendGroupMessage()} className="bg-transparent text-sm outline-none flex-1 py-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400" />

                    {/* Crazy Emoji Picker Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPickerPop(!showEmojiPickerPop)}
                      className={`p-xs transition-colors cursor-pointer ${showEmojiPickerPop ? 'text-purple-500' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                      title="Crazy Emoji Packs"
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>

                    {/* WhatsApp Style Emoji Picker Drawer / Popover */}
                    {showEmojiPickerPop && (
                      <>
                        <div
                          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-xs sm:bg-transparent"
                          onClick={() => setShowEmojiPickerPop(false)}
                        />

                        <div className="absolute bottom-full left-0 right-0 mb-3 sm:left-auto sm:right-0 sm:mb-3 w-full sm:w-80 h-72 sm:h-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 rounded-3xl shadow-2xl p-3 text-xs flex flex-col transition-all z-[100]">
                          <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-2 sm:hidden flex-shrink-0" />

                          <div className="flex items-center gap-1 pb-2 border-b border-neutral-100 dark:border-neutral-800 mb-2 overflow-x-auto scrollbar-none flex-shrink-0">
                            {allPacks.map((pack, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setActiveEmojiPack(pIdx)}
                                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                  activeEmojiPack === pIdx
                                    ? 'bg-purple-500 text-white shadow-xs'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                              >
                                <span>{pack.name}</span>
                                {pack.id === 'recents' && (
                                  <span className="text-[9px] opacity-75 font-mono">({pack.emojis.length})</span>
                                )}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                            {allPacks[activeEmojiPack]?.emojis.length > 0 ? (
                              allPacks[activeEmojiPack].emojis.map((emo, eIdx) => (
                                <button
                                  key={eIdx}
                                  type="button"
                                  onClick={() => {
                                    setCommunityMsgText(prev => prev + emo);
                                    handleAddRecentEmoji(emo);
                                  }}
                                  className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-xl sm:text-lg rounded-xl hover:bg-purple-500/15 active:scale-125 transition-transform cursor-pointer"
                                >
                                  {emo}
                                </button>
                              ))
                            ) : (
                              <div className="col-span-full py-8 text-center text-neutral-400 text-xs italic">
                                No recent emojis used yet. Tap any emoji to save here!
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  </div>

                  <button onClick={handleSendGroupMessage} className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md shadow-sky-500/30 cursor-pointer"><Send className="w-4 h-4" /></button>
                </div>
              </div>

            </div>
          </div>
        )}
      </Card>
    )}
      </div>
      </div>

      {/* ── CREATE A POLL MODAL ── */}
      <Modal isOpen={isCreatePollOpen} onClose={() => setIsCreatePollOpen(false)} title="Create Campus Poll" size="md">
        <form onSubmit={handleCreatePoll} className="space-y-5 py-1">
          {/* Question Input */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Poll Question</span>
              <span className="text-[10px] text-neutral-500 font-normal">Required</span>
            </label>
            <input
              type="text"
              placeholder="e.g. When should we schedule the exam review?"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-all font-medium"
            />
          </div>

          {/* Voting Mode Toggle (Single vs Multiple choice) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Voting Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-900/80 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setPollType('single')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  pollType === 'single'
                    ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${pollType === 'single' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Single Choice</span>
              </button>
              <button
                type="button"
                onClick={() => setPollType('multiple')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  pollType === 'multiple'
                    ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <CheckSquare className={`w-4 h-4 ${pollType === 'multiple' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Multiple Choice</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium px-1">
              {pollType === 'single'
                ? 'Students can select only one answer.'
                : 'Students can select multiple answers.'}
            </p>
          </div>

          {/* Poll Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Poll Options ({pollOptions.length}/6)
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">Min 2 options</span>
            </div>
            <div className="space-y-2.5">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const n = [...pollOptions];
                        n[idx] = e.target.value;
                        setPollOptions(n);
                      }}
                      className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 font-medium transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-500">
                      #{idx + 1}
                    </span>
                  </div>
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                      className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex gap-3 pt-3 border-t border-neutral-800/80">
            <Button
              variant="secondary"
              type="button"
              className="flex-1 rounded-2xl py-3 text-xs font-semibold cursor-pointer border-neutral-800 text-neutral-300 hover:bg-neutral-800"
              onClick={() => setIsCreatePollOpen(false)}
            >
              Cancel
            </Button>
            <button
              type="submit"
              onClick={handleCreatePoll}
              className="flex-1 rounded-2xl py-3 text-xs font-bold bg-white text-neutral-900 hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
            >
              Publish Poll
            </button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp-Style Poll Votes Breakdown Modal */}
      <Modal isOpen={Boolean(viewVotesPoll)} onClose={() => setViewVotesPoll(null)} title="Poll Votes Breakdown" size="md">
        <div className="space-y-4 py-1">
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Question</span>
              <h4 className="text-sm font-extrabold text-white mt-0.5 truncate">{viewVotesPoll?.question}</h4>
            </div>
            <span className="text-[10px] font-bold text-sky-300 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/25 flex-shrink-0">
              {(viewVotesPoll?.options || []).reduce((sum, o) => {
                const vList = Array.isArray(o.votedUserDetails) ? o.votedUserDetails : (Array.isArray(o.votedUsers) ? o.votedUsers : []);
                return sum + (vList.length || o.votes || 0);
              }, 0)} Total Votes
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
            {viewVotesPoll?.options?.map((opt, idx) => {
              const voters = (Array.isArray(opt.votedUserDetails) && opt.votedUserDetails.length > 0)
                ? opt.votedUserDetails
                : (Array.isArray(opt.votedUsers) && opt.votedUsers.length > 0
                    ? opt.votedUsers.map(u => ({ uid: u, name: u === user?.uid ? (user?.name || 'Student') : 'Student', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u}` }))
                    : (opt.votes > 0
                        ? Array.from({ length: opt.votes }).map((_, i) => ({ uid: `v_${i}`, name: i === 0 && user?.name ? user.name : `Student ${i + 1}`, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user?.email || 's') + i}` }))
                        : []));

              return (
                <div key={idx} className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="text-white font-extrabold">{opt.text}</span>
                    <span className="text-neutral-400 font-mono text-[11px]">{voters.length} {voters.length === 1 ? 'vote' : 'votes'}</span>
                  </div>

                  {voters.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {voters.map((voter, vIdx) => (
                        <div key={vIdx} className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/60 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={voter.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(voter.name || 'Student')}`}
                              alt={voter.name}
                              className="w-7 h-7 rounded-full object-cover border border-neutral-700 flex-shrink-0"
                            />
                            <span className="font-bold text-neutral-200 truncate">{voter.name || 'Student'}</span>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-500 italic px-1">No votes for this option yet.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-800 flex justify-end">
            <Button variant="secondary" onClick={() => setViewVotesPoll(null)} className="rounded-2xl px-5 text-xs font-semibold">
              Close
            </Button>
          </div>
        </div>
      </Modal>


      <Modal isOpen={isShareFileOpen} onClose={() => setIsShareFileOpen(false)} title="Share Resource" size="md">
        <form onSubmit={handleShareFile} className="space-y-lg">
          <Input label="Resource Title" placeholder="e.g. Network Security Notes.pdf" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Category</label>
            <select value={newFileCategory} onChange={(e) => setNewFileCategory(e.target.value)} className="input-base">{fileCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div className="flex gap-md pt-md"><Button variant="secondary" className="flex-1" onClick={() => setIsShareFileOpen(false)}>Cancel</Button><Button variant="primary" type="submit" className="flex-1">Share File</Button></div>
        </form>
      </Modal>

      {/* ── CREATE A COMMUNITY MODAL ── */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create a Community" size="md">
        <form onSubmit={handleCreateCommunity} className="space-y-5 py-1">
          {/* Avatar Upload */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Community Profile Photo</label>
            <input
              type="file"
              ref={createAvatarFileRef}
              accept="image/*"
              onChange={(e) => handleAvatarFileSelect(e, setNewGroupAvatar)}
              className="hidden"
            />
            <div className="flex items-center gap-md">
              {newGroupAvatar ? (
                <div className="relative group/avatar flex-shrink-0">
                  <img src={newGroupAvatar} alt="Preview" className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-primary-500" />
                  <button
                    type="button"
                    onClick={() => createAvatarFileRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Change photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => createAvatarFileRef.current?.click()}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:opacity-90 flex flex-col items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md transition-all group cursor-pointer"
                  title="Upload photo"
                >
                  <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] mt-0.5 opacity-80">Upload</span>
                </button>
              )}
              <div className="flex-1 min-w-0 space-y-xs">
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    onClick={() => createAvatarFileRef.current?.click()}
                    className="px-md py-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Upload File
                  </button>
                  {newGroupAvatar && (
                    <button
                      type="button"
                      onClick={() => setNewGroupAvatar('')}
                      className="px-md py-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or paste Image URL..."
                  value={newGroupAvatar}
                  onChange={(e) => setNewGroupAvatar(e.target.value)}
                  className="input-base text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Community Name *</label>
            <input type="text" placeholder="e.g. AI Club, Study Squad, CSE 3rd Year" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 font-medium" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea placeholder="What is this community about?" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 font-medium resize-none" />
          </div>

          {/* 1. Community Visibility */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">1. Community Visibility</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: 'public', Icon: Globe, label: 'Public Community', desc: 'Appears on main page & discoverable by everyone' },
                { val: 'private', Icon: Lock, label: 'Private Community', desc: 'Not publicly discoverable. Invite/link access only' }
              ].map(({ val, Icon, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNewGroupVisibility(val)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    newGroupVisibility === val
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <span>{label}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Community Audience */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">2. Community Audience</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: 'everyone', Icon: Users, label: 'Everyone', desc: 'Available to students regardless of their college' },
                { val: 'college_only', Icon: ShieldCheck, label: 'College Only', desc: `Restricted to members of ${user?.college || collegeName}` }
              ].map(({ val, Icon, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNewGroupAudience(val)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    newGroupAudience === val
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{label}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Joining Controls (For Public Communities) */}
          {newGroupVisibility === 'public' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">3. Joining Method</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { val: 'direct', Icon: CheckCircle2, label: 'Direct Join', desc: 'Users can join immediately without approval' },
                  { val: 'request', Icon: FileText, label: 'Request to Join', desc: 'Users must request join. Creator approval required' }
                ].map(({ val, Icon, label, desc }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewGroupJoinControl(val)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      newGroupJoinControl === val
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span>{label}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-neutral-800">
            <Button variant="secondary" type="button" className="flex-1 rounded-2xl py-3 text-xs font-semibold cursor-pointer border-neutral-800 text-neutral-300 hover:bg-neutral-800" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <button type="submit" disabled={isCreatingGroup || !newGroupName.trim()} className="flex-1 rounded-2xl py-3 text-xs font-bold bg-white text-neutral-900 hover:bg-neutral-200 transition-all cursor-pointer shadow-md disabled:opacity-50">{isCreatingGroup ? 'Creating...' : 'Create Community'}</button>
          </div>
        </form>
      </Modal>

      {/* Manage Drawer */}
      <AnimatePresence>
        {showManageDrawer && selectedRoom && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowManageDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 35 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-xl py-lg border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                <input
                  type="file"
                  ref={drawerHeaderAvatarFileRef}
                  accept="image/*"
                  onChange={(e) => handleAvatarFileSelect(e, async (newPhoto) => {
                    if (!selectedRoom?.id) return;
                    try {
                      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), { avatar: newPhoto });
                      setSelectedRoom(prev => ({ ...prev, avatar: newPhoto }));
                      setMyCommunities(prev => prev.map(c => c.id === selectedRoom.id ? { ...c, avatar: newPhoto } : c));
                      showSuccess('Community photo updated!');
                    } catch (err) { console.error(err); }
                  })}
                  className="hidden"
                />
                <div className="flex items-center gap-md">
                  <div className="relative group/drawerAvatar flex-shrink-0 cursor-pointer" onClick={() => canEditInfo && drawerHeaderAvatarFileRef.current?.click()}>
                    {selectedRoom?.avatar ? (
                      <img src={selectedRoom.avatar} alt={selectedRoom?.name || 'Community'} className="w-12 h-12 rounded-xl object-cover shadow-md border border-neutral-200 dark:border-neutral-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {(selectedRoom?.name || 'Community')[0].toUpperCase()}
                      </div>
                    )}
                    {canEditInfo && (
                      <div
                        className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/drawerAvatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold shadow-inner"
                        title="Edit profile photo"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>Edit</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-xs">
                      {selectedRoom?.name || 'Community'}
                      {canEditInfo && (
                        <button
                          onClick={() => drawerHeaderAvatarFileRef.current?.click()}
                          className="p-xs text-neutral-400 hover:text-primary-500 transition-colors"
                          title="Change photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </h2>
                    <p className="text-xs text-neutral-500">Group Info</p>
                  </div>
                </div>
                <button onClick={() => setShowManageDrawer(false)} className="p-md rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                {['members', 'requests', 'media', 'starred', ...(isAdmin ? ['settings'] : [])].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setManageTab(tab)}
                    className={`flex-1 py-md text-xs font-semibold capitalize transition-colors relative ${
                      manageTab === tab ? 'text-primary-500 border-b-2 border-primary-500' : 'text-neutral-500'
                    }`}
                  >
                    {tab === 'requests' ? (
                      <span className="flex items-center justify-center gap-1">
                        Requests
                        {(selectedRoom?.joinRequests || []).length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                            {(selectedRoom.joinRequests || []).length}
                          </span>
                        )}
                      </span>
                    ) : (
                      tab
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {manageTab === 'members' && (
                  <div className="p-xl space-y-lg">
                    {(selectedRoom.type !== 'private' || isAdmin) ? (
                      <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-lg">
                        <div className="flex items-center gap-md mb-md"><div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white"><Link2 className="w-4 h-4" /></div><div><p className="font-bold text-sm">Invite Link</p><p className="text-xs text-neutral-500">Share to invite people</p></div></div>
                        <div className="flex items-center gap-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-md py-sm text-xs text-neutral-500 font-mono mb-md overflow-hidden"><span className="truncate flex-1">{`https://cohortnow.online/community?join=${selectedRoom.id}`}</span></div>
                        <button onClick={handleCopyInviteLink} className="w-full flex items-center justify-center gap-md bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm py-md rounded-xl transition-colors"><Copy className="w-4 h-4" /> Copy Invite Link</button>
                        <button onClick={handleOpenInviteModal} className="w-full flex items-center justify-center gap-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm py-md rounded-xl transition-colors mt-sm"><UserPlus2 className="w-4 h-4" /> Invite People Directly</button>
                      </div>
                    ) : (
                      <div className="bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-lg text-center">
                        <Lock className="w-6 h-6 text-neutral-400 mx-auto mb-xs" />
                        <p className="font-semibold text-xs text-neutral-600 dark:text-neutral-300">Private Community</p>
                        <p className="text-[10px] text-neutral-400 mt-xs">Only admins can invite new members to this group.</p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300 mb-md">{(selectedRoom.members || []).length} Members</h3>
                      {loadingMembers ? <div className="space-y-md">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}</div> : (
                        <div className="space-y-xs">
                          {communityMembers.map(member => {
                            const memberIsAdmin = (selectedRoom.admins || []).includes(member.uid);
                            const memberIsCreator = selectedRoom.creatorUid === member.uid;
                            const isMeViewing = member.uid === user?.uid;
                            return (
                              <div key={member.uid} className="flex items-center gap-md p-md rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                                <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.email || member.name || member.uid)}`} alt={member.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-xs">
                                    <p className="font-semibold text-sm truncate">{member.name || 'Unknown'}</p>
                                    {memberIsCreator && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-xs flex-shrink-0"><Crown className="w-3 h-3" /> Creator</span>}
                                    {memberIsAdmin && !memberIsCreator && <span className="text-[9px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-xs flex-shrink-0"><Shield className="w-3 h-3" /> Admin</span>}
                                  </div>
                                  <p className="text-xs text-neutral-400 truncate">{member.college || member.email || ''}</p>
                                </div>
                                {isAdmin && !isMeViewing && !memberIsCreator && (
                                  <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    {memberIsAdmin ? <button onClick={() => handleDemoteAdmin(member.uid)} title="Remove Admin" className="p-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-amber-500"><Shield className="w-4 h-4" /></button> : <button onClick={() => handlePromoteAdmin(member.uid)} title="Make Admin" className="p-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-primary-500"><ShieldCheck className="w-4 h-4" /></button>}
                                    <button onClick={() => setMemberToRemove(member)} title="Remove" className="p-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-rose-500"><UserMinus className="w-4 h-4" /></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {manageTab === 'requests' && (
                  <div className="p-xl space-y-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                        Pending Join Requests ({(selectedRoom?.joinRequests || []).length})
                      </h3>
                      <span className="text-[10px] text-neutral-400 font-medium">Approval Required</span>
                    </div>

                    {(selectedRoom?.joinRequests || []).length === 0 ? (
                      <div className="text-center py-2xl">
                        <ShieldCheck className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                        <p className="text-sm font-semibold text-neutral-500">No pending join requests</p>
                        <p className="text-xs text-neutral-400 mt-xs">When users request to join this community, their requests will appear here for your approval.</p>
                      </div>
                    ) : (
                      <div className="space-y-sm">
                        {(selectedRoom.joinRequests || []).map((req, rIdx) => {
                          const reqUid = typeof req === 'string' ? req : req.uid;
                          const reqName = typeof req === 'string' ? 'Student' : (req.name || 'Student');
                          const reqAvatar = typeof req === 'string' ? null : req.avatar;
                          const reqCollege = typeof req === 'string' ? '' : (req.college || req.email || '');

                          return (
                            <div key={reqUid || rIdx} className="p-md rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between gap-md shadow-xs">
                              <div className="flex items-center gap-md min-w-0">
                                <img
                                  src={reqAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(reqName)}`}
                                  alt={reqName}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200 truncate">{reqName}</p>
                                  <p className="text-[10px] text-neutral-400 truncate">{reqCollege}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-xs flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptRequest(req)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectRequest(req)}
                                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-rose-500 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {manageTab === 'media' && (
                  <div className="p-xl space-y-md">
                    <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300 mb-md">Shared Media & Files</h3>
                    {(() => {
                      const mediaMsgs = communityMessages.filter(m => m.fileUrl || m.fileName || (m.content && (m.content.includes('📎 Attached:') || m.content.includes('http'))));
                      return mediaMsgs.length === 0 ? (
                        <div className="text-center py-2xl">
                          <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                          <p className="text-sm text-neutral-500">No media or files shared yet</p>
                        </div>
                      ) : (
                        <div className="space-y-sm">
                          {mediaMsgs.map(m => (
                            <div key={m.id} className="p-md rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-between gap-md">
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate">{m.fileName || m.content}</p>
                                <p className="text-[10px] text-neutral-400 mt-xs">Shared by {m.sender?.name} · {formatTime(m.timestamp)}</p>
                              </div>
                              {m.fileUrl && (
                                <a href={m.fileUrl} download={m.fileName || 'file'} target="_blank" rel="noreferrer" className="p-xs text-primary-500 hover:bg-primary-50 dark:hover:bg-neutral-700 rounded-lg flex-shrink-0">
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                 {manageTab === 'starred' && (
                  <div className="p-xl space-y-md">
                    <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300 mb-md">Starred Messages</h3>
                    {(() => {
                      const isCollege = isCollegeRoom || selectedRoom?.roomType === 'college';
                      const targetMsgs = isCollege ? messages : communityMessages;
                      const starredMsgs = targetMsgs.filter(m => Array.isArray(m.starredBy) && m.starredBy.includes(user?.uid));
                      return starredMsgs.length === 0 ? (
                        <div className="text-center py-2xl">
                          <Star className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                          <p className="text-sm text-neutral-500">No starred messages in this group</p>
                        </div>
                      ) : (
                        <div className="space-y-sm">
                          {starredMsgs.map(m => (
                            <div key={m.id} className="p-md rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 space-y-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-primary-600 dark:text-primary-400">{m.sender?.name}</span>
                                <button onClick={() => handleStarGroupMessage(m.id)} className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-xs">
                                  <Star className="w-3 h-3 fill-amber-400" /> Unstar
                                </button>
                              </div>
                              <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{m.content}</p>
                              <p className="text-[10px] text-neutral-400 text-right">{formatTime(m.timestamp)}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {manageTab === 'settings' && (
                  <div className="p-xl space-y-lg">
                    <div><label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Community Name</label><input type="text" value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} className="input-base" /></div>
                    <div><label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Description</label><textarea value={editGroupDesc} onChange={(e) => setEditGroupDesc(e.target.value)} rows={3} className="input-base resize-none" /></div>

                    {/* 1. Visibility Setting */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">1. Community Visibility</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { val: 'public', Icon: Globe, label: 'Public Community', desc: 'Appears on main page & discoverable' },
                          { val: 'private', Icon: Lock, label: 'Private Community', desc: 'Hidden from public listing' }
                        ].map(({ val, Icon, label, desc }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEditGroupVisibility(val)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              editGroupVisibility === val
                                ? 'border-purple-500 bg-purple-500/10 text-white'
                                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-xs mb-1">
                              <Icon className="w-4 h-4 text-purple-400" />
                              <span>{label}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Audience Setting */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">2. Community Audience</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { val: 'everyone', Icon: Users, label: 'Everyone', desc: 'Available to all colleges' },
                          { val: 'college_only', Icon: ShieldCheck, label: 'College Only', desc: `Restricted to ${user?.college || collegeName}` }
                        ].map(({ val, Icon, label, desc }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEditGroupAudience(val)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              editGroupAudience === val
                                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-xs mb-1">
                              <Icon className="w-4 h-4 text-indigo-400" />
                              <span>{label}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Joining Controls Setting */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">3. Joining Controls</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { val: 'direct', Icon: CheckCircle2, label: 'Direct Join', desc: 'Users join immediately' },
                          { val: 'request', Icon: FileText, label: 'Request to Join', desc: 'Requires admin approval' }
                        ].map(({ val, Icon, label, desc }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEditGroupJoinControl(val)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              editGroupJoinControl === val
                                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-xs mb-1">
                              <Icon className="w-4 h-4 text-emerald-400" />
                              <span>{label}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>


                    {/* Creator Admin Permission Settings */}
                    {isCreator && (
                      <div className="p-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-md">
                        <div className="flex items-center gap-md">
                          <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-xs text-indigo-950 dark:text-indigo-200">Admin Permissions (Creator Controls)</p>
                            <p className="text-[10px] text-neutral-500">Decide what admins are allowed to do in this community:</p>
                          </div>
                        </div>

                        <div className="space-y-sm pt-xs">
                          {[
                            { key: 'canEditInfo', label: 'Edit Group Info & Photo', desc: 'Allow admins to change group title, description & photo' },
                            { key: 'canInviteMembers', label: 'Invite Members', desc: 'Allow admins to create invite links & send invites' },
                            { key: 'canRemoveMembers', label: 'Remove Members', desc: 'Allow admins to remove members from group' },
                            { key: 'canPromoteAdmins', label: 'Promote Admins', desc: 'Allow admins to promote other members to admin' },
                            { key: 'canDeleteMessages', label: 'Delete Messages', desc: 'Allow admins to delete member messages for everyone' },
                          ].map(perm => (
                            <label key={perm.key} className="flex items-start gap-md p-md bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700/60 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editAdminPermissions[perm.key] !== false}
                                onChange={(e) => setEditAdminPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                                className="mt-0.5 accent-primary-500 w-4 h-4 rounded"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{perm.label}</p>
                                <p className="text-[10px] text-neutral-400 mt-xs">{perm.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button variant="primary" className="w-full" onClick={handleSaveGroupSettings}><Check className="w-4 h-4 mr-xs inline" /> Save Changes</Button>
                    {isCreator && (
                      <div className="mt-xl pt-xl border-t border-neutral-100 dark:border-neutral-800">
                        <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 mb-md">Danger Zone</h3>
                        {!showDeleteConfirm ? (
                          <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-center gap-md border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-semibold text-sm py-md rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"><Trash2 className="w-4 h-4" /> Delete Community</button>
                        ) : (
                          <div className="border border-rose-200 dark:border-rose-800 rounded-2xl p-lg bg-rose-50/50 dark:bg-rose-950/10 space-y-md">
                            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 text-center">Are you sure? This cannot be undone.</p>
                            <div className="flex gap-md"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-md rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors">Cancel</button><button onClick={handleDeleteGroup} className="flex-1 py-md rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors">Delete</button></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── INVITE PEOPLE MODAL ── */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl z-[61] flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-xl py-lg border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                <div>
                  <h2 className="font-bold text-neutral-900 dark:text-white">Invite People</h2>
                  <p className="text-xs text-neutral-500 mt-xs">Invite to <span className="font-semibold text-primary-500">{selectedRoom?.name}</span></p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-md rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="px-xl pt-lg pb-md flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl pl-2xl py-sm pr-md text-sm outline-none focus:ring-2 focus:ring-primary-500 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto px-xl pb-xl scrollbar-thin">
                {loadingInviteUsers ? (
                  <div className="space-y-md">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
                        <div className="flex-1 space-y-xs"><div className="h-3 skeleton rounded w-2/3"/><div className="h-2.5 skeleton rounded w-1/2"/></div>
                        <div className="w-16 h-8 skeleton rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const filtered = inviteUsers.filter(u =>
                    !inviteSearch || (u.name || '').toLowerCase().includes(inviteSearch.toLowerCase()) || (u.username || '').toLowerCase().includes(inviteSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(inviteSearch.toLowerCase())
                  );
                  return filtered.length === 0 ? (
                    <div className="text-center py-2xl">
                      <UserPlus2 className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                      <p className="text-sm text-neutral-500">{inviteSearch ? 'No users found' : 'No users available to invite'}</p>
                    </div>
                  ) : (
                    <div className="space-y-xs">
                      {filtered.map(u => {
                        const alreadySent = sentInvites[u.uid];
                        const connectionLabel = u.isFollowing && u.isFollower ? 'Mutual' : u.isFollowing ? 'Following' : u.isFollower ? 'Follows you' : null;
                        return (
                          <div key={u.uid} className="flex items-center gap-md py-sm">
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || u.uid)}`}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{u.name || 'Unknown'}</p>
                              <div className="flex items-center gap-xs mt-xs">
                                {connectionLabel && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${connectionLabel === 'Mutual' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : connectionLabel === 'Following' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'}`}>
                                    {connectionLabel}
                                  </span>
                                )}
                                <span className="text-xs text-neutral-400 truncate">{u.college || u.email || ''}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => !alreadySent && handleSendDirectInvite(u)}
                              disabled={alreadySent}
                              className={`flex-shrink-0 flex items-center gap-xs px-md py-sm rounded-xl text-xs font-semibold transition-all ${
                                alreadySent
                                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                  : 'bg-primary-500 hover:bg-primary-600 text-white hover:scale-105 active:scale-95'
                              }`}
                            >
                              {alreadySent ? (
                                <><Check className="w-3.5 h-3.5" /> Sent</>
                              ) : (
                                <><UserPlus2 className="w-3.5 h-3.5" /> Invite</>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ── AUTO CLEAR CHAT MODAL ── */}
      <Modal isOpen={isAutoClearModalOpen} onClose={() => setIsAutoClearModalOpen(false)} title="Auto Clear Chat Settings" size="md">
        <div className="space-y-lg">
          <div className="flex items-center gap-md p-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <EyeOff className="w-6 h-6 text-purple-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs text-purple-700 dark:text-purple-300">Local Auto-Delete (My Side Only)</p>
              <p className="text-[10px] text-purple-600/80 dark:text-purple-400">Messages older than the chosen duration will automatically disappear from your chat view.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-sm">Select Auto-Delete Duration</label>
            <div className="grid grid-cols-2 gap-sm">
              {[
                { label: 'Disabled', val: 0 },
                { label: '5 Minutes', val: 300 },
                { label: '1 Hour', val: 3600 },
                { label: '24 Hours', val: 86400 },
                { label: '7 Days', val: 604800 }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setAutoClearDuration(opt.val)}
                  className={`p-md rounded-xl border text-xs font-semibold transition-all text-left ${autoClearDuration === opt.val ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-md border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="primary" size="sm" onClick={() => { setIsAutoClearModalOpen(false); showSuccess('Auto Clear Chat settings saved!'); }}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM CLEAR CHAT MODAL ── */}
      <Modal isOpen={showConfirmClearChatModal} onClose={() => setShowConfirmClearChatModal(false)} title="Clear Chat History?" size="sm">
        <div className="space-y-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to clear chat history for yourself in <span className="font-bold text-neutral-900 dark:text-white">"{selectedRoom?.name}"</span>? Messages will be cleared for your account.
          </p>
          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirmClearChatModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-amber-500 hover:bg-amber-600 border-amber-500" onClick={handleClearChatForMe}>Clear Chat</Button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM REMOVE MEMBER MODAL ── */}
      <Modal isOpen={!!memberToRemove} onClose={() => setMemberToRemove(null)} title="Remove Member?" size="sm">
        <div className="space-y-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to remove <span className="font-bold text-neutral-900 dark:text-white">"{memberToRemove?.name || 'this member'}"</span> from <span className="font-bold text-neutral-900 dark:text-white">"{selectedRoom?.name}"</span>?
          </p>
          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setMemberToRemove(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-rose-600 hover:bg-rose-700 border-rose-600 text-white" onClick={() => handleRemoveMember(memberToRemove?.uid)}>Remove Member</Button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM LEAVE COMMUNITY MODAL ── */}
      <Modal isOpen={!!leaveCommunityModal} onClose={() => setLeaveCommunityModal(null)} title="Leave Community?" size="sm">
        <div className="space-y-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to leave <span className="font-bold text-neutral-900 dark:text-white">"{leaveCommunityModal?.name}"</span>? You will need an invite to join back if it's private.
          </p>
          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setLeaveCommunityModal(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-rose-600 hover:bg-rose-700 border-rose-600 text-white" onClick={handleLeaveCommunity}>Leave Community</Button>
          </div>
        </div>
      </Modal>

      {/* ── GLOBAL ALL COMMUNITY STARRED MESSAGES MODAL ── */}
      <Modal
        isOpen={isGlobalStarredModalOpen}
        onClose={() => setIsGlobalStarredModalOpen(false)}
        title="All Starred Community Messages"
      >
        <div className="space-y-md max-h-[60vh] overflow-y-auto pr-xs">
          {allStarredCommunityMsgs.length === 0 ? (
            <div className="text-center py-3xl">
              <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
              <p className="text-sm text-neutral-500 font-semibold">No starred messages in any community yet</p>
              <p className="text-xs text-neutral-400 mt-xs">Star important messages in any community chat to save them here.</p>
            </div>
          ) : (
            allStarredCommunityMsgs.map((sMsg) => (
              <div
                key={sMsg.id}
                onClick={() => handleJumpToStarredMessage(sMsg)}
                className="p-md rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer space-y-xs group"
              >
                <div className="flex items-center justify-between gap-md">
                  <div className="flex items-center gap-xs min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[10px] truncate">
                      {sMsg.roomName}
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {sMsg.sender?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarGroupMessage(sMsg.id);
                    }}
                    className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-xs p-xs rounded hover:bg-amber-500/10 transition-colors flex-shrink-0"
                    title="Unstar message"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
                  {sMsg.content}
                </p>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-xs">
                  <span className="text-amber-500 group-hover:underline font-semibold flex items-center gap-xs">
                    Tap to open in chat →
                  </span>
                  <span>{formatTime(sMsg.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* ── CONFIRM DELETE INDIVIDUAL MESSAGE MODAL ── */}
      <Modal
        isOpen={!!msgToDeleteModal}
        onClose={() => setMsgToDeleteModal(null)}
        title="Delete Message?"
        size="sm"
      >
        <div className="space-y-lg">
          <div className="flex items-start gap-md p-md bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80">
            <div className="p-sm bg-rose-500/10 text-rose-500 rounded-xl flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-neutral-900 dark:text-white mb-xs">
                {msgToDeleteModal?.canEveryone ? 'Message Deletion Options' : 'Delete from your view'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 italic bg-white dark:bg-neutral-900 p-xs px-sm rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                "{msgToDeleteModal?.msg?.content || msgToDeleteModal?.msg?.text || msgToDeleteModal?.msg?.fileName || 'Message attachment'}"
              </p>
            </div>
          </div>

          {msgToDeleteModal?.canEveryone ? (
            <div className="space-y-sm">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                Choose how you would like to delete this message:
              </p>

              <button
                type="button"
                onClick={() => handleDeleteMsgForEveryone(msgToDeleteModal.msg?.id)}
                className="w-full py-md px-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete for Everyone (Both Sides)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteMsgForMe(msgToDeleteModal.msg?.id)}
                className="w-full py-md px-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 text-neutral-900 dark:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-xs cursor-pointer border border-neutral-200 dark:border-neutral-700"
              >
                <User className="w-4 h-4 text-primary-500" />
                <span>Delete for Me Only</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgToDeleteModal(null)}
                className="w-full py-xs text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-sm">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                This message will be removed only from your view.
              </p>

              <div className="flex gap-md pt-xs">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setMsgToDeleteModal(null)}
                >
                  Cancel
                </Button>

                <button
                  type="button"
                  onClick={() => handleDeleteMsgForMe(msgToDeleteModal.msg?.id)}
                  className="flex-1 py-md px-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete for Me</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
