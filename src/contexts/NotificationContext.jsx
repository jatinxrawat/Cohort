import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Toast popups disabled across all pages
  const addNotification = useCallback(() => {
    return null;
  }, []);

  const removeNotification = useCallback(() => {}, []);

  const showSuccess = useCallback(() => null, []);
  const showError = useCallback(() => null, []);
  const showWarning = useCallback(() => null, []);
  const showInfo = useCallback(() => null, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: [],
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
