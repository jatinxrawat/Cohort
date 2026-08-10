import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Calendar, Award, Edit, MessageSquare, Share2, Heart, UserPlus, UserCheck, MessageCircleCode, AtSign, AlertCircle, User, GraduationCap, Gift, X, Search, Users, Edit2, Trash2, Repeat, EyeOff, Flame, Tag, ShoppingBag, ArrowRight, Image as ImageIcon, Loader2, Send, Rss, ShieldCheck, Check, Camera } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatRelativeTime, compressImage, getAvatarUrl } from '@/utils/helpers';
import { UserAvatar } from '@/components/UserAvatar';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import SEO from '@/components/SEO';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, query, where, deleteDoc, increment, onSnapshot, orderBy } from 'firebase/firestore';
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

  // Likes & Comments Modals State
  const [selectedPostForLikes, setSelectedPostForLikes] = useState(null);
  const [likedUsersList, setLikedUsersList] = useState([]);
  const [loadingLikedUsers, setLoadingLikedUsers] = useState(false);

  // Official Cohort Account Edit State
  const [isEditOfficialModalOpen, setIsEditOfficialModalOpen] = useState(false);
  const [officialBioInput, setOfficialBioInput] = useState('');
  const [officialAvatarUrl, setOfficialAvatarUrl] = useState('');
  const [officialAvatarPreview, setOfficialAvatarPreview] = useState('');
  const [isUploadingOfficialAvatar, setIsUploadingOfficialAvatar] = useState(false);
  const [isSavingOfficial, setIsSavingOfficial] = useState(false);
  const officialFileInputRef = useRef(null);

  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const commentInputRef = useRef(null);

  const parseCommentDate = (rawDate) => {
    if (!rawDate) return 'Recently';
    if (typeof rawDate === 'string') {
      const p = new Date(rawDate);
      if (!isNaN(p.getTime())) return formatRelativeTime(p);
      return rawDate;
    }
    if (typeof rawDate === 'number') return formatRelativeTime(new Date(rawDate));
    if (rawDate?.toDate && typeof rawDate.toDate === 'function') return formatRelativeTime(rawDate.toDate());
    if (rawDate?.seconds) return formatRelativeTime(new Date(rawDate.seconds * 1000));
    return 'Recently';
  };

  const handleOpenLikesModal = async (post) => {
    setSelectedPostForLikes(post);
    setLoadingLikedUsers(true);
    try {
      const likedUids = post.likedUsers || post.upvotedUsers || post.likedBy || (Array.isArray(post.likes) ? post.likes : []);
      if (!likedUids || likedUids.length === 0) {
        setLikedUsersList([]);
        setLoadingLikedUsers(false);
        return;
      }

      const userDocs = await Promise.all(
        likedUids.map(uid => getDoc(doc(db, 'users', uid)).catch(() => null))
      );

      const list = [];
      userDocs.forEach((d, idx) => {
        const uid = likedUids[idx];
        if (d && d.exists()) {
          const data = d.data();
          list.push({
            uid,
            name: data.name || 'Student',
            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`,
            college: data.college || 'Campus Member'
          });
        } else {
          list.push({
            uid,
            name: 'Student',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`,
            college: 'Campus Member'
          });
        }
      });
      setLikedUsersList(list);
    } catch (err) {
      console.error('Failed to fetch liked users:', err);
    } finally {
      setLoadingLikedUsers(false);
    }
  };

  const handleOpenCommentsModal = (post) => {
    setSelectedPostForComments(post);
    setReplyingToComment(null);
  };

  const handleReplyToComment = (c) => {
    setReplyingToComment(c);
    const mention = (c.authorUsername || c.authorName || 'user').replace(/\s+/g, '');
    setNewCommentText(`@${mention} `);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  useEffect(() => {
    if (!selectedPostForComments) {
      setCommentsList([]);
      setReplyingToComment(null);
      return;
    }

    setLoadingComments(true);
    const collName = selectedPostForComments.collectionName ||
      (selectedPostForComments.isConfession ? 'confessions' : (selectedPostForComments.isAnonymous ? 'anonymousPosts' : 'posts'));

    const q = collection(db, collName, selectedPostForComments.id, 'comments');

    const unsub = onSnapshot(q, (snap) => {
      const loaded = [];
      snap.forEach(d => {
        const data = d.data();
        const rawDate = data.createdAt || data.timestamp;
        loaded.push({
          id: d.id,
          ...data,
          authorName: data.authorName || data.author || data.authorUsername || 'Student',
          authorAvatar: data.authorAvatar || data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.authorUid || d.id)}`,
          displayDateText: parseCommentDate(rawDate)
        });
      });
      setCommentsList(loaded);
      setLoadingComments(false);
    }, (err) => {
      console.error('Error fetching comments:', err);
      setLoadingComments(false);
    });

    return () => unsub();
  }, [selectedPostForComments]);

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || !selectedPostForComments || !currentUser) return;

    setSubmittingComment(true);
    const collName = selectedPostForComments.collectionName ||
      (selectedPostForComments.isConfession ? 'confessions' : (selectedPostForComments.isAnonymous ? 'anonymousPosts' : 'posts'));

    try {
      const now = new Date();
      const commentData = {
        text: newCommentText.trim(),
        authorUid: currentUser.uid,
        authorName: currentUser.name || 'Student',
        author: currentUser.name || 'Student',
        authorAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.uid)}`,
        avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.uid)}`,
        createdAt: now,
        timestamp: now,
        parentId: replyingToComment ? replyingToComment.id : null,
        replyToAuthorUid: replyingToComment ? (replyingToComment.authorUid || null) : null,
        replyToAuthorName: replyingToComment ? (replyingToComment.authorName || replyingToComment.author || null) : null,
        likes: 0,
        likedBy: []
      };

      await addDoc(collection(db, collName, selectedPostForComments.id, 'comments'), commentData);

      const postRef = doc(db, collName, selectedPostForComments.id);
      await updateDoc(postRef, {
        commentsCount: increment(1),
        comments: increment(1)
      }).catch(() => {});

      const updateList = (list) => list.map(p => p.id === selectedPostForComments.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p);
      setUserPosts(prev => updateList(prev));
      setUserAnonPosts(prev => updateList(prev));

      setNewCommentText('');
      setReplyingToComment(null);
      showSuccess('Comment posted!');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

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
  const isOfficialLoggedIn =
    (currentUser?.username || '').toLowerCase() === 'cohort' ||
    (currentUser?.name || '').toLowerCase() === 'cohort' ||
    currentUser?.isOfficial === true ||
    currentUser?.uid === 'cohort_official';

  const isOwnProfile = !hasTarget ||
    (targetUid && (targetUid === currentUser?.uid || (isOfficialLoggedIn && targetUid === 'cohort_official'))) ||
    (targetName && targetName.toLowerCase() === currentUser?.name?.toLowerCase());

  // Load Profile data directly from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!profileUser) {
        setLoading(true);
      }
      try {
        let activeProfile = null;

        const isCohortTarget =
          targetUid === 'cohort_official' ||
          (targetName || '').toLowerCase() === 'cohort' ||
          (isOwnProfile && isOfficialLoggedIn);

        if (isCohortTarget) {
          const cohortDocRef = doc(db, 'users', 'cohort_official');
          const cohortSnap = await getDoc(cohortDocRef);
          if (cohortSnap.exists()) {
            activeProfile = { uid: 'cohort_official', id: 'cohort_official', ...cohortSnap.data() };
          } else {
            activeProfile = {
              uid: 'cohort_official',
              id: 'cohort_official',
              name: 'Cohort',
              username: 'cohort',
              email: 'cohort@official.com',
              college: 'Cohort Official Platform',
              isOfficial: true,
              bio: 'The official Cohort platform account. Connecting students across campuses. Follow for official feature updates, campus drops, and 24/7 support.',
              followers: [],
              following: [],
              avatar: 'https://ui-avatars.com/api/?name=Cohort&background=9333ea&color=fff&bold=true&size=128',
              joinedDate: new Date().toISOString()
            };
          }
        } else if (isOwnProfile) {
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
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const isMatch = (data.author?.uid && data.author.uid === currentUid) ||
                            (data.author?.name && currentName && data.author.name.toLowerCase() === currentName.toLowerCase());
            if (isMatch) {
              const likedUsers = data.likedUsers || data.upvotedUsers || data.likedBy || (Array.isArray(data.likes) ? data.likes : []);
              const likesCount = (typeof data.likes === 'number' && data.likes > 0)
                ? data.likes
                : (typeof data.upvotes === 'number' && data.upvotes > 0
                  ? data.upvotes
                  : (data.likesCount || likedUsers.length));
              let commentsCount = (typeof data.comments === 'number' && data.comments > 0)
                ? data.comments
                : (data.commentsCount || (Array.isArray(data.comments) ? data.comments.length : 0));
              try {
                const cSnap = await getDocs(collection(db, 'posts', docSnap.id, 'comments'));
                if (cSnap.size > 0 || !commentsCount) {
                  commentsCount = cSnap.size;
                }
              } catch (e) {}

              loaded.push({
                id: docSnap.id,
                docId: docSnap.id,
                collectionName: 'posts',
                ...data,
                likedUsers,
                likesCount,
                commentsCount,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
              });
            }
          }
          setUserPosts(loaded);
          const likesSum = loaded.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);
          setTotalLikes(likesSum);

          // Fetch Anonymous Posts & Confessions authored by this user
          try {
            const loadedAnon = [];
            const anonSnap = await getDocs(query(collection(db, 'anonymousPosts'), where('authorUid', '==', currentUid)));
            for (const d of anonSnap.docs) {
              const data = d.data();
              const likedUsers = data.likedUsers || data.upvotedUsers || data.likedBy || (Array.isArray(data.likes) ? data.likes : []);
              const likesCount = (typeof data.likes === 'number' && data.likes > 0)
                ? data.likes
                : (typeof data.upvotes === 'number' && data.upvotes > 0
                  ? data.upvotes
                  : (data.likesCount || likedUsers.length));
              let commentsCount = (typeof data.comments === 'number' && data.comments > 0)
                ? data.comments
                : (data.commentsCount || (Array.isArray(data.comments) ? data.comments.length : 0));
              try {
                const cSnap = await getDocs(collection(db, 'anonymousPosts', d.id, 'comments'));
                if (cSnap.size > 0 || !commentsCount) {
                  commentsCount = cSnap.size;
                }
              } catch (e) {}

              loadedAnon.push({
                id: d.id,
                docId: d.id,
                collectionName: 'anonymousPosts',
                isAnonymous: true,
                isConfession: false,
                ...data,
                likedUsers,
                likesCount,
                commentsCount,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
              });
            }

            const confessionSnap = await getDocs(query(collection(db, 'confessions'), where('authorUid', '==', currentUid)));
            for (const d of confessionSnap.docs) {
              const data = d.data();
              const likedUsers = data.likedUsers || data.upvotedUsers || data.likedBy || (Array.isArray(data.likes) ? data.likes : []);
              const likesCount = (typeof data.likes === 'number' && data.likes > 0)
                ? data.likes
                : (typeof data.upvotes === 'number' && data.upvotes > 0
                  ? data.upvotes
                  : (data.likesCount || likedUsers.length));
              let commentsCount = (typeof data.comments === 'number' && data.comments > 0)
                ? data.comments
                : (data.commentsCount || (Array.isArray(data.comments) ? data.comments.length : 0));
              try {
                const cSnap = await getDocs(collection(db, 'confessions', d.id, 'comments'));
                if (cSnap.size > 0 || !commentsCount) {
                  commentsCount = cSnap.size;
                }
              } catch (e) {}

              loadedAnon.push({
                id: d.id,
                docId: d.id,
                collectionName: 'confessions',
                isAnonymous: true,
                isConfession: true,
                ...data,
                likedUsers,
                likesCount,
                commentsCount,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
              });
            }

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

  useEffect(() => {
    if (isEditOfficialModalOpen && profileUser) {
      setOfficialBioInput(profileUser.bio || "The official Cohort platform account. Connecting students across campuses. Follow for official feature updates, campus drops, and 24/7 support.");
      setOfficialAvatarUrl(profileUser.avatar || '');
      setOfficialAvatarPreview(profileUser.avatar || '');
    }
  }, [isEditOfficialModalOpen, profileUser]);

  const handleOfficialAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingOfficialAvatar(true);
      const preview = URL.createObjectURL(file);
      setOfficialAvatarPreview(preview);

      const compressed = await compressImage(file);
      const uploadedUrl = await uploadImageToCloudinary(compressed);

      if (uploadedUrl) {
        setOfficialAvatarUrl(uploadedUrl);
        setOfficialAvatarPreview(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setOfficialAvatarUrl(reader.result);
          setOfficialAvatarPreview(reader.result);
        };
        reader.readAsDataURL(compressed);
      }
    } catch (err) {
      console.error('Failed to process avatar:', err);
      showError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingOfficialAvatar(false);
    }
  };

  const handleSaveOfficialProfile = async () => {
    setIsSavingOfficial(true);
    try {
      const updatedBio = officialBioInput.trim();
      const updatedAvatar = officialAvatarUrl || profileUser?.avatar || 'https://ui-avatars.com/api/?name=Cohort&background=9333ea&color=fff&bold=true&size=128';

      const cohortDocRef = doc(db, 'users', 'cohort_official');
      await setDoc(cohortDocRef, {
        bio: updatedBio,
        avatar: updatedAvatar
      }, { merge: true });

      setProfileUser(prev => prev ? ({ ...prev, bio: updatedBio, avatar: updatedAvatar }) : prev);

      showSuccess('Cohort Official Profile updated!');
      setIsEditOfficialModalOpen(false);
    } catch (err) {
      console.error('Failed to update Official Account:', err);
      showError('Failed to save official profile updates.');
    } finally {
      setIsSavingOfficial(false);
    }
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
  const isOfficialCohortAccount =
    targetUid === 'cohort_official' ||
    (profileUser?.username || '').toLowerCase() === 'cohort' ||
    (profileUser?.name || '').toLowerCase() === 'cohort' ||
    (targetName || '').toLowerCase() === 'cohort' ||
    profileUser?.isOfficial === true ||
    profileUser?.uid === 'cohort_official';

  const isFollowing = isOfficialCohortAccount || (currentUser?.following || []).includes(targetId);

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

  const renderFormattedBio = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 mt-sm max-w-xl">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-1" />;

          const parseBold = (content) => {
            const parts = content.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="font-extrabold text-neutral-900 dark:text-white bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });
          };

          if (trimmed.includes('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed
              .split('•')
              .flatMap(item => item.split(/[-*]\s+/))
              .map(i => i.trim())
              .filter(Boolean);

            if (items.length > 1) {
              return (
                <div key={lineIdx} className="flex flex-wrap gap-2 my-1.5">
                  {items.map((item, itemIdx) => (
                    <span
                      key={itemIdx}
                      className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-indigo-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-xs backdrop-blur-xs"
                    >
                      {parseBold(item)}
                    </span>
                  ))}
                </div>
              );
            }
          }

          return (
            <p key={lineIdx} className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
              {parseBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

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
      <SEO title="Student Profile" />
      <div className="max-w-2xl mx-auto">
        {/* Cover and Avatar */}
        <div className="relative mb-lg">
          {isOfficialCohortAccount ? (
            <div className="h-44 bg-neutral-950 rounded-2xl shadow-2xl relative overflow-hidden border border-purple-500/30 flex items-center justify-center">
              {/* Radial Glowing Background Accents */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-pink-900/15 to-transparent pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Large Stylized "Cohort." Logo Banner */}
              <div className="relative z-10 select-none flex items-baseline tracking-tighter">
                <span className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                  Cohort
                </span>
                <span className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.9)] animate-pulse">
                  .
                </span>
              </div>

              {/* Official Account Pill Badge */}
              <div className="absolute top-4 right-4 text-xs font-black bg-neutral-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-purple-200 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5 z-20">
                <ShieldCheck className="w-4 h-4 text-purple-400 fill-purple-500/30 stroke-[2.5]" />
                <span>Official Platform Account</span>
              </div>
            </div>
          ) : (
            <div className="h-44 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl shadow-inner relative overflow-hidden">
              <div className="absolute top-4 right-4 text-xs font-semibold bg-white/20 backdrop-blur-md px-md py-xs rounded-full text-white">
                Student Edition
              </div>
            </div>
          )}

          <div className="absolute -bottom-6 left-lg group">
            <UserAvatar
              src={profileUser?.avatar || 'https://ui-avatars.com/api/?name=Cohort&background=9333ea&color=fff&bold=true&size=128'}
              name={profileUser?.name || 'User'}
              className="w-24 h-24 rounded-full border-4 border-white dark:border-neutral-900 shadow-md object-cover"
            />
            {isOfficialCohortAccount && (
              <button
                type="button"
                onClick={() => setIsEditOfficialModalOpen(true)}
                className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg border-2 border-white dark:border-neutral-900 transition-transform hover:scale-110 cursor-pointer"
                title="Edit Official Avatar & Bio"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Header with Actions */}
        <Card className="mb-lg pt-2xl border-neutral-100 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md mb-lg">
            {isOfficialCohortAccount ? (
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-3xl font-heading font-black text-neutral-900 dark:text-white tracking-tight">
                    Cohort
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600/30 via-fuchsia-600/30 to-pink-600/30 border border-purple-500/60 text-purple-300 dark:text-purple-200 text-xs font-black shadow-[0_0_15px_rgba(168,85,247,0.4)] backdrop-blur-md">
                    <ShieldCheck className="w-4 h-4 text-purple-400 fill-purple-500/40 stroke-[2.5]" />
                    <span className="tracking-wider">OFFICIAL TEAM</span>
                  </div>
                </div>

                <p className="mt-xs text-sm font-black font-mono flex items-center gap-xs">
                  <AtSign className="w-4 h-4 text-purple-400 stroke-[2.5]" />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 bg-clip-text text-transparent tracking-wider">
                    cohort
                  </span>
                </p>

                {renderFormattedBio(
                  profileUser?.bio ||
                    "The official Cohort platform account.\nConnect • Make Friends • Join Groups • Build Communities\n**Campus life, redefined.**"
                )}
              </div>
            ) : (
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
                {(profileUser?.bio || isOwnProfile) && (
                  profileUser?.bio ? (
                    renderFormattedBio(profileUser.bio)
                  ) : (
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-sm leading-relaxed max-w-xl font-normal">
                      <span className="italic text-neutral-400 dark:text-neutral-500 text-xs">
                        Add a bio in Edit Profile to tell others about yourself...
                      </span>
                    </p>
                  )
                )}
              </div>
            )}

            <div className="flex gap-md flex-wrap items-center">
              {isOfficialCohortAccount ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-xs border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 font-bold"
                    onClick={() => setIsEditOfficialModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 text-purple-500" /> Edit Profile
                  </Button>

                  <div className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-sky-600/20 border border-sky-400/40 text-sky-600 dark:text-sky-300 text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                    <Check className="w-4 h-4 text-sky-400 stroke-[3]" />
                    <span>Following Official Account</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-xs"
                    onClick={handleSendMessage}
                  >
                    <MessageCircleCode className="w-4 h-4" /> Message Support
                  </Button>
                </>
              ) : isOwnProfile ? (
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

          {!isOfficialCohortAccount && (
            <div className="space-y-md text-neutral-600 dark:text-neutral-400 mb-lg text-sm">
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
          )}

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

        {/* Recent Activity Card */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 shadow-md rounded-3xl p-5 sm:p-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-neutral-100 dark:border-neutral-800/80 pb-5">
            <h2 className="text-xl font-heading font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <span>
                {isOwnProfile
                  ? (postsTab === 'feed' ? 'My Feed Posts' : postsTab === 'anonymous' ? 'My Anonymous Posts' : 'My Marketplace Listings')
                  : (postsTab === 'marketplace' ? `Listings by ${profileUser?.name?.split(' ')[0] || 'User'}` : `Posts by ${profileUser?.name?.split(' ')[0] || 'User'}`)}
              </span>
            </h2>

            {/* Glassmorphic Segmented Tab Bar */}
            <div className="p-1.5 bg-neutral-100/90 dark:bg-neutral-950/80 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl flex items-center gap-1 text-xs font-semibold overflow-x-auto scrollbar-none shadow-inner">
              <button
                type="button"
                onClick={() => setPostsTab('feed')}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  postsTab === 'feed'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 font-bold scale-[1.02]'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Rss className="w-3.5 h-3.5" />
                <span>Post ({userPosts.length})</span>
              </button>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setPostsTab('anonymous')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    postsTab === 'anonymous'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 font-bold scale-[1.02]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Anon. ({userAnonPosts.length})</span>
                </button>
              )}

              {!isOfficialCohortAccount && (
                <button
                  type="button"
                  onClick={() => setPostsTab('marketplace')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    postsTab === 'marketplace'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 font-bold scale-[1.02]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Market ({userMarketplaceItems.length})</span>
                </button>
              )}
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
                              <UserAvatar
                                src={post.originalPost?.author?.avatar}
                                name={post.originalPost?.author?.name || 'Student'}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                {post.originalPost?.author?.name || 'Student'}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-2 whitespace-pre-wrap break-words">
                              {post.originalPost?.content || post.content}
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
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

                    <div className="flex items-center gap-md text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-sm pt-xs border-t border-neutral-100 dark:border-neutral-800/60">
                      <span>{formatRelativeTime(post.timestamp)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLikesModal(post);
                        }}
                        className="flex items-center gap-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-sm py-xs rounded-lg transition-colors cursor-pointer font-bold"
                        title="Click to see who liked this post"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{post.likesCount || 0} Likes</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentsModal(post);
                        }}
                        className="flex items-center gap-xs text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 px-sm py-xs rounded-lg transition-colors cursor-pointer font-bold"
                        title="Click to read comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>{post.commentsCount || 0} Replies</span>
                      </button>
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

                    <div className="flex items-center gap-md text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-sm pt-xs border-t border-neutral-100 dark:border-neutral-800/60">
                      <span>{formatRelativeTime(post.createdAt)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLikesModal(post);
                        }}
                        className="flex items-center gap-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-sm py-xs rounded-lg transition-colors cursor-pointer font-bold"
                        title="Click to see who liked this post"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{post.likesCount || 0} Likes</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentsModal(post);
                        }}
                        className="flex items-center gap-xs text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 px-sm py-xs rounded-lg transition-colors cursor-pointer font-bold"
                        title="Click to read comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>{post.commentsCount || 0} Replies</span>
                      </button>
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

      {/* ── LIKES LIST MODAL ── */}
      {selectedPostForLikes && (
        <Modal
          isOpen={Boolean(selectedPostForLikes)}
          onClose={() => { setSelectedPostForLikes(null); setLikedUsersList([]); }}
          title="Liked By"
          size="sm"
        >
          <div className="space-y-md">
            {loadingLikedUsers ? (
              <div className="space-y-sm py-xl text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                <p className="text-xs text-neutral-400">Loading likes list...</p>
              </div>
            ) : likedUsersList.length > 0 ? (
              <div className="space-y-xs max-h-80 overflow-y-auto pr-xs scrollbar-thin">
                {likedUsersList.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => {
                      setSelectedPostForLikes(null);
                      navigate(`/profile?uid=${u.uid}`);
                    }}
                    className="flex items-center justify-between p-sm rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-md min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-neutral-800 border border-neutral-700"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {u.name}
                        </h4>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {u.college}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-xl">
                <Heart className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-xs" />
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">No likes yet</p>
                <p className="text-[10px] text-neutral-400 mt-1">Be the first to like this post!</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── COMMENTS & DISCUSSION MODAL ── */}
      {selectedPostForComments && (
        <Modal
          isOpen={Boolean(selectedPostForComments)}
          onClose={() => { setSelectedPostForComments(null); setCommentsList([]); setNewCommentText(''); }}
          title="Comments & Discussion"
          size="md"
        >
          <div className="space-y-lg flex flex-col max-h-[75vh]">
            {/* Post Summary Header */}
            <div className="p-md rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-xs flex-shrink-0">
              <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-relaxed line-clamp-3">
                {selectedPostForComments.thought || selectedPostForComments.content || selectedPostForComments.text || 'Post details'}
              </p>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-xs">
                <span>{formatRelativeTime(selectedPostForComments.timestamp || selectedPostForComments.createdAt)}</span>
                <span className="text-primary-500 font-bold">{commentsList.length} comments</span>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-md pr-xs scrollbar-thin min-h-[150px] max-h-[300px]">
              {loadingComments ? (
                <div className="py-xl text-center space-y-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                  <p className="text-xs text-neutral-400">Loading comments...</p>
                </div>
              ) : commentsList.length > 0 ? (
                commentsList.map((c) => (
                  <div key={c.id} className="p-md rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/40 dark:border-neutral-700/40 space-y-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <UserAvatar
                          src={c.authorAvatar}
                          name={c.authorName || 'Student'}
                          className="w-6 h-6 rounded-full object-cover border border-neutral-700"
                        />
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">
                          {c.authorName || 'Student'}
                        </span>
                      </div>

                      <div className="flex items-center gap-xs">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {c.displayDateText || 'Recently'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReplyToComment(c)}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary-500 hover:text-primary-400 px-2 py-0.5 rounded-md hover:bg-primary-500/10 transition-colors cursor-pointer ml-xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-8">
                      {c.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-xl">
                  <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-xs" />
                  <p className="text-xs text-neutral-400 font-medium">No comments on this post yet.</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Start the conversation below!</p>
                </div>
              )}
            </div>

            {/* Replying Banner */}
            {replyingToComment && (
              <div className="flex items-center justify-between px-md py-xs bg-primary-500/10 border border-primary-500/30 rounded-xl text-xs text-primary-400 font-semibold flex-shrink-0">
                <span>Replying to <strong className="text-white">@{replyingToComment.authorName}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToComment(null);
                    setNewCommentText('');
                  }}
                  className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-sm items-center pt-md border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
              <input
                ref={commentInputRef}
                type="text"
                placeholder={replyingToComment ? `Replying to @${replyingToComment.authorName}...` : "Write a comment..."}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 px-md py-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-1 focus:ring-primary-500"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!newCommentText.trim() || submittingComment}
                className="flex items-center gap-xs text-xs"
              >
                {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Post</span>
              </Button>
            </form>
          </div>
        </Modal>
      )}

      {/* Modal to Edit Cohort Official Account */}
      {isEditOfficialModalOpen && (
        <Modal
          isOpen={isEditOfficialModalOpen}
          onClose={() => setIsEditOfficialModalOpen(false)}
          title="Edit Official Cohort Profile"
        >
          <div className="space-y-lg">
            {/* Avatar Edit */}
            <div className="flex flex-col items-center gap-sm">
              <div className="relative">
                <UserAvatar
                  src={officialAvatarPreview || 'https://ui-avatars.com/api/?name=Cohort&background=9333ea&color=fff&bold=true&size=128'}
                  name="Cohort"
                  className="w-24 h-24 rounded-full border-4 border-purple-500/40 object-cover shadow-xl"
                />
                {isUploadingOfficialAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={officialFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOfficialAvatarSelect}
              />
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-xs text-xs font-bold border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
                onClick={() => officialFileInputRef.current?.click()}
                disabled={isUploadingOfficialAvatar}
              >
                <Camera className="w-4 h-4 text-purple-500" /> Change Official Image
              </Button>
            </div>

            {/* Bio Edit */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-xs uppercase tracking-wider">
                Official Account Bio
              </label>
              <textarea
                value={officialBioInput}
                onChange={(e) => setOfficialBioInput(e.target.value)}
                placeholder="Enter official account bio..."
                className="w-full p-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 text-neutral-900 dark:text-white leading-relaxed resize-none"
                rows={4}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-md pt-md border-t border-neutral-100 dark:border-neutral-800">
              <Button
                variant="ghost"
                onClick={() => setIsEditOfficialModalOpen(false)}
                disabled={isSavingOfficial}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveOfficialProfile}
                disabled={isSavingOfficial || isUploadingOfficialAvatar}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {isSavingOfficial ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
