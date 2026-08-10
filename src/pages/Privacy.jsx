import React from 'react';
import { Card } from '@/components/Card';
import { Shield, Eye, Lock, FileText, Bell } from 'lucide-react';
import SEO from '@/components/SEO';

/**
 * Privacy Policy Page
 */
export default function Privacy() {
  const sections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      content: 'We collect information you provide directly to us when creating an account, updating your profile, posting content, or communicating with other users. This includes your name, college email address, password, college affiliation, graduation year, profile details, and any posts, comments, or messages you share on the platform.',
    },
    {
      icon: Shield,
      title: '2. How We Use Your Information',
      content: 'We use the collected information to operate, maintain, and improve the Cohort platform. This includes personalizing your feed, facilitating connections with peer students, showing relevant campus events, managing marketplace transactions, sending notifications, and maintaining a safe and secure community environment.',
    },
    {
      icon: Lock,
      title: '3. Data Sharing and Disclosure',
      content: 'We do not sell your personal data. Your profile details, posts, and club memberships are visible to other verified students on the platform according to your privacy settings. We may disclose information if required by law or in good faith belief that such action is necessary to comply with campus regulations or protect student safety.',
    },
    {
      icon: FileText,
      title: '4. Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to analyze user activity, remember your settings, and authenticate your sessions. You can configure your browser to reject cookies, but some features of the Cohort platform may not function properly as a result.',
    },
    {
      icon: Bell,
      title: '5. Changes to This Policy',
      content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the last revised date. You are advised to review this Privacy Policy periodically for any changes.',
    },
  ];

  return (
    <div className="section-container max-w-4xl">
      <SEO 
        title="Privacy Policy | Cohort"
        description="Learn how Cohort manages, protects, and handles your campus information and personal data."
      />
      
      <div className="text-center mb-3xl">
        <Shield className="w-16 h-16 text-primary-500 mx-auto mb-lg" />
        <h1 className="text-4xl font-heading font-bold mb-md">Privacy Policy</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Last updated: July 18, 2026 • Learn how we protect your personal information
        </p>
      </div>

      <div className="space-y-lg">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <Card key={i} className="flex flex-col md:flex-row gap-lg items-start">
              <div className="p-md bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-500 flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-md text-neutral-900 dark:text-white">
                  {section.title}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm md:text-base">
                  {section.content}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-3xl text-center border-primary-500/20 bg-primary-50/20 dark:bg-primary-950/10">
        <p className="text-neutral-700 dark:text-neutral-300 mb-md font-medium">
          Have questions or concerns about your privacy?
        </p>
        <a href="mailto:cohortnow.online@gmail.com" className="text-primary-500 hover:text-primary-600 font-semibold text-sm">
          cohortnow.online@gmail.com
        </a>
      </Card>
    </div>
  );
}
