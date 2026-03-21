'use client';

/**
 * BookingPaymentModal
 *
 * Opens Flutterwave's inline payment modal (popup) over your site.
 *
 * SETUP (one-time):
 *   npm install flutterwave-react-v3
 *   Add to .env.local: NEXT_PUBLIC_FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxx-X
 */

import { useState, useCallback, useEffect } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2, CreditCard, ShieldCheck,
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  nights: number;
  currency?: string;
  priceBreakdown: {
    pricePerNight: number;
    subtotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  propertyId: { _id: string; title: string } | string;
  guestId: { _id: string; name: string; email?: string; phoneNumber?: string } | string;
}

interface Props {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'confirm' | 'loading' | 'ready' | 'verifying' | 'success' | 'failed';

interface FlwConfig {
  public_key: string; tx_ref: string; amount: number; currency: string;
  payment_options: string;
  customer: { email: string; phone_number: string; name: string };
  customizations: { title: string; description: string; logo: string };
  meta: Record<string, string>;
}

const MAX_POLLS = 12;
const POLL_MS = 2500;

// ─── Inner FLW button (owns the hook) ────────────────────────────────────────

function FlwPayButton({ config, onPaid, onCancelled }: {
  config: FlwConfig; onPaid: () => void; onCancelled: () => void;
}) {
  const { t } = useLanguage();
  const s = (t as any)?.bookings?.paymentModal || {};
  const handleFlutterPayment = useFlutterwave(config);
  return (
    <Button
      className="w-full h-12 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
      onClick={() =>
        handleFlutterPayment({
          callback: (res) => {
            closePaymentModal();
            if (res.status === 'successful' || res.status === 'completed') onPaid();
            else onCancelled();
          },
          onClose: onCancelled,
        })
      }
    >
      <CreditCard className="h-4 w-4" /> {s.payNow || 'Pay Now'}
    </Button>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function BookingPaymentModal({ booking, open, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const s = (t as any)?.bookings?.paymentModal || {};
  const [step, setStep] = useState<Step>('confirm');
  const [flwConfig, setFlwConfig] = useState<FlwConfig | null>(null);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (open) { setStep('confirm'); setFlwConfig(null); setError(''); setPollCount(0); }
  }, [open]);

  const pb = booking.priceBreakdown;
  const { formatMoney } = useCurrency();
  // bookingCurrency is the ISO code used for the Flutterwave payment charge (always XAF from the API)
  const bookingCurrency = booking.currency ?? 'XAF';
  const propTitle = typeof booking.propertyId === 'string' ? 'Property' : booking.propertyId.title;
  const guestName = typeof booking.guestId === 'string' ? '' : (booking.guestId.name ?? '');
  const guestEmail = typeof booking.guestId === 'string' ? '' : (booking.guestId.email ?? '');
  const guestPhone = typeof booking.guestId === 'string' ? '' : ((booking.guestId as any).phoneNumber ?? '');

  // Step 1 — fetch payment link from backend
  const handleInitiate = useCallback(async () => {
    setStep('loading'); setError('');
    try {
      const res = await apiClient.initiateBookingPayment(booking._id);
      setFlwConfig({
        public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY!,
        tx_ref: res.txRef,
        amount: pb.totalAmount,
        currency: bookingCurrency,
        payment_options: 'card,mobilemoney,account,banktransfer',
        customer: { email: guestEmail, phone_number: guestPhone, name: guestName },
        customizations: {
          title: 'HoroHouse Stay Payment',
          description: `${propTitle} · ${booking.nights} night${booking.nights !== 1 ? 's' : ''}`,
          logo: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '',
        },
        meta: { bookingId: booking._id, transactionId: res.transaction?._id ?? '' },
      });
      setStep('ready');
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      setError(typeof raw === 'string' ? raw : 'Failed to prepare payment. Please try again.');
      setStep('confirm');
    }
  }, [booking, pb, bookingCurrency, propTitle, guestEmail, guestPhone, guestName]);

  // Step 2 — poll until webhook confirms
  const pollStatus = useCallback(() => {
    setStep('verifying');
    let attempts = 0;

    const timer = setInterval(async () => {
      try {
        const updated = await apiClient.getBookingPaymentStatus(booking._id);
        if (updated.paymentStatus === 'paid') {
          clearInterval(timer);
          setStep('success');
          setTimeout(onSuccess, 1500);
          return;
        }
      } catch { /* keep polling */ }

      attempts++;
      setPollCount(attempts);

      if (attempts >= MAX_POLLS) {
        clearInterval(timer);
        toast.warning('Payment received. Confirmation may take a moment.');
        setStep('success');
        setTimeout(onSuccess, 1500);
      }
    }, POLL_MS);

    return timer;
  }, [booking._id, onSuccess]);
  const handleFlwCancelled = useCallback(() => {
    toast.error('Payment not completed. Your booking is saved — pay later from your bookings page.');
    setStep('confirm'); setFlwConfig(null);
  }, []);

  function handleDialogClose() {
    if (step === 'loading' || step === 'verifying') return;
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <CreditCard className="h-5 w-5 text-amber-500" /> {s.completeBooking || 'Complete Your Booking'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {propTitle} · {booking.nights} {(booking.nights !== 1 ? s.nights : s.night) || (booking.nights !== 1 ? 'nights' : 'night')}
          </DialogDescription>
        </DialogHeader>

        {/* Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <p className="text-lg font-bold text-slate-900">{s.paymentConfirmed || 'Payment confirmed!'}</p>
            <p className="text-sm text-slate-500">{s.redirecting || 'Redirecting to your booking…'}</p>
          </div>
        )}

        {/* Failed */}
        {step === 'failed' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle className="h-14 w-14 text-red-400" />
            <p className="text-lg font-bold text-slate-900">{s.paymentFailed || 'Payment failed'}</p>
            <p className="text-sm text-slate-500">{s.paymentFailedDesc || 'Your booking is saved. Retry from your bookings page.'}</p>
            <Button className="mt-2" onClick={() => setStep('confirm')}>
              <RefreshCw className="h-4 w-4 mr-2" /> {s.tryAgain || 'Try Again'}
            </Button>
          </div>
        )}

        {/* Normal flow */}
        {step !== 'success' && step !== 'failed' && (
          <>
            {/* Price breakdown */}
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{formatMoney(pb.pricePerNight)} × {booking.nights} {s.nights || 'nights'}</span>
                <span>{formatMoney(pb.subtotal)}</span>
              </div>
              {pb.cleaningFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{s.cleaningFee || 'Cleaning fee'}</span><span>{formatMoney(pb.cleaningFee)}</span>
                </div>
              )}
              {pb.serviceFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{s.serviceFee || 'Service fee'}</span><span>{formatMoney(pb.serviceFee)}</span>
                </div>
              )}
              {pb.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{s.taxes || 'Taxes'}</span><span>{formatMoney(pb.taxAmount)}</span>
                </div>
              )}
              {pb.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{s.discount || 'Discount'}</span><span>−{formatMoney(pb.discountAmount)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-slate-900">
                <span>{s.total || 'Total'}</span><span>{formatMoney(pb.totalAmount)}</span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              {s.securedBy || 'Secured by Flutterwave · Card, Mobile Money & Bank Transfer accepted'}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
              </div>
            )}

            {/* Verifying progress bar */}
            {step === 'verifying' && (
              <div className="space-y-2">
                <p className="text-sm text-center text-slate-500">{s.confirming || 'Confirming your payment…'}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 92)}%` }}
                  />
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-2">
              {step === 'confirm' && (
                <Button
                  className="w-full h-12 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  onClick={handleInitiate}
                >
                  <CreditCard className="h-4 w-4" /> {s.proceedToPayment || 'Proceed to Payment'}
                </Button>
              )}
              {step === 'loading' && (
                <Button className="w-full h-12" disabled>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> {s.preparingPayment || 'Preparing payment…'}
                </Button>
              )}
              {step === 'ready' && flwConfig && (
                <FlwPayButton config={flwConfig} onPaid={pollStatus} onCancelled={handleFlwCancelled} />
              )}
              {step === 'verifying' && (
                <Button className="w-full h-12" disabled>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> {s.confirmingPayment || 'Confirming payment…'}
                </Button>
              )}
              {step !== 'loading' && step !== 'verifying' && (
                <Button variant="outline" className="w-full" onClick={handleDialogClose}>
                  {step === 'ready' ? (s.cancel || 'Cancel') : (s.payLater || 'Pay Later')}
                </Button>
              )}
            </div>

            {step === 'confirm' && (
              <p className="text-xs text-center text-slate-400">
                {s.payLaterDesc || 'Your booking is saved. You can also pay later from your bookings page.'}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}