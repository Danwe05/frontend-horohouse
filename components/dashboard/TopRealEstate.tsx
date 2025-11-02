'use client';
import React from 'react';
import Link from 'next/link'; 
import { TbRulerMeasure } from 'react-icons/tb';
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";

interface TopRealEstateItem {
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

interface TopRealEstateProps {
  properties: TopRealEstateItem[];
}

const PropertyCard: React.FC<TopRealEstateItem> = ({
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
    <div className="bg-white rounded-xl shadow-xl overflow-hidden w-[280px]">
      <img src={image} className="w-full h-40 object-cover" />
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800 text-sm md:text-base">
            {type} {status}
          </h3>
          <span className="font-semibold text-blue-600 text-sm md:text-base">{price}</span>
        </div>

        <div className="flex items-center justify-start gap-3 text-gray-500 text-xs mb-3">
          <div className="flex items-center gap-1">
            <FaBed className="w-4 h-4" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <TbRulerMeasure className="w-4 h-4" />
            <span>{area}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img src={agentPhoto} alt={agentName} className="w-6 h-6 rounded-full object-cover" />
          <div className="text-xs text-gray-600">
            <p className="font-semibold text-black">{agentName}</p>
            <p>{agentRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TopRealEstate: React.FC<TopRealEstateProps> = ({ properties }) => {
  return (
    <div className="px-10 pt-11">
      <div className="flex gap-x-83 items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Top Real Estate</h2>
        {/* Bouton View All avec hover bleu */}
        <Link 
          href="/ViewAllDashboard" 
          className="text-[#808080] text-sm font-medium transition-colors hover:text-blue-600"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-wrap gap-6">
        {properties.map((property, index) => (
          <PropertyCard key={index} {...property} />
        ))}
      </div>
    </div>
  );
};

export default TopRealEstate;
