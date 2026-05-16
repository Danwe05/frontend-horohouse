'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PropertyForm from '@/components/dashboard/PropertyForm';
import RoomManager from '@/components/dashboard/RoomManager';
import { Loader2, AlertCircle, Building2, BedDouble, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';

// ── Must stay in sync with PropertyForm's PropertyFormData ────────────────────

interface PropertyImage {
  id: string;
  file: File;
  preview: string;
  caption: string;
  category: string;
}

interface PropertyFormData {
  // Basic
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: string;

  // Details
  area: string;
  yearBuilt: string;
  floorNumber: string;
  totalFloors: string;
  pricePerSqm: string;
  depositAmount: string;
  maintenanceFee: string;

  // Location
  address: string;
  city: string;
  neighborhood: string;
  country: string;
  latitude: string;
  longitude: string;

  // Amenities
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  hasGarden: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasSecurity: boolean;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasAirConditioning: boolean;
  hasInternet: boolean;
  hasGenerator: boolean;
  furnished: boolean;

  // Short-term rental
  pricingUnit: string;
  minNights: number;
  maxNights: number;
  cleaningFee: string;
  serviceFee: string;
  isInstantBookable: boolean;
  cancellationPolicy: string;
  advanceNoticeDays: number;
  bookingWindowDays: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;

  // Short-term amenities
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
  hasWifi: boolean;
  hasBreakfast: boolean;
  hasTv: boolean;
  hasKitchen: boolean;
  hasWasher: boolean;
  hasHeating: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  wheelchairAccessible: boolean;
  airportTransfer: boolean;
  conciergeService: boolean;
  dailyHousekeeping: boolean;

  // Features
  keywords: string;
  nearbyAmenities: string[];
  transportAccess: string[];

  // Media
  images: PropertyImage[];
  floorPlan: File | null;
  floorPlanPreview: string;
  documents: File[];
  virtualTourUrl: string;
  videoUrl: string;
  tourType: string;

  // Hotel-specific
  starRating: number;
  pendingRooms: any[];
}

const HOTEL_TYPES = ['hotel', 'motel', 'hostel', 'guesthouse'];

// ── Page ──────────────────────────────────────────────────────────────────────

const PropertyEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<PropertyFormData | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rooms'>('details');

  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProperty(propertyId);

        const propertyData: PropertyFormData = {
          // Basic
          title: data.title || '',
          description: data.description || '',
          type: data.type || 'apartment',
          listingType: data.listingType || 'sale',
          price: String(data.price || ''),

          // Details
          area: String(data.area || ''),
          yearBuilt: String(data.yearBuilt || ''),
          floorNumber: String(data.floorNumber || ''),
          totalFloors: String(data.totalFloors || ''),
          pricePerSqm: String(data.pricePerSqm || ''),
          depositAmount: String(data.depositAmount || ''),
          maintenanceFee: String(data.maintenanceFee || ''),

          // Location
          address: data.address || '',
          city: data.city || '',
          neighborhood: data.neighborhood || '',
          country: data.country || '',
          latitude: String(data.latitude || ''),
          longitude: String(data.longitude || ''),

          // Amenities
          bedrooms: data.amenities?.bedrooms || 1,
          bathrooms: data.amenities?.bathrooms || 1,
          parkingSpaces: data.amenities?.parkingSpaces || 0,
          hasGarden: data.amenities?.hasGarden || false,
          hasPool: data.amenities?.hasPool || false,
          hasGym: data.amenities?.hasGym || false,
          hasSecurity: data.amenities?.hasSecurity || false,
          hasElevator: data.amenities?.hasElevator || false,
          hasBalcony: data.amenities?.hasBalcony || false,
          hasAirConditioning: data.amenities?.hasAirConditioning || false,
          hasInternet: data.amenities?.hasInternet || false,
          hasGenerator: data.amenities?.hasGenerator || false,
          furnished: data.amenities?.furnished || false,

          // Short-term rental
          pricingUnit: data.pricingUnit || 'nightly',
          minNights: data.minNights ?? 1,
          maxNights: data.maxNights ?? 365,
          cleaningFee: String(data.cleaningFee ?? '0'),
          serviceFee: String(data.serviceFee ?? '0'),
          isInstantBookable: data.isInstantBookable || false,
          cancellationPolicy: data.cancellationPolicy || 'flexible',
          advanceNoticeDays: data.advanceNoticeDays ?? 0,
          bookingWindowDays: data.bookingWindowDays ?? 365,
          weeklyDiscountPercent: data.weeklyDiscountPercent ?? 0,
          monthlyDiscountPercent: data.monthlyDiscountPercent ?? 0,

          // Short-term amenities
          maxGuests: data.shortTermAmenities?.maxGuests ?? 2,
          checkInTime: data.shortTermAmenities?.checkInTime || '14:00',
          checkOutTime: data.shortTermAmenities?.checkOutTime || '11:00',
          hasWifi: data.shortTermAmenities?.hasWifi || false,
          hasBreakfast: data.shortTermAmenities?.hasBreakfast || false,
          hasTv: data.shortTermAmenities?.hasTv || false,
          hasKitchen: data.shortTermAmenities?.hasKitchen || false,
          hasWasher: data.shortTermAmenities?.hasWasher || false,
          hasHeating: data.shortTermAmenities?.hasHeating || false,
          petsAllowed: data.shortTermAmenities?.petsAllowed || false,
          smokingAllowed: data.shortTermAmenities?.smokingAllowed || false,
          partiesAllowed: data.shortTermAmenities?.partiesAllowed || false,
          wheelchairAccessible: data.shortTermAmenities?.wheelchairAccessible || false,
          airportTransfer: data.shortTermAmenities?.airportTransfer || false,
          conciergeService: data.shortTermAmenities?.conciergeService || false,
          dailyHousekeeping: data.shortTermAmenities?.dailyHousekeeping || false,

          // Features
          keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : (data.keywords || ''),
          nearbyAmenities: data.nearbyAmenities || [],
          transportAccess: data.transportAccess || [],

          // Media
          images: (data.images || []).map((img: any, index: number) => ({
            id: `existing-${index}`,
            file: null as any,
            preview: img.url || img,
            caption: img.caption || '',
            category: img.category || 'general',
          })),
          floorPlan: null,
          floorPlanPreview: data.floorPlanUrl || '',
          documents: [],
          virtualTourUrl: data.virtualTourUrl || '',
          videoUrl: data.videoUrl || '',
          tourType: data.tourType || 'images',

          // Hotel-specific
          starRating: data.starRating ?? 0,
          pendingRooms: [],
        };

        setInitialData(propertyData);
      } catch (err: any) {
        console.error('Error fetching property:', err);
        setError(err.message || 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const handleUpdateProperty = async (formData: PropertyFormData) => {
    try {
      await apiClient.updateProperty(propertyId, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        listingType: formData.listingType,
        price: Number(formData.price),
        area: formData.area ? Number(formData.area) : undefined,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
        floorNumber: formData.floorNumber ? Number(formData.floorNumber) : undefined,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : undefined,
        pricePerSqm: formData.pricePerSqm ? Number(formData.pricePerSqm) : undefined,
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        maintenanceFee: formData.maintenanceFee ? Number(formData.maintenanceFee) : undefined,
        address: formData.address,
        city: formData.city,
        neighborhood: formData.neighborhood || undefined,
        country: formData.country || undefined,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
        nearbyAmenities: formData.nearbyAmenities,
        transportAccess: formData.transportAccess,
        virtualTourUrl: formData.virtualTourUrl || undefined,
        videoUrl: formData.videoUrl || undefined,
        tourType: formData.tourType || undefined,
        pricingUnit: formData.pricingUnit || undefined,
        minNights: Number(formData.minNights) || 1,
        maxNights: Number(formData.maxNights) || 365,
        cleaningFee: Number(formData.cleaningFee) || 0,
        serviceFee: Number(formData.serviceFee) || 0,
        isInstantBookable: formData.isInstantBookable,
        cancellationPolicy: formData.cancellationPolicy || undefined,
        advanceNoticeDays: Number(formData.advanceNoticeDays) || 0,
        bookingWindowDays: Number(formData.bookingWindowDays) || 365,
        weeklyDiscountPercent: Number(formData.weeklyDiscountPercent) || 0,
        monthlyDiscountPercent: Number(formData.monthlyDiscountPercent) || 0,
        starRating: formData.starRating ?? undefined,
        amenities: {
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          parkingSpaces: formData.parkingSpaces,
          hasGarden: formData.hasGarden,
          hasPool: formData.hasPool,
          hasGym: formData.hasGym,
          hasSecurity: formData.hasSecurity,
          hasElevator: formData.hasElevator,
          hasBalcony: formData.hasBalcony,
          hasAirConditioning: formData.hasAirConditioning,
          hasInternet: formData.hasInternet,
          hasGenerator: formData.hasGenerator,
          furnished: formData.furnished,
        },
        shortTermAmenities: formData.listingType === 'short_term' ? {
          hasWifi: formData.hasWifi,
          hasBreakfast: formData.hasBreakfast,
          hasTv: formData.hasTv,
          hasKitchen: formData.hasKitchen,
          hasWasher: formData.hasWasher,
          hasHeating: formData.hasHeating,
          hasAirConditioning: formData.hasAirConditioning,
          petsAllowed: formData.petsAllowed,
          smokingAllowed: formData.smokingAllowed,
          partiesAllowed: formData.partiesAllowed,
          wheelchairAccessible: formData.wheelchairAccessible,
          airportTransfer: formData.airportTransfer,
          conciergeService: formData.conciergeService,
          dailyHousekeeping: formData.dailyHousekeeping,
          maxGuests: Number(formData.maxGuests) || 2,
          checkInTime: formData.checkInTime || undefined,
          checkOutTime: formData.checkOutTime || undefined,
        } : undefined,
      });

      const newImageFiles = formData.images.filter(img => img.file).map(img => img.file);
      if (newImageFiles.length > 0) {
        await apiClient.uploadPropertyImages(propertyId, newImageFiles);
      }

      router.push('/dashboard/property');
    } catch (err: any) {
      console.error('Error updating property:', err);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#222222]" />
        <p className="text-[#717171] text-sm font-medium">Loading your listing…</p>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !initialData) return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[#222222] mb-2">Couldn't load listing</h2>
        <p className="text-[#717171] text-sm mb-6">{error || 'Listing not found'}</p>
        <button
          onClick={() => router.push('/dashboard/property')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#DDDDDD] text-[#222222] text-sm font-semibold hover:bg-[#F7F7F7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
      </div>
    </div>
  );

  const isHotelType = HOTEL_TYPES.includes(initialData.type?.toLowerCase());

  // ── Hotel: fullscreen layout with tab bar above the form ──────────────────

  if (isHotelType) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Minimal top nav for hotel — sits above PropertyForm's own header */}
        {activeTab === 'rooms' && (
          <header className="fixed top-0 left-0 right-0 z-50 h-[72px] px-6 flex items-center justify-between bg-white border-b border-[#EBEBEB]">
            <button
              onClick={() => setActiveTab('details')}
              className="flex items-center gap-2 text-sm font-semibold text-[#222222] hover:text-[#717171] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Property details
            </button>
            <div className="flex items-center gap-1 bg-[#F7F7F7] rounded-full p-1">
              <button
                onClick={() => setActiveTab('details')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all text-[#717171] hover:text-[#222222]"
              >
                <Building2 className="w-3.5 h-3.5" /> Details
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all bg-white text-[#222222] shadow-sm"
              >
                <BedDouble className="w-3.5 h-3.5" /> Manage rooms
              </button>
            </div>
            <button
              onClick={() => router.push('/dashboard/property')}
              className="text-sm font-semibold text-[#222222] underline hover:text-[#717171] transition-colors"
            >
              Exit
            </button>
          </header>
        )}

        {activeTab === 'details' ? (
          /* PropertyForm renders its own full-page header + steps */
          <PropertyForm
            key={propertyId}
            onAdd={handleUpdateProperty}
            initialData={initialData}
            propertyId={propertyId}
            isEditMode={true}
          />
        ) : (
          <div className="flex-1 pt-[72px]">
            <div className="max-w-3xl mx-auto px-6 py-10">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-[#222222]">Manage rooms</h1>
                <p className="text-[#717171] text-sm mt-1">{initialData.title}</p>
              </div>
              <RoomManager propertyId={propertyId} />
            </div>
          </div>
        )}

        {/* Switch to Rooms tab — floating pill shown on details tab */}
        {activeTab === 'details' && (
          <button
            onClick={() => setActiveTab('rooms')}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-[#222222] text-white rounded-full text-sm font-semibold shadow-lg hover:bg-[#111] transition-colors"
          >
            <BedDouble className="w-4 h-4" /> Manage rooms
          </button>
        )}
      </div>
    );
  }

  // ── Standard property: just render PropertyForm fullscreen ─────────────────

  return (
    <PropertyForm
      key={propertyId}
      onAdd={handleUpdateProperty}
      initialData={initialData}
      propertyId={propertyId}
      isEditMode={true}
    />
  );
};

export default PropertyEditPage;