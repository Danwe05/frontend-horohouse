'use client';
import { MdBathtub } from 'react-icons/md';
import { TbRulerMeasure } from 'react-icons/tb';
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";


interface SavedPropertyItem {
  image: string;
  title: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  location: string;
}

interface SavedPropertiesProps {
  properties: SavedPropertyItem[];
}

const SavedProperties: React.FC<SavedPropertiesProps> = ({ properties }) => {
  return (
    <div className="px-10 py-5">
      {/* Search Bar */}
      <div className=" mb-4">
        <div className="relative w-[250px] max-w-sm">
          <input
            type="text"
            placeholder="Search"
            className="w-full border border-gray-300 rounded-md py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-600">Saved Properties</h2>
        <p className="text-gray-500 text-sm">All your saved properties</p>
      </div>

      {/* Property Cards */}
      <div className="space-y-4">
        {properties.map((property, index) => (
          <div
            key={index}
            className="flex bg-white rounded-xl shadow-md overflow-hidden border"
          >
            {/* Image */}
            <div className="relative w-40 h-32 flex-shrink-0">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-gray-100 text-xs text-gray-700 px-2 py-0.5 rounded">Saved</span>
            </div>

            {/* Info */}
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-800">{property.title}</h3>
                <span className="font-semibold text-gray-800">{property.price}</span>
              </div>

              <div className="flex gap-10 text-gray-500 text-sm mt-2">
                <div className="flex items-center gap-1">
                  <FaBed className="w-4 h-4" />
                  <span>{property.bedrooms}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdBathtub className="w-4 h-4" />
                  <span>{property.bathrooms}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TbRulerMeasure className="w-4 h-4" />
                  <span>{property.area}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-800 text-sm mt-5">
                <FaMapMarkerAlt className="w-4 h-4" />
                <span>{property.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedProperties;
