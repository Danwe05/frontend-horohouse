'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SignatureCanvas from 'react-signature-canvas';
import {
  ArrowLeft, FileText, Home, Building2, Calendar, DollarSign,
  User, Users, CheckCircle2, Clock, XCircle, AlertTriangle,
  PenLine, Trash2, Loader2, X, Mail, Phone, MessageSquare,
  Download, Wrench, Image as ImageIcon, ChevronDown, ChevronUp,
  Star, Shield, Send, Plus, ExternalLink, RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  tenantUserId: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  rentShare: number;
  signatureUrl?: string;
  signedAt?: string;
}

interface Clause {
  heading: string;
  body: string;
}

interface ConditionItem {
  label: string;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  photoUrls: string[];
}

interface ConditionLog {
  type: 'move_in' | 'move_out';
  loggedAt: string;
  overallNotes?: string;
  items: ConditionItem[];
}

interface Lease {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    address: string;
    city: string;
    images?: { url: string }[];
  };
  landlordUserId: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    profilePicture?: string;
  };
  tenants: Tenant[];
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositAmount: number;
  advanceMonths: number;
  status: 'draft' | 'pending_tenant' | 'active' | 'expired' | 'terminated';
  landlordSignedAt?: string;
  landlordSignatureUrl?: string;
  clauses: Clause[];
  customClauses: Clause[];
  conditionLogs: ConditionLog[];
  createdAt: string;
}

interface PaymentCycle {
  _id: string;
  cycleLabel: string;
  cycleStart: string;
  cycleEnd: string;
  totalRent: number;
  status: string;
  tenantShares: {
    tenantUserId: string;
    tenantName: string;
    amountDue: number;
    amountPaid?: number;
    status: string;
    dueDate: string;
  }[];
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

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const RATING_CFG = {
  excellent: { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  good: { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  fair: { label: 'Fair', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  poor: { label: 'Poor', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
};

const STATUS_CFG = {
  draft: { label: 'Draft', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
  pending_tenant: { label: 'Awaiting Tenant', icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
  active: { label: 'Active', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  expired: { label: 'Expired', icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
  terminated: { label: 'Terminated', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  partial: { label: 'Partial', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 -sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
          <span className="font-bold text-slate-900 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sign Modal ───────────────────────────────────────────────────────────────

function SignModal({ leaseId, propertyTitle, onClose, onSigned }: {
  leaseId: string;
  propertyTitle: string;
  onClose: () => void;
  onSigned: () => void;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [signing, setSigning] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleSign = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) { toast.error('Please draw your signature first.'); return; }
    setSigning(true);
    try {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      await apiClient.signDigitalLease(leaseId, dataUrl);
      toast.success('Lease signed! It is now active.');
      onSigned();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to sign.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl -2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-900">Sign Lease Agreement</h2>
            <p className="text-xs text-slate-500 mt-0.5">{propertyTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">By signing below you confirm all lease terms are correct and agree to be bound by this agreement.</p>
          <div className="border-1 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50">
            <SignatureCanvas ref={sigRef} canvasProps={{ width: 400, height: 160, className: 'w-full' }} backgroundColor="rgb(248,250,252)" onBegin={() => setIsEmpty(false)} />
          </div>
          <p className="text-[10px] text-slate-400 text-center">Draw your signature above</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => { sigRef.current?.clear(); setIsEmpty(true); }} className="flex-1">Clear</Button>
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

function TerminateModal({ leaseId, propertyTitle, onClose, onTerminated }: {
  leaseId: string;
  propertyTitle: string;
  onClose: () => void;
  onTerminated: () => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (reason.trim().length < 5) { toast.error('Please provide a reason (min 5 characters).'); return; }
    setLoading(true);
    try {
      await apiClient.terminateDigitalLease(leaseId, reason.trim());
      toast.success('Termination request submitted.');
      onTerminated();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to terminate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl -2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Request Termination?</h2>
          <p className="text-sm text-slate-500 mb-4">This will notify your landlord of your intent to terminate the lease for <span className="font-semibold text-slate-700">{propertyTitle}</span>.</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for termination (required)…" rows={3}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-slate-50 text-left" />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Cancel</Button>
          <Button onClick={handle} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
            Request Termination
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Maintenance Modal ────────────────────────────────────────────────────────

function MaintenanceModal({ lease, onClose, onSent }: {
  lease: Lease;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handle = async () => {
    if (!subject.trim() || !message.trim()) { toast.error('Please fill in all fields.'); return; }
    setSending(true);
    try {
      await apiClient.sendInquiry({
        propertyId: lease.propertyId._id,
        subject: `[Maintenance] ${subject.trim()}`,
        message: message.trim(),
        type: 'maintenance',
      });
      toast.success('Maintenance request sent to your landlord.');
      onSent();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to send request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl -2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-900">Report Maintenance Issue</h2>
            <p className="text-xs text-slate-500 mt-0.5">{lease.propertyId.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Title *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Leaking tap in bathroom"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue in detail…" rows={4}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={sending}>Cancel</Button>
            <Button onClick={handle} disabled={sending || !subject.trim() || !message.trim()} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
              {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : <><Send className="w-4 h-4 mr-2" />Send Request</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Photo Gallery ────────────────────────────────────────────────────────────

function PhotoGallery({ urls, label }: { urls: string[]; label: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (!urls.length) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {urls.map((url, i) => (
          <button key={i} onClick={() => setSelected(url)}
            className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 transition-all hover:scale-105">
            <img src={url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="absolute inset-0 bg-black/80" />
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={selected} alt={label} className="relative max-w-2xl max-h-[80vh] w-full object-contain rounded-xl -2xl" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors" onClick={() => setSelected(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const leaseId = params.id as string;

  const [lease, setLease] = useState<Lease | null>(null);
  const [cycles, setCycles] = useState<PaymentCycle[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSign, setShowSign] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const leaseData = await apiClient.getDigitalLease(leaseId);
      setLease(leaseData);

      // Fetch payment cycles and maintenance inquiries in parallel, silently ignore failures
      const [cyclesRes, inquiriesRes] = await Promise.allSettled([
        apiClient.getPaymentCyclesByLease(leaseId),
        leaseData?.propertyId?._id
          ? apiClient.getPropertyInquiries(leaseData.propertyId._id)
          : Promise.resolve([]),
      ]);
      setCycles(cyclesRes.status === 'fulfilled' ? cyclesRes.value || [] : []);
      setInquiries(inquiriesRes.status === 'fulfilled' ? inquiriesRes.value || [] : []);
    } catch {
      toast.error('Failed to load lease details.');
      router.push('/dashboard/leases');
    } finally {
      setLoading(false);
    }
  }, [leaseId, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleMessageLandlord = async () => {
    if (!lease) return;
    setMsgLoading(true);
    try {
      const conv = await apiClient.createConversation({
        participantId: lease.landlordUserId._id,
        propertyId: lease.propertyId._id,
        type: 'lease',
      });
      router.push(`/dashboard/inquiry?conversation=${conv._id || conv.conversationId}`);
    } catch {
      // Conversation may already exist — just go to inbox
      router.push('/dashboard/inquiry');
    } finally {
      setMsgLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f8fafc]">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!lease) return null;

  const myRecord = lease.tenants.find(t => t.tenantUserId === user?._id);
  const iHaveSigned = !!myRecord?.signedAt;
  const landlordSigned = !!lease.landlordSignedAt;
  const canSign = landlordSigned && lease.status === 'pending_tenant' && !iHaveSigned;
  const canTerminate = lease.status === 'active';
  const statusCfg = STATUS_CFG[lease.status] ?? STATUS_CFG.draft;
  const StatusIcon = statusCfg.icon;
  const propertyImg = lease.propertyId?.images?.[0]?.url;

  // Maintenance inquiries — filter for this property's maintenance type
  const maintenanceInquiries = inquiries.filter((inq: any) =>
    inq.type === 'maintenance' || inq.subject?.startsWith('[Maintenance]')
  );

  // Days until lease ends
  const daysLeft = Math.ceil((new Date(lease.leaseEnd).getTime() - Date.now()) / 86400000);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <NavDash />

          <div className="mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">

            {/* Back button */}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <button onClick={() => router.push('/dashboard/leases')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to leases
              </button>
            </motion.div>

            {/* Hero header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 -sm overflow-hidden">
              {/* Property image banner */}
              {propertyImg ? (
                <div className="h-40 w-full relative">
                  <img src={propertyImg} alt={lease.propertyId.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-xs font-medium mb-0.5 flex items-center gap-1">
                        <Home className="w-3 h-3" />{lease.propertyId.city}
                      </p>
                      <h1 className="text-white text-xl font-extrabold tracking-tight">{lease.propertyId.title}</h1>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold', statusCfg.bg, statusCfg.color)}>
                      <StatusIcon className="w-3 h-3" />{statusCfg.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-20 w-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center px-6 justify-between">
                  <div>
                    <p className="text-white/60 text-xs mb-0.5">{lease.propertyId.city}</p>
                    <h1 className="text-white text-xl font-extrabold">{lease.propertyId.title}</h1>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold', statusCfg.bg, statusCfg.color)}>
                    <StatusIcon className="w-3 h-3" />{statusCfg.label}
                  </span>
                </div>
              )}

              {/* Key metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
                {[
                  { label: 'My Share', value: formatXAF(myRecord?.rentShare ?? lease.monthlyRent) },
                  { label: 'Deposit', value: formatXAF(lease.depositAmount) },
                  { label: 'Start', value: formatDate(lease.leaseStart) },
                  { label: daysLeft > 0 ? `${daysLeft}d left` : 'Ended', value: formatDate(lease.leaseEnd) },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action bar */}
            {(canSign || canTerminate) && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-3">
                {canSign && (
                  <Button onClick={() => setShowSign(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 -sm">
                    <PenLine className="w-4 h-4" /> Sign Lease
                    <span className="ml-1 bg-white/20 text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">REQUIRED</span>
                  </Button>
                )}
                {canTerminate && (
                  <Button variant="outline" onClick={() => setShowTerminate(true)} className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl gap-2">
                    <Trash2 className="w-4 h-4" /> Request Termination
                  </Button>
                )}
              </motion.div>
            )}

            {/* ── Section: Landlord Contact ────────────────────────────── */}
            <Section title="Landlord Contact" icon={User}>
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {lease.landlordUserId.profilePicture
                    ? <img src={lease.landlordUserId.profilePicture} alt={lease.landlordUserId.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-500">
                      {lease.landlordUserId.name.charAt(0).toUpperCase()}
                    </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-lg">{lease.landlordUserId.name}</p>
                  <p className="text-sm text-slate-500">Property Owner / Manager</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button onClick={handleMessageLandlord} disabled={msgLoading} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2">
                    {msgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Message
                  </Button>
                  {lease.landlordUserId.email && (
                    <Button variant="outline" className="rounded-xl gap-2" asChild>
                      <a href={`mailto:${lease.landlordUserId.email}`}><Mail className="w-4 h-4" /> Email</a>
                    </Button>
                  )}
                  {lease.landlordUserId.phoneNumber && (
                    <Button variant="outline" className="rounded-xl gap-2" asChild>
                      <a href={`tel:${lease.landlordUserId.phoneNumber}`}><Phone className="w-4 h-4" /> Call</a>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowMaintenance(true)} className="rounded-xl gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
                    <Wrench className="w-4 h-4" /> Report Issue
                  </Button>
                </div>
              </div>
            </Section>

            {/* ── Section: Signing Status ──────────────────────────────── */}
            <Section title="Signing Status" icon={PenLine}>
              <div className="pt-4 space-y-2">
                {/* Landlord */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{lease.landlordUserId.name}</p>
                      <p className="text-[10px] text-slate-400">Landlord</p>
                    </div>
                  </div>
                  {landlordSigned
                    ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Signed {formatDate(lease.landlordSignedAt!)}</span>
                    : <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>
                  }
                </div>

                {/* Tenants */}
                {lease.tenants.map((t, i) => {
                  const isMe = t.tenantUserId === user?._id;
                  return (
                    <div key={i} className={cn('flex items-center justify-between p-3 rounded-xl border', isMe ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100')}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0', isMe ? 'bg-purple-200 text-purple-800' : 'bg-slate-200 text-slate-600')}>
                          {t.tenantName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{t.tenantName}{isMe && <span className="ml-1.5 text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">You</span>}</p>
                          <p className="text-[10px] text-slate-400">{formatXAF(t.rentShare)}/mo</p>
                        </div>
                      </div>
                      {t.signedAt
                        ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Signed {formatDate(t.signedAt)}</span>
                        : <span className="text-xs font-bold text-amber-600 flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> Awaiting</span>
                      }
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Section: Lease Terms ─────────────────────────────────── */}
            <Section title="Lease Terms & Clauses" icon={FileText}>
              <div className="pt-4 space-y-3">
                {/* Date + financial summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Lease Start', value: formatDateLong(lease.leaseStart) },
                    { label: 'Lease End', value: formatDateLong(lease.leaseEnd) },
                    { label: 'Advance Months', value: `${lease.advanceMonths} months` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-semibold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Standard clauses */}
                {[...lease.clauses, ...lease.customClauses].map((c, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-slate-400" />{c.heading}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Section: Payment History ─────────────────────────────── */}
            <Section title="Payment History" icon={DollarSign} defaultOpen={false}>
              <div className="pt-4">
                {cycles.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm">No payment cycles yet.</p>
                    <p className="text-xs mt-1">Cycles are created automatically when the lease activates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cycles.map(cycle => {
                      const myShare = cycle.tenantShares.find(s => s.tenantUserId === user?._id);
                      const pCfg = PAYMENT_STATUS_CFG[myShare?.status || 'pending'] ?? PAYMENT_STATUS_CFG.pending;
                      return (
                        <div key={cycle._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{cycle.cycleLabel}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Due {myShare?.dueDate ? formatDate(myShare.dueDate) : '—'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 text-sm">{formatXAF(myShare?.amountDue ?? 0)}</p>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block', pCfg.bg, pCfg.color)}>
                              {pCfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>

            {/* ── Section: Maintenance ────────────────────────────────── */}
            <Section title="Maintenance Requests" icon={Wrench} defaultOpen={false}>
              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-500">{maintenanceInquiries.length} request{maintenanceInquiries.length !== 1 ? 's' : ''} on record</p>
                  <Button size="sm" variant="outline" onClick={() => setShowMaintenance(true)} className="rounded-xl gap-1.5 h-8 text-xs">
                    <Plus className="w-3 h-3" /> New Request
                  </Button>
                </div>
                {maintenanceInquiries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm">No maintenance requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {maintenanceInquiries.map((inq: any) => (
                      <div key={inq._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-700 truncate">{inq.subject?.replace('[Maintenance] ', '') || inq.subject}</p>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                            inq.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          )}>
                            {inq.status || 'Open'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(inq.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* ── Section: Condition Logs ──────────────────────────────── */}
            {lease.conditionLogs?.length > 0 && (
              <Section title="Condition Logs" icon={ImageIcon} defaultOpen={false}>
                <div className="pt-4 space-y-6">
                  {lease.conditionLogs.map((log, logIdx) => (
                    <div key={logIdx}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full',
                          log.type === 'move_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        )}>
                          {log.type === 'move_in' ? 'Move-In' : 'Move-Out'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(log.loggedAt)}</span>
                      </div>
                      {log.overallNotes && (
                        <p className="text-sm text-slate-500 italic mb-3 pl-2 border-l-2 border-slate-200">{log.overallNotes}</p>
                      )}
                      <div className="space-y-3">
                        {log.items.map((item, itemIdx) => {
                          const rCfg = RATING_CFG[item.rating] ?? RATING_CFG.fair;
                          return (
                            <div key={itemIdx} className={cn('p-3 rounded-xl border', rCfg.bg)}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                                <span className={cn('text-[10px] font-bold flex items-center gap-1', rCfg.color)}>
                                  <span className={cn('w-2 h-2 rounded-full', rCfg.dot)} />
                                  {rCfg.label}
                                </span>
                              </div>
                              {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                              <PhotoGallery urls={item.photoUrls} label={item.label} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>
        </SidebarInset>
      </div>

      {/* Modals */}
      {showSign && <SignModal leaseId={leaseId} propertyTitle={lease.propertyId.title} onClose={() => setShowSign(false)} onSigned={fetchAll} />}
      {showTerminate && <TerminateModal leaseId={leaseId} propertyTitle={lease.propertyId.title} onClose={() => setShowTerminate(false)} onTerminated={() => { fetchAll(); router.push('/dashboard/leases'); }} />}
      {showMaintenance && <MaintenanceModal lease={lease} onClose={() => setShowMaintenance(false)} onSent={fetchAll} />}
    </SidebarProvider>
  );
}