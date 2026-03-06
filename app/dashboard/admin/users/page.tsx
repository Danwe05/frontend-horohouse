'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, BadgeCheck, UserX, Search, Filter,
    ChevronLeft, ChevronRight, MoreVertical, Pencil, Trash2,
    X, Check, AlertTriangle, Phone, Mail, Calendar, Loader2,
    RefreshCw, UserCheck, UserCog, Ban, CheckCircle2, Circle,
    Building2, ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'agent' | 'registered_user' | 'guest';

interface User {
    id: string;
    name: string;
    email?: string;
    phoneNumber: string;
    role: UserRole;
    profilePicture?: string;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    city?: string;
    country?: string;
    agency?: string;
    licenseNumber?: string;
    propertiesListed?: number;
    propertiesSold?: number;
    averageRating?: number;
    reviewCount?: number;
}

interface UserStats {
    total: number;
    active: number;
    agents: number;
    verified: number;
    recent: number;
    byRole: Record<string, number>;
}

interface PaginatedUsers {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    admin: { label: 'Admin', color: 'text-red-700', bg: 'bg-red-50', icon: Shield },
    agent: { label: 'Agent', color: 'text-blue-700', bg: 'bg-blue-50', icon: BadgeCheck },
    registered_user: { label: 'User', color: 'text-slate-700', bg: 'bg-slate-100', icon: UserCheck },
    guest: { label: 'Guest', color: 'text-gray-600', bg: 'bg-gray-100', icon: Circle },
};

function RoleBadge({ role }: { role: UserRole }) {
    const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.registered_user;
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function Avatar({ user }: { user: User }) {
    const seed = encodeURIComponent(user.name);
    const src = user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffdfbf`;
    return (
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
            <img src={src} alt={user.name} className="w-full h-full object-cover" />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200/60 hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110 duration-300', color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
    user: User;
    onClose: () => void;
    onSaved: () => void;
}

function EditModal({ user, onClose, onSaved }: EditModalProps) {
    const [form, setForm] = useState({
        name: user.name,
        email: user.email ?? '',
        phoneNumber: user.phoneNumber,
        role: user.role as UserRole,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await apiClient.updateUser(user.id, {
                name: form.name,
                email: form.email || undefined,
                role: form.role,
                isActive: form.isActive,
                emailVerified: form.emailVerified,
                phoneVerified: form.phoneVerified,
            });
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Edit User</h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">{user.email || user.phoneNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Avatar user={user} />
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500">ID: {user.id}</p>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Full Name</label>
                        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-slate-50 border-slate-200" />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Email</label>
                        <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="No email set" className="bg-slate-50 border-slate-200" />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Role</label>
                        <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v as UserRole }))}>
                            <SelectTrigger className="bg-slate-50 border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="registered_user">User</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-3 gap-3">
                        {([
                            { key: 'isActive', label: 'Active' },
                            { key: 'emailVerified', label: 'Email ✓' },
                            { key: 'phoneVerified', label: 'Phone ✓' },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 text-xs font-semibold cursor-pointer',
                                    form[key]
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-400'
                                )}
                            >
                                {form[key] ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : <><Check className="w-4 h-4 mr-2" />Save Changes</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiClient.deleteUser(user.id);
            onDeleted();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Failed to delete user.');
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
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Deactivate User?</h2>
                    <p className="text-sm text-slate-500 mb-2">
                        <span className="font-semibold text-slate-700">{user.name}</span>'s account will be deactivated and they will lose access to the platform.
                    </p>
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>
                <div className="flex gap-3 px-6 pb-6">
                    <Button variant="outline" onClick={onClose} className="flex-1" disabled={deleting}>Cancel</Button>
                    <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={deleting}>
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                        Deactivate
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function ActionMenu({ user, onEdit, onDelete }: { user: User; onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                        onClick={() => { setOpen(false); onEdit(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Edit User
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                        onClick={() => { setOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <Ban className="w-3.5 h-3.5" /> Deactivate
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    // Guard
    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') router.push('/dashboard');
    }, [currentUser, router]);

    const [stats, setStats] = useState<UserStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);

    const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const data = await apiClient.getUserStats();
            setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoadingStats(false); }
    }, []);

    // Fetch users
    const fetchUsers = useCallback(async (p = page) => {
        setLoadingUsers(true);
        try {
            const params: any = { page: p, limit };
            if (search.trim()) params.search = search.trim();
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
            const data: PaginatedUsers = await apiClient.getAllUsers(params);
            setUsers(data.users ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(data.page ?? p);
        } catch (e) { console.error(e); }
        finally { setLoadingUsers(false); }
    }, [page, limit, search, roleFilter, statusFilter]);

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => { setPage(1); fetchUsers(1); }, 400);
        return () => clearTimeout(searchTimer.current);
    }, [search, roleFilter, statusFilter, limit]);

    useEffect(() => { fetchUsers(page); }, [page]);


    // Skeleton row
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            {[...Array(7)].map((_, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-4 bg-slate-200 rounded-md" style={{ width: `${60 + (i * 7) % 40}%` }} />
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
                                        <UserCog className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">User Control</h1>
                                    <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100 text-xs">Admin</Badge>
                                </div>
                                <p className="text-slate-500 text-sm">Manage all registered users, roles, and access.</p>
                            </div>
                        </div>

                        {/* ── Stats ── */}
                        {loadingStats ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
                            </div>
                        ) : stats ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="Total Users" value={stats.total} icon={Users} color="bg-blue-50 text-blue-600" />
                                <StatCard label="Active" value={stats.active} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                                <StatCard label="Agents" value={stats.agents} icon={BadgeCheck} color="bg-purple-50 text-purple-600" />
                                <StatCard label="Admins" value={stats.byRole?.admin ?? 0} icon={Shield} color="bg-red-50 text-red-600" />
                            </div>
                        ) : null}

                        {/* ── Filters ── */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input
                                    placeholder="Search name, email, phone…"
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

                            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 shadow-sm">
                                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="agent">Agent</SelectItem>
                                    <SelectItem value="registered_user">User</SelectItem>
                                    <SelectItem value="guest">Guest</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 shadow-sm">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[120px] bg-white border-slate-200 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 / page</SelectItem>
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
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loadingUsers ? (
                                            [...Array(limit < 6 ? limit : 6)].map((_, i) => <SkeletonRow key={i} />)
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-16 text-center">
                                                    <UserX className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-500 font-semibold">No users found</p>
                                                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search term.</p>
                                                </td>
                                            </tr>
                                        ) : users.map(u => (
                                            <tr
                                                key={u.id}
                                                className={cn(
                                                    'hover:bg-slate-50/70 transition-colors duration-150',
                                                    !u.isActive && 'opacity-60'
                                                )}
                                            >
                                                {/* User */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar user={u} />
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 truncate max-w-[150px]">{u.name}</p>
                                                            {(u.city || u.country) && (
                                                                <p className="text-xs text-slate-400 truncate">{[u.city, u.country].filter(Boolean).join(', ')}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-0.5 min-w-0">
                                                        {u.email && (
                                                            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                                                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                                <span className="truncate max-w-[180px]">{u.email}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                            <span>{u.phoneNumber}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="px-4 py-3.5">
                                                    <RoleBadge role={u.role} />
                                                    {u.role === 'agent' && u.agency && (
                                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />{u.agency}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                                                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                    )}>
                                                        <span className={cn('w-1.5 h-1.5 rounded-full', u.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                                                        {u.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>

                                                {/* Verified */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', u.emailVerified ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400')}>
                                                            {u.emailVerified ? '✓' : '✗'} Email
                                                        </span>
                                                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', u.phoneVerified ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400')}>
                                                            {u.phoneVerified ? '✓' : '✗'} Phone
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Joined */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5">
                                                    <ActionMenu
                                                        user={u}
                                                        onEdit={() => setEditUser(u)}
                                                        onDelete={() => setDeleteUser(u)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Pagination ── */}
                            {!loadingUsers && users.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-semibold text-slate-700">{total}</span> users
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>

                                        {/* Page pills */}
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
                                                        p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}

                                        <Button
                                            variant="outline"
                                            size="sm"
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

            {/* Modals */}
            {editUser && (
                <EditModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSaved={() => { fetchStats(); fetchUsers(page); }}
                />
            )}
            {deleteUser && (
                <DeleteModal
                    user={deleteUser}
                    onClose={() => setDeleteUser(null)}
                    onDeleted={() => { fetchStats(); fetchUsers(page); }}
                />
            )}
        </SidebarProvider>
    );
}
