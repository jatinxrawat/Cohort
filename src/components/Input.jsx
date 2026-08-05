import React from 'react';

export const Input = React.forwardRef(({
  type = 'text',
  placeholder = '',
  value = '',
  onChange = () => {},
  disabled = false,
  className = '',
  label = '',
  error = '',
  icon: Icon = null,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-md">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-lg top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-base ${Icon ? 'pl-3xl' : ''} ${error ? 'border-danger focus:ring-danger' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger mt-xs">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
