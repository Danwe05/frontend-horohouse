'use client';

/**
 * app/dashboard/bookings/[id]/payment-callback/page.tsx
 *
 * Flutterwave redirects here after the hosted checkout with:
 *   ?status=successful|cancelled&tx_ref=HH-BOO-...&transaction_id=<flw_id>
 *
 * On status=successful we:
 *  1. Fetch our internal transaction by tx_ref
 *  2. Call POST /payments/verify with our internal transaction._id
 *     (which in turn calls Flutterwave to double-check and marks booking as paid)
 *  3. Poll the booking as a fallback until paymentStatus === 'paid'
 */

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type State = 'verifying' | 'polling' | 'paid' | 'cancelled' | 'failed' | 'timeout';

const MAX_POLLS = 12;
const POLL_MS = 2500;

// ── Inner component that uses useSearchParams ──────────────────────────────
function PaymentCallbackContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const flwStatus = searchParams.get('status');         // 'successful' | 'cancelled'
  const txRef = searchParams.get('tx_ref');          // 'HH-BOO-...'
  const flwTxId = searchParams.get('transaction_id'); // Flutterwave transaction ID

  const [state, setState] = useState<State>(() => {
    if (flwStatus === 'cancelled') return 'cancelled';
    if (flwStatus === 'successful' && txRef) return 'verifying';
    return 'polling'; // unknown — just poll
  });
  const [pollCount, setPollCount] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ── Step 1: Verify via our backend ────────────────────────────────────────
  useEffect(() => {
    if (state !== 'verifying' || !txRef) return;

    let cancelled = false;
    (async () => {
      try {
        // Fetch our internal transaction by the tx_ref Flutterwave returned
        const txData = await apiClient.getTransactionByReference(txRef);
        const internalTxId: string = txData._id ?? txData.id;

        if (!internalTxId) {
          setState('polling'); // fall back to polling
          return;
        }

        // Call verify — backend double-checks with Flutterwave and marks booking paid
        await apiClient.verifyPayment(internalTxId, flwTxId ?? undefined);

        if (!cancelled) setState('paid');
      } catch (err: any) {
        if (!cancelled) {
          // verifyPayment may throw if transaction already verified — fall back to poll
          setState('polling');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [state, txRef, flwTxId]);

  // ── Step 2: Auto-redirect when paid ─────────────────────────────────────
  useEffect(() => {
    if (state !== 'paid') return;
    const t = setTimeout(() => router.push(`/dashboard/bookings/${id}`), 1800);
    return () => clearTimeout(t);
  }, [state, id, router]);

  // ── Step 3 (fallback): Poll booking until paid ────────────────────────────
  useEffect(() => {
    if (state !== 'polling') return;

    const timer = setInterval(async () => {
      try {
        const booking = await apiClient.getBookingPaymentStatus(id);
        if (booking.paymentStatus === 'paid') {
          setState('paid');
          clearInterval(timer);
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
  }, [state, id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 -sm text-center space-y-4">

        {(state === 'verifying' || state === 'polling') && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
            <h1 className="text-lg font-bold text-slate-900">
              {state === 'verifying' ? 'Verifying your payment…' : 'Confirming your payment…'}
            </h1>
            <p className="text-sm text-slate-500">Please don't close this page.</p>
            {state === 'polling' && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 92)}%` }}
                />
              </div>
            )}
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

        {state === 'failed' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="text-lg font-bold text-slate-900">Verification failed</h1>
            {errMsg && <p className="text-sm text-red-500">{errMsg}</p>}
            <div className="flex flex-col gap-2">
              <Button onClick={() => { setPollCount(0); setState('polling'); }}>Check again</Button>
              <Button variant="outline" onClick={() => router.push(`/dashboard/bookings/${id}`)}>View Booking</Button>
            </div>
          </>
        )}

        {state === 'timeout' && (
          <>
            <RefreshCw className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="text-lg font-bold text-slate-900">Still processing…</h1>
            <p className="text-sm text-slate-500">Check your booking for the latest payment status.</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { setPollCount(0); setState(txRef ? 'verifying' : 'polling'); }}>Check again</Button>
              <Button variant="outline" onClick={() => router.push(`/dashboard/bookings/${id}`)}>View Booking</Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ── Fallback shown while Suspense resolves ─────────────────────────────────
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500/40" />
    </div>
  );
}

// ── Page export — wraps inner component in Suspense ────────────────────────
export default function PaymentCallbackPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentCallbackContent id={id} />
    </Suspense>
  );
}