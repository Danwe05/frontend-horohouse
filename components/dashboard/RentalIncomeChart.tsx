"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Wallet, RefreshCw } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

// ─── Shared types ─────────────────────────────────────────────────────────────
interface ChartRow {
  month: string
  primary: number    // main metric per role
  secondary: number  // secondary bar (0 = hidden)
}
interface SummaryConfig {
  primaryLabel: string
  secondaryLabel: string
  primaryTotal: number
  secondaryTotal: number
  extraLabel?: string
  extraValue?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M XAF`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K XAF`
  return `${v.toLocaleString()} XAF`
}

function lastNMonths(n = 6) {
  const now = new Date()
  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short" }),
    }
  })
}

function periodLabel(period: string) {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-")
    return new Date(Number(y), Number(m) - 1, 1)
      .toLocaleString("default", { month: "short" })
  }
  return period
}

function buildDateRange(months = 6) {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate:   end.toISOString().split("T")[0],
  }
}

function calcTrend(rows: ChartRow[]) {
  if (rows.length < 2) return { percentage: 0, isPositive: true }
  const last = rows[rows.length - 1].primary
  const prev = rows[rows.length - 2].primary
  if (prev === 0) return { percentage: 0, isPositive: true }
  const pct = ((last - prev) / prev) * 100
  return { percentage: Math.abs(Math.round(pct * 10) / 10), isPositive: pct >= 0 }
}

// ─── Per-role data fetchers ───────────────────────────────────────────────────

async function fetchAdmin(): Promise<ChartRow[]> {
  const { startDate, endDate } = buildDateRange(6)
  const points: any[] = await apiClient.request({
    method: "GET",
    url: "/analytics/admin/revenue",
    params: { startDate, endDate, granularity: "month" },
  })
  if (!Array.isArray(points)) return []
  return points.map((p) => ({
    month:     periodLabel(p.period),
    primary:   p.grossRevenue ?? 0,
    secondary: p.platformFees ?? 0,
  }))
}

async function fetchAgent(): Promise<ChartRow[]> {
  const months = lastNMonths(6)
  const map: Record<string, { primary: number; secondary: number }> = {}
  months.forEach((m) => { map[m.key] = { primary: 0, secondary: 0 } })

  // Host booking revenue (completed stays)
  try {
    const res = await apiClient.request({ method: 'GET', url: '/bookings/hosting', params: { limit: 100, page: 1 } })
    const bookings: any[] = res?.bookings ?? res?.data ?? []
    bookings.forEach((b: any) => {
      if (!["confirmed", "completed"].includes(b.status)) return
      const key = (b.createdAt ?? b.checkIn ?? "").slice(0, 7)
      if (key in map) map[key].primary += b.priceBreakdown?.totalAmount ?? 0
    })
  } catch { /* non-critical */ }

  // Commission / success transactions
  try {
    const res = await apiClient.request({ method: 'GET', url: '/payments/transactions', params: { status: 'success', limit: 100, page: 1 } })
    const txs: any[] = res?.transactions ?? res?.data ?? []
    txs.forEach((tx: any) => {
      const key = (tx.completedAt ?? tx.createdAt ?? "").slice(0, 7)
      if (key in map) map[key].secondary += tx.amount ?? 0
    })
  } catch { /* non-critical */ }

  return months.map((m) => ({
    month:     m.label,
    primary:   map[m.key].primary,
    secondary: map[m.key].secondary,
  }))
}

async function fetchLandlord(): Promise<ChartRow[]> {
  const months = lastNMonths(6)
  const expected: Record<string, number>  = {}
  const collected: Record<string, number> = {}
  months.forEach((m) => { expected[m.key] = 0; collected[m.key] = 0 })

  // Long-term: payment cycles
  try {
    const cyclesRes = await apiClient.getLandlordPaymentCycles()
    const cycles: any[] = cyclesRes?.cycles ?? cyclesRes?.data ?? cyclesRes ?? []
    cycles.forEach((cycle: any) => {
      const key = (cycle.cycleStart ?? "").slice(0, 7)
      if (!(key in expected)) return
      const shares: any[] = cycle.tenantShares ?? []
      shares.forEach((ts: any) => {
        expected[key]  += ts.amountDue ?? 0
        if (ts.status === "paid") collected[key] += ts.amountPaid ?? ts.amountDue ?? 0
      })
    })
  } catch { /* non-critical */ }

  // Short-term: host bookings
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

  return months.map((m) => ({
    month:     m.label,
    primary:   collected[m.key],  // collected = green bar
    secondary: expected[m.key],   // expected = blue ghost
  }))
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

  return months.map((m) => ({
    month:     m.label,
    primary:   map[m.key],
    secondary: 0,
  }))
}

// ─── Role display config ──────────────────────────────────────────────────────
function getRoleCfg(role: string): {
  title: string
  subtitle: string
  primaryColor: string
  secondaryColor: string
  labels: (rows: ChartRow[]) => SummaryConfig
} {
  switch (role) {
    case "admin":
      return {
        title: "Platform Revenue",
        subtitle: "Gross revenue & platform fees — last 6 months",
        primaryColor: "#10b981", secondaryColor: "#3b82f6",
        labels: (rows) => ({
          primaryLabel: "Gross Revenue", secondaryLabel: "Platform Fees",
          primaryTotal:   rows.reduce((s, r) => s + r.primary, 0),
          secondaryTotal: rows.reduce((s, r) => s + r.secondary, 0),
        }),
      }
    case "agent":
      return {
        title: "My Earnings",
        subtitle: "Host revenue + commissions — last 6 months",
        primaryColor: "#6366f1", secondaryColor: "#f59e0b",
        labels: (rows) => ({
          primaryLabel: "Hosting Revenue", secondaryLabel: "Commissions",
          primaryTotal:   rows.reduce((s, r) => s + r.primary, 0),
          secondaryTotal: rows.reduce((s, r) => s + r.secondary, 0),
        }),
      }
    case "landlord":
      return {
        title: "Rental Income",
        subtitle: "Collected vs expected — last 6 months",
        primaryColor: "#10b981", secondaryColor: "#f59e0b",
        labels: (rows) => {
          const col = rows.reduce((s, r) => s + r.primary, 0)
          const exp = rows.reduce((s, r) => s + r.secondary, 0)
          const rate = exp > 0 ? Math.round((col / exp) * 100) : 0
          return {
            primaryLabel: "Collected", secondaryLabel: "Expected",
            primaryTotal: col, secondaryTotal: exp,
            extraLabel: "Collection Rate", extraValue: `${rate}%`,
          }
        },
      }
    default: // user
      return {
        title: "Booking Spend",
        subtitle: "Amount spent on confirmed stays — last 6 months",
        primaryColor: "#8b5cf6", secondaryColor: "transparent",
        labels: (rows) => ({
          primaryLabel: "Total Spent", secondaryLabel: "",
          primaryTotal:   rows.reduce((s, r) => s + r.primary, 0),
          secondaryTotal: 0,
        }),
      }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RentalIncomeChart() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const role = user?.role ?? "user"

  const [rows, setRows]       = React.useState<ChartRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError]     = React.useState<string | null>(null)

  const cfg = React.useMemo(() => getRoleCfg(role), [role])

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      let data: ChartRow[] = []
      if (role === "admin")         data = await fetchAdmin()
      else if (role === "agent")    data = await fetchAgent()
      else if (role === "landlord") data = await fetchLandlord()
      else                          data = await fetchUser()
      setRows(data)
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? "Failed to load data"
      setError(Array.isArray(raw) ? (raw[0]?.constraints ? Object.values(raw[0].constraints)[0] as string : "Validation error") : String(raw))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role])

  React.useEffect(() => { if (!authLoading) fetchData() }, [authLoading, fetchData])

  const trend   = React.useMemo(() => calcTrend(rows), [rows])
  const summary = React.useMemo(() => cfg.labels(rows), [cfg, rows])
  const hasData = rows.some((r) => r.primary > 0 || r.secondary > 0)

  const chartConfig: ChartConfig = React.useMemo(() => ({
    primary:   { label: summary.primaryLabel,   color: cfg.primaryColor },
    secondary: { label: summary.secondaryLabel, color: cfg.secondaryColor },
  }), [summary, cfg])

  if (authLoading || loading) return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <Skeleton className="h-6 w-44 mb-2" /><Skeleton className="h-4 w-56" />
      </div>
      <CardContent className="pt-8">
        <div className="h-[280px] flex items-end gap-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center">
              <Skeleton className="w-full rounded-t-md" style={{ height: `${35 + Math.random() * 45}%` }} />
              <Skeleton className="h-3 w-8 mt-2" />
            </div>
          ))}
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
    <Card className="overflow-hidden border-0 shadow-lg bg-white">
      <div className="p-6 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">{cfg.title}</CardTitle>
        <CardDescription className="text-slate-500">{cfg.subtitle}</CardDescription>
      </div>
      <CardContent className="flex flex-col items-center justify-center h-[280px] text-center p-4">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Wallet className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No data yet</p>
        <p className="text-xs text-gray-400">
          {role === "user"
            ? "Your confirmed booking spend will appear here."
            : "Revenue will appear once bookings are confirmed."}
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
          <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tickLine={false} tickMargin={12} axisLine={false}
              className="text-[11px] font-bold text-slate-400" />
            <YAxis tickLine={false} axisLine={false} tickFormatter={fmt}
              className="text-[11px] text-slate-400" width={72} />
            <ChartTooltip
              cursor={{ fill: "rgba(99,102,241,0.05)" }}
              content={<ChartTooltipContent
                formatter={(value, name) => [
                  fmt(value as number),
                  name === "primary" ? summary.primaryLabel : summary.secondaryLabel,
                ]}
              />}
            />
            <Bar dataKey="primary" fill={cfg.primaryColor} radius={[4, 4, 0, 0]} barSize={20} />
            {summary.secondaryLabel && (
              <Bar dataKey="secondary" fill={cfg.secondaryColor}
                radius={[4, 4, 0, 0]} barSize={20} opacity={0.45} />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-6">
        <div className={cn("w-full grid gap-4",
          summary.extraLabel ? "grid-cols-3" : summary.secondaryLabel ? "grid-cols-2" : "grid-cols-1")}>
          {/* Primary */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.primaryColor }} />
              <span className="text-xs font-bold text-slate-500">{summary.primaryLabel}</span>
            </div>
            <span className="text-lg font-bold text-slate-900 pl-4">{fmt(summary.primaryTotal)}</span>
          </div>
          {/* Secondary */}
          {summary.secondaryLabel && (
            <div className="flex flex-col border-l border-slate-100 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-sm opacity-50"
                  style={{ backgroundColor: cfg.secondaryColor }} />
                <span className="text-xs font-bold text-slate-500">{summary.secondaryLabel}</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{fmt(summary.secondaryTotal)}</span>
            </div>
          )}
          {/* Extra (landlord collection rate) */}
          {summary.extraLabel && (
            <div className="flex flex-col border-l border-slate-100 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
                <span className="text-xs font-bold text-slate-500">{summary.extraLabel}</span>
              </div>
              <span className={cn("text-lg font-bold pl-4",
                summary.extraValue && Number(summary.extraValue.replace("%","")) >= 80
                  ? "text-emerald-600"
                  : summary.extraValue && Number(summary.extraValue.replace("%","")) >= 60
                    ? "text-amber-600" : "text-rose-600"
              )}>
                {summary.extraValue}
              </span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}