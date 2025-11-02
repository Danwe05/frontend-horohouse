"use client"

import { Star, Wifi, BedDouble, Bath, Utensils, Maximize2, MapPin, Eye, Calendar, Home, Car, Snowflake, Dumbbell, Tv, Waves, Shield, Coffee, TreePine, Users, Clock, ArrowUpRight, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface PropertyInfoProps {
  property: {
    title: string;
    address: string;
    city: string;
    neighborhood?: string;
    country?: string;
    type: string;
    listingType: string;
    description: string;
    amenities: {
      bedrooms?: number;
      bathrooms?: number;
      hasInternet?: boolean;
      furnished?: boolean;
      parking?: boolean;
      airConditioning?: boolean;
      gym?: boolean;
      pool?: boolean;
      security?: boolean;
      balcony?: boolean;
      garden?: boolean;
    };
    area?: number;
    viewsCount: number;
    createdAt: string;
    keywords: string[];
    virtualTourUrl?: string;
    videoUrl?: string;
    priceHistory?: Array<{
      date: string;
      price: number;
      event?: string;
    }>;
  };
}

const PropertyInfo = ({ property }: PropertyInfoProps) => {
  const amenities = property.amenities || {};
  const fullAddress = `${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ''}, ${property.city}${property.country ? `, ${property.country}` : ''}`;
  
  const [activeVirtualTab, setActiveVirtualTab] = useState<'tour' | 'video'>('tour');

  // Enhanced amenities with icons and labels
  const amenityGroups = [
    {
      title: "Essentials",
      items: [
        { icon: BedDouble, label: `${amenities.bedrooms || 0} Bedrooms`, value: amenities.bedrooms },
        { icon: Bath, label: `${amenities.bathrooms || 0} Bathrooms`, value: amenities.bathrooms },
        { icon: Maximize2, label: `${property.area || 0} sqm`, value: property.area },
      ].filter(item => item.value)
    },
    {
      title: "Comfort & Living",
      items: [
        { icon: Wifi, label: "High-Speed WiFi", value: amenities.hasInternet },
        { icon: Snowflake, label: "Air Conditioning", value: amenities.airConditioning },
        { icon: Utensils, label: "Furnished", value: amenities.furnished },
        { icon: Coffee, label: "Balcony", value: amenities.balcony },
        { icon: TreePine, label: "Garden", value: amenities.garden },
      ].filter(item => item.value)
    },
    {
      title: "Facilities",
      items: [
        { icon: Car, label: "Parking", value: amenities.parking },
        { icon: Dumbbell, label: "Gym", value: amenities.gym },
        { icon: Waves, label: "Swimming Pool", value: amenities.pool },
        { icon: Shield, label: "Security", value: amenities.security },
      ].filter(item => item.value)
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysOnMarket = () => {
    const created = new Date(property.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Badges and Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1.5 capitalize text-sm font-semibold">
            {property.type}
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 capitalize text-sm font-semibold">
            For {property.listingType}
          </Badge>
          {amenities.furnished && (
            <Badge variant="outline" className="px-3 py-1.5 border-green-200 text-green-700 bg-green-50">
              Fully Furnished
            </Badge>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{property.viewsCount.toLocaleString()}</span>
              <span className="hidden sm:inline">views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{getDaysOnMarket()}d</span>
              <span className="hidden sm:inline">on market</span>
            </div>
          </div>
        </div>

        {/* Title and Address */}
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
            {property.title}
          </h1>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-medium">{fullAddress}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Listed on {formatDate(property.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-6">
          <TabsTrigger 
            value="description"
            className="relative data-[state=active]:text-primary data-[state=active]:font-semibold rounded-none pb-4 px-1 transition-all duration-200 hover:text-foreground"
          >
            Description
            <div className="absolute bottom-0 left-0 w-0 data-[state=active]:w-full h-0.5 bg-primary transition-all duration-300" />
          </TabsTrigger>
          <TabsTrigger 
            value="features"
            className="relative data-[state=active]:text-primary data-[state=active]:font-semibold rounded-none pb-4 px-1 transition-all duration-200 hover:text-foreground"
          >
            Features
            <div className="absolute bottom-0 left-0 w-0 data-[state=active]:w-full h-0.5 bg-primary transition-all duration-300" />
          </TabsTrigger>
          <TabsTrigger 
            value="virtual"
            className="relative data-[state=active]:text-primary data-[state=active]:font-semibold rounded-none pb-4 px-1 transition-all duration-200 hover:text-foreground"
          >
            Virtual Tour
            <div className="absolute bottom-0 left-0 w-0 data-[state=active]:w-full h-0.5 bg-primary transition-all duration-300" />
          </TabsTrigger>
          <TabsTrigger 
            value="price"
            className="relative data-[state=active]:text-primary data-[state=active]:font-semibold rounded-none pb-4 px-1 transition-all duration-200 hover:text-foreground"
          >
            Price History
            <div className="absolute bottom-0 left-0 w-0 data-[state=active]:w-full h-0.5 bg-primary transition-all duration-300" />
          </TabsTrigger>
        </TabsList>

        {/* Description Tab */}
        <TabsContent value="description" className="mt-8 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">About this property</h2>
            <p className="text-foreground leading-relaxed whitespace-pre-line text-lg">
              {property.description}
            </p>
          </div>

          {/* Enhanced Property Features */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Property Features</h3>
            <div className="grid gap-6">
              {amenityGroups.map((group, index) => (
                group.items.length > 0 && (
                  <div key={index} className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground/80">{group.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.items.map((item, itemIndex) => (
                        <div 
                          key={itemIndex}
                          className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/20 transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-8">
          {property.keywords.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Property Highlights</h2>
              <div className="flex flex-wrap gap-3">
                {property.keywords.map((keyword, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-default"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
              
              {/* Additional Features Summary */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Home className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">Property Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-semibold capitalize">{property.type}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Listing Type</p>
                      <p className="font-semibold capitalize">For {property.listingType}</p>
                    </div>
                    {property.area && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Area</p>
                        <p className="font-semibold">{property.area} sqm</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Furnishing</p>
                      <p className="font-semibold">{amenities.furnished ? 'Furnished' : 'Unfurnished'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Home className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-lg">No additional features listed.</p>
            </div>
          )}
        </TabsContent>

        {/* Virtual Tour Tab */}
        <TabsContent value="virtual" className="mt-8 space-y-6">
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeVirtualTab === 'tour' ? 'default' : 'outline'}
              onClick={() => setActiveVirtualTab('tour')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Virtual Tour
            </Button>
            <Button
              variant={activeVirtualTab === 'video' ? 'default' : 'outline'}
              onClick={() => setActiveVirtualTab('video')}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Video Tour
            </Button>
          </div>

          {property.virtualTourUrl || property.videoUrl ? (
            <div className="grid gap-4">
              {activeVirtualTab === 'tour' && property.virtualTourUrl && (
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">360° Virtual Tour</h3>
                        <p className="text-muted-foreground">Explore this property in immersive 3D</p>
                      </div>
                      <Button asChild className="gap-2">
                        <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer">
                          Start Tour
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeVirtualTab === 'video' && property.videoUrl && (
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-7 w-7 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">Video Tour</h3>
                        <p className="text-muted-foreground">Watch a guided video walkthrough</p>
                      </div>
                      <Button asChild variant="outline" className="gap-2">
                        <a href={property.videoUrl} target="_blank" rel="noopener noreferrer">
                          Watch Video
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Tv className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-lg">No virtual tours available for this property.</p>
              <p className="text-sm text-muted-foreground">Contact the agent for a physical tour.</p>
            </div>
          )}
        </TabsContent>

        {/* Price History Tab */}
        <TabsContent value="price" className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Listed on {formatDate(property.createdAt)}</p>
                <p className="text-sm text-muted-foreground">Active for {getDaysOnMarket()} days</p>
              </div>
            </div>

            {property.priceHistory && property.priceHistory.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Price History</h3>
                <div className="space-y-3">
                  {property.priceHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="font-medium">{formatDate(entry.date)}</p>
                        {entry.event && (
                          <p className="text-sm text-muted-foreground">{entry.event}</p>
                        )}
                      </div>
                      <p className="font-semibold text-lg">{entry.price.toLocaleString()} XAF</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Price History Tracking</h3>
                  <p className="text-muted-foreground mb-4">
                    Track price changes and market trends for this property
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 mb-4">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete property listing • Price monitoring active
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyInfo;