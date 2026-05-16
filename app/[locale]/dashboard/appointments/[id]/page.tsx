'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import {
    ArrowLeft, Calendar, Clock, MapPin, Mail, Phone, User2, Video,
    Pencil, Trash2, Loader2, Send, Home, FileText, Timer,
    CheckCircle2, XCircle, AlertCircle,
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

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

type AppointmentNote = {
    _id?: string;
    content: string;
    createdAt: string;
};

type Appointment = {
    id?: string;
    _id?: string;
    title: string;
    property?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    type: 'in-person' | 'virtual';
    location?: string;
    description?: string;
    date: string;
    duration?: number;
    status: AppointmentStatus;
    reminderSent?: boolean;
    notes?: AppointmentNote[];
    createdAt?: string;
    updatedAt?: string;
};

const statusConfig: Record<AppointmentStatus, { label: string; className: string; icon: React.ElementType }> = {
    scheduled: { label: 'Scheduled', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertCircle },
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

function formatDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatTime(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState<Partial<Appointment>>({});
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
        const fetchAppointment = async () => {
            try {
                const data = await apiClient.getAppointment(appointmentId);
                setAppointment(data);
            } catch (error) {
                console.error('Failed to fetch appointment:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointment();
    }, [appointmentId]);

    const handleStatusChange = async (newStatus: AppointmentStatus) => {
        if (!appointment) return;
        setIsStatusUpdating(true);
        try {
            const updated = await apiClient.updateAppointment(appointment._id || appointment.id || '', { status: newStatus });
            setAppointment(updated);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const handleEdit = async () => {
        if (!appointment) return;
        setIsUpdating(true);
        try {
            const payload: any = { ...editData };
            if (payload.date) payload.date = new Date(payload.date).toISOString();
            const updated = await apiClient.updateAppointment(appointment._id || appointment.id || '', payload);
            setAppointment(updated);
            setIsEditOpen(false);
        } catch (error) {
            console.error('Failed to update appointment:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!appointment) return;
        setIsDeleting(true);
        try {
            await apiClient.deleteAppointment(appointment._id || appointment.id || '');
            router.push('/dashboard/appointments');
        } catch (error) {
            console.error('Failed to delete appointment:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddNote = async () => {
        if (!appointment || !noteContent.trim()) return;
        setIsAddingNote(true);
        try {
            const updated = await apiClient.addAppointmentNote(appointment._id || appointment.id || '', noteContent.trim());
            setAppointment(updated);
            setNoteContent('');
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsAddingNote(false);
        }
    };

    const openEdit = () => {
        if (!appointment) return;
        const localDate = appointment.date ? new Date(appointment.date).toISOString().slice(0, 16) : '';
        setEditData({
            title: appointment.title,
            clientName: appointment.clientName,
            clientEmail: appointment.clientEmail,
            clientPhone: appointment.clientPhone,
            type: appointment.type,
            location: appointment.location,
            description: appointment.description,
            property: appointment.property,
            date: localDate,
            duration: appointment.duration,
            status: appointment.status,
        });
        setIsEditOpen(true);
    };

    const InfoItem = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className: string }>; label: string; value: React.ReactNode }) => (
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
                            <Button variant="ghost" className="gap-2 -ml-2 text-slate-600" onClick={() => router.push('/dashboard/appointments')}>
                                <ArrowLeft className="w-4 h-4" />
                                Back to Appointments
                            </Button>

                            {isLoading ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
                                        <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
                                    </div>
                                </div>
                            ) : !appointment ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <p className="text-slate-500">Appointment not found</p>
                                        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/appointments')}>Back to Appointments</Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-bold text-slate-900">{appointment.title}</h1>
                                            <Badge variant="outline" className={statusConfig[appointment.status].className}>
                                                {statusConfig[appointment.status].label}
                                            </Badge>
                                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                                {appointment.type === 'virtual' ? '🖥 Virtual' : '📍 In-person'}
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2">
                                            <Select value={appointment.status} onValueChange={(v) => handleStatusChange(v as AppointmentStatus)} disabled={isStatusUpdating}>
                                                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">Appointment Details</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <InfoItem icon={User2} label="Client" value={appointment.clientName} />
                                                <InfoItem icon={Mail} label="Email" value={appointment.clientEmail} />
                                                <InfoItem icon={Phone} label="Phone" value={appointment.clientPhone} />
                                                <InfoItem icon={Home} label="Property" value={appointment.property} />
                                                <InfoItem icon={Calendar} label="Date" value={formatDate(appointment.date)} />
                                                <InfoItem icon={Clock} label="Time" value={formatTime(appointment.date)} />
                                                <InfoItem icon={Timer} label="Duration" value={appointment.duration ? `${appointment.duration} minutes` : undefined} />
                                                <InfoItem icon={appointment.type === 'virtual' ? Video : MapPin} label={appointment.type === 'virtual' ? 'Meeting Link' : 'Location'} value={appointment.location} />
                                                {appointment.description && (
                                                    <InfoItem icon={FileText} label="Description" value={appointment.description} />
                                                )}
                                                <InfoItem icon={Calendar} label="Created" value={formatDate(appointment.createdAt)} />
                                            </CardContent>
                                        </Card>

                                        {/* Notes */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">Notes & Activity</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex gap-2">
                                                    <Textarea
                                                        value={noteContent}
                                                        onChange={(e) => setNoteContent(e.target.value)}
                                                        placeholder="Add a note..."
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

                                                <div className="space-y-1">
                                                    {(!appointment.notes || appointment.notes.length === 0) && (
                                                        <p className="text-sm text-slate-400 text-center py-8">No notes yet. Add one above.</p>
                                                    )}
                                                    {appointment.notes && [...appointment.notes].reverse().map((note, idx) => (
                                                        <div key={note._id || idx} className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
                                                            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
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
                        <DialogTitle>Edit Appointment</DialogTitle>
                        <DialogDescription>Update the appointment details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Title *</Label>
                            <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Client *</Label>
                            <Input value={editData.clientName} onChange={(e) => setEditData({ ...editData, clientName: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input type="email" value={editData.clientEmail} onChange={(e) => setEditData({ ...editData, clientEmail: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Phone</Label>
                            <Input value={editData.clientPhone} onChange={(e) => setEditData({ ...editData, clientPhone: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Property</Label>
                            <Input value={editData.property} onChange={(e) => setEditData({ ...editData, property: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Date *</Label>
                            <Input type="datetime-local" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Duration</Label>
                            <Input type="number" value={editData.duration ?? ''} onChange={(e) => setEditData({ ...editData, duration: e.target.value ? Number(e.target.value) : undefined })} className="col-span-3" placeholder="Minutes" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <Select value={editData.type} onValueChange={(v) => setEditData({ ...editData, type: v as any })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in-person">In-person</SelectItem>
                                    <SelectItem value="virtual">Virtual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Location</Label>
                            <Input value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Description</Label>
                            <Input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Status</Label>
                            <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as any })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={!editData.title || !editData.clientName || isUpdating}>
                            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{appointment?.title}</strong>? This cannot be undone.
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
