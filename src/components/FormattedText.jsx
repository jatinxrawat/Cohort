import React from 'react';
import { useNavigate } from 'react-router-dom';

export const FormattedText = ({ text, className = '' }) => {
  const navigate = useNavigate();

  if (!text) return null;

  // Regex to match URLs, hashtags, and mentions
  const URL_HASHTAG_MENTION_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?|#[a-zA-Z0-9_\u0600-\u06FF]+|@[a-zA-Z0-9_.-]+)/g;

  const isUrl = (str) => {
    if (!str) return false;
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('www.')) return true;
    return /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/.test(str);
  };

  const tokens = text.split(URL_HASHTAG_MENTION_REGEX);

  return (
    <span className={`break-words ${className}`}>
      {tokens.map((token, idx) => {
        if (!token) return null;

        if (token.startsWith('#')) {
          return (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search?q=${encodeURIComponent(token)}`);
              }}
              className="font-bold text-sky-500 dark:text-sky-400 hover:underline cursor-pointer transition-colors px-0.5 rounded hover:bg-sky-500/10"
              title={`Search posts tagged ${token}`}
            >
              {token}
            </span>
          );
        } else if (token.startsWith('@')) {
          return (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                const username = token.slice(1);
                navigate(`/search?q=${encodeURIComponent(username)}`);
              }}
              className="font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer transition-colors px-0.5 rounded hover:bg-violet-500/10"
              title={`Find profile for ${token}`}
            >
              {token}
            </span>
          );
        } else if (isUrl(token)) {
          let cleanUrl = token;
          let trailingPunct = '';
          if (/[.,!?;:]$/.test(cleanUrl)) {
            trailingPunct = cleanUrl.slice(-1);
            cleanUrl = cleanUrl.slice(0, -1);
          }

          const href = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
            ? cleanUrl
            : `https://${cleanUrl}`;

          return (
            <React.Fragment key={idx}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-sky-500 dark:text-sky-400 hover:underline transition-colors break-all underline decoration-sky-500/40 underline-offset-2"
              >
                {cleanUrl}
              </a>
              {trailingPunct}
            </React.Fragment>
          );
        }
        return token;
      })}
    </span>
  );
};

export default FormattedText;
