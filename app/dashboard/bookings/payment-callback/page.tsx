'use client';

/**
 * app/dashboard/bookings/[id]/payment-callback/page.tsx
 *
 * Flutterwave always fires redirect_url after payment — this page handles
 * the rare case where the inline modal opened in a new tab or the browser
 * navigated away. The modal itself handles the normal inline flow.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type State = 'polling' | 'paid' | 'cancelled' | 'timeout';

const MAX_POLLS = 12;
const POLL_MS   = 2500;

export default function PaymentCallbackPage() {
  const { id }       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const flwStatus    = searchParams.get('status');

  const [state, setState]         = useState<State>(flwStatus === 'cancelled' ? 'cancelled' : 'polling');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (state !== 'polling') return;
    const timer = setInterval(async () => {
      try {
        const booking = await apiClient.getBookingPaymentStatus(id);
        if (booking.paymentStatus === 'paid') {
          setState('paid');
          clearInterval(timer);
          setTimeout(() => router.push(`/dashboard/bookings/${id}`), 1800);
          return;
        }
      } catch { /* keep polling */ }
      setPollCount(c => {
        const next = c + 1;
        if (next >= MAX_POLLS) { setState('timeout'); clearInterval(timer); }
        return next;
      });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [state, id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-4">

        {state === 'polling' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
            <h1 className="text-lg font-bold text-slate-900">Confirming your payment…</h1>
            <p className="text-sm text-slate-500">Please don't close this page.</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 92)}%` }} />
            </div>
          </>
        )}

        {state === 'paid' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-lg font-bold text-slate-900">Payment confirmed!</h1>
            <p className="text-sm text-slate-500">Redirecting to your booking…</p>
          </>
        )}

        {state === 'cancelled' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="text-lg font-bold text-slate-900">Payment cancelled</h1>
            <p className="text-sm text-slate-500">Your booking is saved. Pay anytime from your bookings page.</p>
            <Button className="w-full" onClick={() => router.push(`/dashboard/bookings/${id}`)}>View Booking</Button>
          </>
        )}

        {state === 'timeout' && (
          <>
            <RefreshCw className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="text-lg font-bold text-slate-900">Still processing…</h1>
            <p className="text-sm text-slate-500">Check your booking for the latest payment status.</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { setPollCount(0); setState('polling'); }}>Check again</Button>
              <Button variant="outline" onClick={() => router.push(`/dashboard/bookings/${id}`)}>View Booking</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}