import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = __dirname;
const resourcesDir = path.join(projectRoot, 'resources');

// Ensure resources directory exists
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir);
}

// 1. Generate App Icon (Flat "C" icon with solid dark background, no squircle container)
async function generateIcon() {
  const iconDest = path.join(resourcesDir, 'icon.png');
  
  const iconSvg = `
    <svg width="1024" height="1024" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2A85" />
          <stop offset="50%" stop-color="#963BFF" />
          <stop offset="100%" stop-color="#00F0FF" />
        </linearGradient>
      </defs>
      <!-- Solid dark background fill (removes squircle border and white spaces when masked) -->
      <rect x="0" y="0" width="32" height="32" fill="#08080C" />
      
      <!-- Stylized interconnected C-shape -->
      <path d="M 21,11 A 7,7 0 1,0 21,21" stroke="url(#cohort-logo-grad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Connecting nodes representing community -->
      <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
      <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke="#08080C" stroke-width="1" />
      <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />
      
      <!-- Dynamic academia/sparkle badge indicator inside -->
      <path d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z" fill="#FFFFFF" />
    </svg>
  `;
  
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(iconDest);
    
  console.log('Generated resources/icon.png (flat "C" icon) successfully!');
}

// 2. Generate Splash Screen (Full logo icon + vibrant gradient tagline centered on dark background)
async function generateSplash() {
  const splashDest = path.join(resourcesDir, 'splash.png');
  
  const logoTextSvg = `
    <svg width="1800" height="1000" viewBox="0 0 1800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2A85" />
          <stop offset="50%" stop-color="#963BFF" />
          <stop offset="100%" stop-color="#00F0FF" />
        </linearGradient>
        <linearGradient id="cohort-text-grad" x1="300" y1="720" x2="1500" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FF2A85" />
          <stop offset="50%" stop-color="#963BFF" />
          <stop offset="100%" stop-color="#00F0FF" />
        </linearGradient>
      </defs>

      <!-- Full Logo Icon with curved container (scaled 12.5x, centered at x=700, y=100) -->
      <g transform="translate(700, 100) scale(12.5)">
        <rect x="2" y="2" width="28" height="28" rx="9" fill="#08080C" stroke="url(#cohort-logo-grad)" stroke-width="2" />
        <path d="M 21,11 A 7,7 0 1,0 21,21" stroke="url(#cohort-logo-grad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
        <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke="#08080C" stroke-width="1" />
        <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />
        <path d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z" fill="#FFFFFF" />
      </g>

      <!-- Centered Tagline Text in vibrant brand gradient -->
      <text x="900" y="720" font-family="'Plus Jakarta Sans', 'Outfit', 'Inter', 'Arial', sans-serif" font-size="80" font-weight="900" text-anchor="middle" fill="url(#cohort-text-grad)" letter-spacing="-1">Your campus social media</text>
    </svg>
  `;

  // Create a 2732x2732 dark midnight-slate background (#08080C)
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 8, g: 8, b: 12, alpha: 1 } // #08080c
    }
  })
  .composite([
    {
      input: Buffer.from(logoTextSvg),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(splashDest);

  console.log('Generated resources/splash.png successfully!');
}

async function run() {
  try {
    await generateIcon();
    await generateSplash();
    console.log('All source assets generated successfully!');
  } catch (error) {
    console.error('Failed to generate source assets:', error);
  }
}

run();
