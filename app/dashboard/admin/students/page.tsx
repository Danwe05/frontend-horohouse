'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Search, Filter, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Phone, Mail, Calendar, Loader2,
  RefreshCw, CheckCircle2, XCircle, Clock, ShieldCheck,
  Eye, ImageIcon, Users, MoreVertical, MapPin, BookOpen,
  Award,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface StudentProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber: string;
    profilePicture?: string;
  };
  universityName: string;
  campusName: string;
  campusCity: string;
  faculty?: string;
  studyLevel?: string;
  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationRejectionReason?: string;
  studentIdUrl?: string;
  isAmbassador: boolean;
  ambassadorCode?: string;
  roommateProfileId?: string;
  createdAt: string;
}

interface StudentStats {
  total: number;
  byVerificationStatus: Record<string, number>;
  byCampusCity: Array<{ city: string; count: number }>;
  ambassadors: number;
  seekingRoommate: number;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<VerificationStatus, {
  label: string; icon: React.ElementType;
  badge: string; row: string;
}> = {
  unverified: { label: 'Unverified', icon: XCircle,      badge: 'bg-slate-100 text-slate-500',   row: '' },
  pending:    { label: 'Pending',    icon: Clock,         badge: 'bg-amber-100 text-amber-700',   row: 'bg-amber-50/30' },
  verified:   { label: 'Verified',   icon: CheckCircle2,  badge: 'bg-emerald-100 text-emerald-700', row: '' },
  rejected:   { label: 'Rejected',   icon: XCircle,       badge: 'bg-red-100 text-red-600',       row: 'bg-red-50/20' },
};

function StatusBadge({ status }: { status: VerificationStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.unverified;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', cfg.badge)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200/60 hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110 duration-300', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ID Image Modal ───────────────────────────────────────────────────────────

function IdImageModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student ID</h2>
            <p className="text-xs text-slate-500 mt-0.5">{name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-slate-50">
          <img src={url} alt="Student ID" className="w-full rounded-xl object-contain max-h-[60vh]" />
        </div>
      </div>
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  profile,
  onClose,
  onReviewed,
}: {
  profile: StudentProfile;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [decision, setDecision] = useState<'verified' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showId, setShowId] = useState(false);

  const canSubmit =
    decision === 'verified' ||
    (decision === 'rejected' && rejectionReason.trim().length >= 5);

  const handleSubmit = async () => {
    if (!decision) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.adminReviewStudentId(profile._id, {
        decision,
        ...(decision === 'rejected' ? { rejectionReason: rejectionReason.trim() } : {}),
      });
      onReviewed();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit review.');
    } finally {
      setSaving(false);
    }
  };

  const user = profile.userId;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review Student ID</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approve or reject the submitted university ID</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Student info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0 bg-slate-200">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || user?.phoneNumber}</p>
              </div>
              <StatusBadge status={profile.verificationStatus} />
            </div>

            {/* Profile details */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: GraduationCap, label: 'University', value: profile.universityName },
                { icon: MapPin,        label: 'City',       value: profile.campusCity },
                { icon: BookOpen,      label: 'Faculty',    value: profile.faculty || '—' },
                { icon: Award,         label: 'Level',      value: profile.studyLevel || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Submitted at */}
            {profile.verificationSubmittedAt && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Submitted {new Date(profile.verificationSubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {/* View ID button */}
            {profile.studentIdUrl ? (
              <button
                onClick={() => setShowId(true)}
                className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                View Student ID Photo
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
                <ImageIcon className="w-4 h-4" />
                No ID photo uploaded
              </div>
            )}

            {/* Decision buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDecision('verified')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                  decision === 'verified'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/40'
                )}
              >
                <CheckCircle2 className={cn('w-6 h-6', decision === 'verified' ? 'text-emerald-600' : 'text-slate-400')} />
                <span className="text-sm font-bold">Approve</span>
                <span className="text-[10px] text-center leading-tight opacity-70">
                  Student gets full access
                </span>
              </button>
              <button
                onClick={() => setDecision('rejected')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                  decision === 'rejected'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-red-300 hover:bg-red-50/40'
                )}
              >
                <XCircle className={cn('w-6 h-6', decision === 'rejected' ? 'text-red-500' : 'text-slate-400')} />
                <span className="text-sm font-bold">Reject</span>
                <span className="text-[10px] text-center leading-tight opacity-70">
                  Ask them to resubmit
                </span>
              </button>
            </div>

            {/* Rejection reason */}
            {decision === 'rejected' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. ID photo is blurry or expired. Please upload a clear, valid student card."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none bg-slate-50"
                />
                <p className="text-[10px] text-slate-400">This message will be shown to the student. Min 5 characters.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={cn(
                'flex-1',
                decision === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
                : decision === 'verified'
                  ? <><CheckCircle2 className="w-4 h-4 mr-2" />Approve ID</>
                  : decision === 'rejected'
                    ? <><XCircle className="w-4 h-4 mr-2" />Reject ID</>
                    : 'Select a decision'
              }
            </Button>
          </div>
        </div>
      </div>

      {showId && profile.studentIdUrl && (
        <IdImageModal
          url={profile.studentIdUrl}
          name={profile.userId?.name}
          onClose={() => setShowId(false)}
        />
      )}
    </>
  );
}

// ─── Row action menu ──────────────────────────────────────────────────────────

function ActionMenu({ profile, onReview, onViewId }: {
  profile: StudentProfile;
  onReview: () => void;
  onViewId: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          {profile.studentIdUrl && (
            <button
              onClick={() => { setOpen(false); onViewId(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> View ID Photo
            </button>
          )}
          {profile.verificationStatus === 'pending' && (
            <>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => { setOpen(false); onReview(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Review ID
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') router.push('/dashboard');
  }, [currentUser, router]);

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [reviewProfile, setReviewProfile] = useState<StudentProfile | null>(null);
  const [viewIdProfile, setViewIdProfile] = useState<StudentProfile | null>(null);

  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.adminGetStudentProfileStats();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchProfiles = useCallback(async (p = page) => {
    setLoadingProfiles(true);
    try {
      const params: any = { page: p, limit };
      if (statusFilter !== 'all') params.verificationStatus = statusFilter;
      if (search.trim()) params.campusCity = search.trim(); // server supports campusCity search
      const data = await apiClient.adminGetStudentProfiles(params);
      setProfiles(data.profiles ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPage(data.page ?? p);
    } catch (e) { console.error(e); }
    finally { setLoadingProfiles(false); }
  }, [page, limit, search, statusFilter]);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchProfiles(1); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search, statusFilter]);
  useEffect(() => { fetchProfiles(page); }, [page]);

  const pendingCount = stats?.byVerificationStatus?.['pending'] ?? 0;

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-200 rounded-md" style={{ width: `${55 + (i * 9) % 40}%` }} />
        </td>
      ))}
    </tr>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <NavDash />
          <div className="p-4 md:p-6 lg:p-8 space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Student Verification</h1>
                  {pendingCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 border-none text-xs">
                      {pendingCount} pending
                    </Badge>
                  )}
                </div>
                <p className="text-slate-500 text-sm">Review and approve student ID submissions.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchStats(); fetchProfiles(page); }}
                className="self-start sm:self-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>

            {/* ── Stats ── */}
            {loadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Students" value={stats.total} icon={Users} color="bg-purple-50 text-purple-600" />
                <StatCard label="Pending Review" value={stats.byVerificationStatus?.['pending'] ?? 0} icon={Clock} color="bg-amber-50 text-amber-600" />
                <StatCard label="Verified" value={stats.byVerificationStatus?.['verified'] ?? 0} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                <StatCard label="Ambassadors" value={stats.ambassadors} icon={Award} color="bg-blue-50 text-blue-600" />
              </div>
            ) : null}

            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search by campus city…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white border-slate-200 shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 shadow-sm">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">University</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Photo</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingProfiles ? (
                      [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                    ) : profiles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 font-semibold">No student profiles found</p>
                          <p className="text-slate-400 text-xs mt-1">Try changing the status filter.</p>
                        </td>
                      </tr>
                    ) : profiles.map(p => {
                      const user = p.userId;
                      const cfg = STATUS_CFG[p.verificationStatus] ?? STATUS_CFG.unverified;
                      const avatarSrc = user?.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name ?? 'user')}&backgroundColor=ffdfbf`;

                      return (
                        <tr key={p._id} className={cn('hover:bg-slate-50/70 transition-colors duration-150', cfg.row)}>

                          {/* Student */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                                <img src={avatarSrc} alt={user?.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate max-w-[140px]">{user?.name ?? '—'}</p>
                                {p.isAmbassador && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 font-semibold px-1.5 py-0.5 rounded-full">
                                    <Award className="w-2.5 h-2.5" /> Ambassador
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* University */}
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-800 text-xs truncate max-w-[160px]">{p.universityName}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" />{p.campusCity}
                              {p.studyLevel && ` · ${p.studyLevel}`}
                            </p>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              {user?.email && (
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                  <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span className="truncate max-w-[160px]">{user.email}</span>
                                </div>
                              )}
                              {user?.phoneNumber && (
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  {user.phoneNumber}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <StatusBadge status={p.verificationStatus} />
                            {p.verificationStatus === 'rejected' && p.verificationRejectionReason && (
                              <p className="text-[10px] text-red-500 mt-1 max-w-[140px] truncate" title={p.verificationRejectionReason}>
                                {p.verificationRejectionReason}
                              </p>
                            )}
                          </td>

                          {/* Submitted */}
                          <td className="px-4 py-3.5">
                            {p.verificationSubmittedAt ? (
                              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(p.verificationSubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>

                          {/* ID Photo */}
                          <td className="px-4 py-3.5">
                            {p.studentIdUrl ? (
                              <button
                                onClick={() => setViewIdProfile(p)}
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer transition-colors"
                              >
                                <ImageIcon className="w-3.5 h-3.5" /> View
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300">No photo</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {p.verificationStatus === 'pending' && (
                                <Button
                                  size="sm"
                                  className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                  onClick={() => setReviewProfile(p)}
                                >
                                  Review
                                </Button>
                              )}
                              <ActionMenu
                                profile={p}
                                onReview={() => setReviewProfile(p)}
                                onViewId={() => setViewIdProfile(p)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loadingProfiles && profiles.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-semibold text-slate-700">{total}</span> profiles
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 w-8 p-0">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pg: number;
                      if (totalPages <= 5) pg = i + 1;
                      else if (page <= 3) pg = i + 1;
                      else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                      else pg = page - 2 + i;
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={cn(
                            'h-8 w-8 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                            pg === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                          )}
                        >{pg}</button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 p-0">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Modals */}
      {reviewProfile && (
        <ReviewModal
          profile={reviewProfile}
          onClose={() => setReviewProfile(null)}
          onReviewed={() => { fetchStats(); fetchProfiles(page); }}
        />
      )}
      {viewIdProfile?.studentIdUrl && (
        <IdImageModal
          url={viewIdProfile.studentIdUrl}
          name={viewIdProfile.userId?.name}
          onClose={() => setViewIdProfile(null)}
        />
      )}
    </SidebarProvider>
  );
}