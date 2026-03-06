"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { useAuth } from "@/contexts/AuthContext"

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

const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K FCFA`
    return `${val.toLocaleString()} FCFA`
}

const chartConfig = {
    expected: { label: "Expected", color: "#3b82f6" },
    collected: { label: "Collected", color: "#10b981" },
} satisfies ChartConfig

// ─── Component ────────────────────────────────────────────────────────────────

export function RentalIncomeChart() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const isLandlord = user?.role === 'landlord' || user?.role === 'admin'

    const [data, setData] = React.useState<Array<{ month: string; expected: number; collected: number }>>([])
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
        if (authLoading) return
        if (!isAuthenticated || !isLandlord) {
            setLoading(false)
            return
        }

        let mounted = true

        const fetchIncomeData = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetch both tenants and properties
                const [tenantsResult, propertiesResult] = await Promise.all([
                    apiClient.getMyTenants(),
                    apiClient.getMyProperties({ limit: 1000, page: 1 }),
                ])

                if (!mounted) return

                const tenants = tenantsResult?.tenants || tenantsResult?.data || tenantsResult || []
                const properties = propertiesResult?.properties || propertiesResult?.data || []

                const monthsList = buildRecentMonths(6)
                const now = new Date()

                // Calculate expected and collected income per month
                const expectedMap: Record<string, number> = {}
                const collectedMap: Record<string, number> = {}
                monthsList.forEach(m => { expectedMap[m] = 0; collectedMap[m] = 0 })

                // Process active tenants — each active tenant generates expected rent per month
                const activeTenants = Array.isArray(tenants) ? tenants.filter((t: any) =>
                    t.status === 'active' || t.status === 'pending'
                ) : []

                monthsList.forEach((monthName, idx) => {
                    const monthDate = subtractMonths(now, monthsList.length - 1 - idx)
                    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
                    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

                    activeTenants.forEach((tenant: any) => {
                        const leaseStart = new Date(tenant.leaseStart)
                        const leaseEnd = new Date(tenant.leaseEnd)
                        const rent = tenant.monthlyRent || 0

                        // Check if tenant lease covers this month
                        if (leaseStart <= monthEnd && leaseEnd >= monthStart && rent > 0) {
                            expectedMap[monthName] += rent

                            // For past/current months, simulate collection rate
                            // Active tenants are assumed to have paid; pending = not yet
                            if (monthEnd <= now) {
                                if (tenant.status === 'active') {
                                    collectedMap[monthName] += rent
                                }
                                // pending tenants don't contribute to collected
                            }
                        }
                    })
                })

                // If no tenant data, derive from rental properties
                if (activeTenants.length === 0 && properties.length > 0) {
                    const rentalProps = properties.filter((p: any) =>
                        p.type === 'rent' || p.listingType === 'rent'
                    )

                    monthsList.forEach((monthName) => {
                        rentalProps.forEach((p: any) => {
                            expectedMap[monthName] += (p.price || 0)
                        })
                    })
                }

                const chartData = monthsList.map(month => ({
                    month,
                    expected: expectedMap[month],
                    collected: collectedMap[month],
                }))

                setData(chartData)

                // Compute trend on collected income
                const withData = chartData.filter(d => d.collected > 0 || d.expected > 0)
                if (withData.length >= 2) {
                    const last = withData[withData.length - 1].collected || withData[withData.length - 1].expected
                    const prev = withData[withData.length - 2].collected || withData[withData.length - 2].expected
                    if (prev > 0) {
                        const pct = ((last - prev) / prev) * 100
                        setTrend({ percentage: Math.abs(Math.round(pct * 10) / 10), isPositive: pct >= 0 })
                    }
                }

                const year = new Date().getFullYear()
                setDateRange(`${monthsList[0]} – ${monthsList[monthsList.length - 1]} ${year}`)

            } catch (err: any) {
                console.error('Failed to load rental income data:', err)
                if (mounted) setError(err?.message || 'Failed to load rental income')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchIncomeData()
        return () => { mounted = false }
    }, [isAuthenticated, isLandlord, authLoading])

    const totalExpected = React.useMemo(
        () => data.reduce((sum, d) => sum + d.expected, 0), [data]
    )
    const totalCollected = React.useMemo(
        () => data.reduce((sum, d) => sum + d.collected, 0), [data]
    )
    const collectionRate = totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0

    return (
        <Card className="overflow-hidden border-0 shadow-lg pb-0 bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">
                                        Rental Income
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">
                                        {dateRange || 'Monthly income over the last 6 months'}
                                    </CardDescription>
                                </div>
                            </div>
                        </div>

                        {!loading && !error && data.some(d => d.expected > 0) && (
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
                                    <Skeleton className="w-full rounded-t-md" style={{ height: `${30 + Math.random() * 50}%` }} />
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
                ) : !data.some(d => d.expected > 0 || d.collected > 0) ? (
                    <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Wallet className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">No Income Data Yet</p>
                        <p className="text-xs text-gray-500">
                            Rental income will appear once you have active tenants.
                        </p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig}>
                        <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                tickFormatter={formatCurrency}
                                className="text-[11px] text-slate-400"
                            />
                            <ChartTooltip
                                cursor={{ fill: 'rgba(241, 149, 149, 0.05)' }}
                                content={<ChartTooltipContent
                                    formatter={(value, name) => [
                                        formatCurrency(value as number),
                                        name === 'expected' ? 'Expected' : 'Collected'
                                    ]}
                                />}
                            />
                            <Bar
                                dataKey="expected"
                                name="Expected"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                                opacity={0.3}
                            />
                            <Bar
                                dataKey="collected"
                                name="Collected"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>

            {!loading && !error && data.some(d => d.expected > 0 || d.collected > 0) && (
                <CardFooter className="flex-col items-start gap-4 text-sm border-t border-slate-100 bg-slate-50/50 p-6">
                    <div className="w-full grid grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm opacity-40" />
                                <span className="text-xs font-bold text-slate-500">Expected</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900 ml-4.5">
                                {formatCurrency(totalExpected)}
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                                <span className="text-xs font-bold text-slate-500">Collected</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900 ml-4.5">
                                {formatCurrency(totalCollected)}
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
                                <span className="text-xs font-bold text-slate-500">Rate</span>
                            </div>
                            <span className={cn(
                                "text-lg font-bold ml-4.5",
                                collectionRate >= 90 ? "text-emerald-600" :
                                    collectionRate >= 70 ? "text-amber-600" : "text-rose-600"
                            )}>
                                {collectionRate}%
                            </span>
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
