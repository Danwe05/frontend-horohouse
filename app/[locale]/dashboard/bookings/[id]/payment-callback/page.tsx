'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type State = 'polling' | 'paid' | 'cancelled' | 'failed' | 'timeout';

const MAX_POLLS = 15;
const POLL_MS = 3000;

function PaymentCallbackContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // CamerPay query params
  const camerpayStatus = searchParams.get('status');  // 'completed' | 'failed' | 'cancelled' | null
  const camerpayUuid   = searchParams.get('uuid');    // CamerPay transaction UUID

  const [state, setState]       = useState<State>(() => {
    if (camerpayStatus === 'failed')    return 'failed';
    if (camerpayStatus === 'cancelled') return 'cancelled';
    return 'polling'; // completed or unknown — poll to confirm
  });
  const [pollCount, setPollCount] = useState(0);

  // ── Poll booking until paymentStatus === 'paid' ───────────────────────────
  useEffect(() => {
    if (state !== 'polling') return;

    let cancelled = false;
    let attempts  = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        const booking = await apiClient.getBookingPaymentStatus(id);
        if (booking.paymentStatus === 'paid') {
          if (!cancelled) setState('paid');
          return;
        }
      } catch { /* keep polling */ }

      attempts++;
      setPollCount(attempts);

      if (attempts >= MAX_POLLS) {
        if (!cancelled) setState('timeout');
        return;
      }

      setTimeout(tick, POLL_MS);
    };

    tick();
    return () => { cancelled = true; };
  }, [state, id]);

  // ── Auto-redirect when paid ───────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'paid') return;
    const t = setTimeout(() => router.push(`/dashboard/bookings/${id}`), 1800);
    return () => clearTimeout(t);
  }, [state, id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#EBEBEB] bg-white p-8 text-center space-y-4 shadow-sm">

        {/* ── Polling / verifying ── */}
        {state === 'polling' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#222222]" />
            <h1 className="text-[18px] font-bold text-[#222222]">
              Confirmation du paiement...
            </h1>
            <p className="text-[14px] text-[#717171]">
              Ne fermez pas cette page.
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EBEBEB]">
              <div
                className="h-full rounded-full bg-[#222222] transition-all duration-500"
                style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 92)}%` }}
              />
            </div>
          </>
        )}

        {/* ── Paid ── */}
        {state === 'paid' && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#EBFBF0] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-[#008A05]" strokeWidth={2.5} />
            </div>
            <h1 className="text-[20px] font-bold text-[#222222]">Paiement confirmé !</h1>
            <p className="text-[14px] text-[#717171]">
              Redirection vers votre réservation...
            </p>
          </>
        )}

        {/* ── Cancelled ── */}
        {state === 'cancelled' && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-[#717171]" strokeWidth={2.5} />
            </div>
            <h1 className="text-[20px] font-bold text-[#222222]">Paiement annulé</h1>
            <p className="text-[14px] text-[#717171]">
              Votre réservation est sauvegardée. Vous pouvez payer à tout moment.
            </p>
            <Button
              className="w-full h-12 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold"
              onClick={() => router.push(`/dashboard/bookings/${id}`)}
            >
              Voir ma réservation
            </Button>
          </>
        )}

        {/* ── Failed ── */}
        {state === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-[#C2410C]" strokeWidth={2.5} />
            </div>
            <h1 className="text-[20px] font-bold text-[#222222]">Paiement échoué</h1>
            <p className="text-[14px] text-[#717171]">
              Votre réservation est sauvegardée. Réessayez depuis la page de réservation.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-12 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold"
                onClick={() => { setPollCount(0); setState('polling'); }}
              >
                Vérifier quand même
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() => router.push(`/dashboard/bookings/${id}`)}
              >
                Voir ma réservation
              </Button>
            </div>
          </>
        )}

        {/* ── Timeout ── */}
        {state === 'timeout' && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#FFF9E6] flex items-center justify-center mx-auto">
              <RefreshCw className="h-8 w-8 text-[#D97706]" />
            </div>
            <h1 className="text-[20px] font-bold text-[#222222]">Toujours en cours...</h1>
            <p className="text-[14px] text-[#717171]">
              La confirmation peut prendre quelques minutes. Vérifiez votre réservation.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-12 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold"
                onClick={() => { setPollCount(0); setState('polling'); }}
              >
                Réessayer
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() => router.push(`/dashboard/bookings/${id}`)}
              >
                Voir ma réservation
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7]">
      <Loader2 className="h-10 w-10 animate-spin text-[#222222]/40" />
    </div>
  );
}

export default function PaymentCallbackPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentCallbackContent id={id} />
    </Suspense>
  );
}