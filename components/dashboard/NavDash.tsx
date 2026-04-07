"use client";

import { Search, Settings, LogOut, User, Menu, Plus, Building2, Command, ArrowRightLeft, Check, X, Globe } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/lib/i18n";
import LanguageCurrencyModal from "@/components/layout/LanguageCurrencyModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const NavDash = () => {
  const { user, logout, isLoading, refreshAuth } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwappingRole, setIsSwappingRole] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRoleSuccess, setShowRoleSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLangCurrencyModalOpen, setIsLangCurrencyModalOpen] = useState(false);
  const { language, t, dir } = useLanguage();
  const _t = t as any;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
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

      setTimeout(async () => {
        try {
          if (refreshAuth) {
            await refreshAuth();
          } else {
            window.location.reload();
          }
        } finally {
          setShowRoleSuccess(false);
          setIsSwappingRole(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to switch role:', error);
      setIsSwappingRole(false);
    }
  };

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

  const handleViewSettings = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/settings');
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || user?.phoneNumber || '';
  const userRole = user?.role || 'user';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=EBEBEB`;

  return (
    <header dir={dir} className="h-20 bg-white border-b border-[#DDDDDD] flex items-center justify-between px-6 z-50 sticky top-0">

      {/* ── LEFT: Sidebar Trigger & Search ── */}
      <div className="flex items-center gap-4 flex-1 max-w-[400px]">
        <SidebarTrigger className="text-[#222222] hover:bg-[#F7F7F7] transition-colors rounded-full shrink-0" />

        <form onSubmit={handleSearch} className="relative flex-1 group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222222] stroke-[2]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={_t.navdash?.searchPlaceholder || "Search..."}
            className="pl-12 pr-12 h-12 bg-[#F7F7F7] border border-transparent focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all duration-200 rounded-full text-[15px] font-medium placeholder:text-[#717171] placeholder:font-normal"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 text-[12px] font-semibold text-[#717171]">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </form>
      </div>

      {/* ── RIGHT: Actions & User Capsule ── */}
      <div className="flex items-center justify-end gap-2">
        <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222] shrink-0">
          <Search className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Switch Role Button */}
        {userRole !== 'admin' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleRoleClick}
                disabled={isSwappingRole}
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#DDDDDD] bg-white hover:bg-[#F7F7F7] transition-colors text-[14px] font-semibold text-[#222222] disabled:opacity-50 shrink-0"
              >
                <ArrowRightLeft className="w-4 h-4 stroke-[2]" />
                <span>
                  {isSwappingRole
                    ? (_t.navdash?.switching || 'Switching...')
                    : `${_t.navdash?.switchRole || 'Switch to'} ${userRole === 'registered_user' ? (_t.navdash?.roleModal?.roles?.agent || 'Agent') : userRole === 'agent' ? (_t.navdash?.roleModal?.roles?.landlord || 'Landlord') : (_t.navdash?.roleModal?.roles?.user || 'User')}`}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="lg:hidden rounded-lg">
              Switch Role
            </TooltipContent>
          </Tooltip>
        )}

        {/* Add Property Button (Visible on Mobile & Desktop) */}
        {(userRole === 'agent' || userRole === 'landlord' || userRole === 'admin') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAddProperty}
                className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5] sm:mr-2" />
                <span className="hidden sm:inline text-[14px] font-semibold">
                  {_t.navdash?.addProperty || 'Create listing'}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="sm:hidden rounded-lg">
              Create listing
            </TooltipContent>
          </Tooltip>
        )}

        {/* Notifications */}
        <div className="relative shrink-0">
          <NotificationDropdown />
        </div>

        {/* Language & Currency Trigger */}
        <button
          onClick={() => setIsLangCurrencyModalOpen(true)}
          className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222] shrink-0"
          aria-label="Language and Currency Preferences"
        >
          <img
            src={languages[language]?.flag || languages['en'].flag}
            alt={languages[language]?.name || 'Language'}
            className="w-5 h-5 rounded-full object-cover"
          />
        </button>

        {/* Profile Menu Capsule */}
        {!isLoading && user && (
          <div className="relative ml-2 shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 border border-[#DDDDDD] rounded-full p-1.5 pl-3.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-shadow duration-200 bg-white focus:outline-none"
            >
              <Menu className="w-4 h-4 text-[#222222] stroke-[2.5]" />
              <Avatar className="h-8 w-8 bg-[#717171]">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-white text-[12px] font-semibold bg-transparent">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#DDDDDD] rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.12)] p-2 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-4 py-3">
                  <p className="font-semibold text-[15px] text-[#222222] truncate">{displayName}</p>
                  <p className="text-[14px] text-[#717171] truncate">{displayEmail}</p>
                  <span className="inline-block mt-2 bg-[#F7F7F7] text-[#222222] border border-[#DDDDDD] text-[11px] font-semibold px-2 py-0.5 rounded-md">
                    {userRole.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="border-t border-[#DDDDDD] mx-2 my-1" />

                <div className="flex flex-col gap-1 px-1">
                  <DropdownItem onClick={handleViewProfile} label={_t.navdash?.dropdown?.profile || "Profile"} />
                  {(userRole === 'agent' || userRole === 'landlord' || userRole === 'admin') && (
                    <DropdownItem onClick={handleViewProperties} label={_t.navdash?.dropdown?.myProperties || "My listings"} />
                  )}
                  <DropdownItem onClick={handleViewSettings} label={_t.navdash?.dropdown?.settings || "Account settings"} />

                  <div className="border-t border-[#DDDDDD] mx-1 my-1" />

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 py-3 text-[14px] font-medium text-[#222222] hover:bg-[#F7F7F7] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? (_t.navdash?.dropdown?.loggingOut || 'Logging out...') : (_t.navdash?.dropdown?.logout || 'Log out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Role Switching Confirmation Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-[425px] p-8 rounded-2xl border-[#DDDDDD]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[22px] font-semibold text-[#222222]">
              {_t.navdash?.roleModal?.title || "Switch account role"}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#717171] mt-2">
              {_t.navdash?.roleModal?.desc1 || "Are you sure you want to switch from a "}
              <span className="font-semibold text-[#222222]">
                {userRole === 'agent' ? (_t.navdash?.roleModal?.roles?.agent || 'Real Estate Agent') : userRole === 'landlord' ? (_t.navdash?.roleModal?.roles?.landlord || 'Landlord') : (_t.navdash?.roleModal?.roles?.user || 'Regular User')}
              </span>{' '}
              {_t.navdash?.roleModal?.desc2 || " to a "}
              <span className="font-semibold text-[#222222]">
                {userRole === 'registered_user' ? (_t.navdash?.roleModal?.roles?.agent || 'Real Estate Agent') : userRole === 'agent' ? (_t.navdash?.roleModal?.roles?.landlord || 'Landlord') : (_t.navdash?.roleModal?.roles?.user || 'Regular User')}
              </span>
              {_t.navdash?.roleModal?.desc3 || "?"}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#F7F7F7] p-4 rounded-xl text-[14px] text-[#222222] mb-6 border border-[#DDDDDD]">
            {userRole === 'agent'
              ? (_t.navdash?.roleModal?.agentDesc || 'As a landlord, you will gain access to tenant management, rental income tracking, and portfolio analytics.')
              : userRole === 'landlord'
                ? (_t.navdash?.roleModal?.landlordDesc || 'As a regular user, you will no longer have access to property management, tenant tracking, and analytics.')
                : (_t.navdash?.roleModal?.userDesc || 'As an agent, you will gain access to tools for managing properties, scheduling tours, and connecting with clients.')}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRoleModal(false)}
              disabled={isSwappingRole}
              className="h-12 px-6 rounded-lg border-blue-600 text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7]"
            >
              {_t.navdash?.roleModal?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleConfirmToggleRole}
              disabled={isSwappingRole}
              className="h-12 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] min-w-[140px]"
            >
              {isSwappingRole ? (
                "Switching..."
              ) : (
                _t.navdash?.roleModal?.yesSwitchRole || 'Confirm switch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Switching Success Modal */}
      <Dialog open={showRoleSuccess} onOpenChange={setShowRoleSuccess}>
        <DialogContent className="sm:max-w-[400px] p-8 rounded-2xl border-[#DDDDDD] outline-none">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-[#ECFDF5] border border-[#008A05]/20 rounded-full flex items-center justify-center text-[#008A05] mb-2">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <DialogTitle className="text-[22px] font-semibold text-[#222222]">
              {_t.navdash?.roleModal?.successTitle || 'Role switched successfully'}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#717171]">
              {_t.navdash?.roleModal?.successDesc1 || 'Your account is now set to '}
              <span className="font-semibold text-[#222222]">
                {userRole === 'registered_user' ? (_t.navdash?.roleModal?.roles?.agent || 'Real Estate Agent') : userRole === 'agent' ? (_t.navdash?.roleModal?.roles?.landlord || 'Landlord') : (_t.navdash?.roleModal?.roles?.user || 'Regular User')}
              </span>
              {_t.navdash?.roleModal?.successDesc2 || '.'}
              <br />
              <span className="inline-block text-[13px] font-medium text-[#222222] mt-4 animate-pulse">
                {_t.navdash?.roleModal?.reloading || 'Reloading your dashboard...'}
              </span>
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>

      <LanguageCurrencyModal
        isOpen={isLangCurrencyModalOpen}
        onClose={() => setIsLangCurrencyModalOpen(false)}
      />
    </header>
  );
};

// ─── Helper Component ────────────────────────────────────────────────────────
const DropdownItem = ({ onClick, label }: { onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-3 py-3 text-[14px] font-medium text-[#222222] hover:bg-[#F7F7F7] rounded-xl transition-colors"
  >
    {label}
  </button>
);