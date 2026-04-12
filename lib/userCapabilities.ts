import { User, StudentVerificationStatus } from '@/types/user';

export interface UserCapabilities {
  // Listing management
  canManageListings: boolean;
  // Agent-only sales pipeline (leads, appointments, referrals)
  hasSalesPipeline: boolean;
  // Landlord-only tenant/lease management
  hasTenantManagement: boolean;
  // Earnings & billing section
  hasEarnings: boolean;
  // Analytics & pricing tools
  hasAnalytics: boolean;
  // Campus Hub visibility (student role OR studentProfile exists)
  hasStudentHub: boolean;
  // Roommate pool — gated behind verification
  hasRoommatePool: boolean;
  // Student ID verification status
  studentVerificationStatus: StudentVerificationStatus | null;
  // Platform admin
  isAdmin: boolean;
  // Guest — booking-only flow, no full dashboard
  isGuestOnly: boolean;
}

export function getUserCapabilities(
  user: User,
  isStudent: boolean,
): UserCapabilities {
  const role = user.role;
  const sp = user.studentProfile;

  const hasStudentHub =
    role === 'student' ||
    isStudent ||
    (sp !== null && sp !== undefined);

  const studentVerificationStatus = sp?.verificationStatus ?? null;
  const hasRoommatePool = hasStudentHub && studentVerificationStatus === 'verified';

  return {
    canManageListings : ['agent', 'landlord', 'admin'].includes(role),
    hasSalesPipeline  : ['agent', 'admin'].includes(role),
    hasTenantManagement: ['landlord', 'admin'].includes(role),
    hasEarnings       : ['agent', 'landlord', 'admin'].includes(role),
    hasAnalytics      : ['agent', 'landlord', 'admin'].includes(role),
    hasStudentHub,
    hasRoommatePool,
    studentVerificationStatus,
    isAdmin           : role === 'admin',
    isGuestOnly       : role === 'guest',
  };
}