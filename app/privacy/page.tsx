"use client";

import Footer from "@/components/footer";
import { motion } from "framer-motion";
import {
    Shield,
    Lock,
    Eye,
    UserCheck,
    FileText,
    Globe,
    Mail,
    Bell,
    Database,
    ArrowRight,
    ChevronRight,
    Info
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

export default function PrivacyPolicyPage() {
    const lastUpdated = "March 1, 2026";

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Hero Header */}
            <section className="relative pt-32 pb-20 px-4 md:px-8 bg-white border-b border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                            <Shield className="w-3 h-3" />
                            Trust & Transparency
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
                            Privacy Policy
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            At HoroHouse, we take your privacy seriously. This policy outlines how we collect, use, and protect your data while providing Africa's most trusted real estate ecosystem.
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

                    <PolicySection icon={Eye} title="Information We Collect" delay={0.1}>
                        <p>
                            To provide our platform's core services, we collect various types of information when you interact with HoroHouse:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Personal Details:</strong> Name, email address, phone number, and account credentials.</li>
                            <li><strong>Property Data:</strong> Property descriptions, photos, and location data when listing.</li>
                            <li><strong>Transaction Data:</strong> Billing information, purchase history, and subscription details.</li>
                            <li><strong>Device & Usage:</strong> IP addresses, browser types, and how you navigate our platform for performance optimization.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={Database} title="How We Use Your Data" delay={0.2}>
                        <p>
                            Your information helps us maintain a secure and efficient marketplace. We use your data to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Facilitate property searches, inquiries, and verified listings.</li>
                            <li>Verify the identity of agents and sellers to prevent fraud.</li>
                            <li>Process payments and manage your subscriptions.</li>
                            <li>Send critical notifications regarding your account or property inquiries.</li>
                            <li>Improve our AI-powered valuation and search recommendation tools.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={Lock} title="Security & Protection" delay={0.3}>
                        <p>
                            Security isn't just a feature; it's our foundation. We implement banking-grade security measures:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="p-6 rounded-2xl bg-white border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-2">Data Encryption</h4>
                                <p className="text-sm">All sensitive data is encrypted using 256-bit SSL technology during transit and at rest.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-2">Access Control</h4>
                                <p className="text-sm">Strict internal protocols ensure your private information is only accessible to authorized personnel.</p>
                            </div>
                        </div>
                    </PolicySection>

                    <PolicySection icon={UserCheck} title="Your Rights" delay={0.4}>
                        <p>
                            We believe you should have full control over your personal data. At any time, you have the right to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Access and export your personal information stored on our servers.</li>
                            <li>Request correction or deletion of your account and personal data.</li>
                            <li>Withdraw consent for marketing communications or data collection.</li>
                            <li>Receive an explanation of our data processing logic.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={Globe} title="Cookies & Tracking" delay={0.5}>
                        <p>
                            We use cookies to personalize your experience and analyze platform traffic. These cookies help us remember your preferences and keep you logged in across sessions. You can manage cookie settings through your browser at any time.
                        </p>
                    </PolicySection>

                    <PolicySection icon={Mail} title="Contact Our Privacy Team" delay={0.6}>
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please reach out to us:
                        </p>
                        <div className="mt-8 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Shield className="w-32 h-32" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Privacy Support Hub</h3>
                            <p className="text-slate-300 text-sm mb-6 max-w-md">Our dedicated data protection team is here to assist you with any privacy-related inquiries.</p>
                            <div className="flex flex-wrap gap-4">
                                <a href="mailto:privacy@horohouse.com" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-bold text-sm flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Privacy Team
                                </a>
                                <a href="/support" className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-bold text-sm flex items-center gap-2">
                                    Visit Support Center
                                    <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </PolicySection>

                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
                            Trusted Real Estate. <br /> Guaranteed Privacy.
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a href="/properties" className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all -lg -blue-600/20">
                                Explore Properties
                            </a>
                            <a href="/terms" className="px-8 py-4 rounded-full bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition-all">
                                Read Terms of Service
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </section>


        </main>
    );
}
