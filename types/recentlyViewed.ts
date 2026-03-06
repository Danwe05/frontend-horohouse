export interface RecentlyViewedProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  viewedAt: Date;
}