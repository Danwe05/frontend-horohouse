'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Home, Search, SlidersHorizontal, Plus,
  X, ListFilter, ArrowUpDown, Eye, Bed, Bath, MapPin, MoreVertical, Trash2, Edit,
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
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const PropertyPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.propertyPage || {};

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterListingType, setFilterListingType] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBedrooms, setFilterBedrooms] = useState('all');
  const [filterBathrooms, setFilterBathrooms] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('recent');

  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const isRegularUser = user?.role === 'registered_user';

  const pageConfig = {
    title: s.header?.title || 'My properties',
    description: s.header?.description || 'Manage your listings and performance',
    icon: Home,
    color: 'text-blue-600 bg-blue-50'
  };

  const stats = useMemo(() => {
    return {
      total: allProperties.length,
      active: allProperties.filter(p => (p.status || p.availability) === 'active').length,
      pending: allProperties.filter(p => (p.status || p.availability) === 'pending').length,
    };
  }, [allProperties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 100 };
      const response = await apiClient.getMyProperties({ ...params, includeInactive: true });
      let data = response?.data || response?.properties || (Array.isArray(response) ? response : []);
      setAllProperties(data);
      setProperties(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, [user]);

  useEffect(() => {
    let filtered = [...allProperties];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.title?.toLowerCase().includes(searchLower) || p.city?.toLowerCase().includes(searchLower));
    }
    if (filterListingType !== 'all') {
      filtered = filtered.filter(p => (p.listingType || p.type)?.toLowerCase() === filterListingType);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => (p.status || p.availability)?.toLowerCase() === filterStatus);
    }
    setProperties(filtered);
  }, [searchTerm, filterListingType, filterStatus, allProperties]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterListingType('all');
    setFilterStatus('all');
    setFilterPropertyType('all');
    setPriceRange({ min: '', max: '' });
  };

  const PageIcon = pageConfig.icon;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-10">

              {/* HEADER SECTION */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-[32px] font-semibold tracking-tight text-[#222222]">{pageConfig.title}</h1>
                  <p className="text-[16px] text-[#717171]">{pageConfig.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-5 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl px-5 py-3">
                    <div>
                      <p className="text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-0.5">{s.header?.total || 'Total'}</p>
                      <p className="text-[18px] font-semibold text-[#222222] text-center leading-none">{stats.total}</p>
                    </div>
                    <div className="w-px h-8 bg-[#DDDDDD]" />
                    <div>
                      <p className="text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-0.5">{s.header?.active || 'Active'}</p>
                      <p className="text-[18px] font-semibold text-[#222222] text-center leading-none">{stats.active}</p>
                    </div>
                  </div>
                  <Button onClick={() => router.push('/dashboard/propertyForm')} className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px]">
                    <Plus className="w-4 h-4 mr-2" /> {s.header?.addProperty || 'Create listing'}
                  </Button>
                </div>
              </div>

              {/* MODERN FILTER BAR */}
              <div className="bg-white py-4 mt-4 border-t border-[#DDDDDD] sticky top-0 z-10 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">

                {/* Left: Scrollable Container for Filters (min-w-0 prevents it from blowing out flex layouts) */}
                <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide w-full xl:flex-1 xl:min-w-0 pb-2 xl:pb-0 pr-2">

                  {/* Tabs enforced to not wrap and shrink-0 to maintain horizontal scroll */}
                  <Tabs value={filterListingType} onValueChange={setFilterListingType} className="shrink-0">
                    <TabsList className="bg-transparent space-x-1.5 p-0 h-auto flex flex-nowrap w-max">
                      <TabsTrigger value="all" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] transition-colors shrink-0 whitespace-nowrap">{s.filterBar?.tabs?.all || "All"}</TabsTrigger>
                      <TabsTrigger value="sale" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] transition-colors shrink-0 whitespace-nowrap">{s.filterBar?.tabs?.forSale || "For sale"}</TabsTrigger>
                      <TabsTrigger value="rent" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] transition-colors shrink-0 whitespace-nowrap">{s.filterBar?.tabs?.forRent || "For rent"}</TabsTrigger>
                      <TabsTrigger value="short_term" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] transition-colors shrink-0 whitespace-nowrap">{s.filterBar?.tabs?.shortTerm || "Short term"}</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Separator orientation="vertical" className="hidden lg:block h-8 mx-1 bg-[#DDDDDD] my-auto shrink-0" />

                  {/* Status Quick Filter */}
                  <div className="shrink-0">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[130px] h-10 bg-white border border-[#DDDDDD] rounded-full text-[14px] font-medium text-[#222222] hover:border-blue-600 focus:ring-0 focus:ring-offset-0 transition-colors">
                        <SelectValue placeholder={s.filterBar?.status?.placeholder || "Status"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-[#DDDDDD]">
                        <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.status?.all || "All Status"}</SelectItem>
                        <SelectItem value="active" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.status?.active || "Active"}</SelectItem>
                        <SelectItem value="pending" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.status?.pending || "Pending"}</SelectItem>
                        <SelectItem value="sold" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.status?.sold || "Sold"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Filter Drawer */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="shrink-0 h-10 px-5 gap-2 border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600 rounded-full font-medium text-[14px] transition-colors whitespace-nowrap">
                        <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
                        <span>{s.filterBar?.btnFilters || "Filters"}</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] border-l-[#DDDDDD] p-0 flex flex-col bg-white">
                      <SheetHeader className="p-6 border-b border-[#DDDDDD]">
                        <SheetTitle className="flex items-center gap-3 text-[22px] font-semibold text-[#222222]">
                          <ListFilter className="w-5 h-5 stroke-[2]" /> {s.advancedFilters?.title || "Filters"}
                        </SheetTitle>
                        <SheetDescription className="text-[#717171] text-[15px] mt-1">{s.advancedFilters?.subtitle || "Refine your property search results"}</SheetDescription>
                      </SheetHeader>

                      <div className="p-6 space-y-8 overflow-y-auto flex-1 pb-32 custom-scrollbar">
                        {/* Property Type */}
                        <div className="space-y-4">
                          <h4 className="text-[16px] font-semibold text-[#222222]">{s.advancedFilters?.propertyType || "Property type"}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {['House', 'Apartment', 'Condo', 'Villa', 'Land', 'Hotel', 'Guest House', 'Vacation Rental'].map((type) => {
                              const typeKey = type.toLowerCase().replace(' ', '');
                              const translatedType = (s.advancedFilters?.types as any)?.[typeKey] || type;
                              const isActive = filterPropertyType === type.toLowerCase().replace(' ', '_');
                              return (
                                <button
                                  key={type}
                                  onClick={() => setFilterPropertyType(type.toLowerCase().replace(' ', '_'))}
                                  className={`justify-start h-12 px-4 rounded-xl border text-[14px] font-medium transition-all text-left ${isActive
                                    ? 'bg-[#F7F7F7] border-blue-600 text-[#222222] ring-1 ring-[#222222]'
                                    : 'bg-white border-[#DDDDDD] text-[#222222] hover:border-blue-600'
                                    }`}
                                >
                                  {translatedType}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <hr className="border-[#DDDDDD]" />

                        {/* Rooms */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-[16px] font-semibold text-[#222222]">{s.advancedFilters?.bedrooms || "Bedrooms"}</h4>
                            <Select value={filterBedrooms} onValueChange={setFilterBedrooms}>
                              <SelectTrigger className="h-12 rounded-xl border-[#DDDDDD] bg-white text-[15px] font-medium hover:border-blue-600">
                                <SelectValue placeholder={s.advancedFilters?.any || "Any"} />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-[#DDDDDD]">
                                <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.advancedFilters?.any || "Any"}</SelectItem>
                                {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()} className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{n}{s.advancedFilters?.bedsSuffix || "+ beds"}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[16px] font-semibold text-[#222222]">{s.advancedFilters?.bathrooms || "Bathrooms"}</h4>
                            <Select value={filterBathrooms} onValueChange={setFilterBathrooms}>
                              <SelectTrigger className="h-12 rounded-xl border-[#DDDDDD] bg-white text-[15px] font-medium hover:border-blue-600">
                                <SelectValue placeholder={s.advancedFilters?.any || "Any"} />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-[#DDDDDD]">
                                <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.advancedFilters?.any || "Any"}</SelectItem>
                                {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()} className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{n}{s.advancedFilters?.bathsSuffix || "+ baths"}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <hr className="border-[#DDDDDD]" />

                        {/* Price Range */}
                        <div className="space-y-4">
                          <h4 className="text-[16px] font-semibold text-[#222222]">{s.advancedFilters?.priceRange || "Price range (XAF)"}</h4>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="text-[13px] font-medium text-[#717171] mb-1.5 block">Minimum</label>
                              <Input type="number" placeholder={s.advancedFilters?.min || "No min"} value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} className="h-12 rounded-xl border-[#DDDDDD] focus-visible:ring-1 focus-visible:ring-[#222222] hover:border-blue-600 text-[15px]" />
                            </div>
                            <div className="flex-1">
                              <label className="text-[13px] font-medium text-[#717171] mb-1.5 block">Maximum</label>
                              <Input type="number" placeholder={s.advancedFilters?.max || "No max"} value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className="h-12 rounded-xl border-[#DDDDDD] focus-visible:ring-1 focus-visible:ring-[#222222] hover:border-blue-600 text-[15px]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <SheetFooter className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-[#DDDDDD] flex flex-row items-center justify-between gap-4">
                        <button onClick={clearAllFilters} className="text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors">
                          {s.advancedFilters?.resetAll || "Clear all"}
                        </button>
                        <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-semibold transition-colors">
                          {s.advancedFilters?.applyFilters || "Show results"}
                        </Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Right side: Sort and Search */}
                <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 justify-end">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] shrink-0 h-10 rounded-full border border-[#DDDDDD] bg-white text-[#222222] hover:border-blue-600 text-[14px] font-medium focus:ring-0 focus:ring-offset-0 transition-colors">
                      <ArrowUpDown className="w-4 h-4 mr-2 text-[#222222]" />
                      <SelectValue placeholder={s.filterBar?.sort?.placeholder || "Sort"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#DDDDDD]">
                      <SelectItem value="recent" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.sort?.newest || "Newest"}</SelectItem>
                      <SelectItem value="price-low" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.sort?.priceLowToHigh || "Price: low to high"}</SelectItem>
                      <SelectItem value="price-high" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.sort?.priceHighToLow || "Price: high to low"}</SelectItem>
                      <SelectItem value="popular" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px] font-medium">{s.filterBar?.sort?.popular || "Popularity"}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Search Input */}
                  <div className="relative w-full xl:w-[250px] shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222222] stroke-[2]" />
                    <Input
                      placeholder={s.filterBar?.searchPlaceholder || "Search..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 h-12 rounded-full border border-[#DDDDDD] bg-white hover:shadow-md focus-visible:shadow-md focus-visible:ring-0 transition-shadow text-[15px] font-medium text-[#222222] placeholder:text-[#717171]"
                    />
                  </div>
                </div>
              </div>

              {/* ACTIVE FILTER BADGES */}
              {(searchTerm || filterStatus !== 'all' || filterListingType !== 'all') && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[12px] font-bold text-[#717171] uppercase tracking-widest mr-2">{s.activeFilters?.label || "Filters applied:"}</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222] px-3 py-1.5 rounded-full gap-2 text-[13px] font-medium hover:bg-[#EBEBEB] transition-colors">
                      "{searchTerm}" <X className="w-3 h-3 cursor-pointer text-[#717171] hover:text-[#222222]" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {filterStatus !== 'all' && (
                    <Badge variant="secondary" className="bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222] px-3 py-1.5 rounded-full gap-2 text-[13px] font-medium hover:bg-[#EBEBEB] transition-colors">
                      {s.activeFilters?.statusPrefix || "Status:"} {filterStatus} <X className="w-3 h-3 cursor-pointer text-[#717171] hover:text-[#222222]" onClick={() => setFilterStatus('all')} />
                    </Badge>
                  )}
                  <button onClick={clearAllFilters} className="text-[13px] font-semibold text-[#222222] hover:text-[#717171] underline ml-2 transition-colors">
                    {s.activeFilters?.clearAll || "Clear all"}
                  </button>
                </div>
              )}

              {/* CONTENT AREA */}
              <div className="mt-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#222222]" />
                    <p className="text-[#717171] font-medium text-[15px]">{s.emptyStates?.loading || "Loading your properties..."}</p>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD] py-24 flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 bg-white border border-[#DDDDDD] text-[#222222] rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <PageIcon className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-[#222222] mb-2 tracking-tight">{s.emptyStates?.noPropertiesFound || "No properties found"}</h3>
                    <p className="text-[16px] text-[#717171] max-w-md mb-8 leading-relaxed">
                      {s.emptyStates?.noPropertiesDesc || "We couldn't find any properties matching your current criteria. Try adjusting your filters."}
                    </p>
                    <Button onClick={clearAllFilters} variant="outline" className="h-12 px-8 rounded-xl border-blue-600 text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7] transition-colors">
                      {s.emptyStates?.resetAllFilters || "Reset filters"}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#DDDDDD] overflow-hidden animate-in fade-in duration-300 w-full bg-white">
                    <div className="overflow-x-auto custom-scrollbar">
                      {/* Table header */}
                      <div className="grid grid-cols-[48px_minmax(0,1fr)_110px_100px_140px_80px_100px] items-center bg-[#F7F7F7] border-b border-[#DDDDDD] px-4 py-3 min-w-[800px]">
                        <div />
                        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Property</p>
                        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Type</p>
                        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Status</p>
                        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Price</p>
                        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Rooms</p>
                        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider text-right pr-2">Actions</p>
                      </div>

                      {/* Table rows */}
                      <div className="divide-y divide-[#DDDDDD]">
                        {properties.map((property) => {
                          const transformed = transformPropertyProps(property);

                          // Airbnb style status pills
                          const statusColor: Record<string, string> = {
                            active: 'bg-[#EBFBF0] text-[#008A05] border border-[#008A05]/20',
                            pending: 'bg-[#FEF5ED] text-[#C2410C] border border-[#C2410C]/20',
                            sold: 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]',
                            rented: 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]',
                          };

                          const listingLabel: Record<string, string> = {
                            sale: 'For sale', rent: 'For rent', short_term: 'Short stay',
                          };

                          const status = (property.status || property.availability || 'active').toLowerCase();
                          const listingType = (property.listingType || property.type || 'sale').toLowerCase();

                          return (
                            <div
                              key={property._id || property.id}
                              className="grid grid-cols-[48px_minmax(0,1fr)_110px_100px_140px_80px_100px] items-center px-4 py-4 hover:bg-[#F7F7F7] transition-colors min-w-[800px]"
                            >
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EBEBEB] flex-shrink-0 border border-[#DDDDDD]">
                                {transformed.image ? (
                                  <img src={transformed.image} alt={transformed.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Home className="w-5 h-5 text-[#AAAAAA] stroke-[1.5]" />
                                  </div>
                                )}
                              </div>

                              {/* Title + Location */}
                              <div className="min-w-0 pr-4 pl-3">
                                <p className="text-[15px] font-semibold text-[#222222] truncate leading-snug">{transformed.title}</p>
                                <p className="text-[13px] text-[#717171] truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {transformed.location}
                                </p>
                              </div>

                              {/* Listing Type */}
                              <div>
                                <span className="text-[13px] font-medium text-[#222222] bg-[#F7F7F7] border border-[#DDDDDD] px-2.5 py-1 rounded-md">
                                  {listingLabel[listingType] ?? listingType}
                                </span>
                              </div>

                              {/* Status */}
                              <div>
                                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-md capitalize ${statusColor[status] ?? statusColor.active}`}>
                                  {status}
                                </span>
                              </div>

                              {/* Price */}
                              <div>
                                <p className="text-[15px] font-semibold text-[#222222]">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(transformed.price)}
                                </p>
                              </div>

                              {/* Beds / Baths */}
                              <div className="flex flex-col gap-1 text-[13px] text-[#717171] font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Bed className="w-3.5 h-3.5 stroke-[2]" />{transformed.beds}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Bath className="w-3.5 h-3.5 stroke-[2]" />{transformed.baths}
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-end pr-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 rounded-full border border-transparent flex items-center justify-center hover:border-[#DDDDDD] hover:bg-white transition-colors focus:outline-none">
                                      <MoreVertical className="w-5 h-5 text-[#222222] stroke-[1.5]" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#DDDDDD] shadow-[0_2px_16px_rgba(0,0,0,0.12)] p-2">
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/property/${property._id || property.id}`)}
                                      className="cursor-pointer text-[14px] font-medium p-2.5 rounded-lg hover:bg-[#F7F7F7] focus:bg-[#F7F7F7] gap-3 text-[#222222] transition-colors"
                                    >
                                      <Eye className="h-4 w-4 stroke-[2]" /> View listing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/propertyForm?id=${property._id || property.id}`)}
                                      className="cursor-pointer text-[14px] font-medium p-2.5 rounded-lg hover:bg-[#F7F7F7] focus:bg-[#F7F7F7] gap-3 text-[#222222] transition-colors"
                                    >
                                      <Edit className="h-4 w-4 stroke-[2]" /> Edit listing
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#DDDDDD] my-1 mx-1" />
                                    <DropdownMenuItem className="cursor-pointer text-[14px] font-semibold p-2.5 rounded-lg text-[#FF385C] hover:bg-rose-50 focus:bg-rose-50 focus:text-[#FF385C] gap-3 transition-colors">
                                      <Trash2 className="h-4 w-4 stroke-[2]" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDDDDD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #717171;
        }
        /* Hide scrollbar for non-hovering states where acceptable */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </SidebarProvider>
  );
};

// Helper to keep the main component clean
const transformPropertyProps = (p: Property) => {
  const images = p.images || [];
  const imageUrls = images.map(img => typeof img === 'string' ? img : img?.url || '').filter(Boolean);
  return {
    id: p._id || p.id || '',
    image: imageUrls[0] || '',
    images: imageUrls,
    title: p.title || 'Untitled Property',
    location: [p.address, p.city, p.state || p.country].filter(Boolean).join(', ') || 'Location not specified',
    price: p.price || 0,
    beds: p.amenities?.bedrooms ?? p.bedrooms ?? p.beds ?? 0,
    baths: p.amenities?.bathrooms ?? p.bathrooms ?? p.baths ?? 0,
    sqft: p.area || p.sqft || p.squareFeet || 0,
    type: p.listingType || p.type || 'sale',
    status: p.status || p.availability || 'active',
    isFavorite: p.isFavorite || false,
    viewCount: p.viewsCount ?? p.viewCount ?? p.views ?? 0,
    favoriteCount: p.favoriteCount ?? p.favorites ?? 0,
    pricingUnit: (p as any).pricingUnit,
    maxGuests: (p as any).maxGuests ?? (p as any).shortTermAmenities?.maxGuests,
  };
};

export default PropertyPage;