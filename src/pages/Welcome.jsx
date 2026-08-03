import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Mail, ShieldAlert, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const getInputClassName = (hasError) => {
  return `w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-xs transition-all outline-none focus:ring-1 placeholder:text-text-secondary/40 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
      : 'border-white/5 focus:border-primary focus:ring-primary/20'
  }`;
};

export default function Welcome() {
  const navigate = useNavigate();
  const { login, collegeLogin, loginWithGoogle, user } = useAuth();

  // Screen states: 'options' | 'college' | 'default'
  const [view, setView] = useState('options'); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields
  const [collegeCode, setCollegeCode] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [defaultUsername, setDefaultUsername] = useState('');
  const [password, setPassword] = useState('');

  // Redirect already-authenticated users
  useEffect(() => {
    if (user) {
      if (user.firstLogin) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  // Load remembered user (college or default)
  useEffect(() => {
    const rememberedColl = localStorage.getItem('sos_remembered_college');
    const rememberedRoll = localStorage.getItem('sos_remembered_roll');
    const rememberedPass = localStorage.getItem('sos_remembered_password');
    const rememberedUser = localStorage.getItem('sos_remembered_default');
    if (rememberedColl && rememberedRoll) {
      setCollegeCode(rememberedColl);
      setRollNumber(rememberedRoll);
      if (rememberedPass) setPassword(rememberedPass);
      setRememberMe(true);
    } else if (rememberedUser) {
      setDefaultUsername(rememberedUser);
      setRememberMe(true);
    }
  }, []);

  // Submit College Login
  const handleCollegeSubmit = async (e) => {
    e.preventDefault();
    if (!collegeCode.trim() || !rollNumber.trim() || !password) {
      toast.error('All fields are required.');
      return;
    }

    setIsLoading(true);
    const result = await collegeLogin(collegeCode, rollNumber, password);
    setIsLoading(false);

    if (result.ok) {
      if (rememberMe) {
        localStorage.setItem('sos_remembered_college', collegeCode);
        localStorage.setItem('sos_remembered_roll', rollNumber);
        localStorage.setItem('sos_remembered_password', password);
      } else {
        localStorage.removeItem('sos_remembered_college');
        localStorage.removeItem('sos_remembered_roll');
        localStorage.removeItem('sos_remembered_password');
      }
      toast.success('College Sign-In successful! ⚡');
      if (result.data.firstLogin) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      toast.error(result.message || 'College Sign-In failed.');
    }
  };

  // Submit Default Login
  const handleDefaultSubmit = async (e) => {
    e.preventDefault();
    if (!defaultUsername.trim() || !password) {
      toast.error('All fields are required.');
      return;
    }

    setIsLoading(true);
    const result = await login(defaultUsername, password);
    setIsLoading(false);

    if (result.ok) {
      if (rememberMe) {
        localStorage.setItem('sos_remembered_default', defaultUsername);
      } else {
        localStorage.removeItem('sos_remembered_default');
      }
      toast.success('Signed in successfully! ⚡');
      if (result.data?.firstLogin) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      toast.error(result.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-8 relative overflow-y-auto bg-[#0B0718] animate-fade-in">
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="w-full max-w-md z-10 space-y-6 text-center">
        {/* Header Title */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-2xl shadow-primary/30 border border-white/10 hover:scale-105 transition-transform duration-300">
            <img src="/favicon.svg" alt="logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Student OS
            </h1>
            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-black mt-1">
              Learn • Connect • Grow
            </p>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6 text-left transition-all duration-300">
          
          {/* VIEW 1: Main Welcome Options */}
          {view === 'options' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-1.5 mb-2">
                <h2 className="text-white text-lg font-black uppercase tracking-wider">Welcome to Student OS</h2>
                <p className="text-xs text-text-secondary">Your complete academic operating system.</p>
              </div>

              <div className="space-y-4">
                {/* Continue with College */}
                <button
                  onClick={() => setView('college')}
                  className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2.5 transition-all hover:shadow-lg active:scale-[.98] cursor-pointer"
                >
                  <BookOpen size={18} />
                  <span>Continue with College</span>
                </button>

                {/* Private Student Login */}
                <button
                  onClick={() => setView('default')}
                  className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2.5 transition-all hover:shadow-lg active:scale-[.98] cursor-pointer"
                >
                  <span>Private Student Login</span>
                </button>
              </div>

              {/* Private Student Sign Up Link */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-black text-text-secondary uppercase">or</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <p className="text-center text-xs text-text-secondary font-bold uppercase tracking-wider">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline ml-1">
                  Private Student Sign Up
                </Link>
              </p>
            </div>
          )}

          {/* VIEW 2: College Login Screen */}
          {view === 'college' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <h2 className="text-white text-lg font-black uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={20} className="text-primary" />
                  College Login
                </h2>
                <p className="text-xs text-text-secondary">Enter your official institutional credentials.</p>
              </div>

              <form onSubmit={handleCollegeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">College Code</label>
                  <input
                    type="text"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                    className={getInputClassName(false)}
                    placeholder="e.g. MSMC"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    className={getInputClassName(false)}
                    placeholder="e.g. 23A91A0401"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Password</label>
                    <Link to="/forgot-password" className="text-[9px] font-black text-primary hover:underline uppercase">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${getInputClassName(false)} pr-12`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 w-4 h-4"
                    />
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">Remember Me</span>
                  </label>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Verify & Login</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('options')}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: Default Login Screen */}
          {view === 'default' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <h2 className="text-white text-lg font-black uppercase tracking-wider flex items-center gap-2">
                  <Mail size={20} className="text-secondary" />
                  Sign In
                </h2>
                <p className="text-xs text-text-secondary">Login to your custom personal profile.</p>
              </div>

              <form onSubmit={handleDefaultSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Username or Email</label>
                  <input
                    type="text"
                    value={defaultUsername}
                    onChange={(e) => setDefaultUsername(e.target.value)}
                    className={getInputClassName(false)}
                    placeholder="you@email.com or username"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Password</label>
                    <Link to="/forgot-password" className="text-[9px] font-black text-primary hover:underline uppercase">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${getInputClassName(false)} pr-12`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 w-4 h-4"
                    />
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">Remember Me</span>
                  </label>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Login</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('options')}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <p className="text-xs text-text-secondary/35">
          Student OS • Secure Enterprise Gateway
        </p>
      </div>
    </div>
  );
}
