"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Home, CheckCircle, RefreshCw } from "lucide-react"
import { Bar, CartesianGrid, XAxis, YAxis, Cell, Area, ComposedChart } from "recharts"
import { cn } from "@/lib/utils"
import {
  Card, CardContent, CardFooter,
  CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
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

/** ADMIN: revenue over time → bookingCount per period as active; status breakdown for closed */
async function fetchAdminRows(): Promise<{ rows: ChartRow[]; stats: FooterStats }> {
  const { startDate, endDate } = buildDateRange(6)
  const [revenuePoints, statusBreakdown]: [any[], any[]] = await Promise.all([
    apiClient.request({
      method: "GET", url: "/analytics/admin/revenue",
      params: { startDate, endDate, granularity: "month" },
    }),
    apiClient.request({
      method: "GET", url: "/analytics/admin/breakdown/status",
      params: { startDate, endDate },
    }),
  ])

  const rows: ChartRow[] = Array.isArray(revenuePoints)
    ? revenuePoints.map((p) => ({
      month: periodLabel(p.period),
      active: p.bookingCount ?? 0,
      closed: 0,
    }))
    : []

  const find = (s: string) => (Array.isArray(statusBreakdown)
    ? statusBreakdown.find((b: any) => b.status === s)
    : null)
  const completed = find("completed")?.count ?? 0
  const cancelled = find("cancelled")?.count ?? 0
  const total = Array.isArray(statusBreakdown)
    ? statusBreakdown.reduce((s: number, b: any) => s + (b.count ?? 0), 0) : 0
  const cancRate = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const efficiency = total > 0 ? ((completed / total) * 100).toFixed(1) : "0"

  return {
    rows,
    stats: {
      left: { label: "Total Bookings", value: total },
      right: { label: "Completed", value: completed },
      extra: { label: "Cancellation", value: `${cancRate}%` },
    },
  }
}

/** AGENT + LANDLORD: host bookings grouped by month */
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
  const efficiency = total > 0 ? ((completed / total) * 100).toFixed(1) : "0"

  return {
    rows: months.map((m) => ({
      month: m.label,
      active: active[m.key],
      closed: closed[m.key],
    })),
    stats: {
      left: { label: "Total Bookings", value: total },
      right: { label: "Completed", value: completed },
      extra: { label: "Cancelled", value: cancelled },
    },
  }
}

/** USER: own bookings as guest grouped by month */
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
  const upcoming = bookings.filter((b) =>
    b.status === "confirmed" && new Date(b.checkIn) > new Date()
  ).length

  return {
    rows: months.map((m) => ({
      month: m.label,
      active: active[m.key],
      closed: closed[m.key],
    })),
    stats: {
      left: { label: "Total Stays", value: total },
      right: { label: "Completed", value: completed },
      extra: { label: "Upcoming", value: upcoming },
    },
  }
}

// ─── Role display config ──────────────────────────────────────────────────────
function getRoleCfg(role: string): {
  title: string
  subtitle: string
  activeLabel: string
  closedLabel: string
} {
  switch (role) {
    case "admin":
      return {
        title: "Platform Bookings", subtitle: "Booking volume by month",
        activeLabel: "Total Bookings", closedLabel: "Completed",
      }
    case "agent":
      return {
        title: "My Performance", subtitle: "Bookings on your listings",
        activeLabel: "Active", closedLabel: "Completed",
      }
    case "landlord":
      return {
        title: "Property Bookings", subtitle: "Short-term booking activity",
        activeLabel: "Active", closedLabel: "Completed",
      }
    default: // user
      return {
        title: "My Trips", subtitle: "Booking history as guest",
        activeLabel: "Booked", closedLabel: "Completed",
      }
  }
}

const chartConfig = {
  active: { label: "Active", color: "#3b82f6" },
  closed: { label: "Completed", color: "#10b981" },
} satisfies ChartConfig

// ─── Component ────────────────────────────────────────────────────────────────
export function PropertySaleChart() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [rows, setRows] = React.useState<ChartRow[]>([])
  const [footerStats, setFooterStats] = React.useState<FooterStats>({
    left: { label: "", value: 0 }, right: { label: "", value: 0 },
  })
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
  const totalActive = rows.reduce((s, r) => s + r.active, 0)
  const totalClosed = rows.reduce((s, r) => s + r.closed, 0)
  const efficiency = (totalActive + totalClosed) > 0
    ? ((totalClosed / (totalActive + totalClosed)) * 100).toFixed(1)
    : "0"

  if (authLoading || loading) return (
    <Card className="overflow-hidden border-0 -lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-32" />
      </div>
      <CardContent className="pt-8">
        <div className="h-[280px] flex items-end gap-2 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center">
              <Skeleton className="w-full h-[60%] rounded-t-md" />
              <Skeleton className="h-3 w-8 mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (error) return (
    <Card className="overflow-hidden border-0 -lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
      </div>
      <CardContent className="flex flex-col items-center justify-center h-[280px] text-center p-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
          <TrendingDown className="w-7 h-7 text-red-500" />
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

  if (!hasData) return (
    <Card className="overflow-hidden border-0 -lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
        <CardDescription className="text-slate-500">{cfg.subtitle}</CardDescription>
      </div>
      <CardContent className="flex flex-col items-center justify-center h-[280px] text-center p-4">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Home className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No booking data yet</p>
        <p className="text-xs text-gray-400">
          {role === "user"
            ? "Your booking history will appear here."
            : "Booking activity will appear once confirmed."}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="overflow-hidden border-0 -lg pb-0 bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
              <CardDescription className="text-slate-500 font-medium">{cfg.subtitle}</CardDescription>
            </div>
            {trend.percentage > 0 && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold",
                trend.isPositive
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700",
              )}>
                {trend.isPositive
                  ? <TrendingUp className="h-3.5 w-3.5" />
                  : <TrendingDown className="h-3.5 w-3.5" />}
                {trend.isPositive ? "+" : "-"}{trend.percentage}%
              </div>
            )}
          </div>
        </CardHeader>
      </div>

      <CardContent className="pt-8">
        <ChartContainer config={chartConfig}>
          <ComposedChart data={rows} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tickLine={false} tickMargin={12} axisLine={false}
              className="text-[11px] font-bold text-slate-400" />
            <YAxis tickLine={false} axisLine={false} className="text-[11px] text-slate-400" />
            <ChartTooltip cursor={{ fill: "rgba(99,102,241,0.05)" }}
              content={<ChartTooltipContent
                formatter={(value, name) => [
                  value,
                  name === "active" ? cfg.activeLabel : cfg.closedLabel,
                ]}
              />}
            />
            <Area type="monotone" dataKey="active" name="active"
              fill="#3b82f615" stroke="#3b82f6" strokeWidth={2}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Bar dataKey="closed" name="closed" fill="#10b981"
              radius={[4, 4, 0, 0]} barSize={32}>
              {rows.map((_, idx) => (
                <Cell key={`cell-${idx}`} className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </ComposedChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-4 text-sm border-t border-slate-100 bg-slate-50/50 p-6">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl border",
              trend.isPositive
                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                : "bg-rose-50 border-rose-100 text-rose-600",
            )}>
              {trend.isPositive
                ? <TrendingUp className="h-5 w-5" />
                : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {trend.isPositive ? "Growing" : "Declining"}
              </p>
              <p className="text-xs text-slate-500">
                Volume {trend.isPositive ? "up" : "down"} by{" "}
                <span className="font-bold text-slate-700">{trend.percentage}%</span> vs last month
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Completion Rate
            </p>
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="text-xl font-extrabold">{efficiency}%</span>
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className={cn(
          "w-full grid pt-4 border-t border-slate-100 gap-4",
          footerStats.extra ? "grid-cols-3" : "grid-cols-2",
        )}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
              <span className="text-xs font-bold text-slate-500">{footerStats.left.label}</span>
            </div>
            <span className="text-xl font-bold text-slate-900 pl-4">{footerStats.left.value}</span>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
              <span className="text-xs font-bold text-slate-500">{footerStats.right.label}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">{footerStats.right.value}</span>
          </div>
          {footerStats.extra && (
            <div className="flex flex-col border-l border-slate-100 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-rose-400 rounded-sm" />
                <span className="text-xs font-bold text-slate-500">{footerStats.extra.label}</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{footerStats.extra.value}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}