import React from 'react';

export const Card = ({ children, className = '', variant = 'default', clickable = false, ...props }) => {
  const variants = {
    default: 'card',
    glass: 'glass',
    flat: 'bg-neutral-50 dark:bg-neutral-900 rounded-xl p-lg',
  };

  return (
    <div
      className={`${variants[variant]} ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
