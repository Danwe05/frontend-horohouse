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

const SaveSearchModal = ({ isOpen, onClose, onSave, initialData = null, currentFilters = {} }: any) => {
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
    if (!isOpen) return; // Only run when modal is open

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
  }, [isOpen]); // Only depend on isOpen

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
      
      // Convert string prices back to numbers
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
      
      // Remove undefined values
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? 'Edit Saved Search' : 'Save This Search'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Get notified when new properties match your criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Search Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Search Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Downtown Apartments"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Search Criteria Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-900">
                Search Criteria
              </label>
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {getCriteriaCount()} criteria set
              </span>
            </div>
            
            {errors.criteria && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {errors.criteria}
              </div>
            )}

            <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.searchCriteria.city}
                    onChange={(e) => handleChange('searchCriteria.city', e.target.value)}
                    placeholder="City or area"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Property Type & Listing Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    value={formData.searchCriteria.propertyType}
                    onChange={(e) => handleChange('searchCriteria.propertyType', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Any Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Land">Land</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Listing Type
                  </label>
                  <select
                    value={formData.searchCriteria.listingType}
                    onChange={(e) => handleChange('searchCriteria.listingType', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Any</option>
                    <option value="sale">Buy</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Price Range (XAF)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.searchCriteria.minPrice}
                      onChange={(e) => handleChange('searchCriteria.minPrice', e.target.value)}
                      placeholder="Min price"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.searchCriteria.maxPrice}
                      onChange={(e) => handleChange('searchCriteria.maxPrice', e.target.value)}
                      placeholder="Max price"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.searchCriteria.bedrooms}
                      onChange={(e) => handleChange('searchCriteria.bedrooms', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
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
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.searchCriteria.bathrooms}
                      onChange={(e) => handleChange('searchCriteria.bathrooms', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
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

          {/* Notification Settings */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Notification Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'instant', label: 'Instant', desc: 'Real-time' },
                { value: 'daily', label: 'Daily', desc: 'Once a day' },
                { value: 'weekly', label: 'Weekly', desc: 'Every week' },
                { value: 'never', label: 'Never', desc: 'No alerts' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('notificationFrequency', option.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.notificationFrequency === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Bell className={`h-4 w-4 ${
                      formData.notificationFrequency === option.value
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`} />
                    {formData.notificationFrequency === option.value && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className={`font-semibold text-sm ${
                    formData.notificationFrequency === option.value
                      ? 'text-blue-900'
                      : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-xs ${
                    formData.notificationFrequency === option.value
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">Active Status</p>
              <p className="text-sm text-gray-500">
                {formData.isActive ? 'Currently receiving notifications' : 'Notifications paused'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                formData.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                formData.isActive ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-blue-500/30"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {initialData ? 'Update Search' : 'Save Search'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSearchModal;