import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Calendar, Award, Edit, MessageSquare, Share2, Heart, UserPlus, UserCheck, MessageCircleCode, AtSign, AlertCircle, User, GraduationCap, Gift, X, Search, Users, Edit2, Trash2, Repeat, EyeOff, Flame, Tag, ShoppingBag, ArrowRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatRelativeTime, compressImage } from '@/utils/helpers';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, query, where, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/utils/firebase';

const renderGenderBadge = (gender) => {
  if (!gender || gender === 'Prefer not to say') return null;
  const g = gender.toLowerCase();
  if (g === 'male') {
    return (
      <span
        title="Gender: Male"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 shadow-xs"
      >
        <span className="font-mono text-xs font-black">♂</span>
        <span>Male</span>
      </span>
    );
  }
  if (g === 'female') {
    return (
      <span
        title="Gender: Female"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-500 dark:text-pink-400 border border-pink-500/30 shadow-xs"
      >
        <span className="font-mono text-xs font-black">♀</span>
        <span>Female</span>
      </span>
    );
  }
  if (g === 'non-binary') {
    return (
      <span
        title="Gender: Non-binary"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30 shadow-xs"
      >
        <span className="font-mono text-xs font-black">⚧</span>
        <span>Non-binary</span>
      </span>
    );
  }
  return null;
};

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');
  const targetName = searchParams.get('name');

  const { user: currentUser, updateUser } = useAuth();
  const { showSuccess } = useNotification();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userAnonPosts, setUserAnonPosts] = useState([]);
  const [userMarketplaceItems, setUserMarketplaceItems] = useState([]);
  const [postsTab, setPostsTab] = useState('feed'); // 'feed' | 'anonymous' | 'marketplace'
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit / Delete Marketplace Item State
  const [editingMarketplaceItem, setEditingMarketplaceItem] = useState(null);
  const [deletingMarketplaceItem, setDeletingMarketplaceItem] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const editMarketplaceFileInputRef = useRef(null);


  // Followers / Following Modal State
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('followers');
  const [connectionsSearch, setConnectionsSearch] = useState('');
  const [connectionsList, setConnectionsList] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Edit / Delete Post State
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setEditedContent(post.content || post.text || '');
  };

  const handleSavePostEdit = async () => {
    if (!editingPost || !editedContent.trim()) return;
    setIsSubmittingEdit(true);
    try {
      if (editingPost.isAnonymous) {
        const targetColl = editingPost.isConfession ? 'confessions' : 'anonymousPosts';
        await updateDoc(doc(db, targetColl, editingPost.id), {
          text: editedContent.trim()
        });
        setUserAnonPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, text: editedContent.trim() } : p));
      } else {
        const postRef = doc(db, 'posts', editingPost.id);
        await updateDoc(postRef, {
          content: editedContent.trim(),
          updatedAt: new Date()
        });
        setUserPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editedContent.trim() } : p));
      }

      showSuccess('Post updated successfully!');
      setEditingPost(null);
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const [deletingPost, setDeletingPost] = useState(null);

  const confirmDeleteProfilePost = async () => {
    if (!deletingPost) return;
    try {
      const postId = typeof deletingPost === 'string' ? deletingPost : deletingPost.id;
      if (deletingPost.isAnonymous) {
        const targetColl = deletingPost.isConfession ? 'confessions' : 'anonymousPosts';
        await deleteDoc(doc(db, targetColl, postId));
        setUserAnonPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        await deleteDoc(doc(db, 'posts', postId));
        if (deletingPost.isReshare && deletingPost.originalPostId) {
          try {
            const origPostRef = doc(db, 'posts', deletingPost.originalPostId);
            await updateDoc(origPostRef, {
              reposts: increment(-1)
            });
          } catch (e) {
            console.error('Failed to decrement original post repost count:', e);
          }
        }
        setUserPosts(prev => prev.filter(p => p.id !== postId));
      }

      showSuccess('Post deleted successfully!');
      setDeletingPost(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Marketplace Edit / Delete Handlers in Profile
  const handleMarketplaceImageUpload = async (file) => {
    if (!file || !editingMarketplaceItem) return;
    setImageUploading(true);
    try {
      let finalUrl = '';
      try {
        finalUrl = await uploadImageToCloudinary(file);
      } catch (err) {
        finalUrl = await compressImage(file);
      }
      setEditingMarketplaceItem(prev => ({ ...prev, imageUrl: finalUrl }));
    } catch (err) {
      console.error('Failed to upload marketplace image:', err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSaveMarketplaceEdit = async (e) => {
    e.preventDefault();
    if (!editingMarketplaceItem || !editingMarketplaceItem.name?.trim() || !editingMarketplaceItem.price) return;
    try {
      const updatedFields = {
        name: editingMarketplaceItem.name.trim(),
        price: Number(editingMarketplaceItem.price),
        category: editingMarketplaceItem.category,
        condition: editingMarketplaceItem.condition,
        age: editingMarketplaceItem.age.trim(),
        desc: editingMarketplaceItem.desc.trim(),
        imageUrl: editingMarketplaceItem.imageUrl || '',
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'marketplace', editingMarketplaceItem.id), updatedFields);
      setUserMarketplaceItems(prev => prev.map(item => item.id === editingMarketplaceItem.id ? { ...item, ...updatedFields } : item));
      showSuccess(`Updated listing for "${editingMarketplaceItem.name}"!`);
      setEditingMarketplaceItem(null);
    } catch (err) {
      console.error('Failed to update marketplace listing:', err);
    }
  };

  const confirmDeleteMarketplaceItem = async () => {
    if (!deletingMarketplaceItem) return;
    try {
      await deleteDoc(doc(db, 'marketplace', deletingMarketplaceItem.id));
      setUserMarketplaceItems(prev => prev.filter(item => item.id !== deletingMarketplaceItem.id));
      showSuccess(`Deleted listing for "${deletingMarketplaceItem.name}"!`);
      setDeletingMarketplaceItem(null);
    } catch (err) {
      console.error('Failed to delete marketplace listing:', err);
    }
  };

  // Check if viewing own profile or another student
  const hasTarget = Boolean(targetUid || targetName);
  const isOwnProfile = !hasTarget ||
    (targetUid && targetUid === currentUser?.uid) ||
    (targetName && targetName.toLowerCase() === currentUser?.name?.toLowerCase());

  // Load Profile data directly from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!profileUser) {
        setLoading(true);
      }
      try {
        let activeProfile = null;

        if (isOwnProfile) {
          activeProfile = currentUser;
        } else {
          if (targetUid) {
            // Fetch target user by UID
            const docRef = doc(db, 'users', targetUid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              activeProfile = { uid: targetUid, id: targetUid, ...docSnap.data() };
            }
          }
          
          if (!activeProfile && targetName) {
            // Fetch target user by Name
            const q = query(collection(db, 'users'), where('name', '==', targetName));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(d => {
              activeProfile = { uid: d.id, id: d.id, ...d.data() };
            });
          }

          if (!activeProfile && (targetUid || targetName)) {
            // Create fallback profile so actions like follow/message work seamlessly
            const fallbackId = targetUid || `user_${Date.now()}`;
            const fallbackName = targetName || 'Kushal';
            activeProfile = {
              uid: fallbackId,
              id: fallbackId,
              name: fallbackName,
              username: fallbackName.toLowerCase().replace(/\s+/g, ''),
              college: 'KIET',
              followers: [],
              following: [],
              joinedDate: new Date().toISOString()
            };
          }
        }

        setProfileUser(activeProfile);

        if (activeProfile) {
          const currentUid = activeProfile.uid || targetUid;
          const currentName = activeProfile.name || targetName;

          // Fetch posts by this user from Firestore
          const querySnapshot = await getDocs(collection(db, 'posts'));
          const loaded = [];
          querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const isMatch = (data.author?.uid && data.author.uid === currentUid) ||
                            (data.author?.name && currentName && data.author.name.toLowerCase() === currentName.toLowerCase());
            if (isMatch) {
              loaded.push({
                id: docSnap.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
              });
            }
          });
          setUserPosts(loaded);
          const likesSum = loaded.reduce((acc, curr) => acc + (curr.likes || 0), 0);
          setTotalLikes(likesSum);

          // Fetch Anonymous Posts & Confessions authored by this user
          try {
            const loadedAnon = [];
            const anonSnap = await getDocs(query(collection(db, 'anonymousPosts'), where('authorUid', '==', currentUid)));
            anonSnap.forEach(d => {
              const data = d.data();
              loadedAnon.push({
                id: d.id,
                docId: d.id,
                isAnonymous: true,
                isConfession: false,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
              });
            });

            const confessionSnap = await getDocs(query(collection(db, 'confessions'), where('authorUid', '==', currentUid)));
            confessionSnap.forEach(d => {
              const data = d.data();
              loadedAnon.push({
                id: d.id,
                docId: d.id,
                isAnonymous: true,
                isConfession: true,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
              });
            });

            loadedAnon.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setUserAnonPosts(loadedAnon);
          } catch (err) {
            console.error('Error fetching user anonymous posts:', err);
          }

          // Fetch Marketplace Listings authored by this user
          try {
            const marketplaceSnap = await getDocs(collection(db, 'marketplace'));
            const loadedMarketplace = [];
            marketplaceSnap.forEach(d => {
              const data = d.data();
              const isMatch = (data.sellerUid && data.sellerUid === currentUid) ||
                              (data.seller && currentName && data.seller.toLowerCase() === currentName.toLowerCase());
              if (isMatch) {
                loadedMarketplace.push({
                  id: d.id,
                  docId: d.id,
                  ...data
                });
              }
            });
            setUserMarketplaceItems(loadedMarketplace);
          } catch (err) {
            console.error('Error fetching user marketplace items:', err);
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [targetUid, targetName, isOwnProfile]);

  // Load Followers / Following list for Modal
  useEffect(() => {
    if (!connectionsModalOpen) return;

    const fetchConnections = async () => {
      setLoadingConnections(true);
      const targetIds = activeTab === 'followers'
        ? (profileUser?.followers || [])
        : (profileUser?.following || []);

      try {
        const results = [];
        const allUsersSnap = await getDocs(collection(db, 'users'));
        const userMap = {};
        allUsersSnap.forEach(d => {
          userMap[d.id] = { uid: d.id, id: d.id, ...d.data() };
        });

        targetIds.forEach(id => {
          if (userMap[id]) {
            results.push(userMap[id]);
          } else {
            results.push({
              uid: id,
              id: id,
              name: id.startsWith('user_') ? 'Student Peer' : (profileUser?.name ? `${profileUser.name}'s Friend` : 'Campus Student'),
              username: `student_${id.slice(-4)}`,
              college: profileUser?.college || 'KIET',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`
            });
          }
        });

        setConnectionsList(results);
      } catch (err) {
        console.error('Error loading connections:', err);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [connectionsModalOpen, activeTab, profileUser]);

  const isMutual = (uId) => {
    const myFollowing = currentUser?.following || [];
    return myFollowing.includes(uId);
  };

  const handleListUserFollow = (tId, currentlyFollowing, tName) => {
    if (!currentUser || !tId) return;

    const currentFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
    let nextFollowing = [...currentFollowing];

    if (currentlyFollowing) {
      nextFollowing = nextFollowing.filter(id => id !== tId);
      showSuccess(`Unfollowed @${tName || 'user'}`);
    } else {
      nextFollowing.push(tId);
      showSuccess(`Now following @${tName || 'user'}!`);
    }

    updateUser({ following: nextFollowing });
    setDoc(doc(db, 'users', currentUser.uid), { following: nextFollowing }, { merge: true }).catch(err => console.error(err));
  };

  const filteredConnections = connectionsList.filter(u =>
    (u.name || '').toLowerCase().includes(connectionsSearch.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(connectionsSearch.toLowerCase())
  );

  const targetId = profileUser?.uid || targetUid;
  const isFollowing = (currentUser?.following || []).includes(targetId);

  const handleToggleFollow = () => {
    if (!currentUser || !targetId || isOwnProfile) return;

    const currentFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
    const targetFollowers = Array.isArray(profileUser?.followers) ? profileUser.followers : [];

    const currentlyFollowing = currentFollowing.includes(targetId);
    let nextFollowing = [...currentFollowing];
    let nextFollowers = [...targetFollowers];

    if (currentlyFollowing) {
      nextFollowing = nextFollowing.filter(id => id !== targetId);
      nextFollowers = nextFollowers.filter(id => id !== currentUser.uid);
      showSuccess(`Unfollowed @${profileUser?.username || profileUser?.name || 'user'}`);
    } else {
      nextFollowing.push(targetId);
      if (currentUser.uid && !nextFollowers.includes(currentUser.uid)) {
        nextFollowers.push(currentUser.uid);
      }
      showSuccess(`Now following @${profileUser?.username || profileUser?.name || 'user'}!`);
    }

    // 1. INSTANT 0ms OPTIMISTIC UI UPDATE
    setProfileUser(prev => prev ? ({ ...prev, followers: nextFollowers }) : { uid: targetId, followers: nextFollowers });
    updateUser({ following: nextFollowing });

    // 2. BACKGROUND FIRESTORE SYNC (non-blocking)
    const tasks = [
      setDoc(doc(db, 'users', currentUser.uid), { following: nextFollowing }, { merge: true }),
      setDoc(doc(db, 'users', targetId), { followers: nextFollowers }, { merge: true })
    ];

    if (!currentlyFollowing) {
      tasks.push(
        addDoc(collection(db, 'notifications'), {
          recipientUid: targetId,
          senderUid: currentUser.uid,
          senderName: currentUser.name || 'Student',
          senderAvatar: currentUser.avatar || '',
          type: 'follow',
          text: 'started following you.',
          read: false,
          createdAt: new Date().toISOString()
        })
      );
    }

    Promise.all(tasks).catch(err => console.error('Error syncing follow state:', err));
  };

  const handleSendMessage = () => {
    if (!profileUser) return;
    navigate(`/messages?recipientUid=${profileUser.uid}&recipientName=${encodeURIComponent(profileUser.name)}`);
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess('Profile link copied to clipboard!');
  };

  const achievements = [
    { icon: Award, label: 'Verified Student', desc: 'College account verified', earned: true },
    { icon: MessageSquare, label: 'Contributor', desc: 'Posted in campus feed', earned: userPosts.length > 0 },
    { icon: Heart, label: 'Popular Post', desc: 'Received at least 5 likes', earned: totalLikes >= 5 },
  ];

  const stats = [
    { label: 'Posts', value: userPosts.length },
    { label: 'Followers', value: profileUser?.followers?.length || 0 },
    { label: 'Following', value: profileUser?.following?.length || 0 },
  ];

  if (loading) {
    return (
      <div className="section-container max-w-2xl">
        <div className="h-44 skeleton rounded-2xl mb-lg" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!profileUser && !isOwnProfile) {
    return (
      <div className="section-container max-w-md mx-auto text-center py-5xl">
        <Card className="p-2xl space-y-md border-neutral-100 dark:border-neutral-800">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto" />
          <h2 className="text-xl font-bold">Student Profile Not Found</h2>
          <p className="text-sm text-neutral-500">This student user profile does not exist in the database.</p>
          <Button variant="primary" onClick={() => navigate('/home')}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="max-w-2xl mx-auto">
        {/* Cover and Avatar */}
        <div className="relative mb-lg">
          <div className="h-44 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl shadow-inner relative overflow-hidden">
            <div className="absolute top-4 right-4 text-xs font-semibold bg-white/20 backdrop-blur-md px-md py-xs rounded-full text-white">
              Student Edition
            </div>
          </div>
          <div className="absolute -bottom-6 left-lg">
            <img
              src={profileUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileUser?.email || 'user')}`}
              alt={profileUser?.name || 'User'}
              className="w-24 h-24 rounded-full border-4 border-white dark:border-neutral-900 shadow-md object-cover"
            />
          </div>
        </div>

        {/* Header with Actions */}
        <Card className="mb-lg pt-2xl border-neutral-100 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md mb-lg">
            <div>
              <h1 className="text-3xl font-heading font-bold text-neutral-900 dark:text-white leading-tight">
                {profileUser?.name || 'Student Name'}
              </h1>
              {profileUser?.username && (
                <p className="text-sm font-bold text-primary-500 font-mono mt-xs flex items-center gap-xs">
                  <AtSign className="w-4 h-4 inline" />{profileUser.username}
                </p>
              )}
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mt-xs">
                {profileUser?.college || 'KIET'}
              </p>
            </div>

            <div className="flex gap-md flex-wrap">
              {isOwnProfile ? (
                <>
                  <Link to="/edit-profile">
                    <Button variant="secondary" size="sm" className="flex items-center gap-md">
                      <Edit className="w-4 h-4" /> Edit Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="flex items-center gap-md" onClick={handleShareProfile}>
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    className="flex items-center gap-xs"
                    onClick={handleToggleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-success" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-xs"
                    onClick={handleSendMessage}
                  >
                    <MessageCircleCode className="w-4 h-4" /> Send Message
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-md text-neutral-600 dark:text-neutral-400 mb-lg text-sm">
            {profileUser?.email && (
              <div className="flex items-center gap-md">
                <Mail className="w-4 h-4 text-primary-500" />
                <span>{profileUser.email}</span>
              </div>
            )}
            <div className="flex items-center gap-md">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>{profileUser?.college || 'KIET'}</span>
            </div>
            {profileUser?.gender && (
              <div className="flex items-center gap-md">
                <User className="w-4 h-4 text-primary-500" />
                <span>Gender: {profileUser.gender}</span>
              </div>
            )}
            {profileUser?.year && (
              <div className="flex items-center gap-md">
                <GraduationCap className="w-4 h-4 text-primary-500" />
                <span>Year of study: {profileUser.year}</span>
              </div>
            )}
            {profileUser?.dob && (
              <div className="flex items-center gap-md">
                <Gift className="w-4 h-4 text-primary-500" />
                <span>Born: {new Date(profileUser.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center gap-md">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span>Member since {profileUser?.joinedDate ? new Date(profileUser.joinedDate).getFullYear() : '2026'}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-lg pt-lg border-t border-neutral-100 dark:border-neutral-800">
            <div className="text-center py-1">
              <p className="text-2xl font-bold text-primary-500">{userPosts.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs font-semibold uppercase tracking-wider">Posts</p>
            </div>

            <button
              onClick={() => { setActiveTab('followers'); setConnectionsModalOpen(true); }}
              className="text-center py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer group"
            >
              <p className="text-2xl font-bold text-primary-500 group-hover:scale-105 transition-transform">
                {profileUser?.followers?.length || 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs font-semibold uppercase tracking-wider">
                Followers
              </p>
            </button>

            <button
              onClick={() => { setActiveTab('following'); setConnectionsModalOpen(true); }}
              className="text-center py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer group"
            >
              <p className="text-2xl font-bold text-primary-500 group-hover:scale-105 transition-transform">
                {profileUser?.following?.length || 0}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs font-semibold uppercase tracking-wider">
                Following
              </p>
            </button>
          </div>
        </Card>

        {/* Achievements Card */}
        <Card className="mb-lg border-neutral-100 dark:border-neutral-800 shadow-sm">
          <h2 className="text-xl font-heading font-bold mb-lg text-neutral-900 dark:text-white">Achievements</h2>
          <div className="grid md:grid-cols-3 gap-lg">
            {achievements.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <div
                  key={i}
                  className={`p-lg rounded-xl text-center border transition-all ${
                    ach.earned
                      ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30'
                      : 'bg-neutral-50/50 dark:bg-neutral-800/10 border-neutral-100 dark:border-neutral-800/40 opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-md ${
                    ach.earned ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-xs text-neutral-900 dark:text-white">{ach.label}</p>
                  <p className="text-[10px] text-neutral-400 mt-xs leading-normal">{ach.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Activity Card */}
        <Card className="border-neutral-100 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-md">
            <h2 className="text-xl font-heading font-bold text-neutral-900 dark:text-white">
              {isOwnProfile
                ? (postsTab === 'feed' ? 'My Feed Posts' : postsTab === 'anonymous' ? 'My Anonymous Posts' : 'My Marketplace Listings')
                : (postsTab === 'marketplace' ? `Listings by ${profileUser?.name?.split(' ')[0] || 'User'}` : `Posts by ${profileUser?.name?.split(' ')[0] || 'User'}`)}
            </h2>

            <div className="p-xs bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center gap-xs text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setPostsTab('feed')}
                className={`px-md py-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  postsTab === 'feed'
                    ? 'bg-primary-500 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Feed Posts ({userPosts.length})
              </button>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setPostsTab('anonymous')}
                  className={`px-md py-xs rounded-full transition-all cursor-pointer flex items-center gap-xs whitespace-nowrap ${
                    postsTab === 'anonymous'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Anonymous ({userAnonPosts.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setPostsTab('marketplace')}
                className={`px-md py-xs rounded-full transition-all cursor-pointer flex items-center gap-xs whitespace-nowrap ${
                  postsTab === 'marketplace'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Marketplace ({userMarketplaceItems.length})
              </button>
            </div>
          </div>

          {postsTab === 'feed' ? (
            userPosts.length > 0 ? (
              <div className="space-y-lg divide-y divide-neutral-100 dark:divide-neutral-800">
                {userPosts.map((post) => (
                  <div key={post.id} className="pt-lg first:pt-0 group">
                    {post.isReshare && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-xs">
                        <Repeat className="w-3.5 h-3.5 text-primary-500" />
                        <span>Reshared post</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-md mb-md">
                      <div className="flex-1 min-w-0">
                        {post.thought && (
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-xs leading-relaxed">
                            {post.thought}
                          </p>
                        )}

                        {post.isReshare ? (
                          <div className="border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-md bg-neutral-50/50 dark:bg-neutral-800/40 space-y-xs">
                            <div className="flex items-center gap-sm">
                              <img
                                src={post.originalPost?.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                                alt="Author"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                {post.originalPost?.author?.name || 'Student'}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-2">
                              {post.originalPost?.content || post.content}
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                              {post.content}
                            </p>
                            {post.imageUrl && (
                              <div className="mt-md rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 max-w-md">
                                <img
                                  src={post.imageUrl}
                                  alt="Post attachment"
                                  className="w-full h-auto object-cover max-h-60"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {isOwnProfile && (
                        <div className="flex items-center gap-xs flex-shrink-0">
                          {!post.isReshare && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(post)}
                              className="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit post"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingPost(post)}
                            className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-lg text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                      <span>{formatRelativeTime(post.timestamp)}</span>
                      <span className="flex items-center gap-xs"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> {post.likes || 0} likes</span>
                      <span className="flex items-center gap-xs"><MessageSquare className="w-3.5 h-3.5 text-primary-500" /> {post.comments || 0} replies</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-xl">
                <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md animate-pulse-soft" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  No posts published yet.
                </p>
              </div>
            )
          ) : postsTab === 'anonymous' ? (
            /* ANONYMOUS POSTS TAB */
            userAnonPosts.length > 0 ? (
              <div className="space-y-lg divide-y divide-neutral-100 dark:divide-neutral-800">
                {userAnonPosts.map((post) => (
                  <div key={post.id} className="pt-lg first:pt-0 group">
                    <div className="flex items-center justify-between gap-md mb-xs">
                      <div className="flex items-center gap-xs text-xs font-semibold flex-wrap">
                        {post.isConfession ? (
                          <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 px-md py-xs rounded-full border border-rose-500/20">
                            <Flame className="w-3.5 h-3.5" /> Confession
                          </span>
                        ) : (
                          <span className="text-violet-400 flex items-center gap-1 bg-violet-500/10 px-md py-xs rounded-full border border-violet-500/20">
                            <EyeOff className="w-3.5 h-3.5" /> Anonymous Post ({post.anonymousName || 'Anonymous'})
                          </span>
                        )}
                        {renderGenderBadge(post.gender || profileUser?.gender)}
                      </div>

                      {isOwnProfile && (
                        <div className="flex items-center gap-xs flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(post)}
                            className="p-1.5 text-neutral-400 hover:text-violet-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit anonymous post"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPost(post)}
                            className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete anonymous post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed my-xs">
                      {post.text}
                    </p>

                    <div className="flex items-center gap-lg text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-sm">
                      <span>{formatRelativeTime(post.createdAt)}</span>
                      <span className="flex items-center gap-xs"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> {post.likesCount || post.likes || 0} likes</span>
                      <span className="flex items-center gap-xs"><MessageSquare className="w-3.5 h-3.5 text-primary-500" /> {post.commentsCount || post.comments || 0} replies</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-xl">
                <EyeOff className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  No anonymous posts published yet.
                </p>
              </div>
            )
          ) : (
            /* MARKETPLACE LISTINGS TAB */
            userMarketplaceItems.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-lg">
                {userMarketplaceItems.map((item) => (
                  <div key={item.id} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 flex flex-col group hover:shadow-md transition-shadow relative">
                    <div className="h-40 relative bg-neutral-900 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-r ${item.gradient || 'from-primary-500 to-blue-600'} p-md flex flex-col justify-end text-white`}>
                          <p className="text-xl font-bold font-mono">₹{item.price}</p>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex gap-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-white px-md py-xs rounded-full border border-white/10">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-semibold bg-black/50 backdrop-blur-md text-white px-md py-xs rounded-full border border-white/10">
                          {item.condition}
                        </span>
                      </div>

                      {item.imageUrl && (
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-md py-xs rounded-lg text-white font-mono font-bold text-sm border border-white/10">
                          ₹{item.price}
                        </div>
                      )}

                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 flex items-center gap-xs">
                          <button
                            type="button"
                            onClick={() => setEditingMarketplaceItem(item)}
                            className="p-1.5 bg-black/60 hover:bg-primary-500 text-white rounded-full backdrop-blur-md transition-colors"
                            title="Edit listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMarketplaceItem(item)}
                            className="p-1.5 bg-black/60 hover:bg-rose-500 text-white rounded-full backdrop-blur-md transition-colors"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-md flex-1 flex flex-col justify-between space-y-md">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Age: {item.age}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-xs leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-sm border-t border-neutral-100 dark:border-neutral-800 text-xs">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">₹{item.price}</span>
                        <button
                          type="button"
                          onClick={() => navigate('/marketplace')}
                          className="text-primary-500 font-semibold hover:underline flex items-center gap-xs text-xs"
                        >
                          View in Marketplace <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-xl">
                <ShoppingBag className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-md">
                  No active products listed in Campus Marketplace.
                </p>
                {isOwnProfile && (
                  <Button variant="primary" size="sm" onClick={() => navigate('/marketplace')}>
                    List a Product Now
                  </Button>
                )}
              </div>
            )
          )}
        </Card>
      </div>

      {/* Edit Feed Post Modal */}
      {editingPost && (
        <Modal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          title="Edit Feed Post"
          size="md"
        >
          <div className="space-y-md py-xs">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={4}
              className="w-full p-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white leading-relaxed resize-none"
              placeholder="Edit your post content..."
            />
            <div className="flex items-center justify-end gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingPost(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!editedContent.trim() || isSubmittingEdit}
                onClick={handleSavePostEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Feed Post UI Modal */}
      {deletingPost && (
        <Modal
          isOpen={Boolean(deletingPost)}
          onClose={() => setDeletingPost(null)}
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
                This post will be permanently deleted from your profile and feed. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingPost(null)}
                className="w-full"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeleteProfilePost}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Marketplace Item Modal */}
      {editingMarketplaceItem && (
        <Modal
          isOpen={Boolean(editingMarketplaceItem)}
          onClose={() => setEditingMarketplaceItem(null)}
          title="Edit Product Listing"
          size="md"
        >
          <form onSubmit={handleSaveMarketplaceEdit} className="space-y-lg">
            {/* Image Upload Component */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                Product Photo
              </label>
              {editingMarketplaceItem.imageUrl ? (
                <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-900 group">
                  <img
                    src={editingMarketplaceItem.imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingMarketplaceItem({ ...editingMarketplaceItem, imageUrl: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => editMarketplaceFileInputRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center justify-center cursor-pointer transition-all p-md text-center group"
                >
                  {imageUploading ? (
                    <div className="flex items-center gap-xs text-xs font-semibold text-primary-500">
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing image...
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center mb-xs group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-primary-500" />
                      </div>
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Upload or replace product photo
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={editMarketplaceFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleMarketplaceImageUpload(e.target.files?.[0])}
              />
            </div>

            <Input
              label="Item Title"
              value={editingMarketplaceItem.name || ''}
              onChange={(e) => setEditingMarketplaceItem({ ...editingMarketplaceItem, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                  Category
                </label>
                <select
                  value={editingMarketplaceItem.category || 'Books'}
                  onChange={(e) => setEditingMarketplaceItem({ ...editingMarketplaceItem, category: e.target.value })}
                  className="input-base text-sm py-md"
                >
                  {['Books', 'Electronics', 'Bicycles', 'Clothing', 'Room Essentials'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                  Condition
                </label>
                <select
                  value={editingMarketplaceItem.condition || 'Excellent'}
                  onChange={(e) => setEditingMarketplaceItem({ ...editingMarketplaceItem, condition: e.target.value })}
                  className="input-base text-sm py-md"
                >
                  {['Like New', 'Excellent', 'Good', 'Fair'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <Input
                label="Price (₹)"
                type="number"
                value={editingMarketplaceItem.price || ''}
                onChange={(e) => setEditingMarketplaceItem({ ...editingMarketplaceItem, price: e.target.value })}
              />

              <Input
                label="Item Age / Usage"
                value={editingMarketplaceItem.age || ''}
                onChange={(e) => setEditingMarketplaceItem({ ...editingMarketplaceItem, age: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                Detailed Description
              </label>
              <textarea
                rows={3}
                value={editingMarketplaceItem.desc || ''}
                onChange={(e) => setEditingMarketplaceItem({ ...editingMarketplaceItem, desc: e.target.value })}
                className="input-base text-sm resize-none"
              />
            </div>

            <div className="flex gap-md pt-md border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingMarketplaceItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-1" disabled={imageUploading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Marketplace Item Confirmation Modal */}
      {deletingMarketplaceItem && (
        <Modal
          isOpen={Boolean(deletingMarketplaceItem)}
          onClose={() => setDeletingMarketplaceItem(null)}
          title="Delete Marketplace Listing"
          size="sm"
        >
          <div className="text-center py-sm space-y-md">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Delete "{deletingMarketplaceItem.name}"?</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs leading-relaxed">
                This item will be permanently removed from your profile and the Campus Marketplace. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button variant="secondary" size="sm" onClick={() => setDeletingMarketplaceItem(null)} className="w-full">
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeleteMarketplaceItem}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- CONNECTIONS MODAL (FOLLOWERS / FOLLOWING / MUTUALS) --- */}
      {connectionsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span>Connections</span>
              </h2>
              <button
                onClick={() => setConnectionsModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher (Followers | Following) */}
            <div className="flex bg-neutral-950 p-1 rounded-2xl border border-neutral-800 mb-4">
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'followers'
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Followers ({profileUser?.followers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'following'
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Following ({profileUser?.following?.length || 0})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={connectionsSearch}
                onChange={(e) => setConnectionsSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingConnections ? (
                <div className="py-12 text-center text-xs text-neutral-400 font-medium">
                  Loading connections...
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 font-medium">
                  No {activeTab} found.
                </div>
              ) : (
                filteredConnections.map((userItem) => {
                  const isFollowingUser = (currentUser?.following || []).includes(userItem.uid);
                  const isSelf = userItem.uid === currentUser?.uid;
                  const isMutualPeer = isMutual(userItem.uid);

                  return (
                    <div
                      key={userItem.uid}
                      className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl flex items-center justify-between gap-3 hover:border-neutral-700 transition-all"
                    >
                      {/* Avatar & User Details */}
                      <div
                        onClick={() => {
                          setConnectionsModalOpen(false);
                          navigate(`/profile?uid=${userItem.uid}&name=${encodeURIComponent(userItem.name)}`);
                        }}
                        className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                      >
                        <img
                          src={userItem.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userItem.name || 'user')}`}
                          alt={userItem.name}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-700 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-white group-hover:text-primary-400 transition-colors truncate">
                              {userItem.name}
                            </p>
                            {isMutualPeer && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Mutual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 font-mono truncate">
                            @{userItem.username || (userItem.name || 'user').toLowerCase().replace(/\s+/g, '')}
                          </p>
                          {isMutualPeer && (
                            <p className="text-[10px] text-neutral-500 font-medium">
                              Followed by you
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {!isSelf && (
                          <button
                            onClick={() => handleListUserFollow(userItem.uid, isFollowingUser, userItem.name)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              isFollowingUser
                                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/20'
                            }`}
                          >
                            {isFollowingUser ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-success" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setConnectionsModalOpen(false);
                            navigate(`/messages?recipientUid=${userItem.uid}&recipientName=${encodeURIComponent(userItem.name)}`);
                          }}
                          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                          title="Message"
                        >
                          <MessageCircleCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
