"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TenantForm } from "@/components/dashboard/tenants/TenantForm";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    KeyRound,
    Plus,
    Search,
    Mail,
    Phone,
    Calendar,
    MoreVertical,
    Pencil,
    Trash2,
    Users,
    Wallet,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    Copy
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Tenant {
    _id: string;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    propertyId: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    depositAmount?: number;
    status: 'active' | 'ended' | 'pending';
    notes?: string;
}

const statusConfig: Record<string, { color: string, bg: string, border: string, icon: React.ReactNode, label: string }> = {
    active: {
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
        label: "Active Lease"
    },
    pending: {
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
        label: "Pending Start"
    },
    ended: {
        color: "text-slate-700",
        bg: "bg-slate-50",
        border: "border-slate-200",
        icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
        label: "Lease Ended"
    },
};

export default function TenantsPage() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [formData, setFormData] = useState({
        tenantName: "",
        tenantEmail: "",
        tenantPhone: "",
        propertyId: "",
        leaseStart: "",
        leaseEnd: "",
        monthlyRent: 0,
        depositAmount: 0,
        status: "active" as 'active' | 'ended' | 'pending',
        notes: "",
    });
    const [saving, setSaving] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            setPermissionError(null);
            const response = await apiClient.getMyTenants();
            setTenants(response?.tenants || response || []);
        } catch (error: any) {
            console.error("Error fetching tenants:", error);
            // Handle permission errors specifically
            if (error?.response?.status === 403) {
                setPermissionError("You don't have permission to access tenants. This feature requires LANDLORD or ADMIN role.");
                console.error("User doesn't have permission to access tenants. Requires LANDLORD or ADMIN role.");
            } else if (error?.response?.status === 400) {
                setPermissionError("Access denied. You need LANDLORD or ADMIN role to manage tenants.");
                console.error("Bad request - user may not have the required role");
            } else {
                setPermissionError("Unable to load tenants. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddTenant = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                monthlyRent: Number(formData.monthlyRent),
                depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
            };
            await apiClient.addTenant(payload);
            setShowAddModal(false);
            resetForm();
            await fetchTenants();
        } catch (error) {
            console.error("Error adding tenant:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTenant = async () => {
        if (!editingTenant) return;
        setSaving(true);
        try {
            await apiClient.updateTenant(editingTenant._id, formData);
            setEditingTenant(null);
            resetForm();
            await fetchTenants();
        } catch (error) {
            console.error("Error updating tenant:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTenant = async (tenantId: string) => {
        if (!confirm("Are you sure you want to remove this tenant record permanently?")) return;
        try {
            await apiClient.removeTenant(tenantId);
            await fetchTenants();
        } catch (error) {
            console.error("Error deleting tenant:", error);
        }
    };

    const openEditModal = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setFormData({
            tenantName: tenant.tenantName,
            tenantEmail: tenant.tenantEmail || "",
            tenantPhone: tenant.tenantPhone || "",
            propertyId: tenant.propertyId,
            leaseStart: tenant.leaseStart?.split("T")[0] || "",
            leaseEnd: tenant.leaseEnd?.split("T")[0] || "",
            monthlyRent: tenant.monthlyRent,
            depositAmount: tenant.depositAmount || 0,
            status: tenant.status,
            notes: tenant.notes || "",
        });
    };

    const resetForm = () => {
        setFormData({
            tenantName: "",
            tenantEmail: "",
            tenantPhone: "",
            propertyId: "",
            leaseStart: "",
            leaseEnd: "",
            monthlyRent: 0,
            depositAmount: 0,
            status: "active",
            notes: "",
        });
    };

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopySuccess(email);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const filteredTenants = useMemo(() => tenants.filter((t) => {
        const matchesSearch =
            t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tenantEmail?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [tenants, searchQuery, statusFilter]);

    // Calculate Summary Metrics
    const metrics = useMemo(() => {
        const active = tenants.filter(t => t.status === 'active');
        const pending = tenants.filter(t => t.status === 'pending');
        const totalRent = active.reduce((sum, t) => sum + (t.monthlyRent || 0), 0);

        return {
            total: tenants.length,
            activeCount: active.length,
            pendingCount: pending.length,
            monthlyRevenue: totalRent
        };
    }, [tenants]);

    const formatCurrency = (val: number) => {
        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`;
        if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K FCFA`;
        return `${val.toLocaleString()} FCFA`;
    };


    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#FAFAFA]">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />
                    <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
                                    Tenant Roster
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    Manage your lease agreements and tenant details.
                                </p>
                            </div>
                            <Button
                                onClick={() => { resetForm(); setShowAddModal(true); }}
                                disabled={!!permissionError}
                                className="bg-blue-600 hover:bg-blue-700 text-white -md -blue-500/20 rounded-xl px-5 h-11 gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="font-semibold">Add Tenant</span>
                            </Button>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 -sm hover:-md transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-600">Total Tenants</h3>
                                </div>
                                <div className="text-3xl font-black text-slate-900">{metrics.total}</div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-100 -sm hover:-md transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-600">Active Leases</h3>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-black text-slate-900">{metrics.activeCount}</div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        Current
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-100 -sm hover:-md transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-600">Pending Leases</h3>
                                </div>
                                <div className="text-3xl font-black text-slate-900">{metrics.pendingCount}</div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-100 -sm hover:-md transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-600">Monthly Run Rate</h3>
                                </div>
                                <div className="text-2xl font-black text-slate-900 truncate">
                                    {formatCurrency(metrics.monthlyRevenue)}
                                </div>
                            </div>
                        </div>

                        {/* Controls (Search & Filters) */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-2 rounded-2xl border border-slate-100 -sm">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="pl-11 h-11 bg-transparent border-0 focus-visible:ring-0 -none text-base"
                                />
                            </div>

                            <div className="flex items-center w-full sm:w-auto overflow-x-auto gap-1 p-1 bg-slate-50 rounded-xl hide-scrollbar">
                                {[
                                    { id: 'all', label: 'All Tenants' },
                                    { id: 'active', label: 'Active' },
                                    { id: 'pending', label: 'Pending' },
                                    { id: 'ended', label: 'Ended' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setStatusFilter(tab.id)}
                                        className={cn(
                                            "px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap",
                                            statusFilter === tab.id
                                                ? "bg-white text-slate-900 -sm"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tenant Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-[280px] bg-slate-100/50 animate-pulse rounded-2xl border border-slate-100" />
                                ))}
                            </div>
                        ) : permissionError ? (   // ← MOVED UP: check this before empty state
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed text-center px-4">
                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-5">
                                    <XCircle className="w-10 h-10 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                                <p className="text-slate-500 max-w-sm mb-6">{permissionError}</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="rounded-xl font-semibold">
                                        Back to Dashboard
                                    </Button>
                                    <Button onClick={() => fetchTenants()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-6">
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        ) : filteredTenants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed text-center px-4">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
                                    <KeyRound className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No tenants found</h3>
                                <p className="text-slate-500 max-w-sm mb-6">
                                    {searchQuery || statusFilter !== 'all'
                                        ? "We couldn't find any tenants matching your current filters. Try relaxing your search criteria."
                                        : "You don't have any tenants recorded yet. Add your first tenant to start managing leases."}
                                </p>
                                {!(searchQuery || statusFilter !== 'all') && (
                                    <Button
                                        onClick={() => { resetForm(); setShowAddModal(true); }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-12 gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="font-semibold">Add First Tenant</span>
                                    </Button>
                                )}
                            </div>
                        ) : permissionError ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed text-center px-4">
                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-5">
                                    <XCircle className="w-10 h-10 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                                <p className="text-slate-500 max-w-sm mb-6">
                                    {permissionError}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => window.location.href = '/dashboard'}
                                        variant="outline"
                                        className="rounded-xl font-semibold"
                                    >
                                        Back to Dashboard
                                    </Button>
                                    <Button
                                        onClick={() => fetchTenants()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-6"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredTenants.map((tenant) => {
                                    const status = statusConfig[tenant.status] || statusConfig.active;

                                    // Calculate days until lease end for active leases
                                    let daysRemaining = null;
                                    if (tenant.status === 'active' && tenant.leaseEnd) {
                                        const end = new Date(tenant.leaseEnd);
                                        const today = new Date();
                                        daysRemaining = differenceInDays(end, today);
                                    }

                                    return (
                                        <div
                                            key={tenant._id}
                                            className="bg-white border border-slate-200 rounded-2xl p-6 hover:-xl hover:-slate-200/40 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                                        >
                                            {/* Card Header: Avatar & Status */}
                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-teal-50 flex items-center justify-center border border-blue-100 text-blue-700 font-bold text-lg -sm">
                                                        {tenant.tenantName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-base">{tenant.tenantName}</h3>
                                                        <Badge variant="outline" className={cn("mt-1 text-[10px] px-2 py-0.5 border flex w-fit font-semibold", status.bg, status.color, status.border)}>
                                                            {status.icon}
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg -mr-2">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl -lg border-slate-100">
                                                        <DropdownMenuItem onClick={() => openEditModal(tenant)} className="gap-2 cursor-pointer font-medium p-2.5 hover:bg-slate-50">
                                                            <Pencil className="w-4 h-4 text-blue-500" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteTenant(tenant._id)} className="gap-2 cursor-pointer font-medium text-rose-600 focus:text-rose-700 p-2.5 hover:bg-rose-50">
                                                            <Trash2 className="w-4 h-4" />
                                                            Remove Tenant
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Card Body: Contact & Property */}
                                            <div className="space-y-3 flex-1">
                                                <div className="flex flex-col gap-2">
                                                    {tenant.tenantEmail && (
                                                        <div className="flex items-center gap-2.5 text-sm group/contact">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                            </div>
                                                            <span className="text-slate-600 truncate">{tenant.tenantEmail}</span>
                                                            <button
                                                                onClick={() => handleCopyEmail(tenant.tenantEmail!)}
                                                                className="ml-auto opacity-0 group-hover/contact:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                                                                title="Copy email"
                                                            >
                                                                {copySuccess === tenant.tenantEmail ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {tenant.tenantPhone && (
                                                        <div className="flex items-center gap-2.5 text-sm">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                            </div>
                                                            <span className="text-slate-600">{tenant.tenantPhone}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2.5 text-sm">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                        <span className="text-slate-600 truncate font-mono text-xs">ID: {tenant.propertyId.slice(-8).toUpperCase()}</span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-4">
                                                    <div className="flex items-center justify-between gap-2 text-sm mb-1">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="font-semibold text-xs uppercase tracking-wider">Lease Term</span>
                                                        </div>
                                                        {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 60 && (
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded text-right">
                                                                Exp. in {daysRemaining} days
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-700 font-medium text-sm pl-5">
                                                        {tenant.leaseStart ? format(new Date(tenant.leaseStart), 'MMM d, yyyy') : '—'}
                                                        <span className="text-slate-300 mx-2">→</span>
                                                        {tenant.leaseEnd ? format(new Date(tenant.leaseEnd), 'MMM d, yyyy') : '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Card Footer: Financials */}
                                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Monthly Rent</p>
                                                    <p className="font-black text-slate-900">{tenant.monthlyRent.toLocaleString()} <span className="text-xs text-slate-500 font-semibold">XAF</span></p>
                                                </div>
                                                {tenant.depositAmount! > 0 && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Deposit Held</p>
                                                        <p className="font-bold text-slate-600">{tenant.depositAmount?.toLocaleString()} <span className="text-[10px]">XAF</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </SidebarInset>
            </div>

            {/* Modals with Apple-like / Premium aesthetic */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-0 -2xl rounded-2xl">
                    <DialogHeader className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-900">New Tenant Record</DialogTitle>
                        <DialogDescription className="mt-1 text-slate-500">
                            Add a new lease agreement to your portfolio.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <TenantForm formData={formData} setFormData={setFormData} saving={saving} />
                    </div>
                    <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={saving} className="rounded-xl font-semibold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddTenant}
                            disabled={saving || !formData.tenantName || !formData.propertyId || !formData.leaseStart || !formData.leaseEnd || !formData.monthlyRent}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-6 -sm -blue-500/20"
                        >
                            {saving ? "Processing..." : "Create Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-0 -2xl rounded-2xl">
                    <DialogHeader className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-900">Edit Tenant Details</DialogTitle>
                        <DialogDescription className="mt-1 text-slate-500">
                            Update lease metrics and contact info.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <TenantForm formData={formData} setFormData={setFormData} saving={saving} />
                    </div>
                    <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setEditingTenant(null)} disabled={saving} className="rounded-xl font-semibold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateTenant}
                            disabled={saving || !formData.tenantName || !formData.propertyId || !formData.leaseStart || !formData.leaseEnd}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-6 -sm -blue-500/20"
                        >
                            {saving ? "Saving Changes..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
