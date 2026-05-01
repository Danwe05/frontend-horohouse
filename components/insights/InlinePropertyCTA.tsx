'use client';

import Link from 'next/link';
import { Search, Home, Calculator, TrendingUp } from 'lucide-react';
import type { InsightCTA } from '@/types/insights';

interface InlinePropertyCTAProps {
  type?: InsightCTA['type'];
}

const CTA_CONFIG: Record<
  InsightCTA['type'],
  { icon: React.ReactNode; headline: string; body: string; cta: string; href: string; color: string }
> = {
  search_listings: {
    icon: <Search className="w-5 h-5" />,
    headline: 'Find your ideal property',
    body: 'Browse thousands of verified listings in Douala, Yaoundé, and across Cameroon.',
    cta: 'Search Properties',
    href: '/properties',
    color: '#2563EB',
  },
  contact_agent: {
    icon: <Home className="w-5 h-5" />,
    headline: 'Connect with a local expert',
    body: 'Our certified agents know every neighborhood and can guide you through the process.',
    cta: 'Find an Agent',
    href: '/agents',
    color: '#7C3AED',
  },
  book_tour: {
    icon: <Home className="w-5 h-5" />,
    headline: 'Book a property tour',
    body: 'Schedule a visit at a time that works for you — virtual or in-person.',
    cta: 'Book a Tour',
    href: '/tours',
    color: '#059669',
  },
  newsletter: {
    icon: <TrendingUp className="w-5 h-5" />,
    headline: 'Stay ahead of the market',
    body: 'Get weekly property market intelligence delivered to your inbox — free.',
    cta: 'Subscribe',
    href: '#newsletter',
    color: '#D97706',
  },
  download_report: {
    icon: <TrendingUp className="w-5 h-5" />,
    headline: 'Download the full market report',
    body: 'Access in-depth property price data, demand trends, and investment forecasts.',
    cta: 'Download Report',
    href: '/reports',
    color: '#0891B2',
  },
};

export default function InlinePropertyCTA({ type = 'search_listings' }: InlinePropertyCTAProps) {
  const config = CTA_CONFIG[type];

  return (
    <div
      className="rounded-[20px] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 my-10"
      style={{ backgroundColor: `${config.color}0D`, border: `1px solid ${config.color}22` }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: config.color }}
      >
        {config.icon}
      </div>

      {/* Copy */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#222222] mb-1">{config.headline}</p>
        <p className="text-[13px] text-[#717171] leading-relaxed">{config.body}</p>
      </div>

      {/* CTA */}
      <Link
        href={config.href}
        className="shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
        style={{ backgroundColor: config.color }}
      >
        {config.cta}
      </Link>
    </div>
  );
}