'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSubscription } from '@/hooks/usePayment';
import { SubscriptionCards } from '@/components/subscription/SubscriptionCards';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  CreditCard,
  TrendingUp,
  Shield,
  Loader2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { SubscriptionPlan, BillingCycle, PaymentMethod, Currency } from '@/types/paiement';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

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
    // Load saved MoMo details from wallet to pre-fill PaymentModal
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

  // Renew: re-open payment for the current plan
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

  // Inline cancel with reason
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

  // Detect if subscription has expired but backend still shows "active"
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
      <div className="flex min-h-screen w-full bg-[#f8fafc] dark:bg-transparent">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <NavDash />

          <main className="flex-1 p-4 md:p-8 pt-14 md:pt-8 bg-transparent">
            <div className="max-w-6xl mx-auto pb-12">

              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-xl bg-slate-900 text-white -sm">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subscription</h1>
                  </div>
                  <p className="text-slate-500 pl-11">Manage your billing, plans, and usage limits.</p>
                </div>
                {subscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { fetchSubscription(); fetchUsage(); }}
                    disabled={loading}
                    className="rounded-xl border-slate-200"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Sync Data
                  </Button>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl flex items-center gap-3 mb-6">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium text-sm">{error}</p>
                </div>
              )}

              {/* KPI Section for Active Subscription */}
              {subscription && !isInitialLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <KPICard
                    title="Current Plan"
                    amount={subscription.plan}
                    subtext={subscription.billingCycle}
                    icon={Zap}
                    colorClass="blue"
                  />
                  <KPICard
                    title="Days Remaining"
                    amount={remainingDays}
                    subtext="Days until renewal"
                    icon={CalendarIcon}
                    colorClass="indigo"
                  />
                  <KPICard
                    title="Status"
                    amount={effectiveStatus}
                    subtext={subscription.autoRenew ? "Auto-renew ON" : "Auto-renew OFF"}
                    icon={CheckCircle2}
                    colorClass={isExpired ? 'red' : 'emerald'}
                  />
                </div>
              )}

              <Tabs defaultValue="plans" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
                    <TabsTrigger value="plans" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:-sm">Available Plans</TabsTrigger>
                    <TabsTrigger value="current" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:-sm">My Subscription</TabsTrigger>
                  </TabsList>
                </div>

                {/* ── Plans Tab ── */}
                <TabsContent value="plans" className="space-y-6 focus-visible:outline-none">
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
                <TabsContent value="current" className="focus-visible:outline-none">
                  {isInitialLoading ? (
                    <CurrentSubscriptionSkeleton />
                  ) : subscription ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">

                      {/* Left: Plan Summary & Usage */}
                      <div className="lg:col-span-8 space-y-6">
                        <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden">
                          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-6">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-blue-500" />
                              Billing Overview
                            </CardTitle>
                          </CardHeader>
                          {/* Expired banner */}
                          {isExpired && (
                            <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-6 py-3">
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                              <p className="text-sm font-semibold text-red-700 flex-1">Subscription expired on {new Date(subscription!.endDate).toLocaleDateString()} — renew to restore access.</p>
                              <Button size="sm" onClick={handleRenew} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl gap-1.5 text-xs h-8">
                                <RotateCcw className="h-3.5 w-3.5" /> Renew Now
                              </Button>
                            </div>
                          )}
                          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-100">
                                <span className="text-slate-500 text-sm font-medium">Active Plan</span>
                                <span className="font-bold capitalize text-blue-600">{subscription.plan}</span>
                              </div>
                              <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-100">
                                <span className="text-slate-500 text-sm font-medium">Billing Cycle</span>
                                <span className="font-bold text-slate-700 capitalize">{subscription.billingCycle}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-sm font-medium">Auto-Renewal</span>
                                <Badge className={subscription.autoRenew ? "bg-emerald-50 text-emerald-600 border-none" : "bg-slate-100 text-slate-600 border-none"}>
                                  {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-100">
                                <span className="text-slate-500 text-sm font-medium">Next Payment</span>
                                <span className="font-bold text-slate-700">{new Date(subscription!.endDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-100">
                                <span className="text-slate-500 text-sm font-medium">{isExpired ? 'Expired' : 'Days Remaining'}</span>
                                <span className={`font-black tracking-tight ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>{isExpired ? 'Expired' : `${remainingDays} Days`}</span>
                              </div>
                              <div className="flex justify-end pt-2 gap-2 flex-wrap">
                                {isExpired && (
                                  <Button size="sm" onClick={handleRenew}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-xl gap-1.5">
                                    <RotateCcw className="h-4 w-4" /> Renew Subscription
                                  </Button>
                                )}
                                {!showCancelConfirm ? (
                                  <Button
                                    variant="ghost" size="sm"
                                    className="text-destructive hover:bg-destructive/5 font-bold h-9 rounded-xl"
                                    onClick={() => setShowCancelConfirm(true)}
                                    disabled={isExpired}
                                  >
                                    Cancel Subscription
                                  </Button>
                                ) : (
                                  <div className="w-full space-y-3 pt-2 border-t border-red-100">
                                    <p className="text-sm font-semibold text-red-700">Reason for cancelling (optional)</p>
                                    <input
                                      value={cancelReason}
                                      onChange={e => setCancelReason(e.target.value)}
                                      placeholder="Tell us why..."
                                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                                    />
                                    {cancelError && <p className="text-xs text-red-600">{cancelError}</p>}
                                    <p className="text-xs text-slate-500">You'll keep access until {new Date(subscription!.endDate).toLocaleDateString()}.</p>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="ghost" onClick={() => { setShowCancelConfirm(false); setCancelError(null); }} disabled={cancelling}
                                        className="rounded-xl h-9 border border-slate-200">Keep Plan</Button>
                                      <Button size="sm" onClick={handleCancelConfirmed} disabled={cancelling}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold h-9 rounded-xl gap-1.5">
                                        {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
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
                          <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-6">
                              <CardTitle className="text-lg font-bold text-slate-800">Resource Usage</CardTitle>
                              <CardDescription className="text-slate-500">Track your current consumption vs limits.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                              <UsageItem
                                label="Property Listings"
                                used={usage.usage.listings.used}
                                limit={usage.usage.listings.limit}
                              />
                              <UsageItem
                                label="Monthly Boosts"
                                used={usage.usage.boosts.used}
                                limit={usage.usage.boosts.limit}
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Right: Features Sidebar */}
                      <div className="lg:col-span-4">
                        <Card className="rounded-3xl border-slate-200 -sm bg-slate-900 text-white overflow-hidden h-fit sticky top-4">
                          <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Zap className="w-32 h-32" />
                          </div>
                          <CardHeader className="pb-4 pt-6 px-6 relative z-10">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-blue-400" />
                              Plan Power
                            </CardTitle>
                            <CardDescription className="text-slate-400">Everything in your {subscription!.plan} plan.</CardDescription>
                          </CardHeader>
                          <CardContent className="px-6 pb-8 relative z-10">
                            <ul className="space-y-4">
                              {Object.entries(subscription!.features).map(([key, value]) => (
                                <li key={key} className="flex items-start gap-3 text-sm">
                                  {value ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-slate-600 shrink-0" />
                                  )}
                                  <div className="flex flex-col">
                                    <span className={`font-bold capitalize ${value ? "text-slate-100" : "text-slate-500"}`}>
                                      {key.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                    {typeof value !== 'boolean' && (
                                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400/80">
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
                    <Card className="rounded-3xl border-dashed border-1 border-slate-200 bg-white/50 overflow-hidden">
                      <CardContent className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <CalendarIcon className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">No Active Subscription</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                          Unlock premium tools, increased visibility and scale your real estate portfolio today.
                        </p>
                        <Button
                          onClick={() => {
                            const el = document.querySelector('[data-value="plans"]');
                            if (el instanceof HTMLElement) el.click();
                          }}
                          className="px-10 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl -lg -blue-500/20"
                        >
                          Browse Plans
                        </Button>
                      </CardContent>
                    </Card>
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

const KPICard = ({ title, amount, subtext, icon: Icon, colorClass, isCurrency = false }: any) => {
  const variants: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden group hover:-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${variants[colorClass]} transition-transform duration-500 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-baseline gap-2">
            {typeof amount === 'number' ? amount.toLocaleString() : <span className="capitalize">{amount}</span>}
            {isCurrency && <span className="text-base font-bold text-slate-400 uppercase">FCFA</span>}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
            {subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

function BillingRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center ${!last ? 'pb-3 border-b border-dashed' : ''}`}>
      <span className="text-muted-foreground text-sm">{label}</span>
      {children}
    </div>
  );
}

function UsageItem({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isWarning = !isUnlimited && percentage > 90;
  const isMedium = !isUnlimited && percentage > 60 && percentage <= 90;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {used}{' '}
            <span className="text-sm font-bold text-slate-400">
              / {isUnlimited ? '∞' : limit}
            </span>
          </p>
        </div>
        {!isUnlimited && (
          <Badge className={`px-2 py-0.5 border-none font-bold text-[10px] uppercase ${isWarning ? 'bg-red-50 text-red-600' : isMedium ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
            }`}>
            {Math.round(percentage)}% USED
          </Badge>
        )}
      </div>
      {!isUnlimited && (
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-red-500' : isMedium ? 'bg-orange-500' : 'bg-blue-500'
              }`}
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
    <div className="w-full max-w-6xl mx-auto space-y-12 py-10">
      <div className="flex justify-center">
        <Skeleton className="h-12 w-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`rounded-[32px] p-8 space-y-6 ${i === 1 ? 'bg-slate-900' : 'bg-white ring-1 ring-slate-100 -xl -slate-200/50'}`}>
            <Skeleton className={`h-12 w-12 rounded-2xl ${i === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
            <Skeleton className={`h-7 w-28 ${i === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
            <Skeleton className={`h-12 w-44 ${i === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className={`h-4 w-4 rounded-full ${i === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
                  <Skeleton className={`h-4 flex-1 ${i === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
                </div>
              ))}
            </div>
            <Skeleton className={`h-12 w-full rounded-2xl mt-4 ${i === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentSubscriptionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-6">
            <Skeleton className="h-6 w-40 bg-slate-200" />
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-6">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex justify-between pb-3 border-b border-dashed border-slate-100">
                    <Skeleton className="h-4 w-24 bg-slate-100" />
                    <Skeleton className="h-4 w-20 bg-slate-100" />
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-6">
            <Skeleton className="h-6 w-32 bg-slate-200" />
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32 bg-slate-100" />
                  <Skeleton className="h-5 w-16 bg-slate-100" />
                </div>
                <Skeleton className="h-3 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-4">
        <Card className="rounded-3xl bg-slate-900 h-64 -xl -slate-900/20">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-6 w-36 bg-slate-800" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full bg-slate-800" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}