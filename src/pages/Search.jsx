import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  Search as SearchIcon,
  Users,
  MessageCircleCode,
  User,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  FileText,
  AtSign,
  TrendingUp
} from 'lucide-react';
import { useDebounce } from '@/hooks';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default function Search() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  
  const [peopleResults, setPeopleResults] = useState([]);
  const [postsResults, setPostsResults] = useState([]);
  const [featuredStudents, setFeaturedStudents] = useState([]);

  const debouncedQuery = useDebounce(searchTerm, 300);
  const tabs = ['All', 'Students', 'Posts'];

  // Load initial featured students from Firestore for quick discovery
  useEffect(() => {
    const loadInitialStudents = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const loaded = [];
        usersSnap.forEach(d => {
          loaded.push({ id: d.id, uid: d.id, ...d.data() });
        });
        setFeaturedStudents(loaded.slice(0, 6));
      } catch (err) {
        console.error('Failed to load initial students:', err);
      }
    };
    loadInitialStudents();
  }, []);

  // Perform search across Firestore users & posts
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setPeopleResults([]);
        setPostsResults([]);
        return;
      }

      setLoading(true);
      const cleanTerm = debouncedQuery.toLowerCase().replace('@', '').trim();

      try {
        // Search Students / Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const foundPeople = [];
        usersSnap.forEach(d => {
          const data = d.data();
          const nameMatch = data.name && data.name.toLowerCase().includes(cleanTerm);
          const usernameMatch = data.username && data.username.toLowerCase().includes(cleanTerm);
          const collegeMatch = data.college && data.college.toLowerCase().includes(cleanTerm);

          if (nameMatch || usernameMatch || collegeMatch) {
            foundPeople.push({ id: d.id, uid: d.id, ...data });
          }
        });
        setPeopleResults(foundPeople);

        // Search Feed Posts
        const postsSnap = await getDocs(collection(db, 'posts'));
        const foundPosts = [];
        postsSnap.forEach(d => {
          const data = d.data();
          const contentMatch = data.content && data.content.toLowerCase().includes(cleanTerm);
          const authorMatch = data.author?.name && data.author.name.toLowerCase().includes(cleanTerm);

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

  return (
    <div className="section-container max-w-4xl mx-auto space-y-xl">
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
        <div className="flex items-center bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-sm shadow-md group-focus-within:border-primary-500 group-focus-within:ring-4 group-focus-within:ring-primary-500/10 transition-all">
          <SearchIcon className="w-5 h-5 text-neutral-400 ml-md flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by student name (e.g. Jatin), @username, or post content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-md py-sm text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white mr-sm rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {searchTerm && (
        <div className="flex items-center gap-sm border-b border-neutral-100 dark:border-neutral-800 pb-sm">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-xl py-xs rounded-full text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab === 'Students' ? `Students (${peopleResults.length})` : tab === 'Posts' ? `Posts (${postsResults.length})` : tab}
            </button>
          ))}
        </div>
      )}

      {/* Main Results or Discovery View */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="space-y-md">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 skeleton rounded-2xl" />
            ))}
          </div>
        ) : debouncedQuery ? (
          hasResults ? (
            <motion.div
              layout
              className="space-y-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Students Results */}
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
                          <img
                            src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(person.email || 'user')}`}
                            alt={person.name}
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
                          <img
                            src={post.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                            alt={post.author?.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors">
                              {post.author?.name || 'Student'}
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-medium">Campus Post</span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {post.content}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-w-md mx-auto rounded-3xl p-2xl"
            >
              <SearchIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-xs">No Matches Found</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                We couldn't find any student or post matching "{debouncedQuery}". Try searching by exact name or @username.
              </p>
            </motion.div>
          )
        ) : (
          /* Empty Search Discovery View: Show Featured Classmates */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-xl"
          >
            {/* Quick Chips */}
            <div className="flex items-center gap-xs flex-wrap">
              <span className="text-xs font-bold text-neutral-400 mr-sm flex items-center gap-xs">
                <TrendingUp className="w-3.5 h-3.5 text-primary-500" /> Popular Searches:
              </span>
              {['@jatin', 'KIET', 'Computer Science', 'Campus Community'].map(chip => (
                <button
                  key={chip}
                  onClick={() => setSearchTerm(chip)}
                  className="px-md py-xs bg-neutral-100 dark:bg-neutral-800/80 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 rounded-full text-xs font-semibold transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Featured Classmates Section */}
            {featuredStudents.length > 0 && (
              <div className="space-y-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-xs">
                    <Users className="w-4 h-4 text-primary-500" /> Classmates & Students
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-md">
                  {featuredStudents.map((student) => (
                    <Card
                      key={student.id}
                      className="p-md border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-md hover:shadow-md transition-all group"
                    >
                      <div
                        onClick={() => navigate(`/profile?uid=${student.uid}`)}
                        className="flex items-center gap-md min-w-0 cursor-pointer"
                      >
                        <img
                          src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.email || 'user')}`}
                          alt={student.name}
                          className="w-12 h-12 rounded-full border-2 border-primary-500/30 group-hover:border-primary-500 transition-all flex-shrink-0 object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors truncate">
                            {student.name}
                          </h3>
                          {student.username && (
                            <p className="text-xs font-mono text-primary-500 font-bold">
                              @{student.username}
                            </p>
                          )}
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-[1px]">
                            {student.college || 'KIET'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => navigate(`/messages?recipientUid=${student.uid}&recipientName=${encodeURIComponent(student.name)}`)}
                        className="flex items-center gap-xs flex-shrink-0"
                      >
                        <MessageCircleCode className="w-3.5 h-3.5" /> Message
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
