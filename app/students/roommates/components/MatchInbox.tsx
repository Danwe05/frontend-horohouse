'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Check, X, MessageSquare, Clock, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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

function formatXAF(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();
}

function MatchRow({
  match,
  currentUserId,
  onRefresh,
}: {
  match: Match;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const [acting, setActing] = useState<'accept' | 'reject' | null>(null);

  const isInitiator = match.initiatorId._id === currentUserId;
  const otherUser = isInitiator ? match.receiverId : match.initiatorId;
  const otherProfile = isInitiator ? match.receiverProfileId : match.initiatorProfileId;
  const isPending = match.status === 'pending';
  const isMatched = match.status === 'matched';
  const canAct = isPending && !isInitiator; // only receiver can accept/reject

  const avatar =
    otherUser?.profilePicture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherUser?.name || 'u')}&backgroundColor=b6e3f4`;

  const handleAccept = async () => {
    setActing('accept');
    try {
      const res = await apiClient.acceptRoommateMatch(match._id);
      toast.success("It's a match! You can now chat.");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not accept match.');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    setActing('reject');
    try {
      await apiClient.rejectRoommateMatch(match._id);
      toast.success('Match declined.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not decline match.');
    } finally {
      setActing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isMatched
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}
    >
      {/* Avatar */}
      <img
        src={avatar}
        alt={otherUser?.name}
        className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">{otherUser?.name}</p>
          {match.compatibilityScore !== undefined && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
              {match.compatibilityScore}%
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
          {otherProfile?.campusCity && <><Users className="w-3 h-3" />{otherProfile.campusCity}</>}
          {otherProfile?.budgetPerPersonMax && (
            <span className="ml-1">· {formatXAF(otherProfile.budgetPerPersonMax)} XAF/mo</span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isMatched && match.chatRoomId ? (
          <Link href={`/dashboard/inquiry?conversation=${match.chatRoomId}`}>
            <Button size="sm" className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Chat
            </Button>
          </Link>
        ) : canAct ? (
          <>
            <Button
              size="sm"
              onClick={handleReject}
              disabled={!!acting}
              variant="outline"
              className="h-8 w-8 p-0 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
            >
              {acting === 'reject' ? (
                <span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={!!acting}
              className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {acting === 'accept' ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><Check className="w-3.5 h-3.5 mr-1" />Accept</>
              )}
            </Button>
          </>
        ) : isPending ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            Waiting
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

export function MatchInbox({ matches, currentUserId, onRefresh }: MatchInboxProps) {
  const total = matches.pending.length + matches.matched.length;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No matches yet — express interest in profiles to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.matched.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Confirmed matches ({matches.matched.length})
          </p>
          <div className="space-y-2">
            <AnimatePresence>
              {matches.matched.map((m) => (
                <MatchRow key={m._id} match={m} currentUserId={currentUserId} onRefresh={onRefresh} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      {matches.pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Pending ({matches.pending.length})
          </p>
          <div className="space-y-2">
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