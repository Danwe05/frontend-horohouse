'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff,
  AlertCircle,
  Check,
  X,
  Clock,
  Monitor,
  ShieldCheck
} from 'lucide-react';
import apiClient from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface SecuritySettingsProps {
  user: User;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ user }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await apiClient.getSessions();
      setSessions(response.sessions || response); 
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', s?.passwordsDoNotMatch || 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', s?.passwordTooShort || 'Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', s?.passwordUpdated || 'Password updated successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      showMessage('error', s?.passwordUpdateFailed || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setIsLoading(true);
      if (!twoFactorEnabled) {
        await apiClient.enable2FA();
        setTwoFactorEnabled(true);
        showMessage('success', s?.twoFactorEnabled || 'Two-factor authentication enabled');
      } else {
        await apiClient.disable2FA();
        setTwoFactorEnabled(false);
        showMessage('success', s?.twoFactorDisabled || 'Two-factor authentication disabled');
      }
    } catch (error) {
      showMessage('error', s?.twoFactorFailed || 'Failed to update two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await apiClient.terminateSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      showMessage('success', s?.sessionTerminated || 'Session terminated.');
    } catch (error) {
      showMessage('error', s?.sessionTerminateFailed || 'Failed to terminate session');
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      await apiClient.terminateAllSessions();
      await fetchSessions();
      showMessage('success', s?.allSessionsTerminated || 'All other sessions terminated.');
    } catch (error) {
      showMessage('error', s?.allSessionsTerminateFailed || 'Failed to terminate sessions');
    }
  };

  const handleResendEmailVerification = async () => {
    try {
      setIsLoading(true);
      await apiClient.resendEmailVerification();
      showMessage('success', s?.emailVerificationSent || 'Verification email sent successfully');
    } catch (error) {
      showMessage('error', s?.emailVerificationFailed || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPhoneVerification = async () => {
    try {
      setIsLoading(true);
      await apiClient.resendPhoneVerification();
      showMessage('success', s?.phoneVerificationSent || 'Verification code sent successfully');
    } catch (error) {
      showMessage('error', s?.phoneVerificationFailed || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { label: s?.veryWeak || 'Very Weak', color: 'text-[#C2410C]' };
      case 2: return { label: s?.weak || 'Weak', color: 'text-[#C2410C]' };
      case 3: return { label: s?.fair || 'Fair', color: 'text-[#EAB308]' };
      case 4: return { label: s?.good || 'Good', color: 'text-[#008A05]' };
      case 5: return { label: s?.strong || 'Strong', color: 'text-[#008A05]' };
      default: return { label: '', color: 'text-[#717171]' };
    }
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return s?.justNow || 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ${s?.ago || 'ago'}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ${s?.ago || 'ago'}`;
    return `${Math.floor(diffInMinutes / 1440)}d ${s?.ago || 'ago'}`;
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";
  const labelClasses = "block text-[15px] font-medium text-[#222222] mb-2";

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* ── Page Header ── */}
      <div className="mb-10">
        <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">
          {s?.loginAndSecurity || "Login & security"}
        </h2>
        <p className="text-[16px] text-[#717171] mt-2">
          Update your password and secure your account.
        </p>
      </div>

      <div className="space-y-0">
        
        {/* ── Password Update ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
            <Lock className="w-5 h-5 stroke-[1.5]" />
            {s?.changePassword || "Change password"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[600px]">
            <div className="sm:col-span-2">
              <label htmlFor="currentPassword" className={labelClasses}>{s?.currentPassword || "Current password"}</label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className={cn(inputClasses, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222] focus:outline-none transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5 stroke-[1.5]" /> : <Eye className="h-5 w-5 stroke-[1.5]" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="newPassword" className={labelClasses}>{s?.newPassword || "New password"}</label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className={cn(inputClasses, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222] focus:outline-none transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5 stroke-[1.5]" /> : <Eye className="h-5 w-5 stroke-[1.5]" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 flex gap-1.5 h-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={cn(
                            "flex-1 rounded-full transition-colors duration-300",
                            passwordStrength >= level 
                              ? (passwordStrength <= 2 ? "bg-[#C2410C]" : passwordStrength === 3 ? "bg-[#EAB308]" : "bg-[#008A05]")
                              : "bg-[#EBEBEB]"
                          )} 
                        />
                      ))}
                    </div>
                    <span className={cn("text-[13px] font-semibold w-16 text-right", strengthInfo.color)}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  
                  <ul className="text-[13px] text-[#717171] space-y-1.5">
                    <li className={cn("flex items-center gap-2 transition-colors", passwordData.newPassword.length >= 8 ? "text-[#008A05]" : "")}>
                      {passwordData.newPassword.length >= 8 ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 stroke-[2]" />}
                      {s?.atLeast8Characters || "At least 8 characters"}
                    </li>
                    <li className={cn("flex items-center gap-2 transition-colors", /[A-Z]/.test(passwordData.newPassword) ? "text-[#008A05]" : "")}>
                      {/[A-Z]/.test(passwordData.newPassword) ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 stroke-[2]" />}
                      {s?.oneUppercaseLetter || "One uppercase letter"}
                    </li>
                    <li className={cn("flex items-center gap-2 transition-colors", /[0-9]/.test(passwordData.newPassword) ? "text-[#008A05]" : "")}>
                      {/[0-9]/.test(passwordData.newPassword) ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 stroke-[2]" />}
                      {s?.oneNumber || "One number"}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="confirmPassword" className={labelClasses}>{s?.confirmNewPassword || "Confirm new password"}</label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={cn(inputClasses, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222] focus:outline-none transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5 stroke-[1.5]" /> : <Eye className="h-5 w-5 stroke-[1.5]" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 pt-2">
              <Button
                onClick={handlePasswordChange}
                disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                className="h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[15px] transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
                {isLoading ? (s?.updating || 'Updating...') : (s?.updatePassword || 'Update password')}
              </Button>
            </div>

          </div>
        </section>

        {/* ── Two-Factor Authentication ── */}
        <section className="py-8 border-t border-[#DDDDDD]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 max-w-[800px]">
            <div className="max-w-lg">
              <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
                <Smartphone className="w-5 h-5 stroke-[1.5]" />
                {s?.twoFactorAuthentication || "Two-factor authentication"}
              </h3>
              <p className="text-[15px] text-[#717171] mt-2">
                {s?.authenticatorAppDesc || "Add an extra layer of security to your account. We'll ask for a code from your authenticator app when you log in."}
              </p>
            </div>
            
            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              {twoFactorEnabled ? (
                <span className="text-[15px] font-semibold text-[#008A05] flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" /> {s?.enabled || "Enabled"}
                </span>
              ) : (
                <span className="text-[15px] font-semibold text-[#717171]">
                  {s?.disabled || "Disabled"}
                </span>
              )}
              
              <Button
                onClick={handleToggle2FA}
                disabled={isLoading}
                variant="outline"
                className="h-12 px-6 rounded-lg border-[#222222] text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7] focus:outline-none disabled:opacity-50 w-full sm:w-auto"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#222222] border-t-transparent mr-2" />}
                {twoFactorEnabled ? (s?.disable || 'Disable') : (s?.enable || 'Enable')}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Account Verification ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6 max-w-[800px]">
          <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
            <Shield className="w-5 h-5 stroke-[1.5]" />
            {s?.accountVerification || "Account verification"}
          </h3>
          
          <div className="space-y-0 border border-[#DDDDDD] rounded-xl overflow-hidden">
            {/* Email */}
            <div className="p-5 sm:p-6 border-b border-[#EBEBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Key className="w-6 h-6 stroke-[1.5] text-[#222222] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[16px] font-medium text-[#222222]">{s?.emailVerification || "Email address"}</p>
                  <p className="text-[15px] text-[#717171] mt-0.5">{user.email}</p>
                </div>
              </div>
              
              <div>
                {user.emailVerified ? (
                  <span className="text-[14px] font-semibold text-[#008A05] flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" /> {s?.verified || "Verified"}
                  </span>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-[#C2410C]">
                      {s?.pending || "Pending"}
                    </span>
                    <Button 
                      variant="outline"
                      onClick={handleResendEmailVerification}
                      disabled={isLoading}
                      className="h-10 px-5 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold text-[14px] hover:border-[#222222] hover:bg-transparent"
                    >
                      {s?.resendEmail || "Verify"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Smartphone className="w-6 h-6 stroke-[1.5] text-[#222222] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[16px] font-medium text-[#222222]">{s?.phoneVerification || "Phone number"}</p>
                  <p className="text-[15px] text-[#717171] mt-0.5">{user.phoneNumber}</p>
                </div>
              </div>
              
              <div>
                {user.phoneVerified ? (
                  <span className="text-[14px] font-semibold text-[#008A05] flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" /> {s?.verified || "Verified"}
                  </span>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-[#C2410C]">
                      {s?.pending || "Pending"}
                    </span>
                    <Button 
                      variant="outline"
                      onClick={handleResendPhoneVerification}
                      disabled={isLoading}
                      className="h-10 px-5 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold text-[14px] hover:border-[#222222] hover:bg-transparent"
                    >
                      {s?.verifyPhone || "Verify"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Active Sessions ── */}
        <section className="py-8 border-t border-[#DDDDDD] max-w-[800px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
                <Monitor className="w-5 h-5 stroke-[1.5]" />
                {s?.activeSessions || "Device history"}
              </h3>
              <p className="text-[15px] text-[#717171] mt-2">
                Review the devices currently signed in to your account.
              </p>
            </div>
            
            <div className="flex items-center gap-5">
              <button
                onClick={fetchSessions}
                disabled={sessionsLoading}
                className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] disabled:opacity-50 transition-colors"
              >
                {s?.refresh || "Refresh"}
              </button>
              {sessions.length > 1 && (
                <button
                  onClick={handleTerminateAllSessions}
                  disabled={sessionsLoading}
                  className="text-[15px] font-semibold text-[#C2410C] underline hover:text-red-800 disabled:opacity-50 transition-colors"
                >
                  {s?.terminateAllOthers || "Log out all other devices"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-0 border border-[#DDDDDD] rounded-xl overflow-hidden bg-white">
            {sessionsLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#DDDDDD] border-t-[#222222]"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center p-8 text-[#717171] text-[15px]">
                {s?.noActiveSessionsFound || "No active sessions found"}
              </div>
            ) : (
              <div className="divide-y divide-[#EBEBEB]">
                {sessions.map((session) => (
                  <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-[#F7F7F7] transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[16px] font-semibold text-[#222222]">
                          {session.device}
                        </span>
                        {session.current && (
                          <span className="text-[11px] font-bold text-white bg-[#008A05] px-2 py-0.5 rounded-md tracking-wide">
                            {s?.current || "CURRENT"}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-[#717171]">
                        {session.location} · {session.ipAddress}
                      </p>
                      <p className="text-[13px] text-[#717171] flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" /> 
                        {s?.lastActive ? s.lastActive.replace('{time}', formatLastActive(session.lastActive)) : `Active ${formatLastActive(session.lastActive)}`}
                      </p>
                    </div>
                    
                    {!session.current && (
                      <button
                        onClick={() => handleTerminateSession(session.id)}
                        className="text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] text-left sm:text-right transition-colors"
                      >
                        {s?.terminate || "Log out device"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── Status Messages ── */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 min-w-[300px]",
              message.type === 'success' ? "bg-[#222222] text-white" : "bg-[#C2410C] text-white"
            )}
          >
            {message.type === 'success' ? (
              <ShieldCheck className="h-5 w-5 shrink-0 stroke-[2]" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            )}
            <span className="text-[15px] font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};