'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { createPropertyWithMedia } from '@/lib/services/propertyCreateWithMedia';
import { Building2, MapPin, Hash, ArrowLeft, ArrowRight, Home, DollarSign, Bed, Bath, Maximize, CheckCircle2, FileText, Wrench, Image as ImageIcon, Globe, X, Star } from 'lucide-react';
import MapView from '@/components/property/MapView';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PropertyImage {
  id: string;
  file: File;
  preview: string;
  caption: string;
  category: string;
}

interface PropertyFormData {
  // Basic Information
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: string;
  
  // Property Details
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

interface PropertyFormProps {
  onAdd: (property: PropertyFormData) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    type: 'apartment',
    listingType: 'sale',
    price: '',
    area: '',
    yearBuilt: '',
    floorNumber: '',
    totalFloors: '',
    pricePerSqm: '',
    depositAmount: '',
    maintenanceFee: '',
    address: '',
    city: '',
    neighborhood: '',
    country: '',
    latitude: '',
    longitude: '',
    bedrooms: 1,
    bathrooms: 1,
    parkingSpaces: 0,
    hasGarden: false,
    hasPool: false,
    hasGym: false,
    hasSecurity: false,
    hasElevator: false,
    hasBalcony: false,
    hasAirConditioning: false,
    hasInternet: false,
    hasGenerator: false,
    furnished: false,
    keywords: '',
    nearbyAmenities: [],
    transportAccess: [],
    images: [],
    floorPlan: null,
    floorPlanPreview: '',
    documents: [],
    virtualTourUrl: '',
    videoUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lng: number; lat: number } | null>(null);
  const router = useRouter();

  const propertyTypes = [
    'apartment', 'house', 'villa', 'studio', 'duplex', 'bungalow', 
    'penthouse', 'land', 'commercial', 'office', 'shop', 'warehouse'
  ];

  const nearbyAmenitiesOptions = [
    'Schools', 'Hospitals', 'Shopping Malls', 'Restaurants', 'Parks',
    'Banks', 'Pharmacies', 'Gas Stations', 'Markets', 'Churches',
    'Mosques', 'Government Offices'
  ];

  const transportAccessOptions = [
    'Bus Stop', 'Taxi Station', 'Train Station', 'Airport',
    'Highway Access', 'Metro Station', 'Ferry Terminal'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData({ ...formData, [name]: value });
  };

  const toggleArrayItem = (arrayName: 'nearbyAmenities' | 'transportAccess', item: string) => {
    const array = formData[arrayName];
    if (array.includes(item)) {
      setFormData({ ...formData, [arrayName]: array.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [arrayName]: [...array, item] });
    }
  };

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: PropertyImage[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: event.target?.result as string,
          caption: '',
          category: 'general',
        });

        processedCount++;
        if (processedCount === files.length) {
          setFormData({ ...formData, images: [...formData.images, ...newImages] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    const newImages: PropertyImage[] = [];
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    let processedCount = 0;

    imageFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: event.target?.result as string,
          caption: '',
          category: 'general',
        });

        processedCount++;
        if (processedCount === imageFiles.length) {
          setFormData({ ...formData, images: [...formData.images, ...newImages] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter(img => img.id !== id),
    });
  };

  const updateImageCaption = (id: string, caption: string) => {
    setFormData({
      ...formData,
      images: formData.images.map(img =>
        img.id === id ? { ...img, caption } : img
      ),
    });
  };

  const setFeaturedImage = (id: string) => {
    const imageIndex = formData.images.findIndex(img => img.id === id);
    if (imageIndex === -1) return;

    const newImages = [...formData.images];
    const [featuredImage] = newImages.splice(imageIndex, 1);
    newImages.unshift(featuredImage);
    setFormData({ ...formData, images: newImages });
  };

  // Floor plan handler
  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Floor plan file is too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({
        ...formData,
        floorPlan: file,
        floorPlanPreview: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFloorPlan = () => {
    setFormData({ ...formData, floorPlan: null, floorPlanPreview: '' });
  };

  // Documents handler
  const handleDocumentsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 20MB.`);
        return false;
      }
      return true;
    });

    setFormData({ ...formData, documents: [...formData.documents, ...validFiles] });
  };

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.trim() !== '' && 
               formData.description.trim() !== '' && 
               formData.price.trim() !== '';
      case 2:
        return formData.address.trim() !== '' && 
               formData.city.trim() !== '' && 
               formData.latitude.trim() !== '' && 
               formData.longitude.trim() !== '';
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setUploadProgress(0);
    setIsSubmitting(true);

    const onImageUploadProgress = (progressEvent: any) => {
      try {
        const { loaded, total } = progressEvent;
        if (total && total > 0) {
          const percent = Math.round((loaded * 100) / total);
          setUploadProgress(percent);
        }
      } catch (e) {
        // ignore
      }
    };

    try {
      // Build payload from formData (exclude File objects)
      const payload: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        listingType: formData.listingType,
        price: formData.price,
        area: formData.area,
        yearBuilt: formData.yearBuilt,
        floorNumber: formData.floorNumber,
        totalFloors: formData.totalFloors,
        pricePerSqm: formData.pricePerSqm,
        depositAmount: formData.depositAmount,
        maintenanceFee: formData.maintenanceFee,
        address: formData.address,
        city: formData.city,
        neighborhood: formData.neighborhood,
        country: formData.country,
        latitude: formData.latitude,
        longitude: formData.longitude,
        amenities: {
          bedrooms: Number(formData.bedrooms || 0),
          bathrooms: Number(formData.bathrooms || 0),
          parkingSpaces: Number(formData.parkingSpaces || 0),
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
        keywords: formData.keywords,
        nearbyAmenities: formData.nearbyAmenities,
        transportAccess: formData.transportAccess,
        virtualTourUrl: formData.virtualTourUrl,
        videoUrl: formData.videoUrl,
      };

      const imageFiles: File[] = formData.images.map((img) => img.file).filter(Boolean);

      // Use provided helper to create property and upload media
  const created = await createPropertyWithMedia(payload, imageFiles, [], onImageUploadProgress);

      // Notify parent (keep previous behavior: pass the local formData)
      try {
        onAdd(formData);
      } catch (_) {
        // ignore
      }

      // Reset form (same as previous behaviour)
      setFormData({
        title: '',
        description: '',
        type: 'apartment',
        listingType: 'sale',
        price: '',
        area: '',
        yearBuilt: '',
        floorNumber: '',
        totalFloors: '',
        pricePerSqm: '',
        depositAmount: '',
        maintenanceFee: '',
        address: '',
        city: '',
        neighborhood: '',
        country: '',
        latitude: '',
        longitude: '',
        bedrooms: 1,
        bathrooms: 1,
        parkingSpaces: 0,
        hasGarden: false,
        hasPool: false,
        hasGym: false,
        hasSecurity: false,
        hasElevator: false,
        hasBalcony: false,
        hasAirConditioning: false,
        hasInternet: false,
        hasGenerator: false,
        furnished: false,
        keywords: '',
        nearbyAmenities: [],
        transportAccess: [],
        images: [],
        floorPlan: null,
        floorPlanPreview: '',
        documents: [],
        virtualTourUrl: '',
        videoUrl: '',
      });
      setCurrentStep(1);

      // Success: show modal and navigate to property detail
      const createdId = (created && (created.id || created._id)) || (created?.property && (created.property.id || created.property._id));
      if (createdId) {
        setCreatedPropertyId(String(createdId));
      }
      setSuccessModalOpen(true);

      // navigate after a short delay so user sees modal briefly
      setTimeout(() => {
        const targetId = createdId || created?.id || created?._id;
        if (targetId) {
          router.push(`/properties/${targetId}`);
        }
      }, 800);
    } catch (error: any) {
      console.error('Create property failed', error);
      setSubmitError(error?.message || String(error));
      setErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const steps = [
    { number: 1, label: 'Basic Info', icon: FileText },
    { number: 2, label: 'Location', icon: MapPin },
    { number: 3, label: 'Details', icon: Building2 },
    { number: 4, label: 'Amenities', icon: Home },
    { number: 5, label: 'Features', icon: Wrench },
    { number: 6, label: 'Media', icon: ImageIcon },
    { number: 7, label: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Card className="w-full shadow-xl border-blue-200 py-0">
        <CardHeader className="space-y-1 py-6 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <Building2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Add Property Listing
            </CardTitle>
          </div>
          <CardDescription className="text-blue-50">
            Complete all steps to publish your property listing.
          </CardDescription>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-1 pt-4 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-1 min-w-fit">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep >= step.number
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors whitespace-nowrap ${
                      currentStep >= step.number ? 'text-white' : 'text-blue-200'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-px w-8 mb-5 transition-colors ${
                      currentStep > step.number ? 'bg-white' : 'bg-white/30'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Property Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Luxury 3BR Apartment in Downtown"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Property Description *
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the property, its features, and unique selling points..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold">
                    Property Type *
                  </Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  >
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listingType" className="text-sm font-semibold">
                    Listing Type *
                  </Label>
                  <select
                    id="listingType"
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Price * {formData.listingType === 'rent' && '(Monthly)'}
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="text"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Interactive map for picking location */}
              <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                <div className="p-2 flex items-center justify-end gap-2 bg-white/60">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lng = pos.coords.longitude;
                            const lat = pos.coords.latitude;
                            // set local form coords and selectedMapLocation so MapView centers and reverse-geocodes
                            setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
                            setSelectedMapLocation({ lng, lat });
                          },
                          (err) => {
                            console.error('Geolocation error', err);
                            setSubmitError('Unable to get your location. Please enable location services.');
                            setErrorModalOpen(true);
                          }
                        );
                      } else {
                        setSubmitError('Geolocation is not supported by your browser.');
                        setErrorModalOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    Use my location
                  </button>
                </div>

                <MapView
                  properties={[]}
                  selectedLocation={selectedMapLocation}
                  onMapClick={(lng, lat) => {
                    setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
                    setSelectedMapLocation({ lng, lat });
                  }}
                  onLocationSelect={(lng, lat, addr) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: String(lat),
                      longitude: String(lng),
                      address: addr?.label || prev.address,
                      city: addr?.city || prev.city,
                      country: addr?.country || prev.country,
                    }));
                    setSelectedMapLocation({ lng, lat });
                  }}
                />

                <div className="p-2 text-xs text-gray-500">Click on the map to pick the location — latitude and longitude will be filled automatically. You can also use your device location.</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  Street Address *
                </Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full street address"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold">
                    City *
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="text-sm font-semibold">
                    Neighborhood
                  </Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    type="text"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="Enter neighborhood"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-semibold">
                  Country
                </Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Latitude *
                  </Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., 3.8480"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Longitude *
                  </Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 11.5021"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Property Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-sm font-semibold flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-blue-600" />
                    Area (m²)
                  </Label>
                  <Input
                    id="area"
                    name="area"
                    type="text"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g., 120"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearBuilt" className="text-sm font-semibold">
                    Year Built
                  </Label>
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="text"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    placeholder="e.g., 2020"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floorNumber" className="text-sm font-semibold">
                    Floor Number
                  </Label>
                  <Input
                    id="floorNumber"
                    name="floorNumber"
                    type="text"
                    value={formData.floorNumber}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalFloors" className="text-sm font-semibold">
                    Total Floors
                  </Label>
                  <Input
                    id="totalFloors"
                    name="totalFloors"
                    type="text"
                    value={formData.totalFloors}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerSqm" className="text-sm font-semibold">
                  Price per m²
                </Label>
                <Input
                  id="pricePerSqm"
                  name="pricePerSqm"
                  type="text"
                  value={formData.pricePerSqm}
                  onChange={handleChange}
                  placeholder="Auto-calculated or enter manually"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {formData.listingType === 'rent' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount" className="text-sm font-semibold">
                      Deposit Amount
                    </Label>
                    <Input
                      id="depositAmount"
                      name="depositAmount"
                      type="text"
                      value={formData.depositAmount}
                      onChange={handleChange}
                      placeholder="Enter deposit"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenanceFee" className="text-sm font-semibold">
                      Maintenance Fee
                    </Label>
                    <Input
                      id="maintenanceFee"
                      name="maintenanceFee"
                      type="text"
                      value={formData.maintenanceFee}
                      onChange={handleChange}
                      placeholder="Monthly fee"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Amenities */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="text-sm font-semibold flex items-center gap-2">
                    <Bed className="w-4 h-4 text-blue-600" />
                    Bedrooms
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberChange('bedrooms', Math.max(0, formData.bedrooms - 1))}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      -
                    </Button>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => handleNumberChange('bedrooms', Math.max(0, Number((e.target as HTMLInputElement).value || 0)))}
                      min={0}
                      step={1}
                      className="text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberChange('bedrooms', formData.bedrooms + 1)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-sm font-semibold flex items-center gap-2">
                    <Bath className="w-4 h-4 text-blue-600" />
                    Bathrooms
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberChange('bathrooms', Math.max(0, formData.bathrooms - 1))}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      -
                    </Button>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => handleNumberChange('bathrooms', Math.max(0, Number((e.target as HTMLInputElement).value || 0)))}
                      min={0}
                      step={1}
                      className="text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberChange('bathrooms', formData.bathrooms + 1)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parkingSpaces" className="text-sm font-semibold">
                    Parking
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberChange('parkingSpaces', Math.max(0, formData.parkingSpaces - 1))}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      -
                    </Button>
                    <Input
                      id="parkingSpaces"
                      name="parkingSpaces"
                      type="number"
                      value={formData.parkingSpaces}
                      onChange={(e) => handleNumberChange('parkingSpaces', Math.max(0, Number((e.target as HTMLInputElement).value || 0)))}
                      min={0}
                      step={1}
                      className="text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberChange('parkingSpaces', formData.parkingSpaces + 1)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Property Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'hasGarden', label: 'Garden' },
                    { name: 'hasPool', label: 'Swimming Pool' },
                    { name: 'hasGym', label: 'Gym' },
                    { name: 'hasSecurity', label: '24/7 Security' },
                    { name: 'hasElevator', label: 'Elevator' },
                    { name: 'hasBalcony', label: 'Balcony' },
                    { name: 'hasAirConditioning', label: 'Air Conditioning' },
                    { name: 'hasInternet', label: 'Internet/WiFi' },
                    { name: 'hasGenerator', label: 'Generator' },
                    { name: 'furnished', label: 'Furnished' },
                  ].map(feature => (
                    <label key={feature.name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={feature.name}
                        checked={formData[feature.name as keyof PropertyFormData] as boolean}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Features */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-sm font-semibold">
                  Keywords (comma-separated)
                </Label>
                <Input
                  id="keywords"
                  name="keywords"
                  type="text"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="e.g., luxury, modern, downtown, spacious"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Nearby Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {nearbyAmenitiesOptions.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleArrayItem('nearbyAmenities', amenity)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        formData.nearbyAmenities.includes(amenity)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Transport Access</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {transportAccessOptions.map(transport => (
                    <button
                      key={transport}
                      type="button"
                      onClick={() => toggleArrayItem('transportAccess', transport)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        formData.transportAccess.includes(transport)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {transport}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

         {/* Step 6: Media */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Property Images
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({formData.images.length} uploaded, recommended: at least 5)
                  </span>
                </Label>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <ImageIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Upload Property Images</h4>
                    <p className="text-xs text-gray-500 mb-4">Drag and drop or click to browse</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('image-upload')?.click();
                        }}
                      >
                        Select Images
                      </Button>
                    </label>
                    <p className="text-xs text-gray-400 mt-3">JPG, PNG, WebP (Max 5MB each)</p>
                  </div>
                </div>

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {formData.images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                          <img 
                            src={image.preview} 
                            alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                            Featured
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => setFeaturedImage(image.id)}
                              className="bg-white p-1.5 rounded shadow hover:bg-gray-100"
                              title="Set as featured"
                            >
                              <Star className="w-4 h-4 text-gray-700" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="bg-red-500 text-white p-1.5 rounded shadow hover:bg-red-600"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Add caption..."
                          value={image.caption}
                          onChange={(e) => updateImageCaption(image.id, e.target.value)}
                          className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo Tips */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Photo Tips:</p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                    <li>Take photos in good natural lighting</li>
                    <li>Include exterior, living room, kitchen, bedrooms, and bathrooms</li>
                    <li>Show unique features and recent renovations</li>
                    <li>Keep photos well-framed and clutter-free</li>
                  </ul>
                </div>
              </div>

              {/* Floor Plan Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Floor Plan (Optional)
                </Label>
                
                {!formData.floorPlan ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Upload Floor Plan</p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id="floorplan-upload"
                        onChange={handleFloorPlanUpload}
                      />
                      <label htmlFor="floorplan-upload">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('floorplan-upload')?.click();
                          }}
                        >
                          Browse
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {formData.floorPlanPreview && formData.floorPlan.type.startsWith('image/') ? (
                          <img 
                            src={formData.floorPlanPreview} 
                            alt="Floor plan"
                            className="w-16 h-16 object-cover rounded border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{formData.floorPlan.name}</p>
                          <p className="text-xs text-gray-500">
                            {(formData.floorPlan.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFloorPlan}
                        className="text-red-500 hover:text-red-600 font-medium text-sm px-3 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Virtual Tour */}
              <div className="space-y-2">
                <Label htmlFor="virtualTourUrl" className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Virtual Tour URL (Optional)
                </Label>
                <Input
                  id="virtualTourUrl"
                  name="virtualTourUrl"
                  type="text"
                  value={formData.virtualTourUrl}
                  onChange={handleChange}
                  placeholder="e.g., https://matterport.com/your-tour"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports: Matterport, Kuula, 3DVista, and other 360° tour platforms
                </p>
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Video URL (Optional)
                </Label>
                <Input
                  id="videoUrl"
                  name="videoUrl"
                  type="text"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="e.g., https://youtube.com/watch?v=..."
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports: YouTube, Vimeo, Facebook Video
                </p>
              </div>

              {/* Documents Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Property Documents (Optional)
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({formData.documents.length} uploaded)
                  </span>
                </Label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Upload Documents</p>
                        <p className="text-xs text-gray-500">Certificates, brochures, legal docs (PDF, Max 20MB)</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      className="hidden"
                      id="documents-upload"
                      onChange={handleDocumentsUpload}
                    />
                    <label htmlFor="documents-upload">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('documents-upload')?.click();
                        }}
                      >
                        Browse
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Documents List */}
                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1 rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

               {/* Media Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Why quality media matters:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Properties with 5+ photos get 3x more views</li>
                      <li>• Virtual tours increase inquiry rates by 40%</li>
                      <li>• Floor plans help buyers understand the layout faster</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-600">Review Your Property Listing</h3>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Title:</span> {formData.title}</p>
                    <p><span className="font-semibold">Description:</span> {formData.description}</p>
                    <p><span className="font-semibold">Type:</span> {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}</p>
                    <p><span className="font-semibold">Listing Type:</span> {formData.listingType === 'sale' ? 'For Sale' : 'For Rent'}</p>
                    <p><span className="font-semibold">Price:</span> {formData.price}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Location
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Address:</span> {formData.address}</p>
                    <p><span className="font-semibold">City:</span> {formData.city}</p>
                    {formData.neighborhood && <p><span className="font-semibold">Neighborhood:</span> {formData.neighborhood}</p>}
                    {formData.country && <p><span className="font-semibold">Country:</span> {formData.country}</p>}
                    <p><span className="font-semibold">Coordinates:</span> {formData.latitude}, {formData.longitude}</p>
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Property Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {formData.area && <p><span className="font-semibold">Area:</span> {formData.area} m²</p>}
                    {formData.yearBuilt && <p><span className="font-semibold">Year Built:</span> {formData.yearBuilt}</p>}
                    {formData.floorNumber && <p><span className="font-semibold">Floor:</span> {formData.floorNumber}</p>}
                    {formData.totalFloors && <p><span className="font-semibold">Total Floors:</span> {formData.totalFloors}</p>}
                    {formData.pricePerSqm && <p><span className="font-semibold">Price/m²:</span> {formData.pricePerSqm}</p>}
                    {formData.depositAmount && <p><span className="font-semibold">Deposit:</span> {formData.depositAmount}</p>}
                    {formData.maintenanceFee && <p><span className="font-semibold">Maintenance:</span> {formData.maintenanceFee}</p>}
                  </div>
                </div>

                {/* Amenities */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    Amenities
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Bedrooms:</span> {formData.bedrooms}</p>
                    <p><span className="font-semibold">Bathrooms:</span> {formData.bathrooms}</p>
                    <p><span className="font-semibold">Parking Spaces:</span> {formData.parkingSpaces}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.hasGarden && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Garden</span>}
                      {formData.hasPool && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Pool</span>}
                      {formData.hasGym && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Gym</span>}
                      {formData.hasSecurity && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Security</span>}
                      {formData.hasElevator && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Elevator</span>}
                      {formData.hasBalcony && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Balcony</span>}
                      {formData.hasAirConditioning && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">A/C</span>}
                      {formData.hasInternet && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Internet</span>}
                      {formData.hasGenerator && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Generator</span>}
                      {formData.furnished && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Furnished</span>}
                    </div>
                  </div>
                </div>

                {/* Features */}
                {(formData.keywords || formData.nearbyAmenities.length > 0 || formData.transportAccess.length > 0) && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      Features
                    </h4>
                    <div className="space-y-2 text-sm">
                      {formData.keywords && <p><span className="font-semibold">Keywords:</span> {formData.keywords}</p>}
                      {formData.nearbyAmenities.length > 0 && (
                        <div>
                          <span className="font-semibold">Nearby:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.nearbyAmenities.map(amenity => (
                              <span key={amenity} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{amenity}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.transportAccess.length > 0 && (
                        <div>
                          <span className="font-semibold">Transport:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.transportAccess.map(transport => (
                              <span key={transport} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{transport}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Media */}
                {(formData.virtualTourUrl || formData.videoUrl) && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      Media
                    </h4>
                    <div className="space-y-2 text-sm">
                      {formData.virtualTourUrl && <p><span className="font-semibold">Virtual Tour:</span> {formData.virtualTourUrl}</p>}
                      {formData.videoUrl && <p><span className="font-semibold">Video:</span> {formData.videoUrl}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {/* Upload progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full px-2 mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-2" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-sm text-gray-600 mt-1">Uploading images: {uploadProgress}%</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t py-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < 7 ? (
              <Button
                type="button"
                disabled={!validateStep(currentStep)}
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`bg-green-600 hover:bg-green-700 text-white shadow-lg ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center">
                    Submitting{uploadProgress > 0 ? ` (${uploadProgress}%)` : '...'}
                  </span>
                ) : (
                  <>
                    Submit Property
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Property created</DialogTitle>
            <DialogDescription>Your property was created successfully. Redirecting to the property page…</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSuccessModalOpen(false);
                  if (createdPropertyId) router.push(`/properties/${createdPropertyId}`);
                }}
              >
                View Property
              </Button>
              <Button variant="outline" onClick={() => setSuccessModalOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Failed to create property</DialogTitle>
            <DialogDescription>{submitError || 'An unknown error occurred while creating the property.'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyForm;