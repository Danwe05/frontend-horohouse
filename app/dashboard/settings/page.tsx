'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  Eye,
  Palette,
  Database,
  GraduationCap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

// Import settings components
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { StudentIdSettings } from '@/components/settings/StudentIdSettings';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { useStudentMode } from '@/contexts/StudentModeContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const BASE_TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: 'account',
    label: 'Account',
    icon: <Database className="h-4 w-4" />,
  },
];

const STUDENT_TAB = {
  id: 'student-id',
  label: 'Student ID',
  icon: <GraduationCap className="h-4 w-4" />,
};

// ─── Inner component that uses useSearchParams ────────────────────────────────
// Must be isolated so it can be wrapped in <Suspense> by the parent.

function SettingsContent({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const { isStudent } = useStudentMode();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read ?tab= from URL, fall back to 'profile'
  const [activeTab, setActiveTab] = useState<string>(() => {
    return searchParams.get('tab') ?? 'profile';
  });

  // Keep activeTab in sync if the URL changes (e.g. from a Link elsewhere in the app)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Sync URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Build tab list — append Student ID tab only for students
  const settingsTabs = isStudent ? [...BASE_TABS, STUDENT_TAB] : BASE_TABS;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">

        {/* ── Sidebar nav ───────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
                Settings
              </h1>
              <p className="text-sm text-gray-500">
                Manage your profile and preferences
              </p>
            </div>

            <nav className="flex space-x-2 overflow-x-auto pb-2 lg:block lg:space-x-0 lg:space-y-1 lg:overflow-visible">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group flex-shrink-0 lg:w-full
                    ${activeTab === tab.id
                      ? 'text-blue-700 bg-blue-50/50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-blue-50 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div
                    className={`relative z-10 flex items-center justify-center p-2 rounded-lg transition-colors
                      ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'
                      }
                      ${tab.id === 'student-id' && activeTab !== 'student-id'
                        ? 'bg-purple-50 text-purple-400 group-hover:bg-purple-50'
                        : ''
                      }`}
                  >
                    {tab.icon}
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold whitespace-nowrap pr-2
                        ${activeTab === tab.id
                          ? 'text-blue-900'
                          : 'text-gray-700 group-hover:text-gray-900'
                        }`}
                    >
                      {tab.label}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-6"
            >
              {activeTab === 'profile'       && <ProfileSettings user={user} />}
              {activeTab === 'security'      && <SecuritySettings user={user} />}
              {activeTab === 'notifications' && <NotificationSettings user={user} />}
              {activeTab === 'privacy'       && <PrivacySettings user={user} />}
              {activeTab === 'preferences'   && <PreferencesSettings user={user} />}
              {activeTab === 'account'       && <AccountSettings user={user} />}
              {activeTab === 'student-id'    && <StudentIdSettings />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
            <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent">
              <div className="bg-white rounded-xl shadow-ssm border border-gray-100 lg:border-none lg:shadow-none lg:rounded-none">

                {/* ✅ Suspense boundary wraps the component that calls useSearchParams() */}
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-24">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  }
                >
                  <SettingsContent user={user} />
                </Suspense>

              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}