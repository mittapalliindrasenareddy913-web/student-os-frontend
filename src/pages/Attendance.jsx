import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PremiumLock from '../components/PremiumLock';
import {
  Plus,
  Check,
  X,
  Trash2,
  TriangleAlert,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Calendar,
  BarChart2,
  BookOpen
} from 'lucide-react';

const COLOR_PALETTE = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_SUBJECT_FORM = {
  name: '',
  code: '',
  faculty: '',
  room: '',
  requiredPct: 75,
  color: COLOR_PALETTE[0],
  scheduledDays: [],
  classesPerWeek: 1,
};

const CircularProgress = ({
  value = 0,
  color = '#8b5cf6',
  size = 96,
  stroke = 10,
  label = '',
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(Math.max(value, 0), 100)) / 100;
  const strokeColor = value >= 75 ? color : value >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 absolute inset-0"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2d313f"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span
          className="font-extrabold leading-none"
          style={{ fontSize: size * 0.22, color: strokeColor }}
        >
          {value}%
        </span>
        {label && (
          <span
            className="text-text-secondary leading-none mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusStyles = {
    safe: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const labels = {
    safe: '✓ Safe',
    warning: '⚠ Warning',
    danger: '✕ Danger',
  };

  return (
    <span
      className={`text-[9px] font-bold border rounded-full px-2 py-0.5 uppercase tracking-wide ${
        statusStyles[status] || statusStyles.safe
      }`}
    >
      {labels[status] || status}
    </span>
  );
};

const Heatmap = ({ heatmap = {} }) => {
  const statusColors = {
    present: '#10b981',
    absent: '#ef4444',
    cancelled: '#2d313f',
  };

  const days = [];
  // Generate last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    days.push({
      key: dateString,
      date,
      status: heatmap[dateString] || null,
    });
  }

  const startDayOfWeek = days[0].date.getDay();
  const paddedDays = [...Array(startDayOfWeek).fill(null), ...days];
  const weeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex gap-1 mb-1 ml-[26px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={index}
            className="w-4 text-center text-[8px] text-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1 flex-shrink-0">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                title={day ? `${day.key}: ${day.status || 'no class'}` : ''}
                className="w-4 h-4 rounded-sm transition-transform hover:scale-110"
                style={{
                  background: day?.status
                    ? statusColors[day.status]
                    : day
                      ? '#1e212b'
                      : 'transparent',
                  cursor: day?.status ? 'pointer' : 'default',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: '#10b981', label: 'Present' },
          { color: '#ef4444', label: 'Absent' },
          { color: '#2d313f', label: 'Cancelled' },
          { color: '#1e212b', label: 'No class' },
        ].map((legend) => (
          <div key={legend.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: legend.color }}
            />
            <span className="text-[9px] text-text-secondary">
              {legend.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecoveryPlan = ({
  attended,
  total,
  requiredPct,
  needToAttend,
  weeksToRecover,
  classesPerWeek,
}) => {
  const currentPct = total ? Math.round((attended / total) * 100) : 0;

  if (currentPct < requiredPct) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-red-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="font-bold text-sm text-red-400">Recovery Plan Needed</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStatCard label="Current" value={`${currentPct}%`} color="text-red-400" />
          <MiniStatCard label="Target" value={`${requiredPct}%`} color="text-text-primary" />
          <MiniStatCard label="Gap" value={`${requiredPct - currentPct}%`} color="text-orange-400" />
        </div>
        <div className="h-px bg-dark-border" />
        <div className="grid grid-cols-2 gap-2">
          <MiniStatCard label="Must attend" value={`${needToAttend} classes`} color="text-primary" />
          <MiniStatCard label="Est. time" value={weeksToRecover ? `~${weeksToRecover} weeks` : '—'} color="text-text-secondary" />
        </div>
        <p className="text-[10px] text-text-secondary leading-relaxed">
          Attend the next <strong className="text-text-primary">{needToAttend}</strong> consecutive classes without missing any
          {weeksToRecover ? ` — approximately ${weeksToRecover} week${weeksToRecover > 1 ? 's' : ''} at ${classesPerWeek}/week.` : '.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </div>
      <div>
        <p className="font-bold text-sm text-emerald-400">Attendance Safe ✓</p>
        <p className="text-xs text-text-secondary mt-0.5">
          You're meeting the {requiredPct}% requirement
        </p>
      </div>
    </div>
  );
};

const MiniStatCard = ({ label, value, color }) => {
  return (
    <div className="bg-dark-surface/50 border border-dark-border rounded-xl p-2.5 text-center">
      <p className={`font-bold text-sm ${color}`}>{value}</p>
      <p className="text-[9px] text-text-secondary mt-0.5">{label}</p>
    </div>
  );
};

const WeeklyTrend = ({ data = [] }) => {
  return (
    <div className="space-y-2">
      {data.map((week, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-[10px] text-text-secondary w-6 flex-shrink-0">
            {week.label}
          </span>
          <div className="flex-1 h-5 bg-dark-border rounded-full overflow-hidden relative">
            {week.total > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-500/60 rounded-full transition-all duration-700"
                  style={{ width: `${(week.present / week.total) * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full bg-red-500/40 rounded-full transition-all duration-700"
                  style={{
                    left: `${(week.present / week.total) * 100}%`,
                    width: `${((week.total - week.present) / week.total) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
          <span
            className={`text-[10px] font-bold w-8 text-right flex-shrink-0 ${
              week.pct == null
                ? 'text-text-secondary'
                : week.pct >= 75
                  ? 'text-emerald-400'
                  : week.pct >= 70
                    ? 'text-yellow-400'
                    : 'text-red-400'
            }`}
          >
            {week.pct == null ? '—' : `${week.pct}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

const WeekdayPattern = ({ data = [] }) => {
  const maxClasses = Math.max(...data.map((d) => d.present + d.absent), 1);

  return (
    <div className="flex items-end gap-2 h-20">
      {data
        .filter((d) => d.day !== 'Sun')
        .map((d, index) => {
          const total = d.present + d.absent;
          const percentage = total ? Math.round((d.present / total) * 100) : 0;
          const barHeight = total ? (total / maxClasses) * 100 : 4;
          const barColor =
            percentage >= 75 ? '#10b981' : percentage >= 70 ? '#f59e0b' : '#ef4444';

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-1 flex-1"
              title={`${d.day}: ${percentage}% (${d.present}/${total})`}
            >
              <span className="text-[8px] text-text-secondary">
                {total > 0 ? `${percentage}%` : ''}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-700 relative overflow-hidden"
                style={{ height: `${barHeight}%`, minHeight: 8 }}
              >
                <div
                  className="absolute inset-0 rounded-t-md"
                  style={{ background: barColor, opacity: 0.7 }}
                />
              </div>
              <span className="text-[9px] text-text-secondary">{d.day}</span>
            </div>
          );
        })}
    </div>
  );
};

const Modal = ({ title, onClose, children, wide = false }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`glass-card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto custom-scrollbar`}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-extrabold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const FormField = ({ label, error, children }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400">
          ⚠ {error}
        </p>
      )}
    </div>
  );
};

const Skeleton = ({ className }) => {
  return (
    <div className={`bg-dark-surface animate-pulse rounded-xl ${className}`} />
  );
};

const StatLabel = ({ label, value, color }) => {
  return (
    <div className="flex flex-col">
      <span className={`text-xs font-bold ${color}`}>{value}</span>
      <span className="text-[9px] text-text-secondary">{label}</span>
    </div>
  );
};

const DetailStatCard = ({ label, value, color, bg }) => {
  return (
    <div className={`${bg} border border-dark-border rounded-xl p-3 text-center`}>
      <p className={`font-extrabold text-lg ${color}`}>{value}</p>
      <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="glass-card p-14 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <BookOpen size={32} className="text-primary" />
      </div>
      <h3 className="font-extrabold text-lg">No subjects yet</h3>
      <p className="text-text-secondary text-sm max-w-xs">
        Your faculty has not uploaded or linked any subjects to your timetable yet.
      </p>
    </div>
  );
};

const OverviewTab = ({ data }) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <DetailStatCard
          label="Present"
          value={data.totalPresent}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <DetailStatCard
          label="Absent"
          value={data.totalAbsent}
          color="text-red-400"
          bg="bg-red-500/10"
        />
        <DetailStatCard
          label="Cancelled"
          value={data.totalCancelled}
          color="text-text-secondary"
          bg="bg-dark-surface"
        />
      </div>
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">
          Weekly Trend (Last 8 Weeks)
        </p>
        <WeeklyTrend data={data.weeklyTrend || []} />
      </div>
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">
          Attendance by Day of Week
        </p>
        <WeekdayPattern data={data.dayPattern || []} />
      </div>
    </div>
  );
};

const HeatmapTab = ({ heatmap }) => {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">
        Last 3 Months
      </p>
      <Heatmap heatmap={heatmap} />
    </div>
  );
};

const RecoveryTab = ({ subject, data }) => {
  const safeBunkPct = Math.max(
    0,
    subject.attendancePct - Math.ceil((data.canBunk * 100) / (subject.totalClasses + data.canBunk))
  );

  return (
    <div className="space-y-4">
      <RecoveryPlan
        attended={subject.attended}
        total={subject.totalClasses}
        requiredPct={subject.requiredPct}
        needToAttend={data.needToAttend}
        weeksToRecover={data.weeksToRecover}
        classesPerWeek={subject.classesPerWeek || 1}
      />
      {subject.attendancePct >= subject.requiredPct && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <p className="font-bold text-sm text-emerald-400 mb-3">
            Safe Bunk Calculator
          </p>
          <div className="grid grid-cols-2 gap-3">
            <DetailStatCard
              label="Can Skip Now"
              value={`${data.canBunk} classes`}
              color="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <DetailStatCard
              label="After Skipping"
              value={`${safeBunkPct}%`}
              color="text-yellow-400"
              bg="bg-yellow-500/10"
            />
          </div>
          <p className="text-[10px] text-text-secondary mt-3">
            You can skip up to <strong className="text-emerald-400">{data.canBunk}</strong> classes while staying above {subject.requiredPct}%.
          </p>
        </div>
      )}
    </div>
  );
};

const SubjectCard = ({
  subject,
  isExpanded,
  analyticsData,
  heatmapData,
  isMarking,
  onToggleExpand,
  onMarkStart,
  onMarkCancel,
  onMarkStatus,
  onEdit,
  onDelete,
  activeTab,
  setActiveTab,
}) => {
  const attendancePct = subject.attendancePct ?? 0;
  const canBunk = subject.canBunk ?? 0;
  const needToAttend = subject.needToAttend ?? 0;
  const isBelowRequired = attendancePct < subject.requiredPct;

  return (
    <div className={`glass-card overflow-hidden transition-all ${isBelowRequired ? 'border-red-500/20' : ''}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <CircularProgress value={attendancePct} color={subject.color} size={88} stroke={9} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-extrabold text-base leading-tight">{subject.name}</h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {[subject.code, subject.faculty, subject.room].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <StatusBadge status={subject.statusLabel} />
              </div>
            </div>

            <div className="flex gap-3 mt-3 flex-wrap">
              <StatLabel label="Attended" value={`${subject.attended}/${subject.totalClasses}`} color="text-text-primary" />
              {isBelowRequired ? (
                <StatLabel label="Need to attend" value={`${needToAttend} more`} color="text-red-400" />
              ) : (
                <StatLabel label="Can skip" value={`${canBunk} classes`} color="text-emerald-400" />
              )}
              <StatLabel label="Required" value={`${subject.requiredPct}%`} color="text-text-secondary" />
            </div>

            <div className="mt-3 h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${attendancePct}%`,
                  background:
                    attendancePct >= subject.requiredPct
                      ? subject.color
                      : attendancePct >= subject.requiredPct - 5
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-text-secondary mt-1">
              <span>0%</span>
              <span
                className="text-primary font-bold"
                style={{
                  marginLeft: `${subject.requiredPct}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {subject.requiredPct}% min
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <BarChart2 size={14} /> Analytics
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-dark-border">
          <div className="flex gap-1 p-3 bg-dark-bg/50">
            {[
              { key: 'overview', icon: <TrendingUp size={13} />, label: 'Overview' },
              { key: 'heatmap', icon: <Calendar size={13} />, label: 'Heatmap' },
              { key: 'recovery', icon: <RefreshCw size={13} />, label: 'Recovery' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.key ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-5 pt-4">
            {analyticsData ? (
              activeTab === 'overview' ? (
                <OverviewTab data={analyticsData} />
              ) : activeTab === 'heatmap' ? (
                <HeatmapTab heatmap={heatmapData || {}} />
              ) : (
                <RecoveryTab subject={subject} data={analyticsData} />
              )
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-8" />
                <Skeleton className="h-24" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Attendance() {
  const { API, user } = useAuth();
  const { socket } = useSocket();

  if (!user?.isCollegeConnected) {
    return <PremiumLock moduleName="Attendance" />;
  }
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [analyticsCache, setAnalyticsCache] = useState({});
  const [heatmapCache, setHeatmapCache] = useState({});
  const [markingId, setMarkingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_SUBJECT_FORM);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const [attendanceRes, summaryRes] = await Promise.all([
        API.get('/attendance'),
        API.get('/attendance/summary'),
      ]);
      setSubjects(attendanceRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAttendanceUpdated = (data) => {
      console.log('📡 [Socket] Attendance updated in real-time:', data);
      fetchAttendanceData();
      
      // Clear cache to force refresh analytics details if open
      if (data && data.subjectCode) {
        setAnalyticsCache({});
        setHeatmapCache({});
      }
    };

    socket.on('attendance_updated', handleAttendanceUpdated);
    return () => {
      socket.off('attendance_updated', handleAttendanceUpdated);
    };
  }, [socket]);

  const fetchSubjectDetails = async (subjectId) => {
    if (!analyticsCache[subjectId]) {
      try {
        const [analyticsRes, heatmapRes] = await Promise.all([
          API.get(`/attendance/${subjectId}/analytics`),
          API.get(`/attendance/${subjectId}/heatmap`),
        ]);
        setAnalyticsCache((prev) => ({ ...prev, [subjectId]: analyticsRes.data }));
        setHeatmapCache((prev) => ({ ...prev, [subjectId]: heatmapRes.data.heatmap }));
      } catch (error) {
        console.error("Failed to fetch subject details:", error);
      }
    }
  };

  const toggleExpandSubject = async (subjectId) => {
    if (expandedId === subjectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(subjectId);
    await fetchSubjectDetails(subjectId);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/attendance/${editingId}`, formData);
      } else {
        await API.post('/attendance', formData);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(INITIAL_SUBJECT_FORM);
      fetchAttendanceData();
    } catch (error) {
      console.error("Failed to save subject:", error);
    }
  };

  const startEditSubject = (subject) => {
    setFormData({
      name: subject.name,
      code: subject.code,
      faculty: subject.faculty,
      room: subject.room || '',
      requiredPct: subject.requiredPct,
      color: subject.color,
      scheduledDays: subject.scheduledDays || [],
      classesPerWeek: subject.classesPerWeek || 1,
    });
    setEditingId(subject._id);
    setIsFormOpen(true);
  };

  const handleDeleteSubject = async (subjectId) => {
    if (confirm('Delete this subject and all records?')) {
      try {
        await API.delete(`/attendance/${subjectId}`);
        fetchAttendanceData();
      } catch (error) {
        console.error("Failed to delete subject:", error);
      }
    }
  };

  const handleMarkAttendance = async (subjectId, status) => {
    try {
      await API.post(`/attendance/${subjectId}/record`, {
        status,
        date: new Date(),
      });
      setMarkingId(null);
      fetchAttendanceData();
    } catch (error) {
      console.error("Failed to mark attendance:", error);
    }
  };

  const toggleScheduledDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      scheduledDays: prev.scheduledDays.includes(day)
        ? prev.scheduledDays.filter((d) => d !== day)
        : [...prev.scheduledDays, day],
    }));
  };

  const overallPct = summary?.totalPct ?? 0;
  const lowAttendanceSubjects = subjects.filter((s) => s.statusLabel === 'danger');

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Attendance</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Track and manage your class attendance
          </p>
        </div>
      </div>

      {/* Low Attendance Warning Alert */}
      {lowAttendanceSubjects.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <TriangleAlert size={16} className="text-red-400" />
            <p className="font-bold text-sm text-red-400">Low Attendance Alert</p>
          </div>
          {lowAttendanceSubjects.map((subject) => (
            <div key={subject._id} className="flex items-center justify-between text-xs">
              <span className="text-text-primary font-medium">{subject.name}</span>
              <span className="text-red-400 font-bold">
                {subject.attendancePct}% — attend {subject.needToAttend} more classes
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {isLoading ? (
        <Skeleton className="h-44" />
      ) : (
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <CircularProgress
              value={overallPct}
              size={140}
              stroke={14}
              label="Overall"
              color="#8b5cf6"
            />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              {[
                { label: 'Subjects', value: summary?.total ?? 0, color: 'text-text-primary' },
                { label: 'Safe ✓', value: summary?.safe ?? 0, color: 'text-emerald-400' },
                { label: 'Warning', value: summary?.warning ?? 0, color: 'text-yellow-400' },
                { label: 'Danger ✕', value: summary?.danger ?? 0, color: 'text-red-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-dark-surface/50 border border-dark-border rounded-xl p-3 text-center">
                  <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="hidden md:flex flex-col gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center min-w-[80px]">
                <p className="text-xl font-extrabold text-emerald-400">{summary?.totalPresent ?? 0}</p>
                <p className="text-[10px] text-text-secondary">Present</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-red-400">{summary?.totalAbsent ?? 0}</p>
                <p className="text-[10px] text-text-secondary">Absent</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subjects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[0, 0, 0].map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState onAdd={() => setIsFormOpen(true)} />
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              isExpanded={expandedId === subject._id}
              analyticsData={analyticsCache[subject._id]}
              heatmapData={heatmapCache[subject._id]}
              isMarking={markingId === subject._id}
              onToggleExpand={() => toggleExpandSubject(subject._id)}
              onMarkStart={() => setMarkingId(subject._id)}
              onMarkCancel={() => setMarkingId(null)}
              onMarkStatus={(status) => handleMarkAttendance(subject._id, status)}
              onEdit={() => startEditSubject(subject)}
              onDelete={() => handleDeleteSubject(subject._id)}
              activeTab={expandedId === subject._id ? activeTab : 'overview'}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      )}

    </div>
  );
}
