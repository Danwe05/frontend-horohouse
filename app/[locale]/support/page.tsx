"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    BookOpen,
    User,
    CreditCard,
    Home,
    MessageCircle,
    Mail,
    Plus,
    Minus,
    ChevronRight,
    LifeBuoy,
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

// ─── Sub-Components ──────────────────────────────────────────────────────────

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-[#DDDDDD] last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
            >
                <span className="text-[18px] font-medium text-[#222222] pr-8">{question}</span>
                <div className="shrink-0 text-[#717171]">
                    {isOpen ? <Minus className="w-5 h-5 stroke-[1.5]" /> : <Plus className="w-5 h-5 stroke-[1.5]" />}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 text-[16px] text-[#717171] leading-relaxed pr-12">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CategoryCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any, title: string, description: string, delay?: number }) => (
    <FadeIn delay={delay}>
        <Link href="#" className="block h-full p-8 rounded-2xl border border-[#DDDDDD] bg-white hover:shadow-md transition-shadow duration-200 group">
            <Icon className="w-8 h-8 text-[#222222] mb-6 stroke-[1.5]" />
            <h3 className="text-[18px] font-semibold text-[#222222] mb-2">{title}</h3>
            <p className="text-[15px] text-[#717171] leading-relaxed">{description}</p>
        </Link>
    </FadeIn>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SupportPage() {
    const categories = [
        { icon: BookOpen, title: "Getting started", description: "Learn the basics of HoroHouse, from creating your account to your first property search." },
        { icon: User, title: "Account & profile", description: "Manage your personal information, security settings, and professional agent profile." },
        { icon: CreditCard, title: "Payments & billing", description: "Understanding our subscription plans, processing payments, and managing invoices." },
        { icon: Home, title: "Listing properties", description: "A complete guide on how to list, verify, and promote your properties effectively." },
    ];

    const faqs = [
        { question: "How does property verification work?", answer: "Every property listed on HoroHouse undergoes a rigorous verification process. Our team checks land titles, owner identity, and performs on-ground inspections where possible to ensure listing authenticity." },
        { question: "Is HoroHouse free for buyers?", answer: "Yes, browsing and searching for properties on HoroHouse is completely free for individual buyers and renters. We only charge for premium agent subscriptions and value-added services." },
        { question: "How do I contact a property owner or agent?", answer: "Each property detail page has a 'Contact Host' or 'Message Agent' button. You can send an inquiry directly through our platform, or use the listed phone number to contact them." },
        { question: "Can I list my property from the diaspora?", answer: "Absolutely. HoroHouse is designed to bridge the gap for the African diaspora. You can manage your listings, view analytics, and engage with agents from anywhere in the world." },
    ];

    return (
        <main className="min-h-screen bg-white text-[#222222] selection:blue-blue-600 selection:text-white font-sans pb-20">

            {/* ── Hero Header ── */}
            <section className="pt-32 pb-24 px-6 md:px-12 border-b border-[#DDDDDD] bg-[#F7F7F7]">
                <div className="max-w-4xl mx-auto text-center">
                    <FadeIn>
                        <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tight text-[#222222] mb-12">
                            Hi, how can we help?
                        </h1>

                        {/* Big Search Bar */}
                        <div className="relative max-w-2xl mx-auto group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#222222] stroke-[2]" />
                            <input
                                type="text"
                                placeholder="Search for help articles..."
                                className="w-full pl-16 pr-6 py-5 rounded-full bg-white border border-[#DDDDDD] text-[#222222] placeholder:text-[#717171] focus:outline-none focus:ring-2 focus:ring-[#222222] transition-shadow shadow-sm hover:shadow-md text-[16px] font-medium"
                            />
                        </div>

                        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[14px] text-[#717171]">
                            <span className="font-medium text-[#222222]">Popular:</span>
                            <a href="#" className="underline hover:text-[#222222]">Verification process</a>
                            <a href="#" className="underline hover:text-[#222222]">Cancellation policies</a>
                            <a href="#" className="underline hover:text-[#222222]">Listing fees</a>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── Categories Grid ── */}
            <section className="py-16 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <FadeIn>
                        <h2 className="text-[26px] font-semibold text-[#222222] mb-8">Browse topics</h2>
                    </FadeIn>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat, i) => (
                            <CategoryCard key={i} {...cat} delay={i * 0.1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ Section ── */}
            <section className="py-16 px-6 md:px-12 border-t border-[#DDDDDD]">
                <div className="max-w-3xl mx-auto">
                    <FadeIn className="mb-10">
                        <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">Frequently asked questions</h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="border-t border-[#DDDDDD]">
                            {faqs.map((faq, i) => (
                                <FAQItem key={i} {...faq} />
                            ))}
                        </div>
                        <div className="mt-8">
                            <Link href="#" className="inline-flex items-center text-[16px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors">
                                View all FAQs <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── Contact Section ── */}
            <section className="py-16 px-6 md:px-12 border-t border-[#DDDDDD] bg-[#F7F7F7]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <FadeIn>
                            <h2 className="text-[32px] font-semibold text-[#222222] mb-4 tracking-tight leading-tight">
                                Need more help?
                            </h2>
                            <p className="text-[#717171] text-[18px] mb-8 leading-relaxed">
                                If you couldn't find the answer to your question, our support team is available to assist you.
                            </p>

                            <div className="space-y-4">
                                <a href="#" className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-[#DDDDDD] hover:border-blue-600 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center text-[#222222] shrink-0">
                                        <MessageCircle className="w-5 h-5 stroke-[1.5]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[16px] text-[#222222]">Live Chat</h4>
                                        <p className="text-[14px] text-[#717171]">Typically responds within 5 minutes</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#717171] ml-auto group-hover:text-[#222222] transition-colors" />
                                </a>

                                <a href="mailto:support@horohouse.com" className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-[#DDDDDD] hover:border-blue-600 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center text-[#222222] shrink-0">
                                        <Mail className="w-5 h-5 stroke-[1.5]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[16px] text-[#222222]">Send an email</h4>
                                        <p className="text-[14px] text-[#717171]">Response within 24 hours</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#717171] ml-auto group-hover:text-[#222222] transition-colors" />
                                </a>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.2} className="hidden md:flex justify-center">
                            <div className="w-full max-w-sm aspect-square rounded-full bg-[#EBEBEB] flex flex-col items-center justify-center border border-[#DDDDDD]">
                                <LifeBuoy className="w-16 h-16 text-[#222222] stroke-[1] mb-6" />
                                <span className="text-[20px] font-semibold text-[#222222]">Always here for you</span>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

        </main>
    );
}