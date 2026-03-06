export type ReviewType = 'property' | 'agent' | 'stay' | 'guest';
export type ReviewerRole = 'guest' | 'host';

export interface StaySubRatings {
  cleanliness?: number;
  accuracy?: number;
  checkIn?: number;
  communication?: number;
  location?: number;
  value?: number;
}

export interface GuestSubRatings {
  communication?: number;
  cleanliness?: number;
  rules?: number;
}

export interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  userName: string;
  reviewType: ReviewType;
  reviewerRole: ReviewerRole;
  propertyId?: {
    _id: string;
    title: string;
    images?: Array<{ url: string }>;
    address?: string;
  };
  agentId?: {
    _id: string;
    name: string;
    profilePicture?: string;
    agency?: string;
  };
  /** For stay / guest reviews — links to the booking */
  bookingId?: string;
  /** For guest reviews (host → guest) — the guest being reviewed */
  reviewedUserId?: string;
  rating: number;
  comment?: string;
  staySubRatings?: StaySubRatings;
  guestSubRatings?: GuestSubRatings;
  verified: boolean;
  bookingVerified: boolean;
  isPublished: boolean;
  isActive: boolean;
  publishDeadline?: string;
  respondedBy?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  response?: string;
  respondedAt?: string;
  images?: string[];
  helpfulCount: number;
  helpfulBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number;
}