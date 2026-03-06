'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import {
    ArrowLeft, Mail, Phone, MapPin, DollarSign, Home, Tag, User2,
    Calendar, Pencil, Trash2, Plus, Loader2, MessageSquare, Clock,
    CheckCircle2, AlertCircle, XCircle, Send,
} from 'lucide-react';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';
type LeadPriority = 'low' | 'medium' | 'high';

type LeadNote = {
    _id?: string;
    content: string;
    createdAt: string;
};

type Lead = {
    id?: string;
    _id?: string;
    name: string;
    email?: string;
    phone?: string;
    interest?: string;
    source: 'website' | 'referral' | 'message' | 'campaign';
    status: LeadStatus;
    location?: string;
    createdAt: string;
    updatedAt?: string;
    lastContactedAt?: string;
    budget?: number;
    propertyType?: string;
    priority?: LeadPriority;
    assignedAgent?: string;
    tags?: string[];
    notes?: LeadNote[];
};

const statusConfig: Record<LeadStatus, { label: string; className: string; icon: React.ElementType }> = {
    new: { label: 'New', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertCircle },
    contacted: { label: 'Contacted', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: MessageSquare },
    qualified: { label: 'Qualified', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    lost: { label: 'Lost', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const sourceBadge: Record<string, { label: string; className: string }> = {
    website: { label: 'Website', className: 'bg-slate-50 text-slate-700 border-slate-200' },
    referral: { label: 'Referral', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    message: { label: 'Message', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    campaign: { label: 'Campaign', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

const priorityBadge: Record<LeadPriority, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    medium: { label: 'Medium', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    high: { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' },
};

function formatDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function formatDateTime(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatCurrency(value?: number) {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const leadId = params.id as string;

    const [lead, setLead] = useState<Lead | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState<Partial<Lead>>({});
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Note state
    const [noteContent, setNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Status update
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const data = await apiClient.getLead(leadId);
                setLead(data);
            } catch (error) {
                console.error('Failed to fetch lead:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLead();
    }, [leadId]);

    const handleStatusChange = async (newStatus: LeadStatus) => {
        if (!lead) return;
        setIsStatusUpdating(true);
        try {
            const updated = await apiClient.updateLead(lead._id || lead.id || '', { status: newStatus });
            setLead(updated);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const handleEdit = async () => {
        if (!lead) return;
        setIsUpdating(true);
        try {
            const updated = await apiClient.updateLead(lead._id || lead.id || '', editData);
            setLead(updated);
            setIsEditOpen(false);
        } catch (error) {
            console.error('Failed to update lead:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!lead) return;
        setIsDeleting(true);
        try {
            await apiClient.deleteLead(lead._id || lead.id || '');
            router.push('/dashboard/leads');
        } catch (error) {
            console.error('Failed to delete lead:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddNote = async () => {
        if (!lead || !noteContent.trim()) return;
        setIsAddingNote(true);
        try {
            const updated = await apiClient.addLeadNote(lead._id || lead.id || '', noteContent.trim());
            setLead(updated);
            setNoteContent('');
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsAddingNote(false);
        }
    };

    const openEdit = () => {
        if (!lead) return;
        setEditData({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            location: lead.location,
            interest: lead.interest,
            source: lead.source,
            status: lead.status,
            budget: lead.budget,
            propertyType: lead.propertyType,
            priority: lead.priority,
            assignedAgent: lead.assignedAgent,
            tags: lead.tags,
        });
        setIsEditOpen(true);
    };

    // Info row helper
    const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
            <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm text-slate-900 mt-0.5 break-words">{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />

                    <main className="flex-1 bg-gray-50">
                        <div className="lg:p-6 space-y-6 p-4">
                            {/* Back button */}
                            <Button variant="ghost" className="gap-2 -ml-2 text-slate-600" onClick={() => router.push('/dashboard/leads')}>
                                <ArrowLeft className="w-4 h-4" />
                                Back to Leads
                            </Button>

                            {isLoading ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
                                        <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
                                    </div>
                                </div>
                            ) : !lead ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <p className="text-slate-500">Lead not found</p>
                                        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/leads')}>
                                            Back to Leads
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
                                            <Badge variant="outline" className={statusConfig[lead.status].className}>
                                                {statusConfig[lead.status].label}
                                            </Badge>
                                            {lead.priority && (
                                                <Badge variant="outline" className={priorityBadge[lead.priority].className}>
                                                    {lead.priority} priority
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className={sourceBadge[lead.source]?.className}>
                                                {sourceBadge[lead.source]?.label}
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2">
                                            <Select value={lead.status} onValueChange={(v) => handleStatusChange(v as LeadStatus)} disabled={isStatusUpdating}>
                                                <SelectTrigger className="w-[150px]">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">New</SelectItem>
                                                    <SelectItem value="contacted">Contacted</SelectItem>
                                                    <SelectItem value="qualified">Qualified</SelectItem>
                                                    <SelectItem value="lost">Lost</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="outline" className="gap-2" onClick={openEdit}>
                                                <Pencil className="w-4 h-4" />
                                                Edit
                                            </Button>
                                            <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setIsDeleteOpen(true)}>
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Two-column layout */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Contact & Property Info */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">Lead Information</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <InfoItem icon={Mail} label="Email" value={lead.email} />
                                                <InfoItem icon={Phone} label="Phone" value={lead.phone} />
                                                <InfoItem icon={MapPin} label="Location" value={lead.location} />
                                                <InfoItem icon={Home} label="Interest" value={lead.interest} />
                                                <InfoItem icon={DollarSign} label="Budget" value={formatCurrency(lead.budget)} />
                                                <InfoItem icon={Home} label="Property Type" value={lead.propertyType} />
                                                <InfoItem icon={User2} label="Assigned Agent" value={lead.assignedAgent} />
                                                <InfoItem icon={Calendar} label="Created" value={formatDate(lead.createdAt)} />
                                                <InfoItem icon={Clock} label="Last Contacted" value={lead.lastContactedAt ? formatDateTime(lead.lastContactedAt) : undefined} />
                                                {lead.tags && lead.tags.length > 0 && (
                                                    <div className="flex items-start gap-3 py-3">
                                                        <Tag className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {lead.tags.map((tag) => (
                                                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Notes / Activity Timeline */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">Notes & Activity</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Add Note Form */}
                                                <div className="flex gap-2">
                                                    <Textarea
                                                        value={noteContent}
                                                        onChange={(e) => setNoteContent(e.target.value)}
                                                        placeholder="Add a note about this lead..."
                                                        className="min-h-[60px] resize-none flex-1"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        className="shrink-0 self-end"
                                                        disabled={!noteContent.trim() || isAddingNote}
                                                        onClick={handleAddNote}
                                                    >
                                                        {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                    </Button>
                                                </div>

                                                {/* Timeline */}
                                                <div className="space-y-1">
                                                    {(!lead.notes || lead.notes.length === 0) && (
                                                        <p className="text-sm text-slate-400 text-center py-8">No notes yet. Add one above.</p>
                                                    )}
                                                    {lead.notes && [...lead.notes].reverse().map((note, idx) => (
                                                        <div key={note._id || idx} className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{note.content}</p>
                                                                <p className="text-xs text-slate-400 mt-1">{formatDateTime(note.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                </SidebarInset>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Lead</DialogTitle>
                        <DialogDescription>Update the lead details below.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name *</Label>
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Phone</Label>
                            <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Location</Label>
                            <Input value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Interest</Label>
                            <Input value={editData.interest} onChange={(e) => setEditData({ ...editData, interest: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Budget</Label>
                            <Input type="number" value={editData.budget ?? ''} onChange={(e) => setEditData({ ...editData, budget: e.target.value ? Number(e.target.value) : undefined })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Property Type</Label>
                            <Input value={editData.propertyType} onChange={(e) => setEditData({ ...editData, propertyType: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Agent</Label>
                            <Input value={editData.assignedAgent} onChange={(e) => setEditData({ ...editData, assignedAgent: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Source</Label>
                            <Select value={editData.source} onValueChange={(v) => setEditData({ ...editData, source: v as any })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="message">Message</SelectItem>
                                    <SelectItem value="campaign">Campaign</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Status</Label>
                            <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as any })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Priority</Label>
                            <Select value={editData.priority ?? ''} onValueChange={(v) => setEditData({ ...editData, priority: v as any })}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select priority" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={!editData.name || isUpdating}>
                            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Lead
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{lead?.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarProvider>
    );
}
