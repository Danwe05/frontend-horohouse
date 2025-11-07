// app/agents/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Award } from 'lucide-react';
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

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    // Extract unique cities from agents
    const cities = Array.from(new Set(agents.map(agent => agent.city).filter(Boolean))) as string[];

    useEffect(() => {
        fetchAgents();
    }, [page]);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getAgents({ page, limit });
            setAgents(response.agents);
            setTotal(response.total);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter agents
    const filteredAgents = agents.filter(agent => {
        const matchesCity = !cityFilter || agent.city?.toLowerCase().includes(cityFilter.toLowerCase());
        const matchesName = !agentName || agent.name.toLowerCase().includes(agentName.toLowerCase());
        
        return matchesCity && matchesName;
    });

    const handleSearch = () => {
        fetchAgents();
    };

    return (
        <div className="min-h-screen bg-white mt-12">
            {/* Search Section */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Search Inputs */}
                    <div className="flex gap-3 mb-6">
                        <Input
                            type="text"
                            placeholder="City, neighborhood, or zip code"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="flex-1 h-12 text-base border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                        />
                        <Input
                            type="text"
                            placeholder="Agent name"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            className="flex-1 h-12 text-base border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                        />
                        <Button 
                            onClick={handleSearch}
                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            <Search className="h-5 w-5 mr-2" />
                            Find agent
                        </Button>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex gap-2 border border-gray-300 rounded-md">
                            <button
                                onClick={() => setServiceType('buying')}
                                className={`px-6 py-2 font-medium transition-colors ${
                                    serviceType === 'buying' 
                                        ? 'bg-gray-100 text-gray-900' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Buying
                            </button>
                            <button
                                onClick={() => setServiceType('selling')}
                                className={`px-6 py-2 font-medium transition-colors ${
                                    serviceType === 'selling' 
                                        ? 'bg-gray-100 text-gray-900' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Selling
                            </button>
                        </div>

                        <button
                            onClick={() => setTopAgentOnly(!topAgentOnly)}
                            className={`px-6 py-2 border rounded-md font-medium transition-colors flex items-center gap-2 ${
                                topAgentOnly
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Award className="h-4 w-4 text-blue-600" />
                            Top agent
                        </button>

                        <Select value={priceRange} onValueChange={setPriceRange}>
                            <SelectTrigger className="w-[160px] border-gray-300">
                                <SelectValue placeholder="Price range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All prices</SelectItem>
                                <SelectItem value="0-500k">$0 - $500K</SelectItem>
                                <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                                <SelectItem value="1m-2m">$1M - $2M</SelectItem>
                                <SelectItem value="2m+">$2M+</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={specialty} onValueChange={setSpecialty}>
                            <SelectTrigger className="w-[160px] border-gray-300">
                                <SelectValue placeholder="Specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All specialties</SelectItem>
                                <SelectItem value="residential">Residential</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                                <SelectItem value="luxury">Luxury</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[160px] border-gray-300">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All languages</SelectItem>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="spanish">Spanish</SelectItem>
                                <SelectItem value="french">French</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Count */}
                <h2 className="text-2xl text-gray-700 mb-8">
                    {total.toLocaleString()} agents found
                </h2>

                {/* Agents Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <AgentCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Search className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
                                <p className="text-gray-600">Try adjusting your search criteria</p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredAgents.map((agent) => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="border-gray-300"
                                >
                                    Previous
                                </Button>
                                <div className="flex gap-1">
                                    {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                        <Button
                                            key={`page-${i + 1}`}
                                            variant={page === i + 1 ? "default" : "outline"}
                                            onClick={() => setPage(i + 1)}
                                            className={page === i + 1 ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="border-gray-300"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Agent Card Component matching Zillow style
function AgentCard({ agent }: { agent: Agent }) {
    // Mock rating - in real app this would come from agent data
    const rating = 5.0;
    const reviewCount = Math.floor(Math.random() * 2000) + 100;
    const isTopAgent = agent.totalProperties > 50;

    return (
        <Link href={`/agents/${agent.id}`}>
            <Card className="group py-0 hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300 cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex gap-6">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-full overflow-hidden">
                                {agent.profilePicture ? (
                                    <Image
                                        src={agent.profilePicture}
                                        alt={agent.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Image
                                        src="/placeholder.jpg"
                                        alt={agent.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            {isTopAgent && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-2 py-1">
                                        <Award className="h-3 w-3" />
                                        <span className="text-xs font-semibold">Top Agent</span>
                                    </Badge>
                                    <div className="text-[10px] text-center text-gray-500 mt-0.5">on Platform</div>
                                </div>
                            )}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                                        TEAM
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {agent.name}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                        {agent.agency || 'Independent Agent'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                                    <span className="text-blue-600">★</span>
                                    <span className="text-gray-500">({reviewCount.toLocaleString()})</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-1 text-gray-700">
                                <div>
                                    <span className="font-semibold text-gray-900">
                                        ${Math.floor(agent.totalProperties * 50)}K - ${Math.floor(agent.totalProperties * 80)}K
                                    </span>
                                    <span className="text-gray-500"> team price range</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900">{agent.activeProperties}</span>
                                    <span className="text-gray-500"> team sales last 12 months</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900">{agent.totalProperties}</span>
                                    <span className="text-gray-500"> team sales in {agent.city || 'area'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// Skeleton Loader
function AgentCardSkeleton() {
    return (
        <Card className="border-gray-200">
            <CardContent className="p-6">
                <div className="flex gap-6">
                    <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-40" />
                        <div className="space-y-2 mt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}