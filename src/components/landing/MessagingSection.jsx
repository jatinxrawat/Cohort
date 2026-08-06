import React from 'react';
import { Paperclip, Smile, Send, Check, CheckCheck, FileText, Image } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const messages = [
  {
    from: 'other',
    name: 'Priya M.',
    text: 'Hey! Did you finish the ML assignment?',
    time: '10:24 AM',
    status: 'read',
  },
  {
    from: 'self',
    text: 'Almost done! Just stuck on the gradient descent part 😅',
    time: '10:26 AM',
    status: 'read',
  },
  {
    from: 'other',
    name: 'Priya M.',
    text: 'I can help! I found a really good explanation. Sending it now.',
    time: '10:27 AM',
    status: 'read',
  },
  {
    from: 'other',
    name: 'Priya M.',
    type: 'file',
    fileName: 'ML_Notes_GradientDescent.pdf',
    fileSize: '2.4 MB',
    time: '10:27 AM',
    status: 'read',
  },
  {
    from: 'self',
    text: 'You\'re a lifesaver!! 🙏🙏',
    time: '10:28 AM',
    status: 'delivered',
    reactions: ['❤️'],
  },
];

export default function MessagingSection() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-cyan uppercase tracking-widest">Messaging</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Chat with your campus
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
            Real-time messaging with file sharing, reactions, and more.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="max-w-lg mx-auto rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 overflow-hidden shadow-glass-lg">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-pink to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                PM
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-surface-dark-card" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Priya Mehta</p>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="px-5 py-6 space-y-4 min-h-[320px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'self' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[80%] ${msg.from === 'self' ? '' : ''}`}>
                  {msg.type === 'file' ? (
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.from === 'self'
                        ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-br-sm'
                        : 'bg-neutral-100 dark:bg-surface-dark-elevated text-neutral-900 dark:text-white rounded-bl-sm'
                    } flex items-center gap-3`}>
                      <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{msg.fileName}</p>
                        <p className="text-xs opacity-70">{msg.fileSize}</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      msg.from === 'self'
                        ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-br-sm'
                        : 'bg-neutral-100 dark:bg-surface-dark-elevated text-neutral-800 dark:text-neutral-200 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions && (
                    <div className="absolute -bottom-2 right-2 flex gap-0.5">
                      {msg.reactions.map((r, ri) => (
                        <span key={ri} className="text-sm bg-white dark:bg-surface-dark-card rounded-full px-1.5 py-0.5 shadow-sm border border-black/5 dark:border-white/5">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Time + status */}
                  <div className={`flex items-center gap-1 mt-1 ${msg.from === 'self' ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-neutral-400">{msg.time}</span>
                    {msg.from === 'self' && (
                      msg.status === 'read'
                        ? <CheckCheck className="w-3 h-3 text-accent-blue" />
                        : <Check className="w-3 h-3 text-neutral-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-neutral-100 dark:bg-surface-dark-elevated flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-typing-dot-1" />
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-typing-dot-2" />
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-typing-dot-3" />
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-5 py-4 border-t border-black/5 dark:border-white/5 flex items-center gap-3">
            <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-neutral-100 dark:bg-surface-dark-elevated rounded-xl px-4 py-2.5 text-sm text-neutral-400">
              Type a message...
            </div>
            <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
              <Smile className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-accent-blue/20">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
