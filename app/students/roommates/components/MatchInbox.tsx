'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Check, X, MessageSquare, Clock, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Match {
  _id: string;
  status: 'pending' | 'matched';
  initiatorId: { _id: string; name: string; profilePicture?: string };
  receiverId: { _id: string; name: string; profilePicture?: string };
  compatibilityScore?: number;
  chatRoomId?: string;
  matchedAt?: string;
  createdAt: string;
  initiatorProfileId?: { campusCity?: string; budgetPerPersonMax?: number; mode?: string };
  receiverProfileId?: { campusCity?: string; budgetPerPersonMax?: number; mode?: string };
}

interface MatchInboxProps {
  matches: { pending: Match[]; matched: Match[] };
  currentUserId: string;
  onRefresh: () => void;
}

function formatFCFA(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K FCFA` : `${n} FCFA`;
}

// ─── Match Row Component ──────────────────────────────────────────────────────

function MatchRow({
  match,
  currentUserId,
  onRefresh,
}: {
  match: Match;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.inbox || {};

  const [acting, setActing] = useState<'accept' | 'reject' | null>(null);

  const isInitiator = match.initiatorId._id === currentUserId;
  const otherUser = isInitiator ? match.receiverId : match.initiatorId;
  const otherProfile = isInitiator ? match.receiverProfileId : match.initiatorProfileId;
  const isPending = match.status === 'pending';
  const isMatched = match.status === 'matched';
  const canAct = isPending && !isInitiator; // only receiver can accept/reject

  const avatar = otherUser?.profilePicture || null;

  const handleAccept = async () => {
    setActing('accept');
    try {
      await apiClient.acceptRoommateMatch(match._id);
      toast.success(s.matchSuccess || "It's a match! You can now chat.");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || s.acceptError || 'Could not accept match.');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    setActing('reject');
    try {
      await apiClient.rejectRoommateMatch(match._id);
      toast.success(s.matchDeclined || 'Match declined.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || s.declineError || 'Could not decline match.');
    } finally {
      setActing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors",
        isMatched
          ? "bg-[#F7F7F7] border-[#DDDDDD]"
          : "bg-white border-[#DDDDDD] hover:border-[#222222]"
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EBEBEB] border border-[#DDDDDD] shrink-0 flex items-center justify-center text-[#222222]">
          {avatar ? (
            <img
              src={avatar}
              alt={otherUser?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[16px] font-bold">
              {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <p className="text-[16px] font-semibold text-[#222222] truncate">{otherUser?.name}</p>
            {match.compatibilityScore !== undefined && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#DDDDDD] bg-white text-[#222222] shrink-0 shadow-sm">
                {match.compatibilityScore}% match
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#717171] flex items-center gap-1.5">
            {otherProfile?.campusCity && <><Users className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{otherProfile.campusCity}</span></>}
            {otherProfile?.budgetPerPersonMax && (
              <span className="shrink-0">· {formatFCFA(otherProfile.budgetPerPersonMax)}/mo</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isMatched && match.chatRoomId ? (
          <Link href={`/dashboard/inquiry?conversation=${match.chatRoomId}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-10 px-5 rounded-lg bg-[#222222] hover:bg-black text-white text-[14px] font-semibold">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </Link>
        ) : canAct ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleReject}
              disabled={!!acting}
              variant="outline"
              className="h-10 w-10 p-0 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] focus:outline-none"
            >
              {acting === 'reject' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!!acting}
              className="flex-1 sm:flex-none h-10 px-5 rounded-lg bg-[#222222] hover:bg-black text-white text-[14px] font-semibold"
            >
              {acting === 'accept' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Check className="w-4 h-4 mr-2" />{s.accept || 'Accept'}</>
              )}
            </Button>
          </div>
        ) : isPending ? (
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#717171] bg-white border border-[#DDDDDD] px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Waiting for response
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── Inbox Wrapper ────────────────────────────────────────────────────────────

export function MatchInbox({ matches, currentUserId, onRefresh }: MatchInboxProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.inbox || {};
  const total = matches.pending.length + matches.matched.length;

  if (total === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#DDDDDD]">
        <Users className="w-12 h-12 text-[#DDDDDD] mx-auto mb-4 stroke-[1.5]" />
        <p className="text-[18px] font-semibold text-[#222222]">{s.noMatches || 'No matches yet'}</p>
        <p className="text-[15px] text-[#717171] mt-1 max-w-xs mx-auto">
          Express interest in profiles from the browse tab to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {matches.matched.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDDDDD]">
          <p className="text-[14px] font-bold text-[#222222] uppercase tracking-wide mb-4">
            {s.confirmedMatches || 'Confirmed matches'} ({matches.matched.length})
          </p>
          <div className="space-y-3">
            <AnimatePresence>
              {matches.matched.map((m) => (
                <MatchRow key={m._id} match={m} currentUserId={currentUserId} onRefresh={onRefresh} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {matches.pending.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDDDDD]">
          <p className="text-[14px] font-bold text-[#222222] uppercase tracking-wide mb-4">
            {s.pendingMatches || 'Pending'} ({matches.pending.length})
          </p>
          <div className="space-y-3">
            <AnimatePresence>
              {matches.pending.map((m) => (
                <MatchRow key={m._id} match={m} currentUserId={currentUserId} onRefresh={onRefresh} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}