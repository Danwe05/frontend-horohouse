"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, CircleDollarSign, User as UserIcon, Mail, Phone, FileText, ArrowLeft, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
                    setLeaseInfo(data.leases[0]);
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#222222]"></div>
            </div>
        );
    }

    if (!leaseInfo) {
        return (
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-white">
                    <AppSidebar />
                    <SidebarInset className="border-l border-[#EBEBEB]">
                        <NavDash />
                        <main className="flex-1 p-6 lg:p-12 flex flex-col items-center justify-center">
                            <div className="max-w-[400px] text-center">
                                <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-8 h-8 text-[#222222] stroke-[1.5]" />
                                </div>
                                <h2 className="text-[26px] font-semibold text-[#222222] mb-3">No active lease found</h2>
                                <p className="text-[#717171] mb-8 leading-relaxed">
                                    You are not currently listed as a tenant for any properties. Once a landlord creates your lease, it will appear here.
                                </p>
                                <Button 
                                    onClick={() => router.push('/dashboard')}
                                    className="h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold"
                                >
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

    const formatFCFA = (amount: number) => {
        return new Intl.NumberFormat("fr-CM", {
            style: "currency",
            currency: "XAF",
            minimumFractionDigits: 0,
        }).format(amount).replace("FCFA", "FCFA");
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset className="border-l border-[#EBEBEB]">
                    <NavDash />

                    <main className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-[#EBEBEB]">
                            <div>
                                <button 
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 text-[14px] font-semibold text-[#222222] underline mb-4 hover:text-[#717171] transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <h1 className="text-[32px] font-semibold text-[#222222] tracking-tight">Lease Details</h1>
                                <p className="text-[#717171] text-[16px] mt-1">Manage your rental agreement and landlord communications.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[13px] font-bold border",
                                    isActive ? "bg-[#EBFBF0] text-[#008A05] border-[#008A05]/20" : 
                                    isPending ? "bg-[#FFF7ED] text-[#C2410C] border-[#C2410C]/20" : 
                                    "bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]"
                                )}>
                                    {leaseInfo.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Main Info - Left Column */}
                            <div className="lg:col-span-2 space-y-12">
                                
                                {/* Property Overview */}
                                <section>
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Property information</h3>
                                    <div className="rounded-2xl border border-[#DDDDDD] overflow-hidden bg-white hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row">
                                            {leaseInfo.property?.image && (
                                                <div className="sm:w-1/3 h-48 sm:h-auto overflow-hidden">
                                                    <img 
                                                        src={leaseInfo.property.image} 
                                                        className="w-full h-full object-cover" 
                                                        alt="Property" 
                                                    />
                                                </div>
                                            )}
                                            <div className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-[18px] font-semibold text-[#222222] mb-2">{leaseInfo.property?.title}</h4>
                                                    <div className="flex items-start gap-2 text-[#717171]">
                                                        <MapPin className="w-4 h-4 mt-1 shrink-0" />
                                                        <p className="text-[15px]">
                                                            {leaseInfo.property?.address}, {leaseInfo.property?.city}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link 
                                                    href={`/properties/${leaseInfo.property?.id}`}
                                                    className="inline-flex items-center text-[14px] font-semibold text-[#222222] underline mt-6 hover:text-[#717171]"
                                                >
                                                    View listing details <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Payment Terms */}
                                <section className="pt-8 border-t border-[#EBEBEB]">
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Payment terms</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[14px] font-bold uppercase tracking-wider text-[#717171]">Monthly Rent</p>
                                            <p className="text-[24px] font-semibold text-[#222222]">{formatFCFA(leaseInfo.monthlyRent)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[14px] font-bold uppercase tracking-wider text-[#717171]">Security Deposit</p>
                                            <p className="text-[24px] font-semibold text-[#222222]">
                                                {leaseInfo.depositAmount ? formatFCFA(leaseInfo.depositAmount) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {leaseInfo.notes && (
                                        <div className="mt-8 p-6 bg-[#F7F7F7] rounded-xl border border-[#EBEBEB]">
                                            <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Additional notes</h4>
                                            <p className="text-[15px] text-[#717171] leading-relaxed italic">"{leaseInfo.notes}"</p>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Sidebar Info - Right Column */}
                            <div className="space-y-10">
                                
                                {/* Dates Widget */}
                                <div className="p-6 bg-[#222222] text-white rounded-2xl">
                                    <h4 className="text-[18px] font-semibold mb-6 flex items-center gap-2">
                                        <CalendarDays className="w-5 h-5" /> Timeline
                                    </h4>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[12px] font-bold uppercase text-[#717171]">Move-in Date</p>
                                            <p className="text-[16px] font-medium mt-1">{format(new Date(leaseInfo.leaseStart), "MMMM d, yyyy")}</p>
                                        </div>
                                        <div className="h-px bg-white/10" />
                                        <div>
                                            <p className="text-[12px] font-bold uppercase text-[#717171]">Lease Expiry</p>
                                            <p className="text-[16px] font-medium mt-1">{format(new Date(leaseInfo.leaseEnd), "MMMM d, yyyy")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Landlord Contact */}
                                <div className="p-6 border border-[#DDDDDD] rounded-2xl bg-white">
                                    <h4 className="text-[18px] font-semibold text-[#222222] mb-6">Your landlord</h4>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-16 w-16 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center overflow-hidden shrink-0">
                                            {leaseInfo.landlord.profilePicture ? (
                                                <img src={leaseInfo.landlord.profilePicture} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <UserIcon className="w-8 h-8 text-[#222222] stroke-[1.5]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[18px] font-semibold text-[#222222] truncate">{leaseInfo.landlord.name}</p>
                                            <p className="text-[14px] text-[#717171]">Host / Manager</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid gap-3">
                                        <Button className="h-12 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold" asChild>
                                            <a href={`mailto:${leaseInfo.landlord.email}`}>
                                                <Mail className="w-4 h-4 mr-2" /> Message
                                            </a>
                                        </Button>
                                        {leaseInfo.landlord.phoneNumber && (
                                            <Button variant="outline" className="h-12 rounded-lg border-[#222222] text-[#222222] hover:bg-[#F7F7F7] font-semibold" asChild>
                                                <a href={`tel:${leaseInfo.landlord.phoneNumber}`}>
                                                    <Phone className="w-4 h-4 mr-2" /> Call
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}