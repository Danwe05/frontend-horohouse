"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Clock, AlertCircle, XCircle,
  DownloadCloud, Filter, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types matching Transaction schema ────────────────────────────────────────
type TxStatus = "pending" | "success" | "failed" | "cancelled" | "refunded";
type TxType =
  | "subscription" | "listing_fee" | "boost_listing" | "commission"
  | "digital_service" | "refund" | "wallet_topup" | "wallet_withdrawal" | "booking";

interface RealTransaction {
  _id: string;
  amount: number;
  currency: string;          // 'XAF' | 'XOF' | 'USD' | 'EUR'
  type: TxType;
  status: TxStatus;
  paymentMethod: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
  customerName?: string;
  flutterwaveReference?: string;
  metadata?: {
    propertyTitle?: string;
    bookingId?: string;
    [key: string]: any;
  };
  propertyId?: {
    _id: string;
    title: string;
    address?: string;
  } | null;
  bookingId?: {
    _id: string;
    checkIn: string;
    checkOut: string;
    nights: number;
  } | null;
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<TxStatus, { color: string; icon: React.ElementType }> = {
  success: { color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  pending: { color: "text-blue-500 bg-blue-50", icon: Clock },
  failed: { color: "text-red-600 bg-red-50", icon: AlertCircle },
  cancelled: { color: "text-slate-500 bg-slate-100", icon: XCircle },
  refunded: { color: "text-amber-600 bg-amber-50", icon: ArrowUpRight },
};

// ─── Type display labels ──────────────────────────────────────────────────────
const getTypeLabel = (type: TxType, s: any): string => {
  const typeLabel: Record<TxType, string> = {
    subscription: s?.subscription || "Subscription",
    listing_fee: s?.listingFee || "Listing Fee",
    boost_listing: s?.listingBoost || "Listing Boost",
    commission: s?.commission || "Commission",
    digital_service: s?.digitalService || "Digital Service",
    refund: s?.refund || "Refund",
    wallet_topup: s?.walletTopUp || "Wallet Top-up",
    wallet_withdrawal: s?.withdrawal || "Withdrawal",
    booking: s?.bookingPayment || "Booking Payment",
  };
  return typeLabel[type] || type;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number, currency = "XAF") {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getPropertyTitle(tx: RealTransaction, s: any): string {
  if (tx.propertyId?.title) return tx.propertyId.title;
  if (tx.metadata?.propertyTitle) return tx.metadata.propertyTitle;
  if (tx.description) return tx.description;
  return getTypeLabel(tx.type, s) ?? tx.type;
}

// ─── Component ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function TransactionList() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const s = (t as any)?.transactions || {};

  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TxStatus | "all">("all");

  const fetchTransactions = useCallback(async (p = 1, status?: TxStatus | "all") => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: p, limit: PAGE_SIZE };
      if (status && status !== "all") params.status = status;

      const res = await apiClient.getUserTransactions(params);
      const txs: RealTransaction[] = res?.transactions ?? res?.data ?? [];
      setTransactions(txs);
      setTotal(res?.total ?? txs.length);
      setTotalPages(res?.totalPages ?? Math.ceil((res?.total ?? txs.length) / PAGE_SIZE));
      setPage(p);
    } catch (err: any) {
      console.error("TransactionList fetch error:", err);
      setError(err?.response?.data?.message || err?.message || s?.failedToLoadTransactions || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchTransactions(1, statusFilter);
  }, [authLoading, fetchTransactions, statusFilter]);

  // ── CSV export ───────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ["id", "property", "type", "amount", "currency", "status", "date", "reference"];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [
      header.join(","),
      ...transactions.map((tx) => [
        escape(tx._id),
        escape(getPropertyTitle(tx, s)),
        escape(getTypeLabel(tx.type, s) ?? tx.type),
        escape(tx.amount),
        escape(tx.currency),
        escape(tx.status),
        escape(formatDate(tx.createdAt)),
        escape(tx.flutterwaveReference ?? ""),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const shownFrom = (page - 1) * PAGE_SIZE + 1;
  const shownTo = Math.min(page * PAGE_SIZE, total);

  // ── Skeleton ────────────────────────────────────────────────────────────
  if (authLoading || (loading && transactions.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 -sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full hidden md:block" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 -sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{s?.recentTransactions || "Recent Transactions"}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{s?.failedToLoadTransactions || "Failed to load transactions"}</p>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <Button size="sm" onClick={() => fetchTransactions(page, statusFilter)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCw className="w-3.5 h-3.5" /> {s?.retry || "Retry"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 -sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{s?.recentTransactions || "Recent Transactions"}</h3>
          <p className="text-sm text-slate-500">
            {total > 0
              ? `${total.toLocaleString()} ${s?.transactionTotal || "transaction(s) total"}`
              : (s?.yourPaymentHistory || "Your payment history")}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-slate-600 border-slate-200">
                <Filter className="w-4 h-4" />
                {statusFilter === "all" ? (s?.filter || "Filter") : s?.[statusFilter] || (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1))}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["all", "success", "pending", "failed", "cancelled", "refunded"] as const).map((st) => (
                <DropdownMenuItem key={st} onClick={() => setStatusFilter(st)}>
                  {s?.[st] || (st === "all" ? "All" : st.charAt(0).toUpperCase() + st.slice(1))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-2" onClick={handleExport}
            disabled={transactions.length === 0}>
            <DownloadCloud className="w-4 h-4" />
            {s?.export || "Export"}
          </Button>
        </div>
      </div>

      {/* Table */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">{s?.noTransactionsFound || "No transactions found"}</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter !== "all"
              ? (s?.noTransactionsInThisPeriod ? s.noTransactionsInThisPeriod.replace('{status}', s?.[statusFilter] || statusFilter) : `No ${statusFilter} transactions in this period`)
              : (s?.yourPaymentHistoryWillAppearHere || "Your payment history will appear here")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-3 border-b border-slate-100">{s?.propertyType || "Property / Type"}</th>
                <th className="px-6 py-3 border-b border-slate-100 hidden md:table-cell">{s?.status_th || "Status"}</th>
                <th className="px-6 py-3 border-b border-slate-100 hidden sm:table-cell">{s?.method || "Method"}</th>
                <th className="px-6 py-3 border-b border-slate-100">{s?.date || "Date"}</th>
                <th className="px-6 py-3 border-b border-slate-100 text-right">{s?.amount || "Amount"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => {
                const cfg = statusConfig[tx.status] ?? statusConfig.pending;
                const StatusIcon = cfg.icon;
                const isCredit = tx.type !== "refund" && tx.type !== "wallet_withdrawal";

                return (
                  <tr
                    key={tx._id}
                    onClick={() => router.push(`/dashboard/transactions?tx=${tx._id}`)}
                    className="group transition-colors hover:bg-slate-50/50 cursor-pointer"
                  >
                    {/* Property / Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          isCredit ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-500"
                        )}>
                          {isCredit
                            ? <ArrowDownLeft className="w-4 h-4" />
                            : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
                            {getPropertyTitle(tx, s)}
                          </div>
                          <div className="text-xs text-slate-500">{getTypeLabel(tx.type, s)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        cfg.color
                      )}>
                        {s?.[tx.status] || (tx.status.charAt(0).toUpperCase() + tx.status.slice(1))}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-xs text-slate-500 capitalize">
                        {tx.paymentMethod.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{formatDate(tx.createdAt)}</span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right">
                      <div className={cn(
                        "text-sm font-semibold",
                        tx.status === "failed" || tx.status === "cancelled"
                          ? "text-slate-400 line-through"
                          : isCredit ? "text-slate-900" : "text-red-500"
                      )}>
                        {isCredit ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                      </div>
                      {tx.currency !== "XAF" && (
                        <div className="text-[10px] text-slate-400">{tx.currency}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {total > 0
            ? (s?.showing ? s.showing.replace('{from}', shownFrom).replace('{to}', shownTo).replace('{total}', total.toLocaleString()) : `Showing ${shownFrom}–${shownTo} of ${total.toLocaleString()}`)
            : (s?.noTransactions || "No transactions")}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost" size="sm" className="text-slate-400"
            disabled={page <= 1 || loading}
            onClick={() => fetchTransactions(page - 1, statusFilter)}
          >
            {s?.previous || "Previous"}
          </Button>
          <Button
            variant="ghost" size="sm" className="text-blue-500 font-bold"
            disabled={page >= totalPages || loading}
            onClick={() => fetchTransactions(page + 1, statusFilter)}
          >
            {s?.next || "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}