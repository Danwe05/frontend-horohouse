"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { Building2, AlertTriangle, RefreshCw, Target } from "lucide-react"
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface SliceRow { name: string; value: number; fill: string }
interface LegendItem {
  label: string; value: number | string
  color: string; bg: string; text: string
}
interface RoleData {
  slices: SliceRow[]
  centerRate: number
  centerLabel: string
  subtitle: string
  legend: LegendItem[]
}

const chartConfig = {
  properties: { label: "Properties" },
  a: { label: "A", color: "#10b981" },
  b: { label: "B", color: "#f59e0b" },
  c: { label: "C", color: "#8b5cf6" },
} satisfies ChartConfig

function buildDateRange(months = 3) {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  }
}

// ─── Per-role fetchers ────────────────────────────────────────────────────────

/** ADMIN: real occupancy from /analytics/admin/occupancy */
async function fetchAdminData(): Promise<RoleData> {
  const { startDate, endDate } = buildDateRange(3)
  const points: any[] = await apiClient.request({
    method: "GET",
    url: "/analytics/admin/occupancy",
    params: { startDate, endDate, granularity: "month" },
  })

  if (!Array.isArray(points) || points.length === 0) {
    return emptyData("Occupancy Rate", "No short-term data")
  }

  const totalBooked = points.reduce((s, p) => s + (p.nightsBooked ?? 0), 0)
  const totalAvailable = points.reduce((s, p) => s + (p.nightsAvailable ?? 0), 0)
  const propertyCount = points[points.length - 1]?.propertyCount ?? 0
  const rate = totalAvailable > 0
    ? Math.min(100, Math.round((totalBooked / totalAvailable) * 100))
    : 0
  const vacant = Math.max(0, totalAvailable - totalBooked)

  return {
    centerRate: rate, centerLabel: "Occupancy",
    subtitle: `${propertyCount} active short-term ${propertyCount === 1 ? "property" : "properties"} · last 3 months`,
    slices: [
      ...(totalBooked > 0 ? [{ name: "a", value: totalBooked, fill: "#10b981" }] : []),
      ...(vacant > 0 ? [{ name: "b", value: vacant, fill: "#f59e0b" }] : []),
    ],
    legend: [
      { label: "Booked", value: totalBooked, color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700" },
      { label: "Available", value: totalAvailable, color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700" },
      { label: "Properties", value: propertyCount, color: "#6366f1", bg: "bg-indigo-50", text: "text-indigo-700" },
    ],
  }
}

/** LANDLORD: combine short-term bookings occupancy + long-term tenant occupancy */
async function fetchLandlordData(): Promise<RoleData> {
  const [propertiesRes, tenantsRes, hostBookingsRes] = await Promise.all([
    apiClient.request({ method: 'GET', url: '/properties/my/properties', params: { limit: 100, page: 1 } }).catch(() => null),
    apiClient.getMyTenants().catch(() => null),
    apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } }).catch(() => null),
  ])

  const properties: any[] = propertiesRes?.properties ?? propertiesRes?.data ?? []
  const tenants: any[] = tenantsRes?.tenants ?? tenantsRes?.data ?? tenantsRes ?? []
  const bookings: any[] = hostBookingsRes?.bookings ?? hostBookingsRes?.data ?? []

  // Short-term properties
  const shortTerm = properties.filter((p) =>
    p.listingType === "short_term" || p.type === "short_term"
  )
  // Long-term properties (everything else)
  const longTerm = properties.filter((p) =>
    p.listingType !== "short_term" && p.type !== "short_term"
  )

  // Short-term: occupied = has an active confirmed booking today
  const today = new Date()
  const shortTermOccupied = shortTerm.filter((p) =>
    bookings.some((b) =>
      b.propertyId?._id === p._id || b.propertyId === p._id
        ? ["confirmed", "completed"].includes(b.status) &&
        new Date(b.checkIn) <= today && new Date(b.checkOut) >= today
        : false
    )
  ).length
  const shortTermVacant = Math.max(0, shortTerm.length - shortTermOccupied)

  // Long-term: occupied = has an active tenant
  const activeTenants = tenants.filter((t: any) => t.status === "active").length
  const longTermOccupied = Math.min(activeTenants, longTerm.length)
  const longTermVacant = Math.max(0, longTerm.length - longTermOccupied)

  const totalProperties = properties.length
  const totalOccupied = shortTermOccupied + longTermOccupied
  const rate = totalProperties > 0
    ? Math.round((totalOccupied / totalProperties) * 100)
    : 0

  return {
    centerRate: rate, centerLabel: "Occupied",
    subtitle: `${totalProperties} total properties (${shortTerm.length} short-term, ${longTerm.length} long-term)`,
    slices: [
      ...(shortTermOccupied > 0 ? [{ name: "a", value: shortTermOccupied, fill: "#10b981" }] : []),
      ...(longTermOccupied > 0 ? [{ name: "b", value: longTermOccupied, fill: "#6366f1" }] : []),
      ...(shortTermVacant + longTermVacant > 0
        ? [{ name: "c", value: shortTermVacant + longTermVacant, fill: "#f59e0b" }]
        : []),
    ],
    legend: [
      { label: "Short-term occ.", value: shortTermOccupied, color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700" },
      { label: "Long-term occ.", value: longTermOccupied, color: "#6366f1", bg: "bg-indigo-50", text: "text-indigo-700" },
      { label: "Vacant", value: shortTermVacant + longTermVacant, color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700" },
    ],
  }
}

/** AGENT: booking conversion funnel — pending → confirmed → completed */
async function fetchAgentData(): Promise<RoleData> {
  const res = await apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } })
  const bookings: any[] = res?.bookings ?? res?.data ?? []

  const confirmed = bookings.filter((b) => b.status === "confirmed").length
  const completed = bookings.filter((b) => b.status === "completed").length
  const cancelled = bookings.filter((b) => b.status === "cancelled").length
  const pending = bookings.filter((b) => b.status === "pending").length
  const total = bookings.length
  const convRate = total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0

  return {
    centerRate: convRate, centerLabel: "Conversion",
    subtitle: `${total} bookings on your listings`,
    slices: [
      ...(completed > 0 ? [{ name: "a", value: completed, fill: "#10b981" }] : []),
      ...(confirmed > 0 ? [{ name: "b", value: confirmed, fill: "#3b82f6" }] : []),
      ...(pending > 0 ? [{ name: "c", value: pending, fill: "#f59e0b" }] : []),
      ...(cancelled > 0 ? [{ name: "c", value: cancelled, fill: "#f43f5e" }] : []),
    ],
    legend: [
      { label: "Completed", value: completed, color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700" },
      { label: "Confirmed", value: confirmed, color: "#3b82f6", bg: "bg-blue-50", text: "text-blue-700" },
      { label: "Pending", value: pending, color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700" },
    ],
  }
}

/** USER: inquiry funnel — sent → responded → closed */
async function fetchUserData(): Promise<RoleData> {
  const [inquiriesRes, bookingsRes] = await Promise.all([
    apiClient.request({ method: 'GET', url: '/inquiries', params: { limit: 100, page: 1 } }).catch(() => null),
    apiClient.request({ method: 'GET', url: '/bookings/my', params: { limit: 100, page: 1 } }).catch(() => null),
  ])

  const inquiries: any[] = inquiriesRes?.inquiries ?? inquiriesRes?.data ?? inquiriesRes ?? []
  const bookings: any[] = bookingsRes?.bookings ?? bookingsRes?.data ?? []

  const pending = inquiries.filter((i) => i.status === "pending").length
  const responded = inquiries.filter((i) => i.status === "responded").length
  const closed = inquiries.filter((i) => i.status === "closed").length
  const confirmedB = bookings.filter((b) => ["confirmed", "completed"].includes(b.status)).length
  const total = inquiries.length + bookings.length
  const engRate = total > 0
    ? Math.round(((responded + closed + confirmedB) / total) * 100)
    : 0

  return {
    centerRate: engRate, centerLabel: "Engaged",
    subtitle: `${inquiries.length} inquiries · ${bookings.length} bookings`,
    slices: [
      ...(confirmedB > 0 ? [{ name: "a", value: confirmedB, fill: "#10b981" }] : []),
      ...(responded > 0 ? [{ name: "b", value: responded, fill: "#3b82f6" }] : []),
      ...(pending > 0 ? [{ name: "c", value: pending, fill: "#f59e0b" }] : []),
    ],
    legend: [
      { label: "Bookings", value: confirmedB, color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700" },
      { label: "Responded", value: responded, color: "#3b82f6", bg: "bg-blue-50", text: "text-blue-700" },
      { label: "Pending inq", value: pending, color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700" },
    ],
  }
}

function emptyData(label: string, sub: string): RoleData {
  return {
    centerRate: 0, centerLabel: label, subtitle: sub,
    slices: [{ name: "b", value: 1, fill: "#e2e8f0" }],
    legend: [],
  }
}

// ─── Chart titles per role ────────────────────────────────────────────────────
const ROLE_TITLE: Record<string, string> = {
  admin: "Occupancy Rate",
  landlord: "Portfolio Occupancy",
  agent: "Booking Conversion",
  user: "Engagement Rate",
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OccupancyRateChart() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [data, setData] = React.useState<RoleData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      let result: RoleData
      if (role === "admin") result = await fetchAdminData()
      else if (role === "landlord") result = await fetchLandlordData()
      else if (role === "agent") result = await fetchAgentData()
      else result = await fetchUserData()
      setData(result)
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? "Failed to load data"
      setError(Array.isArray(raw) ? (raw[0]?.constraints ? Object.values(raw[0].constraints)[0] as string : "Validation error") : String(raw))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role])

  React.useEffect(() => { if (!authLoading) fetchData() }, [authLoading, fetchData])

  const title = ROLE_TITLE[role] ?? "Activity"

  // ── Loading ────────────────────────────────────────────────────────────
  if (authLoading || loading) return (
    <Card className="overflow-hidden border-0 -lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-52" />
      </div>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <Skeleton className="w-[200px] h-[200px] rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-[120px] h-[120px] rounded-full bg-white" />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) return (
    <Card className="overflow-hidden border-0 -lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
      </div>
      <CardContent className="flex flex-col items-center justify-center h-[280px] text-center p-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">Failed to load data</p>
        <p className="text-xs text-gray-400 mb-4">{error}</p>
        <button onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </CardContent>
    </Card>
  )

  // ── Empty ──────────────────────────────────────────────────────────────
  if (!data || (data.legend.length === 0 && data.centerRate === 0)) return (
    <Card className="overflow-hidden border-0 -lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
        <CardDescription className="text-slate-500">Nothing to display yet</CardDescription>
      </div>
      <CardContent className="flex flex-col items-center justify-center h-[280px] text-center p-4">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          {role === "user" ? <Target className="w-7 h-7 text-gray-400" /> : <Building2 className="w-7 h-7 text-gray-400" />}
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No activity yet</p>
        <p className="text-xs text-gray-400">{data?.subtitle ?? ""}</p>
      </CardContent>
    </Card>
  )

  const rateColor = data.centerRate >= 80
    ? "fill-emerald-600"
    : data.centerRate >= 50
      ? "fill-amber-600"
      : "fill-rose-600"

  const badgeColor = data.centerRate >= 80
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : data.centerRate >= 50
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-rose-50 border-rose-200 text-rose-700"

  return (
    <Card className="overflow-hidden border-0 -lg pb-0 bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
              <CardDescription className="text-slate-500 font-medium">{data.subtitle}</CardDescription>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold",
              badgeColor,
            )}>
              {data.centerRate}%
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="pt-8">
        <div className="flex flex-col items-center">
          <ChartContainer config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[260px]">
            <PieChart>
              <ChartTooltip cursor={false}
                content={<ChartTooltipContent hideLabel
                  formatter={(value, name) => {
                    const item = data.legend.find((_, i) =>
                      ["a", "b", "c"][i] === name
                    ) ?? data.legend[0]
                    return [`${value}`, item?.label ?? String(name)]
                  }}
                />}
              />
              <Pie data={data.slices} dataKey="value" nameKey="name"
                innerRadius={70} outerRadius={100} strokeWidth={4}
                stroke="#fff" paddingAngle={3}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <g>
                          <text x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}
                            textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx}
                              className={cn("text-4xl font-black", rateColor)}>
                              {data.centerRate}%
                            </tspan>
                          </text>
                          <text x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} textAnchor="middle">
                            <tspan x={viewBox.cx}
                              className="fill-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              {data.centerLabel}
                            </tspan>
                          </text>
                        </g>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend */}
          {data.legend.length > 0 && (
            <div className="w-full grid grid-cols-3 gap-3 mt-4 border-t border-slate-100
              bg-slate-50/50 p-6 -mx-6 rounded-b-xl">
              {data.legend.map((item) => (
                <div key={item.label}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl border",
                    Number(item.value) > 0 ? item.bg : "bg-transparent border-transparent",
                  )}
                  style={{
                    borderColor: Number(item.value) > 0 ? `${item.color}30` : "transparent",
                  }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      {item.label}
                    </span>
                  </div>
                  <span className={cn("text-2xl font-black", item.text)}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}