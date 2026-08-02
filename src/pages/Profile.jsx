import React, { useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Camera,
  Settings,
  Mail,
  Phone,
  MapPin,
  Globe,
  CircleCheck,
  FileCode,
  User,
  Image,
  Video,
  Send,
  MessageCircle,
  HelpCircle,
  LogOut,
  Loader2,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  BookOpen
} from 'lucide-react';

const Profile = () => {
  const { user, API, updateProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max photo size is 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const { data } = await API.post('/community/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data && data.url) {
        await updateProfile({ avatar: data.url });
        toast.success('Profile photo updated! ✨');
      }
    } catch (err) {
      console.error(err);
      toast.error('Photo upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Max cover size is 8MB');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingCover(true);
    try {
      const { data } = await API.post('/community/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data && data.url) {
        await updateProfile({ coverPhoto: data.url });
        toast.success('Cover photo updated! 🌅');
      }
    } catch (err) {
      console.error(err);
      toast.error('Cover upload failed');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarInitials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 'teacher': return 'Teacher';
      case 'professor': return 'Professor';
      case 'job_seeker': return 'Job Seeker';
      case 'professional': return 'Professional';
      default: return 'Student';
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'teacher': return '👨🏫';
      case 'professor': return '🎓';
      case 'job_seeker': return '💼';
      case 'professional': return '👨💻';
      default: return '🎓';
    }
  };

  const opps = user?.openToOpportunities || {};
  const enabledOpps = [
    { key: 'internships', label: 'Internships' },
    { key: 'teamMembers', label: 'Team Members' },
    { key: 'hackathons', label: 'Hackathons' },
    { key: 'freelance', label: 'Freelance' },
    { key: 'mentoring', label: 'Mentoring' },
    { key: 'projectCollaborators', label: 'Collaborations' },
    { key: 'studyPartners', label: 'Study Partners' },
    { key: 'placementGroups', label: 'Placement Prep' }
  ].filter(o => opps[o.key]);

  const customs = opps.custom || [];

  return (
    <div className="p-4 pb-28 md:p-8 md:pb-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">My Profile</h1>
          <p className="text-[10px] text-text-secondary mt-0.5 font-bold uppercase tracking-wider">Your premium identity inside Student OS</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:border-purple-500/40 hover:bg-purple-600/10 transition-all cursor-pointer"
          title="Edit Profile Settings"
        >
          <Settings size={18} className="text-purple-400" />
        </button>
      </div>

      {/* Main Profile Showcase Card */}
      <div className="glass-card overflow-hidden relative shadow-2xl shadow-purple-950/20">
        {/* Cover Photo */}
        <div className="h-44 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 relative group">
          {user?.coverPhoto ? (
            <img src={user.coverPhoto} className="w-full h-full object-cover" alt="cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold uppercase tracking-wider text-xs">
              🌅 No cover image uploaded
            </div>
          )}
          <div className="absolute inset-0 bg-black/35 transition-all group-hover:bg-black/50" />
          
          {/* Cover Edit Button */}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/85 text-white border border-white/10 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer z-10"
          >
            {isUploadingCover ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Camera size={12} className="text-purple-300" />
            )}
            <span>Cover Photo</span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        {/* Avatar & User Core Details */}
        <div className="px-6 pb-6 relative">
          <div className="flex items-end justify-between -mt-12 mb-5">
            <div className="relative group/avatar">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-4 border-[#0b0714] flex items-center justify-center text-white font-black text-2xl shadow-xl overflow-hidden bg-dark-surface">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  avatarInitials
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shadow-lg border-2 border-[#0b0714] hover:scale-110 transition-all cursor-pointer"
                title="Change Avatar"
              >
                {isUploading ? (
                  <Loader2 size={12} className="text-white animate-spin" />
                ) : (
                  <Camera size={12} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/35 text-purple-300 rounded-xl text-[9px] font-black uppercase tracking-wider">
                {getAccountTypeIcon(user?.accountType)} {getAccountTypeLabel(user?.accountType)}
              </span>
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
              >
                Edit Details
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-black text-white">{user?.fullName || 'Student OS Member'}</h3>
              <CircleCheck size={15} className="text-blue-400 fill-blue-400/15" />
            </div>
            <p className="text-xs text-text-secondary">
              @{user?.username || 'student'} 
              {user?.location && ` • 📍 ${user.location}`}
              {(user?.country || user?.city) && ` • 🗺️ ${[user.city, user.state, user.country].filter(Boolean).join(', ')}`}
            </p>
            {user?.bio && (
              <p className="text-xs text-text-secondary leading-relaxed pt-2 italic font-medium">"{user.bio}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Gamification Streak & Focus Cards */}
      {(user?.studyStreak > 0 || user?.totalFocusMinutes > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center bg-white/5 border border-white/5 flex items-center justify-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-black text-orange-400 text-left">{user.studyStreak} Days</p>
              <p className="text-[8px] text-text-secondary font-bold uppercase tracking-wider text-left">Study Streak</p>
            </div>
          </div>
          <div className="glass-card p-4 text-center bg-white/5 border border-white/5 flex items-center justify-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm font-black text-purple-400 text-left">{user.totalFocusMinutes} Mins</p>
              <p className="text-[8px] text-text-secondary font-bold uppercase tracking-wider text-left">Focus Hours</p>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Information Sections */}
      {/* 1. STUDENT ACADEMIC INFO */}
      {user?.accountType === 'student' && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
            <GraduationCap size={12} /> Education Details
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Level of Study</p>
              <p className="font-bold text-white">{user.educationLevel || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">College / School Name</p>
              <p className="font-bold text-white">{user.collegeName || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">University / Board</p>
              <p className="font-bold text-white">{user.universityBoard || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Branch / Stream</p>
              <p className="font-bold text-white">{user.branch || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Academic Code</p>
              <p className="font-bold text-white">
                {user.year ? `Year ${user.year}` : ''} {user.semester ? `• Sem ${user.semester}` : ''} {user.rollNumber ? `(${user.rollNumber})` : ''}
                {(!user.year && !user.semester && !user.rollNumber) && 'Not Specified'}
              </p>
            </div>
            {user.cgpaPercentage && (
              <div className="space-y-0.5">
                <p className="text-[9px] text-text-secondary uppercase">CGPA / Percentage</p>
                <p className="font-bold text-white">{user.cgpaPercentage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TEACHER INFO */}
      {user?.accountType === 'teacher' && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
            <Award size={12} /> Teaching Credentials
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">School / College Name</p>
              <p className="font-bold text-white">{user.institution || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Department</p>
              <p className="font-bold text-white">{user.department || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Subjects Teaching</p>
              <p className="font-bold text-white">{user.subjectsTeaching || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Qualification</p>
              <p className="font-bold text-white">{user.qualification || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Experience</p>
              <p className="font-bold text-white">{user.experienceYears ? `${user.experienceYears} Years` : 'Not Specified'}</p>
            </div>
            {user.officeLocation && (
              <div className="space-y-0.5">
                <p className="text-[9px] text-text-secondary uppercase">Office Location</p>
                <p className="font-bold text-white">{user.officeLocation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PROFESSOR INFO */}
      {user?.accountType === 'professor' && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
            <Award size={12} /> Academic Professor Details
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">University</p>
              <p className="font-bold text-white">{user.institution || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Department</p>
              <p className="font-bold text-white">{user.department || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Research Area</p>
              <p className="font-bold text-white">{user.researchArea || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Subjects Teaching</p>
              <p className="font-bold text-white">{user.subjectsTeaching || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Qualification</p>
              <p className="font-bold text-white">{user.qualification || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Experience</p>
              <p className="font-bold text-white">{user.experienceYears ? `${user.experienceYears} Years` : 'Not Specified'}</p>
            </div>
            {user.publications && (
              <div className="space-y-0.5 col-span-2">
                <p className="text-[9px] text-text-secondary uppercase">Publications</p>
                <p className="font-bold text-white whitespace-pre-wrap">{user.publications}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. JOB SEEKER INFO */}
      {user?.accountType === 'job_seeker' && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <Briefcase size={12} /> Career Portfolio
            </p>
            {user.openToWork && (
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[7px] font-black uppercase tracking-wider animate-pulse">
                🟢 Open to Work
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Current Status</p>
              <p className="font-bold text-white">{user.jobStatus || 'Looking for Opportunities'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Highest Qualification</p>
              <p className="font-bold text-white">{user.highestQualification || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Preferred Role</p>
              <p className="font-bold text-white">{user.preferredJobRole || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Preferred Location</p>
              <p className="font-bold text-white">{user.preferredLocation || 'Not Specified'}</p>
            </div>
            {user.expectedSalary && (
              <div className="space-y-0.5">
                <p className="text-[9px] text-text-secondary uppercase">Expected Salary</p>
                <p className="font-bold text-white">{user.expectedSalary}</p>
              </div>
            )}
            <div className="space-y-0.5 flex items-center col-span-2 mt-1">
              {user.resumeUrl ? (
                <a
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all w-full text-center"
                >
                  📄 View CV Resume PDF
                </a>
              ) : (
                <p className="text-[9px] text-text-secondary italic">No resume PDF uploaded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. PROFESSIONAL INFO */}
      {user?.accountType === 'professional' && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <Briefcase size={12} /> Work Profile
            </p>
            {user.openToMentor && (
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/25 text-purple-300 rounded text-[7px] font-black uppercase tracking-wider">
                🎓 Willing to Mentor Students
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Company Name</p>
              <p className="font-bold text-white">{user.companyName || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Job Title</p>
              <p className="font-bold text-white">{user.jobTitle || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Industry</p>
              <p className="font-bold text-white">{user.industry || 'Not Specified'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-text-secondary uppercase">Experience</p>
              <p className="font-bold text-white">{user.experienceYears ? `${user.experienceYears} Years` : 'Not Specified'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Social and Professional Contacts links */}
      {(() => {
        const links = [
          { key: 'websiteUrl', val: user?.websiteUrl, icon: Globe, label: 'Website', color: 'text-blue-400' },
          { key: 'githubUrl', val: user?.githubUrl, icon: FileCode, label: 'GitHub', color: 'text-purple-400' },
          { key: 'linkedinUrl', val: user?.linkedinUrl, icon: User, label: 'LinkedIn', color: 'text-indigo-400' },
          { key: 'instagramUrl', val: user?.instagramUrl, icon: Image, label: 'Instagram', color: 'text-pink-400' },
          { key: 'youtubeUrl', val: user?.youtubeUrl, icon: Video, label: 'YouTube', color: 'text-red-400' },
          { key: 'telegramUrl', val: user?.telegramUrl, icon: Send, label: 'Telegram', color: 'text-sky-400' }
        ].filter(link => link.val);

        if (links.length === 0 && !user?.email && !user?.mobileNumber && !user?.language) return null;

        return (
          <div className="glass-card p-5 space-y-4">
            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <Layers size={12} /> Contact & Socials
            </p>
            
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.key}
                      href={link.val}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary transition-all hover:bg-white/10 hover:scale-105 ${link.color}`}
                      title={link.label}
                    >
                      <Icon size={15} />
                    </a>
                  );
                })}
              </div>
            )}

            {(user?.email || user?.mobileNumber || user?.language) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-text-secondary font-bold">
                {user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={11} className="text-purple-400" />
                    <span className="text-white">{user.email}</span>
                  </div>
                )}
                {user?.mobileNumber && (
                  <div className="flex items-center gap-2">
                    <Phone size={11} className="text-purple-400" />
                    <span className="text-white">{user.mobileNumber}</span>
                  </div>
                )}
                {(user?.language || user?.timezone) && (
                  <div className="flex items-center gap-2">
                    <Globe size={11} className="text-purple-400" />
                    <span className="text-white">
                      {user.language || 'English'} {user.timezone ? `(${user.timezone})` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Open to Opportunities Section */}
      {(enabledOpps.length > 0 || customs.length > 0) && (
        <div className="glass-card p-5 space-y-3">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
            <Briefcase size={12} /> Open to Opportunities
          </p>
          <div className="flex flex-wrap gap-2">
            {enabledOpps.map((opp) => (
              <span key={opp.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/25 rounded-full text-[9px] font-black text-green-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>{opp.label}</span>
              </span>
            ))}
            {customs.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/25 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {user?.skills && user.skills.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
            <BookOpen size={12} /> Tech Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((skill, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-purple-500/15 border border-purple-500/25 text-purple-300 rounded-xl text-[10px] font-bold">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Support and Logout Actions */}
      <div className="space-y-3">
        <div className="glass-card p-4 flex items-center justify-between border-dark-border bg-white/5">
          <div className="flex items-center gap-3">
            <HelpCircle size={18} className="text-text-secondary" />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Support Channel</p>
              <p className="text-[9px] text-text-secondary mt-0.5 font-bold uppercase">Reach out at support@studentos.app</p>
            </div>
          </div>
          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">v2.0.0</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full glass-card p-4 flex items-center gap-3 bg-red-500/5 hover:bg-red-500/15 border border-red-500/15 transition-all text-left cursor-pointer"
        >
          <LogOut size={18} className="text-red-400" />
          <span className="text-xs font-black text-red-400 uppercase tracking-wider">Log Out of Student OS</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;