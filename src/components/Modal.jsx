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
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className={`relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl ${sizes[size]}`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-2xl border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-xl font-heading font-bold">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 focus-ring rounded-lg p-xs"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-2xl max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
