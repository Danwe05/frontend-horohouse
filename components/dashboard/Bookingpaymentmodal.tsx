'use client';

import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2, ShieldCheck,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronLeft,
  Smartphone, ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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

type Step = 'confirm' | 'loading' | 'redirect' | 'verifying' | 'success' | 'failed';

const MAX_POLLS = 15;
const POLL_MS   = 3000;

export default function BookingPaymentModal({ booking, open, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const s = (t as any)?.bookings?.paymentModal || {};

  const safeTitle = (val: any, fallback: string): string => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.title) return val.title;
    return fallback;
  };
  const safeDesc = (objVal: any, strVal: any, fallback: string): string => {
    if (typeof strVal === 'string') return strVal;
    if (objVal && typeof objVal === 'object' && objVal.description) return objVal.description;
    return fallback;
  };

  const [step, setStep]             = useState<Step>('confirm');
  const [error, setError]           = useState('');
  const [pollCount, setPollCount]   = useState(0);
  // ✅ NEW: store the CamerPay checkout URL so user can re-open it
  const [checkoutUrl, setCheckoutUrl] = useState('');

  useEffect(() => {
    if (open) {
      setStep('confirm');
      setError('');
      setPollCount(0);
      setCheckoutUrl(''); // ✅ reset on re-open
    }
  }, [open]);

  const pb              = booking.priceBreakdown;
  const { formatMoney } = useCurrency();
  const bookingCurrency = booking.currency ?? 'XAF';

  // ── Step 1: initiate payment, open CamerPay in new tab ───────────────────

  const handleInitiate = useCallback(async () => {
    setStep('loading');
    setError('');
    try {
      const result = await apiClient.initiateBookingPayment(booking._id);

      // ✅ Store checkout URL and open CamerPay hosted page in a new tab
      if (result.paymentLink) {
        setCheckoutUrl(result.paymentLink);
        window.open(result.paymentLink, '_blank', 'noopener,noreferrer');
      }

      setStep('redirect');
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      setError(typeof raw === 'string' ? raw : 'Failed to prepare payment. Please try again.');
      setStep('confirm');
    }
  }, [booking._id]);

  // ── Step 2: user clicks "I've paid" → poll backend ───────────────────────

  const handleCheckPayment = useCallback(() => {
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
        toast.warning(
          safeTitle(s.paymentReceivedWait, 'Payment received. Confirmation may take a moment.'),
        );
        setStep('success');
        setTimeout(onSuccess, 2000);
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [booking._id, onSuccess, s]);

  // ✅ Re-open CamerPay tab if user closed it
  const handleReopenCheckout = useCallback(() => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  }, [checkoutUrl]);

  const handleBackToRedirect = useCallback(() => {
    setPollCount(0);
    setStep('redirect');
  }, []);

  function handleDialogClose() {
    if (step === 'loading' || step === 'verifying') return;
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDialogClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0 sm:rounded-2xl flex flex-col font-sans antialiased shadow-xl [&>button]:hidden"
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-[#EBEBEB]">
          <button
            onClick={handleDialogClose}
            disabled={step === 'loading' || step === 'verifying'}
            className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors disabled:opacity-50 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-[#222222]" strokeWidth={2} />
          </button>
          <DialogTitle className="text-[16px] font-semibold text-[#222222] m-0">
            {step === 'success' || step === 'failed'
              ? safeTitle(s.paymentStatus, 'Payment status')
              : safeTitle(s.completeBooking, 'Confirm and pay')}
          </DialogTitle>
        </div>

        <div className="p-6">

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#EBFBF0] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#008A05] stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold tracking-tight text-[#222222] mb-1">
                  {safeTitle(s.paymentConfirmed, 'Payment confirmed!')}
                </p>
                <p className="text-[15px] text-[#717171]">
                  {safeTitle(s.redirecting, 'Redirecting to your trip details...')}
                </p>
              </div>
            </div>
          )}

          {/* ── Failed ── */}
          {step === 'failed' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center">
                <XCircle className="h-8 w-8 text-[#C2410C] stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold tracking-tight text-[#222222] mb-1">
                  {safeTitle(s.paymentFailed, 'Payment failed')}
                </p>
                <p className="text-[15px] text-[#717171] mb-6">
                  {safeDesc(s.paymentFailed, s.paymentFailedDesc, 'Your booking is saved. You can try paying again.')}
                </p>
                <button
                  className="h-12 px-8 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold text-[15px] flex items-center justify-center transition-all active:scale-95"
                  onClick={() => setStep('confirm')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {safeTitle(s.tryAgain, 'Try again')}
                </button>
              </div>
            </div>
          )}

          {/* ── Normal flow ── */}
          {step !== 'success' && step !== 'failed' && (
            <div className="space-y-8 animate-in fade-in duration-300">

              {/* Trip summary */}
              <section>
                <h3 className="text-[22px] font-semibold tracking-tight text-[#222222] mb-4">
                  {safeTitle(s.yourTrip, 'Your trip')}
                </h3>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[16px] font-semibold text-[#222222]">
                      {safeTitle(s.dates, 'Dates')}
                    </div>
                    <div className="text-[15px] text-[#717171]">
                      {booking.nights}{' '}
                      {booking.nights !== 1
                        ? safeTitle(s.nights, 'nights')
                        : safeTitle(s.night, 'night')}
                    </div>
                  </div>
                </div>
              </section>

              {/* Price details */}
              <section className="pt-6 border-t border-[#EBEBEB]">
                <h3 className="text-[22px] font-semibold tracking-tight text-[#222222] mb-4">
                  {safeTitle(s.priceDetails, 'Price details')}
                </h3>

                <div className="space-y-3.5 pb-5 border-b border-[#EBEBEB]">
                  <div className="flex justify-between text-[15px] text-[#222222]">
                    <span>
                      {formatMoney(pb.pricePerNight)} × {booking.nights}{' '}
                      {safeTitle(s.nights, 'nights')}
                    </span>
                    <span>{formatMoney(pb.subtotal)}</span>
                  </div>

                  {pb.cleaningFee > 0 && (
                    <div className="flex justify-between text-[15px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2">
                        {safeTitle(s.cleaningFee, 'Cleaning fee')}
                      </span>
                      <span>{formatMoney(pb.cleaningFee)}</span>
                    </div>
                  )}

                  {pb.serviceFee > 0 && (
                    <div className="flex justify-between text-[15px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2">
                        {safeTitle(s.serviceFee, 'HoroHouse service fee')}
                      </span>
                      <span>{formatMoney(pb.serviceFee)}</span>
                    </div>
                  )}

                  {pb.taxAmount > 0 && (
                    <div className="flex justify-between text-[15px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2">
                        {safeTitle(s.taxes, 'Taxes')}
                      </span>
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

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-[#FFF7ED] border border-[#C2410C]/20 px-4 py-3 text-[14px] text-[#C2410C] font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* ── Redirect step: CamerPay tab opened ── */}
              {step === 'redirect' && (
                <div className="rounded-xl border border-[#DDDDDD] bg-[#F7F7F7] p-5 space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                      <Smartphone className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-[15px] font-semibold text-[#222222]">
                    {safeTitle(s.checkoutOpened, 'Payment page opened')}
                  </p>
                  <p className="text-[13px] text-[#717171]">
                    {safeTitle(
                      s.checkoutInstructions,
                      'Complete your Mobile Money payment on the CamerPay page that just opened, then come back and tap "I\'ve paid".',
                    )}
                  </p>
                  {/* ✅ Re-open button in case the tab was closed */}
                  {checkoutUrl && (
                    <button
                      onClick={handleReopenCheckout}
                      className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {safeTitle(s.reopenCheckout, 'Re-open payment page')}
                    </button>
                  )}
                </div>
              )}

              {/* ── Verifying: polling progress ── */}
              {step === 'verifying' && (
                <div className="space-y-3 bg-[#F7F7F7] p-6 rounded-xl border border-[#DDDDDD] text-center">
                  <p className="text-[15px] font-medium text-[#222222]">
                    {safeTitle(s.confirming, 'Confirming your payment...')}
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBEBEB]">
                    <div
                      className="h-full rounded-full bg-[#222222] transition-all duration-500"
                      style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 92)}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-[#717171]">
                    {safeTitle(s.dontClose, "Please don't close this window")}
                  </p>
                  <button
                    onClick={handleBackToRedirect}
                    className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors"
                  >
                    {safeTitle(s.notPaidYet, "Haven't paid yet? Go back")}
                  </button>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="pt-2 space-y-3">
                {(step === 'confirm' || step === 'loading') && (
                  <button
                    className={cn(
                      'w-full h-14 rounded-xl font-semibold text-[16px] flex items-center justify-center transition-all active:scale-[0.98]',
                      step === 'loading'
                        ? 'bg-blue-500 text-white cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700 text-white',
                    )}
                    onClick={handleInitiate}
                    disabled={step === 'loading'}
                  >
                    {step === 'loading' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        {safeTitle(s.preparingPayment, 'Preparing payment...')}
                      </>
                    ) : (
                      safeTitle(s.proceedToPayment, 'Confirm and pay')
                    )}
                  </button>
                )}

                {step === 'redirect' && (
                  <button
                    className="w-full h-14 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold text-[16px] flex items-center justify-center transition-all active:scale-[0.98]"
                    onClick={handleCheckPayment}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    {safeTitle(s.iveAlreadyPaid, "I've paid")}
                  </button>
                )}

                {step === 'verifying' && (
                  <button
                    className="w-full h-14 rounded-xl bg-[#DDDDDD] text-[#717171] font-semibold text-[16px] flex items-center justify-center cursor-not-allowed"
                    disabled
                  >
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {safeTitle(s.confirmingPayment, 'Verifying...')}
                  </button>
                )}

                <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-[#717171] pt-1">
                  <ShieldCheck className="h-4 w-4" />
                  {safeTitle(s.securedBy, 'Payments securely processed by CamerPay')}
                </div>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}