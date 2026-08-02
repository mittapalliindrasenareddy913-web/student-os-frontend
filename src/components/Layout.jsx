import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  CheckSquare,
  BookOpen,
  Calendar,
  Timer,
  Users,
  Wrench,
  CreditCard,
  Flame,
  Target,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  CloudUpload,
  Database,
  CalendarRange,
  Edit3
} from 'lucide-react';

const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Office & PDF Suite', path: '/pdf-hub' },
  { icon: UserCheck, label: 'Attendance', path: '/attendance' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: BookOpen, label: 'Notes', path: '/notes' },
  { icon: Calendar, label: 'Timetable', path: '/timetable' },
  { icon: Timer, label: 'Focus Mode', path: '/focus' },
  { icon: Users, label: 'Community Hub', path: '/community' },
  { icon: Wrench, label: 'Tools & Utilities', path: '/tools-hub' },
];

const secondaryNavItems = [
  { icon: CreditCard, label: 'Expense Tracker', path: '/expenses' },
  { icon: FolderOpen, label: 'Study Materials', path: '/study-materials' },
  { icon: Flame, label: 'Habit Tracker', path: '/habits' },
  { icon: Target, label: 'Goals', path: '/goals' },
  { icon: CalendarRange, label: 'Calendar', path: '/calendar' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const mobileBottomNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: FolderOpen, label: 'Study', path: '/study-materials' },
  { icon: Users, label: 'Community', path: '/community', badge: true },
  { icon: Timer, label: 'Focus', path: '/focus' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
];

const sidebarAccordionSections = [
  {
    id: 'academic',
    title: 'Academic Section',
    items: [
      { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
      { icon: BookOpen, label: 'Notes', path: '/notes' },
      { icon: Calendar, label: 'Timetable', path: '/timetable' },
      { icon: Timer, label: 'Focus Mode', path: '/focus' },
      { icon: Users, label: 'Community Hub', path: '/community' },
      { icon: Wrench, label: 'Tools', path: '/tools-hub' },
      { icon: UserCheck, label: 'Attendance', path: '/attendance' },
      { icon: FolderOpen, label: 'Assignments', path: '/study-materials' },
      { icon: FolderOpen, label: 'Previous Papers', path: '/study-materials' },
      { icon: BookOpen, label: 'Lab Manuals', path: '/study-materials' },
    ],
  },
  {
    id: 'pdf_workspace',
    title: 'Office & PDF Suite',
    items: [{ icon: FileText, label: 'Office & PDF Suite', path: '/pdf-hub' }],
  },
  {
    id: 'tools',
    title: 'Tools & Utilities',
    items: [
      { icon: Wrench, label: 'Academic Tools Hub', path: '/tools-hub', isNew: true },
      { icon: CreditCard, label: 'Flashcards', path: '/pdf-hub', toolId: 'flashcards' },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity Section',
    items: [
      { icon: CreditCard, label: 'Expense Tracker', path: '/expenses' },
      { icon: Flame, label: 'Habit Tracker', path: '/habits' },
      { icon: Target, label: 'Goals', path: '/goals' },
      { icon: CalendarRange, label: 'Calendar', path: '/calendar' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings Section',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: CloudUpload, label: 'Backup & Restore', path: '/pdf-hub' },
      { icon: Database, label: 'Storage', path: '/pdf-hub' },
    ],
  },
];

// Sidebar Component
const Sidebar = () => {
  const { user, logout } = useAuth();
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'IR';

  return (
    <div className="h-full flex flex-col py-6 px-4 select-none">
      <div className="flex items-center gap-3 px-2 mb-6 shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 shrink-0">
          <img src="/favicon.svg" alt="logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Student OS
          </h1>
          <p className="text-[10px] text-text-secondary tracking-wide uppercase font-extrabold">
            Academic OS Hub
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 scrollbar-thin pr-1 py-2">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-xs font-bold ${
                isActive
                  ? 'bg-primary/10 text-primary font-extrabold'
                  : 'text-text-secondary hover:bg-dark-surface/50 hover:text-text-primary'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={16} className="group-hover:scale-110 transition-transform" />
              <span>{item.label}</span>
            </div>
          </NavLink>
        ))}

        <div className="h-px bg-dark-border/30 my-3 shrink-0" />

        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-xs font-bold ${
                isActive
                  ? 'bg-primary/10 text-primary font-extrabold'
                  : 'text-text-secondary hover:bg-dark-surface/50 hover:text-text-primary'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={16} className="group-hover:scale-110 transition-transform" />
              <span>{item.label}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 px-2 shrink-0 border-t border-dark-border/40">
        <div className="glass-card p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center shadow-md shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-extrabold text-[10px] font-mono">{initials}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-text-primary">
                {user?.fullName || 'Student'}
              </p>
              <p className="text-[8px] text-text-secondary truncate uppercase font-extrabold tracking-wide">
                {user?.branch || 'CSE'} • Year {user?.year || '1'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              toast.success('Signed out successfully!');
            }}
            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0"
            title="Sign Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Bottom Nav
const MobileBottomNav = () => {
  // Stubs for unread notifications count, in real code this can be bound
  const unreadCount = 0;

  return (
    <div className="bg-dark-surface/90 backdrop-blur-md border-t border-dark-border/50 px-6 py-3 flex justify-between items-center pb-safe">
      {mobileBottomNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-2 rounded-xl transition-all duration-300 relative ${isActive ? 'bg-primary/20' : 'bg-transparent'}`}>
                <item.icon
                  size={20}
                  className={`transition-transform duration-300 ${isActive ? 'scale-115' : ''}`}
                />
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

// Mobile Sidebar Drawer
const MobileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'IR';
  
  const [accordionState, setAccordionState] = useState({
    academic: true,
    pdf_workspace: false,
    tools: false,
    productivity: false,
    settings: false,
  });

  const toggleAccordion = (id) => {
    setAccordionState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md md:hidden"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0c0d12]/95 border-r border-dark-border/50 text-text-primary flex flex-col p-5 shadow-2xl md:hidden glass-card select-none"
          >
            <div className="flex justify-between items-center pb-4 border-b border-dark-border/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                  <BookOpen size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Student OS
                  </h2>
                  <p className="text-[9px] text-text-secondary">Academic Productivity Hub</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-dark-surface border border-dark-border text-text-secondary hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 scrollbar-thin">
              {sidebarAccordionSections.map((section) => {
                const isSectionOpen = accordionState[section.id];
                return (
                  <div key={section.id} className="space-y-1.5">
                    <button
                      onClick={() => toggleAccordion(section.id)}
                      className="w-full flex justify-between items-center text-[10px] font-extrabold text-text-secondary hover:text-white uppercase tracking-wider py-1 px-1 transition-colors"
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 transform ${isSectionOpen ? 'rotate-180 text-primary' : ''}`}
                      />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isSectionOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-0.5 pl-1.5 border-l border-dark-border/20"
                        >
                          {section.items.map((item) => (
                            <NavLink
                              key={item.label}
                              to={item.path}
                              onClick={(e) => {
                                onClose();
                                if (item.toolId) {
                                  e.preventDefault();
                                  navigate(`/pdf-hub?tool=${item.toolId}`);
                                }
                              }}
                              className={({ isActive }) => `
                                flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all relative group
                                ${isActive ? 'bg-primary/10 text-primary font-extrabold border-l-2 border-primary' : 'text-text-secondary hover:bg-dark-surface/40 hover:text-text-primary'}
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon size={14} className="group-hover:scale-105 transition-transform" />
                                <span>{item.label}</span>
                              </div>
                              {item.isNew && (
                                <span className="text-[8px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full shadow-lg shadow-primary/20 animate-pulse">
                                  NEW
                                </span>
                              )}
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-dark-border/40 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center shadow-md">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-extrabold text-[10px] font-mono">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">{user?.fullName || 'Student'}</p>
                  <p className="text-[8px] text-text-secondary uppercase tracking-wider font-extrabold text-left">
                    {user?.branch || 'CSE'} • Year {user?.year || '1'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  logout();
                  toast.success('Signed out successfully!');
                }}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
              >
                <LogOut size={13} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main Layout Wrapper
export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'IR';

  // Support mobile back button and deep-link hooks if needed.
  useEffect(() => {
    const handleBackButton = (e) => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        e.detail.handled = true;
      }
    };
    window.addEventListener('sos-back-button', handleBackButton);
    return () => {
      window.removeEventListener('sos-back-button', handleBackButton);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen bg-dark-bg text-text-primary overflow-hidden relative">
      {/* Swipe support area for mobile drawer */}
      <div
        onTouchStart={(e) => {
          window._swipeStartX = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (window._swipeStartX !== undefined && e.touches[0].clientX - window._swipeStartX > 50) {
            setMobileMenuOpen(true);
            window._swipeStartX = undefined;
          }
        }}
        onTouchEnd={() => {
          window._swipeStartX = undefined;
        }}
        className="md:hidden fixed top-0 left-0 bottom-0 w-4 z-40 bg-transparent cursor-pointer"
        title="Swipe right to open menu"
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 border-r border-dark-border/50 bg-dark-surface/30">
        <Sidebar />
      </div>

      {/* Main Container */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 pb-16 md:pb-0 ${location.pathname === '/community' ? 'pt-0' : 'pt-16'} md:pt-0`}>
        {/* Mobile Header */}
        {location.pathname !== '/community' && (
          <div className="md:hidden fixed top-0 left-0 right-0 pt-safe pb-3 border-b border-dark-border/40 bg-dark-bg/60 backdrop-blur-md z-40 flex items-center justify-between px-4 select-none">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-dark-surface border border-dark-border text-text-secondary hover:text-white transition-all active:scale-95"
              title="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-primary animate-pulse" />
              <span className="font-extrabold text-xs tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Student OS
              </span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 border border-dark-border shadow-md flex items-center justify-center overflow-hidden hover:scale-105 transition-transform active:scale-95 cursor-pointer shrink-0"
              title="View Profile Settings"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-extrabold text-white font-mono">{initials}</span>
              )}
            </button>
          </div>
        )}

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden h-full">
          <Outlet />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Layout;
