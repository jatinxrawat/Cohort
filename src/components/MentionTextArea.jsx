import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { UserCheck } from 'lucide-react';

export const MentionTextArea = ({
  value,
  onChange,
  placeholder = "What's on your mind?",
  rows = 3,
  className = '',
  onKeyDown,
  placement = 'bottom', // 'bottom' | 'top'
  ...props
}) => {
  const { user } = useAuth();
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all users on mount for @mentions suggestion list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const usersList = [];
        snap.forEach(d => {
          const data = d.data();
          if (d.id !== user?.uid && data.name) {
            usersList.push({
              uid: d.id,
              id: d.id,
              name: data.name,
              username: data.username || data.name.toLowerCase().replace(/\s+/g, ''),
              avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
              college: data.college || 'Campus Peer'
            });
          }
        });
        setAllUsers(usersList);
      } catch (err) {
        console.error('Error fetching users for mention suggestions:', err);
      }
    };

    fetchUsers();
  }, [user?.uid]);

  // Check text around cursor on cursor position change or input change
  const handleInputChange = (e) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(e);

    // Find if cursor is inside or immediately after an @token
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const queryText = textBeforeCursor.slice(lastAtIndex + 1);
      // Ensure no whitespace between @ and cursor position
      if (!/\s/.test(queryText)) {
        setMentionQuery(queryText);
        setMentionStartIndex(lastAtIndex);
        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionQuery(null);
  };

  const handleSelectUser = (suggestedUser) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;

    const usernameTag = `@${suggestedUser.username || suggestedUser.name.toLowerCase().replace(/\s+/g, '')} `;
    const textBeforeMention = value.slice(0, mentionStartIndex);
    const cursorPos = textareaRef.current.selectionStart;
    const textAfterMention = value.slice(cursorPos);

    const newText = textBeforeMention + usernameTag + textAfterMention;

    // Trigger synthetic onChange event
    const event = {
      target: { value: newText }
    };
    onChange(event);

    setShowSuggestions(false);
    setMentionQuery(null);

    // Set cursor position after the inserted @username tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = textBeforeMention.length + usernameTag.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  const handleKeyDownInternal = (e) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectUser(filteredUsers[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Filter & sort candidate users (prioritize users in user.following)
  const myFollowingList = user?.following || [];
  const filteredUsers = allUsers.filter(u => {
    if (mentionQuery === null) return true;
    const q = mentionQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  }).sort((a, b) => {
    const isAFollowing = myFollowingList.includes(a.uid);
    const isBFollowing = myFollowingList.includes(b.uid);
    if (isAFollowing && !isBFollowing) return -1;
    if (!isAFollowing && isBFollowing) return 1;
    return a.name.localeCompare(b.name);
  }).slice(0, 6);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        textareaRef.current && !textareaRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positionClasses = placement === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-1.5';

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDownInternal}
        placeholder={placeholder}
        rows={rows}
        className={className}
        {...props}
      />

      {/* @Mention Suggestion Dropdown Popover */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className={`absolute z-[100] left-0 ${positionClasses} w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all ring-1 ring-black/5 dark:ring-white/10`}
        >
          <div className="px-md py-xs bg-neutral-100/70 dark:bg-neutral-800/70 border-b border-neutral-200/80 dark:border-neutral-700/80 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Tag a peer (@mention)</span>
            <span className="text-primary-500">{filteredUsers.length} found</span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 py-1">
            {filteredUsers.map((u, idx) => {
              const isFollowing = myFollowingList.includes(u.uid);
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`w-full px-md py-sm flex items-center gap-md text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <UserAvatar
                    src={u.avatar}
                    name={u.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs">
                      <span className="font-bold text-xs truncate">{u.name}</span>
                      {isFollowing && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold bg-primary-500/10 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full border border-primary-500/20">
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Following</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 block truncate">
                      @{u.username}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionTextArea;
