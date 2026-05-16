// app/boosts/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useBoost } from '@/hooks/usePayment';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  ZapIcon, 
  TrendingUpIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon 
} from 'lucide-react';
import { BoostType, PaymentMethod, Currency } from '@/types/paiement';

export default function BoostsPage() {
  const {
    loading,
    error,
    boosts,
    activeBoost,
    options,
    createBoost,
    fetchUserBoosts,
    cancelBoost,
    getPricing
  } = useBoost();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<{ type: BoostType; duration: number } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState('property-123');

  const handleSelectBoost = async (boostType: BoostType, duration: number) => {
    setSelectedBoost({ type: boostType, duration });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentMethod: PaymentMethod, email?: string, phone?: string) => {
    if (!selectedBoost || !selectedProperty) return;

    try {
      await createBoost({
        propertyId: selectedProperty,
        boostType: selectedBoost.type,
        duration: selectedBoost.duration,
      });
      setPaymentModalOpen(false);
      fetchUserBoosts();
    } catch (error) {
      console.error('Boost creation failed:', error);
    }
  };

  const handleCancelBoost = async (boostId: string) => {
    try {
      await cancelBoost(boostId, 'User requested cancellation');
      fetchUserBoosts();
    } catch (error) {
      console.error('Boost cancellation failed:', error);
    }
  };

  const getBoostStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (hours: number) => {
    const days = hours / 24;
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days === 14) return '2 weeks';
    if (days === 30) return '1 month';
    return `${days} days`;
  };

  // Show loading state
  if (loading && (!options || options.length === 0)) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading boost options...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Boosts</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Boost Your Listings</h1>
        <p className="text-xl text-muted-foreground">
          Get more visibility for your properties with listing boosts
        </p>
      </div>

      <Tabs defaultValue="boost" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="boost">Boost Listing</TabsTrigger>
          <TabsTrigger value="history">Boost History</TabsTrigger>
        </TabsList>

        <TabsContent value="boost">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Boost Options */}
            <div className="lg:col-span-2">
              {!options || options.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ZapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No boost options available at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {options.map((option) => (
                    <Card key={option.type} className="relative">
                      {option.type === BoostType.PREMIUM && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ZapIcon className={`h-5 w-5 ${
                            option.type === BoostType.BASIC ? 'text-blue-500' :
                            option.type === BoostType.PREMIUM ? 'text-purple-500' :
                            'text-orange-500'
                          }`} />
                          {option.name}
                        </CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Features */}
                        {option.features && option.features.length > 0 && (
                          <ul className="space-y-2">
                            {option.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Pricing Options */}
                        {option.pricing && Object.keys(option.pricing).length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Duration Options:</h4>
                            {Object.entries(option.pricing).map(([duration, priceData]) => {
                              // Handle both price as number or object
                              const price = typeof priceData === 'object' && priceData !== null 
                                ? (priceData as any).price 
                                : priceData;
                              const durationLabel = typeof priceData === 'object' && priceData !== null
                                ? (priceData as any).durationLabel
                                : null;
                              const durationHours = typeof priceData === 'object' && priceData !== null
                                ? (priceData as any).duration
                                : (duration === 'daily' ? 24 : duration === 'weekly' ? 168 : duration === 'monthly' ? 720 : 24);
                              
                              return (
                                <div key={duration} className="flex items-center justify-between p-2 border rounded-lg">
                                  <div>
                                    <p className="font-medium capitalize">{durationLabel || duration}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDuration(durationHours)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">XAF {price}</p>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSelectBoost(
                                        option.type,
                                        durationHours
                                      )}
                                    >
                                      Select
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Active Boost Sidebar */}
            <div className="space-y-6">
              {activeBoost && (
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Active Boost</CardTitle>
                    <CardDescription>
                      Currently boosted property
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Property:</span>
                        <span className="font-medium"># {activeBoost.propertyId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Boost Type:</span>
                        <Badge variant="outline" className="capitalize">
                          {activeBoost.boostType}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Expires:</span>
                        <span className="font-medium">
                          {new Date(activeBoost.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-muted rounded">
                        <p className="font-bold">{activeBoost.impressions}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="font-bold">{activeBoost.clicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="font-bold">{activeBoost.inquiries}</p>
                        <p className="text-xs text-muted-foreground">Inquiries</p>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleCancelBoost(activeBoost._id)}
                    >
                      Cancel Boost
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Boost Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Boost?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Get 5x more property views',
                    'Appear in featured sections',
                    'Priority in search results',
                    'Increased inquiry rates',
                    'Professional badge on listing'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Boost History</CardTitle>
              <CardDescription>
                Your previous and active listing boosts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!boosts || boosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ZapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No boost history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {boosts.map((boost) => (
                    <div key={boost._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          boost.status === 'active' ? 'bg-green-100 text-green-600' :
                          boost.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <ZapIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Property #{boost.propertyId}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{boost.boostType} boost</span>
                            <span>•</span>
                            <span>{formatDuration(boost.duration)}</span>
                            <span>•</span>
                            <ClockIcon className="h-3 w-3" />
                            <span>
                              {new Date(boost.startDate).toLocaleDateString()} -{' '}
                              {new Date(boost.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={getBoostStatusColor(boost.status)}>
                          {boost.status}
                        </Badge>
                        {boost.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBoost(boost._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {selectedBoost && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          amount={selectedBoost.duration === 24 ? 5000 : selectedBoost.duration === 168 ? 25000 : 80000}
          currency={"XAF" as unknown as Currency}
          description={`${selectedBoost.type} boost for ${formatDuration(selectedBoost.duration)}`}
          onPaymentSubmit={handlePaymentSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}