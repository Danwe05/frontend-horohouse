'use client';

import React, { useState } from 'react';
import {
  Moon, Sun, Sparkles, BookOpen, Library,
  Users, UserCheck, Cigarette, PawPrint,
  MapPin, Calendar, Wallet, Heart, Check,
  ChevronRight, BedDouble, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoommateProfile {
  _id: string;
  userId: { _id: string; name: string; profilePicture?: string };
  mode: 'have_room' | 'need_room';
  campusCity: string;
  preferredNeighborhood?: string;
  budgetPerPersonMax: number;
  moveInDate: string;
  sleepSchedule: string;
  cleanlinessLevel: string;
  socialHabit: string;
  studyHabit: string;
  isSmoker?: boolean;
  acceptsSmoker?: boolean;
  hasPet?: boolean;
  acceptsPet?: boolean;
  preferredRoommateGender?: string;
  bio?: string;
  propertyId?: {
    title: string;
    address: string;
    images?: Array<{ url: string }>;
    studentDetails?: { pricePerPersonMonthly?: number; campusProximityMeters?: number };
  };
  compatibilityScore?: number;
}

interface RoommateCardProps {
  profile: RoommateProfile;
  index?: number;
  onInterestSent?: (receiverUserId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXAF(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const SLEEP_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  early_bird: { label: s.earlyBird || 'Early bird',  icon: <Sun className="w-3 h-3" />,     color: 'bg-amber-50 text-amber-700 border-amber-200' },
  night_owl:  { label: s.nightOwl || 'Night owl',   icon: <Moon className="w-3 h-3" />,    color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  flexible:   { label: s.flexible || 'Flexible',    icon: <Sparkles className="w-3 h-3" />, color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const CLEAN_LABELS: Record<string, { label: string; color: string }> = {
  very_neat: { label: s.veryNeat || 'Very neat',  color: 'bg-teal-50 text-teal-700 border-teal-200' },
  neat:      { label: s.neat || 'Neat',       color: 'bg-teal-50 text-teal-700 border-teal-200' },
  relaxed:   { label: s.relaxed || 'Relaxed',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const SOCIAL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  introverted: { label: s.introverted || 'Introverted', icon: <UserCheck className="w-3 h-3" /> },
  balanced:    { label: s.balanced || 'Balanced',    icon: <Users className="w-3 h-3" /> },
  social:      { label: s.social || 'Social',      icon: <Users className="w-3 h-3" /> },
};

const STUDY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  home_studier:  { label: s.studiesHome || 'Studies at home',    icon: <BookOpen className="w-3 h-3" /> },
  library_goer:  { label: s.studiesLibrary || 'Studies at library', icon: <Library className="w-3 h-3" /> },
  mixed:         { label: s.mixedStudy || 'Mixed study',         icon: <BookOpen className="w-3 h-3" /> },
};

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-slate-400';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoommateCard({ profile, index = 0, onInterestSent }: RoommateCardProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.card || {};
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const userId = profile.userId?._id;
  const name = profile.userId?.name || 'Student';
  const avatar = profile.userId?.profilePicture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`;

  const sleep  = SLEEP_LABELS[profile.sleepSchedule]  || { label: profile.sleepSchedule,  icon: null, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  const clean  = CLEAN_LABELS[profile.cleanlinessLevel] || { label: profile.cleanlinessLevel, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  const social = SOCIAL_LABELS[profile.socialHabit]   || { label: profile.socialHabit,    icon: null };
  const study  = STUDY_LABELS[profile.studyHabit]     || { label: profile.studyHabit,     icon: null };

  const handleInterest = async () => {
    if (!userId || sent || sending) return;
    setSending(true);
    try {
      const res = await apiClient.expressRoommateInterest(userId);
      setSent(true);
      onInterestSent?.(userId);
      if (res.status === 'matched') {
        toast.success(s.itsAMatch || "It's a match! Check your messages to start chatting.");
      } else {
        toast.success(s.interestSent ? s.interestSent.replace('{name}', name) : `Interest sent to ${name}!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || s.couldNotSend || 'Could not send interest. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:border-blue-200 transition-all duration-500 flex flex-col group"
    >
      {/* Profile Header */}
      <div className="p-8 pb-6 flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-slate-50 border border-slate-100 transition-transform group-hover:scale-105 duration-500">
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Flat Mode Badge */}
          <span className={`absolute -bottom-2 -right-2 text-[8px] font-black px-2.5 py-1 rounded-full border-2 border-white uppercase tracking-widest shadow-lg ${
            profile.mode === 'have_room'
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {profile.mode === 'have_room' ? (s.owner || 'Owner') : (s.seeker || 'Seeker')}
          </span>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight truncate">{name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-blue-500" />
                {profile.campusCity}
                {profile.preferredNeighborhood ? <span className="text-slate-200">/</span> : ''}
                {profile.preferredNeighborhood}
              </p>
            </div>
            {profile.compatibilityScore !== undefined && (
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border ${profile.compatibilityScore >= 80 ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-blue-100 bg-blue-50 text-blue-600'}`}>
                <span className="text-[10px] font-black leading-none">{profile.compatibilityScore}%</span>
                <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">{s.match || 'Match'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="px-8 text-xs font-medium text-slate-500 leading-relaxed line-clamp-2 mb-6">
          {profile.bio}
        </p>
      )}

      {/* Lifestyle Grid */}
      <div className="px-8 pb-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
          {sleep.icon}
          {sleep.label}
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
          {clean.label}
        </span>
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
          {social.icon}
          {social.label.split(' ')[0]}
        </span>
        {profile.isSmoker && (
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-orange-100 bg-orange-50 text-orange-600">
            <Cigarette className="w-3 h-3" /> {s.smoker || 'Smoker'}
          </span>
        )}
      </div>

      {/* Property Preview */}
      {profile.mode === 'have_room' && profile.propertyId && (
        <div className="mx-8 mt-4 mb-2 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-between group/prop transition-all hover:bg-blue-50">
          <div className="flex items-center gap-3 min-w-0">
            {profile.propertyId.images?.[0]?.url ? (
               <img
                 src={profile.propertyId.images[0].url}
                 alt={profile.propertyId.title}
                 className="w-10 h-10 rounded-xl object-cover grayscale-[0.5] group-hover/prop:grayscale-0 transition-all"
               />
            ) : (
               <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-400">
                 <BedDouble className="w-5 h-5" />
               </div>
            )}
            <div className="min-w-0">
               <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{profile.propertyId.title}</p>
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{s.featuredResidence || 'Featured Residence'}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-300 group-hover/prop:text-blue-600 transition-colors" />
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-auto p-8 pt-4 flex items-center justify-between border-t border-slate-50 group-hover:bg-slate-50/50 transition-colors">
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.budget || 'Budget'}</span>
            <p className="text-lg font-black text-slate-900 leading-none">
              {formatXAF(profile.budgetPerPersonMax)}
            </p>
          </div>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {s.in || 'In'} {formatDate(profile.moveInDate).split(' ')[0]}
          </p>
        </div>

        <Button
          onClick={handleInterest}
          disabled={sent || sending}
          className={`rounded-2xl h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
            sent
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95'
          }`}
        >
          {sent ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Interested
            </span>
          ) : sending ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Wait
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Connect
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
}