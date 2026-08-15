export default async function handler(req, res) {
  try {
    const { storyId, id, title, desc, img } = req.query || {};

    let targetStoryId = storyId || id;
    if (!targetStoryId && req.url) {
      const match = req.url.match(/\/uncut\/([^/?#]+)/);
      if (match) targetStoryId = match[1];
    }

    const STORIES_MAP = {
      'college-love': {
        title: 'College, Love Stories and the Dilemma | Cohort Uncut',
        desc: 'Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you. Written by Sanya Sahani.',
        image: 'https://cohortnow.online/og-image.png',
        path: '/uncut/college-love'
      },
      '3am-coffee-club': {
        title: 'The 3 AM Coffee Club: A Love Letter to Late-Night Study Rooms | Cohort Uncut',
        desc: 'You know the feeling. It\'s 2:47 AM, the campus is dead silent, but Room 402 in the library is humming with life. A soft buzz of laptops, the rhythmic clicking of keyboards, and the quiet hiss of the coffee machine...',
        image: 'https://cohortnow.online/og-image.png',
        path: '/uncut/3am-coffee-club'
      },
      'introvert-guide': {
        title: 'Why We Seek the Quiet: The Reluctant Introvert\'s Guide to Campus Life | Cohort Uncut',
        desc: 'From orientation week icebreakers to crowded hostel mess halls, college is an extrovert\'s playground. But for the 40% of us who recharge in silence, it can feel like a marathon with no finish line...',
        image: 'https://cohortnow.online/og-image.png',
        path: '/uncut/introvert-guide'
      },
      'unwritten-rules': {
        title: 'The Unwritten Hallway Rules We All Silently Agree To | Cohort Uncut',
        desc: 'Every university has a student handbook, but the real rules are never written down. They are the unspoken social contracts we learn by trial and error...',
        image: 'https://cohortnow.online/og-image.png',
        path: '/uncut/unwritten-rules'
      }
    };

    const storyData = STORIES_MAP[targetStoryId] || {};

    const rawTitle = title ? decodeURIComponent(title) : (storyData.title || 'Cohort Uncut Story');
    const rawDesc = desc ? decodeURIComponent(desc) : (storyData.desc || 'Real campus stories, written by peers on Cohort Uncut.');
    const rawImage = img ? decodeURIComponent(img) : (storyData.image || 'https://cohortnow.online/og-image.png');

    const escapeHtml = (str) =>
      (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safeTitle = escapeHtml(rawTitle);
    const safeDesc = escapeHtml(rawDesc);
    const safeImage = escapeHtml(rawImage);
    const canonicalUrl = `https://cohortnow.online/uncut/${targetStoryId || ''}`;
    const redirectUrl = storyData.path || `/uncut/${targetStoryId || ''}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">

  <!-- Open Graph / WhatsApp / Facebook Link Previews -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Cohort Uncut">

  <!-- Twitter / Instagram Link Previews -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">

  <!-- Instant Browser Redirect to React Uncut Story Route -->
  <script>
    if (!navigator.userAgent.includes("WhatsApp") && !navigator.userAgent.includes("facebookexternalhit") && !navigator.userAgent.includes("Twitterbot")) {
      window.location.replace("${redirectUrl}");
    }
  </script>
</head>
<body>
  <p>Redirecting to story on Cohort Uncut... <a href="${redirectUrl}">Click here if not redirected.</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (globalErr) {
    console.error('API Uncut OG Error:', globalErr);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html><html><head><script>window.location.replace("/uncut");</script></head><body><a href="/uncut">Go to Uncut</a></body></html>`);
  }
}
