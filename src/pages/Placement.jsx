import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Briefcase, MapPin, Search, Plus, FileText, CheckCircle2, DollarSign, UploadCloud, AlertCircle } from 'lucide-react';

export default function Placement() {
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [applyingJob, setApplyingJob] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const [newJob, setNewJob] = useState({
    company: '',
    role: '',
    type: 'Full-Time',
    location: '',
    ctc: '',
    minCgpa: '7.0',
    deadline: '',
    desc: ''
  });

  // Fetch jobs from Firestore on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'placements'));
        const loaded = [];
        querySnapshot.forEach(d => {
          loaded.push({ id: d.id, docId: d.id, ...d.data() });
        });
        setJobs(loaded);
      } catch (e) {
        console.error('Failed to load placements from Firestore:', e);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const jobTypes = ['All', 'Full-Time', 'Internship'];

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeName) {
      setErrors({ resume: 'Please upload a resume file' });
      return;
    }

    setIsApplying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const updated = jobs.map(job => {
        if (job.id === applyingJob.id) {
          return { ...job, applied: true };
        }
        return job;
      });

      setJobs(updated);
      showSuccess(`Applied successfully to ${applyingJob.company} for the ${applyingJob.role} role!`);

      const targetJob = jobs.find(j => j.id === applyingJob.id);
      if (targetJob && targetJob.docId) {
        try {
          const docRef = doc(db, 'placements', targetJob.docId);
          await updateDoc(docRef, { applied: true });
        } catch (err) {
          console.error('Failed to update job application status in Firestore:', err);
        }
      }

      setApplyingJob(null);
      setResumeName('');
      setErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleFakeResumeUpload = () => {
    const userNameClean = user?.name ? user.name.replace(/\s+/g, '_') : 'Student';
    setResumeName(`Resume_${userNameClean}_${Date.now().toString().slice(-4)}.pdf`);
    setErrors({});
  };

  const handlePostJobSubmit = async (e) => {
    e.preventDefault();
    if (!newJob.company.trim() || !newJob.role.trim() || !newJob.desc.trim()) return;

    const bgColors = ['bg-red-500', 'bg-orange-500', 'bg-blue-600', 'bg-purple-600', 'bg-emerald-600'];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    const jobData = {
      company: newJob.company.trim(),
      role: newJob.role.trim(),
      type: newJob.type,
      location: newJob.location.trim() || 'On-Campus / Remote',
      ctc: newJob.ctc.trim() || 'Best in Industry',
      minCgpa: Number(newJob.minCgpa) || 7.0,
      deadline: newJob.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      desc: newJob.desc.trim(),
      logoText: newJob.company.charAt(0).toUpperCase(),
      logoBg: randomBg,
      applied: false,
      postedBy: user?.name || user?.email?.split('@')[0] || 'Placement Cell',
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'placements'), jobData);
      const withId = { id: docRef.id, docId: docRef.id, ...jobData };
      setJobs([withId, ...jobs]);
      setIsPostJobOpen(false);
      setNewJob({ company: '', role: '', type: 'Full-Time', location: '', ctc: '', minCgpa: '7.0', deadline: '', desc: '' });
      showSuccess(`Drive for "${jobData.company}" posted successfully!`);
    } catch (e) {
      console.error('Failed to post placement drive:', e);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company.toLowerCase().includes(search.toLowerCase()) || 
                          job.role.toLowerCase().includes(search.toLowerCase()) ||
                          job.desc.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="section-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">Placement Hub</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-xs">
            View and apply for campus recruitment drives, internships, and developer listings
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="flex items-center gap-md self-start sm:self-center shadow-md hover:shadow-lg transition-all"
          onClick={() => setIsPostJobOpen(true)}
        >
          <Plus className="w-5 h-5" /> Post Job Drive
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="mb-2xl flex flex-col sm:flex-row gap-md sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search company, role, technology..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-2xl py-xs text-sm"
          />
        </div>

        <div className="flex gap-xs bg-neutral-100 dark:bg-neutral-800/60 p-xs rounded-xl">
          {jobTypes.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-lg py-sm rounded-lg text-xs font-semibold transition-all ${
                selectedType === t
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Jobs Grid */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="space-y-lg">
            {[1, 2].map(i => (
              <Card key={i} className="h-44 skeleton rounded-2xl" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <motion.div
            layout
            className="space-y-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-lg hover:shadow-md transition-all border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg">
                    <div className="flex items-start gap-md min-w-0">
                      <div className={`w-12 h-12 rounded-2xl ${job.logoBg || 'bg-primary-500'} text-white font-extrabold flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                        {job.logoText || job.company.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-sm flex-wrap">
                          <h3 className="font-bold text-lg text-neutral-900 dark:text-white">{job.company}</h3>
                          <span className="badge-secondary">{job.type}</span>
                        </div>
                        <p className="text-sm font-semibold text-primary-500 mt-xs">{job.role}</p>

                        <div className="flex items-center gap-md text-xs text-neutral-500 dark:text-neutral-400 mt-sm flex-wrap">
                          <span className="flex items-center gap-xs">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                          <span className="flex items-center gap-xs text-neutral-800 dark:text-neutral-200 font-semibold">
                            <DollarSign className="w-3.5 h-3.5 text-success" /> CTC: {job.ctc}
                          </span>
                          <span>Deadline: {job.deadline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-md self-end md:self-center">
                      <Button
                        variant={job.applied ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={job.applied}
                        onClick={() => setApplyingJob(job)}
                        className="flex items-center gap-xs min-w-[120px] justify-center"
                      >
                        {job.applied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-success" /> Applied
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-md pt-md border-t border-neutral-50 dark:border-neutral-800 leading-relaxed">
                    {job.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4xl card border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-w-md mx-auto rounded-2xl"
          >
            <AlertCircle className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-lg" />
            <h3 className="font-bold text-lg mb-md">No Job Listings Available</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-lg">
              There are currently no placement drives posted. Post an opportunity for student applications!
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsPostJobOpen(true)}>
              <Plus className="w-4 h-4 mr-xs inline" /> Post Job Drive
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Modal */}
      <Modal isOpen={!!applyingJob} onClose={() => setApplyingJob(null)} title={`Apply to ${applyingJob?.company}`} size="md">
        {applyingJob && (
          <form onSubmit={handleApplySubmit} className="space-y-lg">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-md rounded-xl space-y-xs">
              <p className="font-bold text-sm text-neutral-900 dark:text-white">{applyingJob.role}</p>
              <p className="text-xs text-neutral-500">Target CGPA: {applyingJob.minCgpa}+ • {applyingJob.location}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
                Attach Resume (PDF)
              </label>
              <div
                onClick={handleFakeResumeUpload}
                className={`border-2 border-dashed rounded-xl p-xl text-center cursor-pointer transition-colors ${
                  resumeName
                    ? 'border-success bg-success/5 text-success'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-500'
                }`}
              >
                <UploadCloud className="w-8 h-8 mx-auto mb-xs text-neutral-400" />
                {resumeName ? (
                  <p className="text-xs font-semibold">{resumeName}</p>
                ) : (
                  <p className="text-xs text-neutral-500">Click to upload your resume file</p>
                )}
              </div>
              {errors.resume && <p className="text-xs text-danger mt-xs">{errors.resume}</p>}
            </div>

            <div className="flex gap-md pt-md">
              <Button variant="secondary" className="flex-1" onClick={() => setApplyingJob(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-1" disabled={isApplying}>
                {isApplying ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Post Job Drive Modal */}
      <Modal isOpen={isPostJobOpen} onClose={() => setIsPostJobOpen(false)} title="Post Placement Drive" size="md">
        <form onSubmit={handlePostJobSubmit} className="space-y-lg">
          <Input
            label="Company Name"
            placeholder="e.g. Google, Microsoft, Startup Inc"
            value={newJob.company}
            onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-lg">
            <Input
              label="Role Title"
              placeholder="e.g. Software Engineer"
              value={newJob.role}
              onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
            />
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
                Opportunity Type
              </label>
              <select
                value={newJob.type}
                onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                className="input-base"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <Input
              label="CTC / Stipend"
              placeholder="e.g. 24L - 28L or 50K/mo"
              value={newJob.ctc}
              onChange={(e) => setNewJob({ ...newJob, ctc: e.target.value })}
            />
            <Input
              label="Location"
              placeholder="e.g. Bangalore / Remote"
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
              Job Description & Requirements
            </label>
            <textarea
              rows={4}
              placeholder="Eligibility criteria, technical stack requirements, interview process steps..."
              value={newJob.desc}
              onChange={(e) => setNewJob({ ...newJob, desc: e.target.value })}
              className="input-base resize-none"
            />
          </div>

          <div className="flex gap-md pt-md">
            <Button variant="secondary" className="flex-1" onClick={() => setIsPostJobOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              Publish Drive
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
