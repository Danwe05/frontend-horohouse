'use client';
import React from 'react';
import { TbRulerMeasure } from 'react-icons/tb';
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";

interface ViewAllDashboardItem {
  image: string;
  type: string; 
  status: string; 
  price: string;
  bedrooms: number;
  location: string;
  area: string;
  agentName: string;
  agentRole: string;
  agentPhoto: string;
}

interface ViewAllDashboardProps {
  properties: ViewAllDashboardItem[];
}

const PropertyCard: React.FC<ViewAllDashboardItem> = ({
  image,
  type,
  status,
  price,
  bedrooms,
  location,
  area,
  agentName,
  agentRole,
  agentPhoto,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      <img src={image} className="w-full h-26 object-cover" />
      <div className="px-2 py-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800 text-sm md:text-[10px]">
            {type} {status}
          </h3>
          <span className="font-semibold text-blue-600 text-sm md:text-[10px]">{price}</span>
        </div>

        <div className="flex items-center justify-start gap-2 text-gray-500 mb-3">
          <div className="flex items-center gap-1 md:text-[8px]">
            <FaBed className="w-3 h-3" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1 md:text-[8px]">
            <FaMapMarkerAlt className="w-3 h-3" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1 md:text-[8px]">
            <TbRulerMeasure className="w-3 h-3" />
            <span>{area}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ">
          <img src={agentPhoto} alt={agentName} className="w-6 h-6 rounded-full object-cover" />
          <div className="text-xs text-gray-600">
            <p className="font-semibold text-black md:text-[9px]">{agentName}</p>
            <p className='md:text-[9px]'>{agentRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewAllDashboard: React.FC<ViewAllDashboardProps> = ({ properties }) => {
  return (
    <div className="px-10 pt-11">
        {/* Search Bar */}
      <div className="mb-8">
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Top Real Estate</h2>
      </div>

      {/* Grid responsive avec jusqu'à 4 cartes par ligne */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        {properties.map((property, index) => (
          <PropertyCard key={index} {...property} />
        ))}
      </div>
    </div>
  );
};

export default ViewAllDashboard;
