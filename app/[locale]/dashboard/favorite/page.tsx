'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { PropertyCard } from '@/components/dashboard/PropertyCard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Loader2, Heart, Search, SlidersHorizontal, Plus,
    X, LayoutGrid, ListFilter, ArrowUpDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Property {
    _id?: string;
    id?: string;
    title: string;
    price: number;
    type?: string;
    listingType?: string;
    city: string;
    state?: string;
    country?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    beds?: number;
    baths?: number;
    area?: number;
    sqft?: number;
    squareFeet?: number;
    status?: string;
    availability?: string;
    isFavorite?: boolean;
    images?: any[];
    amenities?: {
        bedrooms?: number;
        bathrooms?: number;
        [key: string]: any;
    };
    viewsCount?: number;
    viewCount?: number;
    views?: number;
    favoriteCount?: number;
    favorites?: number;
}

const FavoritePage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterListingType, setFilterListingType] = useState('all');
    const [filterPropertyType, setFilterPropertyType] = useState('all');
    const [filterBedrooms, setFilterBedrooms] = useState('all');
    const [filterBathrooms, setFilterBathrooms] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('recent');

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const params = { page: 1, limit: 100 };
            const response = await apiClient.getMyFavoriteProperties(params);

            let data = response?.data || response?.properties || (Array.isArray(response) ? response : []);
            // Ensure properties are marked as favorite since they are fetched from the favorites list
            data = data.map((p: any) => ({ ...p, isFavorite: true }));

            setAllProperties(data);
            setProperties(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFavorites();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Filtering Logic
    useEffect(() => {
        let filtered = [...allProperties];

        // Text search
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(p => p.title?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s));
        }

        // Listing Type (Sale vs Rent)
        if (filterListingType !== 'all') {
            filtered = filtered.filter(p => (p.listingType || p.type)?.toLowerCase() === filterListingType);
        }

        // Property Type (House, Apartment, etc.)
        if (filterPropertyType !== 'all') {
            filtered = filtered.filter(p => {
                const type = (p.type || p.listingType || '').toLowerCase();
                return type.includes(filterPropertyType);
            });
        }

        // Bedrooms
        if (filterBedrooms !== 'all') {
            const minBeds = parseInt(filterBedrooms);
            filtered = filtered.filter(p => {
                const beds = p.amenities?.bedrooms ?? p.bedrooms ?? p.beds ?? 0;
                return beds >= minBeds;
            });
        }

        // Bathrooms
        if (filterBathrooms !== 'all') {
            const minBaths = parseInt(filterBathrooms);
            filtered = filtered.filter(p => {
                const baths = p.amenities?.bathrooms ?? p.bathrooms ?? p.baths ?? 0;
                return baths >= minBaths;
            });
        }

        // Price Range
        if (priceRange.min) {
            const min = parseFloat(priceRange.min);
            filtered = filtered.filter(p => p.price >= min);
        }
        if (priceRange.max) {
            const max = parseFloat(priceRange.max);
            filtered = filtered.filter(p => p.price <= max);
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'popular') {
                const popA = (a.viewsCount ?? a.viewCount ?? a.views ?? 0) + (a.favoriteCount ?? a.favorites ?? 0);
                const popB = (b.viewsCount ?? b.viewCount ?? b.views ?? 0) + (b.favoriteCount ?? b.favorites ?? 0);
                return popB - popA;
            }
            return 0; // 'recent' is default, assuming backend sends them sorted
        });

        setProperties(filtered);
    }, [searchTerm, filterListingType, filterPropertyType, filterBedrooms, filterBathrooms, priceRange, sortBy, allProperties]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterListingType('all');
        setFilterPropertyType('all');
        setFilterBedrooms('all');
        setFilterBathrooms('all');
        setPriceRange({ min: '', max: '' });
    };

    const inputClasses = "w-full px-4 py-3 bg-white border border-[#DDDDDD] rounded-lg text-[15px] text-[#222222] placeholder:text-[#717171] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors";

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />

                    <main className="p-6 lg:p-10">
                        <div className="max-w-7xl mx-auto space-y-10">

                            {/* ── HEADER SECTION ── */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-[32px] font-semibold tracking-tight text-[#222222]">Saved properties</h1>
                                    </div>
                                    <p className="text-[16px]">
                                        Properties you’ve saved to review later.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 md:pb-1">
                                    <div className="hidden sm:flex items-center bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl px-4 py-2">
                                        <div>
                                            <p className="text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-0.5">Total Saved</p>
                                            <p className="text-[18px] font-semibold text-[#222222] text-center leading-none">{allProperties.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── MODERN FILTER BAR ── */}
                            <div className="bg-white py-4 mt-2 border-t border-[#DDDDDD] sticky top-0 z-30">
                                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

                                    {/* Left: Pills + Filters */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide w-full lg:w-auto">
                                        {/* Listing Type Tabs */}
                                        <Tabs value={filterListingType} onValueChange={setFilterListingType} className="w-fit">
                                            <TabsList className="bg-transparent space-x-1 p-0 h-auto">
                                                <TabsTrigger value="all" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">All</TabsTrigger>
                                                <TabsTrigger value="sale" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">For Sale</TabsTrigger>
                                                <TabsTrigger value="rent" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">For Rent</TabsTrigger>
                                                <TabsTrigger value="short_term" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">Short Term</TabsTrigger>
                                            </TabsList>
                                        </Tabs>

                                        {/* Advanced Filter Drawer */}
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button variant="outline" className="h-10 px-5 gap-2 border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600 rounded-full font-medium text-[14px] transition-colors flex-shrink-0">
                                                    <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
                                                    <span className="hidden sm:inline">Filters</span>
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent className="w-[400px] sm:w-[540px] border-l-[#DDDDDD] p-0 flex flex-col">
                                                <SheetHeader className="p-6 border-b border-[#DDDDDD]">
                                                    <SheetTitle className="flex items-center gap-3 text-[22px] font-semibold text-[#222222]">
                                                        <ListFilter className="w-5 h-5 stroke-[2]" /> Filters
                                                    </SheetTitle>
                                                    <SheetDescription className="text-[#717171] text-[15px] mt-1">
                                                        Refine your saved properties
                                                    </SheetDescription>
                                                </SheetHeader>

                                                <div className="p-6 space-y-8 overflow-y-auto flex-1 pb-32">
                                                    {/* Property Type */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[16px] font-semibold text-[#222222]">Property Type</h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {['House', 'Apartment', 'Condo', 'Villa', 'Land', 'Hotel', 'Guest House', 'Vacation Rental'].map((type) => {
                                                                const isActive = filterPropertyType === type.toLowerCase().replace(' ', '_');
                                                                return (
                                                                    <button
                                                                        key={type}
                                                                        onClick={() => setFilterPropertyType(type.toLowerCase().replace(' ', '_'))}
                                                                        className={`justify-start h-12 px-4 rounded-lg border text-[14px] font-medium transition-all text-left ${isActive
                                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                                            : 'bg-white border-[#DDDDDD] text-[#222222] hover:border-blue-600'
                                                                            }`}
                                                                    >
                                                                        {type}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <hr className="border-[#DDDDDD]" />

                                                    {/* Rooms */}
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[16px] font-semibold text-[#222222]">Bedrooms</h4>
                                                            <Select value={filterBedrooms} onValueChange={setFilterBedrooms}>
                                                                <SelectTrigger className={`${inputClasses} h-12`}><SelectValue placeholder="Any" /></SelectTrigger>
                                                                <SelectContent className="border-[#DDDDDD] shadow-lg rounded-xl">
                                                                    <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer">Any</SelectItem>
                                                                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()} className="focus:bg-[#F7F7F7] cursor-pointer">{n}+ Beds</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="text-[16px] font-semibold text-[#222222]">Bathrooms</h4>
                                                            <Select value={filterBathrooms} onValueChange={setFilterBathrooms}>
                                                                <SelectTrigger className={`${inputClasses} h-12`}><SelectValue placeholder="Any" /></SelectTrigger>
                                                                <SelectContent className="border-[#DDDDDD] shadow-lg rounded-xl">
                                                                    <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer">Any</SelectItem>
                                                                    {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()} className="focus:bg-[#F7F7F7] cursor-pointer">{n}+ Baths</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <hr className="border-[#DDDDDD]" />

                                                    {/* Price Range */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[16px] font-semibold text-[#222222]">Price Range (XAF)</h4>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1">
                                                                <label className="text-[12px] text-[#717171] mb-1 block">Minimum</label>
                                                                <input type="number" placeholder="No min" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} className={inputClasses} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[12px] text-[#717171] mb-1 block">Maximum</label>
                                                                <input type="number" placeholder="No max" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className={inputClasses} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <SheetFooter className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-[#DDDDDD] flex flex-row items-center justify-between gap-4">
                                                    <button onClick={clearAllFilters} className="text-[15px] font-semibold text-[#222222] underline hover:text-black">
                                                        Clear all
                                                    </button>
                                                    <SheetTrigger asChild>
                                                        <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-semibold transition-colors">
                                                            Show properties
                                                        </Button>
                                                    </SheetTrigger>
                                                </SheetFooter>
                                            </SheetContent>
                                        </Sheet>

                                        <Separator orientation="vertical" className="hidden lg:block h-8 mx-1 bg-[#DDDDDD] my-auto" />

                                        {/* Sort Select */}
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-[160px] h-10 rounded-full border border-[#DDDDDD] bg-white text-[#222222] hover:border-blue-600 text-[14px] font-medium transition-colors focus:ring-0 focus:ring-offset-0">
                                                <ArrowUpDown className="w-4 h-4 mr-2 text-[#222222] stroke-[2]" />
                                                <SelectValue placeholder="Sort" />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#DDDDDD] shadow-lg rounded-xl">
                                                <SelectItem value="recent" className="focus:bg-[#F7F7F7] cursor-pointer">Recently Saved</SelectItem>
                                                <SelectItem value="price-low" className="focus:bg-[#F7F7F7] cursor-pointer">Price: Low to High</SelectItem>
                                                <SelectItem value="price-high" className="focus:bg-[#F7F7F7] cursor-pointer">Price: High to Low</SelectItem>
                                                <SelectItem value="popular" className="focus:bg-[#F7F7F7] cursor-pointer">Popularity</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Right: Search input */}
                                    <div className="relative w-full lg:w-[300px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222222] stroke-[2]" />
                                        <Input
                                            placeholder="Search saved properties..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-11 h-12 rounded-full border border-[#DDDDDD] bg-white hover:shadow-md focus-visible:shadow-md focus-visible:ring-0 transition-shadow text-[15px] font-medium text-[#222222] placeholder:text-[#717171]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── ACTIVE FILTER BADGES ── */}
                            {(searchTerm || filterListingType !== 'all' || filterPropertyType !== 'all' || filterBedrooms !== 'all' || filterBathrooms !== 'all' || priceRange.min || priceRange.max) && (
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <span className="text-[12px] font-bold text-[#222222] mr-2">Filters applied:</span>
                                    {searchTerm && (
                                        <Badge variant="secondary" className="bg-white border border-[#DDDDDD] text-[#222222] px-3 py-1.5 rounded-full gap-2 text-[13px] font-medium hover:border-blue-600 transition-colors">
                                            "{searchTerm}" <X className="w-3.5 h-3.5 cursor-pointer text-[#717171] hover:text-[#222222]" onClick={() => setSearchTerm('')} />
                                        </Badge>
                                    )}
                                    {filterListingType !== 'all' && (
                                        <Badge variant="secondary" className="bg-white border border-[#DDDDDD] text-[#222222] px-3 py-1.5 rounded-full gap-2 text-[13px] font-medium hover:border-blue-600 transition-colors">
                                            {filterListingType.replace('_', ' ')} <X className="w-3.5 h-3.5 cursor-pointer text-[#717171] hover:text-[#222222]" onClick={() => setFilterListingType('all')} />
                                        </Badge>
                                    )}
                                    {/* Additional active badges logic can be added here identically */}
                                    <button onClick={clearAllFilters} className="text-[13px] font-semibold text-[#717171] hover:text-[#222222] underline ml-2 transition-colors">
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* ── CONTENT AREA ── */}
                            <div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-32 space-y-4 flex-col">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#222222]" />
                                        <p className="text-[#717171] text-[16px] font-medium">Loading your favorites...</p>
                                    </div>
                                ) : !user ? (
                                    <div className="bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD] py-24 flex flex-col items-center text-center px-6">
                                        <div className="w-16 h-16 bg-white border border-[#DDDDDD] text-[#222222] rounded-full flex items-center justify-center mb-6">
                                            <Heart className="w-7 h-7 stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-[22px] font-semibold text-[#222222] mb-2">Sign in to view favorites</h3>
                                        <p className="text-[16px] text-[#717171] max-w-sm mb-8">
                                            You need to be signed in to view and save properties to your favorites.
                                        </p>
                                        <Button onClick={() => router.push('/auth/login')} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-semibold">
                                            Sign in
                                        </Button>
                                    </div>
                                ) : properties.length === 0 ? (
                                    <div className="bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD] py-24 flex flex-col items-center text-center px-6">
                                        <div className="w-16 h-16 bg-white border border-[#DDDDDD] text-[#222222] rounded-full flex items-center justify-center mb-6">
                                            <Search className="w-7 h-7 stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-[22px] font-semibold text-[#222222] mb-2">No favorites found</h3>
                                        <p className="text-[16px] text-[#717171] max-w-md mb-8">
                                            {allProperties.length === 0
                                                ? "You haven't saved any properties yet. Start exploring to find your dream home!"
                                                : "We couldn't find any properties matching your current filters. Try adjusting them."}
                                        </p>
                                        {allProperties.length === 0 ? (
                                            <Button onClick={() => router.push('/dashboard/search')} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-semibold">
                                                Start searching
                                            </Button>
                                        ) : (
                                            <Button onClick={clearAllFilters} variant="outline" className="h-12 px-8 border-blue-600 text-[#222222] hover:bg-blue-600 hover:text-white rounded-xl text-[15px] font-semibold">
                                                Clear all filters
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {properties.map((property) => (
                                            <PropertyCard
                                                key={property._id || property.id}
                                                {...transformPropertyProps(property)}
                                                onUpdate={fetchFavorites} // Refetch when a property is updated (e.g. unfavorited)
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

// Helper to keep the main component clean
const transformPropertyProps = (p: Property) => {
    const images = p.images || [];
    const imageUrls = images.map(img => typeof img === 'string' ? img : img?.url || '').filter(Boolean);
    return {
        id: p._id || p.id || '',
        image: imageUrls[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500',
        images: imageUrls,
        title: p.title || 'Untitled Property',
        location: [p.address, p.city, p.state || p.country].filter(Boolean).join(', ') || 'Location not specified',
        price: p.price || 0,
        beds: p.amenities?.bedrooms ?? p.bedrooms ?? p.beds ?? 0,
        baths: p.amenities?.bathrooms ?? p.bathrooms ?? p.baths ?? 0,
        sqft: p.area || p.sqft || p.squareFeet || 0,
        type: p.listingType || p.type || 'sale',
        status: p.status || p.availability || 'active',
        isFavorite: p.isFavorite || true, // Ensures it displays as favorite
        viewCount: p.viewsCount ?? p.viewCount ?? p.views ?? 0,
        favoriteCount: p.favoriteCount ?? p.favorites ?? 0,
        pricingUnit: (p as any).pricingUnit,
        maxGuests: (p as any).maxGuests ?? (p as any).shortTermAmenities?.maxGuests,
    };
};

export default FavoritePage;