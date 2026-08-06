/**
 * Uploads an image to Cloudinary using signed upload.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export async function uploadImageToCloudinary(file) {
  const cloudName = 'p6cec4mr';
  const apiKey = '111857136275992';
  const apiSecret = 'ebK99ZxdBtm68zHUyBMhlcefP8s';

  const timestamp = Math.round(Date.now() / 1000);
  
  // Sort parameters alphabetically: timestamp is the only parameter being signed here
  const signatureString = `timestamp=${timestamp}${apiSecret}`;
  
  // Generate SHA-1 signature
  const signature = await sha1(signatureString);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Computes a SHA-1 hash of a string in a browser context.
 * @param {string} string
 * @returns {Promise<string>} Hex representation of the hash.
 */
async function sha1(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
