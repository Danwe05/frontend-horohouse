'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/api';
import {
  Calendar, Clock, MapPin, User, Video, Plus, Search, Filter, Pencil,
  Trash2, Loader2, CheckCircle2, XCircle, TrendingUp, CalendarClock,
  X, ListFilter, ChevronLeft, ChevronRight, Phone, AlertCircle,
  RefreshCw, CalendarDays, List, RotateCcw,
} from 'lucide-react';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'no-show';
type AppointmentType = 'in-person' | 'virtual' | 'phone-call';

type AppointmentNote = { _id?: string; content: string; createdAt: string };

type AppointmentProperty = {
  _id: string; title: string; city?: string; address?: string;
  price?: number; type?: string; listingType?: string;
  images?: { url: string; isMain?: boolean }[];
};

type Appointment = {
  id?: string; _id?: string;
  title: string;
  property?: string;
  propertyId?: AppointmentProperty | string;
  clientName: string; clientEmail?: string; clientPhone?: string;
  type: AppointmentType;
  location?: string; description?: string;
  date: string; duration?: number;
  status: AppointmentStatus;
  reminderSent?: boolean;
  rescheduleHistory?: { from: string; to: string; reason?: string }[];
  notes?: AppointmentNote[];
  createdAt?: string;
};

type PaginatedAppointments = {
  appointments: Appointment[]; total: number; page: number; totalPages: number;
};

type AppointmentStats = {
  total: number; scheduled: number; rescheduled: number;
  completed: number; cancelled: number; noShow: number;
  upcoming: number; completionRate: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  rescheduled: { label: 'Rescheduled', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  'no-show': { label: 'No-Show', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const TYPE_ICON: Record<AppointmentType, React.ElementType> = {
  'in-person': MapPin, virtual: Video, 'phone-call': Phone,
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ appointments, onSelect }: { appointments: Appointment[]; onSelect: (a: Appointment) => void }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = currentMonth.getDay();

  const apptMap = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) {
      const key = new Date(a.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [appointments]);

  const today = new Date().toDateString();

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const cells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) => i < firstDayOfWeek ? null : i - firstDayOfWeek + 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <h2 className="font-bold text-slate-900">
          {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-slate-50" />;

          const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const key = d.toDateString();
          const dayAppts = apptMap[key] ?? [];
          const isToday = key === today;

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.015 }}
              className={cn(
                'min-h-[80px] border-b border-r border-slate-50 p-1.5 relative',
                isToday && 'bg-blue-50/40'
              )}
            >
              <div className={cn(
                'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                isToday ? 'bg-blue-600 text-white' : 'text-slate-600'
              )}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map(a => {
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.scheduled;
                  return (
                    <button
                      key={a._id}
                      onClick={() => onSelect(a)}
                      className={cn(
                        'w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer transition-opacity hover:opacity-80',
                        cfg.bg, cfg.text
                      )}
                    >
                      {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {a.title}
                    </button>
                  );
                })}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-slate-400 pl-1.5">+{dayAppts.length - 3} more</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Appointment Form Fields ──────────────────────────────────────────────────

function AppointmentFormFields({
  data, setData, conflictError
}: {
  data: Partial<Appointment>;
  setData: (d: Partial<Appointment>) => void;
  conflictError?: string;
}) {
  return (
    <div className="grid gap-3.5 py-2">
      {conflictError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{conflictError}</span>
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Title *</Label>
        <Input value={data.title ?? ''} onChange={e => setData({ ...data, title: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="Property Viewing" />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Client *</Label>
        <Input value={data.clientName ?? ''} onChange={e => setData({ ...data, clientName: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="John Doe" />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Email</Label>
        <Input type="email" value={data.clientEmail ?? ''} onChange={e => setData({ ...data, clientEmail: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="john@example.com" />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Phone</Label>
        <Input value={data.clientPhone ?? ''} onChange={e => setData({ ...data, clientPhone: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="+237..." />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Property</Label>
        <Input value={data.property ?? ''} onChange={e => setData({ ...data, property: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="Property name" />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Date & Time *</Label>
        <Input type="datetime-local" value={data.date ?? ''} onChange={e => setData({ ...data, date: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Duration</Label>
        <Input type="number" value={data.duration ?? ''} onChange={e => setData({ ...data, duration: e.target.value ? Number(e.target.value) : undefined })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="Minutes (e.g. 60)" />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Type</Label>
        <Select value={data.type} onValueChange={v => setData({ ...data, type: v as AppointmentType })}>
          <SelectTrigger className="col-span-3 bg-slate-50 border-slate-200 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="in-person">In-person</SelectItem>
            <SelectItem value="virtual">Virtual</SelectItem>
            <SelectItem value="phone-call">Phone Call</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Location</Label>
        <Input value={data.location ?? ''} onChange={e => setData({ ...data, location: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 h-9" placeholder="Address or Meeting Link" />
      </div>
      <div className="grid grid-cols-4 items-start gap-3">
        <Label className="text-right text-slate-500 text-xs mt-2.5">Notes</Label>
        <Textarea value={data.description ?? ''} onChange={e => setData({ ...data, description: e.target.value })}
          className="col-span-3 bg-slate-50 border-slate-200 resize-none" placeholder="Brief notes…" rows={2} />
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Label className="text-right text-slate-500 text-xs">Status</Label>
        <Select value={data.status} onValueChange={v => setData({ ...data, status: v as AppointmentStatus })}>
          <SelectTrigger className="col-span-3 bg-slate-50 border-slate-200 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No-Show</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const emptyAppt: Partial<Appointment> = {
  title: '', clientName: '', clientEmail: '', clientPhone: '',
  type: 'in-person', location: '', property: '', description: '',
  date: '', duration: undefined, status: 'scheduled',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const router = useRouter();

  // Data
  const [data, setData] = useState<PaginatedAppointments | null>(null);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // View
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [newAppt, setNewAppt] = useState<Partial<Appointment>>({ ...emptyAppt });
  const [saving, setSaving] = useState(false);
  const [conflictErr, setConflictErr] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateConflictErr, setUpdateConflictErr] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const buildParams = useCallback((p = page) => {
    const params: any = { page: p, limit };
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) {
      const ed = new Date(endDate);
      ed.setHours(23, 59, 59, 999);
      params.endDate = ed.toISOString();
    }
    return params;
  }, [page, limit, search, statusFilter, typeFilter, startDate, endDate]);

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const result = await apiClient.getAppointments(buildParams(p));
      // Handle both paginated and plain array responses
      if (Array.isArray(result)) {
        setData({ appointments: result, total: result.length, page: 1, totalPages: 1 });
      } else {
        setData(result);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [buildParams]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try { setStats(await apiClient.getAppointmentStats()); }
    catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchData(1); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search, statusFilter, typeFilter, startDate, endDate]);

  useEffect(() => { fetchData(page); }, [page]);

  // ─── CRUD handlers ──────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!newAppt.title || !newAppt.clientName || !newAppt.date) return;
    setSaving(true);
    setConflictErr('');
    try {
      const payload = { ...newAppt, date: new Date(newAppt.date!).toISOString() };
      await apiClient.createAppointment(payload);
      setAddOpen(false);
      setNewAppt({ ...emptyAppt });
      fetchData(page);
      fetchStats();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to save appointment.';
      if (typeof msg === 'string' && msg.toLowerCase().includes('conflict')) {
        setConflictErr(msg);
      } else {
        setConflictErr(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editAppt) return;
    setUpdating(true);
    setUpdateConflictErr('');
    try {
      const id = editAppt._id || editAppt.id || '';
      const payload: any = {
        title: editAppt.title, clientName: editAppt.clientName,
        clientEmail: editAppt.clientEmail, clientPhone: editAppt.clientPhone,
        type: editAppt.type, location: editAppt.location, description: editAppt.description,
        property: editAppt.property, duration: editAppt.duration, status: editAppt.status,
        date: editAppt.date ? new Date(editAppt.date).toISOString() : undefined,
      };
      await apiClient.updateAppointment(id, payload);
      setEditOpen(false);
      setEditAppt(null);
      fetchData(page);
      fetchStats();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to update appointment.';
      setUpdateConflictErr(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(', ') : 'Update failed.');
    } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteAppointment(deleteTarget._id || deleteTarget.id || '');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData(page);
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const openEdit = (a: Appointment) => {
    setEditAppt({ ...a, date: a.date ? new Date(a.date).toISOString().slice(0, 16) : '' });
    setUpdateConflictErr('');
    setEditOpen(true);
  };

  const openDelete = (a: Appointment) => { setDeleteTarget(a); setDeleteOpen(true); };

  const appointments = data?.appointments ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Stats cards
  const statsCards = [
    { title: 'Total', value: stats?.total ?? 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Upcoming', value: stats?.upcoming ?? 0, icon: CalendarClock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Success Rate', value: `${stats?.completionRate ?? 0}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const hasDateFilter = !!(startDate || endDate);
  const hasAnyFilter = search || statusFilter !== 'all' || typeFilter !== 'all' || hasDateFilter;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <main className="p-4 lg:p-8">
            <TooltipProvider delayDuration={200}>
              <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Appointments</h1>
                    </div>
                    <p className="text-slate-500 pl-11">Manage viewings, tours, and client meetings</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setView('list')}
                            className={cn('p-1.5 rounded-md transition-colors cursor-pointer', view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent><p>List View</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setView('calendar')}
                            className={cn('p-1.5 rounded-md transition-colors cursor-pointer', view === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent><p>Calendar View</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Button
                      className="rounded-full px-5 bg-blue-600 hover:bg-blue-700 shadow-sm"
                      onClick={() => { setConflictErr(''); setNewAppt({ ...emptyAppt }); setAddOpen(true); }}
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> New Appointment
                    </Button>
                  </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="rounded-2xl border-slate-200 shadow-sm">
                        <CardContent className="p-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent>
                      </Card>
                    ))
                    : statsCards.map((card, idx) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, overflow: 'hidden', height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, overflow: 'visible', height: 'auto', scale: 1 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                      >
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all h-full">
                          <CardContent className="p-5 flex items-center gap-4 h-full">
                            <div className={cn('p-3 rounded-2xl', card.bg)}>
                              <card.icon className={cn('w-6 h-6', card.color)} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</p>
                              <p className="text-2xl font-black text-slate-800">{card.value}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  }
                </div>

                {/* ── Filters ── */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                  <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by title, client, property…"
                        className="pl-9 border-none bg-slate-50 h-10 rounded-xl"
                      />
                      {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block h-10" />

                    <div className="flex flex-wrap items-center gap-2">
                      <Tabs value={statusFilter} onValueChange={v => { setStatusFilter(v as any); setPage(1); }}>
                        <TabsList className="bg-slate-50/80 h-10 rounded-xl p-1">
                          <TabsTrigger value="all" className="h-8 rounded-lg text-xs px-3">All</TabsTrigger>
                          <TabsTrigger value="scheduled" className="h-8 rounded-lg text-xs px-3">Scheduled</TabsTrigger>
                          <TabsTrigger value="rescheduled" className="h-8 rounded-lg text-xs px-2">
                            <RotateCcw className="w-3 h-3 mr-1" />Rescheduled
                          </TabsTrigger>
                          <TabsTrigger value="completed" className="h-8 rounded-lg text-xs px-3">Completed</TabsTrigger>
                          <TabsTrigger value="cancelled" className="h-8 rounded-lg text-xs px-3">Cancelled</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <Select value={typeFilter} onValueChange={v => { setTypeFilter(v as any); setPage(1); }}>
                        <SelectTrigger className="w-[140px] h-10 border-none bg-slate-50 rounded-xl text-sm">
                          <ListFilter className="w-4 h-4 mr-1.5 text-slate-400" /><SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Type</SelectItem>
                          <SelectItem value="in-person">In-person</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="phone-call">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date range filter */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Date Range:
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={e => { setStartDate(e.target.value); setPage(1); }}
                        className="h-8 text-xs bg-slate-50 border-slate-200 w-[150px]"
                      />
                      <span className="text-slate-400 text-xs">to</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={e => { setEndDate(e.target.value); setPage(1); }}
                        className="h-8 text-xs bg-slate-50 border-slate-200 w-[150px]"
                      />
                      {hasDateFilter && (
                        <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }} className="h-8 text-xs text-slate-500 px-2">
                          <X className="w-3.5 h-3.5 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                    {hasAnyFilter && !hasDateFilter && (
                      <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setStartDate(''); setEndDate(''); }} className="h-8 text-xs text-slate-500 ml-auto">
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Calendar or List ── */}
                <AnimatePresence mode="wait">
                  {view === 'calendar' ? (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CalendarView appointments={appointments} onSelect={openEdit} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-50/50 border-b">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-600 h-12">Appointment</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-600 h-12">Client</TableHead>
                                <TableHead className="font-semibold text-slate-600 h-12">Date & Time</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-600 h-12">Type</TableHead>
                                <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                                <TableHead className="text-right font-semibold text-slate-600 h-12">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                  <TableCell className="py-4"><Skeleton className="h-4 w-40 mb-1.5" /><Skeleton className="h-3 w-24" /></TableCell>
                                  <TableCell className="hidden md:table-cell py-4"><Skeleton className="h-4 w-28" /></TableCell>
                                  <TableCell className="py-4"><Skeleton className="h-4 w-24 mb-1.5" /><Skeleton className="h-3 w-16" /></TableCell>
                                  <TableCell className="hidden md:table-cell py-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                  <TableCell className="py-4"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                  <TableCell className="text-right py-4"><Skeleton className="h-8 w-20 rounded-full ml-auto" /></TableCell>
                                </TableRow>
                              ))}

                              {!loading && appointments.map((a, idx) => {
                                const dt = formatDateTime(a.date);
                                const TypeIcon = TYPE_ICON[a.type] ?? MapPin;
                                return (
                                  <motion.tr
                                    key={a._id || a.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="cursor-pointer hover:bg-slate-50/80 transition-colors group border-b"
                                    onClick={() => router.push(`/dashboard/appointments/${a._id || a.id}`)}
                                  >
                                    <TableCell className="py-4">
                                      <div className="space-y-0.5">
                                        <div className="font-semibold text-slate-900 line-clamp-1">{a.title}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                          {a.property && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.property}</span>}
                                          {a.duration && <span className="text-slate-400">• {a.duration} min</span>}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell py-4">
                                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase">
                                          {a.clientName.charAt(0)}
                                        </div>
                                        {a.clientName}
                                      </div>
                                      {a.clientEmail && <div className="text-xs text-slate-400 ml-8">{a.clientEmail}</div>}
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="text-sm font-medium text-slate-700 space-y-0.5">
                                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" />{dt.date}</div>
                                        <div className="flex items-center gap-1.5 ml-5 text-slate-500"><Clock className="w-3 h-3" />{dt.time}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell py-4">
                                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium text-xs gap-1.5 px-2 py-1">
                                        <TypeIcon className="w-3.5 h-3.5" />
                                        {a.type === 'in-person' ? 'In-person' : a.type === 'virtual' ? 'Virtual' : 'Phone Call'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <StatusBadge status={a.status} />
                                    </TableCell>
                                    <TableCell className="text-right py-4" onClick={e => e.stopPropagation()}>
                                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                              onClick={() => openEdit(a)}>
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Edit</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                              onClick={() => openDelete(a)}>
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Delete</p></TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </TableCell>
                                  </motion.tr>
                                );
                              })}

                              {!loading && appointments.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="h-[260px] text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Calendar className="w-7 h-7 text-slate-300" />
                                      </div>
                                      <h3 className="text-lg font-semibold text-slate-900">No appointments found</h3>
                                      <p className="text-slate-500 text-sm max-w-xs">
                                        {total === 0 ? "No appointments yet. Click 'New Appointment' to get started." : "No appointments match your current filters."}
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {!loading && total > 0 && (
                          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-xs text-slate-500">
                              Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-semibold text-slate-700">{total}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p: number;
                                if (totalPages <= 5) p = i + 1;
                                else if (page <= 3) p = i + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;
                                return (
                                  <button key={p} onClick={() => setPage(p)}
                                    className={cn('h-8 w-8 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                                      p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                                    )}>
                                    {p}
                                  </button>
                                );
                              })}
                              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TooltipProvider>
          </main>
        </SidebarInset>
      </div>

      {/* ── Add Dialog ── */}
      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setConflictErr(''); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">New Appointment</DialogTitle>
            <DialogDescription>Schedule a viewing or meeting with a client.</DialogDescription>
          </DialogHeader>
          <AppointmentFormFields data={newAppt} setData={setNewAppt} conflictError={conflictErr} />
          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="rounded-full">Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={!newAppt.title || !newAppt.clientName || !newAppt.date || saving}
              className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setUpdateConflictErr(''); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Appointment</DialogTitle>
            <DialogDescription>Update the appointment details. Changing the date/time will log a reschedule.</DialogDescription>
          </DialogHeader>
          {editAppt && <AppointmentFormFields data={editAppt} setData={d => setEditAppt(d as Appointment)} conflictError={updateConflictErr} />}
          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="rounded-full">Cancel</Button>
            <Button
              onClick={handleEdit}
              disabled={!editAppt?.title || !editAppt?.clientName || updating}
              className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-500 mt-2">
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-full border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-600 hover:bg-red-700 shadow-md font-semibold"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
