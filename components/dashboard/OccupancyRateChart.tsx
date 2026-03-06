"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { Building2, Home, AlertTriangle } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
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
import { cn } from "@/lib/utils"

// ─── Config ───────────────────────────────────────────────────────────────────

const chartConfig = {
    properties: { label: "Properties" },
    occupied: { label: "Occupied", color: "#10b981" },
    vacant: { label: "Vacant", color: "#f59e0b" },
    pending: { label: "Pending", color: "#8b5cf6" },
} satisfies ChartConfig

interface OccupancyData {
    name: string
    value: number
    fill: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OccupancyRateChart() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const isLandlord = user?.role === 'landlord' || user?.role === 'admin'

    const [data, setData] = React.useState<OccupancyData[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [totalProperties, setTotalProperties] = React.useState(0)
    const [stats, setStats] = React.useState({
        occupied: 0,
        vacant: 0,
        pending: 0,
        occupancyRate: 0,
    })

    React.useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated || !isLandlord) {
            setLoading(false)
            return
        }

        let mounted = true

        const fetchOccupancyData = async () => {
            setLoading(true)
            setError(null)

            try {
                const [tenantsResult, propertiesResult] = await Promise.all([
                    apiClient.getMyTenants(),
                    apiClient.getMyProperties({ limit: 1000, page: 1 }),
                ])

                if (!mounted) return

                const tenants = tenantsResult?.tenants || tenantsResult?.data || tenantsResult || []
                const properties = propertiesResult?.properties || propertiesResult?.data || []

                // Count rental properties
                const rentalProperties = properties.filter((p: any) =>
                    p.type === 'rent' || p.listingType === 'rent'
                )

                const total = rentalProperties.length || properties.length
                setTotalProperties(total)

                if (total === 0) {
                    setData([])
                    setStats({ occupied: 0, vacant: 0, pending: 0, occupancyRate: 0 })
                    return
                }

                // Determine occupancy from tenants
                const activeTenants = Array.isArray(tenants) ? tenants.filter((t: any) => t.status === 'active') : []
                const pendingTenants = Array.isArray(tenants) ? tenants.filter((t: any) => t.status === 'pending') : []

                // Unique properties with active tenants
                const occupiedPropertyIds = new Set(
                    activeTenants.map((t: any) => t.propertyId?.toString())
                )
                const pendingPropertyIds = new Set(
                    pendingTenants
                        .filter((t: any) => !occupiedPropertyIds.has(t.propertyId?.toString()))
                        .map((t: any) => t.propertyId?.toString())
                )

                const occupied = occupiedPropertyIds.size
                const pending = pendingPropertyIds.size
                const vacant = Math.max(0, total - occupied - pending)
                const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0

                setStats({ occupied, vacant, pending, occupancyRate })

                const chartData: OccupancyData[] = []
                if (occupied > 0) chartData.push({ name: "occupied", value: occupied, fill: "#10b981" })
                if (vacant > 0) chartData.push({ name: "vacant", value: vacant, fill: "#f59e0b" })
                if (pending > 0) chartData.push({ name: "pending", value: pending, fill: "#8b5cf6" })

                // If all are the same status, still show the chart
                if (chartData.length === 0 && total > 0) {
                    chartData.push({ name: "vacant", value: total, fill: "#f59e0b" })
                }

                setData(chartData)

            } catch (err: any) {
                console.error('Failed to load occupancy data:', err)
                if (mounted) setError(err?.message || 'Failed to load occupancy data')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchOccupancyData()
        return () => { mounted = false }
    }, [isAuthenticated, isLandlord, authLoading])

    const statusItems = [
        {
            label: "Occupied",
            value: stats.occupied,
            color: "#10b981",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-700",
        },
        {
            label: "Vacant",
            value: stats.vacant,
            color: "#f59e0b",
            bgColor: "bg-amber-50",
            textColor: "text-amber-700",
        },
        {
            label: "Pending",
            value: stats.pending,
            color: "#8b5cf6",
            bgColor: "bg-violet-50",
            textColor: "text-violet-700",
        },
    ]

    return (
        <Card className="overflow-hidden border-0 shadow-lg pb-0 bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="text-xl font-bold text-slate-900">
                                Occupancy Rate
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                {totalProperties > 0
                                    ? `${totalProperties} total ${totalProperties === 1 ? 'property' : 'properties'}`
                                    : 'Property occupancy overview'}
                            </CardDescription>
                        </div>

                        {!loading && !error && totalProperties > 0 && (
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs",
                                stats.occupancyRate >= 80
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : stats.occupancyRate >= 50
                                        ? "bg-amber-50 border-amber-200 text-amber-700"
                                        : "bg-rose-50 border-rose-200 text-rose-700"
                            )}>
                                {stats.occupancyRate}% Filled
                            </div>
                        )}
                    </div>
                </CardHeader>
            </div>

            <CardContent className="pt-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <Skeleton className="w-[200px] h-[200px] rounded-full" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Skeleton className="w-[120px] h-[120px] rounded-full bg-background" />
                            </div>
                        </div>
                        <div className="flex gap-6 mt-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Skeleton className="w-3 h-3 rounded-full" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
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
                ) : totalProperties === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">No Properties Yet</p>
                        <p className="text-xs text-gray-500">
                            Add properties to see your occupancy rate.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square w-full max-w-[260px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={70}
                                    outerRadius={100}
                                    strokeWidth={4}
                                    stroke="#fff"
                                    paddingAngle={3}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <g>
                                                        <text
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) - 8}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                className={cn(
                                                                    "text-4xl font-black",
                                                                    stats.occupancyRate >= 80 ? "fill-emerald-600" :
                                                                        stats.occupancyRate >= 50 ? "fill-amber-600" : "fill-rose-600"
                                                                )}
                                                            >
                                                                {stats.occupancyRate}%
                                                            </tspan>
                                                        </text>
                                                        <text
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 20}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                className="fill-slate-400 text-[10px] font-bold uppercase tracking-widest"
                                                            >
                                                                Occupancy
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

                        {/* Legend Grid */}
                        <div className="w-full grid grid-cols-3 gap-3 mt-4 border-t border-slate-100 bg-slate-50/50 p-6 -mx-6 rounded-b-3xl">
                            {statusItems.map((item) => (
                                <div
                                    key={item.label}
                                    className={cn(
                                        "flex flex-col items-center p-3 rounded-xl border transition-all",
                                        item.value > 0
                                            ? `${item.bgColor} border-opacity-50`
                                            : "bg-transparent border-transparent"
                                    )}
                                    style={{ borderColor: item.value > 0 ? `${item.color}30` : 'transparent' }}
                                >
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className={cn("text-2xl font-black", item.textColor)}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
