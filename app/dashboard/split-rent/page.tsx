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
    Home, Calendar, ArrowRight, RefreshCw, Minus, Plus,
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

const CYCLE_STATUS: Record<string, { label: string; icon: React.ElementType; badge: string }> = {
    pending: { label: 'Pending', icon: Clock, badge: 'bg-slate-100 text-slate-500' },
    partial: { label: 'Partial', icon: ChevronUp, badge: 'bg-amber-100 text-amber-700' },
    complete: { label: 'Complete', icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700' },
    disbursed: { label: 'Disbursed', icon: CheckCircle2, badge: 'bg-blue-100 text-blue-700' },
    overdue: { label: 'Overdue', icon: AlertTriangle, badge: 'bg-red-100 text-red-600' },
};

const SHARE_STATUS: Record<string, { label: string; color: string }> = {
    unpaid: { label: 'Unpaid', color: 'bg-slate-100 text-slate-500' },
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-600' },
    waived: { label: 'Waived', color: 'bg-purple-100 text-purple-700' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXAF(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M XAF`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K XAF`;
    return `${n.toLocaleString()} XAF`;
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

    return (
        <div className="bg-white rounded-2xl border border-slate-100 -sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Rent Split Calculator</h2>
                        <p className="text-emerald-100 text-xs mt-0.5">Calculate fair shares before signing a lease</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Total rent */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly Rent (XAF)</Label>
                    <Input
                        type="number"
                        value={totalRent}
                        onChange={e => { setTotalRent(e.target.value); setResult(null); }}
                        placeholder="e.g. 120000"
                        className="border-slate-200 rounded-xl bg-slate-50 text-lg font-semibold focus:ring-2 focus:ring-emerald-300"
                    />
                </div>

                {/* Tenant count */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Number of Tenants</Label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => adjustTenants(-1)}
                            disabled={tenantCount <= 2}
                            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
                        >
                            <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <div className="flex-1 flex items-center justify-center gap-2">
                            {Array.from({ length: tenantCount }).map((_, i) => (
                                <div key={i} className="w-9 h-9 rounded-full bg-emerald-50 border-1 border-emerald-200 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => adjustTenants(1)}
                            disabled={tenantCount >= 6}
                            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
                        >
                            <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 text-center">{tenantCount} tenant{tenantCount > 1 ? 's' : ''}</p>
                </div>

                {/* Custom percentages toggle */}
                <button
                    onClick={() => setCustomMode(!customMode)}
                    className="flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                    {customMode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {percentages.map((pct, i) => (
                                    <div key={i} className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant {i + 1} %</Label>
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
                                            className="border-slate-200 rounded-xl bg-slate-50 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                Sum: {percentages.map(Number).reduce((a, b) => a + b, 0).toFixed(1)}% {Math.abs(percentages.map(Number).reduce((a, b) => a + b, 0) - 100) < 0.5 ? '✓' : '— must equal 100'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />{error}
                    </p>
                )}

                <Button
                    onClick={handleCalculate}
                    disabled={loading || !totalRent}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold -sm"
                >
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating…</> : 'Calculate Split'}
                </Button>

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 pt-2 border-t border-slate-100"
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per-Tenant Breakdown</p>
                            {result.shares.map((share, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-black text-emerald-800">
                                            {share.tenantIndex}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Tenant {share.tenantIndex}</p>
                                            <p className="text-[10px] text-slate-400">{share.percentage.toFixed(1)}% of total</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black text-emerald-700 tracking-tight">{formatXAF(share.amount)}</p>
                                </div>
                            ))}
                            {result.remainder > 0 && (
                                <p className="text-[10px] text-slate-400 text-center">
                                    {result.remainder} XAF remainder added to Tenant 1
                                </p>
                            )}
                            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                                <p className="text-sm font-semibold text-slate-300">Total</p>
                                <p className="text-lg font-black text-white tracking-tight">{formatXAF(result.totalRent)}</p>
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
        <div className="bg-white rounded-2xl border border-slate-100 -sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{cycle.cycleLabel}</p>
                            {cycle.propertyId && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Home className="w-3 h-3" />
                                    {cycle.propertyId.title}
                                </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatDate(cycle.cycleStart)} — {formatDate(cycle.cycleEnd)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.badge)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                        </span>
                        {myShare && (
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', SHARE_STATUS[myShare.status]?.color)}>
                                My share: {SHARE_STATUS[myShare.status]?.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">Collected</span>
                        <span className="font-bold text-slate-700">
                            {formatXAF(cycle.totalCollected)} / {formatXAF(cycle.totalRent)}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                progress >= 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-amber-400' : 'bg-slate-200'
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end mt-3">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? 'Hide' : 'Show'} details
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
                        className="overflow-hidden border-t border-slate-100"
                    >
                        <div className="p-5 space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                All Tenants ({cycle.tenantShares.length})
                            </p>
                            {cycle.tenantShares.map((share, i) => {
                                const isMe = share.tenantUserId === currentUserId;
                                const shareCfg = SHARE_STATUS[share.status] ?? SHARE_STATUS.unpaid;
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'flex items-center justify-between p-3 rounded-xl border',
                                            isMe ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-slate-50'
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {share.tenantName}
                                                {isMe && <span className="ml-1.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">You</span>}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Due {formatDate(share.dueDate)}
                                                {share.paidAt && ` · Paid ${formatDate(share.paidAt)}`}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <p className="text-sm font-bold text-slate-800">{formatXAF(share.amountDue)}</p>
                                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', shareCfg.color)}>
                                                {shareCfg.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
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
        <div className="mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">

            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Rent Split</h1>
                </div>
                <p className="text-slate-500 text-sm pl-11">
                    Calculate fair rent splits and track your payment cycles.
                </p>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit -sm">
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
                            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                            tab === t.key
                                ? 'bg-emerald-600 text-white -sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        )}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                        {t.key === 'my-payments' && cycles.length > 0 && (
                            <span className={cn(
                                'text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center',
                                tab === t.key ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                            )}>
                                {cycles.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Calculator tab */}
            {tab === 'calculator' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-lg"
                >
                    <RentCalculator />
                </motion.div>
            )}

            {/* My payments tab */}
            {tab === 'my-payments' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">
                            {cycles.length} payment cycle{cycles.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={fetchCycles}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : cycles.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                            <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold">No payment cycles yet</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                Once your landlord creates a billing cycle for your lease, it will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />

                    {/* ✅ Suspense boundary wraps the component that calls useSearchParams() */}
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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