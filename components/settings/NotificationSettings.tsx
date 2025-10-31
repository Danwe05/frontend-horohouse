'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Home,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Check,
  Save
} from 'lucide-react';
import apiClient from '@/lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
}

interface NotificationSettingsProps {
  user: User;
}

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  sms: boolean;
  push: boolean;
  category: 'general' | 'property' | 'account' | 'marketing';
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    // General Notifications
    {
      id: 'new_messages',
      title: 'New Messages',
      description: 'When you receive a new message from agents or users',
      icon: <MessageSquare className="h-4 w-4" />,
      email: true,
      sms: false,
      push: true,
      category: 'general'
    },
    {
      id: 'account_security',
      title: 'Account Security',
      description: 'Login alerts and security notifications',
      icon: <AlertCircle className="h-4 w-4" />,
      email: true,
      sms: true,
      push: true,
      category: 'account'
    },
    
    // Property Notifications (for users)
    ...(user.role === 'registered_user' ? [
      {
        id: 'new_properties',
        title: 'New Properties',
        description: 'When new properties match your saved searches',
        icon: <Home className="h-4 w-4" />,
        email: true,
        sms: false,
        push: true,
        category: 'property' as const
      },
      {
        id: 'price_changes',
        title: 'Price Changes',
        description: 'When prices change on your favorite properties',
        icon: <DollarSign className="h-4 w-4" />,
        email: true,
        sms: false,
        push: false,
        category: 'property' as const
      },
      {
        id: 'property_updates',
        title: 'Property Updates',
        description: 'When your favorite properties are updated',
        icon: <TrendingUp className="h-4 w-4" />,
        email: false,
        sms: false,
        push: true,
        category: 'property' as const
      }
    ] : []),
    
    // Agent Notifications
    ...(user.role === 'agent' ? [
      {
        id: 'new_inquiries',
        title: 'New Inquiries',
        description: 'When someone inquires about your properties',
        icon: <Users className="h-4 w-4" />,
        email: true,
        sms: true,
        push: true,
        category: 'property' as const
      },
      {
        id: 'property_views',
        title: 'Property Views',
        description: 'Daily summary of property views',
        icon: <TrendingUp className="h-4 w-4" />,
        email: true,
        sms: false,
        push: false,
        category: 'property' as const
      },
      {
        id: 'listing_approved',
        title: 'Listing Approved',
        description: 'When your property listings are approved',
        icon: <Check className="h-4 w-4" />,
        email: true,
        sms: false,
        push: true,
        category: 'property' as const
      }
    ] : []),
    
    // Marketing Notifications
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Weekly newsletter with market insights and tips',
      icon: <Mail className="h-4 w-4" />,
      email: true,
      sms: false,
      push: false,
      category: 'marketing'
    },
    {
      id: 'promotions',
      title: 'Promotions',
      description: 'Special offers and promotional content',
      icon: <TrendingUp className="h-4 w-4" />,
      email: false,
      sms: false,
      push: false,
      category: 'marketing'
    }
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    email: user.emailNotifications ?? true,
    sms: user.smsNotifications ?? true,
    push: user.pushNotifications ?? true
  });

  const handlePreferenceChange = (id: string, type: 'email' | 'sms' | 'push', value: boolean) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id ? { ...pref, [type]: value } : pref
    ));
  };

  const handleGlobalSettingChange = (type: 'email' | 'sms' | 'push', value: boolean) => {
    setGlobalSettings(prev => ({ ...prev, [type]: value }));
    
    // If disabling globally, disable all individual preferences
    if (!value) {
      setPreferences(prev => prev.map(pref => ({ ...pref, [type]: false })));
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const notificationSettings = {
        globalSettings,
        preferences: preferences.reduce((acc, pref) => {
          acc[pref.id] = {
            email: pref.email,
            sms: pref.sms,
            push: pref.push
          };
          return acc;
        }, {} as Record<string, { email: boolean; sms: boolean; push: boolean }>)
      };

      await apiClient.request({
        method: 'PATCH',
        url: '/users/me/notification-settings',
        data: notificationSettings
      });

      setMessage({ type: 'success', text: 'Notification settings updated successfully' });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to update notification settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'general':
        return 'General Notifications';
      case 'property':
        return user.role === 'agent' ? 'Property Management' : 'Property Alerts';
      case 'account':
        return 'Account & Security';
      case 'marketing':
        return 'Marketing & Updates';
      default:
        return 'Other';
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Global Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.email}
                  onChange={(e) => handleGlobalSettingChange('email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Smartphone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.sms}
                  onChange={(e) => handleGlobalSettingChange('sms', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Bell className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.push}
                  onChange={(e) => handleGlobalSettingChange('push', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Preferences */}
      {Object.entries(groupedPreferences).map(([category, prefs]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{getCategoryTitle(category)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prefs.map((pref) => (
                <div key={pref.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 rounded-full bg-gray-100">
                      {pref.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{pref.title}</h3>
                      <p className="text-sm text-gray-500">{pref.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 ml-11">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${pref.id}-email`}
                        checked={pref.email && globalSettings.email}
                        onChange={(e) => handlePreferenceChange(pref.id, 'email', e.target.checked)}
                        disabled={!globalSettings.email}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label 
                        htmlFor={`${pref.id}-email`} 
                        className={`text-sm ${!globalSettings.email ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        Email
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${pref.id}-sms`}
                        checked={pref.sms && globalSettings.sms}
                        onChange={(e) => handlePreferenceChange(pref.id, 'sms', e.target.checked)}
                        disabled={!globalSettings.sms}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label 
                        htmlFor={`${pref.id}-sms`} 
                        className={`text-sm ${!globalSettings.sms ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        SMS
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${pref.id}-push`}
                        checked={pref.push && globalSettings.push}
                        onChange={(e) => handlePreferenceChange(pref.id, 'push', e.target.checked)}
                        disabled={!globalSettings.push}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label 
                        htmlFor={`${pref.id}-push`} 
                        className={`text-sm ${!globalSettings.push ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        Push
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Notification Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Quiet Hours</Label>
              <p className="text-sm text-gray-500 mb-3">
                Don't send push notifications during these hours
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="quiet-start" className="text-sm">From:</Label>
                  <input
                    type="time"
                    id="quiet-start"
                    defaultValue="22:00"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="quiet-end" className="text-sm">To:</Label>
                  <input
                    type="time"
                    id="quiet-end"
                    defaultValue="08:00"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Digest Frequency</Label>
              <p className="text-sm text-gray-500 mb-3">
                How often would you like to receive summary emails?
              </p>
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="immediate">Immediate</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
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
              <AlertCircle className="h-4 w-4" />
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