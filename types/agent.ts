
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
    totalProperties: number;
    activeProperties: number;
    propertiesListed: number;
    propertiesSold: number;
    createdAt: Date;
  }
  
  export interface AgentsResponse {
    agents: Agent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }