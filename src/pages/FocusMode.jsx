import React, { useState, useEffect, useContext, useRef } from 'react';
import { Check, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const PRESETS = [
  { key: 'pomodoro', label: 'Pomodoro', minutes: 25, break: 5 },
  { key: '50-10', label: '50/10', minutes: 50, break: 10 },
  { key: 'custom', label: 'Custom', minutes: 45, break: 10 },
  { key: 'flow', label: 'Flow', minutes: 90, break: 20 },
];

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function FocusMode() {
  const { API } = useContext(AuthContext);

  const [presetIndex, setPresetIndex] = useState(0);
  const [subject, setSubject] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].minutes * 60);
  const [sessionId, setSessionId] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [isBreak, setIsBreak] = useState(false);

  const timerRef = useRef(null);

  const activePreset = PRESETS[presetIndex];
  const totalSeconds = (isBreak ? activePreset.break : activePreset.minutes) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  const fetchFocusData = async () => {
    try {
      const { data } = await API.get('/focus');
      setRecentSessions(data.sessions);
      setTodayMinutes(data.todayMin);
    } catch (error) {
      console.error('Error fetching focus data:', error);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    setIsCompleted(false);
    setTimeLeft((isBreak ? activePreset.break : activePreset.minutes) * 60);
  };

  useEffect(() => {
    fetchFocusData();
  }, []);

  useEffect(() => {
    resetTimer();
  }, [presetIndex, isBreak]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            setIsCompleted(true);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  const startTimer = async () => {
    if (!sessionId && !isCompleted) {
      try {
        const { data } = await API.post('/focus', {
          durationMin: activePreset.minutes,
          mode: activePreset.key,
          subject: subject,
        });
        setSessionId(data._id);
      } catch (error) {
        console.error('Error starting focus session:', error);
      }
    }
    setIsActive(true);
  };

  const handleSessionComplete = async () => {
    if (sessionId) {
      const actualMin = Math.round(totalSeconds / 60);
      try {
        await API.put(`/focus/${sessionId}/complete`, { actualMin });
      } catch (error) {
        console.error('Error completing focus session:', error);
      }
      setSessionId(null);
      fetchFocusData();
    }
  };

  const handleReset = () => {
    setSessionId(null);
    resetTimer();
  };

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Focus Mode</h1>
        <p className="text-text-secondary text-sm mt-0.5">Deep work, zero distractions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 flex flex-col items-center gap-6">
          {/* Presets List */}
          <div className="flex bg-dark-bg border border-dark-border rounded-2xl p-1 gap-1 w-full">
            {PRESETS.map((preset, idx) => (
              <button
                key={preset.key}
                onClick={() => {
                  setPresetIndex(idx);
                  setIsBreak(false);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  presetIndex === idx
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Focus / Break Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsBreak(false)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isBreak
                  ? 'border-dark-border text-text-secondary hover:text-text-primary'
                  : 'bg-primary/15 text-primary border-primary/40'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => setIsBreak(true)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isBreak
                  ? 'bg-success/15 text-success border-success/40'
                  : 'border-dark-border text-text-secondary hover:text-text-primary'
              }`}
            >
              Break
            </button>
          </div>

          {/* Circle Progress Timer */}
          <div className="relative w-60 h-60 flex items-center justify-center">
            <svg width="240" height="240" className="transform -rotate-90 absolute">
              <circle
                cx="120"
                cy="120"
                r="110"
                fill="none"
                stroke="var(--color-dark-border)"
                strokeWidth="8"
              />
              <circle
                cx="120"
                cy="120"
                r="110"
                fill="none"
                stroke={isBreak ? 'var(--color-success)' : 'var(--color-primary)'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>

            <div className="flex flex-col items-center z-10">
              {isCompleted ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mb-2 shadow-lg shadow-success/30">
                    <Check size={32} className="text-white" />
                  </div>
                  <p className="font-bold text-success">Session Complete!</p>
                </>
              ) : (
                <>
                  <span className="text-5xl font-extrabold tracking-tight tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-text-secondary text-sm mt-1">
                    {isBreak
                      ? `${activePreset.break}min break`
                      : `${activePreset.minutes}min focus`}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-primary mt-1 font-medium animate-pulse">
                      ● FOCUSING
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-dark-border/80 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={isActive ? () => setIsActive(false) : startTimer}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                isBreak ? 'bg-success shadow-success/30' : 'bg-primary shadow-primary/30'
              }`}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button
              className="w-12 h-12 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              <Volume2 size={20} />
            </button>
          </div>

          {/* Subject Input */}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isActive}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-center outline-none focus:border-primary transition-colors placeholder:text-text-secondary/50 disabled:opacity-50"
            placeholder="What are you studying? (optional)"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Today's Focus Card */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-4">Today's Focus</h3>
            <p className="text-3xl font-extrabold">
              {todayMinutes}
              <span className="text-sm font-medium text-text-secondary ml-1">min</span>
            </p>
            <div className="mt-3 h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{
                  width: `${Math.min((todayMinutes / 120) * 100, 100)}%`,
                  transition: 'width 1s ease',
                }}
              />
            </div>
            <p className="text-[10px] text-text-secondary mt-1">Goal: 120 min/day</p>
          </div>

          {/* Recent Sessions Card */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-3">Recent Sessions</h3>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">
                No sessions yet. Start focusing!
              </p>
            ) : (
              <div className="space-y-2">
                {recentSessions.slice(0, 5).map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center gap-3 p-2.5 bg-dark-surface/50 rounded-xl border border-dark-border"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        session.isCompleted ? 'bg-success' : 'bg-orange-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {session.subject || 'General Study'}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {session.actualMin}min · {session.mode}
                      </p>
                    </div>
                    {session.isCompleted && (
                      <Check size={12} className="text-success flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
