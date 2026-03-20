import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'user' | 'agent' | 'landlord' | 'admin' | 'student';

export interface RolePermissions {
  // Property Management
  canManageProperties: boolean;
  canViewAllProperties: boolean;
  canCreateProperties: boolean;
  canDeleteProperties: boolean;
  canFeatureProperties: boolean;
  canVerifyProperties: boolean;

  // User Management
  canManageUsers: boolean;
  canViewAllUsers: boolean;
  canPromoteUsers: boolean;
  canDeleteUsers: boolean;

  // Analytics & Reports
  canViewAnalytics: boolean;
  canViewAllAnalytics: boolean;
  canExportData: boolean;

  // System & Settings
  canEditSettings: boolean;
  canManageRoles: boolean;
  canAccessAdminPanel: boolean;

  // Content Management
  canModerateContent: boolean;
  canManageReviews: boolean;

  // Financial
  canViewRevenue: boolean;
  canManagePayments: boolean;

  // Student features
  canAccessStudentHousing: boolean;
  canAccessRoommatePool: boolean;
}

export interface RoleCapabilities {
  maxProperties: number | null;
  maxImagesPerProperty: number;
  canAccessPremiumFeatures: boolean;
  prioritySupport: boolean;
  apiAccessLevel: 'none' | 'basic' | 'full';
}

export interface UseUserRoleReturn {
  // Basic role info
  role: UserRole;
  isUser: boolean;
  isAgent: boolean;
  isLandlord: boolean;
  isAdmin: boolean;
  isAgentOnly: boolean;
  isLandlordOnly: boolean;
  isStudent: boolean;

  // Permissions
  permissions: RolePermissions;

  // Capabilities
  capabilities: RoleCapabilities;

  // Helper methods
  hasPermission: (permission: keyof RolePermissions) => boolean;
  canAccess: (resource: string) => boolean;
  getRoleName: () => string;
  getRoleBadge: () => { text: string; color: string };
}

// Role configuration constants
const ROLE_CONFIGS: Record<UserRole, RoleCapabilities> = {
  user: {
    maxProperties: 0,
    maxImagesPerProperty: 5,
    canAccessPremiumFeatures: false,
    prioritySupport: false,
    apiAccessLevel: 'none',
  },
  student: {
    maxProperties: 0,
    maxImagesPerProperty: 5,
    canAccessPremiumFeatures: false,
    prioritySupport: false,
    apiAccessLevel: 'none',
  },
  agent: {
    maxProperties: 50,
    maxImagesPerProperty: 20,
    canAccessPremiumFeatures: true,
    prioritySupport: true,
    apiAccessLevel: 'basic',
  },
  landlord: {
    maxProperties: 20,
    maxImagesPerProperty: 15,
    canAccessPremiumFeatures: true,
    prioritySupport: false,
    apiAccessLevel: 'basic',
  },
  admin: {
    maxProperties: null,
    maxImagesPerProperty: 50,
    canAccessPremiumFeatures: true,
    prioritySupport: true,
    apiAccessLevel: 'full',
  },
};

// Resource access mapping
const RESOURCE_ACCESS_MAP: Record<string, UserRole[]> = {
  'dashboard':          ['user', 'agent', 'landlord', 'admin', 'student'],
  'properties':         ['user', 'agent', 'landlord', 'admin', 'student'],
  'properties:create':  ['agent', 'landlord', 'admin'],
  'properties:manage':  ['agent', 'landlord', 'admin'],
  'properties:all':     ['admin'],
  'analytics':          ['agent', 'landlord', 'admin'],
  'analytics:all':      ['admin'],
  'users':              ['admin'],
  'settings':           ['admin'],
  'admin-panel':        ['admin'],
  'reports':            ['agent', 'landlord', 'admin'],
  'reviews':            ['user', 'agent', 'landlord', 'admin', 'student'],
  'reviews:moderate':   ['admin'],
  'favorites':          ['user', 'agent', 'landlord', 'admin', 'student'],
  'inquiries':          ['agent', 'landlord', 'admin'],
  'messages':           ['user', 'agent', 'landlord', 'admin', 'student'],
  'tenants':            ['landlord', 'admin'],
  // Student-specific
  'student-housing':    ['student', 'admin'],
  'roommate-pool':      ['student', 'admin'],
};

export const useUserRole = (): UseUserRoleReturn => {
  const { user, isAuthenticated } = useAuth();

  const role = (user?.role as UserRole) || 'user';

  const computed = useMemo(() => {
    const isStudent    = role === 'student';
    const isUser       = role === 'user';
    const isAgentOnly  = role === 'agent';
    const isLandlordOnly = role === 'landlord';
    const isLandlord   = role === 'landlord';
    const isAdmin      = role === 'admin';
    // isAgent is true for any role that can manage properties
    const isAgent      = role === 'agent' || role === 'landlord' || role === 'admin';

    const permissions: RolePermissions = {
      // Property Management
      canManageProperties:  isAgent,
      canViewAllProperties: isAdmin,
      canCreateProperties:  isAgent,
      canDeleteProperties:  isAgent,
      canFeatureProperties: isAdmin,
      canVerifyProperties:  isAdmin,

      // User Management
      canManageUsers:  isAdmin,
      canViewAllUsers: isAdmin,
      canPromoteUsers: isAdmin,
      canDeleteUsers:  isAdmin,

      // Analytics & Reports
      canViewAnalytics:    isAgent,
      canViewAllAnalytics: isAdmin,
      canExportData:       isAgent,

      // System & Settings
      canEditSettings:      isAdmin,
      canManageRoles:       isAdmin,
      canAccessAdminPanel:  isAdmin,

      // Content Management
      canModerateContent: isAdmin,
      canManageReviews:   isAdmin,

      // Financial
      canViewRevenue:    isLandlord || isAdmin,
      canManagePayments: isAdmin,

      // Student features
      canAccessStudentHousing: isStudent || isAdmin,
      canAccessRoommatePool:   isStudent || isAdmin,
    };

    const capabilities: RoleCapabilities = ROLE_CONFIGS[role] ?? ROLE_CONFIGS.user;

    const hasPermission = (permission: keyof RolePermissions): boolean =>
      permissions[permission];

    const canAccess = (resource: string): boolean => {
      const allowedRoles = RESOURCE_ACCESS_MAP[resource];
      if (!allowedRoles) {
        console.warn(`Resource '${resource}' not found in access map`);
        return false;
      }
      return allowedRoles.includes(role);
    };

    const getRoleName = (): string => {
      const names: Record<UserRole, string> = {
        user:     'User',
        student:  'Student',
        agent:    'Agent',
        landlord: 'Landlord',
        admin:    'Administrator',
      };
      return names[role];
    };

    const getRoleBadge = (): { text: string; color: string } => {
      const badges: Record<UserRole, { text: string; color: string }> = {
        user:     { text: 'User',      color: 'bg-gray-100 text-gray-700'     },
        student:  { text: 'Student',   color: 'bg-blue-100 text-blue-700'     },
        agent:    { text: 'Agent',     color: 'bg-blue-100 text-blue-700'     },
        landlord: { text: 'Landlord',  color: 'bg-emerald-100 text-emerald-700' },
        admin:    { text: 'Admin',     color: 'bg-purple-100 text-purple-700' },
      };
      return badges[role];
    };

    return {
      role,
      isUser,
      isAgent,
      isLandlord,
      isAdmin,
      isAgentOnly,
      isLandlordOnly,
      isStudent,
      permissions,
      capabilities,
      hasPermission,
      canAccess,
      getRoleName,
      getRoleBadge,
    };
  }, [role, isAuthenticated]);

  return computed;
};

// Additional utility hook for role-based rendering
export const useRoleBasedContent = () => {
  const roleInfo = useUserRole();

  return {
    ...roleInfo,
    renderForRole: (content: Partial<Record<UserRole, React.ReactNode>>) => {
      return content[roleInfo.role] || content.user || null;
    },
    renderIfPermission: (
      permission: keyof RolePermissions,
      content: React.ReactNode,
      fallback?: React.ReactNode,
    ) => {
      return roleInfo.hasPermission(permission) ? content : (fallback || null);
    },
    renderIfAccess: (
      resource: string,
      content: React.ReactNode,
      fallback?: React.ReactNode,
    ) => {
      return roleInfo.canAccess(resource) ? content : (fallback || null);
    },
  };
};