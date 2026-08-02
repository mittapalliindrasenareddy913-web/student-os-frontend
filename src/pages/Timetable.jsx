import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Calendar, 
  Upload, 
  Plus, 
  List, 
  Grid3X3, 
  Trash2, 
  User, 
  MapPin, 
  X,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PremiumLock from '../components/PremiumLock';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CARD_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

const TimetableShimmer = ({ className }) => (
  <div className={`bg-dark-surface animate-pulse rounded-xl ${className}`} />
);

const FormGroup = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="glass-card w-full max-w-md p-6 md:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-extrabold text-lg">{title}</h2>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary p-1"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

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

const TimePickerInput = ({ value, onChange }) => {
  const getInitialState = () => {
    if (!value) return { hour: '09', minute: '00', ampm: 'AM' };
    const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      return { hour: match[1].padStart(2, '0'), minute: match[2].padStart(2, '0'), ampm: match[3].toUpperCase() };
    }
    const parts = value.split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parts[1] ? parts[1].substring(0, 2) : '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return {
      hour: h.toString().padStart(2, '0'),
      minute: m,
      ampm
    };
  };

  const state = getInitialState();

  const handleSelectChange = (field, val) => {
    let { hour, minute, ampm } = state;
    if (field === 'hour') hour = val;
    if (field === 'minute') minute = val;
    if (field === 'ampm') ampm = val;

    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    onChange(`${h.toString().padStart(2, '0')}:${minute}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="flex items-center gap-1 bg-dark-bg border border-dark-border rounded-xl px-2 py-1 select-none">
      <select
        value={state.hour}
        onChange={(e) => handleSelectChange('hour', e.target.value)}
        className="bg-transparent text-text-primary text-xs outline-none w-full text-center py-1 cursor-pointer appearance-none"
      >
        {hours.map(h => <option key={h} value={h} className="bg-dark-surface text-text-primary">{h}</option>)}
      </select>
      <span className="text-text-secondary text-xs font-bold">:</span>
      <select
        value={state.minute}
        onChange={(e) => handleSelectChange('minute', e.target.value)}
        className="bg-transparent text-text-primary text-xs outline-none w-full text-center py-1 cursor-pointer appearance-none"
      >
        {minutes.map(m => <option key={m} value={m} className="bg-dark-surface text-text-primary">{m}</option>)}
      </select>
      <select
        value={state.ampm}
        onChange={(e) => handleSelectChange('ampm', e.target.value)}
        className="bg-transparent text-primary text-xs font-bold outline-none w-full text-center py-1 cursor-pointer appearance-none"
      >
        <option value="AM" className="bg-dark-surface text-text-primary">AM</option>
        <option value="PM" className="bg-dark-surface text-text-primary">PM</option>
      </select>
    </div>
  );
};

const WeeklyView = ({ timetable, onDelete }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar bg-dark-surface/30 border border-dark-border rounded-xl">
      <div className="min-w-[800px] flex">
        {DAYS_OF_WEEK.map((day) => {
          const slots =
            timetable?.slots
              ?.filter((slot) => slot.day === day)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)) || [];

          return (
            <div
              key={day}
              className="flex-1 min-w-[120px] border-r border-dark-border last:border-0 flex flex-col"
            >
              <div className="text-center py-2 bg-dark-bg/50 border-b border-dark-border font-bold text-xs uppercase tracking-wider text-text-secondary">
                {day}
              </div>
              <div className="p-2 space-y-2 flex-1">
                {slots.map((slot, index) => {
                  const globalIndex = timetable.slots.findIndex(
                    (s) =>
                      s.day === slot.day &&
                      s.startTime === slot.startTime &&
                      s.subject === slot.subject
                  );

                  return (
                    <div
                      key={index}
                      className="relative group p-2 rounded-lg border border-dark-border/50 bg-dark-bg/80 hover:border-dark-border transition-colors"
                    >
                      <div
                        className="w-1 h-full absolute left-0 top-0 rounded-l-lg"
                        style={{ background: slot.color }}
                      />
                      <div className="pl-2">
                        <p className="text-[10px] font-bold text-text-secondary">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </p>
                        <p
                          className="font-bold text-xs mt-0.5 leading-tight truncate"
                          title={slot.subject}
                        >
                          {slot.subject}
                        </p>
                        {slot.room && (
                          <p className="text-[9px] text-text-secondary mt-1 flex items-center gap-1">
                            <MapPin size={8} />
                            {slot.room}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Timetable() {
  const { API, user } = useContext(AuthContext);

  if (!user?.isCollegeConnected) {
    return <PremiumLock moduleName="Timetable" />;
  }
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const getTodayName = () => {
    const dayIndex = new Date().getDay();
    return DAYS_OF_WEEK[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const todayName = getTodayName();
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [viewMode, setViewMode] = useState('daily');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [newClass, setNewClass] = useState({
    day: 'Mon',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    faculty: '',
    room: '',
    color: CARD_COLORS[0],
  });

  const fetchTimetable = async () => {
    try {
      const cachedTT = localStorage.getItem('sos_cached_tt');
      if (cachedTT) {
        setTimetable(JSON.parse(cachedTT));
        setLoading(false);
      }
    } catch (e) {
      console.warn('Failed to load cached timetable:', e);
    }

    try {
      const { data } = await API.get('/timetable');
      setTimetable(data);
      localStorage.setItem('sos_cached_tt', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    // 1. Initial fetch
    fetchTimetable();

    // 2. Silent background sync every 30 seconds
    const intervalId = setInterval(() => {
      console.log('🔄 [Background Sync] Performing 30s background timetable sync...');
      fetchTimetable();
    }, 30000);

    // 3. Foreground tab focus sync listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [Foreground Sync] App returned to foreground, re-syncing timetable...');
        fetchTimetable();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleTimetableUpdate = (data) => {
      console.log('⚡ [Socket.io] Realtime timetable update received in Student OS:', data);
      localStorage.removeItem('sos_cached_tt');
      fetchTimetable();
      toast.success('📢 Official Timetable updated by HOD!', { id: 'tt_update_toast', duration: 4000 });
    };

    socket.on('timetable_updated', handleTimetableUpdate);
    return () => {
      socket.off('timetable_updated', handleTimetableUpdate);
    };
  }, [socket]);

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await API.post('/timetable/slot', newClass);
      setIsAddModalOpen(false);
      fetchTimetable();
    } catch (error) {
      console.error('Error adding class slot:', error);
    }
  };

  const handleDeleteClass = async (index) => {
    if (confirm('Remove this class?')) {
      try {
        await API.delete(`/timetable/slot/${index}`);
        fetchTimetable();
      } catch (error) {
        console.error('Error deleting class slot:', error);
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading('Uploading and parsing timetable image...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await API.post('/timetable/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Timetable updated successfully!', {
        id: toastId,
        duration: 5000,
      });
      fetchTimetable();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg =
        error.response?.data?.message || 'Error parsing timetable image.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleCalendarSync = () => {
    alert(
      'Google Calendar Sync initialized! (Simulated). A link has been generated to subscribe to this timetable.'
    );
  };

  const selectedDaySlots =
    timetable?.slots
      ?.filter((slot) => slot.day === selectedDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)) ?? [];

  const inputClass =
    'w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-text-primary text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-secondary/40';

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Timetable</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Manage classes and sync to calendar
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {/* Read-Only Academic Portal */}
        </div>
      </div>

      {/* Mode Selector & Day Selectors */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 p-1 bg-dark-surface rounded-xl border border-dark-border">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'daily'
                ? 'bg-dark-bg text-primary shadow-sm border border-dark-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List size={14} /> Daily
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'weekly'
                ? 'bg-dark-bg text-primary shadow-sm border border-dark-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Grid3X3 size={14} /> Weekly
          </button>
        </div>

        {viewMode === 'daily' && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 w-full md:w-auto">
            {DAYS_OF_WEEK.map((day) => {
              const count =
                timetable?.slots?.filter((slot) => slot.day === day).length ?? 0;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[55px] transition-all border ${
                    selectedDay === day
                      ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                      : 'bg-dark-surface text-text-secondary border-dark-border hover:text-text-primary'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">{day}</span>
                  <span
                    className={`text-sm font-extrabold mt-0.5 ${
                      count > 0 && selectedDay !== day ? 'text-primary' : ''
                    }`}
                  >
                    {count > 0 ? count : '–'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-3">
          {Array(4)
            .fill(0)
            .map((_, idx) => (
              <TimetableShimmer key={idx} className="h-24" />
            ))}
        </div>
      ) : viewMode === 'weekly' ? (
        <WeeklyView timetable={timetable} onDelete={handleDeleteClass} />
      ) : selectedDaySlots.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays size={28} className="text-primary" />
          </div>
          <p className="font-bold">No classes on {selectedDay}</p>
          <p className="text-text-secondary text-sm">
            Your HOD has not scheduled any classes for this day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-bold text-lg">
              {selectedDay === todayName ? 'Today' : selectedDay}
            </h2>
            <span className="text-xs text-text-secondary bg-dark-surface border border-dark-border px-2 py-0.5 rounded-full">
              {selectedDaySlots.length}{' '}
              {selectedDaySlots.length === 1 ? 'class' : 'classes'}
            </span>
          </div>

          {selectedDaySlots.map((slot, index) => {
            const globalIndex = timetable.slots.findIndex(
              (s) =>
                s.day === slot.day &&
                s.startTime === slot.startTime &&
                s.subject === slot.subject
            );

            const now = new Date();
            const startTotal = timeToMinutes(slot.startTime);
            const endTotal = timeToMinutes(slot.endTime);
            const currentTotal = now.getHours() * 60 + now.getMinutes();

            const isOngoing =
              selectedDay === todayName &&
              currentTotal >= startTotal &&
              currentTotal < endTotal;
            const isUpNext =
              selectedDay === todayName && currentTotal < startTotal && index === 0;

            return (
              <div
                key={index}
                className={`glass-card p-4 flex gap-4 transition-all hover:border-dark-border/80 ${
                  isOngoing ? 'border-primary/40' : ''
                }`}
              >
                <div className="w-20 text-right flex-shrink-0">
                  <p className="text-xs font-bold text-text-primary">{formatTime(slot.startTime)}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{formatTime(slot.endTime)}</p>
                </div>

                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ background: slot.color }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm">{slot.subject}</h3>
                    <div className="flex items-center gap-2">
                      {isOngoing && (
                        <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          ONGOING
                        </span>
                      )}
                      {isUpNext && !isOngoing && (
                        <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          UP NEXT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {slot.faculty && (
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <User size={10} />
                        {slot.faculty}
                      </span>
                    )}
                    {slot.room && (
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <MapPin size={10} />
                        {slot.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
