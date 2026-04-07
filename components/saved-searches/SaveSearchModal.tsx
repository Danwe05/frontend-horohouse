import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Bell,
  MapPin,
  DollarSign,
  Home,
  Bed,
  Bath,
  Loader2,
  Check
} from 'lucide-react';

const SaveSearchModal = ({ isOpen, onClose, onSave, initialData, currentFilters }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    searchCriteria: {
      city: '',
      propertyType: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      amenities: []
    },
    notificationFrequency: 'daily',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    criteria?: string;
    submit?: string;
  }>({});

  // Initialize form with current filters or editing data
  useEffect(() => {
    if (!isOpen) return; // Only run when modal opens

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        searchCriteria: {
          city: initialData.searchCriteria?.city || '',
          propertyType: initialData.searchCriteria?.propertyType || '',
          listingType: initialData.searchCriteria?.listingType || '',
          minPrice: initialData.searchCriteria?.minPrice?.toString() || '',
          maxPrice: initialData.searchCriteria?.maxPrice?.toString() || '',
          bedrooms: initialData.searchCriteria?.bedrooms?.toString() || '',
          bathrooms: initialData.searchCriteria?.bathrooms?.toString() || '',
          amenities: initialData.searchCriteria?.amenities || []
        },
        notificationFrequency: initialData.notificationFrequency || 'daily',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      });
    } else if (currentFilters && Object.keys(currentFilters).length > 0) {
      setFormData(prev => ({
        ...prev,
        searchCriteria: {
          ...prev.searchCriteria,
          city: currentFilters.city || '',
          listingType: currentFilters.listingType || '',
          minPrice: currentFilters.minPrice?.toString() || '',
          maxPrice: currentFilters.maxPrice?.toString() || '',
          bedrooms: currentFilters.bedrooms?.toString() || '',
          bathrooms: currentFilters.bathrooms?.toString() || ''
        }
      }));
    } else {
      // Reset to default when opening without data
      setFormData({
        name: '',
        searchCriteria: {
          city: '',
          propertyType: '',
          listingType: '',
          minPrice: '',
          maxPrice: '',
          bedrooms: '',
          bathrooms: '',
          amenities: []
        },
        notificationFrequency: 'daily',
        isActive: true
      });
    }

    // Clear errors when modal opens
    setErrors({});

    // 2. We ONLY depend on `isOpen` so it strictly runs when the modal pops up.
    // We use the eslint-disable comment to tell React we know what we are doing here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: {
      name?: string;
      criteria?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter a name for this search';
    }

    const hasCriteria = Object.values(formData.searchCriteria).some(
      val => val && (typeof val !== 'object' || val.length > 0)
    );

    if (!hasCriteria) {
      newErrors.criteria = 'Please add at least one search criterion';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);

    try {
      const cleanedCriteria = Object.fromEntries(
        Object.entries(formData.searchCriteria).filter(([_, v]) =>
          v !== '' && v !== undefined && (typeof v !== 'object' || v.length > 0)
        )
      );

      const dataToSave: any = {
        name: formData.name,
        searchCriteria: {
          ...cleanedCriteria,
          minPrice: cleanedCriteria.minPrice ? parseInt(cleanedCriteria.minPrice as string, 10) : undefined,
          maxPrice: cleanedCriteria.maxPrice ? parseInt(cleanedCriteria.maxPrice as string, 10) : undefined,
          bedrooms: cleanedCriteria.bedrooms ? parseInt(cleanedCriteria.bedrooms as string, 10) : undefined,
          bathrooms: cleanedCriteria.bathrooms ? parseInt(cleanedCriteria.bathrooms as string, 10) : undefined,
        },
        notificationFrequency: formData.notificationFrequency,
        isActive: formData.isActive
      };

      dataToSave.searchCriteria = Object.fromEntries(
        Object.entries(dataToSave.searchCriteria).filter(([_, v]) => v !== undefined)
      );

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to save search. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const getCriteriaCount = () => {
    return Object.values(formData.searchCriteria).filter(
      val => val && (typeof val !== 'object' || val.length > 0)
    ).length;
  };

  const inputClasses = "w-full pl-11 pr-4 py-3.5 bg-white border border-[#DDDDDD] rounded-lg text-[15px] text-[#222222] placeholder:text-[#717171] focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors appearance-none";

  return (
    <div className="fixed inset-0 bg-blue-700/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">
              {initialData ? 'Edit saved search' : 'Save this search'}
            </h2>
            <p className="text-[15px] text-[#717171] mt-1">
              Get notified when new properties match your criteria.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors group flex-shrink-0"
          >
            <X className="h-5 w-5 text-[#222222]" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">

          {/* Search Name */}
          <div>
            <label className="block text-[15px] font-semibold text-[#222222] mb-2">
              Search name <span className="text-[#0066FF]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Downtown Apartments"
              className={`w-full px-4 py-3.5 bg-white border rounded-lg text-[15px] text-[#222222] placeholder:text-[#717171] focus:outline-none focus:ring-1 transition-colors ${errors.name
                ? 'border-[#E50000] focus:ring-[#E50000] focus:border-[#E50000]'
                : 'border-[#DDDDDD] focus:ring-[#222222] focus:border-blue-600'
                }`}
            />
            {errors.name && (
              <p className="text-[13px] font-medium text-[#E50000] mt-1.5">{errors.name}</p>
            )}
          </div>

          <hr className="border-[#DDDDDD]" />

          {/* Search Criteria Section */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <label className="block text-[18px] font-semibold text-[#222222]">
                Filters applied
              </label>
              <span className="text-[12px] font-medium text-[#717171] bg-[#F7F7F7] px-3 py-1 rounded-full border border-[#DDDDDD]">
                {getCriteriaCount()} selected
              </span>
            </div>

            {errors.criteria && (
              <div className="mb-5 p-4 bg-[#FFF8F8] border border-[#FFDFDF] rounded-lg text-[14px] font-medium text-[#E50000]">
                {errors.criteria}
              </div>
            )}

            <div className="space-y-5">
              {/* Location */}
              <div>
                <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                  <input
                    type="text"
                    value={formData.searchCriteria.city}
                    onChange={(e) => handleChange('searchCriteria.city', e.target.value)}
                    placeholder="City or area"
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Property Type & Listing Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                    Property Type
                  </label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                    <select
                      value={formData.searchCriteria.propertyType}
                      onChange={(e) => handleChange('searchCriteria.propertyType', e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Any Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Land">Land</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                    Listing Type
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2] opacity-0" /> {/* Spacer for alignment */}
                    <select
                      value={formData.searchCriteria.listingType}
                      onChange={(e) => handleChange('searchCriteria.listingType', e.target.value)}
                      className={`${inputClasses} !pl-4`}
                    >
                      <option value="">Any</option>
                      <option value="sale">Buy</option>
                      <option value="rent">Rent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                  Price Range (XAF)
                </label>
                <div className="grid grid-cols-2 gap-5">
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                    <input
                      type="number"
                      value={formData.searchCriteria.minPrice}
                      onChange={(e) => handleChange('searchCriteria.minPrice', e.target.value)}
                      placeholder="Min price"
                      className={inputClasses}
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                    <input
                      type="number"
                      value={formData.searchCriteria.maxPrice}
                      onChange={(e) => handleChange('searchCriteria.maxPrice', e.target.value)}
                      placeholder="Max price"
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                    <select
                      value={formData.searchCriteria.bedrooms}
                      onChange={(e) => handleChange('searchCriteria.bedrooms', e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#222222] mb-1.5">
                    Bathrooms
                  </label>
                  <div className="relative">
                    <Bath className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                    <select
                      value={formData.searchCriteria.bathrooms}
                      onChange={(e) => handleChange('searchCriteria.bathrooms', e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[#DDDDDD]" />

          {/* Notification Settings */}
          <div>
            <label className="block text-[18px] font-semibold text-[#222222] mb-4">
              Alert preferences
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: 'instant', label: 'Instant', desc: 'Real-time' },
                { value: 'daily', label: 'Daily', desc: 'Once a day' },
                { value: 'weekly', label: 'Weekly', desc: 'Every week' },
                { value: 'never', label: 'Never', desc: 'No alerts' }
              ].map((option) => {
                const isSelected = formData.notificationFrequency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('notificationFrequency', option.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${isSelected
                      ? 'border-[#0066FF] bg-[#F0F5FF]'
                      : 'border-[#DDDDDD] bg-white hover:border-blue-600'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Bell className={`h-4 w-4 stroke-[2] ${isSelected ? 'text-[#0066FF]' : 'text-[#717171]'}`} />
                      {isSelected && <Check className="h-4 w-4 stroke-[2.5] text-[#0066FF]" />}
                    </div>
                    <div className={`font-semibold text-[14px] ${isSelected ? 'text-[#0066FF]' : 'text-[#222222]'}`}>
                      {option.label}
                    </div>
                    <div className={`text-[12px] font-medium mt-0.5 ${isSelected ? 'text-[#0066FF]/80' : 'text-[#717171]'}`}>
                      {option.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-5 border border-[#DDDDDD] rounded-xl">
            <div>
              <p className="text-[15px] font-semibold text-[#222222]">Active status</p>
              <p className="text-[14px] text-[#717171] mt-0.5">
                {formData.isActive ? 'Currently receiving notifications' : 'Notifications are paused'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066FF] ${formData.isActive ? 'bg-[#0066FF]' : 'bg-[#DDDDDD]'
                }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {errors.submit && (
            <div className="p-4 bg-[#FFF8F8] border border-[#FFDFDF] rounded-lg text-[14px] font-medium text-[#E50000]">
              {errors.submit}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#DDDDDD] bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 font-semibold text-[15px] text-[#222222] hover:bg-[#F7F7F7] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg font-semibold text-[15px] transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 stroke-[2]" />
                {initialData ? 'Update search' : 'Save search'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SaveSearchModal;