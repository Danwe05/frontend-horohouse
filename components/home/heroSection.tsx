"use client"

import { useState, useEffect, useRef, JSX } from 'react';
import { Search, MapPin, Home, DollarSign, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlaceSuggestion {
  place_name: string;
  text: string;
  place_type: string[];
}

export default function HeroSection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('rent');
  const [visible, setVisible] = useState(true);

  const handleTabChange = (tab: string) => {
    if (tab === selectedTab) return;
    setVisible(false);
    setTimeout(() => {
      setSelectedTab(tab);
      setVisible(true);
    }, 180);
  };

  const tabContent: Record<string, { badge: string; heading: JSX.Element; desc: string }> = {
    sale: {
      badge: t.hero?.tabs?.saleBadge || 'Buy Property',
      heading: (
        <>
          {t.hero?.tabContent?.sale?.heading1 || 'Find Your Forever'}{' '}
          <span className="bg-linear-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">{t.hero?.tabContent?.sale?.heading2 || 'Home'}</span>
        </>
      ),
      desc: t.hero?.tabContent?.sale?.desc || 'Discover premium properties for sale. Invest in your future with our exclusive real estate listings.',
    },
    rent: {
      badge: t.hero?.tabs?.rentBadge || 'Rent Property',
      heading: (
        <>
          {t.hero?.tabContent?.rent?.heading1 || 'Your Perfect'}{' '}
          <span className="bg-linear-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">{t.hero?.tabContent?.rent?.heading2 || 'Rental'}</span>
        </>
      ),
      desc: t.hero?.tabContent?.rent?.desc || 'Explore top-tier apartments and houses for rent. Flexible living tailored to your modern lifestyle.',
    },
    short_term: {
      badge: t.hero?.tabs?.shortStaysBadge || 'Book a Stay',
      heading: (
        <>
          {t.hero?.tabContent?.shortStays?.heading1 || 'Unforgettable'}{' '}
          <span className="bg-linear-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">{t.hero?.tabContent?.shortStays?.heading2 || 'Stays'}</span>
        </>
      ),
      desc: t.hero?.tabContent?.shortStays?.desc || 'Book luxurious vacation rentals and short-term stays. Experience comfort anywhere you travel.',
    },
  };

  const content = tabContent[selectedTab] || tabContent['sale'];
  const [searchData, setSearchData] = useState({
    city: '',
    propertyType: '',
    maxPrice: '',
    checkIn: '',
    checkOut: '',
  });

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const propertyTypes = [
    { value: '', label: t.hero?.search?.anyType || 'Any Type' },
    { value: 'apartment', label: t.hero?.search?.apartment || 'Apartment' },
    { value: 'house', label: t.hero?.search?.house || 'House' },
    { value: 'villa', label: t.hero?.search?.villa || 'Villa' },
    { value: 'condo', label: t.hero?.search?.condo || 'Condo' },
    { value: 'studio', label: t.hero?.search?.studio || 'Studio' },
  ];

  const priceRanges = [
    { value: '', label: t.hero?.search?.anyPrice || 'Any Price' },
    { value: '200000', label: t.hero?.search?.upTo200k || 'Up to 200k XAF' },
    { value: '500000', label: t.hero?.search?.upTo500k || 'Up to 500k XAF' },
    { value: '1000000', label: t.hero?.search?.upTo1M || 'Up to 1M XAF' },
    { value: '2000000', label: t.hero?.search?.upTo2M || 'Up to 2M XAF' },
  ];

  // Fetch place suggestions from Maptiler Geocoding API
  const fetchPlaceSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_MAPTILER_API_KEY is not set");
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&limit=8&autocomplete=true`
      );
      const data = await response.json();

      if (data.features) {
        const places: PlaceSuggestion[] = data.features
          .filter((feature: any) => {
            const types = feature.place_type || [];
            return types.some((type: string) =>
              ['place', 'municipality', 'region', 'district', 'locality', 'neighborhood'].includes(type)
            );
          })
          .map((feature: any) => ({
            place_name: feature.place_name,
            text: feature.text,
            place_type: feature.place_type || [],
          }));

        const sortedPlaces = places.sort((a, b) => {
          const queryLower = query.toLowerCase();
          const aTextLower = a.text.toLowerCase();
          const bTextLower = b.text.toLowerCase();

          const aExact = aTextLower === queryLower;
          const bExact = bTextLower === queryLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          const aStarts = aTextLower.startsWith(queryLower);
          const bStarts = bTextLower.startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          const aHasNumber = /\d|I{2,}|IV|V/.test(a.text);
          const bHasNumber = /\d|I{2,}|IV|V/.test(b.text);
          if (!aHasNumber && bHasNumber) return -1;
          if (aHasNumber && !bHasNumber) return 1;

          return a.text.length - b.text.length;
        });

        setSuggestions(sortedPlaces);
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle city input change with debounce
  const handleCityChange = (value: string) => {
    setSearchData({ ...searchData, city: value });
    setShowSuggestions(true);
    setSelectedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setSearchData({ ...searchData, city: suggestion.text });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search submission
  const handleSearch = () => {
    const params = new URLSearchParams();

    // Add city if provided
    if (searchData.city) {
      params.append('city', searchData.city);
    }

    // Add listing type (sale/rent)
    params.append('listingType', selectedTab);

    if (selectedTab === 'short_term') {
      if (searchData.checkIn) params.append('checkIn', searchData.checkIn);
      if (searchData.checkOut) params.append('checkOut', searchData.checkOut);
    } else {
      if (searchData.propertyType) params.append('propertyType', searchData.propertyType);
      if (searchData.maxPrice) params.append('maxPrice', searchData.maxPrice);
    }

    // Navigate to properties page with search params
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden mt-12">
      <div className="relative flex flex-col lg:flex-row items-center justify-between min-h-screen">

        {/* Left Side: Enhanced Text & Filters */}
        <div className="w-full lg:w-2/5 space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-12 lg:py-8 z-20 order-2 lg:order-1">

          {/* Badge with animation */}
          <div
            className="hidden lg:inline-flex items-center space-x-2 bg-linear-to-r from-blue-100 to-blue-100 text-blue-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)', transition: 'opacity 0.18s ease, transform 0.18s ease' }}
          >
            <span>{content.badge}</span>
          </div>

          {/* Heading — distinct per tab */}
          <div
            className="lg:block hidden space-y-3"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {content.heading}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-md">
              {content.desc}
            </p>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:flex space-x-1 mb-0 bg-white p-1 rounded-tl-2xl rounded-tr-2xl w-[60vw] max-w-md">
            {[
              { value: 'rent', label: t.hero?.tabs?.rent || 'Rent' },
              { value: 'sale', label: t.hero?.tabs?.sale || 'Buy' },
              { value: 'short_term', label: t.hero?.tabs?.shortStays || 'Short Stays' }
            ].map((tab) => (
              <button
                key={tab.value}
                className={`flex-1 py-3 rounded-tl-2xl rounded-tr-2xl font-semibold capitalize transition-all duration-300 transform text-sm ${selectedTab === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                  }`}
                onClick={() => handleTabChange(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box - Desktop */}
          <div className="hidden lg:block w-[70vw] max-w-4xl">
            <div
              className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl rounded-tl-none border border-white/20 hover:shadow-2xl transition-all duration-300 w-full"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                {/* City — always shown */}
                <div className="space-y-2 relative" ref={suggestionsRef}>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{t.hero?.search?.city || 'City'}</span>
                  </label>
                  <div className="relative">
                    {isLoadingSuggestions && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin z-10" />
                    )}
                    <input
                      type="text"
                      placeholder={t.hero?.search?.cityPlaceholder || 'Search a city...'}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70"
                      value={searchData.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => searchData.city && setShowSuggestions(true)}
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 max-h-[320px] overflow-y-auto">
                        <div className="p-1">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-start gap-3 transition-all ${selectedIndex === index ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100'
                                }`}
                            >
                              <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${selectedIndex === index ? 'text-white' : 'text-gray-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${selectedIndex === index ? 'text-white' : 'text-gray-900'}`}>
                                  {suggestion.text}
                                </p>
                                <p className={`text-xs truncate mt-0.5 ${selectedIndex === index ? 'text-white/80' : 'text-gray-500'}`}>
                                  {suggestion.place_name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buy / Rent fields: Property Type + Max Price */}
                {selectedTab !== 'short_term' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                        <Home size={14} />
                        <span>{t.hero?.search?.propertyType || 'Property Type'}</span>
                      </label>
                      <select
                        className="w-full p-2 border border-gray-200 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70"
                        value={searchData.propertyType}
                        onChange={(e) => setSearchData({ ...searchData, propertyType: e.target.value })}
                      >
                        {propertyTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                        <DollarSign size={14} />
                        <span>{t.hero?.search?.maxPrice || 'Max Price'}</span>
                      </label>
                      <select
                        className="w-full p-2 border border-gray-200 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70"
                        value={searchData.maxPrice}
                        onChange={(e) => setSearchData({ ...searchData, maxPrice: e.target.value })}
                      >
                        {priceRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Short Stays fields: Check-in + Check-out */}
                {selectedTab === 'short_term' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                        <DollarSign size={14} />
                        <span>{t.hero?.search?.checkIn || 'Check-in'}</span>
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-200 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70"
                        value={searchData.checkIn}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                        <DollarSign size={14} />
                        <span>{t.hero?.search?.checkOut || 'Check-out'}</span>
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-200 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70"
                        value={searchData.checkOut}
                        min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Search Button */}
                <div className="space-y-2">
                  <button
                    onClick={handleSearch}
                    className="w-full mt-5 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all duration-300 transform active:scale-95"
                  >
                    <Search size={18} />
                    <span>{t.hero?.search?.button || 'Search'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Enhanced Image Section */}
        <div className="w-full lg:w-3/5 relative order-1 lg:order-2">
          <div className="relative h-[50vh] sm:h-[60vh] lg:h-screen">

            {/* Dark gradient overlay for mobile — ensures legibility over any image */}
            <div className="absolute inset-0 lg:hidden z-10 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
            <div
              className="absolute w-full space-y-3 px-4 sm:px-6 mt-10 lg:hidden z-10"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-8px)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}
            >
              <div className="inline-flex items-center bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                <span>{content.badge}</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                  {content.heading}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-xs sm:max-w-sm">
                  {content.desc}
                </p>
              </div>
            </div>

            {/* Main image with enhanced styling */}
            <div className="relative w-full h-full overflow-hidden lg:rounded-l-[3rem]">
              <img
                src="/happy-african-american-young-family-bought-new-house.jpg"
                alt="Luxury modern house with glass facades and contemporary architecture"
                className="w-full h-full object-cover transform transition-transform duration-700"
              />
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex lg:hidden justify-center space-x-1 bg-white mx-d4 p-1 rounded-xl -mt-16 sm:-mt-20 relative z-20 max-w-sm mx-auto">
            {[
              { value: 'rent', label: t.hero?.tabs?.rent || 'Rent' },
              { value: 'sale', label: t.hero?.tabs?.sale || 'Buy' },
              { value: 'short_term', label: t.hero?.tabs?.shortStays || 'Stays' }
            ].map((tab) => (
              <button
                key={tab.value}
                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-semibold capitalize transition-all duration-300 text-sm ${selectedTab === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600'
                  }`}
                onClick={() => handleTabChange(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Search Box */}
          <div className="lg:hidden w-full px-4 mt-4 relative z-20">
            <div
              className="bg-white/90 backdrop-blur-lg p-4 sm:p-5 rounded-2xl w-full max-w-md mx-auto shadow-lg"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}
            >
              <div className="grid grid-cols-1 gap-3 mb-3">

                {/* City — always shown */}
                <div className="relative">
                  <label className="text-xs font-medium text-gray-600 flex items-center space-x-1 mb-1.5">
                    <MapPin size={12} />
                    <span>{t.hero?.search?.city || 'City'}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t.hero?.search?.cityPlaceholder || 'Search city...'}
                    className="w-full p-2.5 sm:p-3 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchData.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {/* Buy / Rent: Type + Price */}
                {selectedTab !== 'short_term' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600 flex items-center space-x-1 mb-1.5">
                        <Home size={12} />
                        <span>{t.hero?.search?.propertyType || 'Type'}</span>
                      </label>
                      <select
                        className="w-full p-2.5 sm:p-3 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-gray-600"
                        value={searchData.propertyType}
                        onChange={(e) => setSearchData({ ...searchData, propertyType: e.target.value })}
                      >
                        {propertyTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 flex items-center space-x-1 mb-1.5">
                        <DollarSign size={12} />
                        <span>{t.hero?.search?.maxPrice || 'Max Price'}</span>
                      </label>
                      <select
                        className="w-full p-2.5 sm:p-3 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-gray-600"
                        value={searchData.maxPrice}
                        onChange={(e) => setSearchData({ ...searchData, maxPrice: e.target.value })}
                      >
                        {priceRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Short Stays: Check-in + Check-out */}
                {selectedTab === 'short_term' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600 flex items-center space-x-1 mb-1.5">
                        <DollarSign size={12} />
                        <span>{t.hero?.search?.checkIn || 'Check-in'}</span>
                      </label>
                      <input
                        type="date"
                        className="w-full p-2.5 sm:p-3 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-gray-600"
                        value={searchData.checkIn}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 flex items-center space-x-1 mb-1.5">
                        <DollarSign size={12} />
                        <span>{t.hero?.search?.checkOut || 'Check-out'}</span>
                      </label>
                      <input
                        type="date"
                        className="w-full p-2.5 sm:p-3 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-gray-600"
                        value={searchData.checkOut}
                        min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white py-3 sm:py-3.5 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-blue-700 transition-all duration-300 active:scale-95"
              >
                <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>{t.hero?.search?.button || 'Search'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}