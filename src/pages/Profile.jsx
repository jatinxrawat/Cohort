import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Calendar, Award, Edit, MessageSquare, Share2, Heart, UserPlus, UserCheck, MessageCircleCode, AtSign, AlertCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatRelativeTime } from '@/utils/helpers';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');
  const targetName = searchParams.get('name');

  const { user: currentUser, updateUser } = useAuth();
  const { showSuccess } = useNotification();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if viewing own profile or another student
  const hasTarget = Boolean(targetUid || targetName);
  const isOwnProfile = !hasTarget ||
    (targetUid && targetUid === currentUser?.uid) ||
    (targetName && targetName.toLowerCase() === currentUser?.name?.toLowerCase());

  // Load Profile data directly from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
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
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [targetUid, targetName, currentUser, isOwnProfile]);

  const isFollowing = (currentUser?.following || []).includes(profileUser?.uid);

  const handleToggleFollow = async () => {
    if (!currentUser || !profileUser || isOwnProfile) return;

    const tUid = profileUser.uid;
    let nextFollowing = [...(currentUser.following || [])];
    let nextFollowers = [...(profileUser.followers || [])];

    if (isFollowing) {
      nextFollowing = nextFollowing.filter(id => id !== tUid);
      nextFollowers = nextFollowers.filter(id => id !== currentUser.uid);
      showSuccess(`Unfollowed @${profileUser.username || profileUser.name}`);
    } else {
      nextFollowing.push(tUid);
      nextFollowers.push(currentUser.uid);
      showSuccess(`Now following @${profileUser.username || profileUser.name}!`);

      // Dispatch Follow Notification
      createNotification({
        recipientUid: tUid,
        senderUid: currentUser.uid,
        senderName: currentUser.name || 'Student',
        senderAvatar: currentUser.avatar,
        type: 'follow',
        text: 'started following you.'
      });
    }

    // Update Firestore
    try {
      if (currentUser.uid) {
        const myRef = doc(db, 'users', currentUser.uid);
        await updateDoc(myRef, { following: nextFollowing });
        await updateUser({ following: nextFollowing });
      }

      if (tUid) {
        const targetRef = doc(db, 'users', tUid);
        await updateDoc(targetRef, { followers: nextFollowers });
      }
      setProfileUser(prev => ({ ...prev, followers: nextFollowers }));
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
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
                {profileUser?.college || 'Campus Community'}
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
              <span>{profileUser?.college || 'Campus Community'}</span>
            </div>
            <div className="flex items-center gap-md">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span>Member since {profileUser?.joinedDate ? new Date(profileUser.joinedDate).getFullYear() : '2026'}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-lg pt-lg border-t border-neutral-100 dark:border-neutral-800">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-primary-500">{stat.value}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
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
          <h2 className="text-xl font-heading font-bold mb-lg text-neutral-900 dark:text-white">
            {isOwnProfile ? 'My Feed Posts' : `Posts by ${profileUser?.name?.split(' ')[0] || 'User'}`}
          </h2>
          {userPosts.length > 0 ? (
            <div className="space-y-lg divide-y divide-neutral-100 dark:divide-neutral-800">
              {userPosts.map((post) => (
                <div key={post.id} className="pt-lg first:pt-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 mb-md leading-relaxed">
                    {post.content}
                  </p>
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
          )}
        </Card>
      </div>
    </div>
  );
}
