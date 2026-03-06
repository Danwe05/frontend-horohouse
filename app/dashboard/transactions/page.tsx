'use client';

import React, { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import TransactionList, { Transaction } from '@/components/dashboard/transactions';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTxId = searchParams.get('tx') ?? undefined;
  const pageParam = searchParams.get('page');
  const page = useMemo(() => {
    const n = Number(pageParam);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [pageParam]);

  const pageSize = 4;

  const handleTransactionClick = (tx: Transaction) => {
    router.push(`/dashboard/transactions?tx=${encodeURIComponent(tx.id)}&page=${page}`);
  };

  const handlePreviousPage = () => {
    router.push(`/dashboard/transactions?page=${Math.max(1, page - 1)}${selectedTxId ? `&tx=${encodeURIComponent(selectedTxId)}` : ''}`);
  };

  const handleNextPage = () => {
    router.push(`/dashboard/transactions?page=${page + 1}${selectedTxId ? `&tx=${encodeURIComponent(selectedTxId)}` : ''}`);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="flex-1 bg-gray-50">
            <div className="lg:p-6 space-y-6 p-4">
              {selectedTxId && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">Selected transaction</div>
                  <div className="text-sm text-slate-600">{selectedTxId}</div>
                </div>
              )}

              <TransactionList
                page={page}
                pageSize={pageSize}
                onTransactionClick={handleTransactionClick}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
              />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
