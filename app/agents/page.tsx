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
            
            // Debug: Log the response to see the structure
            console.log('API Response:', response);
            console.log('First agent:', response.agents?.[0]);
            
            // Map _id to id if needed
            const mappedAgents = response.agents.map((agent: any) => ({
                ...agent,
                id: agent._id || agent.id, // Handle both _id and id
            }));
            
            console.log('Mapped agents:', mappedAgents);
            console.log('First mapped agent ID:', mappedAgents[0]?.id);
            
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
        // Name filter
        const matchesName = !agentName || 
            agent.name.toLowerCase().includes(agentName.toLowerCase());
        
        // City filter
        const matchesCity = !cityFilter || 
            agent.city?.toLowerCase().includes(cityFilter.toLowerCase());
        
        // Top agent filter (agents with 50+ properties)
        const matchesTopAgent = !topAgentOnly || agent.totalProperties > 50;
        
        // Language filter
        const matchesLanguage = language === 'all' || 
            agent.languages?.some(lang => lang.toLowerCase() === language.toLowerCase());
        
        // Specialty filter (if you add specialties to agent data)
        const matchesSpecialty = specialty === 'all' || 
            agent.specialties?.some(spec => spec.toLowerCase().includes(specialty.toLowerCase()));
        
        return matchesName && matchesCity && matchesTopAgent && matchesLanguage && matchesSpecialty;
    });

    const handleSearch = () => {
        // Reset to page 1 and fetch
        setPage(1);
        fetchAgents();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-white mt-16">
            {/* Search Section */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Search Inputs */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Input
                            type="text"
                            placeholder="City, neighborhood, or zip code"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 h-12 text-base border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                        />
                        <Input
                            type="text"
                            placeholder="Agent name"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 h-12 text-base border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                        />
                        <Button 
                            onClick={handleSearch}
                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap"
                        >
                            <Search className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline">Find agent</span>
                        </Button>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex gap-0 border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => setServiceType('buying')}
                                className={`px-4 sm:px-6 py-2 font-medium transition-colors text-sm sm:text-base ${
                                    serviceType === 'buying' 
                                        ? 'bg-gray-100 text-gray-900' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Buying
                            </button>
                            <button
                                onClick={() => setServiceType('selling')}
                                className={`px-4 sm:px-6 py-2 font-medium transition-colors text-sm sm:text-base border-l border-gray-300 ${
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
                            className={`px-4 sm:px-6 py-2 border rounded-md font-medium transition-colors flex items-center gap-2 text-sm sm:text-base ${
                                topAgentOnly
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Award className="h-4 w-4 text-blue-600" />
                            <span className="hidden sm:inline">Top agent</span>
                            <span className="sm:hidden">Top</span>
                        </button>

                        <Select value={priceRange} onValueChange={setPriceRange}>
                            <SelectTrigger className="w-[130px] sm:w-[160px] border-gray-300 text-sm sm:text-base">
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
                            <SelectTrigger className="w-[130px] sm:w-[160px] border-gray-300 text-sm sm:text-base">
                                <SelectValue placeholder="Specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All specialties</SelectItem>
                                <SelectItem value="residential">Residential</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                                <SelectItem value="luxury">Luxury</SelectItem>
                                <SelectItem value="investment">Investment</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[130px] sm:w-[160px] border-gray-300 text-sm sm:text-base">
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
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl sm:text-2xl text-gray-700">
                        {loading ? (
                            <Skeleton className="h-8 w-48" />
                        ) : (
                            `${filteredAgents.length.toLocaleString()} agents found`
                        )}
                    </h2>
                    
                    {/* Active Filters Display */}
                    {(agentName || cityFilter || topAgentOnly || language !== 'all' || specialty !== 'all') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setAgentName('');
                                setCityFilter('');
                                setTopAgentOnly(false);
                                setLanguage('all');
                                setSpecialty('all');
                            }}
                            className="text-sm"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Agents Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <AgentCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <Card className="p-8 sm:p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Search className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
                                <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                                <Button
                                    onClick={() => {
                                        setAgentName('');
                                        setCityFilter('');
                                        setTopAgentOnly(false);
                                        setLanguage('all');
                                        setSpecialty('all');
                                    }}
                                    variant="outline"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
                                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                        const pageNumber = i + 1;
                                        return (
                                            <Button
                                                key={pageNumber}
                                                variant={page === pageNumber ? "default" : "outline"}
                                                onClick={() => setPage(pageNumber)}
                                                className={page === pageNumber ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
                                            >
                                                {pageNumber}
                                            </Button>
                                        );
                                    })}
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

// Agent Card Component
function AgentCard({ agent }: { agent: Agent }) {
    // Calculate rating (you can add this to your API response later)
    const rating = 4.8 + (Math.random() * 0.4); // Random between 4.8-5.2, capped at 5.0
    const displayRating = Math.min(rating, 5.0);
    const reviewCount = Math.floor(agent.propertiesSold * 0.6); // Estimate reviews from sales
    const isTopAgent = agent.totalProperties > 50;

    // Calculate price range based on properties
    const minPrice = Math.floor(agent.totalProperties * 45);
    const maxPrice = Math.floor(agent.totalProperties * 85);

    // Debug log
    console.log('Agent Card - Agent ID:', agent.id, 'Full agent:', agent);

    return (
        <Link href={`/agents/${agent.id}`}>
            <Card className="group py-0 hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300 cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100">
                                {agent.profilePicture ? (
                                    <Image
                                        src={agent.profilePicture}
                                        alt={agent.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold">
                                        {agent.name.charAt(0).toUpperCase()}
                                    </div>
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
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-2 gap-2">
                                <div className="w-full sm:w-auto">
                                    <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                                        {agent.agency ? 'TEAM' : 'INDEPENDENT'}
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {agent.name}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                                        {agent.agency || 'Independent Agent'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                                    <span className="font-bold text-gray-900">{displayRating.toFixed(1)}</span>
                                    <span className="text-blue-600">★</span>
                                    <span className="text-gray-500">({reviewCount.toLocaleString()})</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-1 text-sm sm:text-base text-gray-700">
                                <div>
                                    <span className="font-semibold text-gray-900">
                                        ${minPrice}K - ${maxPrice}K
                                    </span>
                                    <span className="text-gray-500"> team price range</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900">{agent.activeProperties}</span>
                                    <span className="text-gray-500"> active listings</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900">{agent.totalProperties}</span>
                                    <span className="text-gray-500"> total properties in {agent.city || 'area'}</span>
                                </div>
                            </div>

                            {/* Languages & Specialties */}
                            {(agent.languages?.length > 0 || agent.specialties?.length > 0) && (
                                <div className="mt-3 flex flex-wrap gap-1 justify-center sm:justify-start">
                                    {agent.languages?.slice(0, 2).map((lang, idx) => (
                                        <Badge 
                                            key={`lang-${idx}`} 
                                            variant="secondary" 
                                            className="text-xs bg-gray-100 text-gray-600"
                                        >
                                            {lang}
                                        </Badge>
                                    ))}
                                    {agent.specialties?.slice(0, 1).map((spec, idx) => (
                                        <Badge 
                                            key={`spec-${idx}`} 
                                            variant="secondary" 
                                            className="text-xs bg-blue-50 text-blue-700"
                                        >
                                            {spec}
                                        </Badge>
                                    ))}
                                </div>
                            )}
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
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex-shrink-0 mx-auto sm:mx-0" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-16 mx-auto sm:mx-0" />
                        <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 sm:h-5 w-28 sm:w-40 mx-auto sm:mx-0" />
                        <div className="space-y-2 mt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4 mx-auto sm:mx-0" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}