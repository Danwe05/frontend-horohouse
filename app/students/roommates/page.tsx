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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Settings,
  Inbox,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Pause,
  Play,
  ArrowRight,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'browse' | 'matches';

const ITEMS_PER_PAGE = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoommatesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const studentCtx = useStudentMode();

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
        toast.success('Profile paused — you are no longer visible in the pool.');
      } else {
        await apiClient.reactivateRoommateProfile();
        toast.success('Profile reactivated — you are visible again.');
      }
      fetchMyProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed.');
    }
  };

  const pendingCount = matches.pending.filter(
    (m) => m.receiverId?._id === user?.id && m.status === 'pending',
  ).length;

  // ─────────────────────────────────────────────────────────────────────────

  // Not a student
  if (!isAuthenticated || !isStudent) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Students only</h2>
          <p className="text-slate-500 text-sm mb-6">
            Create a student profile to access the roommate matching pool.
          </p>
          <Link href="/onboarding">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Verify your student ID first</h2>
          <p className="text-slate-500 text-sm mb-2">
            {verificationStatus === 'pending'
              ? "Your ID is under review. You'll get access within 24 hours."
              : 'Upload your university ID to join the roommate pool.'}
          </p>
          {verificationStatus !== 'pending' && (
            <Link href="/dashboard/settings?tab=student-id">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-4">
                Upload student ID
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-blue-600 pt-32 pb-12 overflow-hidden relative">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-50 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6 border border-white/10 backdrop-blur-md">
                  <Users className="w-3.5 h-3.5" />
                  Roommate matching
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-white leading-[0.95] tracking-tighter mb-6 uppercase">
                  Find your<br />
                  <span className="text-blue-200">Perfect match.</span>
                </h1>
                <p className="text-blue-50/80 text-base sm:text-lg font-medium max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Matched by sleep schedule, cleanliness, and vibes.
                  When both of you like each other, a chat opens instantly.
                </p>

                {/* My profile status card (Flat) */}
                <div className="max-w-md mx-auto lg:mx-0">
                  {isLoadingMyProfile ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  ) : myProfile ? (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${myProfile.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">
                            {myProfile.isActive ? 'Profile Active' : 'Profile Paused'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleToggleActive}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all"
                          >
                            {myProfile.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setShowModal(true)}
                            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Edit Profile
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-lg">
                          {myProfile.mode === 'have_room' ? 'Have a room' : 'Looking for a room'}
                        </p>
                        <p className="text-blue-100/60 text-xs font-medium uppercase tracking-widest">
                          {myProfile.campusCity} {myProfile.preferredNeighborhood ? `· ${myProfile.preferredNeighborhood}` : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white text-blue-600 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-900/40 border border-blue-400/20">
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-black uppercase tracking-widest mb-1 opacity-60">Join the pool</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">Appear in searches & find matches.</p>
                      </div>
                      <Button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
                      >
                        Create profile
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Side - Featured Image Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block w-[400px] xl:w-[480px] shrink-0"
            >
              <div className="relative group">
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl animate-pulse delay-700" />
                
                <div className="relative z-10 border-[12px] border-white/10 rounded-[4rem] overflow-hidden aspect-[4/5] shadow-2xl shadow-blue-900/40">
                  <img 
                    src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop" 
                    alt="Premium Roommate Matching" 
                    className="w-full h-full object-cover grayscale-[0.6] group-hover:grayscale-0 transition-all duration-1000"
                  />
                  {/* Floating Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-black/10 transition-transform group-hover:-translate-y-2 duration-500">
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Featured Match</p>
                      <p className="text-slate-900 font-black text-base uppercase tracking-tight">The Perfect Suite</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky Filters Bar */}
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Tabs (Flat Style) */}
            <div className="flex gap-1 bg-slate-50 border border-slate-100 rounded-2xl p-1 shrink-0">
              {[
                { key: 'browse', label: 'Browse', icon: <Search className="w-3.5 h-3.5" /> },
                {
                  key: 'matches',
                  label: 'Matches',
                  icon: <Inbox className="w-3.5 h-3.5" />,
                  badge: pendingCount > 0 ? pendingCount : undefined,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as Tab)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    tab === t.key
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.badge && (
                    <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-100 hidden sm:block" />

            {/* Quick Chips (Visible when filters active) */}
            <div className="hidden lg:flex items-center gap-2 overflow-x-auto no-scrollbar">
              <AnimatePresence>
                {modeFilter && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shrink-0"
                  >
                    <Filter className="w-3 h-3" />
                    {modeFilter === 'have_room' ? 'Has Room' : 'Needs Room'}
                    <button onClick={() => setModeFilter('')} className="ml-1 hover:text-blue-800"><X className="w-3 h-3" /></button>
                  </motion.div>
                )}
                {maxBudget && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shrink-0"
                  >
                    Max {maxBudget/1000}K
                    <button onClick={() => setMaxBudget(undefined)} className="ml-1 hover:text-blue-800"><X className="w-3 h-3" /></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto w-full sm:w-auto">
            {/* Selects styled as flat buttons */}
            <Select
              value={modeFilter || 'all'}
              onValueChange={(v) => setModeFilter(v === 'all' ? '' : v as 'have_room' | 'need_room')}
            >
              <SelectTrigger className="w-full sm:w-44 h-11 rounded-full border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide px-5 focus:ring-blue-100 border-none transition-all hover:bg-slate-100">
                <SelectValue placeholder="All modes" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 p-1 shadow-2xl">
                <SelectItem value="all" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">All modes</SelectItem>
                <SelectItem value="need_room" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Needs a room</SelectItem>
                <SelectItem value="have_room" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Has a room</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={maxBudget ? String(maxBudget) : 'any'}
              onValueChange={(v) => setMaxBudget(v === 'any' ? undefined : Number(v))}
            >
              <SelectTrigger className="w-full sm:w-44 h-11 rounded-full border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide px-5 focus:ring-blue-100 border-none transition-all hover:bg-slate-100">
                <SelectValue placeholder="Any budget" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 p-1 shadow-2xl">
                <SelectItem value="any" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Any budget</SelectItem>
                <SelectItem value="30000" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 30K</SelectItem>
                <SelectItem value="50000" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 50K</SelectItem>
                <SelectItem value="75000" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 75K</SelectItem>
                <SelectItem value="100000" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 100K</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Statistics / Status */}
        <div className="flex items-center justify-between mb-8">
           <div>
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
               {tab === 'browse' ? 'Available Roommates' : 'Your Matching Pool'}
             </h2>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
               {total} active profiles tracking
             </p>
           </div>
           
           {(modeFilter || maxBudget) && (
              <button
                onClick={() => { setModeFilter(''); setMaxBudget(undefined); }}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all border border-blue-100"
              >
                Clear Filters
              </button>
           )}
        </div>

        {/* ── Browse tab ──────────────────────────────────────────────────── */}
        {tab === 'browse' && (
          <>
            {isLoadingProfiles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[32px] border border-slate-100 p-8 h-[360px] animate-pulse space-y-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-slate-50" />
                      <div className="flex-1 space-y-3 pt-2">
                        <div className="h-4 bg-slate-50 rounded-full w-2/3" />
                        <div className="h-3 bg-slate-50 rounded-full w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <div className="h-3 bg-slate-50 rounded-full" />
                       <div className="h-3 bg-slate-50 rounded-full w-5/6" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                       <div className="h-6 bg-slate-50 rounded-full w-20" />
                       <div className="h-6 bg-slate-50 rounded-full w-24" />
                       <div className="h-6 bg-slate-50 rounded-full w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[48px] border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Roommates found</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm">
                  We couldn't find any profiles matching your current filters. Try adjusting your preferences.
                </p>
                <button
                  onClick={() => { setModeFilter(''); setMaxBudget(undefined); }}
                  className="mt-8 text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-105 transition-all"
                >
                  Reset all filters
                </button>
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
              <div className="flex items-center justify-center gap-3 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-2xl h-12 px-6 border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl">
                   <span className="text-[10px] font-black text-slate-900">{page}</span>
                   <span className="text-[10px] font-black text-slate-300">/</span>
                   <span className="text-[10px] font-black text-slate-500">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-2xl h-12 px-6 border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Matches tab ─────────────────────────────────────────────────── */}
        {tab === 'matches' && (
          <div className="max-w-2xl mx-auto">
            {isLoadingMatches ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[48px] border border-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading matching pool...</p>
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