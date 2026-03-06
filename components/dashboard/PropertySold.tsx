"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Home, CheckCircle, Lock } from "lucide-react"
import { Bar, CartesianGrid, XAxis, YAxis, Cell, Area, ComposedChart } from "recharts"
import { cn } from "@/lib/utils"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Utility functions
const getMonthName = (date: Date) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return months[date.getMonth()]
}

const subtractMonths = (date: Date, months: number) => {
  const newDate = new Date(date)
  newDate.setMonth(newDate.getMonth() - months)
  return newDate
}

const chartConfig = {
  sale: {
    label: "For Sale",
    color: "#3b82f6",
  },
  sold: {
    label: "Sold",
    color: "#10b981",
  },
} satisfies ChartConfig

export function PropertySaleChart() {
  // Use real auth context
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const isAgent = user?.role === 'agent' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  const [data, setData] = React.useState<Array<{ month: string; sale: number; sold: number }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dateRange, setDateRange] = React.useState("")
  const [trend, setTrend] = React.useState<{ percentage: number; isPositive: boolean }>({
    percentage: 0,
    isPositive: true
  })

  const buildRecentMonths = (count = 6) => {
    const now = new Date()
    return Array.from({ length: count }).map((_, i) =>
      getMonthName(subtractMonths(now, count - 1 - i))
    )
  }

  React.useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }

    // Only fetch if user has permission
    if (!isAuthenticated || !isAgent) {
      setLoading(false)
      return
    }

    let mounted = true

    const fetchSaleProperties = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use apiClient instead of raw fetch - it handles auth automatically
        let result;

        if (isAdmin) {
          // Admin sees all properties
          result = await apiClient.searchProperties({
            listingType: 'sale',
            limit: 1000,
            page: 1
          })
        } else {
          // Agent sees only their own properties
          result = await apiClient.getMyProperties({
            listingType: 'sale',
            limit: 1000,
            page: 1
          })
        }

        if (!mounted) return

        const monthsList = buildRecentMonths(6)
        const saleCounts: Record<string, number> = {}
        const soldCounts: Record<string, number> = {}
        monthsList.forEach((m) => {
          saleCounts[m] = 0
          soldCounts[m] = 0
        })

        const properties = result?.properties || result?.data || []

        properties.forEach((property: any) => {
          const created = property?.createdAt || property?.created_at || property?.publishedAt
          if (!created) return

          try {
            const date = new Date(created)
            if (isNaN(date.getTime())) return

            const monthKey = getMonthName(date)
            if (monthKey in saleCounts) {
              const isSold = property?.status === 'sold' || property?.availability === 'sold'

              if (isSold) {
                soldCounts[monthKey] = (soldCounts[monthKey] || 0) + 1
              } else {
                saleCounts[monthKey] = (saleCounts[monthKey] || 0) + 1
              }
            }
          } catch (e) {
            console.error('Error parsing date:', e)
          }
        })

        const chartData = monthsList.map((month) => ({
          month,
          sale: saleCounts[month] || 0,
          sold: soldCounts[month] || 0,
        }))

        setData(chartData)

        if (chartData.length >= 2) {
          const lastMonth = chartData[chartData.length - 1]
          const previousMonth = chartData[chartData.length - 2]

          const lastTotal = lastMonth.sale + lastMonth.sold
          const previousTotal = previousMonth.sale + previousMonth.sold

          if (previousTotal > 0) {
            const percentageChange = ((lastTotal - previousTotal) / previousTotal) * 100
            setTrend({
              percentage: Math.abs(Math.round(percentageChange * 10) / 10),
              isPositive: percentageChange >= 0
            })
          }
        }

        const firstMonth = monthsList[0]
        const lastMonth = monthsList[monthsList.length - 1]
        const year = new Date().getFullYear()
        setDateRange(`${firstMonth} - ${lastMonth} ${year}`)

      } catch (err: any) {
        console.error('Failed to load sale properties:', err)
        if (!mounted) return
        setError(err?.response?.data?.message || err?.message || 'Failed to load sale properties')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchSaleProperties()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isAgent, isAdmin, authLoading])

  const totalSale = React.useMemo(
    () => data.reduce((sum, item) => sum + item.sale, 0),
    [data]
  )

  const totalSold = React.useMemo(
    () => data.reduce((sum, item) => sum + item.sold, 0),
    [data]
  )

  const totalProperties = totalSale + totalSold

  // Loading state while auth is initializing
  if (authLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="overflow-hidden border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sale Properties</CardTitle>
          <CardDescription>Analytics Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-sm text-gray-600 text-center max-w-md mb-4">
            Please log in to view sale analytics.
          </p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </CardContent>
      </Card>
    )
  }

  // Restricted Access View for Regular Users (not agents/admins)
  if (!isAgent) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sale Properties</CardTitle>
          <CardDescription>Analytics Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-sm text-gray-600 text-center max-w-md mb-2">
            Sale analytics are available for agents and administrators only.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Current role: <span className="font-semibold">{user?.role || 'user'}</span>
          </p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Us to Upgrade
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg pb-0 bg-white">
      {/* Simplified Professional Header */}
      <div className="p-6 border-b border-slate-100">

        <CardHeader className="p-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {isAdmin ? 'Platform Sales' : 'My Performance'}
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium">
                    {dateRange || 'Last 6 Months'}
                  </CardDescription>
                </div>
              </div>
            </div>

            {!loading && !error && totalProperties > 0 && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border",
                trend.isPositive
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              )}>
                {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span className="text-xs font-bold">{trend.isPositive ? '+' : '-'}{trend.percentage}%</span>
              </div>
            )}
          </div>
        </CardHeader>
      </div>

      <CardContent className="pt-8">
        {loading ? (
          <div className="h-[300px] w-full flex flex-col justify-end gap-2">
            <div className="flex items-end justify-between h-full gap-2 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full flex flex-col gap-1 items-center">
                  <Skeleton className="w-full h-[60%] rounded-t-md" />
                  <Skeleton className="w-full h-[30%] rounded-t-md opacity-60" />
                  <Skeleton className="h-4 w-12 mt-2" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Error Loading Data</p>
            <p className="text-xs text-gray-500 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 || totalProperties === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">No Data Available</p>
            <p className="text-xs text-gray-500">
              {isAdmin
                ? 'No sale properties found in the system'
                : 'You haven\'t listed any properties for sale yet'}
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <ComposedChart accessibilityLayer data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-[11px] font-bold text-slate-400"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-[11px] text-slate-400"
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(241, 149, 149, 0.05)' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Area
                type="monotone"
                dataKey="sale"
                name="Listed"
                fill="#3b82f615"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Bar
                dataKey="sold"
                name="Completed"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={32}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-sold-${index}`} className="hover:opacity-80 transition-opacity" />
                ))}
              </Bar>
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>

      {!loading && !error && totalProperties > 0 && (
        <CardFooter className="flex-col items-start gap-4 text-sm border-t border-slate-100 bg-slate-50/50 p-6">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl border",
                trend.isPositive ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {trend.isPositive ? 'Sales Growth' : 'Market Cooling'}
                </p>
                <p className="text-xs text-slate-500">
                  {trend.isPositive ? 'Volume increased' : 'Volume decreased'} by <span className="font-bold text-slate-700">{trend.percentage}%</span> since last month
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
              <div className="flex items-center gap-2 text-indigo-600">
                <span className="text-xl font-extrabold">{totalProperties > 0 ? ((totalSold / totalProperties) * 100).toFixed(1) : 0}%</span>
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                <span className="text-xs font-bold text-slate-500">Active Listings</span>
              </div>
              <span className="text-xl font-bold text-slate-900 ml-4.5">{totalSale}</span>
            </div>
            <div className="flex flex-col border-l border-slate-100 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                <span className="text-xs font-bold text-slate-500">Closed Sales</span>
              </div>
              <span className="text-xl font-bold text-slate-900 ml-4.5">{totalSold}</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}