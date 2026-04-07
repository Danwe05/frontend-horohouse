'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Clock, CheckCircle2, XCircle, Eye,
    Building2, MapPin, User, Calendar, AlertTriangle,
    Mail, Phone, ExternalLink, Shield, Loader2,
    Trash2, MessageSquareWarning, X, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
type WarningSeverity = 'warning' | 'final_warning';

interface Reporter {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    profilePicture?: string;
}

interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number];
}

interface ReportedProperty {
    _id: string;
    title: string;
    description: string;
    address?: string;
    city?: string;
    location?: GeoJSONPoint;
    currentPrice: number;
    status: string;
    images: { url: string; isMain?: boolean }[];
    host?: { _id: string; firstName: string; lastName: string; email: string };
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
    updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReportStatus, {
    label: string; color: string; bg: string; icon: React.ElementType; border: string; dot: string;
}> = {
    pending: { label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, border: 'border-amber-200', dot: 'bg-amber-400' },
    reviewed: { label: 'In Review', color: 'text-sky-600', bg: 'bg-sky-50', icon: Eye, border: 'border-sky-200', dot: 'bg-sky-400' },
    resolved: { label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, border: 'border-emerald-200', dot: 'bg-emerald-400' },
    dismissed: { label: 'Dismissed', color: 'text-zinc-500', bg: 'bg-zinc-100', icon: XCircle, border: 'border-zinc-200', dot: 'bg-zinc-400' },
};

const WARNING_TEMPLATES: { label: string; message: string }[] = [
    {
        label: 'Fraudulent listing',
        message: 'Your listing has been reported as potentially fraudulent. We have received a report indicating that the information provided may be misleading or inaccurate. Please review your listing details and ensure all information is truthful and up to date. Failure to address this may result in the removal of your listing.',
    },
    {
        label: 'Misleading photos',
        message: 'Your listing has been reported for containing photos that do not accurately represent the property. Please update your images to ensure they reflect the current condition and true appearance of the property. Accurate photos are required by our community guidelines.',
    },
    {
        label: 'Inappropriate content',
        message: 'Your listing has been flagged for containing content that violates our community guidelines. Please review and remove any inappropriate language, images, or information from your listing immediately.',
    },
    {
        label: 'Price discrepancy',
        message: 'Your listing has been reported for showing a price that differs significantly from what is actually charged. Please ensure your listing accurately reflects the true cost, including all fees, to maintain trust with potential guests.',
    },
    {
        label: 'Off-platform payments',
        message: 'We have received a report indicating that you may have requested or facilitated payments outside of the HoroHouse platform. This is a violation of our Terms of Service. All transactions must be processed through our platform. Please cease this activity immediately.',
    },
];

function resolveAddress(property: ReportedProperty): string {
    if (property.address) return property.address;
    if (property.city) return property.city;
    if (property.location?.coordinates) {
        const [lng, lat] = property.location.coordinates;
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return 'Location not available';
}

function openInNewTab(url: string) {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeletePropertyDialog({
    propertyTitle,
    onConfirm,
    onCancel,
    loading,
}: {
    propertyTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-blue-700/50 backdrop-blur-md"
                onClick={onCancel}
            />
            <div className="relative bg-white rounded-3xl -2xl w-full max-w-md overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1 w-full bg-red-500" />

                <div className="p-7">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-red-50 rounded-2xl border border-red-100 flex-shrink-0">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">Delete Property</h2>
                            <p className="text-sm text-zinc-400 mt-0.5 font-medium">This action is permanent and irreversible.</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-red-50 border border-red-100/80 rounded-2xl p-4 mb-6">
                        <p className="text-sm text-zinc-700 leading-relaxed">
                            You are about to permanently delete{' '}
                            <span className="font-semibold text-zinc-900">"{propertyTitle}"</span>. The following will occur:
                        </p>
                        <ul className="mt-3 space-y-2">
                            {[
                                'Listing removed from platform immediately',
                                'Property owner notified by email & in-app',
                                'All open reports for this property resolved',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-2.5 text-sm text-red-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-2.5">
                        <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold -sm transition-all"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete Property
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Warn Owner Dialog ────────────────────────────────────────────────────────

function WarnOwnerDialog({
    ownerName,
    propertyTitle,
    onConfirm,
    onCancel,
    loading,
}: {
    ownerName: string;
    propertyTitle: string;
    onConfirm: (message: string, severity: WarningSeverity) => void;
    onCancel: () => void;
    loading: boolean;
}) {
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<WarningSeverity>('warning');
    const [showTemplates, setShowTemplates] = useState(false);

    const handleSubmit = () => {
        if (!message.trim()) {
            toast.error('Please enter a warning message.');
            return;
        }
        onConfirm(message.trim(), severity);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-blue-700/50 backdrop-blur-md" onClick={onCancel} />
            <div
                className="relative bg-white rounded-3xl -2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Top accent */}
                <div className={cn('h-1 w-full flex-shrink-0', severity === 'final_warning' ? 'bg-red-500' : 'bg-amber-400')} />

                <div className="p-7 overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                        <div className={cn('p-3 rounded-2xl border flex-shrink-0', severity === 'final_warning' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100')}>
                            <MessageSquareWarning className={cn('w-5 h-5', severity === 'final_warning' ? 'text-red-600' : 'text-amber-600')} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">Warn Property Owner</h2>
                            <p className="text-sm text-zinc-400 mt-0.5 font-medium truncate">
                                {ownerName} · <span className="text-zinc-500">"{propertyTitle}"</span>
                            </p>
                        </div>
                        <button onClick={onCancel} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Severity toggle */}
                    <div className="mb-5">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Severity</label>
                        <div className="flex rounded-xl border border-zinc-200 overflow-hidden p-1 gap-1 bg-zinc-50">
                            {(['warning', 'final_warning'] as WarningSeverity[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSeverity(s)}
                                    className={cn(
                                        'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                                        severity === s
                                            ? s === 'final_warning'
                                                ? 'bg-red-600 text-white -sm'
                                                : 'bg-amber-400 text-white -sm'
                                            : 'text-zinc-500 hover:text-zinc-800 hover:bg-white'
                                    )}
                                >
                                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
                                        severity === s ? 'bg-white/70' : s === 'final_warning' ? 'bg-red-400' : 'bg-amber-400'
                                    )} />
                                    {s === 'warning' ? 'Warning' : 'Final Warning'}
                                </button>
                            ))}
                        </div>
                        {severity === 'final_warning' && (
                            <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Next violation will result in listing removal.
                            </p>
                        )}
                    </div>

                    {/* Templates */}
                    <div className="mb-5">
                        <button
                            onClick={() => setShowTemplates((v) => !v)}
                            className="flex items-center gap-1.5 text-[13px] font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                        >
                            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', showTemplates && 'rotate-180')} />
                            Use a message template
                        </button>
                        {showTemplates && (
                            <div className="mt-2.5 border border-zinc-200 rounded-2xl overflow-hidden">
                                {WARNING_TEMPLATES.map((t, i) => (
                                    <button
                                        key={t.label}
                                        onClick={() => { setMessage(t.message); setShowTemplates(false); }}
                                        className={cn(
                                            'w-full text-left px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-between group',
                                            i > 0 && 'border-t border-zinc-100'
                                        )}
                                    >
                                        <span className="font-medium">{t.label}</span>
                                        <span className="text-xs text-zinc-300 group-hover:text-zinc-500 transition-colors font-medium">Use →</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div className="mb-5">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                            Warning Message <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="Describe the issue and the action the owner must take…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[130px] resize-y text-sm rounded-xl border-zinc-200 focus:border-zinc-400 focus:ring-0 leading-relaxed"
                            maxLength={2000}
                        />
                        <p className="text-[11px] text-zinc-300 mt-1.5 text-right font-medium">
                            {message.length} <span className="text-zinc-200">/</span> 2000
                        </p>
                    </div>

                    {/* Info */}
                    <div className="mb-6 flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-xl p-3.5">
                        <Mail className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-sky-700 leading-relaxed">
                            Delivered via <strong>email</strong> and <strong>in-app notification</strong>. Report status will update to "In Review".
                        </p>
                    </div>

                    <div className="flex gap-2.5">
                        <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={cn(
                                'flex-1 h-11 rounded-xl text-white font-semibold transition-all -sm',
                                severity === 'final_warning' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600',
                            )}
                            onClick={handleSubmit}
                            disabled={loading || !message.trim()}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquareWarning className="w-4 h-4 mr-2" />}
                            Send Warning
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
    <SidebarProvider>
        <div className="flex min-h-screen w-full bg-zinc-50">
            <AppSidebar />
            <SidebarInset>
                <NavDash />
                <div className="p-8 flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-3 text-zinc-300">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <p className="text-sm font-medium text-zinc-400">Loading report…</p>
                    </div>
                </div>
            </SidebarInset>
        </div>
    </SidebarProvider>
);

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{children}</p>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user: currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') router.push('/dashboard');
    }, [currentUser, router]);

    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showWarnDialog, setShowWarnDialog] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await apiClient.getAdminReportById(id);
            setReport(data);
            setNotes(data.adminNotes ?? '');
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to load report');
            router.push('/dashboard/admin/reports');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleUpdateStatus = async (status: ReportStatus) => {
        if (!id || !report) return;
        setUpdating(true);
        try {
            await apiClient.updateReportStatus(id, { status, adminNotes: notes });
            toast.success(`Status updated to "${STATUS_CONFIG[status].label}"`);
            await fetchReport();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to update report');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!id || !report) return;
        setUpdating(true);
        try {
            await apiClient.updateReportStatus(id, { status: report.status, adminNotes: notes });
            toast.success('Notes saved');
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to save notes');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteProperty = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            const result = await apiClient.deleteReportedProperty(id);
            toast.success(result.message ?? 'Property deleted successfully');
            setShowDeleteDialog(false);
            await fetchReport();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to delete property');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWarnOwner = async (message: string, severity: WarningSeverity) => {
        if (!id) return;
        setActionLoading(true);
        try {
            const result = await apiClient.warnPropertyOwner(id, { message, severity });
            toast.success(result.message ?? 'Warning sent successfully');
            setShowWarnDialog(false);
            await fetchReport();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to send warning');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingSkeleton />;
    if (!report) return null;

    const StatusCfg = STATUS_CONFIG[report.status];
    const StatusIcon = StatusCfg.icon;
    const propertyAddress = report.property ? resolveAddress(report.property) : null;
    const mainImage = report.property?.images?.find((img) => img.isMain)?.url
        ?? report.property?.images?.[0]?.url;
    const propertyDeleted = !report.property?._id;
    const ownerName = report.property?.host
        ? `${report.property.host.firstName} ${report.property.host.lastName}`
        : 'Property Owner';

    return (
        <SidebarProvider>
            {showDeleteDialog && report.property && (
                <DeletePropertyDialog
                    propertyTitle={report.property.title}
                    onConfirm={handleDeleteProperty}
                    onCancel={() => setShowDeleteDialog(false)}
                    loading={actionLoading}
                />
            )}
            {showWarnDialog && report.property && (
                <WarnOwnerDialog
                    ownerName={ownerName}
                    propertyTitle={report.property.title}
                    onConfirm={handleWarnOwner}
                    onCancel={() => setShowWarnDialog(false)}
                    loading={actionLoading}
                />
            )}

            <div className="flex min-h-screen w-full bg-zinc-50/80">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="p-5 md:p-7 lg:p-8 max-w-7xl mx-auto">

                        {/* ── Header ── */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/dashboard/admin/reports')}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors mb-5 group"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                                Back to Reports
                            </button>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
                                                Report Details
                                            </h1>
                                            {/* Status pill */}
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border',
                                                StatusCfg.bg, StatusCfg.color, StatusCfg.border,
                                            )}>
                                                <span className={cn('w-1.5 h-1.5 rounded-full', StatusCfg.dot)} />
                                                {StatusCfg.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 font-medium flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Action toolbar */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={report.status}
                                        onValueChange={(val) => handleUpdateStatus(val as ReportStatus)}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="w-[175px] h-9 bg-white border-zinc-200 -sm rounded-xl text-sm font-semibold">
                                            <SelectValue placeholder="Update Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="pending">Mark as Pending</SelectItem>
                                            <SelectItem value="reviewed">Mark as Reviewed</SelectItem>
                                            <SelectItem value="resolved">Mark as Resolved</SelectItem>
                                            <SelectItem value="dismissed">Dismiss Report</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={updating}
                                        className="h-9 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all -sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Save Notes
                                    </button>

                                    {!propertyDeleted && (
                                        <button
                                            onClick={() => setShowWarnDialog(true)}
                                            className="h-9 px-4 rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all -sm flex items-center gap-2"
                                        >
                                            <MessageSquareWarning className="w-3.5 h-3.5" />
                                            Warn Owner
                                        </button>
                                    )}

                                    {!propertyDeleted && (
                                        <button
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all -sm flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    )}

                                    {report.property && !propertyDeleted && (
                                        <button
                                            onClick={() => openInNewTab(`/properties/${report.property._id}`)}
                                            className="h-9 px-4 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-all -sm flex items-center gap-2"
                                        >
                                            View Listing <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Deleted banner ── */}
                        {propertyDeleted && (
                            <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-zinc-500 mb-6 -sm">
                                <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                The property associated with this report has been permanently deleted.
                            </div>
                        )}

                        {/* ── Main grid ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                            {/* ── Left column ── */}
                            <div className="lg:col-span-2 space-y-5">

                                {/* Report reason card */}
                                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden -sm">
                                    <div className="flex items-stretch">
                                        {/* Left accent strip */}
                                        <div className="w-1 bg-red-500 flex-shrink-0" />
                                        <div className="flex-1 p-6">
                                            <SectionLabel>Report Reason</SectionLabel>
                                            <div className="flex items-start gap-3 mb-5">
                                                <div className="p-2 bg-red-50 border border-red-100 rounded-xl flex-shrink-0">
                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-zinc-900 leading-tight pt-1">
                                                    {report.reason}
                                                </h3>
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Reporter's Statement</p>
                                                {report.details ? (
                                                    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap relative">
                                                        <span className="text-3xl text-zinc-200 leading-none absolute top-3 left-4 select-none">"</span>
                                                        <span className="pl-5 block">{report.details}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-zinc-400 italic py-2">No additional details provided.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin notes */}
                                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden -sm">
                                    <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                                <Shield className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-zinc-900">Investigation Notes</h3>
                                                <p className="text-xs text-zinc-400 font-medium">Internal only — not visible to users</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <Textarea
                                            placeholder="Document your findings, actions taken, or reasons for dismissal…"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="min-h-[140px] resize-y text-sm rounded-xl border-zinc-200 focus:border-zinc-400 focus:ring-0 leading-relaxed text-zinc-700 placeholder:text-zinc-300"
                                        />
                                    </div>
                                </div>

                                {/* Actions reference */}
                                <div className="bg-white rounded-2xl border border-zinc-200 -sm overflow-hidden">
                                    <div className="px-6 py-5 border-b border-zinc-100">
                                        <SectionLabel>Available Actions</SectionLabel>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 hover:bg-zinc-50 transition-colors">
                                            <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl flex-shrink-0">
                                                <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-zinc-800">Warn Owner</p>
                                                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                                    Send a formal warning via email & in-app notification without removing the listing.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 hover:bg-zinc-50 transition-colors">
                                            <div className="p-2 bg-red-50 border border-red-100 rounded-xl flex-shrink-0">
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-zinc-800">Delete Property</p>
                                                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                                    Permanently remove the listing. Owner notified and related reports resolved.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right column ── */}
                            <div className="space-y-5">

                                {/* Reporter card */}
                                <div className="bg-white rounded-2xl border border-zinc-200 -sm overflow-hidden">
                                    <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
                                        <SectionLabel>Reported By</SectionLabel>
                                    </div>
                                    <div className="p-5">
                                        {report.reporter ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-2xl bg-zinc-100 overflow-hidden flex-shrink-0 ring-2 ring-zinc-100">
                                                        {report.reporter.profilePicture ? (
                                                            <img src={report.reporter.profilePicture} alt={report.reporter.firstName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-base font-bold text-zinc-400">
                                                                {report.reporter.firstName?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-zinc-900 text-[15px] truncate">
                                                            {report.reporter.firstName} {report.reporter.lastName}
                                                        </p>
                                                        <span className="inline-flex items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wide bg-zinc-100 px-2 py-0.5 rounded-full mt-0.5">
                                                            User
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2.5 text-zinc-600">
                                                        <Mail className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                                        {report.reporter.email ? (
                                                            <a href={`mailto:${report.reporter.email}`} className="hover:text-zinc-900 hover:underline truncate text-[13px] font-medium">
                                                                {report.reporter.email}
                                                            </a>
                                                        ) : (
                                                            <span className="text-zinc-300 text-[13px]">Not provided</span>
                                                        )}
                                                    </div>
                                                    {report.reporter.phoneNumber && (
                                                        <div className="flex items-center gap-2.5 text-zinc-600">
                                                            <Phone className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                                            <a href={`tel:${report.reporter.phoneNumber}`} className="hover:text-zinc-900 hover:underline text-[13px] font-medium">
                                                                {report.reporter.phoneNumber}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => router.push(`/dashboard/admin/users/${report.reporter._id}`)}
                                                    className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <User className="w-3.5 h-3.5" /> View Profile
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-zinc-400 py-4 text-center">User deleted or anonymous</p>
                                        )}
                                    </div>
                                </div>

                                {/* Property card */}
                                <div className="bg-white rounded-2xl border border-zinc-200 -sm overflow-hidden">
                                    <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
                                        <SectionLabel>Reported Property</SectionLabel>
                                    </div>

                                    {/* Property image */}
                                    <div className="relative h-44 bg-zinc-100">
                                        {mainImage ? (
                                            <img src={mainImage} alt={report.property?.title ?? 'Property'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                <Building2 className="w-10 h-10" />
                                            </div>
                                        )}
                                        {/* Status badge */}
                                        {report.property?.status && !propertyDeleted && (
                                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-700/60 backdrop-blur-sm text-white text-[11px] font-bold rounded-full capitalize">
                                                {report.property.status}
                                            </span>
                                        )}
                                        {propertyDeleted && (
                                            <div className="absolute inset-0 bg-zinc-900/60 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold bg-red-600/90 px-3 py-1.5 rounded-full tracking-wide uppercase">
                                                    Deleted
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        {report.property && !propertyDeleted ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="font-bold text-zinc-900 text-[15px] leading-snug line-clamp-2 mb-1.5">
                                                        {report.property.title}
                                                    </h3>
                                                    <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{propertyAddress}</span>
                                                    </p>
                                                </div>

                                                {report.property.host && (
                                                    <>
                                                        <div className="h-px bg-zinc-100" />
                                                        <div>
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Listed By</p>
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                                    <User className="w-4 h-4 text-zinc-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-bold text-zinc-900 truncate">
                                                                        {report.property.host.firstName} {report.property.host.lastName}
                                                                    </p>
                                                                    <p className="text-[11px] text-zinc-400 truncate">
                                                                        {report.property.host.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Quick actions */}
                                                <div className="space-y-2 pt-1">
                                                    <button
                                                        onClick={() => openInNewTab(`/property/${report.property._id}`)}
                                                        className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" /> Go to Listing
                                                    </button>
                                                    <button
                                                        onClick={() => setShowWarnDialog(true)}
                                                        className="w-full h-9 rounded-xl border border-amber-200 bg-amber-50 text-[13px] font-semibold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <MessageSquareWarning className="w-3.5 h-3.5" /> Warn Owner
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteDialog(true)}
                                                        className="w-full h-9 rounded-xl border border-red-200 bg-red-50 text-[13px] font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete Property
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-zinc-400 text-center py-4">Property has been deleted.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}