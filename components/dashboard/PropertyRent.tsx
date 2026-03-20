"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Home, AlertTriangle, RefreshCw } from "lucide-react"
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface SliceRow {
  type: string
  count: number
  fill: string
  meta: string   // e.g. "XAF 1.2M" or "32%" shown in legend
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#6366f1", "#f43f5e",
  "#f97316", "#14b8a6",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildDateRange(months = 6) {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate:   end.toISOString().split("T")[0],
  }
}

function fmtCurrency(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M XAF`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K XAF`
  return `${v.toLocaleString()} XAF`
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : ""
}

function buildConfig(types: string[]): ChartConfig {
  const cfg: ChartConfig = { properties: { label: "Properties" } }
  types.forEach((t, i) => {
    cfg[t] = { label: capitalize(t), color: COLORS[i % COLORS.length] }
  })
  return cfg
}

// ─── Per-role fetchers ────────────────────────────────────────────────────────

/** ADMIN: /analytics/admin/breakdown/property-type */
async function fetchAdminSlices(): Promise<SliceRow[]> {
  const { startDate, endDate } = buildDateRange(6)
  const breakdown: any[] = await apiClient.request({
    method: "GET",
    url: "/analytics/admin/breakdown/property-type",
    params: { startDate, endDate },
  })
  if (!Array.isArray(breakdown)) return []
  return breakdown.map((b, i) => ({
    type:  b.type ?? "unknown",
    count: b.bookingCount ?? 0,
    fill:  COLORS[i % COLORS.length],
    meta:  fmtCurrency(b.revenue ?? 0),
  }))
}

/** AGENT / LANDLORD: own listings grouped by type */
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
      type, count, fill: COLORS[i % COLORS.length], meta: `${count} listing${count !== 1 ? "s" : ""}`,
    }))
}

/** USER: saved properties + viewed properties grouped by type */
async function fetchUserSlices(): Promise<SliceRow[]> {
  const [favRes, historyRes] = await Promise.all([
    apiClient.getFavorites().catch(() => null),
    apiClient.getRecentlyViewed(50).catch(() => null),
  ])

  const favorites: any[] = favRes?.favorites ?? favRes?.data ?? favRes ?? []
  const viewed: any[]    = historyRes?.properties ?? historyRes?.data ?? historyRes ?? []

  const counts: Record<string, { saved: number; viewed: number }> = {}

  favorites.forEach((p: any) => {
    const t = p.type ?? p.listingType ?? "other"
    if (!counts[t]) counts[t] = { saved: 0, viewed: 0 }
    counts[t].saved++
  })
  viewed.forEach((p: any) => {
    const t = (p.property?.type ?? p.type ?? p.listingType ?? "other")
    if (!counts[t]) counts[t] = { saved: 0, viewed: 0 }
    counts[t].viewed++
  })

  return Object.entries(counts)
    .map(([type, v]) => ({ type, total: v.saved + v.viewed, saved: v.saved, viewed: v.viewed }))
    .sort((a, b) => b.total - a.total)
    .map(({ type, total, saved }, i) => ({
      type, count: total, fill: COLORS[i % COLORS.length],
      meta: `${saved} saved`,
    }))
}

// ─── Role config ──────────────────────────────────────────────────────────────
function getRoleCfg(role: string): { title: string; subtitle: string; centerUnit: string } {
  switch (role) {
    case "admin":
      return { title: "Market Demand",   subtitle: "Bookings by property type — last 6 months", centerUnit: "Bookings" }
    case "agent":
      return { title: "Rental Reach",    subtitle: "Your listings by type",                      centerUnit: "Listings" }
    case "landlord":
      return { title: "Portfolio Mix",   subtitle: "Your properties by type",                    centerUnit: "Properties" }
    default:
      return { title: "Interests",       subtitle: "Properties you've saved & viewed by type",   centerUnit: "Items" }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PropertyRentChart() {
  const id = "pie-property-type"
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [slices, setSlices]   = React.useState<SliceRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError]     = React.useState<string | null>(null)
  const [activeType, setActiveType] = React.useState<string>("")
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({ properties: { label: "Properties" } })

  const cfg = React.useMemo(() => getRoleCfg(role), [role])

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      let data: SliceRow[] = []
      if      (role === "admin")    data = await fetchAdminSlices()
      else if (role === "agent" || role === "landlord") data = await fetchHostSlices()
      else                          data = await fetchUserSlices()

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

  const activeIndex = React.useMemo(
    () => slices.findIndex((s) => s.type === activeType),
    [slices, activeType],
  )
  const totalCount = React.useMemo(() => slices.reduce((s, r) => s + r.count, 0), [slices])
  const activeSlice = slices[activeIndex]

  if (authLoading || loading) return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-52" />
      </div>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <Skeleton className="w-[220px] h-[220px] rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-[140px] h-[140px] rounded-full bg-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (error) return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
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

  if (slices.length === 0 || totalCount === 0) return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
        <CardDescription className="text-slate-500">{cfg.subtitle}</CardDescription>
      </div>
      <CardContent className="flex flex-col items-center justify-center h-[280px] text-center p-4">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Home className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No data yet</p>
        <p className="text-xs text-gray-400">
          {role === "user"
            ? "Save or view properties to see your interests."
            : "Data will appear once properties are active."}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="overflow-hidden border-0 shadow-lg pb-0 bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
              <CardDescription className="text-slate-500 font-medium">{cfg.subtitle}</CardDescription>
            </div>
            <Select value={activeType} onValueChange={setActiveType}>
              <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200 text-slate-700 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                {slices.map((s) => (
                  <SelectItem key={s.type} value={s.type} className="focus:bg-indigo-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                      {capitalize(s.type)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </div>

      <CardContent className="pt-8">
        <ChartContainer id={id} config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[320px]">
          <PieChart>
            <ChartTooltip cursor={false}
              content={<ChartTooltipContent hideLabel
                formatter={(value, name) => [
                  `${value} ${cfg.centerUnit.toLowerCase()}`,
                  capitalize(String(name)),
                ]}
              />}
            />
            <Pie data={slices} dataKey="count" nameKey="type"
              innerRadius={80} outerRadius={115}
              strokeWidth={5} stroke="#fff" paddingAngle={2}
              activeIndex={activeIndex}
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector {...props} outerRadius={outerRadius + 22} innerRadius={outerRadius + 14} />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <g>
                        <text x={viewBox.cx} y={(viewBox.cy ?? 0) - 12} textAnchor="middle">
                          <tspan x={viewBox.cx} className="fill-slate-900 text-5xl font-black">
                            {(activeSlice?.count ?? 0).toLocaleString()}
                          </tspan>
                        </text>
                        <text x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} textAnchor="middle">
                          <tspan x={viewBox.cx}
                            className="fill-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            {cfg.centerUnit}
                          </tspan>
                        </text>
                        <text x={viewBox.cx} y={(viewBox.cy ?? 0) + 45} textAnchor="middle">
                          <tspan x={viewBox.cx} className="fill-indigo-600 text-xs font-extrabold">
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

        {/* Legend grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100
          bg-slate-50/50 p-6 -mx-6 rounded-b-xl">
          {slices.map((s) => {
            const isActive = s.type === activeType
            const pct = totalCount > 0 ? ((s.count / totalCount) * 100).toFixed(0) : "0"
            return (
              <button key={s.type} onClick={() => setActiveType(s.type)}
                className={cn(
                  "flex flex-col p-3 rounded-2xl border transition-all text-left",
                  isActive
                    ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100"
                    : "bg-transparent border-transparent hover:bg-white/50",
                )}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.fill }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                    {capitalize(s.type)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900">{s.count}</span>
                  <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate">{s.meta}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}