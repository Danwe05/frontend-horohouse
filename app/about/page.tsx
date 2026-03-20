"use client";

import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Shield, Globe, Users, TrendingUp, Building, Lock, Search, FileWarning, AlertTriangle, Clock, TrendingDown, Ban, LayoutDashboard, Home, BarChart3, Rocket, Handshake, MapPin, Mail, Sparkles, Briefcase, GraduationCap, Building2, Lightbulb, Plane, CheckSquare } from "lucide-react";
import Image from "next/image";

// Reusable components (can be moved to separate files later)
const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
    <section id={id} className={`py-20 px-4 md:px-8 max-w-7xl mx-auto w-full ${className}`}>
        {children}
    </section>
);

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
            hidden: { opacity: 0, y: 30 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay, ease: "easeOut" }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
            {/* 1. Hero Section */}
            <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-blue-950 text-white">
                <div className="absolute inset-0 z-0 opacity-30">
                    {/* Placeholder for Hero Image - using a pattern or abstract shape for now if no image provided */}
                    <div className="absolute inset-0 bg-blue-950" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3)_0,rgba(0,0,0,0)_100%)]" />
                </div>

                <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
                    <FadeIn>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                            Reinventing Real Estate <br className="hidden md:block" /> in Africa
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                            We are building Africa’s most trusted digital real estate platform, making property transactions transparent, secure, and accessible for everyone.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.4}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button className="px-8 py-4 bg-white text-blue-950 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center gap-2 group shadow-lg shadow-blue-900/20">
                                Explore Verified Properties
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-blue-600" />
                            </button>
                            <button className="px-8 py-4 bg-transparent border border-blue-400/30 text-white rounded-full font-semibold text-lg hover:bg-blue-900/50 transition-colors">
                                Partner with us
                            </button>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* 2. Who We Are */}
            <Section className="bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <FadeIn>
                        <div className="relative h-[400px] md:h-[500px] bg-neutral-100 rounded-2xl overflow-hidden shadow-xl">
                            {/* Image Placeholder */}
                            <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center text-neutral-400">
                                <Building className="w-20 h-20 opacity-20" />
                                <span className="sr-only">Office building or Team working</span>
                            </div>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-blue-950">Who We Are</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            HoroHouse is a proptech startup focused on transforming how people buy, sell, and rent property in Africa.
                        </p>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Starting in Cameroon, we combine technology, data, and local expertise to eliminate fraud, simplify transactions, and restore trust in real estate. We serve everyone from first-time homebuyers to large-scale investors.
                        </p>
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold text-blue-600">Cameroon</span>
                                <span className="text-sm text-slate-500 uppercase tracking-wider">Starting Market</span>
                            </div>
                            <div className="w-px bg-slate-200 mx-4"></div>
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold text-blue-600">Africa</span>
                                <span className="text-sm text-slate-500 uppercase tracking-wider">Target Region</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* 3. The Problem */}
            <Section className="bg-slate-50 relative overflow-hidden">
                {/* Background blobs/decorations could go here */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <FadeIn>
                        <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">The Challenge</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6 text-blue-950">Why Real Estate Needed a Change</h2>
                        <p className="text-lg text-slate-600">
                            The traditional market is plagued by inefficiencies that hurt buyers, sellers, and the economy.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: FileWarning,
                            title: "Land Title Fraud",
                            desc: "Document falsification and multiple sales of the same property.",
                            image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: AlertTriangle,
                            title: "Unverified Listings",
                            desc: "Misleading information and fake property posts.",
                            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Clock,
                            title: "Slow Processes",
                            desc: "Manual, opaque, and time-consuming paperwork.",
                            image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: TrendingDown,
                            title: "Lack of Data",
                            desc: "No data-driven pricing, leading to speculation.",
                            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Ban,
                            title: "Limited Access",
                            desc: "Difficulties for diaspora and international investors.",
                            image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=600"
                        },
                    ].map((item, index) => (
                        <FadeIn key={index} delay={index * 0.1}>
                            <div className="group relative overflow-hidden rounded-2xl shadow-lg h-80 transition-all hover:-translate-y-2 hover:shadow-2xl">
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-blue-950/70 group-hover:bg-blue-900/60 transition-colors" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="relative h-full p-8 flex flex-col justify-end text-white z-10">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                                        <item.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-blue-100 text-sm leading-relaxed opacity-90">{item.desc}</p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 4. Our Solution */}
            <Section className="bg-blue-950 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm">Our Solution</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6">The All-In-One Ecosystem</h2>
                        <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                            HoroHouse is an all-in-one digital real estate platform that uses technology and artificial intelligence to verify properties, secure documents, and connect buyers, sellers, agents, and investors in one trusted ecosystem.
                        </p>

                        <ul className="space-y-4">
                            {[
                                "AI-Powered Verification",
                                "Secure Digital Records",
                                "Trusted Network of Agents",
                                "Remote Investment Tools"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    <span className="text-lg font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-10">
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-3 bg-white text-blue-950 rounded-full font-semibold hover:bg-blue-50 transition-colors"
                            >
                                See how it works
                            </button>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2} className="relative">
                        {/* Solution Graphic Placeholder */}
                        <div className="relative aspect-square md:aspect-[4/3] rounded-2xl border  p-8 flex flex-col justify-center items-center">
                         
                            <Image
                                src="/ui.PNG"
                                alt="Dashboard preview"
                                fill
                                className="object-cover rounded-2xl opacity-20"
                            />
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* 4.5 How It Works */}
            <Section className="bg-slate-50 relative overflow-hidden" id="how-it-works">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05)_0,rgba(255,255,255,0)_50%)] pointer-events-none" />

                <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
                    <FadeIn>
                        <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Process</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6 text-blue-950">How It Works</h2>
                        <p className="text-lg text-slate-600">
                            From discovery to ownership, we&apos;ve engineered a simple, transparent journey.
                        </p>
                    </FadeIn>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                step: "01",
                                title: "Search & Verify",
                                desc: "Browse our extensive database of verified properties. Our AI checks ensure every listing is authentic and fraud-free.",
                                icon: Search,
                            },
                            {
                                step: "02",
                                title: "Connect & View",
                                desc: "Schedule visits or take immersive 3D tours. Speak directly with vetted agents and get real answers in real-time.",
                                icon: Users,
                            },
                            {
                                step: "03",
                                title: "Secure & Own",
                                desc: "Complete your purchase with confidence. We handle the legal verification, secure payments, and title transfer.",
                                icon: Shield,
                            }
                        ].map((item, idx) => (
                            <FadeIn key={idx} delay={idx * 0.2} className="relative group">
                                {/* Connector Line */}
                                {idx !== 2 && (
                                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-slate-50 -z-10" />
                                )}

                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl font-bold font-serif leading-none select-none text-blue-900">
                                        {item.step}
                                    </div>

                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                        <item.icon className="w-8 h-8 text-blue-600" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-blue-950 mb-4">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </Section>

            {/* 5. What We Offer (Key Features) */}
            <Section className="bg-white">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <FadeIn>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-blue-950">What We Offer</h2>
                        <p className="text-lg text-slate-600">
                            Key features that make HoroHouse the platform of choice.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            icon: CheckCircle,
                            title: "Verified Listings",
                            desc: "Authentic listings you can trust.",
                            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Lock,
                            title: "Secure Records",
                            desc: "Tamper-proof documentation.",
                            image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: TrendingUp,
                            title: "AI Estimation",
                            desc: "Fair market value analysis.",
                            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Search,
                            title: "Fraud Detection",
                            desc: "Advanced security protocols.",
                            image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Home,
                            title: "All-in-One Platform",
                            desc: "Seamless property transactions.",
                            image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Globe,
                            title: "Remote Access",
                            desc: "Invest from anywhere.",
                            image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: Users,
                            title: "Pro Tools",
                            desc: "Professional suite of tools.",
                            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600"
                        },
                        {
                            icon: BarChart3,
                            title: "Market Insights",
                            desc: "Data-driven decision making.",
                            image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600"
                        },
                    ].map((feature, idx) => (
                        <FadeIn key={idx} delay={idx * 0.05}>
                            <div className="group relative overflow-hidden rounded-2xl h-64 border border-neutral-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <Image
                                        src={feature.image}
                                        alt={feature.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-blue-950/60 group-hover:bg-blue-900/50 transition-colors" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/40 to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="relative h-full p-6 flex flex-col justify-end text-white z-10">
                                    <div className="mb-auto opacity-0 group-hover:opacity-100 transform -translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        <feature.icon className="w-8 h-8 text-white/80" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">{feature.title}</h3>
                                        <p className="text-sm text-blue-100 leading-snug group-hover:text-white transition-colors">{feature.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 6, 7. Mission & Vision */}
            <Section className="bg-blue-950 text-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-900 hidden md:block" />

                    <FadeIn className="flex flex-col justify-center text-center md:text-right md:pr-12">
                        <h3 className="text-blue-400 font-semibold uppercase tracking-wider mb-4">Our Mission</h3>
                        <p className="text-2xl md:text-4xl font-bold leading-tight">
                            To make real estate transactions in Africa safe, transparent, and accessible through smart technology.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.2} className="flex flex-col justify-center text-center md:text-left md:pl-12">
                        <h3 className="text-blue-400 font-semibold uppercase tracking-wider mb-4">Our Vision</h3>
                        <p className="text-2xl md:text-4xl font-bold leading-tight">
                            To become Africa’s leading intelligent and secure real estate platform, redefining trust in property ownership.
                        </p>
                    </FadeIn>
                </div>
            </Section>

            {/* 8. Our Values */}
            <Section className="bg-slate-50 relative">
                <div className="text-center mb-16">
                    <FadeIn>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-blue-950">Our Values</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            The core principles that guide every decision we make and every product we build.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Search, title: "Transparency", desc: "No hidden fees, no ambiguous processes. We believe in complete openness in every transaction." },
                        { icon: Shield, title: "Security", desc: "We employ banking-grade security protocols to protect your assets, data, and future." },
                        { icon: Rocket, title: "Innovation", desc: "We are constantly pushing boundaries to solve old problems with specific, new technology." },
                        { icon: Handshake, title: "Integrity", desc: "We do the right thing, even when no one is watching. Trust is our currency." },
                        { icon: Globe, title: "Inclusion", desc: "Democratizing access to real estate wealth for everyone, regardless of location." },
                        { icon: TrendingUp, title: "Impact", desc: "We measure success not just by profit, but by the positive change we bring to African cities." },
                    ].map((value, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1}>
                            <div className="group h-full bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 group-hover:bg-blue-600/10" />

                                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 relative z-10">
                                    <value.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-blue-950 group-hover:text-blue-700 transition-colors">{value.title}</h3>
                                <p className="text-slate-600 leading-relaxed group-hover:text-slate-700">
                                    {value.desc}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 9. Why HoroHouse is Different & 10. Our Impact */}
            <Section className="bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Different */}
                    <FadeIn>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-yellow-500" />
                            Why We Are Different
                        </h3>
                        <ul className="space-y-6">
                            {[
                                { title: "Built for Africa", desc: "Solutions tailored to local realities, not copy-pasted from elsewhere." },
                                { title: "Verification First", desc: "We prioritize safety above all else. No transaction happens without checks." },
                                { title: "Tech + Local", desc: "Combining advanced AI with on-ground experts." }
                            ].map((item, idx) => (
                                <li key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                    <h4 className="font-bold text-lg mb-1 text-blue-950">{item.title}</h4>
                                    <p className="text-slate-600">{item.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </FadeIn>

                    {/* Impact */}
                    <FadeIn delay={0.2}>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                            Our Impact
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { icon: Briefcase, title: "Job Creation", desc: "Empowering agents and professionals." },
                                { icon: Building2, title: "Urban Dev", desc: "Sustainable city growth." },
                                { icon: Shield, title: "Confidence", desc: "Attracting global investors." },
                                { icon: Users, title: "Empowerment", desc: "Helping families own homes." }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-blue-950 text-white p-6 rounded-xl shadow-lg shadow-blue-900/10">
                                    <item.icon className="w-8 h-8 mb-4 text-blue-400" />
                                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                    <p className="text-sm text-blue-100">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* 11. Who We Serve */}
            <Section className="bg-neutral-50">
                <div className="text-center mb-12">
                    <FadeIn>
                        <h2 className="text-3xl font-bold mb-4">Who We Serve</h2>
                    </FadeIn>
                </div>
                <FadeIn>
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            "Individuals & Families",
                            "Real Estate Agents",
                            "Property Developers",
                            "Investors",
                            "African Diaspora",
                            "Financial Institutions"
                        ].map((item, idx) => (
                            <span key={idx} className="px-6 py-3 bg-white rounded-full border border-neutral-200 shadow-sm text-lg font-medium text-neutral-700 hover:border-neutral-400 transition-colors cursor-default">
                                {item}
                            </span>
                        ))}
                    </div>
                </FadeIn>
            </Section>

            {/* 12. Our Team */}
            <Section className="bg-white">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <FadeIn>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-blue-950">Meet The Team</h2>
                        <p className="text-lg text-slate-600">
                            Our team is made up of passionate technologists, real estate professionals, and innovators committed to building a safer property ecosystem in Africa.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            name: "Danwe Basga Kaokamla",
                            role: "Founder & CEO",
                            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=vformat&fit=crop&q=80&w=400",
                            bio: "Former Real Estate Investment Banker with a vision to digitize African property.",
                            socials: { linkedin: "#", twitter: "#" }
                        },
                        {
                            name: "Belaid Ilef",
                            role: "CTO",
                            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=vformat&fit=crop&q=80&w=400",
                            bio: "Tech veteran specializing in Blockchain and AI for secure transactions.",
                            socials: { linkedin: "#", twitter: "#" }
                        },
                        {
                            name: "Kouedjou Marcel",
                            role: "Head of Operations",
                            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=vformat&fit=crop&q=80&w=400",
                            bio: "Expert in Cameroonian land law and operational strategy.",
                            socials: { linkedin: "#", twitter: "#" }
                        },
                        {
                            name: "Mevo Hubert",
                            role: "Lead Agent",
                            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=vformat&fit=crop&q=80&w=400",
                            bio: "Connecting buyers with verified properties for over 10 years.",
                            socials: { linkedin: "#", twitter: "#" }
                        }
                    ].map((member, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1}>
                            <div className="group relative h-[400px] w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-lg transition-all hover:shadow-2xl">
                                {/* Image */}
                                <div className="absolute inset-0 h-full w-full">
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        fill
                                        className="object-cover grayscale transition-all duration-500 group-hover:scale-110 group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-blue-950/20 group-hover:bg-transparent transition-colors duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end h-full translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
                                        <p className="text-blue-400 font-medium tracking-wide uppercase text-xs mb-3">{member.role}</p>
                                        <div className="h-0.5 w-12 bg-blue-500 mb-3 group-hover:w-full transition-all duration-500" />
                                        <p className="text-blue-100 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 line-clamp-3">
                                            {member.bio}
                                        </p>
                                    </div>

                                    {/* Socials */}
                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                                        {Object.entries(member.socials).map(([social, link], i) => (
                                            <a
                                                key={i}
                                                href={link}
                                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all hover:-translate-y-1"
                                            >
                                                {social === 'linkedin' ? (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* 13. Journey / Roadmap */}
            <Section className="bg-slate-50 overflow-hidden relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
                </div>

                <div className="text-center mb-16 relative z-10">
                    <FadeIn>
                        <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Roadmap</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 text-blue-950">Our Journey</h2>
                    </FadeIn>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200 md:-translate-x-1/2" />

                    <div className="space-y-12">
                        {[
                            {
                                icon: Lightbulb,
                                title: "The Inception",
                                year: "Q1 2024",
                                desc: "Identifying the gap in the market. Conceptualizing a verified property ecosystem for Africa.",
                                status: "completed"
                            },
                            {
                                icon: LayoutDashboard,
                                title: "Platform Development",
                                year: "Q3 2024",
                                desc: "Building the core infrastructure. Integrating AI valuation and secure document verification.",
                                status: "completed"
                            },
                            {
                                icon: CheckCircle,
                                title: "Pilot Launch",
                                year: "Q1 2025",
                                desc: "Beta testing in Cameroon with select partners. Refining user experience based on real feedback.",
                                status: "current"
                            },
                            {
                                icon: Plane,
                                title: "Pan-African Expansion",
                                year: "2026+",
                                desc: "Scaling to Nigeria, Ghana, and Kenya. Becoming the standard for trusted real estate in Africa.",
                                status: "future"
                            }
                        ].map((step, idx) => (
                            <FadeIn key={idx} delay={idx * 0.1} className={`relative flex flex-col md:flex-row gap-8 items-start md:items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>

                                {/* Timeline Dot */}
                                <div className={`absolute left-4 md:left-1/2 -translate-x-1/2 top-8 md:top-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center ${step.status === 'completed' ? 'bg-blue-600' : step.status === 'current' ? 'bg-white ring-4 ring-blue-200' : 'bg-slate-200'}`}>
                                    {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
                                    {step.status === 'current' && <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />}
                                </div>

                                {/* Content Card */}
                                <div className={`ml-12 md:ml-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
                                        <div className={`inline-flex items-center gap-2 mb-2 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${step.status === 'completed' ? 'bg-green-100 text-green-700' : step.status === 'current' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {step.year}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-blue-950 mb-2 group-hover:text-blue-600 transition-colors">{step.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Empty space for the other side */}
                                <div className="hidden md:block md:w-1/2" />
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </Section>

            {/* 14. Trust & Compliance */}
            <Section className="bg-white">
                <div className="bg-blue-950 rounded-3xl p-8 md:p-16 text-white text-center relative overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Shield className="w-64 h-64 text-white" />
                    </div>

                    <FadeIn>
                        <Shield className="w-16 h-16 mx-auto mb-6 text-blue-400" />
                        <h2 className="text-3xl font-bold mb-6">Trust & Compliance</h2>
                        <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
                            We adhere to the highest standards of data protection and comply with all local real estate laws to ensure your peace of mind.
                        </p>
                        <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold text-blue-300 uppercase tracking-widest">
                            <span>Data Protection</span>
                            <span>•</span>
                            <span>Local Compliance</span>
                            <span>•</span>
                            <span>Ethical Standards</span>
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* 15. CTA */}
            <section className="py-24 px-4 bg-slate-50 text-center">
                <FadeIn>
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-blue-950 tracking-tight">
                        Ready to experience the future <br /> of real estate?
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button className="px-10 py-5 bg-blue-600 text-white rounded-full font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 hover:shadow-xl transform hover:-translate-y-1 transition-all">
                            Join HoroHouse Today
                        </button>
                    </div>
                </FadeIn>
            </section>

            {/* 16. Contact */}
            


        </main>
    );
}
