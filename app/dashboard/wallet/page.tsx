// app/wallet/page.tsx
'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/usePayment';
import { WalletWidget } from '@/components/wallet/WalletWidget';
import { WalletTransactions } from '@/components/wallet/WalletTransactions';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  PlusIcon, 
  DownloadIcon, 
  TrendingUpIcon,
  CreditCardIcon 
} from 'lucide-react';
import { PaymentMethod } from '@/types/paiement';

export default function WalletPage() {
  const {
    loading,
    error,
    wallet,
    transactions = [],
    stats,
    fetchWallet,
    fetchTransactions,
    requestWithdrawal,
    updateBankAccount,
    updateMobileMoneyAccount
  } = useWallet();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleDeposit = (paymentMethod: PaymentMethod, email?: string, phone?: string) => {
    // In a real app, you would integrate with payment processor
    console.log('Deposit initiated:', { paymentMethod, email, phone });
    setPaymentModalOpen(false);
  };

  const handleWithdraw = async () => {
    if (!wallet) return;

    // Simple withdrawal implementation
    try {
      await requestWithdrawal({
        amount: wallet.balance,
        withdrawalMethod: PaymentMethod.BANK_TRANSFER,
        accountNumber: wallet.bankAccount?.accountNumber || '',
        accountName: wallet.bankAccount?.accountName,
        bankCode: wallet.bankAccount?.bankCode,
      });
      fetchWallet();
      fetchTransactions();
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  const handleRefresh = () => {
    fetchWallet();
    fetchTransactions();
  };

  if (loading && !wallet) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card>
          <CardContent className="p-8">
            <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Wallet Not Available</h3>
            <p className="text-muted-foreground">
              Unable to load wallet information. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your funds, withdrawals, and payment methods
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPaymentModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button variant="outline" onClick={handleWithdraw}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Widget */}
            <div className="lg:col-span-2">
              <WalletWidget
                wallet={wallet}
                stats={stats!}
                onWithdraw={handleWithdraw}
                onDeposit={() => setPaymentModalOpen(true)}
                onViewTransactions={() => setActiveTab('transactions')}
              />
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Earnings Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-medium">
                      {wallet.currency} {stats?.thisMonthEarnings?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Month</span>
                    <span className="font-medium">
                      {wallet.currency} {stats?.lastMonthEarnings?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Withdrawals</span>
                    <span className="font-medium">
                      {wallet.currency} {stats?.totalWithdrawals?.toLocaleString() || '0'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{wallet.currency} {transaction.amount}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <WalletTransactions
            transactions={transactions}
            currency={wallet.currency}
            onRefresh={handleRefresh}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Account</CardTitle>
                <CardDescription>
                  Update your bank account for withdrawals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {wallet.bankAccount ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Bank Name:</span>
                      <span className="font-medium">{wallet.bankAccount.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Account Number:</span>
                      <span className="font-medium">
                        ****{wallet.bankAccount.accountNumber?.slice(-4) || '****'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Account Name:</span>
                      <span className="font-medium">{wallet.bankAccount.accountName}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bank account linked</p>
                )}
                <Button variant="outline" size="sm">
                  Update Bank Account
                </Button>
              </CardContent>
            </Card>

            {/* Mobile Money Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mobile Money</CardTitle>
                <CardDescription>
                  Update your mobile money account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {wallet.mobileMoneyAccount ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Provider:</span>
                      <span className="font-medium">{wallet.mobileMoneyAccount.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Phone Number:</span>
                      <span className="font-medium">{wallet.mobileMoneyAccount.phoneNumber}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No mobile money account linked</p>
                )}
                <Button variant="outline" size="sm">
                  Update Mobile Money
                </Button>
              </CardContent>
            </Card>

            {/* Auto-Withdrawal Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Auto-Withdrawal</CardTitle>
                <CardDescription>
                  Set up automatic withdrawals when your balance reaches a certain amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Withdrawal</p>
                    <p className="text-sm text-muted-foreground">
                      {wallet.autoWithdraw?.enabled 
                        ? `Enabled - Withdraw when balance reaches ${wallet.currency} ${wallet.autoWithdraw.threshold}`
                        : 'Disabled'
                      }
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {wallet.autoWithdraw?.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Deposit Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={0} // Amount would be set by user
        currency={wallet.currency}
        description="Add funds to your wallet"
        onPaymentSubmit={handleDeposit}
        loading={loading}
      />
    </div>
  );
}