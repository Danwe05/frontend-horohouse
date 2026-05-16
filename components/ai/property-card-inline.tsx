"use client"

import { MapPin, Maximize, BedDouble, Phone, ExternalLink, ChevronLeft, ChevronRight, Home, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Property } from "@/lib/propertyApi"
import { useLanguage } from "@/contexts/LanguageContext"
import { getLocalizedHref } from "@/lib/i18n"
import { motion, AnimatePresence } from "framer-motion"

interface PropertyCardInlineProps {
  properties: Property[]
}

export function PropertyCardInline({ properties }: PropertyCardInlineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US").format(price)
  }

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
  }, [properties])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 350
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setTimeout(checkScroll, 300)
    }
  }

  if (!properties || properties.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {/* Results Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 px-2 rounded-full bg-blue-50 flex items-center gap-1.5 border border-blue-100">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              {properties.length} Recommendation{properties.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {/* Navigation Arrows */}
        {properties.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full border-[#DDDDDD] bg-white text-[#222222] shadow-sm transition-all hover:bg-[#F7F7F7] hover:border-[#222222]", 
                !canScrollLeft && "opacity-30 cursor-not-allowed"
              )}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full border-[#DDDDDD] bg-white text-[#222222] shadow-sm transition-all hover:bg-[#F7F7F7] hover:border-[#222222]",
                !canScrollRight && "opacity-30 cursor-not-allowed",
              )}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Cards Container */}
      <div className="relative group/container">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-hide no-scrollbar snap-x snap-mandatory"
        >
          {properties.map((property, index) => (
            <PropertyMiniCard key={property.id || index} property={property} formatPrice={formatPrice} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PropertyMiniCard({
  property,
  formatPrice,
  index,
}: {
  property: Property
  formatPrice: (price: number) => string
  index: number
}) {
  const { language } = useLanguage()
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0].url || property.images[0]
    : "/placeholder.svg"

  const location = [property.neighborhood, property.city]
    .filter(Boolean)
    .join(", ") || property.address || "Location unspecified"

  const bedrooms = property.amenities?.bedrooms
  const surface = property.area
  const agentPhone = property.contactPhone || property.agentId?.phoneNumber

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          "group min-w-[300px] max-w-[300px] flex-shrink-0 overflow-hidden border-[#EBEBEB] bg-white transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 snap-start rounded-3xl",
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />

          {/* Price Badge */}
          <div className="absolute left-4 top-4 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <span className="text-[14px] font-bold text-[#222222]">
              {formatPrice(property.price)} <span className="text-[10px] uppercase ml-0.5">{property.currency || "FCFA"}</span>
            </span>
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 text-white/80 text-[12px] font-medium mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <h4 className="font-bold text-white text-[16px] line-clamp-1 leading-tight">{property.title}</h4>
          </div>
        </div>

        {/* Details */}
        <div className="p-5">
          {/* Property Features */}
          <div className="flex items-center gap-6 text-[13px] font-semibold text-[#717171] mb-5">
            {surface && (
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-[#222222]" />
                <span>{surface} m²</span>
              </div>
            )}
            {bedrooms && (
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-[#222222]" />
                <span>{bedrooms} Beds</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="default"
              className="flex-1 h-11 rounded-xl text-[14px] border-[#DDDDDD] font-bold text-[#222222] hover:bg-[#F7F7F7] hover:border-[#222222] transition-all"
              asChild
            >
              <Link href={getLocalizedHref(`/properties/${property.id}`, language)}>
                View Details
              </Link>
            </Button>
            {agentPhone && (
              <Button
                size="icon"
                className="h-11 w-11 rounded-xl bg-[#222222] text-white hover:scale-105 transition-transform"
                asChild
              >
                <a href={`tel:${agentPhone}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

 