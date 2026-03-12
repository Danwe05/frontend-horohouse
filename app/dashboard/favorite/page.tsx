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

    const pageConfig = {
        title: 'Personal Favorites',
        description: 'Properties you’ve saved for later',
        icon: Heart,
        color: 'text-pink-600 bg-pink-50'
    };

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

    const PageIcon = pageConfig.icon;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />

                    <main className="p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* HEADER SECTION */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${pageConfig.color}`}>
                                            <PageIcon className="w-6 h-6" />
                                        </div>
                                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageConfig.title}</h1>
                                    </div>
                                    <p className="text-slate-500 pl-11">{pageConfig.description}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center bg-white border rounded-lg px-3 py-1 shadow-sm">
                                        <div className="px-3">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Saved</p>
                                            <p className="text-sm font-semibold text-center">{allProperties.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MODERN FILTER BAR */}
                            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10">
                                <div className="flex flex-col lg:flex-row gap-3">
                                    {/* Search - Grows to fill space */}
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search saved properties..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 border-none bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-500 h-11"
                                        />
                                    </div>

                                    <Separator orientation="vertical" className="hidden lg:block h-10" />

                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                                        {/* Listing Type Tabs */}
                                        <Tabs value={filterListingType} onValueChange={setFilterListingType} className="w-fit">
                                            <TabsList className="bg-slate-100/80 p-1 h-11">
                                                <TabsTrigger value="all" className="px-4 h-9">All</TabsTrigger>
                                                <TabsTrigger value="sale" className="px-4 h-9">For Sale</TabsTrigger>
                                                <TabsTrigger value="rent" className="px-4 h-9">For Rent</TabsTrigger>
                                                <TabsTrigger value="short_term" className="px-4 h-9">Short Term</TabsTrigger>
                                            </TabsList>
                                        </Tabs>

                                        {/* Advanced Filter Drawer */}
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button variant="outline" className="h-11 gap-2 border-dashed border-slate-300 hover:bg-slate-50">
                                                    <SlidersHorizontal className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Filters</span>
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent className="w-[400px] sm:w-[540px]">
                                                <SheetHeader className="pb-6 border-b">
                                                    <SheetTitle className="flex items-center gap-2 text-2xl">
                                                        <ListFilter className="w-5 h-5" /> Advanced Filters
                                                    </SheetTitle>
                                                    <SheetDescription>Refine your saved properties</SheetDescription>
                                                </SheetHeader>

                                                <div className="py-6 space-y-8">
                                                    {/* Property Type */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Property Type</h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {['House', 'Apartment', 'Condo', 'Villa', 'Land', 'Hotel', 'Guest House', 'Vacation Rental'].map((type) => (
                                                                <Button
                                                                    key={type}
                                                                    variant={filterPropertyType === type.toLowerCase().replace(' ', '_') ? 'default' : 'outline'}
                                                                    onClick={() => setFilterPropertyType(type.toLowerCase().replace(' ', '_'))}
                                                                    className="justify-start h-10"
                                                                >
                                                                    {type}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Rooms */}
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bedrooms</h4>
                                                            <Select value={filterBedrooms} onValueChange={setFilterBedrooms}>
                                                                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">Any</SelectItem>
                                                                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n}+ Beds</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bathrooms</h4>
                                                            <Select value={filterBathrooms} onValueChange={setFilterBathrooms}>
                                                                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">Any</SelectItem>
                                                                    {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()}>{n}+ Baths</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Price Range */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Price Range (XAF)</h4>
                                                        <div className="flex items-center gap-3">
                                                            <Input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} />
                                                            <span className="text-slate-400">-</span>
                                                            <Input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <SheetFooter className="absolute bottom-0 left-0 w-full p-6 bg-slate-50 border-t flex flex-row gap-3">
                                                    <Button variant="ghost" onClick={clearAllFilters} className="flex-1">Reset All</Button>
                                                    <SheetTrigger asChild>
                                                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Apply Filters</Button>
                                                    </SheetTrigger>
                                                </SheetFooter>
                                            </SheetContent>
                                        </Sheet>

                                        <Separator orientation="vertical" className="hidden lg:block h-10 mx-1" />

                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-[160px] h-11 border-none bg-slate-50">
                                                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                                                <SelectValue placeholder="Sort" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recent">Recently Saved</SelectItem>
                                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                                                <SelectItem value="popular">Popularity</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* ACTIVE FILTER BADGES */}
                            {(searchTerm || filterListingType !== 'all') && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Active Filters:</span>
                                    {searchTerm && (
                                        <Badge variant="secondary" className="bg-white border text-slate-600 px-3 py-1 rounded-full gap-2">
                                            "{searchTerm}" <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                                        </Badge>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-slate-400 hover:text-red-500">
                                        Clear all
                                    </Button>
                                </div>
                            )}

                            {/* CONTENT AREA */}
                            <div className="mt-8">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                        <p className="text-slate-500 font-medium">Loading your favorites...</p>
                                    </div>
                                ) : !user ? (
                                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center text-center px-4">
                                        <div className="p-6 rounded-full mb-6 bg-slate-100">
                                            <Heart className="w-12 h-12 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Sign in to view favorites</h3>
                                        <p className="text-slate-500 max-w-xs mb-8">
                                            You need to be signed in to view and save properties to your favorites.
                                        </p>
                                        <Button onClick={() => router.push('/auth/login')} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700">
                                            Sign In
                                        </Button>
                                    </div>
                                ) : properties.length === 0 ? (
                                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center text-center px-4">
                                        <div className={`p-6 rounded-full mb-6 ${pageConfig.color}`}>
                                            <PageIcon className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">No favorites found</h3>
                                        <p className="text-slate-500 max-w-xs mb-8">
                                            {allProperties.length === 0
                                                ? "You haven't saved any properties yet. Start exploring to find your dream home!"
                                                : "We couldn't find any properties matching your current filters. Try adjusting them."}
                                        </p>
                                        {allProperties.length === 0 ? (
                                            <Button onClick={() => router.push('/dashboard/search')} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700">
                                                Explore Properties
                                            </Button>
                                        ) : (
                                            <Button onClick={clearAllFilters} variant="outline" className="rounded-full px-8">
                                                Reset all filters
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
