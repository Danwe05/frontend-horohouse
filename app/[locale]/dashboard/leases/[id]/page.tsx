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
  ArrowLeft, FileText, Home, Calendar, DollarSign,
  User, CheckCircle2, Clock, XCircle, AlertTriangle,
  PenLine, Trash2, Loader2, X, Mail, Phone, MessageSquare,
  Wrench, Image as ImageIcon, ChevronDown, ChevronUp,
  Shield, Send, Plus,
  MapPin
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

function formatFCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K FCFA`;
  return `${n.toLocaleString()} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const RATING_CFG = {
  excellent: { label: 'Excellent', color: 'text-[#008A05]', bg: 'bg-[#EBFBF0] border-[#008A05]/20', dot: 'bg-[#008A05]', border: 'border-[#008A05]/20' },
  good: { label: 'Good', color: 'text-[#222222]', bg: 'bg-[#F7F7F7] border-[#DDDDDD]', dot: 'bg-[#222222]', border: 'border-[#DDDDDD]' },
  fair: { label: 'Fair', color: 'text-[#C2410C]', bg: 'bg-[#FFF7ED] border-[#C2410C]/20', dot: 'bg-[#C2410C]', border: 'border-[#C2410C]/20' },
  poor: { label: 'Poor', color: 'text-[#C2293F]', bg: 'bg-[#FFF8F6] border-[#C2293F]/20', dot: 'bg-[#C2293F]', border: 'border-[#C2293F]/20' },
};

const STATUS_CFG = {
  draft: { label: 'Draft', icon: FileText, color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]' },
  pending_tenant: { label: 'Awaiting Tenant', icon: Clock, color: 'text-[#C2410C]', bg: 'bg-[#FFF7ED] border border-[#C2410C]/20' },
  active: { label: 'Active', icon: CheckCircle2, color: 'text-[#008A05]', bg: 'bg-[#EBFBF0] border border-[#008A05]/20' },
  expired: { label: 'Expired', icon: XCircle, color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]' },
  terminated: { label: 'Terminated', icon: XCircle, color: 'text-[#C2293F]', bg: 'bg-[#FFF8F6] border border-[#C2293F]/20' },
};

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: 'Paid', color: 'text-[#008A05]', bg: 'bg-[#EBFBF0] border-[#008A05]/20' },
  pending: { label: 'Pending', color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border-[#DDDDDD]' },
  overdue: { label: 'Overdue', color: 'text-[#C2293F]', bg: 'bg-[#FFF8F6] border-[#C2293F]/20' },
  partial: { label: 'Partial', color: 'text-[#C2410C]', bg: 'bg-[#FFF7ED] border-[#C2410C]/20' },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-[#F7F7F7] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#222222] stroke-[1.5]" />
          </div>
          <span className="font-semibold text-[#222222] text-[18px]">{title}</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-[#717171]" /> : <ChevronDown className="w-5 h-5 text-[#717171]" />}
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
            <div className="px-6 pb-6 pt-2 border-t border-[#EBEBEB]">{children}</div>
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB]">
          <div>
            <h2 className="font-semibold text-[22px] text-[#222222]">Sign lease agreement</h2>
            <p className="text-[14px] text-[#717171] mt-1">{propertyTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <p className="text-[15px] text-[#717171] leading-relaxed">
            By signing below you confirm all lease terms are correct and agree to be bound by this agreement.
          </p>
          <div className="border border-[#B0B0B0] rounded-xl overflow-hidden bg-[#F7F7F7]">
            <SignatureCanvas ref={sigRef} canvasProps={{ width: 400, height: 160, className: 'w-full' }} onBegin={() => setIsEmpty(false)} />
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFF8F6] border border-[#C2293F]/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-[#C2293F] stroke-[1.5]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#222222] mb-2">Request termination?</h2>
          <p className="text-[15px] text-[#717171] mb-6 leading-relaxed">
            This will notify your landlord of your intent to terminate the lease for <span className="font-semibold text-[#222222]">{propertyTitle}</span>.
          </p>
          <textarea 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            placeholder="Reason for termination (required)..." 
            rows={4}
            className="w-full px-4 py-3 text-[15px] border border-[#B0B0B0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent resize-none bg-white text-left placeholder:text-[#717171]" 
          />
        </div>
        <div className="flex gap-4 px-8 pb-8 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold hover:bg-[#F7F7F7]" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handle} className="flex-1 h-12 rounded-lg bg-[#D90B38] hover:bg-[#B0092D] text-white font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Submit request
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB]">
          <div>
            <h2 className="font-semibold text-[22px] text-[#222222]">Report an issue</h2>
            <p className="text-[14px] text-[#717171] mt-1">{lease.propertyId.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-[#222222]">Issue title</label>
            <input 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="e.g. Leaking tap in bathroom"
              className="w-full px-4 py-3 text-[16px] border border-[#B0B0B0] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent placeholder:text-[#717171]" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-[#222222]">Description</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Describe the issue in detail..." 
              rows={5}
              className="w-full px-4 py-3 text-[16px] border border-[#B0B0B0] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent resize-none placeholder:text-[#717171]" 
            />
          </div>
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-lg border-[#DDDDDD] text-[#222222] font-semibold hover:bg-[#F7F7F7]" disabled={sending}>Cancel</Button>
            <Button onClick={handle} disabled={sending || !subject.trim() || !message.trim()} className="flex-1 h-12 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold disabled:opacity-50">
              {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send request"}
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
      <div className="flex flex-wrap gap-3 mt-4">
        {urls.map((url, i) => (
          <button key={i} onClick={() => setSelected(url)}
            className="w-20 h-20 rounded-xl overflow-hidden border border-[#DDDDDD] hover:border-[#222222] transition-colors focus:outline-none">
            <img src={url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="absolute inset-0 bg-black/80" />
            <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              src={selected} alt={label} className="relative max-w-4xl max-h-[85vh] w-full object-contain rounded-none" />
            <button className="absolute top-6 right-6 p-3 bg-white rounded-full text-[#222222] hover:bg-[#F7F7F7] transition-colors focus:outline-none" onClick={() => setSelected(null)}>
              <X className="w-6 h-6" />
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
      router.push('/dashboard/inquiry');
    } finally {
      setMsgLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-white">
          <AppSidebar />
          <SidebarInset className="border-l border-[#EBEBEB]">
            <NavDash />
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-[#222222] stroke-[2.5]" />
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

  const maintenanceInquiries = inquiries.filter((inq: any) =>
    inq.type === 'maintenance' || inq.subject?.startsWith('[Maintenance]')
  );

  const daysLeft = Math.ceil((new Date(lease.leaseEnd).getTime() - Date.now()) / 86400000);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset className="border-l border-[#EBEBEB] bg-transparent">
          <NavDash />

          <div className="mx-auto w-full max-w-5xl p-6 lg:p-10 space-y-8">

            {/* Back button */}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <button 
                onClick={() => router.push('/dashboard/leases')}
                className="flex items-center gap-2 text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4" /> Back to leases
              </button>
            </motion.div>

            {/* Hero header */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden"
            >
              {/* Property image banner */}
              {propertyImg ? (
                <div className="h-56 w-full relative">
                  <img src={propertyImg} alt={lease.propertyId.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <p className="text-white/80 text-[13px] font-semibold tracking-wide uppercase mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {lease.propertyId.city}
                      </p>
                      <h1 className="text-white text-[28px] font-bold tracking-tight leading-tight">{lease.propertyId.title}</h1>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold border', statusCfg.bg, statusCfg.color)}>
                      <StatusIcon className="w-4 h-4" /> {statusCfg.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-[#F7F7F7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#EBEBEB]">
                  <div>
                    <p className="text-[#717171] text-[13px] font-semibold tracking-wide uppercase mb-1">{lease.propertyId.city}</p>
                    <h1 className="text-[#222222] text-[28px] font-bold tracking-tight leading-tight">{lease.propertyId.title}</h1>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold border', statusCfg.bg, statusCfg.color)}>
                    <StatusIcon className="w-4 h-4" /> {statusCfg.label}
                  </span>
                </div>
              )}

              {/* Key metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EBEBEB] border-t border-[#EBEBEB]">
                {[
                  { label: 'My Share', value: formatFCFA(myRecord?.rentShare ?? lease.monthlyRent) },
                  { label: 'Deposit', value: formatFCFA(lease.depositAmount) },
                  { label: 'Start Date', value: formatDate(lease.leaseStart) },
                  { label: daysLeft > 0 ? `${daysLeft} days left` : 'Ended', value: formatDate(lease.leaseEnd) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-5 flex flex-col justify-center bg-white">
                    <p className="text-[12px] font-bold text-[#717171] uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-[16px] font-semibold text-[#222222]">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action bar */}
            {(canSign || canTerminate) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                className="flex flex-wrap gap-4"
              >
                {canSign && (
                  <Button onClick={() => setShowSign(true)} className="h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[15px] gap-2">
                    <PenLine className="w-4 h-4" /> Sign Lease
                  </Button>
                )}
                {canTerminate && (
                  <Button variant="outline" onClick={() => setShowTerminate(true)} className="h-12 px-8 border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] rounded-lg font-semibold text-[15px] gap-2">
                    <Trash2 className="w-4 h-4" /> Request Termination
                  </Button>
                )}
              </motion.div>
            )}

            {/* ── Section: Landlord Contact ────────────────────────────── */}
            <Section title="Landlord Contact" icon={User}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
                <div className="w-20 h-20 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] overflow-hidden shrink-0 flex items-center justify-center">
                  {lease.landlordUserId.profilePicture
                    ? <img src={lease.landlordUserId.profilePicture} alt={lease.landlordUserId.name} className="w-full h-full object-cover" />
                    : <User className="w-8 h-8 text-[#222222] stroke-[1.5]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#222222] text-[20px]">{lease.landlordUserId.name}</p>
                  <p className="text-[15px] text-[#717171] mt-1">Property Owner / Manager</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <Button onClick={handleMessageLandlord} disabled={msgLoading} className="h-10 px-5 bg-[#222222] hover:bg-black text-white rounded-lg gap-2 font-semibold">
                    {msgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Message
                  </Button>
                  {lease.landlordUserId.email && (
                    <Button variant="outline" className="h-10 px-5 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] gap-2 font-semibold" asChild>
                      <a href={`mailto:${lease.landlordUserId.email}`}><Mail className="w-4 h-4" /> Email</a>
                    </Button>
                  )}
                  {lease.landlordUserId.phoneNumber && (
                    <Button variant="outline" className="h-10 px-5 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] gap-2 font-semibold" asChild>
                      <a href={`tel:${lease.landlordUserId.phoneNumber}`}><Phone className="w-4 h-4" /> Call</a>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowMaintenance(true)} className="h-10 px-5 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] gap-2 font-semibold">
                    <Wrench className="w-4 h-4" /> Report Issue
                  </Button>
                </div>
              </div>
            </Section>

            {/* ── Section: Signing Status ──────────────────────────────── */}
            <Section title="Signing Status" icon={PenLine}>
              <div className="space-y-4 mt-4">
                {/* Landlord */}
                <div className="flex items-center justify-between p-5 bg-[#F7F7F7] rounded-xl border border-[#DDDDDD]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#222222]" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-[#222222]">{lease.landlordUserId.name}</p>
                      <p className="text-[13px] text-[#717171]">Landlord</p>
                    </div>
                  </div>
                  {landlordSigned
                    ? <span className="text-[14px] font-bold text-[#008A05] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Signed {formatDate(lease.landlordSignedAt!)}</span>
                    : <span className="text-[14px] font-bold text-[#C2410C] flex items-center gap-1.5"><Clock className="w-4 h-4" /> Pending</span>
                  }
                </div>

                {/* Tenants */}
                {lease.tenants.map((t, i) => {
                  const isMe = t.tenantUserId === user?._id;
                  return (
                    <div key={i} className={cn('flex items-center justify-between p-5 rounded-xl border', isMe ? 'bg-white border-[#222222] shadow-[0_0_0_1px_#222222]' : 'bg-white border-[#DDDDDD]')}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 border', isMe ? 'bg-[#222222] text-white border-[#222222]' : 'bg-[#F7F7F7] text-[#222222] border-[#EBEBEB]')}>
                          {t.tenantName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold text-[#222222] truncate flex items-center gap-2">
                            {t.tenantName}
                            {isMe && <span className="text-[11px] font-bold text-[#222222] border border-[#222222] px-2 py-0.5 rounded-md">You</span>}
                          </p>
                          <p className="text-[13px] text-[#717171]">{formatFCFA(t.rentShare)}/mo</p>
                        </div>
                      </div>
                      {t.signedAt
                        ? <span className="text-[14px] font-bold text-[#008A05] flex items-center gap-1.5 shrink-0"><CheckCircle2 className="w-4 h-4" /> Signed {formatDate(t.signedAt)}</span>
                        : <span className="text-[14px] font-bold text-[#C2410C] flex items-center gap-1.5 shrink-0"><Clock className="w-4 h-4" /> Awaiting</span>
                      }
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Section: Lease Terms ─────────────────────────────────── */}
            <Section title="Lease Terms & Clauses" icon={FileText}>
              <div className="space-y-6 mt-4">
                {/* Date + financial summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Lease Start', value: formatDateLong(lease.leaseStart) },
                    { label: 'Lease End', value: formatDateLong(lease.leaseEnd) },
                    { label: 'Advance Months', value: `${lease.advanceMonths} months` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-5 border border-[#DDDDDD]">
                      <p className="text-[12px] font-bold text-[#717171] uppercase tracking-wider mb-2">{label}</p>
                      <p className="text-[16px] font-semibold text-[#222222]">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Standard clauses */}
                <div className="space-y-4">
                  {[...lease.clauses, ...lease.customClauses].map((c, i) => (
                    <div key={i} className="p-6 bg-[#F7F7F7] rounded-xl border border-[#EBEBEB]">
                      <p className="text-[15px] font-bold text-[#222222] mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#717171]" />{c.heading}
                      </p>
                      <p className="text-[15px] text-[#717171] leading-relaxed whitespace-pre-line">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── Section: Payment History ─────────────────────────────── */}
            <Section title="Payment History" icon={DollarSign} defaultOpen={false}>
              <div className="mt-4">
                {cycles.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-[#DDDDDD] rounded-xl">
                    <DollarSign className="w-10 h-10 mx-auto mb-3 text-[#DDDDDD] stroke-[1.5]" />
                    <p className="text-[16px] font-semibold text-[#222222]">No payment cycles yet.</p>
                    <p className="text-[14px] text-[#717171] mt-1 max-w-sm mx-auto">Cycles are created automatically when the lease activates.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cycles.map(cycle => {
                      const myShare = cycle.tenantShares.find(s => s.tenantUserId === user?._id);
                      const pCfg = PAYMENT_STATUS_CFG[myShare?.status || 'pending'] ?? PAYMENT_STATUS_CFG.pending;
                      return (
                        <div key={cycle._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-xl border border-[#DDDDDD] gap-4">
                          <div>
                            <p className="font-semibold text-[#222222] text-[16px]">{cycle.cycleLabel}</p>
                            <p className="text-[14px] text-[#717171] mt-1">
                              Due {myShare?.dueDate ? formatDate(myShare.dueDate) : '—'}
                            </p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                            <p className="font-semibold text-[#222222] text-[16px]">{formatFCFA(myShare?.amountDue ?? 0)}</p>
                            <span className={cn('text-[12px] font-bold px-3 py-1 rounded-full border', pCfg.bg, pCfg.color)}>
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
              <div className="mt-4">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#EBEBEB]">
                  <p className="text-[15px] font-semibold text-[#222222]">{maintenanceInquiries.length} request{maintenanceInquiries.length !== 1 ? 's' : ''} on record</p>
                  <Button onClick={() => setShowMaintenance(true)} className="rounded-lg h-10 px-4 bg-[#222222] hover:bg-black text-white font-semibold text-[14px] gap-2">
                    <Plus className="w-4 h-4" /> New Request
                  </Button>
                </div>
                {maintenanceInquiries.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-[#DDDDDD] rounded-xl">
                    <Wrench className="w-10 h-10 mx-auto mb-3 text-[#DDDDDD] stroke-[1.5]" />
                    <p className="text-[16px] font-semibold text-[#222222]">No maintenance requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {maintenanceInquiries.map((inq: any) => (
                      <div key={inq._id} className="p-5 bg-white rounded-xl border border-[#DDDDDD]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[16px] font-semibold text-[#222222]">{inq.subject?.replace('[Maintenance] ', '') || inq.subject}</p>
                            <p className="text-[14px] text-[#717171] mt-1">Submitted on {formatDate(inq.createdAt)}</p>
                          </div>
                          <span className={cn('text-[12px] font-bold px-3 py-1 rounded-full shrink-0 border',
                            inq.status === 'resolved' ? 'bg-[#EBFBF0] text-[#008A05] border-[#008A05]/20' : 'bg-[#FFF7ED] text-[#C2410C] border-[#C2410C]/20'
                          )}>
                            {inq.status === 'resolved' ? 'Resolved' : 'Open'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* ── Section: Condition Logs ──────────────────────────────── */}
            {lease.conditionLogs?.length > 0 && (
              <Section title="Condition Logs" icon={ImageIcon} defaultOpen={false}>
                <div className="pt-6 space-y-10">
                  {lease.conditionLogs.map((log, logIdx) => (
                    <div key={logIdx}>
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#EBEBEB]">
                        <span className={cn('text-[13px] font-bold px-3 py-1 rounded-full border uppercase tracking-wide',
                          log.type === 'move_in' ? 'bg-[#EBFBF0] text-[#008A05] border-[#008A05]/20' : 'bg-[#FFF8F6] text-[#C2293F] border-[#C2293F]/20'
                        )}>
                          {log.type === 'move_in' ? 'Move-In' : 'Move-Out'}
                        </span>
                        <span className="text-[15px] font-semibold text-[#222222]">{formatDateLong(log.loggedAt)}</span>
                      </div>
                      
                      {log.overallNotes && (
                        <div className="bg-[#F7F7F7] p-5 rounded-xl border border-[#EBEBEB] mb-6">
                          <p className="text-[15px] text-[#717171] italic leading-relaxed">"{log.overallNotes}"</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.items.map((item, itemIdx) => {
                          const rCfg = RATING_CFG[item.rating] ?? RATING_CFG.fair;
                          return (
                            <div key={itemIdx} className={cn('p-5 rounded-xl border bg-white', rCfg.border)}>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-[16px] font-semibold text-[#222222]">{item.label}</p>
                                <span className={cn('text-[12px] font-bold px-2.5 py-1 rounded-full border', rCfg.bg, rCfg.color)}>
                                  {rCfg.label}
                                </span>
                              </div>
                              {item.notes && <p className="text-[14px] text-[#717171] mb-4">{item.notes}</p>}
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