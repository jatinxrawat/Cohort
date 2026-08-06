import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md w-full',
    md: 'max-w-xl w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-3xl w-full',
    '2xl': 'max-w-4xl w-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md md:p-xl overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Dialog Card */}
      <div className={`relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl shadow-2xl ${sizes[size]} z-10 transition-all my-auto`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-xl py-lg md:px-2xl border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-lg md:text-xl font-heading font-bold text-neutral-900 dark:text-white flex items-center gap-xs">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-xs rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-xl md:p-2xl max-h-[82vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
