import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const outputDir = path.join(projectRoot, 'public', 'amazon');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Cohort App Icon SVG
const logoSvg = `
<svg width="512" height="512" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2A85" />
      <stop offset="50%" stop-color="#963BFF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>
  </defs>
  <!-- Background matches background color of Cohort theme -->
  <rect x="0" y="0" width="32" height="32" fill="#08080C" />
  <path d="M 21,11 A 7,7 0 1,0 21,21" stroke="url(#cohort-logo-grad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
  <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke="#08080C" stroke-width="1" />
  <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />
  <path d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z" fill="#FFFFFF" />
</svg>
`;

// Cohort Amazon Promotional Banner (1024 x 500)
const promoSvg = `
<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2A85" />
      <stop offset="50%" stop-color="#963BFF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>
    <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="80" />
    </filter>
    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="80" />
    </filter>
  </defs>
  <rect width="1024" height="500" fill="#08080C" />
  
  <!-- Glowing ambient light -->
  <circle cx="150" cy="100" r="250" fill="#963BFF" opacity="0.2" filter="url(#glow-violet)" />
  <circle cx="874" cy="400" r="250" fill="#00F0FF" opacity="0.15" filter="url(#glow-cyan)" />
  
  <!-- Centered Logo element -->
  <g transform="translate(468, 100) scale(2.75)">
    <rect x="2" y="2" width="28" height="28" rx="9" fill="#08080C" stroke="url(#cohort-logo-grad)" stroke-width="2" />
    <path d="M 21,11 A 7,7 0 1,0 21,21" stroke="url(#cohort-logo-grad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
    <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke="#08080C" stroke-width="1" />
    <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />
    <path d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z" fill="#FFFFFF" />
  </g>
  <text x="512" y="280" font-family="'Plus Jakarta Sans', 'Inter', 'Arial', sans-serif" font-size="64" font-weight="900" text-anchor="middle" fill="#FFFFFF">Cohort.</text>
  <text x="512" y="330" font-family="'Plus Jakarta Sans', 'Inter', 'Arial', sans-serif" font-size="16" font-weight="700" letter-spacing="8" text-anchor="middle" fill="#A3A3A3">YOUR CAMPUS SOCIAL MEDIA</text>
</svg>
`;

async function main() {
  // 114x114 Small Icon
  await sharp(Buffer.from(logoSvg)).resize(114, 114).png().toFile(path.join(outputDir, 'small_icon.png'));
  console.log('Generated 114x114 Small Icon: public/amazon/small_icon.png');

  // 512x512 Large Icon
  await sharp(Buffer.from(logoSvg)).resize(512, 512).png().toFile(path.join(outputDir, 'large_icon.png'));
  console.log('Generated 512x512 Large Icon: public/amazon/large_icon.png');

  // 1024x500 Promotional Image
  await sharp(Buffer.from(promoSvg)).png().toFile(path.join(outputDir, 'promo_banner.png'));
  console.log('Generated 1024x500 Promotional Banner: public/amazon/promo_banner.png');
}

main().catch(console.error);
