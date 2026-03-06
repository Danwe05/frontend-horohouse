'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import {
  Users, Search, Phone, Mail, MessageSquare, Plus, Calendar,
  MapPin, TrendingUp, UserPlus, CheckCircle2, XCircle, Pencil,
  Trash2, Loader2, X, ChevronLeft, ChevronRight, Filter,
  Sparkles, ArrowUpRight, Clock, MoreHorizontal, Star, AlertCircle,
  List, LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LeadForm } from '@/components/dashboard/leads/LeadForm';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';
type LeadPriority = 'low' | 'medium' | 'high';
type LeadSource = 'website' | 'referral' | 'message' | 'campaign';

type LeadNote = { _id?: string; content: string; createdAt: string };

type Lead = {
  id?: string; _id?: string;
  name: string;
  email?: string;
  phone?: string;
  interest?: string;
  source: LeadSource;
  status: LeadStatus;
  location?: string;
  createdAt: string;
  lastContactedAt?: string;
  budget?: number;
  propertyType?: string;
  priority?: LeadPriority;
  assignedAgent?: string;
  tags?: string[];
  notes?: LeadNote[];
};

type LeadStats = {
  total: number; new: number; contacted: number;
  qualified: number; lost: number; newThisWeek: number; conversionRate: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, {
  label: string; bg: string; text: string; dot: string; border: string; hoverBg: string;
}> = {
  new:       { label: 'New',       bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400',   border: 'border-blue-200',   hoverBg: 'hover:bg-blue-100' },
  contacted: { label: 'Contacted', bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400',  border: 'border-amber-200',  hoverBg: 'hover:bg-amber-100' },
  qualified: { label: 'Qualified', bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500',border: 'border-emerald-200',hoverBg: 'hover:bg-emerald-100' },
  lost:      { label: 'Lost',      bg: 'bg-slate-50',   text: 'text-slate-600',  dot: 'bg-slate-400',  border: 'border-slate-200',  hoverBg: 'hover:bg-slate-100' },
};

const PRIORITY_CONFIG: Record<LeadPriority, { label: string; bg: string; text: string; dot: string }> = {
  high:   { label: 'High',   bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400' },
  medium: { label: 'Medium', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  low:    { label: 'Low',    bg: 'bg-slate-50',  text: 'text-slate-500',  dot: 'bg-slate-300' },
};

const SOURCE_CONFIG: Record<LeadSource, { label: string; bg: string; text: string }> = {
  website:  { label: 'Website',  bg: 'bg-indigo-50', text: 'text-indigo-700' },
  referral: { label: 'Referral', bg: 'bg-violet-50', text: 'text-violet-700' },
  message:  { label: 'Message',  bg: 'bg-pink-50',   text: 'text-pink-700' },
  campaign: { label: 'Campaign', bg: 'bg-cyan-50',   text: 'text-cyan-700' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso?: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'from-blue-400 to-indigo-600',
  'from-violet-400 to-purple-600',
  'from-pink-400 to-rose-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-cyan-400 to-sky-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
      cfg.bg, cfg.text, cfg.border
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: LeadPriority }) {
  if (!priority) return <span className="text-slate-300 text-xs">—</span>;
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold', cfg.bg, cfg.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function AvatarBubble({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const gradient = getAvatarColor(name);
  const sizeClass = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' }[size];
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0',
      sizeClass, gradient
    )}>
      {getInitials(name)}
    </div>
  );
}

// ─── Lead Card (Grid View) ────────────────────────────────────────────────────

function LeadCard({
  lead, idx, onEdit, onDelete, onNavigate,
}: {
  lead: Lead; idx: number;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onNavigate: (l: Lead) => void;
}) {
  const statusCfg = STATUS_CONFIG[lead.status];
  const sourceCfg = SOURCE_CONFIG[lead.source] ?? SOURCE_CONFIG.website;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: idx * 0.04 }}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onNavigate(lead)}
    >
      {/* Status accent bar */}
      <div className={cn('h-1 w-full', statusCfg.dot.replace('bg-', 'bg-'))} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <AvatarBubble name={lead.name} size="lg" />
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                {lead.name}
              </div>
              <div className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block', sourceCfg.bg, sourceCfg.text)}>
                {sourceCfg.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <StatusBadge status={lead.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-slate-100">
                <DropdownMenuItem onClick={() => onEdit(lead)} className="gap-2 cursor-pointer font-medium p-2.5">
                  <Pencil className="w-4 h-4 text-blue-500" /> Edit Lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(lead)} className="gap-2 cursor-pointer font-medium p-2.5">
                  <ArrowUpRight className="w-4 h-4 text-slate-500" /> View Detail
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(lead)} className="gap-2 cursor-pointer font-medium text-rose-600 p-2.5">
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 mb-4">
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.location && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span>{lead.location}</span>
            </div>
          )}
        </div>

        {/* Interest */}
        {lead.interest && (
          <div className="bg-slate-50 rounded-xl px-3 py-2 mb-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Interest</p>
            <p className="text-xs text-slate-700 font-medium line-clamp-2">{lead.interest}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <PriorityBadge priority={lead.priority} />
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            {formatRelative(lead.lastContactedAt || lead.createdAt)}
          </div>
        </div>

        {/* Budget chip */}
        {lead.budget && (
          <div className="mt-3 text-right">
            <span className="text-xs font-black text-slate-700">
              {lead.budget.toLocaleString()} <span className="font-semibold text-slate-400 text-[10px]">XAF budget</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Lead Form Fields ─────────────────────────────────────────────────────────

function LeadFormFields({
  data, setData, saving,
}: {
  data: Partial<Lead>;
  setData: (d: Partial<Lead>) => void;
  saving: boolean;
}) {
  const field = (label: string, required = false) => (
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </span>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
      {/* Name */}
      <div className="space-y-1.5">
        {field('Full Name', true)}
        <Input
          value={data.name ?? ''}
          onChange={e => setData({ ...data, name: e.target.value })}
          placeholder="e.g. Jean Dupont"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Source */}
      <div className="space-y-1.5">
        {field('Lead Source', true)}
        <Select
          value={data.source ?? 'website'}
          onValueChange={v => setData({ ...data, source: v as LeadSource })}
          disabled={saving}
        >
          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="message">Message</SelectItem>
            <SelectItem value="campaign">Campaign</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-full h-px bg-slate-100" />

      {/* Email */}
      <div className="space-y-1.5">
        {field('Email')}
        <Input
          type="email"
          value={data.email ?? ''}
          onChange={e => setData({ ...data, email: e.target.value })}
          placeholder="jean@example.com"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        {field('Phone')}
        <Input
          value={data.phone ?? ''}
          onChange={e => setData({ ...data, phone: e.target.value })}
          placeholder="+237..."
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        {field('Location')}
        <Input
          value={data.location ?? ''}
          onChange={e => setData({ ...data, location: e.target.value })}
          placeholder="City or neighborhood"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        {field('Budget (XAF)')}
        <Input
          type="number"
          value={data.budget ?? ''}
          onChange={e => setData({ ...data, budget: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="e.g. 5000000"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      <div className="col-span-full h-px bg-slate-100" />

      {/* Status */}
      <div className="space-y-1.5">
        {field('Status')}
        <Select value={data.status ?? 'new'} onValueChange={v => setData({ ...data, status: v as LeadStatus })} disabled={saving}>
          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        {field('Priority')}
        <Select value={data.priority ?? ''} onValueChange={v => setData({ ...data, priority: v as LeadPriority || undefined })} disabled={saving}>
          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property type */}
      <div className="space-y-1.5">
        {field('Property Type')}
        <Input
          value={data.propertyType ?? ''}
          onChange={e => setData({ ...data, propertyType: e.target.value })}
          placeholder="Apartment, villa, land…"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Assigned agent */}
      <div className="space-y-1.5">
        {field('Assigned Agent')}
        <Input
          value={data.assignedAgent ?? ''}
          onChange={e => setData({ ...data, assignedAgent: e.target.value })}
          placeholder="Agent name or ID"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Interest */}
      <div className="space-y-1.5 col-span-full">
        {field('Interest / Notes')}
        <textarea
          value={data.interest ?? ''}
          onChange={e => setData({ ...data, interest: e.target.value })}
          placeholder="What is this lead looking for? Any specific requirements…"
          disabled={saving}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
        />
      </div>
    </div>
  );
}

// ─── Empty Lead ────────────────────────────────────────────────────────────────

const emptyLead: Partial<Lead> = {
  name: '', email: '', phone: '', location: '', interest: '',
  source: 'website', status: 'new', budget: undefined,
  propertyType: '', priority: undefined, assignedAgent: '', tags: [],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');

  // View
  const [view, setView] = useState<'list' | 'grid'>('list');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ ...emptyLead });
  const [isSaving, setIsSaving] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    try {
      const data = await apiClient.getLeads();
      setLeads(Array.isArray(data) ? data : data?.leads ?? []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await apiClient.getLeadStats());
    } catch (e) { console.error(e); }
    finally { setIsStatsLoading(false); }
  }, []);

  useEffect(() => { fetchLeads(); fetchStats(); }, []);

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!newLead.name) return;
    setIsSaving(true);
    try {
      const saved = await apiClient.createLead(newLead);
      setLeads(prev => [saved, ...prev]);
      setIsAddOpen(false);
      setNewLead({ ...emptyLead });
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleEdit = async () => {
    if (!editLead) return;
    setIsUpdating(true);
    try {
      const id = editLead._id || editLead.id || '';
      const updated = await apiClient.updateLead(id, editLead);
      setLeads(prev => prev.map(l => (l._id === updated._id || l.id === updated._id) ? updated : l));
      setIsEditOpen(false);
      setEditLead(null);
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setIsUpdating(false); }
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteLead(deleteLead._id || deleteLead.id || '');
      setLeads(prev => prev.filter(l => (l._id || l.id) !== (deleteLead._id || deleteLead.id)));
      setIsDeleteOpen(false);
      setDeleteLead(null);
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  const openEdit = (lead: Lead) => { setEditLead({ ...lead }); setIsEditOpen(true); };
  const openDelete = (lead: Lead) => { setDeleteLead(lead); setIsDeleteOpen(true); };
  const openNavigate = (lead: Lead) => router.push(`/dashboard/leads/${lead._id || lead.id}`);

  // ─── Filtering ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = query.toLowerCase();
      const matchesQuery = !q || [l.name, l.email, l.phone, l.interest, l.location]
        .some(v => v?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || l.priority === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [query, statusFilter, priorityFilter, leads]);

  const counts = useMemo(() => {
    const base: Record<'all' | LeadStatus, number> = { all: leads.length, new: 0, contacted: 0, qualified: 0, lost: 0 };
    for (const l of leads) base[l.status] = (base[l.status] || 0) + 1;
    return base;
  }, [leads]);

  // ─── Stats cards ─────────────────────────────────────────────────────────────

  const statsCards = [
    { title: 'Total Leads',    value: stats?.total ?? 0,           icon: Users,        gradient: 'from-blue-50d0 to-indigo-600',    bg: 'bg-blue-50',    text: 'text-blue-600' },
    { title: 'New This Week',  value: stats?.newThisWeek ?? 0,     icon: UserPlus,     gradient: 'from-amber-400 to-orange-500',   bg: 'bg-amber-50',   text: 'text-amber-600' },
    { title: 'Qualified',      value: stats?.qualified ?? 0,       icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { title: 'Conversion',     value: `${stats?.conversionRate ?? 0}%`, icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50',  text: 'text-violet-600' },
  ];

  const hasFilters = query || statusFilter !== 'all' || priorityFilter !== 'all';

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
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client Leads</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Track, qualify, and convert your prospects</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setView('list')}
                            className={cn('p-1.5 rounded-md transition-colors cursor-pointer', view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-700')}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>List View</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setView('grid')}
                            className={cn('p-1.5 rounded-md transition-colors cursor-pointer', view === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-700')}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Grid View</TooltipContent>
                      </Tooltip>
                    </div>

                    <Button
                      variant="outline"
                      className="gap-2 rounded-full"
                      onClick={() => router.push('/dashboard/appointments')}
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </Button>

                    <Button
                      className="rounded-full px-5 bg-blue-600 hover:bg-blue-700 shadow-sm gap-2"
                      onClick={() => { setNewLead({ ...emptyLead }); setIsAddOpen(true); }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Lead
                    </Button>
                  </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {isStatsLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="rounded-2xl border-slate-200 shadow-sm">
                        <CardContent className="p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent>
                      </Card>
                    ))
                    : statsCards.map((card, i) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                      >
                        <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
                          <div className={cn('absolute top-0 left-0 w-1 h-full')} />
                          <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn('p-3 rounded-2xl', card.bg)}>
                              <card.icon className={cn('w-5 h-5', card.text)} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</p>
                              <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
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
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by name, email, interest, location…"
                        className="pl-9 border-none bg-slate-50 h-10 rounded-xl"
                      />
                      {query && (
                        <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block h-10" />

                    {/* Status tabs */}
                    <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                      <TabsList className="bg-slate-50/80 h-10 rounded-xl p-1">
                        {(['all', 'new', 'contacted', 'qualified', 'lost'] as const).map(s => (
                          <TabsTrigger key={s} value={s} className="h-8 rounded-lg text-xs px-3 capitalize">
                            {s === 'all' ? `All (${counts.all})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    {/* Priority filter */}
                    <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v as any)}>
                      <SelectTrigger className="w-[140px] h-10 border-none bg-slate-50 rounded-xl text-sm">
                        <Star className="w-4 h-4 mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasFilters && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                      <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                        className="h-7 text-xs text-slate-500 ml-auto px-2 hover:text-slate-900">
                        <X className="w-3.5 h-3.5 mr-1" /> Clear filters
                      </Button>
                    </div>
                  )}
                </div>

                {/* ── Content ── */}
                <AnimatePresence mode="wait">
                  {view === 'grid' ? (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                          ))}
                        </div>
                      ) : filtered.length === 0 ? (
                        <EmptyState onClear={() => { setQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }} hasFilters={!!hasFilters} onAdd={() => setIsAddOpen(true)} />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          <AnimatePresence>
                            {filtered.map((l, i) => (
                              <LeadCard key={l._id || l.id} lead={l} idx={i} onEdit={openEdit} onDelete={openDelete} onNavigate={openNavigate} />
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
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
                                <TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Lead</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Interest</TableHead>
                                <TableHead className="hidden lg:table-cell font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Location</TableHead>
                                <TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Status</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Priority</TableHead>
                                <TableHead className="hidden lg:table-cell font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Last Contact</TableHead>
                                <TableHead className="text-right font-semibold text-slate-500 h-11 text-xs uppercase tracking-wider">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                  <TableCell className="py-4"><div className="flex items-center gap-3"><Skeleton className="w-9 h-9 rounded-full" /><div><Skeleton className="h-4 w-28 mb-1.5" /><Skeleton className="h-3 w-40" /></div></div></TableCell>
                                  <TableCell className="hidden md:table-cell py-4"><Skeleton className="h-4 w-28" /></TableCell>
                                  <TableCell className="hidden lg:table-cell py-4"><Skeleton className="h-4 w-24" /></TableCell>
                                  <TableCell className="py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                  <TableCell className="hidden md:table-cell py-4"><Skeleton className="h-5 w-16 rounded" /></TableCell>
                                  <TableCell className="hidden lg:table-cell py-4"><Skeleton className="h-4 w-14" /></TableCell>
                                  <TableCell className="text-right py-4"><Skeleton className="h-8 w-20 ml-auto rounded-full" /></TableCell>
                                </TableRow>
                              ))}

                              <AnimatePresence mode="popLayout">
                                {!isLoading && filtered.map((l, i) => {
                                  const sourceCfg = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG.website;
                                  return (
                                    <motion.tr
                                      key={l._id || l.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.97 }}
                                      transition={{ duration: 0.2, delay: i * 0.03 }}
                                      className="group cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0"
                                      onClick={() => openNavigate(l)}
                                    >
                                      {/* Lead */}
                                      <TableCell className="py-4 pl-5">
                                        <div className="flex items-center gap-3">
                                          <AvatarBubble name={l.name} />
                                          <div>
                                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                                              {l.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                              {l.email && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                  <Mail className="w-3 h-3" />{l.email}
                                                </span>
                                              )}
                                              {l.phone && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                  <Phone className="w-3 h-3" />{l.phone}
                                                </span>
                                              )}
                                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', sourceCfg.bg, sourceCfg.text)}>
                                                {sourceCfg.label}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>

                                      {/* Interest */}
                                      <TableCell className="hidden md:table-cell py-4 text-xs text-slate-500 max-w-[180px]">
                                        <span className="line-clamp-2 italic">{l.interest || '—'}</span>
                                      </TableCell>

                                      {/* Location */}
                                      <TableCell className="hidden lg:table-cell py-4">
                                        {l.location ? (
                                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-slate-300" />{l.location}
                                          </span>
                                        ) : <span className="text-slate-300 text-sm">—</span>}
                                      </TableCell>

                                      {/* Status */}
                                      <TableCell className="py-4">
                                        <StatusBadge status={l.status} />
                                      </TableCell>

                                      {/* Priority */}
                                      <TableCell className="hidden md:table-cell py-4">
                                        <PriorityBadge priority={l.priority} />
                                      </TableCell>

                                      {/* Last contact */}
                                      <TableCell className="hidden lg:table-cell py-4">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                          <Clock className="w-3 h-3" />
                                          {formatRelative(l.lastContactedAt)}
                                        </span>
                                      </TableCell>

                                      {/* Actions */}
                                      <TableCell className="text-right py-4 pr-4" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                onClick={() => openEdit(l)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Edit Lead</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                                onClick={() => openDelete(l)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete Lead</TooltipContent>
                                          </Tooltip>
                                          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs font-semibold border-slate-200 hidden sm:inline-flex"
                                            onClick={() => router.push('/dashboard/inquiry')}>
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Message
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </motion.tr>
                                  );
                                })}
                              </AnimatePresence>

                              {!isLoading && filtered.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={7} className="h-[360px]">
                                    <EmptyState
                                      onClear={() => { setQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                                      hasFilters={!!hasFilters}
                                      onAdd={() => setIsAddOpen(true)}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TooltipProvider>
          </main>
        </SidebarInset>
      </div>

      {/* ── Add Lead Dialog ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <DialogTitle className="text-xl font-bold">New Prospect</DialogTitle>
              </div>
              <DialogDescription className="text-blue-100/80">
                Register a new lead and begin tracking their journey through your pipeline.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <LeadFormFields data={newLead} setData={setNewLead} saving={isSaving} />
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 gap-2">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} disabled={isSaving} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newLead.name || isSaving}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 shadow-md shadow-blue-500/20 gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isSaving ? 'Registering…' : 'Register Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Lead Dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={o => { setIsEditOpen(o); if (!o) setEditLead(null); }}>
        <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-7 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <DialogTitle className="text-xl font-bold">Update Lead</DialogTitle>
              </div>
              <DialogDescription className="text-violet-100/80">
                Modify lead details, status, and priority to keep your records accurate.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {editLead && (
              <LeadFormFields
                data={editLead}
                setData={d => setEditLead(d as Lead)}
                saving={isUpdating}
              />
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 gap-2">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isUpdating} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editLead?.name || isUpdating}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 shadow-md shadow-violet-500/20 gap-2"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isUpdating ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Delete Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-1">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-700">{deleteLead?.name}</strong>?
              This action cannot be undone and all associated notes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 font-bold shadow-md shadow-red-500/20 gap-2"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? 'Deleting…' : 'Delete Lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onClear, hasFilters, onAdd }: { onClear: () => void; hasFilters: boolean; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
        <Users className="w-9 h-9 text-slate-200" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        {hasFilters ? 'No leads match your filters' : 'No leads yet'}
      </h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        {hasFilters
          ? 'Try adjusting your search or clearing the active filters to see all leads.'
          : "Start building your pipeline by adding your first prospect."}
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onClear} className="rounded-xl font-semibold">
          <X className="w-4 h-4 mr-1.5" /> Clear Filters
        </Button>
      ) : (
        <Button onClick={onAdd} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
          <Plus className="w-4 h-4" /> Add First Lead
        </Button>
      )}
    </motion.div>
  );
}