"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, CircleDollarSign, User as UserIcon, Mail, Phone, FileText, ArrowLeft, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyLeasePage() {
    const { isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [leaseInfo, setLeaseInfo] = useState<any>(null);
    const [loadingLease, setLoadingLease] = useState(true);

    useEffect(() => {
        const fetchLease = async () => {
            try {
                const data = await apiClient.getMyLeaseInfo();
                if (data.leases && data.leases.length > 0) {
                    setLeaseInfo(data.leases[0]); // For now, just show the first active lease
                }
            } catch (error) {
                console.error("Failed to fetch lease info:", error);
            } finally {
                setLoadingLease(false);
            }
        };

        if (!authLoading) {
            fetchLease();
        }
    }, [authLoading]);

    if (authLoading || loadingLease) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!leaseInfo) {
        return (
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-gray-50">
                    <AppSidebar />
                    <SidebarInset>
                        <NavDash />
                        <main className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-center">
                            <div className="max-w-md text-center">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">No Active Lease Found</h2>
                                <p className="text-muted-foreground mb-6">
                                    You are not currently listed as a tenant for any properties on our platform.
                                    If you believe this is an error, please contact your landlord.
                                </p>
                                <Button onClick={() => router.push('/dashboard')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Return to Dashboard
                                </Button>
                            </div>
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    const isActive = leaseInfo.status === 'active';
    const isPending = leaseInfo.status === 'pending';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-CM", {
            style: "currency",
            currency: "XAF",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-gray-50">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />

                    <main className="flex-1 p-4 lg:p-8">
                        <div className="mx-auto space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lease Details</h1>
                                    <p className="text-muted-foreground mt-1">Manage your rental agreement and landlord communications</p>
                                </div>
                            </div>

                            {/* Status Banner */}
                            <div className={`rounded-xl p-4 border flex items-center justify-between ${isActive ? "bg-emerald-50 border-emerald-200" :
                                isPending ? "bg-amber-50 border-amber-200" :
                                    "bg-gray-50 border-gray-200"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isActive ? "bg-emerald-100 text-emerald-600" :
                                        isPending ? "bg-amber-100 text-amber-600" :
                                            "bg-gray-200 text-gray-500"
                                        }`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isActive ? "text-emerald-800" :
                                            isPending ? "text-amber-800" :
                                                "text-gray-700"
                                            }`}>
                                            {isActive ? "Lease Active" : isPending ? "Pending Landlord Approval" : "Lease Ended"}
                                        </h3>
                                        <p className={`text-sm ${isActive ? "text-emerald-600" :
                                            isPending ? "text-amber-600" :
                                                "text-gray-500"
                                            }`}>
                                            Valid from {format(new Date(leaseInfo.leaseStart), "MMM d, yyyy")} to {format(new Date(leaseInfo.leaseEnd), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={isActive ? "default" : isPending ? "secondary" : "outline"}
                                    className={
                                        isActive ? "bg-emerald-500 hover:bg-emerald-600 border-transparent text-white" :
                                            isPending ? "bg-amber-500 hover:bg-amber-600 border-transparent text-white" : ""
                                    }
                                >
                                    {leaseInfo.status.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Main Content - Left Column (2/3 width) */}
                                <div className="md:col-span-2 space-y-6">

                                    {/* Property Details Card */}
                                    <Card className="border-border/50 -sm overflow-hidden">
                                        {leaseInfo.property?.image && (
                                            <div className="h-48 w-full relative">
                                                <img
                                                    src={leaseInfo.property.image}
                                                    alt={leaseInfo.property.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-4 left-4 text-white">
                                                    <Badge variant="secondary" className="mb-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-none">
                                                        {leaseInfo.property.type}
                                                    </Badge>
                                                    <h2 className="text-xl font-bold">{leaseInfo.property.title}</h2>
                                                </div>
                                            </div>
                                        )}

                                        <CardHeader className={leaseInfo.property?.image ? "pt-4" : ""}>
                                            <CardTitle className="flex items-center gap-2">
                                                <Home className="w-5 h-5 text-blue-500" />
                                                Property Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {!leaseInfo.property?.image && (
                                                    <h3 className="font-semibold text-lg">{leaseInfo.property?.title || 'Unknown Property'}</h3>
                                                )}
                                                <div className="flex items-start gap-3 text-muted-foreground">
                                                    <MapPin className="w-5 h-5 shrink-0 text-blue-500/70" />
                                                    <p>
                                                        {leaseInfo.property?.address}<br />
                                                        {leaseInfo.property?.city}, {leaseInfo.property?.country}
                                                    </p>
                                                </div>

                                                {leaseInfo.property?.id && (
                                                    <Button variant="outline" className="w-full mt-2" asChild>
                                                        <Link href={`/properties/${leaseInfo.property.id}`}>
                                                            View Full Property Listing
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Financials Card */}
                                    <Card className="border-border/50 -sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <CircleDollarSign className="w-5 h-5 text-blue-500" />
                                                Financial Overview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-muted/30 p-4 rounded-xl border">
                                                    <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Rent</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {formatCurrency(leaseInfo.monthlyRent)}
                                                    </p>
                                                </div>
                                                <div className="bg-muted/30 p-4 rounded-xl border">
                                                    <p className="text-sm font-medium text-muted-foreground mb-1">Security Deposit</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {leaseInfo.depositAmount ? formatCurrency(leaseInfo.depositAmount) : 'Not specified'}
                                                    </p>
                                                </div>
                                            </div>

                                            {leaseInfo.notes && (
                                                <div className="mt-6 pt-6 border-t">
                                                    <h4 className="text-sm font-semibold mb-2">Lease Notes</h4>
                                                    <p className="text-sm text-muted-foreground bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                                        {leaseInfo.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar - Right Column (1/3 width) */}
                                <div className="space-y-6">

                                    {/* Landlord Contact Card */}
                                    <Card className="border-border/50 -sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Your Landlord</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center text-center pb-6">
                                            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mb-4 -inner">
                                                {leaseInfo.landlord.profilePicture ? (
                                                    <img src={leaseInfo.landlord.profilePicture} alt={leaseInfo.landlord.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-12 h-12 text-blue-600" />
                                                )}
                                            </div>
                                            <h3 className="font-bold text-xl mb-1">{leaseInfo.landlord.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-6">Property Owner / Manager</p>

                                            <div className="w-full space-y-3">
                                                <Button className="w-full gap-2" variant="default" asChild>
                                                    <a href={`mailto:${leaseInfo.landlord.email}`}>
                                                        <Mail className="w-4 h-4" /> Email Landlord
                                                    </a>
                                                </Button>

                                                {leaseInfo.landlord.phoneNumber && (
                                                    <Button className="w-full gap-2" variant="outline" asChild>
                                                        <a href={`tel:${leaseInfo.landlord.phoneNumber}`}>
                                                            <Phone className="w-4 h-4" /> Call Landlord
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Important Dates */}
                                    <Card className="border-border/50 -sm bg-blue-50/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <CalendarDays className="w-5 h-5 text-blue-500" /> Key Dates
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Move-in Date</p>
                                                <p className="text-sm font-medium">{format(new Date(leaseInfo.leaseStart), "MMMM d, yyyy")}</p>
                                            </div>
                                            <div className="w-full h-px bg-border/50" />
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lease Expiry</p>
                                                <p className="text-sm font-medium">{format(new Date(leaseInfo.leaseEnd), "MMMM d, yyyy")}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                </div>
                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
