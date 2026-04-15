'use client';

import React from 'react';
import {
  Check, Star, Building, Sparkles,
  TrendingUp, Gift, ShieldCheck, BarChart2, Zap,
} from 'lucide-react';
import { SubscriptionPlan, BillingCycle } from '@/types/paiement';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionCardsProps {
  plans: SubscriptionPlan[];
  currentPlan?: string;
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: BillingCycle) => void;
  loading?: boolean;
}

// ── Role → plan filter mapping ─────────────────────────────────────────────────
const ROLE_TO_PLAN_ROLE: Record<UserRole, string> = {
  landlord:        'landlord',
  host:            'host',
  agent:           'agent',
  student:         'student',
  user:            'user',
  registered_user: 'user',
  guest:           'user',
  admin:           'agent',
};

// ── Plan icon ─────────────────────────────────────────────────────────────────
function getPlanIcon(planName: string) {
  const n = planName.toLowerCase();
  if (n.includes('free'))      return <Star className="h-5 w-5" />;
  if (n.includes('elite'))     return <Sparkles className="h-5 w-5" />;
  if (n.includes('pro'))       return <BarChart2 className="h-5 w-5" />;
  if (n.includes('growth'))    return <TrendingUp className="h-5 w-5" />;
  if (n.includes('starter'))   return <Zap className="h-5 w-5" />;
  if (n.includes('enterprise') || n.includes('agency')) return <Building className="h-5 w-5" />;
  return <Check className="h-5 w-5" />;
}

function getPropertyFeatures(plan: SubscriptionPlan): { label: string; check: boolean }[] {
  const f = plan.features;
  const props = f.maxProperties === -1 ? 'Unlimited' : (f.maxProperties ?? f.maxListings);
  return [
    { label: `${props} ${props === 1 ? 'property' : 'properties'}`, check: true },
    { label: 'Booking calendar',                           check: !!f.bookingCalendar },
    { label: 'Short-term rental support (Airbnb-style)',   check: !!f.shortTermRentalSupport },
    { label: 'Analytics dashboard',                        check: !!f.analytics },
    { label: 'Maintenance tracking',                       check: !!f.maintenanceTracking },
    { label: 'AI smart pricing',                           check: !!f.smartPricing },
    { label: 'Premium visibility',                         check: !!f.premiumVisibility },
    { label: 'Dedicated support',                          check: !!f.dedicatedSupport },
  ];
}

function getAgentFeatures(plan: SubscriptionPlan): { label: string; check: boolean }[] {
  const f = plan.features;
  const listings = f.maxListings === -1 ? 'Unlimited' : f.maxListings;
  const boosts   = f.boostsPerMonth === -1 ? 'Unlimited' : f.boostsPerMonth;
  return [
    { label: `${listings} listings / month`,        check: true },
    { label: `${boosts} visibility boosts / month`, check: true },
    { label: 'Featured homepage placements',         check: !!(f.featuredListings) },
    { label: 'Priority 24/7 support',               check: !!f.prioritySupport },
    { label: 'Analytics & reporting',               check: !!(f.analytics || f.analyticsAccess) },
    { label: 'Team collaboration',                  check: !!(f.teamMembers && f.teamMembers > 1) },
    { label: 'API access',                          check: !!f.apiAccess },
    { label: 'White-label branding',                check: !!(f.whiteLabel || f.customBranding) },
  ];
}

function getUserFeatures(plan: SubscriptionPlan): { label: string; check: boolean }[] {
  const f = plan.features;
  return [
    { label: 'Browse properties',                check: true },
    { label: 'Save and manage favorites',        check: true },
    { label: 'Contact agents and hosts directly',check: true },
    { label: 'AI personalized suggestions',      check: !!f.premiumVisibility },
    { label: 'Early access to listings',         check: !!f.premiumVisibility },
    { label: 'Priority agent messaging',         check: !!f.prioritySupport },
  ];
}

// ── CTA label ─────────────────────────────────────────────────────────────────
function getCtaLabel(
  plan: SubscriptionPlan,
  isCurrent: boolean,
  isPropertyManager: boolean,
): string {
  if (isCurrent) return 'Current plan';
  const isFree = plan.pricing.monthly === 0 && (plan.pricing.weekly ?? 0) === 0;
  if (isFree)      return 'Start for Free';
  if (isPropertyManager) {
    if (plan.features.shortTermRentalSupport) return 'Become a Host';
    return 'List Your Property';
  }
  return plan.popular || plan.metadata?.badge ? 'Get started' : 'Choose plan';
}

// ── Add-ons ───────────────────────────────────────────────────────────────────
const ADD_ONS = [
  {
    icon: TrendingUp,
    title: 'Listing Boost',
    desc: 'Push your property to the top of search results for 7 days.',
    cta: 'From 2,500 FCFA',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Gift,
    title: 'Pay-per-Lead',
    desc: 'Only pay when a qualified tenant contacts you directly.',
    cta: 'Per lead pricing',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: 'Property Verification',
    desc: 'Get a verified badge that builds trust with tenants.',
    cta: '5,000 FCFA once',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export const SubscriptionCards: React.FC<SubscriptionCardsProps> = ({
  plans,
  currentPlan,
  onSelectPlan,
  loading = false,
}) => {
  const { role } = useUserRole();

  const isLandlord = role === 'landlord';
  const isHost = role === 'host';
  const isPropertyManager = isLandlord || isHost;
  const isUserRole = role === 'user' || role === 'registered_user' || role === 'guest' || role === 'student';

  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.MONTHLY);

  // Filter plans automatically by the logged-in user's role
  const planRole = ROLE_TO_PLAN_ROLE[role] ?? 'agent';
  const visiblePlans = React.useMemo(() => {
    return plans.filter(p => {
      const r = p.metadata?.role ?? p.features.role ?? 'agent';
      return r === planRole;
    });
  }, [plans, planRole]);

  const getPrice = (plan: SubscriptionPlan): number => {
    if (billingCycle === BillingCycle.YEARLY)  return plan.pricing.yearly   ?? plan.pricing.monthly;
    return plan.pricing.monthly;
  };

  return (
    <div className="w-full py-8 font-sans text-[#222222]">

      {/* ── Billing toggle ──────────────────────────────────────────── */}
      <div className="flex justify-center mb-10 sm:mb-14">
        <div className="flex p-1 bg-[#F7F7F7] rounded-full border border-[#EBEBEB] shadow-sm">
          <BillingBtn label="Monthly" active={billingCycle === BillingCycle.MONTHLY} onClick={() => setBillingCycle(BillingCycle.MONTHLY)} />
          <BillingBtn label="Yearly"  active={billingCycle === BillingCycle.YEARLY}  onClick={() => setBillingCycle(BillingCycle.YEARLY)} savings="Save 20%" />
        </div>
      </div>

      {/* ── Plan cards — always 3 per row ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visiblePlans.map((plan) => {
          const price     = getPrice(plan);
          const isPopular = !!(plan.popular || plan.metadata?.badge);
          const isCurrent = currentPlan === plan.name;
          const isFree    = price === 0;
          const features  = isPropertyManager ? getPropertyFeatures(plan) : isUserRole ? getUserFeatures(plan) : getAgentFeatures(plan);

          return (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col bg-white rounded-[20px] p-6 sm:p-8 transition-all duration-300',
                isPopular
                  ? 'border-[2px] border-[#222222] shadow-[0_12px_32px_rgba(0,0,0,0.10)]'
                  : 'border border-[#DDDDDD] hover:border-[#222222] shadow-sm',
                isCurrent && 'ring-2 ring-[#E51D53]/30',
              )}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-[#222222] text-white px-4 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-widest shadow">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn(
                  'p-2 rounded-xl shrink-0',
                  isPopular ? 'bg-[#222222] text-white' : 'bg-[#F7F7F7] text-[#E51D53]',
                )}>
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-[18px] font-bold tracking-tight text-[#222222]">
                  {plan.displayName}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[38px] font-black tracking-tighter text-[#222222] leading-none">
                    {isFree ? 'Free' : price.toLocaleString()}
                  </span>
                  {!isFree && (
                    <span className="text-[14px] font-medium text-[#717171]">
                      {' '}FCFA {plan.metadata?.pricingSuffix}&nbsp;/&nbsp;{billingCycle === BillingCycle.YEARLY ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[14px] text-[#717171] leading-relaxed mb-6">
                {plan.description}
              </p>

              <div className="h-px w-full bg-[#EBEBEB] mb-6" />

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={cn(
                      'h-4 w-4 mt-0.5 shrink-0 stroke-[2.5]',
                      f.check ? 'text-[#222222]' : 'text-[#DDDDDD]',
                    )} />
                    <span className={cn(
                      'text-[14px] leading-snug',
                      f.check ? 'text-[#222222]' : 'text-[#CCCCCC] line-through',
                    )}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => onSelectPlan(plan, billingCycle)}
                disabled={loading || isCurrent}
                className={cn(
                  'mt-auto w-full py-3.5 rounded-xl font-bold text-[15px] transition-all focus:outline-none active:scale-[0.98]',
                  isCurrent
                    ? 'bg-[#F7F7F7] text-[#AAAAAA] border border-[#EBEBEB] cursor-not-allowed'
                    : isPopular
                      ? 'bg-[#E51D53] text-white hover:bg-[#D70466] shadow-md shadow-rose-500/20'
                      : isFree
                        ? 'bg-[#222222] text-white hover:bg-black'
                        : 'bg-white text-[#222222] border-[1.5px] border-[#222222] hover:bg-[#F7F7F7]',
                )}
              >
                {getCtaLabel(plan, isCurrent, isPropertyManager)}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Payment methods footnote ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-10 text-[13px] text-[#717171]">
        <span>Secure payment via</span>
        <span className="flex items-center gap-1.5 font-semibold text-[#222222]">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          MTN MoMo
        </span>
        <span className="text-[#DDDDDD]">·</span>
        <span className="flex items-center gap-1.5 font-semibold text-[#222222]">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
          Orange Money
        </span>
      </div>

      {/* ── Add-ons strip ────────────────────────────────────────────── */}
      <div className="mt-14">
        <h3 className="text-[18px] font-bold text-[#222222] mb-6">Boost your results with add-ons</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ADD_ONS.map(({ icon: Icon, title, desc, cta, color }) => (
            <div
              key={title}
              className="flex items-start gap-4 bg-[#F7F7F7] rounded-2xl p-5 border border-[#EBEBEB]"
            >
              <div className={cn('p-2.5 rounded-xl shrink-0', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#222222] mb-1">{title}</p>
                <p className="text-[13px] text-[#717171] leading-snug mb-3">{desc}</p>
                <span className="text-[12px] font-bold text-[#222222] border border-[#DDDDDD] bg-white px-3 py-1 rounded-full">
                  {cta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Billing toggle button ─────────────────────────────────────────────────────
function BillingBtn({
  label, active, onClick, savings,
}: {
  label: string; active: boolean; onClick: () => void; savings?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all focus:outline-none',
        active
          ? 'bg-white text-[#222222] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#DDDDDD]'
          : 'text-[#717171] hover:text-[#222222] border border-transparent',
      )}
    >
      {label}
      {savings && (
        <span className={cn(
          'text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide',
          active ? 'bg-[#222222] text-white' : 'bg-[#EBEBEB] text-[#717171]',
        )}>
          {savings}
        </span>
      )}
    </button>
  );
}