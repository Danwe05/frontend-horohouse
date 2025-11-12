"use client";

import { Search, Bell, MessageSquare, Settings, LogOut, User, ChevronDown, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { authService } from "@/lib/auth";
import NotificationDropdown from "../notifications/NotificationDropdown";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: {
    propertyId?: string;
    inquiryId?: string;
    senderId?: string;
    [key: string]: any;
  };
}

export const NavDash = () => {
  const { user, logout, isLoading } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


  const handleAddProperty = () => {
    router.push("/dashboard/propertyForm");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setShowProfileDropdown(false);
    }
  };

  const handleViewProfile = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/settings?tab=profile');
  };

  const handleViewProperties = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/property');
  };

  const handleViewMessages = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/message');
  };

  const handleViewSettings = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/settings');
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get user display info
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || user?.phoneNumber || '';
  const userRole = user?.role || 'user';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  return (
    <header className="h-16 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-50 supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <SidebarTrigger />
        {/* <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search properties, tenants, or documents..."
            className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-all duration-200"
          />
        </div> */}
      </div>

      <div className="flex items-center gap-3">
        {/* Add Property Button - Only show for agents/admins */}
        {(userRole === 'agent' || userRole === 'admin') && (
          <Button 
            onClick={handleAddProperty}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
         <NotificationDropdown/>
        </div>

        {/* Profile Dropdown */}
        {!isLoading && user && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 transition-all duration-200 rounded-lg",
                showProfileDropdown && "bg-muted/50"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden border border-border/50">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-foreground">{displayName}</div>
                <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200 hidden sm:block",
                showProfileDropdown && "rotate-180"
              )} />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-popover backdrop-blur-lg border border-border rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* Profile Header */}
                <div className="p-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden border border-border/50 relative">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                      {(user.emailVerified || user.phoneVerified) && (
                        <div className="absolute -bottom-3 -right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-popover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{displayName}</div>
                      <div className="text-sm text-muted-foreground truncate">{displayEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Dropdown Items */}
                <div className="space-y-1 p-1">
                  <Button
                    variant="ghost"
                    onClick={handleViewProfile}
                    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Profile</span>
                  </Button>

                  {(userRole === 'agent' || userRole === 'admin') && (
                    <Button
                      variant="ghost"
                      onClick={handleViewProperties}
                      className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                    >
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">My Properties</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleViewMessages}
                    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Messages</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleViewSettings}
                    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Settings</span>
                  </Button>

                  <div className="border-t border-border/30 my-1" />

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};