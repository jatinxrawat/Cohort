import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function generateLogoIcon() {
  const logoSvg = `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2A85" />
          <stop offset="50%" stop-color="#963BFF" />
          <stop offset="100%" stop-color="#00F0FF" />
        </linearGradient>
      </defs>

      <!-- Outer squircle container -->
      <rect x="2" y="2" width="28" height="28" rx="9" fill="#08080C" stroke="url(#cohort-logo-grad)" stroke-width="2" />

      <!-- Stylized interconnected C-shape using perfect 270-degree circular arc -->
      <path d="M 21,11 A 7,7 0 1,0 21,21" stroke="url(#cohort-logo-grad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Connecting nodes representing community -->
      <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
      <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke="#08080C" stroke-width="1" />
      <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />

      <!-- Dynamic academia/sparkle badge indicator inside -->
      <path d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z" fill="#FFFFFF" />
    </svg>
  `;

  const destPath = path.join(projectRoot, 'public', 'cohort_logo_150.png');

  console.log('Rendering 150x150 logo icon to PNG with Sharp...');
  await sharp(Buffer.from(logoSvg))
    .resize(150, 150)
    .png()
    .toFile(destPath);

  console.log(`Successfully generated logo icon at ${destPath}!`);
}

generateLogoIcon().catch(console.error);
