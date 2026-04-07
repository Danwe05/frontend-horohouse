"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Home, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Bar, CartesianGrid, XAxis, YAxis, Cell, Area, ComposedChart } from "recharts"
import { cn } from "@/lib/utils"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartRow { month: string; active: number; closed: number }
interface FooterStats {
  left: { label: string; value: string | number }
  right: { label: string; value: string | number }
  extra?: { label: string; value: string | number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lastNMonths(n = 6) {
  const now = new Date()
  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short" }),
    }
  })
}

function periodLabel(period: string) {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-")
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", { month: "short" })
  }
  return period
}

function buildDateRange(months = 6) {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  }
}

function calcTrend(rows: ChartRow[]) {
  if (rows.length < 2) return { percentage: 0, isPositive: true }
  const last = rows[rows.length - 1].active + rows[rows.length - 1].closed
  const prev = rows[rows.length - 2].active + rows[rows.length - 2].closed
  if (prev === 0) return { percentage: 0, isPositive: true }
  const pct = ((last - prev) / prev) * 100
  return { percentage: Math.abs(Math.round(pct * 10) / 10), isPositive: pct >= 0 }
}

// ─── Per-role fetchers ────────────────────────────────────────────────────────
async function fetchAdminRows(): Promise<{ rows: ChartRow[]; stats: FooterStats }> {
  const { startDate, endDate } = buildDateRange(6)
  const [revenuePoints, statusBreakdown]: [any[], any[]] = await Promise.all([
    apiClient.request({ method: "GET", url: "/analytics/admin/revenue", params: { startDate, endDate, granularity: "month" } }),
    apiClient.request({ method: "GET", url: "/analytics/admin/breakdown/status", params: { startDate, endDate } }),
  ])

  const rows: ChartRow[] = Array.isArray(revenuePoints)
    ? revenuePoints.map((p) => ({ month: periodLabel(p.period), active: p.bookingCount ?? 0, closed: 0 }))
    : []

  const find = (s: string) => (Array.isArray(statusBreakdown) ? statusBreakdown.find((b: any) => b.status === s) : null)
  const completed = find("completed")?.count ?? 0
  const cancelled = find("cancelled")?.count ?? 0
  const total = Array.isArray(statusBreakdown) ? statusBreakdown.reduce((s: number, b: any) => s + (b.count ?? 0), 0) : 0
  const cancRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

  return {
    rows,
    stats: {
      left: { label: "Total Bookings", value: total },
      right: { label: "Completed", value: completed },
      extra: { label: "Cancellation", value: `${cancRate}%` },
    },
  }
}

async function fetchHostRows(): Promise<{ rows: ChartRow[]; stats: FooterStats }> {
  const months = lastNMonths(6)
  const active: Record<string, number> = {}
  const closed: Record<string, number> = {}
  months.forEach((m) => { active[m.key] = 0; closed[m.key] = 0 })

  const res = await apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } })
  const bookings: any[] = res?.bookings ?? res?.data ?? []

  bookings.forEach((b: any) => {
    const key = (b.createdAt ?? b.checkIn ?? "").slice(0, 7)
    if (!(key in active)) return
    if (b.status === "completed") closed[key]++
    else if (["confirmed", "pending"].includes(b.status)) active[key]++
  })

  const total = bookings.length
  const completed = bookings.filter((b) => b.status === "completed").length
  const cancelled = bookings.filter((b) => b.status === "cancelled").length

  return {
    rows: months.map((m) => ({ month: m.label, active: active[m.key], closed: closed[m.key] })),
    stats: {
      left: { label: "Total Bookings", value: total },
      right: { label: "Completed", value: completed },
      extra: { label: "Cancelled", value: cancelled },
    },
  }
}

async function fetchUserRows(): Promise<{ rows: ChartRow[]; stats: FooterStats }> {
  const months = lastNMonths(6)
  const active: Record<string, number> = {}
  const closed: Record<string, number> = {}
  months.forEach((m) => { active[m.key] = 0; closed[m.key] = 0 })

  const res = await apiClient.request({ method: 'GET', url: '/bookings/my', params: { limit: 100, page: 1 } })
  const bookings: any[] = res?.bookings ?? res?.data ?? []

  bookings.forEach((b: any) => {
    const key = (b.checkIn ?? b.createdAt ?? "").slice(0, 7)
    if (!(key in active)) return
    if (b.status === "completed") closed[key]++
    else if (["confirmed", "pending"].includes(b.status)) active[key]++
  })

  const total = bookings.length
  const completed = bookings.filter((b) => b.status === "completed").length
  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.checkIn) > new Date()).length

  return {
    rows: months.map((m) => ({ month: m.label, active: active[m.key], closed: closed[m.key] })),
    stats: {
      left: { label: "Total Stays", value: total },
      right: { label: "Completed", value: completed },
      extra: { label: "Upcoming", value: upcoming },
    },
  }
}

// ─── Role config ──────────────────────────────────────────────────────────────
function getRoleCfg(role: string) {
  switch (role) {
    case "admin":   return { title: "Platform Bookings", subtitle: "Booking volume · last 6 months", activeLabel: "Total", closedLabel: "Completed" }
    case "agent":   return { title: "My Performance",    subtitle: "Bookings on your listings",      activeLabel: "Active", closedLabel: "Completed" }
    case "landlord":return { title: "Property Bookings", subtitle: "Short-term booking activity",     activeLabel: "Active", closedLabel: "Completed" }
    default:        return { title: "My Trips",          subtitle: "Booking history as guest",        activeLabel: "Booked", closedLabel: "Completed" }
  }
}

const chartConfig = {
  active: { label: "Active",    color: "#FF5A5F" },
  closed: { label: "Completed", color: "#00A699" },
} satisfies ChartConfig

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="h-[200px] flex items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <Skeleton className="w-full rounded-t-lg" style={{ height: `${30 + Math.random() * 60}%` }} />
            <Skeleton className="h-3 w-6 mt-2 rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-6 mt-6 pt-5 border-t border-gray-100">
        {[1,2,3].map(i => <Skeleton key={i} className="h-10 flex-1 rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PropertySaleChart() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [rows, setRows] = React.useState<ChartRow[]>([])
  const [footerStats, setFooterStats] = React.useState<FooterStats>({ left: { label: "", value: 0 }, right: { label: "", value: 0 } })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const cfg = React.useMemo(() => getRoleCfg(role), [role])

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      let result: { rows: ChartRow[]; stats: FooterStats }
      if (role === "admin") result = await fetchAdminRows()
      else if (role === "agent" || role === "landlord") result = await fetchHostRows()
      else result = await fetchUserRows()
      setRows(result.rows)
      setFooterStats(result.stats)
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? "Failed to load data"
      setError(Array.isArray(raw) ? (raw[0]?.constraints ? Object.values(raw[0].constraints)[0] as string : "Validation error") : String(raw))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role])

  React.useEffect(() => { if (!authLoading) fetchData() }, [authLoading, fetchData])

  const trend = React.useMemo(() => calcTrend(rows), [rows])
  const hasData = rows.some((r) => r.active > 0 || r.closed > 0)
  const totalClosed = rows.reduce((s, r) => s + r.closed, 0)
  const totalAll    = rows.reduce((s, r) => s + r.active + r.closed, 0)
  const efficiency  = totalAll > 0 ? ((totalClosed / totalAll) * 100).toFixed(0) : "0"

  if (authLoading || loading) return <ChartSkeleton />

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <TrendingDown className="w-5 h-5 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-gray-800">Couldn't load data</p>
      <p className="text-xs text-gray-400">{error}</p>
      <button onClick={fetchData} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  )

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!hasData) return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
        <Home className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{cfg.title}</p>
      <p className="text-xs text-gray-400">
        {role === "user" ? "Your booking history will appear here." : "Booking activity will appear once confirmed."}
      </p>
    </div>
  )

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">{cfg.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{cfg.subtitle}</p>
        </div>
        {trend.percentage > 0 && (
          <span className={cn(
            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
            trend.isPositive ? "bg-[#E8F5F4] text-[#00A699]" : "bg-rose-50 text-rose-600",
          )}>
            {trend.isPositive
              ? <ArrowUpRight className="w-3.5 h-3.5" />
              : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.isPositive ? "+" : "-"}{trend.percentage}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ComposedChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              width={32}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              content={<ChartTooltipContent
                formatter={(value, name) => [value, name === "active" ? cfg.activeLabel : cfg.closedLabel]}
              />}
            />
            <Area
              type="monotone"
              dataKey="active"
              name="active"
              fill="#FF5A5F18"
              stroke="#FF5A5F"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#FF5A5F" }}
            />
            <Bar dataKey="closed" name="closed" fill="#00A699" radius={[4, 4, 0, 0]} barSize={20} maxBarSize={28}>
              {rows.map((_, idx) => (
                <Cell key={`cell-${idx}`} className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </ComposedChart>
        </ChartContainer>
      </div>

      {/* Legend micro row */}
      <div className="flex items-center gap-4 px-6 pb-5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-[#FF5A5F] inline-block" />
          <span className="text-[11px] text-gray-400 font-medium">{cfg.activeLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#00A699] inline-block" />
          <span className="text-[11px] text-gray-400 font-medium">{cfg.closedLabel}</span>
        </div>
      </div>

      {/* Footer stats */}
      <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
        {[
          footerStats.left,
          footerStats.right,
          footerStats.extra ?? { label: "Completion", value: `${efficiency}%` },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</span>
            <span className="text-lg font-bold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}