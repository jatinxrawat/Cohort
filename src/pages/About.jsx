import React from 'react';
import { Card } from '@/components/Card';
import { Zap, Users, Target, Heart } from 'lucide-react';

export default function About() {
  const values = [
    { icon: Users, title: 'Community First', desc: 'We believe in the power of connected communities' },
    { icon: Target, title: 'Student-Centric', desc: 'Every feature is designed with students in mind' },
    { icon: Zap, title: 'Innovation', desc: 'Always evolving to serve our users better' },
    { icon: Heart, title: 'Inclusive', desc: 'A welcoming space for every student' },
  ];

  return (
    <div className="section-container max-w-3xl">
      <h1 className="text-3xl font-heading font-bold mb-lg">About Collex</h1>

      <Card className="mb-lg">
        <h2 className="text-2xl font-bold mb-md">Our Mission</h2>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-lg">
          Collex is on a mission to transform how college students connect, collaborate, and grow together. We believe that every student deserves access to a vibrant, supportive community right within their campus.
        </p>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
          Our platform brings together the best features for campus life: from social connections and event discovery to academic resources and career opportunities—all in one place.
        </p>
      </Card>

      <Card className="mb-lg">
        <h2 className="text-2xl font-bold mb-lg">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-lg">
          {values.map((value, i) => (
            <div key={i} className="p-lg bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <value.icon className="w-8 h-8 text-primary-500 mb-md" />
              <h3 className="font-bold text-lg mb-md">{value.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400">{value.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold mb-md">Get In Touch</h2>
        <p className="text-neutral-700 dark:text-neutral-300 mb-lg">
          Have questions or feedback? We'd love to hear from you!
        </p>
        <a href="mailto:hello@collex.in" className="text-primary-500 hover:text-primary-600 font-medium">
          hello@collex.in
        </a>
      </Card>
    </div>
  );
}
