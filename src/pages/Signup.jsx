import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Camera,
  Check,
  User,
  UploadCloud,
  BookOpen,
  Award,
  Briefcase,
  Sparkles,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGoogleClientId, signInWithGoogle } from '../utils/googleAuth';
import toast from 'react-hot-toast';

const countryList = [
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'JP', name: '🇯🇵 Japan' }
];

const interestsOptions = [
  'Programming', 'AI', 'ML', 'Cyber Security', 'Cloud',
  'Web Development', 'Android', 'UI/UX', 'Hackathons',
  'Placements', 'Internships', 'Projects', 'Open Source',
  'Competitive Coding', 'Electronics', 'Robotics', 'IoT'
];

export default function Signup() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, user, API } = useAuth();

  const handleGoogleSignInClick = async () => {
    const res = await signInWithGoogle(async (idToken) => {
      toast.loading('Signing up with Google...');
      const apiRes = await loginWithGoogle(idToken);
      toast.dismiss();
      if (apiRes.ok) {
        toast.success('Welcome to Student OS! 🚀');
        navigate('/');
      } else {
        toast.error(apiRes.message || 'Google Sign-up failed.');
      }
      return apiRes;
    });

    if (res && !res.ok && !res.webFallback) {
      toast.error(res.message);
    }
  };

  const [step, setStep] = useState(1);

  // Redirect already-authenticated users to dashboard
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);


  useEffect(() => {
    const initGoogle = () => {
      if (typeof window.google !== 'undefined') {
        try {
          window.google.accounts.id.initialize({
            client_id: getGoogleClientId(),
            callback: async (response) => {
              toast.loading('Signing up with Google...');
              const res = await loginWithGoogle(response.credential);
              toast.dismiss();
              if (res.ok) {
                toast.success('Welcome to Student OS! 🚀');
                navigate('/');
              } else {
                toast.error(res.message || 'Google Sign-up failed.');
              }
            }
          });

          window.google.accounts.id.renderButton(
            document.getElementById("google-signup-btn"),
            { theme: "outline", size: "large", width: 380 }
          );
        } catch (err) {
          console.error(err);
        }
      }
    };

    if (typeof window.google === 'undefined') {
      setTimeout(initGoogle, 1000);
    } else {
      initGoogle();
    }
  }, [loginWithGoogle, navigate]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cropPreview, setCropPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Custom Student Connect Registration States
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [collegesList, setCollegesList] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [verifiedRecord, setVerifiedRecord] = useState(null);
  const [isRecordVerified, setIsRecordVerified] = useState(false);

  // Manual inputs for unconnected college path
  const [manFullName, setManFullName] = useState('');
  const [manRollNumber, setManRollNumber] = useState('');
  const [manDepartment, setManDepartment] = useState('');
  const [manBranch, setManBranch] = useState('');
  const [manAcademicYear, setManAcademicYear] = useState('');
  const [manSemester, setManSemester] = useState('');
  const [manSection, setManSection] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'IN',
    language: 'English',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    avatar: '',
    accountType: 'student',
    educationLevel: '',
    collegeName: '',
    universityBoard: '',
    branch: '',
    year: '',
    semester: '',
    studentId: '',
    cgpaPercentage: '',
    institution: '',
    department: '',
    subjectsTeaching: '',
    qualification: '',
    experienceYears: 0,
    officeLocation: '',
    researchArea: '',
    publications: '',
    jobStatus: '',
    highestQualification: '',
    preferredJobRole: '',
    preferredLocation: '',
    openToWork: false,
    expectedSalary: '',
    resumeUrl: '',
    companyName: '',
    jobTitle: '',
    industry: '',
    openToMentor: false,
    portfolioUrl: '',
    websiteUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    interests: []
  });

  // Debounce College Directory Search
  useEffect(() => {
    if (formData.accountType !== 'student') return;
    const delayDebounce = setTimeout(async () => {
      if (!collegeSearchQuery.trim()) {
        setCollegesList([]);
        return;
      }
      try {
        const { data } = await API.get(`/auth/colleges/search`, {
          params: { query: collegeSearchQuery }
        });
        setCollegesList(data || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [collegeSearchQuery, formData.accountType, API]);

  const handleVerifyRoll = async () => {
    if (!selectedCollege || !rollNumberInput.trim()) {
      toast.error('Specify a selected college and enter your roll number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post(`/auth/colleges/verify-roll`, {
        collegeCode: selectedCollege.collegeCode,
        rollNumber: rollNumberInput
      });
      setVerifiedRecord(data);
      setIsRecordVerified(true);
      toast.success('Official academic record verified! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. No matching student record found.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('All credential fields are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    const registerPayload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      isConnected: selectedCollege ? selectedCollege.isConnected : false,
      collegeCode: selectedCollege ? selectedCollege.collegeCode : '',
      rollNumber: rollNumberInput,
      manFullName,
      manRollNumber,
      manDepartment,
      manBranch,
      manAcademicYear,
      manSemester,
      manSection
    };

    const result = await register(registerPayload);
    setLoading(false);
    if (result.ok) {
      setStep(5);
    } else {
      toast.error(result.message || 'Registration failed.');
    }
  };

  useEffect(() => {
    try {
      const detectedLang = navigator.language || 'en';
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const detectedDf = detectedLang.startsWith('en-US') ? 'MM/DD/YYYY' : 'YYYY-MM-DD';
      setFormData(prev => ({
        ...prev,
        language: detectedLang,
        timezone: detectedTz,
        dateFormat: detectedDf
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropPreview({ file, url });
  };

  const handleUploadConfirm = async () => {
    if (!cropPreview) return;
    setIsUploadingPhoto(true);
    try {
      const compressed = await cropAndCompressImage(cropPreview.file, 500, 500);
      const dataForm = new FormData();
      dataForm.append('file', compressed);
      const { data } = await API.post('/community/posts/upload', dataForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data && data.url) {
        handleInputChange('avatar', data.url);
        toast.success('Avatar uploaded successfully! ✨');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploadingPhoto(false);
      setCropPreview(null);
    }
  };

  const handleResumeSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF resumes allowed');
      return;
    }
    setLoading(true);
    try {
      const dataForm = new FormData();
      dataForm.append('file', file);
      const { data } = await API.post('/community/posts/upload', dataForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data && data.url) {
        handleInputChange('resumeUrl', data.url);
        toast.success('Resume uploaded! 📄');
      }
    } catch {
      toast.error('Resume upload failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (val) => {
    setFormData(prev => {
      const list = prev.interests.includes(val)
        ? prev.interests.filter(i => i !== val)
        : [...prev.interests, val];
      return { ...prev, interests: list };
    });
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Full Name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!formData.email.trim()) return 'Email is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateStep3 = () => {
    const t = formData.accountType;
    if (t === 'student') {
      if (!formData.educationLevel) return 'Education Level is required';
      if (!formData.collegeName.trim()) return 'School / College Name is required';
      if (!formData.branch.trim()) return 'Branch / Stream is required';
    } else if (t === 'teacher') {
      if (!formData.institution.trim()) return 'School / College is required';
      if (!formData.department.trim()) return 'Department is required';
      if (!formData.subjectsTeaching.trim()) return 'Subjects Teaching is required';
      if (!formData.qualification.trim()) return 'Qualification is required';
      if (formData.experienceYears === '') return 'Experience (Years) is required';
    } else if (t === 'professor') {
      if (!formData.institution.trim()) return 'University is required';
      if (!formData.department.trim()) return 'Department is required';
      if (!formData.researchArea.trim()) return 'Research Area is required';
      if (!formData.subjectsTeaching.trim()) return 'Subjects Teaching is required';
      if (!formData.qualification.trim()) return 'Qualification is required';
      if (formData.experienceYears === '') return 'Experience (Years) is required';
    } else if (t === 'job_seeker') {
      if (!formData.jobStatus) return 'Current Status is required';
      if (!formData.highestQualification.trim()) return 'Highest Qualification is required';
      if (!formData.preferredJobRole.trim()) return 'Preferred Job Role is required';
      if (!formData.preferredLocation.trim()) return 'Preferred Location is required';
    } else if (t === 'professional') {
      if (!formData.companyName.trim()) return 'Company is required';
      if (!formData.jobTitle.trim()) return 'Job Title is required';
      if (!formData.industry.trim()) return 'Industry is required';
      if (formData.experienceYears === '') return 'Experience (Years) is required';
    }
    return null;
  };

  const handleNextStep = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        toast.error(err);
        return;
      }
    }
    if (step === 3) {
      if (formData.accountType === 'student') {
        if (!selectedCollege) {
          toast.error('Please search and select a college to continue.');
          return;
        }
      } else {
        const err = validateStep3();
        if (err) {
          toast.error(err);
          return;
        }
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (formData.accountType === 'student') {
      return handleStudentSubmit(e);
    }
    setLoading(true);
    const result = await register(formData);
    setLoading(false);
    if (result.ok) {
      setStep(5);
    } else {
      toast.error(result.message || 'Registration failed.');
    }
  };

  const renderProgressBar = () => {
    const totalStepsCount = 5;
    const progressPercent = ((step - 1) / (totalStepsCount - 1)) * 100;
    return (
      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-purple-400 tracking-wider">
          <span>Step {step} of {totalStepsCount}</span>
          <span>{Math.round(progressPercent)}% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
            style={{ width: (progressPercent || 5) + '%' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-8 relative overflow-y-auto bg-[#0B0718] animate-fade-in">
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="w-full max-w-lg z-10 space-y-6">
        {step < 5 && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-primary/20 mb-4">
              <img src="/favicon.svg" alt="logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Create Your Account</h1>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1">Join the worldwide academic ecosystem</p>
          </div>
        )}

        <div className="glass-card p-6 md:p-8">
          {step < 5 && renderProgressBar()}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col items-center space-y-2 mb-2">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Profile Photo (Optional)</label>
                <div className="relative group/avatar cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/25 overflow-hidden flex items-center justify-center">
                    {formData.avatar ? (
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                      <User className="text-purple-400" size={28} />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/75 rounded-full opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-1 transition-all">
                    <label className="text-[7px] text-white hover:text-purple-300 font-bold uppercase cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Indrasena Reddy"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="indrasena_reddy"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Verify password"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  {countryList.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </button>

                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[8px] text-text-secondary uppercase font-bold">or sign up with</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div 
                  onClick={handleGoogleSignInClick}
                  className="relative w-full h-11 overflow-hidden rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow active:scale-[.98]"
                >
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center gap-2 pointer-events-none"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.04-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign Up with Google</span>
                  </button>
                  <div id="google-signup-btn" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1 text-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Choose Account Type</h3>
                <p className="text-[8px] text-text-secondary uppercase">Select your primary role within Student OS</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  { id: 'student', name: '🎓 Student', desc: 'Unified courses & campus groups' },
                  { id: 'teacher', name: '👨🏫 Teacher', desc: 'Notes sharing & academic mentoring' },
                  { id: 'professor', name: '🎓 Professor', desc: 'Research & advising' },
                  { id: 'job_seeker', name: '💼 Job Seeker', desc: 'Resume & placement prep' },
                  { id: 'professional', name: '👨💻 Professional', desc: 'Work profile & student mentoring' }
                ].map(type => {
                  const isSelected = formData.accountType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleInputChange('accountType', type.id)}
                      className={`p-4 text-left border rounded-xl transition-all cursor-pointer flex flex-col justify-between h-20 ${isSelected ? 'bg-purple-600/10 border-purple-500 shadow-lg shadow-purple-600/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                      <p className="text-[10px] font-black text-white uppercase tracking-wider">{type.name}</p>
                      <p className="text-[7px] text-text-secondary mt-0.5 leading-relaxed">{type.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              {formData.accountType === 'student' ? (
                <div className="space-y-4">
                  <div className="space-y-1 text-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Search Your College</h3>
                    <p className="text-[8px] text-text-secondary uppercase">Select your institution from the Campus OS directory</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">College Search Query</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                      placeholder="Search by College Name, AISHE Code, University, District, State..."
                      value={collegeSearchQuery}
                      onChange={(e) => setCollegeSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {collegesList.map((col) => {
                      const isSelected = selectedCollege?._id === col._id;
                      return (
                        <div
                          key={col._id}
                          onClick={() => setSelectedCollege(col)}
                          className={`p-4 border rounded-xl transition-all cursor-pointer space-y-2.5 ${isSelected ? 'bg-purple-600/10 border-purple-500 shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">🏛️</div>
                            <div>
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                {col.collegeName}
                                {col.verificationBadge && <span className="text-[8px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase">Verified</span>}
                              </h4>
                              <p className="text-[9px] text-text-secondary mt-0.5">{col.university} • {col.city}, {col.state}</p>
                            </div>
                          </div>
                          <div className="p-2.5 bg-black/40 rounded-lg text-[9px] space-y-1">
                            {col.isConnected ? (
                              <>
                                <p className="font-bold text-emerald-400">🟢 Connected to Campus OS</p>
                                <p className="text-text-secondary leading-normal">This institution is connected with Campus OS. Your academic information will automatically synchronize after verification.</p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-red-400">🔴 Not Connected to Campus OS</p>
                                <p className="text-text-secondary leading-normal">This institution has not yet integrated Campus OS. You can still create a Student OS account. Campus-integrated features will remain locked until your college joins Campus OS.</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {collegeSearchQuery && collegesList.length === 0 && (
                      <p className="text-center text-xs text-text-secondary py-4">No institutions found matching query.</p>
                    )}
                    {!collegeSearchQuery && (
                      <p className="text-center text-[10px] text-text-secondary py-4 uppercase font-bold tracking-wider">Start typing to search the master directory...</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!selectedCollege}
                      className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <span>Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1 text-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Dynamic Profile Details</h3>
                    <p className="text-[8px] text-text-secondary uppercase">Provide details relevant to your selected account type</p>
                  </div>

              {formData.accountType === 'teacher' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Institution *</label>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        placeholder="e.g. Stanford High School"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Department *</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="e.g. Science Department"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Subjects Teaching *</label>
                      <input
                        type="text"
                        value={formData.subjectsTeaching}
                        onChange={(e) => handleInputChange('subjectsTeaching', e.target.value)}
                        placeholder="e.g. Algebra, Calculus"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years) *</label>
                      <input
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Qualification *</label>
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        placeholder="e.g. M.Ed in Science"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Office Location (Optional)</label>
                      <input
                        type="text"
                        value={formData.officeLocation}
                        onChange={(e) => handleInputChange('officeLocation', e.target.value)}
                        placeholder="e.g. Block C, Room 204"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.accountType === 'professor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">University *</label>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        placeholder="e.g. MIT Physics"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Department *</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="e.g. Physics Department"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Research Area *</label>
                      <input
                        type="text"
                        value={formData.researchArea}
                        onChange={(e) => handleInputChange('researchArea', e.target.value)}
                        placeholder="e.g. Quantum Computing"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Subjects Teaching *</label>
                      <input
                        type="text"
                        value={formData.subjectsTeaching}
                        onChange={(e) => handleInputChange('subjectsTeaching', e.target.value)}
                        placeholder="e.g. Advanced Quantum Mechanics"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Qualification *</label>
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        placeholder="e.g. PhD in Theoretical Physics"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years) *</label>
                      <input
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Publications (Optional)</label>
                    <textarea
                      value={formData.publications}
                      onChange={(e) => handleInputChange('publications', e.target.value)}
                      placeholder="Key publication titles..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none font-medium"
                    />
                  </div>
                </div>
              )}

              {formData.accountType === 'job_seeker' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Current Status *</label>
                      <select
                        value={formData.jobStatus}
                        onChange={(e) => handleInputChange('jobStatus', e.target.value)}
                        className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="">-- Select Status --</option>
                        <option value="Unemployed">Looking for Opportunity (Unemployed)</option>
                        <option value="Employed">Currently Employed</option>
                        <option value="Student">Fresher (Graduating Student)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Highest Qualification *</label>
                      <input
                        type="text"
                        value={formData.highestQualification}
                        onChange={(e) => handleInputChange('highestQualification', e.target.value)}
                        placeholder="e.g. Master of Business Administration"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Preferred Job Role *</label>
                      <input
                        type="text"
                        value={formData.preferredJobRole}
                        onChange={(e) => handleInputChange('preferredJobRole', e.target.value)}
                        placeholder="e.g. React Developer"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Preferred Location *</label>
                      <input
                        type="text"
                        value={formData.preferredLocation}
                        onChange={(e) => handleInputChange('preferredLocation', e.target.value)}
                        placeholder="e.g. London / Remote"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years)</label>
                      <input
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Expected Salary</label>
                      <input
                        type="text"
                        value={formData.expectedSalary}
                        onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                        placeholder="e.g. $80,000 / year"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Open To Work</label>
                      <button
                        type="button"
                        onClick={() => handleInputChange('openToWork', !formData.openToWork)}
                        className={`w-full py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${formData.openToWork ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'}`}
                      >
                        🟢 {formData.openToWork ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="glass-card p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">📄 Resume PDF CV</h4>
                      <p className="text-[9px] text-text-secondary mt-0.5">Upload CV materials to recruiters.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.resumeUrl ? (
                        <>
                          <a
                            href={formData.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[8px] font-bold uppercase rounded-lg transition-all"
                          >
                            View PDF
                          </a>
                          <button
                            type="button"
                            onClick={() => handleInputChange('resumeUrl', '')}
                            className="px-3 py-1.5 bg-red-600/20 border border-red-500/35 text-red-400 text-[8px] font-bold uppercase rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all">
                          Upload PDF
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

              {formData.accountType === 'professional' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Company Name *</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="e.g. Google DeepMind"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Job Title *</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        placeholder="e.g. Staff Software Engineer"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Industry *</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        placeholder="e.g. AI / Technology"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Experience (Years) *</label>
                      <input
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Portfolio Website</label>
                      <input
                        type="text"
                        value={formData.portfolioUrl}
                        onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Personal Website</label>
                      <input
                        type="text"
                        value={formData.websiteUrl}
                        onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">LinkedIn</label>
                      <input
                        type="text"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">GitHub</label>
                      <input
                        type="text"
                        value={formData.githubUrl}
                        onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-text-secondary uppercase">Open To Mentor</label>
                      <button
                        type="button"
                        onClick={() => handleInputChange('openToMentor', !formData.openToMentor)}
                        className={`w-full py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${formData.openToMentor ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'}`}
                      >
                        🎓 {formData.openToMentor ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

          {step === 4 && formData.accountType === 'student' && (
            <form onSubmit={handleFinalSubmit} className="space-y-5 animate-fade-in">
              <div className="space-y-1 text-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Academic Verification</h3>
                <p className="text-[8px] text-text-secondary uppercase">Link your master record or complete manual registry</p>
              </div>

              {selectedCollege?.isConnected ? (
                // Connected College Flow
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-emerald-400">🏫 {selectedCollege.collegeName}</p>
                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">🟢 Connected to Campus OS</p>
                  </div>

                  {!isRecordVerified ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Roll Number *</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 uppercase font-mono"
                          placeholder="Enter College Roll Number"
                          value={rollNumberInput}
                          onChange={(e) => setRollNumberInput(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyRoll}
                        disabled={loading || !rollNumberInput.trim()}
                        className="w-full h-10 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Verify enrollment record</span>}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Read-only verification details */}
                      <div className="p-4 bg-purple-950/15 border border-purple-900/25 rounded-xl space-y-2 text-xs">
                        <p className="font-bold text-gray-200 uppercase tracking-wider text-[9px]">Verified Academic Profile</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-text-secondary">Name:</span> <span className="text-white font-bold">{verifiedRecord?.fullName}</span></div>
                          <div><span className="text-text-secondary">Roll Number:</span> <span className="text-purple-400 font-mono font-bold">{verifiedRecord?.rollNumber}</span></div>
                          <div><span className="text-text-secondary">Course:</span> <span className="text-white font-bold">{verifiedRecord?.course}</span></div>
                          <div><span className="text-text-secondary">Branch:</span> <span className="text-white font-bold">{verifiedRecord?.branch}</span></div>
                          <div><span className="text-text-secondary">Year/Sem:</span> <span className="text-white font-bold">Sem {verifiedRecord?.semester}</span></div>
                          <div><span className="text-text-secondary">Section:</span> <span className="text-white font-bold">Sec {verifiedRecord?.section}</span></div>
                        </div>
                      </div>
                      <div className="p-2 bg-emerald-950/10 border border-emerald-900/20 text-emerald-400 text-[10px] text-center font-bold rounded-lg">
                        ✅ Academic record successfully verified and ready to link.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Unconnected College Flow (Manual fields entry)
                <div className="space-y-4">
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-red-400">🏫 {selectedCollege?.collegeName || 'Manual College Entry'}</p>
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">🔴 Not Connected to Campus OS</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                        placeholder="Enter Full Name"
                        value={manFullName}
                        onChange={(e) => setManFullName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Roll Number *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 uppercase font-mono"
                          placeholder="Enter Roll Number"
                          value={manRollNumber}
                          onChange={(e) => setManRollNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Branch *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                          placeholder="e.g. CSE / ECE"
                          value={manBranch}
                          onChange={(e) => setManBranch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Department *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
                          placeholder="e.g. CSE"
                          value={manDepartment}
                          onChange={(e) => setManDepartment(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Semester *</label>
                        <select
                          required
                          className="w-full bg-[#0b0714] border border-white/5 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none"
                          value={manSemester}
                          onChange={(e) => setManSemester(e.target.value)}
                        >
                          <option value="">-- Sem --</option>
                          {[1,2,3,4,5,6,7,8,9,10].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Section *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 uppercase"
                          placeholder="e.g. A"
                          value={manSection}
                          onChange={(e) => setManSection(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedCollege?.isConnected && !isRecordVerified)}
                  className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Activate Account</span>}
                </button>
              </div>
            </form>
          )}

          {step === 4 && formData.accountType !== 'student' && (
            <form onSubmit={handleFinalSubmit} className="space-y-5 animate-fade-in">
              <div className="space-y-1 text-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Select Interests</h3>
                <p className="text-[8px] text-text-secondary uppercase">Select topics to personalize recommendations</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interestsOptions.map(opt => {
                  const isSelected = formData.interests.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleInterest(opt)}
                      className={`px-3 py-2 text-left border rounded-xl transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${isSelected ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'}`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={12} className="text-purple-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Submit Profile</span>
                      <Check size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center py-6 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-2xl shadow-xl shadow-emerald-950/20 animate-bounce">
                🎉
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Welcome to Student OS</h3>
                <p className="text-xs text-emerald-400 font-bold">Profile Created Successfully!</p>
                <p className="text-[10px] text-text-secondary uppercase">Your unified worldwide academic workspace is ready.</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[.98] transition-all"
              >
                <span>Go To Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {step < 5 && (
          <p className="text-center text-xs text-text-secondary font-bold uppercase tracking-wider">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline ml-1">
              Login
            </Link>
          </p>
        )}
      </div>

      {cropPreview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0f0b1b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Crop Profile Image</h3>
              <p className="text-[10px] text-text-secondary">Verify your center-cropped profile preview before confirming.</p>
            </div>
            <div className="flex items-center justify-center bg-black/40 border border-white/5 p-4 rounded-xl">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500 shadow-xl shadow-purple-500/20">
                <img src={cropPreview.url} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => setCropPreview(null)}
                className="flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={handleUploadConfirm}
                className="flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-purple-600/20"
              >
                {isUploadingPhoto && <Loader2 size={10} className="animate-spin" />}
                <span>Confirm & Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}