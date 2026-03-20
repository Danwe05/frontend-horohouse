"use client"

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Wifi, BedDouble, Bath, Utensils, Maximize2, MapPin, Eye, Home,
  Car, Snowflake, Dumbbell, Waves, Shield, Coffee, TreePine,
  MessageCircle, Mail, Phone, Clock, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyInfoProps {
  property: {
    agentId: any;
    ownerId: any;
    _id: any;
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
    shortTermAmenities?: {
      maxGuests?: number;
      checkInTime?: string;
      checkOutTime?: string;
      hasWifi?: boolean;
      hasBreakfast?: boolean;
      hasTv?: boolean;
      hasKitchen?: boolean;
      hasWasher?: boolean;
      hasHeating?: boolean;
      petsAllowed?: boolean;
      smokingAllowed?: boolean;
      partiesAllowed?: boolean;
      wheelchairAccessible?: boolean;
      airportTransfer?: boolean;
      conciergeService?: boolean;
      dailyHousekeeping?: boolean;
    };
    cancellationPolicy?: string;
    minNights?: number;
    maxNights?: number;
    area?: number;
    viewsCount: number;
    createdAt: string;
    keywords: string[];
    virtualTourUrl?: string;
    videoUrl?: string;
    priceHistory?: Array<{ date: string; price: number; event?: string }>;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContactInfo(property: PropertyInfoProps["property"]) {
  if (property.agentId && typeof property.agentId === "object") {
    const a = property.agentId as any;
    if (a._id || a.id) {
      return {
        _id: a._id ?? a.id,
        name: a.name ?? "Property Agent",
        email: a.email,
        phoneNumber: a.phoneNumber,
        profilePicture: a.profilePicture,
        role: "agent" as const,
      };
    }
  }
  if (property.ownerId && typeof property.ownerId === "object") {
    const o = property.ownerId as any;
    if (o._id || o.id) {
      return {
        _id: o._id ?? o.id,
        name: o.name ?? "Property Owner",
        email: o.email,
        phoneNumber: o.phoneNumber,
        profilePicture: o.profilePicture,
        role: "owner" as const,
      };
    }
  }
  return null;
}

const MESSAGE_TEMPLATES = (title: string) => [
  { label: "Ask Availability", text: `Hi! I'm interested in ${title}. Is it still available?` },
  { label: "Schedule Viewing", text: `Hi! I'd like to schedule a viewing for ${title}.` },
  { label: "Request Details", text: `Hi! Can you provide more details about ${title}?` },
];

// ─── Component ────────────────────────────────────────────────────────────────

const PropertyInfo = ({ property }: PropertyInfoProps) => {
  const amenities = property.amenities ?? {};
  const stAmenities = property.shortTermAmenities ?? {};

  const { user, isAuthenticated } = useAuth();
  const { createConversation } = useChatContext();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const contact = useMemo(() => getContactInfo(property), [property]);
  const contactName = contact?.name ?? "Property Contact";
  const contactRole = contact?.role === "agent" ? "Property Agent" : "Property Owner";

  const fullAddress = `${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""}, ${property.city}${property.country ? `, ${property.country}` : ""}`;

  const daysOnMarket = useMemo(() => {
    const diffMs = Date.now() - new Date(property.createdAt).getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [property.createdAt]);

  const listedDate = useMemo(() =>
    new Date(property.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    }),
    [property.createdAt]
  );

  // Amenity groups
  const amenityGroups = useMemo(() => [
    {
      title: "Essentials",
      items: [
        { icon: BedDouble, label: `${amenities.bedrooms ?? 0} Bedrooms`, value: amenities.bedrooms },
        { icon: Bath, label: `${amenities.bathrooms ?? 0} Bathrooms`, value: amenities.bathrooms },
        { icon: Maximize2, label: `${property.area ?? 0} sqm`, value: property.area },
        { icon: Utensils, label: "Furnished", value: amenities.furnished },
      ].filter((i) => i.value),
    },
    ...(property.listingType === "short_term"
      ? [{
        title: "Hospitality & Rules",
        items: [
          { icon: Home, label: `${stAmenities.maxGuests ?? 0} Max Guests`, value: stAmenities.maxGuests },
          { icon: Clock, label: `Check-in: ${stAmenities.checkInTime ?? "14:00"}`, value: true },
          { icon: Clock, label: `Check-out: ${stAmenities.checkOutTime ?? "11:00"}`, value: true },
          { icon: Coffee, label: "Breakfast Included", value: stAmenities.hasBreakfast },
          { icon: Snowflake, label: "Heating", value: stAmenities.hasHeating },
          { icon: Shield, label: "Concierge", value: stAmenities.conciergeService },
          { icon: Car, label: "Airport Transfer", value: stAmenities.airportTransfer },
          { icon: AlertCircle, label: "Pets Allowed", value: stAmenities.petsAllowed },
        ].filter((i) => i.value),
      }]
      : []),
    {
      title: "Comfort & Facilities",
      items: [
        { icon: Wifi, label: "WiFi", value: amenities.hasInternet || stAmenities.hasWifi },
        { icon: Snowflake, label: "Air Conditioning", value: amenities.airConditioning },
        { icon: Coffee, label: "Balcony", value: amenities.balcony },
        { icon: TreePine, label: "Garden", value: amenities.garden },
        { icon: Car, label: "Parking", value: amenities.parking },
        { icon: Dumbbell, label: "Gym", value: amenities.gym },
        { icon: Waves, label: "Swimming Pool", value: amenities.pool },
        { icon: Shield, label: "Security", value: amenities.security },
      ].filter((i) => i.value),
    },
  ].filter((group) => group.items.length > 0), [amenities, stAmenities, property.area, property.listingType]);

  // ── Auth guard helper ────────────────────────────────────────────────────
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/properties/${property._id}`);
      return false;
    }
    return true;
  }, [isAuthenticated, router, property._id]);

  const requireContact = useCallback(() => {
    if (!contact || !contact._id) {
      toast.error("Contact unavailable", {
        description: "The property owner hasn't completed their profile yet.",
      });
      return false;
    }
    const currentUserId = user?.id ?? user?._id;
    if (contact._id.toString() === currentUserId?.toString()) {
      toast.error("You can't message yourself");
      return false;
    }
    return true;
  }, [contact, user]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChatClick = useCallback(() => {
    if (!requireAuth() || !requireContact()) return;
    setIsOpen(true);
  }, [requireAuth, requireContact]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!contact?._id) return;

    setIsLoading(true);
    try {
      await createConversation(
        contact._id.toString(),
        property._id.toString(),
        message.trim()
      );
      setIsOpen(false);
      setMessage("");
      router.push("/dashboard/message");
    } catch (error: any) {
      toast.error("Failed to send message", {
        description: error?.message ?? "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [message, contact, property._id, createConversation, router]);

  const handleQuickMessage = useCallback(async () => {
    if (!requireAuth() || !requireContact()) return;
    if (!contact?._id) return;

    setIsLoading(true);
    try {
      await createConversation(
        contact._id.toString(),
        property._id.toString(),
        `Hi! I'm interested in ${property.title}. Is it still available?`
      );
      router.push("/dashboard/message");
    } catch (error: any) {
      toast.error("Failed to send message", {
        description: error?.message ?? "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, requireContact, contact, property._id, property.title, createConversation, router]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 shadow-none">
      {/* Header */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-1.5 capitalize text-sm font-bold rounded-lg border-none">
            {property.type}
          </Badge>
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3.5 py-1.5 capitalize text-sm font-bold border-none rounded-lg">
            {property.listingType === "short_term" ? "Short Term" : `For ${property.listingType}`}
          </Badge>
          {property.cancellationPolicy && (
            <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-3.5 py-1.5 text-sm font-bold border-none rounded-lg">
              {property.cancellationPolicy}
            </Badge>
          )}
          {amenities.furnished && (
            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3.5 py-1.5 text-sm font-bold border-none rounded-lg">
              Fully Furnished
            </Badge>
          )}

          <div className="flex items-center gap-5 ml-auto text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400" aria-hidden />
              <span>{property.viewsCount.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" aria-hidden />
              <span>{daysOnMarket}d on market</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {property.title}
          </h1>
          <div className="flex items-start gap-2.5">
            <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden />
            <div>
              <p className="text-slate-700 font-semibold text-lg">{fullAddress}</p>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Listed on {listedDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* Description & Features */}
      <div className="space-y-10">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">About this property</h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
            {property.description}
          </p>
        </div>

        {amenityGroups.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Property Features</h3>
            <div className="grid gap-8">
              {amenityGroups.map((group, index) => (
                <div key={index} className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
                    {group.title}
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border-2 border-transparent transition-colors group"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-blue-600 transition-transform">
                          <item.icon className="h-6 w-6" aria-hidden />
                        </div>
                        <span className="font-bold text-slate-700 text-sm leading-tight">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* Contact actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          onClick={handleQuickMessage}
          disabled={isLoading || !contact}
          aria-busy={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shfadow-sm"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          {isLoading ? "Sending…" : "Quick Message"}
        </Button>

        <Button
          onClick={handleChatClick}
          disabled={!contact}
          variant="outline"
          className="flex-1 border-slate-200 text-slate-700 font-bold h-12 rounded-xl hover:bg-slate-50"
        >
          <Mail className="w-5 h-5 mr-2" />
          Write Message
        </Button>

        {contact?.phoneNumber && (
          <Button
            variant="outline"
            className="border-slate-200 text-slate-700 font-bold h-12 w-12 rounded-xl hover:bg-slate-50 shrink-0 p-0"
            onClick={() => { window.location.href = `tel:${contact.phoneNumber}`; }}
            aria-label={`Call ${contactName}`}
          >
            <Phone className="w-5 h-5" />
          </Button>
        )}
      </div>

      {!contact && (
        <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm font-medium text-amber-800 leading-relaxed">
            Contact information is not available for this property.
            The owner may need to complete their profile setup.
          </p>
        </div>
      )}

      {/* Custom message dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to {contactName}</DialogTitle>
            <DialogDescription>
              Write a message about {property.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{contactName}</p>
                <p className="text-sm text-muted-foreground">{contactRole}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="custom-message" className="text-sm font-medium block">
                Your Message
              </label>
              <Textarea
                id="custom-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi! I'm interested in ${property.title}…`}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Quick templates */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Templates:</p>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES(property.title).map(({ label, text }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(text)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                aria-busy={isLoading}
                className="flex-1 bg-primary"
              >
                {isLoading ? "Sending…" : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyInfo;