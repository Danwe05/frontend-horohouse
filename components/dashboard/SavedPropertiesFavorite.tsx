"use client";

import Link from 'next/link';
import { TbRulerMeasure } from "react-icons/tb";
import { FaBed, FaBath, FaMapMarkerAlt } from "react-icons/fa";

const properties = [
  {
    id: 1,
    title: "House For Rent",
    price: 65000,
    beds: 3,
    baths: 2,
    size: 120,
    location: "Cameroon, Yaoundé",
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
  {
    id: 2,
    title: "House For Rent",
    price: 65000,
    beds: 3,
    baths: 2,
    size: 120,
    location: "Cameroon, Yaoundé",
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
  {
    id: 3,
    title: "House For Rent",
    price: 65000,
    beds: 3,
    baths: 2,
    size: 120,
    location: "Cameroon, Yaoundé",
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
  {
    id: 4,
    title: "House For Rent",
    price: 65000,
    beds: 3,
    baths: 2,
    size: 120,
    location: "Cameroon, Yaoundé",
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
];

export default function SavedProperties() {
  return (
    <section className="pb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-12">
        <h2 className="text-2xl font-bold text-black">Saved Properties</h2>
        <Link 
          href="/ViewAllFavorite" 
          className="text-[#808080] text-sm font-medium transition-colors hover:text-blue-600"
        >
          View All
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ">
        {properties.map((property) => (
          <div
            key={property.id}
            className="flex bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden  p-1"
          >
            {/* Image */}
            <div className="relative w-1/2">
              <img
                src={property.image}
                alt={property.title}
                className="w-35 h-27 object-cover rounded-lg"
              />
              <span className="absolute top-3 left-3 bg-white text-gray-600 text-[10px] font-bold px-2 py-1 rounded-md shadow">
                Saved
              </span>
            </div>

            {/* Details */}
            <div className="px-2 py-4 flex flex-col justify-between w-1/2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-black">{property.title}</h3>
                <p className="text-[10px] font-bold text-black">
                  ${property.price.toLocaleString()}
                </p>
              </div>

              {/* Features */}
              <div className="flex items-center gap-4 text-gray-600 text-xs mt-2">
                <div className="flex items-center gap-1 text-[10px]">
                  <FaBed className="w-3 h-3" />
                  <span>{property.beds}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <FaBath className="w-3 h-3" />
                  <span>{property.baths}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <TbRulerMeasure className="w-3 h-3" />
                  <span>{property.size} m²</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-500 text-[10px] mt-2">
                <FaMapMarkerAlt className="w-3 h-3" />
                <span>{property.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
