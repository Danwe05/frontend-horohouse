'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, X, Check, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Home, Users, Calendar,
  PenLine, Trash2, Clock, CheckCircle2, XCircle,
  Search, Building2, DollarSign, User, UserSearch,
  GraduationCap, ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  _id: string;
  title: string;
  address: string;
  city: string;
}

interface Tenant {
  tenantUserId: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  rentShare: number;
  signatureUrl?: string;
  signedAt?: string;
}

interface Lease {
  _id: string;
  propertyId: { _id: string; title: string; address: string; city: string; images?: any[] };
  landlordUserId: { _id: string; name: string };
  tenants: Tenant[];
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositAmount: number;
  advanceMonths: number;
  status: 'draft' | 'pending_tenant' | 'active' | 'expired' | 'terminated';
  landlordSignedAt?: string;
  landlordSignatureUrl?: string;
  clauses: Array<{ heading: string; body: string }>;
  customClauses: Array<{ heading: string; body: string }>;
  createdAt: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft: { label: 'Draft', icon: FileText, badge: 'bg-slate-100 text-slate-600', row: '' },
  pending_tenant: { label: 'Awaiting Tenant', icon: Clock, badge: 'bg-amber-100 text-amber-700', row: 'bg-amber-50/20' },
  active: { label: 'Active', icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700', row: '' },
  expired: { label: 'Expired', icon: XCircle, badge: 'bg-slate-100 text-slate-400', row: 'opacity-60' },
  terminated: { label: 'Terminated', icon: XCircle, badge: 'bg-red-100 text-red-600', row: 'opacity-60' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.badge)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXAF(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M XAF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K XAF`;
  return `${n.toLocaleString()} XAF`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Signature Modal ──────────────────────────────────────────────────────────

function SignatureModal({
  lease,
  onClose,
  onSigned,
}: {
  lease: Lease;
  onClose: () => void;
  onSigned: () => void;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [signing, setSigning] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleSign = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error('Please draw your signature first.');
      return;
    }
    setSigning(true);
    try {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      await apiClient.signDigitalLease(lease._id, dataUrl);
      toast.success('Lease signed successfully!');
      onSigned();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to sign lease.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sign Lease</h2>
            <p className="text-xs text-slate-500 mt-0.5">{lease.propertyId?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            By signing below you confirm all lease terms are correct and agree to be bound by this agreement.
          </p>
          <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{ width: 400, height: 160, className: 'w-full' }}
              backgroundColor="rgb(248,250,252)"
              onBegin={() => setIsEmpty(false)}
            />
          </div>
          <p className="text-[10px] text-slate-400 text-center">Draw your signature above</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => { sigRef.current?.clear(); setIsEmpty(true); }} className="flex-1">
              Clear
            </Button>
            <Button onClick={handleSign} disabled={signing || isEmpty} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              {signing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing…</> : <><PenLine className="w-4 h-4 mr-2" />Sign Lease</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Terminate Modal ──────────────────────────────────────────────────────────

function TerminateModal({
  lease,
  onClose,
  onTerminated,
}: {
  lease: Lease;
  onClose: () => void;
  onTerminated: () => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTerminate = async () => {
    if (reason.trim().length < 5) { toast.error('Please provide a reason (min 5 characters).'); return; }
    setLoading(true);
    try {
      await apiClient.terminateDigitalLease(lease._id, reason.trim());
      toast.success('Lease terminated.');
      onTerminated();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to terminate lease.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Terminate Lease?</h2>
          <p className="text-sm text-slate-500 mb-4">
            This will terminate the lease for <span className="font-semibold text-slate-700">{lease.propertyId?.title}</span>. All tenants will be notified.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for termination (required)…"
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-slate-50 text-left"
          />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Cancel</Button>
          <Button onClick={handleTerminate} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
            Terminate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tenant Search Input ──────────────────────────────────────────────────────

interface UserResult {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

function TenantSearchInput({
  value,
  onSelect,
  onClear,
}: {
  value: { id: string; name: string; email?: string; phone?: string } | null;
  onSelect: (u: UserResult) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.getAllUsers({ search: query.trim(), limit: 8 });
        setResults(res?.users || res?.data || res || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">
          {value.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{value.name}</p>
          {value.email && <p className="text-[10px] text-slate-400 truncate">{value.email}</p>}
        </div>
        <button onClick={onClear} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
      </div>
      <AnimatePresence mode="wait">
        {open && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          >
            {results.map(u => (
              <React.Fragment key={u._id ?? u.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(u); setQuery(''); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {u.profilePicture
                      ? <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-slate-600">{u.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{u.email || u.phoneNumber || u._id}</p>
                  </div>
                </button>
              </React.Fragment>
            ))}
          </motion.div>
        )}
        {open && !loading && results.length === 0 && query.length >= 2 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-400"
          >
            No users found for "{query}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Lease Modal ───────────────────────────────────────────────────────

function CreateLeaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    propertyId: '',
    leaseStart: '',
    leaseEnd: '',
    monthlyRent: '',
    depositAmount: '',
    advanceMonths: '3',
    tenants: [{ tenantUserId: '', tenantName: '', tenantEmail: '', tenantPhone: '', rentShare: '', resolved: null as UserResult | null }],
  });

  useEffect(() => {
    apiClient.getMyProperties({ limit: 100 })
      .then(res => setProperties(res?.properties || res?.data || res || []))
      .catch(() => setProperties([]))
      .finally(() => setLoadingProps(false));
  }, []);

  const addTenant = () => setForm(f => ({
    ...f,
    tenants: [...f.tenants, { tenantUserId: '', tenantName: '', tenantEmail: '', tenantPhone: '', rentShare: '', resolved: null }],
  }));

  const removeTenant = (i: number) => setForm(f => ({ ...f, tenants: f.tenants.filter((_, idx) => idx !== i) }));

  const selectTenant = (i: number, u: UserResult) => {
    const resolvedId = u._id ?? u.id ?? '';
    setForm(f => {
      const tenants = [...f.tenants];
      tenants[i] = {
        ...tenants[i],
        tenantUserId: resolvedId,
        tenantName: u.name,
        tenantEmail: u.email || '',
        tenantPhone: u.phoneNumber || '',
        resolved: { ...u, _id: resolvedId },
      };
      return { ...f, tenants };
    });
  };

  const clearTenant = (i: number) => {
    setForm(f => {
      const tenants = [...f.tenants];
      tenants[i] = { ...tenants[i], tenantUserId: '', tenantName: '', tenantEmail: '', tenantPhone: '', resolved: null };
      return { ...f, tenants };
    });
  };

  // Auto-split rent equally
  useEffect(() => {
    const rent = Number(form.monthlyRent);
    if (!rent || form.tenants.length === 0) return;
    const share = Math.floor(rent / form.tenants.length);
    setForm(f => ({
      ...f,
      tenants: f.tenants.map((t, i) => ({
        ...t,
        rentShare: i === 0 ? String(rent - share * (f.tenants.length - 1)) : String(share),
      })),
    }));
  }, [form.monthlyRent, form.tenants.length]);

  const sharesSum = form.tenants.reduce((s, t) => s + Number(t.rentShare || 0), 0);
  const rent = Number(form.monthlyRent || 0);
  const sharesValid = rent > 0 && sharesSum === rent;

  const handleCreate = async () => {
    setError('');
    if (!form.propertyId) { setError('Select a property.'); return; }
    if (!form.leaseStart) { setError('Enter a start date.'); return; }
    if (!form.leaseEnd) { setError('Enter an end date.'); return; }
    if (!rent) { setError('Enter the monthly rent.'); return; }

    for (const t of form.tenants) {
      if (!t.resolved || !t.tenantUserId) {
        setError('All tenants must be selected via the search.');
        return;
      }
    }

    if (!sharesValid) {
      setError(`Tenant shares must sum to ${formatXAF(rent)} (currently ${formatXAF(sharesSum)}).`);
      return;
    }

    setSaving(true);
    try {
      await apiClient.createDigitalLease({
        propertyId: form.propertyId,
        leaseStart: form.leaseStart,
        leaseEnd: form.leaseEnd,
        monthlyRent: rent,
        depositAmount: Number(form.depositAmount || 0),
        advanceMonths: Number(form.advanceMonths || 1),
        tenants: form.tenants.map(t => ({
          tenantUserId: t.tenantUserId,
          tenantName: t.tenantName,
          tenantEmail: t.tenantEmail || undefined,
          tenantPhone: t.tenantPhone || undefined,
          rentShare: Number(t.rentShare),
        })),
      });
      toast.success('Lease draft created! Sign it to send to tenants.');
      onCreated();
      onClose();
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      setError(
        Array.isArray(raw)
          ? 'Validation error — check all fields.'
          : typeof raw === 'string'
            ? raw
            : 'Failed to create lease.',
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedProp = properties.find(p => p._id === form.propertyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Lease</h2>
            <p className="text-xs text-slate-500 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all', step >= s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400')}>{s}</div>
                {s < 2 && <div className={cn('flex-1 h-0.5 transition-all', step > s ? 'bg-slate-900' : 'bg-slate-200')} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Lease Terms</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tenants</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Property *</Label>
                {loadingProps ? (
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ) : (
                  <select
                    value={form.propertyId}
                    onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">Select a property…</option>
                    {properties.map(p => <option key={p._id} value={p._id}>{p.title} — {p.city}</option>)}
                  </select>
                )}
                {selectedProp && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Home className="w-3 h-3" />{selectedProp.address}, {selectedProp.city}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date *</Label>
                  <Input type="date" value={form.leaseStart} onChange={e => setForm(f => ({ ...f, leaseStart: e.target.value }))} className="border-slate-200 bg-slate-50 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date *</Label>
                  <Input type="date" value={form.leaseEnd} onChange={e => setForm(f => ({ ...f, leaseEnd: e.target.value }))} className="border-slate-200 bg-slate-50 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Rent (XAF) *</Label>
                  <Input type="number" value={form.monthlyRent} onChange={e => setForm(f => ({ ...f, monthlyRent: e.target.value }))} placeholder="e.g. 80000" className="border-slate-200 bg-slate-50 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deposit (XAF)</Label>
                  <Input type="number" value={form.depositAmount} onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))} placeholder="e.g. 160000" className="border-slate-200 bg-slate-50 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Advance Months (1–12)</Label>
                <Input type="number" min={1} max={12} value={form.advanceMonths} onChange={e => setForm(f => ({ ...f, advanceMonths: e.target.value }))} className="border-slate-200 bg-slate-50 rounded-xl w-32" />
                <p className="text-[10px] text-slate-400">Legal max in Cameroon is 12 months. Student-friendly is 3.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{form.tenants.length} tenant{form.tenants.length > 1 ? 's' : ''}</p>
                <button onClick={addTenant} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Tenant
                </button>
              </div>
              {form.tenants.map((t, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant {i + 1}</p>
                    {form.tenants.length > 1 && (
                      <button onClick={() => removeTenant(i)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search Tenant *</Label>
                    <TenantSearchInput
                      value={t.resolved ? { id: t.tenantUserId, name: t.tenantName, email: t.tenantEmail, phone: t.tenantPhone } : null}
                      onSelect={u => selectTenant(i, u)}
                      onClear={() => clearTenant(i)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rent Share (XAF) *</Label>
                    <Input
                      type="number"
                      value={t.rentShare}
                      onChange={e => {
                        const tenants = [...form.tenants];
                        tenants[i] = { ...tenants[i], rentShare: e.target.value };
                        setForm(f => ({ ...f, tenants }));
                      }}
                      placeholder="e.g. 40000"
                      className="border-slate-200 bg-white rounded-xl text-sm h-9"
                    />
                  </div>
                </div>
              ))}
              <div className={cn('flex items-center justify-between p-3 rounded-xl border text-sm font-semibold', sharesValid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600')}>
                <span>Shares total</span>
                <span>{formatXAF(sharesSum)} {sharesValid ? '✓' : `≠ ${formatXAF(rent)}`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={() => { setError(''); setStep(2); }} disabled={!form.propertyId || !form.leaseStart || !form.leaseEnd || !form.monthlyRent} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                Next: Add Tenants
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleCreate} disabled={saving || !sharesValid} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <><FileText className="w-4 h-4 mr-2" />Create Lease</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Landlord Lease Card ──────────────────────────────────────────────────────

function LandlordLeaseCard({
  lease, onSign, onTerminate,
}: {
  lease: Lease;
  onSign: (l: Lease) => void;
  onTerminate: (l: Lease) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[lease.status] ?? STATUS_CFG.draft;

  const landlordSigned = !!lease.landlordSignedAt;
  const canSign = !landlordSigned && lease.status === 'draft';
  const canTerminate = lease.status === 'active' || lease.status === 'pending_tenant';
  const propertyImg = lease.propertyId?.images?.[0]?.url;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden', cfg.row)}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            {propertyImg
              ? <img src={propertyImg} alt={lease.propertyId?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-slate-300" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 truncate">{lease.propertyId?.title || 'Unknown Property'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Home className="w-3 h-3" />{lease.propertyId?.city}</p>
              </div>
              <StatusBadge status={lease.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatXAF(lease.monthlyRent)}/mo</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(lease.leaseStart)} — {formatDate(lease.leaseEnd)}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{lease.tenants.length} tenant{lease.tenants.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Signing progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <span>Signing progress</span>
            <span>{[landlordSigned, ...lease.tenants.map(t => !!t.signedAt)].filter(Boolean).length}/{1 + lease.tenants.length} signed</span>
          </div>
          <div className="flex gap-1.5">
            <div className={cn('flex-1 h-1.5 rounded-full transition-all', landlordSigned ? 'bg-emerald-500' : 'bg-slate-200')} title="Landlord" />
            {lease.tenants.map((t, i) => (
              <div key={i} className={cn('flex-1 h-1.5 rounded-full transition-all', t.signedAt ? 'bg-emerald-500' : 'bg-slate-200')} title={t.tenantName} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end mt-3">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} details
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-slate-100">
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Signing Status</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-sm font-semibold text-slate-700">You (Landlord)</span></div>
                    {landlordSigned
                      ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Signed {formatDate(lease.landlordSignedAt!)}</span>
                      : <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>
                    }
                  </div>
                  {lease.tenants.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0"><Users className="w-4 h-4 text-slate-400 shrink-0" /><span className="text-sm font-semibold text-slate-700 truncate">{t.tenantName}</span></div>
                      {t.signedAt
                        ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Signed {formatDate(t.signedAt)}</span>
                        : <span className="text-xs font-bold text-amber-600 flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> Awaiting</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ label: 'Monthly', value: formatXAF(lease.monthlyRent) }, { label: 'Deposit', value: formatXAF(lease.depositAmount) }, { label: 'Advance', value: `${lease.advanceMonths} mo` }]
                  .map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
              </div>
              <div className="flex gap-2 pt-1">
                {canSign && (
                  <Button size="sm" onClick={() => onSign(lease)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9">
                    <PenLine className="w-3.5 h-3.5 mr-1.5" /> Sign Lease
                  </Button>
                )}
                {canTerminate && (
                  <Button size="sm" variant="outline" onClick={() => onTerminate(lease)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-9">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Terminate
                  </Button>
                )}
                {!canSign && !canTerminate && (
                  <p className="text-xs text-slate-400 italic">No actions available for this lease.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Tenant Lease Card ────────────────────────────────────────────────────────

function TenantLeaseCard({
  lease,
  currentUserId,
  onSign,
}: {
  lease: Lease;
  currentUserId: string;
  onSign: (l: Lease) => void;
}) {
  const router = useRouter();
  const cfg = STATUS_CFG[lease.status] ?? STATUS_CFG.draft;
  const propertyImg = lease.propertyId?.images?.[0]?.url;

  const myTenantRecord = lease.tenants.find(t => t.tenantUserId === currentUserId);
  const iHaveSigned = !!myTenantRecord?.signedAt;
  const landlordSigned = !!lease.landlordSignedAt;
  const canSign = landlordSigned && lease.status === 'pending_tenant' && !iHaveSigned;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group', cfg.row)}
    >
      {/* Main clickable area → detail page */}
      <button
        onClick={() => router.push(`/dashboard/leases/${lease._id}`)}
        className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Property thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            {propertyImg
              ? <img src={propertyImg} alt={lease.propertyId?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-slate-300" /></div>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 truncate">{lease.propertyId?.title || 'Unknown Property'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Home className="w-3 h-3" />{lease.propertyId?.city}
                </p>
              </div>
              <StatusBadge status={lease.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />{formatXAF(myTenantRecord?.rentShare ?? lease.monthlyRent)}/mo
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />{formatDate(lease.leaseStart)} — {formatDate(lease.leaseEnd)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />via {lease.landlordUserId?.name}
              </span>
            </div>
          </div>

          {/* Arrow hint */}
          <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Signing status pill */}
        <div className="mt-4 flex items-center gap-2">
          {canSign ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 animate-pulse">
              <PenLine className="w-3 h-3" /> Your signature is required — tap to sign
            </span>
          ) : iHaveSigned ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> You signed {formatDate(myTenantRecord!.signedAt!)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
              <Clock className="w-3 h-3" /> Awaiting landlord signature
            </span>
          )}

          <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
            View details →
          </span>
        </div>
      </button>

      {/* Quick sign button — floats at bottom when signature required, without navigating away */}
      {canSign && (
        <div className="px-5 pb-4">
          <Button
            onClick={e => { e.stopPropagation(); onSign(lease); }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 gap-2 text-sm"
          >
            <PenLine className="w-3.5 h-3.5" /> Sign Now
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeasesPage() {
  const { user } = useAuth();

  const isLandlord = user?.role === 'landlord' || user?.role === 'agent' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  // A landlord could also be a tenant on another property — show both tabs for them
  // Students and regular users only see tenant view
  const showBothViews = isLandlord;

  // 'landlord' | 'tenant'
  const [activeTab, setActiveTab] = useState<'landlord' | 'tenant'>(isLandlord ? 'landlord' : 'tenant');

  const [landlordLeases, setLandlordLeases] = useState<Lease[]>([]);
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [signLease, setSignLease] = useState<Lease | null>(null);
  const [terminateLease, setTerminateLease] = useState<Lease | null>(null);

  const fetchLeases = useCallback(async () => {
    setLoading(true);
    try {
      if (isLandlord) {
        const [lRes, tRes] = await Promise.allSettled([
          apiClient.getLandlordLeases(),
          apiClient.getMyTenantLeases(),
        ]);
        setLandlordLeases(lRes.status === 'fulfilled' ? lRes.value || [] : []);
        setTenantLeases(tRes.status === 'fulfilled' ? tRes.value || [] : []);
      } else {
        const res = await apiClient.getMyTenantLeases();
        setTenantLeases(res || []);
      }
    } catch {
      // handled per-call above
    } finally {
      setLoading(false);
    }
  }, [isLandlord]);

  useEffect(() => { fetchLeases(); }, [fetchLeases]);

  const activeLeasesRaw = activeTab === 'landlord' ? landlordLeases : tenantLeases;

  const filtered = activeLeasesRaw.filter(l => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSearch = !search.trim() ||
      l.propertyId?.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.tenants.some(t => t.tenantName.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const counts = activeLeasesRaw.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // How many tenant leases need my signature
  const pendingMySignature = tenantLeases.filter(l => {
    const me = l.tenants.find(t => t.tenantUserId === user?._id);
    return me && !me.signedAt && l.status === 'pending_tenant' && !!l.landlordSignedAt;
  }).length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <NavDash />

          <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn('p-2 rounded-xl', isStudent ? 'bg-purple-600' : 'bg-slate-900')}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Leases</h1>
                  <Badge className="bg-slate-100 text-slate-600 border-none">
                    {activeLeasesRaw.length} total
                  </Badge>
                  {pendingMySignature > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 border-none animate-pulse">
                      {pendingMySignature} awaiting your signature
                    </Badge>
                  )}
                </div>
                <p className="text-slate-500 text-sm pl-11">
                  {isStudent
                    ? 'Review and sign your rental agreements.'
                    : 'Create, sign, and manage your rental agreements.'}
                </p>
              </div>
              {isLandlord && activeTab === 'landlord' && (
                <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> New Lease
                </Button>
              )}
            </motion.div>

            {/* View toggle — only shown for landlords who may also be tenants */}
            {showBothViews && (
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  onClick={() => { setActiveTab('landlord'); setStatusFilter('all'); setSearch(''); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    activeTab === 'landlord' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  <Building2 className="w-3.5 h-3.5" /> My Properties
                </button>
                <button
                  onClick={() => { setActiveTab('tenant'); setStatusFilter('all'); setSearch(''); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all relative',
                    activeTab === 'tenant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> As Tenant
                  {pendingMySignature > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {pendingMySignature}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: activeLeasesRaw.length },
                { key: 'draft', label: 'Draft', count: counts.draft || 0 },
                { key: 'pending_tenant', label: 'Pending', count: counts.pending_tenant || 0 },
                { key: 'active', label: 'Active', count: counts.active || 0 },
                { key: 'expired', label: 'Expired', count: counts.expired || 0 },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border',
                    statusFilter === f.key
                      ? (isStudent ? 'bg-purple-700 text-white border-purple-700' : 'bg-slate-900 text-white border-slate-900')
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
                  )}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={cn('text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center', statusFilter === f.key ? 'bg-white/20' : 'bg-slate-100')}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by property or tenant…"
                className="pl-9 bg-white border-slate-200 rounded-xl shadow-sm"
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">
                  {activeLeasesRaw.length === 0
                    ? activeTab === 'tenant' ? 'No leases assigned to you yet' : 'No leases yet'
                    : 'No leases match your filters'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {activeLeasesRaw.length === 0
                    ? activeTab === 'tenant'
                      ? 'Your landlord will send you a lease to sign once one is created.'
                      : 'Create your first lease to get started.'
                    : 'Try changing the status filter or search term.'}
                </p>
                {activeLeasesRaw.length === 0 && isLandlord && activeTab === 'landlord' && (
                  <Button onClick={() => setShowCreate(true)} className="mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> Create First Lease
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(l =>
                  activeTab === 'landlord' ? (
                    <LandlordLeaseCard key={l._id} lease={l} onSign={setSignLease} onTerminate={setTerminateLease} />
                  ) : (
                    <TenantLeaseCard key={l._id} lease={l} currentUserId={user?._id ?? ''} onSign={setSignLease} />
                  )
                )}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Modals */}
      {showCreate && <CreateLeaseModal onClose={() => setShowCreate(false)} onCreated={fetchLeases} />}
      {signLease && <SignatureModal lease={signLease} onClose={() => setSignLease(null)} onSigned={fetchLeases} />}
      {terminateLease && <TerminateModal lease={terminateLease} onClose={() => setTerminateLease(null)} onTerminated={fetchLeases} />}
    </SidebarProvider>
  );
}