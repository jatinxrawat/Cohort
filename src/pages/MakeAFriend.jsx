import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
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
  Smile
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
  const { user, updateUser } = useAuth();
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
  }, [step, genderFilter, campusFilter, user?.makeAFriendProfile?.swiped]);

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
      const list = [];
      usersSnap.forEach((d) => {
        const uid = d.id;
        if (likedUids.includes(uid)) {
          const data = d.data();
          list.push({
            uid,
            name: data.name || 'Anonymous Student',
            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`
          });
        }
      });
      setLikedProfiles(list);
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
          const myCollege = (user.college || 'KIET').toLowerCase();
          const theirCollege = (data.college || 'KIET').toLowerCase();
          if (campusFilter === 'On Campus') {
            return myCollege === theirCollege;
          } else {
            return myCollege !== theirCollege;
          }
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

    let base = 40 + matchCount * 2.5;

    if (collegeA && collegeB && collegeA.toLowerCase() === collegeB.toLowerCase()) {
      base += 5;
    }

    const combinedUid = (uidA || '') + (uidB || '');
    let hash = 0;
    for (let i = 0; i < combinedUid.length; i++) {
      hash = combinedUid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const variance = (Math.abs(hash) % 49) / 10;
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

  // Swiping functions
  const handleSwipe = async (direction) => {
    if (profiles.length === 0 || currentProfileIndex >= profiles.length) return;

    const targetProfile = profiles[currentProfileIndex];
    setSwipeDirection(direction);

    const updatedSwipes = {
      ...(user?.makeAFriendProfile?.swiped || {}),
      [targetProfile.uid]: direction
    };

    const updatedProfile = {
      ...user.makeAFriendProfile,
      swiped: updatedSwipes
    };

    const taskList = [
      updateUser({
        makeAFriendProfile: updatedProfile
      })
    ];

    if (direction === 'right') {
      taskList.push(
        addDoc(collection(db, 'notifications'), {
          recipientUid: targetProfile.uid,
          senderUid: user.uid,
          senderName: user.name || 'Student',
          senderAvatar: user.avatar || '',
          type: 'like',
          text: `you were right swiped by ${user.name || 'Student'}.`,
          read: false,
          time: new Date()
        })
      );

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
    }

    Promise.all(taskList).catch((e) => console.error('Error writing swipe state:', e));

    setTimeout(() => {
      setCurrentProfileIndex((prev) => prev + 1);
      setSwipeDirection(null);
    }, 300);
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
    <div className="section-container min-h-[calc(100vh-120px)] lg:min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-md select-none relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white rounded-none border-0 my-0 lg:my-4 lg:rounded-3xl lg:border lg:border-neutral-800 w-full lg:max-w-4xl mx-auto shadow-none lg:shadow-glass-lg">
      
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-vandal-pink/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-neon-indigo/15 rounded-full blur-[120px] pointer-events-none" />

      {/* STEP 1: ONBOARDING / QUESTIONNAIRE */}
      {step === 'onboarding' && (
        <div className="w-full max-w-xl flex flex-col items-center relative z-10 py-xl">
          <div className="text-center mb-xl">
            <div className="inline-flex items-center gap-xs px-md py-sm bg-gradient-to-r from-vandal-pink/20 to-topic-violet/20 border border-vandal-pink/30 text-vandal-pink rounded-full text-xs font-bold uppercase tracking-widest mb-md shadow-glow-pink">
              <Sparkles className="w-3.5 h-3.5" /> Make a Friend
            </div>
            <h2 className="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
              Reveal Your Vibe
            </h2>
            <p className="text-xs text-neutral-400 mt-xs font-medium">
              Answer {QUESTIONS.length} campus questions to find your absolute match!
            </p>
          </div>

          {/* Category Progress Segmented Toggle Bar */}
          <div className="flex gap-xs w-full justify-between mb-lg p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-neutral-800/80">
            {CATEGORIES.map((cat, idx) => {
              const isCurrent = currentCategory === cat;
              const isPassed = CATEGORIES.indexOf(currentCategory) > idx;
              return (
                <div
                  key={cat}
                  className={`flex-1 text-center py-xs rounded-xl text-[10px] font-extrabold tracking-wider transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-vandal-pink to-topic-violet text-white shadow-lg shadow-vandal-pink/20 scale-[1.02]'
                      : isPassed
                      ? 'bg-neutral-800/80 text-neutral-300 border border-neutral-700/60'
                      : 'text-neutral-500'
                  }`}
                >
                  {cat}
                </div>
              );
            })}
          </div>

          {/* Question Box Card */}
          <Card className="w-full bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 p-xl rounded-2xl relative shadow-2xl">
            <div className="absolute top-xl right-xl bg-neutral-800 border border-neutral-700/60 px-md py-0.5 rounded-full text-[10px] font-mono text-neutral-400 font-bold">
              {questionNumber} / {QUESTIONS.length}
            </div>

            <div className="flex items-center gap-md mb-lg">
              {QuestionIcon && (
                <div className="w-10 h-10 rounded-2xl bg-vandal-pink/15 border border-vandal-pink/30 flex items-center justify-center flex-shrink-0 shadow-glow-pink">
                  <QuestionIcon className="w-5 h-5 text-vandal-pink" />
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-vandal-pink font-mono">
                {currentQuestion?.category}
              </span>
            </div>

            <h3 className="text-lg font-bold font-display text-white mb-xl leading-snug">
              {currentQuestion?.text}
            </h3>

            <div className="space-y-md">
              {currentQuestion?.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                  className="w-full text-left p-md bg-neutral-950/50 hover:bg-gradient-to-r hover:from-neutral-900 hover:to-neutral-950 text-sm font-semibold rounded-xl border border-neutral-800 hover:border-vandal-pink/60 text-neutral-300 hover:text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
                >
                  <span>{opt}</span>
                  <div className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center flex-shrink-0 group-hover:border-vandal-pink transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-vandal-pink scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </div>
                </button>
              ))}
            </div>

            {/* Back Button */}
            {currentQuestionIndex > 0 && (
              <button
                onClick={handleOnboardingBack}
                className="mt-xl flex items-center gap-xs text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Go Back
              </button>
            )}
          </Card>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-xl border border-neutral-800">
            <div
              className="bg-gradient-to-r from-vandal-pink to-topic-violet h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 2: QUESTIONNAIRE COMPLETE - READY TO FIND FRIEND */}
      {step === 'match_ready' && (
        <div className="w-full max-w-md flex flex-col items-center justify-center text-center relative z-10 py-lg">
          <div className="relative w-32 h-32 mb-lg flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-vandal-pink via-topic-violet to-neon-indigo rounded-full opacity-70 animate-spin-slow blur-xs" />
            <div className="absolute inset-1.5 bg-black rounded-full" />
            <Sparkles className="w-12 h-12 text-white animate-pulse-slow relative z-10" />
          </div>

          <h2 className="text-2xl font-display font-extrabold text-white leading-tight">
            Ready to Connect
          </h2>
          <p className="text-sm text-neutral-400 mt-sm px-lg font-medium max-w-sm mb-md animate-fade-in">
            We have mapped your personality, interests, and passions. Select your search radius and click below to find matches!
          </p>

          {/* Campus Match Toggle */}
          <Card className="w-full bg-neutral-900/60 border border-neutral-800/60 p-md mb-md rounded-2xl max-w-xs shadow-xl">
            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest mb-sm flex items-center justify-center gap-xs">
              <MapPin className="w-3.5 h-3.5 text-vandal-pink" /> Matching Radius
            </label>
            <div className="flex bg-black/60 p-1 rounded-xl border border-neutral-800">
              {['On Campus', 'Outside Campus'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCampusFilter(opt)}
                  className={`flex-1 py-sm text-[11px] font-extrabold rounded-lg transition-all duration-300 cursor-pointer ${
                    campusFilter === opt
                      ? 'bg-gradient-to-r from-vandal-pink to-topic-violet text-white shadow-md shadow-vandal-pink/30 scale-[1.02]'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Card>

          <button
            onClick={submitOnboardingAnswers}
            className="px-8 py-3.5 bg-gradient-to-r from-vandal-pink via-topic-violet to-neon-indigo text-white font-extrabold text-sm rounded-full shadow-[0_0_30px_rgba(255,42,133,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-md border border-white/10 uppercase tracking-wider cursor-pointer"
          >
            Make a Friend <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleRetakeQuiz}
            className="mt-md text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            Review Answers
          </button>
        </div>
      )}

      {/* STEP 3: MATCH SCANNING SYSTEM CONSOLE */}
      {step === 'matching_animation' && (
        <div className="w-full max-w-md flex flex-col items-center justify-center py-2xl relative z-10">
          <div className="relative w-36 h-36 mb-2xl flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-black/60 border-2 border-vandal-pink flex items-center justify-center relative shadow-[0_0_30px_rgba(255,42,133,0.4)]">
              <Compass className="w-10 h-10 text-vandal-pink" style={{ animation: 'spin 4s linear infinite' }} />
            </div>
          </div>

          <Card className="w-full bg-black/80 border border-neutral-800/80 p-lg rounded-xl font-mono text-left text-xs leading-relaxed max-w-sm h-48 overflow-y-auto">
            <div className="text-vandal-pink font-bold border-b border-neutral-800 pb-sm mb-sm flex items-center justify-between">
              <span>CAMPUS_VIBE_SCAN</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {matchingConsoleLogs.map((log, lIdx) => (
              <div key={lIdx} className="text-neutral-300 mb-xs">
                {log}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* STEP 4: SWIPING INTERFACE */}
      {step === 'swiping' && (
        <div className="w-full flex flex-col items-center relative z-10 py-md">
          {/* Top Filter Bar with Best Segmented Toggle Switch */}
          <div className="w-full max-w-sm flex items-center justify-between mb-md bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-neutral-800/80 shadow-lg">
            <div className="flex items-center gap-1 flex-1">
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
                    className={`flex-1 py-1.5 px-xs text-[10px] font-extrabold rounded-xl transition-all duration-300 cursor-pointer text-center ${
                      isActive
                        ? 'bg-gradient-to-r from-vandal-pink to-topic-violet text-white shadow-md shadow-vandal-pink/25 scale-[1.02]'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-850/50'
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
              title="Retake Personality Quiz"
              className="p-2 ml-xs bg-neutral-850 hover:bg-neutral-750 text-neutral-300 rounded-xl hover:text-white transition-all border border-neutral-750 flex-shrink-0 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Campus Toggle in Swiping screen */}
          {viewMode === 'swipe' && (
            <div className="w-full max-w-sm flex items-center justify-between mb-md bg-black/40 backdrop-blur-md px-md py-xs rounded-xl border border-neutral-800/50">
              <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest flex items-center gap-xs">
                <MapPin className="w-3 h-3 text-vandal-pink" /> Radius
              </span>
              <div className="flex bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-800">
                {['On Campus', 'Outside Campus'].map((opt) => (
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
                    className={`px-md py-xs text-[9px] font-extrabold rounded-md transition-all duration-200 cursor-pointer ${
                      campusFilter === opt
                        ? 'bg-gradient-to-r from-vandal-pink to-topic-violet text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Swipe Deck / Liked Grid Container */}
          <div className="w-full max-w-sm h-[360px] relative flex items-center justify-center">
            {viewMode === 'liked' ? (
              <div className="w-full h-full bg-neutral-900/40 rounded-3xl border border-neutral-800/60 p-md backdrop-blur-sm flex flex-col text-left">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-md flex items-center gap-xs border-b border-neutral-800/80 pb-sm">
                  <Sparkles className="w-3.5 h-3.5 text-vandal-pink" /> Liked Profiles ({likedProfiles.length})
                </div>
                
                {likedProfiles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-sm overflow-y-auto pr-xs flex-1 max-h-[290px] items-start scrollbar-thin">
                    {likedProfiles.map((lp) => (
                      <div
                        key={lp.uid}
                        onClick={() => navigate(`/messages?recipientUid=${lp.lpUid || lp.uid}&recipientName=${encodeURIComponent(lp.name)}`)}
                        className="flex items-center justify-between cursor-pointer group bg-neutral-950/60 hover:bg-neutral-950/90 border border-neutral-800/80 p-md rounded-2xl transition-all hover:scale-[1.01] relative w-full"
                      >
                        <div className="flex items-center gap-md min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={lp.avatar}
                              alt={lp.name}
                              className="w-12 h-12 rounded-full border-2 border-vandal-pink/60 object-cover bg-neutral-800"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-vandal-pink to-topic-violet text-white rounded-full p-[2px] shadow-sm">
                              <MessageSquare className="w-2.5 h-2.5 fill-current" />
                            </div>
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="text-xs font-bold text-neutral-200 truncate block group-hover:text-vandal-pink transition-colors">
                              {lp.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-semibold block mt-[2px]">
                              Tap to chat
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800/60 text-neutral-400 rounded-full p-md shadow-sm group-hover:bg-vandal-pink group-hover:text-white transition-all ml-md flex-shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-md">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-700/60 mb-md">
                      <Sparkles className="w-6 h-6 text-vandal-pink animate-pulse-slow" />
                    </div>
                    <h4 className="text-xs font-bold text-white">No Liked Profiles Yet</h4>
                    <p className="text-[10px] text-neutral-500 mt-xs px-sm leading-normal font-medium">
                      Swipe right on matches to see them listed here and start chatting.
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
                          animate={{ scale: isTopCard ? 1 : 0.95, opacity: isTopCard ? 1 : 0.8, y: isTopCard ? 0 : 10 }}
                          exit={{
                            x: swipeDirection === 'right' ? 300 : swipeDirection === 'left' ? -300 : 0,
                            opacity: 0,
                            rotate: swipeDirection === 'right' ? 15 : swipeDirection === 'left' ? -15 : 0,
                            scale: 0.9
                          }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="w-full h-full"
                        >
                          <Card className="w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border-2 border-neutral-800/80 p-md rounded-3xl flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
                            
                            {/* Swipe Indicators overlays */}
                            {isTopCard && swipeDirection === 'right' && (
                              <div className="absolute top-12 left-8 border-4 border-emerald-500 text-emerald-500 font-extrabold uppercase tracking-widest text-2xl rotate-[-12deg] px-md py-xs rounded-xl z-20 bg-black/60 shadow-lg">
                                LIKE
                              </div>
                            )}
                            {isTopCard && swipeDirection === 'left' && (
                              <div className="absolute top-12 right-8 border-4 border-danger text-danger font-extrabold uppercase tracking-widest text-2xl rotate-[12deg] px-md py-xs rounded-xl z-20 bg-black/60 shadow-lg">
                                NOPE
                              </div>
                            )}

                            {/* Top section: Avatar and Match Percentage */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-md">
                                <img
                                  src={profile.avatar}
                                  alt={profile.name}
                                  className="w-12 h-12 rounded-full border-2 border-vandal-pink object-cover flex-shrink-0 bg-neutral-800"
                                />
                                <div className="min-w-0">
                                  <h3 className="font-display font-extrabold text-sm text-white truncate flex items-center gap-xs">
                                    {profile.name}
                                  </h3>
                                  <p className="text-[9px] text-neutral-400 truncate font-semibold">{profile.college}</p>
                                  <span className="inline-flex mt-xs px-sm py-[2px] bg-neutral-800 border border-neutral-700/60 rounded-md text-[8px] text-neutral-400 capitalize font-mono font-bold">
                                    {profile.gender}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <div className="inline-flex items-center gap-xs bg-gradient-to-r from-vandal-pink/20 to-topic-violet/20 border border-vandal-pink/40 text-vandal-pink font-mono text-[10px] px-sm py-xs rounded-lg font-bold shadow-glow-pink animate-pulse">
                                  <Flame className="w-3 h-3 fill-current" /> {profile.matchPercentage}% Match
                                </div>
                              </div>
                            </div>

                            {/* Middle Section: Shared Vibes list */}
                            <div className="flex-1 my-xs overflow-y-auto pr-xs">
                              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-xs flex items-center gap-xs">
                                <TrendingUp className="w-3 h-3 text-vandal-pink" /> Shared Vibe Vectors
                              </div>
                              {profile.sharedInterests.length > 0 ? (
                                <div className="flex flex-wrap gap-xs">
                                  {profile.sharedInterests.slice(0, 5).map((interest, iIdx) => {
                                    const InterestIcon = interest.Icon || Sparkles;
                                    return (
                                      <span
                                        key={iIdx}
                                        className="inline-flex items-center gap-xs text-[9px] font-semibold bg-neutral-900 border border-neutral-800/80 text-neutral-300 px-sm py-xs rounded-xl shadow-sm hover:border-vandal-pink/30 hover:text-white transition-colors"
                                      >
                                        <InterestIcon className="w-3 h-3 text-vandal-pink flex-shrink-0" />
                                        <span>{interest.text.split('(')[0].trim()}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-500 italic mt-sm">
                                  No identical matches, but opposites attract! Let's talk.
                                </p>
                              )}
                            </div>

                            {/* Action buttons embedded in Card for top Card */}
                            {isTopCard && (
                              <div className="flex items-center justify-around border-t border-neutral-800/80 pt-xs mt-xs">
                                <button
                                  onClick={() => handleSwipe('left')}
                                  className="w-10 h-10 bg-neutral-950 border border-neutral-800 hover:border-danger hover:text-danger rounded-full flex items-center justify-center text-neutral-400 transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSwipe('right')}
                                  className="w-10 h-10 bg-gradient-to-r from-vandal-pink to-topic-violet text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(255,42,133,0.4)] cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 text-white" />
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-xl bg-neutral-900/40 rounded-3xl border border-neutral-800/60 backdrop-blur-sm z-0">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-700/60 mb-lg">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-md font-bold font-display text-white">No Profiles Left</h3>
                    <p className="text-xs text-neutral-400 mt-xs px-md font-medium">
                      We scanned everyone in your category pool. Change filters, reset swipes, or update your quiz to find more friends!
                    </p>

                    <div className="mt-xl flex flex-col gap-sm w-full max-w-[200px]">
                      <Button size="sm" onClick={handleResetSwipes} className="w-full">
                        Reset All Swipes
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleRetakeQuiz} className="w-full">
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
            className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center justify-center p-xl backdrop-blur-lg"
          >
            <div className="absolute top-1/4 left-1/4 animate-bounce p-xs bg-vandal-pink/20 rounded-full border border-vandal-pink/40">
              <Sparkles className="w-5 h-5 text-vandal-pink" />
            </div>
            <div className="absolute top-1/3 right-1/4 animate-pulse p-xs bg-amber-500/20 rounded-full border border-amber-500/40">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div className="absolute bottom-1/4 right-1/3 animate-bounce p-xs bg-rose-500/20 rounded-full border border-rose-500/40">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div className="absolute bottom-1/3 left-1/3 animate-bounce p-xs bg-topic-violet/20 rounded-full border border-topic-violet/40">
              <Zap className="w-5 h-5 text-topic-violet" />
            </div>

            <div className="text-center max-w-sm relative z-10 flex flex-col items-center">
              <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-vandal-pink via-topic-violet to-neon-indigo font-display mb-md animate-pulse">
                Vibe Aligned!
              </h2>
              <p className="text-sm text-neutral-300 mb-2xl px-md">
                You and <strong className="text-white font-bold">{matchedProfile.name}</strong> share the same vibes!
              </p>

              {/* Match Double Avatar Bubble */}
              <div className="flex items-center justify-center gap-xl mb-3xl relative">
                <div className="w-24 h-24 rounded-full border-4 border-vandal-pink overflow-hidden shadow-[0_0_30px_rgba(255,42,133,0.5)] hover:scale-105 transition-transform bg-neutral-800">
                  <UserAvatar src={user.avatar} name={user.name || 'You'} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bg-neutral-900 text-vandal-pink rounded-full p-sm shadow-md z-25 border border-neutral-800">
                  <Sparkles className="w-5 h-5 text-vandal-pink" />
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-topic-violet overflow-hidden shadow-[0_0_30px_rgba(150,59,255,0.5)] hover:scale-105 transition-transform bg-neutral-800">
                  <UserAvatar src={matchedProfile.avatar} name={matchedProfile.name || 'Friend'} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex flex-col gap-md w-full px-lg">
                <button
                  onClick={() => startChat(matchedProfile)}
                  className="w-full py-4 bg-gradient-to-r from-vandal-pink via-topic-violet to-neon-indigo text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm flex items-center justify-center gap-sm uppercase tracking-wider cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Open Chat Window
                </button>
                <button
                  onClick={() => setIsMatchOverlayOpen(false)}
                  className="w-full py-md border border-neutral-700 hover:border-neutral-500 rounded-xl text-neutral-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                  Keep Matching
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
