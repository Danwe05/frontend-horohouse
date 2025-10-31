"use client"; 
import React, { useState } from "react";
import DescribeProperties, { PropertyFieldsData } from "@/components/dashboard/DescribeProperties";
import UserProfileNotification from "@/components/dashboard/UserProfileNotification";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DescribePropertiesPage() {
  const [propertyData, setPropertyData] = useState<PropertyFieldsData>({
    propertyType: "Home",
    bedrooms: 0,
    bathrooms: 0,
    saleOrRent: "For Sale",
    surface: "",
    price: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isPublishedModalOpen, setIsPublishedModalOpen] = useState(false);

  const handleSaveAndPreview = () => {
    if (
      !propertyData.propertyType ||
      !propertyData.bedrooms ||
      !propertyData.bathrooms ||
      !propertyData.saleOrRent ||
      !propertyData.surface ||
      !propertyData.price ||
      images.length === 0
    ) {
      setIsPublishedModalOpen(true);
      return;
    }

    const finalData = {
      title: `${propertyData.propertyType}`,
      description,
      price: propertyData.price,
      location: "",
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      propertyType: propertyData.propertyType,
      saleOrRent: propertyData.saleOrRent,
      surface: propertyData.surface,
    };

    console.log("✅ Données prêtes :", finalData, images, video);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      <div className="ml-60 flex-1 flex flex-col bg-white pb-10">
        <DescribeProperties onChange={setPropertyData} />
      </div>

      <div className="flex flex-col border-l-2 border-[#F0F0F0]">
        <UserProfileNotification />
        <DashboardCalendar />
      </div>
    </div>
  );
}
