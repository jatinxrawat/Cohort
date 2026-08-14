import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { UserAvatar } from '@/components/UserAvatar';
import FormattedText from '@/components/FormattedText';
import {
  Search as SearchIcon,
  Users,
  MessageCircleCode,
  Sparkles,
  X,
  FileText,
  TrendingUp,
  Clock,
  History,
  Trash2,
  Tag
} from 'lucide-react';
import { useDebounce } from '@/hooks';
import SEO from '@/components/SEO';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  
  const [peopleResults, setPeopleResults] = useState([]);
  const [postsResults, setPostsResults] = useState([]);

  // Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Read URL query parameter e.g. ?q=%23Cohort or ?hashtag=Cohort
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('hashtag');
    if (qParam) {
      const decoded = decodeURIComponent(qParam);
      setSearchTerm(decoded);
      if (decoded.startsWith('#')) {
        setActiveTab('Posts');
      }
    }
  }, [searchParams]);

  // Search History State (persisted in localStorage)
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cohort_search_history');
      return saved ? JSON.parse(saved) : ['#Cohort', '#CampusLife', '@student', 'KIET'];
    } catch (e) {
      return ['#Cohort', '#CampusLife', '@student', 'KIET'];
    }
  });

  const debouncedQuery = useDebounce(searchTerm, 300);
  const tabs = ['All', 'Students', 'Posts'];

  // Add query to search history
  const addToHistory = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('cohort_search_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Remove single item from history
  const removeHistoryItem = (termToRemove, e) => {
    if (e) e.stopPropagation();
    setSearchHistory(prev => {
      const updated = prev.filter(item => item !== termToRemove);
      try {
        localStorage.setItem('cohort_search_history', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  // Clear all search history
  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('cohort_search_history');
    } catch (e) {}
  };

  // Save term to history when debounced query executes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      addToHistory(debouncedQuery.trim());
    }
  }, [debouncedQuery]);

  // Perform search across Firestore users & posts
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setPeopleResults([]);
        setPostsResults([]);
        return;
      }

      setLoading(true);
      const rawTerm = debouncedQuery.trim().toLowerCase();
      const cleanTerm = rawTerm.replace(/^[@#]/, '').trim();
      const isHashtagSearch = rawTerm.startsWith('#');

      try {
        // Search Students / Users (skip if purely searching a hashtag)
        if (!isHashtagSearch) {
          const usersSnap = await getDocs(collection(db, 'users'));
          const foundPeople = [];
          let addedCohort = false;

          usersSnap.forEach(d => {
            const data = d.data();
            const nameMatch = data.name && data.name.toLowerCase().includes(cleanTerm);
            const usernameMatch = data.username && data.username.toLowerCase().includes(cleanTerm);
            const collegeMatch = data.college && data.college.toLowerCase().includes(cleanTerm);

            if (nameMatch || usernameMatch || collegeMatch) {
              const isCohortAccount =
                d.id === 'cohort_official' ||
                (data.username || '').toLowerCase() === 'cohort' ||
                (data.name || '').toLowerCase() === 'cohort' ||
                data.isOfficial === true;

              if (isCohortAccount) {
                if (!addedCohort) {
                  addedCohort = true;
                  foundPeople.push({
                    id: 'cohort_official',
                    uid: 'cohort_official',
                    name: 'Cohort',
                    username: 'cohort',
                    college: 'Cohort Official Platform',
                    isOfficial: true,
                    bio: data.bio || 'The official Cohort platform account. Connecting students across campuses.',
                    avatar: data.avatar || 'https://ui-avatars.com/api/?name=Cohort&background=9333ea&color=fff&bold=true&size=128'
                  });
                }
              } else {
                foundPeople.push({ id: d.id, uid: d.id, ...data });
              }
            }
          });
          setPeopleResults(foundPeople);
        } else {
          setPeopleResults([]);
        }

        // Search Feed Posts for matching content or hashtag
        const postsSnap = await getDocs(collection(db, 'posts'));
        const foundPosts = [];
        postsSnap.forEach(d => {
          const data = d.data();
          const content = (data.content || '').toLowerCase();
          const authorName = (data.author?.name || '').toLowerCase();

          const contentMatch = content.includes(rawTerm) || content.includes(cleanTerm);
          const authorMatch = authorName.includes(cleanTerm);

          if (contentMatch || authorMatch) {
            foundPosts.push({ id: d.id, docId: d.id, ...data });
          }
        });
        setPostsResults(foundPosts);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const hasResults = (activeTab === 'All' || activeTab === 'Students' ? peopleResults.length : 0) +
                     (activeTab === 'All' || activeTab === 'Posts' ? postsResults.length : 0) > 0;

  const handleSelectChip = (chipText) => {
    setSearchTerm(chipText);
    addToHistory(chipText);
  };

  return (
    <div className="section-container max-w-4xl mx-auto space-y-xl">
      <SEO title="Search Campus" />
      {/* Search Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-neutral-900 dark:text-white flex items-center justify-center md:justify-start gap-md">
          Search Campus
          <Sparkles className="w-6 h-6 text-primary-500" />
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-xs">
          Discover classmates by name or @username, view profiles, and send instant direct messages.
        </p>
      </div>

      {/* Modern Search Input Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 via-sky-500/30 to-indigo-500/30 rounded-3xl blur-md opacity-0 group-focus-within:opacity-100 group-hover:opacity-70 transition-all duration-500" />

        <div className="relative flex items-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 rounded-2xl px-4 py-3 shadow-xl group-focus-within:border-purple-500/60 dark:group-focus-within:border-purple-500/60 transition-all duration-300">
          <SearchIcon className="w-5 h-5 text-neutral-400 group-focus-within:text-purple-500 transition-colors flex-shrink-0 mr-3" />

          <input
            ref={inputRef}
            type="text"
            placeholder="Search student names, @username, #hashtags, or posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                addToHistory(searchTerm);
              }
            }}
            className="w-full bg-transparent text-sm md:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none font-medium"
          />

          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-lg flex-shrink-0 select-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const count = tab === 'Students' ? peopleResults.length : tab === 'Posts' ? postsResults.length : null;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md scale-[1.02]'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <span>{tab}</span>
              {searchTerm && count !== null && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${activeTab === tab ? 'bg-white/20 dark:bg-black/20 text-white dark:text-neutral-900' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Results / Discovery Body */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-md py-lg"
          >
            <div className="h-16 skeleton rounded-2xl" />
            <div className="h-16 skeleton rounded-2xl" />
            <div className="h-16 skeleton rounded-2xl" />
          </motion.div>
        ) : searchTerm ? (
          hasResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-xl"
            >
              {/* People / Students Results */}
              {(activeTab === 'All' || activeTab === 'Students') && peopleResults.length > 0 && (
                <div className="space-y-md">
                  <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-xs flex items-center gap-xs">
                    <Users className="w-4 h-4 text-primary-500" /> Students ({peopleResults.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-md">
                    {peopleResults.map((person) => (
                      <Card
                        key={person.id}
                        className="p-md hover:shadow-md border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-md transition-all group"
                      >
                        <div className="flex items-center gap-md min-w-0">
                          <UserAvatar
                            src={person.avatar}
                            name={person.name}
                            className="w-12 h-12 rounded-full ring-2 ring-primary-500/20 group-hover:ring-primary-500 transition-all flex-shrink-0 object-cover"
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                              {person.name}
                            </h3>
                            {person.username && (
                              <p className="text-xs font-mono text-primary-500 font-bold">
                                @{person.username}
                              </p>
                            )}
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-[2px]">
                              {person.college || 'Campus Student'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-xs flex-shrink-0">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => navigate(`/profile?uid=${person.uid}`)}
                          >
                            Profile
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => navigate(`/messages?recipientUid=${person.uid}&recipientName=${encodeURIComponent(person.name)}`)}
                            className="flex items-center gap-xs"
                          >
                            <MessageCircleCode className="w-3.5 h-3.5" /> Message
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Posts Results */}
              {(activeTab === 'All' || activeTab === 'Posts') && postsResults.length > 0 && (
                <div className="space-y-md pt-md">
                  <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-xs flex items-center gap-xs">
                    <FileText className="w-4 h-4 text-primary-500" /> Posts ({postsResults.length})
                  </h2>
                  <div className="space-y-md">
                    {postsResults.map((post) => (
                      <Card key={post.id} className="p-lg border-neutral-100 dark:border-neutral-800 hover:shadow-sm transition-shadow">
                        <div
                          onClick={() => post.author?.uid && navigate(`/profile?uid=${post.author.uid}`)}
                          className="flex items-center gap-md mb-md cursor-pointer group"
                        >
                          <UserAvatar
                            src={post.author?.avatar}
                            name={post.author?.name || 'Student'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors">
                              {post.author?.name || 'Student'}
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-medium">Campus Post</span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed mb-md whitespace-pre-wrap break-words">
                          <FormattedText text={post.content} />
                        </p>
                        {post.imageUrl && (
                          <div className="mb-md rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-950/40 flex items-center justify-center">
                            <img
                              src={post.imageUrl}
                              alt="Post attachment"
                              className="w-full h-auto max-h-[700px] object-contain rounded-2xl"
                            />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* No Results Found State */
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-w-md mx-auto rounded-3xl p-2xl"
            >
              <SearchIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-xs">No Matches Found</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                We couldn't find any student or post matching "{debouncedQuery}". Try searching by exact name, #hashtag, or @username.
              </p>
            </motion.div>
          )
        ) : (
          /* Initial State: Popular Searches + Search History */
          <motion.div
            key="history-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-xl"
          >
            {/* Quick Chips / Popular Searches & Hashtags */}
            <div className="flex items-center gap-xs flex-wrap">
              <span className="text-xs font-bold text-neutral-400 mr-sm flex items-center gap-xs">
                <TrendingUp className="w-3.5 h-3.5 text-primary-500" /> Trending & Popular:
              </span>
              {['#Cohort', '#CampusLife', '#StudentStartup', '#BuildInPublic', '@student', 'KIET'].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSelectChip(chip)}
                  className={`px-md py-xs rounded-full text-xs font-bold transition-all cursor-pointer ${
                    chip.startsWith('#')
                      ? 'bg-sky-500/10 text-sky-500 dark:text-sky-400 hover:bg-sky-500/20 border border-sky-500/20'
                      : chip.startsWith('@')
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Recent Search History Section */}
            <div className="space-y-md pt-md">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>Recent Searches</span>
                </h2>
                {searchHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear history</span>
                  </button>
                )}
              </div>

              {searchHistory.length > 0 ? (
                <div className="space-y-2">
                  {searchHistory.map((queryText) => (
                    <div
                      key={queryText}
                      onClick={() => handleSelectChip(queryText)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-neutral-900/90 border border-neutral-200/70 dark:border-neutral-800/80 hover:border-primary-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-colors flex-shrink-0">
                          <History className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 transition-colors truncate">
                          {queryText}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => removeHistoryItem(queryText, e)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                        title="Remove from history"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/30">
                  <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">No Recent Searches</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Your recent searches will appear here for quick access.</p>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
