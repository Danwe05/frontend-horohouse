"use client";

import { useState } from "react";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    BookOpen,
    User,
    CreditCard,
    Home,
    MessageCircle,
    Mail,
    ChevronDown,
    Plus,
    Minus,
    ArrowRight,
    LifeBuoy,
    ShieldQuestion,
    Headphones,
    CheckCircle2,
    ChevronRight
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

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-200 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group transition-all"
            >
                <span className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 text-slate-600 leading-relaxed pr-12">
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
        <div className="group p-8 rounded-[32px] bg-white border border-slate-200/60 -[0_8px_30px_rgb(0,0,0,0.04)] hover:-[0_20px_50px_rgba(59,130,246,0.1)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden flex flex-col h-full">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-800 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 -sm group-hover:-blue-200">
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">{description}</p>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm group-hover:text-blue-600 transition-colors">
                Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </FadeIn>
);

export default function SupportPage() {
    const categories = [
        { icon: BookOpen, title: "Getting Started", description: "Learn the basics of HoroHouse, from creating your account to your first property search." },
        { icon: User, title: "Account & Profiles", description: "Manage your personal information, security settings, and professional agent profile." },
        { icon: CreditCard, title: "Payments & Billing", description: "Understanding our subscription plans, processing payments, and managing invoices." },
        { icon: Home, title: "Listing Properties", description: "A complete guide on how to list, verify, and promote your properties effectively." },
    ];

    const faqs = [
        { question: "How does property verification work?", answer: "Every property listed on HoroHouse undergoes a rigorous verification process. Our team checks land titles, owner identity, and performs on-ground inspections where possible to ensure listing authenticity." },
        { question: "Is HoroHouse free for buyers?", answer: "Yes, browsing and searching for properties on HoroHouse is completely free for individual buyers and renters. We only charge for premium agent subscriptions and value-added services." },
        { question: "How do I contact a property owner or agent?", answer: "Each property detail page has a 'Contact Agent' button. You can send an inquiry directly through our platform, or use the listed phone number to contact them via call or WhatsApp." },
        { question: "Can I list my property from the diaspora?", answer: "Absolutely. HoroHouse is designed to bridge the gap for the African diaspora. You can manage your listings, view analytics, and engage with agents from anywhere in the world." },
    ];

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Hero Header */}
            <section className="relative pt-40 pb-32 px-4 md:px-8 bg-blue-950 text-white overflow-hidden text-center">
                <div className="max-w-4xl mx-auto relative z-10">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-8 border border-blue-500/20">
                            <LifeBuoy className="w-3.5 h-3.5" />
                            Support Center
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.9]">
                            How can we <br className="hidden md:block" /> help you?
                        </h1>
                        <div className="max-w-2xl mx-auto relative group">
                            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search resources, guides, or FAQs..."
                                className="w-full pl-16 pr-8 py-7 rounded-[32px] bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-8 focus:ring-blue-500/10 transition-all text-xl -2xl -black/20"
                            />
                        </div>
                        <div className="mt-8 flex justify-center flex-wrap gap-4 text-sm text-blue-200/70">
                            <span>Popular:</span>
                            <a href="#" className="hover:text-white underline underline-offset-4 decoration-blue-500/50">Verification Process</a>
                            <a href="#" className="hover:text-white underline underline-offset-4 decoration-blue-500/50">Subscription Plans</a>
                            <a href="#" className="hover:text-white underline underline-offset-4 decoration-blue-500/50">Listing Fees</a>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto -mt-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat, i) => (
                        <CategoryCard key={i} {...cat} delay={i * 0.1} />
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-4 md:px-8 bg-white border-y border-slate-100">
                <div className="max-w-4xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Frequently Asked Questions</h2>
                        <p className="text-slate-500 text-lg">Everything you need to know about the platform and property transactions.</p>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="bg-slate-50/50 rounded-[40px] p-8 md:p-12 border border-slate-100">
                            {faqs.map((faq, i) => (
                                <FAQItem key={i} {...faq} />
                            ))}
                        </div>
                        <div className="mt-12 text-center">
                            <button className="px-8 py-4 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto">
                                View all FAQs
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
                            Couldn't find what <br /> you were looking for?
                        </h2>
                        <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-md">
                            Our support team is available 24/7 to help you with any technical issues, billing questions, or property disputes.
                        </p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-6 rounded-3xl bg-white border border-slate-100 -sm">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Live Chat & WhatsApp</h4>
                                    <p className="text-sm text-slate-500">Instant response from our team.</p>
                                </div>
                                <button className="ml-auto px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors">Chat Now</button>
                            </div>
                            <div className="flex items-center gap-4 p-6 rounded-3xl bg-white border border-slate-100 -sm">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Email Support</h4>
                                    <p className="text-sm text-slate-500">Response within 24 hours.</p>
                                </div>
                                <a href="mailto:support@horohouse.com" className="ml-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold hover:bg-slate-50 transition-colors">Send Email</a>
                            </div>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.2} className="relative">
                        <div className="relative aspect-square md:aspect-[4/3] rounded-[40px] overflow-hidden -2xl">
                            {/* This would be an illustration or a clean photo of support team */}
                            <div className="absolute inset-0 bg-blue-600 flex items-center justify-center text-white">
                                <div className="text-center p-12">
                                    <Headphones className="w-24 h-24 mx-auto mb-6 opacity-20" />
                                    <h3 className="text-2xl font-bold mb-4">Dedicated Support Center</h3>
                                    <div className="flex justify-center gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black">98%</span>
                                            <span className="text-xs uppercase tracking-widest opacity-70">Satisfaction</span>
                                        </div>
                                        <div className="w-px h-12 bg-white/20" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black">&lt;2h</span>
                                            <span className="text-xs uppercase tracking-widest opacity-70">Avg response</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Floating badges */}
                            <div className="absolute top-8 left-8 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-white -xl flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-bold text-slate-900">Verified Support</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Trust Quote */}
            <section className="py-24 bg-blue-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <ShieldQuestion className="w-64 h-64" />
                </div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <FadeIn>
                        <h2 className="text-3xl md:text-5xl font-bold italic mb-8 tracking-tight">
                            "Our goal is to make every property transaction as clear as the African sky."
                        </h2>
                        <div className="w-16 h-1 bg-blue-400 mx-auto rounded-full mb-6" />
                        <p className="text-blue-200 uppercase tracking-widest text-xs font-bold">The HoroHouse Philosophy</p>
                    </FadeIn>
                </div>
            </section>


        </main>
    );
}
