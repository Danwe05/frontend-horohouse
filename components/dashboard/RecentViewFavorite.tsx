"use client";

import { TbRulerMeasure } from "react-icons/tb";
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";
import { Heart } from "lucide-react";

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
];

export default function RecentView() {
  return (
    <section className="pb-10">
      {/* Header */}
      <h2 className="text-2xl font-bold text-black my-5">Recent View</h2>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {recentProperties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-lg shadow-xl hover:shadow-lg transition overflow-hidden"
          >
            {/* Image with overlays */}
            <div className="relative">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-48 object-cover"
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
    </section>
  );
}
