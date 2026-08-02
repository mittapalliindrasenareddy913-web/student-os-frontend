import React from 'react';
import {
  Check,
  EllipsisVertical,
  Funnel,
  Moon,
  Plus,
  Apple,
  Droplets,
  Activity,
  FileText,
  BookOpen,
  User,
  PhoneOff,
  X,
} from 'lucide-react';

export default function Habits() {
  const habitsData = [
    {
      title: 'Drink 8 Glasses of Water',
      icon: <Droplets size={20} />,
      color: 'bg-emerald-500',
      streak: '12',
      status: 'completed',
    },
    {
      title: 'Morning Workout',
      icon: <Activity size={20} />,
      color: 'bg-orange-500',
      streak: '7',
      status: 'completed',
    },
    {
      title: 'Read 20 Pages',
      icon: <BookOpen size={20} />,
      color: 'bg-blue-500',
      streak: '15',
      status: 'completed',
    },
    {
      title: 'Meditate for 10 Minutes',
      icon: <User size={20} />,
      color: 'bg-purple-500',
      streak: '5',
      status: 'pending',
    },
    {
      title: 'Eat Healthy Food',
      icon: <Apple size={20} />,
      color: 'bg-red-500',
      streak: '3',
      status: 'completed',
    },
    {
      title: 'Learn Something New',
      icon: <FileText size={20} />,
      color: 'bg-yellow-500',
      streak: '2',
      status: 'pending',
    },
    {
      title: 'Sleep 7-8 Hours',
      icon: <Moon size={20} />,
      color: 'bg-indigo-500',
      streak: '10',
      status: 'completed',
    },
    {
      title: 'No Social Media',
      icon: <PhoneOff size={20} />,
      color: 'bg-slate-500',
      streak: '4',
      status: 'missed',
    },
  ];

  const daysOfWeek = [
    { day: 'Sun', date: '19' },
    { day: 'Mon', date: '20' },
    { day: 'Tue', date: '21' },
    { day: 'Wed', date: '22', active: true },
    { day: 'Thu', date: '23' },
    { day: 'Fri', date: '24' },
    { day: 'Sat', date: '25' },
  ];

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Habit Tracker</h1>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
            <Funnel size={20} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
            <EllipsisVertical size={20} />
          </button>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="flex justify-between md:justify-center md:gap-4 mb-8 bg-dark-surface/50 p-2 rounded-2xl border border-dark-border">
        {daysOfWeek.map((d, index) => (
          <button
            key={index}
            className={`flex flex-col items-center justify-center w-12 h-14 md:w-16 md:h-16 rounded-xl transition-all ${
              d.active
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'hover:bg-dark-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="text-[10px] md:text-xs font-medium uppercase">{d.day}</span>
            <span className="text-base md:text-lg font-bold">{d.date}</span>
          </button>
        ))}
      </div>

      {/* Overview Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
          Today, 22 May 2024
        </h2>
        <button className="text-primary hover:underline text-sm font-medium">Edit</button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
          <h3 className="text-2xl font-bold text-success">10</h3>
          <p className="text-[10px] text-text-secondary mt-1">Completed</p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
          <h3 className="text-2xl font-bold text-primary">2</h3>
          <p className="text-[10px] text-text-secondary mt-1">In Progress</p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
          <h3 className="text-2xl font-bold text-orange-500">1</h3>
          <p className="text-[10px] text-text-secondary mt-1">Missed</p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
          <h3 className="text-2xl font-bold text-blue-400">85%</h3>
          <p className="text-[10px] text-text-secondary mt-1">Success Rate</p>
        </div>
      </div>

      {/* Today's Habits Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
          Today's Habits
        </h2>
        <span className="text-xs text-text-secondary">11 Habits</span>
      </div>

      {/* Habits List */}
      <div className="space-y-3 mb-8">
        {habitsData.map((habit, index) => (
          <HabitCard
            key={index}
            title={habit.title}
            icon={habit.icon}
            color={habit.color}
            streak={habit.streak}
            status={habit.status}
          />
        ))}
      </div>

      {/* Add New Habit Button */}
      <button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
        <Plus size={20} /> Add New Habit
      </button>
    </div>
  );
}

// HabitCard component
const HabitCard = ({ title, icon, color, streak, status }) => {
  return (
    <div className="glass-card p-4 flex items-center gap-4 transition-colors hover:border-dark-border">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm text-text-primary">{title}</h3>
        <p className="text-[10px] text-text-secondary mt-1">💧 Daily</p>
      </div>
      <div className="text-center pr-4 border-r border-dark-border">
        <p className="font-bold text-sm">{streak}</p>
        <p className="text-[8px] text-text-secondary uppercase">Day Streak</p>
      </div>
      <div className="pl-2">
        {status === 'completed' && (
          <div className="w-8 h-8 rounded-full border-2 border-success flex items-center justify-center text-success">
            <Check size={16} />
          </div>
        )}
        {status === 'pending' && (
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-text-secondary flex items-center justify-center text-text-secondary cursor-pointer hover:border-primary hover:text-primary transition-colors" />
        )}
        {status === 'missed' && (
          <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500">
            <X size={16} />
          </div>
        )}
      </div>
    </div>
  );
};
