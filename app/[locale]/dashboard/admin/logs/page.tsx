"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Activity,
    Search,
    Filter,
    Calendar,
    User,
    ArrowUpDown,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    Clock,
    Globe,
    Monitor,
    Shield,
    MoreHorizontal,
    RefreshCw,
    X,
    MapPin,
    ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

type ActivityType =
    | 'property_view'
    | 'search'
    | 'favorite_add'
    | 'favorite_remove'
    | 'property_inquiry'
    | 'profile_update'
    | 'login'
    | 'logout'
    | 'property_share'
    | 'agent_contact';

interface LogEntry {
    _id: string;
    userId?: {
        name: string;
        email: string;
    };
    activityType: ActivityType;
    propertyId?: {
        title: string;
        city: string;
    };
    city?: string;
    ipAddress?: string;
    deviceInfo?: {
        platform?: string;
        browser?: string;
    };
    createdAt: string;
    metadata?: Record<string, any>;
}

export default function SystemLogsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [activityType, setActivityType] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                limit,
            };

            if (activityType) params.activityType = activityType;
            if (searchTerm) params.city = searchTerm; // Searching by city for now
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await apiClient.getAllActivities(params);
            setLogs(response.data);
            setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, activityType, searchTerm, startDate, endDate]);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            router.push("/dashboard");
            return;
        }
        fetchLogs();
    }, [user, authLoading, fetchLogs, router]);

    const getActivityLabel = (type: ActivityType) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getActivityBadge = (type: ActivityType) => {
        switch (type) {
            case 'login': return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case 'property_inquiry':
            case 'agent_contact': return "bg-blue-50 text-blue-600 border-blue-100";
            case 'favorite_add': return "bg-pink-50 text-pink-600 border-pink-100";
            case 'property_view': return "bg-indigo-50 text-indigo-600 border-indigo-100";
            case 'search': return "bg-amber-50 text-amber-600 border-amber-100";
            case 'logout': return "bg-slate-50 text-slate-600 border-slate-100";
            default: return "bg-slate-50 text-slate-500 border-slate-100";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `system_logs_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    if (authLoading || (user && user.role !== "admin")) {
        return (
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-[#f8fafc]">
                    <AppSidebar />
                    <SidebarInset className="bg-transparent">
                        <NavDash />
                        <div className="p-4 md:p-6 lg:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-24 rounded-xl" />
                                    <Skeleton className="h-10 w-24 rounded-xl" />
                                </div>
                            </div>
                            <Skeleton className="h-24 w-full rounded-3xl" />
                            <Skeleton className="h-[500px] w-full rounded-3xl" />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="p-4 md:p-6 lg:p-8 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Shield className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Activity Logs</h1>
                                    <Badge className="bg-slate-200 text-slate-700 border-none hover:bg-slate-200 text-xs">Audit</Badge>
                                </div>
                                <p className="text-slate-500 text-sm">Audit user actions, security events, and platform interactions.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={exportToJSON}
                                    variant="outline"
                                    className="rounded-xl border-slate-200 hover:bg-slate-50"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button
                                    onClick={fetchLogs}
                                    disabled={isLoading}
                                    className="rounded-xl bg-blue-600 hover:bg-blue-700 -md -blue-100"
                                >
                                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card className="border-none -sm bg-white/50 backdrop-blur-md rounded-3xl">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Activity Type</label>
                                        <select
                                            value={activityType}
                                            onChange={(e) => setActivityType(e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 -sm text-sm"
                                        >
                                            <option value="">All Activities</option>
                                            <option value="login">Login</option>
                                            <option value="property_view">Property View</option>
                                            <option value="search">Search</option>
                                            <option value="property_inquiry">Inquiry</option>
                                            <option value="favorite_add">Favorite Add</option>
                                            <option value="agent_contact">Agent Contact</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Search City</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                placeholder="Search by city..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 rounded-xl border-slate-200 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Date Range</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="rounded-xl border-slate-200"
                                            />
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="rounded-xl border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            variant="ghost"
                                            className="w-full rounded-xl text-slate-500 hover:bg-slate-100"
                                            onClick={() => {
                                                setActivityType("");
                                                setSearchTerm("");
                                                setStartDate("");
                                                setEndDate("");
                                            }}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Logs Table */}
                        <Card className="border-none -xl -slate-200/50 bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Activity Feed</CardTitle>
                                        <CardDescription>Showing {logs.length} of {total} events</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-slate-100">
                                                <TableHead className="w-[180px] py-4 pl-6 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Timestamp</TableHead>
                                                <TableHead className="py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Activity</TableHead>
                                                <TableHead className="py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">User</TableHead>
                                                <TableHead className="py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Location / IP</TableHead>
                                                <TableHead className="py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Device</TableHead>
                                                <TableHead className="pr-6 text-right py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                Array(limit).fill(0).map((_, i) => (
                                                    <TableRow key={i} className="border-slate-50">
                                                        <TableCell className="py-4 pl-6"><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                                                        <TableCell className="py-4"><Skeleton className="h-8 w-24 rounded-full" /></TableCell>
                                                        <TableCell className="py-4"><Skeleton className="h-10 w-32 rounded-lg" /></TableCell>
                                                        <TableCell className="py-4"><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                                                        <TableCell className="py-4"><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                                                        <TableCell className="py-4 pr-6"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : logs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-64 text-center">
                                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                                            <Activity className="w-12 h-12 mb-4 opacity-20" />
                                                            <p className="text-lg font-medium">No activity logs found</p>
                                                            <p className="text-sm">Try adjusting your filters or check back later.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                logs.map((log) => (
                                                    <TableRow key={log._id} className="group hover:bg-blue-50/30 transition-colors border-slate-50">
                                                        <TableCell className="py-4 pl-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-900">{formatDate(log.createdAt).split(',')[0]}</span>
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDate(log.createdAt).split(',')[1].trim()}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 border text-[11px] font-bold -sm whitespace-nowrap", getActivityBadge(log.activityType))}>
                                                                {getActivityLabel(log.activityType)}
                                                            </Badge>
                                                            {log.propertyId && (
                                                                <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]">
                                                                    {log.propertyId.title}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                                    {log.userId?.name?.charAt(0) || <User className="w-4 h-4" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-800">{log.userId?.name || "Guest"}</span>
                                                                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{log.userId?.email || "anonymous"}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                                    <MapPin className="w-3 h-3 text-red-400" />
                                                                    {log.city || log.propertyId?.city || "Unknown"}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                                    <Globe className="w-3 h-3" />
                                                                    {log.ipAddress || "0.0.0.0"}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                                                                    <Monitor className="w-3 h-3 text-slate-400" />
                                                                    {log.deviceInfo?.platform || "OS"}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                                    {log.deviceInfo?.browser || "Browser"}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => log.userId && router.push(`/dashboard/admin/users?id=${log.userId}`)}>
                                                                        <User className="mr-2 h-4 w-4" /> View User
                                                                    </DropdownMenuItem>
                                                                    {log.propertyId && (
                                                                        <DropdownMenuItem>
                                                                            <ArrowUpRight className="mr-2 h-4 w-4" /> View Property
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-slate-400 italic">
                                                                        ID: {log._id.substring(0, 8)}...
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>

                            {/* Pagination */}
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                    Showing page {page} of {totalPages || 1}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1 || isLoading}
                                        onClick={() => setPage(page - 1)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Simple pagination logic
                                            let pageNum = page;
                                            if (page <= 3) pageNum = i + 1;
                                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                            else pageNum = page - 2 + i;

                                            if (pageNum < 1 || pageNum > totalPages) return null;

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "w-9 h-9 p-0 rounded-xl",
                                                        page === pageNum ? "bg-blue-600 -md -blue-100" : "border-slate-200"
                                                    )}
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === totalPages || totalPages === 0 || isLoading}
                                        onClick={() => setPage(page + 1)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Bottom Insight */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Security Compliance</h3>
                                    <p className="text-slate-400 text-sm">System logs are maintained for 365 days according to platform policy.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3 py-1">
                                    Active Audit
                                </Badge>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
