import React, { useState, useEffect, useContext } from 'react';
import { Check, EllipsisVertical, Plus, Search, Trash2, Repeat, Tag, Calendar, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const PRIORITY_CONFIG = {
  High: {
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
  },
  Medium: {
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
  },
  Low: {
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
  },
};

const STATUS_TABS = ['All', 'To Do', 'In Progress', 'Completed'];

const CATEGORIES = ['General', 'Assignment', 'Exam', 'Project', 'Reading', 'Personal'];

const INITIAL_TASK_STATE = {
  title: '',
  description: '',
  category: 'General',
  priority: 'Medium',
  dueDate: '',
  recurrence: 'none',
  subtasks: [],
};

const INPUT_CLASS =
  'w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-text-primary text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-secondary/40';

export default function Tasks() {
  const { API } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_STATE);
  const [subtaskInput, setSubtaskInput] = useState('');

  const fetchTasks = async () => {
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/tasks/analytics'),
      ]);
      setTasks(tasksRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await API.put(`/tasks/${editingTaskId}`, taskForm);
      } else {
        await API.post('/tasks', taskForm);
      }
      setShowModal(false);
      setEditingTaskId(null);
      setTaskForm(INITIAL_TASK_STATE);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await API.put(`/tasks/${task._id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const handleToggleSubtask = async (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask._id === subtaskId ? { ...subtask, isCompleted: !subtask.isCompleted } : subtask
    );
    const newStatus = updatedSubtasks.every((subtask) => subtask.isCompleted)
      ? 'completed'
      : 'in-progress';
    try {
      await API.put(`/tasks/${task._id}`, { subtasks: updatedSubtasks, status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await API.delete(`/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEditClick = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category || 'General',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      recurrence: task.recurrence || 'none',
      subtasks: task.subtasks || [],
    });
    setEditingTaskId(task._id);
    setShowModal(true);
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setTaskForm((prev) => ({
        ...prev,
        subtasks: [...prev.subtasks, { title: subtaskInput.trim(), isCompleted: false }],
      }));
      setSubtaskInput('');
    }
  };

  const handleDeleteSubtask = (index) => {
    setTaskForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, idx) => idx !== index),
    }));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      activeTab === 'All'
        ? true
        : activeTab === 'To Do'
          ? task.status === 'todo'
          : activeTab === 'In Progress'
            ? task.status === 'in-progress'
            : task.status === 'completed';
    return matchesSearch && matchesStatus;
  });

  const taskCounts = {
    All: tasks.length,
    'To Do': tasks.filter((task) => task.status === 'todo').length,
    'In Progress': tasks.filter((task) => task.status === 'in-progress').length,
    Completed: tasks.filter((task) => task.status === 'completed').length,
  };

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold">Tasks</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {analytics?.pending || 0} pending tasks
          </p>
        </div>
        <button
          onClick={() => {
            setTaskForm(INITIAL_TASK_STATE);
            setEditingTaskId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[.98]"
        >
          <Plus size={18} /> New Task
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard
              label="Total Tasks"
              value={analytics.total}
              color="text-text-primary"
            />
            <AnalyticsCard
              label="Completion"
              value={`${analytics.completionRate}%`}
              color="text-emerald-400"
            />
            <AnalyticsCard
              label="Overdue"
              value={analytics.overdue}
              color={analytics.overdue > 0 ? 'text-red-400' : 'text-text-secondary'}
            />
            <AnalyticsCard
              label="High Priority"
              value={analytics.priorityStats?.High ?? 0}
              color="text-red-400"
            />
          </div>
        )
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                activeTab === tab
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-dark-surface text-text-secondary border-dark-border hover:text-text-primary'
              }`}
            >
              {tab}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-primary/20' : 'bg-dark-bg'
                }`}
              >
                {taskCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-surface border border-dark-border rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors placeholder:text-text-secondary/50"
            placeholder="Search tasks..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Check size={28} className="text-primary" />
          </div>
          <p className="font-bold text-lg">No tasks found</p>
          <p className="text-text-secondary text-sm">
            {activeTab === 'Completed'
              ? 'Complete some tasks to see them here.'
              : 'Add a new task to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onToggle={handleToggleTaskStatus}
              onToggleSubtask={handleToggleSubtask}
              onEdit={handleEditClick}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editingTaskId ? 'Edit Task' : 'New Task'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Title *">
              <input
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="e.g. Complete DSA assignment"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                rows={2}
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Details..."
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category">
                <select
                  value={taskForm.category}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))}
                  className={INPUT_CLASS}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Priority">
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
                  className={INPUT_CLASS}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Due Date">
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label="Recurrence">
                <select
                  value={taskForm.recurrence}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, recurrence: e.target.value }))}
                  className={INPUT_CLASS}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </FormField>
            </div>

            <FormField label="Subtasks / Checklists">
              <div className="space-y-2">
                {taskForm.subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-dark-bg p-2 rounded-xl border border-dark-border"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                        subtask.isCompleted ? 'bg-success border-success' : 'border-text-secondary'
                      }`}
                    />
                    <span className="flex-1 text-sm">{subtask.title}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(index)}
                      className="text-text-secondary hover:text-red-400 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Add subtask..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="bg-dark-surface border border-dark-border px-3 rounded-xl text-text-secondary hover:text-text-primary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </FormField>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 mt-2 rounded-xl font-semibold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
            >
              {editingTaskId ? 'Save Changes' : 'Create Task'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onToggleSubtask, onEdit, onDelete }) {
  const priorityStyle = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`glass-card overflow-hidden transition-all hover:border-dark-border/80 ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="p-4 flex items-start gap-4">
        <button
          onClick={() => onToggle(task)}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isCompleted ? 'bg-success border-success' : 'border-dark-border hover:border-primary'
          }`}
        >
          {isCompleted && <Check size={13} className="text-white" />}
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => hasSubtasks && setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-start gap-2">
            <p className={`font-bold text-sm ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
              {task.title}
            </p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityStyle.color} ${priorityStyle.bg} ${priorityStyle.border}`}
            >
              {task.priority}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.category && (
              <span className="flex items-center gap-1 text-[10px] text-text-secondary bg-dark-surface px-2 py-0.5 rounded-full border border-dark-border">
                <Tag size={10} /> {task.category}
              </span>
            )}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400 font-bold' : 'text-text-secondary'}`}>
                <Calendar size={10} />{' '}
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                <Repeat size={10} className="text-primary" />{' '}
                <span className="capitalize">{task.recurrence}</span>
              </span>
            )}
          </div>

          {hasSubtasks && (
            <div className="mt-3">
              <div className="flex justify-between items-center text-[10px] text-text-secondary mb-1">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 items-center">
          <button
            onClick={() => onEdit(task)}
            className="text-text-secondary hover:text-text-primary p-1 transition-colors"
          >
            <EllipsisVertical size={16} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="text-text-secondary hover:text-red-400 p-1 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {hasSubtasks && isExpanded && (
        <div className="bg-dark-bg/50 border-t border-dark-border p-3 px-12 space-y-2">
          {task.subtasks.map((subtask) => (
            <div key={subtask._id} className="flex items-center gap-3 group">
              <button
                onClick={() => onToggleSubtask(task, subtask._id)}
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  subtask.isCompleted ? 'bg-primary border-primary' : 'border-dark-border group-hover:border-primary/50'
                }`}
              >
                {subtask.isCompleted && <Check size={10} className="text-white" />}
              </button>
              <span
                className={`text-xs ${
                  subtask.isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'
                }`}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsCard({ label, value, color }) {
  return (
    <div className="glass-card p-4 text-center flex flex-col items-center justify-center">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider font-semibold">
        {label}
      </p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-extrabold text-lg">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Skeleton({ className }) {
  return (
    <div className={`bg-dark-surface animate-pulse rounded-xl ${className}`} />
  );
}
