import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bed, Bath, Square, CheckCircle } from 'lucide-react';
import type { RelatedListing } from '@/types/insights';
import { formatPrice } from '@/lib/insights-api';

interface RelatedListingsSectionProps {
  listings: RelatedListing[];
  title?: string;
}

function ListingCard({ listing }: { listing: RelatedListing }) {
  const thumb = listing.images?.[0]?.url;
  const price = formatPrice(listing.price);

  return (
    <Link
      href={`/properties/${listing._id}`}
      className="group flex flex-col rounded-[18px] overflow-hidden border border-[#EBEBEB] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow bg-white"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[#F7F7F7] overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-400 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
        )}

        {listing.isVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#008A05]">
            <CheckCircle className="w-3 h-3" /> Verified
          </div>
        )}

        {/* Listing type badge */}
        {listing.listingType && (
          <div className="absolute top-3 right-3 bg-[#222222]/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize">
            {listing.listingType.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-lg font-semibold text-[#222222] mb-0.5">{price}</p>
        <p className="text-[13px] text-[#717171] line-clamp-1 mb-3">
          {listing.address || listing.city}
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-[12px] text-[#717171]">
          {listing.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="w-3 h-3" /> {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="w-3 h-3" /> {listing.bathrooms}
            </span>
          )}
          {listing.area !== undefined && (
            <span className="flex items-center gap-1">
              <Square className="w-3 h-3" /> {listing.area} m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RelatedListingsSection({
  listings,
  title = 'Properties featured in this article',
}: RelatedListingsSectionProps) {
  if (!listings?.length) return null;

  return (
    <section className="mt-12 pt-10 border-t border-[#EBEBEB]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold tracking-tight text-[#222222]">{title}</h3>
        <Link
          href="/properties"
          className="flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:underline"
        >
          Browse all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {listings.slice(0, 4).map((listing) => (
          <ListingCard key={listing._id} listing={listing} />
        ))}
      </div>
    </section>
  );
}