'use client';

import { useState, useEffect } from 'react';
import { Search, Award, MapPin, Globe, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Footer from "@/components/footer";

// Animation Helper
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay, ease: "easeOut" }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [agentName, setAgentName] = useState('');
    const [cityFilter, setCityFilter] = useState<string>('');
    const [serviceType, setServiceType] = useState<string>('buying');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [specialty, setSpecialty] = useState<string>('all');
    const [language, setLanguage] = useState<string>('all');
    const [topAgentOnly, setTopAgentOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 12;

    useEffect(() => {
        fetchAgents();
    }, [page]);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getAgents({ page, limit });

            const mappedAgents = response.agents.map((agent: any) => ({
                ...agent,
                id: agent._id || agent.id,
            }));

            setAgents(mappedAgents);
            setTotal(response.total);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filteredAgents = agents.filter(agent => {
        const matchesName = !agentName ||
            agent.name.toLowerCase().includes(agentName.toLowerCase());
        const matchesCity = !cityFilter ||
            agent.city?.toLowerCase().includes(cityFilter.toLowerCase());
        const matchesTopAgent = !topAgentOnly || agent.totalProperties > 50;
        const matchesLanguage = language === 'all' ||
            agent.languages?.some(lang => lang.toLowerCase() === language.toLowerCase());
        const matchesSpecialty = specialty === 'all' ||
            agent.specialties?.some(spec => spec.toLowerCase().includes(specialty.toLowerCase()));

        return matchesName && matchesCity && matchesTopAgent && matchesLanguage && matchesSpecialty;
    });

    const handleSearch = () => {
        setPage(1);
        fetchAgents();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white pt-20">

            {/* Hero Section */}
            <section className="bg-blue-950 py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <FadeIn>
                        <Badge className="bg-blue-800 text-blue-100 hover:bg-blue-700 mb-6 px-4 py-1 text-sm border-0">
                            Our Experts
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            Find Your Trusted <span className="text-blue-400">Real Estate Partner</span>
                        </h1>
                        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            Connect with top-rated agents who understand your needs and the local market intimately.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Filter Section */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Search Row */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="City, neighborhood..."
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Agent Name..."
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-100"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                            >
                                Search
                            </Button>
                        </div>

                        {/* Filters Row */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-center">
                            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                                <button
                                    onClick={() => setServiceType('buying')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${serviceType === 'buying' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Buying
                                </button>
                                <button
                                    onClick={() => setServiceType('selling')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${serviceType === 'selling' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Selling
                                </button>
                            </div>

                            <div className="h-6 w-px bg-slate-200 mx-2 shrink-0" />

                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-[140px] h-9 text-sm bg-white border-slate-200 text-slate-700">
                                    <Globe className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                    <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Language</SelectItem>
                                    <SelectItem value="english">English</SelectItem>
                                    <SelectItem value="french">French</SelectItem>
                                    <SelectItem value="spanish">Spanish</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={specialty} onValueChange={setSpecialty}>
                                <SelectTrigger className="w-[150px] h-9 text-sm bg-white border-slate-200 text-slate-700">
                                    <Award className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                    <SelectValue placeholder="Specialty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Specialty</SelectItem>
                                    <SelectItem value="luxury">Luxury</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="residential">Residential</SelectItem>
                                </SelectContent>
                            </Select>

                            <button
                                onClick={() => setTopAgentOnly(!topAgentOnly)}
                                className={`h-9 px-4 rounded-md border text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${topAgentOnly
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                <Award className={`h-4 w-4 ${topAgentOnly ? 'fill-current' : ''}`} />
                                Top Rated
                            </button>

                            {(agentName || cityFilter || topAgentOnly || language !== 'all' || specialty !== 'all') && (
                                <button
                                    onClick={() => {
                                        setAgentName('');
                                        setCityFilter('');
                                        setTopAgentOnly(false);
                                        setLanguage('all');
                                        setSpecialty('all');
                                    }}
                                    className="text-sm text-slate-500 hover:text-red-500 ml-auto whitespace-nowrap font-medium transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {loading ? <Skeleton className="h-8 w-40" /> : `${filteredAgents.length} Agents Available`}
                        </h2>
                        <p className="text-slate-500 mt-1">Found matching your criteria</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <AgentCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No agents found</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">We couldn't find any agents matching your current filters. Try adjusting your search.</p>
                        <Button
                            onClick={() => {
                                setAgentName('');
                                setCityFilter('');
                                setTopAgentOnly(false);
                                setLanguage('all');
                                setSpecialty('all');
                            }}
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            Clear All Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAgents.map((agent, index) => (
                                <FadeIn key={agent.id} delay={index * 0.1}>
                                    <AgentCard agent={agent} />
                                </FadeIn>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-16 flex justify-center gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                                </Button>
                                <div className="flex gap-2">
                                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                        const pageNumber = i + 1;
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setPage(pageNumber)}
                                                className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${page === pageNumber
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                >
                                    Next <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </main>
    );
}

// Agent Card Component
function AgentCard({ agent }: { agent: Agent }) {
    const rating = 4.8 + (Math.random() * 0.4);
    const isTopAgent = agent.totalProperties > 50;

    return (
        <Link href={`/agents/${agent.id}`} className="block h-full">
            <div className="group h-full bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                            {agent.profilePicture ? (
                                <Image
                                    src={agent.profilePicture}
                                    alt={agent.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
                                    {agent.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {isTopAgent && (
                            <div className="absolute -bottom-2 -right-2 bg-amber-100 text-amber-700 p-1.5 rounded-full border-2 border-white shadow-sm" title="Top Agent">
                                <Award className="w-3 h-3" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                {agent.name}
                            </h3>
                            {isTopAgent && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        </div>
                        <p className="text-sm text-slate-500 truncate mb-2">{agent.agency || 'Independent Agent'}</p>

                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 inline-flex px-2 py-1 rounded-md">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {agent.city || 'Yaoundé'}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <p className="text-xl font-bold text-slate-800">{agent.activeProperties}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Active Listings</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                        <p className="text-xl font-bold text-blue-700">{agent.totalProperties}</p>
                        <p className="text-[10px] uppercase tracking-wider text-blue-600/70 font-semibold">Sold Properties</p>
                    </div>
                </div>

                {/* Footer / Languages */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex -space-x-2">
                        {agent.languages?.slice(0, 3).map((lang, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase" title={lang}>
                                {lang.charAt(0)}
                            </div>
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View Profile <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

function AgentCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 h-[300px] flex flex-col">
            <div className="flex items-start gap-4 mb-6">
                <Skeleton className="w-20 h-20 rounded-2xl" />
                <div className="flex-1 space-y-3 pt-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
            </div>
            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}