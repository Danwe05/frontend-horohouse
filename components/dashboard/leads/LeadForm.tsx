'use client';

import { useState } from 'react';
import { Loader2, UserPlus, Pencil, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus   = 'new' | 'contacted' | 'qualified' | 'lost';
type LeadPriority = 'low' | 'medium' | 'high';
type LeadSource   = 'website' | 'referral' | 'message' | 'campaign';

export type LeadNote = { _id?: string; content: string; createdAt: string };

export type Lead = {
  id?:               string;
  _id?:              string;
  name:              string;
  email?:            string;
  phone?:            string;
  interest?:         string;
  source:            LeadSource;
  status:            LeadStatus;
  location?:         string;
  createdAt:         string;
  lastContactedAt?:  string;
  budget?:           number;
  propertyType?:     string;
  priority?:         LeadPriority;
  assignedAgent?:    string;
  tags?:             string[];
  notes?:            LeadNote[];
};

const emptyLead: Partial<Lead> = {
  name: '', email: '', phone: '', location: '', interest: '',
  source: 'website', status: 'new', budget: undefined,
  propertyType: '', priority: undefined, assignedAgent: '', tags: [],
};

// ─── Shared field label ───────────────────────────────────────────────────────

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </span>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function LeadFormFields({
  data,
  setData,
  saving,
}: {
  data: Partial<Lead>;
  setData: (d: Partial<Lead>) => void;
  saving: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">

      {/* Name */}
      <div className="space-y-1.5">
        <FieldLabel label="Full Name" required />
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
        <FieldLabel label="Lead Source" required />
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
        <FieldLabel label="Email" />
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
        <FieldLabel label="Phone" />
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
        <FieldLabel label="Location" />
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
        <FieldLabel label="Budget (XAF)" />
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
        <FieldLabel label="Status" />
        <Select
          value={data.status ?? 'new'}
          onValueChange={v => setData({ ...data, status: v as LeadStatus })}
          disabled={saving}
        >
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
        <FieldLabel label="Priority" />
        <Select
          value={data.priority ?? ''}
          onValueChange={v => setData({ ...data, priority: (v as LeadPriority) || undefined })}
          disabled={saving}
        >
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

      {/* Property Type */}
      <div className="space-y-1.5">
        <FieldLabel label="Property Type" />
        <Input
          value={data.propertyType ?? ''}
          onChange={e => setData({ ...data, propertyType: e.target.value })}
          placeholder="Apartment, villa, land…"
          disabled={saving}
          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Assigned Agent */}
      <div className="space-y-1.5">
        <FieldLabel label="Assigned Agent" />
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
        <FieldLabel label="Interest / Notes" />
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

// ─── Add Lead Dialog ──────────────────────────────────────────────────────────

export function AddLeadForm({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: (lead: Lead) => void;
}) {
  const [data, setData] = useState<Partial<Lead>>({ ...emptyLead });
  const [saving, setSaving] = useState(false);

  function reset() { setData({ ...emptyLead }); }

  async function handleSubmit() {
    if (!data.name?.trim()) return;
    setSaving(true);
    try {
      const saved: Lead = await apiClient.createLead(data);
      toast.success('Lead registered successfully.');
      reset();
      onOpenChange(false);
      onSuccess?.(saved);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o); }}>
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
          <LeadFormFields data={data} setData={setData} saving={saving} />
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 gap-2">
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }} disabled={saving} className="rounded-xl font-semibold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!data.name?.trim() || saving}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 shadow-md shadow-blue-500/20 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {saving ? 'Registering…' : 'Register Lead'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Lead Dialog ─────────────────────────────────────────────────────────

export function EditLeadForm({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead | null;
  onSuccess?: (lead: Lead) => void;
}) {
  const [data, setData] = useState<Partial<Lead>>(lead ?? { ...emptyLead });
  const [saving, setSaving] = useState(false);

  // Sync local state when the lead prop changes (e.g. opening for a different lead)
  const leadId = lead?._id ?? lead?.id;
  const dataId  = data?._id  ?? data?.id;
  if (lead && leadId !== dataId) {
    setData({ ...lead });
  }

  async function handleSubmit() {
    if (!data.name?.trim() || !lead) return;
    setSaving(true);
    try {
      const id = lead._id ?? lead.id ?? '';
      const updated: Lead = await apiClient.updateLead(id, data);
      toast.success('Lead updated successfully.');
      onOpenChange(false);
      onSuccess?.(updated);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update lead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onOpenChange(false); }}>
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
          <LeadFormFields data={data} setData={setData} saving={saving} />
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-xl font-semibold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!data.name?.trim() || saving}
            className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 shadow-md shadow-violet-500/20 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}

// ─── LeadForm — named export consumed by leads/page.tsx ───────────────────────
// Delegates to AddLeadForm or EditLeadForm based on whether `lead` is provided.

export function LeadForm({
  open       = false,
  onOpenChange,
  lead,
  onSuccess,
}: {
  open?:          boolean;
  onOpenChange?:  (o: boolean) => void;
  lead?:          Lead | null;
  onSuccess?:     (lead: Lead) => void;
}) {
  const handleChange = onOpenChange ?? (() => {});

  if (lead) {
    return (
      <EditLeadForm
        open={open}
        onOpenChange={handleChange}
        lead={lead}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <AddLeadForm
      open={open}
      onOpenChange={handleChange}
      onSuccess={onSuccess}
    />
  );
}

export default LeadForm;