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
import { Button } from "@/components/ui/button";

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
  <svg className="h-5 w-auto grayscale" viewBox="0 0 200 64" fill="none">
    <path d="M85.2 4.8 L66.5 59.2H48.6L30 17.4c-1.2-3-2.2-4.1-5.8-5.4C18.6 9.7 8.8 7.2 0 5.7L.4 4.8H31c4 0 7.5 2.7 8.4 7.2L47.5 52 85.2 4.8Z" fill="#1434CB" />
    <path d="M168.4 59.2H152l11.2-54.4H179.6L168.4 59.2ZM133.8 4.8c-3.8-1.4-9.8-3-17.2-3-18.9 0-32.2 10.1-32.4 24.5-.2 10.7 9.5 16.6 16.7 20.2 7.4 3.6 9.9 5.9 9.8 9.2-.1 4.9-5.9 7.2-11.3 7.2-7.6 0-11.6-1.1-17.8-3.8L79.3 57l-2.2 13.7c3.8 1.7 10.8 3.3 18 3.4 19 0 31.4-9.4 31.6-24.4.1-8.1-4.8-14.3-15.3-19.4-6.4-3.3-10.3-5.5-10.2-8.8.1-3 3.3-6.2 10.4-6.2 6-.1 10.4 1.3 13.8 2.7l1.6.8 2.8-13.8Z" fill="#1434CB" />
  </svg>
);
const MastercardLogo = () => (
  <svg className="h-5 w-auto grayscale" viewBox="0 0 50 32" fill="none">
    <circle cx="18" cy="16" r="14" fill="#EB001B" />
    <circle cx="32" cy="16" r="14" fill="#F79E1B" />
    <path d="M25 26.5C22.1 24.4 20 21 20 16C20 11 22.1 7.6 25 5.5C27.9 7.6 30 11 30 16C30 21 27.9 24.4 25 26.5Z" fill="#FF5F00" />
  </svg>
);
const MoMoBadge = () => <div className="flex items-center justify-center bg-[#F7F7F7] text-[#222222] text-[11px] font-semibold px-2 py-1 rounded-md w-16 h-8 shrink-0 text-center leading-tight border border-[#DDDDDD]">MoMo</div>;
const OrangeBadge = () => <div className="flex items-center justify-center bg-[#F7F7F7] text-[#222222] text-[9px] font-semibold px-2 py-1 rounded-md w-16 h-8 shrink-0 text-center leading-tight border border-[#DDDDDD]">Orange</div>;

const METHOD_META: Record<PayMethod, { label: string; logo: () => JSX.Element }> = {
  card: { label: "Card", logo: () => <div className="flex gap-1"><VisaLogo /><MastercardLogo /></div> },
  mtn_momo: { label: "MTN MoMo", logo: MoMoBadge },
  orange_money: { label: "Orange Money", logo: OrangeBadge },
  bank_transfer: { label: "Bank Transfer", logo: () => <span className="text-[11px] font-semibold text-[#222222] bg-[#F7F7F7] border border-[#DDDDDD] px-2 py-1 rounded-md h-8 flex items-center">BANK</span> },
  wallet: { label: "Wallet", logo: () => <Wallet className="w-4 h-4 text-[#222222] stroke-[2]" /> },
};

const TYPE_META: Record<TxType, { label: string; icon: JSX.Element; bg: string; text: string; credit?: boolean }> = {
  booking: { label: "Booking", icon: <ArrowUpRight className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]" },
  subscription: { label: "Subscription", icon: <Star className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]" },
  listing_fee: { label: "Listing fee", icon: <Receipt className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]" },
  boost_listing: { label: "Boost", icon: <TrendingUp className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]" },
  commission: { label: "Commission", icon: <DollarSign className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]", credit: true },
  digital_service: { label: "Digital svc", icon: <Globe className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]" },
  refund: { label: "Refund", icon: <ArrowDownLeft className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]", credit: true },
  wallet_topup: { label: "Top-up", icon: <Wallet className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]", credit: true },
  wallet_withdrawal: { label: "Withdrawal", icon: <LogOut className="w-4 h-4" />, bg: "bg-[#F7F7F7]", text: "text-[#222222]" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TxStatus }) {
  const cfg: Record<TxStatus, [string, JSX.Element, string]> = {
    success: ["bg-[#ECFDF5] text-[#008A05] border-[#008A05]/20", <CheckCircle2 className="w-3 h-3" />, "Paid"],
    failed: ["bg-[#FFF8F8] text-[#E50000] border-[#FFDFDF]", <AlertCircle className="w-3 h-3" />, "Failed"],
    pending: ["bg-[#F7F7F7] text-[#222222] border-[#DDDDDD]", <Loader2 className="w-3 h-3 animate-spin" />, "Pending"],
    cancelled: ["bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]", <Ban className="w-3 h-3" />, "Cancelled"],
    refunded: ["bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]", <ArrowDownLeft className="w-3 h-3" />, "Refunded"],
  };
  const [cls, icon, label] = cfg[status] ?? cfg.pending;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold border ${cls}`}>{icon}{label}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type = "success", onClose }: { msg: string; type?: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 bg-white border border-[#DDDDDD] text-[#222222]`}>
      {type === "success" ? <CheckCircle2 className="w-5 h-5 text-[#008A05] shrink-0" /> : <AlertCircle className="w-5 h-5 text-[#E50000] shrink-0" />}
      <span className="font-semibold text-[15px]">{msg}</span>
      <button onClick={onClose}><X className="w-5 h-5 text-[#717171] hover:text-[#222222]" /></button>
    </div>
  );
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: ChartDataPoint[] }) {
  const [range, setRange] = useState<"6m" | "1y">("6m");
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden mb-8">
      <div className="p-6 border-b border-[#DDDDDD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-[#222222] text-[18px]">Revenue overview</h2>
          <p className="text-[14px] text-[#717171] mt-0.5">Monthly earnings performance</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F7F7F7] p-1 rounded-lg border border-[#DDDDDD]">
          {(["6m", "1y"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${range === r ? "bg-white text-[#222222] shadow-sm border border-[#DDDDDD]" : "text-[#717171] hover:text-[#222222] border border-transparent"}`}>
              {r === "6m" ? "6 months" : "1 year"}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#222222" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#222222" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDDDDD" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: "#717171", fontSize: 12, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: "#717171", fontSize: 12, fontWeight: 500 }} dx={-10}
                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #DDDDDD", padding: "12px 16px", fontSize: "14px", fontWeight: 600, color: "#222222", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(value: number) => [fc(value), "Revenue"]}
                labelStyle={{ fontWeight: 500, color: "#717171", marginBottom: 4, fontSize: "13px" }}
              />
              <Area type="monotone" dataKey="amount" stroke="#222222" strokeWidth={2.5}
                fillOpacity={1} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 5, fill: "#222222", stroke: "#fff", strokeWidth: 2 }} />
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
    { label: "Booking income", value: fc(stats.income, currency), icon: <ArrowDownLeft className="w-5 h-5 stroke-[1.5]" /> },
    { label: "Total paid out", value: fc(stats.paidOut, currency), icon: <ArrowUpRight className="w-5 h-5 stroke-[1.5]" /> },
    { label: "Pending", value: String(stats.pending), icon: <Clock className="w-5 h-5 stroke-[1.5]" /> },
    { label: "Failed", value: String(stats.failed), icon: <AlertCircle className="w-5 h-5 stroke-[1.5]" /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-[#DDDDDD] rounded-2xl p-6 flex flex-col justify-between hover:shadow-sm transition-shadow duration-200">
          <div className="flex justify-between items-start mb-4 text-[#222222]">
            <p className="text-[14px] font-medium text-[#717171]">{c.label}</p>
            {c.icon}
          </div>
          <p className="text-[26px] font-semibold text-[#222222] tracking-tight leading-none">{c.value}</p>
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

  const inputClasses = "w-full border border-[#DDDDDD] bg-white text-[#222222] rounded-lg px-4 py-3.5 text-[15px] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors placeholder:text-[#717171]";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-[#DDDDDD] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#222222] text-[22px]">Withdraw funds</h3>
            <p className="text-[15px] text-[#717171] mt-1">Available: <span className="font-semibold text-[#222222]">{fc(avail, cur)}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"><X className="w-5 h-5 text-[#222222]" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-[15px] font-semibold text-[#222222] block mb-3">Method</label>
            <div className="grid grid-cols-3 gap-3">
              {(["mtn_momo", "orange_money", "bank_transfer"] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`p-3 rounded-lg border transition-all text-[13px] font-semibold ${method === m ? "border-blue-600 bg-[#F7F7F7] text-[#222222]" : "border-[#DDDDDD] text-[#717171] hover:border-blue-600"}`}>
                  {m === "mtn_momo" ? "MTN MoMo" : m === "orange_money" ? "Orange Money" : "Bank Transfer"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[15px] font-semibold text-[#222222] block mb-3">Amount (XAF)</label>
            <div className="flex gap-3">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="5000" className={inputClasses} />
              <button onClick={() => setAmount(String(avail))} className="px-5 py-3.5 text-[15px] font-semibold bg-[#F7F7F7] border border-[#DDDDDD] rounded-lg text-[#222222] hover:bg-[#EBEBEB] transition-colors">Max</button>
            </div>
          </div>
          {(method === "mtn_momo" || method === "orange_money") && (
            <div>
              <label className="text-[15px] font-semibold text-[#222222] block mb-3">Phone number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="237XXXXXXXXX" className={inputClasses} />
            </div>
          )}
          {method === "bank_transfer" && (
            <div className="space-y-4">
              <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Account name</label>
                <input value={accName} onChange={e => setAccName(e.target.value)} className={inputClasses} /></div>
              <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Account number</label>
                <input value={accNum} onChange={e => setAccNum(e.target.value)} className={inputClasses} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Bank name</label>
                  <input value={bankName} onChange={e => setBankName(e.target.value)} className={inputClasses} /></div>
                <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Bank code</label>
                  <input value={bankCode} onChange={e => setBankCode(e.target.value)} className={inputClasses} /></div>
              </div>
            </div>
          )}
          {error && <p className="text-[14px] font-medium text-[#E50000] bg-[#FFF8F8] px-4 py-3 rounded-lg border border-[#FFDFDF]">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Processing…" : "Confirm withdrawal"}
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

  const inputClasses = "w-full border border-[#DDDDDD] bg-white text-[#222222] rounded-lg px-4 py-3.5 text-[15px] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors placeholder:text-[#717171]";

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
    <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden">
      <div className="p-6 border-b border-[#DDDDDD] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-semibold text-[18px] text-[#222222]">Payout details</h2>
          <p className="text-[14px] text-[#717171] mt-1">Where we'll send your earnings.</p>
        </div>
        <div className="flex bg-[#F7F7F7] p-1 rounded-lg border border-[#DDDDDD] w-full sm:w-auto">
          <button onClick={() => setTab("momo")} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-[13px] font-semibold transition-all ${tab === "momo" ? "bg-white text-[#222222] shadow-sm border border-[#DDDDDD]" : "text-[#717171] border border-transparent hover:text-[#222222]"}`}>
            Mobile Money
          </button>
          <button onClick={() => setTab("bank")} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-[13px] font-semibold transition-all ${tab === "bank" ? "bg-white text-[#222222] shadow-sm border border-[#DDDDDD]" : "text-[#717171] border border-transparent hover:text-[#222222]"}`}>
            Bank Account
          </button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {tab === "momo" ? (
          <div className="space-y-6">
            <div>
              <label className="text-[15px] font-semibold text-[#222222] block mb-3">Provider</label>
              <div className="flex gap-3">
                {(["MTN", "ORANGE"] as const).map(p => (
                  <button key={p} onClick={() => setProvider(p)}
                    className={`flex-1 py-3.5 rounded-lg border transition-all text-[14px] font-semibold ${provider === p ? "border-blue-600 bg-[#F7F7F7] text-[#222222]" : "border-[#DDDDDD] text-[#717171] hover:border-blue-600"}`}>
                    {p === "MTN" ? "MTN MoMo" : "Orange Money"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[15px] font-semibold text-[#222222] block mb-3">Phone number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="237XXXXXXXXX" className={inputClasses} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Account name</label>
              <input value={accName} onChange={e => setAccName(e.target.value)} className={inputClasses} /></div>
            <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Account number</label>
              <input value={accNum} onChange={e => setAccNum(e.target.value)} className={inputClasses} /></div>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Bank name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} className={inputClasses} /></div>
              <div><label className="text-[15px] font-semibold text-[#222222] block mb-3">Bank code</label>
                <input value={bankCode} onChange={e => setBankCode(e.target.value)} className={inputClasses} /></div>
            </div>
          </div>
        )}
        {error && <p className="text-[14px] font-medium text-[#E50000] bg-[#FFF8F8] px-4 py-3 rounded-lg border border-[#FFDFDF]">{error}</p>}

        <div className="pt-4 flex justify-end">
          <button onClick={save} disabled={saving}
            className="px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[15px] w-full sm:w-auto">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving…" : "Save payout details"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Detail Modal ─────────────────────────────────────────────────
function TxModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const tm = TYPE_META[tx.type] ?? TYPE_META.booking;
  const mm = METHOD_META[tx.paymentMethod] ?? METHOD_META.card;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-[#DDDDDD] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full border border-[#DDDDDD] bg-[#F7F7F7] ${tm.text}`}>{tm.icon}</div>
            <div>
              <h3 className="font-semibold text-[#222222] text-[18px]">{tm.label}</h3>
              <p className="text-[13px] text-[#717171] font-mono mt-0.5">{tx.flutterwaveReference?.slice(-14) ?? tx._id.slice(-10)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"><X className="w-5 h-5 text-[#222222]" /></button>
        </div>
        <div className="px-6 py-6 border-b border-[#DDDDDD]">
          <p className="text-[13px] font-medium text-[#717171] mb-1">Amount</p>
          <p className={`text-[32px] font-semibold tracking-tight ${tm.credit ? "text-[#008A05]" : "text-[#222222]"}`}>
            {tm.credit ? "+" : ""}{fc(tx.amount, tx.currency)}
          </p>
          <div className="mt-3"><StatusBadge status={tx.status} /></div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
          <div><p className="text-[13px] font-medium text-[#717171] mb-1">Date</p>
            <p className="text-[15px] font-medium text-[#222222]">{fd(tx.createdAt)}</p></div>
          <div><p className="text-[13px] font-medium text-[#717171] mb-1">Method</p>
            <div className="text-[15px] font-medium text-[#222222]">{mm.label}</div></div>
          {tx.description && <div className="col-span-2">
            <p className="text-[13px] font-medium text-[#717171] mb-1">Description</p>
            <p className="text-[15px] font-medium text-[#222222]">{tx.description}</p></div>}
          {(tx.paymentProcessingFee ?? 0) > 0 && <div>
            <p className="text-[13px] font-medium text-[#717171] mb-1">Processing fee</p>
            <p className="text-[15px] font-medium text-[#222222]">{fc(tx.paymentProcessingFee!, tx.currency)}</p></div>}
          {tx.netAmount != null && <div className="col-span-2 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl p-4">
            <p className="text-[13px] font-medium text-[#717171] mb-1">Net amount</p>
            <p className="text-[18px] font-semibold text-[#222222]">{fc(tx.netAmount, tx.currency)}</p></div>}
          {tx.failureReason && <div className="col-span-2 bg-[#FFF8F8] border border-[#FFDFDF] rounded-xl p-4">
            <p className="text-[13px] font-medium text-[#E50000] mb-1">Failure reason</p>
            <p className="text-[15px] font-medium text-[#E50000]">{tx.failureReason}</p></div>}
          {tx.propertyId?.title && <div className="col-span-2">
            <p className="text-[13px] font-medium text-[#717171] mb-1">Property</p>
            <p className="text-[15px] font-medium text-[#222222]">{tx.propertyId.title}</p></div>}
        </div>
        {tx.status === "pending" && tx.flutterwavePaymentLink && (
          <div className="p-6 pt-0 border-t border-[#DDDDDD] mt-2 flex justify-end">
            <a href={tx.flutterwavePaymentLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex w-full justify-center px-6 py-3.5 mt-6 rounded-lg blue-blue-600 blue-blue-700 text-white font-semibold text-[15px] transition-colors">
              Complete payment
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

    apiClient.getUserTransactions({ limit: 500 })
      .then((res: any) => {
        const txs: Transaction[] = res.transactions ?? [];
        const INCOME_TYPES: TxType[] = ["commission", "refund", "wallet_topup"];

        const map: Record<string, number> = {};
        const now = new Date();
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
    { id: "card", name: "Credit / debit card", desc: "Visa, Mastercard", icon: <CreditCard className="w-6 h-6 stroke-[1.5]" /> },
    { id: "mtn_momo", name: "MTN Mobile Money", desc: "Pay via MoMo", icon: <Smartphone className="w-6 h-6 stroke-[1.5]" /> },
    { id: "orange_money", name: "Orange Money", desc: "Orange wallet", icon: <Smartphone className="w-6 h-6 stroke-[1.5]" /> },
    { id: "bank_transfer", name: "Bank transfer", desc: "Direct transfer", icon: <Building2 className="w-6 h-6 stroke-[1.5]" /> },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="p-6 md:p-10 w-full max-w-7xl mx-auto">
            <div className="pb-12">

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div>
                  <h1 className="text-[32px] font-semibold text-[#222222] tracking-tight mb-2">Billing & payments</h1>
                  <p className="text-[#717171] text-[16px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 stroke-[2]" /> Secured by Flutterwave
                  </p>
                </div>
                <button onClick={() => exportCSV(visibleTxs)} disabled={!visibleTxs.length && activeTab !== "activity"}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#DDDDDD] bg-white text-[#222222] text-[15px] font-semibold hover:bg-[#F7F7F7] disabled:opacity-50 transition-colors">
                  <Download className="w-4 h-4 stroke-[2]" /> Export statement
                </button>
              </div>

              {/* Pending payment alert */}
              {pendingAlert && pendingCount > 0 && (
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl px-6 py-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Bell className="w-5 h-5 text-[#222222] shrink-0" />
                    <span className="text-[15px] font-medium text-[#222222]">
                      You have <span className="font-semibold">{pendingCount}</span> incomplete payment{pendingCount > 1 ? "s" : ""}.
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pl-8 sm:pl-0">
                    <button onClick={() => { setActiveTab("activity"); setPendingAlert(false); }}
                      className="text-[14px] font-semibold text-[#222222] underline hover:text-black">View details</button>
                    <button onClick={() => setPendingAlert(false)} className="p-1 hover:bg-[#EBEBEB] rounded-full transition-colors"><X className="w-4 h-4 text-[#717171]" /></button>
                  </div>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex bg-transparent border-b border-[#DDDDDD] rounded-none mb-10 p-0 h-auto gap-8 w-full justify-start overflow-x-auto scrollbar-hide">
                  <TabsTrigger
                    value="settings"
                    className="rounded-none bg-transparent font-semibold text-[16px] text-[#717171] data-[state=active]:text-[#222222] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3 pt-0 data-[state=active]:shadow-none"
                  >
                    Payment settings
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="rounded-none bg-transparent font-semibold text-[16px] text-[#717171] data-[state=active]:text-[#222222] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3 pt-0 data-[state=active]:shadow-none"
                  >
                    Payment activity
                  </TabsTrigger>
                </TabsList>

                {/* ═══ SETTINGS TAB ═══ */}
                <TabsContent value="settings" className="space-y-8 animate-in fade-in duration-300">

                  {/* Wallet card */}
                  <div className="bg-[#F7F7F7] border border-[#DDDDDD] rounded-2xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[#717171] text-[14px] font-medium mb-1">Available balance</p>
                      {walletLoading
                        ? <div className="h-10 w-48 bg-[#EBEBEB] rounded-lg animate-pulse mt-2" />
                        : wallet
                          ? <>
                            <h2 className="text-[40px] font-semibold text-[#222222] tracking-tight mt-1">{fc(wallet.availableBalance ?? wallet.balance ?? 0, cur)}</h2>
                            {(wallet.pendingBalance ?? 0) > 0 && (
                              <p className="text-[#717171] text-[14px] font-medium mt-2">+{fc(wallet.pendingBalance, cur)} pending clearance</p>
                            )}
                          </>
                          : <h2 className="text-[40px] font-semibold text-[#222222] tracking-tight mt-1">—</h2>}
                      {wallet && !walletLoading && (
                        <div className="flex gap-8 mt-8 pt-6 border-t border-[#DDDDDD]">
                          <div><p className="text-[#717171] text-[13px] mb-1">Total earned</p><p className="font-semibold text-[#222222] text-[16px]">{fc(wallet.totalEarned ?? 0, cur)}</p></div>
                          <div><p className="text-[#717171] text-[13px] mb-1">Total withdrawn</p><p className="font-semibold text-[#222222] text-[16px]">{fc(wallet.totalWithdrawn ?? 0, cur)}</p></div>
                        </div>
                      )}
                      <div className="mt-8">
                        {wallet && (wallet.availableBalance ?? wallet.balance ?? 0) >= 5000
                          ? <button onClick={() => setShowWithdraw(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold text-[15px] hover:bg-blue-700 transition-colors">
                            <LogOut className="w-4 h-4 stroke-[2]" /> Withdraw funds
                          </button>
                          : <p className="text-[#717171] text-[14px] font-medium">Min 5,000 XAF required to withdraw.</p>}
                        {!walletLoading && wallet && (wallet.totalEarned ?? 0) === 0 && (
                          <div className="mt-6 bg-white rounded-xl p-5 border border-[#DDDDDD]">
                            <p className="text-[#717171] text-[14px]">💡 <strong className="text-[#222222]">Your wallet is empty.</strong> List a property or complete bookings — earnings appear here automatically.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Revenue chart — only when data available */}
                  {chartData.length > 0 && <RevenueChart data={chartData} />}

                  {/* Subscription */}
                  {(subscription || subLoading) && (
                    <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6">
                      {subLoading ? (
                        <div className="h-16 bg-[#F7F7F7] rounded-xl animate-pulse" />
                      ) : subscription ? (
                        <div className="flex items-start gap-5">
                          <div className="p-3 bg-[#F7F7F7] border border-[#DDDDDD] rounded-full shrink-0"><Star className="w-5 h-5 text-[#222222] stroke-[1.5]" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-[#717171] font-medium">Current plan</p>
                            <p className="font-semibold text-[#222222] text-[18px] mt-1 capitalize">{subscription.plan}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                              <p className="text-[14px] text-[#717171] flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4 stroke-[1.5]" />
                                Renews {new Date(subscription.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                {remainingDays !== null && <span className="ml-1 font-semibold text-[#222222]">({remainingDays} days left)</span>}
                              </p>
                              <span className="text-[#DDDDDD] hidden sm:inline">•</span>
                              <p className="text-[14px] text-[#717171] capitalize">{subscription.billingCycle} billing</p>
                              <span className="text-[#DDDDDD] hidden sm:inline">•</span>
                              <p className={`text-[14px] font-medium ${subscription.autoRenew ? "text-[#008A05]" : "text-[#717171]"}`}>
                                {subscription.autoRenew ? "Auto-renew on" : "Auto-renew off"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <span className={`px-3 py-1 rounded-md text-[12px] font-semibold border ${subscription.status === "active" ? "bg-[#ECFDF5] text-[#008A05] border-[#008A05]/20" : "bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]"}`}>
                              {subscription.status}
                            </span>
                            <a href="/dashboard/subscriptions" className="text-[14px] font-semibold text-[#222222] underline hover:text-black">Manage plan</a>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Preferred payment method */}
                  <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden">
                    <div className="p-6 border-b border-[#DDDDDD] bg-white">
                      <h2 className="text-[18px] font-semibold text-[#222222]">Preferred payment method</h2>
                      <p className="text-[14px] text-[#717171] mt-1">Pre-selected when you checkout.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {PREF_METHODS.map(m => {
                        const active = preferred === m.id;
                        return (
                          <button key={m.id} onClick={() => handleSetPreferred(m.id)}
                            className={`flex items-start gap-4 p-5 rounded-xl border transition-all text-left group ${active ? "border-blue-600 bg-[#F7F7F7]" : "border-[#DDDDDD] hover:border-blue-600"}`}>
                            <div className={`p-3 rounded-full border transition-colors ${active ? "bg-white border-[#DDDDDD] text-[#222222]" : "bg-[#F7F7F7] border-[#DDDDDD] text-[#717171] group-hover:text-[#222222]"}`}>{m.icon}</div>
                            <div className="flex-1 mt-1">
                              <p className={`font-semibold text-[15px] ${active ? "text-[#222222]" : "text-[#222222]"}`}>{m.name}</p>
                              <p className="text-[13px] text-[#717171] mt-1">{m.desc}</p>
                            </div>
                            {active && <CheckCircle2 className="w-5 h-5 text-[#222222] shrink-0 mt-1 stroke-[2]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payout setup */}
                  <PayoutSetupCard wallet={wallet} onSaved={() => showToast("Payout details saved")} />
                </TabsContent>

                {/* ═══ ACTIVITY TAB ═══ */}
                <TabsContent value="activity" className="animate-in fade-in duration-300">

                  {/* KPI summary cards */}
                  {!txLoading && transactions.length > 0 && (
                    <ActivityKPIs transactions={transactions} currency={transactions[0]?.currency ?? cur} />
                  )}

                  <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-[#DDDDDD] space-y-4 bg-white">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <h2 className="text-[18px] font-semibold text-[#222222]">Transaction history</h2>
                          <p className="text-[14px] text-[#717171] mt-1">{txLoading ? "Loading…" : `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""}`}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex bg-[#F7F7F7] border border-[#DDDDDD] rounded-lg p-1 text-[13px] font-semibold">
                            {(["all", "income", "expenses"] as const).map(d => (
                              <button key={d} onClick={() => setFlowDir(d)}
                                className={`px-4 py-2 capitalize transition-colors rounded-md ${flowDir === d
                                  ? "bg-white text-[#222222] shadow-sm border border-[#DDDDDD]"
                                  : "text-[#717171] hover:text-[#222222] border border-transparent"
                                  }`}>
                                {d === "income" ? "+ Income" : d === "expenses" ? "− Expenses" : "All"}
                              </button>
                            ))}
                          </div>
                          <button onClick={loadTxs} disabled={txLoading}
                            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold bg-white border border-[#DDDDDD] rounded-lg hover:bg-[#F7F7F7] text-[#222222] disabled:opacity-50 transition-colors">
                            <RefreshCw className={`w-4 h-4 stroke-[2] ${txLoading ? "animate-spin" : ""}`} /> Refresh
                          </button>
                        </div>
                      </div>

                      {/* Search + filters */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171] stroke-[2]" />
                          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description or ref…"
                            className="w-full pl-11 pr-4 py-2.5 text-[14px] border border-[#DDDDDD] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 placeholder:text-[#717171]" />
                        </div>
                        {[
                          { val: filterStatus, set: (v: any) => setFilterStatus(v), opts: [["all", "All statuses"], ["success", "Success"], ["pending", "Pending"], ["failed", "Failed"], ["cancelled", "Cancelled"], ["refunded", "Refunded"]] },
                          { val: filterType, set: (v: any) => setFilterType(v), opts: [["all", "All types"], ["commission", "Booking Income"], ["booking", "Booking"], ["subscription", "Subscription"], ["listing_fee", "Listing Fee"], ["boost_listing", "Boost"], ["refund", "Refund"], ["wallet_topup", "Top-up"], ["wallet_withdrawal", "Withdrawal"]] },
                          { val: filterMethod, set: (v: any) => setFilterMethod(v), opts: [["all", "All methods"], ["card", "Card"], ["mtn_momo", "MTN MoMo"], ["orange_money", "Orange Money"], ["bank_transfer", "Bank"], ["wallet", "Wallet"]] },
                        ].map((f, i) => (
                          <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
                            className="text-[14px] font-medium text-[#222222] border border-[#DDDDDD] rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 cursor-pointer">
                            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ))}
                      </div>

                      {/* Date range */}
                      <div className="flex flex-wrap gap-2 items-center pt-2">
                        <CalendarDays className="w-4 h-4 text-[#717171] shrink-0 stroke-[2] mr-1" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                          className="text-[14px] border border-[#DDDDDD] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 text-[#222222]" />
                        <span className="text-[#717171] text-[14px] px-1">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                          className="text-[14px] border border-[#DDDDDD] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 text-[#222222]" />
                        {(startDate || endDate) && (
                          <button onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="text-[14px] font-semibold text-[#717171] hover:text-[#222222] underline ml-2 transition-colors">
                            Clear dates
                          </button>
                        )}
                      </div>
                    </div>

                    {txLoading && <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[#F7F7F7] rounded-xl animate-pulse" />)}</div>}

                    {txError && !txLoading && (
                      <div className="py-24 flex flex-col items-center gap-3 text-[#E50000]">
                        <AlertCircle className="w-10 h-10 stroke-[1.5]" />
                        <p className="font-semibold text-[16px]">{txError}</p>
                        <button onClick={loadTxs} className="text-[15px] font-semibold text-[#222222] underline hover:text-black mt-2">Try again</button>
                      </div>
                    )}

                    {!txLoading && !txError && visibleTxs.length === 0 && (
                      <div className="py-24 flex flex-col items-center gap-3 text-[#717171] bg-[#F7F7F7]">
                        <Receipt className="w-10 h-10 stroke-[1.5] mb-2" />
                        <p className="font-semibold text-[18px] text-[#222222]">{search ? "No results match your search" : "No transactions found"}</p>
                        <p className="text-[15px]">{search ? "Try a different keyword." : "Adjust your filters or make your first payment."}</p>
                      </div>
                    )}

                    {!txLoading && !txError && visibleTxs.length > 0 && (
                      <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead><tr className="bg-[#F7F7F7] border-b border-[#DDDDDD] text-[#717171] text-[12px] font-semibold uppercase tracking-wider">
                              <th className="px-6 py-4">Transaction</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[#DDDDDD]">
                              {visibleTxs.map(tx => {
                                const tm = TYPE_META[tx.type] ?? TYPE_META.booking;
                                const mm = METHOD_META[tx.paymentMethod] ?? METHOD_META.card;
                                const payable = tx.status === "pending" && tx.flutterwavePaymentLink;
                                return (
                                  <tr key={tx._id} onClick={() => setSelectedTx(tx)}
                                    className={`hover:bg-[#F7F7F7] transition-colors group cursor-pointer ${payable ? "bg-[#FFF8F8] hover:bg-[#FFDFDF]/30" : ""}`}>
                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full border border-[#DDDDDD] shrink-0 bg-white ${tm.text}`}>{tm.icon}</div>
                                        <div>
                                          <p className="font-semibold text-[#222222] text-[15px]">{tx.description ?? tm.label}</p>
                                          {tx.propertyId?.title && (
                                            <p className="text-[13px] text-[#717171] font-medium mt-0.5 flex items-center gap-1.5">
                                              <Building2 className="w-3.5 h-3.5" />{tx.propertyId.title}
                                            </p>
                                          )}
                                          <p className="text-[12px] text-[#717171] font-mono mt-1">{(tx.flutterwaveReference ?? tx._id).slice(-12)}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5"><mm.logo /></td>
                                    <td className="px-6 py-5 text-[14px] text-[#717171] whitespace-nowrap">{fd(tx.createdAt)}</td>
                                    <td className="px-6 py-5 text-right">
                                      <span className={`font-semibold text-[15px] ${tm.credit ? "text-[#008A05]" : "text-[#222222]"}`}>
                                        {tm.credit ? "+" : ""}{fc(tx.amount, tx.currency)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5">
                                      <div className="flex flex-col gap-2 items-start">
                                        <StatusBadge status={tx.status} />
                                        {payable && (
                                          <a href={tx.flutterwavePaymentLink!} target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-[13px] font-semibold text-[#222222] underline hover:text-black">Complete payment</a>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile list */}
                        <div className="md:hidden divide-y divide-[#DDDDDD]">
                          {visibleTxs.map(tx => {
                            const tm = TYPE_META[tx.type] ?? TYPE_META.booking;
                            const payable = tx.status === "pending" && tx.flutterwavePaymentLink;
                            return (
                              <div key={tx._id} onClick={() => setSelectedTx(tx)}
                                className={`p-5 flex items-start gap-4 cursor-pointer hover:bg-[#F7F7F7] ${payable ? "bg-[#FFF8F8]" : ""}`}>
                                <div className={`p-3 rounded-full border border-[#DDDDDD] bg-white shrink-0 mt-0.5 ${tm.text}`}>{tm.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[#222222] text-[15px] truncate">{tx.description ?? tm.label}</p>
                                      {tx.propertyId?.title && (
                                        <p className="text-[13px] text-[#717171] font-medium mt-0.5 flex items-center gap-1.5">
                                          <Building2 className="w-3.5 h-3.5 shrink-0" />{tx.propertyId.title}
                                        </p>
                                      )}
                                    </div>
                                    <span className={`font-semibold text-[15px] shrink-0 ${tm.credit ? "text-[#008A05]" : "text-[#222222]"}`}>{tm.credit ? "+" : ""}{fc(tx.amount, tx.currency)}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <StatusBadge status={tx.status} />
                                    <span className="text-[12px] text-[#717171]">{fd(tx.createdAt)}</span>
                                  </div>
                                  {payable && (
                                    <a href={tx.flutterwavePaymentLink!} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="mt-4 inline-block text-[14px] font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg">
                                      Complete payment
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                          <div className="p-6 border-t border-[#DDDDDD] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[14px] text-[#717171] font-medium">Page {pagination.page} of {pagination.totalPages}</p>
                            <div className="flex gap-3 w-full sm:w-auto">
                              <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || txLoading}
                                className="flex-1 sm:flex-none h-11 px-5 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[15px]">
                                Previous
                              </Button>
                              <Button variant="outline" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages || txLoading}
                                className="flex-1 sm:flex-none h-11 px-5 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[15px]">
                                Next
                              </Button>
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