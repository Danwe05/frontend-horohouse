export interface Agent {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  agency?: string;
  bio?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  city?: string;
  country?: string;
  totalProperties: number;
  activeProperties: number;
  propertiesListed: number;
  propertiesSold: number;
  licenseNumber?: string;
  yearsOfExperience: number;
  specialties: string[];
  languages: string[];
  serviceAreas: string[];
  createdAt: Date;
}

export interface AgentStats {
  rating: number;
  reviewCount: number;
  propertiesSold: number;
  experience: number;
  successRate: number;
  awards: number;
}

export interface AgentProperty {
  id: string;
  images: string[];
  price: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  status: string;
  propertyType: string;
  soldDate?: string;
  listingType: string;
  latitude?: number;
  longitude?: number;
}

export interface AgentPropertiesResponse {
  properties: AgentProperty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgentReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  userId?: string;
}

export interface AgentReviewsResponse {
  reviews: AgentReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
}