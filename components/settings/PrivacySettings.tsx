'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  Globe,
  Database,
  Download,
  Trash2,
  AlertCircle,
  Check,
  ShieldCheck,
  Shield
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

// Custom  Toggle Switch
const Toggle = ({ active, onChange, disabled = false }: { active: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!active)}
    className={cn(
      "w-12 h-8 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:ring-offset-2 shrink-0",
      active ? "bg-[#222222]" : "bg-[#DDDDDD]",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    aria-pressed={active}
  >
    <div className={cn(
      "absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-[0_2px_4px_rgba(0,0,0,0.18)]",
      active ? "translate-x-4" : ""
    )} />
  </button>
);

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    // Profile Privacy
    {
      id: 'profile_visibility',
      title: s?.profileVisibility || 'Profile visibility',
      description: s?.profileVisibilityDesc || 'Who can see your profile information',
      icon: <Users className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: true,
      category: 'profile',
      level: 'registered'
    },
    {
      id: 'contact_info_visibility',
      title: s?.contactInformation || 'Contact information',
      description: s?.contactInfoVisibilityDesc || 'Who can see your email and phone number',
      icon: <Eye className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: false,
      category: 'profile',
      level: 'agents'
    },
    {
      id: 'location_visibility',
      title: s?.locationInformation || 'Location information',
      description: s?.locationVisibilityDesc || 'Who can see your location details',
      icon: <Globe className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: true,
      category: 'profile',
      level: 'public'
    },

    // Activity Privacy
    {
      id: 'activity_tracking',
      title: s?.activityTracking || 'Activity tracking',
      description: s?.activityTrackingDesc || 'Allow tracking of your browsing activity for personalization',
      icon: <Eye className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: true,
      category: 'activity',
      level: 'private'
    },
    {
      id: 'search_history',
      title: s?.searchHistory || 'Search history',
      description: s?.searchHistoryDesc || 'Save your search history for better recommendations',
      icon: <Database className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: true,
      category: 'activity',
      level: 'private'
    },
    {
      id: 'favorite_properties_public',
      title: s?.publicFavorites || 'Public favorites',
      description: s?.publicFavoritesDesc || 'Allow others to see your favorite properties',
      icon: <Users className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: false,
      category: 'activity',
      level: 'public'
    },

    // Data Privacy
    {
      id: 'analytics_participation',
      title: s?.analyticsParticipation || 'Analytics participation',
      description: s?.analyticsParticipationDesc || 'Help improve our service by sharing anonymous usage data',
      icon: <Database className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: true,
      category: 'data',
      level: 'private'
    },
    {
      id: 'marketing_data_usage',
      title: s?.marketingDataUsage || 'Marketing data usage',
      description: s?.marketingDataUsageDesc || 'Allow use of your data for personalized marketing',
      icon: <Shield className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: false,
      category: 'data',
      level: 'private'
    },

    // Communication Privacy
    {
      id: 'direct_messages',
      title: s?.directMessages || 'Direct messages',
      description: s?.directMessagesDesc || 'Who can send you direct messages',
      icon: <Users className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
      enabled: true,
      category: 'communication',
      level: 'registered'
    },
    {
      id: 'agent_contact',
      title: s?.agentContact || 'Agent contact',
      description: s?.agentContactDesc || 'Allow agents to contact you about properties',
      icon: <Users className="h-6 w-6 stroke-[1.5] text-[#222222]" />,
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const privacyData = privacySettings.reduce((acc, setting) => {
        acc[setting.id] = { enabled: setting.enabled, level: setting.level };
        return acc;
      }, {} as Record<string, { enabled: boolean; level: string }>);

      await apiClient.request({
        method: 'PATCH',
        url: '/users/me/privacy-settings',
        data: { settings: privacyData }
      });

      showMessage('success', 'Privacy settings updated successfully');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      showMessage('error', 'Failed to update privacy settings');
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

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `horohouse-data-${user.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setShowDataExportModal(false);
      showMessage('success', 'Data export started. Download will begin shortly.');
    } catch (error) {
      console.error('Failed to export data:', error);
      setShowDataExportModal(false);
      showMessage('error', 'Failed to export data');
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

      window.location.href = '/auth/login?deleted=true';
    } catch (error) {
      console.error('Failed to delete account:', error);
      showMessage('error', 'Failed to delete account');
      setIsLoading(false);
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'profile': return s?.profilePrivacy || 'Profile privacy';
      case 'activity': return s?.activityPrivacy || 'Activity privacy';
      case 'data': return s?.dataPrivacy || 'Data privacy';
      case 'communication': return s?.communicationPrivacy || 'Communication privacy';
      default: return 'Other';
    }
  };

  const getLevelLabel = (level: PrivacySetting['level']) => {
    switch (level) {
      case 'public': return s?.public || "Public";
      case 'registered': return s?.registeredUsers || "Registered users";
      case 'agents': return s?.agentsOnly || "Agents only";
      case 'private': return s?.private || "Private";
      default: return "Unknown";
    }
  };

  const groupedSettings = privacySettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PrivacySetting[]>);

  const selectClasses = "h-10 px-4 pr-10 rounded-lg border border-[#B0B0B0] bg-white text-[15px] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat";

  return (
    <div className="w-full max-w-[800px] animate-in fade-in duration-300 pb-24">
      
      {/* ── Page Header ── */}
      <div className="mb-10">
        <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">
          {s?.privacy || "Privacy"}
        </h2>
        <p className="text-[16px] text-[#717171] mt-2">
          Control what you share with the community and how your data is used.
        </p>
      </div>

      <div className="space-y-0">

        {/* ── Privacy Settings by Category ── */}
        {Object.entries(groupedSettings).map(([category, settings]) => (
          <section key={category} className="py-8 border-t border-[#DDDDDD] space-y-6">
            <h3 className="text-[18px] font-semibold text-[#222222]">
              {getCategoryTitle(category)}
            </h3>
            
            <div className="space-y-0 max-w-3xl">
              {settings.map((setting) => (
                <div key={setting.id} className="flex flex-col gap-4 py-6 border-b border-[#EBEBEB] last:border-0 last:pb-0 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">{setting.icon}</div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-[16px] font-medium text-[#222222]">{setting.title}</h4>
                        <p className="text-[15px] text-[#717171] mt-0.5">{setting.description}</p>
                      </div>
                    </div>
                    <div className="shrink-0 mt-1">
                      <Toggle active={setting.enabled} onChange={(val) => handleSettingChange(setting.id, val)} />
                    </div>
                  </div>

                  {/* Level Selector */}
                  {(setting.category === 'profile' || setting.category === 'communication') && (
                    <div className="flex items-center gap-4 ml-[40px] mt-2 transition-opacity" style={{ opacity: setting.enabled ? 1 : 0.5 }}>
                      <span className="text-[15px] font-medium text-[#222222] shrink-0">{s?.visibility || "Visibility:"}</span>
                      <select
                        value={setting.level}
                        onChange={(e) => handleLevelChange(setting.id, e.target.value as PrivacySetting['level'])}
                        className={selectClasses}
                        disabled={!setting.enabled}
                      >
                        <option value="private">{s?.private || "Private"}</option>
                        <option value="agents">{s?.agentsOnly || "Agents only"}</option>
                        <option value="registered">{s?.registeredUsers || "Registered users"}</option>
                        <option value="public">{s?.public || "Public"}</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── Data Management ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.dataManagement || "Data management"}
          </h3>
          
          <div className="space-y-0 max-w-3xl">
            
            {/* Export Data */}
            <div className="py-6 border-b border-[#EBEBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Download className="w-6 h-6 stroke-[1.5] text-[#222222] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[16px] font-medium text-[#222222]">{s?.exportYourData || "Export your data"}</h4>
                  <p className="text-[15px] text-[#717171] mt-0.5">{s?.exportYourDataDesc || "Download a copy of your personal data"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDataExportModal(true)}
                className="h-10 px-5 rounded-lg border-[#222222] text-[#222222] font-semibold text-[14px] hover:bg-[#F7F7F7] shrink-0"
              >
                {s?.exportData || "Request file"}
              </Button>
            </div>

            {/* Delete Account */}
            <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Trash2 className="w-6 h-6 stroke-[1.5] text-[#C2410C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[16px] font-medium text-[#222222]">{s?.deleteAccount || "Delete account"}</h4>
                  <p className="text-[15px] text-[#717171] mt-0.5">{s?.deleteAccountDesc || "Permanently delete your account and all data"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountModal(true)}
                className="h-10 px-5 rounded-lg border-[#C2410C] text-[#C2410C] font-semibold text-[14px] hover:bg-[#FFF7ED] shrink-0"
              >
                {s?.deleteAccount || "Delete account"}
              </Button>
            </div>

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
              "fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 min-w-[300px]",
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

      {/* ── Floating Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 sm:p-5 z-40">
        <div className="max-w-[800px] mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <p className="hidden sm:block text-[15px] text-[#717171]">
            Remember to save any changes you've made.
          </p>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[15px] transition-colors disabled:opacity-50"
          >
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
            {isLoading ? (s?.saving || 'Saving...') : (s?.saveChanges || 'Save changes')}
          </Button>
        </div>
      </div>

      {/* ── Data Export Modal ── */}
      {showDataExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[480px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-[22px] font-semibold text-[#222222] mb-3">{s?.exportDataModalTitle || "Export your data"}</h3>
            <p className="text-[15px] text-[#717171] mb-8 leading-relaxed">
              {s?.exportDataModalDesc || "This will create a downloadable JSON file containing all your personal data, including profile information, search history, favorites, and messages."}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDataExportModal(false)}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg border-[#222222] text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7]"
              >
                {s?.cancel || "Cancel"}
              </Button>
              <Button
                onClick={handleDataExport}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[15px]"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
                {isLoading ? (s?.exporting || 'Exporting...') : (s?.exportData || 'Download file')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[480px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-7 h-7 text-[#C2410C] stroke-[2]" />
              <h3 className="text-[22px] font-semibold text-[#222222]">{s?.deleteAccountModalTitle || "Delete account"}</h3>
            </div>
            
            <p className="text-[15px] text-[#717171] mb-6">
              {s?.deleteAccountModalDesc || "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."}
            </p>

            <div className="bg-[#FFF7ED] border border-[#C2410C]/20 rounded-xl p-5 mb-8">
              <p className="text-[14px] font-semibold text-[#C2410C] mb-3">{s?.whatWillBeDeleted || "What will be deleted:"}</p>
              <ul className="text-[14px] text-[#C2410C] space-y-2">
                <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[#C2410C] shrink-0" /> {s?.deletedItem1 || "Your profile and personal information"}</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[#C2410C] shrink-0" /> {s?.deletedItem2 || "All saved properties and search history"}</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[#C2410C] shrink-0" /> {s?.deletedItem3 || "Messages and communication history"}</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[#C2410C] shrink-0" /> {s?.deletedItem4 || "Account preferences and settings"}</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg border-[#222222] text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7]"
              >
                {s?.cancel || "Cancel"}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-[15px]"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
                {isLoading ? (s?.deleting || 'Deleting...') : (s?.deleteAccount || 'Delete account')}
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};