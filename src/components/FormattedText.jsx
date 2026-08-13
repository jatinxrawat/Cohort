import React from 'react';
import { useNavigate } from 'react-router-dom';

export const FormattedText = ({ text, className = '' }) => {
  const navigate = useNavigate();

  if (!text) return null;

  // Split text by hashtags (#word) and mentions (@username) while preserving the tokens
  const tokens = text.split(/((?:#[a-zA-Z0-9_\u0600-\u06FF]+)|(?:@[a-zA-Z0-9_.-]+))/g);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
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
        }
        return token;
      })}
    </span>
  );
};

export default FormattedText;
