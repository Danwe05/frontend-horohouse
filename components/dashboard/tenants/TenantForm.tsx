"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api";

interface TenantFormData {
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string;
    propertyId: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    depositAmount: number;
    status: 'active' | 'ended' | 'pending';
    notes: string;
}

interface TenantFormProps {
    formData: TenantFormData;
    setFormData: (data: TenantFormData) => void;
    saving: boolean;
}

interface PropertyOption {
    id: string;
    title: string;
    address: string;
    city: string;
}

export function TenantForm({ formData, setFormData, saving }: TenantFormProps) {
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [propertyError, setPropertyError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoadingProperties(true);
                setPropertyError(null);
                const response = await apiClient.getMyProperties();
                const props = response?.properties || response?.data || response || [];
                setProperties(
                    props.map((p: any) => ({
                        id: p._id || p.id,
                        title: p.title,
                        address: p.address,
                        city: p.city,
                    }))
                );
            } catch (err: any) {
                console.error("Failed to load properties:", err);
                setPropertyError("Could not load your properties.");
            } finally {
                setLoadingProperties(false);
            }
        };
        fetchProperties();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            {/* Name */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                <Input
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    placeholder="e.g. John Doe"
                    disabled={saving}
                />
            </div>

            {/* Property Dropdown — replaces freeform text input */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property *</label>
                {loadingProperties ? (
                    <div className="h-11 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                ) : propertyError ? (
                    <p className="text-xs text-rose-500 pt-2">{propertyError}</p>
                ) : properties.length === 0 ? (
                    <p className="text-xs text-slate-400 pt-2">
                        No properties found. Create a property listing first.
                    </p>
                ) : (
                    <select
                        value={formData.propertyId}
                        onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        disabled={saving}
                    >
                        <option value="">Select a property...</option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.title} — {p.city}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="col-span-full h-px bg-slate-100 my-2" />

            {/* Email */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <Input
                    type="email"
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.tenantEmail}
                    onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                    placeholder="john@example.com"
                    disabled={saving}
                />
            </div>

            {/* Phone */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <Input
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                    placeholder="+237..."
                    disabled={saving}
                />
            </div>

            <div className="col-span-full h-px bg-slate-100 my-2" />

            {/* Lease Start */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lease Start *</label>
                <Input
                    type="date"
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.leaseStart}
                    onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
                    disabled={saving}
                />
            </div>

            {/* Lease End */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lease End *</label>
                <Input
                    type="date"
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.leaseEnd}
                    onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
                    disabled={saving}
                />
            </div>

            <div className="col-span-full h-px bg-slate-100 my-2" />

            {/* Monthly Rent */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Rent (XAF) *</label>
                <Input
                    type="number"
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.monthlyRent || ""}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                    placeholder="e.g. 150000"
                    disabled={saving}
                />
            </div>

            {/* Deposit */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposit Amount (XAF)</label>
                <Input
                    type="number"
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                    value={formData.depositAmount || ""}
                    onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                    placeholder="e.g. 300000"
                    disabled={saving}
                />
            </div>

            {/* Status */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lease Status</label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border transition-all"
                    disabled={saving}
                >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="ended">Ended</option>
                </select>
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-full">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special terms, requests, or notes..."
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={saving}
                />
            </div>
        </div>
    );
}