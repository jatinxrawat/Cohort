import React from 'react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-200 dark:hover:bg-neutral-700',
    ghost: 'text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950',
    danger: 'bg-danger text-white hover:bg-red-600 active:bg-red-700',
    success: 'bg-success text-white hover:bg-emerald-600 active:bg-emerald-700',
  };

  const sizes = {
    sm: 'px-md py-xs text-sm',
    md: 'px-lg py-md text-base',
    lg: 'px-2xl py-lg text-lg',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
