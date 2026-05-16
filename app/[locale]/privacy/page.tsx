"use client";

import { motion } from "framer-motion";
import {
    Shield,
    Lock,
    Eye,
    UserCheck,
    Globe,
    Mail,
    Database,
    Info,
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

const PolicySection = ({
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

export default function PrivacyPolicyPage() {
    const lastUpdated = "March 1, 2026";

    return (
        <main className="min-h-screen bg-white text-[#222222] selection:blue-blue-600 selection:text-white font-sans pb-20">

            {/* ── Hero Header ── */}
            <section className="pt-32 pb-16 px-6 md:px-12 border-b border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto">
                    <FadeIn>
                        <div className="mb-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#717171] uppercase tracking-wider">
                            <Shield className="w-4 h-4 stroke-[2]" />
                            Trust & Transparency
                        </div>
                        <h1 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#222222] mb-6 leading-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-[18px] text-[#717171] leading-relaxed">
                            At HoroHouse, we take your privacy seriously. This policy outlines how we collect, use, and protect your data while providing Africa's most trusted real estate ecosystem.
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

                    <PolicySection icon={Eye} title="Information we collect" delay={0.1}>
                        <p>
                            To provide our platform's core services, we collect various types of information when you interact with HoroHouse:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span><strong className="text-[#222222] font-semibold">Personal Details:</strong> Name, email address, phone number, and account credentials.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span><strong className="text-[#222222] font-semibold">Property Data:</strong> Property descriptions, photos, and location data when listing.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span><strong className="text-[#222222] font-semibold">Transaction Data:</strong> Billing information, purchase history, and booking details.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span><strong className="text-[#222222] font-semibold">Device & Usage:</strong> IP addresses, browser types, and how you navigate our platform.</span>
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={Database} title="How we use your data" delay={0.2}>
                        <p>
                            Your information helps us maintain a secure and efficient marketplace. We use your data to:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Facilitate property searches, inquiries, and verified listings.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Verify the identity of agents, hosts, and sellers to prevent fraud.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Process payments, refunds, and manage your bookings.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Send critical notifications regarding your account or property inquiries.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Improve our valuation and search recommendation algorithms.</span>
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={Lock} title="Security & protection" delay={0.3}>
                        <p>
                            Security isn't just a feature; it's our foundation. We implement strict, industry-standard security measures:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white">
                                <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Data encryption</h4>
                                <p className="text-[14px] text-[#717171] leading-relaxed">
                                    All sensitive data is encrypted using 256-bit SSL technology during transit and securely stored at rest.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl border border-[#DDDDDD] bg-white">
                                <h4 className="text-[16px] font-semibold text-[#222222] mb-2">Access control</h4>
                                <p className="text-[14px] text-[#717171] leading-relaxed">
                                    Strict internal protocols ensure your private information is only accessible to authorized personnel.
                                </p>
                            </div>
                        </div>
                    </PolicySection>

                    <PolicySection icon={UserCheck} title="Your rights" delay={0.4}>
                        <p>
                            We believe you should have full control over your personal data. At any time, you have the right to:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Access and export your personal information stored on our servers.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Request correction or complete deletion of your account and personal data.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Withdraw consent for marketing communications or optional data collection.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Receive a transparent explanation of our data processing logic.</span>
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={Globe} title="Cookies & tracking" delay={0.5}>
                        <p>
                            We use cookies to personalize your experience and analyze platform traffic. These cookies help us remember your preferences, keep you securely logged in across sessions, and show you properties that match your interests. You can manage cookie settings through your browser at any time.
                        </p>
                    </PolicySection>

                    <PolicySection icon={Mail} title="Contact our privacy team" delay={0.6}>
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please reach out to us:
                        </p>
                        <div className="mt-8 p-8 rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222]">
                            <h3 className="text-[20px] font-semibold mb-2">Privacy support hub</h3>
                            <p className="text-[15px] text-[#717171] mb-8 max-w-md">
                                Our dedicated data protection team is here to assist you with any privacy-related inquiries and ensure your rights are respected.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="mailto:privacy@horohouse.com" className="px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-semibold text-[15px] flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4 stroke-[2]" />
                                    Email Privacy Team
                                </a>
                                <Link href="/support" className="px-6 py-3.5 rounded-lg bg-white border border-blue-600 hover:bg-[#F7F7F7] transition-colors font-semibold text-[15px] flex items-center justify-center gap-2">
                                    Visit Support Center
                                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                                </Link>
                            </div>
                        </div>
                    </PolicySection>

                </div>
            </section>

            {/* ── Footer CTA ── */}
            <section className="py-16 px-6 border-t border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto text-center">
                    <FadeIn>
                        <h2 className="text-[26px] md:text-[32px] font-semibold mb-8 text-[#222222] tracking-tight">
                            Trusted real estate. <br /> Guaranteed privacy.
                        </h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/properties" className="px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors">
                                Explore properties
                            </Link>
                            <Link href="/terms" className="px-8 py-3.5 rounded-lg bg-white border border-blue-600 text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7] transition-colors">
                                Read Terms of Service
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

        </main>
    );
}