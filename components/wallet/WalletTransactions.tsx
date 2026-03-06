// components/wallet/WalletTransactions.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon, ArrowDownIcon, RefreshCwIcon } from 'lucide-react';
import { WalletTransaction, WalletTransactionType, Currency } from '@/types/paiement';

interface WalletTransactionsProps {
  transactions: WalletTransaction[];
  currency: Currency;
  onRefresh?: () => void;
  loading?: boolean;
}

export const WalletTransactions: React.FC<WalletTransactionsProps> = ({
  transactions,
  currency,
  onRefresh,
  loading = false,
}) => {
  const getTransactionIcon = (type: WalletTransactionType) => {
    switch (type) {
      case WalletTransactionType.CREDIT:
      case WalletTransactionType.REFUND:
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
      case WalletTransactionType.DEBIT:
      case WalletTransactionType.WITHDRAWAL:
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: WalletTransactionType) => {
    switch (type) {
      case WalletTransactionType.CREDIT:
      case WalletTransactionType.REFUND:
        return 'text-green-600';
      case WalletTransactionType.DEBIT:
      case WalletTransactionType.WITHDRAWAL:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionBadge = (type: WalletTransactionType) => {
    switch (type) {
      case WalletTransactionType.CREDIT:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Credit</Badge>;
      case WalletTransactionType.DEBIT:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Debit</Badge>;
      case WalletTransactionType.WITHDRAWAL:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Withdrawal</Badge>;
      case WalletTransactionType.REFUND:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Refund</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your wallet activity</CardDescription>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            transactions.slice(0, 10).map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === WalletTransactionType.CREDIT || 
                     transaction.type === WalletTransactionType.REFUND ? '+' : '-'}
                    {currency} {Math.abs(transaction.amount).toLocaleString()}
                  </span>
                  {getTransactionBadge(transaction.type)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};