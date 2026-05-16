"use client";

import { motion } from "framer-motion";
import {
    Cookie,
    Shield,
    Settings,
    ExternalLink,
    Info,
    MousePointer2,
    BarChart3,
    Lock,
    Mail,
    ChevronRight
} from "lucide-react";
import Link from "next/link";

// ─── Animations & Wrappers ───────────────────────────────────────────────────

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
    >
        {children}
    </motion.div>
);

const CookieSection = ({
    icon: Icon,
    title,
    children,
    delay = 0
}: {
    icon: any;
    title: string;
    children: React.ReactNode;
    delay?: number
}) => (
    <FadeIn delay={delay} className="mb-16">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full border border-[#DDDDDD] bg-[#F7F7F7] flex items-center justify-center text-[#222222] shrink-0">
                <Icon className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-[22px] md:text-[26px] font-semibold text-[#222222] tracking-tight">{title}</h2>
        </div>
        <div className="pl-0 sm:pl-16 space-y-4 text-[16px] text-[#717171] leading-relaxed">
            {children}
        </div>
    </FadeIn>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CookiePolicyPage() {
    const lastUpdated = "March 1, 2026";

    return (
        <main className="min-h-screen bg-white text-[#222222] selection:blue-blue-600 selection:text-white font-sans pb-20">

            {/* ── Hero Header ── */}
            <section className="pt-32 pb-16 px-6 md:px-12 border-b border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto">
                    <FadeIn>
                        <div className="mb-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#717171] uppercase tracking-wider">
                            <Cookie className="w-4 h-4 stroke-[2]" />
                            Transparency Report
                        </div>
                        <h1 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#222222] mb-6 leading-tight">
                            Cookie Policy
                        </h1>
                        <p className="text-[18px] text-[#717171] leading-relaxed">
                            We use cookies to improve your experience on HoroHouse. Whether you are searching for a home to buy, applying for a long-term lease, or booking a short-term stay, this policy explains how we use your data and how you can manage your preferences.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-[14px] text-[#717171] font-medium">
                            <Info className="w-4 h-4 stroke-[2]" />
                            Last updated: {lastUpdated}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── Content Section ── */}
            <section className="py-16 px-6 md:px-12">
                <div className="max-w-3xl mx-auto">

                    <CookieSection icon={Info} title="What are cookies?" delay={0.1}>
                        <p>
                            Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They allow the website to recognize your device and store some information about your preferences or past actions.
                        </p>
                        <p>
                            Cookies do not typically contain any information that personally identifies a user, but personal information that we store about you may be linked to the information stored in and obtained from cookies.
                        </p>
                    </CookieSection>

                    <CookieSection icon={Cookie} title="Types of cookies we use" delay={0.2}>
                        <p>
                            We use both session cookies (which expire once you close your web browser) and persistent cookies (which stay on your device until you delete them or they expire). We use these for the following purposes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white">
                                <Lock className="w-6 h-6 text-[#222222] mb-4 stroke-[1.5]" />
                                <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Essential Cookies</h4>
                                <p className="text-[14px] text-[#717171] leading-relaxed">
                                    Necessary for the website to function. They enable basic features like securely processing payments when you book a short-term stay or pay a listing fee.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white">
                                <BarChart3 className="w-6 h-6 text-[#222222] mb-4 stroke-[1.5]" />
                                <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Analytics Cookies</h4>
                                <p className="text-[14px] text-[#717171] leading-relaxed">
                                    Help us understand how visitors interact with our website. This helps us improve search filters so you can find rentals and properties for sale faster.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white">
                                <MousePointer2 className="w-6 h-6 text-[#222222] mb-4 stroke-[1.5]" />
                                <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Preference Cookies</h4>
                                <p className="text-[14px] text-[#717171] leading-relaxed">
                                    Allow us to remember information that changes the way the website behaves or looks, like your preferred language, currency, or your last searched city.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white">
                                <ExternalLink className="w-6 h-6 text-[#222222] mb-4 stroke-[1.5]" />
                                <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Marketing Cookies</h4>
                                <p className="text-[14px] text-[#717171] leading-relaxed">
                                    Used to track visitors across websites. The intention is to display relevant listings—like showing you vacation rentals if you've recently been searching for short-term bookings.
                                </p>
                            </div>
                        </div>
                    </CookieSection>

                    <CookieSection icon={Settings} title="How to manage cookies" delay={0.3}>
                        <p>
                            You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.
                        </p>
                        <p>
                            Most browsers allow you to see what cookies you have and delete them on an individual basis or block cookies from specific or all websites. Be aware that any preference you have set will be lost if you delete all cookies.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4">
                            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] flex items-center gap-1.5 transition-colors">
                                Chrome Settings <ExternalLink className="w-4 h-4 stroke-[2]" />
                            </a>
                            <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471" target="_blank" rel="noreferrer" className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] flex items-center gap-1.5 transition-colors">
                                Safari Settings <ExternalLink className="w-4 h-4 stroke-[2]" />
                            </a>
                            <a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noreferrer" className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] flex items-center gap-1.5 transition-colors">
                                Edge Settings <ExternalLink className="w-4 h-4 stroke-[2]" />
                            </a>
                        </div>
                    </CookieSection>

                    <CookieSection icon={Shield} title="Third-party cookies" delay={0.4}>
                        <p>
                            In some cases, we use cookies provided by trusted third parties. The following section details which third-party cookies you might encounter through this site:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span><strong className="text-[#222222] font-semibold">Google Analytics:</strong> One of the most widespread analytics solutions to help us understand how you use the site and ways we can improve your property search.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span><strong className="text-[#222222] font-semibold">Stripe / Flutterwave:</strong> Used for secure payment processing and fraud prevention when you make deposits or book stays.</span>
                            </li>
                        </ul>
                    </CookieSection>

                    <CookieSection icon={Mail} title="Questions?" delay={0.5}>
                        <p>
                            If you have any questions about our use of cookies or other technologies, please reach out to us:
                        </p>
                        <div className="mt-8 p-8 rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222]">
                            <h3 className="text-[20px] font-semibold mb-2">Cookie support hub</h3>
                            <p className="text-[15px] text-[#717171] mb-8 max-w-md">
                                Our privacy team is available to explain our technology stack and how it protects your data during your real estate journey.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="mailto:privacy@horohouse.com" className="px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-semibold text-[15px] flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4 stroke-[2]" />
                                    Email Privacy Team
                                </a>
                                <Link href="/support" className="px-6 py-3.5 rounded-lg bg-white border border-blue-600 hover:bg-[#F7F7F7] transition-colors font-semibold text-[15px] flex items-center justify-center gap-2">
                                    Visit Help Center
                                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                                </Link>
                            </div>
                        </div>
                    </CookieSection>

                </div>
            </section>

            {/* ── Footer CTA ── */}
            <section className="py-16 px-6 border-t border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto text-center">
                    <FadeIn>
                        <h2 className="text-[26px] md:text-[32px] font-semibold mb-8 text-[#222222] tracking-tight">
                            Your experience. Your choice.
                        </h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/dashboard" className="px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors">
                                Go to Dashboard
                            </Link>
                            <Link href="/privacy" className="px-8 py-3.5 rounded-lg bg-white border border-blue-600 text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7] transition-colors">
                                View Privacy Policy
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

        </main>
    );
}