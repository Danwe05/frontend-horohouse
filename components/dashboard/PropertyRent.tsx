"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { TrendingUp, Home, Calendar, Lock, AlertTriangle, TrendingDown } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

// Utility functions
const getMonthName = (date: Date) => {
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']
  return months[date.getMonth()]
}

const getMonthLabel = (monthName: string) => {
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

const subtractMonths = (date: Date, months: number) => {
  const newDate = new Date(date)
  newDate.setMonth(newDate.getMonth() - months)
  return newDate
}

// Vibrant color palette
const chartConfig = {
  properties: { label: "Properties" },
  january: { label: "January", color: "#3b82f6" },
  february: { label: "February", color: "#8b5cf6" },
  march: { label: "March", color: "#ec4899" },
  april: { label: "April", color: "#f59e0b" },
  may: { label: "May", color: "#10b981" },
  june: { label: "June", color: "#06b6d4" },
  july: { label: "July", color: "#6366f1" },
  august: { label: "August", color: "#8b5cf6" },
  september: { label: "September", color: "#f43f5e" },
  october: { label: "October", color: "#f97316" },
  november: { label: "November", color: "#14b8a6" },
  december: { label: "December", color: "#0ea5e9" },
} satisfies ChartConfig

export function PropertyRentChart() {
  const id = "pie-interactive"

  // Use real auth context
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const isAgent = user?.role === 'agent' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  const [data, setData] = React.useState<Array<{ month: string; count: number; fill: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeMonth, setActiveMonth] = React.useState("")
  const [dateRange, setDateRange] = React.useState("")

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

    const fetchRentalProperties = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use apiClient instead of raw fetch
        let result;

        if (isAdmin) {
          // Admin sees all properties
          result = await apiClient.searchProperties({
            listingType: 'rent',
            limit: 1000,
            page: 1
          })
        } else {
          // Agent sees only their own properties
          result = await apiClient.getMyProperties({
            listingType: 'rent',
            limit: 1000,
            page: 1
          })
        }

        if (!mounted) return

        const monthsList = buildRecentMonths(6)
        const counts: Record<string, number> = {}
        monthsList.forEach((m) => (counts[m] = 0))

        const properties = result?.properties || result?.data || []

        properties.forEach((property: any) => {
          const created = property?.createdAt || property?.created_at || property?.publishedAt
          if (!created) return

          try {
            const date = new Date(created)
            if (isNaN(date.getTime())) return

            const monthKey = getMonthName(date)
            if (monthKey in counts) {
              counts[monthKey] = (counts[monthKey] || 0) + 1
            }
          } catch (e) {
            console.error('Error parsing date:', e)
          }
        })

        const chartData = monthsList.map((month) => {
          const config = chartConfig[month as keyof typeof chartConfig]
          return {
            month,
            count: counts[month] || 0,
            fill: (config && 'color' in config) ? config.color : '#3b82f6',
          }
        })

        setData(chartData)

        const firstMonthWithData = chartData.find(d => d.count > 0)
        setActiveMonth(firstMonthWithData?.month || chartData[0]?.month || '')

        const firstMonth = monthsList[0]
        const lastMonth = monthsList[monthsList.length - 1]
        const year = new Date().getFullYear()
        setDateRange(`${getMonthLabel(firstMonth)} - ${getMonthLabel(lastMonth)} ${year}`)

      } catch (err: any) {
        console.error('Failed to load rental properties:', err)
        if (!mounted) return
        setError(err?.response?.data?.message || err?.message || 'Failed to load rental properties')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchRentalProperties()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isAgent, isAdmin, authLoading])

  const activeIndex = React.useMemo(
    () => data.findIndex((item) => item.month === activeMonth),
    [data, activeMonth]
  )

  const months = React.useMemo(() => data.map((item) => item.month), [data])

  const totalProperties = React.useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data]
  )

  // Calculate trend
  const trend = React.useMemo(() => {
    if (data.length < 2) return null
    const lastMonth = data[data.length - 1]?.count || 0
    const previousMonth = data[data.length - 2]?.count || 0
    if (previousMonth === 0) return null
    const percentage = ((lastMonth - previousMonth) / previousMonth) * 100
    return {
      value: Math.abs(percentage).toFixed(1),
      isPositive: percentage >= 0
    }
  }, [data])

  // Loading state while auth is initializing
  if (authLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg pt-0">
        <div className="bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500 p-6 text-white">
          <CardHeader className="p-0">
            <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20" />
          </CardHeader>
        </div>
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
      <Card className="overflow-hidden border-0 shadow-lg pt-0">
        <div className="bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500 p-6 text-white">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl font-bold">Rental Properties</CardTitle>
            <CardDescription className="text-white/90">Analytics Dashboard</CardDescription>
          </CardHeader>
        </div>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-sm text-gray-600 text-center max-w-md mb-4">
            Please log in to view rental analytics.
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

  // Restricted Access View for Regular Users
  if (!isAgent) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg pt-0">
        <div className="bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500 p-6 text-white">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl font-bold">Rental Properties</CardTitle>
            <CardDescription className="text-white/90">Analytics Dashboard</CardDescription>
          </CardHeader>
        </div>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-sm text-gray-600 text-center max-w-md mb-2">
            Rental analytics are available for agents and administrators only.
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
                    {isAdmin ? 'Market Demand' : 'Rental Reach'}
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium">
                    {dateRange || 'Last 6 Months'}
                  </CardDescription>
                </div>
              </div>
            </div>

            {!loading && !error && data.length > 0 && (
              <Select value={activeMonth} onValueChange={setActiveMonth}>
                <SelectTrigger className="w-[120px] bg-slate-50 border-slate-200 text-slate-700 rounded-xl focus:ring-indigo-500/20">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                  {months.map((key) => {
                    const config = chartConfig[key as keyof typeof chartConfig]
                    if (!config || !('color' in config)) return null
                    return (
                      <SelectItem key={key} value={key} className="focus:bg-indigo-50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
      </div>

      <CardContent className="pt-8">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[320px]"
        >
          {loading ? (
            <div className="flex items-center justify-center w-full h-full relative">
              <Skeleton className="w-[220px] h-[220px] rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-[140px] h-[140px] rounded-full bg-background" />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
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
            <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Home className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">No Data Available</p>
              <p className="text-xs text-gray-500">
                {isAdmin
                  ? 'No rental properties found in the system'
                  : 'You haven\'t listed any properties for rent yet'}
              </p>
            </div>
          ) : (
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="month"
                innerRadius={80}
                outerRadius={115}
                strokeWidth={5}
                stroke="#fff"
                paddingAngle={2}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 22}
                      innerRadius={outerRadius + 14}
                    />
                  </g>
                )}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const value = data[activeIndex]?.count ?? 0
                      const monthLabel = data[activeIndex]?.month
                        ? getMonthLabel(data[activeIndex].month)
                        : ''

                      return (
                        <g>
                          <text
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 12}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              className="fill-slate-900 text-5xl font-black"
                            >
                              {value.toLocaleString()}
                            </tspan>
                          </text>
                          <text
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              className="fill-slate-400 text-[10px] font-bold uppercase tracking-widest"
                            >
                              Unit Volume
                            </tspan>
                          </text>
                          <text
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 45}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              className="fill-indigo-600 text-xs font-extrabold"
                            >
                              {monthLabel}
                            </tspan>
                          </text>
                        </g>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          )}
        </ChartContainer>

        {/* Reorganized Legend Grid */}
        {!loading && !error && data.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 bg-slate-50/50 p-6 -mx-6 rounded-b-3xl">
            {data.map((item) => {
              const config = chartConfig[item.month as keyof typeof chartConfig]
              const isActive = item.month === activeMonth
              const color = (config && 'color' in config) ? config.color : '#3b82f6'
              const percentage = totalProperties > 0 ? ((item.count / totalProperties) * 100).toFixed(0) : 0

              return (
                <button
                  key={item.month}
                  onClick={() => setActiveMonth(item.month)}
                  className={cn(
                    "flex flex-col p-3 rounded-2xl border transition-all text-left",
                    isActive
                      ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100"
                      : "bg-transparent border-transparent hover:bg-white/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                      {config?.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">{item.count}</span>
                    <span className="text-[10px] font-bold text-slate-400">{percentage}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}