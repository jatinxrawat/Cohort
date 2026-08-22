import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const inputDir = path.join(projectRoot, 'public', 'amazon', 'screenshots');
const outputDir = path.join(projectRoot, 'public', 'amazon');

const screenshots = [
  {
    input: 'home.png',
    output: 'screenshot_1_feed.png',
    headline: 'CAMPUS SOCIAL FEED',
    subtitle: 'Stay updated with posts, announcements, and events from your peers'
  },
  {
    input: 'confession.png',
    output: 'screenshot_2_confessions.png',
    headline: 'SHIELDED CONFESSIONS',
    subtitle: 'Share secrets and confessions anonymously with 24h disappearing timers'
  },
  {
    input: 'make a friuend.png',
    output: 'screenshot_3_matcher.png',
    headline: 'FIND YOUR VIBE TWIN',
    subtitle: 'Instantly match with students sharing your branch, year, and study vibes'
  },
  {
    input: 'community.png',
    output: 'screenshot_4_chat.png',
    headline: 'SECURE GROUP CHATS',
    subtitle: 'Connect 1-on-1 or in campus channels with self-destructing Vanish Mode'
  },
  {
    input: 'uncut.png',
    output: 'screenshot_5_uncut.png',
    headline: 'COHORT UNCUT MAGAZINE',
    subtitle: 'Read long-form campus stories, articles, and student journalism'
  },
  {
    input: 'profile.png',
    output: 'screenshot_6_profile.png',
    headline: 'VERIFIED STUDENT PROFILES',
    subtitle: 'Showcase your posts, campus stats, and official verification badges'
  }
];

// Helper to generate background SVG
function getBackgroundSvg() {
  return `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#08080C" />
          <stop offset="50%" stop-color="#120E2E" />
          <stop offset="100%" stop-color="#050B14" />
        </linearGradient>
        <filter id="glow-left" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="120" />
        </filter>
        <filter id="glow-right" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="120" />
        </filter>
      </defs>
      
      <!-- Base Background -->
      <rect width="1920" height="1080" fill="url(#bg-grad)" />
      
      <!-- Ambient Glows -->
      <circle cx="150" cy="900" r="300" fill="#FF2A85" opacity="0.15" filter="url(#glow-left)" />
      <circle cx="1770" cy="180" r="350" fill="#00F0FF" opacity="0.12" filter="url(#glow-right)" />

      <!-- Tablet Bezel Frame Shadow -->
      <rect x="236" y="236" width="1448" height="908" rx="24" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="4" />
      <rect x="232" y="232" width="1456" height="916" rx="28" fill="none" stroke="rgba(0, 0, 0, 0.4)" stroke-width="8" />
      
      <!-- Tablet Bezel Bevel (Dark border representing hardware frame) -->
      <rect x="234" y="234" width="1452" height="912" rx="26" fill="none" stroke="#0C0C14" stroke-width="12" />
    </svg>
  `;
}

// Helper to generate text overlay SVG
function getTextOverlaySvg(headline, subtitle) {
  return `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF2A85" />
          <stop offset="50%" stop-color="#963BFF" />
          <stop offset="100%" stop-color="#00F0FF" />
        </linearGradient>
      </defs>
      
      <!-- Headline (Catchy Title) -->
      <text x="960" y="90" font-family="'Plus Jakarta Sans', 'Inter', 'Segoe UI', system-ui, sans-serif" font-size="46" font-weight="900" letter-spacing="6" text-anchor="middle" fill="url(#text-grad)">${headline}</text>
      
      <!-- Subtitle Description -->
      <text x="960" y="145" font-family="'Inter', 'Segoe UI', system-ui, sans-serif" font-size="20" font-weight="600" letter-spacing="1" text-anchor="middle" fill="#E4E4E7">${subtitle}</text>
    </svg>
  `;
}

async function processScreenshots() {
  console.log('Starting store screenshot processing...');

  const bgBuffer = Buffer.from(getBackgroundSvg());

  for (const item of screenshots) {
    const inputPath = path.join(inputDir, item.input);
    const outputPath = path.join(outputDir, item.output);

    if (!fs.existsSync(inputPath)) {
      console.warn(`[Warning] Input screenshot "${item.input}" not found in public/amazon/screenshots/ - skipping.`);
      continue;
    }

    console.log(`Processing: ${item.input} -> ${item.output}...`);

    // 1. Resize the screenshot to fit inside the tablet bezel (1440x900)
    // 1280x800 or any 16:10 will stretch perfectly to 1440x900
    const screenshotResized = await sharp(inputPath)
      .resize(1440, 900, { fit: 'fill' })
      .png()
      .toBuffer();

    // 2. Generate the text overlay layer
    const textBuffer = Buffer.from(getTextOverlaySvg(item.headline, item.subtitle));

    // 3. Composite everything together
    // Base: Background + Bezel
    // Overlays: The resized screenshot centered at x=240, y=240, and the text overlay on top
    await sharp(bgBuffer)
      .composite([
        { input: screenshotResized, left: 240, top: 240 },
        { input: textBuffer, left: 0, top: 0 }
      ])
      .png()
      .toFile(outputPath);

    console.log(`Successfully generated: public/amazon/${item.output}`);
  }

  console.log('Screenshot generation complete!');
}

processScreenshots().catch(console.error);
