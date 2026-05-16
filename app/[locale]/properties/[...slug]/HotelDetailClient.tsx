'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Star, MapPin, BedDouble, Wifi, Wind, Bath, Car,
  Waves, Dumbbell, Shield, Share2, Heart, Loader2, AlertCircle,
  ChevronDown, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PropertyGallery from '@/components/property/details/PropertyGallery';
import Neighborhood from '@/components/property/details/Neighborhood';
import Reviews from '@/components/property/details/Reviews';
import SimilarProperties from '@/components/property/details/SimilarProperties';
import { HotelAmenitiesBar } from '@/components/property/hotel/HotelAmenitiesBar';
import { HotelRoomCard } from '@/components/property/hotel/HotelRoomCard';
import { HotelRoomDrawer } from '@/components/property/hotel/HotelRoomDrawer';
import apiClient from '@/lib/api';
import { Room, ROOM_TYPE_OPTIONS } from '@/types/room';
import { useCurrency } from '@/hooks/useCurrency';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChatProvider } from '@/contexts/ChatContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Property {
  _id: string;
  title: string;
  price: number;
  type: string;
  listingType: string;
  images: Array<{ url: string; publicId: string; caption?: string; isMain?: boolean }>;
  description: string;
  starRating?: number;
  agentId?: any;
  ownerId?: any;
  amenities: {
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    hasGarden?: boolean;
    hasPool?: boolean;
    hasGym?: boolean;
    hasSecurity?: boolean;
    hasElevator?: boolean;
    hasBalcony?: boolean;
    hasAirConditioning?: boolean;
    hasInternet?: boolean;
    hasGenerator?: boolean;
    furnished?: boolean;
  };
  city: string;
  address: string;
  neighborhood?: string;
  country?: string;
  location: { type: 'Point'; coordinates: [number, number] };
  area?: number;
  viewsCount?: number;
  availability: string;
  contactPhone?: string;
  contactEmail?: string;
  nearbyAmenities?: string[];
  transportAccess?: string[];
  depositAmount?: number;
  maintenanceFee?: number;
  currency?: string;
  pricingUnit?: 'nightly' | 'weekly' | 'monthly';
  minNights?: number;
  maxNights?: number;
  cleaningFee?: number;
  serviceFee?: number;
  isInstantBookable?: boolean;
  cancellationPolicy?: string;
  advanceNoticeDays?: number;
  bookingWindowDays?: number;
  weeklyDiscountPercent?: number;
  monthlyDiscountPercent?: number;
  shortTermAmenities?: {
    maxGuests?: number;
    checkInTime?: string;
    checkOutTime?: string;
    hasWifi?: boolean;
    hasBreakfast?: boolean;
    hasTv?: boolean;
    hasKitchen?: boolean;
    hasWasher?: boolean;
    hasHeating?: boolean;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    partiesAllowed?: boolean;
    wheelchairAccessible?: boolean;
    airportTransfer?: boolean;
    conciergeService?: boolean;
    dailyHousekeeping?: boolean;
    hasAirConditioning?: boolean;
    hasBath?: boolean;
  };
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Stars display ─────────────────────────────────────────────────────────────

function StarRatingBadge({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4 transition-colors',
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-[#DDDDDD]',
          )}
        />
      ))}
      <span className="text-[13px] font-semibold text-[#717171] ml-1">{rating}-star hotel</span>
    </div>
  );
}

// ─── Property-level amenity grid ───────────────────────────────────────────────

const PROPERTY_AMENITIES: { key: string; label: string; icon: any }[] = [
  { key: 'hasPool',          label: 'Swimming pool',      icon: Waves    },
  { key: 'hasGym',           label: 'Fitness centre',     icon: Dumbbell },
  { key: 'hasSecurity',      label: '24h security',       icon: Shield   },
  { key: 'hasWifi',          label: 'Free WiFi',          icon: Wifi     },
  { key: 'hasAirConditioning', label: 'Air conditioning', icon: Wind     },
  { key: 'hasBath',          label: 'En-suite bath',      icon: Bath     },
  { key: 'parkingSpaces',    label: 'Parking',            icon: Car      },
];

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const HotelDetailSkeleton = () => (
  <div className="min-h-screen bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4">
    <Skeleton className="h-10 w-10 mb-6 rounded-full bg-[#F7F7F7]" />
    <Skeleton className="h-[420px] w-full rounded-2xl bg-[#F7F7F7] mb-6" />
    <div className="space-y-3 mb-8">
      <Skeleton className="h-8 w-2/3 bg-[#F7F7F7]" />
      <Skeleton className="h-5 w-1/3 bg-[#F7F7F7]" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl bg-[#F7F7F7]" />)}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HotelDetailClient({
  id,
  initialData,
}: {
  id: string;
  initialData?: Property;
}) {
  const router = useRouter();
  const { formatMoney } = useCurrency();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { isAuthenticated, user, token } = useAuth();

  const [property, setProperty] = useState<Property | null>(initialData || null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [savingFav, setSavingFav] = useState(false);

  const roomsSectionRef = useRef<HTMLDivElement>(null);

  // ── Fetch property + rooms ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      if (initialData) {
        // Fetch only rooms if property data is already provided
        const roomsData = await apiClient.getRoomsByProperty(id).catch(() => []);
        const roomArr = Array.isArray(roomsData) ? roomsData : roomsData?.rooms ?? [];
        setRooms(roomArr);
      } else {
        // Fetch both property and rooms
        const [propData, roomsData] = await Promise.all([
          apiClient.getProperty(id),
          apiClient.getRoomsByProperty(id).catch(() => []),
        ]);
        setProperty(propData);
        const roomArr = Array.isArray(roomsData) ? roomsData : roomsData?.rooms ?? [];
        setRooms(roomArr);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to load hotel details");
    } finally {
      setLoading(false);
    }
  }, [id, initialData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const saved = property ? isFavorite(property._id) : false;
  const [lng, lat] = property?.location?.coordinates ?? [];
  const agent = property?.agentId || property?.ownerId;
  const agentInitials = agent?.name
    ? agent.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'H';

  const priceRange = rooms.length > 0
    ? (() => {
        const prices = rooms.map(r => r.price ?? property?.price ?? 0).filter(Boolean);
        const lo = Math.min(...prices);
        const hi = Math.max(...prices);
        return lo === hi ? formatMoney(lo) : `${formatMoney(lo)} – ${formatMoney(hi)}`;
      })()
    : property ? formatMoney(property.price) : '';

  const filteredRooms = roomFilter === 'all'
    ? rooms
    : rooms.filter(r => r.roomType === roomFilter);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleToggleFav = async () => {
    if (!isAuthenticated) { toast.error('Log in to save hotels'); return; }
    if (!property || savingFav) return;
    setSavingFav(true);
    try {
      if (saved) { await apiClient.removeFromFavorites(property._id); removeFavorite(property._id); toast.success('Removed from saved'); }
      else        { await apiClient.addToFavorites(property._id);    addFavorite(property._id);    toast.success('Saved');               }
    } catch { toast.error('Something went wrong'); }
    finally { setSavingFav(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: property?.title ?? 'Hotel', url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch {}
  };

  const scrollToRooms = () => {
    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Render guards ────────────────────────────────────────────────────────────
  if (loading) return <HotelDetailSkeleton />;

  if (error || !property) return (
    <div className="min-h-screen bg-white max-w-7xl mx-auto px-6 lg:px-10 py-12 space-y-6">
      <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-12 w-12 p-0 text-[#222222] hover:bg-[#F7F7F7]">
        <ChevronLeft className="h-5 w-5 stroke-2" />
      </Button>
      <Alert className="border-[#FFDFDF] bg-[#FFF8F8] rounded-xl p-6">
        <AlertCircle className="h-5 w-5 text-[#E50000]" />
        <AlertDescription className="text-[#E50000] font-medium text-[15px] ml-2">
          {error || 'Hotel not found'}
        </AlertDescription>
      </Alert>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <ChatProvider token={token ?? ''} apiUrl={process.env.NEXT_PUBLIC_API_URL!} currentUser={user ?? undefined}>
      <div className="min-h-screen bg-white text-[#222222]">

        {/* ── Hero / Gallery ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-0">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[14px] font-medium text-[#717171] hover:text-[#222222] transition-colors mb-5 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <PropertyGallery property={property as any} />
        </div>

        {/* ── Hotel overview ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left — title block */}
            <div className="flex-1 min-w-0">
              {/* Star rating */}
              {property.starRating && property.starRating > 0 && (
                <div className="mb-2">
                  <StarRatingBadge rating={property.starRating} />
                </div>
              )}

              <h1 className="text-[28px] sm:text-[34px] font-bold text-[#222222] leading-tight mb-2">
                {property.title}
              </h1>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-[15px] text-[#717171] mb-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  {[property.address, property.neighborhood, property.city, property.country]
                    .filter(Boolean).join(', ')}
                </span>
              </div>

              {/* Rating + price range badges */}
              <div className="flex flex-wrap items-center gap-3">
                {property.averageRating && (
                  <div className="flex items-center gap-1 text-[14px]">
                    <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
                    <span className="font-semibold">{property.averageRating.toFixed(1)}</span>
                    {property.reviewCount && (
                      <span className="text-[#717171]">· {property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
                <Badge variant="outline" className="text-[13px] px-3 py-1 rounded-full font-medium">
                  From {priceRange} / night
                </Badge>
                {property.shortTermAmenities?.checkInTime && (
                  <span className="text-[13px] text-[#717171]">
                    Check-in from {property.shortTermAmenities.checkInTime}
                  </span>
                )}
              </div>
            </div>

            {/* Right — action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DDDDDD] hover:border-[#222222] text-[14px] font-medium text-[#222222] transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={handleToggleFav}
                disabled={savingFav}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[14px] font-medium transition-colors disabled:opacity-50',
                  saved
                    ? 'border-[#FF385C] text-[#FF385C] hover:bg-[#FFF0F2]'
                    : 'border-[#DDDDDD] text-[#222222] hover:border-[#222222]',
                )}
              >
                {savingFav
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Heart className={cn('w-4 h-4', saved && 'fill-[#FF385C] text-[#FF385C]')} />
                }
                {saved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={scrollToRooms}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#222222] hover:bg-black text-white text-[14px] font-semibold transition-colors active:scale-95"
              >
                View Rooms <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Highlights bar ── */}
          <div className="mt-6 pt-6 border-t border-[#EBEBEB]">
            <HotelAmenitiesBar
              amenities={property.amenities as any}
              shortTermAmenities={property.shortTermAmenities as any}
            />
          </div>
        </div>

        {/* ── Description + property amenities ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 border-t border-[#EBEBEB]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Description */}
            <div className="lg:col-span-2">
              <h2 className="text-[22px] font-semibold text-[#222222] mb-4">About this hotel</h2>
              <p className="text-[15px] text-[#717171] leading-relaxed whitespace-pre-line">
                {property.description}
              </p>

              {/* Quick facts */}
              {(property.amenities.bedrooms || property.amenities.bathrooms || property.area) && (
                <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[#EBEBEB]">
                  {property.amenities.bedrooms && (
                    <div className="flex items-center gap-2 text-[14px] text-[#717171]">
                      <BedDouble className="w-4 h-4" /> {property.amenities.bedrooms} room{property.amenities.bedrooms !== 1 ? 's' : ''}
                    </div>
                  )}
                  {property.amenities.bathrooms && (
                    <div className="flex items-center gap-2 text-[14px] text-[#717171]">
                      <Bath className="w-4 h-4" /> {property.amenities.bathrooms} bathroom{property.amenities.bathrooms !== 1 ? 's' : ''}
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-2 text-[14px] text-[#717171]">
                      {property.area} m²
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Property amenities grid */}
            <div>
              <h2 className="text-[18px] font-semibold text-[#222222] mb-4">Hotel facilities</h2>
              <div className="space-y-3">
                {PROPERTY_AMENITIES.filter(a => {
                  if (a.key === 'parkingSpaces') return (property.amenities.parkingSpaces ?? 0) > 0;
                  if (a.key === 'hasWifi') return property.shortTermAmenities?.hasWifi;
                  if (a.key === 'hasAirConditioning') return property.shortTermAmenities?.hasAirConditioning;
                  if (a.key === 'hasBath') return property.shortTermAmenities?.hasBath;
                  return (property.amenities as any)[a.key];
                }).map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-3 text-[14px] text-[#222222]">
                    <div className="w-9 h-9 rounded-xl bg-[#F7F7F7] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#717171]" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>

              {/* Agent / host card */}
              {agent && (
                <div className="mt-8 p-5 border border-[#EBEBEB] rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      {agent.profilePicture && <AvatarImage src={agent.profilePicture} alt={agent.name} />}
                      <AvatarFallback className="bg-[#222222] text-white text-[14px] font-semibold">{agentInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[15px] font-semibold text-[#222222]">{agent.name}</p>
                      <p className="text-[13px] text-[#717171]">Hotel Host</p>
                    </div>
                  </div>
                  {agent.phoneNumber && (
                    <a
                      href={`tel:${agent.phoneNumber}`}
                      className="block w-full text-center py-2.5 border border-[#222222] rounded-xl text-[14px] font-semibold hover:bg-[#F7F7F7] transition-colors"
                    >
                      {agent.phoneNumber}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Rooms section ── */}
        <div
          ref={roomsSectionRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 border-t border-[#EBEBEB]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[24px] font-bold text-[#222222]">Available rooms</h2>
              <p className="text-[14px] text-[#717171] mt-0.5">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} · Select a room to view details and book
              </p>
            </div>

            {/* Room type filter */}
            {rooms.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                <button
                  onClick={() => setRoomFilter('all')}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all',
                    roomFilter === 'all'
                      ? 'border-[#222222] bg-[#222222] text-white'
                      : 'border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]',
                  )}
                >
                  All
                </button>
                {ROOM_TYPE_OPTIONS.filter(opt => rooms.some(r => r.roomType === opt.value)).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRoomFilter(opt.value)}
                    className={cn(
                      'shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all',
                      roomFilter === opt.value
                        ? 'border-[#222222] bg-[#222222] text-white'
                        : 'border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#DDDDDD] rounded-2xl">
              <BedDouble className="w-12 h-12 text-[#B0B0B0] mx-auto mb-4" />
              <p className="text-[16px] font-semibold text-[#222222] mb-1">No rooms listed yet</p>
              <p className="text-[14px] text-[#717171]">Check back soon or contact the hotel directly.</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#DDDDDD] rounded-2xl">
              <Search className="w-10 h-10 text-[#B0B0B0] mx-auto mb-3" />
              <p className="text-[15px] font-semibold text-[#222222]">No rooms match this filter</p>
              <button onClick={() => setRoomFilter('all')} className="mt-3 text-[14px] underline text-[#717171]">
                Clear filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRooms.map(room => (
                <HotelRoomCard
                  key={room._id}
                  room={room}
                  propertyPrice={property.price}
                  onSelect={setSelectedRoom}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Neighborhood ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 border-t border-[#EBEBEB]">
          <Neighborhood
            property={{
              city: property.city,
              neighborhood: property.neighborhood,
              nearbyAmenities: property.nearbyAmenities ?? [],
              transportAccess: property.transportAccess ?? [],
              latitude: lat,
              longitude: lng,
            }}
          />
        </div>

        {/* ── Reviews ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 border-t border-[#EBEBEB]">
          <Reviews propertyId={property._id} />
        </div>

        {/* ── Similar properties ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 border-t border-[#EBEBEB]">
          <SimilarProperties
            propertyId={property._id}
            city={property.city}
            type={property.type}
            listingType={property.listingType as 'rent' | 'sale'}
          />
        </div>

        {/* ── Mobile "View Rooms" sticky bar ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] px-5 py-3.5 z-30 shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] text-[#717171]">From</p>
              <p className="text-[17px] font-bold text-[#222222]">{priceRange} <span className="text-[13px] font-normal text-[#717171]">/ night</span></p>
            </div>
            <button
              onClick={scrollToRooms}
              className="h-[48px] px-6 rounded-xl bg-[#222222] text-white font-semibold text-[15px] hover:bg-black transition-colors active:scale-95"
            >
              View Rooms
            </button>
          </div>
        </div>

        {/* ── Room drawer ── */}
        <HotelRoomDrawer
          room={selectedRoom}
          property={property as any}
          onClose={() => setSelectedRoom(null)}
        />
      </div>
    </ChatProvider>
  );
}
