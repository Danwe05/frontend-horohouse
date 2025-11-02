'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Users, 
  Globe,
  Lock,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Save,
  Info
} from 'lucide-react';
import apiClient from '@/lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
}

interface PrivacySettingsProps {
  user: User;
}

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'profile' | 'activity' | 'data' | 'communication';
  level: 'public' | 'registered' | 'agents' | 'private';
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    // Profile Privacy
    {
      id: 'profile_visibility',
      title: 'Profile Visibility',
      description: 'Who can see your profile information',
      icon: <Users className="h-4 w-4" />,
      enabled: true,
      category: 'profile',
      level: 'registered'
    },
    {
      id: 'contact_info_visibility',
      title: 'Contact Information',
      description: 'Who can see your email and phone number',
      icon: <Eye className="h-4 w-4" />,
      enabled: false,
      category: 'profile',
      level: 'agents'
    },
    {
      id: 'location_visibility',
      title: 'Location Information',
      description: 'Who can see your location details',
      icon: <Globe className="h-4 w-4" />,
      enabled: true,
      category: 'profile',
      level: 'public'
    },
    
    // Activity Privacy
    {
      id: 'activity_tracking',
      title: 'Activity Tracking',
      description: 'Allow tracking of your browsing activity for personalization',
      icon: <Eye className="h-4 w-4" />,
      enabled: true,
      category: 'activity',
      level: 'private'
    },
    {
      id: 'search_history',
      title: 'Search History',
      description: 'Save your search history for better recommendations',
      icon: <Database className="h-4 w-4" />,
      enabled: true,
      category: 'activity',
      level: 'private'
    },
    {
      id: 'favorite_properties_public',
      title: 'Public Favorites',
      description: 'Allow others to see your favorite properties',
      icon: <Users className="h-4 w-4" />,
      enabled: false,
      category: 'activity',
      level: 'public'
    },
    
    // Data Privacy
    {
      id: 'analytics_participation',
      title: 'Analytics Participation',
      description: 'Help improve our service by sharing anonymous usage data',
      icon: <Database className="h-4 w-4" />,
      enabled: true,
      category: 'data',
      level: 'private'
    },
    {
      id: 'marketing_data_usage',
      title: 'Marketing Data Usage',
      description: 'Allow use of your data for personalized marketing',
      icon: <Shield className="h-4 w-4" />,
      enabled: false,
      category: 'data',
      level: 'private'
    },
    
    // Communication Privacy
    {
      id: 'direct_messages',
      title: 'Direct Messages',
      description: 'Who can send you direct messages',
      icon: <Users className="h-4 w-4" />,
      enabled: true,
      category: 'communication',
      level: 'registered'
    },
    {
      id: 'agent_contact',
      title: 'Agent Contact',
      description: 'Allow agents to contact you about properties',
      icon: <Users className="h-4 w-4" />,
      enabled: true,
      category: 'communication',
      level: 'agents'
    }
  ]);

  const handleSettingChange = (id: string, enabled: boolean) => {
    setPrivacySettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, enabled } : setting
    ));
  };

  const handleLevelChange = (id: string, level: PrivacySetting['level']) => {
    setPrivacySettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, level } : setting
    ));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const privacyData = privacySettings.reduce((acc, setting) => {
        acc[setting.id] = {
          enabled: setting.enabled,
          level: setting.level
        };
        return acc;
      }, {} as Record<string, { enabled: boolean; level: string }>);

      await apiClient.request({
        method: 'PATCH',
        url: '/users/me/privacy-settings',
        data: { settings: privacyData }
      });

      setMessage({ type: 'success', text: 'Privacy settings updated successfully' });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setMessage({ type: 'error', text: 'Failed to update privacy settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.request({
        method: 'POST',
        url: '/users/me/export-data',
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `horohouse-data-${user.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data export started. Download will begin shortly.' });
      setShowDataExportModal(false);
    } catch (error) {
      console.error('Failed to export data:', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      
      await apiClient.request({
        method: 'DELETE',
        url: '/users/me/account'
      });

      // Redirect to goodbye page or login
      window.location.href = '/auth/login?deleted=true';
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account' });
      setIsLoading(false);
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'profile':
        return 'Profile Privacy';
      case 'activity':
        return 'Activity Privacy';
      case 'data':
        return 'Data Privacy';
      case 'communication':
        return 'Communication Privacy';
      default:
        return 'Other';
    }
  };

  const getLevelBadge = (level: PrivacySetting['level']) => {
    switch (level) {
      case 'public':
        return <Badge className="bg-red-100 text-red-800">Public</Badge>;
      case 'registered':
        return <Badge className="bg-yellow-100 text-yellow-800">Registered Users</Badge>;
      case 'agents':
        return <Badge className="bg-blue-100 text-blue-800">Agents Only</Badge>;
      case 'private':
        return <Badge className="bg-green-100 text-green-800">Private</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const groupedSettings = privacySettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PrivacySetting[]>);

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Your Privacy Matters</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Control who can see your information and how your data is used. 
                  You can change these settings at any time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings by Category */}
      {Object.entries(groupedSettings).map(([category, settings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{getCategoryTitle(category)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 rounded-full bg-gray-100 mt-1">
                        {setting.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{setting.title}</h3>
                          {getLevelBadge(setting.level)}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{setting.description}</p>
                        
                        {(setting.category === 'profile' || setting.category === 'communication') && (
                          <div className="flex items-center space-x-4">
                            <Label className="text-sm font-medium text-gray-700">Visibility:</Label>
                            <select
                              value={setting.level}
                              onChange={(e) => handleLevelChange(setting.id, e.target.value as PrivacySetting['level'])}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!setting.enabled}
                            >
                              <option value="private">Private</option>
                              <option value="agents">Agents Only</option>
                              <option value="registered">Registered Users</option>
                              <option value="public">Public</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Export Your Data</h3>
                  <p className="text-sm text-gray-500">Download a copy of all your data</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDataExportModal(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-red-100">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountModal(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export Modal */}
      {showDataExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Your Data</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will create a downloadable file containing all your personal data, 
              including profile information, search history, favorites, and messages.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleDataExport}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDataExportModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">What will be deleted:</p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Your profile and personal information</li>
                  <li>• All saved properties and search history</li>
                  <li>• Messages and communication history</li>
                  <li>• Account preferences and settings</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};