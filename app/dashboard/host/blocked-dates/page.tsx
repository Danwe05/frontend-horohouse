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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
            {/* Soft Neutral Background */}
            <div className="flex min-h-screen w-full bg-[#fafafa] text-zinc-900">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full space-y-10">

                        {/* ── Header: Sophisticated & Clean ── */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                                        <CalendarIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Availability</h1>
                                </div>
                                <p className="text-zinc-500 text-sm font-medium">Manage blackout dates and seasonal closures.</p>
                            </div>
                            <Badge variant="outline" className="w-fit px-3 py-1 border-zinc-300 text-zinc-600 font-medium bg-white">
                                Host Dashboard
                            </Badge>
                        </div>

                        {/* ── Main Layout ── */}
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">

                            {/* Sidebar Area: Property & List (4 cols) */}
                            <div className="space-y-8 lg:col-span-4">
                                <section className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Select Property</label>
                                    <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                                        <CardContent className="p-4">
                                            {loadingProperties ? (
                                                <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></div>
                                            ) : (
                                                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                                    <SelectTrigger className="w-full border-none bg-zinc-50 hover:bg-zinc-100 transition-colors focus:ring-0 shadow-none h-12">
                                                        <SelectValue placeholder="Choose a property" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-zinc-200">
                                                        {properties.map(p => (
                                                            <SelectItem key={p._id} value={p._id} className="py-3 focus:bg-emerald-50 focus:text-emerald-700">
                                                                {p.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </CardContent>
                                    </Card>
                                </section>

                                <section className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Current Restrictions</label>
                                    <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                                        <CardContent className="p-0">
                                            {loadingRanges ? (
                                                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-300" /></div>
                                            ) : blockedRanges.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                                        <CheckCircle2 className="h-6 w-6 text-zinc-300" />
                                                    </div>
                                                    <p className="text-sm text-zinc-400 font-medium">Fully available</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
                                                    {blockedRanges.map((range, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-5 hover:bg-zinc-50/80 transition-all group">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-bold text-zinc-800">
                                                                    {format(parseISO(range.from), 'MMM d')} – {format(parseISO(range.to), 'MMM d')}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                                                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-tighter">
                                                                        {range.reason || 'Manual Block'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleUnblock(range.from)}
                                                                className="h-9 w-9 p-0 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </section>
                            </div>

                            {/* Main Content: Calendar Area (8 cols) */}
                            <div className="lg:col-span-8 space-y-6">
                                <Card className="border-zinc-200 shadow-xl shadow-zinc-200/50 rounded-[2rem] bg-white overflow-hidden">
                                    <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-8">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-bold text-zinc-800">Availability Grid</CardTitle>
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] px-2">Live Sync</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {selectedPropertyId ? (
                                            <div className="space-y-10">
                                                <div className="calendar-modern-wrapper">
                                                    <AvailabilityCalendar
                                                        key={selectedPropertyId}
                                                        propertyId={selectedPropertyId}
                                                        onRangeSelect={setSelection}
                                                        value={selection}
                                                    />
                                                </div>

                                                {selection && (
                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-[1.5rem] bg-zinc-900 text-white shadow-2xl animate-in zoom-in-95 duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                                                                <Plus className="h-6 w-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-zinc-100 uppercase tracking-widest text-[10px]">Blocking Selection</p>
                                                                <p className="text-lg font-medium text-white">
                                                                    {format(selection[0], 'MMM d')} – {format(selection[1], 'MMM d, yyyy')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10" onClick={() => setSelection(null)}>Discard</Button>
                                                            <Button
                                                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 rounded-xl h-12 shadow-lg shadow-emerald-900/20"
                                                                onClick={() => setBlockDialogOpen(true)}
                                                            >
                                                                Restrict Dates
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                                <Building2 className="h-20 w-20 text-zinc-100 mb-6" />
                                                <p className="text-zinc-400 font-medium">Select a property to view availability.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Bottom Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-[2rem] bg-amber-50/40 border border-amber-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <AlertCircle className="h-5 w-5 text-amber-600" />
                                            <h3 className="text-sm font-bold text-amber-900">Why block dates?</h3>
                                        </div>
                                        <ul className="text-xs text-amber-800/80 space-y-2 font-medium">
                                            <li>• Maintain the property or perform cleaning</li>
                                            <li>• Sync dates from offline booking sources</li>
                                            <li>• Reserve specific weeks for personal use</li>
                                        </ul>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-zinc-100/50 border border-zinc-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle2 className="h-5 w-5 text-zinc-600" />
                                            <h3 className="text-sm font-bold text-zinc-900">Syncing</h3>
                                        </div>
                                        <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                                            Blocked dates are immediately removed from your public listing. 
                                            Existing confirmed guest bookings take priority and cannot be manually blocked.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>

            {/* ── Block Dialog: Polished ── */}
            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Add Note</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Provide a reason for this blackout. This is for your records only.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Textarea
                            placeholder="e.g. Roof repair, Family visiting..."
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            className="resize-none border-zinc-200 bg-zinc-50 focus-visible:ring-emerald-500 rounded-xl p-4"
                            rows={3}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="rounded-xl font-bold text-zinc-500" onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-bold"
                            onClick={handleBlock}
                            disabled={blocking}
                        >
                            {blocking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );

}