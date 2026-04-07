"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMonthName = (date: Date) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return months[date.getMonth()]
}

const subtractMonths = (date: Date, months: number) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

const formatPrice = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return `${val}`
}

const formatPriceFull = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K FCFA`
  return `${val} FCFA`
}

const chartConfig = {
  sale: { label: "For Sale", color: "#FF5A5F" },
  rent: { label: "For Rent", color: "#00A699" },
} satisfies ChartConfig

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden p-6">
      <div className="flex items-start justify-between mb-6">
        <div><Skeleton className="h-5 w-44 mb-2" /><Skeleton className="h-3.5 w-56" /></div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="h-[200px] flex items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <Skeleton className="w-full rounded-t-lg" style={{ height: `${40 + i * 6}%` }} />
            <Skeleton className="h-3 w-6 mt-2 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-gray-100">
        <Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PropertyPriceTrends() {
  const [data, setData] = React.useState<Array<{ month: string; sale: number; rent: number }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dateRange, setDateRange] = React.useState("")
  const [trend, setTrend] = React.useState<{ percentage: number; isPositive: boolean }>({ percentage: 0, isPositive: true })

  const buildRecentMonths = (count = 6) => {
    const now = new Date()
    return Array.from({ length: count }).map((_, i) => getMonthName(subtractMonths(now, count - 1 - i)))
  }

  React.useEffect(() => {
    let mounted = true
    const fetchPriceTrends = async () => {
      setLoading(true); setError(null)
      try {
        const [saleResult, rentResult] = await Promise.all([
          apiClient.searchProperties({ listingType: 'sale', limit: 500, page: 1 }),
          apiClient.searchProperties({ listingType: 'rent', limit: 500, page: 1 }),
        ])
        if (!mounted) return
        const monthsList = buildRecentMonths(6)
        const salePrices: Record<string, number[]> = {}
        const rentPrices: Record<string, number[]> = {}
        monthsList.forEach(m => { salePrices[m] = []; rentPrices[m] = [] })
        const saleProperties = saleResult?.properties || saleResult?.data || []
        const rentProperties = rentResult?.properties || rentResult?.data || []
        saleProperties.forEach((p: any) => {
          const created = p?.createdAt || p?.publishedAt
          if (!created || !p.price) return
          const d = new Date(created)
          if (isNaN(d.getTime())) return
          const key = getMonthName(d)
          if (key in salePrices) salePrices[key].push(p.price)
        })
        rentProperties.forEach((p: any) => {
          const created = p?.createdAt || p?.publishedAt
          if (!created || !p.price) return
          const d = new Date(created)
          if (isNaN(d.getTime())) return
          const key = getMonthName(d)
          if (key in rentPrices) rentPrices[key].push(p.price)
        })
        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
        const chartData = monthsList.map(month => ({ month, sale: avg(salePrices[month]), rent: avg(rentPrices[month]) }))
        setData(chartData)
        const withSale = chartData.filter(d => d.sale > 0)
        if (withSale.length >= 2) {
          const last = withSale[withSale.length - 1].sale
          const prev = withSale[withSale.length - 2].sale
          const pct = ((last - prev) / prev) * 100
          setTrend({ percentage: Math.abs(Math.round(pct * 10) / 10), isPositive: pct >= 0 })
        }
        const year = new Date().getFullYear()
        setDateRange(`${monthsList[0]} – ${monthsList[monthsList.length - 1]} ${year}`)
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load price trends')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchPriceTrends()
    return () => { mounted = false }
  }, [])

  const hasSaleData = data.some(d => d.sale > 0)
  const hasAnyData = data.some(d => d.sale > 0 || d.rent > 0)
  const latestSale = data.filter(d => d.sale > 0).slice(-1)[0]?.sale || 0
  const latestRent = data.filter(d => d.rent > 0).slice(-1)[0]?.rent || 0

  if (loading) return <ChartSkeleton />

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <TrendingDown className="w-5 h-5 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-gray-800">Couldn't load data</p>
      <p className="text-xs text-gray-400">{error}</p>
      <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  )

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!hasAnyData) return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
        <DollarSign className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">Market Price Trends</p>
      <p className="text-xs text-gray-400">Market price trends will appear as properties are listed.</p>
    </div>
  )

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">Market Price Trends</h3>
          <p className="text-xs text-gray-400 mt-0.5">{dateRange || 'Average listing prices · last 6 months'}</p>
        </div>
        {hasSaleData && trend.percentage > 0 && (
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(v) => v.slice(0, 3)}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatPrice}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              width={38}
            />
            <ChartTooltip content={<ChartTooltipContent
              formatter={(value, name) => [formatPriceFull(value as number), name === 'sale' ? 'Avg Sale Price' : 'Avg Rent/mo']}
            />} />
            <defs>
              <linearGradient id="fillSaleNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillRentNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A699" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00A699" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="sale" name="sale" stroke="#FF5A5F" fill="url(#fillSaleNew)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#FF5A5F' }} />
            <Area type="monotone" dataKey="rent" name="rent" stroke="#00A699" fill="url(#fillRentNew)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#00A699' }} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-[#FF5A5F] inline-block" />
          <span className="text-[11px] text-gray-400 font-medium">For Sale</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-[#00A699] inline-block" />
          <span className="text-[11px] text-gray-400 font-medium">For Rent</span>
        </div>
      </div>

      {/* Footer stats */}
      <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
        <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF5A5F]" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Avg Sale</span>
          </div>
          <span className="text-base font-bold text-gray-900">{formatPriceFull(latestSale)}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00A699]" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Avg Rent</span>
          </div>
          <span className="text-base font-bold text-gray-900">{formatPriceFull(latestRent)}</span>
        </div>
      </div>
    </div>
  )
}
