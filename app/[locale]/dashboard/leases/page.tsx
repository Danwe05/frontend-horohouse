'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, X, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Home, Users, Calendar,
  PenLine, Trash2, Clock, CheckCircle2, XCircle,
  Search, Building2, DollarSign, User, UserSearch,
  GraduationCap, ExternalLink,
  ChevronRight,
} from 'lucide-react';

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
  draft: { label: 'Draft', icon: FileText, badge: 'border-[#DDDDDD] text-[#717171] bg-white', row: '' },
  pending_tenant: { label: 'Awaiting Tenant', icon: Clock, badge: 'border-[#C2410C]/30 text-[#C2410C] bg-[#FFF7ED]', row: 'bg-[#FFF7ED]/30' },
  active: { label: 'Active', icon: CheckCircle2, badge: 'border-[#008A05]/30 text-[#008A05] bg-[#EBFBF0]', row: '' },
  expired: { label: 'Expired', icon: XCircle, badge: 'border-[#DDDDDD] text-[#717171] bg-[#F7F7F7]', row: 'opacity-70' },
  terminated: { label: 'Terminated', icon: XCircle, badge: 'border-[#C2293F]/30 text-[#C2293F] bg-[#FFF8F6]', row: 'opacity-70' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border', cfg.badge)}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K FCFA`;
  return `${n.toLocaleString()} FCFA`;
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#222222]">Sign lease agreement</h2>
            <p className="text-[14px] text-[#717171] mt-1">{lease.propertyId?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <p className="text-[15px] text-[#717171] leading-relaxed">
            By signing below you confirm all lease terms are correct and agree to be bound by this agreement.
          </p>
          <div className="border border-[#B0B0B0] rounded-xl overflow-hidden bg-[#F7F7F7]">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{ width: 400, height: 160, className: 'w-full' }}
              onBegin={() => setIsEmpty(false)}
            />
          </div>
          <p className="text-[13px] text-[#717171] text-center">Draw your signature above</p>
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={() => { sigRef.current?.clear(); setIsEmpty(true); }} className="flex-1 h-12 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold hover:bg-[#F7F7F7]">
              Clear
            </Button>
            <Button onClick={handleSign} disabled={signing || isEmpty} className="flex-1 h-12 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold disabled:opacity-50">
              {signing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing...</> : "Sign lease"}
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFF8F6] border border-[#C2293F]/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-[#C2293F] stroke-[1.5]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#222222] mb-2">Request termination?</h2>
          <p className="text-[15px] text-[#717171] mb-6 leading-relaxed">
            This will notify all parties of your intent to terminate the lease for <span className="font-semibold text-[#222222]">{lease.propertyId?.title}</span>.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for termination (required)..."
            rows={4}
            className="w-full px-4 py-3 text-[15px] border border-[#B0B0B0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] resize-none bg-white placeholder:text-[#717171]"
          />
        </div>
        <div className="flex gap-4 px-8 pb-8 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold hover:bg-[#F7F7F7]" disabled={loading}>Cancel</Button>
          <Button onClick={handleTerminate} className="flex-1 h-12 rounded-lg bg-[#D90B38] hover:bg-[#B0092D] text-white font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Submit request
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
      <div className="flex items-center gap-3 px-4 py-3 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl">
        <div className="w-8 h-8 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[13px] font-bold text-[#222222] shrink-0 border border-[#DDDDDD]">
          {value.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#222222] truncate">{value.name}</p>
          {value.email && <p className="text-[13px] text-[#717171] truncate">{value.email}</p>}
        </div>
        <button onClick={onClear} className="text-[#717171] hover:text-[#C2293F] transition-colors shrink-0 focus:outline-none">
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717171]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 h-14 text-[16px] border border-[#B0B0B0] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#222222] placeholder:text-[#717171]"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717171] animate-spin" />}
      </div>
      <AnimatePresence mode="wait">
        {open && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-[#DDDDDD] rounded-xl shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
          >
            {results.map(u => (
              <button
                key={u._id ?? u.id}
                type="button"
                onClick={() => { onSelect(u); setQuery(''); setOpen(false); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F7F7F7] transition-colors text-left border-b border-[#EBEBEB] last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-[#EBEBEB] overflow-hidden flex items-center justify-center shrink-0 border border-[#DDDDDD]">
                  {u.profilePicture
                    ? <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                    : <span className="text-[14px] font-bold text-[#222222]">{u.name.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#222222] truncate">{u.name}</p>
                  <p className="text-[13px] text-[#717171] truncate">{u.email || u.phoneNumber || u._id}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
        {open && !loading && results.length === 0 && query.length >= 2 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-[#DDDDDD] rounded-xl shadow-lg px-6 py-4 text-[15px] text-[#717171]"
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
      setError(`Tenant shares must sum to ${formatFCFA(rent)} (currently ${formatFCFA(sharesSum)}).`);
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
  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#EBEBEB] shrink-0">
          <div>
            <h2 className="text-[22px] font-semibold text-[#222222]">Create new lease</h2>
            <p className="text-[14px] text-[#717171] mt-1">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-start gap-2 p-4 bg-[#FFF7ED] border border-[#C2410C]/20 rounded-xl text-[#C2410C] text-[14px] mb-6 font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[15px] font-semibold text-[#222222]">Property <span className="text-[#C2410C]">*</span></Label>
                {loadingProps ? (
                  <div className="h-14 bg-[#F7F7F7] rounded-xl animate-pulse" />
                ) : (
                  <select
                    value={form.propertyId}
                    onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                    className={cn(inputClasses, "appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat")}
                  >
                    <option value="">Select a property...</option>
                    {properties.map(p => <option key={p._id} value={p._id}>{p.title} — {p.city}</option>)}
                  </select>
                )}
                {selectedProp && (
                  <p className="text-[13px] text-[#717171] flex items-center gap-1.5 mt-2">
                    <Home className="w-3.5 h-3.5" />{selectedProp.address}, {selectedProp.city}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[15px] font-semibold text-[#222222]">Start date <span className="text-[#C2410C]">*</span></Label>
                  <Input type="date" value={form.leaseStart} onChange={e => setForm(f => ({ ...f, leaseStart: e.target.value }))} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[15px] font-semibold text-[#222222]">End date <span className="text-[#C2410C]">*</span></Label>
                  <Input type="date" value={form.leaseEnd} onChange={e => setForm(f => ({ ...f, leaseEnd: e.target.value }))} className={inputClasses} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[15px] font-semibold text-[#222222]">Monthly rent (FCFA) <span className="text-[#C2410C]">*</span></Label>
                  <Input type="number" value={form.monthlyRent} onChange={e => setForm(f => ({ ...f, monthlyRent: e.target.value }))} placeholder="e.g. 80000" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[15px] font-semibold text-[#222222]">Deposit (FCFA)</Label>
                  <Input type="number" value={form.depositAmount} onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))} placeholder="e.g. 160000" className={inputClasses} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-semibold text-[#222222]">Advance months (1-12)</Label>
                <Input type="number" min={1} max={12} value={form.advanceMonths} onChange={e => setForm(f => ({ ...f, advanceMonths: e.target.value }))} className={cn(inputClasses, "max-w-[200px]")} />
                <p className="text-[13px] text-[#717171]">Legal max in Cameroon is 12 months. Student-friendly is 3.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EBEBEB] pb-4">
                <p className="text-[18px] font-semibold text-[#222222]">{form.tenants.length} tenant{form.tenants.length > 1 ? 's' : ''}</p>
                <button onClick={addTenant} className="flex items-center gap-2 text-[14px] font-semibold text-[#222222] hover:text-[#717171] transition-colors focus:outline-none">
                  <Plus className="w-4 h-4 stroke-[2]" /> Add tenant
                </button>
              </div>
              
              <div className="space-y-6">
                {form.tenants.map((t, i) => (
                  <div key={i} className="p-6 bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB] space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-bold text-[#717171] uppercase tracking-wider">Tenant {i + 1}</p>
                      {form.tenants.length > 1 && (
                        <button onClick={() => removeTenant(i)} className="text-[#717171] hover:text-[#C2293F] transition-colors focus:outline-none p-1"><X className="w-5 h-5" /></button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[15px] font-semibold text-[#222222]">Search user <span className="text-[#C2410C]">*</span></Label>
                      <TenantSearchInput
                        value={t.resolved ? { id: t.tenantUserId, name: t.tenantName, email: t.tenantEmail, phone: t.tenantPhone } : null}
                        onSelect={u => selectTenant(i, u)}
                        onClear={() => clearTenant(i)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[15px] font-semibold text-[#222222]">Rent share (FCFA) <span className="text-[#C2410C]">*</span></Label>
                      <Input
                        type="number"
                        value={t.rentShare}
                        onChange={e => {
                          const tenants = [...form.tenants];
                          tenants[i] = { ...tenants[i], rentShare: e.target.value };
                          setForm(f => ({ ...f, tenants }));
                        }}
                        placeholder="e.g. 40000"
                        className={inputClasses}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={cn('flex items-center justify-between p-5 rounded-xl border font-semibold text-[16px]', sharesValid ? 'bg-[#EBFBF0] border-[#008A05]/20 text-[#008A05]' : 'bg-[#FFF8F6] border-[#C2293F]/20 text-[#C2293F]')}>
                <span>Total shares</span>
                <span>{formatFCFA(sharesSum)} {sharesValid ? '✓' : `(must equal ${formatFCFA(rent)})`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-8 py-6 border-t border-[#EBEBEB] bg-white shrink-0">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1 h-14 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold hover:bg-[#F7F7F7]">Cancel</Button>
              <Button onClick={() => { setError(''); setStep(2); }} disabled={!form.propertyId || !form.leaseStart || !form.leaseEnd || !form.monthlyRent} className="flex-1 h-14 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold">
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold hover:bg-[#F7F7F7]">Back</Button>
              <Button onClick={handleCreate} disabled={saving || !sharesValid} className="flex-1 h-14 rounded-lg bg-[#FF385C] hover:bg-[#D90B38] text-white font-semibold disabled:opacity-50">
                {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating...</> : "Create lease"}
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
      className={cn('bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden transition-all hover:border-[#B0B0B0]', cfg.row)}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-6 transition-colors focus:outline-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB] shrink-0">
            {propertyImg
              ? <img src={propertyImg} alt={lease.propertyId?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-[#DDDDDD]" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[18px] font-semibold text-[#222222] truncate">{lease.propertyId?.title || 'Unknown Property'}</p>
                <p className="text-[14px] text-[#717171] flex items-center gap-1.5 mt-1"><Home className="w-4 h-4" />{lease.propertyId?.city}</p>
              </div>
              <StatusBadge status={lease.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[14px] text-[#717171]">
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{formatFCFA(lease.monthlyRent)}/mo</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(lease.leaseStart)} – {formatDate(lease.leaseEnd)}</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{lease.tenants.length} tenant{lease.tenants.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Signing progress */}
        <div className="mt-6 pt-4 border-t border-[#EBEBEB]">
          <div className="flex items-center justify-between text-[12px] font-bold text-[#717171] uppercase tracking-wider mb-2">
            <span>Signing progress</span>
            <span>{[landlordSigned, ...lease.tenants.map(t => !!t.signedAt)].filter(Boolean).length}/{1 + lease.tenants.length} signed</span>
          </div>
          <div className="flex gap-2">
            <div className={cn('flex-1 h-2 rounded-full transition-all', landlordSigned ? 'bg-[#008A05]' : 'bg-[#DDDDDD]')} title="Landlord" />
            {lease.tenants.map((t, i) => (
              <div key={i} className={cn('flex-1 h-2 rounded-full transition-all', t.signedAt ? 'bg-[#008A05]' : 'bg-[#DDDDDD]')} title={t.tenantName} />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-end mt-4">
          <span className="text-[14px] font-semibold text-[#222222] underline flex items-center gap-1 hover:text-[#717171] transition-colors">
            {expanded ? 'Hide details' : 'Show details'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-[#EBEBEB]">
            <div className="p-6 space-y-6 bg-[#F7F7F7]">
              <div>
                <p className="text-[14px] font-semibold text-[#222222] mb-4">Signatures</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#DDDDDD]">
                    <div className="flex items-center gap-3"><User className="w-5 h-5 text-[#222222]" /><span className="text-[15px] font-semibold text-[#222222]">You (Landlord)</span></div>
                    {landlordSigned
                      ? <span className="text-[14px] font-bold text-[#008A05] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Signed {formatDate(lease.landlordSignedAt!)}</span>
                      : <span className="text-[14px] font-bold text-[#C2410C] flex items-center gap-1.5"><Clock className="w-4 h-4" /> Pending</span>
                    }
                  </div>
                  {lease.tenants.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#DDDDDD]">
                      <div className="flex items-center gap-3 min-w-0"><Users className="w-5 h-5 text-[#222222] shrink-0" /><span className="text-[15px] font-semibold text-[#222222] truncate">{t.tenantName}</span></div>
                      {t.signedAt
                        ? <span className="text-[14px] font-bold text-[#008A05] flex items-center gap-1.5 shrink-0"><CheckCircle2 className="w-4 h-4" /> Signed {formatDate(t.signedAt)}</span>
                        : <span className="text-[14px] font-bold text-[#C2410C] flex items-center gap-1.5 shrink-0"><Clock className="w-4 h-4" /> Awaiting</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[{ label: 'Monthly', value: formatFCFA(lease.monthlyRent) }, { label: 'Deposit', value: formatFCFA(lease.depositAmount) }, { label: 'Advance', value: `${lease.advanceMonths} mo` }]
                  .map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-4 border border-[#DDDDDD]">
                      <p className="text-[12px] font-bold text-[#717171] uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-[16px] font-semibold text-[#222222]">{value}</p>
                    </div>
                  ))}
              </div>
              <div className="flex gap-4 pt-2">
                {canSign && (
                  <Button onClick={() => onSign(lease)} className="flex-1 h-12 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[15px] gap-2">
                    <PenLine className="w-4 h-4" /> Sign Lease
                  </Button>
                )}
                {canTerminate && (
                  <Button variant="outline" onClick={() => onTerminate(lease)} className="flex-1 h-12 border-[#DDDDDD] text-[#222222] hover:bg-white rounded-lg font-semibold text-[15px] gap-2">
                    <Trash2 className="w-4 h-4" /> Terminate
                  </Button>
                )}
                {!canSign && !canTerminate && (
                  <p className="text-[14px] text-[#717171]">No actions available for this lease.</p>
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
      className={cn('bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden group transition-all hover:border-[#222222]', cfg.row)}
    >
      {/* Main clickable area */}
      <button
        onClick={() => router.push(`/dashboard/leases/${lease._id}`)}
        className="w-full text-left p-6 transition-colors focus:outline-none"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB] shrink-0">
            {propertyImg
              ? <img src={propertyImg} alt={lease.propertyId?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-[#DDDDDD]" /></div>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[18px] font-semibold text-[#222222] truncate">{lease.propertyId?.title || 'Unknown Property'}</p>
                <p className="text-[14px] text-[#717171] flex items-center gap-1.5 mt-1">
                  <Home className="w-4 h-4" />{lease.propertyId?.city}
                </p>
              </div>
              <StatusBadge status={lease.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[14px] text-[#717171]">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />{formatFCFA(myTenantRecord?.rentShare ?? lease.monthlyRent)}/mo
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />{formatDate(lease.leaseStart)} – {formatDate(lease.leaseEnd)}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />via {lease.landlordUserId?.name}
              </span>
            </div>
          </div>
          
          <div className="hidden sm:block shrink-0 pl-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#717171]">
            <ExternalLink className="w-5 h-5" />
          </div>
        </div>

        {/* Signing status pill */}
        <div className="mt-6 pt-4 border-t border-[#EBEBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {canSign ? (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold border border-[#C2410C]/30 text-[#C2410C] bg-[#FFF7ED]">
              <PenLine className="w-4 h-4" /> Signature required — click to sign
            </span>
          ) : iHaveSigned ? (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold border border-[#008A05]/30 text-[#008A05] bg-[#EBFBF0]">
              <CheckCircle2 className="w-4 h-4" /> You signed {formatDate(myTenantRecord!.signedAt!)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold border border-[#DDDDDD] text-[#717171] bg-[#F7F7F7]">
              <Clock className="w-4 h-4" /> Awaiting landlord signature
            </span>
          )}

          <span className="text-[14px] font-semibold text-[#222222] underline flex items-center gap-1 group-hover:text-[#717171] transition-colors">
            View lease <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </button>

      {/* Quick sign button */}
      {canSign && (
        <div className="px-6 pb-6 pt-2 bg-white">
          <Button
            onClick={e => { e.stopPropagation(); onSign(lease); }}
            className="w-full h-12 bg-[#222222] hover:bg-black text-white rounded-lg gap-2 text-[15px] font-semibold"
          >
            <PenLine className="w-4 h-4" /> Sign now
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
  const showBothViews = isLandlord;

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

  const pendingMySignature = tenantLeases.filter(l => {
    const me = l.tenants.find(t => t.tenantUserId === user?._id);
    return me && !me.signedAt && l.status === 'pending_tenant' && !!l.landlordSignedAt;
  }).length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset className="border-l border-[#EBEBEB] bg-transparent">
          <NavDash />

          <div className="mx-auto w-full max-w-5xl p-6 lg:p-10 space-y-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-2 flex items-center gap-3">
                  Leases
                  <span className="text-[14px] px-3 py-1 bg-[#F7F7F7] border border-[#EBEBEB] rounded-full text-[#222222] font-semibold tracking-normal flex items-center gap-1.5">
                    {activeLeasesRaw.length} total
                  </span>
                  {pendingMySignature > 0 && (
                    <span className="text-[14px] px-3 py-1 bg-[#FFF7ED] border border-[#C2410C]/30 text-[#C2410C] rounded-full font-semibold tracking-normal">
                      {pendingMySignature} awaiting signature
                    </span>
                  )}
                </h1>
                <p className="text-[16px] text-[#717171]">
                  {isStudent
                    ? 'Review, sign, and manage your rental agreements.'
                    : 'Create, sign, and manage your rental agreements.'}
                </p>
              </div>
              {isLandlord && activeTab === 'landlord' && (
                <Button onClick={() => setShowCreate(true)} className="h-12 px-6 bg-[#FF385C] hover:bg-[#D90B38] text-white rounded-lg font-semibold text-[15px] gap-2 active:scale-[0.98]">
                  <Plus className="w-5 h-5 stroke-[2]" /> New lease
                </Button>
              )}
            </motion.div>

            {/* View toggle */}
            {showBothViews && (
              <div className="flex gap-2 p-1.5 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl w-fit">
                <button
                  onClick={() => { setActiveTab('landlord'); setStatusFilter('all'); setSearch(''); }}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-lg text-[15px] font-semibold transition-all focus:outline-none',
                    activeTab === 'landlord' ? 'bg-white text-[#222222] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#717171] hover:text-[#222222]',
                  )}
                >
                  <Building2 className="w-4 h-4" /> My Properties
                </button>
                <button
                  onClick={() => { setActiveTab('tenant'); setStatusFilter('all'); setSearch(''); }}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-lg text-[15px] font-semibold transition-all relative focus:outline-none',
                    activeTab === 'tenant' ? 'bg-white text-[#222222] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#717171] hover:text-[#222222]',
                  )}
                >
                  <GraduationCap className="w-4 h-4" /> As Tenant
                  {pendingMySignature > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#D90B38] ml-1" />
                  )}
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717171]" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by property or tenant..."
                  className="pl-11 h-12 bg-white border-[#B0B0B0] rounded-xl text-[15px] focus-visible:ring-[#222222] placeholder:text-[#717171]"
                />
              </div>

              <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 sm:pb-0 items-center">
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
                      'flex items-center gap-2 px-5 h-10 rounded-full text-[14px] font-medium transition-all border whitespace-nowrap focus:outline-none',
                      statusFilter === f.key
                        ? 'bg-[#222222] text-white border-[#222222]'
                        : 'bg-white text-[#222222] border-[#DDDDDD] hover:border-[#222222]',
                    )}
                  >
                    {f.label}
                    {f.count > 0 && (
                      <span className={cn('text-[11px] font-bold px-1.5 rounded-full', statusFilter === f.key ? 'bg-white text-[#222222]' : 'bg-[#EBEBEB] text-[#222222]')}>
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-[#222222] stroke-[2.5]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-[#DDDDDD]">
                <FileText className="w-12 h-12 text-[#DDDDDD] mx-auto mb-4 stroke-[1.5]" />
                <p className="text-[#222222] text-[18px] font-semibold">
                  {activeLeasesRaw.length === 0
                    ? activeTab === 'tenant' ? 'No leases assigned to you yet' : 'No leases yet'
                    : 'No leases match your search'}
                </p>
                <p className="text-[15px] text-[#717171] mt-2 max-w-sm mx-auto">
                  {activeLeasesRaw.length === 0
                    ? activeTab === 'tenant'
                      ? 'Your landlord will send you a lease to sign once one is created.'
                      : 'Create your first lease to get started.'
                    : 'Try changing the status filter or search term.'}
                </p>
                {activeLeasesRaw.length === 0 && isLandlord && activeTab === 'landlord' && (
                  <Button onClick={() => setShowCreate(true)} className="mt-8 h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[15px] gap-2">
                    <Plus className="w-5 h-5" /> Create first lease
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
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