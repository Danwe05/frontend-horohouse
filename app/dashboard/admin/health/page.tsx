"use client";

import React, { useState, useEffect } from "react";
import {
    Activity, Server, Database, MessageSquare, Brain,
    RefreshCw, CheckCircle2, AlertCircle, Clock, Cpu,
    HardDrive, MemoryStick, ShieldCheck, Zap, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from "@/lib/api"; // ← your existing ApiClient

type Status = "healthy" | "degraded" | "down" | "checking";

interface ServiceStatus {
    name: string;
    status: Status;
    version?: string;
    latency?: number;
    icon: any;
    endpoint: string;
}

// Exact shape returned by AppService.getHealthStatus()
interface HealthData {
    status: "ok" | "error";
    timestamp: string;
    service: string;
    version: string;
    database: {
        status: "connected" | "disconnected";
        details: { name: string; host: string };
    };
    system: {
        uptime: number;        // os.uptime() → seconds
        platform: string;      // "linux" | "darwin" | "win32"
        cpus: number;          // os.cpus().length
        loadAvg: number[];     // [1m, 5m, 15m] from os.loadavg()
        memory: {
            total: string;         // "15.42 GB"
            used: string;          // "8.21 GB"
            usagePercent: string;  // "53.21%"
        };
    };
}

export default function SystemHealthPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiMetrics, setApiMetrics] = useState<HealthData | null>(null);

    const [services, setServices] = useState<ServiceStatus[]>([
        { name: "Main API",                  status: "checking", icon: Server,        endpoint: "localhost:4000/health" },
        { name: "Database (MongoDB)",        status: "checking", icon: Database,      endpoint: "localhost:4000/health" },
        { name: "ML Recommendation Service", status: "checking", icon: Brain,         endpoint: "localhost:5001/health" },
        { name: "WhatsApp Bot",              status: "checking", icon: MessageSquare, endpoint: "localhost:3000/api/health" },
    ]);

    const fetchHealth = async () => {
        setIsRefreshing(true);
        const start = Date.now();

        try {
            // apiClient.getHealthStatus() — add this method to your ApiClient (see below)
            // Uses skipAuth + baseURL override since /health is not under /api/v1
            const api: HealthData = await apiClient.getHealthStatus();
            const latency = Date.now() - start;

            setApiMetrics(api);
            setServices([
                {
                    name: "Main API",
                    status: api.status === "ok" ? "healthy" : "degraded",
                    icon: Server,
                    version: api.version,
                    latency,
                    endpoint: "localhost:4000/health",
                },
                {
                    name: "Database (MongoDB)",
                    // "connected" | "disconnected" from Mongoose readyState
                    status: api.database?.status === "connected" ? "healthy" : "down",
                    icon: Database,
                    endpoint: "localhost:4000/health",
                },
                {
                    name: "ML Recommendation Service",
                    status: "down", // wire up when Flask service is running
                    icon: Brain,
                    endpoint: "localhost:5001/health",
                },
                {
                    name: "WhatsApp Bot",
                    status: "down", // wire up when WhatsApp service is running
                    icon: MessageSquare,
                    endpoint: "localhost:3000/api/health",
                },
            ]);

            setLastUpdated(new Date());
        } catch (error) {
            console.error("Health check failed", error);
            setServices(prev => prev.map(s => ({ ...s, status: "down" as Status })));
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            router.push("/dashboard");
            return;
        }
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [user, authLoading]);

    // Derived display values — all based on exact API field shapes
    const memPercent  = parseFloat(apiMetrics?.system?.memory?.usagePercent ?? "0"); // strips the "%" char
    const uptimeHours = apiMetrics ? Math.floor(apiMetrics.system.uptime / 3600) : 0;
    const uptimeMins  = apiMetrics ? Math.floor((apiMetrics.system.uptime % 3600) / 60) : 0;
    const loadAvg1m   = apiMetrics?.system?.loadAvg?.[0]?.toFixed(2) ?? "—";
    const anyDown     = services.some(s => s.status === "down");
    const overallLabel = services.some(s => s.status === "checking")
        ? "Checking..."
        : anyDown ? "Degraded" : "Operational";

    const getStatusColor = (status: Status) => {
        switch (status) {
            case "healthy":  return "text-emerald-500 bg-emerald-50 border-emerald-100";
            case "degraded": return "text-amber-500 bg-amber-50 border-amber-100";
            case "down":     return "text-red-500 bg-red-50 border-red-100";
            default:         return "text-slate-400 bg-slate-50 border-slate-100";
        }
    };

    const getStatusIcon = (status: Status) => {
        switch (status) {
            case "healthy":  return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case "degraded": return <AlertCircle  className="w-5 h-5 text-amber-500" />;
            case "down":     return <AlertCircle  className="w-5 h-5 text-red-500" />;
            default:         return <RefreshCw    className="w-5 h-5 text-slate-400 animate-spin" />;
        }
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
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Skeleton className="h-[400px] rounded-3xl" />
                                <Skeleton className="h-[400px] rounded-3xl" />
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

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
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">System Health</h1>
                                    <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100 text-xs">Monitor</Badge>
                                </div>
                                <p className="text-slate-500 text-sm">
                                    Monitor the status and performance of HoroHouse infrastructure in real-time.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                        <Clock className="w-3 h-3" />
                                        Last updated: {lastUpdated.toLocaleTimeString()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Auto-refresh: 30s</p>
                                </div>
                                <Button
                                    onClick={fetchHealth}
                                    disabled={isRefreshing}
                                    variant="outline"
                                    className="rounded-xl border-blue-100 hover:bg-blue-50 transition-all duration-300"
                                >
                                    <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                                    Refresh Status
                                </Button>
                            </div>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className={cn(
                                "border-none shadow-sm text-white overflow-hidden relative",
                                anyDown
                                    ? "bg-gradient-to-br from-red-500 to-red-600"
                                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                            )}>
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <ShieldCheck className="w-16 h-16" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Overall Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{overallLabel}</div>
                                    <p className="text-xs mt-1 opacity-80">{apiMetrics?.service ?? "HoroHouse API"}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">API Latency</CardTitle>
                                    <Zap className="w-4 h-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {services[0].latency ?? "—"}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                                    </div>
                                    <p className="text-xs mt-1 text-emerald-500 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Client round-trip
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
                                    <MemoryStick className="w-4 h-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {apiMetrics?.system?.memory?.usagePercent ?? "—"}
                                    </div>
                                    <Progress value={memPercent} className="h-1.5 mt-2 bg-blue-100" />
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
                                    <Clock className="w-4 h-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {uptimeHours}<span className="text-sm font-normal text-muted-foreground ml-1">h</span>
                                        <span className="ml-2">{uptimeMins}<span className="text-sm font-normal text-muted-foreground ml-1">m</span></span>
                                    </div>
                                    <p className="text-xs mt-1 text-muted-foreground">OS uptime</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Services + Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Server className="w-5 h-5 text-blue-600" />
                                        Core Services
                                    </CardTitle>
                                    <CardDescription>Primary infrastructure components</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {services.map((service) => (
                                        <div
                                            key={service.name}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                                    service.status === "healthy" ? "bg-emerald-50 text-emerald-600" :
                                                    service.status === "down"    ? "bg-red-50 text-red-400" :
                                                                                   "bg-slate-50 text-slate-400"
                                                )}>
                                                    <service.icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{service.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        {service.version && (
                                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                                v{service.version}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{service.endpoint}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                                                    getStatusColor(service.status)
                                                )}>
                                                    {getStatusIcon(service.status)}
                                                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                                </div>
                                                {service.latency !== undefined && (
                                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                                        {service.latency}ms
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* System Metrics */}
                            <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        API Environment
                                    </CardTitle>
                                    <CardDescription>
                                        Metrics from NestJS ·{" "}
                                        {apiMetrics?.timestamp
                                            ? new Date(apiMetrics.timestamp).toLocaleTimeString()
                                            : "—"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-500">Platform</span>
                                                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <p className="text-base font-bold capitalize">
                                                {apiMetrics?.system?.platform ?? "—"}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-500">CPU Cores</span>
                                                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <p className="text-base font-bold">
                                                {apiMetrics?.system?.cpus ?? "—"}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-500">Load (1m)</span>
                                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            {/* loadAvg[0] = 1-minute average from os.loadavg() */}
                                            <p className="text-base font-bold">{loadAvg1m}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <MemoryStick className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm font-medium">Memory</span>
                                            </div>
                                            {/* "8.21 GB" / "15.42 GB" directly from os module */}
                                            <span className="text-sm font-bold text-blue-600">
                                                {apiMetrics?.system?.memory?.used ?? "—"} / {apiMetrics?.system?.memory?.total ?? "—"}
                                            </span>
                                        </div>
                                        <Progress value={memPercent} className="h-2 bg-blue-50" />
                                        <p className="text-[10px] text-muted-foreground mt-1.5">
                                            {apiMetrics?.system?.memory?.usagePercent ?? "—"} of total system memory in use
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Database className="w-4 h-4 text-blue-600" />
                                            Database
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-3">
                                            <div className="text-xs">
                                                <p className="text-muted-foreground mb-0.5">Name</p>
                                                {/* connection.name from Mongoose InjectConnection */}
                                                <p className="font-medium font-mono">
                                                    {apiMetrics?.database?.details?.name ?? "N/A"}
                                                </p>
                                            </div>
                                            <div className="text-xs">
                                                <p className="text-muted-foreground mb-0.5">Status</p>
                                                <p className={cn(
                                                    "font-medium flex items-center gap-1",
                                                    apiMetrics?.database?.status === "connected"
                                                        ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    {apiMetrics?.database?.status === "connected"
                                                        ? <><CheckCircle2 className="w-3 h-3" /> Connected</>
                                                        : <><AlertCircle  className="w-3 h-3" /> Disconnected</>
                                                    }
                                                </p>
                                            </div>
                                            <div className="text-xs col-span-2">
                                                <p className="text-muted-foreground mb-0.5">Host</p>
                                                {/* connection.host — hostname only, no port appended */}
                                                <p className="font-medium font-mono truncate">
                                                    {apiMetrics?.database?.details?.host ?? "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Footer */}
                        <div className="p-6 rounded-3xl bg-blue-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Need detailed logs?</h3>
                                    <p className="text-white/80 text-sm">Access the advanced logging system for deep troubleshooting.</p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-6"
                                onClick={() => router.push('/dashboard/admin/logs')}
                            >
                                View System Logs
                                <ArrowUpRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}