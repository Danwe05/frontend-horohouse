'use client';

import { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

interface NewsletterCTAProps {
  variant?: 'inline' | 'banner';
}

export default function NewsletterCTA({ variant = 'inline' }: NewsletterCTAProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.subscribeNewsletter(email);
      setDone(true);
      setEmail('');
      toast.success("You're subscribed! Welcome to HoroHouse Insights.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'banner') {
    return (
      <section className="bg-[#222222] rounded-2xl px-8 md:px-14 py-12 md:py-14 text-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/50 mb-3">
            HoroHouse Insights
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Africa&apos;s property market, in your inbox.
          </h2>
          <p className="text-white/50 text-[15px] mb-8 leading-relaxed">
            Weekly insights on market trends and investment opportunities — curated by HoroHouse analysts.
          </p>

          {done ? (
            <div className="flex items-center justify-center gap-2 text-white font-semibold text-[15px]">
              <CheckCircle2 className="w-5 h-5" />
              You&apos;re on the list!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 text-[14px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3.5 bg-white text-[#222222] font-semibold rounded-xl hover:bg-[#F7F7F7] transition-colors text-[14px] disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}

          <p className="text-[12px] text-white/25 mt-4">No spam. Unsubscribe at any time.</p>
        </div>
      </section>
    );
  }

  // ── Inline variant ────────────────────────────────────────────────────────

  return (
    <section>
      <div className="border border-[#EBEBEB] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-sm">
          <div className="w-10 h-10 border border-[#EBEBEB] rounded-full flex items-center justify-center mb-4">
            <Mail className="w-4 h-4 text-[#222222]" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#222222] mb-2">
            Stay in the know
          </h3>
          <p className="text-[#717171] text-[14px] leading-relaxed">
            Get weekly property market insights delivered to your inbox.
          </p>
        </div>

        {done ? (
          <div className="flex items-center gap-2 text-[#222222] font-semibold text-[14px] whitespace-nowrap">
            <CheckCircle2 className="w-5 h-5" />
            You&apos;re subscribed!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-4 py-3 rounded-xl border border-[#DDDDDD] w-full sm:w-60 focus:outline-none focus:border-[#222222] text-[#222222] text-[14px] bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#222222] hover:bg-black text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap text-[14px] disabled:opacity-60"
            >
              {loading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}