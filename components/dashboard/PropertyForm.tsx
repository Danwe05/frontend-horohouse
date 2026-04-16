'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { createPropertyWithMedia } from '@/lib/services/propertyCreateWithMedia';
import { apiClient } from '@/lib/api';
import dynamic from 'next/dynamic';
import {
  Building2, Home, CheckCircle2, Wrench, Image as ImageIcon,
  Globe, X, Star, Users, Shield, GraduationCap, Zap, Tag, Coffee,
  Hotel, Trees, Dumbbell, Landmark, ShoppingBag, Car, Wifi,
  Navigation, Train, Bus, Plane, ChevronDown, Wind,
} from 'lucide-react';
import { StudentEnrollmentStep, StudentEnrollmentData } from '@/components/dashboard/StudentEnrollmentStep';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Lazy-load MapView — never blocks form paint, survives step transitions
const MapView = dynamic(() => import('@/components/property/MapView'), {
  ssr: false,
  loading: () => <div className="h-[300px] rounded-xl bg-[#EBEBEB] animate-pulse" />,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationSuggestion = {
  id: string;
  label: string;
  lng: number;
  lat: number;
  city?: string;
  country?: string;
  raw?: any;
};

interface PropertyImage {
  id: string;
  file: File;
  preview: string;
  caption: string;
  category: string;
}

interface PropertyFormData {
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: string;
  area: string;
  yearBuilt: string;
  floorNumber: string;
  totalFloors: string;
  pricePerSqm: string;
  depositAmount: string;
  maintenanceFee: string;
  address: string;
  city: string;
  neighborhood: string;
  country: string;
  latitude: string;
  longitude: string;
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
  keywords: string;
  nearbyAmenities: string[];
  transportAccess: string[];
  images: PropertyImage[];
  floorPlan: File | null;
  floorPlanPreview: string;
  documents: File[];
  virtualTourUrl: string;
  videoUrl: string;
  tourType: string;
}

interface PropertyFormProps {
  onAdd: (property: PropertyFormData) => void;
  initialData?: PropertyFormData | null;
  propertyId?: string;
  isEditMode?: boolean;
}

// ─── Draft helpers ────────────────────────────────────────────────────────────

const DRAFT_KEY = 'horohouse_property_draft';

function saveDraft(data: PropertyFormData) {
  try {
    const { images, floorPlan, documents, ...rest } = data;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
  } catch { /* quota exceeded — silently skip */ }
}

function loadDraft(): Partial<PropertyFormData> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { }
}

// ─── Step system ──────────────────────────────────────────────────────────────

type StepDef = { id: string; label: string };

function getSteps(listingType: string): StepDef[] {
  const base: StepDef[] = [
    { id: 'basics', label: 'Basics' },
    { id: 'location', label: 'Location' },
    { id: 'details', label: 'Details' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'nearby', label: 'Nearby' },
    { id: 'photos', label: 'Photos' },
  ];
  if (listingType === 'rent') base.push({ id: 'students', label: 'Students' });
  if (listingType === 'short_term') base.push({ id: 'booking', label: 'Booking' });
  base.push({ id: 'review', label: 'Review' });
  return base;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FORM: PropertyFormData = {
  title: '', description: '', type: 'apartment', listingType: 'sale',
  price: '', area: '', yearBuilt: '', floorNumber: '', totalFloors: '',
  pricePerSqm: '', depositAmount: '', maintenanceFee: '',
  address: '', city: '', neighborhood: '', country: '',
  latitude: '', longitude: '',
  bedrooms: 1, bathrooms: 1, parkingSpaces: 0,
  hasGarden: false, hasPool: false, hasGym: false, hasSecurity: false,
  hasElevator: false, hasBalcony: false, hasAirConditioning: false,
  hasInternet: false, hasGenerator: false, furnished: false,
  pricingUnit: 'nightly', minNights: 1, maxNights: 365,
  cleaningFee: '0', serviceFee: '0', isInstantBookable: false,
  cancellationPolicy: 'flexible', advanceNoticeDays: 0, bookingWindowDays: 365,
  weeklyDiscountPercent: 0, monthlyDiscountPercent: 0, maxGuests: 2,
  checkInTime: '14:00', checkOutTime: '11:00',
  hasWifi: false, hasBreakfast: false, hasTv: false, hasKitchen: false,
  hasWasher: false, hasHeating: false, petsAllowed: false, smokingAllowed: false,
  partiesAllowed: false, wheelchairAccessible: false, airportTransfer: false,
  conciergeService: false, dailyHousekeeping: false,
  keywords: '', nearbyAmenities: [], transportAccess: [],
  images: [], floorPlan: null, floorPlanPreview: '', documents: [],
  virtualTourUrl: '', videoUrl: '', tourType: 'images',
};

// ─── Icon stand-ins for lucide versions that may lack newer icons ──────────────
// Replace these with the real imports once you confirm they exist in your version.
const Waves = (p: any) => <Globe {...p} />;
const WashingMachine = (p: any) => <Wrench {...p} />;
const Tv = (p: any) => <Globe {...p} />;
const Flame = (p: any) => <Zap {...p} />;
const PawPrint = (p: any) => <Star {...p} />;
const Cigarette = (p: any) => <Globe {...p} />;
const Accessibility = (p: any) => <Users {...p} />;
const ConciergeBell = (p: any) => <Star {...p} />;
const Sparkles = (p: any) => <Star {...p} />;
const PartyPopper = (p: any) => <Star {...p} />;
const BedDouble = (p: any) => <Home {...p} />;
const Bath = (p: any) => <Home {...p} />;
const ParkingCircle = (p: any) => <Car {...p} />;
const SquareDashed = (p: any) => <Globe {...p} />;
const CalendarClock = (p: any) => <Hotel {...p} />;
const Utensils = (p: any) => <Coffee {...p} />;

// ─── Small UI atoms ───────────────────────────────────────────────────────────

const SelectCard = ({ selected, onClick, icon: Icon, title }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-start gap-3 p-4 rounded-xl border-1 transition-all w-full text-left
      ${selected
        ? 'border-[#222222] bg-[#F7F7F7]'
        : 'border-[#DDDDDD] hover:border-[#222222] bg-white'}`}
  >
    <Icon className="w-7 h-7 text-[#222222]" />
    <span className="font-semibold text-[#222222] text-sm leading-snug">{title}</span>
  </button>
);

const InputLabel = ({ title, subtitle }: any) => (
  <div className="mb-2">
    <Label className="text-[#222222] text-base font-semibold block">{title}</Label>
    {subtitle && <span className="text-sm text-[#717171]">{subtitle}</span>}
  </div>
);

const FormInput = ({ className = '', ...props }: any) => (
  <input
    {...props}
    className={`w-full p-4 text-base border border-[#DDDDDD] rounded-xl text-[#222222] bg-white transition-colors outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] placeholder-[#B0B0B0] ${className}`}
  />
);

const CounterRow = ({ title, subtitle, value, onIncrement, onDecrement, min = 0, icon: Icon }: any) => (
  <div className="flex items-center justify-between py-5 border-b border-[#EBEBEB] last:border-0">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-5 h-5 text-[#717171]" />}
      <div>
        <div className="text-base text-[#222222] font-semibold">{title}</div>
        {subtitle && <div className="text-sm text-[#717171]">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        className="w-9 h-9 rounded-full border border-[#DDDDDD] flex items-center justify-center text-xl text-[#717171] hover:border-[#222222] hover:text-[#222222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >−</button>
      <span className="w-6 text-center text-base font-semibold text-[#222222]">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-9 h-9 rounded-full border border-[#DDDDDD] flex items-center justify-center text-xl text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
      >+</button>
    </div>
  </div>
);

// Amenity card — icon + label, distinct per feature
const AmenityCard = ({ name, label, icon: Icon, checked, onToggle }: {
  name: string; label: string; icon: any; checked: boolean; onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-1 transition-all text-left w-full
      ${checked
        ? 'border-[#222222] bg-[#F7F7F7] text-[#222222]'
        : 'border-[#DDDDDD] bg-white text-[#717171] hover:border-[#222222] hover:text-[#222222]'}`}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

// Persistent listing type badge in header
const ListingTypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, { label: string; color: string }> = {
    sale: { label: 'For Sale', color: 'bg-emerald-100 text-emerald-700' },
    rent: { label: 'For Rent', color: 'bg-blue-100 text-blue-700' },
    short_term: { label: 'Short Stay', color: 'bg-orange-100 text-orange-700' },
  };
  const cfg = map[type] || map.sale;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// Breadcrumb in header — shows all step names, highlights current
const StepBreadcrumb = ({ steps, current }: { steps: StepDef[]; current: number }) => (
  <div className="hidden sm:flex items-center gap-1 text-sm">
    {steps.map((s, i) => (
      <React.Fragment key={s.id}>
        <span className={`font-semibold transition-colors ${i === current - 1 ? 'text-[#222222]' : 'text-[#B0B0B0]'}`}>
          {s.label}
        </span>
        {i < steps.length - 1 && <span className="text-[#DDDDDD] mx-0.5">›</span>}
      </React.Fragment>
    ))}
  </div>
);

// ─── Amenity definitions (each with its own distinct icon) ────────────────────

const BASE_AMENITIES = [
  { name: 'hasWifi', label: 'WiFi', icon: Wifi },
  { name: 'hasTv', label: 'TV', icon: Tv },
  { name: 'hasKitchen', label: 'Kitchen', icon: Utensils },
  { name: 'hasWasher', label: 'Washer', icon: WashingMachine },
  { name: 'hasAirConditioning', label: 'Air Conditioning', icon: Wind },
  { name: 'hasPool', label: 'Pool', icon: Waves },
  { name: 'hasGarden', label: 'Garden', icon: Trees },
  { name: 'hasGym', label: 'Gym', icon: Dumbbell },
  { name: 'hasSecurity', label: 'Security', icon: Shield },
  { name: 'hasElevator', label: 'Elevator', icon: Building2 },
  { name: 'hasBalcony', label: 'Balcony', icon: SquareDashed },
  { name: 'hasGenerator', label: 'Generator', icon: Zap },
  { name: 'hasInternet', label: 'Internet', icon: Globe },
  { name: 'furnished', label: 'Furnished', icon: Home },
  { name: 'hasHeating', label: 'Heating', icon: Flame },
];

const SHORT_TERM_AMENITIES = [
  { name: 'hasBreakfast', label: 'Breakfast', icon: Coffee },
  { name: 'petsAllowed', label: 'Pets OK', icon: PawPrint },
  { name: 'smokingAllowed', label: 'Smoking OK', icon: Cigarette },
  { name: 'wheelchairAccessible', label: 'Wheelchair', icon: Accessibility },
  { name: 'airportTransfer', label: 'Airport Transfer', icon: Plane },
  { name: 'conciergeService', label: 'Concierge', icon: ConciergeBell },
  { name: 'dailyHousekeeping', label: 'Housekeeping', icon: Sparkles },
  { name: 'partiesAllowed', label: 'Parties OK', icon: PartyPopper },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const PropertyForm: React.FC<PropertyFormProps> = ({
  onAdd,
  initialData = null,
  propertyId = null,
  isEditMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [showLatLng, setShowLatLng] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const { t } = useLanguage();

  // Initialize from initialData (edit) or draft or defaults
  const [formData, setFormData] = useState<PropertyFormData>(() => {
    if (initialData) return initialData;
    const draft = loadDraft();
    return draft ? { ...DEFAULT_FORM, ...draft } : DEFAULT_FORM;
  });

  const steps = useMemo(() => getSteps(formData.listingType), [formData.listingType]);
  const totalSteps = steps.length;
  const currentStepId = steps[currentStep - 1]?.id;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const displayedAmenities = formData.listingType === 'short_term'
    ? [...BASE_AMENITIES, ...SHORT_TERM_AMENITIES]
    : BASE_AMENITIES;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [studentEnrollment, setStudentEnrollment] = useState<StudentEnrollmentData>({ enabled: false });
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [cityTouched, setCityTouched] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSourceTab, setVideoSourceTab] = useState<'local' | 'url'>('local');
  const router = useRouter();

  const mapTilerKey = useMemo(() => process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '', []);

  // Stable map location — only changes when coords actually differ
  const memoizedMapLocation = useMemo(
    () => selectedMapLocation,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedMapLocation?.lng, selectedMapLocation?.lat]
  );

  const propertyTypes = [
    'apartment', 'house', 'villa', 'studio', 'duplex', 'bungalow', 'penthouse',
    'land', 'commercial', 'office', 'shop', 'warehouse', 'hotel', 'motel',
    'vacation_rental', 'guesthouse', 'hostel', 'resort', 'serviced_apartment',
  ];

  const nearbyAmenitiesOptions = [
    { value: 'Schools', label: 'Schools', icon: GraduationCap },
    { value: 'Hospitals', label: 'Hospitals', icon: Shield },
    { value: 'Shopping Malls', label: 'Shopping', icon: ShoppingBag },
    { value: 'Restaurants', label: 'Restaurants', icon: Utensils },
    { value: 'Parks', label: 'Parks', icon: Trees },
    { value: 'Banks', label: 'Banks', icon: Landmark },
  ];

  const transportAccessOptions = [
    { value: 'Bus Stop', label: 'Bus Stop', icon: Bus },
    { value: 'Taxi Station', label: 'Taxi Station', icon: Car },
    { value: 'Train Station', label: 'Train Station', icon: Train },
    { value: 'Airport', label: 'Airport', icon: Plane },
  ];

  // ─── Check for existing draft ─────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode && loadDraft()) setHasDraft(true);
  }, [isEditMode]);

  // ─── Auto-save draft (debounced 1s) ──────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;
    const id = setTimeout(() => saveDraft(formData), 1000);
    return () => clearTimeout(id);
  }, [formData, isEditMode]);

  // ─── Init edit mode ───────────────────────────────────────────────────────
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData(initialData);
      if (initialData.latitude && initialData.longitude) {
        setSelectedMapLocation({
          lng: parseFloat(initialData.longitude),
          lat: parseFloat(initialData.latitude),
        });
      }
    }
  }, [initialData, isEditMode]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      if (name === 'price' || name === 'latitude' || name === 'longitude') {
        const sanitized = value
          .replace(name === 'price' ? /[^0-9.]/g : /[^0-9.-]/g, '')
          .replace(/(?!^)-/g, '')
          .replace(/(\..*)\./g, '$1');
        setFormData(prev => ({ ...prev, [name]: sanitized }));
        return;
      }
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (name: string, value: number) =>
    setFormData(prev => ({ ...prev, [name]: value }));

  const toggleArrayItem = (arrayName: 'nearbyAmenities' | 'transportAccess', item: string) => {
    const array = formData[arrayName];
    setFormData(prev => ({
      ...prev,
      [arrayName]: array.includes(item) ? array.filter(i => i !== item) : [...array, item],
    }));
  };

  // ─── Location autocomplete ────────────────────────────────────────────────
  useEffect(() => {
    const query = (locationQuery || '').trim();
    if (!query || query.length < 3) { setLocationSuggestions([]); setLocationDropdownOpen(false); return; }
    if (!mapTilerKey) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLocationLoading(true);
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${mapTilerKey}&limit=6`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const suggestions: LocationSuggestion[] = (data?.features ?? []).map((feat: any) => {
          const coords = feat?.geometry?.coordinates;
          const lng = Array.isArray(coords) ? Number(coords[0]) : NaN;
          const lat = Array.isArray(coords) ? Number(coords[1]) : NaN;
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
          let city = '', country = '';
          (feat?.context ?? []).forEach((c: any) => {
            if (c.id?.startsWith('place') || c.id?.startsWith('locality') || c.id?.startsWith('region') || c.id?.startsWith('province')) city = city || c.text;
            if (c.id?.startsWith('country')) country = country || c.text;
          });
          return { id: feat?.id, label: feat?.place_name, lng, lat, city, country, raw: feat };
        }).filter(Boolean).slice(0, 6);
        setLocationSuggestions(suggestions);
        setLocationDropdownOpen(suggestions.length > 0);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setLocationLoading(false);
      }
    }, 300);
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [locationQuery, mapTilerKey]);

  // ─── Debounced reverse-geocode on map pin ─────────────────────────────────
  useEffect(() => {
    if (!selectedMapLocation || !mapTilerKey) return;
    const { lng, lat } = selectedMapLocation;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${mapTilerKey}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const feat = data?.features?.[0];
        if (!feat) return;
        let city = '', country = '';
        (feat.context ?? []).forEach((c: any) => {
          if (c.id?.startsWith('place') || c.id?.startsWith('locality') || c.id?.startsWith('region') || c.id?.startsWith('province')) city = city || c.text;
          if (c.id?.startsWith('country')) country = country || c.text;
        });
        setFormData(prev => ({
          ...prev,
          address: prev.address?.trim() ? prev.address : (feat.place_name || prev.address),
          city: (prev.city?.trim() && cityTouched) ? prev.city : (city || prev.city),
          country: prev.country?.trim() ? prev.country : (country || prev.country),
        }));
      } catch { }
    }, 400);
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [selectedMapLocation, mapTilerKey, cityTouched]);

  // ─── Image handlers ───────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent, filesToUpload?: FileList | File[]) => {
    const files = filesToUpload || (e.target as HTMLInputElement).files;
    if (!files) return;
    const newImages: PropertyImage[] = [];
    let processedCount = 0;
    Array.from(files).forEach(file => {
      // No size cap here — the backend (Cloudinary) accepts large files.
      // We use createObjectURL for previews to avoid huge base64 strings in state.
      const preview = URL.createObjectURL(file);
      newImages.push({ id: `${Date.now()}-${Math.random()}`, file, preview, caption: '', category: 'general' });
      processedCount++;
      if (processedCount === files.length)
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    });
  };

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    handleImageUpload(e, Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };
  const removeImage = (id: string) => setFormData(prev => {
    const removed = prev.images.find(img => img.id === id);
    // Revoke the blob URL to free memory (createObjectURL previews)
    if (removed?.preview?.startsWith('blob:')) URL.revokeObjectURL(removed.preview);
    return { ...prev, images: prev.images.filter(img => img.id !== id) };
  });

  // ─── Step validation ──────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const id = steps[step - 1]?.id;
    if (id === 'basics') return formData.title.trim() !== '' && formData.description.trim() !== '' && Number(formData.price) > 0;
    if (id === 'location') return formData.address.trim() !== '' && formData.city.trim() !== '' && Number.isFinite(parseFloat(formData.latitude));
    return true;
  };

  const getValidationHint = (step: number): string | null => {
    const id = steps[step - 1]?.id;
    if (id === 'basics') {
      if (!formData.title.trim()) return 'Add a title to continue';
      if (!formData.description.trim()) return 'Add a description to continue';
      if (!formData.price || Number(formData.price) <= 0) return 'Add a valid price to continue';
    }
    if (id === 'location') {
      if (!formData.address.trim()) return 'Enter an address to continue';
      if (!formData.city.trim()) return 'Enter a city to continue';
      if (!Number.isFinite(parseFloat(formData.latitude))) return 'Pin a location on the map';
    }
    return null;
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepDirection(1);
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepDirection(-1);
      setCurrentStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveAndExit = () => {
    saveDraft(formData);
    router.push('/dashboard');
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError(null); setUploadProgress(0); setIsSubmitting(true);
    const onImageUploadProgress = (e: any) =>
      e.total && setUploadProgress(Math.round((e.loaded * 100) / e.total));
    try {
      // Build a clean payload using only fields known to CreatePropertyDto.
      // Spreading the entire formData object causes ValidationPipe (forbidNonWhitelisted)
      // to reject the request with a 400 because of File/preview/draft-only fields.
      const payload: any = {
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
        keywords: formData.keywords ? formData.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : [],
        nearbyAmenities: formData.nearbyAmenities,
        transportAccess: formData.transportAccess,
        virtualTourUrl: formData.virtualTourUrl || undefined,
        videoUrl: formData.videoUrl || undefined,
        tourType: formData.tourType || undefined,
        // Short-term fields
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
        // Amenities object (long-term + short-term merged)
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
      };

      const imageFiles = formData.images.filter(img => img.file).map(img => img.file);
      let created;
      if (isEditMode && propertyId) {
        created = await apiClient.updateProperty(propertyId, payload);
        if (imageFiles.length > 0) await apiClient.uploadPropertyImages(propertyId, imageFiles, onImageUploadProgress);
      } else {
        created = await createPropertyWithMedia(
          payload, imageFiles,
          videoSourceTab === 'local' && videoFile ? [videoFile] : [],
          onImageUploadProgress
        );
      }
      const createdId = propertyId || created?.id || created?._id || created?.property?.id;
      if (createdId) setCreatedPropertyId(String(createdId));
      clearDraft();
      setSuccessModalOpen(true);
      setTimeout(() => { if (createdId) router.push(`/properties/${createdId}`); }, 1500);
    } catch (error: any) {
      // NestJS ValidationPipe returns an array of ValidationError objects, not strings.
      // Recursively flatten them into readable messages.
      const flattenErrors = (errors: any[]): string[] =>
        errors.flatMap((e: any) => {
          const lines: string[] = [];
          if (e.constraints) {
            lines.push(`${e.property}: ${Object.values(e.constraints).join('; ')}`);
          }
          if (e.children?.length) {
            lines.push(...flattenErrors(e.children).map((m: string) => `${e.property}.${m}`));
          }
          return lines;
        });

      const data = error?.response?.data;
      console.error('[PropertyForm] Submit error:', data ?? error);

      let msg: string;
      if (data?.message && Array.isArray(data.message)) {
        msg = flattenErrors(data.message).join('\n') || JSON.stringify(data.message);
      } else if (typeof data?.message === 'string') {
        msg = data.message;
      } else {
        msg = error?.message || String(error);
      }
      setSubmitError(msg);
      setErrorModalOpen(true);
    } finally {
      setIsSubmitting(false); setUploadProgress(0);
    }
  };

  const validationHint = getValidationHint(currentStep);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans flex flex-col">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 h-[72px] px-4 md:px-6 lg:px-12 flex items-center justify-between bg-white z-50 border-b border-[#EBEBEB]">
        {/* Left: logo + badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
          <div className="font-bold text-lg tracking-tight flex items-center shrink-0">
            <Link href="/" className="flex items-center block">
              <img src="/logoHoroHouseBleueOrdinateur.png" alt="HoroHouse" className="h-8 sm:h-10 md:h-12 w-auto object-contain max-w-[140px] sm:max-w-none" />
            </Link>
          </div>
          <div className="hidden sm:block shrink-0">
            {formData.listingType && <ListingTypeBadge type={formData.listingType} />}
          </div>
        </div>

        {/* Center: breadcrumb */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none hidden md:block">
          <StepBreadcrumb steps={steps} current={currentStep} />
        </div>

        {/* Right: step counter + save */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-sm text-[#717171] font-medium hidden sm:block">
            {currentStep} of {totalSteps}
          </span>
          <button
            onClick={handleSaveAndExit}
            className="px-4 py-2 rounded-full font-semibold text-sm hover:bg-[#F7F7F7] transition-colors border border-[#DDDDDD] text-[#222222]"
          >
            Save & exit
          </button>
        </div>
      </header>

      {/* ── DRAFT BANNER ── */}
      {hasDraft && !isEditMode && (
        <div className="fixed top-[72px] left-0 right-0 bg-[#FFFBEB] border-b border-yellow-200 px-6 py-3 flex items-center justify-between z-40">
          <span className="text-sm text-yellow-800 font-medium">Draft restored — your previous progress is back.</span>
          <button
            onClick={() => { clearDraft(); setFormData(DEFAULT_FORM); setHasDraft(false); }}
            className="text-sm text-yellow-700 font-semibold underline ml-4 shrink-0"
          >
            Start fresh
          </button>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className={`flex-1 overflow-x-hidden overflow-y-auto w-full flex justify-center pb-12 ${hasDraft && !isEditMode ? 'mt-[120px]' : 'mt-[72px]'} mb-[90px]`}>
        <div className="w-full max-w-[680px] px-6 py-10 lg:py-16">
          <AnimatePresence mode="wait" custom={stepDirection}>
            <motion.div
              key={currentStep}
              custom={stepDirection}
              initial={{ x: stepDirection > 0 ? 40 : -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: stepDirection < 0 ? 40 : -40, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
            >

              {/* ── basics ── */}
              {currentStepId === 'basics' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 1 — The essentials</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Tell us about your place</h1>
                  </div>

                  <div>
                    <InputLabel title="Title" subtitle="A clear, descriptive name for your listing." />
                    <FormInput name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Luxury 3BR Apartment in Downtown Yaoundé" />
                  </div>

                  <div>
                    <InputLabel title="Description" subtitle="Share what makes your place special." />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full p-4 text-base border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] placeholder-[#B0B0B0] resize-none transition-colors"
                      placeholder="Describe the space, its standout features, and who it's ideal for…"
                    />
                  </div>

                  <div>
                    <InputLabel title="Property type" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { value: 'apartment', label: 'Apartment', icon: Building2 },
                        { value: 'house', label: 'House', icon: Home },
                        { value: 'villa', label: 'Villa', icon: Star },
                        { value: 'studio', label: 'Studio', icon: SquareDashed },
                      ].map(({ value, label, icon }) => (
                        <SelectCard key={value} title={label} icon={icon}
                          selected={formData.type === value}
                          onClick={() => setFormData(prev => ({ ...prev, type: value }))} />
                      ))}
                    </div>
                    <select name="type" value={formData.type} onChange={handleChange}
                      className="w-full p-4 border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] transition-colors text-sm">
                      <option value="" disabled>Or choose another type…</option>
                      {propertyTypes.map(tp => <option key={tp} value={tp}>{tp.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>

                  <div>
                    <InputLabel title="Listing type" />
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'sale', label: 'For Sale', icon: Tag },
                        { value: 'rent', label: 'For Rent', icon: Home },
                        { value: 'short_term', label: 'Short Stay', icon: CalendarClock },
                      ].map(({ value, label, icon }) => (
                        <SelectCard key={value} title={label} icon={icon}
                          selected={formData.listingType === value}
                          onClick={() => setFormData(prev => ({ ...prev, listingType: value }))} />
                      ))}
                    </div>
                    {/* Inform the user when the listing type adds extra steps */}
                    {formData.listingType === 'rent' && (
                      <p className="mt-3 text-sm text-[#717171] bg-[#F7F7F7] px-4 py-3 rounded-xl">
                        Rental listings include a student suitability step later.
                      </p>
                    )}
                    {formData.listingType === 'short_term' && (
                      <p className="mt-3 text-sm text-[#717171] bg-[#F7F7F7] px-4 py-3 rounded-xl">
                        Short stays include a booking configuration step later.
                      </p>
                    )}
                  </div>

                  <div>
                    <InputLabel
                      title="Price"
                      subtitle={`${formData.listingType === 'rent' ? 'Monthly rent' : formData.listingType === 'short_term' ? 'Nightly rate' : 'Sale price'} in XAF`}
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#222222] font-bold text-sm select-none">XAF</span>
                      <FormInput name="price" value={formData.price} onChange={handleChange}
                        placeholder="0" className="pl-14 text-lg font-semibold" inputMode="decimal" />
                    </div>
                    <p className="mt-1 text-xs text-[#B0B0B0]">You can update this before publishing.</p>
                  </div>
                </div>
              )}

              {/* ── location ── */}
              {currentStepId === 'location' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 2 — Location</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Where's your place located?</h1>
                    <p className="text-sm text-[#717171] mt-2">Your exact address is only shared with confirmed guests.</p>
                  </div>

                  <div className="relative z-20">
                    <FormInput
                      name="address"
                      value={formData.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, address: v }));
                        setLocationQuery(v);
                        if (v.length >= 3) setLocationDropdownOpen(true);
                      }}
                      onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 150)}
                      placeholder="Search for your address…"
                    />
                    {locationDropdownOpen && locationSuggestions.length > 0 && (
                      <div className="absolute w-full bg-white border border-[#DDDDDD] border-t-0 rounded-b-xl shadow-xl z-50 overflow-hidden">
                        {locationLoading && <div className="p-4 text-sm text-[#717171]">Searching…</div>}
                        {locationSuggestions.map(sug => (
                          <button
                            key={sug.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                address: sug.label,
                                city: sug.city || prev.city,
                                country: sug.country || prev.country,
                                latitude: String(sug.lat),
                                longitude: String(sug.lng),
                              }));
                              setSelectedMapLocation({ lng: sug.lng, lat: sug.lat });
                              setLocationDropdownOpen(false);
                            }}
                            className="w-full text-left p-4 hover:bg-[#F7F7F7] flex flex-col border-b border-[#EBEBEB] last:border-0"
                          >
                            <span className="font-semibold text-[#222222] truncate text-sm">{sug.label}</span>
                            <span className="text-xs text-[#717171]">{[sug.city, sug.country].filter(Boolean).join(', ')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Map: mounted with dynamic() — stays alive across step transitions */}
                  <div className="h-[300px] w-full rounded-xl overflow-hidden border border-[#DDDDDD] relative z-10">
                    <MapView
                      properties={[]}
                      selectedLocation={memoizedMapLocation}
                      onMapClick={(lng: number, lat: number) => {
                        setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
                        setSelectedMapLocation({ lng, lat });
                        setCityTouched(false);
                      }}
                      onLocationSelect={(lng: number, lat: number, addr: any) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: String(lat),
                          longitude: String(lng),
                          address: addr?.label || prev.address,
                          city: (prev.city?.trim() && cityTouched) ? prev.city : (addr?.city || prev.city),
                          country: addr?.country || prev.country,
                        }));
                        setSelectedMapLocation({ lng, lat });
                        if (addr?.city) setCityTouched(false);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">City *</Label>
                      <FormInput name="city" value={formData.city}
                        onChange={(e: any) => { setCityTouched(true); handleChange(e); }}
                        placeholder="e.g., Yaoundé" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Neighborhood</Label>
                      <FormInput name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Optional" />
                    </div>
                  </div>

                  {/* Precise coordinates hidden by default */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowLatLng(v => !v)}
                      className="flex items-center gap-2 text-sm text-[#717171] hover:text-[#222222] transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showLatLng ? 'rotate-180' : ''}`} />
                      {showLatLng ? 'Hide' : 'Show'} precise coordinates
                    </button>
                    {showLatLng && (
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <Label className="text-sm font-semibold text-[#222222] mb-1 block">Latitude</Label>
                          <FormInput name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g., 3.8480" inputMode="decimal" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#222222] mb-1 block">Longitude</Label>
                          <FormInput name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g., 11.5021" inputMode="decimal" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── details ── */}
              {currentStepId === 'details' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 3 — Details</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Share some basics about your place</h1>
                  </div>

                  <div className="flex flex-col">
                    {formData.listingType === 'short_term' && (
                      <CounterRow title="Max guests" subtitle="Maximum capacity" icon={Users} value={formData.maxGuests} min={1}
                        onDecrement={() => handleNumberChange('maxGuests', Math.max(1, formData.maxGuests - 1))}
                        onIncrement={() => handleNumberChange('maxGuests', formData.maxGuests + 1)} />
                    )}
                    <CounterRow title="Bedrooms" icon={BedDouble} value={formData.bedrooms}
                      onDecrement={() => handleNumberChange('bedrooms', Math.max(0, formData.bedrooms - 1))}
                      onIncrement={() => handleNumberChange('bedrooms', formData.bedrooms + 1)} />
                    <CounterRow title="Bathrooms" icon={Bath} value={formData.bathrooms}
                      onDecrement={() => handleNumberChange('bathrooms', Math.max(0, formData.bathrooms - 1))}
                      onIncrement={() => handleNumberChange('bathrooms', formData.bathrooms + 1)} />
                    <CounterRow title="Parking spaces" icon={ParkingCircle} value={formData.parkingSpaces}
                      onDecrement={() => handleNumberChange('parkingSpaces', Math.max(0, formData.parkingSpaces - 1))}
                      onIncrement={() => handleNumberChange('parkingSpaces', formData.parkingSpaces + 1)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Area (m²)</Label>
                      <FormInput name="area" value={formData.area} onChange={handleChange} placeholder="e.g., 120" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Year Built</Label>
                      <FormInput name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} placeholder="e.g., 2020" />
                    </div>
                  </div>

                  {formData.listingType === 'rent' && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label className="text-sm font-semibold text-[#222222] mb-1 block">Deposit (XAF)</Label>
                        <FormInput name="depositAmount" value={formData.depositAmount} onChange={handleChange} placeholder="e.g., 50000" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-[#222222] mb-1 block">Maintenance fee</Label>
                        <FormInput name="maintenanceFee" value={formData.maintenanceFee} onChange={handleChange} placeholder="Monthly" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── amenities ── */}
              {currentStepId === 'amenities' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 4 — Amenities</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">What does your place offer?</h1>
                    <p className="text-sm text-[#717171] mt-2">Select all that apply. You can update these later.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayedAmenities.map(amenity => (
                      <AmenityCard
                        key={amenity.name}
                        name={amenity.name}
                        label={amenity.label}
                        icon={amenity.icon}
                        checked={formData[amenity.name as keyof PropertyFormData] as boolean}
                        onToggle={() => setFormData(prev => ({ ...prev, [amenity.name]: !prev[amenity.name as keyof PropertyFormData] }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── nearby ── */}
              {currentStepId === 'nearby' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 5 — Nearby</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Highlight what's nearby</h1>
                  </div>

                  <div>
                    <InputLabel title="Keywords" subtitle="Comma-separated tags that describe the property" />
                    <FormInput name="keywords" value={formData.keywords} onChange={handleChange} placeholder="e.g., luxury, downtown, quiet, modern" />
                  </div>

                  <div>
                    <InputLabel title="Nearby amenities" />
                    <div className="flex flex-wrap gap-3">
                      {nearbyAmenitiesOptions.map(({ value, label, icon: Icon }) => {
                        const selected = formData.nearbyAmenities.includes(value);
                        return (
                          <button key={value} type="button" onClick={() => toggleArrayItem('nearbyAmenities', value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors
                              ${selected ? 'border-[#222222] bg-[#F7F7F7] text-[#222222]' : 'border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]'}`}>
                            <Icon className="w-4 h-4" />{label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <InputLabel title="Transport access" />
                    <div className="flex flex-wrap gap-3">
                      {transportAccessOptions.map(({ value, label, icon: Icon }) => {
                        const selected = formData.transportAccess.includes(value);
                        return (
                          <button key={value} type="button" onClick={() => toggleArrayItem('transportAccess', value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors
                              ${selected ? 'border-[#222222] bg-[#F7F7F7] text-[#222222]' : 'border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]'}`}>
                            <Icon className="w-4 h-4" />{label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── photos ── */}
              {currentStepId === 'photos' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 6 — Photos</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Add some photos of your place</h1>
                    <p className="text-sm text-[#717171] mt-2">Aim for at least 5 photos. You can add more after publishing.</p>
                  </div>

                  <div
                    className={`border-1 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center
                      ${dragActive ? 'border-[#222222] bg-[#F7F7F7]' : 'border-[#DDDDDD] hover:border-[#222222]'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <ImageIcon className="w-12 h-12 text-[#B0B0B0] mb-4" />
                    <h3 className="text-lg font-semibold text-[#222222] mb-1">Drag photos here</h3>
                    <p className="text-sm text-[#717171] mb-5">Any size · JPG, PNG, WEBP · up to 50 files</p>
                    <span className="font-semibold underline text-[#222222] text-sm">Browse files</span>
                    <input type="file" multiple accept="image/*" className="hidden" id="image-upload" onChange={handleImageUpload} />
                  </div>

                  {formData.images.length > 0 && (
                    <>
                      <p className="text-sm text-[#717171]">
                        {formData.images.length} photo{formData.images.length !== 1 ? 's' : ''} added
                        {formData.images.length < 5 && <span className="text-orange-500 ml-1">· add {5 - formData.images.length} more for best results</span>}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {formData.images.map((image, index) => (
                          <div key={image.id} className="relative aspect-video rounded-xl overflow-hidden group">
                            <img src={image.preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-[#222222] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                                <Star className="w-3 h-3 fill-white" /> Cover
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); removeImage(image.id); }}
                              className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5 text-[#222222]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── students (rent only) ── */}
              {currentStepId === 'students' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 7 — Students</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Is this suitable for students?</h1>
                  </div>
                  <StudentEnrollmentStep data={studentEnrollment} onChange={setStudentEnrollment} />
                </div>
              )}

              {/* ── booking (short_term only) ── */}
              {currentStepId === 'booking' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Step 7 — Booking</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Set up your booking rules</h1>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Check-in time</Label>
                      <input type="time" name="checkInTime" value={formData.checkInTime} onChange={handleChange}
                        className="w-full p-4 border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] transition-colors" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Check-out time</Label>
                      <input type="time" name="checkOutTime" value={formData.checkOutTime} onChange={handleChange}
                        className="w-full p-4 border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] transition-colors" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Cleaning fee (XAF)</Label>
                      <FormInput name="cleaningFee" value={formData.cleaningFee} onChange={handleChange} placeholder="e.g., 5000" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Service fee (XAF)</Label>
                      <FormInput name="serviceFee" value={formData.serviceFee} onChange={handleChange} placeholder="e.g., 2000" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Min nights</Label>
                      <FormInput type="number" name="minNights" value={formData.minNights} onChange={handleChange} min="1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#222222] mb-1 block">Max nights</Label>
                      <FormInput type="number" name="maxNights" value={formData.maxNights} onChange={handleChange} min="1" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#222222] mb-1 block">Cancellation policy</Label>
                    <select name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleChange}
                      className="w-full p-4 border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] transition-colors">
                      <option value="flexible">Flexible — 100% refund up to 24h before</option>
                      <option value="moderate">Moderate — 100% refund up to 5 days before</option>
                      <option value="strict">Strict — 50% refund up to 7 days before</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-4 border border-[#DDDDDD] rounded-xl hover:border-[#222222] transition-colors">
                    <input type="checkbox" name="isInstantBookable" checked={formData.isInstantBookable} onChange={handleChange}
                      className="mt-0.5 w-5 h-5 rounded border-[#DDDDDD] focus:ring-[#222222]" />
                    <div>
                      <span className="text-base text-[#222222] font-semibold block">Instant booking</span>
                      <span className="text-sm text-[#717171]">Guests can book without waiting for your approval</span>
                    </div>
                  </label>
                </div>
              )}

              {/* ── review ── */}
              {currentStepId === 'review' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-bold text-[#B0B0B0] uppercase tracking-widest mb-2">Final step — Review</p>
                    <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold">Review your listing</h1>
                    <p className="text-sm text-[#717171] mt-2">Double-check everything before publishing.</p>
                  </div>

                  {/* Preview card — uses objectURL previews so no heavy base64 in DOM */}
                  <div className="p-5 border border-[#DDDDDD] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-full sm:w-[220px] h-[150px] rounded-xl bg-[#EBEBEB] overflow-hidden shrink-0">
                      {formData.images[0] ? (
                        <img
                          src={formData.images[0].preview}
                          className="w-full h-full object-cover"
                          alt="Cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-[#B0B0B0] w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <h2 className="text-base font-semibold text-[#222222] truncate">{formData.title || 'Untitled Property'}</h2>
                      <p className="text-sm text-[#717171] truncate">{[formData.neighborhood, formData.city, formData.country].filter(Boolean).join(', ')}</p>
                      <p className="text-sm text-[#717171]">{formData.type.replace(/_/g, ' ')} · {formData.bedrooms} bed · {formData.bathrooms} bath</p>
                      <div className="pt-3 border-t border-[#EBEBEB] flex items-baseline gap-1">
                        <span className="text-base font-bold text-[#222222]">
                          {formData.price ? Number(formData.price).toLocaleString() : '—'} XAF
                        </span>
                        <span className="text-xs text-[#717171]">
                          {formData.listingType === 'rent' ? '/ month' : formData.listingType === 'short_term' ? '/ night' : ''}
                        </span>
                      </div>
                      <ListingTypeBadge type={formData.listingType} />
                    </div>
                  </div>

                  {/* Checklist summary */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Photos', value: `${formData.images.length} added`, ok: formData.images.length >= 5 },
                      { label: 'Location', value: formData.city || 'Not set', ok: !!formData.city },
                      { label: 'Price', value: formData.price ? `${Number(formData.price).toLocaleString()} XAF` : 'Not set', ok: !!formData.price },
                      { label: 'Amenities', value: `${displayedAmenities.filter(a => formData[a.name as keyof PropertyFormData]).length} selected`, ok: true },
                    ].map(item => (
                      <div key={item.label} className={`p-4 rounded-xl border ${item.ok ? 'border-[#EBEBEB]' : 'border-orange-200 bg-orange-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#B0B0B0] uppercase tracking-wide">{item.label}</span>
                          <span className={`w-2 h-2 rounded-full ${item.ok ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                        </div>
                        <span className="text-sm font-semibold text-[#222222]">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[#B0B0B0] leading-relaxed">
                    By submitting you agree to the Host Terms. All details will be visible to potential guests after review.
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── BOTTOM FOOTER ── */}
      <footer className="fixed bottom-0 left-0 right-0 h-[88px] bg-white border-t border-[#EBEBEB] z-50">
        <div className="w-full h-0.5 bg-[#EBEBEB] absolute top-0 left-0">
          <motion.div
            className="h-full bg-[#222222]"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="h-full max-w-[1200px] mx-auto px-6 lg:px-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className={`font-semibold underline text-sm px-2 py-2 text-[#222222] hover:text-[#717171] transition-colors ${currentStep === 1 ? 'invisible' : ''}`}
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Inline hint when Next is blocked */}
            {!validateStep(currentStep) && validationHint && (
              <span className="text-sm text-[#717171] hidden sm:block">{validationHint}</span>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="bg-[#222222] text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-9 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-1 border-white border-t-transparent rounded-full animate-spin" />
                    {uploadProgress > 0 ? `Uploading (${uploadProgress}%)` : 'Saving…'}
                  </>
                ) : isEditMode ? 'Update listing' : 'Publish listing'}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ── SUCCESS MODAL ── */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="max-w-sm p-10 bg-white border border-green-600 rounded-2xl [&>button]:hidden text-center shadow-2xl">
          <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white mb-2">
            {isEditMode ? 'Listing updated!' : 'You are live!'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#717171] mb-6">
            {isEditMode ? 'Your changes have been saved.' : 'Your property is published and visible to guests.'}
          </DialogDescription>
          <Button
            className="w-full h-11 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold text-sm"
            onClick={() => { setSuccessModalOpen(false); if (createdPropertyId) router.push(`/properties/${createdPropertyId}`); }}
          >
            View listing
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── ERROR MODAL ── */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="max-w-sm p-10 bg-white border border-[#EBEBEB] rounded-2xl [&>button]:hidden text-center shadow-2xl">
          <div className="w-14 h-14 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-5">
            <X className="w-7 h-7 text-[#E51D53]" />
          </div>
          <DialogTitle className="text-xl font-semibold text-[#222222] mb-2">Something went wrong</DialogTitle>
          <DialogDescription className="text-sm text-[#717171] mb-6">
            {submitError || 'An error occurred while saving. Please try again.'}
          </DialogDescription>
          <Button
            className="w-full h-11 rounded-xl bg-[#222222] hover:bg-black text-white font-semibold text-sm"
            onClick={() => setErrorModalOpen(false)}
          >
            Try again
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyForm;