import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Flame, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Users, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles,
  Lock,
  GraduationCap
} from 'lucide-react';
import { COLLEGES } from '@/utils/colleges';
import SEO from '@/components/SEO';
import { LogoIcon } from '@/components/Logo';
import SpecularButton from '@/components/SpecularButton';
import BorderGlow from '@/components/BorderGlow';

/**
 * Public college preview page.
 * Renders SEO-optimized public information for specific campus communities to capture long-tail organic searches.
 */
export default function CollegePublic() {
  const { collegeId } = useParams();

  // Find college details or build dynamic metadata if it is SEO-ready placeholder
  const college = useMemo(() => {
    const cid = collegeId?.toLowerCase();
    const found = COLLEGES.find(c => c.id === cid || c.short?.toLowerCase() === cid);
    if (found) return found;

    // Helper mapping for slug names to pretty names
    const slugMap = {
      'kiet': 'KIET Group of Institutions',
      'amity-noida': 'Amity University Noida',
      'iit-delhi': 'IIT Delhi',
    };

    const name = slugMap[cid] || cid.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Dynamic fallback structure for SEO readiness
    return {
      id: cid,
      name: name,
      short: name.split(' ')[0],
      color: '#A329FF',
      tagline: `Your unfiltered campus talk is waiting.`,
      confessions: [
        { text: `Spotted my crush in the lecture hall. Should I send them a confession here or keep it anonymous? 💀`, likes: 45, comments: 3, time: '10m ago' },
        { text: `Anyone knows if the professor extended the deadline for the assignment? I am struggling. 😩`, likes: 21, comments: 5, time: '1h ago' }
      ],
      events: [
        { name: `${name} Campus Meetup`, time: "This Friday at 6 PM", RSVPs: 64 },
        { name: "Free Chai & Networking Session", time: "Monday at 4 PM", RSVPs: 38 }
      ]
    };
  }, [collegeId]);

  const brandColor = college.color || '#963BFF';

  return (
    <div className="min-h-screen bg-[#08080C] text-neutral-100 relative overflow-hidden font-sans">
      <SEO 
        title={`${college.name} Student Community & Campus Life`}
        description={`Connect with other ${college.name} students on Cohort. The campus social media for anonymous confessions, gossip, making friends, events, opportunities, and campus circles.`}
      />

      {/* Futuristic Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
          style={{ backgroundColor: brandColor }}
        />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[180px] opacity-15" />
      </div>

      {/* Main Layout Container */}
      <div className="max-w-5xl mx-auto px-md py-xl relative z-10">
        
        {/* Navigation Bar */}
        <header className="flex justify-between items-center mb-xl">
          <Link to="/" className="inline-flex items-center gap-sm text-neutral-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-xs">
            <LogoIcon variant="nobadge" className="w-7 h-7" />
            <span className="font-display font-black text-lg text-white">Cohort<span className="text-primary-500">.</span></span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-2xl">
          <div className="inline-flex items-center gap-xs px-md py-sm bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-neutral-300 mb-lg backdrop-blur-md">
            <GraduationCap className="w-4 h-4 text-primary-400" />
            <span>Official Campus Space</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight mb-md leading-tight">
            The social media for <br />
            <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-blue-500 bg-clip-text text-transparent">
              {college.name}
            </span>
          </h1>

          <p className="text-base md:text-lg text-neutral-400 mb-xl max-w-xl mx-auto leading-relaxed">
            {college.tagline || `Step into the digital community for ${college.name}. Confidential confessions, chats, opportunities, and campus circles.`}
          </p>

          <Link to="/signup">
            <SpecularButton className="px-xl py-lg font-bold text-sm rounded-2xl shadow-xl hover:shadow-primary-500/10 transition-all">
              Claim Your Campus Access <ChevronRight className="w-4 h-4 inline-block ml-xs" />
            </SpecularButton>
          </Link>
        </div>

        {/* Dynamic Grid Previews */}
        <div className="grid md:grid-cols-2 gap-xl mb-3xl">
          
          {/* Confessions Section */}
          <BorderGlow glowColor={brandColor} className="rounded-3xl">
            <div className="bg-[#0f0f15]/80 backdrop-blur-xl border border-white/5 p-xl rounded-3xl h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-md mb-xl">
                  <div className="p-sm bg-rose-500/10 rounded-xl">
                    <Flame className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-white">Campus Confessions</h3>
                    <p className="text-xs text-neutral-400">Anonymous & unfiltered college takes</p>
                  </div>
                </div>

                <div className="space-y-lg mb-xl">
                  {college.confessions.map((c, i) => (
                    <div key={i} className="p-md bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-sm text-neutral-300 leading-relaxed mb-md">"{c.text}"</p>
                      <div className="flex items-center gap-md text-xs text-neutral-400">
                        <span className="flex items-center gap-xs"><Heart className="w-3.5 h-3.5 text-rose-500" /> {c.likes}</span>
                        <span className="flex items-center gap-xs"><MessageCircle className="w-3.5 h-3.5 text-blue-400" /> {c.comments}</span>
                        <span className="ml-auto">{c.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-md border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-neutral-500 flex items-center gap-xs"><Lock className="w-3 h-3" /> Anonymous Posting locked</span>
                <Link to="/signup" className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-xs">
                  Reveal Feed <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </BorderGlow>

          {/* Events Section */}
          <BorderGlow glowColor="#00F0FF" className="rounded-3xl">
            <div className="bg-[#0f0f15]/80 backdrop-blur-xl border border-white/5 p-xl rounded-3xl h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-md mb-xl">
                  <div className="p-sm bg-cyan-500/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-white">Upcoming Events</h3>
                    <p className="text-xs text-neutral-400">Clubs, sessions, and pizza nights</p>
                  </div>
                </div>

                <div className="space-y-lg mb-xl">
                  {college.events.map((e, i) => (
                    <div key={i} className="p-md bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center gap-md">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-200 mb-xs">{e.name}</h4>
                        <p className="text-xs text-neutral-400">{e.time}</p>
                      </div>
                      <span className="flex-shrink-0 px-md py-xs bg-cyan-500/10 text-cyan-400 text-xs rounded-full font-bold">
                        {e.RSVPs} RSVP'd
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-md border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-neutral-500 flex items-center gap-xs"><Users className="w-3.5 h-3.5" /> Direct RSVP available</span>
                <Link to="/signup" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-xs">
                  Join Events <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </BorderGlow>

        </div>

        {/* Feature Highlights Banner */}
        <section className="p-xl bg-white/[0.01] border border-white/5 rounded-3xl text-center max-w-4xl mx-auto mb-3xl">
          <h3 className="font-heading font-extrabold text-xl text-white mb-md flex items-center justify-center gap-xs">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" /> What is Cohort?
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl mx-auto mb-xl">
            Cohort is the ultimate social network designed exclusively for college students. We connect you with your university campus circles, confessions, gossip, making friends, academic study groups, career opportunities, and direct peer messages—all behind a secure student authentication portal.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md text-xs font-semibold text-neutral-300">
            <div className="p-md bg-white/[0.02] rounded-xl border border-white/5">💬 Confessions & Takes</div>
            <div className="p-md bg-white/[0.02] rounded-xl border border-white/5">🍕 Campus Events & Clubs</div>
            <div className="p-md bg-white/[0.02] rounded-xl border border-white/5">🤝 Make Friends Mode</div>
            <div className="p-md bg-white/[0.02] rounded-xl border border-white/5">💼 Job Placement Prep</div>
          </div>
        </section>

        {/* Page Footer */}
        <footer className="pt-xl border-t border-white/5 text-center text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} Cohort Campus. All rights reserved.</p>
          <div className="flex justify-center gap-md mt-sm">
            <Link to="/about" className="hover:text-neutral-400 transition-colors">About</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-neutral-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-neutral-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/help" className="hover:text-neutral-400 transition-colors">Help Center</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
