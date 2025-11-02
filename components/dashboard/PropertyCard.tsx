import { Card } from "@/components/ui/card";
import { Bed, Bath, Maximize, MoreVertical, Heart, Eye, Edit, Trash2, Share2, MapPin, TrendingUp, CheckCircle, Star, Ruler } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface PropertyCardProps {
  id: string;
  image: string;
  images?: string[];
  title: string;
  location: string;
  price: string | number;
  beds: number;
  baths: number;
  sqft: number;
  type?: string;
  status?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  viewCount?: number;
  favoriteCount?: number;
  isFavorite?: boolean;
  onUpdate?: () => void;
  timeAgo?: string;
}

export const PropertyCard = ({ 
  id,
  image,
  images,
  title, 
  location, 
  price, 
  beds, 
  baths, 
  sqft,
  type = "sale",
  status = "active",
  isFeatured = false,
  isVerified = false,
  viewCount = 0,
  favoriteCount = 0,
  isFavorite: initialIsFavorite = false,
  onUpdate,
  timeAgo
}: PropertyCardProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localFavoriteCount, setLocalFavoriteCount] = useState(favoriteCount);
  const [imageError, setImageError] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const isOwner = isAgent;

  // Use images array if provided, otherwise fallback to single image
  const imageArray = images && images.length > 0 ? images : [image];
  const hasMultipleImages = imageArray.length > 1;

  // Format price with proper handling
  const formatPrice = (price: string | number) => {
    try {
      const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
      if (isNaN(numPrice) || numPrice === 0) return 'Contact for price';
      
      // Format with XAF currency
      return `${numPrice.toLocaleString()} XAF`;
    } catch {
      return 'Contact for price';
    }
  };

  // Convert price to number for comparisons
  const getPriceAsNumber = (price: string | number): number => {
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
    return isNaN(numPrice) ? 0 : numPrice;
  };

  // Format number with fallback
  const formatNumber = (num: number) => {
    if (!num || num === 0) return null;
    return num;
  };

  // Format time ago
  const formatTimeAgo = (time?: string) => {
    if (!time) return null;
    const lowerTime = time.toLowerCase();
    if (lowerTime.includes('just') || lowerTime.includes('now') || 
        lowerTime.includes('second') || (lowerTime.includes('minute') && parseInt(lowerTime) < 5)) {
      return "just now";
    }
    return time;
  };

  const handlePropertyClick = () => {
    router.push(`/property/[id]${id}`);
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isTogglingFavorite) return;

    const previousState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic update

    try {
      setIsTogglingFavorite(true);
      
      if (previousState) {
        await apiClient.removeFromFavorites(id);
        setLocalFavoriteCount(prev => Math.max(0, prev - 1));
        toast.success("Removed from favorites", {
          description: "Property removed from your favorites list.",
        });
      } else {
        await apiClient.addToFavorites(id);
        setLocalFavoriteCount(prev => prev + 1);
        toast.success("Added to favorites", {
          description: "Property added to your favorites list.",
        });
      }
    } catch (error: any) {
      // Revert on error
      setIsFavorite(previousState);
      toast.error("Failed to update favorites", {
        description: error?.response?.data?.message || "Please try again later.",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/property/edit/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.deleteProperty(id);
      toast.success("Property deleted successfully");
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete property:', error);
      toast.error("Failed to delete property", {
        description: error?.response?.data?.message || "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const url = `${window.location.origin}/property/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this property: ${title}`,
          url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        console.error('Failed to copy:', error);
        toast.error("Failed to copy link");
      }
    }
  };

  const handleToggleFeatured = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await apiClient.togglePropertyFeatured(id, !isFeatured);
      toast.success(isFeatured ? "Property unfeatured" : "Property featured");
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      toast.error("Failed to update property");
    }
  };

  const handleContactAgent = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/property/${id}?action=contact`);
  };

  const handleViewAnalytics = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/analytics?property=${id}`);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', image);
    setImageError(true);
  };

  const displayImages = imageError 
    ? ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500'] 
    : imageArray;

  const formattedTimeAgo = formatTimeAgo(timeAgo);
  const priceValue = getPriceAsNumber(price);

  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer pt-0 pb-0 group relative",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      onClick={handlePropertyClick}
    >
      {/* Image Section with Carousel */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Carousel className="w-full h-full" opts={{ loop: true }}>
          <CarouselContent className="ml-0 h-48">
            {displayImages.map((img, index) => (
              <CarouselItem key={index} className="pl-0">
                <img 
                  src={img}
                  alt={`${title} - Image ${index + 1}`}
                  onError={handleImageError}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {hasMultipleImages && (
            <div onClick={(e) => e.preventDefault()}>
              <CarouselPrevious 
                className="left-2 bg-white/90 backdrop-blur-sm border-0 hover:bg-white h-8 w-8"
              />
              <CarouselNext 
                className="right-2 bg-white/90 backdrop-blur-sm border-0 hover:bg-white h-8 w-8"
              />
            </div>
          )}
        </Carousel>
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isFeatured && (
            <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Star className="w-3 h-3 fill-white" />
              Featured
            </span>
          )}
          {isVerified && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
          {status && status !== 'active' && (
            <span className={cn(
              "text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md",
              status === 'sold' && "bg-gray-600",
              status === 'pending' && "bg-orange-500",
              status === 'rented' && "bg-green-600"
            )}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>

        {/* Actions Overlay */}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button
            onClick={handleFavoriteToggle}
            disabled={isTogglingFavorite}
            className={cn(
              "p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-md cursor-pointer disabled:opacity-50",
              isFavorite 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-white/90 text-gray-700 hover:bg-white"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md transition-all duration-200 shadow-md cursor-pointer">
                  <MoreVertical className="w-4 h-4 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Property
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem onClick={handleToggleFeatured}>
                    <Star className={cn("w-4 h-4 mr-2", isFeatured && "fill-amber-500 text-amber-500")} />
                    {isFeatured ? 'Unfeature' : 'Feature'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Property Type Badge */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            For {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold mb-1 truncate group-hover:text-blue-600 transition-colors">
              {title}
            </h4>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <p className="truncate">{location}</p>
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-blue-600 font-bold text-lg">
              {formatPrice(price)}
            </span>
            {type === 'rent' && priceValue > 0 && (
              <span className="text-xs text-muted-foreground">/month</span>
            )}
          </div>
          {formattedTimeAgo && (
            <span className="text-xs text-muted-foreground">{formattedTimeAgo}</span>
          )}
        </div>

        {/* Property Stats - Only show if values exist */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {sqft > 0 && (
            <div className="flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              <span>{sqft.toLocaleString()} sqft</span>
            </div>
          )}
          {formatNumber(beds) && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{formatNumber(beds)}</span>
            </div>
          )}
          {formatNumber(baths) && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{formatNumber(baths)}</span>
            </div>
          )}
        </div>

        {/* Engagement Stats - Different for Agent vs User */}
        {isAgent ? (
          // Agent View: Show analytics
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{viewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>{localFavoriteCount}</span>
              </div>
            </div>
            <button
              onClick={handleViewAnalytics}
              className="text-xs h-7 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Analytics
            </button>
          </div>
        ) : (
          // Regular User View: Show interaction options
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <button
              onClick={handleContactAgent}
              className="flex-1 text-xs h-8 px-3 rounded-md border border-border hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center font-medium"
            >
              Contact Agent
            </button>
            <button
              onClick={handleShare}
              className="text-xs h-8 px-3 rounded-md border border-border hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};