'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import PropertyForm from '@/components/dashboard/PropertyForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PropertyEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [initialData, setInitialData] = useState<PropertyFormData | null>(null);

  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProperty(propertyId);

        const propertyData: PropertyFormData = {
          // Basic
          title:       data.title       || '',
          description: data.description || '',
          type:        data.type        || 'apartment',
          listingType: data.listingType || 'sale',
          price:       String(data.price || ''),

          // Details
          area:           String(data.area           || ''),
          yearBuilt:      String(data.yearBuilt      || ''),
          floorNumber:    String(data.floorNumber    || ''),
          totalFloors:    String(data.totalFloors    || ''),
          pricePerSqm:    String(data.pricePerSqm    || ''),
          depositAmount:  String(data.depositAmount  || ''),
          maintenanceFee: String(data.maintenanceFee || ''),

          // Location
          address:      data.address      || '',
          city:         data.city         || '',
          neighborhood: data.neighborhood || '',
          country:      data.country      || '',
          latitude:     String(data.latitude  || ''),
          longitude:    String(data.longitude || ''),

          // Amenities
          bedrooms:          data.amenities?.bedrooms      || 1,
          bathrooms:         data.amenities?.bathrooms     || 1,
          parkingSpaces:     data.amenities?.parkingSpaces || 0,
          hasGarden:         data.amenities?.hasGarden         || false,
          hasPool:           data.amenities?.hasPool           || false,
          hasGym:            data.amenities?.hasGym            || false,
          hasSecurity:       data.amenities?.hasSecurity       || false,
          hasElevator:       data.amenities?.hasElevator       || false,
          hasBalcony:        data.amenities?.hasBalcony        || false,
          hasAirConditioning:data.amenities?.hasAirConditioning|| false,
          hasInternet:       data.amenities?.hasInternet       || false,
          hasGenerator:      data.amenities?.hasGenerator      || false,
          furnished:         data.amenities?.furnished         || false,

          // Short-term rental
          pricingUnit:        data.pricingUnit        || 'nightly',
          minNights:          data.minNights          ?? 1,
          maxNights:          data.maxNights          ?? 365,
          cleaningFee:        String(data.cleaningFee  ?? '0'),
          serviceFee:         String(data.serviceFee   ?? '0'),
          isInstantBookable:  data.isInstantBookable  || false,
          cancellationPolicy: data.cancellationPolicy || 'flexible',
          advanceNoticeDays:  data.advanceNoticeDays  ?? 0,
          bookingWindowDays:  data.bookingWindowDays  ?? 365,

          // Short-term amenities
          maxGuests:          data.shortTermAmenities?.maxGuests          ?? 2,
          checkInTime:        data.shortTermAmenities?.checkInTime        || '14:00',
          checkOutTime:       data.shortTermAmenities?.checkOutTime       || '11:00',
          hasWifi:            data.shortTermAmenities?.hasWifi            || false,
          hasBreakfast:       data.shortTermAmenities?.hasBreakfast       || false,
          hasTv:              data.shortTermAmenities?.hasTv              || false,
          hasKitchen:         data.shortTermAmenities?.hasKitchen         || false,
          hasWasher:          data.shortTermAmenities?.hasWasher          || false,
          hasHeating:         data.shortTermAmenities?.hasHeating         || false,
          petsAllowed:        data.shortTermAmenities?.petsAllowed        || false,
          smokingAllowed:     data.shortTermAmenities?.smokingAllowed     || false,
          partiesAllowed:     data.shortTermAmenities?.partiesAllowed     || false,
          wheelchairAccessible: data.shortTermAmenities?.wheelchairAccessible || false,
          airportTransfer:    data.shortTermAmenities?.airportTransfer    || false,
          conciergeService:   data.shortTermAmenities?.conciergeService   || false,
          dailyHousekeeping:  data.shortTermAmenities?.dailyHousekeeping  || false,

          // Features
          keywords:        data.keywords        || '',
          nearbyAmenities: data.nearbyAmenities || [],
          transportAccess: data.transportAccess || [],

          // Media
          images: (data.images || []).map((img: any, index: number) => ({
            id:       `existing-${index}`,
            file:     null as any,
            preview:  img.url || img,
            caption:  img.caption  || '',
            category: img.category || 'general',
          })),
          floorPlan:        null,
          floorPlanPreview: data.floorPlanUrl || '',
          documents:        [],
          virtualTourUrl:   data.virtualTourUrl || '',
          videoUrl:         data.videoUrl       || '',
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
    console.log('Property updated:', formData);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading property data...</p>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !initialData) return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Property</h2>
              <p className="text-gray-600 mb-6">{error || 'Property not found'}</p>
              <Button
                onClick={() => router.push('/dashboard/properties')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Back to Properties
              </Button>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="flex-1 flex flex-col lg:flex-row min-h-screen pt-14 lg:pt-0">
            <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:border-none lg:shadow-none lg:rounded-none">
                <PropertyForm
                  onAdd={handleUpdateProperty}
                  initialData={initialData}
                  propertyId={propertyId}
                  isEditMode={true}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PropertyEditPage;