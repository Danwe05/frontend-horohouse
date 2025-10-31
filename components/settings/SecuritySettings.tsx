'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Check,
  X,
  Clock,
  Globe,
  Monitor,
  Save,
  RefreshCw
} from 'lucide-react';
import apiClient from '@/lib/api';

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

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await apiClient.getSessions();
      setSessions(response.sessions || response); // Handle different response structures
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setMessage({ type: 'error', text: 'Failed to load active sessions' });
    } finally {
      setSessionsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setMessage({ type: 'success', text: 'Password updated successfully' });
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage({ type: 'error', text: 'Failed to change password. Please check your current password.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setIsLoading(true);
      
      if (!twoFactorEnabled) {
        // Enable 2FA
        await apiClient.enable2FA();
        setTwoFactorEnabled(true);
        setMessage({ type: 'success', text: 'Two-factor authentication enabled' });
      } else {
        // Disable 2FA
        await apiClient.disable2FA();
        setTwoFactorEnabled(false);
        setMessage({ type: 'success', text: 'Two-factor authentication disabled' });
      }
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to update two-factor authentication' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await apiClient.terminateSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setMessage({ type: 'success', text: 'Session terminated successfully' });
    } catch (error) {
      console.error('Failed to terminate session:', error);
      setMessage({ type: 'error', text: 'Failed to terminate session' });
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      await apiClient.terminateAllSessions();
      // Refresh sessions list to get updated data
      await fetchSessions();
      setMessage({ type: 'success', text: 'All other sessions terminated successfully' });
    } catch (error) {
      console.error('Failed to terminate sessions:', error);
      setMessage({ type: 'error', text: 'Failed to terminate sessions' });
    }
  };

  const handleResendEmailVerification = async () => {
    try {
      setIsLoading(true);
      await apiClient.resendEmailVerification();
      setMessage({ type: 'success', text: 'Verification email sent successfully' });
    } catch (error) {
      console.error('Failed to resend email verification:', error);
      setMessage({ type: 'error', text: 'Failed to send verification email' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPhoneVerification = async () => {
    try {
      setIsLoading(true);
      await apiClient.resendPhoneVerification();
      setMessage({ type: 'success', text: 'Verification code sent successfully' });
    } catch (error) {
      console.error('Failed to resend phone verification:', error);
      setMessage({ type: 'error', text: 'Failed to send verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
      case 1:
        return { label: 'Very Weak', color: 'text-red-600' };
      case 2:
        return { label: 'Weak', color: 'text-orange-600' };
      case 3:
        return { label: 'Fair', color: 'text-yellow-600' };
      case 4:
        return { label: 'Good', color: 'text-blue-600' };
      case 5:
        return { label: 'Strong', color: 'text-green-600' };
      default:
        return { label: 'Unknown', color: 'text-gray-600' };
    }
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {passwordData.newPassword && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength <= 1 ? 'bg-red-500 w-1/5' :
                        passwordStrength === 2 ? 'bg-orange-500 w-2/5' :
                        passwordStrength === 3 ? 'bg-yellow-500 w-3/5' :
                        passwordStrength === 4 ? 'bg-blue-500 w-4/5' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${strengthInfo.color}`}>
                    {strengthInfo.label}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Password requirements:</p>
                  <ul className="space-y-1 ml-4">
                    <li className={`flex items-center space-x-1 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordData.newPassword.length >= 8 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center space-x-1 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/[A-Z]/.test(passwordData.newPassword) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One uppercase letter</span>
                    </li>
                    <li className={`flex items-center space-x-1 ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/[a-z]/.test(passwordData.newPassword) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One lowercase letter</span>
                    </li>
                    <li className={`flex items-center space-x-1 ${/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/[0-9]/.test(passwordData.newPassword) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One number</span>
                    </li>
                    <li className={`flex items-center space-x-1 ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      {/[^A-Za-z0-9]/.test(passwordData.newPassword) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One special character</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-xs text-red-600 flex items-center space-x-1">
                <X className="h-3 w-3" />
                <span>Passwords do not match</span>
              </p>
            )}
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
            className="w-full"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Authenticator App</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add an extra layer of security to your account using an authenticator app.
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {twoFactorEnabled ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <X className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleToggle2FA}
              disabled={isLoading}
              variant={twoFactorEnabled ? "outline" : "default"}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : null}
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Account Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${user.emailVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Key className={`h-4 w-4 ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email Verification</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.emailVerified ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleResendEmailVerification}
                      disabled={isLoading}
                    >
                      Resend Email
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${user.phoneVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Smartphone className={`h-4 w-4 ${user.phoneVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Phone Verification</h3>
                  <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.phoneVerified ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleResendPhoneVerification}
                      disabled={isLoading}
                    >
                      Verify Phone
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>Active Sessions</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSessions}
                disabled={sessionsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${sessionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTerminateAllSessions}
                disabled={sessionsLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Terminate All Others
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-gray-600">Loading sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${session.current ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Monitor className={`h-4 w-4 ${session.current ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{session.device}</h3>
                        {session.current && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {session.location} • {session.ipAddress}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Last active {formatLastActive(session.lastActive)}</span>
                      </p>
                    </div>
                  </div>
                  
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Terminate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};