"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, Edit, Trash2, Eye, Home,
  BellOff, Plus, TrendingUp, Clock, MoreVertical,
  MapPin, Home as HomeIcon, Bed, Bath, Banknote, BellRing, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import SaveSearchModal from '@/components/saved-searches/SaveSearchModal';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavedSearch {
  _id: string;
  name: string;
  searchCriteria: {
    city?: string; propertyType?: string; listingType?: string;
    minPrice?: number; maxPrice?: number; bedrooms?: number;
    bathrooms?: number; amenities?: string[];
  };
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  isActive: boolean;
  resultsCount: number;
  newMatchingProperties: string[];
  lastChecked: string;
  lastNotificationSent?: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  totalSearches: number; activeSearches: number;
  totalNewMatches: number;
  byFrequency: { instant: number; daily: number; weekly: number; never: number };
  totalResults: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (price?: number) => {
  if (!price) return 'Any';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(price);
};

const FREQ_CONFIG = {
  instant: { label: 'Instant', cls: 'bg-rose-50 text-[#FF385C]', icon: Bell },
  daily: { label: 'Daily', cls: 'bg-[#F7F7F7] text-[#222222]', icon: Clock },
  weekly: { label: 'Weekly', cls: 'bg-[#F7F7F7] text-[#717171]', icon: Clock },
  never: { label: 'Off', cls: 'bg-[#F7F7F7] text-[#717171]', icon: BellOff },
};

function FrequencyBadge({ frequency }: { frequency: string }) {
  const { label, cls, icon: Icon } = FREQ_CONFIG[frequency as keyof typeof FREQ_CONFIG] ?? FREQ_CONFIG.never;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium', cls)}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function CriteriaPill({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-[#DDDDDD] text-[#222222] text-[12px] font-medium px-3 py-1.5 rounded-full">
      <Icon className="w-3.5 h-3.5 text-[#222222]" />
      {children}
    </div>
  );
}

function formatCriteriaPills(criteria: SavedSearch['searchCriteria']) {
  const pills = [];
  if (criteria.city) pills.push(<CriteriaPill key="city" icon={MapPin}>{criteria.city}</CriteriaPill>);
  if (criteria.listingType) pills.push(<CriteriaPill key="lt" icon={HomeIcon}>{criteria.listingType === 'sale' ? 'Buy' : 'Rent'}</CriteriaPill>);
  if (criteria.propertyType) pills.push(<CriteriaPill key="pt" icon={Home}>{criteria.propertyType}</CriteriaPill>);
  if (criteria.minPrice || criteria.maxPrice)
    pills.push(<CriteriaPill key="price" icon={Banknote}>{formatPrice(criteria.minPrice)} – {formatPrice(criteria.maxPrice)}</CriteriaPill>);
  if (criteria.bedrooms) pills.push(<CriteriaPill key="beds" icon={Bed}>{criteria.bedrooms}+ Beds</CriteriaPill>);
  if (criteria.bathrooms) pills.push(<CriteriaPill key="baths" icon={Bath}>{criteria.bathrooms}+ Baths</CriteriaPill>);
  if (pills.length === 0) return <span className="text-[14px] text-[#717171] italic">No specific criteria</span>;
  return pills;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <main className="p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex items-end justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-9 w-64 rounded-xl" />
                  <Skeleton className="h-5 w-96 rounded-lg" />
                </div>
                <Skeleton className="h-12 w-36 rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#DDDDDD] p-6 flex flex-col gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-8 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#DDDDDD] p-6 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-3/4 rounded" />
                        <div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-md" /><Skeleton className="h-6 w-20 rounded-md" /></div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Skeleton className="h-8 w-24 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                      <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                    <div className="pt-4 border-t border-[#DDDDDD] flex items-center justify-between">
                      <Skeleton className="h-10 w-24 rounded-lg" />
                      <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#DDDDDD] p-6 flex flex-col hover:border-blue-600 transition-colors duration-200">
      <div className="mb-4 text-[#222222]">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-[#717171] mb-1">{label}</p>
        <p className="text-3xl font-semibold text-[#222222] tracking-tight">{value}</p>
        {sub && <p className="text-[14px] text-[#717171] mt-2">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Search Card ──────────────────────────────────────────────────────────────
function SearchCard({
  search, onViewResults, onToggleActive, onEdit, onDelete,
}: {
  search: SavedSearch;
  onViewResults: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasNew = search.newMatchingProperties.length > 0;

  return (
    <div className={cn(
      'bg-white rounded-2xl border transition-all duration-300 flex flex-col h-full',
      search.isActive ? 'border-[#DDDDDD] hover:shadow-lg' : 'border-[#EBEBEB] opacity-80',
    )}>
      <div className="p-6 flex flex-col h-full">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="min-w-0 pr-4">
            <h3 className="font-semibold text-[#222222] text-[18px] truncate mb-2">{search.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border',
                search.isActive
                  ? 'bg-[#ECFDF5] text-[#008A05] border-[#008A05]/20'
                  : 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]'
              )}>
                {search.isActive ? 'Active' : 'Paused'}
              </span>
              <FrequencyBadge frequency={search.notificationFrequency} />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#222222] hover:bg-[#F7F7F7] rounded-full flex-shrink-0">
                <MoreVertical className="h-5 w-5 stroke-[1.5]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#DDDDDD] shadow-lg p-2">
              <DropdownMenuItem onClick={onViewResults} className="cursor-pointer text-[15px] p-3 rounded-lg hover:bg-[#F7F7F7] focus:bg-[#F7F7F7]">
                <Eye className="h-4 w-4 mr-3 text-[#222222] stroke-[1.5]" /> View Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive} className="cursor-pointer text-[15px] p-3 rounded-lg hover:bg-[#F7F7F7] focus:bg-[#F7F7F7]">
                {search.isActive
                  ? <><BellOff className="h-4 w-4 mr-3 text-[#222222] stroke-[1.5]" /> Pause Alerts</>
                  : <><Bell className="h-4 w-4 mr-3 text-[#FF385C] stroke-[1.5]" /> Activate Alerts</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer text-[15px] p-3 rounded-lg hover:bg-[#F7F7F7] focus:bg-[#F7F7F7]">
                <Edit className="h-4 w-4 mr-3 text-[#222222] stroke-[1.5]" /> Edit Search
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#DDDDDD] my-1" />
              <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-[15px] p-3 rounded-lg text-[#FF385C] hover:bg-rose-50 focus:bg-rose-50 focus:text-[#FF385C]">
                <Trash2 className="h-4 w-4 mr-3 stroke-[1.5]" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Criteria area */}
        <div className="flex-grow mb-6">
          <p className="text-[14px] font-medium text-[#222222] mb-3">Filters applied</p>
          <div className="flex flex-wrap gap-2">
            {formatCriteriaPills(search.searchCriteria)}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#DDDDDD] pt-5 flex items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[12px] font-medium text-[#717171] mb-1">New</p>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[16px] font-semibold", hasNew ? "text-[#FF385C]" : "text-[#222222]")}>
                  {search.newMatchingProperties.length}
                </span>
                {hasNew && <span className="flex h-2 w-2 rounded-full blue-blue-600" />}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[#717171] mb-1">Total</p>
              <span className="text-[16px] font-semibold text-[#222222]">{search.resultsCount}</span>
            </div>
          </div>

          <button
            onClick={onViewResults}
            className="px-5 py-2.5 text-[15px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [searchesData, statsData] = await Promise.all([
        apiClient.getSavedSearches(),
        apiClient.getSavedSearchStatistics(),
      ]);
      setSearches(searchesData);
      setStatistics(statsData);
    } catch (error: any) {
      toast.error('Failed to load saved searches', { description: error?.response?.data?.message || 'Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.deleteSavedSearch(deleteId);
      toast.success('Search deleted');
      setSearches(s => s.filter(x => x._id !== deleteId));
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete', { description: error?.response?.data?.message });
    }
  };

  const handleToggleActive = async (search: SavedSearch) => {
    try {
      const updated = await apiClient.updateSavedSearch(search._id, { isActive: !search.isActive });
      setSearches(s => s.map(x => x._id === search._id ? updated : x));
      toast.success(`Search ${updated.isActive ? 'activated' : 'paused'}`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update', { description: error?.response?.data?.message });
    }
  };

  const handleUpdateSearch = async (data: any) => {
    if (!editingSearch) return;
    try {
      const updated = await apiClient.updateSavedSearch(editingSearch._id, data);
      setSearches(s => s.map(x => x._id === editingSearch._id ? updated : x));
      toast.success('Search updated');
      setShowEditModal(false);
      setEditingSearch(null);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update', { description: error?.response?.data?.message });
      throw error;
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-10">

              {/* ── Header ── */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-2">
                    Saved searches
                  </h1>
                  <p className="text-[16px] text-[#717171]">
                    Manage your property alerts and get notified of new matches.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 text-[15px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> Create new alert
                </button>
              </div>

              {/* ── Statistics ── */}
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard icon={Search} label="Total Searches" value={statistics.totalSearches} sub={`${statistics.activeSearches} active`} />
                  <StatCard icon={TrendingUp} label="New Matches" value={statistics.totalNewMatches} sub="Waiting for you" />
                  <StatCard icon={HomeIcon} label="Total Results" value={statistics.totalResults} sub="Matching criteria" />
                  <StatCard
                    icon={Bell}
                    label="Alert Setup"
                    value={
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[14px] font-semibold text-[#222222]">{statistics.byFrequency.instant} Instant</span>
                        <span className="text-[#DDDDDD]">•</span>
                        <span className="text-[14px] font-semibold text-[#222222]">{statistics.byFrequency.daily} Daily</span>
                      </div>
                    }
                  />
                </div>
              )}

              {/* ── Grid ── */}
              <div>
                {searches.length === 0 ? (
                  <div className="bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD] py-24 flex flex-col items-center text-center px-6">
                    <div className="w-16 h-16 bg-white border border-[#DDDDDD] text-[#222222] rounded-full flex items-center justify-center mb-6">
                      <Search className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-[#222222] mb-2">No saved searches yet</h3>
                    <p className="text-[16px] text-[#717171] max-w-md mb-8">
                      Save your property searches to get notified when new listings match your criteria.
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start searching
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {searches.map(search => (
                      <SearchCard
                        key={search._id}
                        search={search}
                        onViewResults={() => router.push(`/dashboard/saved-searches/${search._id}`)}
                        onToggleActive={() => handleToggleActive(search)}
                        onEdit={() => { setEditingSearch(search); setShowEditModal(true); }}
                        onDelete={() => setDeleteId(search._id)}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </main>

          {/* ── Delete Dialog ── */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent className="rounded-2xl p-8 border-[#DDDDDD] max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[22px] font-semibold text-[#222222]">Delete saved search?</AlertDialogTitle>
                <AlertDialogDescription className="text-[16px] text-[#717171] mt-2">
                  You'll stop receiving notifications for this search. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 sm:space-x-4">
                <AlertDialogCancel className="rounded-lg text-[15px] font-semibold px-6 py-3 h-auto border-blue-600 text-[#222222] hover:bg-[#F7F7F7] w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-lg text-[15px] font-semibold px-6 py-3 h-auto bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ── Edit Modal ── */}
          <SaveSearchModal
            isOpen={showEditModal}
            onClose={() => { setShowEditModal(false); setEditingSearch(null); }}
            onSave={handleUpdateSearch}
            initialData={editingSearch ? {
              name: editingSearch.name,
              searchCriteria: editingSearch.searchCriteria,
              notificationFrequency: editingSearch.notificationFrequency,
              isActive: editingSearch.isActive,
            } : undefined}
          />

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}