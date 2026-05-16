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
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Tab definitions ──────────────────────────────────────────────────────────

function SettingsContent({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const { isStudent } = useStudentMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  const BASE_TABS = [
    { id: 'profile', label: s?.profile || 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'security', label: s?.security || 'Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'notifications', label: s?.notifications || 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'privacy', label: s?.privacy || 'Privacy', icon: <Eye className="h-5 w-5" /> },
    { id: 'preferences', label: s?.preferences || 'Preferences', icon: <Palette className="h-5 w-5" /> },
    { id: 'account', label: s?.account || 'Account', icon: <Database className="h-5 w-5" /> },
  ];

  const STUDENT_TAB = {
    id: 'student-id',
    label: s?.studentId || 'Student ID',
    icon: <GraduationCap className="h-5 w-5" />,
  };

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
    <main className="max-w-[1200px] mx-auto w-full px-0 sm:px-6 lg:px-8 py-6 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

        {/* ── Sidebar nav ───────────────────────────────────── */}
        <div className="lg:w-[280px] flex-shrink-0 px-4 sm:px-0">
          <div className="sticky top-28 space-y-6">
            
            <div className="hidden lg:block mb-8">
              <h1 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-2">
                {s?.settings || "Settings"}
              </h1>
              <p className="text-[15px] text-[#717171]">
                {s?.settingsDesc || "Manage your profile, security, and preferences"}
              </p>
            </div>

            {/* Mobile (Horizontal Pills) */}
            <nav className="flex lg:hidden space-x-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 h-11 rounded-full text-[14px] transition-colors shrink-0 whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-[#222222] text-white font-semibold border border-[#222222]"
                      : "bg-white text-[#222222] font-medium border border-[#DDDDDD] hover:border-[#222222]"
                  )}
                >
                  {React.cloneElement(tab.icon, { className: cn("w-4 h-4", activeTab === tab.id ? "stroke-[2]" : "stroke-[1.5]") })}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Desktop (Vertical List) */}
            <nav className="hidden lg:flex flex-col space-y-1">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-colors w-full focus:outline-none",
                    activeTab === tab.id
                      ? "bg-[#F7F7F7] text-[#222222] font-semibold"
                      : "bg-transparent text-[#717171] font-medium hover:bg-[#F7F7F7] hover:text-[#222222]"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center transition-colors",
                    activeTab === tab.id ? "text-[#222222]" : "text-[#717171]"
                  )}>
                    {React.cloneElement(tab.icon, { className: cn("w-5 h-5", activeTab === tab.id ? "stroke-[2]" : "stroke-[1.5]") })}
                  </div>
                  <span className="text-[15px]">{tab.label}</span>
                </button>
              ))}
            </nav>
            
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'profile' && <ProfileSettings user={user} />}
              {activeTab === 'security' && <SecuritySettings user={user} />}
              {activeTab === 'notifications' && <NotificationSettings user={user} />}
              {activeTab === 'privacy' && <PrivacySettings user={user} />}
              {activeTab === 'preferences' && <PreferencesSettings user={user} />}
              {activeTab === 'account' && <AccountSettings user={user} />}
              {activeTab === 'student-id' && <StudentIdSettings />}
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#DDDDDD] border-t-[#222222]" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 flex flex-col min-h-screen bg-white">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-32 bg-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#DDDDDD] border-t-[#222222]" />
                </div>
              }
            >
              <SettingsContent user={user} />
            </Suspense>
          </div>
          
        </SidebarInset>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </SidebarProvider>
  );
}