"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Wallet, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartRow { month: string; primary: number; secondary: number }
interface SummaryConfig {
  primaryLabel: string; secondaryLabel: string
  primaryTotal: number; secondaryTotal: number
  extraLabel?: string; extraValue?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M XAF`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K XAF`
  return `${v.toLocaleString()} XAF`
}

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
  return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] }
}

function calcTrend(rows: ChartRow[]) {
  if (rows.length < 2) return { percentage: 0, isPositive: true }
  const last = rows[rows.length - 1].primary
  const prev = rows[rows.length - 2].primary
  if (prev === 0) return { percentage: 0, isPositive: true }
  const pct = ((last - prev) / prev) * 100
  return { percentage: Math.abs(Math.round(pct * 10) / 10), isPositive: pct >= 0 }
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchAdmin(): Promise<ChartRow[]> {
  const { startDate, endDate } = buildDateRange(6)
  const points: any[] = await apiClient.request({ method: "GET", url: "/analytics/admin/revenue", params: { startDate, endDate, granularity: "month" } })
  if (!Array.isArray(points)) return []
  return points.map((p) => ({ month: periodLabel(p.period), primary: p.grossRevenue ?? 0, secondary: p.platformFees ?? 0 }))
}

async function fetchAgent(): Promise<ChartRow[]> {
  const months = lastNMonths(6)
  const map: Record<string, { primary: number; secondary: number }> = {}
  months.forEach((m) => { map[m.key] = { primary: 0, secondary: 0 } })
  try {
    const res = await apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } })
    const bookings: any[] = res?.bookings ?? res?.data ?? []
    bookings.forEach((b: any) => {
      if (!["confirmed", "completed"].includes(b.status)) return
      const key = (b.createdAt ?? b.checkIn ?? "").slice(0, 7)
      if (key in map) map[key].primary += b.priceBreakdown?.totalAmount ?? 0
    })
  } catch { /* non-critical */ }
  try {
    const res = await apiClient.request({ method: 'GET', url: '/payments/transactions', params: { status: 'success', limit: 100, page: 1 } })
    const txs: any[] = res?.transactions ?? res?.data ?? []
    txs.forEach((tx: any) => {
      const key = (tx.completedAt ?? tx.createdAt ?? "").slice(0, 7)
      if (key in map) map[key].secondary += tx.amount ?? 0
    })
  } catch { /* non-critical */ }
  return months.map((m) => ({ month: m.label, primary: map[m.key].primary, secondary: map[m.key].secondary }))
}

async function fetchLandlord(): Promise<ChartRow[]> {
  const months = lastNMonths(6)
  const expected: Record<string, number> = {}
  const collected: Record<string, number> = {}
  months.forEach((m) => { expected[m.key] = 0; collected[m.key] = 0 })
  try {
    const cyclesRes = await apiClient.getLandlordPaymentCycles()
    const cycles: any[] = cyclesRes?.cycles ?? cyclesRes?.data ?? cyclesRes ?? []
    cycles.forEach((cycle: any) => {
      const key = (cycle.cycleStart ?? "").slice(0, 7)
      if (!(key in expected)) return
      const shares: any[] = cycle.tenantShares ?? []
      shares.forEach((ts: any) => {
        expected[key] += ts.amountDue ?? 0
        if (ts.status === "paid") collected[key] += ts.amountPaid ?? ts.amountDue ?? 0
      })
    })
  } catch { /* non-critical */ }
  try {
    const res = await apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } })
    const bookings: any[] = res?.bookings ?? res?.data ?? []
    bookings.forEach((b: any) => {
      if (!["confirmed", "completed"].includes(b.status)) return
      const key = (b.checkIn ?? b.createdAt ?? "").slice(0, 7)
      if (!(key in expected)) return
      const amt = b.priceBreakdown?.totalAmount ?? 0
      expected[key] += amt
      if (b.paymentStatus === "paid") collected[key] += amt
    })
  } catch { /* non-critical */ }
  return months.map((m) => ({ month: m.label, primary: collected[m.key], secondary: expected[m.key] }))
}

async function fetchUser(): Promise<ChartRow[]> {
  const months = lastNMonths(6)
  const map: Record<string, number> = {}
  months.forEach((m) => { map[m.key] = 0 })
  try {
    const res = await apiClient.request({ method: 'GET', url: '/bookings/my', params: { limit: 100, page: 1 } })
    const bookings: any[] = res?.bookings ?? res?.data ?? []
    bookings.forEach((b: any) => {
      if (!["confirmed", "completed"].includes(b.status)) return
      const key = (b.checkIn ?? b.createdAt ?? "").slice(0, 7)
      if (key in map) map[key] += b.priceBreakdown?.totalAmount ?? 0
    })
  } catch { /* non-critical */ }
  return months.map((m) => ({ month: m.label, primary: map[m.key], secondary: 0 }))
}

// ─── Role config ──────────────────────────────────────────────────────────────
function getRoleCfg(role: string): {
  title: string; subtitle: string
  primaryColor: string; secondaryColor: string
  labels: (rows: ChartRow[]) => SummaryConfig
} {
  switch (role) {
    case "admin": return {
      title: "Platform Revenue", subtitle: "Gross revenue & platform fees · last 6 months",
      primaryColor: "#00A699", secondaryColor: "#FF5A5F",
      labels: (rows) => ({
        primaryLabel: "Gross Revenue", secondaryLabel: "Platform Fees",
        primaryTotal: rows.reduce((s, r) => s + r.primary, 0),
        secondaryTotal: rows.reduce((s, r) => s + r.secondary, 0),
      }),
    }
    case "agent": return {
      title: "My Earnings", subtitle: "Host revenue & commissions · last 6 months",
      primaryColor: "#FF5A5F", secondaryColor: "#FC642D",
      labels: (rows) => ({
        primaryLabel: "Hosting Revenue", secondaryLabel: "Commissions",
        primaryTotal: rows.reduce((s, r) => s + r.primary, 0),
        secondaryTotal: rows.reduce((s, r) => s + r.secondary, 0),
      }),
    }
    case "landlord": return {
      title: "Rental Income", subtitle: "Collected vs expected · last 6 months",
      primaryColor: "#00A699", secondaryColor: "#FC642D",
      labels: (rows) => {
        const col = rows.reduce((s, r) => s + r.primary, 0)
        const exp = rows.reduce((s, r) => s + r.secondary, 0)
        const rate = exp > 0 ? Math.round((col / exp) * 100) : 0
        return { primaryLabel: "Collected", secondaryLabel: "Expected", primaryTotal: col, secondaryTotal: exp, extraLabel: "Collection Rate", extraValue: `${rate}%` }
      },
    }
    default: return {
      title: "Booking Spend", subtitle: "Amount spent on confirmed stays · last 6 months",
      primaryColor: "#FF5A5F", secondaryColor: "transparent",
      labels: (rows) => ({ primaryLabel: "Total Spent", secondaryLabel: "", primaryTotal: rows.reduce((s, r) => s + r.primary, 0), secondaryTotal: 0 }),
    }
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6">
      <div className="flex items-start justify-between mb-6">
        <div><Skeleton className="h-5 w-40 mb-2" /><Skeleton className="h-3.5 w-56" /></div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="h-[200px] flex items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <Skeleton className="w-full rounded-t-lg" style={{ height: `${35 + i * 8}%` }} />
            <Skeleton className="h-3 w-6 mt-2 rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-6 pt-5 border-t border-gray-100">
        {[1, 2].map(i => <Skeleton key={i} className="h-12 flex-1 rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RentalIncomeChart() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [rows, setRows] = React.useState<ChartRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const cfg = React.useMemo(() => getRoleCfg(role), [role])

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      let data: ChartRow[] = []
      if (role === "admin") data = await fetchAdmin()
      else if (role === "agent") data = await fetchAgent()
      else if (role === "landlord") data = await fetchLandlord()
      else data = await fetchUser()
      setRows(data)
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? "Failed to load data"
      setError(Array.isArray(raw) ? (raw[0]?.constraints ? Object.values(raw[0].constraints)[0] as string : "Validation error") : String(raw))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role])

  React.useEffect(() => { if (!authLoading) fetchData() }, [authLoading, fetchData])

  const trend = React.useMemo(() => calcTrend(rows), [rows])
  const summary = React.useMemo(() => cfg.labels(rows), [cfg, rows])
  const hasData = rows.some((r) => r.primary > 0 || r.secondary > 0)

  const chartConfig: ChartConfig = React.useMemo(() => ({
    primary: { label: summary.primaryLabel, color: cfg.primaryColor },
    secondary: { label: summary.secondaryLabel, color: cfg.secondaryColor },
  }), [summary, cfg])

  if (authLoading || loading) return <ChartSkeleton />

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
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
    <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
        <Wallet className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{cfg.title}</p>
      <p className="text-xs text-gray-400">
        {role === "user" ? "Your confirmed booking spend will appear here." : "Revenue will appear once bookings are confirmed."}
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
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.isPositive ? "+" : "-"}{trend.percentage}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={rows} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
              tickFormatter={fmt}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              width={56}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              content={<ChartTooltipContent
                formatter={(value, name) => [fmt(value as number), name === "primary" ? summary.primaryLabel : summary.secondaryLabel]}
              />}
            />
            <Bar dataKey="primary" fill={cfg.primaryColor} radius={[4, 4, 0, 0]} barSize={20} maxBarSize={28} />
            {summary.secondaryLabel && (
              <Bar dataKey="secondary" fill={cfg.secondaryColor} radius={[4, 4, 0, 0]} barSize={20} maxBarSize={28} opacity={0.4} />
            )}
          </BarChart>
        </ChartContainer>
      </div>

      {/* Legend row */}
      {summary.secondaryLabel && (
        <div className="flex items-center gap-4 px-6 pb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: cfg.primaryColor }} />
            <span className="text-[11px] text-gray-400 font-medium">{summary.primaryLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block opacity-40" style={{ backgroundColor: cfg.secondaryColor }} />
            <span className="text-[11px] text-gray-400 font-medium">{summary.secondaryLabel}</span>
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div className={cn(
        "border-t border-gray-100 grid divide-x divide-gray-100",
        summary.extraLabel ? "grid-cols-3" : summary.secondaryLabel ? "grid-cols-2" : "grid-cols-1",
      )}>
        <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{summary.primaryLabel}</span>
          <span className="text-base font-bold text-gray-900">{fmt(summary.primaryTotal)}</span>
        </div>
        {summary.secondaryLabel && (
          <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{summary.secondaryLabel}</span>
            <span className="text-base font-bold text-gray-900">{fmt(summary.secondaryTotal)}</span>
          </div>
        )}
        {summary.extraLabel && (
          <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{summary.extraLabel}</span>
            <span className={cn(
              "text-base font-bold",
              summary.extraValue && Number(summary.extraValue.replace("%", "")) >= 80 ? "text-[#00A699]"
                : summary.extraValue && Number(summary.extraValue.replace("%", "")) >= 60 ? "text-amber-600"
                : "text-rose-600",
            )}>
              {summary.extraValue}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}