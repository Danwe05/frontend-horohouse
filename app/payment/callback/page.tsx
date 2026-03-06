'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  Home,
  FileText,
  AlertCircle
} from 'lucide-react';
import { paiementApi } from '@/lib/paiementApi';
import { TransactionStatus, TransactionType } from '@/types/paiement';

interface PaymentResult {
  status: 'success' | 'failed' | 'cancelled' | 'pending';
  transaction?: any;
  message?: string;
}

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [countdown, setCountdown] = useState(5);

  // ✅ FIX: Extract correct parameters from URL
  const status = searchParams.get('status');
  const txRef = searchParams.get('tx_ref'); // Your internal reference: HH-SUB-xxx
  const flutterwaveTransactionId = searchParams.get('transaction_id'); // Flutterwave's ID: 9826604

  useEffect(() => {
    verifyPayment();
  }, []);

  // Auto redirect countdown
  useEffect(() => {
    if (result && result.status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (result && result.status === 'success' && countdown === 0) {
      handleRedirect();
    }
  }, [result, countdown]);

  const verifyPayment = async () => {
    setLoading(true);
    
    try {
      console.log('Callback URL params:', { status, txRef, flutterwaveTransactionId });

      // First check the status from URL
      if (status === 'cancelled') {
        setResult({
          status: 'cancelled',
          message: 'Payment was cancelled. You can try again when ready.'
        });
        setLoading(false);
        return;
      }

      // ✅ FIX: We need to find our internal transaction ID using tx_ref
      if (!txRef) {
        setResult({
          status: 'failed',
          message: 'Missing transaction reference. Please contact support.'
        });
        setLoading(false);
        return;
      }

      // ✅ FIX: Look up transaction by tx_ref directly
      console.log('Looking up transaction by reference:', txRef);
      let transaction;
      try {
        transaction = await paiementApi.getTransactionByReference(txRef);
      } catch (error: any) {
        console.error('Transaction lookup failed:', error);
        setResult({
          status: 'failed',
          message: 'Transaction not found. Please contact support with reference: ' + txRef
        });
        setLoading(false);
        return;
      }

      console.log('Found transaction:', transaction._id);

      // If already successful, show success
      if (transaction.status === TransactionStatus.SUCCESS) {
        setResult({
          status: 'success',
          transaction,
          message: 'Payment completed successfully!'
        });
        setLoading(false);
        return;
      }

      // ✅ FIX: Now verify with the correct internal transaction ID
      console.log('Verifying payment with transaction ID:', transaction._id);
      const response = await paiementApi.verifyPayment({
        transactionId: transaction._id,
        flutterwaveReference: flutterwaveTransactionId || undefined
      });

      console.log('Verification response:', response);

      // Check transaction status
      if (response.status === TransactionStatus.SUCCESS) {
        setResult({
          status: 'success',
          transaction: response,
          message: 'Payment completed successfully!'
        });

        // If it's a subscription, activate it
        if (response.type === TransactionType.SUBSCRIPTION) {
          try {
            console.log('Activating subscription for transaction:', response._id);
            await paiementApi.activateSubscription(response._id);
          } catch (error) {
            console.error('Failed to activate subscription:', error);
          }
        }
      } else if (response.status === TransactionStatus.FAILED) {
        setResult({
          status: 'failed',
          transaction: response,
          message: response.failureReason || 'Payment failed. Please try again.'
        });
      } else if (response.status === TransactionStatus.PENDING) {
        setResult({
          status: 'pending',
          transaction: response,
          message: 'Payment is being processed. This may take a few minutes.'
        });
      } else {
        setResult({
          status: 'failed',
          transaction: response,
          message: 'Payment status unknown. Please contact support.'
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setResult({
        status: 'failed',
        message: error.response?.data?.message || 'Failed to verify payment. Please contact support with reference: ' + txRef
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    if (!result?.transaction) {
      router.push('/dashboard');
      return;
    }

    // Redirect based on transaction type
    switch (result.transaction.type) {
      case TransactionType.SUBSCRIPTION:
        router.push('/dashboard/subscriptions');
        break;
      case TransactionType.BOOST:
        router.push('/dashboard/boosts');
        break;
      case TransactionType.LISTING_FEE:
        router.push('/dashboard/properties');
        break;
      default:
        router.push('/dashboard/transactions');
    }
  };

  const getRedirectText = () => {
    if (!result?.transaction) return 'Dashboard';

    switch (result.transaction.type) {
      case TransactionType.SUBSCRIPTION:
        return 'Subscriptions';
      case TransactionType.BOOST:
        return 'Boosts';
      case TransactionType.LISTING_FEE:
        return 'Properties';
      default:
        return 'Transactions';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          {result?.status === 'success' && (
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
          )}
          
          {result?.status === 'failed' && (
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
          )}

          {result?.status === 'pending' && (
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <AlertCircle className="h-16 w-16 text-yellow-600" />
              </div>
            </div>
          )}

          {result?.status === 'cancelled' && (
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-gray-100 p-3">
                <XCircle className="h-16 w-16 text-gray-600" />
              </div>
            </div>
          )}

          <CardTitle className="text-3xl font-bold">
            {result?.status === 'success' && 'Payment Successful!'}
            {result?.status === 'failed' && 'Payment Failed'}
            {result?.status === 'pending' && 'Payment Pending'}
            {result?.status === 'cancelled' && 'Payment Cancelled'}
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            {result?.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Transaction Details */}
          {result?.transaction && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                Transaction Details
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono font-medium">{result.transaction._id?.slice(-8)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono font-medium">{txRef}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-lg">
                    {result.transaction.amount.toLocaleString()} {result.transaction.currency}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">
                    {result.transaction.type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium capitalize">
                    {result.transaction.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-semibold capitalize ${
                    result.transaction.status === 'success' ? 'text-green-600' :
                    result.transaction.status === 'failed' ? 'text-red-600' :
                    result.transaction.status === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {result.transaction.status}
                  </span>
                </div>

                {result.transaction.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="font-medium text-right max-w-xs">
                      {result.transaction.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message & Auto-redirect */}
          {result?.status === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">What's Next?</AlertTitle>
              <AlertDescription className="text-green-800">
                Your payment has been confirmed. 
                {result.transaction?.type === TransactionType.SUBSCRIPTION && 
                  ' Your subscription has been activated and you can now enjoy all premium features.'}
                {result.transaction?.type === TransactionType.BOOST && 
                  ' Your listing boost is now active and will increase your property visibility.'}
                {' '}
                Redirecting to your {getRedirectText()} in {countdown} seconds...
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Message */}
          {result?.status === 'failed' && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Payment Failed</AlertTitle>
              <AlertDescription className="text-red-800">
                {result.message || 'Your payment could not be processed. Please try again or contact support if the issue persists.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Message */}
          {result?.status === 'pending' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Payment Processing</AlertTitle>
              <AlertDescription className="text-yellow-800">
                Your payment is being processed. This usually takes a few minutes. 
                You will receive a notification once the payment is confirmed.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {result?.status === 'success' && (
              <>
                <Button 
                  onClick={handleRedirect} 
                  className="flex-1"
                  size="lg"
                >
                  Go to {getRedirectText()}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/transactions')} 
                  variant="outline"
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Transaction
                </Button>
              </>
            )}

            {(result?.status === 'failed' || result?.status === 'cancelled') && (
              <>
                <Button 
                  onClick={() => router.back()} 
                  className="flex-1"
                  size="lg"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')} 
                  variant="outline"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </>
            )}

            {result?.status === 'pending' && (
              <>
                <Button 
                  onClick={verifyPayment}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <Loader2 className="mr-2 h-4 w-4" />
                  Check Status
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/transactions')} 
                  variant="outline"
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Transactions
                </Button>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground pt-4">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@horohouse.com" className="text-blue-600 hover:underline">
              support@horohouse.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}