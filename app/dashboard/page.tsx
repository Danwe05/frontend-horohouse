"use client";

import { AppSidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import WelcomeHorohouse from "@/components/dashboard/WelcomeHoroHouse";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AgentRole from "./roles/AgentRole";
import UserRole from "./roles/UserRole";
import AdminRole from "./roles/AdminRole";
import LandlordRole from "./roles/LandlordRole";
import HistoryDashboard from '@/components/dashboard/HistoryDashboard';

// Import custom hooks
import { useUserRole } from "@/hooks/useUserRole";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardProperties } from "@/hooks/useDashboardProperties";
import { useStatsCardConfig } from "@/hooks/useStatsCardConfig";
import { PropertyRentChart } from "@/components/dashboard/PropertyRent";
import { PropertySaleChart } from "@/components/dashboard/PropertySold";
import { PropertyPriceTrends } from "@/components/dashboard/PropertyPriceTrends";
import { UpcomingTours } from "@/components/dashboard/UpcomingTours";
import TransactionList from "@/components/dashboard/transactions";
import { RentalIncomeChart } from "@/components/dashboard/RentalIncomeChart";
import { OccupancyRateChart } from "@/components/dashboard/OccupancyRateChart";
import { MyLeaseCard } from "@/components/dashboard/MyLeaseCard";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";
import { BookingSummaryWidget } from "@/components/dashboard/BookingSummaryWidget";

const Index = () => {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("recent");

  // Use custom hooks for cleaner logic
  const { role, isAgent, isAdmin, isAgentOnly, isLandlord, isLandlordOnly } = useUserRole();
  const { stats, statsTrend, loading: loadingStats } = useDashboardStats(role);
  const {
    properties,
    loading: loadingProperties,
    refetch: handlePropertyUpdate
  } = useDashboardProperties(isAgent, sortBy);

  // Fetch lease info for regular users
  const [leaseInfo, setLeaseInfo] = useState<any>(null);
  const [loadingLease, setLoadingLease] = useState(true);

  useEffect(() => {
    const fetchLease = async () => {
      try {
        if (!isAgentOnly && !isAdmin && !isLandlordOnly) {
          const data = await apiClient.getMyLeaseInfo();
          if (data.leases && data.leases.length > 0) {
            setLeaseInfo(data.leases[0]); // Show the first active lease
          }
        }
      } catch (error) {
        console.error("Failed to fetch lease info:", error);
      } finally {
        setLoadingLease(false);
      }
    };

    fetchLease();
  }, [isAgentOnly, isAdmin, isLandlordOnly]);

  // Get stats card configuration based on role
  const statsCards = useStatsCardConfig(role, stats, statsTrend);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="flex-1 bg-gray-50">
            <div className="lg:p-6 space-y-6 p-4">
              {/* Welcome Section */}
              <WelcomeHorohouse />

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingStats ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                  ))
                ) : (
                  statsCards.map((card, index) => (
                    <StatsCard key={index} {...card} />
                  ))
                )}
              </div>

              {/* Charts Section - 2 Column Grid (Role-based) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isAgentOnly || isAdmin ? (
                  <>
                    <PropertySaleChart />
                    <PropertyRentChart />
                  </>
                ) : isLandlordOnly ? (
                  <>
                    <RentalIncomeChart />
                    <OccupancyRateChart />
                  </>
                ) : (
                  <>
                    {leaseInfo && (
                      <div className="lg:col-span-2 mb-2">
                        <MyLeaseCard lease={leaseInfo} />
                      </div>
                    )}
                    <PropertyPriceTrends />
                    <UpcomingTours />
                  </>
                )}
              </div>

              {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="lg:col-span-1 space-y-6">
                  <BookingSummaryWidget role="host" title="Recent Booking Requests" limit={4} />
                  {/* Add more widgets as needed */}
                {/* </div>
                <div className="lg:col-span-1">
                  <TransactionList />
                </div> */}
              {/* </div> */}
              {/* History Dashboard - Full Width */}


              {/* Property Listings - Role-based components */}
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
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;