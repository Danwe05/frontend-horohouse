"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Home, AlertTriangle, RefreshCw } from "lucide-react"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface SliceRow {
  type: string
  count: number
  fill: string
  meta: string
}

// ─── Colors — Airbnb-inspired palette ─────────────────────────────────────────
const COLORS = [
  "#FF5A5F", "#00A699", "#FC642D", "#484848",
  "#767676", "#FF7B72", "#3BAFDA", "#E8E8E8",
  "#8B5CF6", "#F59E0B",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildDateRange(months = 6) {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  }
}

function fmtCurrency(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M XAF`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K XAF`
  return `${v.toLocaleString()} XAF`
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : ""
}

function buildConfig(types: string[]): ChartConfig {
  const cfg: ChartConfig = { properties: { label: "Properties" } }
  types.forEach((t, i) => { cfg[t] = { label: capitalize(t), color: COLORS[i % COLORS.length] } })
  return cfg
}

// ─── Per-role fetchers ────────────────────────────────────────────────────────
async function fetchAdminSlices(): Promise<SliceRow[]> {
  const { startDate, endDate } = buildDateRange(6)
  const breakdown: any[] = await apiClient.request({
    method: "GET", url: "/analytics/admin/breakdown/property-type", params: { startDate, endDate },
  })
  if (!Array.isArray(breakdown)) return []
  return breakdown.map((b, i) => ({
    type: b.type ?? "unknown",
    count: b.bookingCount ?? 0,
    fill: COLORS[i % COLORS.length],
    meta: fmtCurrency(b.revenue ?? 0),
  }))
}

async function fetchHostSlices(): Promise<SliceRow[]> {
  const res = await apiClient.request({ method: 'GET', url: '/properties/my/properties', params: { limit: 100, page: 1 } })
  const properties: any[] = res?.properties ?? res?.data ?? []
  const counts: Record<string, number> = {}
  properties.forEach((p: any) => {
    const t = p.type ?? p.listingType ?? "other"
    counts[t] = (counts[t] ?? 0) + 1
  })
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count], i) => ({
      type, count, fill: COLORS[i % COLORS.length],
      meta: `${count} listing${count !== 1 ? "s" : ""}`,
    }))
}

async function fetchUserSlices(): Promise<SliceRow[]> {
  const [favRes, historyRes] = await Promise.all([
    apiClient.getFavorites().catch(() => null),
    apiClient.getRecentlyViewed(50).catch(() => null),
  ])
  const favorites: any[] = favRes?.favorites ?? favRes?.data ?? favRes ?? []
  const viewed: any[] = historyRes?.properties ?? historyRes?.data ?? historyRes ?? []
  const counts: Record<string, { saved: number; viewed: number }> = {}
  favorites.forEach((p: any) => {
    const t = p.type ?? p.listingType ?? "other"
    if (!counts[t]) counts[t] = { saved: 0, viewed: 0 }
    counts[t].saved++
  })
  viewed.forEach((p: any) => {
    const t = p.property?.type ?? p.type ?? p.listingType ?? "other"
    if (!counts[t]) counts[t] = { saved: 0, viewed: 0 }
    counts[t].viewed++
  })
  return Object.entries(counts)
    .map(([type, v]) => ({ type, total: v.saved + v.viewed, saved: v.saved, viewed: v.viewed }))
    .sort((a, b) => b.total - a.total)
    .map(({ type, total, saved }, i) => ({
      type, count: total, fill: COLORS[i % COLORS.length], meta: `${saved} saved`,
    }))
}

// ─── Role config ──────────────────────────────────────────────────────────────
function getRoleCfg(role: string): { title: string; subtitle: string; centerUnit: string } {
  switch (role) {
    case "admin":    return { title: "Market Demand",   subtitle: "Bookings by property type · last 6 months", centerUnit: "Bookings" }
    case "agent":    return { title: "Rental Reach",    subtitle: "Your listings by type",                     centerUnit: "Listings" }
    case "landlord": return { title: "Portfolio Mix",   subtitle: "Your properties by type",                   centerUnit: "Properties" }
    default:         return { title: "Interests",       subtitle: "Properties you've saved & viewed by type",  centerUnit: "Items" }
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6">
      <div className="mb-6">
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <Skeleton className="w-[200px] h-[200px] rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-[120px] h-[120px] rounded-full bg-white" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PropertyRentChart() {
  const id = "pie-property-type"
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [slices, setSlices] = React.useState<SliceRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeType, setActiveType] = React.useState<string>("")
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({ properties: { label: "Properties" } })

  const cfg = React.useMemo(() => getRoleCfg(role), [role])

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      let data: SliceRow[] = []
      if (role === "admin") data = await fetchAdminSlices()
      else if (role === "agent" || role === "landlord") data = await fetchHostSlices()
      else data = await fetchUserSlices()
      setSlices(data)
      setChartConfig(buildConfig(data.map((s) => s.type)))
      setActiveType(data[0]?.type ?? "")
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? "Failed to load data"
      setError(Array.isArray(raw) ? (raw[0]?.constraints ? Object.values(raw[0].constraints)[0] as string : "Validation error") : String(raw))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role])

  React.useEffect(() => { if (!authLoading) fetchData() }, [authLoading, fetchData])

  const activeIndex = React.useMemo(() => slices.findIndex((s) => s.type === activeType), [slices, activeType])
  const totalCount  = React.useMemo(() => slices.reduce((s, r) => s + r.count, 0), [slices])
  const activeSlice = slices[activeIndex]

  if (authLoading || loading) return <ChartSkeleton />

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
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
  if (slices.length === 0 || totalCount === 0) return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
        <Home className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{cfg.title}</p>
      <p className="text-xs text-gray-400">
        {role === "user" ? "Save or view properties to see your interests." : "Data will appear once properties are active."}
      </p>
    </div>
  )

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-base font-semibold text-gray-900 tracking-tight">{cfg.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{cfg.subtitle}</p>
      </div>

      {/* Donut chart */}
      <ChartContainer id={id} config={chartConfig} className="mx-auto aspect-square w-full max-w-[260px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel
              formatter={(value, name) => [
                `${value} ${cfg.centerUnit.toLowerCase()}`,
                capitalize(String(name)),
              ]}
            />}
          />
          <Pie
            data={slices}
            dataKey="count"
            nameKey="type"
            innerRadius={72}
            outerRadius={100}
            strokeWidth={3}
            stroke="#fff"
            paddingAngle={2}
            activeIndex={activeIndex}
            activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
              <g>
                <Sector {...props} outerRadius={outerRadius + 8} />
                <Sector {...props} outerRadius={outerRadius + 18} innerRadius={outerRadius + 12} />
              </g>
            )}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <g>
                      <text x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          style={{ fontSize: 28, fontWeight: 800, fill: "#111827" }}
                        >
                          {(activeSlice?.count ?? 0).toLocaleString()}
                        </tspan>
                      </text>
                      <text x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          style={{ fontSize: 10, fontWeight: 600, fill: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}
                        >
                          {cfg.centerUnit}
                        </tspan>
                      </text>
                      <text x={viewBox.cx} y={(viewBox.cy ?? 0) + 34} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          style={{ fontSize: 11, fontWeight: 700, fill: "#FF5A5F" }}
                        >
                          {activeSlice ? capitalize(activeSlice.type) : ""}
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

      {/* Legend tiles */}
      <div className="px-4 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
        {slices.map((s) => {
          const isActive = s.type === activeType
          const pct = totalCount > 0 ? ((s.count / totalCount) * 100).toFixed(0) : "0"
          return (
            <button
              key={s.type}
              onClick={() => setActiveType(s.type)}
              className={cn(
                "flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150",
                isActive
                  ? "border-gray-200 bg-gray-50 shadow-sm"
                  : "border-transparent hover:border-gray-100 hover:bg-gray-50/50",
              )}
            >
              <div className="flex items-center gap-1.5 mb-2 w-full">
                <span className="w-2 h-2 rounded-full shrink-0 flex-shrink-0" style={{ backgroundColor: s.fill }} />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">
                  {capitalize(s.type)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900">{s.count}</span>
                <span className="text-[10px] font-semibold text-gray-400">{pct}%</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 truncate w-full">{s.meta}</span>
            </button>
          )
        })}
      </div>

      {/* Footer total */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400 font-medium">Total</span>
        <span className="text-sm font-bold text-gray-900">{totalCount.toLocaleString()} {cfg.centerUnit.toLowerCase()}</span>
      </div>
    </div>
  )
}