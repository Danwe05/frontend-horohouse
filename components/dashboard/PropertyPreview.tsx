'use client'; 
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"; // import icônes
import { useRouter } from "next/navigation";
import { MdBathtub } from 'react-icons/md';
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";
import { TbRulerMeasure } from "react-icons/tb";

interface PropertyPreviewProps {
  
  description: string;
  location: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  price?: string;
  surface?: number; 
}

const PropertyPreview: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<PropertyPreviewProps | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishedModalOpen, setIsPublishedModalOpen] = useState(false);

  // Drag logic
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("propertyPreviewData");
    if (saved) setData(JSON.parse(saved));
  }, []);

  if (!data) return <p className="text-center mt-10">Loading preview...</p>;

  const {  description, location, images, bedrooms, bathrooms, price, surface  } = data;

  const prevImage = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    setPosition({ x: 0, y: 0 });
  };
  const nextImage = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    setPosition({ x: 0, y: 0 });
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Carte réutilisable pour le preview et le modal
  const PropertyCard = () => (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-bold text-blue-600 mt-10">Property Preview</h2>
      <p className="text-gray-500 text-sm max-w-90 mb-10">
        This is a preview of your property listing. Please review all details and media before publishing.
      </p>
      <div
        ref={containerRef}
        className="relative w-full h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {images.length > 0 ? (
          <img
            src={images[currentIndex]}
            alt={`property-${currentIndex}`}
            className="absolute w-full h-full object-contain cursor-grab select-none"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image uploaded
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`w-37 h-37 rounded-lg overflow-hidden cursor-pointer border-2 ${
              currentIndex === idx ? "border-blue-600" : "border-transparent"
            }`}
            onClick={() => {
              setCurrentIndex(idx);
              setPosition({ x: 0, y: 0 });
            }}
          >
            <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Property details - tout aligné horizontalement */}
<div className="flex items-center gap-11 text-gray-500 text-sm pt-4">
  {/* Titre */}
  <h3 className="text-black text-lg font-semibold">Buy with the price</h3>

  {/* Price */}
  <p className="text-blue-600 font-bold text-lg">{price} $</p>

  {/* Bedrooms */}
  <div className="flex items-center gap-1">
    <FaMapMarkerAlt className="w-5 h-5 text-gray-600" />
    <span>{location}</span>
  </div>

  {/* Bedrooms */}
  <div className="flex items-center gap-1">
    <FaBed className="w-5 h-5 text-gray-600" />
    <span>{bedrooms}</span>
  </div>

  {/* Bathrooms */}
  <div className="flex items-center gap-1">
    <MdBathtub className="w-5 h-5 text-gray-600" />
    <span>{bathrooms}</span>
  </div>

  {/* Surface */}
  <div className="flex items-center gap-1">
    <TbRulerMeasure className="w-5 h-5 text-gray-600" />
    <span>{surface ?? '—'} m²</span>
  </div>
</div>

    </div>
  );

  return (
    <div className="relative w-full max-w-3xl mx-auto px-10 space-y-6">
      {/* Buttons */}
      <div className="flex justify-between mb-8 mt-6">
        <button
          type="button"
          onClick={() => router.push("/UploadProperties")}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
        >
          &lt; Back
        </button>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
        >
          Publish
        </button>
      </div>

      {/* Preview Card */}
      <PropertyCard />

      {/* Modal de confirmation avant publication */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg p-10 max-w-xs w-full text-center space-y-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Confirm Publication</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to publish this property?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsPublishedModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Property Published" avec carte et icône */}
      {isPublishedModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto p-4">
          <div className="bg-white rounded-md shadow-lg p-10 max-w-xs w-full text-center space-y-5">
            <CheckCircle className="w-12 h-12 mx-auto text-black" />
            <p className="text-sm font-bold text-gray-600">Property published successfully</p>
            
            <div className="mt-6">
              <button
                onClick={() => setIsPublishedModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPreview;
