// components/payment/PaymentModal.tsx

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CreditCard, 
  Smartphone, 
  Building, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Shield, 
  Award 
} from 'lucide-react';
import { PaymentMethod, Currency } from '@/types/paiement';

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
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.CARD);
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
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

    onPaymentSubmit(paymentMethod, email, phone || undefined);
  };

  const paymentMethods = [
    {
      value: PaymentMethod.CARD,
      label: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard accepted',
      processingTime: 'Instant',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
    },
    {
      value: PaymentMethod.MTN_MOMO,
      label: 'MTN Mobile Money',
      icon: Smartphone,
      description: 'Pay with MTN MoMo',
      processingTime: '2-5 minutes',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      badge: 'MTN',
      badgeColor: 'bg-yellow-400',
    },
    {
      value: PaymentMethod.ORANGE_MONEY,
      label: 'Orange Money',
      icon: Smartphone,
      description: 'Pay with Orange Money',
      processingTime: '2-5 minutes',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-700',
      badge: 'Orange',
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      value: PaymentMethod.BANK_TRANSFER,
      label: 'Bank Transfer',
      icon: Building,
      description: 'Direct bank transfer',
      processingTime: '1-3 business days',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-700',
    },
  ];

  const selectedMethod = paymentMethods.find(m => m.value === paymentMethod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Lock className="h-5 w-5 text-green-700" />
            </div>
            <span>Secure Payment</span>
          </DialogTitle>
          <DialogDescription>
            {description || 'Complete your payment securely. All transactions are encrypted.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Amount Display */}
          <div className="bg-indigo-600 p-6 rounded-xl border-2 border-indigo-700 text-white">
            <div className="text-center">
              <div className="text-sm font-medium mb-2 text-indigo-200">Total Amount</div>
              <div className="text-4xl font-bold">
                {currency} {amount.toLocaleString()}
              </div>
            </div>

            {/* Breakdown */}
            {breakdown && (
              <div className="mt-4 pt-4 border-t border-indigo-500 space-y-2 text-sm">
                <div className="flex justify-between text-indigo-100">
                  <span>Subtotal</span>
                  <span>{currency} {breakdown.subtotal.toLocaleString()}</span>
                </div>
                {breakdown.tax && (
                  <div className="flex justify-between text-indigo-100">
                    <span>Tax</span>
                    <span>{currency} {breakdown.tax.toLocaleString()}</span>
                  </div>
                )}
                {breakdown.fees && (
                  <div className="flex justify-between text-indigo-100">
                    <span>Processing Fee</span>
                    <span>{currency} {breakdown.fees.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 py-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-700">SSL Secure</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-700">Verified</span>
            </div>
          </div>

          {/* Promo Code */}
          {!showPromoCode ? (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm text-indigo-600 hover:text-indigo-700"
              onClick={() => setShowPromoCode(true)}
            >
              Have a promo code?
            </Button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="promo" className="text-gray-700">Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  id="promo"
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="border-gray-300"
                />
                <Button type="button" variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                  Apply
                </Button>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-gray-900 font-semibold">Select Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              {paymentMethods.map((method) => (
                <div 
                  key={method.value} 
                  className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    paymentMethod === method.value 
                      ? `${method.borderColor} ${method.bgColor} shadow-md` 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                  <Label htmlFor={method.value} className="flex items-start space-x-3 flex-1 cursor-pointer">
                    <div className={`p-2.5 rounded-lg ${
                      paymentMethod === method.value 
                        ? `${method.bgColor}` 
                        : 'bg-gray-100'
                    }`}>
                      <method.icon className={`h-5 w-5 ${
                        paymentMethod === method.value 
                          ? method.textColor 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{method.label}</span>
                        {method.badge && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${method.badgeColor}`}>
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium">Processing: {method.processingTime}</span>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Card Logos */}
          {paymentMethod === PaymentMethod.CARD && (
            <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">We Accept:</span>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-white rounded border border-blue-200">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="px-3 py-1.5 bg-white rounded border border-blue-200">
                  <span className="text-sm font-bold text-blue-600">VISA</span>
                </div>
                <div className="px-3 py-1.5 bg-white rounded border border-blue-200">
                  <span className="text-sm font-bold text-red-600">MC</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Instructions */}
          {selectedMethod && (
            <Alert className={`${selectedMethod.bgColor} border-2 ${selectedMethod.borderColor}`}>
              <AlertDescription className={`text-sm ${selectedMethod.textColor} font-medium`}>
                {paymentMethod === PaymentMethod.CARD && 
                  'You will be redirected to our secure payment gateway to enter your card details.'}
                {(paymentMethod === PaymentMethod.MTN_MOMO || paymentMethod === PaymentMethod.ORANGE_MONEY) && 
                  'A payment request will be sent to your phone. Please approve it to complete the transaction.'}
                {paymentMethod === PaymentMethod.BANK_TRANSFER && 
                  'Bank transfer details will be provided after confirmation. Payment typically takes 1-3 business days.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                className={validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600 font-medium">{validationErrors.email}</p>
              )}
            </div>

            {isMobileMoney(paymentMethod) && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) {
                      setValidationErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  className={validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600 font-medium">{validationErrors.phone}</p>
                )}
                <p className="text-xs text-gray-500">
                  Enter the {paymentMethod === PaymentMethod.MTN_MOMO ? 'MTN' : 'Orange'} Mobile Money number for this payment
                </p>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-method"
                checked={savePaymentMethod}
                onCheckedChange={(checked) => setSavePaymentMethod(checked as boolean)}
                className="border-gray-400"
              />
              <Label htmlFor="save-method" className="text-sm font-normal cursor-pointer text-gray-700">
                Save this payment method for future purchases
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  setAcceptTerms(checked as boolean);
                  if (validationErrors.terms) {
                    setValidationErrors(prev => ({ ...prev, terms: '' }));
                  }
                }}
                className={validationErrors.terms ? 'border-red-500' : 'border-gray-400'}
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed text-gray-700">
                I accept the <a href="#" className="text-indigo-600 hover:underline font-medium">terms and conditions</a> and <a href="#" className="text-indigo-600 hover:underline font-medium">refund policy</a>
              </Label>
            </div>
            {validationErrors.terms && (
              <p className="text-sm text-red-600 ml-6 font-medium">{validationErrors.terms}</p>
            )}
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-300">
            <div className="p-2 bg-green-100 rounded-lg">
              <Lock className="h-6 w-6 text-green-700" />
            </div>
            <div className="text-sm">
              <div className="font-bold text-green-900">256-bit SSL Encrypted</div>
              <div className="text-green-700">Your payment information is secure</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Processing...' : `Pay ${currency} ${amount.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}