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
  ChevronRight,
  Upload,
  BedDouble,
  Heart,
  Wallet,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div className={cn(
      "bg-white rounded-2xl border border-[#DDDDDD] p-5 transition-all duration-200 h-full flex flex-col",
      href && "hover:border-[#222222] cursor-pointer"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center text-[#222222]">
          {icon}
        </div>
        {href && <ChevronRight className="w-5 h-5 text-[#DDDDDD] group-hover:text-[#222222] transition-colors" />}
      </div>
      <div className="mt-auto">
        <p className="text-[22px] font-semibold text-[#222222] leading-tight mb-1">{value}</p>
        <p className="text-[14px] font-medium text-[#717171]">{label}</p>
        {sub && <p className="text-[12px] text-[#717171] mt-1">{sub}</p>}
      </div>
    </div>
  );

  if (href) return <Link href={href} className="group block h-full">{inner}</Link>;
  return inner;
}

// ─── Verification status card ─────────────────────────────────────────────────

function VerificationCard({ status }: { status: string | null }) {
  if (!status || status === 'verified') return null;

  const configs: Record<string, { icon: React.ReactNode; title: string; desc: string; cta?: string; ctaHref?: string; bg: string; border: string }> = {
    unverified: {
      icon: <Upload className="w-6 h-6 text-[#222222] stroke-[1.5]" />,
      title: 'Upload your student ID',
      desc: 'Verify your identity to unlock the roommate pool and student-verified listings.',
      cta: 'Upload ID',
      ctaHref: '/dashboard/settings?tab=student-id',
      bg: 'bg-white',
      border: 'border-[#DDDDDD]',
    },
    pending: {
      icon: <Clock className="w-6 h-6 text-[#C2410C] stroke-[1.5]" />,
      title: 'ID under review',
      desc: "Your student ID was submitted and is being reviewed. Usually approved within 24 hours.",
      bg: 'bg-[#FFF7ED]',
      border: 'border-[#C2410C]/20',
    },
    rejected: {
      icon: <AlertCircle className="w-6 h-6 text-[#C2293F] stroke-[1.5]" />,
      title: 'ID not approved',
      desc: 'Your ID could not be verified. Please upload a clearer photo.',
      cta: 'Re-upload',
      ctaHref: '/dashboard/settings?tab=student-id',
      bg: 'bg-[#FFF8F6]',
      border: 'border-[#C2293F]/20',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
      <div className="shrink-0">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-[#222222]">{cfg.title}</p>
        <p className="text-[14px] text-[#717171] mt-1">{cfg.desc}</p>
      </div>
      {cfg.cta && cfg.ctaHref && (
        <Link href={cfg.ctaHref} className="shrink-0 mt-3 sm:mt-0">
          <Button className="w-full sm:w-auto h-10 px-6 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[14px] transition-colors">
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
    <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-2">
          <Home className="w-5 h-5 text-[#222222]" />
          My current lease
        </h3>
        <Link href="/dashboard/lease">
          <span className="text-[14px] text-[#222222] underline font-medium hover:text-[#717171] transition-colors">View details</span>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-start border-b border-[#EBEBEB] pb-4">
          <span className="text-[#717171] text-[15px]">Property</span>
          <span className="font-semibold text-[#222222] text-[15px] text-right max-w-[200px] truncate">
            {lease.property?.title || 'Unnamed property'}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-[#EBEBEB] pb-4">
          <span className="text-[#717171] text-[15px]">Monthly rent</span>
          <span className="font-semibold text-[#222222] text-[15px]">
            {(lease.monthlyRent || 0).toLocaleString()} FCFA
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-[#EBEBEB] pb-4">
          <span className="text-[#717171] text-[15px]">Lease ends</span>
          <span className={cn(
            "text-[15px] font-semibold",
            isExpired ? "text-[#C2293F]" : isExpiringSoon ? "text-[#C2410C]" : "text-[#222222]"
          )}>
            {new Date(lease.leaseEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {isExpiringSoon && !isExpired && ` · ${daysLeft}d left`}
            {isExpired && ' · Expired'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#717171] text-[15px]">Landlord</span>
          <span className="font-semibold text-[#222222] text-[15px]">
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
    pending: 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]',
    partial: 'bg-[#FFF7ED] text-[#C2410C] border-[#C2410C]/20',
    complete: 'bg-[#EBFBF0] text-[#008A05] border-[#008A05]/20',
    disbursed: 'bg-[#F7F7F7] text-[#222222] border-[#222222]',
    overdue: 'bg-[#FFF8F6] text-[#C2293F] border-[#C2293F]/20',
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#222222]" />
          Rent payments
        </h3>
      </div>
      <div className="space-y-0">
        {payments.slice(0, 4).map((cycle: any, index: number) => {
          const myShare = cycle.tenantShares?.find((s: any) => s.status !== 'paid');
          return (
            <div key={cycle._id} className={cn("flex items-center justify-between py-4", index !== 0 && "border-t border-[#EBEBEB]")}>
              <div>
                <p className="text-[15px] font-semibold text-[#222222]">{cycle.cycleLabel}</p>
                <p className="text-[13px] text-[#717171] mt-0.5">
                  {myShare
                    ? `${(myShare.amountDue || 0).toLocaleString()} FCFA due`
                    : 'Your share paid'}
                </p>
              </div>
              <span className={cn(
                "text-[12px] font-bold px-3 py-1 rounded-full capitalize border",
                statusStyles[cycle.status] || statusStyles.pending
              )}>
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
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#222222] mb-4 stroke-[2.5]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Verification banner */}
      <VerificationCard status={verificationStatus} />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <QuickStatCard
          icon={<Home className="w-5 h-5 stroke-[1.5]" />}
          label="Student listings"
          value="Browse"
          sub="Near your campus"
          href="/students"
        />
        <QuickStatCard
          icon={<Users className="w-5 h-5 stroke-[1.5]" />}
          label="Roommate pool"
          value={isVerified ? 'Open' : 'Locked'}
          sub={isVerified ? 'Find your match' : 'Verify ID first'}
          href={isVerified ? '/students/roommates' : undefined}
        />
        <QuickStatCard
          icon={<BedDouble className="w-5 h-5 stroke-[1.5]" />}
          label="Roommate profile"
          value={hasRoommateProfile ? 'Active' : 'None'}
          sub={hasRoommateProfile ? 'You are in the pool' : 'Create a profile'}
          href={isVerified ? '/students/roommates' : undefined}
        />
        <QuickStatCard
          icon={<ShieldCheck className="w-5 h-5 stroke-[1.5]" />}
          label="ID verification"
          value={verificationStatus
            ? verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)
            : 'Unknown'}
          sub={verificationStatus === 'verified' ? 'Full access' : 'Required for full access'}
          href="/dashboard/settings?tab=student-id"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

        {/* Left — lease + payments */}
        <div className="lg:col-span-2 space-y-6">
          {loadingLease ? (
            <div className="bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB] p-6 animate-pulse">
              <div className="h-5 bg-[#EBEBEB] rounded w-1/3 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-[#EBEBEB] rounded w-full" />)}
              </div>
            </div>
          ) : lease ? (
            <>
              <MyLeaseWidget lease={lease} />
              {payments.length > 0 && <RecentPayments payments={payments} />}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DDDDDD] p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
                <Home className="w-8 h-8 text-[#222222] stroke-[1.5]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#222222] mb-2">No active lease</h3>
              <p className="text-[15px] text-[#717171] max-w-sm mb-6">
                Once your landlord creates a digital lease, it will appear here along with your payment schedule.
              </p>
              <Link href="/students">
                <Button className="h-12 px-6 rounded-lg border border-[#222222] text-[#222222] bg-white hover:bg-[#F7F7F7] font-semibold text-[15px] transition-colors">
                  Browse housing
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right — quick actions */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[18px] font-semibold text-[#222222] mb-4">Quick actions</h3>
            
            <div className="space-y-3">
              {[
                {
                  icon: <Home className="w-5 h-5" />,
                  label: 'Find student housing',
                  desc: 'Search listings near your campus',
                  href: '/students',
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  label: 'Find a roommate',
                  desc: 'Browse the verified student pool',
                  href: '/students/roommates',
                  locked: !isVerified,
                },
                {
                  icon: <Heart className="w-5 h-5" />,
                  label: 'Saved properties',
                  desc: 'Properties you have favourited',
                  href: '/dashboard/favorite',
                },
                {
                  icon: <Wallet className="w-5 h-5" />,
                  label: 'Split rent calculator',
                  desc: 'Calculate per-person rent shares',
                  href: '/dashboard/split-rent',
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.locked ? '#' : action.href}
                  onClick={action.locked ? (e) => e.preventDefault() : undefined}
                  className={cn("block", action.locked && "cursor-not-allowed opacity-50")}
                >
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#DDDDDD] hover:border-[#222222] transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-[#F7F7F7] text-[#222222] flex items-center justify-center shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#222222]">{action.label}</p>
                      <p className="text-[13px] text-[#717171] truncate">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#DDDDDD] group-hover:text-[#222222] transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Campus info strip */}
          {studentProfile?.campusCity && (
            <div className="p-5 bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB]">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-6 h-6 text-[#222222] shrink-0 stroke-[1.5]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#222222] leading-tight mb-1">
                    {studentProfile.universityName}
                  </p>
                  <p className="text-[13px] text-[#717171] leading-snug">
                    {studentProfile.campusCity}
                    {studentProfile.studyLevel ? ` · ${studentProfile.studyLevel}` : ''}
                    {studentProfile.faculty ? ` · ${studentProfile.faculty}` : ''}
                  </p>
                </div>
                {verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-5 h-5 text-[#008A05] shrink-0" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}