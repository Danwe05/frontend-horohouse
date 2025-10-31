"use client";

import { TbRulerMeasure } from "react-icons/tb";
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";
import { ChevronDown, Heart } from "lucide-react";

const recentProperties = [
  {
    id: 1,
    title: "House For Rent",
    price: 33000,
    beds: 3,
    location: "Abuja",
    size: 110,
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
  {
    id: 2,
    title: "House For Sell",
    price: 65000,
    beds: 4,
    location: "Lagos",
    size: 120,
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
  {
    id: 3,
    title: "House For Rent",
    price: 33000,
    beds: 3,
    location: "Abuja",
    size: 110,
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
  {
    id: 4,
    title: "House For Rent",
    price: 66000,
    beds: 3,
    location: "Abuja",
    size: 610,
    image: "/FavoritePage/SavedPropertiesFavorite/SavedPropertiesFavoriteImage.jpg",
  },
];

export default function PeopertyListCards() {
  const listing = 120;

  return (
    <section className="py-3 pr-4 pl-2">
      <div className=" overflow-auto px-3 py-3">
        {/* Header */}
        <h2 className="text-2xl font-bold text-black">
          Apartment For Rent In Lagos
        </h2>
        <p className="font-bold text-gray-500 text-md mb-5">
          <span className="text-[#0089F7] font-bold">{listing}</span> listing
          found
        </p>

        <div className="flex flex-row justify-end items-center gap-2 pb-5 pt-2">
          <p className="text-gray-500 text-sm">Sort by</p>
          <button className="flex gap-2 font-bold border border-[#0089F7] text-[#0089F7] px-4 py-3 rounded-lg text-xs transition cursor-pointer">
            Newest
            <ChevronDown className="w-4 h-4 text-[#808080]" />
          </button>
          <button className="p-2 border rounded-lg bg-[#0089F7]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="white"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-5">
          {recentProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg transition overflow-hidden cardPropertyList"
            >
              {/* Image with overlays */}
              <div className="relative w-full h-48">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
                {/* Badge */}
                <span className="absolute top-3 left-3 bg-white text-gray-600 text-xs font-bold px-3 py-1 rounded-md">
                  Recent viewed
                </span>
                {/* Favorite button */}
                <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:scale-110 transition">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                </button>
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-black">
                    {property.title}
                  </h3>
                  <p className="text-xs font-bold text-blue-500">
                    ${property.price.toLocaleString()}
                  </p>
                </div>

                {/* Features */}
                <div className="flex items-center gap-4 text-gray-600 text-sm mt-3">
                  <div className="flex items-center gap-1 text-[10px]">
                    <FaBed className="w-3 h-3" />
                    <span>{property.beds}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <FaMapMarkerAlt className="w-3 h-3" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <TbRulerMeasure className="w-3 h-3" />
                    <span>{property.size} m²</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
