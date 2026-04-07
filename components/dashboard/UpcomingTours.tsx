"use client"

import * as React from "react"
import { Calendar, Clock, MapPin, Video, Phone, Home, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────
type TourProperty = {
  _id: string; title: string; city?: string; address?: string
  price?: number; type?: string; listingType?: string
  images?: { url: string; isMain?: boolean }[]
}
type Tour = {
  _id: string; id?: string; title: string; property?: string
  propertyId?: TourProperty | string; clientName: string
  type: 'in-person' | 'virtual' | 'phone-call'; date: string
  duration?: number; status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'no-show'
  description?: string
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-400' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-400' },
  completed:   { label: 'Completed',   cls: 'bg-[#E8F5F4] text-[#00A699]', dot: 'bg-[#00A699]' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-rose-50 text-rose-600',    dot: 'bg-rose-400' },
  'no-show':   { label: 'No-Show',     cls: 'bg-gray-50 text-gray-500',    dot: 'bg-gray-400' },
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  'in-person':  <MapPin  className="w-3.5 h-3.5" />,
  'virtual':    <Video   className="w-3.5 h-3.5" />,
  'phone-call': <Phone   className="w-3.5 h-3.5" />,
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const isToday    = d.toDateString() === now.toDateString()
  const tomorrow   = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (isToday)    return `Today · ${time}`
  if (isTomorrow) return `Tomorrow · ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`
}

const isPast = (iso: string) => new Date(iso) < new Date()

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TourSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <Skeleton className="h-5 w-44 mb-2" /><Skeleton className="h-3.5 w-32" />
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Row component ────────────────────────────────────────────────────────────
function TourRow({ tour, dim = false, onClick }: { tour: Tour; dim?: boolean; onClick?: () => void }) {
  const prop = typeof tour.propertyId === 'object' && tour.propertyId ? tour.propertyId as TourProperty : null
  const imgSrc = (() => {
    if (!prop?.images?.length) return null
    const main = prop.images.find(i => i.isMain)
    return main?.url || prop.images[0]?.url || null
  })()
  const sc = STATUS_CONFIG[tour.status] ?? STATUS_CONFIG.scheduled

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 transition-all",
        onClick ? "cursor-pointer hover:bg-gray-50/80" : "",
        dim ? "opacity-50" : "",
      )}
    >
      {/* Thumb */}
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400">{TYPE_ICON[tour.type] ?? <Home className="w-4 h-4" />}</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold text-gray-900 truncate", onClick && !dim && "group-hover:text-[#FF5A5F] transition-colors")}>
          {prop?.title || tour.title}
        </p>
        <div className="flex items-center gap-2.5 mt-0.5 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(tour.date)}</span>
          {prop?.city && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{prop.city}</span>}
        </div>
      </div>

      {/* Status */}
      <Badge className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-full border-0 whitespace-nowrap", sc.cls)}>
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", sc.dot)} />
        {sc.label}
      </Badge>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function UpcomingTours() {
  const router = useRouter()
  const [tours, setTours] = React.useState<Tour[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const fetchTours = async () => {
      setLoading(true); setError(null)
      try {
        const data = await apiClient.getMyTours(8)
        if (!mounted) return
        setTours(Array.isArray(data) ? data : [])
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load tours')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchTours()
    return () => { mounted = false }
  }, [])

  const upcoming = tours.filter(t => !isPast(t.date) && t.status !== 'cancelled' && t.status !== 'completed')
  const past     = tours.filter(t => isPast(t.date) || t.status === 'cancelled' || t.status === 'completed')

  const navigateToProp = (tour: Tour) => {
    const prop = typeof tour.propertyId === 'object' && tour.propertyId ? tour.propertyId as TourProperty : null
    if (prop) router.push(`/properties/${prop._id}`)
  }

  if (loading) return <TourSkeleton />

  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">My Tour Appointments</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {upcoming.length > 0
              ? `${upcoming.length} upcoming tour${upcoming.length > 1 ? 's' : ''}`
              : 'Your scheduled property tours'}
          </p>
        </div>
        {upcoming.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <Calendar className="h-3 w-3" />{upcoming.length} upcoming
          </span>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Couldn't load tours</p>
          <p className="text-xs text-gray-400">{error}</p>
          <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      ) : tours.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
            <Home className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No Tours Scheduled</p>
          <p className="text-xs text-gray-400">Browse properties and schedule a tour to see them here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Upcoming */}
          {upcoming.map(tour => (
            <TourRow key={tour._id} tour={tour} onClick={() => navigateToProp(tour)} />
          ))}

          {/* Past section */}
          {past.length > 0 && (
            <>
              <div className="px-5 py-2 bg-gray-50/70">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Past</span>
              </div>
              {past.slice(0, 3).map(tour => (
                <TourRow key={tour._id} tour={tour} dim onClick={() => navigateToProp(tour)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
