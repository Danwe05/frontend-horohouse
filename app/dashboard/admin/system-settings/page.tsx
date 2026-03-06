"use client";

import React, { useState, useEffect } from "react";
import {
    Settings,
    Globe,
    Shield,
    Bell,
    Share2,
    Save,
    RefreshCw,
    Check,
    AlertTriangle,
    Mail,
    Phone,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Trash2,
    Info,
    PlaySquare,
    Zap,
    Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

interface SystemSettings {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    supportPhone: string;
    socialLinks: {
        facebook: string;
        instagram: string;
        twitter: string;
        linkedin: string;
    };
    maintenanceMode: boolean;
    maintenanceMessage: string;
    allowRegistration: boolean;
    featureFlags: {
        enableAiChat: boolean;
        enableRecommendations: boolean;
        enableWhatsAppBot: boolean;
        enableBooking: boolean;
    };
    version: string;
}

export default function PlatformSettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            router.push("/dashboard");
            return;
        }

        const fetchSettings = async () => {
            try {
                const response = await apiClient.getSystemSettings();
                setSettings(response);
            } catch (error) {
                console.error("Failed to fetch settings", error);
                toast.error("Failed to load platform settings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [user, authLoading, router]);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await apiClient.updateSystemSettings(settings);
            toast.success("Settings updated successfully");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    const updateNestedField = (parent: string, field: string, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [parent]: {
                ...(settings[parent as keyof SystemSettings] as any),
                [field]: value
            }
        });
    };

    if (authLoading || isLoading) {
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
                                <Skeleton className="h-12 w-36 rounded-xl" />
                            </div>
                            <Skeleton className="h-14 w-full md:w-[500px] rounded-2xl" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Skeleton className="h-[400px] rounded-3xl" />
                                <Skeleton className="h-[400px] rounded-3xl" />
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    if (!settings) return null;

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
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <Settings className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Platform Settings</h1>
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none hover:bg-indigo-100 text-xs">System</Badge>
                                </div>
                                <p className="text-slate-500 text-sm">Configure global site behavior, appearance, and administrative controls.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 px-6 py-6"
                                >
                                    {isSaving ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="general" className="space-y-6">
                            <TabsList className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-slate-100 h-14 w-full md:w-auto overflow-x-auto justify-start inline-flex">
                                <TabsTrigger value="general" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                                    <Globe className="w-4 h-4" /> General
                                </TabsTrigger>
                                <TabsTrigger value="social" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                                    <Share2 className="w-4 h-4" /> Social
                                </TabsTrigger>
                                <TabsTrigger value="features" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                                    <Zap className="w-4 h-4" /> Features
                                </TabsTrigger>
                                <TabsTrigger value="maintenance" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                                    <Shield className="w-4 h-4" /> Maintenance
                                </TabsTrigger>
                            </TabsList>

                            {/* General Settings */}
                            <TabsContent value="general" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                            <CardTitle className="text-lg">Site Identity</CardTitle>
                                            <CardDescription>Basic platform information.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="siteName">Site Name</Label>
                                                <Input
                                                    id="siteName"
                                                    value={settings.siteName}
                                                    onChange={(e) => updateField('siteName', e.target.value)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="siteDescription">Description</Label>
                                                <Textarea
                                                    id="siteDescription"
                                                    value={settings.siteDescription}
                                                    onChange={(e) => updateField('siteDescription', e.target.value)}
                                                    className="rounded-xl border-slate-200 min-h-[100px]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="version">System Version</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="version"
                                                        value={settings.version}
                                                        onChange={(e) => updateField('version', e.target.value)}
                                                        className="rounded-xl border-slate-200 bg-slate-50 cursor-not-allowed"
                                                        disabled
                                                    />
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-600">Stable</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                            <CardTitle className="text-lg">Contact Information</CardTitle>
                                            <CardDescription>Emails and phone numbers for support.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="supportEmail">Support Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="supportEmail"
                                                        value={settings.supportEmail}
                                                        onChange={(e) => updateField('supportEmail', e.target.value)}
                                                        className="pl-10 rounded-xl border-slate-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="supportPhone">Support Phone</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="supportPhone"
                                                        value={settings.supportPhone}
                                                        onChange={(e) => updateField('supportPhone', e.target.value)}
                                                        className="pl-10 rounded-xl border-slate-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Allow New Registrations</Label>
                                                    <p className="text-xs text-slate-500">Toggle public user signups.</p>
                                                </div>
                                                <Switch
                                                    checked={settings.allowRegistration}
                                                    onCheckedChange={(checked) => updateField('allowRegistration', checked)}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Social Settings */}
                            <TabsContent value="social">
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden max-w-2xl">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                        <CardTitle className="text-lg">Social Media Links</CardTitle>
                                        <CardDescription>Configure external links for the platform.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook</Label>
                                                <Input
                                                    placeholder="https://facebook.com/..."
                                                    value={settings.socialLinks.facebook}
                                                    onChange={(e) => updateNestedField('socialLinks', 'facebook', e.target.value)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-600" /> Instagram</Label>
                                                <Input
                                                    placeholder="https://instagram.com/..."
                                                    value={settings.socialLinks.instagram}
                                                    onChange={(e) => updateNestedField('socialLinks', 'instagram', e.target.value)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><Twitter className="w-4 h-4 text-sky-500" /> Twitter (X)</Label>
                                                <Input
                                                    placeholder="https://twitter.com/..."
                                                    value={settings.socialLinks.twitter}
                                                    onChange={(e) => updateNestedField('socialLinks', 'twitter', e.target.value)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn</Label>
                                                <Input
                                                    placeholder="https://linkedin.com/..."
                                                    value={settings.socialLinks.linkedin}
                                                    onChange={(e) => updateNestedField('socialLinks', 'linkedin', e.target.value)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Feature Toggles */}
                            <TabsContent value="features" className="space-y-6">
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-500" /> Feature Flags
                                        </CardTitle>
                                        <CardDescription>Enable or disable major platform features instantly.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                        <Zap className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">AI Chat Assistant</p>
                                                        <p className="text-xs text-slate-500">Enable the conversational AI for property inquiries.</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={settings.featureFlags.enableAiChat}
                                                    onCheckedChange={(checked) => updateNestedField('featureFlags', 'enableAiChat', checked)}
                                                />
                                            </div>

                                            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                        <PlaySquare className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">ML Recommendations</p>
                                                        <p className="text-xs text-slate-500">Enable personalized property suggestions powered by ML.</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={settings.featureFlags.enableRecommendations}
                                                    onCheckedChange={(checked) => updateNestedField('featureFlags', 'enableRecommendations', checked)}
                                                />
                                            </div>

                                            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                        <Phone className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">WhatsApp Bot</p>
                                                        <p className="text-xs text-slate-500">Integrate with the WhatsApp automation service.</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={settings.featureFlags.enableWhatsAppBot}
                                                    onCheckedChange={(checked) => updateNestedField('featureFlags', 'enableWhatsAppBot', checked)}
                                                />
                                            </div>

                                            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                                        <Lock className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">Online Bookings</p>
                                                        <p className="text-xs text-slate-500">Allow users to book property visits online.</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={settings.featureFlags.enableBooking}
                                                    onCheckedChange={(checked) => updateNestedField('featureFlags', 'enableBooking', checked)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Maintenance Mode */}
                            <TabsContent value="maintenance">
                                <Card className="border-none shadow-xl shadow-red-100/20 bg-white rounded-3xl overflow-hidden border-2 border-transparent data-[maintenance=true]:border-red-100" data-maintenance={settings.maintenanceMode}>
                                    <CardHeader className={cn("bg-slate-50/50 border-b border-slate-100", settings.maintenanceMode && "bg-red-50/50 border-red-100")}>
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className={cn("w-6 h-6", settings.maintenanceMode ? "text-red-500" : "text-slate-400")} />
                                            <div>
                                                <CardTitle className="text-lg">Maintenance Mode</CardTitle>
                                                <CardDescription>Temporarily disable the platform for updates.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-800">Status</p>
                                                <p className="text-xs text-slate-500">The site is currently {settings.maintenanceMode ? "offline" : "online"}.</p>
                                            </div>
                                            <Switch
                                                checked={settings.maintenanceMode}
                                                onCheckedChange={(checked) => updateField('maintenanceMode', checked)}
                                                className="data-[state=checked]:bg-red-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="maintenanceMessage">Public Message</Label>
                                            <Textarea
                                                id="maintenanceMessage"
                                                value={settings.maintenanceMessage}
                                                onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                                                placeholder="Enter message for visitors during maintenance..."
                                                className="rounded-xl border-slate-200 min-h-[120px]"
                                                disabled={!settings.maintenanceMode}
                                            />
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Info className="w-3 h-3" /> This message will be displayed to all non-admin users.
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-slate-50/50 px-6 py-4 flex justify-end">
                                        {settings.maintenanceMode && (
                                            <Badge className="bg-red-100 text-red-600 border-none px-3 py-1">
                                                System Offline (Maintenance Active)
                                            </Badge>
                                        )}
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Sticky Actions Bar */}
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
                            <Card className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-medium text-slate-600">Configuration active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        className="rounded-xl h-11 px-6 hover:bg-slate-100"
                                        onClick={() => window.location.reload()}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        className="rounded-xl h-11 px-8 bg-black hover:bg-zinc-800 text-white shadow-lg"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Apply Settings
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
