export const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(date);
};

export const formatShortCollegeName = (rawName) => {
  if (!rawName) return 'Campus';
  let short = String(rawName).trim();
  if (short.includes(' - ')) {
    short = short.split(' - ')[0].trim();
  }
  if (short.includes(' (')) {
    short = short.split(' (')[0].trim();
  }
  if (short.includes(',')) {
    short = short.split(',')[0].trim();
  }
  return short;
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isCollegeEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;

  // Suffix checks:
  // - .edu (e.g. stanford.edu)
  // - .edu.xx (e.g. college.edu.in, college.edu.co)
  // - .ac.xx (e.g. iitd.ac.in, cam.ac.uk)
  // - .res.in (some research institutes in India)
  const academicRegex = /(\.edu|\.edu\.[a-z]{2}|\.ac\.[a-z]{2}|\.res\.in)$/i;
  
  // Custom popular exceptions that are academic but might not use the standard suffixes
  const customAcademicDomains = [
    'christuniversity.in',
    'srmist.edu.in',
    'mahe.edu',
    'manipal.edu',
    'symbiosis.ac.in'
  ];

  return academicRegex.test(domain) || customAcademicDomains.includes(domain);
};

export const verifyEmailMatchesCollege = (email, collegeName, universityName = '') => {
  if (!email || !collegeName) return false;
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;

  // Custom dictionary matching substring of college name to allowed domain bases / full domains
  const COLLEGE_DOMAIN_OVERRIDES = {
    'kiet': ['kiet.edu', 'kiet.ac.in'],
    'abes': ['abes.ac.in'],
    'ims': ['imsec.ac.in', 'ims.ac.in'],
    'bits pilani': ['bits-pilani.ac.in', 'bits-goa.ac.in', 'bits-hyderabad.ac.in'],
    'iit bombay': ['iitb.ac.in'],
    'iit delhi': ['iitd.ac.in'],
    'delhi university': ['du.ac.in', 'dse.du.ac.in'],
    'delhi school of economics': ['dse.du.ac.in', 'du.ac.in'],
    'christ university': ['christuniversity.in', 'christuniversity.edu.in'],
    'vit vellore': ['vit.ac.in', 'vitstudent.ac.in', 'vit.edu'],
    'manipal': ['manipal.edu', 'mahe.edu'],
    'ashoka university': ['ashoka.edu.in'],
    'srm': ['srmist.edu.in', 'srmuniv.ac.in'],
    'galgotias': ['galgotiasuniversity.edu.in', 'galgotiascolleges.edu', 'galgotias.edu.in'],
    'maseno': ['maseno.ac.ke'],
  };

  const collegeLower = collegeName.toLowerCase();
  const universityLower = universityName ? universityName.toLowerCase() : '';

  // Check explicit overrides dictionary
  for (const [key, domains] of Object.entries(COLLEGE_DOMAIN_OVERRIDES)) {
    if (collegeLower.includes(key) || universityLower.includes(key)) {
      if (domains.includes(domain) || domains.some(d => domain.endsWith(d))) {
        return true;
      }
    }
  }

  // Fallback Heuristics:
  // Extract base domain name: e.g. "kiet.edu" -> "kiet", "bits-pilani.ac.in" -> "bits-pilani"
  // Remove extensions (.edu, .ac.in, .edu.in, .edu.co, .ac.uk, .com, .org, etc.)
  const baseDomain = domain.replace(/(\.edu|\.ac|\.res|\.org|\.com|\.co)?(\.[a-z]{2,3})*$/g, '');
  if (!baseDomain) return false;

  // 1. Check if base domain is a direct substring of the college or university name
  // E.g., "kiet" in "KIET Group of Institutions"
  if (collegeLower.includes(baseDomain) || universityLower.includes(baseDomain)) {
    return true;
  }

  // 2. Check if the college or university name contains the base domain as an acronym / initials
  // E.g. "iitd" for "Indian Institute of Technology Delhi"
  const getInitials = (str) => {
    const fillerWords = ['of', 'and', 'the', 'for', 'in', 'at', 'on', 'a', 'an', 'to', 'group', 'institutions'];
    return str
      .replace(/[^a-zA-Z\s]/g, '') // remove punctuation
      .split(/\s+/)
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0 && !fillerWords.includes(word))
      .map(word => word[0])
      .join('')
      .toLowerCase();
  };

  const collegeInitials = getInitials(collegeName);
  const universityInitials = universityName ? getInitials(universityName) : '';

  if (baseDomain === collegeInitials || (universityName && baseDomain === universityInitials)) {
    return true;
  }

  // 3. For dashed domains like "bits-pilani", check if all components are found in college/university name
  if (baseDomain.includes('-')) {
    const parts = baseDomain.split('-');
    const matchedAll = parts.every(part => part.length > 2 && (collegeLower.includes(part) || universityLower.includes(part)));
    if (matchedAll) return true;
  }

  return false;
};

export const predictGenderFromName = (email) => {
  if (!email || typeof email !== 'string') return 'Neutral';
  
  const username = email.trim().toLowerCase().split('@')[0];
  if (!username) return 'Neutral';

  // Extract first name (split by dot, underscore, hyphen or numbers)
  const firstName = username.split(/[\._\-0-9]/)[0];
  if (!firstName || firstName.length < 2) return 'Neutral';

  const MALE_NAMES = new Set([
    'rahul', 'amit', 'abhishek', 'kushal', 'rohit', 'sachin', 'mohit', 'raj', 'deepak', 'sandeep',
    'sunil', 'anil', 'vishal', 'nikhil', 'karan', 'arjun', 'aakash', 'aditya', 'gaurav', 'manish',
    'vivek', 'harsh', 'ankit', 'ritesh', 'vikram', 'saurabh', 'pranav', 'shubham', 'rishabh', 'kartik',
    'madhav', 'varun', 'rishi', 'dev', 'raghav', 'kabir', 'yash', 'abhay', 'dhruv', 'sid',
    'siddharth', 'ayush', 'hardik', 'priyansh', 'aman', 'ritik', 'shiv', 'shivam', 'shubham', 'vijay',
    'ajay', 'sanjay', 'ram', 'shyam', 'aravind', 'anuj', 'mayank', 'prateek', 'tushar', 'gaurav',
    'rohan', 'kunal', 'pankaj', 'suresh', 'ramesh', 'dinesh', 'harish', 'mahesh', 'naresh', 'lokesh',
    'rakesh', 'vikas', 'vinay', 'ashok', 'alok', 'atul', 'arun', 'saurav', 'tarun', 'varun', 'gautam',
    'ravi', 'hari', 'shiva', 'sameer', 'aman', 'sahil', 'jatin'
  ]);

  const FEMALE_NAMES = new Set([
    'priya', 'sneha', 'neha', 'anjali', 'pooja', 'ritu', 'kavita', 'aarushi', 'shruti', 'aditi',
    'kirti', 'divya', 'pragya', 'preeti', 'swati', 'shreya', 'megha', 'tisha', 'tanvi', 'ishita',
    'ananya', 'disha', 'riya', 'rhea', 'khushi', 'muskan', 'sakshi', 'shalini', 'shivani', 'nisha',
    'jyoti', 'komal', 'pinky', 'sonal', 'payal', 'sheetal', 'kajal', 'rashmi', 'nishi', 'sonam',
    'renu', 'sapna', 'mamta', 'babita', 'gauri', 'diksha', 'rashi', 'taniya', 'anushka', 'deepika',
    'aliya', 'katrina', 'kareena', 'sushma', 'radha', 'aanchal', 'sweta', 'shweta', 'monika', 'mansi',
    'hema', 'rekha', 'jaya', 'sushmita', 'sunita', 'anita', 'geeta', 'seema', 'meena', 'asha',
    'lata', 'pallavi', 'poonam', 'prerna', 'richa', 'ridhima', 'shikha', 'tanu', 'diksha', 'alka'
  ]);

  const UNISEX_NAMES = new Set([
    'suman', 'krishna', 'kiran', 'simran', 'harpreet', 'gurpreet', 'jaspreet', 'simar', 'kripa', 'preet',
    'deep', 'sunny', 'bobby', 'ryan', 'taylor', 'alex', 'sam', 'robin'
  ]);

  // 1. Unisex overrides
  if (UNISEX_NAMES.has(firstName)) {
    return 'Neutral';
  }

  // 2. Direct Male names
  if (MALE_NAMES.has(firstName)) {
    return 'Male';
  }

  // 3. Direct Female names
  if (FEMALE_NAMES.has(firstName)) {
    return 'Female';
  }

  // 4. Suffix-based heuristics for typical Indian names
  if (firstName.endsWith('esh') || firstName.endsWith('ish') || firstName.endsWith('endra') || firstName.endsWith('jeet') || firstName.endsWith('preet') || firstName.endsWith('meet')) {
    return 'Male';
  }
  if (firstName.endsWith('ank') || firstName.endsWith('it') || firstName.endsWith('ant') || firstName.endsWith('eep') || firstName.endsWith('eet') || firstName.endsWith('ath') || firstName.endsWith('dev') || firstName.endsWith('raj')) {
    return 'Male';
  }
  if (firstName.endsWith('av') || firstName.endsWith('am') || firstName.endsWith('an') || firstName.endsWith('al') || firstName.endsWith('ar') || firstName.endsWith('ur') || firstName.endsWith('ut')) {
    return 'Male';
  }
  if (firstName.endsWith('ika') || firstName.endsWith('isha') || firstName.endsWith('anya') || firstName.endsWith('iti') || firstName.endsWith('ini') || firstName.endsWith('eta') || firstName.endsWith('iya') || firstName.endsWith('ee')) {
    return 'Female';
  }
  if (firstName.endsWith('a') || firstName.endsWith('i')) {
    return 'Female';
  }

  return 'Neutral';
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const getAvatarUrl = (avatarOrUser, fallbackName = 'Student') => {
  let url = '';
  let name = fallbackName;

  if (typeof avatarOrUser === 'string') {
    url = avatarOrUser;
  } else if (avatarOrUser && typeof avatarOrUser === 'object') {
    url = avatarOrUser.avatar || avatarOrUser.photoURL || avatarOrUser.imageUrl || '';
    name = avatarOrUser.name || avatarOrUser.displayName || fallbackName;
  }

  if (!url || url.includes('dicebear.com')) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&bold=true&size=128`;
  }

  return url;
};

