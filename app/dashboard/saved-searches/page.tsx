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
  MoreVertical
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <Badge variant={variant} className="gap-1.5">
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
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-14 px-6 lg:pt-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Saved Searches</h1>
                  <p className="text-muted-foreground">
                    Manage your property search alerts and get notified of new matches
                  </p>
                </div>
                <Button onClick={() => router.push('/')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Search
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Search className="h-4 w-4" />
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

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      New Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {statistics.totalNewMatches}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Properties waiting
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Total Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{statistics.totalResults}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Matching properties
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Bell className="h-4 w-4" />
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

            {/* Table */}
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
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Search Name</TableHead>
                      <TableHead className="font-semibold">Criteria</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Notifications</TableHead>
                      <TableHead className="font-semibold text-center">Results</TableHead>
                      <TableHead className="font-semibold">Last Updated</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searches.map((search) => (
                      <TableRow key={search._id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            {search.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm text-muted-foreground truncate">
                            {formatCriteria(search.searchCriteria)}
                          </p>
                        </TableCell>
                        <TableCell>
                          {search.isActive ? (
                            <Badge variant="default" className="gap-1.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1.5">
                              <XCircle className="h-3 w-3" />
                              Paused
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getFrequencyBadge(search.notificationFrequency)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold">{search.resultsCount}</span>
                            {search.newMatchingProperties.length > 0 && (
                              <Badge variant="default" className="text-xs gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {search.newMatchingProperties.length} new
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(search.lastChecked).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewResults(search._id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(search)}>
                                {search.isActive ? (
                                  <>
                                    <BellOff className="h-4 w-4 mr-2" />
                                    Pause Alerts
                                  </>
                                ) : (
                                  <>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Activate Alerts
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(search)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Search
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(search._id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}