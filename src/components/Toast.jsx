import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

const Toast = ({ notification }) => {
  const { removeNotification } = useNotification();
  
  const iconMap = {
    success: { Icon: CheckCircle, color: 'text-success' },
    error: { Icon: AlertCircle, color: 'text-danger' },
    warning: { Icon: AlertTriangle, color: 'text-warning' },
    info: { Icon: Info, color: 'text-info' },
  };

  const { Icon, color } = iconMap[notification.type] || iconMap.info;

  return (
    <div className="glass border-l-4 border-primary-500 p-lg flex items-start gap-md animate-slide-up">
      <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-xs`} />
      <p className="text-sm font-medium flex-1">{notification.message}</p>
      <button
        onClick={() => removeNotification(notification.id)}
        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ notifications }) => {
  return (
    <div className="fixed bottom-lg right-lg z-50 flex flex-col gap-md max-w-sm">
      {notifications.map(notification => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
