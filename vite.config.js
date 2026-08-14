import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Load environment variables from .env file into process.env for local development api middleware
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
process.env.SMTP_HOST = env.SMTP_HOST || process.env.SMTP_HOST;
process.env.SMTP_PORT = env.SMTP_PORT || process.env.SMTP_PORT;
process.env.SMTP_USER = env.SMTP_USER || process.env.SMTP_USER;
process.env.SMTP_PASS = env.SMTP_PASS || process.env.SMTP_PASS;

// Global cache to prevent re-reading/re-parsing the 10MB colleges JSON on every search request
let localCollegesCache = null;

const POPULAR_COLLEGES = [
  { name: 'Delhi University', university: 'Delhi University', state: 'Delhi', district: 'Delhi', location: 'Delhi' },
  { name: 'IIT Bombay', university: 'Indian Institute of Technology, Bombay', state: 'Maharashtra', district: 'Mumbai', location: 'Mumbai, Maharashtra' },
  { name: 'IIT Delhi', university: 'Indian Institute of Technology, Delhi', state: 'Delhi', district: 'Delhi', location: 'Delhi' },
  { name: 'BITS Pilani', university: 'Birla Institute of Technology and Science', state: 'Rajasthan', district: 'Jhunjhunu', location: 'Pilani, Rajasthan' },
  { name: 'Christ University', university: 'Christ University', state: 'Karnataka', district: 'Bangalore', location: 'Bangalore, Karnataka' },
  { name: 'VIT Vellore', university: 'VIT Vellore', state: 'Tamil Nadu', district: 'Vellore', location: 'Vellore, Tamil Nadu' },
  { name: 'Manipal Academy of Higher Education', university: 'MAHE', state: 'Karnataka', district: 'Udupi', location: 'Manipal, Karnataka' },
  { name: 'Ashoka University', university: 'Ashoka University', state: 'Haryana', district: 'Sonipat', location: 'Sonipat, Haryana' },
  { name: 'SRM Institute of Science and Technology', university: 'SRM University', state: 'Tamil Nadu', district: 'Chennai', location: 'Chennai, Tamil Nadu' },
  { name: 'Delhi School of Economics', university: 'Delhi University', state: 'Delhi', district: 'Delhi', location: 'Delhi' }
];

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const urlObj = new URL(req.url, 'http://localhost');
          
          if (urlObj.pathname.startsWith('/api/search-colleges')) {
            const q = urlObj.searchParams.get('q') || '';
            res.setHeader('Content-Type', 'application/json');

            if (!q || q.trim().length < 2) {
              res.end(JSON.stringify(POPULAR_COLLEGES));
              return;
            }

            try {
              if (!localCollegesCache) {
                console.log('[Dev Middleware] Loading api/colleges.json...');
                const collegesPath = path.resolve(__dirname, './api/colleges.json');
                localCollegesCache = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));
                console.log('[Dev Middleware] colleges.json cached successfully. Count:', localCollegesCache.length);
              }

              const cleanQuery = q.trim().toLowerCase();
              const results = [];
              const cleanIdRegex = /\s*\(Id:\s*[^)]+\)/gi;

              for (let i = 0; i < localCollegesCache.length; i++) {
                const item = localCollegesCache[i];
                const collegeNameRaw = item.college || '';
                const universityNameRaw = item.university || '';

                const collegeName = collegeNameRaw.replace(cleanIdRegex, '').trim();
                const universityName = universityNameRaw.replace(cleanIdRegex, '').trim();

                const state = item.state || '';
                const district = item.district || '';

                if (
                  collegeName.toLowerCase().includes(cleanQuery) ||
                  universityName.toLowerCase().includes(cleanQuery) ||
                  state.toLowerCase().includes(cleanQuery) ||
                  district.toLowerCase().includes(cleanQuery)
                ) {
                  results.push({
                    name: collegeName,
                    university: universityName,
                    state,
                    district,
                    location: district ? `${district}, ${state}` : state
                  });

                  if (results.length >= 50) {
                    break;
                  }
                }
              }

              res.end(JSON.stringify(results));
            } catch (err) {
              console.error('[Dev Middleware] Error in search-colleges middleware:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          if (urlObj.pathname.startsWith('/api/send-otp')) {
            console.log('[Dev Middleware] Intercepted /api/send-otp request');
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                console.log('[Dev Middleware] Request body received:', body);
                const { email, otp } = JSON.parse(body || '{}');

                if (!email || !otp) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Email and OTP are required' }));
                  return;
                }

                let transporter;
                let usingEthereal = false;
                let etherealUrl = null;

                const host = process.env.SMTP_HOST;
                const port = process.env.SMTP_PORT || 587;
                const user = process.env.SMTP_USER;
                const pass = process.env.SMTP_PASS;

                if (host && user && pass) {
                  transporter = nodemailer.createTransport({
                    host,
                    port: parseInt(port),
                    secure: parseInt(port) === 465,
                    auth: { user, pass }
                  });
                } else {
                  usingEthereal = true;
                  try {
                    const testAccount = await nodemailer.createTestAccount();
                    transporter = nodemailer.createTransport({
                      host: 'smtp.ethereal.email',
                      port: 587,
                      secure: false,
                      auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                      }
                    });
                  } catch (ethErr) {
                    console.error('[Dev Middleware] Ethereal config fail, logging OTP:', otp);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, mocked: true, otp }));
                    return;
                  }
                }

                const mailOptions = {
                  from: `"Cohort Campus" <${user || 'no-reply@cohortnow.online'}>`,
                  to: email.trim(),
                  subject: 'Verify Your Email for Cohort',
                  html: `
                    <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #08080C; color: #F5F5F7; padding: 40px 20px; text-align: center;">
                      <div style="max-w: 500px; margin: 0 auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px;">
                        <h2 style="font-size: 20px; font-weight: 800; color: #FFFFFF;">Email Verification</h2>
                        <p style="font-size: 14px; color: #A1A1AA;">Verify your email with the verification code below:</p>
                        <div style="background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%); padding: 16px; border-radius: 16px; display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #FFFFFF; margin: 24px 0;">
                          ${otp}
                        </div>
                      </div>
                    </div>
                  `
                };

                const info = await transporter.sendMail(mailOptions);

                if (usingEthereal) {
                  etherealUrl = nodemailer.getTestMessageUrl(info);
                  console.log(`[OTP Sent to Ethereal] View test email: ${etherealUrl}`);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  previewUrl: etherealUrl,
                  otp: usingEthereal ? otp : undefined
                }));

                console.log('[Dev Middleware] sendOtpHandler completed successfully');
              } catch (err) {
                console.error('[Dev Middleware] Error in send-otp handler:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to process request: ' + err.message }));
              }
            });
            return;
          }

          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui': ['lucide-react', 'framer-motion'],
        },
      },
    },
  },
});
