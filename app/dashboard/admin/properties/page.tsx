'use client';

import React, {
    useState, useEffect, useCallback, useRef, useMemo,
    memo,
} from 'react';
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
    MapPin, DollarSign, BadgeCheck, ThumbsDown, ThumbsUp,
    LucideIcon, CheckSquare, Square, MinusSquare,
    Zap, ShieldCheck, ShieldX,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const APPROVAL_CONFIG = {
    pending: {
        label: 'Pending',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: Clock,
        dot: 'bg-amber-400',
    },
    approved: {
        label: 'Approved',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: CheckCircle2,
        dot: 'bg-emerald-500',
    },
    rejected: {
        label: 'Rejected',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: XCircle,
        dot: 'bg-red-500',
    },
} satisfies Record<ApprovalStatus, {
    label: string; color: string; bg: string;
    border: string; icon: LucideIcon; dot: string;
}>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
    return `${price}`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

// ─── Sub-components (memoised for perf) ──────────────────────────────────────

const ApprovalBadge = memo(function ApprovalBadge({ status }: { status: ApprovalStatus }) {
    const cfg = APPROVAL_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
            cfg.bg, cfg.color, cfg.border,
        )}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
            <Icon className="w-3 h-3 flex-shrink-0" />
            {cfg.label}
        </span>
    );
});

const StatCard = memo(function StatCard({
    label, value, icon: Icon, colorClass, subLabel, highlight, onClick,
}: {
    label: string;
    value: number | string;
    icon: React.FC<{ className?: string }>;
    colorClass: string;
    subLabel?: string;
    highlight?: boolean;
    onClick?: () => void;
}) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                'border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group',
                highlight && 'border-amber-300 bg-gradient-to-br from-amber-50 to-white',
                onClick && 'cursor-pointer',
            )}
        >
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn(
                    'p-3 rounded-2xl transition-transform group-hover:scale-105 duration-200 flex-shrink-0',
                    colorClass,
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 tracking-wide">{label}</p>
                    <p className={cn(
                        'text-2xl font-bold leading-tight mt-0.5',
                        highlight ? 'text-amber-700' : 'text-slate-900',
                    )}>
                        {value}
                    </p>
                    {subLabel && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{subLabel}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

const PropertyThumbnail = memo(function PropertyThumbnail({ property }: { property: Property }) {
    const mainImg = property.images?.find(i => i.isMain) ?? property.images?.[0];
    return mainImg?.url ? (
        <div className="w-14 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 ring-1 ring-slate-200/60">
            <img
                src={mainImg.url}
                alt={property.title}
                className="w-full h-full object-cover"
                loading="lazy"
            />
        </div>
    ) : (
        <div className="w-14 h-10 rounded-xl flex-shrink-0 bg-slate-100 ring-1 ring-slate-200/60 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-400" />
        </div>
    );
});

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

interface BulkBarProps {
    count: number;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
    onClear: () => void;
    processing: boolean;
}

const BulkActionBar = memo(function BulkActionBar({
    count, onApprove, onReject, onDelete, onClear, processing,
}: BulkBarProps) {
    return (
        <div className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
            'flex items-center gap-3 px-5 py-3 rounded-2xl',
            'bg-slate-900 text-white shadow-2xl border border-slate-700',
            'animate-in slide-in-from-bottom-4 fade-in duration-300',
        )}>
            {/* Selection pill */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {count}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                    {count === 1 ? 'property' : 'properties'} selected
                </span>
            </div>

            {/* Actions */}
            <button
                onClick={onApprove}
                disabled={processing}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold',
                    'bg-emerald-500 hover:bg-emerald-400 text-white transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
            >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Approve
            </button>

            <button
                onClick={onReject}
                disabled={processing}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold',
                    'bg-amber-500 hover:bg-amber-400 text-white transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
            >
                <ShieldX className="w-3.5 h-3.5" />
                Reject
            </button>

            <button
                onClick={onDelete}
                disabled={processing}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold',
                    'bg-red-600 hover:bg-red-500 text-white transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
            >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
            </button>

            <button
                onClick={onClear}
                className="ml-1 p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Clear selection"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
});

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectModalProps {
    ids: string[];
    title: string;
    onClose: () => void;
    onRejected: () => void;
}

function RejectModal({ ids, title, onClose, onRejected }: RejectModalProps) {
    const [reason, setReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [error, setError] = useState('');
    const isBulk = ids.length > 1;

    const handleReject = async () => {
        setRejecting(true);
        setError('');
        try {
            await Promise.all(
                ids.map(id => apiClient.rejectProperty(id, reason.trim() || undefined))
            );
            onRejected();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Failed to reject.');
            setRejecting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={cn(
                'relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden',
                'animate-in fade-in slide-in-from-bottom-4 duration-300',
            )}>
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -m-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-3">
                        {isBulk ? `Reject ${ids.length} listings` : 'Reject listing'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 truncate">
                        {isBulk ? `${ids.length} selected properties will be rejected.` : title}
                    </p>
                </div>

                <div className="px-6 pb-4 space-y-3">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
                            Reason <span className="text-slate-400 font-normal normal-case">(optional)</span>
                        </label>
                        <Textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Explain why this listing was rejected…"
                            className="bg-slate-50 border-slate-200 resize-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-11"
                        disabled={rejecting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReject}
                        className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white"
                        disabled={rejecting}
                    >
                        {rejecting
                            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Rejecting…</>
                            : <><XCircle className="w-4 h-4 mr-2" />Reject{isBulk ? ` ${ids.length}` : ''}</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
    ids, title, onClose, onDeleted,
}: {
    ids: string[]; title: string; onClose: () => void; onDeleted: () => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const isBulk = ids.length > 1;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await Promise.all(ids.map(id => apiClient.deleteProperty(id)));
            onDeleted();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Failed to delete.');
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className={cn(
                'relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden',
                'animate-in fade-in slide-in-from-bottom-4 duration-300',
            )}>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                        {isBulk ? `Delete ${ids.length} properties?` : 'Delete property?'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {isBulk
                            ? `${ids.length} properties will be permanently removed.`
                            : <><span className="font-semibold text-slate-700">{title}</span> will be permanently removed.</>
                        }
                        {' '}This cannot be undone.
                    </p>
                    {error && (
                        <p className="text-sm text-red-600 mt-3 p-2 bg-red-50 rounded-xl">{error}</p>
                    )}
                </div>
                <div className="flex gap-3 px-6 pb-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-11"
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white"
                        disabled={deleting}
                    >
                        {deleting
                            ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                            : <Trash2 className="w-4 h-4 mr-1.5" />
                        }
                        Delete{isBulk ? ` ${ids.length}` : ''}
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

const ActionMenu = memo(function ActionMenu({
    property, onApprove, onReject, onDelete, approving,
}: ActionMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative flex items-center gap-1.5" ref={ref}>
            {property.approvalStatus === 'pending' && (
                <>
                    <button
                        onClick={onApprove}
                        disabled={approving}
                        title="Approve"
                        className={cn(
                            'p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100',
                            'text-emerald-600 hover:text-emerald-700 transition-colors',
                            'border border-emerald-200 disabled:opacity-50 cursor-pointer',
                        )}
                    >
                        {approving
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <ThumbsUp className="w-4 h-4" />
                        }
                    </button>
                    <button
                        onClick={() => { setOpen(false); onReject(); }}
                        title="Reject"
                        className={cn(
                            'p-1.5 rounded-xl bg-red-50 hover:bg-red-100',
                            'text-red-500 hover:text-red-700 transition-colors',
                            'border border-red-200 cursor-pointer',
                        )}
                    >
                        <ThumbsDown className="w-4 h-4" />
                    </button>
                </>
            )}

            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    'p-1.5 rounded-xl border border-slate-200',
                    'hover:bg-slate-100 text-slate-400 hover:text-slate-600',
                    'transition-colors cursor-pointer',
                )}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && (
                <div className={cn(
                    'absolute right-0 top-full mt-1.5 w-44 bg-white',
                    'rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30',
                    'animate-in fade-in slide-in-from-top-2 duration-150',
                )}>
                    {property.approvalStatus !== 'approved' && (
                        <button
                            onClick={() => { setOpen(false); onApprove(); }}
                            disabled={approving}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50 rounded-xl mx-auto"
                        >
                            <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                    )}
                    {property.approvalStatus !== 'rejected' && (
                        <button
                            onClick={() => { setOpen(false); onReject(); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer rounded-xl"
                        >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                    )}
                    <div className="h-px bg-slate-100 my-1 mx-3" />
                    <button
                        onClick={() => { setOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer rounded-xl"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = memo(function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3.5 w-10">
                <div className="w-4 h-4 bg-slate-200 rounded" />
            </td>
            {[180, 100, 80, 80, 110, 70, 80].map((w, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-4 bg-slate-200 rounded-lg" style={{ width: w }} />
                </td>
            ))}
            <td className="px-4 py-3.5"><div className="h-4 w-20 bg-slate-200 rounded-lg" /></td>
        </tr>
    );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') router.push('/dashboard');
    }, [currentUser, router]);

    // ── Data state ──
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [properties, setProperties] = useState<Property[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [loadingProperties, setLoadingProperties] = useState(true);

    // ── Filter state ──
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [listingFilter, setListingFilter] = useState<string>('all');

    // ── Action state ──
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // ── Selection state ──
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // ── Modal state ──
    const [rejectIds, setRejectIds] = useState<string[] | null>(null);
    const [rejectTitle, setRejectTitle] = useState('');
    const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
    const [deleteTitle, setDeleteTitle] = useState('');

    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchProperties = useCallback(async (p = page) => {
        setLoadingProperties(true);
        try {
            const params: Record<string, unknown> = { page: p, limit };
            if (search.trim()) params.search = search.trim();
            if (statusFilter !== 'all') params.approvalStatus = statusFilter;
            if (typeFilter !== 'all') params.propertyType = typeFilter;
            if (listingFilter !== 'all') params.listingType = listingFilter;

            const data: PaginatedProperties = await apiClient.adminGetAllProperties(params);
            setProperties(data.properties ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(data.page ?? p);
            setSelectedIds(new Set()); // clear selection on new page
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProperties(false);
        }
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
        } catch (e) {
            console.error(e);
        }
    }, []);

    // Initial stats load
    useEffect(() => { fetchStats(); }, []);

    // Debounced filter/search effect
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchProperties(1);
        }, 380);
        return () => clearTimeout(searchTimer.current);
    }, [search, statusFilter, typeFilter, listingFilter, limit]);

    // Page navigation effect
    useEffect(() => { fetchProperties(page); }, [page]);

    // ── Selection helpers ──────────────────────────────────────────────────────

    const pageIds = useMemo(() => properties.map(p => p._id), [properties]);

    const allPageSelected = useMemo(
        () => pageIds.length > 0 && pageIds.every(id => selectedIds.has(id)),
        [pageIds, selectedIds],
    );

    const somePageSelected = useMemo(
        () => pageIds.some(id => selectedIds.has(id)) && !allPageSelected,
        [pageIds, selectedIds, allPageSelected],
    );

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageIds.forEach(id => next.delete(id));
            } else {
                pageIds.forEach(id => next.add(id));
            }
            return next;
        });
    }, [pageIds, allPageSelected]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    // ── Single actions ─────────────────────────────────────────────────────────

    const handleApprove = useCallback(async (property: Property) => {
        setApprovingId(property._id);
        try {
            await apiClient.approveProperty(property._id);
            await Promise.all([fetchProperties(page), fetchStats()]);
        } catch (e) {
            console.error(e);
        } finally {
            setApprovingId(null);
        }
    }, [fetchProperties, fetchStats, page]);

    // ── Bulk actions ───────────────────────────────────────────────────────────

    const handleBulkApprove = useCallback(async () => {
        setBulkProcessing(true);
        try {
            await Promise.all([...selectedIds].map(id => apiClient.approveProperty(id)));
            clearSelection();
            await Promise.all([fetchProperties(page), fetchStats()]);
        } catch (e) {
            console.error(e);
        } finally {
            setBulkProcessing(false);
        }
    }, [selectedIds, clearSelection, fetchProperties, fetchStats, page]);

    const openBulkReject = useCallback(() => {
        setRejectIds([...selectedIds]);
        setRejectTitle('');
    }, [selectedIds]);

    const openBulkDelete = useCallback(() => {
        setDeleteIds([...selectedIds]);
        setDeleteTitle('');
    }, [selectedIds]);

    // ── Pagination pages ───────────────────────────────────────────────────────

    const paginationPages = useMemo(() => {
        const count = Math.min(5, totalPages);
        return Array.from({ length: count }, (_, i) => {
            if (totalPages <= 5) return i + 1;
            if (page <= 3) return i + 1;
            if (page >= totalPages - 2) return totalPages - 4 + i;
            return page - 2 + i;
        });
    }, [page, totalPages]);

    // ──────────────────────────────────────────────────────────────────────────

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#F7F7F7] overflow-x-hidden">
                <AppSidebar />
                <SidebarInset className="bg-transparent flex flex-col min-w-0 overflow-x-hidden">
                    <NavDash />

                    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-w-0">

                        {/* ── Page header ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="p-2 rounded-xl bg-blue-600">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                                        Property Approvals
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                                        Admin
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm">
                                    Review, approve, reject, and manage all listings on HoroHouse.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { fetchProperties(page); fetchStats(); }}
                                className="gap-2 self-start sm:self-auto rounded-xl border-slate-200"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                        </div>

                        {/* ── Stats cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            <StatCard
                                label="Total Listings"
                                value={stats.total}
                                icon={Building2}
                                colorClass="bg-blue-600/10 text-blue-600"
                                onClick={() => setStatusFilter('all')}
                            />
                            <StatCard
                                label="Pending Review"
                                value={stats.pending}
                                icon={Clock}
                                colorClass="bg-amber-50 text-amber-600"
                                highlight={stats.pending > 0}
                                subLabel={stats.pending > 0 ? 'Needs attention' : undefined}
                                onClick={() => setStatusFilter('pending')}
                            />
                            <StatCard
                                label="Approved"
                                value={stats.approved}
                                icon={CheckCircle2}
                                colorClass="bg-emerald-50 text-emerald-600"
                                onClick={() => setStatusFilter('approved')}
                            />
                            <StatCard
                                label="Rejected"
                                value={stats.rejected}
                                icon={XCircle}
                                colorClass="bg-red-50 text-red-600"
                                onClick={() => setStatusFilter('rejected')}
                            />
                        </div>

                        {/* ── Filters ── */}
                        <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input
                                    placeholder="Search title, city, address…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-10 bg-white border-slate-200 rounded-xl h-10 focus-visible:ring-blue-500"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 rounded-xl h-10">
                                    <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 rounded-xl h-10">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Types</SelectItem>
                                    {['apartment', 'house', 'villa', 'studio', 'duplex', 'bungalow', 'penthouse', 'land', 'commercial', 'office', 'shop'].map(t => (
                                        <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={listingFilter} onValueChange={v => { setListingFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[135px] bg-white border-slate-200 rounded-xl h-10">
                                    <SelectValue placeholder="Sale / Rent" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Sale &amp; Rent</SelectItem>
                                    <SelectItem value="sale">For Sale</SelectItem>
                                    <SelectItem value="rent">For Rent</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[115px] bg-white border-slate-200 rounded-xl h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="15">15 / page</SelectItem>
                                    <SelectItem value="25">25 / page</SelectItem>
                                    <SelectItem value="50">50 / page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ── Inline bulk hint ── */}
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl">
                                <Zap className="w-4 h-4 flex-shrink-0" />
                                <span>
                                    <strong>{selectedIds.size}</strong> {selectedIds.size === 1 ? 'property' : 'properties'} selected
                                    — use the floating bar below to take action.
                                </span>
                                <button
                                    onClick={clearSelection}
                                    className="ml-auto text-blue-500 hover:text-blue-700 font-semibold text-xs"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {/* ── Table ── */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80">
                                            {/* Checkbox */}
                                            <th className="px-4 py-3.5 w-10">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                    title={allPageSelected ? 'Deselect all' : 'Select all on this page'}
                                                >
                                                    {somePageSelected
                                                        ? <MinusSquare className="w-4 h-4" />
                                                        : allPageSelected
                                                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                                            : <Square className="w-4 h-4" />
                                                    }
                                                </button>
                                            </th>
                                            {['Property', 'Location', 'Type', 'Price', 'Agent / Owner', 'Status', 'Listed', ''].map(h => (
                                                <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-50">
                                        {loadingProperties ? (
                                            [...Array(Math.min(limit, 8))].map((_, i) => <SkeletonRow key={i} />)
                                        ) : properties.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-20 text-center">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                        <Building2 className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                    <p className="text-slate-600 font-semibold">No properties found</p>
                                                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search.</p>
                                                </td>
                                            </tr>
                                        ) : properties.map(prop => {
                                            const owner = prop.agentId ?? prop.ownerId;
                                            const isApproving = approvingId === prop._id;
                                            const isSelected = selectedIds.has(prop._id);

                                            return (
                                                <tr
                                                    key={prop._id}
                                                    className={cn(
                                                        'transition-colors duration-100',
                                                        isSelected
                                                            ? 'bg-blue-50/70 hover:bg-blue-50'
                                                            : prop.approvalStatus === 'pending'
                                                                ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                                                : 'hover:bg-slate-50/80',
                                                    )}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="px-4 py-3.5">
                                                        <button
                                                            onClick={() => toggleSelect(prop._id)}
                                                            className={cn(
                                                                'transition-colors cursor-pointer',
                                                                isSelected ? 'text-blue-600' : 'text-slate-300 hover:text-blue-500',
                                                            )}
                                                        >
                                                            {isSelected
                                                                ? <CheckSquare className="w-4 h-4" />
                                                                : <Square className="w-4 h-4" />
                                                            }
                                                        </button>
                                                    </td>

                                                    {/* Property */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <PropertyThumbnail property={prop} />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 truncate max-w-[180px] text-[13px]">
                                                                    {prop.title}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {prop.isVerified && (
                                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-bold">
                                                                            <BadgeCheck className="w-3 h-3" /> Verified
                                                                        </span>
                                                                    )}
                                                                    {prop.isFeatured && (
                                                                        <span className="text-[10px] text-amber-600 font-bold">★ Featured</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1 text-slate-600 text-xs">
                                                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                            <span className="truncate max-w-[110px]">{prop.city}</span>
                                                        </div>
                                                        {prop.country && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5 pl-4">{prop.country}</p>
                                                        )}
                                                    </td>

                                                    {/* Type */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="capitalize text-slate-700 font-medium text-xs">
                                                                {prop.type}
                                                            </span>
                                                            <span className={cn(
                                                                'px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide',
                                                                prop.listingType === 'sale'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-violet-100 text-violet-700',
                                                            )}>
                                                                {prop.listingType}
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
                                                        <div className="flex items-center gap-0.5 text-slate-900 font-bold text-sm">
                                                            <DollarSign className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                            {formatPrice(prop.price)}
                                                            <span className="text-[10px] text-slate-400 font-normal ml-0.5">FCFA</span>
                                                        </div>
                                                        {prop.area && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{prop.area} m²</p>
                                                        )}
                                                    </td>

                                                    {/* Agent */}
                                                    <td className="px-4 py-3.5">
                                                        {owner ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                                                    {owner.profilePicture ? (
                                                                        <img
                                                                            src={owner.profilePicture}
                                                                            alt={owner.name}
                                                                            className="w-full h-full object-cover"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-gradient-to-br from-slate-100 to-slate-200">
                                                                            {owner.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[90px]">
                                                                        {owner.name}
                                                                    </p>
                                                                    {owner.agency && (
                                                                        <p className="text-[10px] text-slate-400 truncate">{owner.agency}</p>
                                                                    )}
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
                                                            <p
                                                                className="text-[10px] text-slate-400 mt-1 max-w-[120px] truncate"
                                                                title={prop.rejectionReason}
                                                            >
                                                                {prop.rejectionReason}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-4 py-3.5">
                                                        <p className="text-xs font-medium text-slate-600">
                                                            {timeAgo(prop.createdAt)}
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
                                                            onReject={() => {
                                                                setRejectIds([prop._id]);
                                                                setRejectTitle(prop.title);
                                                            }}
                                                            onDelete={() => {
                                                                setDeleteIds([prop._id]);
                                                                setDeleteTitle(prop.title);
                                                            }}
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
                                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/60">
                                    <p className="text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700">
                                            {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
                                        </span>
                                        {' '}of{' '}
                                        <span className="font-semibold text-slate-700">{total}</span> listings
                                    </p>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="h-8 w-8 p-0 rounded-xl border-slate-200"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>

                                        {paginationPages.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={cn(
                                                    'h-8 w-8 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                                                    p === page
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-200',
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            className="h-8 w-8 p-0 rounded-xl border-slate-200"
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

            {/* ── Floating bulk action bar ── */}
            {selectedIds.size > 0 && (
                <BulkActionBar
                    count={selectedIds.size}
                    onApprove={handleBulkApprove}
                    onReject={openBulkReject}
                    onDelete={openBulkDelete}
                    onClear={clearSelection}
                    processing={bulkProcessing}
                />
            )}

            {/* ── Modals ── */}
            {rejectIds && (
                <RejectModal
                    ids={rejectIds}
                    title={rejectTitle}
                    onClose={() => setRejectIds(null)}
                    onRejected={() => {
                        clearSelection();
                        fetchProperties(page);
                        fetchStats();
                    }}
                />
            )}

            {deleteIds && (
                <DeleteModal
                    ids={deleteIds}
                    title={deleteTitle}
                    onClose={() => setDeleteIds(null)}
                    onDeleted={() => {
                        clearSelection();
                        fetchStats();
                        fetchProperties(page);
                    }}
                />
            )}
        </SidebarProvider>
    );
}