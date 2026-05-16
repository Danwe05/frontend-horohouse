'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, Wallet, Users, ChevronDown, ChevronUp,
    CheckCircle2, Clock, AlertTriangle, XCircle, Loader2,
    Home, Calendar, RefreshCw, Minus, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SplitResult {
    totalRent: number;
    numberOfTenants: number;
    shares: Array<{ tenantIndex: number; amount: number; percentage: number }>;
    remainder: number;
}

interface TenantShare {
    tenantUserId: string;
    tenantName: string;
    amountDue: number;
    amountPaid: number;
    status: 'unpaid' | 'paid' | 'overdue' | 'waived';
    dueDate: string;
    paidAt?: string;
}

interface PaymentCycle {
    _id: string;
    cycleLabel: string;
    cycleStart: string;
    cycleEnd: string;
    totalRent: number;
    totalCollected: number;
    status: 'pending' | 'partial' | 'complete' | 'disbursed' | 'overdue';
    tenantShares: TenantShare[];
    propertyId?: { title: string; address: string; city: string };
}

// ─── Status config ────────────────────────────────────────────────────────────

const CYCLE_STATUS = {
    pending: { label: 'Pending', icon: Clock, badge: 'border-[#DDDDDD] text-[#717171]' },
    partial: { label: 'Partial', icon: ChevronUp, badge: 'border-[#C2410C]/30 text-[#C2410C] bg-[#FFF7ED]' },
    complete: { label: 'Complete', icon: CheckCircle2, badge: 'border-[#008A05]/30 text-[#008A05] bg-[#EBFBF0]' },
    disbursed: { label: 'Disbursed', icon: CheckCircle2, badge: 'border-[#222222] text-[#222222] bg-[#F7F7F7]' },
    overdue: { label: 'Overdue', icon: AlertTriangle, badge: 'border-[#C2293F]/30 text-[#C2293F] bg-[#FFF8F6]' },
} as const;

const SHARE_STATUS: Record<string, { label: string; color: string }> = {
    unpaid: { label: 'Unpaid', color: 'border-[#DDDDDD] text-[#717171]' },
    paid: { label: 'Paid', color: 'border-[#008A05]/30 text-[#008A05] bg-[#EBFBF0]' },
    overdue: { label: 'Overdue', color: 'border-[#C2293F]/30 text-[#C2293F] bg-[#FFF8F6]' },
    waived: { label: 'Waived', color: 'border-[#222222] text-[#222222]' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXAF(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K FCFA`;
    return `${n.toLocaleString()} FCFA`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Calculator ───────────────────────────────────────────────────────────────

function RentCalculator() {
    const [totalRent, setTotalRent] = useState('');
    const [tenantCount, setTenantCount] = useState(2);
    const [customMode, setCustomMode] = useState(false);
    const [percentages, setPercentages] = useState<string[]>(['50', '50']);
    const [result, setResult] = useState<SplitResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const adjustTenants = (delta: number) => {
        const next = Math.max(2, Math.min(6, tenantCount + delta));
        setTenantCount(next);
        const equal = (100 / next).toFixed(1);
        setPercentages(Array(next).fill(equal));
        setResult(null);
    };

    const handleCalculate = async () => {
        const rent = Number(totalRent);
        if (!rent || rent < 1) { setError('Enter a valid rent amount.'); return; }
        setError('');
        setLoading(true);
        try {
            const payload: any = { totalRent: rent, numberOfTenants: tenantCount };
            if (customMode) {
                const pcts = percentages.map(Number);
                const sum = pcts.reduce((a, b) => a + b, 0);
                if (Math.abs(sum - 100) > 0.5) { setError('Percentages must sum to 100.'); setLoading(false); return; }
                payload.customPercentages = pcts;
            }
            const res = await apiClient.calculateRentSplit(payload);
            setResult(res);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Calculation failed.');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";

    return (
        <div className="bg-white w-full rounded-2xl border border-[#DDDDDD] overflow-hidden">
            {/* Header */}
            <div className="border-b border-[#EBEBEB] px-6 py-5">
                <h2 className="text-[22px] font-semibold text-[#222222]">Rent split calculator</h2>
                <p className="text-[#717171] text-[15px] mt-1">Calculate fair shares before signing a lease.</p>
            </div>

            <div className="p-6 space-y-8">
                {/* Total rent */}
                <div className="space-y-2">
                    <Label className="text-[15px] font-semibold text-[#222222]">Total monthly rent (FCFA)</Label>
                    <Input
                        type="number"
                        value={totalRent}
                        onChange={e => { setTotalRent(e.target.value); setResult(null); }}
                        placeholder="e.g. 120000"
                        className={inputClasses}
                    />
                </div>

                {/* Tenant count */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-[15px] font-semibold text-[#222222]">Number of tenants</Label>
                            <p className="text-[13px] text-[#717171] mt-0.5">Maximum of 6</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => adjustTenants(-1)}
                                disabled={tenantCount <= 2}
                                className="w-10 h-10 rounded-full border border-[#B0B0B0] flex items-center justify-center text-[#717171] hover:text-[#222222] hover:border-[#222222] disabled:opacity-30 disabled:hover:border-[#B0B0B0] disabled:hover:text-[#717171] transition-colors"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <span className="text-[16px] font-semibold text-[#222222] w-4 text-center">{tenantCount}</span>
                            <button
                                onClick={() => adjustTenants(1)}
                                disabled={tenantCount >= 6}
                                className="w-10 h-10 rounded-full border border-[#B0B0B0] flex items-center justify-center text-[#717171] hover:text-[#222222] hover:border-[#222222] disabled:opacity-30 disabled:hover:border-[#B0B0B0] disabled:hover:text-[#717171] transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Custom percentages toggle */}
                <div className="border-t border-[#EBEBEB] pt-6">
                    <button
                        onClick={() => setCustomMode(!customMode)}
                        className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors flex items-center gap-2 focus:outline-none"
                    >
                        {customMode ? 'Use equal split' : 'Customize percentages'}
                    </button>

                    <AnimatePresence>
                        {customMode && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 gap-4 pt-6">
                                    {percentages.map((pct, i) => (
                                        <div key={i} className="space-y-2">
                                            <Label className="text-[14px] font-semibold text-[#222222]">Tenant {i + 1} %</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={99}
                                                value={pct}
                                                onChange={e => {
                                                    const next = [...percentages];
                                                    next[i] = e.target.value;
                                                    setPercentages(next);
                                                    setResult(null);
                                                }}
                                                className="h-12 w-full rounded-xl border border-[#B0B0B0] px-4 py-2 text-[15px] text-[#222222] focus:ring-[#222222]"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[13px] text-[#717171] mt-3">
                                    Total: {percentages.map(Number).reduce((a, b) => a + b, 0).toFixed(1)}% 
                                    {Math.abs(percentages.map(Number).reduce((a, b) => a + b, 0) - 100) < 0.5 ? ' ✓' : ' (must equal 100%)'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {error && (
                    <div className="flex items-start gap-2 text-[#C2410C] text-[14px] font-medium bg-[#FFF7ED] border border-[#C2410C]/20 rounded-xl p-4">
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <Button
                    onClick={handleCalculate}
                    disabled={loading || !totalRent}
                    className="w-full h-14 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[16px] transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Calculate split'}
                </Button>

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 pt-6 border-t border-[#EBEBEB]"
                        >
                            <h3 className="text-[18px] font-semibold text-[#222222] mb-4">Breakdown</h3>
                            {result.shares.map((share, i) => (
                                <div key={i} className="flex items-center justify-between pb-4 border-b border-[#EBEBEB] last:border-0">
                                    <div>
                                        <p className="text-[16px] font-semibold text-[#222222]">Tenant {share.tenantIndex}</p>
                                        <p className="text-[14px] text-[#717171] mt-0.5">{share.percentage.toFixed(1)}% of total</p>
                                    </div>
                                    <p className="text-[16px] font-semibold text-[#222222]">{formatXAF(share.amount)}</p>
                                </div>
                            ))}
                            {result.remainder > 0 && (
                                <p className="text-[13px] text-[#717171] pt-2">
                                    *{result.remainder} FCFA remainder added to Tenant 1
                                </p>
                            )}
                            <div className="flex items-center justify-between pt-4 pb-2">
                                <p className="text-[18px] font-bold text-[#222222]">Total</p>
                                <p className="text-[18px] font-bold text-[#222222]">{formatXAF(result.totalRent)}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Payment cycle card ───────────────────────────────────────────────────────

function CycleCard({ cycle, currentUserId }: { cycle: PaymentCycle; currentUserId: string }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = CYCLE_STATUS[cycle.status] ?? CYCLE_STATUS.pending;
    const StatusIcon = cfg.icon;

    const myShare = cycle.tenantShares.find(s => s.tenantUserId === currentUserId);
    const progress = cycle.totalRent > 0 ? (cycle.totalCollected / cycle.totalRent) * 100 : 0;

    return (
        <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden transition-all hover:border-[#B0B0B0]">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left p-6 transition-colors focus:outline-none"
            >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl border border-[#DDDDDD] flex items-center justify-center shrink-0 bg-[#F7F7F7]">
                            <Calendar className="w-6 h-6 text-[#222222] stroke-[1.5]" />
                        </div>
                        <div>
                            <p className="text-[18px] font-semibold text-[#222222]">{cycle.cycleLabel}</p>
                            <p className="text-[14px] text-[#717171] mt-1">
                                {formatDate(cycle.cycleStart)} – {formatDate(cycle.cycleEnd)}
                            </p>
                            {cycle.propertyId && (
                                <p className="text-[14px] text-[#717171] flex items-center gap-1.5 mt-1">
                                    <Home className="w-4 h-4" />
                                    {cycle.propertyId.title}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-full border', cfg.badge)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                        </span>
                        {myShare && (
                            <span className={cn('text-[13px] font-semibold px-3 py-1 rounded-full border', SHARE_STATUS[myShare.status]?.color)}>
                                My share: {SHARE_STATUS[myShare.status]?.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                    <div className="flex items-center justify-between text-[14px] mb-2">
                        <span className="text-[#717171] font-medium">Collected</span>
                        <span className="font-semibold text-[#222222]">
                            {formatXAF(cycle.totalCollected)} / {formatXAF(cycle.totalRent)}
                        </span>
                    </div>
                    <div className="h-2 bg-[#EBEBEB] rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                progress >= 100 ? 'bg-[#008A05]' : progress > 0 ? 'bg-[#222222]' : 'bg-[#DDDDDD]'
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <span className="text-[14px] font-semibold text-[#222222] underline flex items-center gap-1 hover:text-[#717171] transition-colors">
                        {expanded ? 'Hide details' : 'Show details'}
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                </div>
            </button>

            {/* Expanded: all shares */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-[#EBEBEB]"
                    >
                        <div className="p-6 space-y-4 bg-[#F7F7F7]">
                            <p className="text-[14px] font-semibold text-[#222222]">
                                All Tenants ({cycle.tenantShares.length})
                            </p>
                            <div className="space-y-3">
                                {cycle.tenantShares.map((share, i) => {
                                    const isMe = share.tenantUserId === currentUserId;
                                    const shareCfg = SHARE_STATUS[share.status] ?? SHARE_STATUS.unpaid;
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                'flex items-center justify-between p-4 rounded-xl border bg-white',
                                                isMe ? 'border-[#222222] shadow-[0_0_0_1px_#222222]' : 'border-[#DDDDDD]'
                                            )}
                                        >
                                            <div className="min-w-0 pr-4">
                                                <p className="text-[15px] font-semibold text-[#222222] truncate flex items-center gap-2">
                                                    {share.tenantName}
                                                    {isMe && <span className="text-[11px] font-bold text-[#222222] border border-[#222222] px-2 py-0.5 rounded-md">You</span>}
                                                </p>
                                                <p className="text-[13px] text-[#717171] mt-1">
                                                    Due {formatDate(share.dueDate)}
                                                    {share.paidAt && ` · Paid ${formatDate(share.paidAt)}`}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <p className="text-[15px] font-semibold text-[#222222]">{formatXAF(share.amountDue)}</p>
                                                <span className={cn('text-[12px] font-semibold px-2 py-0.5 rounded-md border', shareCfg.color)}>
                                                    {shareCfg.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Inner component that uses useSearchParams ────────────────────────────────

function SplitRentContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [cycles, setCycles] = useState<PaymentCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'calculator' | 'my-payments'>(
        () => (searchParams.get('tab') as any) ?? 'calculator'
    );

    const fetchCycles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.getMyTenantPayments();
            setCycles(res || []);
        } catch {
            setCycles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCycles(); }, [fetchCycles]);

    const currentUserId = user?.id || (user as any)?._id || '';

    return (
        <div className="mx-auto w-full max-w-5xl p-6 lg:p-8 space-y-8">

            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-2">Rent split</h1>
                <p className="text-[16px] text-[#717171]">
                    Calculate fair rent splits and track your active payment cycles.
                </p>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[#EBEBEB]">
                {[
                    { key: 'calculator', label: 'Calculator', icon: Calculator },
                    { key: 'my-payments', label: 'My Payments', icon: Wallet },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => {
                            setTab(t.key as any);
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('tab', t.key);
                            window.history.replaceState(null, '', `?${params.toString()}`);
                        }}
                        className={cn(
                            'flex items-center gap-2 pb-4 text-[15px] font-semibold transition-colors relative',
                            tab === t.key
                                ? 'text-[#222222]'
                                : 'text-[#717171] hover:text-[#222222]'
                        )}
                    >
                        <t.icon className="w-5 h-5 stroke-[2]" />
                        {t.label}
                        {t.key === 'my-payments' && cycles.length > 0 && (
                            <span className={cn(
                                'text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-1',
                                tab === t.key ? 'bg-[#222222] text-white' : 'bg-[#EBEBEB] text-[#222222]'
                            )}>
                                {cycles.length}
                            </span>
                        )}
                        {/* Active Tab Indicator */}
                        {tab === t.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Calculator tab */}
            {tab === 'calculator' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl"
                >
                    <RentCalculator />
                </motion.div>
            )}

            {/* My payments tab */}
            {tab === 'my-payments' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-[16px] font-semibold text-[#222222]">
                            {cycles.length} payment cycle{cycles.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={fetchCycles}
                            className="flex items-center gap-2 text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[#222222] stroke-[2.5]" />
                        </div>
                    ) : cycles.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-[#DDDDDD]">
                            <Wallet className="w-12 h-12 text-[#DDDDDD] mx-auto mb-4 stroke-[1.5]" />
                            <p className="text-[18px] font-semibold text-[#222222]">No payment cycles yet</p>
                            <p className="text-[15px] text-[#717171] mt-2 max-w-sm mx-auto">
                                Once your landlord creates a billing cycle for your lease, it will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-3xl">
                            {cycles.map(cycle => (
                                <CycleCard
                                    key={cycle._id}
                                    cycle={cycle}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SplitRentPage() {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset className="bg-transparent border-l border-[#EBEBEB]">
                    <NavDash />
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center py-32">
                                <Loader2 className="w-8 h-8 animate-spin text-[#222222] stroke-[2.5]" />
                            </div>
                        }
                    >
                        <SplitRentContent />
                    </Suspense>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}