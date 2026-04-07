"use client";

import { Home, Building2, BarChart3, Users, Settings, MessageSquare, ChevronDown, LogOut, Bell, Search, Plus, BadgeCheck, Sun, Moon, Zap, Heart, Clock, Lightbulb, Star, Calendar, TrendingUp, DollarSign, FileText, HelpCircle, Newspaper, Shield, Database, UserCog, Activity, AlertTriangle, ChevronRight, KeyRound, GraduationCap, BedDouble, ShieldCheck } from "lucide-react";
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
import { useStudentMode } from "@/contexts/StudentModeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import NotificationDropdown from "../notifications/NotificationDropdown";

// Types for Sidebar Configuration
type SidebarItem = {
  icon: any;
  label: string;
  path: string;
  badge: "New" | "AI" | "Admin" | "Student" | null;
  activeKey: string;
};

type SidebarGroupConfig = {
  label: string;
  icon: any;
  items: SidebarItem[];
  roles?: ("agent" | "landlord" | "admin" | "student")[];
  adminStyle?: boolean;
  studentStyle?: boolean;
  defaultOpen?: boolean;
};

export const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const { user, logout, isLoading } = useAuth();
  const { isStudent, verificationStatus } = useStudentMode();
  const { language, t, dir } = useLanguage();
  const _t = t as any;

  const g = _t.sidebar?.groups || {};
  const it = _t.sidebar?.items || {};
  const b = _t.sidebar?.badges || {};
  const bt = _t.sidebar?.bottom || {};
  const qa = _t.sidebar?.quickActions || {};

  const SIDEBAR_GROUPS: SidebarGroupConfig[] = useMemo(() => [
    // ── 1. HOME — visible to everyone ───────────────────────────────────────
    {
      label: g.home || "Home",
      icon: Home,
      items: [
        { label: it.dashboard || "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard", icon: undefined },
        { label: it.savedSearches || "Saved Searches", path: "/dashboard/saved-searches", badge: null, activeKey: "search", icon: undefined },
        { label: it.favorites || "Favorites", path: "/dashboard/favorite", badge: null, activeKey: "saved", icon: undefined },
      ],
    },

    // ── 2. MY ACTIVITY — things happening to the user ───────────────────────
    // Bookings, messages, notifications grouped by "what I need to act on"
    {
      label: g.myActivity || "My Activity",
      icon: Activity,
      items: [
        { label: it.myBookings || "My Bookings", path: "/dashboard/bookings", badge: null, activeKey: "bookings", icon: undefined },
        { label: it.messages || "Messages", path: "/dashboard/inquiry", badge: null, activeKey: "inquiry", icon: undefined },
        { label: it.notifications || "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications", icon: undefined },
      ],
    },

    // ── 3. PROPERTIES & HOSTING — one group for all listing management ───────
    // Inventory + Host merged: a landlord/agent always manages both together
    {
      label: g.propertiesHosting || "Properties & Hosting",
      icon: Building2,
      roles: ["agent", "landlord", "admin"],
      items: [
        { label: it.myProperties || "My Properties", path: "/dashboard/property", badge: null, activeKey: "property", icon: undefined },
        { label: it.addListing || "Add Listing", path: "/dashboard/propertyForm", badge: null, activeKey: "propertyForm", icon: undefined },
        { label: it.hostBookings || "Host Bookings", path: "/dashboard/host/bookings", badge: null, activeKey: "host-bookings", icon: undefined },
        { label: it.blockedDates || "Blocked Dates", path: "/dashboard/host/blocked-dates", badge: null, activeKey: "host-blocked-dates", icon: undefined },
      ],
    },

    // ── 4. CLIENTS & SALES — agent-only business development ────────────────
    // Leads, appointments, referrals, promotions: all outward-facing sales work
    {
      label: g.clientsSales || "Clients & Sales",
      icon: Users,
      roles: ["agent"],
      items: [
        { label: it.leads || "Leads", path: "/dashboard/leads", badge: (b.new || "New") as any, activeKey: "leads", icon: undefined },
        { label: it.appointments || "Appointments", path: "/dashboard/appointments", badge: null, activeKey: "appointments", icon: undefined },
        { label: it.referrals || "Referrals", path: "/dashboard/referrals", badge: null, activeKey: "referrals", icon: undefined },
        { label: it.promotions || "Promotions", path: "/dashboard/promotions", badge: null, activeKey: "promotions", icon: undefined },
      ],
    },

    // ── 5. TENANTS & LEASES — landlord property management ──────────────────
    {
      label: g.tenantsLeases || "Tenants & Leases",
      icon: KeyRound,
      roles: ["landlord", "admin"],
      items: [
        { label: it.allTenants || "All Tenants", path: "/dashboard/tenants", badge: null, activeKey: "tenants", icon: undefined },
        { label: it.addTenant || "Add Tenant", path: "/dashboard/tenants/new", badge: null, activeKey: "tenants-new", icon: undefined },
        { label: it.leases || "Leases", path: "/dashboard/leases", badge: null, activeKey: "leases", icon: undefined },
        { label: it.rentSplits || "Rent Splits", path: "/dashboard/split-rent", badge: null, activeKey: "split-rent", icon: undefined },
      ],
    },

    // ── 6. EARNINGS & BILLING — actions: pay, manage, withdraw ──────────────
    // Separated from Insights so the user immediately knows "this is where I manage money"
    {
      label: g.earningsBilling || "Earnings & Billing",
      icon: DollarSign,
      roles: ["agent", "landlord", "admin"],
      items: [
        { label: it.billing || "Billing & Payments", path: "/dashboard/billing", badge: null, activeKey: "billing", icon: undefined },
        { label: it.subscriptions || "Subscriptions", path: "/dashboard/subscriptions", badge: null, activeKey: "subscriptions", icon: undefined },
      ],
    },

    // ── 7. INSIGHTS — observe: analytics and AI tools ───────────────────────
    // Read-only / exploratory — intentionally separated from manage/pay actions
    {
      label: g.insights || "Insights",
      icon: TrendingUp,
      roles: ["agent", "landlord", "admin"],
      items: [
        { label: it.marketAnalytics || "Market Analytics", path: "/dashboard/analytics", badge: null, activeKey: "analytics", icon: undefined },
        { label: it.aiPricingTool || "AI Pricing Tool", path: "/dashboard/pricing", badge: (b.ai || "AI") as any, activeKey: "pricing", icon: undefined },
      ],
    },

    // ── 8. CAMPUS HUB — student-only ────────────────────────────────────────
    {
      label: g.campusHub || "Campus Hub",
      icon: GraduationCap,
      roles: ["student"],
      studentStyle: true,
      items: [
        { label: it.studentHousing || "Student Housing", path: "/students", badge: null, activeKey: "students", icon: undefined },
        { label: it.roommatePool || "Roommate Pool", path: "/students/roommates", badge: null, activeKey: "students-roommates", icon: undefined },
        { label: it.myLeases || "My Leases", path: "/dashboard/leases", badge: null, activeKey: "leases", icon: undefined },
        { label: it.rentSplit || "Rent Split", path: "/dashboard/split-rent", badge: null, activeKey: "split-rent", icon: undefined },
        { label: it.studentId || "Student ID", path: "/dashboard/settings?tab=student-id", badge: null, activeKey: "student-id", icon: undefined },
      ],
    },

    // ── 9. ADMINISTRATION — admin-only ──────────────────────────────────────
    // Student programme collapsed into Administration to reduce admin group count
    {
      label: g.administration || "Administration",
      icon: Shield,
      roles: ["admin"],
      adminStyle: true,
      items: [
        { label: it.idVerificationQueue || "Student IDs", path: "/dashboard/admin/students", badge: (b.admin || "Admin") as any, activeKey: "admin-students", icon: undefined },
        { label: it.userControl || "User Control", path: "/dashboard/admin/users", badge: (b.admin || "Admin") as any, activeKey: "admin-users", icon: undefined },
        { label: it.propertyApprovals || "Property Approvals", path: "/dashboard/admin/properties", badge: (b.admin || "Admin") as any, activeKey: "admin-properties", icon: undefined },
        { label: it.reviewReports || "Review Reports", path: "/dashboard/admin/reports", badge: (b.admin || "Admin") as any, activeKey: "admin-reports", icon: undefined },
        { label: it.systemHealth || "System Health", path: "/dashboard/admin/health", badge: null, activeKey: "admin-health", icon: undefined },
        { label: it.platformSettings || "Platform Settings", path: "/dashboard/admin/system-settings", badge: null, activeKey: "admin-settings", icon: undefined },
      ],
    },
  ], [g, it, b]);

  const sharedBottomItems: SidebarItem[] = useMemo(() => [
    { icon: Newspaper, label: bt.newsUpdates || "News & Updates", path: "/dashboard/news", badge: null, activeKey: "news" },
    { icon: HelpCircle, label: bt.helpSupport || "Help & Support", path: "/dashboard/support", badge: null, activeKey: "support" },
    { icon: Settings, label: bt.settings || "Settings", path: "/dashboard/settings", badge: null, activeKey: "settings" },
  ], [bt]);

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

  const isAgent = user?.role === "agent";
  const isLandlord = user?.role === "landlord";
  const isAdmin = user?.role === "admin";

  const shouldShowGroup = (group: SidebarGroupConfig) => {
    if (group.label === "My Lease") return hasLease;
    if (!group.roles) return true;
    if (group.roles.includes("student") && isStudent) return true;
    if (group.roles.includes("agent") && (isAgent || isLandlord || isAdmin)) return true;
    if (group.roles.includes("landlord") && (isLandlord || isAdmin)) return true;
    if (group.roles.includes("admin") && isAdmin) return true;
    return false;
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path === "/dashboard") return pathname === "/dashboard";
    const itemPathname = item.path.split("?")[0];
    return pathname.startsWith(itemPathname);
  };

  useEffect(() => {
    const checkLeaseStatus = async () => {
      if (!isAgent && !isLandlord && !isAdmin && user) {
        try {
          const data = await apiClient.getMyLeaseInfo();
          if (data.leases && data.leases.length > 0) setHasLease(true);
        } catch { /* no lease */ }
      }
    };
    checkLeaseStatus();
  }, [isAgent, isLandlord, isAdmin, user]);

  const sidebarGroupsWithExtras = useMemo(() => {
    const groups = [...SIDEBAR_GROUPS];

    // If the user has an active lease (non-student tenant), inject a "My Lease"
    // shortcut between Home and My Activity so they can reach it in one click.
    if (hasLease && !isStudent) {
      const myLeaseGroup: SidebarGroupConfig = {
        label: it.myLease || "My Lease",
        icon: FileText,
        items: [{ label: it.leaseDetails || "Lease Details", path: "/dashboard/lease", badge: null, activeKey: "lease", icon: undefined }],
      };
      groups.splice(1, 0, myLeaseGroup);
    }

    return groups;
  }, [hasLease, isStudent, SIDEBAR_GROUPS]);

  useEffect(() => {
    const initialOpenGroups: Record<string, boolean> = {};
    sidebarGroupsWithExtras.forEach((group) => {
      if (!shouldShowGroup(group)) return;
      if (group.defaultOpen) initialOpenGroups[group.label] = true;
      if (group.items.some(item => isItemActive(item))) initialOpenGroups[group.label] = true;
    });
    setOpenGroups(initialOpenGroups);
  }, [pathname, user?.role, sidebarGroupsWithExtras, isStudent]);

  const toggleGroup = (groupLabel: string) =>
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));

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
    try { await logout(); } catch { /* ignore */ } finally {
      setIsLoggingOut(false); setShowLogout(false);
    }
  };

  const handleViewProfile = () => { setShowLogout(false); router.push("/dashboard/profile"); };
  const handleAccountSettings = () => { setShowLogout(false); router.push("/dashboard/settings?tab=account"); };

  const quickActions = isAdmin ? [
    { icon: Shield, label: qa.adminPanel || "Admin Panel", action: () => router.push("/dashboard/admin") },
    { icon: UserCog, label: qa.manageUsers || "Manage Users", action: () => router.push("/dashboard/admin/users") },
    { icon: Activity, label: qa.viewLogs || "View Logs", action: () => router.push("/dashboard/admin/logs") },
    { icon: AlertTriangle, label: qa.reviewReports || "Review Reports", action: () => router.push("/dashboard/admin/reports") },
  ] : isAgent ? [
    { icon: Plus, label: qa.addProperty || "Add Property", action: () => router.push("/dashboard/property/new") },
    { icon: Users, label: qa.viewLeads || "View Leads", action: () => router.push("/dashboard/leads") },
    { icon: MessageSquare, label: qa.newMessage || "New Message", action: () => router.push("/dashboard/messages?compose=true") },
    { icon: BarChart3, label: qa.viewAnalytics || "View Analytics", action: () => router.push("/dashboard/analytics") },
  ] : isLandlord ? [
    { icon: Plus, label: qa.addProperty || "Add Property", action: () => router.push("/dashboard/propertyForm") },
    { icon: KeyRound, label: qa.manageTenants || "Manage Tenants", action: () => router.push("/dashboard/tenants") },
    { icon: MessageSquare, label: qa.messages || "Messages", action: () => router.push("/dashboard/inquiry") },
    { icon: BarChart3, label: qa.viewAnalytics || "View Analytics", action: () => router.push("/dashboard/analytics") },
  ] : isStudent ? [
    { icon: Search, label: qa.findHousing || "Find Housing", action: () => router.push("/students") },
    { icon: BedDouble, label: qa.findRoommate || "Find Roommate", action: () => router.push("/students/roommates") },
    { icon: MessageSquare, label: qa.messages || "Messages", action: () => router.push("/dashboard/inquiry") },
    { icon: ShieldCheck, label: qa.studentId || "Student ID", action: () => router.push("/dashboard/settings?tab=student-id") },
  ] : [
    { icon: Search, label: qa.searchProperties || "Search Properties", action: () => router.push("/dashboard/search") },
    { icon: Heart, label: qa.savedProperties || "Saved Properties", action: () => router.push("/dashboard/saved") },
    { icon: MessageSquare, label: qa.messages || "Messages", action: () => router.push("/dashboard/messages") },
    { icon: Building2, label: qa.findAgents || "Find Agents", action: () => router.push("/dashboard/agents") },
  ];

  const displayName = user?.name || "User";
  const displayEmail = user?.email || user?.phoneNumber || "";
  const avatarUrl = user?.profilePicture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  const getRoleBadge = () => {
    if (isAdmin) return { icon: Shield, text: b.admin || "Admin", bgColor: "bg-red-50", textColor: "text-red-700", iconColor: "text-red-500" };
    if (isLandlord) return { icon: KeyRound, text: "Landlord", bgColor: "bg-emerald-50", textColor: "text-emerald-700", iconColor: "text-emerald-500" };
    if (isAgent) return { icon: BadgeCheck, text: "Pro Agent", bgColor: "bg-blue-50", textColor: "text-blue-700", iconColor: "text-blue-500" };
    if (isStudent) return { icon: GraduationCap, text: verificationStatus === "verified" ? (b.verifiedStudent || "Verified Student") : (b.student || "Student"), bgColor: "bg-purple-50", textColor: "text-purple-700", iconColor: "text-purple-500" };
    return null;
  };
  const roleBadge = getRoleBadge();

  // ── Collapsed sidebar ─────────────────────────────────────────────────────
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
                            isItemActive(item) && (
                              group.adminStyle ? "bg-red-50 text-red-700" :
                                group.studentStyle ? "bg-purple-50 text-purple-700" :
                                  "bg-blue-50 text-blue-700"
                            )
                          )}
                        >
                          <Link href={item.path} className="flex justify-center">
                            <group.icon className="w-5 h-5" />
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

  // ── Expanded sidebar ──────────────────────────────────────────────────────
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
              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group/quick",
              isAdmin ? "bg-red-50" :
                isStudent ? "bg-purple-50" :
                  "bg-blue-50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg text-white transition-colors",
                isAdmin ? "text-red-600 group-hover/quick:text-red-700" :
                  isStudent ? "text-purple-600 group-hover/quick:text-purple-700" :
                    "text-blue-600 group-hover/quick:text-blue-700"
              )}>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className={cn(
                "text-sm font-semibold",
                isAdmin ? "text-red-700" :
                  isStudent ? "text-purple-700" :
                    "text-blue-700"
              )}>
                {qa.title || "Quick Actions"}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isAdmin ? "text-red-600" :
                isStudent ? "text-purple-600" :
                  "text-blue-600",
              quickActionsOpen && "rotate-180"
            )} />
          </button>

          {quickActionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-lg border border-border rounded-xl -lg p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 space-y-1">
              {quickActions.map((action, index) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-foreground rounded-lg transition-all duration-200 group/action hover:translate-x-1 cursor-pointer",
                    isAdmin ? "hover:bg-red-50    hover:text-red-700" :
                      isStudent ? "hover:bg-purple-50 hover:text-purple-700" :
                        "hover:text-blue-50   hover:text-blue-700"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isAdmin ? "bg-red-50    group-hover/action:bg-red-100" :
                      isStudent ? "bg-purple-50 group-hover/action:bg-purple-100" :
                        "text-blue-600 group-hover/action:text-blue-700"
                  )}>
                    <action.icon className={cn(
                      "w-3.5 h-3.5",
                      isAdmin ? "text-red-600" :
                        isStudent ? "text-purple-600" :
                          "text-blue-600"
                    )} />
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
            const isStudentGroup = group.studentStyle || (group.roles?.includes("student") && group.roles.length === 1);
            const isOpen = openGroups[group.label] || false;
            const GroupIcon = group.icon;
            const hasActiveChild = group.items.some(item => isItemActive(item));

            const accentActive = isAdminGroup ? "text-red-700" : isStudentGroup ? "text-purple-700" : "text-blue-700";
            const accentIconBg = isAdminGroup ? "bg-red-100 text-red-600" : isStudentGroup ? "bg-purple-100 text-purple-600" : "text-blue-600";
            const accentDot = isAdminGroup ? "bg-red-500" : isStudentGroup ? "bg-purple-500" : "bg-blue-500";
            const accentItemBg = isAdminGroup ? "bg-red-50 text-red-700" : isStudentGroup ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700";
            const accentTreeLine = isAdminGroup ? "border-red-100" : isStudentGroup ? "border-purple-100" : "border-border/50";

            return (
              <Collapsible
                key={group.label}
                open={isOpen}
                onOpenChange={() => toggleGroup(group.label)}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-3.5 rounded-lg cursor-pointer transition-all duration-200 group/trigger",
                    "hover:bg-muted/60",
                    hasActiveChild && !isOpen ? accentActive : "text-muted-foreground hover:text-foreground"
                  )}>
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors duration-200",
                      hasActiveChild
                        ? accentIconBg
                        : "bg-dmuted/70 text-muted-foreground group-hover/trigger:bg-muted group-hover/trigger:text-foreground"
                    )}>
                      <GroupIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className={cn("flex-1 text-left text-sm font-semibold", hasActiveChild ? accentActive : "")}>
                      {group.label}
                    </span>
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-90",
                      isAdminGroup ? "text-red-400" :
                        isStudentGroup ? "text-purple-400" :
                          "text-muted-foreground/60"
                    )} />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-150">
                  <div className={cn("ml-[22px] mt-0.5 mb-1 pl-3 border-l", accentTreeLine)}>
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={cn(
                            "flex items-center justify-between gap-2 px-2.5 py-3 my-0.5 rounded-md text-sm transition-all duration-200 group/sub",
                            active
                              ? accentItemBg
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200",
                              active ? accentDot : "bg-border group-hover/sub:bg-muted-foreground/50"
                            )} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={cn(
                              "px-1.5 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 leading-none",
                              item.badge === "Admin" ? "bg-red-100 text-red-700" :
                                item.badge === "Student" ? "bg-purple-100 text-purple-700" :
                                  "bg-emerald-100 text-emerald-700"
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

        {/* Bottom items */}
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