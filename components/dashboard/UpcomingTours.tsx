"use client"

import * as React from "react"
import { Calendar, Clock, MapPin, Video, Phone, User, Home, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type TourProperty = {
    _id: string
    title: string
    city?: string
    address?: string
    price?: number
    type?: string
    listingType?: string
    images?: { url: string; isMain?: boolean }[]
}

type Tour = {
    _id: string
    id?: string
    title: string
    property?: string
    propertyId?: TourProperty | string
    clientName: string
    type: 'in-person' | 'virtual' | 'phone-call'
    date: string
    duration?: number
    status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'no-show'
    description?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    rescheduled: { label: 'Rescheduled', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
    'no-show': { label: 'No-Show', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
}

const TYPE_ICON: Record<string, React.ReactNode> = {
    'in-person': <MapPin className="w-3.5 h-3.5" />,
    'virtual': <Video className="w-3.5 h-3.5" />,
    'phone-call': <Phone className="w-3.5 h-3.5" />,
}

const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
    const isTomorrow = d.toDateString() === tomorrow.toDateString()

    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    if (isToday) return `Today at ${time}`
    if (isTomorrow) return `Tomorrow at ${time}`
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

const isPast = (iso: string) => new Date(iso) < new Date()

// ─── Component ────────────────────────────────────────────────────────────────

export function UpcomingTours() {
    const router = useRouter()
    const [tours, setTours] = React.useState<Tour[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        let mounted = true

        const fetchTours = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await apiClient.getMyTours(8)
                if (!mounted) return
                setTours(Array.isArray(data) ? data : [])
            } catch (err: any) {
                console.error('Failed to load tours:', err)
                if (mounted) setError(err?.message || 'Failed to load tours')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchTours()
        return () => { mounted = false }
    }, [])

    // Separate upcoming vs past
    const upcoming = tours.filter(t => !isPast(t.date) && t.status !== 'cancelled' && t.status !== 'completed')
    const past = tours.filter(t => isPast(t.date) || t.status === 'cancelled' || t.status === 'completed')

    const getPropertyInfo = (tour: Tour) => {
        if (typeof tour.propertyId === 'object' && tour.propertyId) {
            return tour.propertyId as TourProperty
        }
        return null
    }

    const getPropertyImage = (tour: Tour) => {
        const prop = getPropertyInfo(tour)
        if (!prop?.images?.length) return null
        const main = prop.images.find(i => i.isMain)
        return main?.url || prop.images[0]?.url || null
    }

    return (
        <Card className="overflow-hidden border-0 -lg bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="text-xl font-bold text-slate-900">
                                My Tour Appointments
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                {upcoming.length > 0
                                    ? `${upcoming.length} upcoming tour${upcoming.length > 1 ? 's' : ''}`
                                    : 'Your scheduled property tours'}
                            </CardDescription>
                        </div>
                        {upcoming.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-700">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold">{upcoming.length} upcoming</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </div>

            <CardContent className="p-0">
                {loading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                            <Calendar className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Error Loading Tours</p>
                        <p className="text-xs text-gray-500 mb-3">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : tours.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Home className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">No Tours Scheduled</p>
                        <p className="text-xs text-gray-500">
                            Browse properties and schedule a tour to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {/* Upcoming Tours */}
                        {upcoming.length > 0 && (
                            <>
                                {upcoming.map((tour) => {
                                    const prop = getPropertyInfo(tour)
                                    const img = getPropertyImage(tour)
                                    const statusCfg = STATUS_CONFIG[tour.status] || STATUS_CONFIG.scheduled

                                    return (
                                        <div
                                            key={tour._id}
                                            className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                            onClick={() => prop && router.push(`/properties/${prop._id}`)}
                                        >
                                            {/* Property Image or Type Icon */}
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                                                {img ? (
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-slate-400">
                                                        {TYPE_ICON[tour.type] || <Home className="w-5 h-5" />}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {prop?.title || tour.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(tour.date)}
                                                    </span>
                                                    {prop?.city && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            {prop.city}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <Badge className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0", statusCfg.bg, statusCfg.text)}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", statusCfg.dot)} />
                                                {statusCfg.label}
                                            </Badge>
                                        </div>
                                    )
                                })}
                            </>
                        )}

                        {/* Past Tours */}
                        {past.length > 0 && (
                            <>
                                <div className="px-4 py-2 bg-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Past</span>
                                </div>
                                {past.slice(0, 3).map((tour) => {
                                    const prop = getPropertyInfo(tour)
                                    const img = getPropertyImage(tour)
                                    const statusCfg = STATUS_CONFIG[tour.status] || STATUS_CONFIG.completed

                                    return (
                                        <div
                                            key={tour._id}
                                            className="flex items-center gap-4 p-4 opacity-60 hover:opacity-90 transition-all cursor-pointer"
                                            onClick={() => prop && router.push(`/properties/${prop._id}`)}
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                                                {img ? (
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Home className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">
                                                    {prop?.title || tour.title}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(tour.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <Badge className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border-0", statusCfg.bg, statusCfg.text)}>
                                                {statusCfg.label}
                                            </Badge>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
