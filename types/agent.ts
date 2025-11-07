export type Agent = {
  profilePicture: any;
  firstName: any;
  lastName: any;
  title: string;
  propertiesCount: number;
  experienceYears: number;
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};