'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Home,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Upload,
  BedDouble,
  Heart,
  Wallet,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRoleProps {
  router: ReturnType<typeof useRouter>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function QuickStatCard({
  icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 hover:-md hover:-slate-100 transition-all duration-200 ${href ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {href && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />}
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  if (href) return <Link href={href} className="group">{inner}</Link>;
  return inner;
}

// ─── Verification status card ─────────────────────────────────────────────────

function VerificationCard({ status }: { status: string | null }) {
  if (!status || status === 'verified') return null;

  const configs: Record<string, { icon: React.ReactNode; title: string; desc: string; cta?: string; ctaHref?: string; bg: string; border: string }> = {
    unverified: {
      icon: <Upload className="w-5 h-5 text-blue-600" />,
      title: 'Upload your student ID',
      desc: 'Verify your identity to unlock the roommate pool and student-verified listings.',
      cta: 'Upload ID',
      ctaHref: '/dashboard/settings?tab=student-id',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    pending: {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      title: 'ID under review',
      desc: "Your student ID was submitted and is being reviewed. Usually approved within 24 hours.",
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    rejected: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      title: 'ID not approved',
      desc: 'Your ID could not be verified. Please upload a clearer photo.',
      cta: 'Re-upload',
      ctaHref: '/dashboard/settings?tab=student-id',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
      <div className="shrink-0">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{cfg.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{cfg.desc}</p>
      </div>
      {cfg.cta && cfg.ctaHref && (
        <Link href={cfg.ctaHref} className="shrink-0">
          <Button size="sm" className="rounded-xl h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
            {cfg.cta}
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── My lease card ────────────────────────────────────────────────────────────

function MyLeaseWidget({ lease }: { lease: any }) {
  const daysLeft = Math.ceil(
    (new Date(lease.leaseEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-500" />
          My current lease
        </h3>
        <Link href="/dashboard/lease">
          <span className="text-xs text-blue-600 hover:underline font-medium">View details</span>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">Property</span>
          <span className="font-medium text-slate-800 text-xs truncate max-w-[200px]">
            {lease.property?.title || 'Unnamed property'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">Monthly rent</span>
          <span className="font-bold text-slate-800">
            {(lease.monthlyRent || 0).toLocaleString()} XAF
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">Lease ends</span>
          <span className={`text-xs font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-600'}`}>
            {new Date(lease.leaseEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {isExpiringSoon && !isExpired && ` · ${daysLeft}d left`}
            {isExpired && ' · Expired'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">Landlord</span>
          <span className="font-medium text-slate-800 text-xs">
            {lease.landlord?.name || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Recent payment cycles ─────────────────────────────────────────────────

function RecentPayments({ payments }: { payments: any[] }) {
  if (!payments.length) return null;

  const statusStyles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-500',
    partial: 'bg-amber-50 text-amber-700',
    complete: 'bg-emerald-50 text-emerald-700',
    disbursed: 'bg-blue-50 text-blue-700',
    overdue: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-500" />
          Rent payments
        </h3>
      </div>
      <div className="space-y-2">
        {payments.slice(0, 4).map((cycle: any) => {
          const myShare = cycle.tenantShares?.find((s: any) => s.status !== 'paid');
          return (
            <div key={cycle._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-xs font-semibold text-slate-700">{cycle.cycleLabel}</p>
                <p className="text-[10px] text-slate-400">
                  {myShare
                    ? `${(myShare.amountDue || 0).toLocaleString()} XAF due`
                    : 'Your share paid'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusStyles[cycle.status] || statusStyles.pending}`}>
                {cycle.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentRole({ router }: StudentRoleProps) {
  const studentCtx = useStudentMode();

  const verificationStatus: string | null = (studentCtx as any).verificationStatus ?? null;
  const isVerified: boolean = (studentCtx as any).isVerified ?? false;
  const studentProfile: any = (studentCtx as any).studentProfile ?? null;
  const hasRoommateProfile: boolean = (studentCtx as any).hasRoommateProfile ?? false;
  const isLoadingProfile: boolean = (studentCtx as any).isLoadingProfile ?? false;

  const [lease, setLease] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingLease, setLoadingLease] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaseRes = await apiClient.getMyTenantLeases();
        const active = (leaseRes || []).find((l: any) => l.status === 'active');
        if (active) {
          setLease(active);
          // Fetch payment cycles for this lease
          const cycleRes = await apiClient.getMyTenantPayments();
          setPayments(cycleRes || []);
        }
      } catch {
        // No lease — fine
      } finally {
        setLoadingLease(false);
      }
    };
    fetchData();
  }, []);

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Verification banner */}
      <VerificationCard status={verificationStatus} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatCard
          icon={<Home className="w-4 h-4 text-blue-600" />}
          label="Student listings"
          value="Browse"
          sub="Near your campus"
          color="bg-blue-50"
          href="/students"
        />
        <QuickStatCard
          icon={<Users className="w-4 h-4 text-purple-600" />}
          label="Roommate pool"
          value={isVerified ? 'Open' : 'Locked'}
          sub={isVerified ? 'Find your match' : 'Verify ID first'}
          color="bg-purple-50"
          href={isVerified ? '/students/roommates' : undefined}
        />
        <QuickStatCard
          icon={<BedDouble className="w-4 h-4 text-teal-600" />}
          label="Roommate profile"
          value={hasRoommateProfile ? 'Active' : 'None'}
          sub={hasRoommateProfile ? 'You are in the pool' : 'Create a profile'}
          color="bg-teal-50"
          href={isVerified ? '/students/roommates' : undefined}
        />
        <QuickStatCard
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          label="ID verification"
          value={verificationStatus
            ? verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)
            : 'Unknown'}
          sub={verificationStatus === 'verified' ? 'Full access' : 'Required for full access'}
          color="bg-emerald-50"
          href="/dashboard/settings?tab=student-id"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — lease + payments */}
        <div className="space-y-4">
          {loadingLease ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-slate-100 rounded" />)}
              </div>
            </div>
          ) : lease ? (
            <>
              <MyLeaseWidget lease={lease} />
              {payments.length > 0 && <RecentPayments payments={payments} />}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
              <Home className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 mb-1">No active lease</p>
              <p className="text-xs text-slate-400 mb-4">
                Once your landlord creates a digital lease, it will appear here.
              </p>
              <Link href="/students">
                <Button size="sm" variant="outline" className="rounded-xl text-xs">
                  Browse housing
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right — quick actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 px-1">Quick actions</h3>

          {[
            {
              icon: <Home className="w-4 h-4 text-blue-600" />,
              label: 'Find student housing',
              desc: 'Search listings near your campus',
              href: '/students',
              color: 'bg-blue-50',
            },
            {
              icon: <Users className="w-4 h-4 text-purple-600" />,
              label: 'Find a roommate',
              desc: 'Browse the verified student pool',
              href: '/students/roommates',
              color: 'bg-purple-50',
              locked: !isVerified,
            },
            {
              icon: <Heart className="w-4 h-4 text-red-500" />,
              label: 'Saved properties',
              desc: 'Properties you have favourited',
              href: '/dashboard/favorite',
              color: 'bg-red-50',
            },
            {
              icon: <Wallet className="w-4 h-4 text-emerald-600" />,
              label: 'Split rent calculator',
              desc: 'Calculate per-person rent shares',
              href: '/dashboard/split-rent',
              color: 'bg-emerald-50',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.locked ? '#' : action.href}
              onClick={action.locked ? (e) => e.preventDefault() : undefined}
              className={action.locked ? 'cursor-not-allowed opacity-50' : ''}
            >
              <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:-sm transition-all group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </div>
            </Link>
          ))}

          {/* Campus info strip */}
          {studentProfile?.campusCity && (
            <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mt-2">
              <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-800 truncate">
                  {studentProfile.universityName}
                </p>
                <p className="text-[10px] text-blue-500">
                  {studentProfile.campusCity}
                  {studentProfile.studyLevel ? ` · ${studentProfile.studyLevel}` : ''}
                  {studentProfile.faculty ? ` · ${studentProfile.faculty}` : ''}
                </p>
              </div>
              {verificationStatus === 'verified' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}