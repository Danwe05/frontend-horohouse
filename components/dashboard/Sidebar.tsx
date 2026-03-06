"use client";

import { Home, Building2, BarChart3, Users, Settings, MessageSquare, ChevronDown, LogOut, Bell, Search, Plus, BadgeCheck, Sun, Moon, Zap, Heart, Clock, Lightbulb, Star, Calendar, TrendingUp, DollarSign, FileText, HelpCircle, Newspaper, Shield, Database, UserCog, Activity, AlertTriangle, ChevronRight, KeyRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import NotificationDropdown from "../notifications/NotificationDropdown";

// Types for Sidebar Configuration
type SidebarItem = {
  icon: any;
  label: string;
  path: string;
  badge: "New" | "AI" | "Admin" | null;
  activeKey: string;
};

type SidebarGroupConfig = {
  label: string;
  icon: any; // Icon for the group header
  items: SidebarItem[];
  roles?: ("agent" | "landlord" | "admin")[];
  adminStyle?: boolean;
  defaultOpen?: boolean;
};

// Configuration of all sidebar groups — group-level icons added
const SIDEBAR_GROUPS: SidebarGroupConfig[] = [
  {
    label: "Overview", // #5: GENERAL OPS
    icon: Home,
    items: [
      {
        label: "Main Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard",
        icon: undefined
      },
      {
        label: "Market Discovery", path: "/dashboard/saved-searches", badge: null, activeKey: "search",
        icon: undefined
      },
      {
        label: "Personal Favorites", path: "/dashboard/favorite", badge: null, activeKey: "saved",
        icon: undefined
      }
    ]
  },
  {
    label: "Client Relations", // #1: LEADS ARE GOLD
    icon: Users,
    roles: ["agent"],
    defaultOpen: true,
    items: [
      {
        label: "Client Leads", path: "/dashboard/leads", badge: "New", activeKey: "leads",
        icon: undefined
      },
      {
        label: "Appointments", path: "/dashboard/appointments", badge: null, activeKey: "appointments",
        icon: undefined
      },
      {
        label: "Promotions", path: "/dashboard/promotions", badge: null, activeKey: "promotions",
        icon: undefined
      }
    ]
  },
  {
    label: "Communications", // #2: NEGOTIATION HUB
    icon: MessageSquare,
    items: [
      {
        label: "Direct Messages", path: "/dashboard/inquiry", badge: null, activeKey: "inquiry",
        icon: undefined
      },
      {
        label: "Referral Network", path: "/dashboard/referrals", badge: null, activeKey: "referrals",
        icon: undefined
      },
      {
        label: "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications",
        icon: undefined
      }
    ]
  },
  {
    label: "Inventory", // #3: THE PRODUCT
    icon: Building2,
    roles: ["agent", "landlord", "admin"],
    items: [
      {
        label: "My Properties", path: "/dashboard/property", badge: null, activeKey: "property",
        icon: undefined
      },
      {
        label: "Add New Listing", path: "/dashboard/propertyForm", badge: null, activeKey: "propertyForm",
        icon: undefined
      }
    ]
  },
  {
    label: "Host",
    icon: Calendar,
    roles: ["agent", "landlord", "admin"],
    items: [
      {
        label: "Bookings", path: "/dashboard/host/bookings", badge: null, activeKey: "host-bookings",
        icon: undefined
      },
      {
        label: "Blocked Dates", path: "/dashboard/host/blocked-dates", badge: null, activeKey: "host-blocked-dates",
        icon: undefined
      }
    ]
  },
  {
    label: "Financials", // #4: THE PAYOFF
    icon: DollarSign,
    roles: ["agent", "landlord", "admin"],
    items: [
      {
        label: "Earnings & Payouts", path: "/dashboard/earnings", badge: null, activeKey: "earnings",
        icon: undefined
      },
      {
        label: "Market Analytics", path: "/dashboard/analytics", badge: null, activeKey: "analytics",
        icon: undefined
      },
      {
        label: "Subscriptions", path: "/dashboard/subscriptions", badge: null, activeKey: "subscriptions",
        icon: undefined
      },
      {
        label: "AI Pricing Tool", path: "/dashboard/pricing", badge: "AI", activeKey: "pricing",
        icon: undefined
      }
    ]
  },
  {
    label: "Tenant Management",
    icon: KeyRound,
    roles: ["landlord", "admin"],
    items: [
      {
        label: "All Tenants", path: "/dashboard/tenants", badge: null, activeKey: "tenants",
        icon: undefined
      },
      {
        label: "Add Tenant", path: "/dashboard/tenants/new", badge: null, activeKey: "tenants-new",
        icon: undefined
      }
    ]
  },
  {
    label: "Administration", // #6: SYSTEM (Hidden for most)
    icon: Shield,
    roles: ["admin"],
    adminStyle: true,
    items: [
      {
        label: "User Control", path: "/dashboard/admin/users", badge: "Admin", activeKey: "admin-users",
        icon: undefined
      },
      {
        label: "Property Approvals", path: "/dashboard/admin/properties", badge: "Admin", activeKey: "admin-properties",
        icon: undefined
      },
      {
        label: "Review Reports", path: "/dashboard/admin/reports", badge: "Admin", activeKey: "admin-reports",
        icon: undefined
      },
      {
        label: "System Health", path: "/dashboard/admin/health", badge: null, activeKey: "admin-health",
        icon: undefined
      },
      {
        label: "Platform Settings", path: "/dashboard/admin/system-settings", badge: null, activeKey: "admin-settings",
        icon: undefined
      }
    ]
  }
];

// Shared bottom items
const sharedBottomItems: SidebarItem[] = [
  { icon: Newspaper, label: "News & Updates", path: "/dashboard/news", badge: null, activeKey: "news" },
  { icon: HelpCircle, label: "Help & Support", path: "/dashboard/support", badge: null, activeKey: "support" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings", badge: null, activeKey: "settings" },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const { user, logout, isLoading } = useAuth();
  const isCollapsed = state === "collapsed";
  const [showLogout, setShowLogout] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hasLease, setHasLease] = useState(false);
  const logoutRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const isAgent = user?.role === 'agent';
  const isLandlord = user?.role === 'landlord';
  const isAdmin = user?.role === 'admin';

  const shouldShowGroup = (group: SidebarGroupConfig) => {
    // If it's the dynamic "My Lease" group, show it only if the user has a lease
    if (group.label === "My Lease") return hasLease;

    if (!group.roles) return true;
    if (group.roles.includes("agent") && (isAgent || isLandlord || isAdmin)) return true;
    if (group.roles.includes("landlord") && (isLandlord || isAdmin)) return true;
    if (group.roles.includes("admin") && isAdmin) return true;
    return false;
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.path);
  };

  // Fetch lease status for regular users on mount
  useEffect(() => {
    const checkLeaseStatus = async () => {
      // Only check for users who might be tenants (not admin/agent/landlord themselves)
      if (!isAgent && !isLandlord && !isAdmin && user) {
        try {
          const data = await apiClient.getMyLeaseInfo();
          if (data.leases && data.leases.length > 0) {
            setHasLease(true);
          }
        } catch (err) {
          console.error("Sidebar lease check failed:", err);
        }
      }
    };
    checkLeaseStatus();
  }, [isAgent, isLandlord, isAdmin, user]);

  // Dynamically inject "Bookings" and "My Lease" groups
  const sidebarGroupsWithExtras = useMemo(() => {
    let groups = [...SIDEBAR_GROUPS];

    // Add Bookings group
    const bookingLabel = isAdmin ? "Global Bookings" : (isAgent || isLandlord) ? "Manage Bookings" : "My Bookings";
    const bookingsGroup: SidebarGroupConfig = {
      label: bookingLabel,
      icon: Calendar,
      items: [
        {
          label: bookingLabel, path: "/dashboard/bookings", badge: null, activeKey: "bookings",
          icon: undefined
        }
      ]
    };

    // Insert Bookings after Overview (index 0)
    groups.splice(1, 0, bookingsGroup);

    // Inject "My Lease" if user has one
    if (hasLease) {
      const tenantGroup: SidebarGroupConfig = {
        label: "My Lease",
        icon: FileText,
        items: [
          {
            label: "Lease Details", path: "/dashboard/lease", badge: null, activeKey: "lease",
            icon: undefined
          }
        ]
      };
      // Insert after Overview and Bookings
      groups.splice(2, 0, tenantGroup);
    }

    return groups;
  }, [hasLease, isAdmin, isAgent, isLandlord]);

  useEffect(() => {
    const initialOpenGroups: Record<string, boolean> = {};
    sidebarGroupsWithExtras.forEach((group) => {
      if (!shouldShowGroup(group)) return;
      if (group.defaultOpen) initialOpenGroups[group.label] = true;
      const hasActiveItem = group.items.some(item => isItemActive(item));
      if (hasActiveItem) initialOpenGroups[group.label] = true;
    });
    setOpenGroups(initialOpenGroups);
  }, [pathname, user?.role, sidebarGroupsWithExtras]);

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) setShowLogout(false);
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) setQuickActionsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } catch (error) { console.error('Logout failed:', error); } finally {
      setIsLoggingOut(false); setShowLogout(false);
    }
  };

  const handleViewProfile = () => { setShowLogout(false); router.push('/dashboard/profile'); };
  const handleAccountSettings = () => { setShowLogout(false); router.push('/dashboard/settings?tab=account'); };

  const quickActions = isAdmin ? [
    { icon: Shield, label: "Admin Panel", action: () => router.push('/dashboard/admin') },
    { icon: UserCog, label: "Manage Users", action: () => router.push('/dashboard/admin/users') },
    { icon: Activity, label: "View Logs", action: () => router.push('/dashboard/admin/logs') },
    { icon: AlertTriangle, label: "Review Reports", action: () => router.push('/dashboard/admin/reports') },
  ] : isAgent ? [
    { icon: Plus, label: "Add Property", action: () => router.push('/dashboard/property/new') },
    { icon: Users, label: "View Leads", action: () => router.push('/dashboard/leads') },
    { icon: MessageSquare, label: "New Message", action: () => router.push('/dashboard/messages?compose=true') },
    { icon: BarChart3, label: "View Analytics", action: () => router.push('/dashboard/analytics') },
  ] : isLandlord ? [
    { icon: Plus, label: "Add Property", action: () => router.push('/dashboard/propertyForm') },
    { icon: KeyRound, label: "Manage Tenants", action: () => router.push('/dashboard/tenants') },
    { icon: MessageSquare, label: "Messages", action: () => router.push('/dashboard/inquiry') },
    { icon: BarChart3, label: "View Analytics", action: () => router.push('/dashboard/analytics') },
  ] : [
    { icon: Search, label: "Search Properties", action: () => router.push('/dashboard/search') },
    { icon: Heart, label: "Saved Properties", action: () => router.push('/dashboard/saved') },
    { icon: MessageSquare, label: "Messages", action: () => router.push('/dashboard/messages') },
    { icon: Building2, label: "Find Agents", action: () => router.push('/dashboard/agents') },
  ];

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || user?.phoneNumber || '';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  const getRoleBadge = () => {
    if (isAdmin) return { icon: Shield, text: "Admin", bgColor: "bg-red-50", textColor: "text-red-700", iconColor: "text-red-500" };
    if (isLandlord) return { icon: KeyRound, text: "Landlord", bgColor: "bg-emerald-50", textColor: "text-emerald-700", iconColor: "text-emerald-500" };
    if (isAgent) return { icon: BadgeCheck, text: "Pro Agent", bgColor: "bg-blue-50", textColor: "text-blue-700", iconColor: "text-blue-500" };
    return null;
  };
  const roleBadge = getRoleBadge();

  // ─── Collapsed sidebar ───────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <Sidebar
        collapsible="icon"
        className={cn(
          "border-r border-border/50 bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/90",
          "transition-all duration-300 ease-in-out",
          darkMode ? "dark bg-gray-900" : "bg-white"
        )}
      >
        <SidebarHeader className="border-b border-border/30 p-4">
          <Link href="/" className="block">
            <img src="/logoHoroHouseBleueMobile.png" alt="HoroHouse" className="h-12 w-auto mx-auto" />
          </Link>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto">
          {sidebarGroupsWithExtras.map((group) => {
            if (!shouldShowGroup(group)) return null;
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive(item)}
                          tooltip={item.label}
                          className={cn(
                            "relative transition-all duration-300",
                            isItemActive(item) && (group.adminStyle ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700")
                          )}
                        >
                          <Link href={item.path} className="flex justify-center">
                            <item.icon className="w-5 h-5" />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  // ─── Expanded sidebar ────────────────────────────────────────────────────────
  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border/50 bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/90",
        "transition-all duration-300 ease-in-out",
        darkMode ? "dark bg-gray-900" : "bg-white"
      )}
    >
      {/* Header */}
      <SidebarHeader className="border-b border-border/30 p-4">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Link href="/" className="block transition-transform duration-200">
                <img
                  src="/logoHoroHouseBleueOrdinateur.png"
                  alt="HoroHouse"
                  className="h-10 w-auto transition-all duration-300 object-contain max-w-[150px]"
                />
              </Link>
            </div>
            {roleBadge && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <roleBadge.icon className={cn("w-4 h-4 flex-shrink-0", roleBadge.iconColor)} />
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap", roleBadge.bgColor, roleBadge.textColor)}>
                  {roleBadge.text}
                </span>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border/30" ref={quickActionsRef}>
        <div className="relative">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer",
              isAdmin ? "bg-red-50" : "bg-blue-50",
              "transition-all duration-200 group/quick"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg text-white transition-colors",
                isAdmin ? "bg-red-500 group-hover/quick:bg-red-600" : "bg-blue-500 group-hover/quick:bg-blue-600"
              )}>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className={cn("text-sm font-semibold", isAdmin ? "text-red-700" : "text-blue-700")}>
                Quick Actions
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isAdmin ? "text-red-600" : "text-blue-600",
              quickActionsOpen && "rotate-180"
            )} />
          </button>

          {quickActionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-lg border border-border rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 space-y-1">
              {quickActions.map((action, index) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-foreground rounded-lg transition-all duration-200 group/action hover:translate-x-1 cursor-pointer",
                    isAdmin ? "hover:bg-red-50 hover:text-red-700" : "hover:bg-blue-50 hover:text-blue-700"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isAdmin ? "bg-red-50 group-hover/action:bg-red-100" : "bg-blue-50 group-hover/action:bg-blue-100"
                  )}>
                    <action.icon className={cn("w-3.5 h-3.5", isAdmin ? "text-red-600" : "text-blue-600")} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-1.5">
          {sidebarGroupsWithExtras.map((group) => {
            if (!shouldShowGroup(group)) return null;

            const isAdminGroup = group.adminStyle || (group.roles?.includes("admin") && group.roles.length === 1);
            const isOpen = openGroups[group.label] || false;
            const GroupIcon = group.icon;

            // Determine if any child is active (to highlight group header)
            const hasActiveChild = group.items.some(item => isItemActive(item));

            return (
              <Collapsible
                key={group.label}
                open={isOpen}
                onOpenChange={() => toggleGroup(group.label)}
                className="w-full"
              >
                {/* ── Group trigger: icon + label + chevron ── */}
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-3.5 rounded-lg cursor-pointer transition-all duration-200 group/trigger",
                      "hover:bg-muted/60",
                      hasActiveChild && !isOpen
                        ? isAdminGroup
                          ? "text-red-700"
                          : "text-blue-700"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Icon pill */}
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors duration-200",
                      hasActiveChild
                        ? isAdminGroup
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-500 text-white"
                        : "bg-muted/70 text-muted-foreground group-hover/trigger:bg-muted group-hover/trigger:text-foreground"
                    )}>
                      <GroupIcon className="w-3.5 h-3.5" />
                    </div>

                    <span className={cn(
                      "flex-1 text-left text-sm font-semibold",
                      isAdminGroup && hasActiveChild ? "text-red-700" : ""
                    )}>
                      {group.label}
                    </span>

                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-90",
                      isAdminGroup ? "text-red-400" : "text-muted-foreground/60"
                    )} />
                  </button>
                </CollapsibleTrigger>

                {/* ── Sub-items: indented, tree line, no icons ── */}
                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-150">
                  {/* Tree container with left border line */}
                  <div className={cn(
                    "ml-[22px] mt-0.5 mb-1 pl-3 border-l",
                    isAdminGroup ? "border-red-100" : "border-border/50"
                  )}>
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={cn(
                            "flex items-center justify-between gap-2 px-2.5 py-3 my-0.5 rounded-md text-sm transition-all duration-200 group/sub",
                            active
                              ? isAdminGroup
                                ? "bg-red-50 text-red-700 font-medium"
                                : "bg-blue-50 text-blue-700 font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          {/* Dot connector to tree line */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200",
                              active
                                ? isAdminGroup ? "bg-red-500" : "bg-blue-500"
                                : "bg-border group-hover/sub:bg-muted-foreground/50"
                            )} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={cn(
                              "px-1.5 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 leading-none",
                              item.badge === "Admin"
                                ? "bg-red-100 text-red-700"
                                : item.badge === "New" || item.badge === "AI"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* ── Shared bottom items ── */}
        <div className="px-3 py-3 border-t border-border/30 mt-auto">
          <div className="space-y-0.5">
            {sharedBottomItems.map((item) => {
              const isActive = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onMouseEnter={() => setActiveHover(item.path)}
                  onMouseLeave={() => setActiveHover(null)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group/bottom",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {/* Active indicator bar */}
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-colors duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "text-muted-foreground group-hover/bottom:text-foreground"
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};