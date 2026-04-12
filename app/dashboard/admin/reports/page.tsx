'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Clock, CheckCircle2, XCircle, Search, Filter,
    ChevronLeft, ChevronRight, MoreVertical, Trash2,
    X, AlertTriangle, Loader2, RefreshCw, Eye,
    Building2, MapPin, User, FileText, Check, LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

interface Reporter {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profilePicture?: string;
}

interface ReportedProperty {
    _id: string;
    title: string;
    location: string;
    currentPrice: number;
    images: { url: string; isMain?: boolean }[];
}

interface Report {
    _id: string;
    reporter: Reporter;
    property: ReportedProperty;
    reason: string;
    details?: string;
    status: ReportStatus;
    adminNotes?: string;
    createdAt: string;
}

interface PaginatedReports {
    data: Report[];
    total: number;
    page: number;
    limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: LucideIcon; dot: string }> = {
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock, dot: 'bg-amber-400' },
    reviewed: { label: 'Reviewed', color: 'text-blue-700', bg: 'bg-blue-50', icon: Eye, dot: 'bg-blue-500' },
    resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2, dot: 'bg-emerald-500' },
    dismissed: { label: 'Dismissed', color: 'text-slate-700', bg: 'bg-slate-100', icon: XCircle, dot: 'bg-slate-400' },
};

function StatusBadge({ status }: { status: ReportStatus }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function StatCard({ label, value, icon: Icon, color, subLabel, highlight }: any) {
    return (
        <Card className={cn(
            'border-none -sm ring-1 ring-slate-200/60 hover:-md transition-all duration-300 group',
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

function PropertyThumbnail({ property }: { property: ReportedProperty }) {
    if (!property) return <div className="w-14 h-10 rounded-lg flex-shrink-0 bg-slate-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-400" /></div>;
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

function formatLocation(loc: any) {
    if (!loc) return 'N/A';
    if (typeof loc === 'string') return loc;
    // Handle GeoJSON-like objects: { type, coordinates }
    if (loc.type && Array.isArray(loc.coordinates)) {
        try {
            if (loc.type === 'Point') {
                const [lng, lat] = loc.coordinates;
                return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            // For other geometry types, return the type name
            return loc.type;
        } catch (e) {
            return 'N/A';
        }
    }
    try { return String(loc); } catch { return 'N/A'; }
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

interface ActionMenuProps {
    report: Report;
    onUpdateStatus: (status: ReportStatus) => void;
    onViewDetail: () => void;
    updating: boolean;
}

function ActionMenu({ report, onUpdateStatus, onViewDetail, updating }: ActionMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative flex items-center gap-1.5" ref={ref}>
            <button
                onClick={onViewDetail}
                title="View Details"
                className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium px-2.5"
            >
                <Eye className="w-3.5 h-3.5" /> View
            </button>

            {report.status === 'pending' && (
                <button
                    onClick={() => onUpdateStatus('resolved')}
                    disabled={updating}
                    title="Mark Resolved"
                    className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
            )}

            <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-1 top-full w-48 bg-white rounded-xl -xl border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Change Status</div>
                    {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
                        report.status !== status && (
                            <button
                                key={status}
                                onClick={() => { setOpen(false); onUpdateStatus(status as ReportStatus); }}
                                disabled={updating}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer capitalize"
                            >
                                <Check className={cn("w-3.5 h-3.5", report.status === status ? "opacity-100" : "opacity-0")} />
                                Mark as {status}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') router.push('/dashboard');
    }, [currentUser, router]);

    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, dismissed: 0 });
    const [reports, setReports] = useState<Report[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchReports = useCallback(async (p = page) => {
        setLoading(true);
        try {
            const params: any = { page: p, limit };
            if (statusFilter !== 'all') params.status = statusFilter;

            const data: PaginatedReports = await apiClient.getAdminReports(params);
            setReports(data.data ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
            setPage(data.page ?? p);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, limit, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const result = await apiClient.getAdminReportStats();
            setStats(result);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchReports(page); }, [page, limit, statusFilter]);

    const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
        setUpdatingId(reportId);
        try {
            await apiClient.updateReportStatus(reportId, { status });
            toast.success(`Report marked as ${status}`);
            await Promise.all([fetchReports(page), fetchStats()]);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to update report');
        } finally {
            setUpdatingId(null);
        }
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            {[...Array(6)].map((_, i) => (
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
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Reported Properties</h1>
                                    <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100 text-xs">Admin</Badge>
                                </div>
                                <p className="text-slate-500 text-sm">Review, investigate, and resolve issues reported by users about properties.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { fetchReports(page); fetchStats(); }}
                                className="gap-2 self-start sm:self-auto"
                            >
                                <RefreshCw className="w-4 h-4" /> Refresh
                            </Button>
                        </div>

                        {/* ── Stats ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Reports" value={stats.total} icon={FileText} color="bg-blue-50 text-blue-600" />
                            <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="bg-amber-50 text-amber-600" highlight={stats.pending > 0} subLabel={stats.pending > 0 ? 'Needs attention' : 'All clear'} />
                            <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                            <StatCard label="Dismissed" value={stats.dismissed} icon={XCircle} color="bg-slate-100 text-slate-600" />
                        </div>

                        {/* ── Filters ── */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[170px] bg-white border-slate-200 -sm">
                                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="ml-auto">
                                <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                                    <SelectTrigger className="w-full sm:w-[120px] bg-white border-slate-200 -sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 / page</SelectItem>
                                        <SelectItem value="25">25 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ── Table ── */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 -sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/70">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported By</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            [...Array(Math.min(limit, 8))].map((_, i) => <SkeletonRow key={i} />)
                                        ) : reports.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center">
                                                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-500 font-semibold">No reports found</p>
                                                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters.</p>
                                                </td>
                                            </tr>
                                        ) : reports.map(report => {
                                            const isUpdating = updatingId === report._id;
                                            return (
                                                <tr
                                                    key={report._id}
                                                    className={cn(
                                                        'hover:bg-slate-50/70 transition-colors duration-150',
                                                        report.status === 'pending' && 'bg-amber-50/30 hover:bg-amber-50/60',
                                                    )}
                                                >
                                                    {/* Property */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <PropertyThumbnail property={report.property} />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                                    {report.property?.title || 'Unknown Property'}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 text-slate-600 text-[10px] mt-0.5">
                                                                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                                    <span className="truncate max-w-[120px]">{formatLocation(report.property?.location)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Reporter */}
                                                    <td className="px-4 py-3.5">
                                                        {report.reporter ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                                                    {report.reporter.profilePicture ? (
                                                                        <img src={report.reporter.profilePicture} alt={report.reporter.firstName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                            {report.reporter.firstName?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-slate-800 truncate max-w-[120px]">{`${report.reporter.firstName} ${report.reporter.lastName}`}</p>
                                                                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{report.reporter.email}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Unknown User</span>
                                                        )}
                                                    </td>

                                                    {/* Reason */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-medium text-slate-700 text-xs border border-slate-200 bg-slate-50 px-2 py-0.5 rounded">
                                                            {report.reason}
                                                        </span>
                                                        {report.details && (
                                                            <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={report.details}>
                                                                {report.details}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3.5">
                                                        <StatusBadge status={report.status} />
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-4 py-3.5">
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(report.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5">
                                                        <ActionMenu
                                                            report={report}
                                                            onUpdateStatus={(status) => handleUpdateStatus(report._id, status)}
                                                            onViewDetail={() => router.push(`/dashboard/admin/reports/${report._id}`)}
                                                            updating={isUpdating}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Pagination ── */}
                            {!loading && reports.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-semibold text-slate-700">{total}</span> reports
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
                                        <p className="text-xs font-medium text-slate-600 px-2">Page {page} of {totalPages}</p>
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
        </SidebarProvider>
    );
}
