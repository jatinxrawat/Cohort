export default async function handler(req, res) {
  try {
    const { postId, id, img, title, desc } = req.query || {};

    // Extract postId from URL parameter or route rewrite
    let targetPostId = postId || id;
    if (!targetPostId && req.url) {
      const match = req.url.match(/\/post\/([^/?#]+)/);
      if (match) targetPostId = match[1];
    }

    let postTitle = title ? decodeURIComponent(title) : 'Cohort Uncut - Campus Story';
    let postContent = desc ? decodeURIComponent(desc) : 'Read unfiltered real campus stories written by peers on Cohort Uncut.';
    let postImage = img ? decodeURIComponent(img) : 'https://cohortnow.online/og-image.png';

    // Fetch fresh post metadata from Firestore REST API if targetPostId exists
    if (targetPostId && targetPostId !== 'undefined' && targetPostId !== 'null') {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/collex-73ee4/databases/(default)/documents/posts/${targetPostId}`;
        const response = await fetch(firestoreUrl);

        if (response.ok) {
          const docData = await response.json();
          const fields = docData.fields || {};

          // Extract Author Name / Title
          const authorObj = fields.author?.mapValue?.fields || {};
          const authorName = authorObj.name?.stringValue || fields.authorName?.stringValue || 'Campus Student';
          if (!title) {
            postTitle = authorName.toLowerCase().startsWith('post by') ? authorName : `Post by ${authorName}`;
          }

          // Extract Post Content / Caption
          const rawContent = fields.content?.stringValue || fields.text?.stringValue || fields.caption?.stringValue || '';
          if (rawContent && !desc) {
            postContent = rawContent.slice(0, 200) + (rawContent.length > 200 ? '...' : '');
          }

          // Extract Real Post Photo / Image URL
          const mediaUrl =
            fields.image?.stringValue ||
            fields.imageUrl?.stringValue ||
            fields.mediaUrl?.stringValue ||
            fields.photo?.stringValue ||
            fields.media?.stringValue ||
            fields.coverImage?.stringValue ||
            authorObj.avatar?.stringValue;

          if (mediaUrl && !img) {
            postImage = mediaUrl;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Firestore post metadata in API:', err);
      }
    }

    const escapeHtml = (str) =>
      (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safeTitle = escapeHtml(postTitle);
    const safeDesc = escapeHtml(postContent);
    const safeImage = escapeHtml(postImage);
    const canonicalUrl = `https://cohortnow.online/post/${targetPostId || ''}`;
    const redirectUrl = `/home?post=${targetPostId || ''}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle} | Cohort</title>
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
  <meta property="og:site_name" content="Cohort">

  <!-- Twitter / Instagram Link Previews -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">

  <!-- Instant Browser Redirect to React Single Post Route -->
  <script>
    window.location.replace("${redirectUrl}");
  </script>
</head>
<body>
  <p>Redirecting to post on Cohort... <a href="${redirectUrl}">Click here if not redirected.</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (globalErr) {
    console.error('API Post OG Error:', globalErr);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html><html><head><script>window.location.replace("/home");</script></head><body><a href="/home">Go to Home</a></body></html>`);
  }
}
