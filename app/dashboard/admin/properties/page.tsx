'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Building2, CheckCircle2, XCircle, Clock, Search, Filter,
    ChevronLeft, ChevronRight, MoreVertical, Trash2,
    X, Check, AlertTriangle, Loader2, RefreshCw,
    Eye, MapPin, DollarSign, User, Shield, Home,
    BadgeCheck, ThumbsDown, ThumbsUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface PropertyOwner {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    profilePicture?: string;
    role?: string;
    agency?: string;
}

interface Property {
    _id: string;
    title: string;
    price: number;
    type: string;
    listingType: string;
    city: string;
    address: string;
    country?: string;
    images?: { url: string; isMain?: boolean }[];
    approvalStatus: ApprovalStatus;
    rejectionReason?: string;
    isVerified: boolean;
    isFeatured: boolean;
    isActive: boolean;
    viewsCount: number;
    ownerId?: PropertyOwner;
    agentId?: PropertyOwner;
    createdAt: string;
    amenities?: { bedrooms?: number; bathrooms?: number };
    area?: number;
}

interface PaginatedProperties {
    properties: Property[];
    total: number;
    page: number;
    totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APPROVAL_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ElementType; dot: string }> = {
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock, dot: 'bg-amber-400' },
    approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2, dot: 'bg-emerald-500' },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle, dot: 'bg-red-500' },
};

function formatPrice(price: number): string {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M FCFA`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K FCFA`;
    return `${price} FCFA`;
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
    const cfg = APPROVAL_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function StatCard({
    label, value, icon: Icon, color, subLabel, highlight
}: {
    label: string; value: number | string; icon: React.ElementType; color: string; subLabel?: string; highlight?: boolean
}) {
    return (
        <Card className={cn(
            'border-none shadow-sm ring-1 ring-slate-200/60 hover:shadow-md transition-all duration-300 group',
            highlight && 'ring-amber-300/70 bg-amber-50/50'
        )}>
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110 duration-300', color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className={cn('text-2xl font-bold mt-0.5', highlight ? 'text-amber-700' : 'text-slate-900')}>{value}</p>
                    {subLabel && <p className="text-[10px] text-slate-400 mt-0.5">{subLabel}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function PropertyThumbnail({ property }: { property: Property }) {
    const mainImg = property.images?.find(i => i.isMain) || property.images?.[0];
    if (mainImg?.url) {
        return (
            <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                <img src={mainImg.url} alt={property.title} className="w-full h-full object-cover" />
            </div>
        );
    }
    return (
        <div className="w-14 h-10 rounded-lg flex-shrink-0 bg-slate-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-400" />
        </div>
    );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectModalProps {
    property: Property;
    onClose: () => void;
    onRejected: () => void;
}

function RejectModal({ property, onClose, onRejected }: RejectModalProps) {
    const [reason, setReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [error, setError] = useState('');

    const handleReject = async () => {
        setRejecting(true);
        setError('');
        try {
            await apiClient.rejectProperty(property._id, reason.trim() || undefined);
            onRejected();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Failed to reject property.');
            setRejecting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Reject Listing</h2>
                        <p className="text-xs text-slate-500 truncate max-w-[280px]">{property.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800">This property will be rejected</p>
                            <p className="text-xs text-red-600">It will remain hidden from public listings.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
                            Rejection Reason <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <Textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Explain why this listing was rejected…"
                            className="bg-slate-50 border-slate-200 resize-none"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="outline" onClick={onClose} className="flex-1" disabled={rejecting}>
                        Cancel
                    </Button>
                    <Button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-700" disabled={rejecting}>
                        {rejecting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Rejecting…</> : <><XCircle className="w-4 h-4 mr-2" />Reject Listing</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ property, onClose, onDeleted }: { property: Property; onClose: () => void; onDeleted: () => void }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiClient.deleteProperty(property._id);
            onDeleted();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Failed to delete property.');
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Delete Property?</h2>
                    <p className="text-sm text-slate-500 mb-2">
                        <span className="font-semibold text-slate-700">{property.title}</span> will be permanently removed. This cannot be undone.
                    </p>
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>
                <div className="flex gap-3 px-6 pb-6">
                    <Button variant="outline" onClick={onClose} className="flex-1" disabled={deleting}>Cancel</Button>
                    <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={deleting}>
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

interface ActionMenuProps {
    property: Property;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
    approving: boolean;
}

function ActionMenu({ property, onApprove, onReject, onDelete, approving }: ActionMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative flex items-center gap-1.5" ref={ref}>
            {/* Quick Approve / Reject buttons for pending */}
            {property.approvalStatus === 'pending' && (
                <>
                    <button
                        onClick={onApprove}
                        disabled={approving}
                        title="Approve"
                        className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => { setOpen(false); onReject(); }}
                        title="Reject"
                        className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                    >
                        <ThumbsDown className="w-4 h-4" />
                    </button>
                </>
            )}

            {/* More menu */}
            <button
                onClick={() => setOpen(v => !v)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-1 top-full w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                    {property.approvalStatus !== 'approved' && (
                        <button
                            onClick={() => { setOpen(false); onApprove(); }}
                            disabled={approving}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                    )}
                    {property.approvalStatus !== 'rejected' && (
                        <button
                            onClick={() => { setOpen(false); onReject(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                    )}
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                        onClick={() => { setOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    // Guard
    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') router.push('/dashboard');
    }, [currentUser, router]);

    // Stats: derived from counts
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [properties, setProperties] = useState<Property[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [listingFilter, setListingFilter] = useState<string>('all');
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectProperty, setRejectProperty] = useState<Property | null>(null);
    const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);

    const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const fetchProperties = useCallback(async (p = page) => {
        setLoadingProperties(true);
        try {
            const params: any = { page: p, limit };
            if (search.trim()) params.search = search.trim();
            if (statusFilter !== 'all') params.approvalStatus = statusFilter;
            if (typeFilter !== 'all') params.propertyType = typeFilter;
            if (listingFilter !== 'all') params.listingType = listingFilter;

            const data: PaginatedProperties = await apiClient.adminGetAllProperties(params);
            setProperties(data.properties ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(data.page ?? p);
        } catch (e) { console.error(e); }
        finally { setLoadingProperties(false); }
    }, [page, limit, search, statusFilter, typeFilter, listingFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const [all, pending, approved, rejected] = await Promise.all([
                apiClient.adminGetAllProperties({ limit: 1 }),
                apiClient.adminGetAllProperties({ approvalStatus: 'pending', limit: 1 }),
                apiClient.adminGetAllProperties({ approvalStatus: 'approved', limit: 1 }),
                apiClient.adminGetAllProperties({ approvalStatus: 'rejected', limit: 1 }),
            ]);
            setStats({
                total: all.total ?? 0,
                pending: pending.total ?? 0,
                approved: approved.total ?? 0,
                rejected: rejected.total ?? 0,
            });
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchStats(); }, []);

    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => { setPage(1); fetchProperties(1); }, 400);
        return () => clearTimeout(searchTimer.current);
    }, [search, statusFilter, typeFilter, listingFilter, limit]);

    useEffect(() => { fetchProperties(page); }, [page]);

    const handleApprove = async (property: Property) => {
        setApprovingId(property._id);
        try {
            await apiClient.approveProperty(property._id);
            await Promise.all([fetchProperties(page), fetchStats()]);
        } catch (e: any) {
            console.error(e);
        } finally {
            setApprovingId(null);
        }
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            {[...Array(7)].map((_, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-4 bg-slate-200 rounded-md" style={{ width: `${55 + (i * 8) % 40}%` }} />
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
                                    <div className="p-2 bg-red-50 rounded-lg">
                                        <Building2 className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Property Approvals</h1>
                                    <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100 text-xs">Admin</Badge>
                                </div>
                                <p className="text-slate-500 text-sm">Review, approve, reject, and manage all property listings on the platform.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { fetchProperties(page); fetchStats(); }}
                                className="gap-2 self-start sm:self-auto"
                            >
                                <RefreshCw className="w-4 h-4" /> Refresh
                            </Button>
                        </div>

                        {/* ── Stats ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Properties" value={stats.total} icon={Building2} color="bg-blue-50 text-blue-600" />
                            <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="bg-amber-50 text-amber-600" highlight={stats.pending > 0} subLabel={stats.pending > 0 ? 'Needs attention' : undefined} />
                            <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                            <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-50 text-red-600" />
                        </div>

                        {/* ── Filters ── */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input
                                    placeholder="Search title, city, address…"
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
                                <SelectTrigger className="w-full sm:w-[170px] bg-white border-slate-200 shadow-sm">
                                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[155px] bg-white border-slate-200 shadow-sm">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="apartment">Apartment</SelectItem>
                                    <SelectItem value="house">House</SelectItem>
                                    <SelectItem value="villa">Villa</SelectItem>
                                    <SelectItem value="studio">Studio</SelectItem>
                                    <SelectItem value="duplex">Duplex</SelectItem>
                                    <SelectItem value="bungalow">Bungalow</SelectItem>
                                    <SelectItem value="penthouse">Penthouse</SelectItem>
                                    <SelectItem value="land">Land</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="office">Office</SelectItem>
                                    <SelectItem value="shop">Shop</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={listingFilter} onValueChange={v => { setListingFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[140px] bg-white border-slate-200 shadow-sm">
                                    <SelectValue placeholder="Sale / Rent" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Sale &amp; Rent</SelectItem>
                                    <SelectItem value="sale">For Sale</SelectItem>
                                    <SelectItem value="rent">For Rent</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[120px] bg-white border-slate-200 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 / page</SelectItem>
                                    <SelectItem value="25">25 / page</SelectItem>
                                    <SelectItem value="50">50 / page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ── Table ── */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/70">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Listed</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loadingProperties ? (
                                            [...Array(Math.min(limit, 8))].map((_, i) => <SkeletonRow key={i} />)
                                        ) : properties.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-16 text-center">
                                                    <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-500 font-semibold">No properties found</p>
                                                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search.</p>
                                                </td>
                                            </tr>
                                        ) : properties.map(prop => {
                                            const owner = prop.agentId || prop.ownerId;
                                            const isApproving = approvingId === prop._id;
                                            return (
                                                <tr
                                                    key={prop._id}
                                                    className={cn(
                                                        'hover:bg-slate-50/70 transition-colors duration-150',
                                                        prop.approvalStatus === 'pending' && 'bg-amber-50/30 hover:bg-amber-50/60',
                                                    )}
                                                >
                                                    {/* Property */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <PropertyThumbnail property={prop} />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 truncate max-w-[180px]">{prop.title}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {prop.isVerified && (
                                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                                                                            <BadgeCheck className="w-3 h-3" /> Verified
                                                                        </span>
                                                                    )}
                                                                    {prop.isFeatured && (
                                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                                                                            ★ Featured
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                            <span className="truncate max-w-[120px]">{prop.city}</span>
                                                        </div>
                                                        {prop.country && (
                                                            <p className="text-[10px] text-slate-400 ml-4.5 mt-0.5">{prop.country}</p>
                                                        )}
                                                    </td>

                                                    {/* Type */}
                                                    <td className="px-4 py-3.5">
                                                        <div>
                                                            <span className="capitalize text-slate-700 font-medium text-xs">{prop.type}</span>
                                                            <span className={cn(
                                                                'ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                                                prop.listingType === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                            )}>
                                                                {prop.listingType === 'sale' ? 'Sale' : 'Rent'}
                                                            </span>
                                                        </div>
                                                        {prop.amenities?.bedrooms !== undefined && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                {prop.amenities.bedrooms}bd · {prop.amenities.bathrooms ?? 0}ba
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1 text-slate-900 font-semibold text-sm">
                                                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatPrice(prop.price)}
                                                        </div>
                                                        {prop.area && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{prop.area} m²</p>
                                                        )}
                                                    </td>

                                                    {/* Agent */}
                                                    <td className="px-4 py-3.5">
                                                        {owner ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                                                    {owner.profilePicture ? (
                                                                        <img src={owner.profilePicture} alt={owner.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                            {owner.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-slate-800 truncate max-w-[100px]">{owner.name}</p>
                                                                    {owner.agency && <p className="text-[10px] text-slate-400 truncate">{owner.agency}</p>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3.5">
                                                        <ApprovalBadge status={prop.approvalStatus} />
                                                        {prop.approvalStatus === 'rejected' && prop.rejectionReason && (
                                                            <p className="text-[10px] text-slate-400 mt-1 max-w-[120px] truncate" title={prop.rejectionReason}>
                                                                {prop.rejectionReason}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Listed date */}
                                                    <td className="px-4 py-3.5">
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(prop.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {prop.viewsCount} view{prop.viewsCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5">
                                                        <ActionMenu
                                                            property={prop}
                                                            onApprove={() => handleApprove(prop)}
                                                            onReject={() => setRejectProperty(prop)}
                                                            onDelete={() => setDeleteProperty(prop)}
                                                            approving={isApproving}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Pagination ── */}
                            {!loadingProperties && properties.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-semibold text-slate-700">{total}</span> properties
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline" size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let p: number;
                                            if (totalPages <= 5) p = i + 1;
                                            else if (page <= 3) p = i + 1;
                                            else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                            else p = page - 2 + i;
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => setPage(p)}
                                                    className={cn(
                                                        'h-8 w-8 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                                                        p === page ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}

                                        <Button
                                            variant="outline" size="sm"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </div>

            {/* ── Modals ── */}
            {rejectProperty && (
                <RejectModal
                    property={rejectProperty}
                    onClose={() => setRejectProperty(null)}
                    onRejected={() => { fetchProperties(page); fetchStats(); }}
                />
            )}
            {deleteProperty && (
                <DeleteModal
                    property={deleteProperty}
                    onClose={() => setDeleteProperty(null)}
                    onDeleted={() => { fetchStats(); fetchProperties(page); }}
                />
            )}
        </SidebarProvider>
    );
}
