import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useNotification } from '@/contexts/NotificationContext';
import { Bookmark, Heart, MessageCircle, Share2, EyeOff, BookmarkMinus } from 'lucide-react';
import { formatRelativeTime } from '@/utils/helpers';

export default function SavedPosts() {
  const { showSuccess } = useNotification();
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('collex-saved-posts');
    if (stored) {
      setSavedPosts(JSON.parse(stored));
    }
  }, []);

  const handleUnsave = (postId, postTitle) => {
    const updated = savedPosts.filter(p => p.id !== postId);
    setSavedPosts(updated);
    localStorage.setItem('collex-saved-posts', JSON.stringify(updated));
    showSuccess(`Removed post from bookmarks.`);
  };

  return (
    <div className="section-container max-w-2xl">
      <div className="mb-3xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-md">
          <Bookmark className="w-8 h-8 text-primary-500 fill-primary-500/10" /> Saved Posts
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-xs">
          View bookmarked feeds, updates, and campus discussions you saved
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {savedPosts.length > 0 ? (
          <motion.div
            layout
            className="space-y-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {savedPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="p-lg border-neutral-100 dark:border-neutral-800">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-md">
                    <div className="flex items-center gap-md">
                      <img
                        src={post.author.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {post.author.name}
                        </h4>
                        <span className="text-[10px] text-neutral-400">
                          {post.author.role} • {formatRelativeTime(post.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleUnsave(post.id, post.content)}
                      className="p-md text-neutral-400 hover:text-danger rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      title="Unsave post"
                    >
                      <BookmarkMinus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-lg whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div className="mb-lg rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40">
                      <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-auto object-cover max-h-96"
                      />
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center gap-xl text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-md">
                    <span className="flex items-center gap-md"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> {post.likes}</span>
                    <span className="flex items-center gap-md"><MessageCircle className="w-4 h-4" /> {post.comments}</span>
                    <span className="flex items-center gap-md"><Share2 className="w-4 h-4" /> {post.shares}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-5xl card border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-w-md mx-auto rounded-2xl"
          >
            <Bookmark className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
            <h3 className="font-bold text-lg mb-md">No Saved Posts</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              When you browse your campus feed on Home, click the bookmark icon to save important discussions for later reference.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
