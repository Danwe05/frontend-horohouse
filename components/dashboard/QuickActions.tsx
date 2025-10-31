'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Heart, 
  MessageSquare, 
  Settings, 
  User, 
  Home, 
  BarChart3, 
  Users, 
  Shield, 
  Bell,
  Calendar,
  FileText,
  Camera,
  Map,
  Filter,
  Star,
  TrendingUp,
  Database,
  AlertTriangle
} from 'lucide-react';

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  badge?: string | number;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  title, 
  description, 
  onClick, 
  variant = 'outline',
  badge,
  disabled = false
}) => (
  <Button
    variant={variant}
    className="h-auto p-4 flex flex-col items-start space-y-2 relative"
    onClick={onClick}
    disabled={disabled}
  >
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      {badge && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </div>
    <p className="text-xs text-muted-foreground text-left">{description}</p>
  </Button>
);

interface UserQuickActionsProps {
  onAction: (action: string) => void;
  stats?: {
    savedSearches: number;
    favorites: number;
    messages: number;
  };
}

export const UserQuickActions: React.FC<UserQuickActionsProps> = ({ 
  onAction, 
  stats = { savedSearches: 0, favorites: 0, messages: 0 }
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <span>Quick Actions</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionButton
          icon={<Search className="h-4 w-4" />}
          title="Search Properties"
          description="Find your dream home"
          onClick={() => onAction('search')}
          variant="default"
        />
        
        <ActionButton
          icon={<Heart className="h-4 w-4" />}
          title="My Favorites"
          description="View saved properties"
          onClick={() => onAction('favorites')}
          badge={stats.favorites > 0 ? stats.favorites : undefined}
        />
        
        <ActionButton
          icon={<Filter className="h-4 w-4" />}
          title="Saved Searches"
          description="Manage search alerts"
          onClick={() => onAction('saved-searches')}
          badge={stats.savedSearches > 0 ? stats.savedSearches : undefined}
        />
        
        <ActionButton
          icon={<MessageSquare className="h-4 w-4" />}
          title="Messages"
          description="Chat with agents"
          onClick={() => onAction('messages')}
          badge={stats.messages > 0 ? stats.messages : undefined}
        />
        
        <ActionButton
          icon={<User className="h-4 w-4" />}
          title="Edit Profile"
          description="Update your information"
          onClick={() => onAction('profile')}
        />
        
        <ActionButton
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          description="Manage preferences"
          onClick={() => onAction('notifications')}
        />
        
        <ActionButton
          icon={<Map className="h-4 w-4" />}
          title="Map Search"
          description="Browse by location"
          onClick={() => onAction('map-search')}
        />
        
        <ActionButton
          icon={<Calendar className="h-4 w-4" />}
          title="Schedule Viewing"
          description="Book property tours"
          onClick={() => onAction('schedule')}
        />
        
        <ActionButton
          icon={<FileText className="h-4 w-4" />}
          title="Documents"
          description="Manage your files"
          onClick={() => onAction('documents')}
        />
      </div>
    </CardContent>
  </Card>
);

interface AgentQuickActionsProps {
  onAction: (action: string) => void;
  stats?: {
    pendingInquiries: number;
    activeListings: number;
    scheduledViewings: number;
    messages: number;
  };
}

export const AgentQuickActions: React.FC<AgentQuickActionsProps> = ({ 
  onAction,
  stats = { pendingInquiries: 0, activeListings: 0, scheduledViewings: 0, messages: 0 }
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <span>Agent Dashboard</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionButton
          icon={<Plus className="h-4 w-4" />}
          title="Add New Listing"
          description="Create property listing"
          onClick={() => onAction('add-listing')}
          variant="default"
        />
        
        <ActionButton
          icon={<Home className="h-4 w-4" />}
          title="My Listings"
          description="Manage properties"
          onClick={() => onAction('listings')}
          badge={stats.activeListings > 0 ? stats.activeListings : undefined}
        />
        
        <ActionButton
          icon={<MessageSquare className="h-4 w-4" />}
          title="Client Inquiries"
          description="Respond to leads"
          onClick={() => onAction('inquiries')}
          badge={stats.pendingInquiries > 0 ? stats.pendingInquiries : undefined}
        />
        
        <ActionButton
          icon={<Calendar className="h-4 w-4" />}
          title="Scheduled Viewings"
          description="Manage appointments"
          onClick={() => onAction('viewings')}
          badge={stats.scheduledViewings > 0 ? stats.scheduledViewings : undefined}
        />
        
        <ActionButton
          icon={<BarChart3 className="h-4 w-4" />}
          title="Analytics"
          description="View performance metrics"
          onClick={() => onAction('analytics')}
        />
        
        <ActionButton
          icon={<Users className="h-4 w-4" />}
          title="Client Management"
          description="Manage your clients"
          onClick={() => onAction('clients')}
        />
        
        <ActionButton
          icon={<Camera className="h-4 w-4" />}
          title="Photo Upload"
          description="Add property photos"
          onClick={() => onAction('photos')}
        />
        
        <ActionButton
          icon={<Star className="h-4 w-4" />}
          title="Reviews"
          description="Manage client feedback"
          onClick={() => onAction('reviews')}
        />
        
        <ActionButton
          icon={<TrendingUp className="h-4 w-4" />}
          title="Market Reports"
          description="Generate market analysis"
          onClick={() => onAction('reports')}
        />
        
        <ActionButton
          icon={<User className="h-4 w-4" />}
          title="Profile Settings"
          description="Update agent profile"
          onClick={() => onAction('profile')}
        />
        
        <ActionButton
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          description="Manage alerts"
          onClick={() => onAction('notifications')}
        />
        
        <ActionButton
          icon={<FileText className="h-4 w-4" />}
          title="Documents"
          description="Contracts & agreements"
          onClick={() => onAction('documents')}
        />
      </div>
    </CardContent>
  </Card>
);

interface AdminQuickActionsProps {
  onAction: (action: string) => void;
  stats?: {
    pendingApprovals: number;
    reportedIssues: number;
    systemAlerts: number;
    newAgents: number;
  };
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({ 
  onAction,
  stats = { pendingApprovals: 0, reportedIssues: 0, systemAlerts: 0, newAgents: 0 }
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Shield className="h-5 w-5" />
        <span>Admin Panel</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionButton
          icon={<Users className="h-4 w-4" />}
          title="User Management"
          description="Manage platform users"
          onClick={() => onAction('users')}
          variant="default"
        />
        
        <ActionButton
          icon={<Home className="h-4 w-4" />}
          title="Property Approvals"
          description="Review new listings"
          onClick={() => onAction('approvals')}
          badge={stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined}
        />
        
        <ActionButton
          icon={<Shield className="h-4 w-4" />}
          title="Agent Verification"
          description="Verify new agents"
          onClick={() => onAction('agent-verification')}
          badge={stats.newAgents > 0 ? stats.newAgents : undefined}
        />
        
        <ActionButton
          icon={<BarChart3 className="h-4 w-4" />}
          title="Platform Analytics"
          description="View system metrics"
          onClick={() => onAction('analytics')}
        />
        
        <ActionButton
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Reported Issues"
          description="Handle user reports"
          onClick={() => onAction('reports')}
          badge={stats.reportedIssues > 0 ? stats.reportedIssues : undefined}
        />
        
        <ActionButton
          icon={<Database className="h-4 w-4" />}
          title="System Health"
          description="Monitor system status"
          onClick={() => onAction('system')}
          badge={stats.systemAlerts > 0 ? stats.systemAlerts : undefined}
        />
        
        <ActionButton
          icon={<Settings className="h-4 w-4" />}
          title="Platform Settings"
          description="Configure system"
          onClick={() => onAction('settings')}
        />
        
        <ActionButton
          icon={<FileText className="h-4 w-4" />}
          title="Content Management"
          description="Manage site content"
          onClick={() => onAction('content')}
        />
        
        <ActionButton
          icon={<TrendingUp className="h-4 w-4" />}
          title="Revenue Reports"
          description="Financial analytics"
          onClick={() => onAction('revenue')}
        />
        
        <ActionButton
          icon={<Bell className="h-4 w-4" />}
          title="System Notifications"
          description="Broadcast messages"
          onClick={() => onAction('notifications')}
        />
        
        <ActionButton
          icon={<User className="h-4 w-4" />}
          title="Admin Profile"
          description="Update admin settings"
          onClick={() => onAction('profile')}
        />
        
        <ActionButton
          icon={<MessageSquare className="h-4 w-4" />}
          title="Support Tickets"
          description="Handle user support"
          onClick={() => onAction('support')}
        />
      </div>
    </CardContent>
  </Card>
);