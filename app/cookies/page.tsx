"use client";

import Footer from "@/components/footer";
import { motion } from "framer-motion";
import {
    Cookie,
    Shield,
    Settings,
    ExternalLink,
    Info,
    MousePointer2,
    BarChart3,
    Zap,
    Mail,
    ChevronRight,
    ArrowRight,
    Lock
} from "lucide-react";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 pl-16">
            {children}
        </div>
    </FadeIn>
);

export default function CookiePolicyPage() {
    const lastUpdated = "March 1, 2026";

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Hero Header */}
            <section className="relative pt-32 pb-20 px-4 md:px-8 bg-white border-b border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                            <Cookie className="w-3 h-3" />
                            Transparency Report
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
                            Cookie Policy
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            We use cookies to improve your experience on HoroHouse. This policy explains what cookies are, how we use them, and how you can manage your preferences.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-sm text-slate-400 font-medium">
                            <Info className="w-4 h-4" />
                            Last Updated: {lastUpdated}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-24 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">

                    <CookieSection icon={Info} title="What are Cookies?" delay={0.1}>
                        <p>
                            Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They allow the website to recognize your device and store some information about your preferences or past actions.
                        </p>
                        <p>
                            Cookies do not typically contain any information that personally identifies a user, but personal information that we store about you may be linked to the information stored in and obtained from cookies.
                        </p>
                    </CookieSection>

                    <CookieSection icon={Zap} title="Types of Cookies We Use" delay={0.2}>
                        <p>
                            We use both session cookies (which expire once you close your web browser) and persistent cookies (which stay on your device until you delete them or they expire). We use these for the following purposes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="p-6 rounded-2xl bg-white border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Essential Cookies</h4>
                                <p className="text-sm text-slate-500">Necessary for the website to function. They enable basic features like page navigation and access to secure areas. The website cannot function properly without these cookies.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Analytics Cookies</h4>
                                <p className="text-sm text-slate-500">Help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our platform's performance and UX.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                                    <MousePointer2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Preference Cookies</h4>
                                <p className="text-sm text-slate-500">Allow a website to remember information that changes the way the website behaves or looks, like your preferred language or the region that you are in.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                                    <ExternalLink className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Marketing Cookies</h4>
                                <p className="text-sm text-slate-500">Used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.</p>
                            </div>
                        </div>
                    </CookieSection>

                    <CookieSection icon={Settings} title="How to Manage Cookies" delay={0.3}>
                        <p>
                            You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.
                        </p>
                        <p>
                            Most browsers allow you to see what cookies you have and delete them on an individual basis or block cookies from specific or all websites. Be aware that any preference you have set will be lost if you delete all cookies.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4">
                            <a href="https://support.google.com/chrome/answer/95647" target="_blank" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                Chrome Settings <ExternalLink className="w-3 h-3" />
                            </a>
                            <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471" target="_blank" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                Safari Settings <ExternalLink className="w-3 h-3" />
                            </a>
                            <a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                Edge Settings <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </CookieSection>

                    <CookieSection icon={Shield} title="Third-Party Cookies" delay={0.4}>
                        <p>
                            In some cases, we use cookies provided by trusted third parties. The following section details which third-party cookies you might encounter through this site:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Google Analytics:</strong> One of the most widespread and trusted analytics solutions on the web for helping us to understand how you use the site and ways that we can improve your experience.</li>
                            <li><strong>Stripe:</strong> Used for secure payment processing and fraud prevention.</li>
                            <li><strong>Social Media:</strong> We use buttons and/or plugins on this site that allow you to connect with your social network in various ways.</li>
                        </ul>
                    </CookieSection>

                    <CookieSection icon={Mail} title="Questions?" delay={0.5}>
                        <p>
                            If you have any questions about our use of cookies or other technologies, please email us:
                        </p>
                        <div className="mt-8 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Cookie className="w-32 h-32" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Cookie Support Hub</h3>
                            <p className="text-slate-300 text-sm mb-6 max-w-md">Our privacy team is available to explain our technology stack and how it protects your data.</p>
                            <div className="flex flex-wrap gap-4">
                                <a href="mailto:privacy@horohouse.com" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-bold text-sm flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Privacy Team
                                </a>
                                <a href="/support" className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-bold text-sm flex items-center gap-2">
                                    Visit Help Center
                                    <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </CookieSection>

                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
                            Your Experience. <br /> Your Choice.
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a href="/dashboard" className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                                Go to Dashboard
                            </a>
                            <a href="/privacy" className="px-8 py-4 rounded-full bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition-all">
                                View Privacy Policy
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </section>

            
        </main>
    );
}
