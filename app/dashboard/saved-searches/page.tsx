"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  DollarSign, 
  Home, 
  Bed, 
  Bath,
  Loader2,
  BellOff,
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      fetchData(); // Refresh statistics
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
      fetchData(); // Refresh statistics
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
      fetchData(); // Refresh statistics
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
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFrequencyBadge = (frequency: string) => {
    const config = {
      instant: { label: 'Instant', variant: 'default' as const, icon: Bell },
      daily: { label: 'Daily', variant: 'secondary' as const, icon: Clock },
      weekly: { label: 'Weekly', variant: 'outline' as const, icon: Clock },
      never: { label: 'Never', variant: 'outline' as const, icon: BellOff },
    };
    const { label, variant, icon: Icon } = config[frequency as keyof typeof config] || config.never;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatCriteria = (criteria: SavedSearch['searchCriteria']) => {
    const parts: string[] = [];
    
    if (criteria.city) parts.push(criteria.city);
    if (criteria.listingType) parts.push(criteria.listingType === 'sale' ? 'Buy' : 'Rent');
    if (criteria.propertyType) parts.push(criteria.propertyType);
    if (criteria.minPrice || criteria.maxPrice) {
      parts.push(`${formatPrice(criteria.minPrice)} - ${formatPrice(criteria.maxPrice)}`);
    }
    if (criteria.bedrooms) parts.push(`${criteria.bedrooms}+ beds`);
    if (criteria.bathrooms) parts.push(`${criteria.bathrooms}+ baths`);
    
    return parts.length > 0 ? parts.join(' • ') : 'No criteria set';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Searches</h1>
        <p className="text-muted-foreground">
          Manage your property search alerts and get notified of new matches
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statistics.totalSearches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.activeSearches} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {statistics.totalNewMatches}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Properties waiting for you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statistics.totalResults}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Properties matching criteria
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {statistics.byFrequency.instant} instant
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {statistics.byFrequency.daily} daily
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {statistics.byFrequency.weekly} weekly
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Saved Searches List */}
      {searches.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved searches yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Save your property searches to get notified when new listings match your criteria
            </p>
            <Button onClick={() => router.push('/')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {searches.map((search) => (
            <Card key={search._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{search.name}</h3>
                      {search.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Paused
                        </Badge>
                      )}
                      {getFrequencyBadge(search.notificationFrequency)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {formatCriteria(search.searchCriteria)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>{search.resultsCount} results</span>
                    </div>
                    {search.newMatchingProperties.length > 0 && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        <span>{search.newMatchingProperties.length} new</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Updated {new Date(search.lastChecked).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(search._id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Results
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(search)}
                      className="gap-2"
                    >
                      {search.isActive ? (
                        <>
                          <BellOff className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(search)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(search._id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will stop receiving notifications for this search.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div>
  );
}