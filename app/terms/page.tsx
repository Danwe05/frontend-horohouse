"use client";

import { motion } from "framer-motion";
import {
    FileText,
    Gavel,
    UserPlus,
    Ban,
    Copyright,
    AlertTriangle,
    Scale,
    Mail,
    Info,
    ShieldCheck,
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

const TermsSection = ({
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

export default function TermsOfServicePage() {
    const lastUpdated = "March 1, 2026";

    return (
        <main className="min-h-screen bg-white text-[#222222] selection:blue-blue-600 selection:text-white font-sans pb-20">

            {/* ── Hero Header ── */}
            <section className="pt-32 pb-16 px-6 md:px-12 border-b border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto">
                    <FadeIn>
                        <div className="mb-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#717171] uppercase tracking-wider">
                            <Scale className="w-4 h-4 stroke-[2]" />
                            Legal Framework
                        </div>
                        <h1 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#222222] mb-6 leading-tight">
                            Terms of Service
                        </h1>
                        <p className="text-[18px] text-[#717171] leading-relaxed">
                            Welcome to HoroHouse. By using our platform, you agree to these terms. Please read them carefully to understand your rights and responsibilities.
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

                    <TermsSection icon={UserPlus} title="Acceptance of terms" delay={0.1}>
                        <p>
                            By accessing or using the HoroHouse website, mobile application, or any other services provided by HoroHouse (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our Services.
                        </p>
                        <p>
                            We may update these terms from time to time. Your continued use of the Services after we post meaningful changes signifies your acceptance of the updated terms.
                        </p>
                    </TermsSection>

                    <TermsSection icon={ShieldCheck} title="User obligations" delay={0.2}>
                        <p>
                            To maintain the integrity of our real estate community, all users agree to:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Provide accurate, current, and complete information during registration.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Maintain the security of your account credentials.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Promptly update account information to keep it accurate.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Accept all risks of unauthorized access to your account based on your actions.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Use the Services only for lawful purposes and in accordance with these Terms.</span>
                            </li>
                        </ul>
                    </TermsSection>

                    <TermsSection icon={Ban} title="Prohibited activities" delay={0.3}>
                        <p>
                            HoroHouse is built on trust. We strictly prohibit any activity that undermines this, including but not limited to:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Posting fraudulent, misleading, or deceptive property listings.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Impersonating any person or entity, including HoroHouse employees or vetted agents.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Attempting to bypass platform security or scraping data without authorization.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Engaging in any conduct that restricts or inhibits anyone's use or enjoyment of the Services.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Using the Services for any commercial purpose not explicitly permitted.</span>
                            </li>
                        </ul>
                    </TermsSection>

                    <TermsSection icon={Copyright} title="Intellectual property" delay={0.4}>
                        <p>
                            The HoroHouse platform, including its logo, design, text, graphics, and software, is the property of HoroHouse and is protected by international copyright and trademark laws.
                        </p>
                        <p>
                            You are granted a limited, non-exclusive, non-transferable license to access and use the Services for your personal or authorized professional use. Any reproduction, distribution, or modification of platform content without our express written consent is strictly prohibited.
                        </p>
                    </TermsSection>

                    <TermsSection icon={Gavel} title="Limitation of liability" delay={0.5}>
                        <p>
                            HoroHouse provides a platform to connect users. While we verify listings and agents, we are not responsible for:
                        </p>
                        <ul className="space-y-3 mt-4">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>The accuracy of third-party property descriptions.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>The outcome of negotiations or transactions between users.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>Any indirect, incidental, or consequential damages arising from your use of the platform.</span>
                            </li>
                        </ul>
                        <div className="mt-6 p-4 rounded-xl border border-[#DDDDDD] bg-[#F7F7F7]">
                            <p className="text-[14px] text-[#717171]">
                                <strong>Note:</strong> Transactions in real estate involve significant financial commitment. We always recommend legal counsel and physical inspections before finalizing any purchase or long-term lease.
                            </p>
                        </div>
                    </TermsSection>

                    <TermsSection icon={AlertTriangle} title="Termination" delay={0.6}>
                        <p>
                            We reserve the right to terminate or suspend your account and access to the Services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                        </p>
                    </TermsSection>

                    <TermsSection icon={FileText} title="Contact legal team" delay={0.7}>
                        <p>
                            For any questions regarding these Terms of Service or legal inquiries, please contact our legal department:
                        </p>
                        <div className="mt-8 p-8 rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222]">
                            <h3 className="text-[20px] font-semibold mb-2">Legal support center</h3>
                            <p className="text-[15px] text-[#717171] mb-8 max-w-md">
                                Our legal team is available to clarify any points within this agreement and assist with compliance inquiries.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="mailto:legal@horohouse.com" className="px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-semibold text-[15px] flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4 stroke-[2]" />
                                    Email Legal Team
                                </a>
                                <Link href="/support" className="px-6 py-3.5 rounded-lg bg-white border border-blue-600 hover:bg-[#F7F7F7] transition-colors font-semibold text-[15px] flex items-center justify-center gap-2">
                                    Visit Help Center
                                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                                </Link>
                            </div>
                        </div>
                    </TermsSection>

                </div>
            </section>

            {/* ── Footer CTA ── */}
            <section className="py-16 px-6 border-t border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto text-center">
                    <FadeIn>
                        <h2 className="text-[26px] md:text-[32px] font-semibold mb-8 text-[#222222] tracking-tight">
                            Building Africa's future. <br /> Together.
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