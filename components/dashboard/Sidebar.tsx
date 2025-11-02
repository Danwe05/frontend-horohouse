"use client";

import { Home, Building2, BarChart3, Users, Settings, MessageSquare, ChevronDown, LogOut, Bell, Search, Plus, BadgeCheck, Sun, Moon, Zap, Heart, Clock, Lightbulb, Star, Calendar, TrendingUp, DollarSign, FileText, HelpCircle, Newspaper } from "lucide-react";
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
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import NotificationDropdown from "../notifications/NotificationDropdown";

// Regular User Menu Items
const regularUserItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard" },
  { icon: Search, label: "Search Properties", path: "/dashboard/search", badge: null, activeKey: "search" },
  { icon: Heart, label: "Favorite Properties", path: "/dashboard/favorite", badge: null, activeKey: "saved" },
  { icon: Clock, label: "Recently Viewed", path: "/dashboard/recent", badge: null, activeKey: "recent" },
  { icon: Lightbulb, label: "Recommended", path: "/dashboard/recommended", badge: "New", activeKey: "recommended" },
  { icon: Building2, label: "Explore Agents", path: "/dashboard/agents", badge: null, activeKey: "agents" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/inquiry", badge: null, activeKey: "inquiry" },
  { icon: Star, label: "My Reviews", path: "/dashboard/reviews", badge: null, activeKey: "reviews" },
  { icon: Users, label: "Refer & Earn", path: "/dashboard/referrals", badge: null, activeKey: "referrals" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
];

// Agent Menu Items
const agentItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard", badge: null, activeKey: "dashboard" },
  { icon: Building2, label: "My Properties", path: "/dashboard/property", badge: null, activeKey: "property" },
  { icon: Plus, label: "Add Property", path: "/dashboard/propertyForm", badge: null, activeKey: "propertyForm" },
  { icon: BarChart3, label: "Analytics & Insights", path: "/dashboard/analytics", badge: null, activeKey: "analytics" },
  { icon: TrendingUp, label: "AI Pricing Tool", path: "/dashboard/pricing", badge: "AI", activeKey: "pricing" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/inquiry", badge: null, activeKey: "inquiry" },
  { icon: Calendar, label: "Appointments", path: "/dashboard/appointments", badge: null, activeKey: "appointments" },
  { icon: Zap, label: "Promotions", path: "/dashboard/promotions", badge: null, activeKey: "promotions" },
  { icon: Star, label: "Reviews & Ratings", path: "/dashboard/reviews", badge: null, activeKey: "reviews" },
  { icon: Users, label: "Client Leads", path: "/dashboard/leads", badge: null, activeKey: "leads" },
  { icon: DollarSign, label: "Earnings", path: "/dashboard/earnings", badge: null, activeKey: "earnings" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications", badge: null, activeKey: "notifications" },
];

// Shared bottom items
const sharedBottomItems = [
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
  const logoutRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Determine which menu items to show based on user role
  const isAgent = user?.role === 'agent';
  const sidebarItems = isAgent ? agentItems : regularUserItems;



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Improved active menu detection
  const isItemActive = (item: typeof sidebarItems[0]) => {
    // Exact match for dashboard root
    if (item.path === "/dashboard") {
      return pathname === "/dashboard";
    }
    
    // For other routes, check if pathname starts with the item path
    // This handles both exact matches and sub-routes
    return pathname.startsWith(item.path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogout(false);
    }
  };

  const handleViewProfile = () => {
    setShowLogout(false);
    router.push('/dashboard/profile');
  };

  const handleAccountSettings = () => {
    setShowLogout(false);
    router.push('/dashboard/settings?tab=account');
  };


  // Quick actions based on user role
  const quickActions = isAgent ? [
    { icon: Plus, label: "Add Property", action: () => router.push('/dashboard/property/new') },
    { icon: Users, label: "View Leads", action: () => router.push('/dashboard/leads') },
    { icon: MessageSquare, label: "New Message", action: () => router.push('/dashboard/messages?compose=true') },
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

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90",
        "transition-all duration-300 ease-in-out",
        darkMode ? "dark bg-gray-900" : "bg-white"
      )}
    >
      <SidebarHeader className="border-b border-border/30 p-4">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Link href="/" className="block transition-transform duration-200">
                {isCollapsed ? (
                  <img
                    src="/logoHoroHouseBleueMobile.png"
                    alt="HoroHouse"
                    className="h-12 w-auto transition-all duration-300 object-contain max-w-[150px]"/>
                ) : (
                  <img
                    src="/logoHoroHouseBleueOrdinateur.png"
                    alt="HoroHouse"
                    className="h-10 w-auto transition-all duration-300 object-contain max-w-[150px]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl';
                      fallback.textContent = 'HH';
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                )}
              </Link>
            </div>
            {!isCollapsed && isAgent && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                  Pro Agent
                </span>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-border/30" ref={quickActionsRef}>
          <div className="relative">
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer",
                "bg-blue-50",
                "hover:from-blue-100 hover:to-indigo-100 transition-all duration-200",
                "group/quick shaddow-sm hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500 text-white group-hover/quick:bg-blue-600 transition-colors">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-blue-500">Quick Actions</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-blue-600 transition-transform duration-200",
                quickActionsOpen && "rotate-180"
              )} />
            </button>

            {quickActionsOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-lg border border-border rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 space-y-1">
                {quickActions.map((action, index) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-foreground hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group/action hover:translate-x-1 cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover/action:bg-blue-100 transition-colors">
                      <action.icon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup className="py-4">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {sidebarItems.map((item) => {
                const isActive = isItemActive(item);
                const isHovered = activeHover === item.path;
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      onMouseEnter={() => setActiveHover(item.path)}
                      onMouseLeave={() => setActiveHover(null)}
                      className={cn(
                        "relative transition-all duration-300 group/button overflow-hidden min-h-[48px] mb-1",
                        " hover:bg-blue-50",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold shadow-sfm border border-blue-50"
                          : "hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link href={item.path} className="flex items-center w-full">
                        {isActive && !isCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                        )}
                        
                        {isHovered && !isActive && (
                          <div className="absolute inset-0 bg-blue-50/30" />
                        )}
                        
                        <div className={cn(
                          "relative z-10 flex items-center w-full",
                          isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                        )}>
                          <div className={cn(
                            "rounded-xl transition-all duration-300 relative flex items-center justify-center flex-shrink-0",
                            isCollapsed ? "p-2.5" : "p-2",
                            isActive 
                              ? "bg-blue-600 text-white" 
                              : "bg-transparent text-muted-foreground group-hover/button:bg-blue-50 group-hover/button:text-blue-600"
                          )}>
                            <Icon className={cn(
                              "transition-all duration-300 flex-shrink-0",
                              isCollapsed ? "w-5 h-5" : "w-4 h-4"
                            )} />
                          </div>
                          
                          {!isCollapsed && (
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <span className="text-sm font-medium truncate transition-all duration-300">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className={cn(
                                  "px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0",
                                  item.badge === "New" || item.badge === "AI"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                )}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Shared Bottom Items */}
        <SidebarGroup className="py-4 border-t border-border/30 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {sharedBottomItems.map((item) => {
                const isActive = isItemActive(item);
                const isHovered = activeHover === item.path;
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      onMouseEnter={() => setActiveHover(item.path)}
                      onMouseLeave={() => setActiveHover(null)}
                      className={cn(
                        "relative transition-all duration-300 group/button overflow-hidden min-h-[48px]",
                        "hover:scale-[0.98] active:scale-[0.96] hover:shadow-sm",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 font-semibold shadow-sm border border-blue-200/50"
                          : "hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link href={item.path} className="flex items-center w-full">
                        {isActive && !isCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                        )}
                        
                        <div className={cn(
                          "relative z-10 flex items-center w-full",
                          isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                        )}>
                          <div className={cn(
                            "rounded-xl transition-all duration-300 relative flex items-center justify-center flex-shrink-0",
                            isCollapsed ? "p-2.5" : "p-2 group-hover/button:scale-110",
                            isActive 
                              ? "bg-blue-600 text-white" 
                              : "bg-transparent text-muted-foreground group-hover/button:bg-blue-50 group-hover/button:text-blue-600"
                          )}>
                            <Icon className={cn(
                              "transition-all duration-300 flex-shrink-0",
                              isCollapsed ? "w-5 h-5" : "w-4 h-4"
                            )} />
                          </div>
                          
                          {!isCollapsed && (
                            <span className="text-sm font-medium truncate transition-all duration-300">
                              {item.label}
                            </span>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 p-4 space-y-2">
        {!isLoading && user && (
          <div className="relative group" ref={logoutRef}>
            <div
              onClick={() => setShowLogout(!showLogout)}
              className={cn(
                "w-full flex items-center p-2 rounded-xl transition-all duration-300 group/button cursor-pointer",
                "hover:bg-muted/40 hover:shadow-sm border border-transparent hover:border-border/50",
                showLogout && "bg-muted/40 border-border/50",
                isCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "rounded-xl bg-blue-100 overflow-hidden ring-2 ring-blue-200 group-hover/button:ring-blue-300 transition-all duration-300",
                  isCollapsed ? "w-9 h-9" : "w-10 h-10"
                )}>
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover transition-transform group-hover/button:scale-110 duration-300"
                  />
                </div>
                {(user.emailVerified || user.phoneVerified) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col min-w-0 text-left flex-1">
                    <span className="text-sm font-semibold truncate text-foreground transition-colors duration-200">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate transition-colors duration-200">
                      {displayEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <NotificationDropdown/>
                  </div>
                </>
              )}
            </div>

            {showLogout && !isCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover backdrop-blur-lg border border-border rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-300 z-50">
                <div className="space-y-1">
                  <button
                    onClick={handleViewProfile}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-foreground hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group/item hover:translate-x-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover/item:bg-blue-100 transition-colors">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">View Profile</span>
                  </button>
                  <button
                    onClick={handleAccountSettings}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-foreground hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group/item hover:translate-x-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover/item:bg-blue-100 transition-colors">
                      <Settings className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Account Settings</span>
                  </button>
                  <div className="border-t border-border/30 my-1" />
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-foreground hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 group/item hover:translate-x-1",
                      isLoggingOut && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover/item:bg-red-100 transition-colors">
                      <LogOut className="w-3.5 h-3.5 text-red-600 group-hover/item:text-red-700" />
                    </div>
                    <span className="text-sm font-medium">
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};