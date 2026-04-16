'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
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

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'new_messages',
      title: 'New messages',
      description: 'When you receive a new message from agents or users.',
      icon: <MessageSquare className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
      email: true,
      sms: false,
      push: true,
      category: 'general'
    },
    {
      id: 'account_security',
      title: 'Account security',
      description: 'Login alerts and important security notifications.',
      icon: <AlertCircle className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
      email: true,
      sms: true,
      push: true,
      category: 'account'
    },
    ...(user.role === 'registered_user' ? [
      {
        id: 'new_properties',
        title: 'New properties',
        description: 'When new properties match your saved searches.',
        icon: <Home className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
        email: true,
        sms: false,
        push: true,
        category: 'property' as const
      },
      {
        id: 'price_changes',
        title: 'Price changes',
        description: 'When prices change on your favorite properties.',
        icon: <DollarSign className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
        email: true,
        sms: false,
        push: false,
        category: 'property' as const
      },
      {
        id: 'property_updates',
        title: 'Property updates',
        description: 'When your favorite properties are updated.',
        icon: <TrendingUp className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
        email: false,
        sms: false,
        push: true,
        category: 'property' as const
      }
    ] : []),
    ...(user.role === 'agent' ? [
      {
        id: 'new_inquiries',
        title: 'New inquiries',
        description: 'When someone inquires about your properties.',
        icon: <Users className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
        email: true,
        sms: true,
        push: true,
        category: 'property' as const
      },
      {
        id: 'property_views',
        title: 'Property views',
        description: 'Daily summary of property views and analytics.',
        icon: <TrendingUp className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
        email: true,
        sms: false,
        push: false,
        category: 'property' as const
      },
      {
        id: 'listing_approved',
        title: 'Listing approved',
        description: 'When your property listings are reviewed and approved.',
        icon: <Check className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
        email: true,
        sms: false,
        push: true,
        category: 'property' as const
      }
    ] : []),
    {
      id: 'newsletter',
      title: s?.newsletter || 'Newsletter',
      description: s?.newsletterDesc || 'Weekly newsletter with market insights and tips.',
      icon: <Mail className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
      email: true,
      sms: false,
      push: false,
      category: 'marketing'
    },
    {
      id: 'promotions',
      title: s?.promotions || 'Promotions',
      description: s?.promotionsDesc || 'Special offers and promotional content.',
      icon: <TrendingUp className="w-6 h-6 stroke-[1.5] text-[#222222]" />,
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
          acc[pref.id] = { email: pref.email, sms: pref.sms, push: pref.push };
          return acc;
        }, {} as Record<string, { email: boolean; sms: boolean; push: boolean }>)
      };

      await apiClient.request({
        method: 'PATCH',
        url: '/users/me/notification-settings',
        data: notificationSettings
      });

      setMessage({ type: 'success', text: 'Notification settings updated' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to update notification settings' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'general': return 'General notifications';
      case 'property': return user.role === 'agent' ? 'Property management' : 'Property alerts';
      case 'account': return 'Account & security';
      case 'marketing': return 'Marketing & updates';
      default: return 'Other';
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) acc[pref.category] = [];
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* ── Page Header ── */}
      <div className="mb-10">
        <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">
          {s?.notifications || "Notifications"}
        </h2>
        <p className="text-[16px] text-[#717171] mt-2">
          Choose how you want to be notified about updates, messages, and promotions.
        </p>
      </div>

      <div className="space-y-0">

        {/* ── Global Settings ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.globalNotificationSettings || "Global settings"}
          </h3>
          
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[16px] font-medium text-[#222222]">{s?.emailNotifications || "Email notifications"}</h4>
                  <p className="text-[15px] text-[#717171] mt-0.5">{s?.receiveNotificationsViaEmail || "Receive notifications via email"}</p>
                </div>
              </div>
              <Toggle active={globalSettings.email} onChange={(val) => handleGlobalSettingChange('email', val)} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Smartphone className="w-6 h-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[16px] font-medium text-[#222222]">{s?.smsNotifications || "SMS notifications"}</h4>
                  <p className="text-[15px] text-[#717171] mt-0.5">{s?.receiveNotificationsViaSms || "Receive notifications via SMS"}</p>
                </div>
              </div>
              <Toggle active={globalSettings.sms} onChange={(val) => handleGlobalSettingChange('sms', val)} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Bell className="w-6 h-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[16px] font-medium text-[#222222]">{s?.pushNotifications || "Push notifications"}</h4>
                  <p className="text-[15px] text-[#717171] mt-0.5">{s?.receivePushNotificationsInBrowser || "Receive push notifications in browser"}</p>
                </div>
              </div>
              <Toggle active={globalSettings.push} onChange={(val) => handleGlobalSettingChange('push', val)} />
            </div>
          </div>
        </section>

        {/* ── Detailed Preferences ── */}
        {Object.entries(groupedPreferences).map(([category, prefs]) => (
          <section key={category} className="py-8 border-t border-[#DDDDDD] space-y-6">
            <h3 className="text-[18px] font-semibold text-[#222222]">
              {getCategoryTitle(category)}
            </h3>
            
            <div className="space-y-0 max-w-3xl">
              {prefs.map((pref) => (
                <div key={pref.id} className="flex flex-col gap-4 py-6 border-b border-[#EBEBEB] last:border-0 last:pb-0 first:pt-0">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">{pref.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[16px] font-medium text-[#222222]">{pref.title}</h4>
                      <p className="text-[15px] text-[#717171] mt-0.5">{pref.description}</p>
                    </div>
                  </div>

                  {/* Channel toggles */}
                  <div className="flex flex-wrap items-center gap-6 sm:gap-8 ml-[40px]">
                    <label className={cn("flex items-center gap-3 cursor-pointer transition-opacity", !globalSettings.email && "opacity-50")}>
                      <input
                        type="checkbox"
                        checked={pref.email && globalSettings.email}
                        onChange={(e) => handlePreferenceChange(pref.id, 'email', e.target.checked)}
                        disabled={!globalSettings.email}
                        className="w-5 h-5 rounded border-[#B0B0B0] text-[#222222] focus:ring-[#222222] focus:ring-offset-0 transition-colors cursor-pointer accent-[#222222]"
                      />
                      <span className="text-[15px] text-[#222222]">Email</span>
                    </label>

                    <label className={cn("flex items-center gap-3 cursor-pointer transition-opacity", !globalSettings.sms && "opacity-50")}>
                      <input
                        type="checkbox"
                        checked={pref.sms && globalSettings.sms}
                        onChange={(e) => handlePreferenceChange(pref.id, 'sms', e.target.checked)}
                        disabled={!globalSettings.sms}
                        className="w-5 h-5 rounded border-[#B0B0B0] text-[#222222] focus:ring-[#222222] focus:ring-offset-0 transition-colors cursor-pointer accent-[#222222]"
                      />
                      <span className="text-[15px] text-[#222222]">SMS</span>
                    </label>

                    <label className={cn("flex items-center gap-3 cursor-pointer transition-opacity", !globalSettings.push && "opacity-50")}>
                      <input
                        type="checkbox"
                        checked={pref.push && globalSettings.push}
                        onChange={(e) => handlePreferenceChange(pref.id, 'push', e.target.checked)}
                        disabled={!globalSettings.push}
                        className="w-5 h-5 rounded border-[#B0B0B0] text-[#222222] focus:ring-[#222222] focus:ring-offset-0 transition-colors cursor-pointer accent-[#222222]"
                      />
                      <span className="text-[15px] text-[#222222]">Push</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── Notification Schedule ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.notificationSchedule || "Notification schedule"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {/* Quiet Hours */}
            <div>
              <h4 className="text-[16px] font-medium text-[#222222] mb-1">{s?.quietHours || "Quiet hours"}</h4>
              <p className="text-[15px] text-[#717171] mb-4">
                {s?.quietHoursDesc || "Pause push notifications during these hours."}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="quiet-start" className="text-[14px] text-[#222222] font-normal mb-2 block">{s?.from || "From"}</Label>
                  <Input type="time" id="quiet-start" defaultValue="22:00" className={inputClasses} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quiet-end" className="text-[14px] text-[#222222] font-normal mb-2 block">{s?.to || "To"}</Label>
                  <Input type="time" id="quiet-end" defaultValue="08:00" className={inputClasses} />
                </div>
              </div>
            </div>

            {/* Digest Frequency */}
            <div>
              <h4 className="text-[16px] font-medium text-[#222222] mb-1">{s?.digestFrequency || "Digest frequency"}</h4>
              <p className="text-[15px] text-[#717171] mb-4">
                {s?.digestFrequencyDesc || "How often would you like to receive summary emails?"}
              </p>
              <select className={cn(inputClasses, "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-12")}>
                <option value="immediate">{s?.immediate || "Immediate"}</option>
                <option value="daily">{s?.dailyDigest || "Daily digest"}</option>
                <option value="weekly">{s?.weeklyDigest || "Weekly digest"}</option>
                <option value="never">{s?.never || "Never"}</option>
              </select>
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

      {/* ── Save Action ── */}
      <div className="pt-8 border-t border-[#DDDDDD] flex justify-start">
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
  );
};