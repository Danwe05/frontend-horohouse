"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ✅ Type des données
export interface PropertyFieldsData {
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  saleOrRent: string;
  surface: string;
  price: string;
}

interface DescribePropertiesProps {
  onChange?: (data: PropertyFieldsData) => void; // rendu optionnel
}

export default function DescribeProperties({ onChange }: DescribePropertiesProps) {
  const [propertyType, setPropertyType] = useState("Home");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [saleOrRent, setSaleOrRent] = useState("For Sale");
  const [surface, setSurface] = useState("");
  const [price, setPrice] = useState("");
  const router = useRouter();

  // 🔄 Remonte les données au parent si fourni
  useEffect(() => {
    if (onChange) {
      onChange({ propertyType, bedrooms, bathrooms, saleOrRent, surface, price });
    }
  }, [propertyType, bedrooms, bathrooms, saleOrRent, surface, price, onChange]);

  // ✅ Validation
  const isFormValid =
    propertyType.trim() !== "" &&
    bedrooms > 0 &&
    bathrooms > 0 &&
    saleOrRent.trim() !== "" &&
    surface.trim() !== "" &&
    price.trim() !== "" &&
    !isNaN(Number(surface)) &&
    !isNaN(Number(price));

  // ✅ Navigation sécurisée
  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isFormValid) {
      router.push("/UploadProperties");
    }
  };

  return (
    <div className="w-full bg-white px-10 py-5 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-blue-600">Describe Your Property</h2>
        <p className="text-gray-500 text-sm max-w-80">
          Provide the key details of your property to help buyers or renters understand it better.
        </p>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-black text-xs font-semibold">Property Type*</label>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>Home</option>
          <option>Apartment</option>
          <option>Studio</option>
        </select>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="flex gap-4 mt-2">
        <div className="w-1/2">
          <label className="text-black text-xs font-semibold">Bedrooms*</label>
          <input
            type="number"
            min={1}
            value={bedrooms}
            onChange={(e) => setBedrooms(Number(e.target.value))}
            placeholder="Bedrooms"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-1/2">
          <label className="text-black text-xs font-semibold">Bathrooms*</label>
          <input
            type="number"
            min={1}
            value={bathrooms}
            onChange={(e) => setBathrooms(Number(e.target.value))}
            placeholder="Bathrooms"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sale or Rent */}
      <div>
        <label className="text-black text-xs font-semibold">Property Status*</label>
        <select
          value={saleOrRent}
          onChange={(e) => setSaleOrRent(e.target.value)}
          className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>For Sale</option>
          <option>For Rent</option>
        </select>
      </div>

      {/* Surface */}
      <div>
        <label className="text-black text-xs font-semibold">Surface (m²)*</label>
        <input
          type="text"
          value={surface}
          onChange={(e) => setSurface(e.target.value)}
          placeholder="Surface (m²)"
          className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Price */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-black">
          {saleOrRent === "For Rent" ? "Price / Month*" : "Property Price*"}
        </label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={saleOrRent === "For Rent" ? "Price / Month ($)" : "Price ($)"}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
        >
          &lt; Back
        </button>
        <button
          type="button"
          disabled={!isFormValid}
          onClick={handleNext}
          className={`px-4 py-2 rounded-md text-white ${
            isFormValid
              ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}
