// components/PropertyFilters.jsx
import { useState } from 'react';

type PropertyTypesKeys = 'home' | 'townhome' | 'apartment';
type PoolOptions = 'withPool' | 'noPool';

const PropertyFilters = () => {
  const [priceRange, setPriceRange] = useState({ min: 15, max: 30 });
  const [propertyTypes, setPropertyTypes] = useState<Record<PropertyTypesKeys, boolean>>({
    home: false,
    townhome: false,
    apartment: false
  });
  const [bedrooms, setBedrooms] = useState({ min: 1, max: 3 });
  const [bathrooms, setBathrooms] = useState({ min: 0, max: 0 });
  const [pool, setPool] = useState<Record<PoolOptions, boolean>>({ withPool: false, noPool: false });
  const [buildingSize, setBuildingSize] = useState({ min: 140, max: 200 });

  const handlePropertyTypeChange = (type: PropertyTypesKeys) => {
    setPropertyTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handlePoolChange = (option: PoolOptions) => {
    setPool(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleReset = () => {
    setPriceRange({ min: 15, max: 30 });
    setPropertyTypes({ home: false, townhome: false, apartment: false });
    setBedrooms({ min: 1, max: 3 });
    setBathrooms({ min: 0, max: 0 });
    setPool({ withPool: false, noPool: false });
    setBuildingSize({ min: 140, max: 200 });
  };

  return (
    <div>
      <div className="w-full max-w-md bg-white px-7 py-3 border-l border-gray-400 font-sans">
      
      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-black">Price Range</h3>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label htmlFor="priceMin" className="text-black text-sm mb-1">Min</label>
            <input
              type="number"
              id="priceMin"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="w-20 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="priceMax" className="text-black text-sm mb-1">Max</label>
            <input
              type="number"
              id="priceMax"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="w-20 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Property Types */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-black mb-3">Property Types</h3>
        <div className="space-y-2 font-bold">
          {['Home', 'Townhome', 'Apartment'].map(type => {
            const key = type.toLowerCase() as PropertyTypesKeys; 
            return (
              <div key={type} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={propertyTypes[key]}
                  onChange={() => handlePropertyTypeChange(key)}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor={key} className="ml-2 text-black text-xs">{type}</label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-black mb-3">Facility</h3>
        {/* Bedrooms */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-black mb-3">Bedrooms</h5>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label htmlFor="bedMin" className="text-black text-sm mb-1">Min</label>
            <input
              type="number"
              id="bedMin"
              value={bedrooms.min}
              onChange={(e) => setBedrooms(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="w-16 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="bedMax" className="text-black text-sm mb-1">Max</label>
            <input
              type="number"
              id="bedMax"
              value={bedrooms.max}
              onChange={(e) => setBedrooms(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="w-16 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bathrooms */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-black mb-3">Bathrooms</h5>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label htmlFor="bathMin" className="text-black text-sm mb-1">Min</label>
            <input
              type="number"
              id="bathMin"
              value={bathrooms.min}
              onChange={(e) => setBathrooms(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="w-16 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="bathMax" className="text-black text-sm mb-1">Max</label>
            <input
              type="number"
              id="bathMax"
              value={bathrooms.max}
              onChange={(e) => setBathrooms(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="w-16 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Pool */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-black mb-3">Pool</h5>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="withPool"
              checked={pool.withPool}
              onChange={() => handlePoolChange('withPool')}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="withPool" className="text-black text-xs">With Pool</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="noPool"
              checked={pool.noPool}
              onChange={() => handlePoolChange('noPool')}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="noPool" className="text-black text-xs">No Pool</label>
          </div>
        </div>
      </div>

      {/* Building Size */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-black mb-3">Building Size</h5>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label htmlFor="sizeMin" className="text-black text-sm mb-1">Min</label>
            <input
              type="number"
              id="sizeMin"
              value={buildingSize.min}
              onChange={(e) => setBuildingSize(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="w-20 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="sizeMax" className="text-black text-sm mb-1">Max</label>
            <input
              type="number"
              id="sizeMax"
              value={buildingSize.max}
              onChange={(e) => setBuildingSize(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="w-20 p-2 rounded-lg bg-white border border-gray-600 text-black text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      </div>
      

    </div>
    {/* Buttons */}
      <div className="flex gap-5 justify-center border-t border-l border-gray-400 px-7 py-8">
        <button
          onClick={handleReset}
          className="px-5 py-2 border border-[#0089F7] rounded-md text-[#0089F7] font-medium hover:bg-gray-50"
        >
          Reset
        </button>
        <button className="px-5 py-2 bg-[#0089F7] text-white rounded-md hover:bg-blue-700">
          Apply
        </button>
      </div>
    </div>
  );
};

export default PropertyFilters;
