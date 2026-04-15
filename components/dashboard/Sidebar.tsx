"use client";

import {
  Home, Building2, BarChart3, Users, Settings, MessageSquare,
  ChevronDown, LogOut, Bell, Search, Plus, BadgeCheck, Zap, Heart,
  Lightbulb, Star, Calendar, TrendingUp, DollarSign, FileText,
  HelpCircle, Newspaper, Shield, Database, UserCog, Activity,
  AlertTriangle, ChevronRight, KeyRound, GraduationCap, BedDouble,
  ShieldCheck, ClipboardList, BookOpen, Wallet, PieChart, CheckSquare,
  UserCheck, Sliders, ServerCrash, CalendarX, Users2, GitBranch,
  Megaphone, Clock, ReceiptText, BadgeDollarSign
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader,
  SidebarFooter, SidebarRail, useSidebar, SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentMode } from "@/contexts/StudentModeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "New" | "AI" | "Admin" | "Student" | null;

type SidebarItem = {
  icon: any;
  label: string;
  path: string;
  badge: BadgeVariant;
  activeKey: string;
};

type SidebarGroupConfig = {
  label: string;
  icon: any;
  items: SidebarItem[];
  /** Which roles see this group. Undefined = all roles. */
  roles?: ("regular" | "student" | "landlord" | "agent" | "admin" | "host")[];
  /** Extra conditional: only show when user has an active lease */
  requiresLease?: boolean;
  accentVariant?: "blue" | "purple" | "red" | "emerald";
};

// ─── Role-scoped group definitions ───────────────────────────────────────────
// Decision rule:
//   Where am I / what's mine?          → Home
//   What do I list or sell?            → My Properties / My Listings
//   Who is staying short-term?         → Hosting
//   Who is staying long-term?          → Tenants & Leases
//   Who am I selling to?               → Pipeline
//   What did I earn or owe?            → Finances
//   What happened to me?               → My Activity
//   What needs my approval?            → Review Queue  (admin only)

const buildGroups = (labels: {
  g: any; it: any; b: any;
}, hasLease: boolean): SidebarGroupConfig[] => {
  const { g, it, b } = labels;

  return [

    // ══════════════════════════════════════════════════════════════════════════
    // REGULAR USER & STUDENT — guest-side items
    // ══════════════════════════════════════════════════════════════════════════

    {
      label: g.home || "Home",
      icon: Home,
      roles: ["regular", "student"],
      accentVariant: "blue",
      items: [
        { icon: BarChart3,  label: it.dashboard     || "Dashboard",      path: "/dashboard",                badge: null, activeKey: "dashboard" },
        { icon: Search,     label: it.savedSearches || "Saved Searches", path: "/dashboard/saved-searches", badge: null, activeKey: "saved-searches" },
        { icon: Heart,      label: it.favorites     || "Favorites",      path: "/dashboard/favorite",       badge: null, activeKey: "favorite" },
      ],
    },

    {
      label: g.campusHub || "Campus Hub",
      icon: GraduationCap,
      roles: ["student"],
      accentVariant: "purple",
      items: [
        { icon: BedDouble, label: it.studentHousing || "Student Housing", path: "/students",             badge: null, activeKey: "students" },
        { icon: Users2,    label: it.roommatePool   || "Roommate Pool",   path: "/students/roommates",   badge: null, activeKey: "students-roommates" },
      ],
    },

    {
      label: g.myLease || "My Lease",
      icon: FileText,
      roles: ["student", "regular"],
      requiresLease: true,
      accentVariant: "purple",
      items: [
        { icon: FileText,    label: it.leaseDetails || "Lease Details", path: "/dashboard/lease",                       badge: null, activeKey: "lease" },
        { icon: GitBranch,   label: it.rentSplit    || "Rent Split",    path: "/dashboard/split-rent",                  badge: null, activeKey: "split-rent" },
        { icon: ShieldCheck, label: it.studentId    || "Student ID",    path: "/dashboard/settings?tab=student-id",     badge: null, activeKey: "student-id" },
      ],
    },

    {
      label: g.myActivity || "My Activity",
      icon: Activity,
      roles: ["regular", "student"],
      accentVariant: "blue",
      items: [
        { icon: ClipboardList, label: it.myBookings    || "My Bookings",   path: "/dashboard/bookings",      badge: null, activeKey: "bookings" },
        { icon: MessageSquare, label: it.messages      || "Messages",      path: "/dashboard/inquiry",       badge: null, activeKey: "messages" },
        { icon: Bell,          label: it.notifications || "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // HOST — short-term hospitality
    // ══════════════════════════════════════════════════════════════════════════

    {
      label: g.home || "Home",
      icon: Home,
      roles: ["host"],
      accentVariant: "blue",
      items: [
        { icon: BarChart3, label: it.dashboard || "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard" },
      ],
    },

    {
      label: g.myProperties || "My Listings",
      icon: Building2,
      roles: ["host"],
      accentVariant: "blue",
      items: [
        { icon: Building2, label: it.myProperties || "My Listings",  path: "/dashboard/property",     badge: null, activeKey: "property" },
        { icon: Plus,      label: it.addListing   || "Add Listing",  path: "/dashboard/propertyForm", badge: null, activeKey: "propertyForm" },
      ],
    },

    {
      label: g.hosting || "Reservations",
      icon: Calendar,
      roles: ["host"],
      accentVariant: "emerald",
      items: [
        { icon: ClipboardList, label: it.hostBookings    || "Bookings",         path: "/dashboard/host/bookings",      badge: null, activeKey: "host-bookings" },
        { icon: Calendar,      label: it.bookingCalendar || "Booking Calendar", path: "/dashboard/host/calendar",      badge: null, activeKey: "host-calendar" },
        { icon: CalendarX,     label: it.blockedDates    || "Blocked Dates",    path: "/dashboard/host/blocked-dates", badge: null, activeKey: "host-blocked-dates" },
      ],
    },

    {
      label: g.finances || "Finances",
      icon: Wallet,
      roles: ["host"],
      accentVariant: "emerald",
      items: [
        { icon: Wallet,         label: it.wallet           || "Wallet",           path: "/dashboard/wallet",        badge: null, activeKey: "wallet" },
        { icon: ReceiptText,    label: it.earningsOverview || "Earnings",         path: "/dashboard/earnings",      badge: null, activeKey: "earnings" },
        { icon: Star,           label: it.subscriptions    || "Subscription",     path: "/dashboard/subscriptions", badge: null, activeKey: "subscriptions" },
      ],
    },

    {
      label: g.myActivity || "Communication",
      icon: MessageSquare,
      roles: ["host"],
      accentVariant: "blue",
      items: [
        { icon: MessageSquare, label: it.messages      || "Messages",      path: "/dashboard/inquiry",       badge: null, activeKey: "messages" },
        { icon: Bell,          label: it.notifications || "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // LANDLORD — long-term rentals
    // ══════════════════════════════════════════════════════════════════════════

    {
      label: g.home || "Home",
      icon: Home,
      roles: ["landlord"],
      accentVariant: "blue",
      items: [
        { icon: BarChart3, label: it.dashboard || "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard" },
      ],
    },

    {
      label: g.myProperties || "My Properties",
      icon: Building2,
      roles: ["landlord"],
      accentVariant: "blue",
      items: [
        { icon: Building2, label: it.myProperties || "My Listings",  path: "/dashboard/property",     badge: null, activeKey: "property" },
        { icon: Plus,      label: it.addListing   || "Add Listing",  path: "/dashboard/propertyForm", badge: null, activeKey: "propertyForm" },
        { icon: FileText,  label: it.propertyDocs || "Property Docs",path: "/dashboard/property/docs",badge: null, activeKey: "property-docs" },
      ],
    },

    {
      label: g.tenantsLeases || "Tenants & Leases",
      icon: KeyRound,
      roles: ["landlord"],
      accentVariant: "emerald",
      items: [
        { icon: Users,     label: it.allTenants  || "All Tenants",  path: "/dashboard/tenants",     badge: null, activeKey: "tenants" },
        { icon: UserCheck, label: it.addTenant   || "Add Tenant",   path: "/dashboard/tenants/new", badge: null, activeKey: "tenants-new" },
        { icon: BookOpen,  label: it.leases      || "Leases",       path: "/dashboard/leases",      badge: null, activeKey: "leases" },
        { icon: GitBranch, label: it.rentSplits  || "Rent Splits",  path: "/dashboard/split-rent",  badge: null, activeKey: "split-rent" },
      ],
    },


    {
      label: g.finances || "Finances",
      icon: Wallet,
      roles: ["landlord"],
      accentVariant: "emerald",
      items: [
        { icon: ReceiptText,     label: it.earningsOverview || "Earnings Overview", path: "/dashboard/earnings",       badge: null, activeKey: "earnings" },
        { icon: BadgeDollarSign, label: it.billing          || "Billing",           path: "/dashboard/billing",        badge: null, activeKey: "billing" },
        { icon: Star,            label: it.subscriptions    || "Subscription",       path: "/dashboard/subscriptions", badge: null, activeKey: "subscriptions" },
        { icon: PieChart,        label: it.marketAnalytics  || "Market Analytics",   path: "/dashboard/analytics",    badge: null, activeKey: "analytics" },
      ],
    },

    {
      label: g.myActivity || "Communication",
      icon: MessageSquare,
      roles: ["landlord"],
      accentVariant: "blue",
      items: [
        { icon: MessageSquare, label: it.messages      || "Messages",      path: "/dashboard/inquiry",       badge: null, activeKey: "messages" },
        { icon: Bell,          label: it.notifications || "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // AGENT — sales pipeline
    // ══════════════════════════════════════════════════════════════════════════

    {
      label: g.home || "Home",
      icon: Home,
      roles: ["agent"],
      accentVariant: "blue",
      items: [
        { icon: BarChart3, label: it.dashboard || "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard" },
      ],
    },

    {
      label: g.myProperties || "My Properties",
      icon: Building2,
      roles: ["agent"],
      accentVariant: "blue",
      items: [
        { icon: Building2, label: it.myProperties || "My Listings",   path: "/dashboard/property",     badge: null, activeKey: "property" },
        { icon: Plus,      label: it.addListing   || "Add Listing",   path: "/dashboard/propertyForm", badge: null, activeKey: "propertyForm" },
        { icon: FileText,  label: it.propertyDocs || "Property Docs", path: "/dashboard/property/docs",badge: null, activeKey: "property-docs" },
      ],
    },

    {
      label: g.pipeline || "Pipeline",
      icon: TrendingUp,
      roles: ["agent"],
      accentVariant: "blue",
      items: [
        { icon: Users,     label: it.leads        || "Leads",        path: "/dashboard/leads",        badge: (b.new || "New") as BadgeVariant, activeKey: "leads" },
        { icon: Clock,     label: it.appointments || "Appointments", path: "/dashboard/appointments", badge: null,                             activeKey: "appointments" },
        { icon: GitBranch, label: it.referrals    || "Referrals",    path: "/dashboard/referrals",    badge: null,                             activeKey: "referrals" },
        { icon: Megaphone, label: it.promotions   || "Promotions",   path: "/dashboard/promotions",   badge: null,                             activeKey: "promotions" },
      ],
    },


    {
      label: g.finances || "Finances",
      icon: Wallet,
      roles: ["agent"],
      accentVariant: "emerald",
      items: [
        { icon: ReceiptText,     label: it.earningsOverview || "Earnings Overview", path: "/dashboard/earnings",       badge: null,                              activeKey: "earnings" },
        { icon: BadgeDollarSign, label: it.billing          || "Billing",           path: "/dashboard/billing",        badge: null,                              activeKey: "billing" },
        { icon: Star,            label: it.subscriptions    || "Subscription",       path: "/dashboard/subscriptions", badge: null,                              activeKey: "subscriptions" },
        { icon: Lightbulb,       label: it.aiPricingTool    || "AI Pricing Tool",   path: "/dashboard/pricing",       badge: (b.ai || "AI") as BadgeVariant,    activeKey: "pricing" },
        { icon: PieChart,        label: it.marketAnalytics  || "Market Analytics",  path: "/dashboard/analytics",     badge: null,                              activeKey: "analytics" },
      ],
    },

    {
      label: g.myActivity || "Communication",
      icon: MessageSquare,
      roles: ["agent"],
      accentVariant: "blue",
      items: [
        { icon: Bell, label: it.notifications || "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN — platform oversight
    // ══════════════════════════════════════════════════════════════════════════

    {
      label: g.home || "Home",
      icon: Home,
      roles: ["admin"],
      accentVariant: "blue",
      items: [
        { icon: BarChart3, label: it.dashboard || "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard" },
      ],
    },

    {
      label: g.reviewQueue || "Review Queue",
      icon: CheckSquare,
      roles: ["admin"],
      accentVariant: "red",
      items: [
        { icon: ShieldCheck,   label: it.studentIds        || "Student IDs",        path: "/dashboard/admin/students",   badge: (b.admin || "Admin") as BadgeVariant, activeKey: "admin-students" },
        { icon: Building2,     label: it.propertyApprovals || "Property Approvals", path: "/dashboard/admin/properties", badge: (b.admin || "Admin") as BadgeVariant, activeKey: "admin-properties" },
        { icon: AlertTriangle, label: it.reviewReports     || "Review Reports",      path: "/dashboard/admin/reports",   badge: (b.admin || "Admin") as BadgeVariant, activeKey: "admin-reports" },
      ],
    },

    {
      label: g.userManagement || "User Management",
      icon: UserCog,
      roles: ["admin"],
      accentVariant: "red",
      items: [
        { icon: Users,   label: it.allUsers         || "All Users",           path: "/dashboard/admin/users", badge: (b.admin || "Admin") as BadgeVariant, activeKey: "admin-users" },
        { icon: Sliders, label: it.rolesPermissions || "Roles & Permissions", path: "/dashboard/admin/roles", badge: null,                                 activeKey: "admin-roles" },
      ],
    },

    {
      label: g.platform || "Platform",
      icon: Database,
      roles: ["admin"],
      accentVariant: "red",
      items: [
        { icon: ServerCrash, label: it.systemHealth     || "System Health",     path: "/dashboard/admin/health",          badge: null, activeKey: "admin-health" },
        { icon: Settings,    label: it.platformSettings || "Platform Settings", path: "/dashboard/admin/system-settings", badge: null, activeKey: "admin-settings" },
        { icon: Wallet,      label: it.billingOverview  || "Billing Overview",  path: "/dashboard/admin/billing",         badge: null, activeKey: "admin-billing" },
      ],
    },

    {
      label: g.finances || "Revenue",
      icon: TrendingUp,
      roles: ["admin"],
      accentVariant: "red",
      items: [
        { icon: PieChart,    label: it.marketAnalytics  || "Platform Analytics", path: "/dashboard/analytics",     badge: null, activeKey: "analytics" },
        { icon: ReceiptText, label: it.earningsOverview || "Revenue Overview",   path: "/dashboard/earnings",      badge: null, activeKey: "earnings" },
      ],
    },

    {
      label: g.myActivity || "Communication",
      icon: MessageSquare,
      roles: ["admin"],
      accentVariant: "blue",
      items: [
        { icon: Bell, label: it.notifications || "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
      ],
    },

  ];
};

// ─── Accent helpers ───────────────────────────────────────────────────────────

const ACCENTS = {
  blue: {
    trigger:   "text-blue-700",
    iconBg:    "bg-blue-100 text-blue-600",
    dot:       "bg-blue-500",
    itemBg:    "bg-blue-50 text-blue-700",
    treeLine:  "border-blue-100",
    chevron:   "text-blue-400",
    quickBg:   "bg-blue-50",
    quickText: "text-blue-700",
    quickIcon: "text-blue-600",
  },
  purple: {
    trigger:   "text-purple-700",
    iconBg:    "bg-purple-100 text-purple-600",
    dot:       "bg-purple-500",
    itemBg:    "bg-purple-50 text-purple-700",
    treeLine:  "border-purple-100",
    chevron:   "text-purple-400",
    quickBg:   "bg-purple-50",
    quickText: "text-purple-700",
    quickIcon: "text-purple-600",
  },
  red: {
    trigger:   "text-red-700",
    iconBg:    "bg-red-100 text-red-600",
    dot:       "bg-red-500",
    itemBg:    "bg-red-50 text-red-700",
    treeLine:  "border-red-100",
    chevron:   "text-red-400",
    quickBg:   "bg-red-50",
    quickText: "text-red-700",
    quickIcon: "text-red-600",
  },
  emerald: {
    trigger:   "text-emerald-700",
    iconBg:    "bg-emerald-100 text-emerald-600",
    dot:       "bg-emerald-500",
    itemBg:    "bg-emerald-50 text-emerald-700",
    treeLine:  "border-emerald-100",
    chevron:   "text-emerald-400",
    quickBg:   "bg-emerald-50",
    quickText: "text-emerald-700",
    quickIcon: "text-emerald-600",
  },
} as const;

// Quick-action accent for the role primary colour
const roleAccent = (isAdmin: boolean, isStudent: boolean, isHost: boolean) =>
  isAdmin ? ACCENTS.red : isStudent ? ACCENTS.purple : isHost ? ACCENTS.emerald : ACCENTS.blue;

// ─── Component ────────────────────────────────────────────────────────────────

export const AppSidebar = () => {
  const pathname  = usePathname();
  const router    = useRouter();
  const { state } = useSidebar();
  const { user, logout, isLoading } = useAuth();
  const { isStudent, verificationStatus } = useStudentMode();
  const { language, t, dir } = useLanguage();
  const _t = t as any;

  const g  = _t.sidebar?.groups    || {};
  const it = _t.sidebar?.items     || {};
  const b  = _t.sidebar?.badges    || {};
  const bt = _t.sidebar?.bottom    || {};
  const qa = _t.sidebar?.quickActions || {};

  const isAgent    = user?.role === "agent";
  const isLandlord = user?.role === "landlord";
  const isHost     = user?.role === "host";
  const isAdmin    = user?.role === "admin";

  // Derive "regular" — not any of the named roles, not student
  const isRegular  = !isAgent && !isLandlord && !isHost && !isAdmin && !isStudent;

  const userRole: "regular" | "student" | "landlord" | "agent" | "admin" | "host" =
    isAdmin    ? "admin"    :
    isAgent    ? "agent"    :
    isLandlord ? "landlord" :
    isHost     ? "host"     :
    isStudent  ? "student"  :
    "regular";

  const isCollapsed = state === "collapsed";

  const [showLogout,       setShowLogout]       = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isLoggingOut,     setIsLoggingOut]     = useState(false);
  const [openGroups,       setOpenGroups]       = useState<Record<string, boolean>>({});
  const [hasLease,         setHasLease]         = useState(false);

  const logoutRef      = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // ── Lease check ────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      if ((isRegular || isStudent) && user) {
        try {
          const data = await apiClient.getMyLeaseInfo();
          if (data.leases?.length > 0) setHasLease(true);
        } catch { /* no lease */ }
      }
    };
    check();
  }, [isRegular, isStudent, user]);

  // ── Build & filter groups ──────────────────────────────────────────────────
  const allGroups = useMemo(
    () => buildGroups({ g, it, b }, hasLease),
    [g, it, b, hasLease]
  );

  const visibleGroups = useMemo(() => {
    return allGroups.filter(group => {
      // Role gate
      if (group.roles && !group.roles.includes(userRole)) return false;
      // Lease gate
      if (group.requiresLease && !hasLease) return false;
      // Student ID item: only show in My Lease for students
      return true;
    }).map(group => {
      // Strip Student ID item from My Lease for non-students
      if (group.label === (g.myLease || "My Lease") && !isStudent) {
        return {
          ...group,
          items: group.items.filter(i => i.activeKey !== "student-id"),
        };
      }
      return group;
    });
  }, [allGroups, userRole, hasLease, isStudent, g]);

  // ── Active helpers ─────────────────────────────────────────────────────────
  const isItemActive = (item: SidebarItem) => {
    if (item.path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.path.split("?")[0]);
  };

  // ── Open groups on mount / route change ───────────────────────────────────
  useEffect(() => {
    const init: Record<string, boolean> = {};
    visibleGroups.forEach(group => {
      if (group.items.some(item => isItemActive(item))) init[group.label] = true;
    });
    setOpenGroups(prev => ({ ...init, ...prev }));
  }, [pathname, visibleGroups]);

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  // ── Outside click ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(e.target as Node))
        setShowLogout(false);
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node))
        setQuickActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } catch { /* ignore */ } finally {
      setIsLoggingOut(false); setShowLogout(false);
    }
  };

  // ── Quick actions per role ─────────────────────────────────────────────────
  const quickActions = useMemo(() => {
    if (isAdmin)    return [
      { icon: CheckSquare,   label: qa.reviewQueue   || "Review Queue",   action: () => router.push("/dashboard/admin") },
      { icon: UserCog,       label: qa.manageUsers   || "Manage Users",   action: () => router.push("/dashboard/admin/users") },
      { icon: Activity,      label: qa.systemHealth  || "System Health",  action: () => router.push("/dashboard/admin/health") },
      { icon: AlertTriangle, label: qa.reviewReports || "Review Reports", action: () => router.push("/dashboard/admin/reports") },
    ];
    if (isAgent)    return [
      { icon: Plus,          label: qa.addProperty   || "Add Property",   action: () => router.push("/dashboard/propertyForm") },
      { icon: Users,         label: qa.viewLeads     || "View Leads",     action: () => router.push("/dashboard/leads") },
      { icon: MessageSquare, label: qa.newMessage    || "New Message",    action: () => router.push("/dashboard/inquiry") },
      { icon: BarChart3,     label: qa.viewAnalytics || "View Analytics", action: () => router.push("/dashboard/analytics") },
    ];
    if (isLandlord) return [
      { icon: Plus,          label: qa.addProperty    || "Add Property",    action: () => router.push("/dashboard/propertyForm") },
      { icon: KeyRound,      label: qa.manageTenants  || "Manage Tenants",  action: () => router.push("/dashboard/tenants") },
      { icon: Calendar,      label: qa.hostBookings   || "Host Bookings",   action: () => router.push("/dashboard/host/bookings") },
      { icon: Wallet,        label: qa.finances       || "Finances",        action: () => router.push("/dashboard/earnings") },
    ];
    if (isHost) return [
      { icon: Plus,          label: qa.addListing     || "Add Listing",     action: () => router.push("/dashboard/propertyForm") },
      { icon: Calendar,      label: qa.hostBookings   || "Host Bookings",   action: () => router.push("/dashboard/host/bookings") },
      { icon: Wallet,        label: qa.earnings       || "Earnings",        action: () => router.push("/dashboard/earnings") },
      { icon: BarChart3,     label: qa.viewAnalytics  || "View Analytics",  action: () => router.push("/dashboard/analytics") },
    ];
    if (isStudent)  return [
      { icon: Search,        label: qa.findHousing   || "Find Housing",   action: () => router.push("/students") },
      { icon: BedDouble,     label: qa.findRoommate  || "Find Roommate",  action: () => router.push("/students/roommates") },
      { icon: MessageSquare, label: qa.messages      || "Messages",       action: () => router.push("/dashboard/inquiry") },
      { icon: ShieldCheck,   label: qa.studentId     || "Student ID",     action: () => router.push("/dashboard/settings?tab=student-id") },
    ];
    return [
      { icon: Search,        label: qa.searchProperties || "Search Properties", action: () => router.push("/dashboard/saved-searches") },
      { icon: Heart,         label: qa.favorites        || "Favorites",         action: () => router.push("/dashboard/favorite") },
      { icon: MessageSquare, label: qa.messages         || "Messages",          action: () => router.push("/dashboard/inquiry") },
      { icon: Building2,     label: qa.findAgents       || "Find Agents",       action: () => router.push("/dashboard/agents") },
    ];
  }, [isAdmin, isAgent, isLandlord, isHost, isStudent, qa, router]);

  // ── Profile helpers ────────────────────────────────────────────────────────
  const displayName = user?.name || "User";
  const displayEmail = user?.email || user?.phoneNumber || "";
  const avatarUrl   = user?.profilePicture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  const getRoleBadge = () => {
    if (isAdmin)    return { icon: Shield,       text: b.admin      || "Admin",    bgColor: "bg-transparent", textColor: "text-red-700",     iconColor: "text-red-500" };
    if (isLandlord) return { icon: KeyRound,     text: b.landlord   || "Landlord", bgColor: "bg-emerald-50",  textColor: "text-emerald-700", iconColor: "text-emerald-500" };
    if (isAgent)    return { icon: BadgeCheck,   text: b.agent      || "Pro Agent",bgColor: "bg-blue-50",     textColor: "text-blue-700",   iconColor: "text-blue-500" };
    if (isHost)     return { icon: Home,         text: b.host       || "Host",     bgColor: "bg-emerald-50",  textColor: "text-emerald-700", iconColor: "text-emerald-500" };
    if (isStudent)  return {
      icon: GraduationCap,
      text: verificationStatus === "verified" ? (b.verifiedStudent || "Verified Student") : (b.student || "Student"),
      bgColor: "bg-purple-50", textColor: "text-purple-700", iconColor: "text-purple-500"
    };
    return null;
  };
  const roleBadge = getRoleBadge();

  const primaryAccent = roleAccent(isAdmin, isStudent, isHost);

  // ── Shared bottom items ────────────────────────────────────────────────────
  const sharedBottomItems: SidebarItem[] = useMemo(() => [
    { icon: Newspaper,  label: bt.newsUpdates  || "News & Updates", path: "/dashboard/news",     badge: null, activeKey: "news" },
    { icon: HelpCircle, label: bt.helpSupport  || "Help & Support", path: "/dashboard/support",  badge: null, activeKey: "support" },
    { icon: Settings,   label: bt.settings     || "Settings",       path: "/dashboard/settings", badge: null, activeKey: "settings" },
  ], [bt]);

  // ─────────────────────────────────────────────────────────────────────────
  // COLLAPSED SIDEBAR
  // ─────────────────────────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <Sidebar
        collapsible="icon"
        className="border-r border-border/50 bg-background/95 backdrop-blur-lg transition-all duration-300 ease-in-out"
      >
        <SidebarHeader className="border-b border-border/30 p-4">
          <Link href="/">
            <img src="/logoHoroHouseBleueMobile.png" alt="HoroHouse" className="h-12 w-auto mx-auto" />
          </Link>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto">
          {visibleGroups.map((group) => {
            const accent = ACCENTS[group.accentVariant || "blue"];
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.label}
                            className={cn(
                              "relative transition-all duration-300",
                              active && accent.itemBg
                            )}
                          >
                            <Link href={item.path} className="flex justify-center">
                              <group.icon className="w-5 h-5" />
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
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

  // ─────────────────────────────────────────────────────────────────────────
  // EXPANDED SIDEBAR
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/50 bg-background/95 backdrop-blur-lg transition-all duration-300 ease-in-out"
    >
      {/* ── Header ── */}
      <SidebarHeader className="border-b border-border/30 p-4">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Link href="/">
                <img
                  src="/logoHoroHouseBleueOrdinateur.png"
                  alt="HoroHouse"
                  className="h-10 w-auto object-contain max-w-[150px] transition-all duration-300"
                />
              </Link>
            </div>
            {roleBadge && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <roleBadge.icon className={cn("w-4 h-4 shrink-0", roleBadge.iconColor)} />
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap", roleBadge.bgColor, roleBadge.textColor)}>
                  {roleBadge.text}
                </span>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* ── Quick Actions ── */}
      <div className="px-4 py-3 border-b border-border/30" ref={quickActionsRef}>
        <div className="relative">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group/quick",
              primaryAccent.quickBg
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg transition-colors", primaryAccent.quickIcon)}>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className={cn("text-sm font-semibold", primaryAccent.quickText)}>
                {qa.title || "Quick Actions"}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              primaryAccent.quickIcon,
              quickActionsOpen && "rotate-180"
            )} />
          </button>

          {quickActionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-lg border border-border rounded-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 space-y-1">
              {quickActions.map((action, index) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-foreground rounded-lg transition-all duration-200 group/action hover:translate-x-1 cursor-pointer",
                    isAdmin    ? "hover:bg-red-50 hover:text-red-700" :
                    isStudent  ? "hover:bg-purple-50 hover:text-purple-700" :
                                 "hover:bg-blue-50 hover:text-blue-700"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    primaryAccent.quickBg
                  )}>
                    <action.icon className={cn("w-3.5 h-3.5", primaryAccent.quickIcon)} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Nav ── */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-1.5">
          {visibleGroups.map((group) => {
            const accent         = ACCENTS[group.accentVariant || "blue"];
            const isOpen         = openGroups[group.label] || false;
            const GroupIcon      = group.icon;
            const hasActiveChild = group.items.some(item => isItemActive(item));

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
                    hasActiveChild && !isOpen ? accent.trigger : "text-muted-foreground hover:text-foreground"
                  )}>
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors duration-200",
                      hasActiveChild
                        ? accent.iconBg
                        : "text-muted-foreground group-hover/trigger:text-foreground"
                    )}>
                      <GroupIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className={cn(
                      "flex-1 text-left text-sm font-semibold",
                      hasActiveChild ? accent.trigger : ""
                    )}>
                      {group.label}
                    </span>
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                      accent.chevron,
                      isOpen && "rotate-90"
                    )} />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-150">
                  <div className={cn("ml-[22px] mt-0.5 mb-1 pl-3 border-l", accent.treeLine)}>
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={cn(
                            "flex items-center justify-between gap-2 px-2.5 py-3 my-0.5 rounded-md text-sm transition-all duration-200 group/sub",
                            active
                              ? accent.itemBg
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200",
                              active ? accent.dot : "bg-border group-hover/sub:bg-muted-foreground/50"
                            )} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={cn(
                              "px-1.5 py-0.5 text-[10px] font-semibold rounded-full shrink-0 leading-none",
                              item.badge === "Admin"   ? "bg-red-100 text-red-700" :
                              item.badge === "Student" ? "bg-purple-100 text-purple-700" :
                              item.badge === "AI"      ? "bg-violet-100 text-violet-700" :
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

        {/* ── Bottom items ── */}
        <div className="px-3 py-3 border-t border-border/30 mt-auto">
          <div className="space-y-0.5">
            {sharedBottomItems.map((item) => {
              const active = isItemActive(item);
              const Icon   = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group/bottom",
                    active
                      ? "text-blue-700 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors duration-200",
                    active ? "bg-blue-100 text-blue-600" : "text-muted-foreground group-hover/bottom:text-foreground"
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