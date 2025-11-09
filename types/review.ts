export interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  userName: string;
  reviewType: 'property' | 'agent';
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
  rating: number;
  comment: string;
  verified: boolean;
  isActive: boolean;
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