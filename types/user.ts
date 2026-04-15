export type UserRole =
  | 'admin'
  | 'agent'
  | 'landlord'
  | 'host'
  | 'registered_user'
  | 'guest'
  | 'student';

export type StudentVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface StudentProfile {
  universityName: string;
  campusCity: string;
  campusName: string;
  faculty?: string;
  studyLevel?: string;
  enrollmentYear?: number;
  studentIdUrl?: string;
  verificationStatus: StudentVerificationStatus;
  verificationRejectionReason?: string;
  roommateProfileId?: string;
  isAmbassador?: boolean;
  ambassadorCode?: string;
  ambassadorEarnings?: number;
  campusLatitude?: number;
  campusLongitude?: number;
}

// This is the shape the API actually returns (JWT payload + /users/me)
export interface User {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: UserRole;
  profilePicture?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingCompleted?: boolean;
  studentProfile?: StudentProfile | null;
}