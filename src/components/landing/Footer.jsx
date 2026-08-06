import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Campus Feed', to: '/home' },
    { label: 'Communities', to: '/community' },
    { label: 'Confessions', to: '/anonymous' },
    { label: 'Marketplace', to: '/marketplace' },
    { label: 'Messages', to: '/messages' },
  ],
  Resources: [
    { label: 'Help Center', to: '/help' },
    { label: 'Guidelines', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Placement Tracker', to: '/placement' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

const socials = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/5 bg-white dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <span className="text-white font-display font-extrabold text-sm">C</span>
              </div>
              <span className="font-display font-extrabold text-lg text-neutral-900 dark:text-white">Cohort</span>
            </Link>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xs">
              The social platform built exclusively for college students. Redesigning university life, one campus at a time.
            </p>
            <div className="flex items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-widest">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Cohort. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
