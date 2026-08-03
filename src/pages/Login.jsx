import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGoogleClientId, signInWithGoogle } from '../utils/googleAuth';
import { Eye, EyeOff, ArrowRight, Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const getInputClassName = (hasError) => {
  return `w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-xs transition-all outline-none focus:ring-1 placeholder:text-text-secondary/40 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
      : 'border-white/5 focus:border-primary focus:ring-primary/20'
  }`;
};

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, loginWithGoogle, user, error: loginError, clearError } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignInClick = async () => {
    const res = await signInWithGoogle(async (idToken) => {
      toast.loading('Authenticating via Google...');
      const apiRes = await loginWithGoogle(idToken);
      toast.dismiss();
      if (apiRes.ok) {
        toast.success('Logged in with Google! 🚀');
        navigate('/');
      } else {
        toast.error(apiRes.message || 'Google Sign-in failed.');
      }
      return apiRes;
    });

    if (res && !res.ok && !res.webFallback) {
      toast.error(res.message);
    }
  };

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    clearError();
    const remembered = localStorage.getItem('sos_remembered_user');
    if (remembered) {
      setEmailOrUsername(remembered);
      setRememberMe(true);
    }
  }, [clearError]);

  useEffect(() => {
    const initGoogle = () => {
      if (typeof window.google !== 'undefined') {
        try {
          window.google.accounts.id.initialize({
            client_id: getGoogleClientId(),
            callback: async (response) => {

              toast.loading('Authenticating via Google...');
              const res = await loginWithGoogle(response.credential);
              toast.dismiss();
              if (res.ok) {
                toast.success('Logged in with Google! 🚀');
                navigate('/');
              } else {
                toast.error(res.message || 'Google Sign-in failed.');
              }
            }
          });

          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-login"),
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

  const validateForm = () => {
    const newErrors = {};
    if (!emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Roll Number is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await login(emailOrUsername, password);
    setIsLoading(false);

    if (result.ok) {
      if (rememberMe) {
        localStorage.setItem('sos_remembered_user', emailOrUsername);
      } else {
        localStorage.removeItem('sos_remembered_user');
      }
      toast.success('Signed in successfully! ⚡');
      navigate('/', { replace: true });
    } else {
      toast.error(result.message || 'Login failed.');
    }
  };

  const isSuperAdmin = emailOrUsername.trim().toLowerCase() === 'indra0408' || emailOrUsername.trim().toLowerCase() === 'indra0408@campusos.in';

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-8 relative overflow-y-auto bg-[#0B0718] animate-fade-in">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 mb-4">
            <img src="/favicon.svg" alt="logo" className="w-full h-full object-cover" />
          </div>
          <h1 className={`text-2xl font-black uppercase tracking-wider ${isSuperAdmin ? 'bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-200 animate-pulse' : 'bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary'}`}>
            {isSuperAdmin ? 'SUPER ADMIN' : 'Student OS'}
          </h1>
          <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold mt-1">
            {isSuperAdmin ? 'Global Administrative Master Portal' : 'Learn • Connect • Grow'}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1">
            <h2 className={`text-sm font-black uppercase tracking-wider ${isSuperAdmin ? 'text-amber-400' : 'text-white'}`}>
              {isSuperAdmin ? '👑 Super Admin Sign In' : 'Sign In'}
            </h2>
            <p className="text-[9px] text-text-secondary uppercase">
              {isSuperAdmin ? 'Global Access Granted — Password: ISR@MB@d' : 'Welcome back — Let\'s get productive'}
            </p>
          </div>

          {loginError && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs p-3 rounded-xl">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">
                {isSuperAdmin ? 'Super Admin Username / Email' : 'Roll Number / Username'}
              </label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => {
                  setEmailOrUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, emailOrUsername: '' }));
                }}
                className={getInputClassName(errors.emailOrUsername)}
                placeholder="Enter your Roll Number (e.g. 24G2A04L65)"
                autoComplete="username"
              />
              {errors.emailOrUsername && (
                <p className="text-[9px] text-red-400 font-bold uppercase">{errors.emailOrUsername}</p>
              )}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`${getInputClassName(errors.password)} pr-12`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[9px] text-red-400 font-bold uppercase">{errors.password}</p>
              )}
            </div>

            {/* Remember Me Toggle */}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/30 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-black text-text-secondary uppercase">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Continue with Google */}
          <div 
            onClick={handleGoogleSignInClick}
            className="relative w-full h-11 overflow-hidden rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow active:scale-[.98]"
          >
            <button
              type="button"
              className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center gap-2 pointer-events-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>
            <div 
              id="google-signin-login" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-xs text-text-secondary font-bold uppercase tracking-wider">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline ml-1">
            Create one free
          </Link>
        </p>
      </div>
    </div>
);
}