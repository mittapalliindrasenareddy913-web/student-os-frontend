import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGoogleClientId } from '../utils/googleAuth';
import toast from 'react-hot-toast';
import {
  User,
  BookOpen,
  Share2,
  Lock,
  LogOut,
  Moon,
  Smartphone,
  HelpCircle,
  Camera,
  Globe,
  Loader2,
  Sparkles,
  Link2
} from 'lucide-react';

const getInputClassName = (hasError) => {
  return `w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-xs transition-all outline-none focus:ring-1 placeholder:text-text-secondary/40 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
      : 'border-white/5 focus:border-primary focus:ring-primary/20'
  }`;
};

const Settings = () => {
  const { user, updateProfile, logout, API, linkCollegeAccount } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'personal';
  }); // 'personal', 'academic', 'social', 'visibility', 'connections'
  const [loading, setLoading] = useState(false);

  const [customOpportunityText, setCustomOpportunityText] = useState('');
  const [cropPreview, setCropPreview] = useState(null); // { file, url, type }
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const cropAndCompressImage = (file, width, height) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const sourceAspect = img.width / img.height;
        const targetAspect = width / height;
        let sx, sy, sWidth, sHeight;
        
        if (sourceAspect > targetAspect) {
          sHeight = img.height;
          sWidth = img.height * targetAspect;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = img.width / targetAspect;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(croppedFile);
        }, 'image/jpeg', 0.85);
      };
    });
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropPreview({ file, url, type });
  };

  const handleUploadConfirm = async () => {
    if (!cropPreview) return;
    setIsUploadingFile(true);
    try {
      // 1. Crop and compress in browser
      const targetW = cropPreview.type === 'avatar' ? 500 : 1200;
      const targetH = cropPreview.type === 'avatar' ? 500 : 400;
      const compressed = await cropAndCompressImage(cropPreview.file, targetW, targetH);

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', compressed);
      const { data } = await API.post('/community/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data && data.url) {
        setForm(prev => ({ ...prev, [cropPreview.type]: data.url }));
        toast.success(`${cropPreview.type === 'avatar' ? 'Profile' : 'Cover'} photo uploaded successfully!`);
      } else {
        toast.error('Upload failed. Try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setIsUploadingFile(false);
      setCropPreview(null);
    }
  };

  const handleResumeSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF document.');
      return;
    }
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await API.post('/community/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data && data.url) {
        setForm(prev => ({ ...prev, resumeUrl: data.url }));
        toast.success('Resume uploaded successfully!');
      }
    } catch {
      toast.error('Resume upload failed.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleLinkCollege = async (e) => {
    e.preventDefault();
    if (!linkCollegeCode.trim() || !linkRollNumber.trim() || !linkPassword) {
      toast.error('All fields are required.');
      return;
    }

    setIsLinking(true);
    const res = await linkCollegeAccount(linkCollegeCode, linkRollNumber, linkPassword);
    setIsLinking(false);

    if (res.ok) {
      toast.success('College Account linked successfully! Academic features unlocked. 🚀');
      setLinkCollegeCode('');
      setLinkRollNumber('');
      setLinkPassword('');
    } else {
      toast.error(res.message || 'Linking failed. Verify your credentials.');
    }
  };


  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    mobileNumber: '',
    bio: '',
    dateOfBirth: '',
    gender: 'Prefer Not To Say',
    avatar: '',
    coverPhoto: '',
    collegeName: '',
    branch: '',
    year: '',
    semester: '',
    rollNumber: '',
    skills: '',
    interests: '',
    location: '',
    accountType: 'student',
    educationLevel: '',
    institution: '',
    department: '',
    subjectsTeaching: '',
    experienceYears: 0,
    qualification: '',
    jobStatus: '',
    resumeUrl: '',
    preferredJobRole: '',
    preferredLocation: '',
    openToWork: false,
    country: '',
    state: '',
    city: '',
    language: 'English',
    timezone: '',
    universityBoard: '',
    cgpaPercentage: '',
    officeLocation: '',
    researchArea: '',
    publications: '',
    highestQualification: '',
    expectedSalary: '',
    companyName: '',
    jobTitle: '',
    industry: '',
    openToMentor: false,
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    websiteUrl: '',
    instagramUrl: '',
    xUrl: '',
    youtubeUrl: '',
    telegramUrl: '',
    visibilitySettings: {
      email: 'public',
      mobileNumber: 'followers',
      location: 'public',
      githubUrl: 'public',
      linkedinUrl: 'public',
      portfolioUrl: 'public',
      websiteUrl: 'public',
      instagramUrl: 'public',
      xUrl: 'public',
      youtubeUrl: 'public',
      telegramUrl: 'public'
    },
    openToOpportunities: {
      internships: false,
      teamMembers: false,
      hackathons: false,
      freelance: false,
      mentoring: false,
      projectCollaborators: false,
      studyPartners: false,
      placementGroups: false,
      custom: []
    },
    timeFormat: localStorage.getItem('sos_time_format') || '12h'
  });

  const [linkCollegeCode, setLinkCollegeCode] = useState('');
  const [linkRollNumber, setLinkRollNumber] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [showLinkPassword, setShowLinkPassword] = useState(false);


  // Sync state from user context on load
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || 'Prefer Not To Say',
        avatar: user.avatar || '',
        coverPhoto: user.coverPhoto || '',
        collegeName: user.collegeName || '',
        branch: user.branch || '',
        year: user.year || '',
        semester: user.semester || '',
        rollNumber: user.rollNumber || '',
        skills: user.skills ? user.skills.join(', ') : '',
        interests: user.interests ? user.interests.join(', ') : '',
        location: user.location || '',
        accountType: user.accountType || 'student',
        educationLevel: user.educationLevel || '',
        institution: user.institution || '',
        department: user.department || '',
        subjectsTeaching: user.subjectsTeaching || '',
        experienceYears: user.experienceYears || 0,
        qualification: user.qualification || '',
        jobStatus: user.jobStatus || '',
        resumeUrl: user.resumeUrl || '',
        preferredJobRole: user.preferredJobRole || '',
        preferredLocation: user.preferredLocation || '',
        openToWork: user.openToWork || false,
        country: user.country || '',
        state: user.state || '',
        city: user.city || '',
        language: user.language || 'English',
        timezone: user.timezone || '',
        universityBoard: user.universityBoard || '',
        cgpaPercentage: user.cgpaPercentage || '',
        officeLocation: user.officeLocation || '',
        researchArea: user.researchArea || '',
        publications: user.publications || '',
        highestQualification: user.highestQualification || '',
        expectedSalary: user.expectedSalary || '',
        companyName: user.companyName || '',
        jobTitle: user.jobTitle || '',
        industry: user.industry || '',
        openToMentor: user.openToMentor || false,
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        websiteUrl: user.websiteUrl || '',
        instagramUrl: user.instagramUrl || '',
        xUrl: user.xUrl || '',
        youtubeUrl: user.youtubeUrl || '',
        telegramUrl: user.telegramUrl || '',
        visibilitySettings: {
          email: user.visibilitySettings?.email || 'public',
          mobileNumber: user.visibilitySettings?.mobileNumber || 'followers',
          location: user.visibilitySettings?.location || 'public',
          githubUrl: user.visibilitySettings?.githubUrl || 'public',
          linkedinUrl: user.visibilitySettings?.linkedinUrl || 'public',
          portfolioUrl: user.visibilitySettings?.portfolioUrl || 'public',
          websiteUrl: user.visibilitySettings?.websiteUrl || 'public',
          instagramUrl: user.visibilitySettings?.instagramUrl || 'public',
          xUrl: user.visibilitySettings?.xUrl || 'public',
          youtubeUrl: user.visibilitySettings?.youtubeUrl || 'public',
          telegramUrl: user.visibilitySettings?.telegramUrl || 'public'
        },
        openToOpportunities: {
          internships: user.openToOpportunities?.internships || false,
          teamMembers: user.openToOpportunities?.teamMembers || false,
          hackathons: user.openToOpportunities?.hackathons || false,
          freelance: user.openToOpportunities?.freelance || false,
          mentoring: user.openToOpportunities?.mentoring || false,
          projectCollaborators: user.openToOpportunities?.projectCollaborators || false,
          studyPartners: user.openToOpportunities?.studyPartners || false,
          placementGroups: user.openToOpportunities?.placementGroups || false,
          custom: user.openToOpportunities?.custom || []
        },
        timeFormat: localStorage.getItem('sos_time_format') || '12h'
      });
    }
  }, [user]);

  const handleInputChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleVisibilityChange = (field, val) => {
    setForm((prev) => ({
      ...prev,
      visibilitySettings: {
        ...prev.visibilitySettings,
        [field]: val
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      toast.error('Invalid email address format.');
      setLoading(false);
      return;
    }

    // Phone number validation
    if (form.mobileNumber) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(form.mobileNumber.replace(/\s+/g, ''))) {
        toast.error('Invalid phone number (must be 10-15 digits).');
        setLoading(false);
        return;
      }
    }

    // URLs validation
    const urlFields = [
      { key: 'githubUrl', label: 'GitHub' },
      { key: 'linkedinUrl', label: 'LinkedIn' },
      { key: 'portfolioUrl', label: 'Portfolio Website' },
      { key: 'websiteUrl', label: 'Personal Website' },
      { key: 'instagramUrl', label: 'Instagram' },
      { key: 'xUrl', label: 'X (Twitter)' },
      { key: 'youtubeUrl', label: 'YouTube' },
      { key: 'telegramUrl', label: 'Telegram' }
    ];

    const parsedUrls = {};
    for (let f of urlFields) {
      const rawVal = form[f.key];
      if (rawVal && rawVal.trim()) {
        let cleanVal = rawVal.trim();
        if (!/^https?:\/\//i.test(cleanVal)) {
          cleanVal = 'https://' + cleanVal;
        }
        try {
          new URL(cleanVal);
          parsedUrls[f.key] = cleanVal;
        } catch (err) {
          toast.error(`Invalid URL format for ${f.label}.`);
          setLoading(false);
          return;
        }
      } else {
        parsedUrls[f.key] = '';
      }
    }

    // Dynamic field validation on Frontend
    if (form.accountType === 'student') {
      if (!form.educationLevel) {
        toast.error('Education Level is required for Student profiles.');
        setLoading(false);
        return;
      }
      if (!form.collegeName) {
        toast.error('College / School Name is required for Student profiles.');
        setLoading(false);
        return;
      }
      if (!form.branch) {
        toast.error('Branch / Stream is required for Student profiles.');
        setLoading(false);
        return;
      }
    } else if (form.accountType === 'teacher') {
      if (!form.institution) {
        toast.error('School / College Name is required for Teacher profiles.');
        setLoading(false);
        return;
      }
      if (!form.department) {
        toast.error('Department is required for Teacher profiles.');
        setLoading(false);
        return;
      }
      if (!form.subjectsTeaching) {
        toast.error('Subjects Teaching is required for Teacher profiles.');
        setLoading(false);
        return;
      }
      if (!form.qualification) {
        toast.error('Qualification is required for Teacher profiles.');
        setLoading(false);
        return;
      }
      if (form.experienceYears === undefined || form.experienceYears === '') {
        toast.error('Experience (Years) is required for Teacher profiles.');
        setLoading(false);
        return;
      }
    } else if (form.accountType === 'professor') {
      if (!form.institution) {
        toast.error('University is required for Professor profiles.');
        setLoading(false);
        return;
      }
      if (!form.department) {
        toast.error('Department is required for Professor profiles.');
        setLoading(false);
        return;
      }
      if (!form.researchArea) {
        toast.error('Research Area is required for Professor profiles.');
        setLoading(false);
        return;
      }
      if (!form.subjectsTeaching) {
        toast.error('Subjects Teaching is required for Professor profiles.');
        setLoading(false);
        return;
      }
      if (!form.qualification) {
        toast.error('Qualification is required for Professor profiles.');
        setLoading(false);
        return;
      }
      if (form.experienceYears === undefined || form.experienceYears === '') {
        toast.error('Experience (Years) is required for Professor profiles.');
        setLoading(false);
        return;
      }
    } else if (form.accountType === 'job_seeker') {
      if (!form.jobStatus) {
        toast.error('Current Status is required for Job Seeker profiles.');
        setLoading(false);
        return;
      }
      if (!form.highestQualification) {
        toast.error('Highest Qualification is required for Job Seeker profiles.');
        setLoading(false);
        return;
      }
      if (!form.preferredJobRole) {
        toast.error('Preferred Job Role is required for Job Seeker profiles.');
        setLoading(false);
        return;
      }
      if (!form.preferredLocation) {
        toast.error('Preferred Location is required for Job Seeker profiles.');
        setLoading(false);
        return;
      }
    } else if (form.accountType === 'professional') {
      if (!form.companyName) {
        toast.error('Company Name is required for Professional profiles.');
        setLoading(false);
        return;
      }
      if (!form.jobTitle) {
        toast.error('Job Title is required for Professional profiles.');
        setLoading(false);
        return;
      }
      if (!form.industry) {
        toast.error('Industry is required for Professional profiles.');
        setLoading(false);
        return;
      }
      if (form.experienceYears === undefined || form.experienceYears === '') {
        toast.error('Experience (Years) is required for Professional profiles.');
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...form,
      ...parsedUrls,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      interests: form.interests ? form.interests.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    if (form.timeFormat) {
      localStorage.setItem('sos_time_format', form.timeFormat);
    }
    try {
      const res = await updateProfile(payload);
      if (res.ok) {
        toast.success('Profile settings updated successfully!');
      } else {
        toast.error(res.message || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  // Google GSI for connecting Google account in Settings
  useEffect(() => {
    if (activeTab !== 'connections' || user?.isGoogleLinked) return;
    const initGoogle = () => {
      if (typeof window.google !== 'undefined') {
        try {
          window.google.accounts.id.initialize({
            client_id: getGoogleClientId(),
            callback: async (response) => {
              toast.loading('Connecting Google account...');
              try {
                await API.post('/auth/connect-google', { token: response.credential });
                toast.dismiss();
                toast.success('Google Account connected! ✅');
                window.location.reload();
              } catch (err) {
                toast.dismiss();
                toast.error(err?.response?.data?.message || 'Failed to connect Google account.');
              }
            }
          });
          const el = document.getElementById('google-connect-settings');
          if (el) {
            window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 220 });
          }
        } catch (err) {
          console.error('GSI init error:', err);
        }
      }
    };
    if (typeof window.google === 'undefined') {
      setTimeout(initGoogle, 800);
    } else {
      initGoogle();
    }
  }, [activeTab, user, API]);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Settings</h1>
          <p className="text-[10px] text-text-secondary mt-0.5 font-bold uppercase tracking-wider">Configure your unified Student OS profile and accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0 border-b border-purple-500/10 md:border-b-0">
          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'academic', label: 'Academic Info', icon: BookOpen },
            { id: 'social', label: 'Social & Professional', icon: Share2 },
            { id: 'visibility', label: 'Contact & Visibility', icon: Lock },
            { id: 'opportunities', label: 'Opportunities', icon: Sparkles },
            { id: 'connections', label: 'Connected Accounts', icon: Link2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider text-left transition-all border shrink-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-purple-600/15 border-purple-500/35 text-purple-300' 
                    : 'bg-white/5 border-transparent text-text-secondary hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content Area */}
        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="glass-card p-6 space-y-5">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest pb-1.5 border-b border-white/5">Personal Information</h2>
                
                {/* Images Upload Section */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Profile Assets</label>
                  
                  {/* Premium Layout: Cover photo card wrapper */}
                  <div className="relative w-full h-40 bg-purple-950/20 border border-white/5 rounded-2xl overflow-hidden group">
                    {form.coverPhoto ? (
                      <img src={form.coverPhoto} className="w-full h-full object-cover" alt="cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-1">
                        <Camera size={20} />
                        <span className="text-[8px] font-black uppercase tracking-wider">No Cover Uploaded</span>
                      </div>
                    )}
                    
                    {/* Hover actions panel for Cover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all backdrop-blur-sm">
                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all">
                        📸 Cover Gallery
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, 'coverPhoto')}
                          className="hidden"
                        />
                      </label>
                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all">
                        📷 Cover Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileSelect(e, 'coverPhoto')}
                          className="hidden"
                        />
                      </label>
                      {form.coverPhoto && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('coverPhoto', '')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Floating Avatar over Cover */}
                    <div className="absolute bottom-3 left-4 w-16 h-16 rounded-full border-2 border-purple-500 bg-[#0c0817] overflow-hidden shrink-0 flex items-center justify-center group/avatar">
                      {form.avatar ? (
                        <img src={form.avatar} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <User className="text-purple-400" size={24} />
                      )}
                      
                      {/* Avatar Overlay upload buttons */}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-1 transition-all">
                        <label className="text-[6px] text-white hover:text-purple-300 font-bold uppercase cursor-pointer">
                          Gallery
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'avatar')}
                            className="hidden"
                          />
                        </label>
                        <label className="text-[6px] text-white hover:text-purple-300 font-bold uppercase cursor-pointer">
                          Camera
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={(e) => handleFileSelect(e, 'avatar')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Type Selection */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Account Type *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'student', name: '🎓 Student', desc: 'Unified courses & campus groups' },
                      { id: 'teacher', name: '👨🏫 Teacher', desc: 'Notes sharing & academic mentoring' },
                      { id: 'professor', name: '🎓 Professor', desc: 'Research & advising' },
                      { id: 'job_seeker', name: '💼 Job Seeker', desc: 'Resume & placement prep' },
                      { id: 'professional', name: '👨💻 Professional', desc: 'Work profile & student mentoring' }
                    ].map((type) => {
                      const isSelected = form.accountType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleInputChange('accountType', type.id)}
                          className={`p-3 text-left border rounded-xl transition-all cursor-pointer flex flex-col justify-between h-20 ${
                            isSelected 
                              ? 'bg-purple-600/10 border-purple-500 shadow-lg shadow-purple-600/10' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <p className="text-[10px] font-black text-white leading-tight uppercase tracking-wider">{type.name}</p>
                          <p className="text-[7px] text-text-secondary mt-0.5 leading-relaxed">{type.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Basic Details Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Username</label>
                    <input
                      type="text"
                      required
                      value={form.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="e.g. johndoe_12"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Bio / Summary</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell other students about yourself, your career path, or interests..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* DOB & Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Date of Birth (Optional)</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Gender (Optional)</label>
                    <select
                      value={form.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer Not To Say">Prefer Not To Say</option>
                    </select>
                  </div>
                </div>

                {/* Location Fields (Worldwide Support) */}
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-widest">🌍 Location & Localization</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">Country</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="e.g. United States"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">State / Region</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="e.g. California"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="e.g. Stanford"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">Language</label>
                      <select
                        value={form.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Español</option>
                        <option value="French">Français</option>
                        <option value="German">Deutsch</option>
                        <option value="Japanese">日本語</option>
                        <option value="Hindi">हिन्दी</option>
                        <option value="Telugu">తెలుగు</option>
                        <option value="Chinese">中文</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">Timezone</label>
                      <input
                        type="text"
                        value={form.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        placeholder="e.g. UTC-8 / GMT+5:30"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">Time Format</label>
                      <select
                        value={form.timeFormat || '12h'}
                        onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                        className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'academic' && (
              <div className="space-y-6 transition-all duration-300 ease-in-out">
                <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest pb-1.5 border-b border-white/5">Academic & Career Profile</h2>
                
                {/* 1. STUDENT CONDITIONAL FIELDS */}
                {form.accountType === 'student' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Education Level *</label>
                        <select
                          value={form.educationLevel}
                          onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                          className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        >
                          <option value="">-- Select Level --</option>
                          {['Primary School', 'Middle School', 'High School', '9th Class', '10th Class', '11th Class', '12th Class', 'Intermediate', 'Diploma', 'ITI', 'Polytechnic', 'B.Tech', 'B.E.', 'BCA', 'MCA', 'MBA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'Medical', 'Law', 'PhD', 'Other'].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">College / School Name *</label>
                        <input
                          type="text"
                          value={form.collegeName}
                          onChange={(e) => handleInputChange('collegeName', e.target.value)}
                          placeholder="e.g. Stanford University"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">University / Board</label>
                        <input
                          type="text"
                          value={form.universityBoard}
                          onChange={(e) => handleInputChange('universityBoard', e.target.value)}
                          placeholder="e.g. CBSE / Stanford Board"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Branch / Stream *</label>
                        <input
                          type="text"
                          value={form.branch}
                          onChange={(e) => handleInputChange('branch', e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Year</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={form.year}
                          onChange={(e) => handleInputChange('year', e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Semester</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={form.semester}
                          onChange={(e) => handleInputChange('semester', e.target.value)}
                          placeholder="e.g. 4"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Student ID (Optional)</label>
                        <input
                          type="text"
                          value={form.studentId}
                          onChange={(e) => handleInputChange('studentId', e.target.value)}
                          placeholder="e.g. SOS-12345"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">CGPA / Percentage (Optional)</label>
                        <input
                          type="text"
                          value={form.cgpaPercentage}
                          onChange={(e) => handleInputChange('cgpaPercentage', e.target.value)}
                          placeholder="e.g. 9.2 or 92%"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TEACHER CONDITIONAL FIELDS */}
                {form.accountType === 'teacher' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">School / College Name *</label>
                        <input
                          type="text"
                          value={form.institution}
                          onChange={(e) => handleInputChange('institution', e.target.value)}
                          placeholder="e.g. Oxford Academic Center"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Department *</label>
                        <input
                          type="text"
                          value={form.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          placeholder="e.g. Mathematics Department"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Subjects Teaching *</label>
                        <input
                          type="text"
                          value={form.subjectsTeaching}
                          onChange={(e) => handleInputChange('subjectsTeaching', e.target.value)}
                          placeholder="e.g. Algebra, Calculus, geometry"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years) *</label>
                        <input
                          type="number"
                          value={form.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Qualification *</label>
                        <input
                          type="text"
                          value={form.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          placeholder="e.g. Master of Education"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Office Location (Optional)</label>
                        <input
                          type="text"
                          value={form.officeLocation}
                          onChange={(e) => handleInputChange('officeLocation', e.target.value)}
                          placeholder="e.g. Room 304, Block A"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PROFESSOR CONDITIONAL FIELDS */}
                {form.accountType === 'professor' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">University *</label>
                        <input
                          type="text"
                          value={form.institution}
                          onChange={(e) => handleInputChange('institution', e.target.value)}
                          placeholder="e.g. Stanford University"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Department *</label>
                        <input
                          type="text"
                          value={form.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          placeholder="e.g. Physics & Astronomy"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Research Area *</label>
                        <input
                          type="text"
                          value={form.researchArea}
                          onChange={(e) => handleInputChange('researchArea', e.target.value)}
                          placeholder="e.g. Quantum Computing / Astrophysics"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Subjects Teaching *</label>
                        <input
                          type="text"
                          value={form.subjectsTeaching}
                          onChange={(e) => handleInputChange('subjectsTeaching', e.target.value)}
                          placeholder="e.g. Quantum Physics, Relativity"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Qualification *</label>
                        <input
                          type="text"
                          value={form.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          placeholder="e.g. PhD in Quantum Physics"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years) *</label>
                        <input
                          type="number"
                          value={form.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Publications (Optional)</label>
                      <textarea
                        value={form.publications}
                        onChange={(e) => handleInputChange('publications', e.target.value)}
                        placeholder="List your key research papers or books..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* 4. JOB SEEKER CONDITIONAL FIELDS */}
                {form.accountType === 'job_seeker' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Current Status *</label>
                        <select
                          value={form.jobStatus}
                          onChange={(e) => handleInputChange('jobStatus', e.target.value)}
                          className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="">-- Select Status --</option>
                          <option value="Unemployed">Looking for Opportunity (Unemployed)</option>
                          <option value="Employed">Currently Employed</option>
                          <option value="Student">Fresher (Graduating Student)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Highest Qualification *</label>
                        <input
                          type="text"
                          value={form.highestQualification}
                          onChange={(e) => handleInputChange('highestQualification', e.target.value)}
                          placeholder="e.g. B.Tech / MBA / PhD"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Preferred Job Role *</label>
                        <input
                          type="text"
                          value={form.preferredJobRole}
                          onChange={(e) => handleInputChange('preferredJobRole', e.target.value)}
                          placeholder="e.g. React Native Engineer"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Preferred Location *</label>
                        <input
                          type="text"
                          value={form.preferredLocation}
                          onChange={(e) => handleInputChange('preferredLocation', e.target.value)}
                          placeholder="e.g. London / Remote"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years)</label>
                        <input
                          type="number"
                          value={form.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Expected Salary (Optional)</label>
                        <input
                          type="text"
                          value={form.expectedSalary}
                          onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                          placeholder="e.g. $80,000 / year"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Open To Work</label>
                        <button
                          type="button"
                          onClick={() => handleInputChange('openToWork', !form.openToWork)}
                          className={`w-full py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            form.openToWork 
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                              : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                          }`}
                        >
                          🟢 {form.openToWork ? 'Active (Open to Offers)' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    {/* Resume Upload (PDF) */}
                    <div className="glass-card p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">📄 Resume (PDF Material)</h4>
                        <p className="text-[9px] text-text-secondary mt-0.5">Provide recruiters with your CV PDF.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {form.resumeUrl ? (
                          <>
                            <a
                              href={form.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 text-purple-300 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                            >
                              View PDF
                            </a>
                            <button
                              type="button"
                              onClick={() => handleInputChange('resumeUrl', '')}
                              className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/35 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all">
                            📤 Upload Resume PDF
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleResumeSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. PROFESSIONAL CONDITIONAL FIELDS */}
                {form.accountType === 'professional' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Company Name *</label>
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="e.g. Google DeepMind"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Job Title *</label>
                        <input
                          type="text"
                          value={form.jobTitle}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          placeholder="e.g. Senior Staff Software Engineer"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Industry *</label>
                        <input
                          type="text"
                          value={form.industry}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                          placeholder="e.g. Artificial Intelligence / Tech"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years) *</label>
                        <input
                          type="number"
                          value={form.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Open To Mentor Students</label>
                      <button
                        type="button"
                        onClick={() => handleInputChange('openToMentor', !form.openToMentor)}
                        className={`w-full py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          form.openToMentor 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                            : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                        }`}
                      >
                        🎓 {form.openToMentor ? 'Active (Willing to Mentor)' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Common fields (Skills, Interests) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Skills (comma separated)</label>
                    <input
                      type="text"
                      value={form.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      placeholder="e.g. React, Node.js, Python"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Interests (comma separated)</label>
                    <input
                      type="text"
                      value={form.interests}
                      onChange={(e) => handleInputChange('interests', e.target.value)}
                      placeholder="e.g. Hackathons, Open Source, ML"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest pb-1.5 border-b border-white/5">Professional & Social Links</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">GitHub URL</label>
                    <input
                      type="text"
                      value={form.githubUrl}
                      onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">LinkedIn URL</label>
                    <input
                      type="text"
                      value={form.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Portfolio Website</label>
                    <input
                      type="text"
                      value={form.portfolioUrl}
                      onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                      placeholder="https://portfolio.com"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Personal Website</label>
                    <input
                      type="text"
                      value={form.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      placeholder="https://mywebsite.com"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Instagram URL</label>
                    <input
                      type="text"
                      value={form.instagramUrl}
                      onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">X (Twitter) URL</label>
                    <input
                      type="text"
                      value={form.xUrl}
                      onChange={(e) => handleInputChange('xUrl', e.target.value)}
                      placeholder="https://x.com/username"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">YouTube URL</label>
                    <input
                      type="text"
                      value={form.youtubeUrl}
                      onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                      placeholder="https://youtube.com/c/channelname"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Telegram URL</label>
                    <input
                      type="text"
                      value={form.telegramUrl}
                      onChange={(e) => handleInputChange('telegramUrl', e.target.value)}
                      placeholder="https://t.me/username"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'visibility' && (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest pb-1.5 border-b border-white/5">Contact Info & Visibility</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="name@college.edu"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      placeholder="e.g. +919876543210"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Location / City</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                  />
                </div>

                {/* Granular Visibility Selectors */}
                <div className="space-y-3.5 pt-3">
                  <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2.5">Granular Information Access Control</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { key: 'email', label: 'Email Address' },
                      { key: 'mobileNumber', label: 'Phone Number' },
                      { key: 'location', label: 'Location' },
                      { key: 'githubUrl', label: 'GitHub Link' },
                      { key: 'linkedinUrl', label: 'LinkedIn Link' },
                      { key: 'portfolioUrl', label: 'Portfolio Link' },
                      { key: 'websiteUrl', label: 'Personal Website' },
                      { key: 'instagramUrl', label: 'Instagram Profile' },
                      { key: 'xUrl', label: 'X (Twitter) Profile' },
                      { key: 'youtubeUrl', label: 'YouTube Channel' },
                      { key: 'telegramUrl', label: 'Telegram Username' }
                    ].map((item) => (
                      <div key={item.key} className="flex justify-between items-center bg-white/5 border border-white/5 px-3 py-2 rounded-2xl">
                        <span className="text-[10px] font-bold text-white">{item.label}</span>
                        <select
                          value={form.visibilitySettings[item.key] || 'public'}
                          onChange={(e) => handleVisibilityChange(item.key, e.target.value)}
                          className="bg-[#0b0714] border border-white/5 rounded-xl px-2.5 py-1.5 text-[9px] font-bold text-purple-300 focus:outline-none"
                        >
                          <option value="public">Public</option>
                          <option value="followers">Followers Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest pb-1.5 border-b border-white/5">🚀 Open to Opportunities</h2>
                <p className="text-[10px] text-text-secondary leading-relaxed font-bold uppercase tracking-wide">
                  Select which opportunities you are looking for so the community and classmates can find you.
                </p>

                {/* Standard Toggles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {[
                    { key: 'internships', label: 'Looking for Internships' },
                    { key: 'teamMembers', label: 'Looking for Team Members' },
                    { key: 'hackathons', label: 'Looking for Hackathons' },
                    { key: 'freelance', label: 'Available for Freelance' },
                    { key: 'mentoring', label: 'Open to Mentoring' },
                    { key: 'projectCollaborators', label: 'Looking for Project Collaborators' },
                    { key: 'studyPartners', label: 'Looking for Study Partners' },
                    { key: 'placementGroups', label: 'Looking for Placement Preparation Groups' }
                  ].map((opp) => {
                    const isEnabled = form.openToOpportunities[opp.key];
                    return (
                      <div
                        key={opp.key}
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            openToOpportunities: {
                              ...prev.openToOpportunities,
                              [opp.key]: !isEnabled
                            }
                          }));
                        }}
                        className={`p-4 bg-white/5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          isEnabled 
                            ? 'border-purple-500 bg-purple-600/5' 
                            : 'border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[11px] font-black text-white uppercase tracking-wider">{opp.label}</span>
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-purple-600' : 'bg-white/10'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Opportunities Tag builder */}
                <div className="space-y-2.5 pt-4">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Add Custom Opportunity (e.g. Looking for React Developer)</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customOpportunityText}
                      onChange={(e) => setCustomOpportunityText(e.target.value)}
                      placeholder="Type custom opportunity statement..."
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder-text-secondary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customOpportunityText.trim()) {
                            setForm(prev => ({
                              ...prev,
                              openToOpportunities: {
                                ...prev.openToOpportunities,
                                custom: [...prev.openToOpportunities.custom, customOpportunityText.trim()]
                              }
                            }));
                            setCustomOpportunityText('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customOpportunityText.trim()) {
                          setForm(prev => ({
                            ...prev,
                            openToOpportunities: {
                              ...prev.openToOpportunities,
                              custom: [...prev.openToOpportunities.custom, customOpportunityText.trim()]
                            }
                          }));
                          setCustomOpportunityText('');
                        }
                      }}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Render Custom Tags List */}
                  {form.openToOpportunities.custom.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {form.openToOpportunities.custom.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 font-extrabold text-[9px] uppercase tracking-wider rounded-full"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                openToOpportunities: {
                                  ...prev.openToOpportunities,
                                  custom: prev.openToOpportunities.custom.filter((_, i) => i !== idx)
                                }
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded-full bg-white/10 hover:bg-red-500 hover:text-white flex items-center justify-center text-[7px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>

            {activeTab === 'connections' && (
              <div className="space-y-6 transition-all duration-300 ease-in-out">
                <div>
                  <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest pb-1.5 border-b border-white/5">Connected Accounts</h2>
                  <p className="text-[9px] text-text-secondary uppercase mt-1">Manage linked third-party authentication services</p>
                </div>
                <div className="glass-card p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.04-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Google Account Authentication</h3>
                      <p className="text-[9px] text-text-secondary mt-0.5">
                        Status: {user?.isGoogleLinked ? <span className="text-emerald-400 font-bold">Connected</span> : <span className="text-red-400 font-bold">Not Connected</span>}
                      </p>
                    </div>
                  </div>
                  <div>
                    {user?.isGoogleLinked ? (
                      <div className="px-4 py-2 border border-emerald-500/25 bg-emerald-600/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block" />
                        Google Connected
                      </div>
                    ) : (
                      <div className="relative w-full overflow-hidden rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer shadow-lg shadow-purple-600/10 transition-all active:scale-[.98]">
                        <button
                          type="button"
                          className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center gap-1.5 pointer-events-none px-4 py-2.5"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.04-.63z"/>
                            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span>Connect Google Account</span>
                        </button>
                        <div
                          id="google-connect-settings"
                          className="opacity-0 w-full pointer-events-auto"
                          style={{ minHeight: '34px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Link College Account */}
                {user?.accountType === 'private' && (
                  <div className="glass-card p-6 border border-purple-500/20 bg-gradient-to-br from-purple-950/10 via-dark-surface to-dark-surface/50 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-purple-300 uppercase tracking-wide">Link College Account</h3>
                      <p className="text-[10px] text-text-secondary uppercase">Connect your official college profile to unlock academic tracking features</p>
                    </div>

                    {user?.isCollegeConnected ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-emerald-400">Institutional Sync Active</p>
                          <p className="text-xs font-semibold text-white mt-0.5">Roll Number: {user?.rollNumber} ({user?.collegeCode})</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-lg">
                          Synced
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleLinkCollege} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">College Code</label>
                            <input
                              type="text"
                              value={linkCollegeCode}
                              onChange={(e) => setLinkCollegeCode(e.target.value.toUpperCase())}
                              className={getInputClassName(false)}
                              placeholder="e.g. MSMC"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Roll Number</label>
                            <input
                              type="text"
                              value={linkRollNumber}
                              onChange={(e) => setLinkRollNumber(e.target.value.toUpperCase())}
                              className={getInputClassName(false)}
                              placeholder="e.g. 23A91A0401"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">College Account Password</label>
                          <div className="relative">
                            <input
                              type={showLinkPassword ? 'text' : 'password'}
                              value={linkPassword}
                              onChange={(e) => setLinkPassword(e.target.value)}
                              className={`${getInputClassName(false)} pr-12`}
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowLinkPassword(!showLinkPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                            >
                              {showLinkPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLinking}
                          className="w-full h-11 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isLinking ? <Loader2 size={15} className="animate-spin" /> : <span>Verify & Connect College Profile</span>}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
              {activeTab !== 'connections' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Profile Changes</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {/* CROP PREVIEW CONFIRMATION OVERLAY MODAL */}
      {cropPreview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0f0b1b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Crop & Compress Photo</h3>
              <p className="text-[10px] text-text-secondary">Verify your center-cropped profile preview before uploading to cloud storage.</p>
            </div>

            {/* Circular Avatar preview / Wide rectangular Cover preview */}
            <div className="flex items-center justify-center bg-black/40 border border-white/5 p-4 rounded-xl">
              {cropPreview.type === 'avatar' ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500 shadow-xl shadow-purple-500/20">
                  <img src={cropPreview.url} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-24 rounded-lg overflow-hidden border border-purple-500/50 shadow-xl shadow-purple-500/20">
                  <img src={cropPreview.url} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={() => setCropPreview(null)}
                className="flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={handleUploadConfirm}
                className="flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-purple-600/20"
              >
                {isUploadingFile && <Loader2 size={10} className="animate-spin" />}
                <span>Confirm & Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
