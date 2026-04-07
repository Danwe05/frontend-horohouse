'use client';

import React, { useState, useRef } from 'react';
import {
  Database, Download, Upload, Trash2, RefreshCw, AlertCircle,
  Check, Calendar, HardDrive, Activity, Shield, Clock,
  FileJson, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDataClearModal, setShowDataClearModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  // ── SAFE TEXT EXTRACTORS ──
  const safeTitle = (val: any, fallback: string) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.title) return val.title;
    return fallback;
  };
  const safeDesc = (objVal: any, strVal: any, fallback: string) => {
    if (typeof strVal === 'string') return strVal;
    if (objVal && typeof objVal === 'object' && objVal.description) return objVal.description;
    return fallback;
  };

  // Mock account stats
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- Handlers ---
  const handleExportData = async () => {
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
      link.setAttribute('download', `horohouse-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage('success', safeTitle(s?.exportSuccess, 'Data export completed successfully'));
    } catch (error) {
      console.error('Failed to export data:', error);
      showMessage('error', safeTitle(s?.exportFailed, 'Failed to export data'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.request({
        method: 'POST',
        url: '/users/me/import-data',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('success', safeTitle(s?.importSuccess, 'Data imported successfully'));
    } catch (error) {
      console.error('Failed to import data:', error);
      showMessage('error', safeTitle(s?.importFailed, 'Failed to import data'));
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearData = async (dataType: string) => {
    try {
      setIsLoading(true);
      await apiClient.request({
        method: 'DELETE',
        url: `/users/me/clear-data/${dataType}`
      });
      showMessage('success', safeTitle(s?.dataCleared, `${dataType} data cleared successfully`));
      setShowDataClearModal(false);
    } catch (error) {
      console.error(`Failed to clear ${dataType} data:`, error);
      showMessage('error', safeTitle(s?.dataClearFailed, `Failed to clear ${dataType} data`));
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
      showMessage('error', safeTitle(s?.deactivateFailed, 'Failed to deactivate account'));
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      await apiClient.request({ method: 'POST', url: '/users/me/create-backup' });
      showMessage('success', safeTitle(s?.backupSuccess, 'Backup created successfully'));
    } catch (error) {
      console.error('Failed to create backup:', error);
      showMessage('error', safeTitle(s?.backupFailed, 'Failed to create backup'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // --- Reusable UI Components ---
  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="border border-[#DDDDDD] rounded-xl p-5 flex flex-col gap-3 bg-white">
      <Icon className="w-6 h-6 text-[#717171] stroke-[1.5]" />
      <div>
        <div className="text-[22px] font-semibold text-[#222222] tracking-tight">{value}</div>
        <div className="text-[14px] text-[#717171]">{label}</div>
      </div>
    </div>
  );

  const ActionRow = ({ icon: Icon, title, desc, onClick, actionLabel, destructive = false }: any) => (
    <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBEB] last:border-0 last:pb-0 first:pt-0 group">
      <div className="flex items-start gap-4">
        <Icon className={cn("w-6 h-6 stroke-[1.5] shrink-0 mt-0.5", destructive ? "text-[#C2410C]" : "text-[#222222]")} />
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-[16px] font-medium text-[#222222]">{title}</h4>
          <p className="text-[15px] text-[#717171] mt-0.5">{desc}</p>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={onClick}
        className={cn(
          "h-10 px-5 rounded-lg font-semibold text-[14px] shrink-0 transition-colors",
          destructive 
            ? "border-[#C2410C] text-[#C2410C] hover:bg-[#FFF7ED]" 
            : "border-[#222222] text-[#222222] hover:bg-[#F7F7F7]"
        )}
      >
        {actionLabel}
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-[800px] animate-in fade-in duration-300 pb-24">

      {/* ── Page Header ── */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">
              {safeTitle(s?.dataAndPrivacy, "Data & privacy")}
            </h2>
            <p className="text-[16px] text-[#717171] mt-2">
              {safeDesc(s?.dataAndPrivacy, s?.dataAndPrivacyDesc, "Manage your personal data, exports, and account security.")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[14px] font-medium text-[#222222] bg-[#F7F7F7] px-3 py-1.5 rounded-full border border-[#DDDDDD] w-fit">
            <span className="w-2 h-2 rounded-full bg-[#008A05] animate-pulse"></span>
            {safeTitle(s?.statusActive, "Status: Active")}
          </div>
        </div>
      </div>

      <div className="space-y-0">

        {/* ── Stats Overview ── */}
        <section className="pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Calendar}
              label={safeTitle(s?.accountAge, "Account age")}
              value={accountStats.accountAge}
            />
            <StatCard
              icon={Activity}
              label={safeTitle(s?.totalLogins, "Total logins")}
              value={accountStats.totalLogins}
            />
            <StatCard
              icon={HardDrive}
              label={safeTitle(s?.storage, "Storage")}
              value={accountStats.storageUsed}
            />
            <StatCard
              icon={Shield}
              label={safeTitle(s?.lastBackup, "Last backup")}
              value={formatDate(accountStats.lastBackup)}
            />
          </div>
        </section>

        {/* ── Data Portability ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {safeTitle(s?.dataPortability, "Data portability")}
          </h3>
          
          <div className="space-y-0 max-w-3xl">
            <ActionRow
              icon={Download}
              title={safeTitle(s?.exportData, "Export your data")}
              desc={safeDesc(s?.exportData, s?.exportDataDesc, "Download a JSON copy of your messages, settings, and history.")}
              onClick={handleExportData}
              actionLabel={safeTitle(s?.exportJson, "Export data")}
            />
            
            <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBEB] last:border-0 last:pb-0 first:pt-0">
              <div className="flex items-start gap-4">
                <Upload className="w-6 h-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[16px] font-medium text-[#222222]">{safeTitle(s?.importData, "Import data")}</h4>
                  <p className="text-[15px] text-[#717171] mt-0.5">{safeDesc(s?.importData, s?.importDataDesc, "Restore your account from a previous HoroHouse backup file.")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" ref={fileInputRef} disabled={isLoading} />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading} 
                  className="h-10 px-5 rounded-lg border-[#222222] text-[#222222] font-semibold text-[14px] hover:bg-[#F7F7F7] shrink-0"
                >
                  {safeTitle(s?.selectFile, "Select file")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Data Cleanup / Maintenance ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {safeTitle(s?.maintenance, "Maintenance")}
          </h3>
          
          <div className="space-y-0 max-w-3xl">
            <ActionRow
              icon={FileJson}
              title={safeTitle(s?.clearSearchHistory, "Clear search history")}
              desc={safeDesc(s?.clearSearchHistory, s?.clearSearchHistoryDesc, "Remove all saved searches and recent queries.")}
              onClick={() => handleClearData('search-history')}
              actionLabel={safeTitle(s?.clearData, "Clear")}
            />
            <ActionRow
              icon={Activity}
              title={safeTitle(s?.clearActivityLog, "Clear activity log")}
              desc={safeDesc(s?.clearActivityLog, s?.clearActivityLogDesc, "Remove browsing history and interaction logs.")}
              onClick={() => handleClearData('activity-log')}
              actionLabel={safeTitle(s?.clearData, "Clear")}
            />
            <ActionRow
              icon={Shield}
              title={safeTitle(s?.createManualBackup, "Create manual backup")}
              desc={safeDesc(s?.createManualBackup, s?.createManualBackupDesc, "Save a secure snapshot of your current state.")}
              onClick={handleCreateBackup}
              actionLabel={safeTitle(s?.createBackupBtn, "Create backup")}
            />
          </div>
        </section>

        {/* ── Danger Zone ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <div>
            <h3 className="text-[18px] font-semibold text-[#C2410C]">
              {safeTitle(s?.dangerZone, "Danger zone")}
            </h3>
            <p className="text-[15px] text-[#717171] mt-1">
              {safeDesc(s?.dangerZone, s?.dangerZoneDesc, "These actions are destructive. Please ensure you have exported your data before proceeding.")}
            </p>
          </div>
          
          <div className="space-y-0 max-w-3xl">
            <ActionRow
              icon={Trash2}
              title={safeTitle(s?.clearMessages, "Clear messages")}
              desc={safeDesc(s?.clearMessages, s?.clearMessagesDesc, "Permanently delete all your inbox messages.")}
              onClick={() => handleClearData('message-history')}
              actionLabel={safeTitle(s?.clearData, "Clear")}
              destructive
            />
            <ActionRow
              icon={Clock}
              title={safeTitle(s?.deactivateAccount, "Deactivate account")}
              desc={safeDesc(s?.deactivateAccount, s?.deactivateAccountDesc, "Temporarily hide your profile and listings.")}
              onClick={() => setShowDeactivateModal(true)}
              actionLabel={safeTitle(s?.deactivate, "Deactivate")}
              destructive
            />
            <ActionRow
              icon={AlertCircle}
              title={safeTitle(s?.deleteAllData, "Delete all data")}
              desc={safeDesc(s?.deleteAllData, s?.deleteAllDataDesc, "Permanently erase your account and all associated data.")}
              onClick={() => setShowDataClearModal(true)}
              actionLabel={safeTitle(s?.deleteAccount, "Delete")}
              destructive
            />
          </div>
          
          <div className="bg-[#F7F7F7] p-5 rounded-xl text-[14px] text-[#717171] leading-relaxed max-w-3xl border border-[#DDDDDD]">
            <strong className="text-[#222222] font-semibold">{safeTitle(s?.privacyNote, "Privacy note:")}</strong> {safeDesc(s?.privacyNote, s?.privacyNoteDesc, "When you delete data, it is removed from our live servers immediately. Backups are retained for 30 days before permanent deletion.")}
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

      {/* ── Deactivate Modal ── */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[480px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-7 h-7 text-[#C2410C] stroke-[2]" />
              <h3 className="text-[22px] font-semibold text-[#222222]">{safeTitle(s?.pauseAccount, "Pause your account?")}</h3>
            </div>
            
            <p className="text-[15px] text-[#717171] mb-6">
              {safeDesc(s?.pauseAccount, s?.pauseAccountDesc, "Your profile will be hidden immediately. You can reactivate anytime by logging back in.")}
            </p>

            <div className="space-y-6">
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder={safeTitle(s?.tellUsWhy, "Optional: Tell us why you're taking a break...")}
                className="w-full px-4 py-3 border border-[#B0B0B0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent resize-none text-[16px] text-[#222222] placeholder:text-[#717171] min-h-[100px] transition-all"
              />
              
              <div className="flex items-center justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeactivateModal(false)} 
                  className="h-12 px-6 rounded-lg border-[#222222] text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7]"
                >
                  {safeTitle(s?.cancel, "Cancel")}
                </Button>
                <Button 
                  onClick={handleDeactivateAccount} 
                  disabled={isLoading} 
                  className="h-12 px-6 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-[15px]"
                >
                  {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
                  {isLoading ? safeTitle(s?.processing, 'Processing...') : safeTitle(s?.deactivate, 'Deactivate')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Clear All Data Modal ── */}
      {showDataClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[480px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-7 h-7 text-[#C2410C] stroke-[2]" />
              <h3 className="text-[22px] font-semibold text-[#222222]">{safeTitle(s?.nukeAllData, "Nuke all data?")}</h3>
            </div>
            
            <p className="text-[15px] text-[#717171] mb-6">
              {safeDesc(s?.nukeAllData, s?.nukeAllDataDesc, "This action is irreversible. Everything listed below will be permanently destroyed.")}
            </p>

            <div className="bg-[#FFF7ED] border border-[#C2410C]/20 rounded-xl p-5 mb-8">
              <ul className="text-[14px] text-[#C2410C] space-y-3 font-medium">
                <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 shrink-0" /> {safeTitle(s?.searchHistoryFavorites, "Search history & favorites")}</li>
                <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 shrink-0" /> {safeTitle(s?.allMessages, "All messages (both sides)")}</li>
                <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 shrink-0" /> {safeTitle(s?.profileSettingsPreferences, "Profile settings & preferences")}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => handleClearData('all')}
                disabled={isLoading}
                className="w-full bg-[#C2410C] hover:bg-[#9A3412] h-12 rounded-lg text-white font-semibold text-[15px]"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
                {isLoading ? safeTitle(s?.deleting, 'Deleting...') : safeTitle(s?.yesDeleteEverything, 'Yes, Delete Everything')}
              </Button>
              <button
                onClick={() => setShowDataClearModal(false)}
                className="text-[15px] text-[#222222] hover:text-[#717171] font-semibold py-2 transition-colors focus:outline-none"
              >
                {safeTitle(s?.noKeepData, "No, keep my data")}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};