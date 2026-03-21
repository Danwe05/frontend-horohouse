"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { BookingSummaryWidget } from "@/components/dashboard/BookingSummaryWidget";
import { useLanguage } from "@/contexts/LanguageContext";

type Property = any;

interface Props {
  properties: Property[];
  loadingProperties: boolean;
  handlePropertyUpdate: () => void;
  router: any;
}

export default function UserRole({ properties, loadingProperties, handlePropertyUpdate, router }: Props) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.roles?.user || {};
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border -none p-3 lg:p-6">
            <div className="flex items-center flex-wrap justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{s.recommendedProperties || "Recommended Properties"}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/properties')}
                    className="w-full sm:w-auto"
                  >
                    {s.viewAll || "View All"}
                  </Button>
                </div>
              </div>
            </div>

            {loadingProperties ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{s.noProperties || "No properties available"}</h3>
                <p className="text-muted-foreground mb-4">{s.checkBack || "Check back later for new listings"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.slice(0, 4).map((property: Property) => {
                  const propertyId = property._id || property.id || 'unknown';
                  const images = property.images || [];
                  const firstImage = images.length > 0
                    ? (typeof images[0] === 'string' ? images[0] : (images[0] as { url: string })?.url)
                    : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500";

                  const addressParts = [property.address, property.city, property.country].filter(Boolean);
                  const locationStr = addressParts.length > 0 ? addressParts.join(", ") : (s.locationNotSpecified || "Location not specified");

                  const beds = property.amenities?.bedrooms ?? property.bedrooms ?? property.beds ?? 0;
                  const baths = property.amenities?.bathrooms ?? property.bathrooms ?? property.baths ?? 0;

                  return (
                    <PropertyCard
                      key={propertyId}
                      id={propertyId}
                      image={firstImage}
                      title={property.title || s.untitledProperty || "Untitled Property"}
                      location={locationStr}
                      price={property.price || 0}
                      beds={beds}
                      baths={baths}
                      sqft={property.area || property.sqft || property.squareFeet || 0}
                      type={property.type || "sale"}
                      status={property.status || property.availability || "active"}
                      isFeatured={property.isFeatured || false}
                      isVerified={property.isVerified || false}
                      viewCount={property.viewsCount || property.viewCount || property.views || 0}
                      favoriteCount={property.favoriteCount || property.favorites || 0}
                      isFavorite={property.isFavorite || false}
                      onUpdate={handlePropertyUpdate}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <BookingSummaryWidget role="guest" title={s.myRecentStays || "My Recent Stays"} limit={5} />
        </div>
      </div>
    </div>
  );
}
