"use client";

import { Search, Bell, MessageSquare, Settings, LogOut, User, ChevronDown, Plus, Building2, Command, ArrowRightLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import apiClient from "@/lib/api";

export const NavDash = () => {
  const { user, logout, isLoading, refreshAuth } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwappingRole, setIsSwappingRole] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRoleSuccess, setShowRoleSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 1. Search State
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 2. Handle Search Logic
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to a search results page or filter current view
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

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

  const handleToggleRoleClick = () => {
    setShowRoleModal(true);
  };

  const handleConfirmToggleRole = async () => {
    setIsSwappingRole(true);
    try {
      await apiClient.toggleRole();
      setShowRoleModal(false);
      setShowRoleSuccess(true);

      // Wait for user to see the success message, then reload/refresh
      setTimeout(async () => {
        if (refreshAuth) {
          await refreshAuth();
        } else {
          window.location.reload();
        }
        setShowRoleSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to switch role:', error);
      setIsSwappingRole(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || user?.phoneNumber || '';
  const userRole = user?.role || 'user';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  return (
    <header className="h-16 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-50 supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <SidebarTrigger />

        {/* 3. FUNCTIONAL SEARCH BAR */}
        <form onSubmit={handleSearch} className="relative flex-1 group max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties or documents..."
            className="pl-10 pr-12 h-10 bg-background/50 border-border/50 focus:bg-background focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 rounded-xl"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-medium text-muted-foreground">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Mobile Search Toggle (Optional icon for mobile layouts) */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Switch Role Button */}
        {userRole !== 'admin' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={userRole === 'agent' ? "outline" : "default"}
                onClick={handleToggleRoleClick}
                disabled={isSwappingRole}
                className={`gap-2 rounded-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${userRole === 'agent' ? 'border-border bg-background hover:bg-muted text-foreground' : 'bg-blue-600 hover:bg-blue-700 text-white border-0'}`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="hidden lg:inline">{isSwappingRole ? 'Switching...' : `Switch to ${userRole === 'registered_user' ? 'Agent' : userRole === 'agent' ? 'Landlord' : 'User'}`}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="lg:hidden">
              Switch Role
            </TooltipContent>
          </Tooltip>
        )}

        {/* Add Property Button */}
        {(userRole === 'agent' || userRole === 'landlord' || userRole === 'admin') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleAddProperty}
                aria-label="Add Property"
                className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-full border-0 text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Add Property</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="lg:hidden">
              Add Property
            </TooltipContent>
          </Tooltip>
        )}

        <div className="relative">
          <NotificationDropdown />
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
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-foreground leading-none">{displayName}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{userRole}</div>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200 hidden sm:block",
                showProfileDropdown && "rotate-180"
              )} />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="p-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50">
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 p-1">
                  <DropdownItem onClick={handleViewProfile} icon={User} label="Profile" />
                  {(userRole === 'agent' || userRole === 'landlord' || userRole === 'admin') && (
                    <DropdownItem onClick={handleViewProperties} icon={Building2} label="My Properties" />
                  )}
                  <DropdownItem onClick={handleViewMessages} icon={MessageSquare} label="Messages" />
                  <DropdownItem onClick={handleViewSettings} icon={Settings} label="Settings" />

                  <div className="border-t border-border/30 my-1" />

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-bold">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Switching Confirmation Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Switch your account role</DialogTitle>
            <DialogDescription>
              Are you sure you want to switch your account from a{' '}
              <span className="font-semibold text-foreground">
                {userRole === 'agent' ? 'Real Estate Agent' : userRole === 'landlord' ? 'Landlord' : 'Regular User'}
              </span>{' '}
              to a{' '}
              <span className="font-semibold text-foreground">
                {userRole === 'registered_user' ? 'Real Estate Agent' : userRole === 'agent' ? 'Landlord' : 'Regular User'}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            {userRole === 'agent'
              ? 'As a landlord, you will gain access to tenant management, rental income tracking, and portfolio analytics.'
              : userRole === 'landlord'
                ? 'As a regular user, you will no longer have access to property management, tenant tracking, and analytics.'
                : 'As an agent, you will gain access to tools for managing properties, scheduling tours, and connecting with clients.'}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)} disabled={isSwappingRole}>
              Cancel
            </Button>
            <Button onClick={handleConfirmToggleRole} disabled={isSwappingRole} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
              {isSwappingRole ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Switching...</span>
                </div>
              ) : (
                'Yes, Switch Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Switching Success Modal */}
      <Dialog open={showRoleSuccess} onOpenChange={setShowRoleSuccess}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
              <Check className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl">Role Switched Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your account has been updated to <span className="font-semibold text-foreground">{userRole === 'registered_user' ? 'Real Estate Agent' : userRole === 'agent' ? 'Landlord' : 'Regular User'}</span>.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block animate-pulse">Reloading your dashboard...</span>
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

// Helper Component for Cleaner Code
const DropdownItem = ({ onClick, icon: Icon, label }: { onClick: () => void, icon: any, label: string }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all group"
  >
    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);