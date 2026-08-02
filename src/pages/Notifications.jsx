import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  MessageSquare,
  Trash2,
  TriangleAlert,
  CheckCheck,
  Info,
  PhoneMissed,
  Phone,
  Users,
  BookOpen,
  FileText,
  Clock,
  Trophy,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';

const NOTIFICATION_TYPES = {
  friend_request: {
    icon: <UserPlus size={16} />,
    color: 'bg-violet-500/15 text-violet-400',
    border: 'border-violet-500/20',
    label: 'Friend Requests',
  },
  friend_accepted: {
    icon: <UserCheck size={16} />,
    color: 'bg-green-500/15 text-green-400',
    border: 'border-green-500/20',
    label: 'Friends',
  },
  message: {
    icon: <MessageSquare size={16} />,
    color: 'bg-blue-500/15 text-blue-400',
    border: 'border-blue-500/20',
    label: 'Messages',
  },
  missed_call: {
    icon: <PhoneMissed size={16} />,
    color: 'bg-red-500/15 text-red-400',
    border: 'border-red-500/20',
    label: 'Calls',
  },
  call: {
    icon: <Phone size={16} />,
    color: 'bg-green-500/15 text-green-400',
    border: 'border-green-500/20',
    label: 'Calls',
  },
  group_invite: {
    icon: <Users size={16} />,
    color: 'bg-orange-500/15 text-orange-400',
    border: 'border-orange-500/20',
    label: 'Groups',
  },
  group_message: {
    icon: <Users size={16} />,
    color: 'bg-orange-500/15 text-orange-400',
    border: 'border-orange-500/20',
    label: 'Groups',
  },
  shared_note: {
    icon: <BookOpen size={16} />,
    color: 'bg-teal-500/15 text-teal-400',
    border: 'border-teal-500/20',
    label: 'Shared Notes',
  },
  shared_pdf: {
    icon: <FileText size={16} />,
    color: 'bg-yellow-500/15 text-yellow-400',
    border: 'border-yellow-500/20',
    label: 'Shared PDFs',
  },
  reminder: {
    icon: <Clock size={16} />,
    color: 'bg-blue-500/15 text-blue-400',
    border: 'border-blue-500/20',
    label: 'Reminders',
  },
  system: {
    icon: <Info size={16} />,
    color: 'bg-primary/15 text-primary',
    border: 'border-primary/20',
    label: 'System',
  },
  achievement: {
    icon: <Trophy size={16} />,
    color: 'bg-yellow-500/15 text-yellow-400',
    border: 'border-yellow-500/20',
    label: 'Achievements',
  },
  alert: {
    icon: <TriangleAlert size={16} />,
    color: 'bg-red-500/15 text-red-400',
    border: 'border-red-500/20',
    label: 'Alerts',
  },
};

const FILTERS = [
  'All',
  'Unread',
  'friend_request',
  'message',
  'missed_call',
  'group_invite',
  'shared_note',
  'reminder',
  'alert',
];

const FILTER_LABELS = {
  All: 'All',
  Unread: 'Unread',
  friend_request: '👤 Requests',
  message: '💬 Messages',
  missed_call: '📵 Missed Calls',
  group_invite: '👥 Groups',
  shared_note: '📖 Notes',
  reminder: '⏰ Reminders',
  alert: '🚨 Alerts',
};

const formatTimeAgo = (dateString) => {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
  } = useContext(NotificationContext);

  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => markAllRead(), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !notification.isRead;
    return notification.type === filter;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-colors"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:underline transition-colors"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === f
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'bg-dark-surface text-text-secondary border-dark-border hover:text-text-primary'
            }`}
          >
            {FILTER_LABELS[f] || f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bell size={28} className="text-primary" />
          </div>
          <p className="font-bold">All caught up!</p>
          <p className="text-text-secondary text-sm">No notifications to show</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
              return (
                <motion.div
                  key={notification._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`glass-card p-4 flex gap-4 transition-all cursor-pointer hover:border-dark-border/80 ${
                    notification.isRead ? '' : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {notification.senderAvatar ? (
                      <img
                        src={notification.senderAvatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeConfig.color} ${typeConfig.border}`}>
                        {typeConfig.icon}
                      </div>
                    )}
                    
                    {notification.senderAvatar && typeConfig.icon && (
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-dark-bg ${typeConfig.color}`}>
                        <span className="scale-75">
                          {typeConfig.icon}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`font-bold text-sm ${notification.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] text-text-secondary flex-shrink-0">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="text-text-secondary hover:text-red-400 p-1 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
