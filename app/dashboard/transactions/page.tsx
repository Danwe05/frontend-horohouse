'use client';

import React, { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import TransactionList from '@/components/dashboard/transactions';
import { Loader2 } from 'lucide-react';
import { Transaction } from '@/types/paiement';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTxId = searchParams.get('tx') ?? undefined;

  return (
    <main className="flex-1 bg-gray-50">
      <div className="lg:p-6 space-y-6 p-4">
        {selectedTxId && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
            <div className="text-sm font-semibold text-slate-900">Selected transaction</div>
            <div className="text-sm text-slate-600">{selectedTxId}</div>
          </div>
        )}
        <TransactionList />
      </div>
    </main>
  );
}

export default function TransactionsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <Suspense fallback={<div className="flex flex-1 items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>}>
            <TransactionsContent />
          </Suspense>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}