// components/wallet/WalletWidget.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  WalletIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  TrendingUpIcon,
  DownloadIcon,
  PlusIcon 
} from 'lucide-react';
import { Wallet, WalletStats, Currency } from '@/types/paiement';
import { useLanguage } from '@/contexts/LanguageContext';

interface WalletWidgetProps {
  wallet: Wallet;
  stats: WalletStats;
  onWithdraw: () => void;
  onDeposit: () => void;
  onViewTransactions: () => void;
  className?: string;
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({
  wallet,
  stats,
  onWithdraw,
  onDeposit,
  onViewTransactions,
  className,
}) => {
  const { t } = useLanguage();
  const s = (t as any)?.wallet || {};

  const formatCurrency = (amount: number, currency: Currency) => {
  // Handle cases where currency might be undefined, null, or invalid
  if (!currency || typeof currency !== 'string') {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    console.warn(`Invalid currency code: ${currency}`);
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
};

  const getGrowthPercentage = () => {
  // Guard against null/undefined stats
  if (!stats || stats.lastMonthEarnings === null || stats.lastMonthEarnings === undefined) {
    return 0;
  }
  
  if (stats.lastMonthEarnings === 0) return 100;
  return ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings) * 100;
};

const growthPercentage = getGrowthPercentage();
const isPositiveGrowth = growthPercentage >= 0;

// Also add safe accessors for displaying stats
const thisMonthEarnings = stats?.thisMonthEarnings ?? 0;
const totalEarnings = stats?.totalEarnings ?? 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Wallet Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(wallet.balance, wallet.currency)}
            </CardTitle>
            <CardDescription>{s?.availableBalance || "Available Balance"}</CardDescription>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <WalletIcon className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" onClick={onDeposit} className="flex-1">
              <PlusIcon className="h-4 w-4 mr-2" />
              {s?.deposit || "Deposit"}
            </Button>
            <Button size="sm" variant="outline" onClick={onWithdraw} className="flex-1">
              <DownloadIcon className="h-4 w-4 mr-2" />
              {s?.withdraw || "Withdraw"}
            </Button>
          </div>
        </CardContent>
      </Card>

     {/* Stats Cards */}
<div className="grid grid-cols-2 gap-4">
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{s?.thisMonth || "This Month"}</p>
          <p className="text-xl font-bold">{formatCurrency(thisMonthEarnings, wallet.currency)}</p>
        </div>
        {stats && (
          <Badge variant={isPositiveGrowth ? "default" : "destructive"} className="gap-1">
            {isPositiveGrowth ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
            {Math.abs(growthPercentage).toFixed(1)}%
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{s?.totalEarnings || "Total Earnings"}</p>
        <p className="text-xl font-bold">{formatCurrency(totalEarnings, wallet.currency)}</p>
      </div>
    </CardContent>
  </Card>
</div>
      {/* Withdrawal Progress */}
{wallet.autoWithdraw?.enabled && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">{s?.autoWithdrawal || "Auto-Withdrawal"}</CardTitle>
      <CardDescription>
        {s?.autoWithdrawWhenBalanceReaches || "Auto-withdraw when balance reaches"} {formatCurrency(wallet.autoWithdraw.threshold, wallet.currency)}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Progress 
        value={(wallet.balance / wallet.autoWithdraw.threshold) * 100} 
        className="h-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{s?.current || "Current:"} {formatCurrency(wallet.balance, wallet.currency)}</span>
        <span>{s?.target || "Target:"} {formatCurrency(wallet.autoWithdraw.threshold, wallet.currency)}</span>
      </div>
    </CardContent>
  </Card>
)}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{s?.quickActions || "Quick Actions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={onViewTransactions}>
              <TrendingUpIcon className="h-4 w-4 mr-2" />
              {s?.viewTransactions || "View Transactions"}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DownloadIcon className="h-4 w-4 mr-2" />
              {s?.downloadStatement || "Download Statement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
{(wallet.bankAccount || wallet.mobileMoneyAccount) && (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium">{s?.linkedAccounts || "Linked Accounts"}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {wallet.bankAccount && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">{wallet.bankAccount.bankName}</p>
            <p className="text-xs text-muted-foreground">
              ****{wallet.bankAccount.accountNumber?.slice(-4) ?? '****'}
            </p>
          </div>
          <Badge variant="outline">{s?.bank || "Bank"}</Badge>
        </div>
      )}
      {wallet.mobileMoneyAccount && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">{wallet.mobileMoneyAccount.provider}</p>
            <p className="text-xs text-muted-foreground">
              {wallet.mobileMoneyAccount.phoneNumber}
            </p>
          </div>
          <Badge variant="outline">{s?.mobile || "Mobile"}</Badge>
        </div>
      )}
    </CardContent>
  </Card>
)}
    </div>
  );
};