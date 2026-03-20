"use client";

import { AppSidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import WelcomeHorohouse from "@/components/dashboard/WelcomeHoroHouse";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AgentRole from "./roles/AgentRole";
import UserRole from "./roles/UserRole";
import AdminRole from "./roles/AdminRole";
import LandlordRole from "./roles/LandlordRole";
import StudentRole from "./roles/StudentRole";

import { useUserRole } from "@/hooks/useUserRole";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardProperties } from "@/hooks/useDashboardProperties";
import { useStatsCardConfig } from "@/hooks/useStatsCardConfig";

// ── Charts — all role-aware internally, safe to render for every role ─────────
import { PropertyRentChart } from "@/components/dashboard/PropertyRent";
import { PropertySaleChart } from "@/components/dashboard/PropertySold";
import { RentalIncomeChart } from "@/components/dashboard/RentalIncomeChart";
import { OccupancyRateChart } from "@/components/dashboard/OccupancyRateChart";

// ── Other dashboard widgets ───────────────────────────────────────────────────
import { PropertyPriceTrends } from "@/components/dashboard/PropertyPriceTrends";
import { UpcomingTours } from "@/components/dashboard/UpcomingTours";
import TransactionList from "@/components/dashboard/transactions";
import { MyLeaseCard } from "@/components/dashboard/MyLeaseCard";
import { apiClient } from "@/lib/api";

const Index = () => {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("recent");

  const {
    role,
    isAgent,
    isAdmin,
    isAgentOnly,
    isLandlord,
    isLandlordOnly,
    isStudent,
  } = useUserRole();

  const { stats, statsTrend, loading: loadingStats } = useDashboardStats(role);
  const {
    properties,
    loading: loadingProperties,
    refetch: handlePropertyUpdate,
  } = useDashboardProperties(isAgent, sortBy);

  // Fetch lease info — only for regular users (not agent-only, admin, landlord-only, student)
  const [leaseInfo, setLeaseInfo] = useState<any>(null);

  useEffect(() => {
    const fetchLease = async () => {
      if (isAgentOnly || isAdmin || isLandlordOnly || isStudent) return;
      try {
        const data = await apiClient.getMyLeaseInfo();
        if (data?.leases?.length > 0) {
          setLeaseInfo(data.leases[0]);
        }
      } catch {
        // non-critical — lease card is optional
      }
    };
    fetchLease();
  }, [isAgentOnly, isAdmin, isLandlordOnly, isStudent]);

  const statsCards = useStatsCardConfig(role, stats, statsTrend);

  // ── Auth loading spinner ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Student — completely separate layout ───────────────────────────────────
  if (isStudent) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <main className="flex-1 bg-gray-50">
              <div className="lg:p-6 space-y-6 p-4">
                <WelcomeHorohouse />
                <StudentRole router={router} />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // ── Chart section — which pair to show per role ─────────────────────────────
  //
  // Admin / Agent  → booking performance (PropertySaleChart) + type breakdown (PropertyRentChart)
  // Landlord       → income (RentalIncomeChart) + occupancy (OccupancyRateChart)
  // User (default) → lease card (if any) + price trends + upcoming tours
  //                  BUT also show RentalIncomeChart (spend) + OccupancyRateChart (engagement)
  //                  in a second row below so users see their activity too
  //
  const showAdminAgentCharts = isAgentOnly || isAdmin;
  const showLandlordCharts   = isLandlordOnly;
  const showUserCharts       = !showAdminAgentCharts && !showLandlordCharts;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="flex-1 bg-gray-50">
            <div className="lg:p-6 space-y-6 p-4">

              {/* Welcome */}
              <WelcomeHorohouse />

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingStats
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))
                  : statsCards.map((card, index) => (
                      <StatsCard key={index} {...card} />
                    ))}
              </div>

              {/* ── Charts ──────────────────────────────────────────────────── */}

              {/* Admin / Agent: booking volume + property-type demand */}
              {showAdminAgentCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PropertySaleChart />
                  <PropertyRentChart />
                </div>
              )}

              {/* Landlord: rental income (collected vs expected) + occupancy */}
              {showLandlordCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RentalIncomeChart />
                  <OccupancyRateChart />
                </div>
              )}

              {/* User: lease card + price trends + tours */}
              {showUserCharts && (
                <>
                  {leaseInfo && (
                    <div>
                      <MyLeaseCard lease={leaseInfo} />
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PropertyPriceTrends />
                    <UpcomingTours />
                  </div>
                  {/* User activity charts: booking spend + engagement */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RentalIncomeChart />
                    <OccupancyRateChart />
                  </div>
                </>
              )}

              {/* ── Property Listings ────────────────────────────────────────── */}
              <div>
                {isAdmin ? (
                  <AdminRole
                    properties={properties}
                    loadingProperties={loadingProperties}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    handlePropertyUpdate={handlePropertyUpdate}
                    router={router}
                  />
                ) : isAgentOnly ? (
                  <AgentRole
                    properties={properties}
                    loadingProperties={loadingProperties}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    handlePropertyUpdate={handlePropertyUpdate}
                    router={router}
                  />
                ) : (
                  <UserRole
                    properties={properties}
                    loadingProperties={loadingProperties}
                    handlePropertyUpdate={handlePropertyUpdate}
                    router={router}
                  />
                )}
              </div>

              {/* Transactions — all roles */}
              <TransactionList />

            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;