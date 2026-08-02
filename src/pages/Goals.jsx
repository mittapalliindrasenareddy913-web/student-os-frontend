import React, { useState } from 'react';
import {
  Search,
  EllipsisVertical,
  Plus,
  BookOpen,
  Activity,
  Code,
  Briefcase,
  Heart,
  Timer,
} from 'lucide-react';

const GoalItem = ({
  title,
  icon,
  color,
  category,
  date,
  progress,
  stat,
}) => {
  return (
    <div className="glass-card p-4 hover:border-dark-border transition-colors">
      <div className="flex gap-4">
        {/* Goal Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${color}`}>
          {icon}
        </div>
        {/* Goal Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-sm text-text-primary">
              {title}
            </h3>
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <Timer size={10} /> {date}
            </span>
          </div>
          <p className="text-[10px] text-text-secondary mb-3">
            {category}
          </p>
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-dark-bg rounded-full overflow-hidden border border-dark-border">
              <div
                className={`h-full ${color}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-text-primary">
              {progress}%
            </span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5">
            {stat}
          </p>
        </div>
        {/* Option Menu Button */}
        <button className="text-text-secondary hover:text-text-primary self-start transition-colors">
          <EllipsisVertical size={16} />
        </button>
      </div>
    </div>
  );
};

export default function Goals() {
  const [filter, setFilter] = useState('All');

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Goals</h1>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
            <Search size={20} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
            <EllipsisVertical size={20} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
        {['All', 'In Progress', 'Not Started', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-dark-surface text-text-secondary border border-dark-border hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overall Progress Section */}
      <div className="glass-card p-6 mb-8 flex flex-col md:flex-row items-center gap-8">
        {/* Circular Progress SVG */}
        <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="var(--color-dark-border)"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="12"
              strokeDasharray="351.8"
              strokeDashoffset={351.8 - 351.8 * 0.72}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold">72%</span>
            <span className="text-[8px] text-text-secondary mt-1">
              Overall Progress
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-3 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold text-text-primary">16</h3>
            <p className="text-[10px] text-text-secondary mt-1">Total Goals</p>
          </div>
          <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-3 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold text-success">11</h3>
            <p className="text-[10px] text-text-secondary mt-1">In Progress</p>
          </div>
          <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-3 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold text-blue-400">3</h3>
            <p className="text-[10px] text-text-secondary mt-1">Completed</p>
          </div>
          <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-3 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold text-orange-500">2</h3>
            <p className="text-[10px] text-text-secondary mt-1">On Hold</p>
          </div>
        </div>
      </div>

      {/* Subheading */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
          My Goals
        </h2>
        <button className="text-primary hover:underline text-sm font-medium">
          View All
        </button>
      </div>

      {/* Goals Card List */}
      <div className="space-y-4 mb-8">
        <GoalItem
          title="Read 12 Books This Year"
          icon={<BookOpen size={20} />}
          color="bg-purple-500"
          category="Personal Growth"
          date="Dec 31, 2024"
          progress={75}
          stat="9 / 12 books completed"
        />
        <GoalItem
          title="Run a Half Marathon"
          icon={<Activity size={20} />}
          color="bg-success"
          category="Health & Fitness"
          date="Nov 15, 2024"
          progress={60}
          stat="Training progress on track"
        />
        <GoalItem
          title="Learn Data Science"
          icon={<Code size={20} />}
          color="bg-blue-500"
          category="Education"
          date="Jan 31, 2025"
          progress={40}
          stat="Complete online course"
        />
        <GoalItem
          title="Save $10,000"
          icon={<Timer size={20} />}
          color="bg-orange-500"
          category="Finance"
          date="Dec 31, 2024"
          progress={30}
          stat="$3,000 / $10,000 saved"
        />
        <GoalItem
          title="Get Promoted"
          icon={<Briefcase size={20} />}
          color="bg-pink-500"
          category="Career"
          date="Mar 31, 2025"
          progress={25}
          stat="Work on key skills"
        />
        <GoalItem
          title="Spend More Time with Family"
          icon={<Heart size={20} />}
          color="bg-red-500"
          category="Relationships"
          date="Dec 31, 2024"
          progress={80}
          stat="Quality time goal"
        />
      </div>

      {/* Create New Goal Button */}
      <button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
        <Plus size={20} /> Create New Goal
      </button>
    </div>
  );
}
