import React, { useState } from 'react';

/**
 * Robust UserAvatar component with automatic error fallback to crisp UI-Avatars initials
 */
export const UserAvatar = ({
  src,
  name = 'Student',
  className = 'w-8 h-8 rounded-full',
  alt
}) => {
  const [hasError, setHasError] = useState(false);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=0ea5e9&color=fff&bold=true&size=128`;

  // Check if src is invalid or a broken dicebear URL
  const isValidSrc = src && typeof src === 'string' && src.trim().length > 0 && !src.includes('dicebear.com');
  const imageSrc = !hasError && isValidSrc ? src : fallbackUrl;

  return (
    <img
      src={imageSrc}
      alt={alt || name || 'User avatar'}
      className={`object-cover rounded-full flex-shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={(e) => {
        if (!hasError) {
          setHasError(true);
          e.currentTarget.src = fallbackUrl;
        }
      }}
    />
  );
};

export default UserAvatar;
