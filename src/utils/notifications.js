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
  type, // 'follow' | 'reply' | 'like' | 'reshare' | 'system'
  text,
  postId = null
}) => {
  // Don't send notification to yourself or if no recipient
  if (!recipientUid || recipientUid === senderUid) return;

  try {
    await addDoc(collection(db, 'notifications'), {
      recipientUid,
      senderUid,
      senderName: senderName || 'A Student',
      senderAvatar: senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderUid)}`,
      type,
      text,
      postId,
      read: false,
      time: new Date()
    });
  } catch (err) {
    console.error('Failed to create notification in Firestore:', err);
  }
};
