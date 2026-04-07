"use client";

import { motion } from "framer-motion";
import {
    ArrowRight, CheckCircle2, ShieldCheck, Globe, Users,
    TrendingUp, Building, Lock, Search, AlertCircle, Clock,
    Ban, Home, BarChart3, MapPin, Mail, Phone,
    Briefcase, Building2, Lightbulb, Plane,
    FileWarning,
    TrendingDown
} from "lucide-react";
import Image from "next/image";

// ─── Reusable Components ──────────────────────────────────────────────────────

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
    <section id={id} className={`py-24 px-6 md:px-12 max-w-[1440px] mx-auto w-full ${className}`}>
        {children}
    </section>
);

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white text-[#222222] overflow-hidden font-sans selection:blue-blue-600 selection:text-white pb-20">

            {/* 1. Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-[1440px] mx-auto text-center flex flex-col items-center">
                <FadeIn className="max-w-4xl">
                    <h1 className="text-[48px] md:text-[72px] font-semibold tracking-tight leading-[1.05] text-[#222222] mb-6">
                        Reinventing real estate <br className="hidden md:block" /> in Africa.
                    </h1>
                </FadeIn>

                <FadeIn delay={0.1} className="max-w-2xl">
                    <p className="text-[18px] md:text-[22px] text-[#717171] mb-10 leading-relaxed font-normal">
                        Whether you want to buy a home, sign a long-term lease, or book a short-term stay, we are building Africa’s most trusted digital platform to make property transactions transparent, secure, and accessible.
                    </p>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[16px] transition-colors flex items-center gap-2">
                            Explore verified properties
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="px-8 py-4 bg-white border border-blue-600 text-[#222222] rounded-lg font-semibold text-[16px] hover:bg-[#F7F7F7] transition-colors">
                            Partner with us
                        </button>
                    </div>
                </FadeIn>
            </section>

            {/* 2. Who We Are */}
            <Section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <FadeIn>
                        <div className="relative h-[400px] md:h-[500px] bg-[#F7F7F7] rounded-2xl overflow-hidden border border-[#DDDDDD]">
                            <Image
                                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800"
                                alt="Modern African Architecture"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <h2 className="text-[32px] md:text-[40px] font-semibold mb-6 tracking-tight text-[#222222]">Who we are</h2>
                        <p className="text-[18px] text-[#717171] mb-6 leading-relaxed">
                            HoroHouse is a proptech startup focused on transforming how people buy, sell, rent, and book short-term stays in Africa.
                        </p>
                        <p className="text-[16px] text-[#717171] mb-10 leading-relaxed">
                            Starting in Cameroon, we combine technology, data, and local expertise to eliminate fraud, simplify transactions, and restore trust in real estate. We serve everyone from weekend travelers to large-scale investors.
                        </p>
                        <div className="flex gap-10 border-t border-[#DDDDDD] pt-8">
                            <div className="flex flex-col">
                                <span className="text-[32px] font-semibold text-[#222222]">Cameroon</span>
                                <span className="text-[14px] text-[#717171] font-medium">Starting market</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[32px] font-semibold text-[#222222]">Africa</span>
                                <span className="text-[14px] text-[#717171] font-medium">Target region</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* 3. The Problem */}
            <Section className="bg-[#F7F7F7] rounded-3xl">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <FadeIn>
                        <h2 className="text-[32px] md:text-[40px] font-semibold mb-4 tracking-tight text-[#222222]">Why real estate needed a change</h2>
                        <p className="text-[18px] text-[#717171]">
                            The traditional market is plagued by inefficiencies that hurt buyers, renters, and the economy.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: FileWarning,
                            title: "Land title fraud",
                            desc: "Document falsification and multiple sales of the same property create immense risk.",
                        },
                        {
                            icon: AlertCircle,
                            title: "Unverified listings",
                            desc: "Misleading information and fake property posts waste time and money.",
                        },
                        {
                            icon: Clock,
                            title: "Slow processes",
                            desc: "Manual, opaque, and time-consuming paperwork delays moving and investing.",
                        },
                        {
                            icon: TrendingDown,
                            title: "Lack of data",
                            desc: "No data-driven pricing leads to massive speculation and unfair rates.",
                        },
                        {
                            icon: Ban,
                            title: "Limited access",
                            desc: "Difficulties for the diaspora and international investors to safely secure property.",
                        },
                    ].map((item, index) => (
                        <FadeIn key={index} delay={index * 0.1}>
                            <div className="bg-white p-8 rounded-2xl h-full border border-[#DDDDDD]">
                                <item.icon className="w-8 h-8 text-[#222222] mb-6 stroke-[1.5]" />
                                <h3 className="text-[20px] font-semibold mb-2 text-[#222222]">{item.title}</h3>
                                <p className="text-[16px] text-[#717171] leading-relaxed">{item.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 4. How It Works */}
            <Section id="how-it-works">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <FadeIn>
                        <h2 className="text-[32px] md:text-[40px] font-semibold mb-4 tracking-tight text-[#222222]">How it works</h2>
                        <p className="text-[18px] text-[#717171]">
                            From discovery to ownership or check-in, we've engineered a simple, transparent journey.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        {
                            step: "1",
                            title: "Search & verify",
                            desc: "Browse our extensive database of verified properties. Our checks ensure every listing is authentic and fraud-free, whether you're booking a weekend stay or buying a home.",
                            icon: Search,
                        },
                        {
                            step: "2",
                            title: "Connect & view",
                            desc: "Schedule visits or take immersive 3D tours. Speak directly with vetted agents and hosts to get real answers in real-time.",
                            icon: Users,
                        },
                        {
                            step: "3",
                            title: "Secure & transact",
                            desc: "Complete your transaction with confidence. We handle the legal verification, secure payments, and title transfers or booking confirmations.",
                            icon: ShieldCheck,
                        }
                    ].map((item, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1} className="relative">
                            <div className="flex flex-col h-full">
                                <div className="w-12 h-12 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl flex items-center justify-center mb-6">
                                    <span className="text-[16px] font-semibold text-[#222222]">{item.step}</span>
                                </div>
                                <h3 className="text-[22px] font-semibold text-[#222222] mb-3">{item.title}</h3>
                                <p className="text-[16px] text-[#717171] leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 5. What We Offer */}
            <Section className="border-t border-[#DDDDDD]">
                <div className="mb-16">
                    <FadeIn>
                        <h2 className="text-[32px] md:text-[40px] font-semibold mb-4 tracking-tight text-[#222222]">What we offer</h2>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {[
                        { icon: CheckCircle2, title: "Verified listings", desc: "Authentic homes, rentals, and short-term stays you can trust." },
                        { icon: Lock, title: "Secure records", desc: "Tamper-proof documentation and transparent history." },
                        { icon: TrendingUp, title: "Smart pricing", desc: "Fair market value analysis and data-driven rates." },
                        { icon: ShieldCheck, title: "Fraud protection", desc: "Advanced security protocols for every transaction." },
                        { icon: Home, title: "All-in-one platform", desc: "Seamless transactions from search to signature." },
                        { icon: Globe, title: "Remote access", desc: "Invest or book stays from anywhere in the world safely." },
                        { icon: Users, title: "Pro tools", desc: "A professional suite of tools for agents and hosts." },
                        { icon: BarChart3, title: "Market insights", desc: "Data-driven decision making for smart investments." },
                    ].map((feature, idx) => (
                        <FadeIn key={idx} delay={idx * 0.05}>
                            <div className="flex flex-col">
                                <feature.icon className="w-8 h-8 text-[#222222] mb-4 stroke-[1.5]" />
                                <h3 className="text-[18px] font-semibold mb-2 text-[#222222]">{feature.title}</h3>
                                <p className="text-[15px] text-[#717171] leading-relaxed">{feature.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 6. Mission & Vision */}
            <Section className="bg-blue-600 text-white rounded-3xl my-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 py-12 px-6 lg:px-12">
                    <FadeIn>
                        <h3 className="text-[14px] font-semibold uppercase tracking-widest text-[#717171] mb-4">Our Mission</h3>
                        <p className="text-[28px] md:text-[36px] font-semibold leading-[1.2] tracking-tight">
                            To make real estate transactions in Africa safe, transparent, and accessible through smart technology.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h3 className="text-[14px] font-semibold uppercase tracking-widest text-[#717171] mb-4">Our Vision</h3>
                        <p className="text-[28px] md:text-[36px] font-semibold leading-[1.2] tracking-tight">
                            To become Africa’s leading intelligent and secure real estate platform, redefining trust in property ownership and stays.
                        </p>
                    </FadeIn>
                </div>
            </Section>

            {/* 7. Who We Serve & Impact */}
            <Section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <FadeIn>
                        <h2 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-8">Who we serve</h2>
                        <div className="flex flex-wrap gap-3">
                            {[
                                "Short-term guests", "Long-term tenants", "Home buyers",
                                "Real estate agents", "Property developers", "Investors",
                                "The African Diaspora", "Financial institutions"
                            ].map((item, idx) => (
                                <span key={idx} className="px-5 py-2.5 bg-white rounded-full border border-[#DDDDDD] text-[15px] font-medium text-[#222222]">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h2 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-8">Our impact</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {[
                                { icon: Briefcase, title: "Job creation", desc: "Empowering agents, hosts, and local professionals." },
                                { icon: Building2, title: "Urban dev", desc: "Encouraging sustainable and transparent city growth." },
                                { icon: ShieldCheck, title: "Confidence", desc: "Attracting global investors with verifiable data." },
                                { icon: Users, title: "Empowerment", desc: "Helping families safely rent, host, or own homes." }
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <item.icon className="w-6 h-6 mb-3 text-[#222222] stroke-[1.5]" />
                                    <h4 className="font-semibold text-[16px] mb-1 text-[#222222]">{item.title}</h4>
                                    <p className="text-[15px] text-[#717171]">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* 8. Our Team */}
            <Section className="border-t border-[#DDDDDD]">
                <div className="mb-12">
                    <FadeIn>
                        <h2 className="text-[32px] md:text-[40px] font-semibold mb-4 tracking-tight text-[#222222]">Meet the team</h2>
                        <p className="text-[18px] text-[#717171] max-w-2xl">
                            Passionate technologists, real estate professionals, and innovators committed to building a safer property ecosystem.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            name: "Danwe Basga Kaokamla",
                            role: "Founder & CEO",
                            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=vformat&fit=crop&q=80&w=400",
                        },
                        {
                            name: "Belaid Ilef",
                            role: "CTO",
                            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=vformat&fit=crop&q=80&w=400",
                        },
                        {
                            name: "Kouedjou Marcel",
                            role: "Head of Operations",
                            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=vformat&fit=crop&q=80&w=400",
                        },
                        {
                            name: "Mevo Hubert",
                            role: "Lead Agent",
                            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=vformat&fit=crop&q=80&w=400",
                        }
                    ].map((member, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1}>
                            <div className="group flex flex-col">
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#F7F7F7] mb-4">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#222222]">{member.name}</h3>
                                <p className="text-[15px] text-[#717171]">{member.role}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 9. Roadmap */}
            <Section className="bg-[#F7F7F7] rounded-3xl">
                <div className="mb-16">
                    <FadeIn>
                        <h2 className="text-[32px] md:text-[40px] font-semibold tracking-tight text-[#222222]">Our journey</h2>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-[#DDDDDD]" />

                    {[
                        {
                            title: "The inception",
                            year: "Q1 2024",
                            desc: "Identifying the gap in the market. Conceptualizing a verified property ecosystem.",
                            active: false
                        },
                        {
                            title: "Platform dev",
                            year: "Q3 2024",
                            desc: "Building the core infrastructure and integrating secure document verification.",
                            active: false
                        },
                        {
                            title: "Pilot launch",
                            year: "Q1 2025",
                            desc: "Beta testing in Cameroon with select partners. Refining user experience.",
                            active: true
                        },
                        {
                            title: "Pan-African scale",
                            year: "2026+",
                            desc: "Scaling to Nigeria, Ghana, and Kenya. Becoming the trusted standard.",
                            active: false
                        }
                    ].map((step, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1} className="relative z-10">
                            <div className="flex flex-col">
                                <div className={`w-3 h-3 rounded-full mb-6 ${step.active ? 'blue-blue-600 ring-4 ring-[#FF385C]/20' : 'bg-[#DDDDDD]'} hidden md:block`} />
                                <span className="text-[13px] font-bold tracking-wider uppercase text-[#717171] mb-2">{step.year}</span>
                                <h3 className="text-[18px] font-semibold text-[#222222] mb-2">{step.title}</h3>
                                <p className="text-[15px] text-[#717171] leading-relaxed">{step.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 10. Contact & Support */}
            <Section id="contact" className="border-t border-[#DDDDDD]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    <FadeIn>
                        <h2 className="text-[32px] md:text-[40px] font-semibold mb-6 tracking-tight text-[#222222]">Get in touch</h2>
                        <p className="text-[18px] text-[#717171] mb-10 leading-relaxed">
                            Whether you are looking to buy your first home, book a vacation, invest from the diaspora, or partner with us, our team is here to guide you.
                        </p>

                        <div className="space-y-8">
                            {[
                                { icon: MapPin, title: "Headquarters", details: "Awae, Yaoundé, Cameroon" },
                                { icon: Mail, title: "Email us", details: "contact@horohouse.com" },
                                { icon: Phone, title: "Call support", details: "+237 695 451 646" },
                                { icon: Clock, title: "Business hours", details: "Mon - Fri: 8:00 AM - 6:00 PM" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <item.icon className="w-6 h-6 text-[#222222] stroke-[1.5]" />
                                    <div>
                                        <h4 className="font-semibold text-[16px] text-[#222222] mb-0.5">{item.title}</h4>
                                        <p className="text-[15px] text-[#717171]">{item.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="bg-white p-8 rounded-2xl border border-[#DDDDDD]">
                            <form className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[14px] font-semibold text-[#222222]">First name</label>
                                        <input type="text" className="w-full px-4 py-3.5 rounded-lg border border-[#DDDDDD] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors text-[15px]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[14px] font-semibold text-[#222222]">Last name</label>
                                        <input type="text" className="w-full px-4 py-3.5 rounded-lg border border-[#DDDDDD] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors text-[15px]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-[#222222]">Email address</label>
                                    <input type="email" className="w-full px-4 py-3.5 rounded-lg border border-[#DDDDDD] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors text-[15px]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-[#222222]">Message</label>
                                    <textarea rows={4} className="w-full px-4 py-3.5 rounded-lg border border-[#DDDDDD] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors resize-none text-[15px]"></textarea>
                                </div>
                                <button className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-[16px] hover:bg-blue-700 transition-colors mt-2">
                                    Send message
                                </button>
                            </form>
                        </div>
                    </FadeIn>
                </div>
            </Section>

        </main>
    );
}