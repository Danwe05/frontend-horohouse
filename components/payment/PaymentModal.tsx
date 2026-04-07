'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  CreditCard,
  Smartphone,
  Building,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ChevronLeft,
  X
} from 'lucide-react';
import { PaymentMethod, Currency } from '@/types/paiement';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency: Currency;
  description?: string;
  breakdown?: {
    subtotal: number;
    tax?: number;
    fees?: number;
  };
  onPaymentSubmit: (paymentMethod: PaymentMethod, email?: string, phone?: string) => void;
  loading?: boolean;
  error?: string;
  savedPhone?: string;
  savedProvider?: 'MTN' | 'ORANGE';
}

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  currency,
  description,
  breakdown,
  onPaymentSubmit,
  loading = false,
  error,
  savedPhone,
  savedProvider,
}: PaymentModalProps) {
  const savedPaymentMethod: PaymentMethod | null = savedProvider === 'MTN'
    ? PaymentMethod.MTN_MOMO
    : savedProvider === 'ORANGE'
      ? PaymentMethod.ORANGE_MONEY
      : null;

  const [usingSaved, setUsingSaved] = React.useState(!!savedPaymentMethod);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    savedPaymentMethod ?? PaymentMethod.CARD
  );
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState(savedPhone ?? '');
  const [promoCode, setPromoCode] = React.useState('');
  const [savePaymentMethod, setSavePaymentMethod] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [showPromoCode, setShowPromoCode] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+237|237)?[6][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isMobileMoney = (method: PaymentMethod) => {
    return method === PaymentMethod.ORANGE_MONEY || method === PaymentMethod.MTN_MOMO;
  };

  const handleValidation = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (isMobileMoney(paymentMethod)) {
      if (!phone) {
        errors.phone = 'Phone number is required for mobile money';
      } else if (!validatePhone(phone)) {
        errors.phone = 'Please enter a valid Cameroon phone number';
      }
    }

    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!handleValidation()) {
      return;
    }
    const effectivePhone = usingSaved ? (savedPhone ?? phone) : phone;
    onPaymentSubmit(paymentMethod, email, effectivePhone || undefined);
  };

  const paymentMethods = [
    {
      value: PaymentMethod.MTN_MOMO,
      label: 'MTN MoMo',
      icon: Smartphone,
      description: 'Pay instantly via MTN',
      brandColor: 'bg-[#FFCC00]',
    },
    {
      value: PaymentMethod.ORANGE_MONEY,
      label: 'Orange Money',
      icon: Smartphone,
      description: 'Pay instantly via Orange',
      brandColor: 'bg-[#FF6600]',
    },
    {
      value: PaymentMethod.CARD,
      label: 'Credit or debit card',
      icon: CreditCard,
      description: 'Visa or Mastercard',
      brandColor: 'bg-[#222222]',
    },
    {
      value: PaymentMethod.BANK_TRANSFER,
      label: 'Bank Transfer',
      icon: Building,
      description: '1-3 business days',
      brandColor: 'bg-[#717171]',
    },
  ];

  // Airbnb specific input styling
  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-white border-0 sm:rounded-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB] sticky top-0 bg-white z-10">
          <button 
            onClick={() => onOpenChange(false)} 
            className="w-8 h-8 -ml-2 rounded-full flex items-center justify-center hover:bg-[#F7F7F7] transition-colors focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5 text-[#222222] stroke-[2]" />
          </button>
          <h2 className="text-[16px] font-bold text-[#222222]">Confirm and pay</h2>
          <div className="w-8 h-8" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar flex-1">

          {/* Price Breakdown */}
          <section>
            <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Price details</h3>
            <div className="space-y-4 pb-6 border-b border-[#EBEBEB]">
              {breakdown ? (
                <>
                  <div className="flex justify-between text-[16px] text-[#222222]">
                    <span>Subtotal</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(breakdown.subtotal)}</span>
                  </div>
                  {breakdown.tax !== undefined && (
                    <div className="flex justify-between text-[16px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2 hover:text-[#717171] cursor-pointer transition-colors">Taxes</span>
                      <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(breakdown.tax)}</span>
                    </div>
                  )}
                  {breakdown.fees !== undefined && (
                    <div className="flex justify-between text-[16px] text-[#222222]">
                      <span className="underline decoration-1 underline-offset-2 hover:text-[#717171] cursor-pointer transition-colors">Service fee</span>
                      <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(breakdown.fees)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-[16px] text-[#222222]">
                  <span>Total payment</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-6 text-[16px] font-bold text-[#222222]">
              <span>Total ({currency})</span>
              <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}</span>
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[22px] font-semibold text-[#222222]">Pay with</h3>
              {/* Decorative credit card icons typical of Airbnb */}
              <div className="flex gap-1">
                <div className="w-8 h-5 bg-[#F7F7F7] border border-[#DDDDDD] rounded flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-[#222222]" />
                </div>
              </div>
            </div>

            {/* Saved Payment Quick-Select */}
            {savedPaymentMethod && (
              <div
                onClick={() => {
                  setUsingSaved(true);
                  setPaymentMethod(savedPaymentMethod);
                  setPhone(savedPhone ?? '');
                }}
                className={cn(
                  "p-4 rounded-xl border mb-6 cursor-pointer transition-all flex items-center justify-between group",
                  usingSaved 
                    ? "border-[#222222] bg-[#F7F7F7]" 
                    : "border-[#DDDDDD] bg-white hover:border-[#222222]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-[10px] flex items-center justify-center text-white border border-black/10", 
                    savedProvider === 'MTN' ? "bg-[#FFCC00]" : "bg-[#FF6600]"
                  )}>
                    <Smartphone className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#222222]">{savedProvider === 'MTN' ? 'MTN MoMo' : 'Orange Money'}</p>
                    <p className="text-[14px] text-[#717171]">{savedPhone} • Saved</p>
                  </div>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-[2px] flex items-center justify-center transition-colors", 
                  usingSaved ? "border-[#222222] bg-[#222222]" : "border-[#DDDDDD] group-hover:border-[#717171]"
                )}>
                  {usingSaved && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            )}

            {/* Methods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.value}
                  onClick={() => {
                    setPaymentMethod(method.value);
                    setUsingSaved(false);
                    if (method.value !== PaymentMethod.MTN_MOMO && method.value !== PaymentMethod.ORANGE_MONEY) setPhone('');
                  }}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-3 group",
                    paymentMethod === method.value && !usingSaved
                      ? "border-[#222222] bg-[#F7F7F7] shadow-[0_0_0_1px_#222222]"
                      : "border-[#DDDDDD] bg-white hover:border-[#222222]"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white border border-black/10",
                      method.brandColor
                    )}>
                      <method.icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-[2px] flex items-center justify-center transition-colors", 
                      paymentMethod === method.value && !usingSaved ? "border-[#222222] bg-[#222222]" : "border-[#DDDDDD] group-hover:border-[#717171]"
                    )}>
                      {paymentMethod === method.value && !usingSaved && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-[15px] font-semibold text-[#222222]">{method.label}</p>
                    <p className="text-[13px] text-[#717171] mt-0.5">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* User Details */}
          <section className="space-y-4 pt-8 border-t border-[#EBEBEB]">
            <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Billing details</h3>

            <div>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: '' }));
                }}
                className={cn(inputClasses, validationErrors.email && "border-[#C2293F] bg-[#FFF8F6] focus-visible:ring-[#C2293F]")}
              />
              {validationErrors.email && (
                <p className="text-[12px] font-medium text-[#C2293F] mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />{validationErrors.email}
                </p>
              )}
            </div>

            {isMobileMoney(paymentMethod) && !usingSaved && (
              <div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone number (+237...)"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  className={cn(inputClasses, validationErrors.phone && "border-[#C2293F] bg-[#FFF8F6] focus-visible:ring-[#C2293F]")}
                />
                {validationErrors.phone && (
                  <p className="text-[12px] font-medium text-[#C2293F] mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />{validationErrors.phone}
                  </p>
                )}
              </div>
            )}

            {isMobileMoney(paymentMethod) && !usingSaved && (
              <div className="flex items-start space-x-3 pt-3">
                <Checkbox
                  id="save-method"
                  checked={savePaymentMethod}
                  onCheckedChange={(checked) => setSavePaymentMethod(checked as boolean)}
                  className="w-5 h-5 border-[#B0B0B0] text-[#222222] data-[state=checked]:bg-[#222222] data-[state=checked]:border-[#222222] rounded shadow-none mt-0.5"
                />
                <Label htmlFor="save-method" className="text-[15px] font-normal cursor-pointer text-[#222222] leading-relaxed">
                  Save this number for future payments
                </Label>
              </div>
            )}
          </section>

          {/* Promo Code */}
          <section className="pt-8 border-t border-[#EBEBEB]">
            {!showPromoCode ? (
              <button
                type="button"
                onClick={() => setShowPromoCode(true)}
                className="text-[16px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
              >
                Enter a coupon
              </button>
            ) : (
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Coupon code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="h-14 rounded-xl border-[#B0B0B0] focus-visible:ring-2 focus-visible:ring-[#222222] text-[16px] placeholder:text-[#717171]"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-14 px-8 rounded-xl border-[#222222] text-[#222222] font-semibold hover:bg-[#F7F7F7] transition-colors"
                >
                  Apply
                </Button>
              </div>
            )}
          </section>

          {/* Terms & Error */}
          <section className="pt-8 border-t border-[#EBEBEB] space-y-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  setAcceptTerms(checked as boolean);
                  if (validationErrors.terms) setValidationErrors(prev => ({ ...prev, terms: '' }));
                }}
                className={cn("w-5 h-5 border-[#B0B0B0] text-[#222222] data-[state=checked]:bg-[#222222] data-[state=checked]:border-[#222222] rounded shadow-none mt-0.5", validationErrors.terms && "border-[#C2293F]")}
              />
              <Label htmlFor="terms" className="text-[13px] font-normal cursor-pointer leading-relaxed text-[#717171]">
                By selecting the button below, I agree to the <span className="font-semibold text-[#222222] underline hover:text-[#717171]">Terms of Service</span>, <span className="font-semibold text-[#222222] underline hover:text-[#717171]">Payments Terms of Service</span>, and I acknowledge the <span className="font-semibold text-[#222222] underline hover:text-[#717171]">Privacy Policy</span>.
              </Label>
            </div>
            {validationErrors.terms && <p className="text-[12px] font-medium text-[#C2293F] ml-8">{validationErrors.terms}</p>}

            {error && (
              <div className="flex items-start gap-2 p-4 rounded-xl bg-[#FFF8F6] border border-[#C2293F]/20 text-[#C2293F]">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-[14px] font-medium leading-relaxed">{error}</span>
              </div>
            )}
          </section>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-[#EBEBEB] bg-white sticky bottom-0 z-10">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {loading ? 'Processing...' : `Confirm and pay`}
          </Button>

          <div className="flex justify-center items-center gap-2 mt-5 text-[#717171]">
            <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
            <span className="text-[13px] font-medium">Payments are securely encrypted</span>
          </div>
        </div>

      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDDDDD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B0B0B0;
        }
      `}</style>
    </Dialog>
  );
}