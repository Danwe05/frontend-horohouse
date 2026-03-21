"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import { useSubscription } from "@/hooks/usePayment";
import {
  CreditCard, History, CheckCircle2, Wallet, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, CalendarDays, Smartphone, Globe, AlertCircle, Star,
  RefreshCw, X, ChevronLeft, ChevronRight as ChevronRightIcon, Loader2,
  TrendingUp, DollarSign, Receipt, Ban, Search, Download, Bell,
  Building2, Phone, BarChart2, LogOut, Activity, Landmark, HeartHandshake,
  Clock, ArrowDownRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiClient } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type TxStatus = "pending" | "success" | "failed" | "cancelled" | "refunded";
type TxType = "subscription" | "listing_fee" | "boost_listing" | "commission"
  | "digital_service" | "refund" | "wallet_topup" | "wallet_withdrawal" | "booking";
type PayMethod = "mtn_momo" | "orange_money" | "card" | "bank_transfer" | "wallet";

interface Transaction {
  _id: string; amount: number; currency: string; type: TxType; status: TxStatus;
  paymentMethod: PayMethod; description?: string; flutterwaveReference?: string;
  flutterwavePaymentLink?: string; customerName?: string; platformFee?: number;
  paymentProcessingFee?: number; netAmount?: number; failureReason?: string;
  completedAt?: string; createdAt: string;
  propertyId?: { title: string }; bookingId?: { checkIn: string; checkOut: string; nights: number };
}
interface WalletData {
  balance: number; availableBalance: number; pendingBalance: number;
  totalEarned: number; totalWithdrawn: number; currency?: string;
  bankAccountName?: string; bankAccountNumber?: string; bankName?: string; bankCode?: string;
  mobileMoneyNumber?: string; mobileMoneyProvider?: string;
}
interface PaginationMeta { total: number; page: number; totalPages: number; }
interface ChartDataPoint { name: string; amount: number; }


// ─── Helpers ──────────────────────────────────────────────────────────────────
const fc = (n: number, cur = "XAF") =>
  cur === "XAF" || cur === "XOF"
    ? `${(n ?? 0).toLocaleString("fr-FR")} ${cur}`
    : new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n ?? 0);

const fd = (ds: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ds));

// ─── Logos ───────────────────────────────────────────────────────────────────
const VisaLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 200 64" fill="none">
    <path d="M85.2 4.8 L66.5 59.2H48.6L30 17.4c-1.2-3-2.2-4.1-5.8-5.4C18.6 9.7 8.8 7.2 0 5.7L.4 4.8H31c4 0 7.5 2.7 8.4 7.2L47.5 52 85.2 4.8Z" fill="#1434CB" />
    <path d="M168.4 59.2H152l11.2-54.4H179.6L168.4 59.2ZM133.8 4.8c-3.8-1.4-9.8-3-17.2-3-18.9 0-32.2 10.1-32.4 24.5-.2 10.7 9.5 16.6 16.7 20.2 7.4 3.6 9.9 5.9 9.8 9.2-.1 4.9-5.9 7.2-11.3 7.2-7.6 0-11.6-1.1-17.8-3.8L79.3 57l-2.2 13.7c3.8 1.7 10.8 3.3 18 3.4 19 0 31.4-9.4 31.6-24.4.1-8.1-4.8-14.3-15.3-19.4-6.4-3.3-10.3-5.5-10.2-8.8.1-3 3.3-6.2 10.4-6.2 6-.1 10.4 1.3 13.8 2.7l1.6.8 2.8-13.8Z" fill="#1434CB" />
  </svg>
);
const MastercardLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 50 32" fill="none">
    <circle cx="18" cy="16" r="14" fill="#EB001B" />
    <circle cx="32" cy="16" r="14" fill="#F79E1B" />
    <path d="M25 26.5C22.1 24.4 20 21 20 16C20 11 22.1 7.6 25 5.5C27.9 7.6 30 11 30 16C30 21 27.9 24.4 25 26.5Z" fill="#FF5F00" />
  </svg>
);
const MoMoBadge = () => <div className="flex items-center justify-center bg-[#FFCC00] text-black text-[11px] font-black px-2 py-1 rounded-lg w-16 h-9 shrink-0 text-center leading-tight border border-[#E6B800]">MoMo</div>;
const OrangeBadge = () => <div className="flex items-center justify-center bg-[#FF7900] text-white text-[9px] font-black px-2 py-1 rounded-lg w-16 h-9 shrink-0 text-center leading-tight border border-[#E66D00]">Orange<br />Money</div>;

const METHOD_META: Record<PayMethod, { label: string; logo: () => JSX.Element }> = {
  card: { label: "Card", logo: () => <div className="flex gap-1"><VisaLogo /><MastercardLogo /></div> },
  mtn_momo: { label: "MTN MoMo", logo: MoMoBadge },
  orange_money: { label: "Orange Money", logo: OrangeBadge },
  bank_transfer: { label: "Bank Transfer", logo: () => <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">BANK</span> },
  wallet: { label: "Wallet", logo: () => <Wallet className="w-5 h-5 text-indigo-600" /> },
};

const TYPE_META: Record<TxType, { label: string; icon: JSX.Element; bg: string; text: string; credit?: boolean }> = {
  booking: { label: "Booking", icon: <ArrowUpRight className="w-4 h-4" />, bg: "bg-blue-50", text: "text-blue-600" },
  subscription: { label: "Subscription", icon: <Star className="w-4 h-4" />, bg: "bg-purple-50", text: "text-purple-600" },
  listing_fee: { label: "Listing Fee", icon: <Receipt className="w-4 h-4" />, bg: "bg-amber-50", text: "text-amber-600" },
  boost_listing: { label: "Boost", icon: <TrendingUp className="w-4 h-4" />, bg: "bg-green-50", text: "text-green-600" },
  commission: { label: "Commission", icon: <DollarSign className="w-4 h-4" />, bg: "bg-sky-50", text: "text-sky-600", credit: true },
  digital_service: { label: "Digital Svc", icon: <Globe className="w-4 h-4" />, bg: "bg-teal-50", text: "text-teal-600" },
  refund: { label: "Refund", icon: <ArrowDownLeft className="w-4 h-4" />, bg: "bg-emerald-50", text: "text-emerald-600", credit: true },
  wallet_topup: { label: "Top-up", icon: <Wallet className="w-4 h-4" />, bg: "bg-indigo-50", text: "text-indigo-600", credit: true },
  wallet_withdrawal: { label: "Withdrawal", icon: <LogOut className="w-4 h-4" />, bg: "bg-rose-50", text: "text-rose-600" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TxStatus }) {
  const cfg: Record<TxStatus, [string, JSX.Element, string]> = {
    success: ["bg-emerald-50 text-emerald-700 border-emerald-200/60", <CheckCircle2 className="w-3 h-3" />, "Paid"],
    failed: ["bg-red-50 text-red-700 border-red-200/60", <AlertCircle className="w-3 h-3" />, "Failed"],
    pending: ["bg-amber-50 text-amber-700 border-amber-200/60", <Loader2 className="w-3 h-3 animate-spin" />, "Pending"],
    cancelled: ["bg-slate-100 text-slate-500 border-slate-200/60", <Ban className="w-3 h-3" />, "Cancelled"],
    refunded: ["bg-purple-50 text-purple-700 border-purple-200/60", <ArrowDownLeft className="w-3 h-3" />, "Refunded"],
  };
  const [cls, icon, label] = cfg[status] ?? cfg.pending;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{icon}{label}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type = "success", onClose }: { msg: string; type?: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl -2xl animate-in slide-in-from-bottom-4 ${type === "error" ? "bg-red-600" : "bg-gray-900"} text-white`}>
      {type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-300 shrink-0" />}
      <span className="font-medium text-sm">{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4 text-white/60 hover:text-white" /></button>
    </div>
  );
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: ChartDataPoint[] }) {
  const [range, setRange] = useState<"6m" | "1y">("6m");
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 -sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Revenue Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Monthly earnings performance</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["6m", "1y"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === r ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:bg-slate-100"}`}>
              {r === "6m" ? "6 Months" : "1 Year"}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} dy={8} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip
                contentStyle={{ borderRadius: "14px", border: "none", box: "0 10px 25px -5px rgb(0 0 0 / 0.12)", padding: "10px 14px", fontSize: "12px" }}
                formatter={(value: number) => [fc(value), "Revenue"]}
                labelStyle={{ fontWeight: 700, color: "#1e293b", marginBottom: 2 }}
              />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5}
                fillOpacity={1} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Activity KPI Cards ───────────────────────────────────────────────────────
function ActivityKPIs({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  const INCOME_TYPES: TxType[] = ["commission", "refund", "wallet_topup"];

  const stats = useMemo(() => {
    const income = transactions.filter(t => INCOME_TYPES.includes(t.type) && t.status === "success").reduce((s, t) => s + t.amount, 0);
    const paidOut = transactions.filter(t => t.status === "success" && !TYPE_META[t.type]?.credit).reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter(t => t.status === "pending").length;
    const failed = transactions.filter(t => t.status === "failed").length;
    return { income, paidOut, pending, failed };
  }, [transactions]);

  const cards = [
    { label: "Booking Income", value: fc(stats.income, currency), icon: <ArrowDownLeft className="w-5 h-5" />, bg: "bg-emerald-50", text: "text-emerald-700", ib: "bg-emerald-100 text-emerald-600" },
    { label: "Total Paid Out", value: fc(stats.paidOut, currency), icon: <ArrowUpRight className="w-5 h-5" />, bg: "bg-blue-50", text: "text-blue-700", ib: "bg-blue-100 text-blue-600" },
    { label: "Pending", value: String(stats.pending), icon: <Loader2 className="w-5 h-5" />, bg: "bg-amber-50", text: "text-amber-700", ib: "bg-amber-100 text-amber-600" },
    { label: "Failed", value: String(stats.failed), icon: <AlertCircle className="w-5 h-5" />, bg: "bg-red-50", text: "text-red-700", ib: "bg-red-100 text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl p-4 flex items-center gap-3`}>
          <div className={`p-2.5 rounded-xl ${c.ib} shrink-0`}>{c.icon}</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className={`text-base font-black ${c.text} leading-tight mt-0.5`}>{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Withdrawal Modal ─────────────────────────────────────────────────────────
function WithdrawModal({ wallet, onClose, onSuccess }: { wallet: WalletData; onClose: () => void; onSuccess: () => void }) {
  const [method, setMethod] = useState<"mtn_momo" | "orange_money" | "bank_transfer">("mtn_momo");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(wallet.mobileMoneyNumber ?? "");
  const [accName, setAccName] = useState(wallet.bankAccountName ?? "");
  const [accNum, setAccNum] = useState(wallet.bankAccountNumber ?? "");
  const [bankName, setBankName] = useState(wallet.bankName ?? "");
  const [bankCode, setBankCode] = useState(wallet.bankCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const avail = wallet.availableBalance ?? wallet.balance ?? 0;
  const cur = wallet.currency ?? "XAF";

  const submit = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt < 5000) { setError("Minimum withdrawal is 5,000 XAF"); return; }
    if (amt > avail) { setError("Insufficient available balance"); return; }
    setLoading(true);
    try {
      const payload: any = { amount: amt, withdrawalMethod: method, accountNumber: method === "bank_transfer" ? accNum : phone };
      if (method === "bank_transfer") { payload.accountName = accName; payload.bankCode = bankCode; }
      await apiClient.withdrawFunds(payload);
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Withdrawal failed. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl -2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="font-bold text-slate-900 text-lg">Withdraw Funds</h3>
            <p className="text-sm text-slate-400">Available: <span className="font-semibold text-slate-700">{fc(avail, cur)}</span></p></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(["mtn_momo", "orange_money", "bank_transfer"] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`p-3 rounded-xl border-1 text-xs font-semibold transition-all ${method === m ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-600 hover:border-blue-200"}`}>
                  {m === "mtn_momo" ? "MTN MoMo" : m === "orange_money" ? "Orange Money" : "Bank Transfer"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Amount (XAF)</label>
            <div className="flex gap-2">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="5000"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <button onClick={() => setAmount(String(avail))} className="px-3 py-2.5 text-xs font-bold bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200">Max</button>
            </div>
          </div>
          {(method === "mtn_momo" || method === "orange_money") && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="237XXXXXXXXX"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          )}
          {method === "bank_transfer" && (
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Account Name</label>
                <input value={accName} onChange={e => setAccName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Account Number</label>
                <input value={accNum} onChange={e => setAccNum(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bank Name</label>
                  <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bank Code</label>
                  <input value={bankCode} onChange={e => setBankCode(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold  transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing…" : "Confirm Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payout Setup Card ────────────────────────────────────────────────────────
function PayoutSetupCard({ wallet, onSaved }: { wallet: WalletData | null; onSaved: () => void }) {
  const [tab, setTab] = useState<"momo" | "bank">("momo");
  const [provider, setProvider] = useState<"MTN" | "ORANGE">(wallet?.mobileMoneyProvider as any ?? "MTN");
  const [phone, setPhone] = useState(wallet?.mobileMoneyNumber ?? "");
  const [accName, setAccName] = useState(wallet?.bankAccountName ?? "");
  const [accNum, setAccNum] = useState(wallet?.bankAccountNumber ?? "");
  const [bankName, setBankName] = useState(wallet?.bankName ?? "");
  const [bankCode, setBankCode] = useState(wallet?.bankCode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError(""); setSaving(true);
    try {
      if (tab === "momo") await apiClient.updateWalletMobileMoney({ phoneNumber: phone, provider });
      else await apiClient.updateWalletBankAccount({ accountName: accName, accountNumber: accNum, bankName, bankCode });
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Could not save. Try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 -sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 rounded-xl"><Building2 className="w-5 h-5 text-indigo-600" /></div>
        <div><h2 className="font-bold text-slate-900">Payout Details</h2>
          <p className="text-xs text-slate-500">Where we'll send your earnings</p></div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button onClick={() => setTab("momo")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "momo" ? "bg-white  text-blue-700" : "text-slate-500"}`}>
            <Phone className="w-4 h-4 inline mr-1.5" />Mobile Money
          </button>
          <button onClick={() => setTab("bank")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "bank" ? "bg-white  text-blue-700" : "text-slate-500"}`}>
            <Building2 className="w-4 h-4 inline mr-1.5" />Bank Account
          </button>
        </div>
        {tab === "momo" ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["MTN", "ORANGE"] as const).map(p => (
                <button key={p} onClick={() => setProvider(p)}
                  className={`flex-1 py-2 rounded-xl border-1 text-sm font-bold transition-all ${provider === p ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-500 hover:border-blue-200"}`}>
                  {p === "MTN" ? "MTN MoMo" : "Orange Money"}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="237XXXXXXXXX"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Account Name</label>
              <input value={accName} onChange={e => setAccName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Account Number</label>
              <input value={accNum} onChange={e => setAccNum(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bank Name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bank Code</label>
                <input value={bankCode} onChange={e => setBankCode(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl">{error}</p>}
        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Save Payout Details"}
        </button>
      </div>
    </div>
  );
}

// ─── Transaction Detail Modal ─────────────────────────────────────────────────
function TxModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const tm = TYPE_META[tx.type] ?? TYPE_META.booking;
  const mm = METHOD_META[tx.paymentMethod] ?? METHOD_META.card;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl -2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${tm.bg} ${tm.text}`}>{tm.icon}</div>
            <div><h3 className="font-bold text-slate-900">{tm.label}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{tx.flutterwaveReference?.slice(-14) ?? tx._id.slice(-10)}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Amount</p>
          <p className={`text-3xl font-black ${tm.credit ? "text-emerald-600" : "text-slate-900"}`}>
            {tm.credit ? "+" : ""}{fc(tx.amount, tx.currency)}
          </p>
          <div className="mt-2"><StatusBadge status={tx.status} /></div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Date</p>
            <p className="text-sm font-semibold text-slate-800">{fd(tx.createdAt)}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Method</p>
            <p className="text-sm font-semibold text-slate-800">{mm.label}</p></div>
          {tx.description && <div className="col-span-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Description</p>
            <p className="text-sm font-semibold text-slate-800">{tx.description}</p></div>}
          {(tx.paymentProcessingFee ?? 0) > 0 && <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Processing Fee</p>
            <p className="text-sm text-slate-600">{fc(tx.paymentProcessingFee!, tx.currency)}</p></div>}
          {tx.netAmount != null && <div className="col-span-2 bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Net Amount</p>
            <p className="text-base font-bold text-slate-800">{fc(tx.netAmount, tx.currency)}</p></div>}
          {tx.failureReason && <div className="col-span-2 bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-xs text-red-500 uppercase tracking-wider font-semibold mb-1">Failure Reason</p>
            <p className="text-sm text-red-700">{tx.failureReason}</p></div>}
          {tx.propertyId?.title && <div className="col-span-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Property</p>
            <p className="text-sm font-semibold text-slate-800">{tx.propertyId.title}</p></div>}
        </div>
        {tx.status === "pending" && tx.flutterwavePaymentLink && (
          <div className="p-6 pt-0">
            <a href={tx.flutterwavePaymentLink} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold  transition-colors">
              Complete Payment →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(transactions: Transaction[]) {
  const hdr = "Date,Type,Description,Amount,Currency,Status,Method,Reference";
  const rows = transactions.map(t =>
    [fd(t.createdAt), t.type, `"${t.description ?? ""}"`, t.amount, t.currency, t.status, t.paymentMethod, t.flutterwaveReference ?? t._id].join(",")
  );
  const blob = new Blob([[hdr, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `horohouse-transactions-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("settings");

  // ── Subscription ──
  const { subscription, loading: subLoading } = useSubscription();
  const remainingDays = useMemo(() => {
    if (!subscription?.endDate) return null;
    const diff = new Date(subscription.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }, [subscription?.endDate]);

  // ── Preferred method ──
  const [preferred, setPreferred] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("hh_preferred_method") ?? "" : ""
  );

  // ── Wallet ──
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // ── Revenue chart data ──
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // ── Transactions ──
  const [transactions, setTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  // ── Filters ──
  const [filterStatus, setFilterStatus] = useState<TxStatus | "all">("all");
  const [filterType, setFilterType] = useState<TxType | "all">("all");
  const [filterMethod, setFilterMethod] = useState<PayMethod | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [flowDir, setFlowDir] = useState<"all" | "income" | "expenses">("all");

  // ── UI ──
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [pendingAlert, setPendingAlert] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  // ── Initial data load ──
  useEffect(() => {
    setWalletLoading(true);
    apiClient.getWalletStats()
      .then(d => setWallet(d as WalletData))
      .catch(() => apiClient.getWallet().then(d => setWallet(d as WalletData)).catch(() => setWallet(null)))
      .finally(() => setWalletLoading(false));

    // Build the revenue chart from the user's own transactions (last 6 months).
    // We avoid the /analytics/revenue/monthly-chart endpoint because it is an
    // admin/host endpoint and returns empty data for regular users.
    apiClient.getUserTransactions({ limit: 500 })
      .then((res: any) => {
        const txs: Transaction[] = res.transactions ?? [];
        const INCOME_TYPES: TxType[] = ["commission", "refund", "wallet_topup"];

        // Build a map of month label → total income
        const map: Record<string, number> = {};
        const now = new Date();
        // Pre-populate the last 6 months so months with no data still show as 0
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
          map[key] = 0;
        }

        txs.forEach(t => {
          if (t.status !== "success") return;
          if (!INCOME_TYPES.includes(t.type)) return;
          const d = new Date(t.createdAt);
          const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
          if (key in map) map[key] = (map[key] ?? 0) + t.amount;
        });

        setChartData(Object.entries(map).map(([name, amount]) => ({ name, amount })));
      })
      .catch(() => setChartData([]));
  }, []);

  // ── Load transactions ──
  const loadTxs = useCallback(async () => {
    setTxLoading(true); setTxError(null);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      if (filterMethod !== "all") params.paymentMethod = filterMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await apiClient.getUserTransactions(params);
      const txs: Transaction[] = res.transactions ?? [];
      setTxs(txs);
      setPagination({ total: res.total, page: res.page, totalPages: res.totalPages });
      if (txs.some(t => t.status === "pending" && t.flutterwavePaymentLink)) setPendingAlert(true);
    } catch { setTxError("Could not load transactions. Please try again."); }
    finally { setTxLoading(false); }
  }, [page, filterStatus, filterType, filterMethod, startDate, endDate]);

  useEffect(() => { if (activeTab === "activity") loadTxs(); }, [activeTab, loadTxs]);
  useEffect(() => { setPage(1); }, [filterStatus, filterType, filterMethod, startDate, endDate]);

  useEffect(() => {
    const handler = () => { if (!document.hidden && activeTab === "activity") loadTxs(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [activeTab, loadTxs]);

  const INCOME_TYPES: TxType[] = ["commission", "refund", "wallet_topup"];
  const EXPENSE_TYPES: TxType[] = ["subscription", "listing_fee", "boost_listing", "digital_service", "wallet_withdrawal"];

  const visibleTxs = useMemo(() => {
    let list = transactions;
    if (flowDir === "income") list = list.filter(t => INCOME_TYPES.includes(t.type));
    if (flowDir === "expenses") list = list.filter(t => EXPENSE_TYPES.includes(t.type));
    if (search.trim()) list = list.filter(t =>
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.flutterwaveReference ?? "").toLowerCase().includes(search.toLowerCase()) ||
      t._id.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [transactions, flowDir, search]);

  const pendingCount = transactions.filter(t => t.status === "pending" && t.flutterwavePaymentLink).length;
  const cur = wallet?.currency ?? "XAF";

  const handleSetPreferred = (m: string) => {
    setPreferred(m); localStorage.setItem("hh_preferred_method", m);
    showToast(`Preferred method set to ${METHOD_META[m as PayMethod]?.label ?? m}`);
  };

  const PREF_METHODS = [
    { id: "card", name: "Credit / Debit Card", desc: "Visa, Mastercard", icon: <CreditCard className="w-5 h-5" /> },
    { id: "mtn_momo", name: "MTN Mobile Money", desc: "Pay via MoMo", icon: <Smartphone className="w-5 h-5" /> },
    { id: "orange_money", name: "Orange Money", desc: "Orange wallet", icon: <Smartphone className="w-5 h-5" /> },
    { id: "bank_transfer", name: "Bank Transfer", desc: "Direct transfer", icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <NavDash />
          <div className="p-4 md:p-8 pt-6">
            <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-white -sm shrink-0"><Wallet className="w-5 h-5" /></div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Billing &amp; Payments</h1>
                    <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Secured by Flutterwave.
                    </p>
                  </div>
                </div>
                <button onClick={() => exportCSV(visibleTxs)} disabled={!visibleTxs.length && activeTab !== "activity"}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors -sm">
                  <Download className="w-4 h-4" /> Export Statement
                </button>
              </div>

              {/* Pending payment alert */}
              {pendingAlert && pendingCount > 0 && (
                <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
                  <Bell className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
                  <span className="text-sm font-semibold text-amber-800 flex-1">
                    You have <strong>{pendingCount}</strong> incomplete payment{pendingCount > 1 ? "s" : ""}.
                  </span>
                  <button onClick={() => { setActiveTab("activity"); setPendingAlert(false); }}
                    className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">View →</button>
                  <button onClick={() => setPendingAlert(false)}><X className="w-4 h-4 text-amber-400 hover:text-amber-700" /></button>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full max-w-[420px] bg-slate-100 p-1.5 rounded-2xl mb-8">
                  <TabsTrigger value="settings" className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:-sm transition-all text-slate-500">Payment Settings</TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:-sm transition-all text-slate-500">Payment Activity</TabsTrigger>
                </TabsList>

                {/* ═══ SETTINGS TAB ═══ */}
                <TabsContent value="settings" className="space-y-5">

                  {/* Wallet card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Available Balance</p>
                      {walletLoading
                        ? <div className="h-10 w-48 bg-slate-700 rounded-xl animate-pulse mt-2" />
                        : wallet
                          ? <>
                            <h2 className="text-4xl font-black tracking-tight mt-1">{fc(wallet.availableBalance ?? wallet.balance ?? 0, cur)}</h2>
                            {(wallet.pendingBalance ?? 0) > 0 && (
                              <p className="text-amber-400 text-xs font-semibold mt-1">+ {fc(wallet.pendingBalance, cur)} pending clearance</p>
                            )}
                          </>
                          : <h2 className="text-4xl font-black tracking-tight mt-1">— —</h2>}
                      {wallet && !walletLoading && (
                        <div className="flex gap-6 mt-5 pt-4 border-t border-slate-700/60">
                          <div><p className="text-slate-400 text-xs">Total Earned</p><p className="font-bold text-sm mt-0.5">{fc(wallet.totalEarned ?? 0, cur)}</p></div>
                          <div><p className="text-slate-400 text-xs">Total Withdrawn</p><p className="font-bold text-sm mt-0.5">{fc(wallet.totalWithdrawn ?? 0, cur)}</p></div>
                        </div>
                      )}
                      <div className="mt-5">
                        {wallet && (wallet.availableBalance ?? wallet.balance ?? 0) >= 5000
                          ? <button onClick={() => setShowWithdraw(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors -md">
                            <LogOut className="w-4 h-4" /> Withdraw Funds
                          </button>
                          : <p className="text-slate-500 text-xs">Min 5,000 XAF required to withdraw.</p>}
                        {!walletLoading && wallet && (wallet.totalEarned ?? 0) === 0 && (
                          <div className="mt-4 bg-white/10 rounded-2xl p-4 border border-white/20">
                            <p className="text-white/80 text-sm">💡 <strong>Your wallet is empty.</strong> List a property or complete bookings — earnings appear here automatically.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Revenue chart — only when data available */}
                  {chartData.length > 0 && <RevenueChart data={chartData} />}

                  {/* Subscription */}
                  {(subscription || subLoading) && (
                    <div className="bg-white rounded-3xl border border-slate-200 -sm p-5">
                      {subLoading ? (
                        <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                      ) : subscription ? (
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-purple-50 rounded-xl shrink-0"><Star className="w-6 h-6 text-purple-600" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Plan</p>
                            <p className="font-bold text-slate-900 text-base mt-0.5 capitalize">{subscription.plan}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                Renews {new Date(subscription.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                {remainingDays !== null && <span className="ml-1 font-bold text-orange-600">({remainingDays}d left)</span>}
                              </p>
                              <p className="text-xs text-slate-500 capitalize">{subscription.billingCycle} billing</p>
                              <p className={`text-xs font-semibold ${subscription.autoRenew ? "text-emerald-600" : "text-slate-400"}`}>
                                {subscription.autoRenew ? "↻ Auto-renew on" : "Auto-renew off"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${subscription.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                              {subscription.status}
                            </span>
                            <a href="/dashboard/subscriptions" className="text-xs font-bold text-blue-600 hover:underline">Manage Plan →</a>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Preferred payment method */}
                  <div className="bg-white rounded-3xl border border-slate-200 -sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-base font-bold text-slate-900">Preferred Payment Method</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Pre-selected when you checkout via Flutterwave.</p>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PREF_METHODS.map(m => {
                        const active = preferred === m.id;
                        return (
                          <button key={m.id} onClick={() => handleSetPreferred(m.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-1 transition-all text-left group ${active ? "border-blue-500 bg-blue-50/30" : "border-slate-100 hover:border-blue-300 hover:bg-slate-50"}`}>
                            <div className={`p-3 rounded-xl transition-colors ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"}`}>{m.icon}</div>
                            <div className="flex-1"><p className={`font-semibold text-sm ${active ? "text-blue-700" : "text-slate-800"}`}>{m.name}</p><p className="text-xs text-slate-500 mt-0.5">{m.desc}</p></div>
                            {active && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-5 pb-5">
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-sm text-blue-700">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                        <span>Payments handled securely by <strong>Flutterwave</strong>. No card data stored on HoroHouse servers.</span>
                      </div>
                    </div>
                  </div>

                  {/* Payout setup */}
                  <PayoutSetupCard wallet={wallet} onSaved={() => showToast("Payout details saved")} />
                </TabsContent>

                {/* ═══ ACTIVITY TAB ═══ */}
                <TabsContent value="activity">

                  {/* KPI summary cards */}
                  {!txLoading && transactions.length > 0 && (
                    <ActivityKPIs transactions={transactions} currency={transactions[0]?.currency ?? cur} />
                  )}

                  <div className="bg-white rounded-3xl border border-slate-200 -sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/40 space-y-3">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
                          <p className="text-sm text-slate-500">{txLoading ? "Loading…" : `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""}`}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden text-xs font-bold">
                            {(["all", "income", "expenses"] as const).map(d => (
                              <button key={d} onClick={() => setFlowDir(d)}
                                className={`px-3 py-2 capitalize transition-colors ${flowDir === d
                                  ? d === "income" ? "bg-emerald-500 text-white"
                                    : d === "expenses" ? "bg-red-500 text-white"
                                      : "bg-slate-900 text-white"
                                  : "text-slate-500 hover:bg-slate-50"
                                  }`}>
                                {d === "income" ? "+ Income" : d === "expenses" ? "− Expenses" : "All"}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => exportCSV(visibleTxs)} disabled={!visibleTxs.length}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Export CSV
                          </button>
                          <button onClick={loadTxs} disabled={txLoading}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors">
                            <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? "animate-spin" : ""}`} /> Refresh
                          </button>
                        </div>
                      </div>

                      {/* Search + filters */}
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[180px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description or ref…"
                            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
                        </div>
                        {[
                          { val: filterStatus, set: (v: any) => setFilterStatus(v), opts: [["all", "All Statuses"], ["success", "Success"], ["pending", "Pending"], ["failed", "Failed"], ["cancelled", "Cancelled"], ["refunded", "Refunded"]] },
                          { val: filterType, set: (v: any) => setFilterType(v), opts: [["all", "All Types"], ["commission", "Booking Income"], ["booking", "Booking"], ["subscription", "Subscription"], ["listing_fee", "Listing Fee"], ["boost_listing", "Boost"], ["refund", "Refund"], ["wallet_topup", "Top-up"], ["wallet_withdrawal", "Withdrawal"]] },
                          { val: filterMethod, set: (v: any) => setFilterMethod(v), opts: [["all", "All Methods"], ["card", "Card"], ["mtn_momo", "MTN MoMo"], ["orange_money", "Orange Money"], ["bank_transfer", "Bank"], ["wallet", "Wallet"]] },
                        ].map((f, i) => (
                          <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
                            className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ))}
                      </div>

                      {/* Date range */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-600" />
                        <span className="text-slate-400 text-xs">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-600" />
                        {(startDate || endDate) && (
                          <button onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                            <X className="w-3.5 h-3.5" /> Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {txLoading && <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>}

                    {txError && !txLoading && (
                      <div className="py-16 flex flex-col items-center gap-3 text-red-500">
                        <AlertCircle className="w-10 h-10 opacity-40" />
                        <p className="font-medium">{txError}</p>
                        <button onClick={loadTxs} className="text-sm font-semibold text-blue-600 hover:underline">Try again</button>
                      </div>
                    )}

                    {!txLoading && !txError && visibleTxs.length === 0 && (
                      <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                        <Receipt className="w-12 h-12 opacity-20" />
                        <p className="font-semibold text-base">{search ? "No results match your search" : "No transactions found"}</p>
                        <p className="text-sm text-slate-400">{search ? "Try a different keyword." : "Adjust your filters or make your first payment."}</p>
                      </div>
                    )}

                    {!txLoading && !txError && visibleTxs.length > 0 && (
                      <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left">
                            <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs">
                              <th className="px-6 py-4 font-bold uppercase tracking-wider">Transaction</th>
                              <th className="px-6 py-4 font-bold uppercase tracking-wider">Method</th>
                              <th className="px-6 py-4 font-bold uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Amount</th>
                              <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100">
                              {visibleTxs.map(tx => {
                                const tm = TYPE_META[tx.type] ?? TYPE_META.booking;
                                const mm = METHOD_META[tx.paymentMethod] ?? METHOD_META.card;
                                const payable = tx.status === "pending" && tx.flutterwavePaymentLink;
                                return (
                                  <tr key={tx._id} onClick={() => setSelectedTx(tx)}
                                    className={`hover:bg-slate-50/60 transition-colors group cursor-pointer ${payable ? "bg-amber-50/20" : ""}`}>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${tm.bg} ${tm.text}`}>{tm.icon}</div>
                                        <div>
                                          <p className="font-semibold text-slate-800 group-hover:text-blue-700 text-sm">{tx.description ?? tm.label}</p>
                                          {tx.propertyId?.title && (
                                            <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                                              <Building2 className="w-3 h-3" />{tx.propertyId.title}
                                            </p>
                                          )}
                                          <p className="text-xs text-slate-400 font-mono mt-0.5">{(tx.flutterwaveReference ?? tx._id).slice(-12)}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4"><mm.logo /></td>
                                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{fd(tx.createdAt)}</td>
                                    <td className="px-6 py-4 text-right">
                                      <span className={`font-bold text-sm ${tm.credit ? "text-emerald-600" : "text-slate-800"}`}>
                                        {tm.credit ? "+" : ""}{fc(tx.amount, tx.currency)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col gap-1.5">
                                        <StatusBadge status={tx.status} />
                                        {payable && (
                                          <a href={tx.flutterwavePaymentLink!} target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-xs font-bold text-blue-600 hover:underline">Complete →</a>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                          {visibleTxs.map(tx => {
                            const tm = TYPE_META[tx.type] ?? TYPE_META.booking;
                            const payable = tx.status === "pending" && tx.flutterwavePaymentLink;
                            return (
                              <div key={tx._id} onClick={() => setSelectedTx(tx)}
                                className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50/60 ${payable ? "bg-amber-50/20" : ""}`}>
                                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${tm.bg} ${tm.text}`}>{tm.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 text-sm truncate">{tx.description ?? tm.label}</p>
                                      {tx.propertyId?.title && (
                                        <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                                          <Building2 className="w-3 h-3 shrink-0" />{tx.propertyId.title}
                                        </p>
                                      )}
                                    </div>
                                    <span className={`font-bold text-sm shrink-0 ${tm.credit ? "text-emerald-600" : "text-slate-800"}`}>{tm.credit ? "+" : ""}{fc(tx.amount, tx.currency)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <StatusBadge status={tx.status} />
                                    <span className="text-xs text-slate-400">{fd(tx.createdAt)}</span>
                                  </div>
                                  {payable && (
                                    <a href={tx.flutterwavePaymentLink!} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="mt-2 inline-block text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg">
                                      Complete Payment →
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
                            <p className="text-xs text-slate-400">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
                            <div className="flex gap-2">
                              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || txLoading}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages || txLoading}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                                <ChevronRightIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>

      {showWithdraw && wallet && (
        <WithdrawModal wallet={wallet} onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setShowWithdraw(false);
            showToast("Withdrawal requested — sent within 24–48 hours");
            apiClient.getWalletStats().then(d => setWallet(d as WalletData)).catch(() => { });
          }} />
      )}

      {selectedTx && <TxModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </SidebarProvider>
  );
}