import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

/**
 * Creates a notification in Firestore for a recipient user.
 */
export const createNotification = async ({
  recipientUid,
  senderUid,
  senderName,
  senderAvatar,
  type, // 'follow' | 'reply' | 'like' | 'reshare' | 'system' | 'community_invite'
  text,
  postId = null,
  commentId = null,
  communityId = null,
  communityName = null
}) => {
  if (!recipientUid || recipientUid === senderUid) return;

  try {
    await addDoc(collection(db, 'notifications'), {
      recipientUid,
      senderUid: senderUid || null,
      senderName: senderName || 'A Student',
      senderAvatar: senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderUid || 'user')}`,
      type: type || 'system',
      text: text || '',
      postId: postId || null,
      commentId: commentId || null,
      communityId: communityId || null,
      communityName: communityName || null,
      read: false,
      time: new Date(),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to create notification in Firestore:', err);
  }
};
