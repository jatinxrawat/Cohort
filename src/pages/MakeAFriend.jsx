import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
import SEO from '@/components/SEO';
import {
  Sparkles,
  Heart,
  X,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Flame,
  Check,
  RefreshCw,
  User,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Battery,
  Crown,
  Clock,
  MessageCircle,
  Mountain,
  Music,
  Utensils,
  Film,
  Dumbbell,
  Lightbulb,
  Rocket,
  Globe,
  PenTool,
  FileText,
  VolumeX,
  Zap,
  Filter,
  Sliders,
  MapPin,
  Smile,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { db } from '@/utils/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, addDoc } from 'firebase/firestore';

// Define Categories
const CATEGORIES = ['Personality', 'Interests', 'Passion', 'Dislikes'];

// Define Questions (5 per category, total 20) with clean Lucide icons
const QUESTIONS = [
  // Category: Personality
  {
    id: 'p1',
    category: 'Personality',
    text: 'How do you charge your social battery?',
    icon: Battery,
    options: [
      'Chattering with a crowd (Extrovert)',
      'Gaming or reading solo in my room (Introvert)',
      'Board game nights with a close circle (Ambivert)',
      'Spontaneous adventures with strangers (Chaos)'
    ]
  },
  {
    id: 'p2',
    category: 'Personality',
    text: 'In a group project, what role do you naturally fall into?',
    icon: Crown,
    options: [
      'The Leader: Organizing tasks & pushing deadlines',
      'The Workhorse: Doing the actual work & coding',
      'The Creative: Designing the slides & aesthetics',
      'The Cheerleader: Keeping morale high & ordering pizza'
    ]
  },
  {
    id: 'p3',
    category: 'Personality',
    text: 'Your friend is crying over a breakup. What do you do?',
    icon: Heart,
    options: [
      'Hug them and listen to them vent for hours (Listener)',
      'Plan a distraction or suggest rational solutions (Fixer)',
      'Show up at their door with ice cream & snacks (Nurturer)',
      'Offer to write a diss track about their ex (Feisty)'
    ]
  },
  {
    id: 'p4',
    category: 'Personality',
    text: 'How do you handle deadlines?',
    icon: Clock,
    options: [
      'Planned out and finished weeks in advance',
      'Procrastinate until the last 3 hours, then excel',
      'What deadlines? Life is a wave, man',
      'Grind day and night without sleep'
    ]
  },
  {
    id: 'p5',
    category: 'Personality',
    text: 'What is your communication style?',
    icon: MessageCircle,
    options: [
      'Blunt & Direct: Say exactly what is on my mind',
      'Gentle & Diplomatic: Sugarcoat to keep the peace',
      'Meme-lord: Answer exclusively in memes and witty lines',
      'Essayist: Send long, detailed text blocks'
    ]
  },

  // Category: Interests
  {
    id: 'i1',
    category: 'Interests',
    text: 'What is your ultimate weekend escape?',
    icon: Mountain,
    options: [
      'Outdoors: Hiking and catching sunsets',
      'Indoors: Bingeing series or gaming all day',
      'Chill: Cozy cafes and indie bookstores',
      'Social: Partying, clubbing or live music gigs'
    ]
  },
  {
    id: 'i2',
    category: 'Interests',
    text: 'Choose your sonic vibe (Favorite music genre):',
    icon: Music,
    options: [
      'Rock / Metal / Indie',
      'Pop / EDM / Hip-Hop',
      'Classical / Jazz / Lo-Fi',
      'Bollywood / Desi Beats'
    ]
  },
  {
    id: 'i3',
    category: 'Interests',
    text: "What's your go-to cuisine when ordering out?",
    icon: Utensils,
    options: [
      'Western: Pizza, burgers, and fries',
      'Asian: Ramen, sushi, or spicy noodles',
      'Desi: Biryani, paneer, and butter naan',
      'Healthy: Salads, bowls, and smoothies'
    ]
  },
  {
    id: 'i4',
    category: 'Interests',
    text: 'Which form of content gets most of your screentime?',
    icon: Film,
    options: [
      'Cinematic: Movies and heavy TV series',
      'Short-form: Reels or YouTube shorts',
      'Literary: Novels, manga, or webtoons',
      'Intellectual: Podcasts, video essays, documentaries'
    ]
  },
  {
    id: 'i5',
    category: 'Interests',
    text: 'What is your favorite physical/active outlet?',
    icon: Dumbbell,
    options: [
      'Team sports: Football, cricket, basketball',
      'Fitness: Weightlifting, yoga, running',
      'Esports: Competitive gaming',
      'Resting: Sleeping is my Olympic sport'
    ]
  },

  // Category: Passion
  {
    id: 'pa1',
    category: 'Passion',
    text: 'What drives you to learn coding/career skills?',
    icon: Lightbulb,
    options: [
      'Creation: Building things that solve real problems',
      'Wealth: Securing the bag and early retirement',
      'Curiosity: Exploring cutting-edge AI & frontiers',
      'Expression: Making beautiful layouts & designs'
    ]
  },
  {
    id: 'pa2',
    category: 'Passion',
    text: 'If you had $10M to start any business, it would be...',
    icon: Rocket,
    options: [
      'A high-tech AI startup changing the world',
      'A cozy bookstore cafe or animal shelter',
      'A creative studio doing design & media',
      'An incubator training future innovators'
    ]
  },
  {
    id: 'pa3',
    category: 'Passion',
    text: 'What is your dream travel destination type?',
    icon: Globe,
    options: [
      'Cultural: Historic temples in Kyoto or Rome',
      'Tropical: Relaxing on a beach in Bali or Maldives',
      'Metropolis: Wandering Tokyo or New York at night',
      'Extreme: Seeing Northern Lights in Iceland'
    ]
  },
  {
    id: 'pa4',
    category: 'Passion',
    text: 'What kind of impact do you want to make on campus?',
    icon: Users,
    options: [
      'Leader: Run clubs and lead student government',
      'Connector: Plan social mixers & welcome everyone',
      'Scholar: Ace classes, publish papers & win hacks',
      'Ghost: Stay low-key, graduate, and leave no trace'
    ]
  },
  {
    id: 'pa5',
    category: 'Passion',
    text: 'What is your favorite medium of creative expression?',
    icon: PenTool,
    options: [
      'Writing: Poetry, blogs, or clean syntax',
      'Visuals: Sketching, photography, UI design',
      'Sound: Playing instruments, singing, or DJing',
      'Speaking: Debates, storytelling, or podcasting'
    ]
  },

  // Category: Dislikes
  {
    id: 'd1',
    category: 'Dislikes',
    text: 'What is your biggest social pet peeve?',
    icon: Clock,
    options: [
      'Lateness: Showing up 45m late without texting',
      'Screen-staring: Being on phones during a 1-on-1',
      'Bragging: Constant humblebrags about internship/grades',
      'Flakiness: Canceling plans at the last minute'
    ]
  },
  {
    id: 'd2',
    category: 'Dislikes',
    text: 'Which academic hazard do you despise the most?',
    icon: FileText,
    options: [
      'Surprise quizzes on Monday morning',
      'Group slackers who disappear until submission night',
      '8 AM lectures with a monotone professor',
      'Rote memorization over conceptual logic'
    ]
  },
  {
    id: 'd3',
    category: 'Dislikes',
    text: 'What is your biggest digital dealbreaker?',
    icon: MessageSquare,
    options: [
      'Ghosting: Leaving a message on read for 3 days',
      'Dry texts: Single-letter replies like "K" or "Cool"',
      'Spam voice notes: 4 minutes instead of a quick text',
      'Bad grammar: Mixing up "your" and "you\'re"'
    ]
  },
  {
    id: 'd4',
    category: 'Dislikes',
    text: 'What kind of environmental vibe do you hate?',
    icon: VolumeX,
    options: [
      'Loud chaos: Extremely noisy cafes or shouting crowds',
      'Freeze: Rooms with AC blasting at 16°C',
      'Stuffy: Humid, hot rooms with zero ventilation',
      'Dimness: Poorly lit rooms that make you sleepy'
    ]
  },
  {
    id: 'd5',
    category: 'Dislikes',
    text: 'What is your absolute worst food offense?',
    icon: Utensils,
    options: [
      'Pineapple chunks on pizza',
      'Extremely bland, zero-spice food',
      'Cereal before milk / warm water in cereal',
      'Getting a mouthful of pungent raw onions'
    ]
  }
];

export default function MakeAFriend() {
  const { user, updateUser, openKycModal } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  // Step state: 'onboarding' | 'match_ready' | 'matching_animation' | 'swiping'
  const [step, setStep] = useState('onboarding');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [genderConfirmation, setGenderConfirmation] = useState('Male');

  // Swipe view states
  const [genderFilter, setGenderFilter] = useState('All');
  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matchingConsoleLogs, setMatchingConsoleLogs] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null
  const [isMatchOverlayOpen, setIsMatchOverlayOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);

  // New liked profiles state
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [viewMode, setViewMode] = useState('swipe'); // 'swipe' | 'liked'
  const [campusFilter, setCampusFilter] = useState('On Campus'); // 'On Campus' | 'Outside Campus'

  // Initialize state based on user loaded makeAFriendProfile
  useEffect(() => {
    if (user?.makeAFriendProfile?.completed) {
      setAnswers(user.makeAFriendProfile.answers || {});
      setCampusFilter(user.makeAFriendProfile.campusFilter || 'On Campus');
      if (step === 'onboarding') {
        setStep('swiping');
      }
    } else {
      setStep('onboarding');
      if (user?.gender && user.gender !== 'Prefer not to say') {
        setGenderConfirmation(user.gender);
      }
    }
  }, [user]);

  // Load and match profiles when in swiping step
  useEffect(() => {
    if (step === 'swiping') {
      fetchAndCalculateMatches();
    }
  }, [step, genderFilter, campusFilter]);

  // Fetch liked profiles when user swiped state changes
  useEffect(() => {
    if (step === 'swiping' && user?.makeAFriendProfile?.swiped) {
      fetchLikedProfiles();
    }
  }, [step, user?.makeAFriendProfile?.swiped]);

  // Fetch liked profiles from DB
  const fetchLikedProfiles = async () => {
    try {
      const currentSwiped = user?.makeAFriendProfile?.swiped || {};
      const likedUids = Object.keys(currentSwiped).filter(uid => currentSwiped[uid] === 'right');
      
      if (likedUids.length === 0) {
        setLikedProfiles([]);
        return;
      }

      const usersSnap = await getDocs(collection(db, 'users'));
      const rawList = [];
      usersSnap.forEach((d) => {
        const uid = d.id;
        if (likedUids.includes(uid)) {
          const data = d.data();
          rawList.push({
            uid,
            name: data.name || 'Anonymous Student',
            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`,
            email: data.email,
            updatedAt: data.updatedAt || data.joinedDate || 0
          });
        }
      });

      // Deduplicate liked profiles by normalized name or email to avoid duplicate user accounts
      const uniqueMap = new Map();
      rawList.forEach((item) => {
        const normName = item.name.toLowerCase().trim();
        const firstName = normName.split(' ')[0];
        const key = item.email ? item.email.toLowerCase() : firstName;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        } else {
          const existing = uniqueMap.get(key);
          if (item.name.length > existing.name.length || item.updatedAt > existing.updatedAt) {
            uniqueMap.set(key, item);
          }
        }
      });

      setLikedProfiles(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Error fetching liked profiles:', err);
    }
  };

  // Fetch users and calculate match percentage
  const fetchAndCalculateMatches = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const list = [];
      const currentSwiped = user?.makeAFriendProfile?.swiped || {};
      const currentAnswers = user?.makeAFriendProfile?.answers || answers;

      usersSnap.forEach((d) => {
        const data = d.data();
        const uid = d.id;

        // Skip current user, official Cohort account, already swiped profiles, and users who haven't completed the quiz
        if (
          uid === user.uid ||
          uid === 'cohort_official' ||
          (data.username || '').toLowerCase() === 'cohort' ||
          data.isOfficial === true ||
          currentSwiped[uid] ||
          !data.makeAFriendProfile?.completed
        ) {
          return;
        }

        // Resolve gender (use Firestore gender or deterministic fallback if undefined/prefer not to say)
        const resolvedGender = data.gender && data.gender !== 'Prefer not to say'
          ? data.gender
          : (uid.charCodeAt(0) % 2 === 0 ? 'Male' : 'Female');

        // Apply gender filter
        const matchesGender = () => {
          if (genderFilter === 'All') return true;
          return resolvedGender.toLowerCase() === genderFilter.toLowerCase();
        };

        if (!matchesGender()) {
          return;
        }

        // Apply campus filter
        const matchesCampus = () => {
          const myCollege = (user?.college || 'KIET').toLowerCase().trim();
          const theirCollege = (data.college || 'KIET').toLowerCase().trim();
          if (campusFilter === 'On Campus' || campusFilter === 'Same College') {
            return myCollege === theirCollege;
          } else if (campusFilter === 'Outside Campus') {
            return myCollege !== theirCollege;
          }
          return true; // 'All' or 'All Campuses'
        };

        if (!matchesCampus()) {
          return;
        }

        // Retrieve the user's completed makeAFriendProfile
        const targetProfile = data.makeAFriendProfile;
        const matchPct = calculateCompatibility(currentAnswers, targetProfile.answers, user.uid, uid, user.college, data.college);

        list.push({
          uid,
          id: uid,
          name: data.name || 'Anonymous Student',
          college: data.college || 'KIET',
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`,
          gender: resolvedGender,
          answers: targetProfile.answers,
          matchPercentage: matchPct,
          sharedInterests: getSharedInterests(currentAnswers, targetProfile.answers)
        });
      });

      // Sort by match percentage desc
      list.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setProfiles(list);
      setCurrentProfileIndex(0);
    } catch (err) {
      console.error('Error fetching match profiles:', err);
      showError('Failed to fetch matched profiles.');
    }
  };

  // Compute shared interests list
  const getSharedInterests = (answersA, answersB) => {
    const list = [];
    QUESTIONS.forEach((q) => {
      if (answersA[q.id] === answersB[q.id]) {
        list.push({
          text: q.options[answersA[q.id]],
          Icon: q.icon
        });
      }
    });
    return list;
  };

  // Custom compatibility algorithm
  const calculateCompatibility = (answersA, answersB, uidA, uidB, collegeA, collegeB) => {
    let matchCount = 0;
    QUESTIONS.forEach((q) => {
      if (answersA[q.id] === answersB[q.id]) {
        matchCount++;
      }
    });

    let base = 45 + matchCount * 2.5;

    // High compatibility boost (+20%) for Same College peers
    if (collegeA && collegeB && collegeA.toLowerCase().trim() === collegeB.toLowerCase().trim()) {
      base += 20;
    }

    const combinedUid = (uidA || '') + (uidB || '');
    let hash = 0;
    for (let i = 0; i < combinedUid.length; i++) {
      hash = combinedUid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const variance = (Math.abs(hash) % 30) / 10;
    const finalPct = base + variance;

    return Math.min(100, Math.round(finalPct * 10) / 10);
  };

  const handleSelectOption = (questionId, optionIndex) => {
    const nextAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(nextAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setStep('match_ready');
      }
    }, 250);
  };

  const handleOnboardingBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const submitOnboardingAnswers = async () => {
    try {
      setViewMode('swipe');

      const friendProfile = {
        answers,
        completed: true,
        swiped: user?.makeAFriendProfile?.swiped || {},
        campusFilter
      };

      await updateUser({
        makeAFriendProfile: friendProfile,
        gender: genderConfirmation
      });

      setStep('matching_animation');
      runMatchingSequence();
    } catch (err) {
      console.error('Failed to submit onboarding answers:', err);
      showError('Something went wrong. Please try again.');
    }
  };

  const runMatchingSequence = () => {
    const logs = [
      'Launching Campus Vibe Checker...',
      'Syncing student interests & profiles...',
      'Analyzing personality maps & hobbies...',
      'Scanning campus cohorts...',
      'Calibrating vibe alignments...',
      'Vibe twins located! Loading profiles...'
    ];

    setMatchingConsoleLogs([]);
    logs.forEach((logText, idx) => {
      setTimeout(() => {
        setMatchingConsoleLogs((prev) => [...prev, logText]);
        if (idx === logs.length - 1) {
          setTimeout(() => {
            setStep('swiping');
          }, 1000);
        }
      }, (idx + 1) * 600);
    });
  };

  // Swiping functions (Fixed skipping bug)
  const handleSwipe = async (direction) => {
    if (profiles.length === 0 || currentProfileIndex >= profiles.length) return;

    const targetProfile = profiles[currentProfileIndex];
    setSwipeDirection(direction);

    // Advance card index smoothly without triggering re-fetch reset
    setTimeout(() => {
      setCurrentProfileIndex((prev) => prev + 1);
      setSwipeDirection(null);
    }, 250);

    const updatedSwipes = {
      ...(user?.makeAFriendProfile?.swiped || {}),
      [targetProfile.uid]: direction
    };

    const updatedProfile = {
      ...user.makeAFriendProfile,
      swiped: updatedSwipes
    };

    try {
      await updateUser({
        makeAFriendProfile: updatedProfile
      });
    } catch (e) {
      console.error('Error updating swipe profile:', e);
    }

    if (direction === 'right') {
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientUid: targetProfile.uid,
          senderUid: user.uid,
          senderName: user.name || 'Student',
          senderAvatar: user.avatar || '',
          type: 'like',
          text: `you were right swiped by ${user.name || 'Student'}.`,
          read: false,
          time: new Date()
        });

        const targetUserSnap = await getDocs(collection(db, 'users'));
        let targetUserLikedUs = false;
        targetUserSnap.forEach((d) => {
          if (d.id === targetProfile.uid) {
            const swipedList = d.data()?.makeAFriendProfile?.swiped || {};
            if (swipedList[user.uid] === 'right') {
              targetUserLikedUs = true;
            }
          }
        });

        const isMatch = targetUserLikedUs || Math.random() < 0.25;

        if (isMatch) {
          setMatchedProfile(targetProfile);
          setIsMatchOverlayOpen(true);
        }
      } catch (e) {
        console.error('Error handling right swipe match:', e);
      }
    }
  };

  const handleResetSwipes = async () => {
    try {
      const updatedProfile = {
        ...user.makeAFriendProfile,
        swiped: {}
      };
      await updateUser({
        makeAFriendProfile: updatedProfile
      });
      showSuccess('Swipes reset! You can start matching again.');
      fetchAndCalculateMatches();
    } catch (e) {
      console.error(e);
      showError('Failed to reset swipes.');
    }
  };

  const handleRetakeQuiz = () => {
    setStep('onboarding');
    setCurrentQuestionIndex(0);
  };

  const startChat = (profile) => {
    setIsMatchOverlayOpen(false);
    navigate(`/messages?recipientUid=${profile.uid}&recipientName=${encodeURIComponent(profile.name)}`);
  };

  // Questionnaire Helper
  const currentCategory = QUESTIONS[currentQuestionIndex]?.category;
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;
  const progressPercent = (questionNumber / QUESTIONS.length) * 100;
  const QuestionIcon = currentQuestion?.icon;

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden bg-neutral-50 dark:bg-zinc-950 text-neutral-900 dark:text-white transition-colors duration-300">
      <SEO title="Make a Friend" />
      
      {/* Subtle ambient background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Page Title Header */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-neutral-200/80 dark:bg-zinc-900 border border-neutral-300/80 dark:border-zinc-800 text-primary-600 dark:text-primary-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" /> Campus Vibe Twin
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Make a Friend
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-zinc-400 mt-1 font-medium max-w-md mx-auto">
          Discover classmates nearby who match your personality & campus vibe.
        </p>
      </div>

      {!user?.kycVerified ? (
        <div className="z-10 w-full max-w-md mt-4 p-6 sm:p-8 text-center bg-white/95 dark:bg-zinc-900/90 border border-neutral-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-heading font-extrabold text-neutral-900 dark:text-white">
              Matchmaking Locked
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Matchmaking and swiping are restricted to verified students. Verify your student email to browse and connect with classmates.
            </p>
          </div>
          <button
            type="button"
            onClick={openKycModal}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider cursor-pointer"
          >
            Verify Student ID
          </button>
        </div>
      ) : (
        <>
          {/* STEP 1: ONBOARDING / QUESTIONNAIRE */}
      {step === 'onboarding' && (
        <div className="w-full max-w-xl flex flex-col items-center relative z-10 py-4">
          {/* Category Progress Segmented Toggle Bar */}
          <div className="flex gap-1.5 w-full justify-between mb-6 p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-neutral-200/80 dark:border-zinc-800 shadow-sm">
            {CATEGORIES.map((cat, idx) => {
              const isCurrent = currentCategory === cat;
              const isPassed = CATEGORIES.indexOf(currentCategory) > idx;
              return (
                <div
                  key={cat}
                  className={`flex-1 text-center py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 ${
                    isCurrent
                      ? 'bg-primary-600 text-white shadow-sm'
                      : isPassed
                      ? 'bg-neutral-100 dark:bg-zinc-800/80 text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700/60'
                      : 'text-neutral-400 dark:text-zinc-500'
                  }`}
                >
                  {cat}
                </div>
              );
            })}
          </div>

          {/* Question Box Card */}
          <Card className="w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-neutral-200/80 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl relative shadow-xl space-y-6">
            <div className="absolute top-6 right-6 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700/60 px-3 py-1 rounded-full text-xs font-mono text-neutral-600 dark:text-zinc-400 font-bold">
              {questionNumber} / {QUESTIONS.length}
            </div>

            <div className="flex items-center gap-3">
              {QuestionIcon && (
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <QuestionIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 font-mono">
                {currentQuestion?.category}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-display text-neutral-900 dark:text-white leading-snug">
              {currentQuestion?.text}
            </h3>

            <div className="space-y-3">
              {currentQuestion?.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                  className="w-full text-left p-4 bg-neutral-50 dark:bg-zinc-950/60 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 text-sm font-semibold rounded-2xl border border-neutral-200 dark:border-zinc-800 hover:border-primary-500/50 text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span>{opt}</span>
                  <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 group-hover:border-primary-500 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 dark:bg-primary-400 scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </div>
                </button>
              ))}
            </div>

            {/* Back Button */}
            {currentQuestionIndex > 0 && (
              <button
                onClick={handleOnboardingBack}
                className="pt-2 flex items-center gap-1 text-xs font-bold text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Go Back
              </button>
            )}
          </Card>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 dark:bg-zinc-900 h-2 rounded-full overflow-hidden mt-6 border border-neutral-300/60 dark:border-zinc-800">
            <div
              className="bg-primary-600 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 2: QUESTIONNAIRE COMPLETE - READY TO FIND FRIEND */}
      {step === 'match_ready' && (
        <div className="w-full max-w-md flex flex-col items-center justify-center text-center relative z-10 py-6">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 mb-6 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 dark:text-white leading-tight">
            Ready to Connect
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-zinc-400 mt-2 px-6 font-medium max-w-sm mb-6">
            Your vibe parameters are mapped! Select your preferred radius and start swiping.
          </p>

          {/* Campus Match Toggle */}
          <Card className="w-full bg-white/90 dark:bg-zinc-900/90 border border-neutral-200 dark:border-zinc-800 p-4 mb-6 rounded-2xl max-w-xs shadow-xl">
            <label className="block text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Campus Filter
            </label>
            <div className="flex bg-neutral-100 dark:bg-zinc-950 p-1 rounded-xl border border-neutral-200 dark:border-zinc-800 gap-1">
              {['On Campus', 'All Campuses', 'Outside Campus'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCampusFilter(opt)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    campusFilter === opt
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {opt === 'On Campus' ? 'My Campus' : opt === 'All Campuses' ? 'All' : 'Other'}
                </button>
              ))}
            </div>
          </Card>

          <button
            onClick={submitOnboardingAnswers}
            className="px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-full shadow-lg shadow-primary-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            Start Matching <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleRetakeQuiz}
            className="mt-4 text-xs font-bold text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Review Answers
          </button>
        </div>
      )}

      {/* STEP 3: MATCH SCANNING SYSTEM CONSOLE */}
      {step === 'matching_animation' && (
        <div className="w-full max-w-md flex flex-col items-center justify-center py-16 relative z-10">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 mb-8 flex items-center justify-center shadow-xl">
            <Compass className="w-9 h-9 text-primary-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          <Card className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl font-mono text-left text-xs leading-relaxed max-w-sm h-48 overflow-y-auto shadow-2xl">
            <div className="text-primary-400 font-bold border-b border-zinc-800 pb-2 mb-2 flex items-center justify-between">
              <span>CAMPUS_VIBE_SCAN</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {matchingConsoleLogs.map((log, lIdx) => (
              <div key={lIdx} className="text-zinc-300 mb-1">
                {log}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* STEP 4: SWIPING INTERFACE */}
      {step === 'swiping' && (
        <div className="w-full max-w-md flex flex-col items-center relative z-10">
          
          {/* Sleek Floating Glass Filter Bar */}
          <div className="w-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl p-2 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl mb-5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 flex-1 bg-neutral-100/80 dark:bg-black/40 p-1 rounded-xl border border-neutral-200/80 dark:border-zinc-800/80">
                {['All', 'Male', 'Female', 'Liked Profiles'].map((tab) => {
                  const isActive = tab === 'Liked Profiles' ? viewMode === 'liked' : (viewMode === 'swipe' && genderFilter === tab);
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        if (tab === 'Liked Profiles') {
                          setViewMode('liked');
                        } else {
                          setGenderFilter(tab);
                          setViewMode('swipe');
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer text-center whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 scale-[1.02]'
                          : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
                      }`}
                    >
                      {tab === 'Liked Profiles' ? 'Liked' : tab}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleRetakeQuiz}
                title="Retake Vibe Quiz"
                className="p-2.5 bg-neutral-100 dark:bg-black/40 hover:bg-neutral-200 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white rounded-xl transition-all border border-neutral-200 dark:border-zinc-800 flex-shrink-0 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Campus Radius Selector */}
            {viewMode === 'swipe' && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100/60 dark:bg-black/30 rounded-xl border border-neutral-200/60 dark:border-zinc-800/60 text-xs">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" /> Radius
                </span>
                <div className="flex bg-neutral-200/70 dark:bg-zinc-950 p-0.5 rounded-lg border border-neutral-300/70 dark:border-zinc-800 gap-0.5">
                  {['On Campus', 'All Campuses', 'Outside Campus'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={async () => {
                        setCampusFilter(opt);
                        if (user?.makeAFriendProfile) {
                          const updatedProfile = {
                            ...user.makeAFriendProfile,
                            campusFilter: opt
                          };
                          await updateUser({
                            makeAFriendProfile: updatedProfile
                          });
                        }
                      }}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all duration-200 cursor-pointer ${
                        campusFilter === opt
                          ? 'bg-white dark:bg-white/15 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {opt === 'On Campus' ? 'My Campus' : opt === 'All Campuses' ? 'All' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Swipe Card Deck / Liked Grid Container */}
          <div className="w-full max-w-md h-[470px] sm:h-[510px] relative flex items-center justify-center">
            {viewMode === 'liked' ? (
              <div className="w-full h-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-neutral-200/80 dark:border-white/10 p-5 flex flex-col text-left shadow-xl dark:shadow-2xl">
                <div className="text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between border-b border-neutral-200 dark:border-zinc-800 pb-3">
                  <span className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold">
                    <Sparkles className="w-4 h-4" /> Liked Profiles ({likedProfiles.length})
                  </span>
                </div>
                
                {likedProfiles.length > 0 ? (
                  <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 justify-start items-stretch scrollbar-thin">
                    {likedProfiles.map((lp) => (
                      <div
                        key={lp.uid}
                        onClick={() => navigate(`/messages?recipientUid=${lp.lpUid || lp.uid}&recipientName=${encodeURIComponent(lp.name)}`)}
                        className="flex items-center justify-between cursor-pointer group bg-neutral-50 dark:bg-black/40 hover:bg-neutral-100 dark:hover:bg-black/80 border border-neutral-200 dark:border-zinc-800 p-4 rounded-2xl transition-all hover:border-violet-500/40 relative w-full shadow-xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={lp.avatar}
                              alt={lp.name}
                              className="w-12 h-12 rounded-full border border-violet-500/50 object-cover bg-neutral-200 dark:bg-zinc-800 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-violet-600 text-white rounded-full p-1 shadow-xs">
                              <MessageSquare className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="text-sm font-bold text-neutral-900 dark:text-white truncate block group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {lp.name}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-zinc-400 font-medium block mt-0.5">
                              Tap to start chat
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-200 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-full p-2 shadow-xs group-hover:bg-violet-600 group-hover:text-white transition-all ml-3 flex-shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800/80 flex items-center justify-center text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-zinc-700/60 mb-4 shadow-sm">
                      <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">No Liked Profiles Yet</h4>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 px-4 leading-relaxed font-medium">
                      Swipe right on matches to save them here and open direct chats anytime.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {profiles.length > 0 && currentProfileIndex < profiles.length ? (
                  <AnimatePresence mode="popLayout">
                    {profiles.map((profile, index) => {
                      if (index < currentProfileIndex || index > currentProfileIndex + 1) return null;
                      const isTopCard = index === currentProfileIndex;

                      return (
                        <motion.div
                          key={profile.uid}
                          style={{ zIndex: 10 - index, position: 'absolute' }}
                          initial={{ scale: 0.95, opacity: 0.8, y: 10 }}
                          animate={{ scale: isTopCard ? 1 : 0.95, opacity: isTopCard ? 1 : 0.6, y: isTopCard ? 0 : 12 }}
                          exit={{
                            x: swipeDirection === 'right' ? 340 : swipeDirection === 'left' ? -340 : 0,
                            opacity: 0,
                            rotate: swipeDirection === 'right' ? 12 : swipeDirection === 'left' ? -12 : 0,
                            scale: 0.9
                          }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="w-full h-full"
                        >
                          <Card className="w-full h-full bg-white dark:bg-gradient-to-b dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-zinc-950/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-white/10 p-5 sm:p-6 rounded-3xl flex flex-col justify-between shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden select-none">
                            
                            {/* Swipe Indicators overlays */}
                            {isTopCard && swipeDirection === 'right' && (
                              <div className="absolute top-10 left-8 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest text-2xl rotate-[-12deg] px-4 py-1 rounded-xl z-30 bg-white/90 dark:bg-zinc-950/90 shadow-2xl">
                                LIKE ✨
                              </div>
                            )}
                            {isTopCard && swipeDirection === 'left' && (
                              <div className="absolute top-10 right-8 border-2 border-rose-500 text-rose-600 dark:text-rose-500 font-extrabold uppercase tracking-widest text-2xl rotate-[12deg] px-4 py-1 rounded-xl z-30 bg-white/90 dark:bg-zinc-950/90 shadow-2xl">
                                SKIP ❌
                              </div>
                            )}

                            {/* Card Top Section: Avatar, Details & Match Percentage */}
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                  <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-violet-500/60 object-cover flex-shrink-0 bg-neutral-200 dark:bg-zinc-800 shadow-md"
                                  />
                                  <div className="flex-1 min-w-0 text-left">
                                    <h3 className="font-display font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white leading-snug whitespace-normal break-words">
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-zinc-400 font-semibold mt-0.5 truncate">{profile.college}</p>
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                      <span className="inline-flex px-2.5 py-0.5 bg-neutral-100 dark:bg-zinc-950/80 border border-neutral-200 dark:border-zinc-800 rounded-md text-[10px] text-neutral-700 dark:text-zinc-300 capitalize font-mono font-bold">
                                        {profile.gender}
                                      </span>
                                      {profile.college?.toLowerCase().trim() === (user?.college || 'KIET').toLowerCase().trim() && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-md text-[10px] font-bold">
                                          🎓 Same Campus
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  <div className="inline-flex items-center gap-1 bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-300 font-mono text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold shadow-[0_0_12px_rgba(139,92,246,0.15)] whitespace-nowrap">
                                    <Flame className="w-3.5 h-3.5 fill-current text-violet-500 dark:text-violet-400" /> {profile.matchPercentage}%
                                  </div>
                                </div>
                              </div>

                              {/* Middle Section: Shared Vibe Vectors */}
                              <div className="pt-2">
                                <div className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Shared Vibe Vectors
                                </div>
                                {profile.sharedInterests.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1">
                                    {profile.sharedInterests.slice(0, 6).map((interest, iIdx) => {
                                      const InterestIcon = interest.Icon || Sparkles;
                                      return (
                                        <span
                                          key={iIdx}
                                          className="inline-flex items-center gap-1.5 text-xs font-medium bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 px-3 py-1.5 rounded-xl hover:border-neutral-300 dark:hover:border-zinc-700 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                        >
                                          <InterestIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                                          <span>{interest.text.split('(')[0].trim()}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-neutral-500 dark:text-zinc-400 italic py-2">
                                    No exact question overlaps, but opposites attract! Connect and start chatting.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Bottom Action Controls Embedded in Card */}
                            {isTopCard && (
                              <div className="flex items-center justify-around border-t border-neutral-200/80 dark:border-zinc-800/80 pt-4 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleSwipe('left')}
                                  title="Skip Profile"
                                  className="w-12 h-12 bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                  <X className="w-5 h-5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startChat(profile)}
                                  title="Direct Message"
                                  className="w-12 h-12 bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                  <MessageSquare className="w-5 h-5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSwipe('right')}
                                  title="Connect / Match"
                                  className="w-12 h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 text-white rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] cursor-pointer active:scale-95"
                                >
                                  <Sparkles className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  /* Out of Matches State */
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white/90 dark:bg-zinc-900/90 rounded-3xl border border-neutral-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl dark:shadow-2xl z-0">
                    <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-neutral-500 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700/60 mb-4 shadow-sm">
                      <AlertCircle className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">No Profiles Left</h3>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-2 px-4 font-medium leading-relaxed">
                      You reviewed all profiles in your current filter. Change filters, reset swipes, or retake your quiz to find new friends!
                    </p>

                    <div className="mt-6 flex flex-col gap-2.5 w-full max-w-[220px]">
                      <Button size="sm" onClick={handleResetSwipes} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none font-bold text-xs shadow-md">
                        Reset All Swipes
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleRetakeQuiz} className="w-full font-bold text-xs">
                        Retake Vibe Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MUTUAL MATCH LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {isMatchOverlayOpen && matchedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[999] flex flex-col items-center justify-center p-6 backdrop-blur-xl"
          >
            <div className="text-center max-w-sm relative z-10 flex flex-col items-center">
              <h2 className="text-4xl font-extrabold text-white font-display mb-2">
                Vibe Aligned ✨
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mb-8 px-4 font-medium">
                You and <strong className="text-white font-bold">{matchedProfile.name}</strong> share the same campus vibes!
              </p>

              {/* Match Double Avatar Bubble */}
              <div className="flex items-center justify-center gap-8 mb-10 relative">
                <div className="w-20 h-20 rounded-full border-2 border-primary-500 overflow-hidden shadow-lg bg-zinc-800">
                  <UserAvatar src={user.avatar} name={user.name || 'You'} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bg-zinc-900 text-primary-400 rounded-full p-2 shadow-md z-25 border border-zinc-800">
                  <Sparkles className="w-5 h-5 text-primary-400" />
                </div>
                <div className="w-20 h-20 rounded-full border-2 border-primary-500 overflow-hidden shadow-lg bg-zinc-800">
                  <UserAvatar src={matchedProfile.avatar} name={matchedProfile.name || 'Friend'} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full px-4">
                <button
                  onClick={() => startChat(matchedProfile)}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-lg text-sm flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer transition-all"
                >
                  <MessageSquare className="w-4 h-4" /> Open Chat Window
                </button>
                <button
                  onClick={() => setIsMatchOverlayOpen(false)}
                  className="w-full py-3 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-zinc-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                  Keep Matching
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
