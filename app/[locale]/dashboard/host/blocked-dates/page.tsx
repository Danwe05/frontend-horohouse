'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
    Calendar as CalendarIcon, Loader2, AlertCircle, Plus, Trash2,
    Building2, CheckCircle2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AvailabilityCalendar from '@/components/dashboard/AvailabilityCalendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

export default function BlockedDatesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [blockedRanges, setBlockedRanges] = useState<any[]>([]);
    const [loadingRanges, setLoadingRanges] = useState(false);

    const [selection, setSelection] = useState<[Date, Date] | null>(null);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [blocking, setBlocking] = useState(false);

    // Fetch host's short-term properties
    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.getMyProperties({ listingType: 'short_term' });
                const list = res.properties || [];
                setProperties(list);
                if (list.length > 0) {
                    setSelectedPropertyId(list[0]._id);
                }
            } catch (err) {
                toast.error('Failed to load your properties.');
            } finally {
                setLoadingProperties(false);
            }
        })();
    }, []);

    const fetchBlockedDates = useCallback(async () => {
        if (!selectedPropertyId) return;
        setLoadingRanges(true);
        try {
            const res = await apiClient.getBlockedDates(selectedPropertyId);
            // API may return an array directly, or wrap it in a property
            const list = Array.isArray(res) ? res : (res?.blockedDates ?? res?.data ?? res?.ranges ?? []);
            setBlockedRanges(list);
        } catch (err) {
            toast.error('Failed to load blocked dates.');
        } finally {
            setLoadingRanges(false);
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        fetchBlockedDates();
    }, [fetchBlockedDates]);

    async function handleBlock() {
        if (!selection || !selectedPropertyId) return;
        setBlocking(true);
        try {
            await apiClient.blockDates(selectedPropertyId, [
                {
                    from: format(selection[0], 'yyyy-MM-dd'),
                    to: format(selection[1], 'yyyy-MM-dd'),
                    reason: blockReason || 'Manually blocked',
                },
            ]);
            toast.success('Dates blocked successfully.');
            setSelection(null);
            setBlockReason('');
            setBlockDialogOpen(false);
            fetchBlockedDates();
        } catch (err) {
            toast.error('Failed to block dates.');
        } finally {
            setBlocking(false);
        }
    }

    async function handleUnblock(fromDate: string) {
        if (!selectedPropertyId) return;
        try {
            await apiClient.unblockDates(selectedPropertyId, [fromDate]);
            toast.success('Dates unblocked.');
            fetchBlockedDates();
        } catch (err) {
            toast.error('Failed to unblock dates.');
        }
    }

    const selectedProperty = properties.find(p => p._id === selectedPropertyId);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white text-[#222222]">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />
                    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">

                        {/* ── Header ── */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#DDDDDD]">
                            <div>
                                <h1 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-1">Availability</h1>
                                <p className="text-[16px] text-[#717171]">Manage blackout dates and seasonal closures for your properties.</p>
                            </div>
                        </div>

                        {/* ── Main Layout ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                            {/* Sidebar Area: Property & List (4 cols) */}
                            <div className="space-y-8 lg:col-span-4">
                                <section className="space-y-4">
                                    <label className="text-[16px] font-semibold text-[#222222]">Select property</label>
                                    {loadingProperties ? (
                                        <div className="h-14 border border-[#DDDDDD] rounded-xl flex items-center justify-center bg-[#F7F7F7]">
                                            <Loader2 className="h-5 w-5 animate-spin text-[#222222]" />
                                        </div>
                                    ) : (
                                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                            <SelectTrigger className="w-full h-14 bg-white border-[#DDDDDD] hover:border-blue-600 text-[15px] text-[#222222] rounded-xl focus:ring-0 focus:ring-offset-0 transition-colors">
                                                <SelectValue placeholder="Choose a property" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-[#DDDDDD] shadow-lg">
                                                {properties.map(p => (
                                                    <SelectItem key={p._id} value={p._id} className="py-3 text-[15px] focus:bg-[#F7F7F7] cursor-pointer">
                                                        {p.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[16px] font-semibold text-[#222222]">Current restrictions</label>
                                        <span className="text-[14px] text-[#717171]">{blockedRanges.length} active</span>
                                    </div>

                                    <div className="border border-[#DDDDDD] rounded-2xl overflow-hidden bg-white shadow-sm">
                                        {loadingRanges ? (
                                            <div className="flex justify-center py-16">
                                                <Loader2 className="h-6 w-6 animate-spin text-[#222222]" />
                                            </div>
                                        ) : blockedRanges.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-[#F7F7F7]">
                                                <div className="w-12 h-12 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                    <CheckCircle2 className="h-5 w-5 text-[#008A05] stroke-[2]" />
                                                </div>
                                                <p className="text-[15px] text-[#222222] font-semibold">Fully available</p>
                                                <p className="text-[14px] text-[#717171] mt-1">No manually blocked dates.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-[#DDDDDD] max-h-[400px] overflow-y-auto">
                                                {blockedRanges.map((range, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-5 hover:bg-[#F7F7F7] transition-colors group">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[15px] font-semibold text-[#222222]">
                                                                {format(parseISO(range.from), 'MMM d')} – {format(parseISO(range.to), 'MMM d')}
                                                            </p>
                                                            <p className="text-[13px] text-[#717171] line-clamp-1 max-w-[200px]">
                                                                {range.reason || 'Manual block'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleUnblock(range.from)}
                                                            className="h-10 w-10 rounded-full text-[#717171] hover:text-[#E50000] hover:bg-[#FFF8F8] transition-colors"
                                                            title="Unblock dates"
                                                        >
                                                            <Trash2 className="h-4 w-4 stroke-[2]" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Main Content: Calendar Area (8 cols) */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="border border-[#DDDDDD] rounded-2xl bg-white shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-[#DDDDDD] flex items-center justify-between bg-white">
                                        <h2 className="text-[18px] font-semibold text-[#222222]">Calendar grid</h2>
                                    </div>
                                    <div className="p-6 sm:p-8">
                                        {selectedPropertyId ? (
                                            <div className="space-y-8">
                                                <div>
                                                    <AvailabilityCalendar
                                                        key={selectedPropertyId}
                                                        propertyId={selectedPropertyId}
                                                        onRangeSelect={setSelection}
                                                        value={selection}
                                                    />
                                                </div>

                                                {selection && (
                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-[#DDDDDD] bg-[#F7F7F7] animate-in zoom-in-95 duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-full bg-white border border-[#DDDDDD] flex items-center justify-center shadow-sm">
                                                                <CalendarIcon className="h-5 w-5 text-[#222222] stroke-[1.5]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider mb-0.5">Selected dates</p>
                                                                <p className="text-[16px] font-semibold text-[#222222]">
                                                                    {format(selection[0], 'MMM d')} – {format(selection[1], 'MMM d, yyyy')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                                            <Button variant="ghost" className="h-12 px-6 rounded-lg text-[#222222] hover:bg-white font-semibold text-[15px]" onClick={() => setSelection(null)}>
                                                                Clear
                                                            </Button>
                                                            <Button
                                                                className="h-12 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors"
                                                                onClick={() => setBlockDialogOpen(true)}
                                                            >
                                                                Block dates
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-32 text-center bg-[#F7F7F7] rounded-xl border border-[#DDDDDD]">
                                                <Building2 className="h-12 w-12 text-[#717171] mb-4 stroke-[1.5]" />
                                                <p className="text-[#222222] font-semibold text-[16px]">No property selected</p>
                                                <p className="text-[#717171] text-[14px] mt-1">Please select a property from the sidebar to view its calendar.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <AlertCircle className="h-5 w-5 text-[#222222] stroke-[2]" />
                                            <h3 className="text-[16px] font-semibold text-[#222222]">Why block dates?</h3>
                                        </div>
                                        <ul className="text-[14px] text-[#717171] space-y-3">
                                            <li className="flex items-start gap-2"><span className="text-[#222222]">•</span> Maintain the property or perform cleaning</li>
                                            <li className="flex items-start gap-2"><span className="text-[#222222]">•</span> Sync dates from offline booking sources</li>
                                            <li className="flex items-start gap-2"><span className="text-[#222222]">•</span> Reserve specific weeks for personal use</li>
                                        </ul>
                                    </div>

                                    <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <CheckCircle2 className="h-5 w-5 text-[#222222] stroke-[2]" />
                                            <h3 className="text-[16px] font-semibold text-[#222222]">How it works</h3>
                                        </div>
                                        <p className="text-[14px] text-[#717171] leading-relaxed">
                                            Blocked dates are immediately removed from your public listing's availability.
                                            Existing confirmed guest bookings take priority and cannot be manually blocked over.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>

            {/* ── Block Dialog ── */}
            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 border-[#DDDDDD] shadow-2xl overflow-hidden">
                    <div className="p-8">
                        <DialogHeader className="mb-6 text-left space-y-2">
                            <DialogTitle className="text-[22px] font-semibold text-[#222222]">Block dates</DialogTitle>
                            <DialogDescription className="text-[15px] text-[#717171]">
                                Provide a reason for this blackout. This is for your records only and won't be shown to guests.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mb-8">
                            <label className="text-[14px] font-semibold text-[#222222] mb-2 block">Reason (Optional)</label>
                            <Textarea
                                placeholder="e.g., Roof repair, Family visiting..."
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                className="resize-none h-28 border-[#DDDDDD] bg-white text-[15px] p-4 placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-[#222222] focus-visible:border-blue-600 rounded-xl"
                            />
                        </div>

                        <DialogFooter className="gap-3 sm:space-x-0">
                            <Button variant="outline" className="w-full sm:w-1/2 h-12 rounded-lg font-semibold text-[15px] border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={() => setBlockDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="w-full sm:w-1/2 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors"
                                onClick={handleBlock}
                                disabled={blocking}
                            >
                                {blocking ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Confirm block'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}