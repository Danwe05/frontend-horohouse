'use client';

import React, { useState } from 'react';
import { 
  Database, Download, Upload, Trash2, RefreshCw, AlertTriangle, 
  Check, Calendar, HardDrive, Activity, Shield, Clock, 
  FileJson, AlertCircle, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

// --- Types (Kept same) ---
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
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};
  
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

  // --- Handlers (Kept exactly the same logic) ---
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
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
        headers: { 'Content-Type': 'multipart/form-data' }
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
      await apiClient.request({ method: 'POST', url: '/users/me/create-backup' });
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
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // --- Reusable UI Components for this view ---
  const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-full mb-3 ${colorClass.bg}`}>
        <Icon className={`w-5 h-5 ${colorClass.text}`} />
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
  );

  const ActionRow = ({ icon: Icon, title, desc, onClick, colorClass, destructive = false }: any) => (
    <div 
      onClick={onClick}
      className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer
        ${destructive 
          ? 'bg-red-50/50 border-red-100 hover:bg-red-50 hover:border-red-200' 
          : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${colorClass.bg}`}>
          <Icon className={`w-5 h-5 ${colorClass.text}`} />
        </div>
        <div>
          <h4 className={`font-semibold ${destructive ? 'text-red-900' : 'text-gray-900'}`}>{title}</h4>
          <p className={`text-sm ${destructive ? 'text-red-600/80' : 'text-gray-500'}`}>{desc}</p>
        </div>
      </div>
      <ChevronRight className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${destructive ? 'text-red-400' : 'text-gray-300'}`} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{s?.dataAndPrivacy || "Data & Privacy"}</h2>
          <p className="text-gray-500 mt-1">{s?.dataAndPrivacyDesc || "Manage your personal data, exports, and account security."}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
           {s?.statusActive || "Status: Active"}
        </div>
      </div>

      {/* 2. Stats Overview - Modern Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar} 
          label={s?.accountAge || "Account Age"} 
          value={accountStats.accountAge} 
          colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }} 
        />
        <StatCard 
          icon={Activity} 
          label={s?.totalLogins || "Total Logins"} 
          value={accountStats.totalLogins} 
          colorClass={{ bg: 'bg-green-50', text: 'text-green-600' }} 
        />
        <StatCard 
          icon={HardDrive} 
          label={s?.storage || "Storage"} 
          value={accountStats.storageUsed} 
          colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }} 
        />
        <StatCard 
          icon={Shield} 
          label={s?.lastBackup || "Last Backup"} 
          value={formatDate(accountStats.lastBackup)} 
          colorClass={{ bg: 'bg-orange-50', text: 'text-orange-600' }} 
        />
      </div>

      {/* 3. Feedback Messages */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Tools & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Data Portability Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Database className="w-4 h-4" /> {s?.dataPortability || "Data Portability"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 hover:border-blue-400 transition-colors">
                <div className="p-3 bg-blue-50 w-fit rounded-lg mb-4">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{s?.exportData || "Export Data"}</h4>
                  <p className="text-sm text-gray-500 mt-1 mb-4">{s?.exportDataDesc || "Download a JSON copy of your messages, settings, and history."}</p>
                  <Button onClick={handleExportData} disabled={isLoading} variant="outline" className="w-full">
                    {s?.exportJson || "Export JSON"}
                  </Button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 hover:border-green-400 transition-colors">
                <div className="p-3 bg-green-50 w-fit rounded-lg mb-4">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{s?.importData || "Import Data"}</h4>
                  <p className="text-sm text-gray-500 mt-1 mb-4">{s?.importDataDesc || "Restore your account from a previous HoroHouse backup file."}</p>
                  <div className="flex gap-2">
                    <input type="file" accept=".json" onChange={handleImportData} className="hidden" id="import-data" disabled={isLoading} />
                    <Button onClick={() => document.getElementById('import-data')?.click()} disabled={isLoading} variant="outline" className="w-full">
                      {s?.selectFile || "Select File"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Cleanup Section */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> {s?.maintenance || "Maintenance"}
                </h3>
             </div>
             
             <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-sm">
                <ActionRow 
                   icon={FileJson} 
                   title={s?.clearSearchHistory || "Clear Search History"}
                   desc={s?.clearSearchHistoryDesc || "Remove all saved searches and recent queries"} 
                   onClick={() => handleClearData('search-history')}
                   colorClass={{ bg: 'bg-gray-100', text: 'text-gray-600' }}
                />
                <ActionRow 
                   icon={Activity} 
                   title={s?.clearActivityLog || "Clear Activity Log"} 
                   desc={s?.clearActivityLogDesc || "Remove browsing history and interaction logs"} 
                   onClick={() => handleClearData('activity-log')}
                   colorClass={{ bg: 'bg-gray-100', text: 'text-gray-600' }}
                />
                <ActionRow 
                   icon={Shield} 
                   title={s?.createManualBackup || "Create Manual Backup"} 
                   desc={s?.createManualBackupDesc || "Save a secure snapshot of your current state"} 
                   onClick={handleCreateBackup}
                   colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                />
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Danger Zone */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h3 className="text-red-900 font-bold flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5" /> {s?.dangerZone || "Danger Zone"}
            </h3>
            <p className="text-xs text-red-700/80 mb-6 leading-relaxed">
              {s?.dangerZoneDesc || "These actions are destructive. Please ensure you have exported your data before proceeding."}
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => handleClearData('message-history')}
                className="w-full text-left px-4 py-3 bg-white hover:bg-red-100 rounded-lg text-sm font-medium text-red-700 transition-colors border border-red-100 hover:border-red-200 flex items-center justify-between"
              >
                {s?.clearMessages || "Clear Messages"}
                <Trash2 className="w-4 h-4 opacity-50" />
              </button>

              <button 
                onClick={() => setShowDeactivateModal(true)}
                className="w-full text-left px-4 py-3 bg-white hover:bg-orange-50 rounded-lg text-sm font-medium text-orange-700 transition-colors border border-red-100 hover:border-orange-200 flex items-center justify-between"
              >
                {s?.deactivateAccount || "Deactivate Account"}
                <Clock className="w-4 h-4 opacity-50" />
              </button>

              <button 
                onClick={() => setShowDataClearModal(true)}
                className="w-full text-left px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-between"
              >
                {s?.deleteAllData || "Delete All Data"}
                <AlertTriangle className="w-4 h-4 text-red-200" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 leading-relaxed">
             <strong>{s?.privacyNote || "Privacy Note:"}</strong> {s?.privacyNoteDesc || "When you delete data, it is removed from our live servers immediately. Backups are retained for 30 days before permanent deletion."}
          </div>
        </div>

      </div>

      {/* --- MODALS (Kept functional logic, updated styling) --- */}
      
      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
               <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{s?.pauseAccount || "Pause your account?"}</h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              {s?.pauseAccountDesc || "Your profile will be hidden effectively immediately. You can reactivate anytime by simply logging back in."}
            </p>
            
            <div className="space-y-4">
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder={s?.tellUsWhy || "Optional: Tell us why you're taking a break..."}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 resize-none text-sm min-h-[80px]"
              />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setShowDeactivateModal(false)} className="h-11">{s?.cancel || "Cancel"}</Button>
                <Button onClick={handleDeactivateAccount} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 h-11">
                  {isLoading ? (s?.processing || 'Processing...') : (s?.deactivate || 'Deactivate')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Modal */}
      {showDataClearModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 border-t-4 border-red-600">
            <div className="flex items-start gap-4 mb-4">
               <div className="p-3 bg-red-100 rounded-full shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900">{s?.nukeAllData || "Nuke all data?"}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {s?.nukeAllDataDesc || "This action is irreversible. Everything listed below will be permanently destroyed."}
                  </p>
               </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4 mb-6">
               <ul className="space-y-2 text-sm text-red-800">
                 <li className="flex items-center gap-2"><Trash2 className="w-3 h-3" /> {s?.searchHistoryFavorites || "Search history & favorites"}</li>
                 <li className="flex items-center gap-2"><Trash2 className="w-3 h-3" /> {s?.allMessages || "All messages (both sides)"}</li>
                 <li className="flex items-center gap-2"><Trash2 className="w-3 h-3" /> {s?.profileSettingsPreferences || "Profile settings & preferences"}</li>
               </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => handleClearData('all')} 
                disabled={isLoading} 
                className="w-full bg-red-600 hover:bg-red-700 h-11 text-white"
              >
                {isLoading ? (s?.deleting || 'Deleting...') : (s?.yesDeleteEverything || 'Yes, Delete Everything')}
              </Button>
              <button 
                 onClick={() => setShowDataClearModal(false)}
                 className="text-sm text-gray-500 hover:text-gray-800 font-medium py-2"
              >
                 {s?.noKeepData || "No, keep my data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};