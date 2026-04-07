'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Upload,
  Check,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
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
  profilePicture?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  agency?: string;
  licenseNumber?: string;
  website?: string;
  dateJoined?: string;
}

interface ProfileSettingsProps {
  user: User;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const { refreshAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    bio: user.bio || '',
    address: user.address || '',
    city: user.city || '',
    country: user.country || '',
    agency: user.agency || '',
    licenseNumber: user.licenseNumber || '',
    website: user.website || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setMessage(null);
      await apiClient.uploadProfilePicture(file);
      await refreshAuth();
      setMessage({ type: 'success', text: 'Profile photo updated.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update photo.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      await apiClient.updateProfile(formData);
      await refreshAuth();

      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      await apiClient.toggleRole();
      await refreshAuth();

      setMessage({ type: 'success', text: 'Account role switched.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to switch role:', error);
      setMessage({ type: 'error', text: 'Failed to switch role.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'registered_user': return s?.regularUser || 'Regular User';
      case 'agent': return s?.realEstateAgent || 'Real Estate Agent';
      case 'admin': return s?.administrator || 'Administrator';
      default: return role;
    }
  };

  // Airbnb specific input styling
  const inputClasses = "flex h-14 w-full rounded-lg border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";
  const labelClasses = "block text-[15px] font-medium text-[#222222] mb-2";

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* ── Page Header ── */}
      <div className="mb-10">
        <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">
          {s?.personalInfo || "Personal info"}
        </h2>
        <p className="text-[16px] text-[#717171] mt-2">
          Manage your personal details, contact information, and professional profile.
        </p>
      </div>

      <div className="space-y-0">
        
        {/* ── Profile Picture ── */}
        <section className="py-8 border-t border-[#DDDDDD]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-[18px] font-semibold text-[#222222]">
                {s?.profilePicture || "Profile photo"}
              </h3>
              <p className="text-[15px] text-[#717171] mt-1 max-w-sm">
                {s?.uploadNewProfilePicture || "A clear photo helps people recognize you. Recommended size: 400x400px."}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border border-[#DDDDDD]">
                  <AvatarImage src={user.profilePicture} alt={user.name} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-[#F7F7F7] text-[#222222] font-semibold">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-[2px]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="h-10 px-5 rounded-lg border-[#222222] text-[#222222] font-semibold text-[14px] hover:bg-[#F7F7F7] focus:outline-none"
                >
                  {uploadingImage ? (s?.uploading || 'Uploading...') : (s?.uploadNew || 'Update photo')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Basic Info ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.basicInformation || "Basic info"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="name" className={labelClasses}>{s?.fullName || "Legal name"}</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="First Last"
                className={inputClasses}
              />
              <p className="text-[13px] text-[#717171] mt-1.5">This is the name on your travel document, which could be a license or a passport.</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bio" className={labelClasses}>{s?.bio || "About"}</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder={s?.tellUsAboutYourself || "Tell us a little about yourself..."}
                className="w-full px-4 py-3 border border-[#B0B0B0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent resize-none text-[16px] text-[#222222] placeholder:text-[#717171] transition-all"
                rows={4}
                maxLength={500}
              />
              <p className="text-[13px] text-[#717171] mt-1.5">
                {formData.bio.length}/500 {s?.characters || "characters"}
              </p>
            </div>
          </div>
        </section>

        {/* ── Contact Info ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.contactInfo || "Contact info"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor="email" className="text-[15px] font-medium text-[#222222] block">{s?.emailAddress || "Email address"}</label>
                {user.emailVerified && <span className="text-[12px] font-semibold text-[#008A05] flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Verified</span>}
              </div>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="jane@example.com"
                  className={cn(inputClasses, !user.emailVerified && "pr-10")}
                />
                {!user.emailVerified && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-5 w-5 text-[#C2410C] stroke-[2]" />
                  </div>
                )}
              </div>
              {!user.emailVerified && (
                <p className="text-[13px] text-[#C2410C] mt-1.5 font-medium">{s?.emailNotVerified || "Email not verified"}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor="phone" className="text-[15px] font-medium text-[#222222] block">{s?.phoneNumber || "Phone number"}</label>
                {user.phoneVerified && <span className="text-[12px] font-semibold text-[#008A05] flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Verified</span>}
              </div>
              <div className="relative">
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={cn(inputClasses, !user.phoneVerified && "pr-10")}
                />
                {!user.phoneVerified && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-5 w-5 text-[#C2410C] stroke-[2]" />
                  </div>
                )}
              </div>
              {!user.phoneVerified && (
                <p className="text-[13px] text-[#C2410C] mt-1.5 font-medium">{s?.phoneNotVerified || "Phone not verified"}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="website" className={labelClasses}>{s?.website || "Website"}</label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                className={inputClasses}
              />
            </div>
          </div>
        </section>

        {/* ── Location ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.location || "Location"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="address" className={labelClasses}>{s?.address || "Address"}</label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="city" className={labelClasses}>{s?.city || "City"}</label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="country" className={labelClasses}>{s?.country || "Country"}</label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Country"
                className={inputClasses}
              />
            </div>
          </div>
        </section>

        {/* ── Professional Info (Agents Only) ── */}
        {user.role === 'agent' && (
          <section className="py-8 border-t border-[#DDDDDD] space-y-6">
            <h3 className="text-[18px] font-semibold text-[#222222]">
              {s?.professionalInformation || "Professional details"}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="agency" className={labelClasses}>{s?.agency || "Agency"}</label>
                <Input
                  id="agency"
                  value={formData.agency}
                  onChange={(e) => handleInputChange('agency', e.target.value)}
                  placeholder="Real estate agency"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="license" className={labelClasses}>{s?.licenseNumber || "License number"}</label>
                <Input
                  id="license"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder="Professional license number"
                  className={inputClasses}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Account Security & Status ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {s?.accountInformation || "Account details"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h4 className="text-[15px] font-medium text-[#222222] mb-1">{s?.accountType || "Account type"}</h4>
              <div className="flex flex-col items-start gap-3 mt-1.5">
                <Badge className="bg-[#F7F7F7] text-[#222222] border border-[#DDDDDD] px-2.5 py-1 rounded-md text-[13px] font-semibold hover:bg-[#F7F7F7]">
                  {formatRole(user.role)}
                </Badge>
                {user.role !== 'admin' && (
                  <button
                    className="flex items-center gap-2 text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none disabled:opacity-50 mt-1"
                    onClick={handleToggleRole}
                    disabled={isLoading}
                  >
                    <ArrowRightLeft className="w-4 h-4 stroke-[2]" />
                    {isLoading 
                      ? (s?.switching || 'Switching...') 
                      : (s?.switchRole ? s.switchRole.replace('{role}', user.role === 'agent' ? (s?.regularUser || 'Regular User') : (s?.agentMode || 'Agent Mode')) : `Switch to ${user.role === 'agent' ? 'User' : 'Agent'}`)}
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[15px] font-medium text-[#222222] mb-1">{s?.accountId || "Account ID"}</h4>
              <p className="text-[15px] text-[#717171] font-mono break-all mt-1.5">{user.id}</p>
            </div>

            <div className="sm:col-span-2">
              <h4 className="text-[15px] font-medium text-[#222222] mb-1">{s?.memberSince || "Member since"}</h4>
              <p className="text-[15px] text-[#717171] mt-1.5">
                {user.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </section>

        {/* ── Action Footer ── */}
        <div className="pt-8 border-t border-[#DDDDDD] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center w-full sm:w-auto">
            {message && (
              <span className={cn(
                "text-[14px] font-medium flex items-center gap-2 animate-in fade-in duration-200",
                message.type === 'success' ? "text-[#008A05]" : "text-[#C2410C]"
              )}>
                {message.type === 'success' ? <Check className="w-4 h-4 stroke-[3]" /> : <AlertCircle className="w-4 h-4 stroke-[2]" />}
                {message.text}
              </span>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[15px] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            ) : null}
            {isLoading ? (s?.saving || 'Saving...') : (s?.saveChanges || 'Save')}
          </Button>
        </div>

      </div>
    </div>
  );
};