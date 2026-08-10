import React from 'react';
import { Card } from '@/components/Card';
import { FileText, Award, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';
import SEO from '@/components/SEO';

/**
 * Terms of Service Page
 */
export default function Terms() {
  const sections = [
    {
      icon: ShieldCheck,
      title: '1. Eligibility & Registration',
      content: 'To register and use Cohort, you must be a student currently enrolled in an accredited university or college. You must provide a valid college email address during signup. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
    },
    {
      icon: Scale,
      title: '2. Acceptable Use Policy',
      content: 'Cohort is built to support a collaborative campus environment. You agree not to post content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. Spam, academic dishonesty material, and unauthorized advertisements are strictly prohibited.',
    },
    {
      icon: FileText,
      title: '3. Marketplace & Transactions',
      content: 'The Cohort Marketplace is an escrow-free, listing-only service to facilitate transactions between students. We do not handle payments, delivery, or verify the condition of items listed. Students must exercise caution and meet in safe, public campus locations to complete transactions.',
    },
    {
      icon: AlertTriangle,
      title: '4. Limitation of Liability',
      content: 'Cohort is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or safety of student-contributed content, study notes, or club activities. Under no circumstances will Cohort be liable for any direct or indirect damages arising from platform usage.',
    },
  ];

  return (
    <div className="section-container max-w-4xl">
      <SEO 
        title="Terms of Service | Cohort"
        description="Read the Cohort terms of service governing account eligibility, community guidelines, and marketplace rules."
      />
      
      <div className="text-center mb-3xl">
        <FileText className="w-16 h-16 text-primary-500 mx-auto mb-lg" />
        <h1 className="text-4xl font-heading font-bold mb-md">Terms of Service</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Last updated: July 18, 2026 • Please read these terms carefully before using Cohort
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
          By signing up, you explicitly agree to these terms. For any legal inquiries:
        </p>
        <a href="mailto:cohortnow.online@gmail.com" className="text-primary-500 hover:text-primary-600 font-semibold text-sm">
          cohortnow.online@gmail.com
        </a>
      </Card>
    </div>
  );
}
