import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const logoPath = path.join(publicDir, 'logo.svg');

// 1. Check if public directory and logo exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(logoPath)) {
  console.error(`Error: Logo asset not found at ${logoPath}`);
  process.exit(1);
}

const logoBuffer = fs.readFileSync(logoPath);

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type (1 = ICO)
  header.writeUInt16LE(images.length, 4); // Number of images

  const entries = [];
  let offset = 6 + 16 * images.length;

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0); // Width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data
    
    entries.push(entry);
    offset += img.buffer.length;
  }

  const buffers = [header, ...entries, ...images.map(img => img.buffer)];
  return Buffer.concat(buffers);
}

async function generateFavicons() {
  try {
    // Generate PNG buffers for ICO and standard sizes
    const png16 = await sharp(logoBuffer).resize(16, 16).png().toBuffer();
    const png32 = await sharp(logoBuffer).resize(32, 32).png().toBuffer();
    const png48 = await sharp(logoBuffer).resize(48, 48).png().toBuffer();
    const png96 = await sharp(logoBuffer).resize(96, 96).png().toBuffer();
    const png192 = await sharp(logoBuffer).resize(192, 192).png().toBuffer();
    const pngApple = await sharp(logoBuffer).resize(180, 180).png().toBuffer();

    // Write PNG files
    fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
    console.log('✔ Generated public/favicon-16x16.png');

    fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
    console.log('✔ Generated public/favicon-32x32.png');

    fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), png48);
    console.log('✔ Generated public/favicon-48x48.png');

    fs.writeFileSync(path.join(publicDir, 'favicon-96x96.png'), png96);
    console.log('✔ Generated public/favicon-96x96.png');

    fs.writeFileSync(path.join(publicDir, 'favicon-192x192.png'), png192);
    console.log('✔ Generated public/favicon-192x192.png');

    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
    console.log('✔ Generated public/apple-touch-icon.png');

    // Generate and write favicon.ico
    const icoBuffer = createIco([
      { width: 16, height: 16, buffer: png16 },
      { width: 32, height: 32, buffer: png32 },
      { width: 48, height: 48, buffer: png48 }
    ]);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('✔ Generated public/favicon.ico');

  } catch (err) {
    console.error('Failed to generate favicons:', err);
  }
}

async function generateOgImage() {
  try {
    const ogImageSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF2A85" />
            <stop offset="50%" stop-color="#963BFF" />
            <stop offset="100%" stop-color="#00F0FF" />
          </linearGradient>
          <linearGradient id="cohort-text-grad" x1="200" y1="420" x2="1000" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FF2A85" />
            <stop offset="50%" stop-color="#963BFF" />
            <stop offset="100%" stop-color="#00F0FF" />
          </linearGradient>
        </defs>
        
        <!-- Midnight dark background -->
        <rect x="0" y="0" width="1200" height="630" fill="#08080C" />
        
        <!-- Background decorative glows -->
        <circle cx="200" cy="150" r="300" fill="#963BFF" opacity="0.08" filter="blur(80px)" />
        <circle cx="1000" cy="480" r="250" fill="#00F0FF" opacity="0.05" filter="blur(80px)" />

        <!-- Centered Logo squircle (scaled 7.5x, centered around x=600, y=100) -->
        <g transform="translate(480, 90) scale(7.5)">
          <rect x="2" y="2" width="28" height="28" rx="9" fill="#08080C" stroke="url(#cohort-logo-grad)" stroke-width="2" />
          <path d="M 21,11 A 7,7 0 1,0 21,21" stroke="url(#cohort-logo-grad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
          <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke="#08080C" stroke-width="1" />
          <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />
          <path d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z" fill="#FFFFFF" />
        </g>

        <!-- Brand Wordmark "Cohort." -->
        <text x="600" y="420" font-family="'Outfit', 'Plus Jakarta Sans', 'Inter', 'Arial', sans-serif" font-size="75" font-weight="900" text-anchor="middle" fill="#FFFFFF" letter-spacing="-1.5">Cohort<tspan fill="#FF2A85">.</tspan></text>
        
        <!-- Tagline / Subtitle -->
        <text x="600" y="485" font-family="'Plus Jakarta Sans', 'Outfit', 'Inter', 'Arial', sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="url(#cohort-text-grad)" letter-spacing="1">Your Campus Social Media</text>
      </svg>
    `;

    await sharp(Buffer.from(ogImageSvg))
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✔ Generated public/og-image.png');

  } catch (err) {
    console.error('Failed to generate OG image:', err);
  }
}

async function run() {
  console.log('Building SEO assets...');
  await generateFavicons();
  await generateOgImage();
  console.log('SEO assets build complete.');
}

run();
