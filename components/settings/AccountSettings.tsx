'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Download, 
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
  Calendar,
  HardDrive,
  Activity,
  Users,
  FileText,
  Settings,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface AccountSettingsProps {
  user: User;
}

interface AccountStats {
  totalLogins: number;
  dataUsage: string;
  storageUsed: string;
  accountAge: string;
  lastBackup?: string;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDataClearModal, setShowDataClearModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  
  // Mock account stats - in real app, fetch from API
  const [accountStats] = useState<AccountStats>({
    totalLogins: 127,
    dataUsage: '2.4 MB',
    storageUsed: '15.7 MB',
    accountAge: calculateAccountAge(user.createdAt),
    lastBackup: '2024-01-10T10:30:00Z'
  });

  function calculateAccountAge(createdAt?: string): string {
    if (!createdAt) return 'Unknown';
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) return `${diffInDays} days`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months`;
    return `${Math.floor(diffInDays / 365)} years`;
  }

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      
      const response = await apiClient.request({
        method: 'POST',
        url: '/users/me/export-data',
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `horohouse-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data export completed successfully' });
    } catch (error) {
      console.error('Failed to export data:', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('file', file);

      await apiClient.request({
        method: 'POST',
        url: '/users/me/import-data',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setMessage({ type: 'success', text: 'Data imported successfully' });
    } catch (error) {
      console.error('Failed to import data:', error);
      setMessage({ type: 'error', text: 'Failed to import data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async (dataType: string) => {
    try {
      setIsLoading(true);
      setMessage(null);

      await apiClient.request({
        method: 'DELETE',
        url: `/users/me/clear-data/${dataType}`
      });

      setMessage({ type: 'success', text: `${dataType} data cleared successfully` });
      setShowDataClearModal(false);
    } catch (error) {
      console.error(`Failed to clear ${dataType} data:`, error);
      setMessage({ type: 'error', text: `Failed to clear ${dataType} data` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsLoading(true);
      
      await apiClient.request({
        method: 'POST',
        url: '/users/me/deactivate',
        data: { reason: deactivateReason }
      });

      await logout();
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      setMessage({ type: 'error', text: 'Failed to deactivate account' });
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      await apiClient.request({
        method: 'POST',
        url: '/users/me/create-backup'
      });

      setMessage({ type: 'success', text: 'Backup created successfully' });
    } catch (error) {
      console.error('Failed to create backup:', error);
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-0">
      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Account Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Account Age</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{accountStats.accountAge}</p>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Total Logins</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{accountStats.totalLogins}</p>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Storage Used</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{accountStats.storageUsed}</p>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-4 w-4 text-orange-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Data Usage</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{accountStats.dataUsage}</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row">
                <span className="font-medium text-gray-700 sm:whitespace-nowrap">Account Created:</span>
                <span className="sm:ml-2 text-gray-600 break-words">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="font-medium text-gray-700 sm:whitespace-nowrap">Last Login:</span>
                <span className="sm:ml-2 text-gray-600 break-words">{formatDate(user.lastLoginAt)}</span>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="font-medium text-gray-700 sm:whitespace-nowrap">Last Backup:</span>
                <span className="sm:ml-2 text-gray-600 break-words">{formatDate(accountStats.lastBackup)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-700 sm:whitespace-nowrap">Account Status:</span>
                <Badge className="sm:ml-2 bg-green-100 text-green-800 text-xs mt-1 sm:mt-0 w-fit">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {/* Export Data */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100 flex-shrink-0">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Export Account Data</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Download all your data in JSON format</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isLoading}
                className="w-full sm:w-auto mt-2 sm:mt-0"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Import Data */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100 flex-shrink-0">
                  <Upload className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Import Account Data</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Restore data from a previous export</p>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-data"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-data')?.click()}
                  disabled={isLoading}
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>

            {/* Create Backup */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-purple-100 flex-shrink-0">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Create Backup</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Create a secure backup of your account</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="w-full sm:w-auto mt-2 sm:mt-0"
                size="sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Data Cleanup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-medium text-yellow-900 text-sm sm:text-base">Data Cleanup Options</h3>
                  <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                    These actions will permanently delete specific types of data. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleClearData('search-history')}
                disabled={isLoading}
                className="justify-start h-auto p-3 sm:p-4 text-left"
              >
                <div className="flex items-center space-x-3 w-full">
                  <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Clear Search History</p>
                    <p className="text-xs sm:text-sm text-gray-500">Remove all search queries</p>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleClearData('activity-log')}
                disabled={isLoading}
                className="justify-start h-auto p-3 sm:p-4 text-left"
              >
                <div className="flex items-center space-x-3 w-full">
                  <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Clear Activity Log</p>
                    <p className="text-xs sm:text-sm text-gray-500">Remove browsing activity</p>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleClearData('message-history')}
                disabled={isLoading}
                className="justify-start h-auto p-3 sm:p-4 text-left"
              >
                <div className="flex items-center space-x-3 w-full">
                  <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Clear Messages</p>
                    <p className="text-xs sm:text-sm text-gray-500">Remove all conversations</p>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowDataClearModal(true)}
                disabled={isLoading}
                className="justify-start h-auto p-3 sm:p-4 text-left"
              >
                <div className="flex items-center space-x-3 w-full">
                  <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Clear All Data</p>
                    <p className="text-xs sm:text-sm text-gray-500">Remove all user data</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Account Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {/* Deactivate Account */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-orange-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-orange-100 flex-shrink-0">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Deactivate Account</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Temporarily disable your account</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeactivateModal(true)}
                className="w-full sm:w-auto mt-2 sm:mt-0 border-orange-300 text-orange-600 hover:bg-orange-50"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-red-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Delete Account</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/settings?tab=privacy#delete-account'}
                className="w-full sm:w-auto mt-2 sm:mt-0 border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="p-2 rounded-full bg-orange-100 flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Deactivate Account</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <p className="text-sm text-gray-600">
                Your account will be temporarily disabled. You can reactivate it anytime by logging in again.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="deactivate-reason" className="text-sm">Reason for deactivation (optional)</Label>
                <textarea
                  id="deactivate-reason"
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Help us improve by telling us why you're deactivating..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={handleDeactivateAccount}
                disabled={isLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Deactivating...' : 'Deactivate Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeactivateModal(false)}
                disabled={isLoading}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Modal */}
      {showDataClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Clear All Data</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <p className="text-sm text-gray-600">
                This will permanently delete all your data including search history, favorites, messages, and activity logs. This action cannot be undone.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">This will delete:</p>
                <ul className="text-xs sm:text-sm text-red-700 mt-2 space-y-1">
                  <li className="break-words">• Search history and saved searches</li>
                  <li className="break-words">• Favorite properties</li>
                  <li className="break-words">• Message conversations</li>
                  <li className="break-words">• Activity and browsing logs</li>
                  <li className="break-words">• Preferences and settings</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => handleClearData('all')}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Clearing...' : 'Clear All Data'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDataClearModal(false)}
                disabled={isLoading}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`p-3 sm:p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm break-words">{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};