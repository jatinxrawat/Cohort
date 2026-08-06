import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, Search, Image, Paperclip, Send, Smile, Reply,
  ArrowDown, Plus, FileText, Download, CheckCircle2, AlertCircle, BarChart2,
  Shield, UserMinus, Settings, Link2, Trash2, Lock, Globe, X, ChevronLeft,
  Check, Copy, Crown, MessageSquare, Hash, Pin, PinOff, UserPlus2, Star, Info,
  Edit3, Mic, MicOff, CheckSquare, Square, CornerUpLeft, MoreVertical, Eraser, Volume2,
  EyeOff, Bell, BellOff, Camera
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { PostCard } from '@/components/PostCard';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import {
  collection, addDoc, doc, deleteDoc, updateDoc, query,
  orderBy, onSnapshot, getDoc, getDocs, arrayUnion, arrayRemove, where
} from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/utils/firebase';

const chatEmojis = ['👍', '❤️', '🔥', '🙌', '😂', '😮'];

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


export default function Community() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showWarning } = useNotification();

  const collegeName = user?.college || 'KIET';

  // ── Layout state
  const [selectedRoom, setSelectedRoom] = useState(null); // null | { type: 'college' } | { type: 'group', id, ...data }
  const [searchQuery, setSearchQuery] = useState('');

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
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [manageTab, setManageTab] = useState('members');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupType, setEditGroupType] = useState('public');
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

  // ── Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
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
    setLoading(true);
    const fakeSenderNames = ['rahul roy', 'priya sharma', 'aditya gupta', 'arjun kumar', 'neha patel', 'rohan verma'];

    const unsubMsgs = onSnapshot(collection(db, 'community-messages'), (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const senderName = (data.sender?.name || '').toLowerCase();
        const isFake = fakeSenderNames.some(f => senderName.includes(f));
        if (isFake) deleteDoc(doc(db, 'community-messages', d.id)).catch(() => {});
        else loaded.push({ id: d.id, docId: d.id, ...data, timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()) });
      });
      loaded.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loaded);
      setLoading(false);
    }, () => setLoading(false));

    const unsubFeed = onSnapshot(collection(db, 'community-feed'), (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const name = (data.author?.name || '').toLowerCase();
        const isFake = fakeSenderNames.some(f => name.includes(f));
        if (isFake) deleteDoc(doc(db, 'community-feed', d.id)).catch(() => {});
        else loaded.push({ id: d.id, docId: d.id, ...data, timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()) });
      });
      loaded.sort((a, b) => b.timestamp - a.timestamp);
      setFeedPosts(loaded);
    });

    const unsubPolls = onSnapshot(collection(db, 'community-polls'), (snap) => {
      const loaded = [];
      snap.forEach(d => loaded.push({ id: d.id, docId: d.id, ...d.data() }));
      setPolls(loaded);
    });

    const unsubFiles = onSnapshot(collection(db, 'community-files'), (snap) => {
      const loaded = [];
      snap.forEach(d => loaded.push({ id: d.id, docId: d.id, ...d.data() }));
      setFiles(loaded);
    });

    return () => { unsubMsgs(); unsubFeed(); unsubPolls(); unsubFiles(); };
  }, []);

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

  // ── Check invite link
  useEffect(() => {
    const joinId = searchParams.get('join');
    if (!joinId || !user?.uid) return;
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
      sender: { name: senderName, avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || senderName)}`, role: user?.college || 'Student', uid: user?.uid || null },
      content: messageText.trim() + (attachedFile ? ` \n📎 Attached: ${attachedFile.name}` : ''),
      timestamp: new Date(), reactions: [],
      replyTo: replyingTo ? { name: replyingTo.sender.name, text: replyingTo.content } : null
    };
    try {
      const docRef = await addDoc(collection(db, 'community-messages'), messageData);
      setMessages(prev => [...prev, { id: docRef.id, docId: docRef.id, ...messageData }]);
      setMessageText(''); setReplyingTo(null); setAttachedFile(null);
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
        author: {
          name: senderName,
          avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || senderName)}`,
          role: user?.college || 'Student'
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
    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll) return;
    if (targetPoll.options?.some(o => o.selected)) { showWarning('Already voted!'); return; }
    const updatedOptions = targetPoll.options.map((o, idx) => idx === optIndex ? { ...o, votes: o.votes + 1, selected: true } : o);
    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, options: updatedOptions, totalVotes: p.totalVotes + 1 } : p));
    showSuccess('Vote recorded!');
    if (targetPoll.docId) { try { await updateDoc(doc(db, 'community-polls', targetPoll.docId), { options: updatedOptions, totalVotes: targetPoll.totalVotes + 1 }); } catch (e) { console.error(e); } }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
    const validOptions = pollOptions.filter(o => o.trim() !== '');
    if (validOptions.length < 2) { showWarning('At least 2 options required.'); return; }
    const newPollData = { question: pollQuestion.trim(), totalVotes: 0, options: validOptions.map(optText => ({ text: optText.trim(), votes: 0, selected: false })), createdBy: user?.name || 'Student', createdAt: new Date().toISOString() };
    try { const docRef = await addDoc(collection(db, 'community-polls'), newPollData); setPolls(prev => [{ id: docRef.id, docId: docRef.id, ...newPollData }, ...prev]); setIsCreatePollOpen(false); setPollQuestion(''); setPollOptions(['', '']); showSuccess('Poll created!'); } catch (e) { console.error(e); }
  };

  const handleShareFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const fileData = { name: newFileName.trim(), category: newFileCategory, uploadedBy: user?.name || 'Student', date: new Date().toISOString().split('T')[0], size: '1.2 MB' };
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
        type: newGroupType,
        avatar: newGroupAvatar.trim() || null,
        creatorUid: user.uid,
        admins: [user.uid],
        members: [user.uid],
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
      showSuccess(`"${groupData.name}" created!`);
    } catch (e) { console.error(e); showWarning('Failed to create.'); }
    finally { setIsCreatingGroup(false); }
  };

  const handleOpenManage = () => {
    if (!selectedRoom) return;
    setEditGroupName(selectedRoom.name);
    setEditGroupDesc(selectedRoom.description || '');
    setEditGroupType(selectedRoom.type || 'public');
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
        type: editGroupType,
        avatar: editGroupAvatar.trim() || null,
        adminPermissions: editAdminPermissions
      };
      await updateDoc(doc(db, 'userCommunities', selectedRoom.id), updatePayload);
      setSelectedRoom(prev => ({ ...prev, ...updatePayload }));
      setMyCommunities(prev => prev.map(c => c.id === selectedRoom.id ? { ...c, ...updatePayload } : c));
      showSuccess('Settings updated!'); setManageTab('members');
    } catch (e) { console.error(e); }
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
    const url = `${window.location.origin}/community?join=${selectedRoom.id}`;
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
    if (!selectedRoom?.id || !user?.uid) return;
    const msg = communityMessages.find(m => m.id === msgId);
    if (!msg) return;
    const isStarred = (msg.starredBy || []).includes(user.uid);
    const docRef = doc(db, 'userCommunities', selectedRoom.id, 'messages', msgId);

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

  const handleDeleteMsgForMe = async (msgId) => {
    if (!user?.uid) return;
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      await updateDoc(doc(db, targetColl, msgId), {
        deletedFor: arrayUnion(user.uid)
      });
      showSuccess('Message deleted for you');
    } catch (e) { console.error(e); }
  };

  const handleDeleteMsgForEveryone = async (msgId) => {
    const targetColl = isCollegeRoom ? 'community-messages' : `userCommunities/${selectedRoom.id}/messages`;
    try {
      await deleteDoc(doc(db, targetColl, msgId));
      showSuccess('Message deleted for everyone');
    } catch (e) { console.error(e); }
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
  const ChatBubble = ({ msg, isMe, onReply, onReact, showEmojiFor, setShowEmoji }) => (
    <div className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
      <img
        src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.sender?.name || 'u')}`}
        alt={msg.sender?.name}
        onClick={() => msg.sender?.uid && navigate(`/profile?uid=${msg.sender.uid}`)}
        className="w-8 h-8 rounded-full flex-shrink-0 mt-xs object-cover cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
      />
      <div className="space-y-xs relative group">
        {!isMe && <span className="text-[10px] font-bold text-neutral-500 ml-sm">{msg.sender?.name}{msg.sender?.role && ` · ${msg.sender.role}`}</span>}
        <div className={`p-lg rounded-2xl border text-sm shadow-sm ${isMe ? 'bg-primary-500 text-white border-primary-600 rounded-tr-none' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-100 dark:border-neutral-800 rounded-tl-none'}`}>
          {msg.replyTo && <div className={`p-md rounded-lg border text-xs mb-md ${isMe ? 'bg-primary-600/50 border-primary-400/40 text-primary-100' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'}`}><p className="font-bold">{msg.replyTo.name}</p><p className="truncate mt-xs">{msg.replyTo.text}</p></div>}
          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          <p className={`text-[10px] mt-xs opacity-70 text-right ${isMe ? 'text-primary-100' : 'text-neutral-400'}`}>{formatTime(msg.timestamp)}</p>
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

  return (
    <div className="section-container p-0 flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden">

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

      {/* ──────── LEFT SIDEBAR ──────── */}
      <div className={`flex-shrink-0 w-full md:w-80 lg:w-96 border-r border-neutral-100 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-950 ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header */}
        <div className="px-lg pt-lg pb-md flex-shrink-0">
          <div className="flex items-center justify-between mb-md">
            <h1 className="text-xl font-heading font-bold text-neutral-900 dark:text-white">Communities</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
              title="Create Community"
            >
              <Plus className="w-4 h-4" />
            </button>
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
                  <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">{collegeName} Community</span>
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
      </div>

      {/* ──────── MAIN CHAT AREA ──────── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950 ${selectedRoom ? 'flex' : 'hidden md:flex'}`}>

        {!selectedRoom ? (
          /* Welcome screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-xl">
            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 rounded-3xl flex items-center justify-center mb-lg shadow-inner">
              <MessageSquare className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white mb-md">Select a Community</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mb-xl">Choose a community from the left to start chatting, or create a new one.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-md bg-primary-500 hover:bg-primary-600 text-white font-semibold px-xl py-md rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Community
            </button>
          </div>
        ) : isCollegeRoom ? (
          /* ── COLLEGE COMMUNITY ROOM ── */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center gap-md px-lg py-md bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm">
              <button onClick={() => setSelectedRoom(null)} className="md:hidden p-md rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex-shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                {collegeName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-xs">{collegeName} Community <ShieldCheck className="w-4 h-4 text-primary-500" /></h2>
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

                          return (
                            <SwipeableMessageRow key={msg.id} isMe={isMe} onReply={() => setReplyingTo(msg)}>
                              <div className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''} ${isSelected ? 'opacity-80 scale-[0.98]' : ''}`}>
                                {isSelectMode && (
                                  <button onClick={() => handleToggleSelectMsg(msg.id)} className="self-center p-xs text-indigo-500">
                                    {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-100" /> : <Square className="w-5 h-5 text-neutral-400" />}
                                  </button>
                                )}
                                <img src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.sender?.name || 'u')}`} alt={msg.sender?.name} className="w-8 h-8 rounded-full flex-shrink-0 mt-xs object-cover" />
                                <div className="space-y-xs relative group">
                                  {!isMe && <span className="text-[10px] font-bold text-neutral-500 ml-sm">{msg.sender?.name}{msg.sender?.role && ` · ${msg.sender?.role}`}</span>}
                                  <div className={`p-lg rounded-2xl border text-sm shadow-sm ${isMe ? 'bg-primary-500 text-white border-primary-600 rounded-tr-none' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-100 dark:border-neutral-800 rounded-tl-none'}`}>
                                    {msg.replyTo && <div className={`p-md rounded-lg border text-xs mb-md ${isMe ? 'bg-primary-600/50 border-primary-400/40 text-primary-100' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'}`}><p className="font-bold">{msg.replyTo.name}</p><p className="truncate mt-xs">{msg.replyTo.text}</p></div>}
                                    {msg.fileUrl && (
                                      <div className="mb-md p-md rounded-xl bg-black/10 flex items-center justify-between gap-md">
                                        <div className="flex items-center gap-sm text-xs font-semibold truncate"><FileText className="w-4 h-4 flex-shrink-0" /> {msg.fileName || 'Attachment'}</div>
                                        <a href={msg.fileUrl} download={msg.fileName || 'file'} target="_blank" rel="noreferrer" className="p-xs hover:bg-black/10 rounded"><Download className="w-3.5 h-3.5" /></a>
                                      </div>
                                    )}
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    {msg.edited && <span className="text-[9px] opacity-60 ml-xs italic">(edited)</span>}
                                    <div className="flex items-center justify-end gap-xs mt-xs">
                                      {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                      <p className={`text-[10px] opacity-70 ${isMe ? 'text-primary-100' : 'text-neutral-400'}`}>{formatTime(msg.timestamp)}</p>
                                    </div>
                                  </div>

                                  {/* Message Hover Actions */}
                                  {!isSelectMode && (
                                    <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-md px-md py-[3px] z-10 ${isMe ? 'right-full mr-md' : 'left-full ml-md'}`}>
                                      <button onClick={() => setReplyingTo(msg)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleStarGroupMessage(msg.id)} className={`p-xs ${isStarred ? 'text-amber-500' : 'text-neutral-400 hover:text-amber-500'}`} title={isStarred ? 'Unstar' : 'Star'}><Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} /></button>
                                      <button onClick={() => handleCopyMsgText(msg.content)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Copy text"><Copy className="w-3.5 h-3.5" /></button>
                                      {isMe && <button onClick={() => handleStartEditMsg(msg)} className="text-neutral-400 hover:text-primary-500 p-xs" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                                      <button onClick={() => handleTogglePinMsg(msg)} className="text-neutral-400 hover:text-amber-500 p-xs" title="Pin message"><Pin className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleDeleteMsgForMe(msg.id)} className="text-neutral-400 hover:text-rose-500 p-xs" title="Delete for me"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SwipeableMessageRow>
                          );
                        }) : (
                      <div className="text-center py-5xl"><AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" /><h3 className="font-bold text-lg mb-xs">No Messages Yet</h3><p className="text-sm text-neutral-500">Start the college conversation!</p></div>
                    )}
                  </div>
                  {showScrollBtn && <button onClick={() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }} className="absolute bottom-20 right-lg w-10 h-10 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 z-20"><ArrowDown className="w-5 h-5" /></button>}
                  {/* Chat Input */}
                  <div className="bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-lg pt-md pb-md flex-shrink-0">
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
                    <div className="flex gap-md items-center">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <button onClick={handleTriggerFilePicker} className="p-md text-neutral-400 hover:text-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-full flex-shrink-0 transition-colors"><Paperclip className="w-5 h-5" /></button>

                      {/* Voice Note Button or Recording UI */}
                      {isRecording ? (
                        <div className="flex-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-full px-md py-sm flex items-center justify-between text-xs text-rose-600 font-semibold animate-pulse">
                          <span className="flex items-center gap-xs"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Recording audio... ({recordingTime}s)</span>
                          <button onClick={handleStopRecording} className="px-md py-xs bg-rose-500 text-white rounded-full hover:bg-rose-600 font-bold">Stop & Attach</button>
                        </div>
                      ) : (
                        <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-md py-sm flex items-center gap-md">
                          <input type="text" placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-transparent text-sm outline-none flex-1 py-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400" />
                          <button onClick={handleStartRecording} className="text-neutral-400 hover:text-primary-500 p-xs" title="Record Voice Note"><Mic className="w-4 h-4" /></button>
                          <button className="text-neutral-400 hover:text-neutral-600 p-xs"><Smile className="w-4 h-4" /></button>
                        </div>
                      )}

                      <button onClick={handleSendMessage} className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {collegeTab === 'Feed' && (
                <div className="flex-1 overflow-y-auto px-lg py-md space-y-lg scrollbar-thin">
                  <Card className="mb-lg">
                    <div className="flex gap-md mb-lg">
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
                        alt="You"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <textarea
                          placeholder="Post a campus announcement or community update..."
                          value={newPostText}
                          onChange={(e) => setNewPostText(e.target.value)}
                          rows={3}
                          className="w-full bg-neutral-50/50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl px-lg py-md text-sm outline-none resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {feedImagePreviewUrl && (
                          <div className="relative mt-md rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 max-h-60 flex items-center justify-center">
                            <img src={feedImagePreviewUrl} alt="Preview" className="object-contain max-h-60 w-full" />
                            <button
                              onClick={handleRemoveFeedImage}
                              className="absolute top-2 right-2 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-full p-1.5 transition-colors shadow-md"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-lg border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex gap-md">
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
                          className="p-md text-neutral-400 hover:text-primary-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          title="Add Image"
                        >
                          <Image className="w-5 h-5" />
                        </button>
                        <button className="p-md text-neutral-400 hover:text-primary-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                          <Smile className="w-5 h-5" />
                        </button>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={(!newPostText.trim() && !feedImageFile) || isUploadingFeedImage}
                        onClick={handleCreateFeedPost}
                      >
                        {isUploadingFeedImage ? 'Sharing...' : 'Share Announcement'}
                      </Button>
                    </div>
                  </Card>

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
                  <div className="flex justify-between items-center max-w-2xl mx-auto mb-md"><h2 className="text-lg font-bold">Campus Polls</h2><Button variant="primary" size="sm" onClick={() => setIsCreatePollOpen(true)}><Plus className="w-4 h-4 mr-xs inline" /> Create Poll</Button></div>
                  <div className="max-w-2xl mx-auto space-y-lg">
                    {polls.length > 0 ? polls.map(poll => {
                      const hasVoted = poll.options?.some(o => o.selected);
                      return (
                        <Card key={poll.id} className="p-lg border-neutral-100 dark:border-neutral-800 shadow-sm">
                          <h3 className="font-semibold mb-lg leading-relaxed">{poll.question}</h3>
                          <div className="space-y-md">
                            {poll.options?.map((opt, oIdx) => { const percent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0; return (
                              <button key={oIdx} disabled={hasVoted} onClick={() => handleVote(poll.id, oIdx)} className={`w-full text-left relative overflow-hidden rounded-xl border p-lg transition-all ${opt.selected ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10' : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800'}`}>
                                <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${opt.selected ? 'bg-primary-500/10' : 'bg-neutral-200/20'}`} style={{ width: `${percent}%` }} />
                                <div className="relative flex justify-between items-center z-10 text-sm font-semibold"><span className="flex items-center gap-md">{opt.text}{opt.selected && <CheckCircle2 className="w-4 h-4 text-primary-500" />}</span><span className="text-neutral-400">{percent}% ({opt.votes})</span></div>
                              </button>
                            ); })}
                          </div>
                          <div className="flex justify-between items-center mt-lg text-xs text-neutral-400 font-semibold border-t border-neutral-50 dark:border-neutral-800 pt-md"><span>Total: {poll.totalVotes || 0}</span>{hasVoted && <span className="text-primary-500">Voted</span>}</div>
                        </Card>
                      );
                    }) : <Card className="text-center py-5xl"><BarChart2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" /><h3 className="font-bold mb-xs">No Polls Yet</h3><Button variant="primary" size="sm" className="mt-lg" onClick={() => setIsCreatePollOpen(true)}><Plus className="w-4 h-4 mr-xs inline" /> Create Poll</Button></Card>}
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

        ) : isGroupRoom ? (
          /* ── GROUP ROOM ── */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center gap-md px-lg py-md bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm">
              <button onClick={() => setSelectedRoom(null)} className="md:hidden p-md rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex-shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {selectedRoom.avatar ? (
                <img src={selectedRoom.avatar} alt={selectedRoom.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-md" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                  {selectedRoom.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-xs">
                  {selectedRoom.name}
                  {isAdmin && <Shield className="w-4 h-4 text-indigo-500" />}
                </h2>
                <p className="text-xs text-neutral-500 font-semibold">{(selectedRoom.members || []).length} members{selectedRoom.description && ` · ${selectedRoom.description}`}</p>
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
                <button onClick={handleOpenManage} className="flex items-center gap-xs px-md py-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors">
                  <Info className="w-3.5 h-3.5" /> Group Info
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

                      return (
                        <SwipeableMessageRow key={msg.id} isMe={isMe} onReply={() => setCommunityReplyingTo(msg)}>
                          <div className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''} ${isSelected ? 'opacity-80 scale-[0.98]' : ''}`}>
                            {isSelectMode && (
                              <button onClick={() => handleToggleSelectMsg(msg.id)} className="self-center p-xs text-indigo-500">
                                {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-100" /> : <Square className="w-5 h-5 text-neutral-400" />}
                              </button>
                            )}
                            <img src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.sender?.name || 'u')}`} alt={msg.sender?.name} className="w-8 h-8 rounded-full flex-shrink-0 mt-xs object-cover" />
                            <div className="space-y-xs relative group">
                              {!isMe && <span className="text-[10px] font-bold text-neutral-500 ml-sm">{msg.sender?.name}</span>}
                              <div className={`p-lg rounded-2xl border text-sm shadow-sm ${isMe ? 'bg-primary-500 text-white border-primary-600 rounded-tr-none' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-100 dark:border-neutral-800 rounded-tl-none'}`}>
                                {msg.replyTo && <div className={`p-md rounded-lg border text-xs mb-md ${isMe ? 'bg-primary-600/50 border-primary-400/40 text-primary-100' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'}`}><p className="font-bold">{msg.replyTo.name}</p><p className="truncate mt-xs">{msg.replyTo.text}</p></div>}
                                {msg.fileUrl && (
                                  <div className="mb-md p-md rounded-xl bg-black/10 flex items-center justify-between gap-md">
                                    <div className="flex items-center gap-sm text-xs font-semibold truncate"><FileText className="w-4 h-4 flex-shrink-0" /> {msg.fileName || 'Attachment'}</div>
                                    <a href={msg.fileUrl} download={msg.fileName || 'file'} target="_blank" rel="noreferrer" className="p-xs hover:bg-black/10 rounded"><Download className="w-3.5 h-3.5" /></a>
                                  </div>
                                )}
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                {msg.edited && <span className="text-[9px] opacity-60 ml-xs italic">(edited)</span>}
                                <div className="flex items-center justify-end gap-xs mt-xs">
                                  {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                  <p className={`text-[10px] opacity-70 ${isMe ? 'text-primary-100' : 'text-neutral-400'}`}>{formatTime(msg.timestamp)}</p>
                                </div>
                              </div>

                              {/* Message Hover Actions */}
                              {!isSelectMode && (
                                <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-md px-md py-[3px] z-10 ${isMe ? 'right-full mr-md' : 'left-full ml-md'}`}>
                                  <button onClick={() => setCommunityReplyingTo(msg)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleStarGroupMessage(msg.id)} className={`p-xs ${isStarred ? 'text-amber-500' : 'text-neutral-400 hover:text-amber-500'}`} title={isStarred ? 'Unstar' : 'Star'}><Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} /></button>
                                  <button onClick={() => handleCopyMsgText(msg.content)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs" title="Copy text"><Copy className="w-3.5 h-3.5" /></button>
                                  {isMe && <button onClick={() => handleStartEditMsg(msg)} className="text-neutral-400 hover:text-primary-500 p-xs" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                                  <button onClick={() => handleTogglePinMsg(msg)} className="text-neutral-400 hover:text-amber-500 p-xs" title="Pin message"><Pin className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteMsgForMe(msg.id)} className="text-neutral-400 hover:text-rose-500 p-xs" title="Delete for me"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </SwipeableMessageRow>
                      );
                    })}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-lg pt-md pb-md flex-shrink-0">
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

                <div className="flex gap-md items-center">
                  <input type="file" ref={groupFileInputRef} onChange={handleGroupFileChange} className="hidden" />
                  <button onClick={() => groupFileInputRef.current?.click()} className="p-md text-neutral-400 hover:text-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-full flex-shrink-0 transition-colors" title="Attach file/media">
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Voice Note Button or Recording UI */}
                  {isRecording ? (
                    <div className="flex-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-full px-md py-sm flex items-center justify-between text-xs text-rose-600 font-semibold animate-pulse">
                      <span className="flex items-center gap-xs"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Recording audio... ({recordingTime}s)</span>
                      <button onClick={handleStopRecording} className="px-md py-xs bg-rose-500 text-white rounded-full hover:bg-rose-600 font-bold">Stop & Attach</button>
                    </div>
                  ) : (
                    <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-md py-sm flex items-center gap-md">
                      <input type="text" placeholder="Type a message..." value={communityMsgText} onChange={(e) => setCommunityMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendGroupMessage()} className="bg-transparent text-sm outline-none flex-1 py-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400" />
                      <button onClick={handleStartRecording} className="text-neutral-400 hover:text-primary-500 p-xs" title="Record Voice Note"><Mic className="w-4 h-4" /></button>
                      <button className="text-neutral-400 hover:text-neutral-600 p-xs"><Smile className="w-4 h-4" /></button>
                    </div>
                  )}

                  <button onClick={handleSendGroupMessage} className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── MODALS ── */}
      <Modal isOpen={isCreatePollOpen} onClose={() => setIsCreatePollOpen(false)} title="Create a Poll" size="md">
        <form onSubmit={handleCreatePoll} className="space-y-lg">
          <Input label="Question" placeholder="e.g. When should we schedule the review?" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Options</label>
            <div className="space-y-md">{pollOptions.map((opt, idx) => <Input key={idx} placeholder={`Option ${idx + 1}`} value={opt} onChange={(e) => { const n = [...pollOptions]; n[idx] = e.target.value; setPollOptions(n); }} />)}</div>
            <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-primary-500 hover:text-primary-600 font-semibold mt-md">+ Add another option</button>
          </div>
          <div className="flex gap-md pt-md"><Button variant="secondary" className="flex-1" onClick={() => setIsCreatePollOpen(false)}>Cancel</Button><Button variant="primary" type="submit" className="flex-1">Publish Poll</Button></div>
        </form>
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create a Community" size="md">
        <form onSubmit={handleCreateCommunity} className="space-y-lg">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Community Profile Photo</label>
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
              ) : (
                <button
                  type="button"
                  onClick={() => createAvatarFileRef.current?.click()}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:opacity-90 flex flex-col items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md transition-all group"
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
                    className="px-md py-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    Upload File
                  </button>
                  {newGroupAvatar && (
                    <button
                      type="button"
                      onClick={() => setNewGroupAvatar('')}
                      className="px-md py-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
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
            {/* Presets */}
            <div className="mt-md">
              <p className="text-[10px] font-semibold text-neutral-400 mb-xs">Or pick a preset theme photo:</p>
              <div className="flex items-center gap-xs overflow-x-auto pb-xs scrollbar-thin">
                {[
                  { label: '🎨 Tech', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80' },
                  { label: '📚 Study', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&auto=format&fit=crop&q=80' },
                  { label: '⚽ Sports', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=150&auto=format&fit=crop&q=80' },
                  { label: '🎮 Gaming', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80' },
                  { label: '🚀 Startup', url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=150&auto=format&fit=crop&q=80' },
                  { label: '🎵 Music', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80' },
                  { label: '💡 AI', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=150&auto=format&fit=crop&q=80' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setNewGroupAvatar(preset.url)}
                    className={`px-md py-xs rounded-lg text-[10px] font-semibold flex-shrink-0 transition-colors ${newGroupAvatar === preset.url ? 'bg-primary-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Community Name <span className="text-rose-500">*</span></label>
            <input type="text" placeholder="e.g. AI Club, Study Squad, CSE 3rd Year" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="input-base" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Description</label>
            <textarea placeholder="What is this community about?" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} rows={3} className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Privacy</label>
            <div className="grid grid-cols-2 gap-md">
              {[{ val: 'public', Icon: Globe, label: 'Public', desc: 'Anyone can find and join' }, { val: 'private', Icon: Lock, label: 'Private', desc: 'Invite only via link' }].map(({ val, Icon, label, desc }) => (
                <button key={val} type="button" onClick={() => setNewGroupType(val)} className={`flex items-start gap-md p-lg rounded-xl border-2 transition-all text-left ${newGroupType === val ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-950/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}>
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${newGroupType === val ? 'text-primary-500' : 'text-neutral-400'}`} />
                  <div><p className={`font-bold text-sm ${newGroupType === val ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{label}</p><p className="text-[10px] text-neutral-500 mt-xs leading-relaxed">{desc}</p></div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-md pt-md"><Button variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button variant="primary" type="submit" className="flex-1" disabled={isCreatingGroup || !newGroupName.trim()}>{isCreatingGroup ? 'Creating...' : 'Create Community'}</Button></div>
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
                    {selectedRoom.avatar ? (
                      <img src={selectedRoom.avatar} alt={selectedRoom.name} className="w-12 h-12 rounded-xl object-cover shadow-md border border-neutral-200 dark:border-neutral-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {selectedRoom.name.charAt(0).toUpperCase()}
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
                      {selectedRoom.name}
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
                {['members', 'media', 'starred', ...(isAdmin ? ['settings'] : [])].map(tab => <button key={tab} onClick={() => setManageTab(tab)} className={`flex-1 py-md text-xs font-semibold capitalize transition-colors ${manageTab === tab ? 'text-primary-500 border-b-2 border-primary-500' : 'text-neutral-500'}`}>{tab}</button>)}
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {manageTab === 'members' && (
                  <div className="p-xl space-y-lg">
                    {(selectedRoom.type !== 'private' || isAdmin) ? (
                      <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-lg">
                        <div className="flex items-center gap-md mb-md"><div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white"><Link2 className="w-4 h-4" /></div><div><p className="font-bold text-sm">Invite Link</p><p className="text-xs text-neutral-500">Share to invite people</p></div></div>
                        <div className="flex items-center gap-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-md py-sm text-xs text-neutral-500 font-mono mb-md overflow-hidden"><span className="truncate flex-1">{`${window.location.origin}/community?join=${selectedRoom.id}`}</span></div>
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
                      const starredMsgs = communityMessages.filter(m => (m.starredBy || []).includes(user?.uid));
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
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">Privacy Mode</label>
                      <div className="grid grid-cols-2 gap-md">
                        {[{ val: 'public', Icon: Globe, label: 'Public', desc: 'Anyone can find & join' }, { val: 'private', Icon: Lock, label: 'Private', desc: 'Invite only by admins' }].map(({ val, Icon, label, desc }) => (
                          <button key={val} type="button" onClick={() => setEditGroupType(val)} className={`flex items-start gap-md p-lg rounded-xl border-2 transition-all text-left ${editGroupType === val ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-950/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}>
                            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${editGroupType === val ? 'text-primary-500' : 'text-neutral-400'}`} />
                            <div><p className={`font-bold text-sm ${editGroupType === val ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{label}</p><p className="text-[10px] text-neutral-500 mt-xs leading-relaxed">{desc}</p></div>
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
    </div>
  );

}
