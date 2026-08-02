import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

export const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw Error(`useNotifications must be used inside NotificationProvider`);
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, API } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user || !API) return;
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch (e) {
      console.error('[NotificationContext] load error:', e);
    }
  }, [user, API]);

  useEffect(() => {
    if (user && API) {
      loadNotifications();
    }
  }, [user, API, loadNotifications]);

  // Listen for socket notification events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play audio notification
      let soundPrefKey = 'pref_message_sound';
      if (
        notification.type === 'friend_request' ||
        notification.type === 'friend_accepted'
      ) {
        soundPrefKey = 'pref_friend_sound';
      } else if (
        notification.type === 'group_message' ||
        notification.type === 'group_invite'
      ) {
        soundPrefKey = 'pref_group_sound';
      }

      const soundEnabled = localStorage.getItem(soundPrefKey) !== 'false';
      if (soundEnabled) {
        try {
          new Audio('/notification.mp3').play();
        } catch {}
      }
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const markRead = async (id) => {
    if (!API) return;
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    if (!API) return;
    try {
      await API.put(`/notifications/read-all`);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const deleteNotification = async (id) => {
    if (!API) return;
    const target = notifications.find((notif) => notif._id === id);
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const clearAll = async () => {
    if (!API) return;
    try {
      await API.delete(`/notifications/clear-all`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
