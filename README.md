# ⚡ COHORT — The Next-Gen Campus & Student Social Ecosystem

[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.16-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **Cohort** is an all-in-one, ultra-modern campus social network designed specifically for university students. It combines real-time feeds, 100% anonymous campus confessions with auto-expiration, end-to-end direct messaging, a peer-to-peer student marketplace, AI-inspired vibe twin matching, university placement statistics, and long-form campus journalism.

---

## 🌟 Key Highlights

- ⚡ **Real-Time Campus Feed**: Instant updates, post upvoting/downvoting, comments, media attachments, bookmarking, and verified official broadcasts.
- 🕵️ **100% Anonymous Confessions**: Identity-shielded confession feed featuring 24-hour auto-expiring timer badges, flame indicators, and zero profile traceability.
- 💬 **Direct Messages & Community Hub**: Real-time 1-on-1 chat, group channels, self-destructing Vanish Mode, "My Side Only" expiration, and image/media attachments.
- 🛍️ **Student P2P Marketplace**: Buy and sell textbooks, bicycles, laptops, and hostel gear directly with campus peers. Includes direct DM Seller integration and safety tips.
- ✨ **Vibe Twin Friend Matcher**: Connect with fellow students based on shared interests, branch, graduation year, favorite campus hangout spots, and study vibes.
- 📰 **Cohort Uncut**: Premium long-form campus magazine featuring Sepia Paper Light Mode (`#faf7f2`) and Midnight Dark Mode (`#08080C`) for editorial articles and stories.
- 📊 **Placement Analytics**: Interactive campus placement stats, CTC distribution charts, top recruiters, and branch-wise placement metrics.
- 📱 **Native Mobile Support**: Built for Web and Android via Capacitor runtime with push notification integrations.

---

## 🚀 Module Overview

| Feature Module | Path | Key Capabilities |
| :--- | :--- | :--- |
| **Main Feed** | `/home` | Real-time posts, multi-image upload, image cropping, custom tags, upvotes, comments, reshares. |
| **Anonymous Confessions** | `/anonymous` / `/confessions` | Confidential campus secrets, 24-hour auto-expiration timers, moderation reporting. |
| **Direct Messaging** | `/messages` | Direct chat, community channels, Vanish Mode, starred messages, unread message badges. |
| **Student Marketplace** | `/marketplace` | P2P buying/selling, condition tags, category filters, direct seller messaging. |
| **Vibe Matcher** | `/make-friend` | Match percentage calculation, branch & vibe filters, instant chat trigger. |
| **Cohort Uncut** | `/uncut` | Campus journalism, drop-cap typography, sepia/midnight reading modes. |
| **Placement Portal** | `/placement` | Company statistics, package distribution, placement rate dashboards. |
| **User Profiles** | `/profile` | User stats, bio, social links, post history, saved bookmarks, official verification. |

---

## 🛠️ Technology Stack

### Frontend & UI
- **Framework**: React 18.3 + Vite 5
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS v3 (Vanilla CSS utility architecture, custom glassmorphism, HSL color tokens)
- **Animations & Visuals**: Framer Motion, GSAP, Lucide Icons, Custom WebGL/OGL Shaders (`Aurora`, `Topography`, `Scanner`)

### Backend & Infrastructure
- **Authentication**: Firebase Authentication (Google Auth & Email/Password)
- **Database**: Real-Time Firestore NoSQL Database
- **Storage**: Firebase Cloud Storage for high-resolution post photos, avatars, and product images

### Mobile Architecture
- **Mobile Runtime**: Capacitor 8 (Android SDK target)
- **Push Notifications**: `@capacitor/push-notifications`
- **Device Features**: `@capacitor/app`, `@capacitor/splash-screen`

---

## 📂 Project Architecture

```
Cohort/
├── android/                   # Capacitor Android Native Workspace
├── public/                    # Static Assets, Sitemap, Icons
│   └── sitemap.xml            # SEO Canonical Sitemap
├── src/
│   ├── components/            # Reusable Core Components
│   │   ├── Aurora.jsx         # Canvas WebGL Background Shader
│   │   ├── Carousel.jsx       # Custom Animated Card Carousel
│   │   ├── Header.jsx         # Responsive Top Bar & Mobile DM Navigation
│   │   ├── MobileNav.jsx      # Floating Glass Mobile Navigation Bar
│   │   ├── PostCard.jsx       # Dynamic Post Card (Full Uncropped Images)
│   │   ├── Sidebar.jsx        # Desktop Navigation Sidebar
│   │   ├── Topography.jsx     # Visual Graphic Canvas Utility
│   │   └── UserAvatar.jsx     # Synchronized Profile Avatar Component
│   ├── contexts/              # Global State Contexts
│   │   ├── AuthContext.jsx    # User Auth, Real-Time DM Listener, Firestore Sync
│   │   └── ThemeContext.jsx   # Dark / Light Mode Provider
│   ├── pages/                 # Application Route Views
│   │   ├── AnonymousFeed.jsx  # Confessions & Expiring Anonymous Feed
│   │   ├── Home.jsx           # Campus Main Social Feed
│   │   ├── MakeAFriend.jsx    # Campus Vibe Twin Friend Finder
│   │   ├── Marketplace.jsx   # Peer-to-Peer Student Marketplace
│   │   ├── Messages.jsx      # Real-Time Chat & Vanish Mode Engine
│   │   ├── Placement.jsx     # College Placement Insights & Statistics
│   │   ├── Profile.jsx        # User Profile & Official Verification
│   │   ├── Search.jsx         # Global Campus Search
│   │   └── Uncut.jsx          # Cohort Uncut Campus Magazine
│   ├── utils/                 # Firebase Init, Date Formatters & Helpers
│   │   └── firebase.js        # Firebase App Initialization
│   ├── App.jsx                # Application Routes & Providers
│   ├── main.jsx               # Entry Point
│   └── index.css              # Core Design System & Tailwind Directives
├── capacitor.config.json      # Capacitor Mobile Configuration
├── tailwind.config.js         # Tailwind Design Tokens
├── vite.config.js             # Vite Build Settings
└── package.json               # Dependencies & NPM Scripts
```

---

## 💻 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed on your machine.

- Node.js: `>= 18.0.0`
- npm: `>= 9.0.0`

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Cohort.git
cd Cohort
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Locally (Development)
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 📱 Mobile Build (Android)

Cohort is optimized for mobile compilation using **Capacitor**.

### Sync & Run Android Studio
```bash
# Build production web bundle
npm run build

# Sync web assets with native Android wrapper
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 🔒 Security & Guidelines

> [!IMPORTANT]
> - **Confession Anonymity**: Confidentiality is strictly protected. Confidential posts strip user identifiers prior to writing to Firestore.
> - **Official Account Verification**: Official profile edits (`cohort_official`) are restricted and validated via `isOfficialLoggedIn` permission boundaries.
> - **Sitemap Rule**: New public pages must append canonical URLs to `public/sitemap.xml`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/Cohort/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

***

<p center>
  Designed & Built with ❤️ for Campus Communities.
</p>
