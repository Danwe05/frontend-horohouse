'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSubscription } from '@/hooks/usePayment';
import { SubscriptionCards } from '@/components/subscription/SubscriptionCards';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { SubscriptionPlan, BillingCycle, PaymentMethod, Currency } from '@/types/paiement';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { cn } from '@/lib/utils';

export default function SubscriptionsPage() {
  const {
    loading,
    error,
    subscription,
    plans,
    usage,
    subscribe,
    fetchSubscription,
    fetchUsage,
    cancelSubscription,
  } = useSubscription();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);

  // Cancel confirmation inline state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Saved payment info from wallet (for pre-filling PaymentModal)
  const [savedPhone, setSavedPhone] = useState('');
  const [savedProvider, setSavedProvider] = useState<'MTN' | 'ORANGE' | null>(null);

  useEffect(() => {
    import('@/lib/api').then(({ apiClient }) => {
      apiClient.getWallet().then((w: any) => {
        const momo = w?.mobileMoneyAccount;
        if (momo?.phoneNumber) setSavedPhone(momo.phoneNumber);
        if (momo?.provider) setSavedProvider(momo.provider as 'MTN' | 'ORANGE');
      }).catch(() => { });
    });
  }, []);

  // --- Handlers ---
  const handleSelectPlan = (plan: SubscriptionPlan, billingCycle: BillingCycle) => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(billingCycle);
    setPaymentModalOpen(true);
  };

  const handleRenew = () => {
    if (!subscription) return;
    const currentPlan = plans.find(p => p.name === subscription.plan);
    if (currentPlan) {
      setSelectedPlan(currentPlan);
      setSelectedBillingCycle((subscription.billingCycle as BillingCycle) ?? BillingCycle.MONTHLY);
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentSubmit = async (paymentMethodOrObject: any) => {
    if (!selectedPlan) return;
    try {
      const paymentMethod =
        typeof paymentMethodOrObject === 'string'
          ? paymentMethodOrObject
          : paymentMethodOrObject?.paymentMethod || PaymentMethod.CARD;

      const response = await subscribe({
        planName: selectedPlan.name,
        billingCycle: selectedBillingCycle,
        paymentMethod,
      });

      setPaymentModalOpen(false);
      if (response?.paymentLink) window.location.href = response.paymentLink;
    } catch (err) {
      console.error('Subscription failed:', err);
    }
  };

  const handleCancelConfirmed = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelSubscription({ reason: cancelReason || 'User requested cancellation', feedback: '' });
      await fetchSubscription();
      setShowCancelConfirm(false);
      setCancelReason('');
    } catch (err: any) {
      setCancelError(err?.response?.data?.message ?? 'Cancellation failed. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // --- Helpers ---
  const remainingDays = useMemo(() => {
    if (!subscription?.endDate) return 0;
    const diff = new Date(subscription.endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription?.endDate]);

  const isExpired = useMemo(() => {
    if (!subscription?.endDate) return false;
    return new Date(subscription.endDate) < new Date();
  }, [subscription?.endDate]);

  const effectiveStatus = isExpired ? 'expired' : (subscription?.status ?? 'inactive');

  const currentPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    const pricingMap = {
      [BillingCycle.MONTHLY]: selectedPlan.pricing.monthly,
      [BillingCycle.QUARTERLY]: selectedPlan.pricing.quarterly || 0,
      [BillingCycle.YEARLY]: selectedPlan.pricing.yearly,
    };
    return pricingMap[selectedBillingCycle] || selectedPlan.pricing.monthly;
  }, [selectedPlan, selectedBillingCycle]);

  const isInitialLoading = loading && !subscription && plans.length === 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset className="bg-white">
          <NavDash />

          <main className="flex-1 p-6 md:p-10 bg-white">
            <div className="max-w-6xl mx-auto pb-12">

              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <h1 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-2">Subscription</h1>
                  <p className="text-[15px] text-[#717171]">Manage your billing, plans, and usage limits.</p>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="bg-[#FFF8F6] border border-[#C2293F]/20 text-[#C2293F] px-5 py-4 rounded-xl flex items-start gap-3 mb-8">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="font-medium text-[14px] leading-relaxed">{error}</p>
                </div>
              )}

              {/* KPI Section for Active Subscription */}
              {subscription && !isInitialLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <KPICard
                    title="Current Plan"
                    amount={subscription.plan}
                    subtext={subscription.billingCycle}
                    icon={Zap}
                  />
                  <KPICard
                    title="Days Remaining"
                    amount={remainingDays}
                    subtext="Days until renewal"
                    icon={CalendarIcon}
                    alert={isExpired}
                  />
                  <KPICard
                    title="Status"
                    amount={effectiveStatus}
                    subtext={subscription.autoRenew ? "Auto-renew ON" : "Auto-renew OFF"}
                    icon={CheckCircle2}
                    success={!isExpired && effectiveStatus === 'active'}
                    alert={isExpired}
                  />
                </div>
              )}

              <Tabs defaultValue="plans" className="w-full">
                <div className="flex mb-8 border-b border-[#EBEBEB]">
                  <TabsList className="bg-transparent h-auto p-0 flex gap-8">
                    <TabsTrigger 
                      value="plans" 
                      className="rounded-none border-b-[2.5px] border-transparent data-[state=active]:border-[#222222] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-[15px] font-semibold text-[#717171] data-[state=active]:text-[#222222] transition-colors focus-visible:outline-none"
                    >
                      Available plans
                    </TabsTrigger>
                    <TabsTrigger 
                      value="current" 
                      className="rounded-none border-b-[2.5px] border-transparent data-[state=active]:border-[#222222] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-[15px] font-semibold text-[#717171] data-[state=active]:text-[#222222] transition-colors focus-visible:outline-none"
                    >
                      My subscription
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* ── Plans Tab ── */}
                <TabsContent value="plans" className="space-y-6 focus-visible:outline-none mt-0">
                  {isInitialLoading ? (
                    <SubscriptionCardsSkeleton />
                  ) : (
                    <SubscriptionCards
                      plans={plans}
                      currentPlan={subscription?.plan}
                      onSelectPlan={handleSelectPlan}
                      loading={loading}
                    />
                  )}
                </TabsContent>

                {/* ── My Subscription Tab ── */}
                <TabsContent value="current" className="focus-visible:outline-none mt-0">
                  {isInitialLoading ? (
                    <CurrentSubscriptionSkeleton />
                  ) : subscription ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">

                      {/* Left: Plan Summary & Usage */}
                      <div className="lg:col-span-8 space-y-8">
                        <Card className="rounded-2xl border border-[#DDDDDD] bg-white shadow-none">
                          <CardHeader className="border-b border-[#EBEBEB] pb-5 pt-6 px-6 sm:px-8">
                            <CardTitle className="text-[18px] font-semibold text-[#222222]">
                              Billing overview
                            </CardTitle>
                          </CardHeader>

                          {/* Expired banner */}
                          {isExpired && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFF8F6] border-b border-[#EBEBEB] px-6 sm:px-8 py-4">
                              <div className="flex items-start sm:items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-[#C2293F] shrink-0 mt-0.5 sm:mt-0" />
                                <p className="text-[14px] font-medium text-[#C2293F]">
                                  Subscription expired on {new Date(subscription!.endDate).toLocaleDateString()}. Renew to restore access.
                                </p>
                              </div>
                              <Button 
                                onClick={handleRenew} 
                                className="bg-[#222222] hover:bg-black text-white font-semibold rounded-lg text-[14px] h-10 w-full sm:w-auto shrink-0 transition-colors"
                              >
                                Renew now
                              </Button>
                            </div>
                          )}

                          <CardContent className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                              <div className="flex justify-between items-center pb-4 border-b border-[#EBEBEB]">
                                <span className="text-[#717171] text-[15px]">Active plan</span>
                                <span className="font-semibold capitalize text-[#222222]">{subscription.plan}</span>
                              </div>
                              <div className="flex justify-between items-center pb-4 border-b border-[#EBEBEB]">
                                <span className="text-[#717171] text-[15px]">Billing cycle</span>
                                <span className="font-semibold text-[#222222] capitalize">{subscription.billingCycle}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[#717171] text-[15px]">Auto-renewal</span>
                                <span className="text-[14px] font-medium text-[#222222]">
                                  {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-5">
                              <div className="flex justify-between items-center pb-4 border-b border-[#EBEBEB]">
                                <span className="text-[#717171] text-[15px]">Next payment</span>
                                <span className="font-semibold text-[#222222]">{new Date(subscription!.endDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between items-center pb-4 border-b border-[#EBEBEB]">
                                <span className="text-[#717171] text-[15px]">{isExpired ? 'Expired' : 'Days remaining'}</span>
                                <span className={cn("font-semibold text-[15px]", isExpired ? 'text-[#C2293F]' : 'text-[#222222]')}>
                                  {isExpired ? 'Expired' : `${remainingDays} days`}
                                </span>
                              </div>
                              
                              <div className="flex justify-end pt-2">
                                {isExpired && !showCancelConfirm && (
                                  <Button onClick={handleRenew} className="bg-[#222222] hover:bg-black text-white font-semibold h-11 px-6 rounded-lg text-[15px] transition-colors">
                                    Renew subscription
                                  </Button>
                                )}
                                {!showCancelConfirm && !isExpired && (
                                  <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
                                  >
                                    Cancel subscription
                                  </button>
                                )}

                                {showCancelConfirm && (
                                  <div className="w-full space-y-4 pt-2">
                                    <p className="text-[15px] font-semibold text-[#222222]">Reason for cancelling (optional)</p>
                                    <input
                                      value={cancelReason}
                                      onChange={e => setCancelReason(e.target.value)}
                                      placeholder="Tell us why..."
                                      className="w-full h-12 border border-[#DDDDDD] rounded-lg px-4 text-[15px] focus:outline-none focus:border-[#222222] transition-colors placeholder:text-[#717171]"
                                    />
                                    {cancelError && <p className="text-[13px] text-[#C2293F]">{cancelError}</p>}
                                    <p className="text-[13px] text-[#717171]">You'll keep access until {new Date(subscription!.endDate).toLocaleDateString()}.</p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => { setShowCancelConfirm(false); setCancelError(null); }} 
                                        disabled={cancelling}
                                        className="flex-1 rounded-lg h-12 border-[#222222] text-[#222222] font-semibold hover:bg-[#F7F7F7] transition-colors"
                                      >
                                        Keep plan
                                      </Button>
                                      <Button 
                                        onClick={handleCancelConfirmed} 
                                        disabled={cancelling}
                                        className="flex-1 bg-[#C2293F] hover:bg-[#A31F33] text-white font-semibold h-12 rounded-lg transition-colors"
                                      >
                                        {cancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        {cancelling ? 'Cancelling...' : 'Confirm cancel'}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Usage Card */}
                        {usage && (
                          <Card className="rounded-2xl border border-[#DDDDDD] bg-white shadow-none">
                            <CardHeader className="border-b border-[#EBEBEB] pb-5 pt-6 px-6 sm:px-8">
                              <CardTitle className="text-[18px] font-semibold text-[#222222]">Resource usage</CardTitle>
                              <CardDescription className="text-[#717171] text-[15px] mt-1">Track your current consumption vs limits.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 sm:p-8 space-y-10">
                              <UsageItem
                                label="Property listings"
                                used={usage.usage.listings.used}
                                limit={usage.usage.listings.limit}
                              />
                              <UsageItem
                                label="Monthly boosts"
                                used={usage.usage.boosts.used}
                                limit={usage.usage.boosts.limit}
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Right: Features Sidebar */}
                      <div className="lg:col-span-4">
                        <Card className="rounded-2xl border border-[#EBEBEB] bg-[#F7F7F7] shadow-none h-fit sticky top-24">
                          <CardHeader className="pb-5 pt-6 px-6 border-b border-[#EBEBEB]">
                            <CardTitle className="text-[18px] font-semibold text-[#222222] flex items-center gap-2">
                              Plan features
                            </CardTitle>
                            <CardDescription className="text-[#717171] text-[14px] mt-1">
                              Included in your {subscription!.plan} plan.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-6">
                            <ul className="space-y-5">
                              {Object.entries(subscription!.features).map(([key, value]) => (
                                <li key={key} className="flex items-start gap-3">
                                  {value ? (
                                    <CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0 stroke-[2]" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-[#DDDDDD] shrink-0 stroke-[2]" />
                                  )}
                                  <div className="flex flex-col pt-0.5">
                                    <span className={cn("text-[15px] leading-tight capitalize", value ? "font-medium text-[#222222]" : "text-[#717171]")}>
                                      {key.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                    {typeof value !== 'boolean' && (
                                      <span className="text-[13px] text-[#717171] mt-1">
                                        Limit: {value === -1 ? 'Unlimited' : value}
                                      </span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    // Empty State (No Active Subscription)
                    <div className="rounded-2xl border border-[#DDDDDD] bg-white text-center py-24 px-6 mt-6">
                      <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#EBEBEB]">
                        <CalendarIcon className="h-8 w-8 text-[#222222] stroke-[1.5]" />
                      </div>
                      <h3 className="text-[22px] font-semibold text-[#222222] mb-3">No active subscription</h3>
                      <p className="text-[15px] text-[#717171] mb-8 max-w-sm mx-auto leading-relaxed">
                        Unlock premium tools, increase your visibility, and scale your real estate portfolio today.
                      </p>
                      <Button
                        onClick={() => {
                          const el = document.querySelector('[data-value="plans"]');
                          if (el instanceof HTMLElement) el.click();
                        }}
                        className="px-8 h-12 bg-[#222222] hover:bg-black text-white font-semibold rounded-lg text-[15px] transition-colors"
                      >
                        View available plans
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>

      {selectedPlan && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          amount={currentPrice}
          currency={Currency.XAF}
          description={`${selectedPlan.displayName} - ${selectedBillingCycle}`}
          onPaymentSubmit={handlePaymentSubmit}
          loading={loading}
          savedPhone={savedPhone || undefined}
          savedProvider={savedProvider || undefined}
        />
      )}
    </SidebarProvider>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const KPICard = ({ title, amount, subtext, icon: Icon, success = false, alert = false }: any) => {
  return (
    <Card className="rounded-2xl border border-[#DDDDDD] bg-white shadow-none">
      <CardContent>
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 rounded-full bg-[#F7F7F7] border border-[#EBEBEB]">
            <Icon className="w-5 h-5 text-[#222222] stroke-[1.5]" />
          </div>
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#717171] mb-1">{title}</p>
          <h3 className={cn(
            "text-[32px] font-semibold tracking-tight capitalize leading-none",
            alert ? "text-[#C2293F]" : success ? "text-[#008A05]" : "text-[#222222]"
          )}>
            {amount}
          </h3>
          <p className="text-[14px] text-[#717171] mt-2">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
};

function UsageItem({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isWarning = !isUnlimited && percentage > 90;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[15px] font-medium text-[#222222]">{label}</p>
          <p className="text-[28px] font-semibold text-[#222222] tracking-tight leading-none mt-1">
            {used} <span className="text-[16px] font-normal text-[#717171]">/ {isUnlimited ? '∞' : limit}</span>
          </p>
        </div>
        {!isUnlimited && (
          <span className={cn(
            "text-[12px] font-semibold px-2 py-1 rounded-md",
            isWarning ? "bg-[#FFF8F6] text-[#C2293F]" : "bg-[#F7F7F7] text-[#222222]"
          )}>
            {Math.round(percentage)}% used
          </span>
        )}
      </div>
      {!isUnlimited && (
        <div className="w-full bg-[#EBEBEB] h-1.5 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-1000", isWarning ? "bg-[#C2293F]" : "bg-[#222222]")}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Skeleton States ────────────────────────────────────────────────────────────

function SubscriptionCardsSkeleton() {
  return (
    <div className="w-full space-y-10 py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl p-8 space-y-6 bg-white border border-[#EBEBEB]">
            <Skeleton className="h-10 w-10 rounded-lg bg-[#F7F7F7]" />
            <Skeleton className="h-6 w-24 bg-[#F7F7F7]" />
            <Skeleton className="h-10 w-32 bg-[#F7F7F7]" />
            <div className="space-y-4 pt-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full bg-[#F7F7F7]" />
                  <Skeleton className="h-4 flex-1 bg-[#F7F7F7]" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-lg mt-4 bg-[#F7F7F7]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentSubscriptionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
      <div className="lg:col-span-8 space-y-8">
        <Card className="rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <CardHeader className="border-b border-[#EBEBEB] pb-5 pt-6 px-6">
            <Skeleton className="h-6 w-40 bg-[#F7F7F7]" />
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-6">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex justify-between pb-4 border-b border-[#EBEBEB]">
                    <Skeleton className="h-4 w-24 bg-[#F7F7F7]" />
                    <Skeleton className="h-4 w-20 bg-[#F7F7F7]" />
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-4">
        <Card className="rounded-2xl border border-[#EBEBEB] bg-[#F7F7F7] shadow-none h-64">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-6 w-36 bg-[#EBEBEB]" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-full bg-[#EBEBEB]" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}