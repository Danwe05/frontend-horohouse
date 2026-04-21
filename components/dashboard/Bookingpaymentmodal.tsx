'use client';

/**
 * BookingPaymentModal
 *
 * Opens Flutterwave's inline payment modal (popup) over your site.
 *
 * SETUP (one-time):
 * npm install flutterwave-react-v3
 * Add to .env.local: NEXT_PUBLIC_FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxx-X
 */

import { useState, useCallback, useEffect } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2, ShieldCheck,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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

  const safeTitle = (val: any, fallback: string) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.title) return val.title;
    return fallback;
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <button
      className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] flex items-center justify-center transition-all active:scale-[0.98]"
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
      {safeTitle(s.payNow, 'Confirm and pay')}
    </button>
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

  // Safe extractors to prevent object crash
  const safeTitle = (val: any, fallback: string) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.title) return val.title;
    return fallback;
  };
  const safeDesc = (objVal: any, strVal: any, fallback: string) => {
    if (typeof strVal === 'string') return strVal;
    if (objVal && typeof objVal === 'object' && objVal.description) return objVal.description;
    return fallback;
  };

  useEffect(() => {
    if (open) { setStep('confirm'); setFlwConfig(null); setError(''); setPollCount(0); }
  }, [open]);

  const pb = booking.priceBreakdown;
  const { formatMoney } = useCurrency();
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
        toast.warning(safeTitle(s.paymentReceivedWait, 'Payment received. Confirmation may take a moment.'));
        setStep('success');
        setTimeout(onSuccess, 1500);
      }
    }, POLL_MS);

    return timer;
  }, [booking._id, onSuccess, s]);

  const handleFlwCancelled = useCallback(() => {
    toast.error(safeTitle(s.paymentNotCompleted, 'Payment not completed. Your booking is saved — pay later from your bookings page.'));
    setStep('confirm'); setFlwConfig(null);
  }, [s]);

  function handleDialogClose() {
    if (step === 'loading' || step === 'verifying') return;
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleDialogClose(); }}>
      <DialogContent 
        aria-describedby={undefined}
        className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0 sm:rounded-2xl flex flex-col font-sans antialiased shadow-xl [&>button]:hidden"
      >

        {/* Airbnb Style Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-[#EBEBEB]">
          <button 
            onClick={handleDialogClose} 
            disabled={step === 'loading' || step === 'verifying'} 
            className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors disabled:opacity-50 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-[#222222]" strokeWidth={2} />
          </button>
          <DialogTitle className="text-[16px] font-semibold text-[#222222] m-0">
            {step === 'success' || step === 'failed' ? safeTitle(s.paymentStatus, "Payment status") : safeTitle(s.completeBooking, "Confirm and pay")}
          </DialogTitle>
        </div>

        <div className="p-6">
          {/* Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#EBFBF0] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#008A05] stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold tracking-tight text-[#222222] mb-1">{safeTitle(s.paymentConfirmed, 'Payment confirmed!')}</p>
                <p className="text-[15px] text-[#717171]">{safeTitle(s.redirecting, 'Redirecting to your trip details...')}</p>
              </div>
            </div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center">
                <XCircle className="h-8 w-8 text-[#C2410C] stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold tracking-tight text-[#222222] mb-1">{safeTitle(s.paymentFailed, 'Payment failed')}</p>
                <p className="text-[15px] text-[#717171] mb-6">{safeDesc(s.paymentFailed, s.paymentFailedDesc, 'Your booking is saved. You can try paying again.')}</p>
                <button
                  className="h-12 px-8 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold text-[15px] flex items-center justify-center transition-all active:scale-95"
                  onClick={() => setStep('confirm')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> {safeTitle(s.tryAgain, 'Try again')}
                </button>
              </div>
            </div>
          )}

          {/* Normal Flow */}
          {step !== 'success' && step !== 'failed' && (
            <div className="space-y-8 animate-in fade-in duration-300">

              {/* Trip summary */}
              <section>
                <h3 className="text-[22px] font-semibold tracking-tight text-[#222222] mb-4">Your trip</h3>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[16px] font-semibold text-[#222222]">Dates</div>
                    <div className="text-[15px] text-[#717171]">
                      {booking.nights} {booking.nights !== 1 ? safeTitle(s.nights, 'nights') : safeTitle(s.night, 'night')}
                    </div>
                  </div>
                </div>
              </section>

              {/* Price details */}
              <section className="pt-6 border-t border-[#EBEBEB]">
                <h3 className="text-[22px] font-semibold tracking-tight text-[#222222] mb-4">Price details</h3>

                <div className="space-y-3.5 pb-5 border-b border-[#EBEBEB]">
                  <div className="flex justify-between text-[15px] text-[#222222]">
                    <span>{formatMoney(pb.pricePerNight)} x {booking.nights} {safeTitle(s.nights, 'nights')}</span>
                    <span>{formatMoney(pb.subtotal)}</span>
                  </div>

                  {pb.cleaningFee > 0 && (
                    <div className="flex justify-between text-[15px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2">{safeTitle(s.cleaningFee, 'Cleaning fee')}</span>
                      <span>{formatMoney(pb.cleaningFee)}</span>
                    </div>
                  )}

                  {pb.serviceFee > 0 && (
                    <div className="flex justify-between text-[15px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2">{safeTitle(s.serviceFee, 'HoroHouse service fee')}</span>
                      <span>{formatMoney(pb.serviceFee)}</span>
                    </div>
                  )}

                  {pb.taxAmount > 0 && (
                    <div className="flex justify-between text-[15px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2">{safeTitle(s.taxes, 'Taxes')}</span>
                      <span>{formatMoney(pb.taxAmount)}</span>
                    </div>
                  )}

                  {pb.discountAmount > 0 && (
                    <div className="flex justify-between text-[#008A05] font-medium text-[15px]">
                      <span>{safeTitle(s.discount, 'Discount')}</span>
                      <span>−{formatMoney(pb.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-5 text-[16px] font-bold text-[#222222]">
                  <span>{safeTitle(s.total, 'Total')} ({bookingCurrency})</span>
                  <span>{formatMoney(pb.totalAmount)}</span>
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-[#FFF7ED] border border-[#C2410C]/20 px-4 py-3 text-[14px] text-[#C2410C] font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Verifying progress bar */}
              {step === 'verifying' && (
                <div className="space-y-3 bg-[#F7F7F7] p-6 rounded-xl border border-[#DDDDDD] text-center">
                  <p className="text-[15px] font-medium text-[#222222]">{safeTitle(s.confirming, 'Confirming your payment...')}</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBEBEB]">
                    <div
                      className="h-full rounded-full bg-[#222222] transition-all duration-500"
                      style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 92)}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-[#717171]">Please don't close this window</p>
                </div>
              )}

              {/* Action Area */}
              <div className="pt-2">
                {step === 'confirm' && (
                  <button
                    className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] flex items-center justify-center transition-all active:scale-[0.98]"
                    onClick={handleInitiate}
                  >
                    {safeTitle(s.proceedToPayment, 'Confirm and pay')}
                  </button>
                )}
                {step === 'loading' && (
                  <button className="w-full h-14 rounded-xl bg-[#DDDDDD] text-[#717171] font-semibold text-[16px] flex items-center justify-center cursor-not-allowed" disabled>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> {safeTitle(s.preparingPayment, 'Preparing payment...')}
                  </button>
                )}
                {step === 'ready' && flwConfig && (
                  <FlwPayButton config={flwConfig} onPaid={pollStatus} onCancelled={handleFlwCancelled} />
                )}
                {step === 'verifying' && (
                  <button className="w-full h-14 rounded-xl bg-[#DDDDDD] text-[#717171] font-semibold text-[16px] flex items-center justify-center cursor-not-allowed" disabled>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> {safeTitle(s.confirmingPayment, 'Verifying...')}
                  </button>
                )}

                <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-[#717171] mt-4">
                  <ShieldCheck className="h-4 w-4" />
                  {safeTitle(s.securedBy, 'Payments securely processed by Flutterwave')}
                </div>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}