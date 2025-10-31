'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Eye,
  MessageCircle,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  Home,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

// Types based on your backend
interface Property {
  _id: string;
  title: string;
  price: number;
  type: string;
  images: string[];
  location: {
    address: string;
    city: string;
    state: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface Inquiry {
  _id: string;
  propertyId: Property | null;
  userId: User | null;
  agentId: string;
  message: string;
  type: 'GENERAL' | 'VIEWING' | 'BUYING' | 'RENTING';
  status: 'PENDING' | 'RESPONDED' | 'CLOSED';
  isRead: boolean;
  response?: string;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  viewingDate?: string;
  budget?: number;
  moveInDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  respondedAt?: string;
  respondedBy?: string;
}

interface InquiryStats {
  total: number;
  pending: number;
  responded: number;
  closed: number;
  unread: number;
}

const InquiriesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    pending: 0,
    responded: 0,
    closed: 0,
    unread: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set());

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    type: searchParams.get('type') || 'all',
    isRead: searchParams.get('isRead') || 'all',
    search: searchParams.get('search') || '',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced stats with trends
  const [previousStats, setPreviousStats] = useState<InquiryStats | null>(null);

  // Load inquiries
  const loadInquiries = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const queryFilters: any = {};
      
      if (filters.status !== 'all') queryFilters.status = filters.status;
      if (filters.type !== 'all') queryFilters.type = filters.type;
      if (filters.isRead !== 'all') queryFilters.isRead = filters.isRead === 'true';
      if (filters.search) queryFilters.search = filters.search;

      const response = await apiClient.request({
        method: 'GET',
        url: '/inquiries',
        params: {
          ...queryFilters,
          page: currentPage,
          limit: 20,
          sortBy,
          sortOrder,
        },
      });

      setInquiries(response.inquiries);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/inquiries/stats',
      });
      setPreviousStats(stats);
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Calculate trend
  const getTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  // Mark as read
  const markAsRead = async (inquiryId: string) => {
    try {
      await apiClient.request({
        method: 'PATCH',
        url: `/inquiries/${inquiryId}/read`,
      });
      
      setInquiries(prev => 
        prev.map(inquiry => 
          inquiry._id === inquiryId 
            ? { ...inquiry, isRead: true, readAt: new Date().toISOString() }
            : inquiry
        )
      );
      
      loadStats();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark multiple as read
  const markMultipleAsRead = async () => {
    try {
      await apiClient.request({
        method: 'PATCH',
        url: '/inquiries/bulk-read',
        data: { inquiryIds: Array.from(selectedInquiries) },
      });
      
      setInquiries(prev => 
        prev.map(inquiry => 
          selectedInquiries.has(inquiry._id)
            ? { ...inquiry, isRead: true, readAt: new Date().toISOString() }
            : inquiry
        )
      );
      
      setSelectedInquiries(new Set());
      loadStats();
      toast.success(`Marked ${selectedInquiries.size} inquiries as read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark inquiries as read');
    }
  };

  // Respond to inquiry
  const respondToInquiry = async (inquiryId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setRespondingTo(inquiryId);
      
      const response = await apiClient.request({
        method: 'PATCH',
        url: `/inquiries/${inquiryId}`,
        data: {
          response: responseText,
          status: 'RESPONDED',
        },
      });

      setInquiries(prev =>
        prev.map(inquiry =>
          inquiry._id === inquiryId
            ? { ...inquiry, response: responseText, status: 'RESPONDED' as const, respondedAt: new Date().toISOString() }
            : inquiry
        )
      );

      setResponseText('');
      setDialogOpen(false);
      loadStats();
      toast.success('Response sent successfully');
    } catch (error) {
      console.error('Failed to respond:', error);
      toast.error('Failed to send response');
    } finally {
      setRespondingTo(null);
    }
  };

  // View inquiry details
  const viewInquiry = async (inquiry: Inquiry) => {
    if (!inquiry.isRead) {
      await markAsRead(inquiry._id);
    }
    router.push(`/dashboard/inquiry/${inquiry._id}`);
  };

  // Toggle select inquiry
  const toggleSelectInquiry = (inquiryId: string) => {
    const newSelected = new Set(selectedInquiries);
    if (newSelected.has(inquiryId)) {
      newSelected.delete(inquiryId);
    } else {
      newSelected.add(inquiryId);
    }
    setSelectedInquiries(newSelected);
  };

  // Select all inquiries
  const selectAllInquiries = () => {
    if (selectedInquiries.size === validInquiries.length) {
      setSelectedInquiries(new Set());
    } else {
      setSelectedInquiries(new Set(validInquiries.map(inq => inq._id)));
    }
  };

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, [currentPage, filters, sortBy, sortOrder]);

  const getStatusBadge = (status: string, isRead: boolean) => {
    const baseClasses = "capitalize font-medium";
    
    if (!isRead) {
      return (
        <Badge variant="destructive" className={`${baseClasses} animate-pulse`}>
          <AlertCircle className="h-3 w-3 mr-1" />
          New
        </Badge>
      );
    }
    
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className={`${baseClasses} border-amber-500 text-amber-700`}>Pending</Badge>;
      case 'RESPONDED':
        return <Badge variant="default" className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100`}>Responded</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary" className={baseClasses}>Closed</Badge>;
      default:
        return <Badge variant="outline" className={baseClasses}>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'VIEWING':
        return <Eye className={`${iconClass} text-blue-600`} />;
      case 'BUYING':
        return <Home className={`${iconClass} text-green-600`} />;
      case 'RENTING':
        return <Calendar className={`${iconClass} text-purple-600`} />;
      default:
        return <MessageCircle className={`${iconClass} text-gray-600`} />;
    }
  };

  const StatCard = ({ title, value, icon, trend, description }: any) => (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== null && (
          <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
            {Math.abs(trend).toFixed(1)}% from last check
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  // Filter out inquiries with null propertyId or userId
  const validInquiries = useMemo(() => 
    inquiries.filter(inquiry => inquiry.propertyId && inquiry.userId),
    [inquiries]
  );

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading inquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Property Inquiries
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and respond to property inquiries from potential clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadInquiries(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Inquiries"
          value={stats.total}
          icon={<MessageCircle className="h-5 w-5 text-blue-600" />}
          trend={previousStats ? getTrend(stats.total, previousStats.total) : null}
        />
        <StatCard
          title="Unread"
          value={stats.unread}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          trend={previousStats ? getTrend(stats.unread, previousStats.unread) : null}
          description="Requires attention"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          trend={previousStats ? getTrend(stats.pending, previousStats.pending) : null}
        />
        <StatCard
          title="Responded"
          value={stats.responded}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          trend={previousStats ? getTrend(stats.responded, previousStats.responded) : null}
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={<XCircle className="h-5 w-5 text-gray-600" />}
          trend={previousStats ? getTrend(stats.closed, previousStats.closed) : null}
        />
      </div>

      {/* Enhanced Filters */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className={showFilters ? 'block' : 'hidden'}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search inquiries..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RESPONDED">Responded</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="VIEWING">Viewing</SelectItem>
                  <SelectItem value="BUYING">Buying</SelectItem>
                  <SelectItem value="RENTING">Renting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Read Status</Label>
              <Select
                value={filters.isRead}
                onValueChange={(value) => setFilters(prev => ({ ...prev, isRead: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="false">Unread</SelectItem>
                  <SelectItem value="true">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedInquiries.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedInquiries.size} selected
                </Badge>
                <span className="text-sm text-blue-700">
                  {selectedInquiries.size} inquiry{selectedInquiries.size > 1 ? 'ies' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markMultipleAsRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInquiries(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Inquiries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Inquiries ({stats.total})
              {stats.unread > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  {stats.unread} New
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllInquiries}
                disabled={validInquiries.length === 0}
              >
                {selectedInquiries.size === validInquiries.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {validInquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No inquiries found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.status !== 'all' || filters.type !== 'all' || filters.search
                  ? 'Try adjusting your filters to see more results.'
                  : 'When you receive new inquiries, they will appear here.'}
              </p>
              {(filters.status !== 'all' || filters.type !== 'all' || filters.search) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ status: 'all', type: 'all', isRead: 'all', search: '' })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedInquiries.size === validInquiries.length && validInquiries.length > 0}
                        onChange={selectAllInquiries}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validInquiries.map((inquiry) => (
                    <TableRow 
                      key={inquiry._id}
                      className={`
                        transition-colors
                        ${!inquiry.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                        ${selectedInquiries.has(inquiry._id) ? 'bg-muted/50' : ''}
                        hover:bg-muted/30
                      `}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedInquiries.has(inquiry._id)}
                          onChange={() => toggleSelectInquiry(inquiry._id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9 border-2 border-background">
                            <AvatarImage src={inquiry.userId?.profilePicture} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {inquiry.userId?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{inquiry.userId?.name || 'Unknown User'}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {inquiry.userId?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{inquiry.propertyId?.title || 'Property Unavailable'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            ${inquiry.propertyId?.price?.toLocaleString() || '0'} • {inquiry.propertyId?.type || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {inquiry.propertyId?.location?.city || 'Unknown location'}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(inquiry.type)}
                          <span className="capitalize font-medium">{inquiry.type.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(inquiry.status, inquiry.isRead)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewInquiry(inquiry)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {inquiry.status === 'PENDING' && (
                            <Dialog open={dialogOpen && selectedInquiry?._id === inquiry._id} onOpenChange={(open) => {
                              setDialogOpen(open);
                              if (open) {
                                setSelectedInquiry(inquiry);
                                setResponseText('');
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Respond"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Respond to Inquiry
                                  </DialogTitle>
                                  <DialogDescription>
                                    Send a response to {inquiry.userId?.name || 'the client'} about their inquiry for {inquiry.propertyId?.title || 'this property'}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="rounded-lg bg-muted p-4">
                                    <h4 className="font-medium mb-2">Original Message:</h4>
                                    <p className="text-sm text-muted-foreground">{inquiry.message}</p>
                                  </div>
                                  <div>
                                    <Label htmlFor="response" className="text-base">Your Response</Label>
                                    <Textarea
                                      id="response"
                                      placeholder="Type your professional response here. Consider including next steps, availability for viewings, or answers to specific questions..."
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      rows={6}
                                      className="resize-none mt-2"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                      <span>Be professional and helpful</span>
                                      <span>{responseText.length}/2000 characters</span>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => respondToInquiry(inquiry._id)}
                                    disabled={respondingTo === inquiry._id || !responseText.trim()}
                                    className="min-w-24"
                                  >
                                    {respondingTo === inquiry._id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Response
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => viewInquiry(inquiry)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!inquiry.isRead && (
                                <DropdownMenuItem onClick={() => markAsRead(inquiry._id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="h-4 w-4 mr-2" />
                                Call Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {validInquiries.length} of {stats.total} inquiry{stats.total !== 1 ? 'ies' : ''}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <span className="px-2 text-sm text-muted-foreground">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InquiriesPage;