'use client';

import React, { useState } from 'react';
import {
  Moon, Sun, Sparkles, BookOpen, Library,
  Users, UserCheck, Cigarette, PawPrint,
  MapPin, Calendar, Heart, Check,
  ChevronRight, BedDouble, ArrowRight,
  User as UserIcon,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

function formatFCFA(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoommateCard({ profile, index = 0, onInterestSent }: RoommateCardProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.card || {};

  const SLEEP_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    early_bird: { label: s.earlyBird || 'Early bird', icon: <Sun className="w-3.5 h-3.5" />, color: 'bg-white border-[#DDDDDD] text-[#222222]' },
    night_owl: { label: s.nightOwl || 'Night owl', icon: <Moon className="w-3.5 h-3.5" />, color: 'bg-white border-[#DDDDDD] text-[#222222]' },
    flexible: { label: s.flexible || 'Flexible', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-white border-[#DDDDDD] text-[#222222]' },
  };

  const CLEAN_LABELS: Record<string, { label: string; color: string }> = {
    very_neat: { label: s.veryNeat || 'Very neat', color: 'bg-white border-[#DDDDDD] text-[#222222]' },
    neat: { label: s.neat || 'Neat', color: 'bg-white border-[#DDDDDD] text-[#222222]' },
    relaxed: { label: s.relaxed || 'Relaxed', color: 'bg-white border-[#DDDDDD] text-[#222222]' },
  };

  const SOCIAL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    introverted: { label: s.introverted || 'Introverted', icon: <UserCheck className="w-3.5 h-3.5" /> },
    balanced: { label: s.balanced || 'Balanced', icon: <Users className="w-3.5 h-3.5" /> },
    social: { label: s.social || 'Social', icon: <Users className="w-3.5 h-3.5" /> },
  };

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const userId = profile.userId?._id;
  const name = profile.userId?.name || 'Student';
  const avatar = profile.userId?.profilePicture || null;

  const sleep = SLEEP_LABELS[profile.sleepSchedule] || { label: profile.sleepSchedule, icon: null, color: 'bg-white border-[#DDDDDD] text-[#222222]' };
  const clean = CLEAN_LABELS[profile.cleanlinessLevel] || { label: profile.cleanlinessLevel, color: 'bg-white border-[#DDDDDD] text-[#222222]' };
  const social = SOCIAL_LABELS[profile.socialHabit] || { label: profile.socialHabit, icon: null };

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden hover:border-[#222222] transition-colors flex flex-col group h-full"
    >
      {/* Profile Header */}
      <div className="p-6 flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
            )}
          </div>
          {/* Mode Badge */}
          <span className={cn(
            "absolute -bottom-1 -right-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-white shadow-sm",
            profile.mode === 'have_room' ? "bg-[#008A05] text-white" : "bg-[#222222] text-white"
          )}>
            {profile.mode === 'have_room' ? (s.owner || 'Owner') : (s.seeker || 'Seeker')}
          </span>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#222222] text-[18px] truncate">{name}</h3>
              <p className="text-[13px] text-[#717171] flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">
                  {profile.campusCity}
                  {profile.preferredNeighborhood ? ` · ${profile.preferredNeighborhood}` : ''}
                </span>
              </p>
            </div>
            {profile.compatibilityScore !== undefined && (
              <div className="flex flex-col items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-[#008A05] leading-none">{profile.compatibilityScore}%</span>
                <span className="text-[11px] font-semibold text-[#717171] uppercase tracking-wide mt-1">{s.match || 'Match'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="px-6 pb-4">
          <p className="text-[14px] text-[#222222] leading-relaxed line-clamp-3">
            "{profile.bio}"
          </p>
        </div>
      )}

      {/* Lifestyle Tags */}
      <div className="px-6 pb-6 flex flex-wrap gap-2 mt-auto">
        <span className={cn("flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border", sleep.color)}>
          {sleep.icon}
          {sleep.label}
        </span>
        <span className={cn("flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border", clean.color)}>
          {clean.label}
        </span>
        <span className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border border-[#DDDDDD] bg-white text-[#222222]">
          {social.icon}
          {social.label.split(' ')[0]}
        </span>
        {profile.isSmoker && (
          <span className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border border-[#C2410C]/30 bg-[#FFF7ED] text-[#C2410C]">
            <Cigarette className="w-3.5 h-3.5" /> {s.smoker || 'Smoker'}
          </span>
        )}
      </div>

      {/* Property Preview */}
      {profile.mode === 'have_room' && profile.propertyId && (
        <div className="mx-6 mb-6 p-4 rounded-xl bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-between group/prop cursor-pointer hover:border-[#222222] transition-colors">
          <div className="flex items-center gap-4 min-w-0">
            {profile.propertyId.images?.[0]?.url ? (
              <img
                src={profile.propertyId.images[0].url}
                alt={profile.propertyId.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white border border-[#EBEBEB] flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-[#DDDDDD]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#222222] truncate">{profile.propertyId.title}</p>
              <p className="text-[12px] font-bold text-[#717171] uppercase tracking-wide mt-0.5">{s.featuredResidence || 'Available Room'}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#DDDDDD] group-hover/prop:text-[#222222] transition-colors shrink-0" />
        </div>
      )}

      {/* Action Footer */}
      <div className="p-6 border-t border-[#EBEBEB] bg-[#F7F7F7] flex items-center justify-between gap-4 mt-auto">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">{s.budget || 'Budget'}</p>
          <p className="text-[18px] font-semibold text-[#222222] leading-none">
            {formatFCFA(profile.budgetPerPersonMax)}<span className="text-[14px] font-normal text-[#717171]">/mo</span>
          </p>
        </div>

        <Button
          onClick={handleInterest}
          disabled={sent || sending}
          className={cn(
            "h-12 px-6 rounded-lg font-semibold text-[14px] transition-colors",
            sent
              ? "bg-[#EBFBF0] text-[#008A05] border border-[#008A05]/20 hover:bg-[#EBFBF0]"
              : "bg-[#222222] hover:bg-black text-white"
          )}
        >
          {sent ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Sent
            </span>
          ) : sending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Wait
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Connect
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
}