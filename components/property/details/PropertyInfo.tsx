"use client"

import { useMemo, useState, useCallback } from "react";
import {
  Wifi, BedDouble, Bath, Utensils, Maximize2, MapPin, Eye, Home,
  Car, Snowflake, Dumbbell, Waves, Shield, Coffee, TreePine,
  MessageCircle, Mail, Phone, Clock, AlertCircle, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

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

function getContactInfo(property: PropertyInfoProps["property"], pd: any = null) {
  if (property.agentId && typeof property.agentId === "object") {
    const a = property.agentId as any;
    if (a._id || a.id) {
      return {
        _id: a._id ?? a.id,
        name: a.name ?? (pd?.propertyAgent || "Property Agent"),
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
        name: o.name ?? (pd?.propertyOwner || "Property Owner"),
        email: o.email,
        phoneNumber: o.phoneNumber,
        profilePicture: o.profilePicture,
        role: "owner" as const,
      };
    }
  }
  return null;
}

const MESSAGE_TEMPLATES = (title: string, pd: any) => [
  { label: pd?.askAvailability || "Ask availability", text: pd?.askAvailabilityText?.replace("{title}", title) || `Hi! I'm interested in ${title}. Is it still available?` },
  { label: pd?.scheduleViewing || "Schedule viewing", text: pd?.scheduleViewingText?.replace("{title}", title) || `Hi! I'd like to schedule a viewing for ${title}.` },
  { label: pd?.requestDetails || "Request details", text: pd?.requestDetailsText?.replace("{title}", title) || `Hi! Can you provide more details about ${title}?` },
];

// ─── Component ────────────────────────────────────────────────────────────────

const PropertyInfo = ({ property }: PropertyInfoProps) => {
  const amenities = property.amenities ?? {};
  const stAmenities = property.shortTermAmenities ?? {};

  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const { user, isAuthenticated } = useAuth();
  const { createConversation } = useChatContext();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const contact = useMemo(() => getContactInfo(property, pd), [property, pd]);
  const contactName = contact?.name ?? (pd?.propertyContact || "Property Contact");
  const contactRole = contact?.role === "agent" ? (pd?.propertyAgent || "Property Agent") : (pd?.propertyOwner || "Property Owner");

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
      title: pd?.essentials || "Essentials",
      items: [
        { icon: BedDouble, label: pd?.bedrooms?.replace("{count}", (amenities.bedrooms ?? 0).toString()) || `${amenities.bedrooms ?? 0} bedrooms`, value: amenities.bedrooms },
        { icon: Bath, label: pd?.bathrooms?.replace("{count}", (amenities.bathrooms ?? 0).toString()) || `${amenities.bathrooms ?? 0} bathrooms`, value: amenities.bathrooms },
        { icon: Maximize2, label: pd?.sqm?.replace("{area}", (property.area ?? 0).toString()) || `${property.area ?? 0} sqm`, value: property.area },
        { icon: Utensils, label: pd?.furnished || "Furnished", value: amenities.furnished },
      ].filter((i) => i.value),
    },
    ...(property.listingType === "short_term"
      ? [{
        title: pd?.hospitalityRules || "Hospitality & Rules",
        items: [
          { icon: Home, label: pd?.maxGuests?.replace("{count}", (stAmenities.maxGuests ?? 0).toString()) || `${stAmenities.maxGuests ?? 0} guests maximum`, value: stAmenities.maxGuests },
          { icon: Clock, label: pd?.checkIn?.replace("{time}", stAmenities.checkInTime ?? "14:00") || `Check-in: ${stAmenities.checkInTime ?? "14:00"}`, value: true },
          { icon: Clock, label: pd?.checkOut?.replace("{time}", stAmenities.checkOutTime ?? "11:00") || `Checkout: ${stAmenities.checkOutTime ?? "11:00"}`, value: true },
          { icon: Coffee, label: pd?.breakfastIncluded || "Breakfast included", value: stAmenities.hasBreakfast },
          { icon: Snowflake, label: pd?.heating || "Heating", value: stAmenities.hasHeating },
          { icon: ShieldCheck, label: pd?.concierge || "Concierge", value: stAmenities.conciergeService },
          { icon: Car, label: pd?.airportTransfer || "Airport transfer", value: stAmenities.airportTransfer },
          { icon: AlertCircle, label: pd?.petsAllowed || "Pets allowed", value: stAmenities.petsAllowed },
        ].filter((i) => i.value),
      }]
      : []),
    {
      title: pd?.comfortFacilities || "Comfort & Facilities",
      items: [
        { icon: Wifi, label: pd?.wifi || "Wifi", value: amenities.hasInternet || stAmenities.hasWifi },
        { icon: Snowflake, label: pd?.airConditioning || "Air conditioning", value: amenities.airConditioning },
        { icon: Coffee, label: pd?.balcony || "Balcony", value: amenities.balcony },
        { icon: TreePine, label: pd?.garden || "Garden", value: amenities.garden },
        { icon: Car, label: pd?.parking || "Parking", value: amenities.parking },
        { icon: Dumbbell, label: pd?.gym || "Gym", value: amenities.gym },
        { icon: Waves, label: pd?.swimmingPool || "Pool", value: amenities.pool },
        { icon: Shield, label: pd?.security || "Security", value: amenities.security },
      ].filter((i) => i.value),
    },
  ].filter((group) => group.items.length > 0), [amenities, stAmenities, property.area, property.listingType, pd]);

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
      toast.error(pd?.contactUnavailableError || "Contact unavailable", {
        description: pd?.contactUnavailableDesc || "The property owner hasn't completed their profile yet.",
      });
      return false;
    }
    const currentUserId = user?.id ?? user?._id;
    if (contact._id.toString() === currentUserId?.toString()) {
      toast.error(pd?.cantMessageYourself || "You can't message yourself");
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
      toast.error(pd?.enterMessage || "Please enter a message");
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
      toast.error(pd?.failedSendMessage || "Failed to send message", {
        description: error?.message ?? (pd?.pleaseTryAgain || "Please try again."),
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
        pd?.askAvailabilityText?.replace("{title}", property.title) || `Hi! I'm interested in ${property.title}. Is it still available?`
      );
      router.push("/dashboard/message");
    } catch (error: any) {
      toast.error(pd?.failedSendMessage || "Failed to send message", {
        description: error?.message ?? (pd?.pleaseTryAgain || "Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, requireContact, contact, property._id, property.title, createConversation, router]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 text-[#222222]">

      {/* ── Header Info ── */}
      <div className="space-y-4">
        <h1 className="text-[26px] md:text-[32px] font-semibold tracking-tight leading-tight">
          {property.title}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[15px] font-medium text-[#222222]">
            <MapPin className="h-4 w-4 mr-1 stroke-[2]" aria-hidden />
            <span className="underline">{fullAddress}</span>
            <span className="mx-1 text-[#DDDDDD]">•</span>
            <span className="capitalize">{property.type}</span>
            <span className="mx-1 text-[#DDDDDD]">•</span>
            <span className="capitalize">{property.listingType.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-4 text-[14px] text-[#717171]">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 stroke-[2]" aria-hidden />
              <span>{property.viewsCount.toLocaleString()} {pd?.views?.toLowerCase() || "views"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 stroke-[2]" aria-hidden />
              <span>{pd?.daysOnMarket?.replace("{days}", daysOnMarket.toString()) || `${daysOnMarket} days ago`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#DDDDDD] w-full" />

      {/* ── Description ── */}
      <div className="space-y-4">
        <h2 className="text-[22px] font-semibold tracking-tight">{pd?.aboutProperty || "About this space"}</h2>
        <p className="text-[16px] text-[#222222] leading-relaxed whitespace-pre-line">
          {property.description}
        </p>
      </div>

      <div className="h-px bg-[#DDDDDD] w-full" />

      {/* ── Features / Amenities ── */}
      {amenityGroups.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-[22px] font-semibold tracking-tight">{pd?.propertyFeatures || "What this place offers"}</h2>

          <div className="grid gap-10">
            {amenityGroups.map((group, index) => (
              <div key={index} className="space-y-6">
                <h3 className="text-[16px] font-semibold text-[#222222]">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {group.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-4">
                      <item.icon className="h-6 w-6 text-[#222222] stroke-[1.5]" aria-hidden />
                      <span className="text-[16px] text-[#222222]">
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

      <div className="h-px bg-[#DDDDDD] w-full" />

      {/* ── Host / Contact Actions ── */}
      <div className="space-y-6">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Meet your host
        </h2>

        {!isAuthenticated ? (
          // ── Unauthenticated: blurred teaser + login prompt ──
          <div className="relative rounded-2xl overflow-hidden border border-[#DDDDDD]">
            {/* Blurred ghost content */}
            <div className="p-16 flex flex-col sm:flex-row gap-4 select-none pointer-events-none blur-sm opacity-60 aria-hidden:true">
              <div className="flex-1 bg-blue-600 text-white font-semibold text-[16px] py-6 rounded-lg flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Quick message
              </div>
              <div className="flex-1 border border-blue-600 font-semibold text-[16px] py-6 rounded-lg flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                Write message
              </div>
              <div className="border border-blue-600 py-6 w-14 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/70 backdrop-blur-[2px] px-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#F7F7F7] border border-[#DDDDDD]">
                <Shield className="w-5 h-5 text-[#222222]" />
              </div>
              <div className="space-y-1">
                <p className="text-[16px] font-semibold text-[#222222]">
                  {pd?.loginToSeeContact || "Sign in to contact the host"}
                </p>
                <p className="text-[14px] text-[#717171]">
                  {pd?.loginToSeeContact || "Create a free account or log in to message, call, or schedule a viewing."}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/auth/login?redirect=/properties/${property._id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] px-8 py-5 rounded-xl transition-colors"
              >
                {pd?.loginToSeeContact || "Log in to continue"}
              </Button>
            </div>
          </div>

        ) : contact ? (
          // ── Authenticated + contact available ──
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              onClick={handleQuickMessage}
              disabled={isLoading}
              aria-busy={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] py-6 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2 stroke-[2]" />
              {isLoading ? (pd?.sending || "Sending…") : (pd?.quickMessage || "Quick message")}
            </Button>

            <Button
              onClick={handleChatClick}
              variant="outline"
              className="flex-1 border-blue-600 text-[#222222] font-semibold text-[16px] py-6 rounded-lg hover:bg-[#F7F7F7] transition-colors"
            >
              <Mail className="w-5 h-5 mr-2 stroke-[2]" />
              {pd?.writeMessage || "Write message"}
            </Button>

            {contact.phoneNumber && (
              <Button
                variant="outline"
                className="border-blue-600 text-[#222222] py-6 w-14 rounded-lg hover:bg-[#F7F7F7] transition-colors shrink-0 p-0"
                onClick={() => { window.location.href = `tel:${contact.phoneNumber}`; }}
                aria-label={`Call ${contactName}`}
              >
                <Phone className="w-5 h-5 stroke-[2]" />
              </Button>
            )}
          </div>

        ) : (
          // ── Authenticated but no contact profile set up ──
          <div className="p-4 bg-[#FFF8F8] border border-[#FFDFDF] rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#E50000] shrink-0 mt-0.5" aria-hidden />
            <p className="text-[15px] font-medium text-[#E50000] leading-relaxed">
              {pd?.contactUnavailable || "Contact information is not available for this property. The owner may need to complete their profile setup."}
            </p>
          </div>
        )}
      </div>
      {/* ── Custom Message Dialog ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-8 border-[#DDDDDD] rounded-2xl shadow-2xl">
          <DialogHeader className="mb-6 space-y-2 text-left">
            <DialogTitle className="text-[22px] font-semibold text-[#222222]">
              {pd?.sendMessageTo?.replace("{name}", contactName) || `Contact ${contactName}`}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#717171]">
              {pd?.writeMessageAbout?.replace("{title}", property.title) || `Ask a question about ${property.title}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="custom-message" className="text-[15px] font-semibold text-[#222222] block">
                {pd?.yourMessage || "Message"}
              </label>
              <Textarea
                id="custom-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi! I'm interested in ${property.title}…`}
                rows={5}
                className="resize-none text-[15px] p-4 bg-white border-[#DDDDDD] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-[#222222] focus-visible:border-blue-600 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[14px] font-semibold text-[#222222]">{pd?.quickTemplates || "Quick templates"}</p>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES(property.title, pd).map(({ label, text }) => (
                  <Button
                    key={label}
                    variant="outline"
                    className="rounded-full border-[#DDDDDD] text-[#222222] hover:border-blue-600 hover:bg-white text-[14px] font-medium h-9"
                    onClick={() => setMessage(text)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 sm:space-x-0 gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-1/2 h-12 rounded-lg font-semibold text-[15px] border-blue-600 text-[#222222] hover:bg-[#F7F7F7] transition-colors"
            >
              {pd?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              aria-busy={isLoading}
              className="w-full sm:w-1/2 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors"
            >
              {isLoading ? (pd?.sending || "Sending…") : (pd?.sendMessage || "Send message")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyInfo;