"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { Building2, AlertTriangle, RefreshCw, Target } from "lucide-react"
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
interface LegendItem { label: string; value: number | string; color: string }
interface RoleData {
  slices: SliceRow[]; centerRate: number; centerLabel: string
  subtitle: string; legend: LegendItem[]
}

const chartConfig = {
  properties: { label: "Properties" },
  a: { label: "A", color: "#00A699" },
  b: { label: "B", color: "#FF5A5F" },
  c: { label: "C", color: "#FC642D" },
} satisfies ChartConfig

function buildDateRange(months = 3) {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] }
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchAdminData(): Promise<RoleData> {
  const { startDate, endDate } = buildDateRange(3)
  const points: any[] = await apiClient.request({ method: "GET", url: "/analytics/admin/occupancy", params: { startDate, endDate, granularity: "month" } })
  if (!Array.isArray(points) || points.length === 0) return emptyData("Occupancy Rate", "No short-term data")
  const totalBooked = points.reduce((s, p) => s + (p.nightsBooked ?? 0), 0)
  const totalAvailable = points.reduce((s, p) => s + (p.nightsAvailable ?? 0), 0)
  const propertyCount = points[points.length - 1]?.propertyCount ?? 0
  const rate = totalAvailable > 0 ? Math.min(100, Math.round((totalBooked / totalAvailable) * 100)) : 0
  const vacant = Math.max(0, totalAvailable - totalBooked)
  return {
    centerRate: rate, centerLabel: "Occupancy",
    subtitle: `${propertyCount} active short-term ${propertyCount === 1 ? "property" : "properties"} · last 3 months`,
    slices: [
      ...(totalBooked > 0 ? [{ name: "a", value: totalBooked, fill: "#00A699" }] : []),
      ...(vacant > 0 ? [{ name: "b", value: vacant, fill: "#e5e7eb" }] : []),
    ],
    legend: [
      { label: "Booked nights", value: totalBooked, color: "#00A699" },
      { label: "Available nights", value: totalAvailable, color: "#e5e7eb" },
      { label: "Properties", value: propertyCount, color: "#FF5A5F" },
    ],
  }
}

async function fetchLandlordData(): Promise<RoleData> {
  const [propertiesRes, tenantsRes, hostBookingsRes] = await Promise.all([
    apiClient.request({ method: 'GET', url: '/properties/my/properties', params: { limit: 100, page: 1 } }).catch(() => null),
    apiClient.getMyTenants().catch(() => null),
    apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } }).catch(() => null),
  ])
  const properties: any[] = propertiesRes?.properties ?? propertiesRes?.data ?? []
  const tenants: any[] = tenantsRes?.tenants ?? tenantsRes?.data ?? tenantsRes ?? []
  const bookings: any[] = hostBookingsRes?.bookings ?? hostBookingsRes?.data ?? []
  const shortTerm = properties.filter((p) => p.listingType === "short_term" || p.type === "short_term")
  const longTerm = properties.filter((p) => p.listingType !== "short_term" && p.type !== "short_term")
  const today = new Date()
  const shortTermOccupied = shortTerm.filter((p) =>
    bookings.some((b) =>
      (b.propertyId?._id === p._id || b.propertyId === p._id)
        ? ["confirmed", "completed"].includes(b.status) && new Date(b.checkIn) <= today && new Date(b.checkOut) >= today
        : false
    )
  ).length
  const shortTermVacant = Math.max(0, shortTerm.length - shortTermOccupied)
  const activeTenants = tenants.filter((t: any) => t.status === "active").length
  const longTermOccupied = Math.min(activeTenants, longTerm.length)
  const longTermVacant = Math.max(0, longTerm.length - longTermOccupied)
  const totalProperties = properties.length
  const totalOccupied = shortTermOccupied + longTermOccupied
  const rate = totalProperties > 0 ? Math.round((totalOccupied / totalProperties) * 100) : 0
  return {
    centerRate: rate, centerLabel: "Occupied",
    subtitle: `${totalProperties} total (${shortTerm.length} short-term, ${longTerm.length} long-term)`,
    slices: [
      ...(shortTermOccupied > 0 ? [{ name: "a", value: shortTermOccupied, fill: "#00A699" }] : []),
      ...(longTermOccupied > 0 ? [{ name: "b", value: longTermOccupied, fill: "#FF5A5F" }] : []),
      ...(shortTermVacant + longTermVacant > 0 ? [{ name: "c", value: shortTermVacant + longTermVacant, fill: "#e5e7eb" }] : []),
    ],
    legend: [
      { label: "Short-term occ.", value: shortTermOccupied, color: "#00A699" },
      { label: "Long-term occ.", value: longTermOccupied, color: "#FF5A5F" },
      { label: "Vacant", value: shortTermVacant + longTermVacant, color: "#e5e7eb" },
    ],
  }
}

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
      ...(completed > 0 ? [{ name: "a", value: completed, fill: "#00A699" }] : []),
      ...(confirmed > 0 ? [{ name: "b", value: confirmed, fill: "#FF5A5F" }] : []),
      ...(pending > 0 ? [{ name: "c", value: pending, fill: "#FC642D" }] : []),
      ...(cancelled > 0 ? [{ name: "c", value: cancelled, fill: "#e5e7eb" }] : []),
    ],
    legend: [
      { label: "Completed", value: completed, color: "#00A699" },
      { label: "Confirmed", value: confirmed, color: "#FF5A5F" },
      { label: "Pending", value: pending, color: "#FC642D" },
    ],
  }
}

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
  const engRate = total > 0 ? Math.round(((responded + closed + confirmedB) / total) * 100) : 0
  return {
    centerRate: engRate, centerLabel: "Engaged",
    subtitle: `${inquiries.length} inquiries · ${bookings.length} bookings`,
    slices: [
      ...(confirmedB > 0 ? [{ name: "a", value: confirmedB, fill: "#00A699" }] : []),
      ...(responded > 0 ? [{ name: "b", value: responded, fill: "#FF5A5F" }] : []),
      ...(pending > 0 ? [{ name: "c", value: pending, fill: "#FC642D" }] : []),
    ],
    legend: [
      { label: "Bookings", value: confirmedB, color: "#00A699" },
      { label: "Responded", value: responded, color: "#FF5A5F" },
      { label: "Pending inq.", value: pending, color: "#FC642D" },
    ],
  }
}

function emptyData(label: string, sub: string): RoleData {
  return { centerRate: 0, centerLabel: label, subtitle: sub, slices: [{ name: "b", value: 1, fill: "#f3f4f6" }], legend: [] }
}

const ROLE_TITLE: Record<string, string> = {
  admin: "Occupancy Rate", landlord: "Portfolio Occupancy", agent: "Booking Conversion", user: "Engagement Rate",
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6">
      <div className="mb-6"><Skeleton className="h-5 w-40 mb-2" /><Skeleton className="h-3.5 w-52" /></div>
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <Skeleton className="w-[200px] h-[200px] rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-[120px] h-[120px] rounded-full bg-white" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    </div>
  )
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

  if (authLoading || loading) return <ChartSkeleton />

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-gray-800">Couldn't load data</p>
      <p className="text-xs text-gray-400">{error}</p>
      <button onClick={fetchData} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  )

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!data || (data.legend.length === 0 && data.centerRate === 0)) return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
        {role === "user" ? <Target className="w-5 h-5 text-gray-400" /> : <Building2 className="w-5 h-5 text-gray-400" />}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400">{data?.subtitle ?? "No activity yet"}</p>
    </div>
  )

  // ── Rate color ─────────────────────────────────────────────────────────────
  const rateHex = data.centerRate >= 80 ? "#00A699" : data.centerRate >= 50 ? "#FC642D" : "#FF5A5F"
  const badgeCls = data.centerRate >= 80
    ? "bg-[#E8F5F4] text-[#00A699]"
    : data.centerRate >= 50
      ? "bg-orange-50 text-orange-600"
      : "bg-rose-50 text-rose-600"

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{data.subtitle}</p>
        </div>
        <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold", badgeCls)}>
          {data.centerRate}%
        </span>
      </div>

      {/* Donut */}
      <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[240px]">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel
            formatter={(value, name) => {
              const item = data.legend.find((_, i) => ["a", "b", "c"][i] === name) ?? data.legend[0]
              return [`${value}`, item?.label ?? String(name)]
            }}
          />} />
          <Pie data={data.slices} dataKey="value" nameKey="name"
            innerRadius={68} outerRadius={96} strokeWidth={3} stroke="#fff" paddingAngle={3}
          >
            <Label content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <g>
                    <text x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} textAnchor="middle">
                      <tspan x={viewBox.cx} style={{ fontSize: 28, fontWeight: 800, fill: rateHex }}>
                        {data.centerRate}%
                      </tspan>
                    </text>
                    <text x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} textAnchor="middle">
                      <tspan x={viewBox.cx} style={{ fontSize: 10, fontWeight: 600, fill: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>
                        {data.centerLabel}
                      </tspan>
                    </text>
                  </g>
                )
              }
            }} />
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* Legend */}
      {data.legend.length > 0 && (
        <div className="border-t border-gray-100 grid divide-x divide-gray-100 mt-2" style={{ gridTemplateColumns: `repeat(${data.legend.length}, 1fr)` }}>
          {data.legend.map((item) => (
            <div key={item.label} className="flex flex-col items-center justify-center py-4 px-2 text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}