import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rss,
  Ghost,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  School,
  Heart,
  EyeOff,
  Clock,
  MapPin,
  FileText,
  Send,
  Smile,
  Check,
  CheckCheck,
  Award,
  Paperclip,
} from 'lucide-react';

export default function AppConsoleMockup() {
  const [activeTab, setActiveTab] = useState('feed');

  // Interactive Poll state
  const [voted, setVoted] = useState(false);
  const [pollVotes, setPollVotes] = useState({ yes: 76, no: 24 });
  const [selectedOpt, setSelectedOpt] = useState(null);

  const handleVote = (option) => {
    if (voted) return;
    setVoted(true);
    setSelectedOpt(option);
    if (option === 'yes') {
      setPollVotes((prev) => ({ ...prev, yes: prev.yes + 1 }));
    } else {
      setPollVotes((prev) => ({ ...prev, no: prev.no + 1 }));
    }
  };

  const totalVotes = pollVotes.yes + pollVotes.no;
  const pctYes = Math.round((pollVotes.yes / totalVotes) * 100);
  const pctNo = Math.round((pollVotes.no / totalVotes) * 100);

  // Interactive Liking states
  const [liked1, setLiked1] = useState(false);
  const [likes1, setLikes1] = useState(86);
  const [liked2, setLiked2] = useState(false);
  const [likes2, setLikes2] = useState(142);

  // Interactive Purchase state
  const [purchasedItem, setPurchasedItem] = useState(null);

  const handleBuy = (itemName) => {
    setPurchasedItem(itemName);
    setTimeout(() => setPurchasedItem(null), 2500);
  };

  const channels = [
    { id: 'feed', label: 'general-feed', icon: Rss, desc: 'Unified campus buzz' },
    { id: 'confessions', label: 'confessions', icon: Ghost, desc: 'Anonymous secrets', secure: true },
    { id: 'marketplace', label: 'marketplace', icon: ShoppingBag, desc: 'Campus buy & sell' },
    { id: 'dms', label: 'direct-messages', icon: MessageSquare, desc: 'Private direct chats' },
  ];

  return (
    <section className="py-32 px-6 sm:px-8 max-w-7xl mx-auto bg-[#030307] relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] bg-grid-pattern pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-extrabold tracking-wider uppercase font-mono shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
          Interactive Dashboard Console
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-[1.2] uppercase">
          Experience <span className="text-gradient">Cohort</span> live.
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm font-semibold max-w-md mx-auto leading-relaxed font-sans">
          Switch channels in the sidebar below to test the core features of the campus app in real time.
        </p>
      </div>

      {/* Main Console Box */}
      <div className="rounded-[32px] border border-white/5 bg-[#0c0d14]/80 backdrop-blur-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px] max-w-5xl mx-auto hover:border-white/10 transition-all duration-300">
        {/* Sidebar Left Column */}
        <div className="md:col-span-4 lg:col-span-3 border-b md:border-b-0 md:border-r border-white/5 p-5 flex flex-col justify-between bg-[#030307]/50">
          <div className="space-y-6">
            {/* Header branding */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyber-cyan via-cyber-violet to-cyber-pink flex items-center justify-center font-display font-black text-xs text-white">
                C
              </div>
              <div>
                <h4 className="text-xs font-black text-white font-sans">KIET Campus</h4>
                <p className="text-[9px] font-bold text-neutral-500 mt-0.5 font-mono">1.2k students online</p>
              </div>
            </div>

            {/* Channels menu links */}
            <div className="space-y-1">
              <p className="text-[9px] font-extrabold text-neutral-600 uppercase tracking-widest px-2 mb-2 font-mono">
                Channels
              </p>
              {channels.map((chan) => {
                const Icon = chan.icon;
                const isSelected = activeTab === chan.id;
                return (
                  <button
                    key={chan.id}
                    onClick={() => setActiveTab(chan.id)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-[11px] font-bold transition-all text-left cursor-pointer group font-mono ${
                      isSelected
                        ? 'bg-white/5 text-white border border-white/10 shadow-sm'
                        : 'text-neutral-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyber-cyan' : 'text-neutral-500'}`} />
                    <span className="flex-1 truncate tracking-wide">
                      {chan.secure && '🔒 '}{chan.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User profile preview footer */}
          <div className="pt-4 border-t border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyber-violet to-cyber-pink flex items-center justify-center font-display font-black text-[9px] text-white">
              KS
            </div>
            <div>
              <h5 className="text-[10px] font-black text-white font-sans">Kunal Sen</h5>
              <p className="text-[9px] font-bold text-neutral-500 font-mono">CSE • 3rd Year</p>
            </div>
          </div>
        </div>

        {/* Viewport Content Column */}
        <div className="md:col-span-8 lg:col-span-9 p-6 sm:p-8 flex flex-col justify-between min-h-[420px] bg-[#0c0d14]/40">
          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                {/* Text & Image post card */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyber-cyan to-cyber-violet flex items-center justify-center font-display font-black text-[9px] text-white">
                        AS
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white font-sans">Aman Singh</h4>
                        <p className="text-[9px] font-bold text-neutral-500 font-mono">CSE • 3rd Year • 10m ago</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyber-pink/10 border border-cyber-pink/25 text-[8px] font-extrabold text-cyber-pink uppercase tracking-widest font-mono">
                      🔥 Trending
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-350 leading-relaxed font-sans">
                    Finally completed titration lab test notes! Check it out in the library folder or download from general drive notes. 🧪🧪
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setLikes1((l) => (liked1 ? l - 1 : l + 1));
                        setLiked1(!liked1);
                      }}
                      className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors font-mono ${
                        liked1 ? 'text-cyber-pink' : 'text-neutral-500 hover:text-cyber-pink'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked1 ? 'fill-cyber-pink text-cyber-pink' : ''}`} />
                      {likes1} Likes
                    </button>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Poll post card */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyber-lime to-cyber-cyan flex items-center justify-center font-display font-black text-[9px] text-white">
                      PK
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-sans">Pooja Kapoor</h4>
                      <p className="text-[9px] font-bold text-neutral-500 font-mono">BioTech • 1h ago</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-neutral-350 font-sans">
                    Should we petition for a waffle counter in the mess hall? 🥞🧇
                  </p>
                  <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                    {/* Option Yes */}
                    <button
                      onClick={() => handleVote('yes')}
                      className={`relative w-full h-11 rounded-xl border px-3.5 flex items-center justify-between overflow-hidden cursor-pointer ${
                        voted
                          ? selectedOpt === 'yes'
                            ? 'border-cyber-cyan/50 bg-cyber-cyan/5'
                            : 'border-white/5'
                          : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                      }`}
                    >
                      {voted && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctYes}%` }}
                          className="absolute inset-y-0 left-0 bg-cyber-cyan/10 pointer-events-none"
                        />
                      )}
                      <span className="relative z-10 text-xs font-bold text-neutral-300 font-sans">
                        Absolutely, yes!
                      </span>
                      {voted && (
                        <span className="relative z-10 text-xs font-black text-cyber-cyan font-mono">
                          {pctYes}%
                        </span>
                      )}
                    </button>
                    {/* Option No */}
                    <button
                      onClick={() => handleVote('no')}
                      className={`relative w-full h-11 rounded-xl border px-3.5 flex items-center justify-between overflow-hidden cursor-pointer ${
                        voted
                          ? selectedOpt === 'no'
                            ? 'border-cyber-cyan/50 bg-cyber-cyan/5'
                            : 'border-white/5'
                          : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                      }`}
                    >
                      {voted && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctNo}%` }}
                          className="absolute inset-y-0 left-0 bg-white/5 pointer-events-none"
                        />
                      )}
                      <span className="relative z-10 text-xs font-bold text-neutral-300 font-sans">
                        Regular menu is fine
                      </span>
                      {voted && (
                        <span className="relative z-10 text-xs font-black text-neutral-500 font-mono">
                          {pctNo}%
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'confessions' && (
              <motion.div
                key="confessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-stretch"
              >
                {/* Confession 1 */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-[180px] relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink flex items-center justify-center font-display font-black text-[9px]">
                          F
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md filter blur-[1.8px] select-none font-mono">
                          Anonymous
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-500 font-mono">2h ago</span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-300 leading-relaxed italic font-sans">
                      "I still think our advanced maths professor is secretly a chess grandmaster. His board layout notes are way too strategic."
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-500 pt-3 border-t border-white/5 font-mono">
                    <Heart className="w-3.5 h-3.5 text-cyber-pink" /> 24 likes
                  </div>
                </div>

                {/* Confession 2 */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-[180px] relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan flex items-center justify-center font-display font-black text-[9px]">
                          M
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md filter blur-[1.8px] select-none font-mono">
                          Anonymous
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-500 font-mono">4h ago</span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-300 leading-relaxed italic font-sans">
                      "Titration lab midterm was a total disaster. Managed to spill neutralizer on my notes. Good thing my lab partner had duplicates."
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-500 pt-3 border-t border-white/5 font-mono">
                    <Heart className="w-3.5 h-3.5 text-cyber-pink" /> 89 likes
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'marketplace' && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 flex-1 flex flex-col justify-between"
              >
                {/* Alert Notification Success for purchases */}
                <AnimatePresence>
                  {purchasedItem && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-cyber-lime/10 border border-cyber-lime/30 text-cyber-lime rounded-xl text-xs font-bold flex items-center gap-2 justify-center font-mono uppercase tracking-wide"
                    >
                      <Check className="w-4 h-4 text-cyber-lime" />
                      Inquiry sent for {purchasedItem}! Seller notified.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 2 product display cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div className="h-28 rounded-xl bg-gradient-to-br from-cyber-cyan/10 to-cyber-violet/10 flex items-center justify-center relative border border-white/5">
                      <span className="text-3xl">🚲</span>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-neutral-950/90 text-[8px] font-bold uppercase text-neutral-400 font-mono tracking-wider">
                        Excellent
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white font-sans">Hero Sprint Cycle</h4>
                      <p className="text-[10px] font-bold text-neutral-500 font-mono">Hostel 3 • DU</p>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                      <span className="text-sm font-display font-bold text-cyber-cyan">₹3,500</span>
                      <button
                        onClick={() => handleBuy('Hero Sprint Cycle')}
                        className="px-3.5 py-1.5 rounded-lg text-[9px] font-bold text-black bg-cyber-cyan shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer font-mono uppercase tracking-wider"
                      >
                        Buy Item
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div className="h-28 rounded-xl bg-gradient-to-br from-cyber-violet/10 to-cyber-pink/10 flex items-center justify-center relative border border-white/5">
                      <span className="text-3xl">🧮</span>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-neutral-950/90 text-[8px] font-bold uppercase text-neutral-400 font-mono tracking-wider">
                        Almost New
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white font-sans">Casio fx-991EX Calculator</h4>
                      <p className="text-[10px] font-bold text-neutral-500 font-mono">CSE • KIET</p>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                      <span className="text-sm font-display font-bold text-cyber-cyan">₹750</span>
                      <button
                        onClick={() => handleBuy('Casio Calculator')}
                        className="px-3.5 py-1.5 rounded-lg text-[9px] font-bold text-black bg-cyber-cyan shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer font-mono uppercase tracking-wider"
                      >
                        Buy Item
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dms' && (
              <motion.div
                key="dms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col justify-between h-[360px] flex-1 bg-white/5 border border-white/5 rounded-2xl p-4"
              >
                {/* Messages scroll content */}
                <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-neutral-900 border border-white/5 text-xs font-semibold text-neutral-300 font-sans">
                      Hey Kunal! Did you finish writing down the lab report summary for chem class?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyber-cyan via-cyber-violet to-cyber-pink text-xs font-semibold text-white relative pr-8 font-sans">
                      Yes! I converted it into a PDF manual. Sending it over.
                      <span className="absolute bottom-1 right-2">
                        <CheckCheck className="w-3.5 h-3.5 text-cyber-cyan" />
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-2.5 rounded-2xl rounded-tr-sm bg-neutral-950 border border-white/5 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-cyber-cyan" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate font-sans">Chem_Summary.pdf</p>
                        <p className="text-[8px] text-neutral-500 font-mono">1.8 MB • PDF Doc</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="relative max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-neutral-900 border border-white/5 text-xs font-semibold text-neutral-300 font-sans">
                      Absolute lifesaver! Thank you. 🙏🔥
                      <div className="absolute -bottom-2 -right-2 bg-neutral-950 border border-white/5 rounded-full px-1.5 py-0.5 text-[9px] select-none shadow">
                        ❤️
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouncing typing indicator */}
                <div className="flex items-center gap-1 px-1 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-typing-dot-3" />
                </div>

                {/* Chat input line */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-white/5">
                  <Paperclip className="w-4 h-4 text-neutral-500 hover:text-white cursor-pointer transition-colors" />
                  <div className="flex-1 bg-neutral-950 border border-white/5 px-3 py-2 rounded-xl text-[10px] font-semibold text-neutral-500 font-sans">
                    Send a vanishing chat message...
                  </div>
                  <Smile className="w-4 h-4 text-neutral-500 hover:text-white cursor-pointer transition-colors" />
                  <button className="p-2 rounded-lg bg-cyber-cyan text-black hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
