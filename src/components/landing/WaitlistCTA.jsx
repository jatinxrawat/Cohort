import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Check, Sparkles } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function WaitlistCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setEmail('');
    }, 1500);
  };

  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal direction="scale">
        <div className="relative rounded-[2.5rem] overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue via-accent-purple to-accent-pink opacity-90" />
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />

          {/* Glow effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-[80px]" />

          <div className="relative z-10 text-center px-6 py-20 sm:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white/90">Early access is live</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white leading-tight tracking-tight mb-6">
                Ready to find your campus?
              </h2>

              <p className="text-white/70 text-lg mb-10 max-w-md mx-auto">
                Join thousands of students already building their campus communities on Cohort.
              </p>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                  >
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your student email"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="magnetic-btn px-8 py-4 rounded-2xl bg-white text-neutral-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 whitespace-nowrap"
                    >
                      {submitting ? 'Joining...' : 'Join Waitlist'}
                      {!submitting && <Send className="w-4 h-4" />}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-semibold">You're on the list! We'll be in touch.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
