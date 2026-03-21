"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
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
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K FCFA`
    return `${val} FCFA`
}

const chartConfig = {
    sale: { label: "For Sale", color: "#3b82f6" },
    rent: { label: "For Rent", color: "#8b5cf6" },
} satisfies ChartConfig

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyPriceTrends() {
    const [data, setData] = React.useState<Array<{ month: string; sale: number; rent: number }>>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [dateRange, setDateRange] = React.useState("")
    const [trend, setTrend] = React.useState<{ percentage: number; isPositive: boolean }>({
        percentage: 0, isPositive: true,
    })

    const buildRecentMonths = (count = 6) => {
        const now = new Date()
        return Array.from({ length: count }).map((_, i) =>
            getMonthName(subtractMonths(now, count - 1 - i))
        )
    }

    React.useEffect(() => {
        let mounted = true

        const fetchPriceTrends = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetch sale and rental listings from the public search endpoint
                const [saleResult, rentResult] = await Promise.all([
                    apiClient.searchProperties({ listingType: 'sale', limit: 500, page: 1 }),
                    apiClient.searchProperties({ listingType: 'rent', limit: 500, page: 1 }),
                ])

                if (!mounted) return

                const monthsList = buildRecentMonths(6)

                // Accumulate average prices per listing type per month
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

                const chartData = monthsList.map(month => ({
                    month,
                    sale: avg(salePrices[month]),
                    rent: avg(rentPrices[month]),
                }))

                setData(chartData)

                // Compute trend on sale prices
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
                console.error('Failed to load price trends:', err)
                if (mounted) setError(err?.message || 'Failed to load price trends')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchPriceTrends()
        return () => { mounted = false }
    }, [])

    return (
        <Card className="overflow-hidden border-0 -lg pb-0 bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">
                                        Market Price Trends
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">
                                        {dateRange || 'Average listing prices over the last 6 months'}
                                    </CardDescription>
                                </div>
                            </div>
                        </div>

                        {!loading && !error && data.some(d => d.sale > 0) && (
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl border",
                                trend.isPositive
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                            )}>
                                {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                <span className="text-xs font-bold">{trend.isPositive ? '+' : '-'}{trend.percentage}%</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </div>

            <CardContent className="pt-8">
                {loading ? (
                    <div className="h-[280px] w-full flex flex-col justify-end gap-2">
                        <div className="flex items-end justify-between h-full gap-2 px-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="w-full flex flex-col gap-1 items-center">
                                    <Skeleton className="w-full rounded-t-md" style={{ height: `${40 + Math.random() * 50}%` }} />
                                    <Skeleton className="h-4 w-12 mt-2" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                            <TrendingDown className="w-8 h-8 text-red-500" />
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
                ) : !data.some(d => d.sale > 0 || d.rent > 0) ? (
                    <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <DollarSign className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">No Price Data Yet</p>
                        <p className="text-xs text-gray-500">
                            Market price trends will appear as properties are listed.
                        </p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig}>
                        <AreaChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={12}
                                axisLine={false}
                                tickFormatter={(v) => v.slice(0, 3)}
                                className="text-[11px] font-bold text-slate-400"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatPrice}
                                className="text-[11px] text-slate-400"
                            />
                            <ChartTooltip
                                content={<ChartTooltipContent
                                    formatter={(value, name) => [formatPrice(value as number), name === 'sale' ? 'Avg Sale Price' : 'Avg Rent Price']}
                                />}
                            />
                            <defs>
                                <linearGradient id="fillSale" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="fillRent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="sale"
                                name="sale"
                                stroke="#3b82f6"
                                fill="url(#fillSale)"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="rent"
                                name="rent"
                                stroke="#8b5cf6"
                                fill="url(#fillRent)"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>

            {!loading && !error && data.some(d => d.sale > 0 || d.rent > 0) && (
                <CardFooter className="flex-col items-start gap-4 text-sm border-t border-slate-100 bg-slate-50/50 p-6">
                    <div className="w-full grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                                <span className="text-xs font-bold text-slate-500">Avg Sale Price</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900 ml-4.5">
                                {formatPrice(data.filter(d => d.sale > 0).slice(-1)[0]?.sale || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 bg-violet-500 rounded-sm" />
                                <span className="text-xs font-bold text-slate-500">Avg Rent Price</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900 ml-4.5">
                                {formatPrice(data.filter(d => d.rent > 0).slice(-1)[0]?.rent || 0)}
                            </span>
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
