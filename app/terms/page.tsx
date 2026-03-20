"use client";

import Footer from "@/components/footer";
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
    HelpCircle,
    ArrowRight,
    ChevronRight,
    Info,
    ShieldCheck
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

export default function TermsOfServicePage() {
    const lastUpdated = "March 1, 2026";

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Hero Header */}
            <section className="relative pt-32 pb-20 px-4 md:px-8 bg-white border-b border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                            <Scale className="w-3 h-3" />
                            Legal Framework
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
                            Terms of Service
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            Welcome to HoroHouse. By using our platform, you agree to these terms. Please read them carefully to understand your rights and responsibilities.
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

                    <TermsSection icon={UserPlus} title="Acceptance of Terms" delay={0.1}>
                        <p>
                            By accessing or using the HoroHouse website, mobile application, or any other services provided by HoroHouse (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our Services.
                        </p>
                        <p>
                            We may update these terms from time to time. Your continued use of the Services after we post meaningful changes signifies your acceptance of the updated terms.
                        </p>
                    </TermsSection>

                    <TermsSection icon={ShieldCheck} title="User Obligations" delay={0.2}>
                        <p>
                            To maintain the integrity of our real estate community, all users agree to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provide accurate, current, and complete information during registration.</li>
                            <li>Maintain the security of your account credentials.</li>
                            <li>Promptly update account information to keep it accurate.</li>
                            <li>Accept all risks of unauthorized access to your account based on your actions.</li>
                            <li>Use the Services only for lawful purposes and in accordance with these Terms.</li>
                        </ul>
                    </TermsSection>

                    <TermsSection icon={Ban} title="Prohibited Activities" delay={0.3}>
                        <p>
                            HoroHouse is built on trust. We strictly prohibit any activity that undermines this, including but not limited to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Posting fraudulent, misleading, or deceptive property listings.</li>
                            <li>Impersonating any person or entity, including HoroHouse employees or vetted agents.</li>
                            <li>Attempting to bypass platform security or scraping data without authorization.</li>
                            <li>Engaging in any conduct that restricts or inhibits anyone's use or enjoyment of the Services.</li>
                            <li>Using the Services for any commercial purpose not explicitly permitted.</li>
                        </ul>
                    </TermsSection>

                    <TermsSection icon={Copyright} title="Intellectual Property" delay={0.4}>
                        <p>
                            The HoroHouse platform, including its logo, design, text, graphics, and software, is the property of HoroHouse and is protected by international copyright and trademark laws.
                        </p>
                        <p>
                            You are granted a limited, non-exclusive, non-transferable license to access and use the Services for your personal or authorized professional use. Any reproduction, distribution, or modification of platform content without our express written consent is strictly prohibited.
                        </p>
                    </TermsSection>

                    <TermsSection icon={Gavel} title="Limitation of Liability" delay={0.5}>
                        <p>
                            HoroHouse provides a platform to connect users. While we verify listings and agents, we are not responsible for:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>The accuracy of third-party property descriptions.</li>
                            <li>The outcome of negotiations or transactions between users.</li>
                            <li>Any indirect, incidental, or consequential damages arising from your use of the platform.</li>
                        </ul>
                        <p className="italic text-sm mt-4">
                            Note: Transactions in real estate involve significant financial commitment. We always recommend legal counsel and physical inspections before finalizing any purchase.
                        </p>
                    </TermsSection>

                    <TermsSection icon={AlertTriangle} title="Termination" delay={0.6}>
                        <p>
                            We reserve the right to terminate or suspend your account and access to the Services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                        </p>
                    </TermsSection>

                    <TermsSection icon={Mail} title="Contact Legal Team" delay={0.7}>
                        <p>
                            For any questions regarding these Terms of Service or legal inquiries, please contact our legal department:
                        </p>
                        <div className="mt-8 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Gavel className="w-32 h-32" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Legal Support Center</h3>
                            <p className="text-slate-300 text-sm mb-6 max-w-md">Our legal team is available to clarify any points within this agreement.</p>
                            <div className="flex flex-wrap gap-4">
                                <a href="mailto:legal@horohouse.com" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-bold text-sm flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Legal Team
                                </a>
                                <a href="/support" className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-bold text-sm flex items-center gap-2">
                                    Visit Help Center
                                    <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </TermsSection>

                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
                            Building Africa's Future. <br /> Together.
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
