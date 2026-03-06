'use client';
import React, { useState } from 'react';
import { MdBed } from 'react-icons/md';
import { AiOutlineEnvironment } from 'react-icons/ai';
import { TbRulerMeasure } from 'react-icons/tb';
import { BiBath } from 'react-icons/bi';
import { useRouter } from 'next/navigation'; // <-- déjà présent

interface Property {
  title: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  image?: string;
}

const PropertyCard: React.FC<Property> = ({ title, price, location, bedrooms, bathrooms, area, image }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden w-[300px]">
    <div className="relative">
      <img
        src={image || 'https://via.placeholder.com/300x180'} 
        alt={title}
        className="w-full h-44 object-cover"
      />
      <span className="absolute top-2 left-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full shadow">
        Added today
      </span>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800 text-sm md:text-base">{title}</h3>
        <span className="font-bold text-gray-900">{price}</span>
      </div>
      <div className="flex items-center gap-3 text-gray-500 text-xs mb-3">
        <div className="flex items-center gap-1"><MdBed className="w-4 h-4" /><span>{bedrooms}</span></div>
        <div className="flex items-center gap-1"><BiBath className="w-4 h-4" /><span>{bathrooms}</span></div>
        <div className="flex items-center gap-1"><TbRulerMeasure className="w-4 h-4" /><span>{area}</span></div>
        <div className="flex items-center gap-1"><AiOutlineEnvironment className="w-4 h-4" /><span>{location}</span></div>
      </div>
    </div>
  </div>
);

const AddProperty: React.FC = () => {
  const router = useRouter(); // <-- ici on initialise router
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState<Property>({
    title: '',
    price: '',
    location: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '50 m²',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.location) return;
    setProperties([...properties, formData]);
    setFormData({ title: '', price: '', location: '', bedrooms: 1, bathrooms: 1, area: '50 m²' });
  };

  return (
    <div className="px-7 space-y-4 flex flex-col items-end bg-white">
      {/* Bouton Add Property */}
      <button
        className="px-5 py-3 mt-7 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 cursor-pointer"
        onClick={() => router.push('/dashboard/propertyForm')} 
      >
        + Add Property
      </button>

      {/* Liste de cartes */}
      <div className="flex flex-col gap-4 mt-4 items-end">
        {properties.map((property, index) => (
          <PropertyCard key={index} {...property} />
        ))}
      </div>
    </div>
  );
};

export default AddProperty;
