'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { apiClient } from '@/lib/api';
import { RoommateCard } from './components/RoommateCard';
import { RoommateProfileModal } from './components/RoommateProfileModal';
import { MatchInbox } from './components/MatchInbox';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Pause,
  Play,
  Filter,
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'browse' | 'matches';

const ITEMS_PER_PAGE = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoommatesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const studentCtx = useStudentMode();
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates || {};

  const isStudent: boolean = (studentCtx as any).isStudent ?? false;
  const isVerified: boolean = (studentCtx as any).isVerified ?? false;
  const verificationStatus: string | null =
    (studentCtx as any).verificationStatus ?? null;

  // ── State ─────────────────────────────────────────────────────────────────

  const [tab, setTab] = useState<Tab>('browse');
  const [showModal, setShowModal] = useState(false);

  // Browse
  const [profiles, setProfiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [modeFilter, setModeFilter] = useState<'' | 'have_room' | 'need_room'>('');
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);

  // My profile
  const [myProfile, setMyProfile] = useState<any>(null);
  const [isLoadingMyProfile, setIsLoadingMyProfile] = useState(true);

  // Matches
  const [matches, setMatches] = useState<{ pending: any[]; matched: any[] }>({
    pending: [],
    matched: [],
  });
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // ── Fetch my profile ──────────────────────────────────────────────────────

  const fetchMyProfile = useCallback(async () => {
    if (!isStudent) return;
    setIsLoadingMyProfile(true);
    try {
      const p = await apiClient.getMyRoommateProfile();
      setMyProfile(p);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error('Failed to fetch roommate profile:', err);
      }
      setMyProfile(null);
    } finally {
      setIsLoadingMyProfile(false);
    }
  }, [isStudent]);

  useEffect(() => { fetchMyProfile(); }, [fetchMyProfile]);

  // ── Fetch matches ─────────────────────────────────────────────────────────

  const fetchMatches = useCallback(async () => {
    if (!isStudent || !isVerified) return;
    setIsLoadingMatches(true);
    try {
      const res = await apiClient.getMyRoommateMatches();
      setMatches(res);
    } catch {
      setMatches({ pending: [], matched: [] });
    } finally {
      setIsLoadingMatches(false);
    }
  }, [isStudent, isVerified]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // ── Fetch browse pool ──────────────────────────────────────────────────────

  const fetchProfiles = useCallback(async () => {
    if (!isVerified) return;
    setIsLoadingProfiles(true);
    try {
      const res = await apiClient.searchRoommates({
        page,
        limit: ITEMS_PER_PAGE,
        ...(modeFilter ? { mode: modeFilter } : {}),
        ...(maxBudget ? { maxBudget } : {}),
      });
      setProfiles(res.profiles || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      setProfiles([]);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [isVerified, page, modeFilter, maxBudget]);

  useEffect(() => {
    if (tab === 'browse') fetchProfiles();
  }, [tab, fetchProfiles]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [modeFilter, maxBudget]);

  // ── Pause / reactivate ────────────────────────────────────────────────────

  const handleToggleActive = async () => {
    if (!myProfile) return;
    try {
      if (myProfile.isActive) {
        await apiClient.pauseRoommateProfile();
        toast.success(s.profilePaused || 'Profile paused — you are no longer visible in the pool.');
      } else {
        await apiClient.reactivateRoommateProfile();
        toast.success(s.profileReactivated || 'Profile reactivated — you are visible again.');
      }
      fetchMyProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || s.actionFailed || 'Action failed.');
    }
  };

  const pendingCount = matches.pending.filter(
    (m) => m.receiverId?._id === user?.id && m.status === 'pending',
  ).length;

  // ─────────────────────────────────────────────────────────────────────────

  // Not a student
  if (!isAuthenticated || !isStudent) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-40 max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-[#222222] stroke-[1.5]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#222222] mb-3">{s.studentsOnly || 'Students only'}</h2>
          <p className="text-[#717171] text-[15px] mb-8 leading-relaxed">
            {s.studentsOnlyDesc || 'Create a student profile to access the roommate matching pool.'}
          </p>
          <Link href="/onboarding">
            <Button className="h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[15px]">
              Create student profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-40 max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-[#222222] stroke-[1.5]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#222222] mb-3">{s.verifyIdFirst || 'Verify your student ID first'}</h2>
          <p className="text-[#717171] text-[15px] mb-8 leading-relaxed">
            {verificationStatus === 'pending'
              ? (s.idUnderReview || "Your ID is under review. You'll get access within 24 hours.")
              : (s.uploadIdToJoin || 'Upload your university ID to join the roommate pool.')}
          </p>
          {verificationStatus !== 'pending' && (
            <Link href="/dashboard/settings?tab=student-id">
              <Button className="h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[15px]">
                {s.uploadStudentId || 'Upload student ID'}
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-24 sm:pt-32 pb-12 border-b border-[#EBEBEB]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            
            {/* Left Content */}
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="inline-flex items-center gap-2 text-[#717171] text-[13px] font-semibold uppercase tracking-wide mb-4">
                  <Users className="w-4 h-4 stroke-[2]" />
                  {s.roommateMatching || 'Roommate matching'}
                </div>
                <h1 className="text-[36px] sm:text-[44px] font-semibold text-[#222222] leading-[1.1] tracking-tight mb-4">
                  {s.findYour || 'Find your'} {s.perfectMatch || 'perfect match'}
                </h1>
                <p className="text-[#717171] text-[16px] mb-10 leading-relaxed">
                  {s.matchedDesc || 'Matched by sleep schedule, cleanliness, and vibes. When both of you show interest, you can start chatting instantly.'}
                </p>

                {/* My profile status card */}
                <div>
                  {isLoadingMyProfile ? (
                    <div className="h-24 bg-[#F7F7F7] border border-[#EBEBEB] rounded-2xl animate-pulse" />
                  ) : myProfile ? (
                    <div className="bg-[#F7F7F7] border border-[#EBEBEB] rounded-2xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={cn('w-2 h-2 rounded-full', myProfile.isActive ? 'bg-[#008A05]' : 'bg-[#717171]')} />
                            <span className="text-[13px] font-bold text-[#222222] uppercase tracking-wide">
                              {myProfile.isActive ? (s.profileActive || 'Profile Active') : (s.profilePausedStatus || 'Profile Paused')}
                            </span>
                          </div>
                          <p className="text-[16px] font-semibold text-[#222222]">
                            {myProfile.mode === 'have_room' ? (s.haveRoom || 'I have a room') : (s.lookForRoom || 'I need a room')}
                          </p>
                          <p className="text-[#717171] text-[14px] mt-0.5">
                            {myProfile.campusCity} {myProfile.preferredNeighborhood ? `· ${myProfile.preferredNeighborhood}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={handleToggleActive}
                            className="h-10 px-4 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-white font-semibold"
                          >
                            {myProfile.isActive ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Activate</>}
                          </Button>
                          <Button
                            onClick={() => setShowModal(true)}
                            className="h-10 px-5 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold"
                          >
                            {s.editProfile || 'Edit profile'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F7F7F7] border border-[#EBEBEB] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <p className="text-[13px] font-bold uppercase tracking-wide text-[#717171] mb-1">{s.joinPool || 'Join the pool'}</p>
                        <p className="text-[16px] font-semibold text-[#222222]">{s.appearInSearches || 'Appear in searches and find matches.'}</p>
                      </div>
                      <Button
                        onClick={() => setShowModal(true)}
                        className="h-12 px-6 bg-[#FF385C] hover:bg-[#D90B38] text-white rounded-lg font-semibold whitespace-nowrap active:scale-[0.98] transition-transform"
                      >
                        {s.createProfile || 'Create profile'}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Side - Featured Image Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="hidden lg:block w-[400px] shrink-0"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#F7F7F7]">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop"
                  alt="Roommates"
                  className="w-full h-full object-cover grayscale-[0.2]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters and Navigation Bar */}
      <div className="border-b border-[#EBEBEB] bg-white sticky top-[80px] z-30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'browse', label: s.browse || 'Browse', icon: Search },
              {
                key: 'matches',
                label: s.matches || 'Matches',
                icon: MessageSquare,
                badge: pendingCount > 0 ? pendingCount : undefined,
              },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as Tab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold transition-colors focus:outline-none",
                  tab === t.key 
                    ? "bg-[#222222] text-white" 
                    : "bg-white text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222] border border-transparent hover:border-[#EBEBEB]"
                )}
              >
                <t.icon className="w-4 h-4 stroke-[2]" />
                {t.label}
                {t.badge && (
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                    tab === t.key ? "bg-white text-[#222222]" : "bg-[#FF385C] text-white"
                  )}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filters (Only visible on Browse tab) */}
          {tab === 'browse' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select
                value={modeFilter || 'all'}
                onValueChange={(v) => setModeFilter(v === 'all' ? '' : v as 'have_room' | 'need_room')}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-full border border-[#DDDDDD] bg-white text-[14px] font-medium px-4 focus:ring-0 focus:border-[#222222] hover:border-[#222222] transition-colors">
                  <SelectValue placeholder={s.allModes || 'All modes'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD]">
                  <SelectItem value="all" className="text-[14px]">{s.allModes || 'All modes'}</SelectItem>
                  <SelectItem value="need_room" className="text-[14px]">{s.needsRoom || 'Needs a room'}</SelectItem>
                  <SelectItem value="have_room" className="text-[14px]">{s.hasRoom || 'Has a room'}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={maxBudget ? String(maxBudget) : 'any'}
                onValueChange={(v) => setMaxBudget(v === 'any' ? undefined : Number(v))}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-full border border-[#DDDDDD] bg-white text-[14px] font-medium px-4 focus:ring-0 focus:border-[#222222] hover:border-[#222222] transition-colors">
                  <SelectValue placeholder={s.anyBudget || 'Any budget'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD]">
                  <SelectItem value="any" className="text-[14px]">{s.anyBudget || 'Any budget'}</SelectItem>
                  <SelectItem value="30000" className="text-[14px]">{s.max30k || 'Max 30K'}</SelectItem>
                  <SelectItem value="50000" className="text-[14px]">{s.max50k || 'Max 50K'}</SelectItem>
                  <SelectItem value="75000" className="text-[14px]">{s.max75k || 'Max 75K'}</SelectItem>
                  <SelectItem value="100000" className="text-[14px]">{s.max100k || 'Max 100K'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        
        {/* Active Filters Display */}
        {tab === 'browse' && (modeFilter || maxBudget) && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[14px] text-[#717171] font-medium mr-2">Filters:</span>
            {modeFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DDDDDD] bg-[#F7F7F7] text-[#222222] text-[13px] font-medium">
                {modeFilter === 'have_room' ? (s.hasRoom || 'Has Room') : (s.needsRoom || 'Needs Room')}
                <button onClick={() => setModeFilter('')} className="hover:text-[#C2293F] focus:outline-none"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {maxBudget && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DDDDDD] bg-[#F7F7F7] text-[#222222] text-[13px] font-medium">
                {s.maxLabel || 'Max'} {maxBudget / 1000}K
                <button onClick={() => setMaxBudget(undefined)} className="hover:text-[#C2293F] focus:outline-none"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            <button 
              onClick={() => { setModeFilter(''); setMaxBudget(undefined); }}
              className="text-[13px] font-semibold text-[#222222] underline hover:text-[#717171] ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Browse tab ──────────────────────────────────────────────────── */}
        {tab === 'browse' && (
          <>
            {isLoadingProfiles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB] p-6 h-[320px] animate-pulse" />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-20 bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB]">
                <Users className="w-12 h-12 text-[#DDDDDD] mx-auto mb-4 stroke-[1.5]" />
                <h3 className="text-[20px] font-semibold text-[#222222] mb-2">{s.noRoommatesFound || 'No roommates found'}</h3>
                <p className="text-[#717171] text-[15px] max-w-sm mx-auto">
                  {s.noProfilesDesc || "We couldn't find any profiles matching your current filters. Try adjusting your preferences."}
                </p>
                <Button
                  onClick={() => { setModeFilter(''); setMaxBudget(undefined); }}
                  className="mt-8 h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold"
                >
                  {s.resetAllFilters || 'Reset all filters'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {profiles.map((p, i) => (
                    <RoommateCard
                      key={p._id}
                      profile={p}
                      index={i}
                      onInterestSent={() => fetchMatches()}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !isLoadingProfiles && (
              <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-[#EBEBEB]">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-10 rounded-full border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] font-medium"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> {s.previous || 'Previous'}
                </Button>
                <div className="text-[14px] font-medium text-[#717171]">
                  {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-10 rounded-full border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] font-medium"
                >
                  {s.next || 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Matches tab ─────────────────────────────────────────────────── */}
        {tab === 'matches' && (
          <div className="max-w-3xl mx-auto">
            {isLoadingMatches ? (
              <div className="flex flex-col items-center justify-center py-24 bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB]">
                <Loader2 className="w-8 h-8 animate-spin text-[#222222] mb-4 stroke-[2.5]" />
                <p className="text-[14px] font-semibold text-[#717171]">{s.loadingMatches || 'Loading matches...'}</p>
              </div>
            ) : (
              <MatchInbox
                matches={matches}
                currentUserId={user?.id || user?._id || ''}
                onRefresh={fetchMatches}
              />
            )}
          </div>
        )}
      </div>

      {/* Profile modal */}
      <RoommateProfileModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchMyProfile}
        existingProfile={myProfile}
        campusCity={(studentCtx as any).studentProfile?.campusCity}
      />
    </div>
  );
}