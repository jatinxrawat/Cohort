import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Helper to download files to Buffer (handles HTTPS redirects)
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchBuffer(res.headers.location).then(resolve).catch(reject);
          return;
        }
        reject(new Error(`Failed to fetch font: ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function generateBanner() {
  console.log('Downloading official fonts from Google Fonts repository...');
  
  // Clean raw links to Variable font files from Google Fonts GitHub
  const outfitUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf';
  const jakartaUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf';
  
  let outfitBase64 = '';
  let jakartaBase64 = '';
  
  try {
    const outfitBuffer = await fetchBuffer(outfitUrl);
    outfitBase64 = outfitBuffer.toString('base64');
    console.log('Successfully downloaded Outfit variable font.');
  } catch (err) {
    console.error('Failed to download Outfit variable font, will use system fallback fonts.', err);
  }
  
  try {
    const jakartaBuffer = await fetchBuffer(jakartaUrl);
    jakartaBase64 = jakartaBuffer.toString('base64');
    console.log('Successfully downloaded Plus Jakarta Sans variable font.');
  } catch (err) {
    console.error('Failed to download Plus Jakarta Sans variable font, will use system fallback fonts.', err);
  }

  // Canvas details (2048 x 1152 pixels)
  const svgWidth = 2048;
  const svgHeight = 1152;
  
  // Custom Stylesheet with inlined Base64 font faces
  const fontStyle = `
    <style>
      ${outfitBase64 ? `
      @font-face {
        font-family: 'OutfitLocal';
        src: url('data:font/truetype;charset=utf-8;base64,${outfitBase64}') format('truetype');
        font-weight: 100 900;
        font-style: normal;
      }
      ` : ''}
      ${jakartaBase64 ? `
      @font-face {
        font-family: 'JakartaLocal';
        src: url('data:font/truetype;charset=utf-8;base64,${jakartaBase64}') format('truetype');
        font-weight: 100 800;
        font-style: normal;
      }
      ` : ''}
      
      .brand-text {
        font-family: 'OutfitLocal', 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: 140px;
        font-weight: 900;
        fill: #ffffff;
        text-anchor: middle;
        letter-spacing: -2px;
      }
      .dot-text {
        fill: #FF2A85;
      }
      .sub-text {
        font-family: 'JakartaLocal', 'Plus Jakarta Sans', 'Inter', sans-serif;
        font-size: 32px;
        font-weight: 700;
        fill: #A3A3A3;
        text-anchor: middle;
        letter-spacing: 12px;
        text-transform: uppercase;
      }
    </style>
  `;
  
  const bannerSvg = `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${fontStyle}
        <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2A85" />
          <stop offset="50%" stop-color="#963BFF" />
          <stop offset="100%" stop-color="#00F0FF" />
        </linearGradient>
        
        <!-- Standard SVG filters for soft background atmospheric glows -->
        <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="150" />
        </filter>
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="150" />
        </filter>
        <filter id="glow-pink" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="120" />
        </filter>
      </defs>
      
      <!-- Solid dark midnight-slate background -->
      <rect width="${svgWidth}" height="${svgHeight}" fill="#08080C" />
      
      <!-- Ambient background decorations -->
      <!-- Violet glow top-left -->
      <circle cx="200" cy="200" r="500" fill="#963BFF" opacity="0.15" filter="url(#glow-violet)" />
      <!-- Cyan glow bottom-right -->
      <circle cx="1848" cy="952" r="500" fill="#00F0FF" opacity="0.1" filter="url(#glow-cyan)" />
      <!-- Soft magenta center backdrop backing the logo -->
      <circle cx="1024" cy="500" r="350" fill="#FF2A85" opacity="0.08" filter="url(#glow-pink)" />

      <!-- Centered Logo Icon (Exactly matching public/logo.svg contents) -->
      <!-- Scale 9 translates the 32x32 box to 288x288 pixels. Centered at x=880 (1024 - 144) and y=220 -->
      <g transform="translate(880, 220) scale(9)">
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
      </g>
      
      <!-- Brand Text: Cohort. -->
      <text x="1024" y="650" class="brand-text">Cohort<tspan class="dot-text">.</tspan></text>
      
      <!-- Subtitle: Official Channel -->
      <text x="1030" y="730" class="sub-text">Official Channel</text>
    </svg>
  `;
  
  const destPath = path.join(projectRoot, 'public', 'cohort_youtube_banner.png');
  
  console.log('Rendering 2048x1152 banner to file via Sharp...');
  await sharp(Buffer.from(bannerSvg))
    .png()
    .toFile(destPath);
    
  console.log('Success! Banner saved to ' + destPath);
}

generateBanner().catch(console.error);
