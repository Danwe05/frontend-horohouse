"use client";

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2,
  Clock,
  AlertCircle,
  DownloadCloud,
  Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TransactionStatus = "completed" | "pending" | "failed";

export type Transaction = {
  id: string;
  property: string;
  type: string;
  amount: number;
  status: TransactionStatus;
  date: string;
};

const defaultTransactions: Transaction[] = [
  {
    id: "TX-90210",
    property: "Emerald Vista Villa",
    type: "Rent Payment",
    amount: 4500.00,
    status: "completed",
    date: "Feb 10, 2026",
  },
  {
    id: "TX-88342",
    property: "Azure Loft",
    type: "Security Deposit",
    amount: 12000.00,
    status: "pending",
    date: "Feb 08, 2026",
  },
  {
    id: "TX-77129",
    property: "Maintenance: HVAC",
    type: "Service Fee",
    amount: -450.00,
    status: "completed",
    date: "Feb 05, 2026",
  },
  {
    id: "TX-66102",
    property: "The Gentry Estate",
    type: "Commission",
    amount: 8500.00,
    status: "failed",
    date: "Feb 01, 2026",
  }
];

const statusConfig = {
  completed: { color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  pending: { color: "text-blue-500 bg-blue-50", icon: Clock },
  failed: { color: "text-red-600 bg-red-50", icon: AlertCircle },
};

type SimpleTransactionListProps = {
  transactions?: Transaction[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onFilterClick?: () => void;
  onExportClick?: () => void;
  onTransactionClick?: (tx: Transaction) => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
};

export default function SimpleTransactionList({
  transactions = defaultTransactions,
  totalCount = 24,
  page = 1,
  pageSize = 4,
  onFilterClick,
  onExportClick,
  onTransactionClick,
  onPreviousPage,
  onNextPage,
}: SimpleTransactionListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");

  const filteredTransactions = useMemo(() => {
    if (statusFilter === "all") return transactions;
    return transactions.filter((tx) => tx.status === statusFilter);
  }, [transactions, statusFilter]);

  const handleFilterSelect = (value: TransactionStatus | "all") => {
    setStatusFilter(value);
    onFilterClick?.();
  };

  const handleExport = () => {
    onExportClick?.();

    const rows = filteredTransactions;
    const header = ["id", "property", "type", "amount", "status", "date"];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv = [
      header.join(","),
      ...rows.map((tx) => [
        escape(tx.id),
        escape(tx.property),
        escape(tx.type),
        escape(tx.amount),
        escape(tx.status),
        escape(tx.date),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleTransactionRowClick = (tx: Transaction) => {
    if (onTransactionClick) {
      onTransactionClick(tx);
      return;
    }

    router.push(`/dashboard/transactions?tx=${encodeURIComponent(tx.id)}`);
  };

  const handlePreviousPage = () => {
    if (onPreviousPage) {
      onPreviousPage();
      return;
    }

    router.push(`/dashboard/transactions?page=${page - 1}`);
  };

  const handleNextPage = () => {
    if (onNextPage) {
      onNextPage();
      return;
    }

    router.push(`/dashboard/transactions?page=${page + 1}`);
  };

  const shownCount = Math.min(page * pageSize, totalCount);
  const canGoPrevious = page > 1;
  const canGoNext = shownCount < totalCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* 1. CLEAN HEADER */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
          <p className="text-sm text-slate-500">Manage your latest property payments</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-slate-600 border-slate-200"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFilterSelect("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("failed")}>
                Failed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            onClick={handleExport}
          >
            <DownloadCloud className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* 2. SIMPLIFIED TABLE-LIKE LIST */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-3 border-b border-slate-100">Property / Type</th>
              <th className="px-6 py-3 border-b border-slate-100 hidden md:table-cell">Status</th>
              <th className="px-6 py-3 border-b border-slate-100">Date</th>
              <th className="px-6 py-3 border-b border-slate-100 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTransactions.map((tx) => {
              const StatusIcon = statusConfig[tx.status as keyof typeof statusConfig].icon;
              const statusColor = statusConfig[tx.status as keyof typeof statusConfig].color;

              return (
                <motion.tr 
                  key={tx.id}
                  whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.5)" }}
                  onClick={() => handleTransactionRowClick(tx)}
                  className={cn(
                    "group transition-colors",
                    "cursor-pointer"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tx.amount > 0 ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-500"
                      )}>
                        {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{tx.property}</div>
                        <div className="text-xs text-slate-500">{tx.type}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusColor
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {tx.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{tx.date}</span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className={cn(
                      "text-sm font-semibold",
                      tx.amount > 0 ? "text-slate-900" : "text-red-500"
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. PAGINATION FOOTER */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <span className="text-xs text-slate-500">Showing {shownCount} of {totalCount} transactions</span>
        <div className="flex gap-1">
           <Button
             variant="ghost"
             size="sm"
             className="text-slate-400"
             onClick={handlePreviousPage}
             disabled={!canGoPrevious}
           >
             Previous
           </Button>
           <Button
             variant="ghost"
             size="sm"
             className="text-blue-500 font-bold"
             onClick={handleNextPage}
             disabled={!canGoNext}
           >
             Next
           </Button>
        </div>
      </div>
    </div>
  );
}

// Utility to handle classes easily
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}