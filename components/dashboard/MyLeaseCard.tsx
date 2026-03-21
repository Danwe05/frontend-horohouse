"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, CircleDollarSign, User as UserIcon, Mail, Phone, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface LeaseInfo {
    _id: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    status: 'active' | 'ended' | 'pending';
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        image: string | null;
    } | null;
    landlord: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string;
        profilePicture: string | null;
    };
}

interface Props {
    lease: LeaseInfo;
}

export function MyLeaseCard({ lease }: Props) {
    const router = useRouter();

    if (!lease) return null;

    const isActive = lease.status === 'active';
    const isPending = lease.status === 'pending';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-CM", {
            style: "currency",
            currency: "XAF",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Card className="w-full h-full flex flex-col overflow-hidden border-border/50 -sm hover:-md transition- duration-300">
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Home className="w-5 h-5 text-blue-500" />
                            My Current Lease
                        </CardTitle>
                        <CardDescription className="mt-1.5 flex items-center gap-1.5 text-sm">
                            {lease.property ? (
                                <span className="truncate max-w-[250px] font-medium text-foreground">
                                    {lease.property.title || lease.property.address}
                                </span>
                            ) : (
                                "Property Details Unavailable"
                            )}
                        </CardDescription>
                    </div>

                    <Badge
                        variant={isActive ? "default" : isPending ? "secondary" : "outline"}
                        className={
                            isActive ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200" :
                                isPending ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200" : ""
                        }
                    >
                        {isActive ? "Active Lease" : isPending ? "Pending Approval" : "Ended"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <CircleDollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Monthly Rent</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                            {formatCurrency(lease.monthlyRent)}
                        </p>
                    </div>

                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Lease Term</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">
                            {format(new Date(lease.leaseStart), "MMM yyyy")} - {format(new Date(lease.leaseEnd), "MMM yyyy")}
                        </p>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Landlord</h4>
                    <div className="flex items-center gap-3 bg-card border rounded-lg p-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {lease.landlord.profilePicture ? (
                                <img src={lease.landlord.profilePicture} alt={lease.landlord.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{lease.landlord.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                                <a href={`mailto:${lease.landlord.email}`} className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 transition-colors">
                                    <Mail className="w-3 h-3" /> Email
                                </a>
                                {lease.landlord.phoneNumber && (
                                    <a href={`tel:${lease.landlord.phoneNumber}`} className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 transition-colors">
                                        <Phone className="w-3 h-3" /> Call
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-2 border-t bg-muted/20">
                <Button
                    variant="ghost"
                    className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 group"
                    onClick={() => router.push('/dashboard/lease')}
                >
                    View Full Lease Details
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
