"use client"

import { MapPin, Maximize, BedDouble, Phone, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Property } from "@/lib/propertyApi"

interface PropertyCardInlineProps {
  properties: Property[]
}

export function PropertyCardInline({ properties }: PropertyCardInlineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price)
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
      const scrollAmount = 320
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
    <div className="mt-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Results Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            {properties.length} propriété{properties.length > 1 ? "s" : ""} trouvée{properties.length > 1 ? "s" : ""}
          </span>
        </div>
        {/* Navigation Arrows */}
        {properties.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 rounded-full transition-opacity", !canScrollLeft && "opacity-30 cursor-not-allowed")}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full transition-opacity",
                !canScrollRight && "opacity-30 cursor-not-allowed",
              )}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Cards Container */}
      <div className="relative">
        {/* Left Fade */}
        {properties.length > 1 && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none transition-opacity",
              !canScrollLeft && "opacity-0",
            )}
          />
        )}
        {/* Right Fade */}
        {properties.length > 1 && (
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none transition-opacity",
              !canScrollRight && "opacity-0",
            )}
          />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {properties.map((property, index) => (
            <PropertyMiniCard key={property.id} property={property} formatPrice={formatPrice} index={index} />
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
  // Get the first image or use placeholder
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0].url || property.images[0]
    : "/placeholder.svg"

  // Build location string from available fields
  const location = [property.neighborhood, property.city, property.state]
    .filter(Boolean)
    .join(", ") || property.address || "Location non spécifiée"

  // Get bedrooms from amenities
  const bedrooms = property.amenities?.bedrooms

  // Get surface area
  const surface = property.area

  // Get contact phone
  const agentPhone = property.contactPhone || property.agentId?.phoneNumber

  return (
    <Card
      className={cn(
        "group min-w-[280px] max-w-[280px] flex-shrink-0 overflow-hidden border-border bg-background transition-all duration-300 hover:-xl hover:-translate-y-1 snap-start",
        "animate-in fade-in-0 slide-in-from-right-4 pt-0",
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Price Badge */}
        <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground font-bold -lg">
          {formatPrice(property.price)} {property.currency || "FCFA"}
        </Badge>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="font-semibold text-white text-sm line-clamp-1 mb-1 drop--lg">{property.title}</h4>
          <div className="flex items-center gap-1.5 text-white/90 text-xs">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-3">
        {/* Property Features */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          {surface && (
            <div className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5 text-accent" />
              <span>{surface} m²</span>
            </div>
          )}
          {bedrooms && (
            <div className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-accent" />
              <span>
                {bedrooms} chambre{bedrooms > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {agentPhone && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
              asChild
            >
              <a href={`tel:${agentPhone}`}>
                <Phone className="mr-1 h-3 w-3" />
                Appeler
              </a>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href={`/properties/${property.id}`}>
              <ExternalLink className="mr-1 h-3 w-3" />
              Détails
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}