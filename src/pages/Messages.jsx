import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, deleteDoc, updateDoc, getDocs, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Send, ChevronLeft, Search, Plus, MessageSquare, Trash2, MoreVertical, Eraser, User, Sparkles, X } from 'lucide-react';
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

export default function Messages() {
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
  
  // New Chat Modal States
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const myUid = user?.uid || 'guest';

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

            const displayTitle = data.name || 'Chat';
            const avatarUrl = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayTitle)}`;

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

      loaded.sort((a, b) => b.time - a.time);
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

  // Filter messages visible to current user (WhatsApp 1-side delete/clear model)
  const clearedTimeMs = activeConversation?.clearedFor?.[myUid]
    ? (activeConversation.clearedFor[myUid]?.toDate
        ? activeConversation.clearedFor[myUid].toDate().getTime()
        : new Date(activeConversation.clearedFor[myUid]).getTime())
    : 0;

  const visibleMessages = (activeConversation?.messages || []).filter(msg => {
    if (msg.deletedFor && Array.isArray(msg.deletedFor) && msg.deletedFor.includes(myUid)) {
      return false;
    }
    if (clearedTimeMs) {
      const msgTimeMs = msg.time?.getTime ? msg.time.getTime() : new Date(msg.time || 0).getTime();
      if (msgTimeMs <= clearedTimeMs) return false;
    }
    return true;
  });

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedId) return;

    const myName = user?.name || user?.email?.split('@')[0] || 'Me';
    const newMsg = {
      sender: 'me',
      senderUid: user?.uid || null,
      senderName: myName,
      text: messageText.trim(),
      time: new Date(),
      deletedFor: []
    };

    const targetConv = conversations.find(c => c.id === selectedId);
    if (!targetConv) return;

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

        await updateDoc(docRef, {
          messages: updatedMsgs,
          lastMessage: sentText,
          time: new Date(),
          readBy: [user?.uid].filter(Boolean),
          ...resetHidden
        });
      } catch (error) {
        console.error('Failed to save message in Firestore:', error);
      }
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

  // WhatsApp-style: Clear Chat History ONLY FOR ME
  const handleClearChat = async () => {
    if (!activeConversation || !activeConversation.docId) return;
    setShowHeaderMenu(false);

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, {
        [`clearedFor.${myUid}`]: new Date()
      });
      showSuccess('Chat cleared for you');
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // WhatsApp-style: Delete Entire Conversation Thread ONLY FOR ME
  const handleDeleteConversation = async () => {
    if (!activeConversation || !activeConversation.docId) return;
    setShowHeaderMenu(false);

    try {
      const docRef = doc(db, 'messages', activeConversation.docId);
      await updateDoc(docRef, {
        [`hiddenFor.${myUid}`]: true,
        [`clearedFor.${myUid}`]: new Date()
      });
      setSelectedId(null);
      setMobileView('list');
      showSuccess('Conversation deleted for you');
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
        const newConvData = {
          name: targetUser.name,
          recipientUid: targetUser.uid,
          participants: [user?.uid, targetUser.uid].filter(Boolean),
          createdBy: user?.uid || null,
          readBy: [user?.uid].filter(Boolean),
          avatar: targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetUser.name)}`,
          lastMessage: 'Started a new conversation',
          time: new Date(),
          messages: []
        };
        const docRef = await addDoc(collection(db, 'messages'), newConvData);
        setSelectedId(docRef.id);
        setMobileView('chat');
        showSuccess(`Started chat with ${targetUser.name}`);
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
        await updateDoc(docRef, {
          readBy: arrayUnion(user.uid)
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
    <div className="section-container">
      <div className="flex flex-col md:flex-row gap-lg h-[calc(100vh-10rem)]">
        {/* Left Sidebar - Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          <Card className="flex-1 flex flex-col p-md overflow-hidden">
            {/* Header & Search */}
            <div className="p-md space-y-md border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-bold">Messages</h1>
                <Button size="xs" variant="primary" onClick={() => setIsNewChatOpen(true)}>
                  <Plus className="w-4 h-4 mr-xs inline" /> New Chat
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-2xl py-xs text-xs"
                />
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
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-md rounded-xl text-left flex items-center gap-md transition-colors ${
                      selectedId === conv.id
                        ? 'bg-primary-50 dark:bg-primary-950 border-l-4 border-primary-500'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-sm truncate text-neutral-900 dark:text-white">
                          {conv.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium ml-xs flex-shrink-0">
                          {formatRelativeTime(conv.time)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-xs">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))
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
        <div className={`flex-1 ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeConversation ? (
            <Card className="flex-1 flex flex-col p-0 overflow-hidden border-neutral-100 dark:border-neutral-800">
              {/* WhatsApp-Style Chat Header */}
              <div className="p-lg border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 relative">
                <div className="flex items-center gap-md">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-xs text-neutral-500 hover:text-neutral-900"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <img
                    src={activeConversation.avatar}
                    alt={activeConversation.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="font-bold text-base text-neutral-900 dark:text-white">{activeConversation.name}</h2>
                    <p className="text-xs text-success flex items-center gap-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" /> Real-Time Chat
                    </p>
                  </div>
                </div>

                {/* WhatsApp Style Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className="p-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Chat Options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Header Dropdown Menu */}
                  {showHeaderMenu && (
                    <div className="absolute right-0 top-full mt-xs w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-xs text-xs font-medium space-y-xs">
                      <button
                        onClick={handleClearChat}
                        className="w-full px-lg py-md text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-md"
                      >
                        <Eraser className="w-4 h-4 text-amber-500" /> Clear Chat (For Me)
                      </button>
                      <button
                        onClick={handleDeleteConversation}
                        className="w-full px-lg py-md text-left text-danger hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-md font-semibold"
                      >
                        <Trash2 className="w-4 h-4 text-danger" /> Delete Chat (For Me)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages Log with WhatsApp-Style Per-User Delete */}
              <div className="flex-1 overflow-y-auto p-lg space-y-md bg-neutral-50/50 dark:bg-neutral-950/40">
                {visibleMessages.length > 0 ? (
                  visibleMessages.map((msg, idx) => {
                    const isMe = msg.sender === 'me' || msg.senderUid === user?.uid;
                    return (
                      <div
                        key={idx}
                        className={`group flex flex-col max-w-[75%] relative ${
                          isMe ? 'ml-auto items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-xs">
                          {/* Trash Delete Icon - Deletes for Me */}
                          <button
                            onClick={() => handleDeleteMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-xs text-neutral-400 hover:text-danger rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
                            title="Delete for me"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div
                            className={`p-md rounded-2xl text-sm shadow-sm ${
                              isMe
                                ? 'bg-primary-500 text-white rounded-tr-none'
                                : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-100 dark:border-neutral-800 rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>

                        <span className="text-[10px] text-neutral-400 mt-xs px-xs font-medium">
                          {formatRelativeTime(msg.time)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-5xl">
                    <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                    <p className="text-sm font-semibold text-neutral-500">This is the start of your direct message history with {activeConversation.name}.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-md bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex gap-md items-center">
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
                        {st.college || 'Delhi University'}
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
    </div>
  );
}
