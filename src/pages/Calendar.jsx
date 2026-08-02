import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import PremiumLock from '../components/PremiumLock';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  Timer,
  Bell,
  MapPin,
  Calendar as CalendarIcon,
  CheckSquare
} from 'lucide-react';

const EventCard = ({ title, time, location, icon, color }) => {
  const isTailwindBg = color.startsWith('bg-');
  const textColorClass = isTailwindBg ? `text-${color.replace('bg-', '')}` : '';
  const customBgStyle = isTailwindBg ? {} : { backgroundColor: `${color}20`, color: color };

  return (
    <div className="glass-card p-4 hover:border-dark-border transition-colors flex items-center gap-4">
      <div 
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isTailwindBg ? `${color}/20 ${textColorClass}` : ''}`}
        style={customBgStyle}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-text-primary mb-1 truncate">{title}</h3>
        <p className="text-[10px] text-text-secondary font-medium">{time}</p>
        <p className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5 truncate">
          <MapPin size={10} className="shrink-0" />
          {location}
        </p>
      </div>
      <button className="text-text-secondary hover:text-text-primary p-2 shrink-0">
        <Bell size={20} />
      </button>
    </div>
  );
};

export default function Calendar() {
  const { user, API } = useContext(AuthContext);

  if (!user?.isCollegeConnected) {
    return <PremiumLock moduleName="Academic Calendar" />;
  }

  const [view, setView] = useState('Month');
  
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [timetable, setTimetable] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const prevDateRef = useRef(new Date().getDate());

  const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const userTimezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Format Helper: 24h internal strings to user 12h preferences
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const formatSetting = localStorage.getItem('sos_time_format') || '12h';
    if (formatSetting === '24h') {
      return timeStr;
    }
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m} ${period}`;
  };

  const getWeekdayName = (date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[date.getDay()];
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Fetch API resources
  const loadCalendarData = useCallback(async () => {
    if (!API) return;
    try {
      const [ttRes, tasksRes, focusRes] = await Promise.all([
        API.get('/timetable'),
        API.get('/tasks'),
        API.get('/focus').catch(() => ({ data: { sessions: [] } }))
      ]);
      setTimetable(ttRes.data);
      setTasks(tasksRes.data || []);
      setFocusSessions(focusRes.data?.sessions || []);
    } catch (e) {
      console.error('Failed to fetch calendar assets:', e);
    } finally {
      setIsLoading(false);
    }
  }, [API]);

  // Load initially
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Midnight date monitor and Live dynamic clock ticking
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now);
      
      // Midnight trigger: Automatically move today indicator and fetch updates
      if (now.getDate() !== prevDateRef.current) {
        prevDateRef.current = now.getDate();
        setSelectedDate(now);
        setCurrentMonthDate(now);
        loadCalendarData();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loadCalendarData]);

  // Background refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadCalendarData();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadCalendarData]);

  // Sync on app visibility focus and returning online
  useEffect(() => {
    const handleFocus = () => loadCalendarData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadCalendarData();
    };
    const handleOnline = () => loadCalendarData();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadCalendarData]);

  // Aggregate dynamically mapped MongoDB events
  const getEventsForDate = useCallback((d) => {
    const list = [];
    
    // 1. Classes Today
    if (timetable && timetable.slots) {
      const dayName = getWeekdayName(d);
      const todaySlots = timetable.slots.filter(s => s.day === dayName);
      todaySlots.forEach(slot => {
        list.push({
          type: 'class',
          title: slot.subject,
          time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
          location: slot.room || 'Room TBA',
          icon: <BookOpen size={20} />,
          color: slot.color || '#8b5cf6'
        });
      });
    }

    // 2. Tasks / Assignments / Exams
    const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), d));
    dayTasks.forEach(task => {
      const isExam = /exam|test|quiz/i.test(task.category || '') || /exam|test|quiz/i.test(task.title || '');
      const isAssignment = /assignment/i.test(task.category || '') || /assignment/i.test(task.title || '');
      
      list.push({
        type: isExam ? 'exam' : isAssignment ? 'assignment' : 'task',
        title: task.title,
        time: task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day',
        location: task.category || 'General',
        icon: isExam ? <GraduationCap size={20} /> : isAssignment ? <Bell size={20} /> : <CheckSquare size={20} />,
        color: isExam ? 'bg-orange-500' : isAssignment ? 'bg-blue-500' : 'bg-success'
      });
    });

    // 3. Focus study sessions
    const dayFocus = focusSessions.filter(fs => fs.createdAt && isSameDay(new Date(fs.createdAt), d));
    dayFocus.forEach(session => {
      list.push({
        type: 'focus',
        title: `Focus Session: ${session.mode || 'Study'}`,
        time: `${session.actualMin || session.durationMin} mins completed`,
        location: session.subject || 'Focus Mode',
        icon: <Timer size={20} />,
        color: 'bg-indigo-500'
      });
    });

    return list;
  }, [timetable, tasks, focusSessions]);

  // Construct Calendar cell matrix
  const getCalendarCells = () => {
    const calendarCells = [];
    const firstDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
    const startDayIndex = firstDay.getDay();
    const totalDays = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    const prevTotalDays = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 0).getDate();

    // Prev overlapping days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dateVal = prevTotalDays - i;
      const cellDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, dateVal);
      const events = getEventsForDate(cellDate);
      calendarCells.push({
        date: dateVal,
        fullDate: cellDate,
        currentMonth: false,
        isToday: false,
        hasEvent1: events.some(e => e.type === 'class'),
        hasEvent2: events.some(e => e.type !== 'class')
      });
    }

    // Current month days
    const today = new Date();
    for (let date = 1; date <= totalDays; date++) {
      const cellDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), date);
      const isToday = isSameDay(cellDate, today);
      const events = getEventsForDate(cellDate);
      calendarCells.push({
        date,
        fullDate: cellDate,
        currentMonth: true,
        isToday,
        hasEvent1: events.some(e => e.type === 'class'),
        hasEvent2: events.some(e => e.type !== 'class')
      });
    }

    // Next overlapping days
    const remaining = 42 - calendarCells.length;
    for (let date = 1; date <= remaining; date++) {
      const cellDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, date);
      const events = getEventsForDate(cellDate);
      calendarCells.push({
        date,
        fullDate: cellDate,
        currentMonth: false,
        isToday: false,
        hasEvent1: events.some(e => e.type === 'class'),
        hasEvent2: events.some(e => e.type !== 'class')
      });
    }

    return calendarCells;
  };

  const calendarCells = getCalendarCells();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getMonthYearString = (date, timezone) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: timezone
      }).format(date);
    } catch (e) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  const getSelectedDayAgendaTitle = (date, timezone) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone
      }).format(date);
    } catch (e) {
      return date.toDateString();
    }
  };

  const selectedEvents = getEventsForDate(selectedDate);

  // Agenda View Month events list
  const getMonthAgendaEvents = () => {
    const list = [];
    const totalDays = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d);
      const dayEvents = getEventsForDate(dateObj);
      dayEvents.forEach(e => {
        list.push({ ...e, date: dateObj });
      });
    }
    return list;
  };

  const monthAgendaList = getMonthAgendaEvents();

  // Week View dates list (7 days of selected date week)
  const getWeekRangeDays = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Sunday
    
    const range = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      range.push(d);
    }
    return range;
  };

  const weekDays = getWeekRangeDays();

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors text-text-secondary">
          <CalendarIcon size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="text-text-secondary hover:text-text-primary p-2">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold w-48 text-center">{getMonthYearString(currentMonthDate, userTimezone)}</h1>
          <button onClick={handleNextMonth} className="text-text-secondary hover:text-text-primary p-2">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <button 
          onClick={async () => {
            const tid = toast.loading('Syncing Calendar...');
            await loadCalendarData();
            toast.success('Calendar Synchronized!', { id: tid });
          }}
          className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors text-text-secondary"
          title="Refresh Calendar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1 1 21.306 9h-5.306" />
          </svg>
        </button>
      </div>

      {/* View Select Mode Tabs */}
      <div className="flex bg-dark-surface border border-dark-border rounded-xl p-1 mb-6">
        {['Day', 'Week', 'Month', 'Agenda'].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              view === tab
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Views Rendering */}
      {view === 'Month' && (
        <>
          {/* Calendar Grid Container */}
          <div className="glass-card p-4 md:p-6 mb-8">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] md:text-xs font-bold text-text-secondary uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Date Cells */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {calendarCells.map((dayObj, index) => {
                const isSelected = isSameDay(dayObj.fullDate, selectedDate);
                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDate(dayObj.fullDate);
                      setCurrentMonthDate(dayObj.fullDate);
                    }}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl relative cursor-pointer transition-colors ${
                      dayObj.isToday
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : isSelected
                        ? 'bg-dark-surface border border-primary/50 text-text-primary'
                        : dayObj.currentMonth
                        ? 'hover:bg-dark-surface text-text-primary'
                        : 'text-text-secondary/30'
                    }`}
                  >
                    <span className={`text-sm md:text-base ${dayObj.isToday ? 'font-bold' : 'font-medium'}`}>
                      {dayObj.date}
                    </span>
                    <div className="absolute bottom-1 md:bottom-2 flex gap-1">
                      {dayObj.hasEvent1 && (
                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${dayObj.isToday ? 'bg-white' : 'bg-blue-400'}`} />
                      )}
                      {dayObj.hasEvent2 && (
                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${dayObj.isToday ? 'bg-white/70' : 'bg-emerald-400'}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
              {getSelectedDayAgendaTitle(selectedDate, userTimezone)}
            </h2>
          </div>

          {/* Events List */}
          <div className="space-y-4 mb-8">
            {isLoading ? (
              <div className="text-center py-6 text-xs text-text-secondary font-bold">
                Syncing agenda events...
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-text-secondary bg-dark-surface/30 border border-dark-border/40 rounded-2xl">
                No events scheduled for this day! 🌴
              </div>
            ) : (
              selectedEvents.map((evt, idx) => (
                <EventCard
                  key={idx}
                  title={evt.title}
                  time={evt.time}
                  location={evt.location}
                  icon={evt.icon}
                  color={evt.color}
                />
              ))
            )}
          </div>
        </>
      )}

      {view === 'Day' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {getSelectedDayAgendaTitle(selectedDate, userTimezone)}
            </h2>
          </div>
          <div className="space-y-4">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-12 text-xs font-bold text-text-secondary bg-dark-surface/30 border border-dark-border/40 rounded-2xl">
                No events scheduled for today. Take a break! ☕
              </div>
            ) : (
              selectedEvents.map((evt, idx) => (
                <EventCard
                  key={idx}
                  title={evt.title}
                  time={evt.time}
                  location={evt.location}
                  icon={evt.icon}
                  color={evt.color}
                />
              ))
            )}
          </div>
        </div>
      )}

      {view === 'Week' && (
        <div className="space-y-6">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const count = getEventsForDate(day).length;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 rounded-2xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-white shadow-lg'
                      : isToday
                      ? 'bg-dark-surface border-primary/50 text-text-primary'
                      : 'bg-dark-surface border-dark-border hover:border-dark-border/80'
                  }`}
                >
                  <p className="text-[10px] font-bold text-text-secondary mb-1">
                    {getWeekdayName(day).substring(0, 3).toUpperCase()}
                  </p>
                  <p className="text-sm font-extrabold">
                    {day.getDate()}
                  </p>
                  {count > 0 && (
                    <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center mt-2 ${isSelected ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest pb-1.5 border-b border-white/5">
              Agenda for {getSelectedDayAgendaTitle(selectedDate, userTimezone)}
            </h3>
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-text-secondary bg-dark-surface/30 border border-dark-border/40 rounded-2xl">
                No events.
              </div>
            ) : (
              selectedEvents.map((evt, idx) => (
                <EventCard
                  key={idx}
                  title={evt.title}
                  time={evt.time}
                  location={evt.location}
                  icon={evt.icon}
                  color={evt.color}
                />
              ))
            )}
          </div>
        </div>
      )}

      {view === 'Agenda' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {getMonthYearString(currentMonthDate, userTimezone)} Monthly Agenda
            </h2>
          </div>
          <div className="space-y-4">
            {monthAgendaList.length === 0 ? (
              <div className="text-center py-12 text-xs font-bold text-text-secondary bg-dark-surface/30 border border-dark-border/40 rounded-2xl">
                No monthly events found.
              </div>
            ) : (
              monthAgendaList.map((evt, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest pl-1">
                    {getSelectedDayAgendaTitle(evt.date, userTimezone)}
                  </p>
                  <EventCard
                    title={evt.title}
                    time={evt.time}
                    location={evt.location}
                    icon={evt.icon}
                    color={evt.color}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
