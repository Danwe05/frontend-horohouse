import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
    search: string;
    setSearch: (v: string) => void;
    listingType: string;
    setListingType: (v: string) => void;
    propertyType: string;
    setPropertyType: (v: string) => void;
    bedrooms: string;
    setBedrooms: (v: string) => void;
    sortBy: string;
    setSortBy: (v: string) => void;
    hasFilters: boolean;
    onClear: () => void;
}

export const FilterBar = ({
    search,
    setSearch,
    listingType,
    setListingType,
    propertyType,
    setPropertyType,
    bedrooms,
    setBedrooms,
    sortBy,
    setSortBy,
    hasFilters,
    onClear,
}: FilterBarProps) => {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl -sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Search by title, city, address…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="price-low">Price: Low → High</SelectItem>
                        <SelectItem value="price-high">Price: High → Low</SelectItem>
                        <SelectItem value="popular">Most Viewed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Secondary filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <Select value={listingType} onValueChange={setListingType}>
                    <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs bg-slate-50 border-slate-200">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                        <SelectItem value="short_term">Short Term</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="w-auto min-w-[150px] h-8 text-xs bg-slate-50 border-slate-200">
                        <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="guesthouse">Guest House</SelectItem>
                        <SelectItem value="vacation_rental">Vacation Rental</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Any Beds" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any Beds</SelectItem>
                        <SelectItem value="1">1+ Beds</SelectItem>
                        <SelectItem value="2">2+ Beds</SelectItem>
                        <SelectItem value="3">3+ Beds</SelectItem>
                        <SelectItem value="4">4+ Beds</SelectItem>
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
};
