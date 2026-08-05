import React from 'react';
import { Card } from '@/components/Card';
import { ChevronDown } from 'lucide-react';

export default function Help() {
  const [openFaq, setOpenFaq] = React.useState(null);

  const faqs = [
    { q: 'How do I create an account?', a: 'Visit the signup page and fill in your details. You need a valid college email.' },
    { q: 'Is Collex free to use?', a: 'Yes! Collex is completely free for all students.' },
    { q: 'How do I post in the community?', a: 'Navigate to Home and use the post creation box at the top of your feed.' },
    { q: 'Can I delete my account?', a: 'Yes, you can delete your account from Settings > Account > Delete Account.' },
  ];

  return (
    <div className="section-container max-w-3xl">
      <h1 className="text-3xl font-heading font-bold mb-lg">Help & Support</h1>
      
      <Card className="mb-lg">
        <h2 className="text-xl font-bold mb-lg">Frequently Asked Questions</h2>
        <div className="space-y-md">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full py-md flex items-center justify-between hover:text-primary-500 transition-colors"
              >
                <span className="font-medium text-left">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <p className="pb-md text-neutral-600 dark:text-neutral-400">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-md">Need More Help?</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-lg">
          Can't find what you're looking for? Contact our support team.
        </p>
        <a href="mailto:support@collex.in" className="text-primary-500 hover:text-primary-600 font-medium">
          support@collex.in
        </a>
      </Card>
    </div>
  );
}
