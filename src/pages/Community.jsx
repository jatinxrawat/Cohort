import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ShieldCheck,
  Search,
  Image,
  Paperclip,
  Send,
  Smile,
  Reply,
  Pin,
  ArrowDown,
  Plus,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  X
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { PostCard } from '@/components/PostCard';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '@/utils/firebase';

const chatEmojis = ['👍', '❤️', '🔥', '🙌', '😂', '😮'];

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showWarning } = useNotification();
  
  const collegeName = user?.college || 'My College';
  
  const [activeTab, setActiveTab] = useState('Chat'); // Chat, Feed, Polls, Files
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat States
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // msgId
  const [attachedFile, setAttachedFile] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  // Feed States
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

  // Files States
  const [files, setFiles] = useState([]);
  const [activeFileCategory, setActiveFileCategory] = useState('All');
  const [isShareFileOpen, setIsShareFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('Notes');

  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Community data with real-time Firestore onSnapshot listeners
  useEffect(() => {
    setLoading(true);

    // 1. Real-time Community Messages
    const unsubMsgs = onSnapshot(collection(db, 'community-messages'), (msgSnap) => {
      const loadedMsgs = [];
      const fakeSenderNames = ['rahul roy', 'priya sharma', 'aditya gupta', 'arjun kumar', 'neha patel', 'rohan verma'];
      
      msgSnap.forEach(d => {
        const data = d.data();
        const senderName = (data.sender?.name || '').toLowerCase();
        const isFake = fakeSenderNames.some(fake => senderName.includes(fake));

        if (isFake) {
          deleteDoc(doc(db, 'community-messages', d.id)).catch(err => console.error('Purging fake msg:', err));
        } else {
          loadedMsgs.push({
            id: d.id,
            docId: d.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
          });
        }
      });
      loadedMsgs.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loadedMsgs);
      setLoading(false);
    }, (err) => {
      console.error('Community messages listener error:', err);
      setLoading(false);
    });

    // 2. Real-time Feed Posts
    const unsubFeed = onSnapshot(collection(db, 'community-feed'), (feedSnap) => {
      const loadedFeed = [];
      const fakeSenderNames = ['rahul roy', 'priya sharma', 'aditya gupta', 'arjun kumar', 'neha patel', 'rohan verma'];

      feedSnap.forEach(d => {
        const data = d.data();
        const authorName = (data.author?.name || '').toLowerCase();
        const isFake = fakeSenderNames.some(fake => authorName.includes(fake));

        if (isFake) {
          deleteDoc(doc(db, 'community-feed', d.id)).catch(err => console.error('Purging fake feed post:', err));
        } else {
          loadedFeed.push({
            id: d.id,
            docId: d.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
          });
        }
      });
      loadedFeed.sort((a, b) => b.timestamp - a.timestamp);
      setFeedPosts(loadedFeed);
    }, (err) => {
      console.error('Community feed listener error:', err);
    });

    // 3. Real-time Polls
    const unsubPolls = onSnapshot(collection(db, 'community-polls'), (pollsSnap) => {
      const loadedPolls = [];
      pollsSnap.forEach(d => {
        loadedPolls.push({
          id: d.id,
          docId: d.id,
          ...d.data()
        });
      });
      setPolls(loadedPolls);
    }, (err) => console.error('Polls error:', err));

    // 4. Real-time Files
    const unsubFiles = onSnapshot(collection(db, 'community-files'), (filesSnap) => {
      const loadedFiles = [];
      filesSnap.forEach(d => {
        loadedFiles.push({
          id: d.id,
          docId: d.id,
          ...d.data()
        });
      });
      setFiles(loadedFiles);
    });

    return () => {
      unsubMsgs();
      unsubFeed();
      unsubPolls();
      unsubFiles();
    };
  }, []);

  // Scroll to bottom helper for Chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (activeTab === 'Chat' && !loading) {
      scrollToBottom();
    }
  }, [messages, activeTab, loading]);

  // Monitor chat scrolling
  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollBtn(true);
    } else {
      setShowScrollBtn(false);
    }
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!messageText.trim() && !attachedFile) return;

    const senderName = user?.name || user?.email?.split('@')[0] || 'Student';
    const messageData = {
      sender: {
        name: senderName,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || senderName)}`,
        role: user?.college || 'Student',
        uid: user?.uid || null
      },
      content: messageText.trim() + (attachedFile ? ` \n📎 Attached: ${attachedFile.name}` : ''),
      timestamp: new Date(),
      reactions: [],
      replyTo: replyingTo ? { name: replyingTo.sender.name, text: replyingTo.content } : null
    };

    try {
      const docRef = await addDoc(collection(db, 'community-messages'), messageData);
      const newMsg = { id: docRef.id, docId: docRef.id, ...messageData };
      setMessages([...messages, newMsg]);
      setMessageText('');
      setReplyingTo(null);
      setAttachedFile(null);
      showSuccess('Message sent');
    } catch (e) {
      console.error('Failed to send message to Firestore:', e);
    }
  };

  // Handle emoji reaction
  const handleReact = async (msgId, emoji) => {
    let targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    const myId = user?.uid || 'user';
    const existing = targetMsg.reactions.find(r => r.emoji === emoji);
    let updatedReactions = [...targetMsg.reactions];
    
    if (existing) {
      if (existing.users.includes(myId)) {
        const nextUsers = existing.users.filter(u => u !== myId);
        if (nextUsers.length === 0) {
          updatedReactions = updatedReactions.filter(r => r.emoji !== emoji);
        } else {
          updatedReactions = updatedReactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, users: nextUsers } : r);
        }
      } else {
        updatedReactions = updatedReactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, myId] } : r);
      }
    } else {
      updatedReactions.push({ emoji, count: 1, users: [myId] });
    }

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: updatedReactions } : m));
    setShowEmojiPicker(null);

    if (targetMsg.docId) {
      try {
        const docRef = doc(db, 'community-messages', targetMsg.docId);
        await updateDoc(docRef, { reactions: updatedReactions });
      } catch (e) {
        console.error('Failed to update reactions in Firestore:', e);
      }
    }
  };

  const handleTriggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
      showSuccess(`File attached: ${file.name}`);
    }
  };

  // Add Feed Post
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
    let nextLiked = false;
    let nextLikes = 0;

    const updated = feedPosts.map(p => {
      if (p.id === postId) {
        nextLiked = !p.liked;
        nextLikes = p.liked ? Math.max(0, p.likes - 1) : p.likes + 1;
        return {
          ...p,
          liked: nextLiked,
          likes: nextLikes
        };
      }
      return p;
    });

    setFeedPosts(updated);

    const targetPost = feedPosts.find(p => p.id === postId);
    if (targetPost && targetPost.docId) {
      try {
        const docRef = doc(db, 'community-feed', targetPost.docId);
        await updateDoc(docRef, {
          liked: nextLiked,
          likes: nextLikes
        });
      } catch (e) {
        console.error('Failed to update likes in Firestore:', e);
      }
    }
  };

  const handleSavePost = async (postId) => {
    let nextSaved = false;
    const updated = feedPosts.map(p => {
      if (p.id === postId) {
        nextSaved = !p.saved;
        return { ...p, saved: nextSaved };
      }
      return p;
    });
    
    setFeedPosts(updated);

    const targetPost = feedPosts.find(p => p.id === postId);
    if (targetPost && targetPost.docId) {
      try {
        const docRef = doc(db, 'community-feed', targetPost.docId);
        await updateDoc(docRef, { saved: nextSaved });
      } catch (e) {
        console.error('Failed to save status in Firestore:', e);
      }
    }
    showSuccess('Announcement bookmarked!');
  };

  // Poll Vote
  const handleVote = async (pollId, optIndex) => {
    let targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll) return;

    let isAlreadyVoted = targetPoll.options.some(o => o.selected);
    if (isAlreadyVoted) {
      showWarning('You have already voted on this poll!');
      return;
    }
    
    const updatedOptions = targetPoll.options.map((o, idx) => {
      if (idx === optIndex) {
        return { ...o, votes: o.votes + 1, selected: true };
      }
      return o;
    });

    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, options: updatedOptions, totalVotes: p.totalVotes + 1 } : p));
    showSuccess('Vote recorded!');

    if (targetPoll.docId) {
      try {
        const docRef = doc(db, 'community-polls', targetPoll.docId);
        await updateDoc(docRef, {
          options: updatedOptions,
          totalVotes: targetPoll.totalVotes + 1
        });
      } catch (e) {
        console.error('Failed to submit vote in Firestore:', e);
      }
    }
  };

  // Create Poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
    const validOptions = pollOptions.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      showWarning('Please provide at least 2 poll options.');
      return;
    }

    const newPollData = {
      question: pollQuestion.trim(),
      totalVotes: 0,
      options: validOptions.map(optText => ({ text: optText.trim(), votes: 0, selected: false })),
      createdBy: user?.name || user?.email?.split('@')[0] || 'Student',
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'community-polls'), newPollData);
      const withId = { id: docRef.id, docId: docRef.id, ...newPollData };
      setPolls([withId, ...polls]);
      setIsCreatePollOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      showSuccess('Poll created successfully!');
    } catch (e) {
      console.error('Failed to create poll:', e);
    }
  };

  // Share File
  const handleShareFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fileData = {
      name: newFileName.trim(),
      category: newFileCategory,
      uploadedBy: user?.name || user?.email?.split('@')[0] || 'Student',
      date: new Date().toISOString().split('T')[0],
      size: '1.2 MB'
    };

    try {
      const docRef = await addDoc(collection(db, 'community-files'), fileData);
      const withId = { id: docRef.id, docId: docRef.id, ...fileData };
      setFiles([withId, ...files]);
      setIsShareFileOpen(false);
      setNewFileName('');
      showSuccess('Resource shared successfully!');
    } catch (e) {
      console.error('Failed to share file:', e);
    }
  };

  // Files category lists
  const fileCategories = ['All', 'Notes', 'PYQs', 'PDFs', 'Timetable', 'Assignments', 'Presentations'];
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFileCategory === 'All' || f.category === activeFileCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadFile = (fileName) => {
    showSuccess(`Downloading "${fileName}"...`);
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section-container flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)]">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg flex-shrink-0">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            {collegeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold flex items-center gap-sm text-neutral-900 dark:text-white">
              {collegeName}
              <ShieldCheck className="w-6 h-6 text-primary-500 fill-primary-500/10 flex-shrink-0" />
            </h1>
            <div className="flex items-center gap-md text-xs text-neutral-500 dark:text-neutral-400 mt-xs font-semibold">
              <span className="flex items-center gap-xs">
                <Users className="w-3.5 h-3.5" /> Campus Community Hub
              </span>
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={activeTab === 'Chat' ? 'Search messages...' : 'Search resources...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-2xl py-xs bg-neutral-50/50 dark:bg-neutral-800/40 rounded-full border-neutral-200 dark:border-neutral-800 text-xs focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-800 mb-lg flex-shrink-0">
        {['Chat', 'Feed', 'Polls', 'Files'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-xl py-md text-sm font-semibold transition-all relative ${
              activeTab === t
                ? 'text-primary-500'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            {t}
            {activeTab === t && (
              <motion.div
                layoutId="activeCommunityTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Skeleton Screen */}
      {loading ? (
        <div className="flex-1 flex flex-col justify-between py-md">
          <div className="space-y-lg">
            <div className="h-6 w-1/3 skeleton" />
            <div className="space-y-md">
              <div className="h-16 w-3/4 skeleton" />
              <div className="h-16 w-1/2 skeleton" />
              <div className="h-16 w-2/3 skeleton" />
            </div>
          </div>
          <div className="h-12 w-full skeleton mt-lg" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col relative">
          
          {/* 1. CHAT TAB */}
          {activeTab === 'Chat' && (
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Chat Container */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto pr-sm space-y-md pb-xl scroll-smooth scrollbar-thin"
              >
                {filteredMessages.length > 0 ? (
                  <>
                    {filteredMessages.map((msg) => {
                      const isMe = msg.sender?.uid === user?.uid || msg.sender?.name === user?.name;
                      return (
                        <div key={msg.id} className={`flex gap-md max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                          <img
                            src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.sender?.name || 'user')}`}
                            alt={msg.sender?.name || 'User'}
                            onClick={() => msg.sender?.uid && navigate(`/profile?uid=${msg.sender.uid}`)}
                            className="w-8 h-8 rounded-full flex-shrink-0 mt-xs cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all object-cover"
                          />
                          <div className="space-y-xs relative group">
                            {!isMe && (
                              <span
                                onClick={() => msg.sender?.uid && navigate(`/profile?uid=${msg.sender.uid}`)}
                                className="text-[10px] font-bold text-neutral-500 ml-sm cursor-pointer hover:text-primary-500 hover:underline"
                              >
                                {msg.sender?.name} • {msg.sender?.role || 'Student'}
                              </span>
                            )}

                            <div className={`p-lg rounded-2xl border text-sm shadow-sm relative ${
                              isMe
                                ? 'bg-primary-500 text-white border-primary-600 rounded-tr-none'
                                : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-100 dark:border-neutral-800 rounded-tl-none'
                            }`}>
                              
                              {msg.replyTo && (
                                <div className={`p-md rounded-lg border text-xs mb-md leading-relaxed ${
                                  isMe
                                    ? 'bg-primary-600/50 border-primary-400/40 text-primary-100'
                                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
                                }`}>
                                  <p className="font-bold">{msg.replyTo.name}</p>
                                  <p className="truncate mt-xs">{msg.replyTo.text}</p>
                                </div>
                              )}

                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-xs pt-xs pl-sm">
                                {msg.reactions.map((react, rIdx) => (
                                  <button
                                    key={rIdx}
                                    onClick={() => handleReact(msg.id, react.emoji)}
                                    className={`px-sm py-[2px] rounded-full text-[10px] font-bold border flex items-center gap-xs ${
                                      react.users?.includes(user?.uid || 'user')
                                        ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950/20'
                                        : 'bg-white border-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:border-neutral-800'
                                    }`}
                                  >
                                    <span>{react.emoji}</span>
                                    <span>{react.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Quick tools menu */}
                            <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-md px-md py-[3px] z-10 ${
                              isMe ? 'right-full mr-md' : 'left-full ml-md'
                            }`}>
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs"
                                title="Reply"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-xs"
                                title="Add Reaction"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>

                              {showEmojiPicker === msg.id && (
                                <div className="absolute bottom-full left-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-sm flex gap-xs z-20 mb-xs">
                                  {chatEmojis.map(e => (
                                    <button
                                      key={e}
                                      onClick={() => handleReact(msg.id, e)}
                                      className="hover:scale-125 transition-transform text-sm"
                                    >
                                      {e}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-5xl">
                    <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                    <h3 className="font-bold text-lg mb-xs">No Messages Yet</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Start the conversation in your college community!
                    </p>
                  </div>
                )}
              </div>

              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-lg w-10 h-10 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-20"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              )}

              {/* Chat Input Bar */}
              <div className="bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 pt-md pb-sm flex-shrink-0">
                {replyingTo && (
                  <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-sm flex justify-between items-center text-xs mb-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-[10px] text-neutral-400">Replying to {replyingTo.sender?.name}</span>
                      <p className="truncate text-neutral-600 dark:text-neutral-300 mt-xs">{replyingTo.content}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-neutral-400 hover:text-neutral-600">Close</button>
                  </div>
                )}

                <div className="flex gap-md items-center relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex gap-sm">
                    <button
                      onClick={handleTriggerFilePicker}
                      className="p-md text-neutral-400 hover:text-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                      title="Attach File"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-md py-sm flex items-center gap-md relative">
                    <input
                      type="text"
                      placeholder="Type your message here..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-transparent text-sm outline-none flex-1 focus:ring-0 focus:border-transparent py-xs"
                    />
                    <button className="text-neutral-400 hover:text-neutral-600">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. FEED TAB */}
          {activeTab === 'Feed' && (
            <div className="flex-1 overflow-y-auto pr-sm pb-xl space-y-lg scrollbar-thin">
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
                <div className="space-y-lg max-w-2xl">
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
                <Card className="text-center py-5xl max-w-2xl">
                  <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                  <h3 className="font-bold text-lg mb-xs">No Announcements Yet</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Be the first to share an announcement with your college community!
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* 3. POLLS TAB */}
          {activeTab === 'Polls' && (
            <div className="flex-1 overflow-y-auto pr-sm pb-xl space-y-lg scrollbar-thin">
              <div className="flex justify-between items-center max-w-2xl mb-md">
                <h2 className="text-lg font-bold">Campus Polls</h2>
                <Button variant="primary" size="sm" onClick={() => setIsCreatePollOpen(true)}>
                  <Plus className="w-4 h-4 mr-xs inline" /> Create Poll
                </Button>
              </div>

              <div className="max-w-2xl space-y-lg">
                {polls.length > 0 ? (
                  polls.map((poll) => {
                    const hasVoted = poll.options?.some(o => o.selected);
                    return (
                      <Card key={poll.id} className="p-lg border-neutral-100 dark:border-neutral-800 shadow-sm">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-lg leading-relaxed">
                          {poll.question}
                        </h3>

                        <div className="space-y-md">
                          {poll.options?.map((opt, oIdx) => {
                            const percent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                            return (
                              <button
                                key={oIdx}
                                disabled={hasVoted}
                                onClick={() => handleVote(poll.id, oIdx)}
                                className={`w-full text-left relative overflow-hidden rounded-xl border p-lg transition-all ${
                                  opt.selected
                                    ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10'
                                    : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <div
                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                    opt.selected ? 'bg-primary-500/10' : 'bg-neutral-200/20 dark:bg-neutral-800/30'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />

                                <div className="relative flex justify-between items-center z-10 text-sm font-semibold">
                                  <span className="flex items-center gap-md text-neutral-800 dark:text-neutral-200">
                                    {opt.text}
                                    {opt.selected && <CheckCircle2 className="w-4.5 h-4.5 text-primary-500 flex-shrink-0" />}
                                  </span>
                                  <span className="text-neutral-500 dark:text-neutral-400">
                                    {percent}% ({opt.votes})
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center mt-lg text-xs text-neutral-400 font-semibold border-t border-neutral-50 dark:border-neutral-800 pt-md">
                          <span>Total Votes: {poll.totalVotes || 0}</span>
                          {hasVoted && <span className="text-primary-500">Vote Saved</span>}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="text-center py-5xl">
                    <BarChart2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                    <h3 className="font-bold text-lg mb-xs">No Active Polls</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-lg">
                      Create a poll to gather feedback or votes from your college peers!
                    </p>
                    <Button variant="primary" size="sm" onClick={() => setIsCreatePollOpen(true)}>
                      <Plus className="w-4 h-4 mr-xs inline" /> Create Poll
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* 4. FILES TAB */}
          {activeTab === 'Files' && (
            <div className="flex-1 overflow-y-auto pr-sm pb-xl space-y-lg flex flex-col scrollbar-thin">
              <div className="flex items-center justify-between gap-md flex-shrink-0">
                <div className="flex items-center gap-sm overflow-x-auto pb-sm scrollbar-none">
                  {fileCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFileCategory(cat)}
                      className={`px-lg py-md rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeFileCategory === cat
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="sm" className="whitespace-nowrap" onClick={() => setIsShareFileOpen(true)}>
                  <Plus className="w-4 h-4 mr-xs inline" /> Share Resource
                </Button>
              </div>

              {filteredFiles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-lg flex-1 min-h-0">
                  {filteredFiles.map((file) => (
                    <Card key={file.id} className="p-lg hover:shadow-md transition-shadow border-neutral-100 dark:border-neutral-800 flex flex-col justify-between">
                      <div className="flex items-start gap-md mb-lg">
                        <div className="w-10 h-10 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-primary-500 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate leading-snug" title={file.name}>
                            {file.name}
                          </h4>
                          <span className="badge-secondary mt-xs">{file.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-md border-t border-neutral-50 dark:border-neutral-800 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                        <div>
                          <p>By: {file.uploadedBy}</p>
                          <p className="mt-xs">{file.date} • {file.size || '1 MB'}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="xs"
                          className="flex items-center gap-xs"
                          onClick={() => handleDownloadFile(file.name)}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5xl">
                  <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
                  <h3 className="font-bold text-lg mb-md">No Files Shared Yet</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mb-lg">
                    No resources found under "{activeFileCategory}". Share a study guide or note with your peers!
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setIsShareFileOpen(true)}>
                    <Plus className="w-4 h-4 mr-xs inline" /> Share Resource
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Create Poll Modal */}
      <Modal isOpen={isCreatePollOpen} onClose={() => setIsCreatePollOpen(false)} title="Create a Poll" size="md">
        <form onSubmit={handleCreatePoll} className="space-y-lg">
          <Input
            label="Question"
            placeholder="e.g. When should we schedule the review session?"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
              Options
            </label>
            <div className="space-y-md">
              {pollOptions.map((opt, idx) => (
                <Input
                  key={idx}
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...pollOptions];
                    newOpts[idx] = e.target.value;
                    setPollOptions(newOpts);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPollOptions([...pollOptions, ''])}
              className="text-xs text-primary-500 hover:text-primary-600 font-semibold mt-md"
            >
              + Add another option
            </button>
          </div>

          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setIsCreatePollOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              Publish Poll
            </Button>
          </div>
        </form>
      </Modal>

      {/* Share File Modal */}
      <Modal isOpen={isShareFileOpen} onClose={() => setIsShareFileOpen(false)} title="Share Resource" size="md">
        <form onSubmit={handleShareFile} className="space-y-lg">
          <Input
            label="Resource Title / File Name"
            placeholder="e.g. Network Security Lecture Summary.pdf"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
              Category
            </label>
            <select
              value={newFileCategory}
              onChange={(e) => setNewFileCategory(e.target.value)}
              className="input-base"
            >
              {fileCategories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setIsShareFileOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              Share File
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
