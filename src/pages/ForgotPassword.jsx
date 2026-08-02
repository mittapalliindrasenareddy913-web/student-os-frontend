import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, KeyRound, Loader2, AlertCircle, ShieldAlert, CheckCircle, Mail, Phone } from 'lucide-react';

const getInputClassName = (hasError) => {
  return `w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-xs transition-all outline-none focus:ring-1 placeholder:text-text-secondary/40 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
      : 'border-white/5 focus:border-primary focus:ring-primary/20'
  }`;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { API } = useAuth();

  // Forgot password sub-views: 'ident' | 'channel' | 'otp' | 'reset'
  const [step, setStep] = useState('ident'); 

  // Form parameters
  const [collegeCode, setCollegeCode] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [channels, setChannels] = useState({ maskedEmail: '', maskedPhone: '' });
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  // Password Validation
  const [rules, setRules] = useState({ length: false, upper: false, lower: false, number: false });
  const [strength, setStrength] = useState({ score: 0, text: 'Very Weak', color: 'bg-red-500/40 text-red-400' });

  // Handle identity validation step
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    if (!collegeCode.trim() || !rollNumber.trim()) {
      toast.error('Please enter College Code and Roll Number.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await API.post('/auth/college/forgot-password', { collegeCode, rollNumber });
      setChannels({ maskedEmail: data.maskedEmail, maskedPhone: data.maskedPhone });
      setStep('channel');
      toast.success('Identity verified! 🌟');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No official record found for this roll number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await API.post('/auth/college/send-otp', { collegeCode, rollNumber, channel: selectedChannel });
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
        toast(`Test Code: ${data.debugOtp}`, { icon: '🔑', duration: 8000 });
      }
      setStep('otp');
      toast.success(`OTP code sent to your registered ${selectedChannel}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      await API.post('/auth/college/verify-otp', { collegeCode, rollNumber, otp });
      setStep('reset');
      toast.success('OTP code verified successfully! 🔓');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change rules
  const handlePasswordChange = (val) => {
    setNewPassword(val);
    const len = val.length >= 8;
    const upp = /[A-Z]/.test(val);
    const low = /[a-z]/.test(val);
    const num = /[0-9]/.test(val);
    setRules({ length: len, upper: upp, lower: low, number: num });

    let score = 0;
    if (len) score++;
    if (upp) score++;
    if (low) score++;
    if (num) score++;

    let strengthText = 'Very Weak';
    let strengthColor = 'bg-red-500/40 text-red-400';
    if (score === 1) { strengthText = 'Weak'; strengthColor = 'bg-red-500 text-red-400'; }
    else if (score === 2) { strengthText = 'Fair'; strengthColor = 'bg-orange-500 text-orange-400'; }
    else if (score === 3) { strengthText = 'Good'; strengthColor = 'bg-yellow-500 text-yellow-400'; }
    else if (score === 4) { strengthText = 'Strong'; strengthColor = 'bg-emerald-500 text-emerald-400'; }

    setStrength({ score, text: strengthText, color: strengthColor });
  };

  // Handle reset password submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (strength.score < 4) {
      toast.error('Password does not meet validation complexity.');
      return;
    }

    setIsLoading(true);
    try {
      await API.post('/auth/college/reset-password', { collegeCode, rollNumber, otp, newPassword });
      toast.success('Password reset successful! Please login.');
      navigate('/welcome');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark-bg animate-fade-in">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/30 mb-4 animate-pulse">
            <KeyRound size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary uppercase tracking-wider">
            Password Reset
          </h1>
          <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold mt-1">
            College Security Recovery
          </p>
        </div>

        <div className="glass-card p-8 space-y-6 transition-all duration-300">
          
          {/* STEP 1: Enter identity */}
          {step === 'ident' && (
            <form onSubmit={handleVerifyIdentity} className="space-y-5 animate-fade-in">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Verify Identity</h2>
                <p className="text-[10px] text-text-secondary uppercase">Enter College Code and Roll Number.</p>
              </div>

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Verify Account</span>}
              </button>
            </form>
          )}

          {/* STEP 2: Channel Choice */}
          {step === 'channel' && (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Recovery Verification</h2>
                <p className="text-[10px] text-text-secondary uppercase">Select where to receive your OTP verification code.</p>
              </div>

              <div className="space-y-3">
                {/* Email Channel Option */}
                <div 
                  onClick={() => setSelectedChannel('email')}
                  className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                    selectedChannel === 'email' 
                      ? 'border-primary bg-primary/5 text-white' 
                      : 'border-white/5 bg-white/5 text-text-secondary hover:border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedChannel === 'email' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-secondary'}`}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-purple-300">Registered Email</p>
                    <p className="text-xs font-semibold mt-0.5">{channels.maskedEmail || 'Not Configured'}</p>
                  </div>
                </div>

                {/* Phone Channel Option */}
                <div 
                  onClick={() => setSelectedChannel('sms')}
                  className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                    selectedChannel === 'sms' 
                      ? 'border-primary bg-primary/5 text-white' 
                      : 'border-white/5 bg-white/5 text-text-secondary hover:border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedChannel === 'sms' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-secondary'}`}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-purple-300">Registered Mobile</p>
                    <p className="text-xs font-semibold mt-0.5">{channels.maskedPhone || 'Not Configured'}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Send OTP Verification Code</span>}
              </button>
            </form>
          )}

          {/* STEP 3: OTP Entry */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Enter OTP Code</h2>
                <p className="text-[10px] text-text-secondary uppercase">Enter the 6-digit OTP code sent to your registered {selectedChannel}.</p>
              </div>

              {debugOtp && (
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-xl text-center">
                  <p className="text-[10px] font-black text-purple-300 uppercase">Test OTP Auto-Detection</p>
                  <p className="text-lg font-mono font-bold tracking-widest text-white mt-1">{debugOtp}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`${getInputClassName(false)} text-center tracking-widest text-lg font-mono`}
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Verify OTP Code</span>}
              </button>
            </form>
          )}

          {/* STEP 4: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Reset Password</h2>
                <p className="text-[10px] text-text-secondary uppercase">Enter your new secure account password.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={getInputClassName(false)}
                  placeholder="Min 8 characters"
                  required
                />
                {newPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase">
                      <span className="text-text-secondary">Strength</span>
                      <span className={strength.color}>{strength.text}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all ${
                            strength.score >= step ? 'bg-primary' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={getInputClassName(false)}
                  placeholder="Retype password"
                  required
                />
              </div>

              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-[10px]">
                <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-400 font-bold' : 'text-text-secondary'}`}>
                  {rules.length ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  <span>At least 8 chars</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.upper ? 'text-emerald-400 font-bold' : 'text-text-secondary'}`}>
                  {rules.upper ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  <span>At least 1 uppercase</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.lower ? 'text-emerald-400 font-bold' : 'text-text-secondary'}`}>
                  {rules.lower ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  <span>At least 1 lowercase</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.number ? 'text-emerald-400 font-bold' : 'text-text-secondary'}`}>
                  {rules.number ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  <span>At least 1 digit</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Update Password</span>}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-text-secondary font-bold uppercase tracking-wider mt-4">
            <Link
              to="/welcome"
              className="text-primary hover:underline flex items-center justify-center gap-1"
            >
              <ArrowLeft size={12} /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}