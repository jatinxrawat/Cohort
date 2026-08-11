# Custom Agent Rules for Cohort

## Sitemap Management Rule
- Whenever creating a new public-facing page (such as a public feature, information page, landing page layout, or article/blog post), you MUST automatically append the new canonical URL to `public/sitemap.xml` with appropriate prioritization and crawl frequency. Do not wait for the user to request it. Private/authenticated routes (guarded by `ProtectedRoute`) must NOT be added to the sitemap.

## Cohort Uncut Article Styling Rules
All future articles written for the "Cohort Uncut" page must inherit and preserve the styling rules established in [CollegeLove.jsx](file:///c:/Users/kusha/Desktop/Projects/Cohort/src/pages/uncut/CollegeLove.jsx):

### 1. Structure and Wrapper
* The main page container must have `min-h-screen relative overflow-x-hidden` classes. The `relative` wrapper is critical so that absolute decorative atmospheric glow blurs are bounded and do not bleed over screen edges causing horizontal scrollbars.
* Background colors must support Light Mode Sepia reading paper style (`bg-[#faf7f2] text-neutral-900`) and Dark Mode Midnight style (`dark:bg-[#08080C] dark:text-neutral-100`) via transition effects.

### 2. Header Architecture
* The header container width must be set to `max-w-7xl mx-auto` to match the alignment coordinates of the Uncut landing page header exactly.
* The header background styling must follow standard glassmorphism rules: `bg-white/70 dark:bg-[#08080C]/70 backdrop-blur-xl`.
* The logo icon and text must be accompanied by the pink Uncut glowing link badge:
  ```jsx
  <Link 
    to="/uncut" 
    className="font-unbounded font-black text-xs tracking-wider text-pink-500 dark:text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-md border border-pink-500/20 transition-all"
  >
    UNCUT
  </Link>
  ```
* The back button should navigate to `/uncut` and be hidden on mobile screen widths using the Tailwind responsive viewport rules: `hidden sm:flex items-center gap-1.5 ...`.

### 3. Article Content Typography & Layout
* **Content Container**: The article text content must reside in a `max-w-3xl mx-auto font-serif` block. Avoid using default Tailwind `.prose` wrappers to prevent typography plugins from overriding core colors.
* **Heading Accent**: Title elements should contain an accent keyword utilizing the signature Uncut gradient:
  ```jsx
  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">Keyword</span>
  ```
* **Text Color Rules**:
  * Light Mode: `text-neutral-800`
  * Dark Mode: `dark:text-neutral-200` (DO NOT use invalid colors like `neutral-350` or standard pitch-black defaults).
* **Drop Cap Paragraphs**: The first paragraph of the article must have dropcap formatting classes:
  ```jsx
  <p className="first-letter:text-5xl first-letter:font-black first-letter:text-pink-500 first-letter:mr-3 first-letter:float-left">...</p>
  ```
* **Footers**: The footer link navigating back to the main site must always read `"Homepage"` instead of `"Landing Page"`.
