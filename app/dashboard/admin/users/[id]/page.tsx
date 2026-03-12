'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Mail, Phone, MapPin, Calendar, CheckCircle2,
    XCircle, Shield, BadgeCheck, UserCheck, Circle, Building2,
    Star, Home, TrendingUp, AlertTriangle, Loader2, UserX, UserCog, Ban
} from 'lucide-react';

// Types
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

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    admin: { label: 'Admin', color: 'text-red-700', bg: 'bg-red-50', icon: Shield },
    agent: { label: 'Agent', color: 'text-blue-700', bg: 'bg-blue-50', icon: BadgeCheck },
    registered_user: { label: 'User', color: 'text-slate-700', bg: 'bg-slate-100', icon: UserCheck },
    guest: { label: 'Guest', color: 'text-gray-600', bg: 'bg-gray-100', icon: Circle },
};

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [togglingStatus, setTogglingStatus] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [currentUser, router]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getUserById(params.id as string);
            setUser(data);
        } catch (e: any) {
            console.error(e);
            setError(e.response?.data?.message || 'Failed to load user details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchUser();
        }
    }, [params.id]);

    const handleToggleStatus = async () => {
        if (!user) return;
        setTogglingStatus(true);
        try {
            await apiClient.updateUser(user.id, { isActive: !user.isActive });
            setUser({ ...user, isActive: !user.isActive });
        } catch (e: any) {
            console.error('Failed to toggle status', e);
        } finally {
            setTogglingStatus(false);
        }
    };

    if (loading) {
        return (
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-[#f8fafc]">
                    <AppSidebar />
                    <SidebarInset className="bg-transparent">
                        <NavDash />
                        <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    if (error || !user) {
        return (
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-[#f8fafc]">
                    <AppSidebar />
                    <SidebarInset className="bg-transparent">
                        <NavDash />
                        <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
                            <UserX className="w-16 h-16 text-slate-300 mb-4" />
                            <h2 className="text-xl font-bold text-slate-800">User Not Found</h2>
                            <p className="text-slate-500 mt-2 mb-6">{error || 'The user you are looking for does not exist.'}</p>
                            <Button onClick={() => router.push('/dashboard/admin/users')} variant="outline">
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back to Users
                            </Button>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    const { icon: RoleIcon, label: roleLabel, bg: roleBg, color: roleColor } = ROLE_CONFIG[user.role] || ROLE_CONFIG.registered_user;
    const seed = encodeURIComponent(user.name);
    const avatarSrc = user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffdfbf`;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent overflow-x-hidden">
                    <NavDash />

                    <div className="max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
                        {/* Top Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between"
                        >
                            <Button variant="ghost" onClick={() => router.push('/dashboard/admin/users')} className="text-slate-500 hover:text-slate-900 -ml-2">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Directory
                            </Button>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant={user.isActive ? "destructive" : "default"}
                                    className={cn(!user.isActive && "bg-emerald-600 hover:bg-emerald-700")}
                                    onClick={handleToggleStatus}
                                    disabled={togglingStatus}
                                >
                                    {togglingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : user.isActive ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    {user.isActive ? 'Deactivate User' : 'Activate User'}
                                </Button>
                            </div>
                        </motion.div>

                        {/* Profile Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden relative"
                        >
                            <div className="h-32 md:h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            </div>

                            <div className="px-6 md:px-10 pb-8 relative">
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 mb-6 relative z-20">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0">
                                        <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
                                            <Badge className={cn("px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 border-none", roleBg, roleColor)}>
                                                <RoleIcon className="w-4 h-4" /> {roleLabel}
                                            </Badge>
                                            {user.isActive ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100">Active Account</Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100">Deactivated</Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-500 font-medium">User ID: {user.id}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Contact & Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="lg:col-span-1 space-y-6"
                            >
                                <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <UserCog className="w-5 h-5 text-blue-600" /> Contact Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5"><Mail className="w-4 h-4" /></div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Email Address</p>
                                                <p className="text-sm font-medium text-slate-900 truncate">{user.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5"><Phone className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Phone Number</p>
                                                <p className="text-sm font-medium text-slate-900">{user.phoneNumber}</p>
                                            </div>
                                        </div>
                                        {(user.city || user.country) && (
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5"><MapPin className="w-4 h-4" /></div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Location</p>
                                                    <p className="text-sm font-medium text-slate-900">{[user.city, user.country].filter(Boolean).join(', ')}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5"><Calendar className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Joined</p>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-indigo-600" /> Security & Verification
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                            <span className="text-sm font-medium text-slate-700">Email Verified</span>
                                            {user.emailVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                            <span className="text-sm font-medium text-slate-700">Phone Verified</span>
                                            {user.phoneVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Right Column: Stats & Agent Details */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="lg:col-span-2 space-y-6"
                            >
                                {user.role === 'agent' ? (
                                    <Card className="border-slate-200/60 shadow-sm rounded-2xl h-full flex flex-col">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-blue-600" /> Agent Profile
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Agency</p>
                                                    <p className="text-base font-bold text-slate-900">{user.agency || 'Independent'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">License Number</p>
                                                    <p className="text-base font-bold text-slate-900">{user.licenseNumber || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Performance Metrics</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                                    <Home className="w-6 h-6 text-blue-600 mb-2" />
                                                    <span className="text-2xl font-black text-slate-900">{user.propertiesListed || 0}</span>
                                                    <span className="text-xs font-semibold text-slate-500 text-center mt-1">Properties Listed</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                                    <TrendingUp className="w-6 h-6 text-emerald-600 mb-2" />
                                                    <span className="text-2xl font-black text-slate-900">{user.propertiesSold || 0}</span>
                                                    <span className="text-xs font-semibold text-slate-500 text-center mt-1">Properties Sold</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                                                    <Star className="w-6 h-6 text-amber-500 mb-2" />
                                                    <span className="text-2xl font-black text-slate-900">{user.averageRating?.toFixed(1) || '0.0'}</span>
                                                    <span className="text-xs font-semibold text-slate-500 text-center mt-1">Avg Rating</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                                                    <UserCheck className="w-6 h-6 text-purple-600 mb-2" />
                                                    <span className="text-2xl font-black text-slate-900">{user.reviewCount || 0}</span>
                                                    <span className="text-xs font-semibold text-slate-500 text-center mt-1">Total Reviews</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-8 text-center transition-colors hover:bg-slate-50">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 ring-4 ring-white shadow-sm">
                                            <AlertTriangle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">No Performance Data Available</h3>
                                        <p className="text-sm text-slate-500 max-w-sm">
                                            Performance metrics and agent statistics are only available for user accounts with the <span className="font-semibold text-slate-700">Agent</span> role.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
