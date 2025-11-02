export interface Property {
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  surface: string;
  image?: string;
   unit?: string; 
}

export interface PropertyFormData {
  street: string;
  unit?: string;
  city: string;
  zip: string;
  surface: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  image?: string;
}
