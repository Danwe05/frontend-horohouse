"use client";

import React, { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, BadgeCheck, UserCheck, Circle, Check, Minus, ChevronRight, Settings, Info, X, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

// ─── Data & Types ────────────────────────────────────────────────────────────

type RoleId = "admin" | "agent" | "registered_user" | "guest" | "custom";

interface PermissionRow {
    module: string;
    description: string;
    admin: boolean;
    agent: boolean;
    user: boolean;
    guest: boolean;
}

const INITIAL_PERMISSION_MATRIX: PermissionRow[] = [
    { module: "Dashboard Access",        description: "Allows user to log into the main dashboard area.", admin: true,  agent: true,  user: true,  guest: false },
    { module: "View Properties",         description: "Can view listed properties and their details.",    admin: true,  agent: true,  user: true,  guest: true  },
    { module: "Create Properties",       description: "Can publish new property listings.",               admin: true,  agent: true,  user: false, guest: false },
    { module: "Edit All Properties",     description: "Can edit any property on the platform.",           admin: true,  agent: false, user: false, guest: false },
    { module: "Edit Own Properties",     description: "Can only edit properties they have created.",      admin: true,  agent: true,  user: false, guest: false },
    { module: "Delete Properties",       description: "Can permanently remove properties.",               admin: true,  agent: true,  user: false, guest: false },
    { module: "View All Bookings",       description: "Can see bookings across the entire platform.",     admin: true,  agent: false, user: false, guest: false },
    { module: "Book Properties",         description: "Allowed to make reservations and payments.",       admin: false, agent: false, user: true,  guest: false },
    { module: "Manage Users",            description: "Can view, edit, or deactivate other users.",       admin: true,  agent: false, user: false, guest: false },
    { module: "Manage Settings",         description: "Access to global platform settings & API keys.",   admin: true,  agent: false, user: false, guest: false },
];

const INITIAL_ROLES = [
    {
        id: "admin" as RoleId,
        name: "Admin",
        description: "Full system access. Can manage all properties, users, and platform settings.",
        icon: Shield,
    },
    {
        id: "agent" as RoleId,
        name: "Agent",
        description: "Can list and manage their own properties, and handle bookings for their listings.",
        icon: BadgeCheck,
    },
    {
        id: "registered_user" as RoleId,
        name: "User",
        description: "Standard registered account. Can book properties, leave reviews, and save favorites.",
        icon: UserCheck,
    },
    {
        id: "guest" as RoleId,
        name: "Guest",
        description: "Unauthenticated visitor. Can only browse properties and read public community posts.",
        icon: Circle,
    }
];

// ─── Components ──────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) => (
    <button 
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
            "w-11 h-6 rounded-full flex items-center p-0.5 transition-colors duration-200", 
            checked ? "bg-[#222222]" : "bg-[#DDDDDD]",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
    >
        <div className={cn(
            "w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200", 
            checked ? "translate-x-5" : "translate-x-0"
        )} />
    </button>
);

export default function AdminRolesPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    // Guard route
    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [currentUser, router]);

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Matrix State
    const [matrix, setMatrix] = useState<PermissionRow[]>(INITIAL_PERMISSION_MATRIX);
    const [isEditMode, setIsEditMode] = useState(false);

    // Modals / Drawers State
    const [selectedRole, setSelectedRole] = useState<typeof INITIAL_ROLES[0] | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form states for new role
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiClient.getUserStats();
                setStats(data);
            } catch (e) {
                console.error("Failed to load stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getCountForRole = (roleId: string) => {
        if (!stats || !stats.byRole) return 0;
        return stats.byRole[roleId] || 0;
    };

    const handleTogglePermission = (rowIndex: number, roleKey: keyof PermissionRow) => {
        const newMatrix = [...matrix];
        newMatrix[rowIndex] = {
            ...newMatrix[rowIndex],
            [roleKey]: !newMatrix[rowIndex][roleKey]
        };
        setMatrix(newMatrix);
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white font-sans text-[#222222]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    
                    <div className="max-w-6xl mx-auto w-full px-6 py-12 md:px-10 space-y-12">

                        {/* ── Header ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-[32px] font-bold tracking-tight text-[#222222] mb-2">Roles & Permissions</h1>
                                <p className="text-[16px] text-[#717171]">Manage platform access levels and view exactly what each role can do.</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#222222] text-white text-[15px] font-semibold hover:bg-black transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create custom role
                            </button>
                        </div>

                        {/* ── Role List ── */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[22px] font-semibold text-[#222222]">System Roles</h2>
                            </div>
                            
                            <div className="border border-[#DDDDDD] rounded-2xl overflow-hidden bg-white">
                                {INITIAL_ROLES.map((role, i) => {
                                    const Icon = role.icon;
                                    const count = loading ? '...' : getCountForRole(role.id);
                                    
                                    return (
                                        <div 
                                            key={role.id} 
                                            onClick={() => setSelectedRole(role)}
                                            className={cn(
                                                "flex items-start md:items-center justify-between p-6 hover:bg-[#F7F7F7] transition-colors cursor-pointer",
                                                i !== INITIAL_ROLES.length - 1 && "border-b border-[#EBEBEB]"
                                            )}
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="mt-1 md:mt-0 w-12 h-12 rounded-full border border-[#DDDDDD] bg-white flex items-center justify-center shrink-0">
                                                    <Icon className="w-6 h-6 text-[#222222] stroke-[1.5]" />
                                                </div>
                                                <div className="flex-1 pr-6">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-[16px] font-semibold text-[#222222]">{role.name}</h3>
                                                        <span className="px-2 py-0.5 rounded-full bg-[#EBEBEB] text-[#222222] text-[12px] font-semibold">
                                                            {count} {Number(count) === 1 ? 'user' : 'users'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[14px] text-[#717171] leading-relaxed max-w-2xl">
                                                        {role.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 pt-2 md:pt-0">
                                                <ChevronRight className="w-5 h-5 text-[#B0B0B0]" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        {/* ── Permission Matrix ── */}
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-[22px] font-semibold text-[#222222] mb-1">Permission Matrix</h2>
                                    <p className="text-[14px] text-[#717171]">Detailed breakdown of capabilities across the platform.</p>
                                </div>
                                <button 
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] font-semibold transition-colors w-full sm:w-auto",
                                        isEditMode ? "bg-[#222222] text-white border-[#222222]" : "border-[#222222] text-[#222222] hover:bg-[#F7F7F7]"
                                    )}
                                >
                                    {isEditMode ? <Save className="w-4 h-4 stroke-[2]" /> : <Settings className="w-4 h-4 stroke-[2]" />}
                                    {isEditMode ? "Save Changes" : "Edit Settings"}
                                </button>
                            </div>
                            
                            <div className="border border-[#DDDDDD] rounded-2xl overflow-hidden bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead>
                                            <tr className="border-b border-[#DDDDDD] bg-[#F7F7F7]">
                                                <th className="px-6 py-5 text-[14px] font-semibold text-[#222222] w-1/3">Module / Action</th>
                                                <th className="px-4 py-5 text-[14px] font-semibold text-[#222222] text-center w-1/6">Admin</th>
                                                <th className="px-4 py-5 text-[14px] font-semibold text-[#222222] text-center w-1/6">Agent</th>
                                                <th className="px-4 py-5 text-[14px] font-semibold text-[#222222] text-center w-1/6">User</th>
                                                <th className="px-4 py-5 text-[14px] font-semibold text-[#222222] text-center w-1/6">Guest</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EBEBEB]">
                                            {matrix.map((row, i) => (
                                                <tr key={i} className="hover:bg-[#F7F7F7] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 group">
                                                            <span className="text-[15px] font-medium text-[#222222]">{row.module}</span>
                                                            
                                                            {/* Tooltip implementation */}
                                                            <div className="relative flex items-center">
                                                                <Info className="w-4 h-4 text-[#B0B0B0] hover:text-[#222222] transition-colors cursor-help" />
                                                                <div className="pointer-events-none absolute left-6 p-3 w-64 bg-[#222222] text-white text-[13px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 bottom-1/2 translate-y-1/2">
                                                                    {row.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {(['admin', 'agent', 'user', 'guest'] as const).map(roleKey => (
                                                        <td key={roleKey} className="px-4 py-4">
                                                            <div className="flex justify-center">
                                                                {isEditMode ? (
                                                                    <Toggle 
                                                                        checked={row[roleKey]} 
                                                                        onChange={() => handleTogglePermission(i, roleKey)} 
                                                                        disabled={roleKey === 'admin'} // Admin usually locked
                                                                    />
                                                                ) : (
                                                                    row[roleKey] ? <Check className="w-5 h-5 mx-auto text-[#008A05] stroke-[2.5]" /> : <Minus className="w-4 h-4 mx-auto text-[#B0B0B0] stroke-[2]" />
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                    </div>
                </SidebarInset>
            </div>

            {/* ── Role Drawer ── */}
            {selectedRole && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRole(null)} />
                    <div className="relative w-full max-w-[440px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
                            <h2 className="text-[22px] font-semibold text-[#222222]">Role Details</h2>
                            <button onClick={() => setSelectedRole(null)} className="p-2 -mr-2 rounded-full hover:bg-[#F7F7F7] transition-colors">
                                <X className="w-5 h-5 text-[#222222]" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-8 text-[#222222]">
                            
                            {/* Role Header Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-[#DDDDDD] bg-[#F7F7F7] flex items-center justify-center shrink-0">
                                    <selectedRole.icon className="w-7 h-7 text-[#222222] stroke-[1.5]" />
                                </div>
                                <div>
                                    <h3 className="text-[20px] font-bold">{selectedRole.name}</h3>
                                    <div className="text-[14px] text-[#717171] mt-0.5">
                                        {getCountForRole(selectedRole.id)} Active Users
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-[16px] font-semibold mb-2">Description</h4>
                                <p className="text-[15px] text-[#717171] leading-relaxed">
                                    {selectedRole.description}
                                </p>
                            </div>

                            {/* Quick Toggles for this role specifically */}
                            <div className="border-t border-[#DDDDDD] pt-8">
                                <h4 className="text-[16px] font-semibold mb-4">Security Requirements</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[15px] font-medium text-[#222222]">Require 2FA</p>
                                            <p className="text-[13px] text-[#717171]">Mandatory for all users with this role</p>
                                        </div>
                                        <Toggle checked={selectedRole.id === 'admin'} onChange={() => {}} disabled />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[15px] font-medium text-[#222222]">Session Timeout</p>
                                            <p className="text-[13px] text-[#717171]">Auto-logout after 2 hours of inactivity</p>
                                        </div>
                                        <Toggle checked={selectedRole.id === 'admin' || selectedRole.id === 'agent'} onChange={() => {}} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Role Modal ── */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
                            <h2 className="text-[22px] font-semibold text-[#222222]">Create custom role</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-[#F7F7F7] transition-colors">
                                <X className="w-5 h-5 text-[#222222]" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-[15px] font-semibold text-[#222222] mb-2">Role Name</label>
                                <input 
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="e.g. Moderator"
                                    className="w-full border border-[#DDDDDD] rounded-xl px-4 py-3 text-[16px] text-[#222222] focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[15px] font-semibold text-[#222222] mb-2">Description</label>
                                <textarea 
                                    value={newRoleDesc}
                                    onChange={(e) => setNewRoleDesc(e.target.value)}
                                    placeholder="Briefly describe what this role does..."
                                    rows={3}
                                    className="w-full border border-[#DDDDDD] rounded-xl px-4 py-3 text-[16px] text-[#222222] focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] transition-colors resize-none"
                                />
                            </div>
                            <div className="bg-[#F7F7F7] p-4 rounded-xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-[#717171] shrink-0 mt-0.5" />
                                <p className="text-[13px] text-[#717171] leading-relaxed">
                                    After creating this role, it will appear in the System Roles list and Permission Matrix where you can manually tailor its permissions.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#DDDDDD] flex gap-4">
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-3.5 rounded-xl border border-[#222222] text-[16px] font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    // Normally hits API, just close for UI demo
                                    setIsCreateModalOpen(false);
                                    setNewRoleName('');
                                    setNewRoleDesc('');
                                }}
                                className="flex-1 py-3.5 rounded-xl bg-[#222222] text-[16px] font-semibold text-white hover:bg-black transition-colors"
                                disabled={!newRoleName.trim()}
                            >
                                Create Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </SidebarProvider>
    );
}
