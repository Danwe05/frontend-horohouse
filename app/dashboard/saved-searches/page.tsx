"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Edit,
  Trash2,
  Eye,
  Home,
  Loader2,
  BellOff,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  MapPin,
  Home as HomeIcon,
  Bed,
  Bath,
  Banknote,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import SaveSearchModal from '@/components/saved-searches/SaveSearchModal';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedSearch {
  _id: string;
  name: string;
  searchCriteria: {
    city?: string;
    propertyType?: string;
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
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
  totalSearches: number;
  activeSearches: number;
  totalNewMatches: number;
  byFrequency: {
    instant: number;
    daily: number;
    weekly: number;
    never: number;
  };
  totalResults: number;
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [searchesData, statsData] = await Promise.all([
        apiClient.getSavedSearches(),
        apiClient.getSavedSearchStatistics()
      ]);
      setSearches(searchesData);
      setStatistics(statsData);
    } catch (error: any) {
      console.error('Error fetching saved searches:', error);
      toast.error('Failed to load saved searches', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await apiClient.deleteSavedSearch(deleteId);
      toast.success('Search deleted successfully');
      setSearches(searches.filter(s => s._id !== deleteId));
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
    }
  };

  const handleToggleActive = async (search: SavedSearch) => {
    try {
      const updated = await apiClient.updateSavedSearch(search._id, {
        isActive: !search.isActive
      });
      setSearches(searches.map(s => s._id === search._id ? updated : s));
      toast.success(`Search ${updated.isActive ? 'activated' : 'paused'}`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating search:', error);
      toast.error('Failed to update search', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
    }
  };

  const handleEdit = (search: SavedSearch) => {
    setEditingSearch(search);
    setShowEditModal(true);
  };

  const handleUpdateSearch = async (data: any) => {
    if (!editingSearch) return;

    try {
      const updated = await apiClient.updateSavedSearch(editingSearch._id, data);
      setSearches(searches.map(s => s._id === editingSearch._id ? updated : s));
      toast.success('Search updated successfully');
      setShowEditModal(false);
      setEditingSearch(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating search:', error);
      toast.error('Failed to update search', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
      throw error;
    }
  };

  const handleViewResults = (searchId: string) => {
    router.push(`/dashboard/saved-searches/${searchId}`);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Any';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getFrequencyBadge = (frequency: string) => {
    const config = {
      instant: { label: 'Instant', bg: 'bg-rose-50', text: 'text-rose-600', icon: Bell },
      daily: { label: 'Daily', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      weekly: { label: 'Weekly', bg: 'bg-blue-50', text: 'text-blue-600', icon: Clock },
      never: { label: 'Never', bg: 'bg-slate-100', text: 'text-slate-500', icon: BellOff },
    };
    const { label, bg, text, icon: Icon } = config[frequency as keyof typeof config] || config.never;
    return (
      <Badge variant="secondary" className={`${bg} ${text} hover:${bg} border-none px-2 py-0 h-5 text-[10px] font-semibold uppercase tracking-wider gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatCriteriaPills = (criteria: SavedSearch['searchCriteria']) => {
    const pills = [];

    if (criteria.city) {
      pills.push(
        <div key="city" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <MapPin className="w-3 h-3 text-indigo-500" />
          {criteria.city}
        </div>
      );
    }
    if (criteria.listingType) {
      pills.push(
        <div key="type" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <HomeIcon className="w-3 h-3 text-indigo-500" />
          {criteria.listingType === 'sale' ? 'Buy' : 'Rent'}
        </div>
      );
    }
    if (criteria.propertyType) {
      pills.push(
        <div key="ptype" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Home className="w-3 h-3 text-indigo-500" />
          {criteria.propertyType}
        </div>
      );
    }
    if (criteria.minPrice || criteria.maxPrice) {
      pills.push(
        <div key="price" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Banknote className="w-3 h-3 text-emerald-500" />
          {formatPrice(criteria.minPrice)} - {formatPrice(criteria.maxPrice)}
        </div>
      );
    }
    if (criteria.bedrooms) {
      pills.push(
        <div key="beds" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Bed className="w-3 h-3 text-blue-500" />
          {criteria.bedrooms}+ Beds
        </div>
      );
    }
    if (criteria.bathrooms) {
      pills.push(
        <div key="baths" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Bath className="w-3 h-3 text-cyan-500" />
          {criteria.bathrooms}+ Baths
        </div>
      );
    }

    if (pills.length === 0) {
      return <span className="text-xs text-slate-400 italic">No specific criteria</span>;
    }

    return pills;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f8fafc]">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <main className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-3 w-full max-w-sm">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="h-8 w-64 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-72 ml-11 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-32 rounded-md" />
                </div>

                {/* Statistics Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2 flex-1 mt-1">
                        <Skeleton className="h-3 w-24 rounded-md" />
                        <Skeleton className="h-6 w-12 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid Skeleton */}
                <div className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-[260px]">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3 w-full">
                            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="space-y-2 w-full mt-1">
                              <Skeleton className="h-4 w-3/4 rounded-md" />
                              <div className="flex gap-2">
                                <Skeleton className="h-3 w-12 rounded-md" />
                                <Skeleton className="h-3 w-12 rounded-md" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 flex-grow">
                          <Skeleton className="h-2 w-20 mb-3 rounded-md" />
                          <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-16 rounded-md" />
                            <Skeleton className="h-6 w-12 rounded-md" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="space-y-1.5">
                            <Skeleton className="h-2 w-16 rounded-md" />
                            <Skeleton className="h-4 w-6 rounded-md" />
                          </div>
                          <div className="w-px h-8 bg-slate-100 mx-4"></div>
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-2 w-16 rounded-md" />
                            <Skeleton className="h-4 w-8 rounded-md" />
                          </div>
                          <Skeleton className="h-8 w-14 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* HEADER SECTION */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50">
                      <BellRing className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Saved Searches</h1>
                  </div>
                  <p className="text-slate-500 pl-11">Manage your property search alerts and get notified of new matches</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => router.push('/')} className="shadow-md bg-indigo-600 hover:bg-indigo-700 transition-all">
                    <Plus className="w-4 h-4 mr-2" /> New Alert
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">Total Searches</p>
                      <h3 className="text-2xl font-bold text-slate-800">{statistics.totalSearches}</h3>
                      <p className="text-xs text-slate-400 mt-1">{statistics.activeSearches} active right now</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">New Matches</p>
                      <h3 className="text-2xl font-bold text-slate-800">{statistics.totalNewMatches}</h3>
                      <p className="text-xs text-slate-400 mt-1">Properties waiting for you</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <HomeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">Total Results</p>
                      <h3 className="text-2xl font-bold text-slate-800">{statistics.totalResults}</h3>
                      <p className="text-xs text-slate-400 mt-1">Matching your criteria</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">Alert Setup</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal text-[10px]">Instant: {statistics.byFrequency.instant}</Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal text-[10px]">Daily: {statistics.byFrequency.daily}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Searches Grid */}
              <div className="mt-8">
                {searches.length === 0 ? (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center text-center px-4">
                    <div className="p-6 bg-indigo-50 text-indigo-600 rounded-full mb-6">
                      <Search className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No saved searches yet</h3>
                    <p className="text-slate-500 max-w-sm mb-8">
                      Save your property searches to get instantly notified when new dream listings hit the market.
                    </p>
                    <Button onClick={() => router.push('/')} className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 h-11">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Search
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {searches.map(search => (
                      <div key={search._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group flex flex-col h-full relative overflow-hidden">

                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4 z-10">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${search.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                              <Search className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{search.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {search.isActive ? (
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-2 py-0 h-5 text-[10px] font-semibold uppercase tracking-wider">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none px-2 py-0 h-5 text-[10px] font-semibold uppercase tracking-wider">Paused</Badge>
                                )}
                                {getFrequencyBadge(search.notificationFrequency)}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl z-50">
                              <DropdownMenuLabel className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewResults(search._id)} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2 text-slate-500" /> View Results
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(search)} className="cursor-pointer">
                                {search.isActive ? (
                                  <><BellOff className="h-4 w-4 mr-2 text-orange-500" /> Pause Alerts</>
                                ) : (
                                  <><Bell className="h-4 w-4 mr-2 text-emerald-500" /> Activate Alerts</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(search)} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit Search
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteId(search._id)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Search
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Criteria Pills */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 flex-grow z-10">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Search Criteria</p>
                          <div className="flex flex-wrap gap-2">
                            {formatCriteriaPills(search.searchCriteria)}
                          </div>
                        </div>

                        {/* Card Footer Details */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto z-10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Matches</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-slate-800">{search.newMatchingProperties.length}</span>
                              {search.newMatchingProperties.length > 0 && <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>}
                            </div>
                          </div>

                          <div className="w-px h-8 bg-slate-100 mx-4"></div>

                          <div className="flex flex-col flex-grow">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Results</span>
                            <span className="text-lg font-semibold text-slate-600">{search.resultsCount}</span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors"
                            onClick={() => handleViewResults(search._id)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </main>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. You will stop receiving notifications for this search.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Modal */}
          <SaveSearchModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingSearch(null);
            }}
            onSave={handleUpdateSearch}
            initialData={editingSearch ? {
              name: editingSearch.name,
              searchCriteria: editingSearch.searchCriteria,
              notificationFrequency: editingSearch.notificationFrequency,
              isActive: editingSearch.isActive
            } : undefined}
          />

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}