import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useNotification } from '@/contexts/NotificationContext';
import { Mail, MessageSquare, User, Building, MapPin, Send } from 'lucide-react';
import { validateEmail } from '@/utils/helpers';

export default function Contact() {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate API submit call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Your message has been sent successfully! We will get back to you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (err) {
      showError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="section-container max-w-5xl">
      <div className="text-center mb-3xl">
        <h1 className="text-4xl font-heading font-bold mb-md">Get in Touch</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
          Have questions, feedback, or need help? Send us a message and we'll reply as soon as possible.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-xl items-start">
        {/* Contact Info (2 cols) */}
        <div className="md:col-span-2 space-y-lg">
          <Card className="bg-primary-500 text-white border-transparent">
            <h2 className="text-2xl font-bold mb-lg">Contact Information</h2>
            <p className="text-primary-100 mb-2xl text-sm leading-relaxed">
              We're here to help you get the most out of your college community. Reach out to us directly or use the form.
            </p>
            <div className="space-y-xl">
              <div className="flex items-center gap-lg">
                <div className="p-md bg-white/10 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-primary-200">Email Us</p>
                  <a href="mailto:support@collex.in" className="font-semibold hover:text-primary-100 transition-colors">
                    support@collex.in
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-lg">
                <div className="p-md bg-white/10 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-primary-200">Campus HQ</p>
                  <p className="font-semibold text-sm">BITS Pilani Campus, Rajasthan, India</p>
                </div>
              </div>
              <div className="flex items-center gap-lg">
                <div className="p-md bg-white/10 rounded-lg">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-primary-200">Business Hours</p>
                  <p className="font-semibold text-sm">Mon - Fri, 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-lg mb-md">Report an Issue</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-lg leading-relaxed">
              If you want to report an objectionable post, spam account, or technical glitch, please contact our moderation team directly.
            </p>
            <a href="mailto:moderators@collex.in" className="text-primary-500 hover:text-primary-600 font-semibold text-sm">
              moderators@collex.in &rarr;
            </a>
          </Card>
        </div>

        {/* Contact Form (3 cols) */}
        <Card className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-lg">
            <div className="grid sm:grid-cols-2 gap-lg">
              <Input
                label="Full Name"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                icon={User}
              />
              <Input
                label="Email Address"
                placeholder="your@college.edu"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                icon={Mail}
              />
            </div>

            <Input
              label="Subject"
              placeholder="What is this about?"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              error={errors.subject}
              icon={MessageSquare}
            />

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Describe your query or feedback in detail..."
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className={`input-base resize-none ${errors.message ? 'border-danger focus:ring-danger' : ''}`}
              />
              {errors.message && <p className="text-xs text-danger mt-xs">{errors.message}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-md"
            >
              {isSubmitting ? (
                'Sending Message...'
              ) : (
                <>
                  Send Message <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
