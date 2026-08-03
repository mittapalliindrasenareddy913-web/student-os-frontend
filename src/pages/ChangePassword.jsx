import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const getInputClassName = (hasError) => {
  return `w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-xs transition-all outline-none focus:ring-1 placeholder:text-text-secondary/40 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
      : 'border-white/5 focus:border-primary focus:ring-primary/20'
  }`;
};

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password Validation States
  const [rules, setRules] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
  });

  const [strength, setStrength] = useState({ score: 0, text: 'Very Weak', color: 'bg-red-500/40 text-red-400' });

  // Redirect unauthenticated or already updated users
  useEffect(() => {
    if (!user) {
      navigate('/welcome', { replace: true });
    } else if (user && !user.firstLogin) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Compute Rules & Strength
  useEffect(() => {
    const len = newPassword.length >= 8;
    const upp = /[A-Z]/.test(newPassword);
    const low = /[a-z]/.test(newPassword);
    const num = /[0-9]/.test(newPassword);

    setRules({ length: len, upper: upp, lower: low, number: num });

    // Calculate score (0 to 4)
    let score = 0;
    if (len) score++;
    if (upp) score++;
    if (low) score++;
    if (num) score++;

    let strengthText = 'Very Weak';
    let strengthColor = 'bg-red-500/40 text-red-400';

    if (score === 1) {
      strengthText = 'Weak';
      strengthColor = 'bg-red-500 text-red-400';
    } else if (score === 2) {
      strengthText = 'Fair';
      strengthColor = 'bg-orange-500 text-orange-400';
    } else if (score === 3) {
      strengthText = 'Good';
      strengthColor = 'bg-yellow-500 text-yellow-400';
    } else if (score === 4) {
      strengthText = 'Strong';
      strengthColor = 'bg-emerald-500 text-emerald-400';
    }

    setStrength({ score, text: strengthText, color: strengthColor });
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password cannot be identical to your current password.');
      return;
    }

    if (strength.score < 4) {
      toast.error('Please meet all password validation requirements.');
      return;
    }

    setIsLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (result.ok) {
      toast.success('Password changed successfully! Welcome to Student OS 🚀');
      navigate('/', { replace: true });
    } else {
      toast.error(result.message || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-8 relative overflow-y-auto bg-[#0B0718] animate-fade-in">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/30 mb-4 animate-bounce">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary uppercase tracking-wider">
            Secure Account
          </h1>
          <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold mt-1">
            Mandatory Security Setup
          </p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1.5 border-b border-white/5 pb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Change Password</h2>
            <p className="text-[10px] text-text-secondary uppercase">Please update your password to secure your portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${getInputClassName(false)} pr-12`}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${getInputClassName(false)} pr-12`}
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
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
                          strength.score >= step
                            ? strength.score === 4
                              ? 'bg-emerald-500'
                              : strength.score === 3
                              ? 'bg-yellow-500'
                              : strength.score === 2
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${getInputClassName(false)} pr-12`}
                  placeholder="Retype new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-all p-1"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Validation Checkmarks */}
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
              className="w-full h-12 mt-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Update Password</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
