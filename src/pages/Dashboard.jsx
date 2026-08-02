import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  ChevronRight,
  Flame,
  Lock,
  MessageSquare,
  Play,
  Plus,
  Zap,
  Users,
  CheckSquare,
  GraduationCap,
  Calendar,
  Timer,
  Phone,
  Activity,
  ChartNoAxesColumn,
  BookOpen
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { NotificationContext } from '../context/NotificationContext';

// Helper to determine the appropriate greeting and icon based on the current hour
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Good Morning', emoji: '🌅' };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'Good Afternoon', emoji: '☀️' };
  } else if (hour >= 17 && hour < 22) {
    return { text: 'Good Evening', emoji: '🌇' };
  } else {
    return { text: 'Good Night', emoji: '🌙' };
  }
};

// Helper to extract the first name from the user's full name
const getFirstName = (fullName = '') => {
  return fullName.split(' ')[0] || 'Student';
};

// Helper to format time string to AM/PM or 24-hour format
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const formatSetting = localStorage.getItem('sos_time_format') || '12h';

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let [_, hr, min, ampm] = match;
    ampm = ampm.toUpperCase();
    if (formatSetting === '24h') {
      let h = parseInt(hr, 10);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${min}`;
    }
    return `${hr.padStart(2, '0')}:${min} ${ampm}`;
  }

  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1].substring(0, 2);
  if (isNaN(hour)) return timeStr;

  if (formatSetting === '24h') {
    return `${hour.toString().padStart(2, '0')}:${min}`;
  } else {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour.toString().padStart(2, '0')}:${min} ${ampm}`;
  }
};

// Circular Progress Bar Component for Attendance
const CircularProgress = ({ value, color, size = 96, stroke = 10 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(value, 100)) / 100;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-dark-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
};

// Skeleton loading component
const Skeleton = ({ className }) => (
  <div className={`bg-dark-surface/60 rounded-xl animate-pulse ${className}`} />
);

// Quick Action Shortcut Button Component
const QuickActionButton = ({ icon, label, path, color }) => (
  <Link to={path} className="flex flex-col items-center gap-2 group cursor-pointer">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
      {icon}
    </div>
    <span className="text-[11px] text-text-secondary font-medium group-hover:text-text-primary transition-colors text-center leading-tight">
      {label}
    </span>
  </Link>
);

// Stat Card component for Overview stats (Classes Today, Tasks Pending, etc.)
const StatCard = ({ icon, value, label, iconBg, iconColor, sublabel, valueColor, path }) => (
  <Link to={path} className="glass-card p-4 hover:border-dark-border/80 transition-all hover:scale-[1.02] flex flex-col justify-between cursor-pointer">
    <div>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3 ${iconColor}`}>
        {icon}
      </div>
      <p className={`text-2xl font-extrabold ${valueColor || ''}`}>
        {value}
      </p>
      <p className="text-xs font-semibold text-text-primary mt-0.5">
        {label}
      </p>
    </div>
    {sublabel && (
      <p className="text-[10px] text-text-secondary mt-2">
        {sublabel}
      </p>
    )}
  </Link>
);

// Individual Class/Schedule item inside Today's Schedule card
const ScheduleItem = ({ time, subject, room, color, status }) => (
  <div className="flex gap-3 items-start group">
    <div className="w-14 flex-shrink-0 pt-0.5">
      <p className="text-[10px] font-semibold text-text-secondary text-right">
        {time}
      </p>
    </div>
    <div className="relative flex-shrink-0 mt-1">
      <div
        className={`w-2.5 h-2.5 rounded-full ring-4 ring-dark-bg ${color.startsWith('bg-') ? color : ''}`}
        style={color.startsWith('bg-') ? {} : { backgroundColor: color }}
      />
    </div>
    <div className="flex-1 bg-dark-surface/50 rounded-xl p-3 border border-transparent group-hover:border-dark-border transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-sm">{subject}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{room}</p>
        </div>
        {status && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
            status === 'ONGOING'
              ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
              : 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  </div>
);

// Individual Task item component
const TaskItem = ({ title, priority, isDone }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-surface/50 transition-colors cursor-pointer group">
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
      isDone ? 'bg-emerald-500 border-emerald-500' : 'border-dark-border group-hover:border-primary'
    }`}>
      {isDone && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      )}
    </div>
    <p className={`flex-1 text-sm truncate ${isDone ? 'text-text-secondary line-through' : 'font-medium'}`}>
      {title}
    </p>
    {!isDone && (
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
        priority === 'High'
          ? 'text-red-400 bg-red-400/10'
          : priority === 'Medium'
            ? 'text-orange-400 bg-orange-400/10'
            : 'text-blue-400 bg-blue-400/10'
      }`}>
        {priority}
      </span>
    )}
  </div>
);

// Attendance Sub-Metric card
const AttendanceMetric = ({ label, value, color }) => (
  <div className="bg-dark-surface/50 border border-dark-border rounded-xl p-2.5 text-center">
    <p className={`font-bold text-sm ${color}`}>{value}</p>
    <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
  </div>
);

// Log activity row inside Recent Activity Center
const ActivityCenterRow = ({ icon, color, label, detail, time }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium">
        {label}
        {' '}
        <span className="text-text-secondary font-normal">— {detail}</span>
      </p>
    </div>
    <span className="text-[10px] text-text-secondary flex-shrink-0">{time}</span>
  </div>
);

export default function Dashboard() {
  const { user, fetchDashboard, API } = useContext(AuthContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [timetableData, setTimetableData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [notesCount, setNotesCount] = useState(0);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userTimezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const getGreetingInTimezone = (date, timezone) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone
      });
      const hour = parseInt(formatter.format(date), 10);
      if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '🌅' };
      if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
      if (hour >= 17 && hour < 22) return { text: 'Good Evening', emoji: '🌇' };
      return { text: 'Good Night', emoji: '🌙' };
    } catch (e) {
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '🌅' };
      if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
      if (hour >= 17 && hour < 22) return { text: 'Good Evening', emoji: '🌇' };
      return { text: 'Good Night', emoji: '🌙' };
    }
  };

  const { text: greetingText, emoji: greetingEmoji } = getGreetingInTimezone(currentDateTime, userTimezone);

  const getFormattedDateString = (date, timezone) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      }).format(date);
    } catch (e) {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  const getFormattedTimeString = (date, timezone) => {
    try {
      const formatSetting = localStorage.getItem('sos_time_format') || '12h';
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: formatSetting === '12h',
        timeZone: timezone
      }).format(date);
    } catch (e) {
      return date.toLocaleTimeString();
    }
  };

  const { socket } = useContext(SocketContext);
  const { notifications, unreadCount, markRead, markAllRead } = useContext(NotificationContext);
  const activeNotifications = notifications ? notifications.filter((n) => !n.isRead) : [];

  const handleNotificationClick = async (notif) => {
    try {
      await markRead(notif._id);
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
    if (notif.type === 'message') {
      navigate('/community', { state: { activeTab: 'messages', conversationId: notif.relatedId } });
    } else if (notif.type === 'follow' || notif.type === 'friend_request') {
      navigate('/community', { state: { activeTab: 'friends' } });
    } else if (notif.type === 'comment' || notif.type === 'like') {
      navigate('/community', { state: { activeTab: 'feed', postId: notif.relatedId } });
    } else if (notif.type === 'assignment') {
      navigate('/study-materials');
    } else if (notif.type === 'attendance') {
      navigate('/attendance');
    } else if (notif.type === 'class') {
      navigate('/timetable');
    } else {
      navigate('/');
    }
  };

  // Fallback initial data logs and recent list states
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'message',
      content: 'Rahul sent you a message',
      time: 'Just now',
      icon: '💬',
      color: 'bg-purple-500/10 text-purple-400',
    },
    {
      id: 2,
      type: 'call',
      content: 'Missed call from Priya Sharma',
      time: '10m ago',
      icon: '📞',
      color: 'bg-red-500/10 text-red-400',
    },
    {
      id: 3,
      type: 'group',
      content: 'ECE 2nd Year Group shared a PDF',
      time: '1h ago',
      icon: '👥',
      color: 'bg-blue-500/10 text-blue-400',
    },
    {
      id: 4,
      type: 'notes',
      content: 'DBMS Notes uploaded by Vikram',
      time: '3h ago',
      icon: '📚',
      color: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      id: 5,
      type: 'friend',
      content: 'New Friend Request received',
      time: '4h ago',
      icon: '🤝',
      color: 'bg-indigo-500/10 text-indigo-400',
    },
  ]);

  const [conversations, setConversations] = useState([
    {
      id: 'chat_1',
      name: 'Rahul',
      lastMsg: 'Bro send DBMS notes',
      time: '5m ago',
      avatar: null,
      unread: 1,
    },
    {
      id: 'chat_2',
      name: 'Priya Sharma',
      lastMsg: 'Tomorrow exam aa?',
      time: '15m ago',
      avatar: null,
      unread: 0,
    },
    {
      id: 'chat_3',
      name: 'ECE Group',
      lastMsg: 'Lab Manual Uploaded',
      time: '1h ago',
      avatar: null,
      unread: 2,
    },
  ]);

  const [calls, setCalls] = useState([]);

  const [feedItems, setFeedItems] = useState([
    {
      id: 'h_1',
      author: 'Rahul',
      text: 'uploaded Notes',
      tag: 'Study Resource',
      time: '10m ago',
    },
    {
      id: 'h_2',
      author: 'Priya',
      text: 'created a new Group',
      tag: 'New Channel',
      time: '1h ago',
    },
    {
      id: 'h_3',
      author: 'Vikram',
      text: 'posted Project Showcase',
      tag: 'Project',
      time: '3h ago',
    },
  ]);

  const loadAllDashboardData = useCallback(async () => {
    if (!user || !API) return;

    // 1. Try to load cached data first for instant start (sub-100ms)
    try {
      const cachedDash = JSON.parse(localStorage.getItem('sos_cached_dash'));
      const cachedTT = JSON.parse(localStorage.getItem('sos_cached_tt'));
      const cachedAtt = JSON.parse(localStorage.getItem('sos_cached_att'));
      const cachedNotesCount = parseInt(localStorage.getItem('sos_cached_notes_count'), 10) || 0;
      
      if (cachedDash) setDashboardData(cachedDash);
      if (cachedTT) setTimetableData(cachedTT);
      if (cachedAtt) setSubjects(cachedAtt);
      setNotesCount(cachedNotesCount);
      
      // If we have cached dashboard, disable loading screen immediately!
      if (cachedDash) {
        setIsLoading(false);
      }
    } catch (e) {
      console.warn('Failed to load cached dashboard data:', e);
    }

    if (!navigator.onLine) return; // Stop if offline

    // 2. Fetch fresh data in the background (non-blocking)
    (async () => {
      try {
        const dashResult = await fetchDashboard();
        if (dashResult.ok) {
          setDashboardData(dashResult.data);
          localStorage.setItem('sos_cached_dash', JSON.stringify(dashResult.data));
        }
        
        const { data: timetable } = await API.get('/timetable');
        setTimetableData(timetable);
        localStorage.setItem('sos_cached_tt', JSON.stringify(timetable));
        
        const { data: subjectsData } = await API.get('/attendance');
        setSubjects(subjectsData || []);
        localStorage.setItem('sos_cached_att', JSON.stringify(subjectsData || []));

        const { data: notesData } = await API.get('/notes');
        setNotesCount(notesData ? notesData.length : 0);
        localStorage.setItem('sos_cached_notes_count', String(notesData ? notesData.length : 0));

        const { data: friendsData } = await API.get('/community/friends');
        if (friendsData && friendsData.friends) {
          const mappedFriends = friendsData.friends
            .slice(0, 3)
            .map((friend) => ({
              id: friend._id,
              name: friend.fullName,
              lastMsg: friend.isOnline
                ? 'Online - Start chatting secure'
                : 'Click to send secure messages',
              time: friend.isOnline ? 'Online' : 'Offline',
              avatar: friend.avatar,
              unread: 0,
            }));
          if (mappedFriends.length > 0) {
            setConversations((prev) => {
              const existingIds = mappedFriends.map((f) => f.id);
              const remaining = prev.filter((c) => !existingIds.includes(c.id));
              return [...mappedFriends, ...remaining].slice(0, 4);
            });
          }
        }

        const { data: callsData } = await API.get('/community/calls');
        if (callsData && callsData.length > 0) {
          setCalls(
            callsData
              .slice(0, 3)
              .map((call) => {
                const isOutgoing = call.caller && call.caller._id === user._id;
                const peer = isOutgoing ? call.receiver : call.caller;
                const type = call.status === 'missed' 
                  ? 'missed' 
                  : isOutgoing 
                    ? 'outgoing' 
                    : 'incoming';
                
                return {
                  id: call._id,
                  name: peer ? peer.fullName : 'Student Peer',
                  avatar: peer ? peer.avatar : '',
                  type,
                  time: call.startedAt 
                    ? new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'
                };
              })
          );
        } else {
          setCalls([]);
        }
      } catch (error) {
        console.error('Error fetching fresh dashboard data:', error);
      } finally {
        setIsLoading(false); // Disable loading screen if cache was empty
      }
    })();
  }, [user, API, fetchDashboard]);

  // Handle live updates via websockets
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      const senderName = msg.sender?.fullName || 'Someone';
      const senderId = msg.sender?._id || 'unknown';

      setConversations((prev) => {
        const remaining = prev.filter((c) => c.name !== senderName);
        return [
          {
            id: msg.isGroup ? msg.recipient : senderId,
            name: msg.isGroup ? 'ECE Group' : senderName,
            lastMsg: msg.content,
            time: 'Just now',
            avatar: null,
            unread: 1,
          },
          ...remaining,
        ].slice(0, 4);
      });

      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'message',
          content: `${senderName} sent you a message: "${msg.content}"`,
          time: 'Just now',
          icon: '💬',
          color: 'bg-purple-500/10 text-purple-400',
        },
        ...prev.slice(0, 5),
      ]);
    };

    const handleCallNotification = (call) => {
      setCalls((prev) => [
        {
          id: Date.now(),
          name: call.callerName || 'Priya Sharma',
          type: 'incoming',
          time: 'Just now',
        },
        ...prev.slice(0, 3),
      ]);

      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'call',
          content: `Incoming call from ${call.callerName || 'Priya Sharma'}`,
          time: 'Just now',
          icon: '📞',
          color: 'bg-red-500/10 text-red-400',
        },
        ...prev.slice(0, 5),
      ]);
    };

    const handleAttendanceUpdated = async () => {
      try {
        const dashResult = await fetchDashboard();
        if (dashResult.ok) setDashboardData(dashResult.data);
        const { data: subjectsData } = await API.get('/attendance');
        setSubjects(subjectsData || []);
      } catch (err) {
        console.error('Failed to sync attendance on socket event:', err);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('call_notification', handleCallNotification);
    socket.on('attendance_updated', handleAttendanceUpdated);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('call_notification', handleCallNotification);
      socket.off('attendance_updated', handleAttendanceUpdated);
    };
  }, [socket, fetchDashboard, API]);

  // Load backend data for dashboard initially and bind to window focus event for real-time auto-updates
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      await loadAllDashboardData();
      if (isMounted) {
        setIsLoading(false);
      }
    })();

    const handleFocus = () => {
      loadAllDashboardData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAllDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadAllDashboardData]);

  // Background refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllDashboardData();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAllDashboardData]);

  // Sync on online status return
  useEffect(() => {
    const handleOnline = () => {
      loadAllDashboardData();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadAllDashboardData]);

  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClassesCount = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
  const overallAttendancePct = totalClassesCount > 0 ? Math.round((totalAttended / totalClassesCount) * 100) : 0;
  const totalCanBunk = subjects.reduce((sum, s) => sum + s.canBunk, 0);

  const stats = {
    attendancePercent: subjects.length > 0 ? overallAttendancePct : 0,
    tasksPending: dashboardData?.stats?.tasksPending ?? 0,
    tasksCompleted: dashboardData?.stats?.tasksCompleted ?? 0,
    classesToday: dashboardData?.stats?.classesToday ?? 0,
    examsNear: dashboardData?.stats?.examsNear ?? 0,
    studyStreak: dashboardData?.stats?.studyStreak ?? user?.studyStreak ?? 0,
    focusMinutesToday: dashboardData?.stats?.focusMinutesToday ?? 0,
    totalFocusMinutes: dashboardData?.stats?.totalFocusMinutes ?? user?.totalFocusMinutes ?? 0,
  };

  const firstName = getFirstName(user?.fullName);
  const safeToMissClasses = subjects.length > 0 ? totalCanBunk : 0;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDayName = dayNames[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let [_, hr, min, ampm] = match;
      let h = parseInt(hr, 10);
      const m = parseInt(min, 10);
      ampm = ampm.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const todayClasses =
    timetableData?.slots
      ?.filter((slot) => slot.day === currentDayName)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)) ?? [];

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let ongoingClassIndex = -1;
  let nextClassIndex = -1;

  todayClasses.forEach((slot, index) => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      ongoingClassIndex = index;
    }
  });

  nextClassIndex = todayClasses.findIndex((slot) => {
    return timeToMinutes(slot.startTime) > currentMinutes;
  });

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 space-y-6 max-w-5xl mx-auto">
      {/* Header section with Dynamic Daily Summary Card */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Row: Greeting & Streak / Bell */}
          <div className="flex justify-between items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 animate-fade-in">
                <span>{greetingEmoji}</span>
                <span>{greetingText},</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 font-extrabold">
                  {firstName}
                </span>
              </h1>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5 font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>📅 {getFormattedDateString(currentDateTime, userTimezone)}</span>
                <span className="text-purple-400 font-extrabold">🕒 {getFormattedTimeString(currentDateTime, userTimezone)}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  const tid = toast.loading('Refreshing dashboard...');
                  await loadAllDashboardData();
                  toast.success('Dashboard synchronized!', { id: tid });
                }}
                className="glass-card w-9 h-9 flex items-center justify-center hover:border-primary/40 transition-colors"
                title="Refresh Dashboard"
              >
                <svg className="w-4 h-4 text-text-secondary hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1 1 21.306 9h-5.306" />
                </svg>
              </button>
              <div className="glass-card px-3 py-1.5 flex items-center gap-2">
                <Flame className="text-orange-500 flex-shrink-0" size={16} />
                <div className="text-right">
                  <p className="text-[8px] text-text-secondary leading-none">Streak</p>
                  <p className="font-extrabold text-xs leading-none mt-0.5">{stats.studyStreak}d</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/notifications')}
                className="glass-card w-9 h-9 flex items-center justify-center relative hover:border-primary/40 transition-colors"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-dark-bg animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Warning banner for manually registered/unconnected students */}
          {!user?.isCollegeConnected && (
            <div className="glass-card p-4 border border-red-500/25 bg-gradient-to-r from-red-950/20 via-dark-surface to-dark-surface/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg hover:shadow-red-500/5 transition-all duration-300">
              <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-11 h-11 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center text-red-400">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Academic Features Locked</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed max-w-lg">
                    Your account is not linked to your college's official Student Registry. Please connect your official roll number in Settings to unlock your timetable, attendance tracker, and study materials.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="h-8 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <span>Link College Account</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Premium Dynamic Daily Summary Card */}
          <div className="glass-card p-5 border border-purple-500/20 bg-gradient-to-br from-purple-950/10 via-dark-surface to-dark-surface/50 rounded-2xl relative overflow-hidden shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 w-44 h-44 rounded-full bg-purple-500/5 blur-2xl group-hover:scale-125 transition-transform duration-500" />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 divide-y md:divide-y-0 lg:divide-x lg:divide-y-0 divide-white/5">
              {/* Stat 1: Classes Today */}
              <Link to="/timetable" className="flex flex-col justify-between pt-3 md:pt-0 lg:pl-3 first:pl-0 first:pt-0 hover:opacity-85 transition-all hover:scale-[1.02] cursor-pointer">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <span>📚</span> Classes Today
                </span>
                <span className="text-xs font-black text-white mt-1.5">
                  {todayClasses.length > 0 ? (
                    `${todayClasses.length} Scheduled`
                  ) : (
                    <span className="text-text-secondary font-medium">🎉 No classes today</span>
                  )}
                </span>
              </Link>

              {/* Stat 2: Tasks Pending */}
              <Link to="/tasks" className="flex flex-col justify-between pt-3 md:pt-0 lg:pl-4 first:pt-0 hover:opacity-85 transition-all hover:scale-[1.02] cursor-pointer">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <span>✅</span> Tasks Pending
                </span>
                <span className="text-xs font-black text-white mt-1.5">
                  {stats.tasksPending > 0 ? (
                    `${stats.tasksPending} Pending`
                  ) : (
                    <span className="text-emerald-400 font-bold">✅ All tasks done</span>
                  )}
                </span>
              </Link>

              {/* Stat 3: Attendance */}
              <Link to="/attendance" className="flex flex-col justify-between pt-3 md:pt-0 lg:pl-4 hover:opacity-85 transition-all hover:scale-[1.02] cursor-pointer">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <span>🎯</span> Attendance
                </span>
                <span className="text-xs font-black text-white mt-1.5">
                  {subjects.length > 0 ? (
                    <span className={stats.attendancePercent >= 75 ? 'text-emerald-400' : 'text-orange-400'}>
                      {stats.attendancePercent}%
                    </span>
                  ) : (
                    <span className="text-text-secondary font-medium">Add attendance</span>
                  )}
                </span>
              </Link>

              {/* Stat 4: Notes to Review */}
              <Link to="/notes" className="flex flex-col justify-between pt-3 md:pt-0 lg:pl-4 hover:opacity-85 transition-all hover:scale-[1.02] cursor-pointer">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <span>📖</span> Notes to Review
                </span>
                <span className="text-xs font-black text-white mt-1.5">
                  {notesCount > 0 ? (
                    `${notesCount} Notes`
                  ) : (
                    <span className="text-text-secondary font-medium">No notes today</span>
                  )}
                </span>
              </Link>

              {/* Stat 5: Next Class */}
              <Link to="/timetable" className="flex flex-col justify-between pt-3 md:pt-0 lg:pl-4 col-span-2 lg:col-span-1 hover:opacity-85 transition-all hover:scale-[1.02] cursor-pointer">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <span>⏰</span> Next Class
                </span>
                <span className="text-xs font-black text-white truncate mt-1.5">
                  {nextClassIndex !== -1 && todayClasses[nextClassIndex] ? (
                    `${todayClasses[nextClassIndex].subject} (${formatTime(todayClasses[nextClassIndex].startTime)})`
                  ) : (
                    <span className="text-text-secondary font-medium">🎉 Schedule done</span>
                  )}
                </span>
              </Link>

              {/* Stat 6: Study Streak */}
              <Link to="/focus" className="flex flex-col justify-between pt-3 md:pt-0 lg:pl-4 hover:opacity-85 transition-all hover:scale-[1.02] cursor-pointer">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <span>🔥</span> Study Streak
                </span>
                <span className="text-xs font-black text-white mt-1.5">
                  {stats.studyStreak > 0 ? (
                    `${stats.studyStreak} Days`
                  ) : (
                    <span className="text-text-secondary font-medium">Start today</span>
                  )}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Notifier Block (Notifications or Today's Schedule & Activity) */}
      {activeNotifications.length > 0 ? (
        <div className="glass-card p-5 border border-purple-500/25 bg-purple-950/5 relative overflow-hidden space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="text-purple-400 animate-bounce animate-duration-1000" size={18} />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Unread Alerts ({activeNotifications.length})</h2>
            </div>
            <button
              onClick={() => markAllRead()}
              className="text-[9px] font-black text-purple-300 uppercase tracking-widest hover:underline cursor-pointer"
            >
              Mark All Read
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {activeNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-purple-500/20 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">
                    {notif.type === 'message' ? '💬' :
                     notif.type === 'like' ? '❤️' :
                     notif.type === 'comment' ? '💬' :
                     notif.type === 'friend_request' ? '👥' :
                     notif.type === 'missed_call' ? '📞' : '🔔'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{notif.title}</p>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">{notif.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[8px] text-text-secondary font-bold">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => markRead(notif._id)}
                    className="w-5 h-5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 flex items-center justify-center text-[9px] text-text-secondary hover:text-emerald-400 transition-all cursor-pointer"
                    title="Dismiss"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Today's Subjects Card (3/5 columns) */}
          <div className="md:col-span-3 glass-card p-5 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <span>📅 Today's Subjects</span>
                </h2>
                <span className="text-[9px] font-mono text-purple-400 uppercase font-black">{currentDayName} Schedule</span>
              </div>

              {todayClasses.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-secondary font-bold bg-white/5 border border-white/5 rounded-2xl">
                  No classes scheduled for today! 🎉
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayClasses.map((slot, index) => {
                    const isOngoing = index === ongoingClassIndex;
                    const isNext = index === nextClassIndex;
                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-2xl flex items-center justify-between transition-all ${
                          isOngoing 
                            ? 'border-purple-500/50 bg-purple-500/10' 
                            : isNext
                              ? 'border-indigo-500/35 bg-indigo-500/5'
                              : 'border-white/5 bg-white/5'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{slot.subject}</p>
                          <p className="text-[9px] text-text-secondary mt-0.5 truncate">
                            {slot.faculty ? `Prof. ${slot.faculty}` : 'Faculty TBA'} • {slot.room ? `Room ${slot.room}` : 'Room TBA'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold text-text-secondary">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                          {isOngoing && (
                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-purple-600 text-white animate-pulse">CURRENT</span>
                          )}
                          {isNext && (
                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white">NEXT</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Today's Activity Card (2/5 columns) */}
          <div className="md:col-span-2 glass-card p-5 border border-white/5 space-y-3">
            <h2 className="font-extrabold text-xs text-white uppercase tracking-wider">🎯 Today's Activity</h2>
            
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-text-secondary">
              <div className="bg-white/5 border border-white/5 rounded-xl p-2">
                <p className="text-xs font-black text-white">{stats.tasksCompleted}</p>
                <p className="text-[8px] mt-0.5 uppercase tracking-wide">Tasks Completed</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2">
                <p className="text-xs font-black text-white">{stats.tasksPending}</p>
                <p className="text-[8px] mt-0.5 uppercase tracking-wide">Pending Tasks</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2">
                <p className="text-xs font-black text-emerald-400">{stats.attendancePercent}%</p>
                <p className="text-[8px] mt-0.5 uppercase tracking-wide">Attendance Today</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2">
                <p className="text-xs font-black text-purple-400">
                  {Math.floor(stats.focusMinutesToday / 60)}h {stats.focusMinutesToday % 60}m
                </p>
                <p className="text-[8px] mt-0.5 uppercase tracking-wide">Study Hours</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] uppercase tracking-wide">Goal Progress</span>
                  <span className="text-xs font-black text-blue-400">
                    {Math.min(Math.round((stats.focusMinutesToday / 120) * 100), 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" 
                    style={{ width: `${Math.min((stats.focusMinutesToday / 120) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, idx) => <Skeleton key={idx} className="h-28" />)
        ) : (
          <>
            <StatCard
              icon={<BookOpen size={22} />}
              value={stats.classesToday}
              label="Classes Today"
              iconBg="bg-blue-500/15"
              iconColor="text-blue-400"
              sublabel="Today's schedule"
              path="/timetable"
            />
            <StatCard
              icon={<CheckSquare size={22} />}
              value={stats.tasksPending}
              label="Tasks Pending"
              iconBg="bg-purple-500/15"
              iconColor="text-purple-400"
              sublabel={`${stats.tasksCompleted} completed`}
              path="/tasks"
            />
            <StatCard
              icon={<GraduationCap size={22} />}
              value={`${stats.attendancePercent}%`}
              label="Attendance"
              iconBg="bg-emerald-500/15"
              iconColor="text-emerald-400"
              sublabel={`${safeToMissClasses} more can miss`}
              valueColor="text-emerald-400"
              path="/attendance"
            />
            <StatCard
              icon={<Calendar size={22} />}
              value={stats.examsNear}
              label="Exams Near"
              iconBg="bg-orange-500/15"
              iconColor="text-orange-400"
              sublabel="Upcoming exams"
              path="/tasks"
            />
          </>
        )}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-base">Quick Actions</h2>
          <span className="text-[10px] text-text-secondary">Shortcuts</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <QuickActionButton
            icon={<Plus size={22} className="text-white" />}
            label="Add Task"
            path="/tasks"
            color="bg-gradient-to-br from-primary to-primary/80"
          />
          <QuickActionButton
            icon={<Timer size={22} className="text-white" />}
            label="Focus Timer"
            path="/focus"
            color="bg-gradient-to-br from-secondary to-secondary/80"
          />
          <QuickActionButton
            icon={<BookOpen size={22} className="text-white" />}
            label="New Note"
            path="/notes"
            color="bg-gradient-to-br from-emerald-600 to-emerald-500"
          />
          <QuickActionButton
            icon={<ChartNoAxesColumn size={22} className="text-white" />}
            label="Attendance"
            path="/attendance"
            color="bg-gradient-to-br from-orange-600 to-orange-500"
          />
          <QuickActionButton
            icon={<Users size={22} className="text-white" />}
            label="Community"
            path="/community"
            color="bg-gradient-to-br from-purple-600 to-purple-500"
          />
        </div>
      </div>

      {/* Main Multi-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left Side: Schedule and Feed Preview (3/5 Columns) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Today's Schedule Card */}
          <div className="glass-card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base">Today's Schedule</h2>
              <Link
                to="/timetable"
                className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, idx) => <Skeleton key={idx} className="h-16" />)}
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-text-secondary bg-dark-surface/30 border border-dark-border/40 rounded-2xl">
                No classes scheduled for today! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((slot, index) => {
                  const status =
                    index === ongoingClassIndex
                      ? 'ONGOING'
                      : index === nextClassIndex
                        ? 'UP NEXT'
                        : null;
                  return (
                    <ScheduleItem
                      key={index}
                      time={formatTime(slot.startTime)}
                      subject={slot.subject}
                      room={slot.room || 'Room TBA'}
                      color={slot.color || '#3b82f6'}
                      status={status}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Community banner shortcut */}
          <Link
            to="/community"
            className="block bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-purple-900/5 border border-purple-500/25 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-purple-500/10 group-hover:scale-125 transition-transform duration-500 blur-xl" />
            </div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Users className="text-purple-400" size={16} />
                  </div>
                  <h3 className="font-bold text-sm">Student Community Ecosystem</h3>
                  <span className="text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="text-text-secondary text-xs">
                  Collaborate with peers, share notes, find study groups, and chat.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/40 group-hover:scale-105 transition-transform">
                <ChevronRight className="text-white" size={20} />
              </div>
            </div>
          </Link>

          {/* Recent DMs / Group chats preview */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-purple-400" size={16} />
                <h3 className="font-bold text-sm text-white">Latest Conversations</h3>
              </div>
              <span
                onClick={() => navigate('/community')}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                Open Messenger
              </span>
            </div>
            <div className="space-y-2.5">
              {conversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate('/community')}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-purple-500/20 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                      {chat.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">
                        @{chat.name.toLowerCase()}
                      </p>
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">
                        {chat.lastMsg}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <span className="text-[8px] text-text-secondary">{chat.time}</span>
                    {chat.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[8px] font-black flex items-center justify-center animate-pulse">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call Logs Preview */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Phone className="text-emerald-400" size={16} />
                <h3 className="font-bold text-sm text-white">Call Activity Preview</h3>
              </div>
              <span
                onClick={() => navigate('/community')}
                className="text-[10px] text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Calls Screen
              </span>
            </div>
            {calls.length === 0 ? (
              <div className="text-center py-6 text-xs font-bold text-text-secondary bg-white/5 border border-white/5 rounded-2xl">
                No recent calls.
              </div>
            ) : (
              <div className="space-y-2.5">
                {calls.map((call, idx) => (
                  <div
                    key={call.id || idx}
                    onClick={() => navigate('/community')}
                    className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl hover:border-emerald-500/25 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {call.avatar ? (
                        <img src={call.avatar} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                      ) : (
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          call.type === 'missed'
                            ? 'bg-red-500/10 text-red-400'
                            : call.type === 'incoming'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          <Phone size={11} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-white">{call.name}</p>
                        <p className="text-[9px] text-text-secondary capitalize mt-0.5">
                          {call.type} call
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] text-text-secondary font-bold">{call.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Attendance Breakdown, Tasks, Focus Goal & Live Feed (2/5 Columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Overall Attendance Card */}
          {subjects.length === 0 ? (
            <div className="glass-card p-5 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-4">
                <h2 className="font-bold text-base">Attendance</h2>
                <Link to="/attendance" className="text-primary text-xs font-semibold hover:underline">
                  Details
                </Link>
              </div>
              <div className="text-center py-8 px-4 text-xs font-bold text-text-secondary bg-white/5 border border-white/5 rounded-2xl w-full">
                Add your timetable to start tracking attendance.
              </div>
            </div>
          ) : totalClassesCount === 0 ? (
            <div className="glass-card p-5 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-4">
                <h2 className="font-bold text-base">Attendance</h2>
                <Link to="/attendance" className="text-primary text-xs font-semibold hover:underline">
                  Details
                </Link>
              </div>
              
              <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                <CircularProgress
                  value={0}
                  color="var(--color-success)"
                  size={112}
                  stroke={12}
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-extrabold">0%</span>
                  <span className="text-[10px] text-text-secondary">Overall</span>
                </div>
              </div>

              <div className="text-center py-4 px-4 text-xs font-bold text-text-secondary bg-white/5 border border-white/5 rounded-2xl w-full mb-4">
                No attendance records available.
              </div>

              <div className="w-full space-y-2.5">
                {subjects.map((s) => (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className="text-[11px] text-text-secondary truncate w-24 flex-shrink-0">
                      {s.name}
                    </span>
                    <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `0%`,
                          backgroundColor: s.color,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold w-8 text-right flex-shrink-0">
                      0%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-5 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-4">
                <h2 className="font-bold text-base">Attendance</h2>
                <Link to="/attendance" className="text-primary text-xs font-semibold hover:underline">
                  Details
                </Link>
              </div>

              <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                <CircularProgress
                  value={overallAttendancePct}
                  color="var(--color-success)"
                  size={112}
                  stroke={12}
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-extrabold">{overallAttendancePct}%</span>
                  <span className="text-[10px] text-text-secondary">Overall</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-1">
                <AttendanceMetric
                  label="Safe to miss"
                  value={`${totalCanBunk} classes`}
                  color="text-success"
                />
                <AttendanceMetric
                  label="Required"
                  value="75% min"
                  color="text-text-secondary"
                />
              </div>

              {/* Individual Subject Progress Indicators */}
              <div className="w-full mt-4 space-y-2.5">
                {subjects.map((s) => (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className="text-[11px] text-text-secondary truncate w-24 flex-shrink-0">
                      {s.name}
                    </span>
                    <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.attendancePct}%`,
                          backgroundColor: s.color,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold w-8 text-right flex-shrink-0">
                      {s.attendancePct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Tasks Card */}
          <div className="glass-card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base">Tasks</h2>
              <Link
                to="/tasks"
                className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, idx) => <Skeleton key={idx} className="h-12" />)}
              </div>
            ) : (
              <div className="space-y-2">
                <TaskItem title="DSA Assignment 4" priority="High" isDone={false} />
                <TaskItem title="Maths Quiz Revision" priority="Medium" isDone={true} />
                <TaskItem title="Read Chapter 5" priority="Low" isDone={false} />
                <TaskItem title="Lab Report — CN" priority="High" isDone={false} />
              </div>
            )}
            <button
              onClick={() => navigate('/tasks')}
              className="w-full mt-4 py-2.5 border border-dashed border-dark-border rounded-xl text-xs text-text-secondary font-medium flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus size={14} /> Add new task
            </button>
          </div>

          {/* Focus Timer Overview */}
          <div className="glass-card p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h2 className="font-bold text-base">Focus Today</h2>
              </div>
              <Link to="/focus" className="text-primary text-xs font-semibold hover:underline">
                Start
              </Link>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold">
                  {stats.focusMinutesToday}
                  <span className="text-base font-medium text-text-secondary ml-1">min</span>
                </p>
                <p className="text-xs text-text-secondary mt-1">Focus sessions today</p>
              </div>
              <Link
                to="/focus"
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
              >
                <Play size={18} className="text-white ml-0.5" />
              </Link>
            </div>
            <div className="mt-4 h-1.5 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{
                  width: `${Math.min((stats.focusMinutesToday / 120) * 100, 100)}%`,
                  transition: 'width 1s ease',
                }}
              />
            </div>
            <p className="text-[10px] text-text-secondary mt-1.5">Goal: 120 min/day</p>
          </div>

          {/* Community Live Feed updates list */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="text-purple-400" size={16} />
                <h3 className="font-bold text-sm text-white">Community Live Feed</h3>
              </div>
              <span
                onClick={() => navigate('/community')}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                View Feed
              </span>
            </div>
            <div className="space-y-3">
              {feedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-purple-300 uppercase bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                    <span className="text-[8px] text-text-secondary font-bold">{item.time}</span>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    <span className="font-black text-purple-400">
                      @{item.author.toLowerCase()}
                    </span>
                    {' '}
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Center Card */}
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-base">Recent Activity Center</h2>
          <span className="text-[10px] text-text-secondary">Real-time module logs</span>
        </div>
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCenterRow
              key={activity.id}
              icon={<span className="text-sm shrink-0">{activity.icon}</span>}
              color={activity.color}
              label={activity.content}
              detail={activity.type === 'call' ? 'SOS Call Log' : 'Live Sync'}
              time={activity.time}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
