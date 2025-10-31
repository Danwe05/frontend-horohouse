'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
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
  propertyId: Property;
  userId: User;
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
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Load inquiries
  const loadInquiries = async () => {
    try {
      setLoading(true);
      const queryFilters: any = {};
      
      if (filters.status !== 'all') queryFilters.status = filters.status;
      if (filters.type !== 'all') queryFilters.type = filters.type;
      if (filters.isRead !== 'all') queryFilters.isRead = filters.isRead === 'true';

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
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/inquiries/stats',
      });
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
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
    router.push(`/dashboard/inquiries/${inquiry._id}`);
  };

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, [currentPage, filters, sortBy, sortOrder]);

  const getStatusBadge = (status: string, isRead: boolean) => {
    const baseClasses = "capitalize";
    
    if (!isRead) {
      return <Badge variant="destructive" className={baseClasses}>New</Badge>;
    }
    
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className={baseClasses}>Pending</Badge>;
      case 'RESPONDED':
        return <Badge variant="default" className={baseClasses}>Responded</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary" className={baseClasses}>Closed</Badge>;
      default:
        return <Badge variant="outline" className={baseClasses}>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIEWING':
        return <Eye className="h-4 w-4" />;
      case 'BUYING':
        return <Home className="h-4 w-4" />;
      case 'RENTING':
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const StatCard = ({ title, value, icon, color = "default" }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color === 'destructive' ? 'text-red-600' : ''}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Property Inquiries</h1>
        <p className="text-muted-foreground">
          Manage and respond to property inquiries from potential clients
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Total Inquiries"
          value={stats.total}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Unread"
          value={stats.unread}
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          color={stats.unread > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Responded"
          value={stats.responded}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search inquiries..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
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

            <div>
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-32">
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

            <div>
              <Label>Read Status</Label>
              <Select
                value={filters.isRead}
                onValueChange={(value) => setFilters(prev => ({ ...prev, isRead: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="false">Unread</SelectItem>
                  <SelectItem value="true">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Order</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiries ({stats.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No inquiries found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow 
                    key={inquiry._id}
                    className={!inquiry.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={inquiry.userId.profilePicture} />
                          <AvatarFallback>
                            {inquiry.userId.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{inquiry.userId.name}</p>
                          <p className="text-sm text-muted-foreground">{inquiry.userId.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{inquiry.propertyId.title}</p>
                        <p className="text-sm text-muted-foreground">
                          ${inquiry.propertyId.price.toLocaleString()} • {inquiry.propertyId.type}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(inquiry.type)}
                        <span className="capitalize">{inquiry.type.toLowerCase()}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(inquiry.status, inquiry.isRead)}
                    </TableCell>
                    
                    <TableCell>
                      {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewInquiry(inquiry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {inquiry.status === 'PENDING' && (
                          <Dialog open={dialogOpen && selectedInquiry?._id === inquiry._id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (open) setSelectedInquiry(inquiry);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Send className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Respond to Inquiry</DialogTitle>
                                <DialogDescription>
                                  Send a response to {inquiry.userId.name} about their inquiry for {inquiry.propertyId.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="response">Your Response</Label>
                                  <Textarea
                                    id="response"
                                    placeholder="Type your response here..."
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows={4}
                                  />
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
                                >
                                  {respondingTo === inquiry._id && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Send Response
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
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