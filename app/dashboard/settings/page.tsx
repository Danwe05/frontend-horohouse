'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Eye,
  Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Import settings components
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const formatRole = (role: string) => {
    switch (role) {
      case 'registered_user':
        return 'Regular User';
      case 'agent':
        return 'Real Estate Agent';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'registered_user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      description: 'Personal information and profile details'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-4 w-4" />,
      description: 'Password, authentication, and security settings'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      description: 'Email, SMS, and push notification preferences'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: <Eye className="h-4 w-4" />,
      description: 'Privacy controls and data visibility'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Palette className="h-4 w-4" />,
      description: 'Search preferences and display settings'
    },
    {
      id: 'account',
      label: 'Account',
      icon: <Database className="h-4 w-4" />,
      description: 'Account management and data export'
    }
  ];

  return (

    <SidebarProvider>
      <div className="flex min-h-screen w-full">

        {/* Sidebar - Slimmer */}
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          {/* Main Content - Much Larger */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-screen pt-14 lg:pt-0">
            {/* Property Form Section */}
            <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent">
              <div className="bg-white rounded-xl shadow-ssm border border-gray-100 lg:border-none lg:shaddow-none lg:rounded-none">
          

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="grid grid-cols-1 lg:grid-row-2 gap-8">
                    {/* Settings Navigation */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-8">
                        <CardContent className="p-0">
                          <nav className="space-y-1 lg:row-span-6 overflow-x-scroll flex">
                            {settingsTabs.map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                                    : 'text-gray-700'
                                  }`}
                              >
                                <div className={`mt-0.5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`}>
                                  {tab.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${activeTab === tab.id ? 'text-blue-700' : 'text-gray-900'
                                    }`}>
                                    {tab.label}
                                  </p>
                                  {/* <p className="text-xs text-gray-500 mt-1">
                                    {tab.description}
                                  </p> */}
                                </div>
                              </button>
                            ))}
                          </nav>
                        </CardContent>
                      </div>
                    </div>

                    {/* Settings Content */}
                    <div className="lg:col-span-3 ">
                      <div className="space-y-6">
                        {activeTab === 'profile' && <ProfileSettings user={user} />}
                        {activeTab === 'security' && <SecuritySettings user={user} />}
                        {activeTab === 'notifications' && <NotificationSettings user={user} />}
                        {activeTab === 'privacy' && <PrivacySettings user={user} />}
                        {activeTab === 'preferences' && <PreferencesSettings user={user} />}
                        {activeTab === 'account' && <AccountSettings user={user} />}
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}