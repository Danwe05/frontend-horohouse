'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  ListFilter,
  X,
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

const InquiriesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({
    total: 0, pending: 0, responded: 0, closed: 0, unread: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set());

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // URL params mapping to state
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'all');
  const [type, setType] = useState<string>(searchParams.get('type') || 'all');
  const [isReadParam, setIsReadParam] = useState<string>(searchParams.get('isRead') || 'all');

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [previousStats, setPreviousStats] = useState<InquiryStats | null>(null);

  // Load inquiries
  const loadInquiries = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const queryFilters: any = {};
      if (status !== 'all') queryFilters.status = status;
      if (type !== 'all') queryFilters.type = type;
      if (isReadParam !== 'all') queryFilters.isRead = isReadParam === 'true';
      if (query) queryFilters.search = query;

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

      setInquiries(response.inquiries || []);
      setTotalPages(response.totalPages || 1);
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

  const getTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const markAsRead = async (inquiryId: string) => {
    try {
      await apiClient.request({
        method: 'PATCH',
        url: `/inquiries/${inquiryId}/read`,
      });
      setInquiries(prev => prev.map(inq =>
        inq._id === inquiryId ? { ...inq, isRead: true, readAt: new Date().toISOString() } : inq
      ));
      loadStats();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markMultipleAsRead = async () => {
    try {
      await apiClient.request({
        method: 'PATCH',
        url: '/inquiries/bulk-read',
        data: { inquiryIds: Array.from(selectedInquiries) },
      });

      setInquiries(prev => prev.map(inq =>
        selectedInquiries.has(inq._id) ? { ...inq, isRead: true, readAt: new Date().toISOString() } : inq
      ));

      setSelectedInquiries(new Set());
      loadStats();
      toast.success(`Marked ${selectedInquiries.size} inquiries as read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark inquiries as read');
    }
  };

  const respondToInquiry = async (inquiryId: string) => {
    if (!responseText.trim()) { toast.error('Please enter a response'); return; }
    try {
      setRespondingTo(inquiryId);
      await apiClient.request({
        method: 'PATCH',
        url: `/inquiries/${inquiryId}`,
        data: { response: responseText, status: 'RESPONDED' },
      });

      setInquiries(prev => prev.map(inq =>
        inq._id === inquiryId ? { ...inq, response: responseText, status: 'RESPONDED' as const, respondedAt: new Date().toISOString() } : inq
      ));
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

  const viewInquiry = async (inquiry: Inquiry) => {
    if (!inquiry.isRead) await markAsRead(inquiry._id);
    router.push(`/dashboard/inquiry/${inquiry._id}`);
  };

  const toggleSelectInquiry = (inquiryId: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedInquiries);
    if (newSelected.has(inquiryId)) newSelected.delete(inquiryId);
    else newSelected.add(inquiryId);
    setSelectedInquiries(newSelected);
  };

  const validInquiries = useMemo(() => inquiries.filter(inq => inq.propertyId && inq.userId), [inquiries]);

  const selectAllInquiries = () => {
    if (selectedInquiries.size === validInquiries.length) setSelectedInquiries(new Set());
    else setSelectedInquiries(new Set(validInquiries.map(inq => inq._id)));
  };

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, [currentPage, status, type, isReadParam, query, sortBy, sortOrder]);

  const getStatusBadge = (stat: string, isRead: boolean) => {
    if (!isRead) {
      return (
        <Badge variant="outline" className="blue-blue-600 text-white border-transparent animate-pulse font-semibold px-2.5 py-1">
          <AlertCircle className="h-3 w-3 mr-1" /> New
        </Badge>
      );
    }
    switch (stat) {
      case 'PENDING': return <Badge variant="outline" className="bg-[#F7F7F7] text-[#222222] border-[#DDDDDD] font-semibold px-2.5 py-1">Pending</Badge>;
      case 'RESPONDED': return <Badge variant="outline" className="bg-[#ECFDF5] text-[#008A05] border-[#008A05]/20 font-semibold px-2.5 py-1">Responded</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="bg-[#F7F7F7] text-[#717171] border-[#DDDDDD] font-semibold px-2.5 py-1">Closed</Badge>;
      default: return <Badge variant="outline" className="bg-[#F7F7F7] text-[#222222] border-[#DDDDDD] font-semibold px-2.5 py-1 capitalize">{stat}</Badge>;
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'VIEWING': return <Eye className="h-3.5 w-3.5 text-[#0066FF]" />;
      case 'BUYING': return <Home className="h-3.5 w-3.5 text-[#00A699]" />;
      case 'RENTING': return <Calendar className="h-3.5 w-3.5 text-[#E28800]" />;
      default: return <MessageCircle className="h-3.5 w-3.5 text-[#717171]" />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card className="rounded-xl border border-[#DDDDDD] bg-white transition-all shadow-none hover:border-blue-600">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[14px] font-semibold text-[#717171] uppercase tracking-wider">{title}</p>
          <Icon className="w-5 h-5 text-[#222222]" />
        </div>
        <div>
          <p className="text-[28px] font-semibold text-[#222222]">{value}</p>
          {trend !== null && trend !== 0 && (
            <div className={`flex items-center text-[13px] mt-1 font-medium ${trend > 0 ? 'text-[#00A699]' : 'text-[#E50000]'}`}>
              {trend > 0 ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingUp className="h-3.5 w-3.5 mr-1 rotate-180" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 mt-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-semibold tracking-tight text-[#222222]">Property Inquiries</h1>
          </div>
          <p className="text-[16px] text-[#717171]">Manage and respond to property inquiries from potential clients</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg h-10 px-5 border-[#DDDDDD] text-[#222222] font-semibold text-[14px] hover:bg-[#F7F7F7]">
            <Download className="w-4 h-4 mr-2 stroke-[2]" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={MessageCircle} trend={previousStats ? getTrend(stats.total, previousStats.total) : null} />
        <StatCard title="Unread" value={stats.unread} icon={AlertCircle} trend={previousStats ? getTrend(stats.unread, previousStats.unread) : null} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} trend={previousStats ? getTrend(stats.pending, previousStats.pending) : null} />
        <StatCard title="Responded" value={stats.responded} icon={CheckCircle} trend={previousStats ? getTrend(stats.responded, previousStats.responded) : null} />
        <StatCard title="Closed" value={stats.closed} icon={XCircle} trend={previousStats ? getTrend(stats.closed, previousStats.closed) : null} />
      </div>

      {/* MODERN FILTER BAR */}
      <div className="bg-white py-4 mt-6 border-t border-[#DDDDDD] sticky top-0 z-10 transition-all flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full xl:w-auto">
          <Tabs value={status} onValueChange={(v) => setStatus(v)} className="w-fit">
            <TabsList className="bg-transparent space-x-2 p-0 h-auto">
              <TabsTrigger value="all" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">All</TabsTrigger>
              <TabsTrigger value="PENDING" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">Pending</TabsTrigger>
              <TabsTrigger value="RESPONDED" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">Responded</TabsTrigger>
              <TabsTrigger value="CLOSED" className="px-5 h-10 rounded-full border border-[#DDDDDD] text-[14px] font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-[#222222] hover:border-blue-600">Closed</TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator orientation="vertical" className="hidden lg:block h-8 mx-2 bg-[#DDDDDD] my-auto" />

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px] h-10 rounded-full border-[#DDDDDD] bg-white text-[14px] text-[#222222] font-medium hover:border-blue-600 focus:ring-0 focus:ring-offset-0">
              <ListFilter className="w-4 h-4 mr-2 text-[#222222] stroke-[2]" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#DDDDDD] shadow-md">
              <SelectItem value="all" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Any Type</SelectItem>
              <SelectItem value="GENERAL" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">General</SelectItem>
              <SelectItem value="VIEWING" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Viewing</SelectItem>
              <SelectItem value="BUYING" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Buying</SelectItem>
              <SelectItem value="RENTING" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Renting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isReadParam} onValueChange={setIsReadParam}>
            <SelectTrigger className="w-[140px] h-10 rounded-full border-[#DDDDDD] bg-white text-[14px] text-[#222222] font-medium hover:border-blue-600 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#DDDDDD] shadow-md">
              <SelectItem value="all" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Any Status</SelectItem>
              <SelectItem value="false" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Unread Only</SelectItem>
              <SelectItem value="true" className="focus:bg-[#F7F7F7] text-[14px] cursor-pointer">Read Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full xl:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222222] stroke-[2]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inquiries..."
            className="pl-11 h-12 rounded-full border border-[#DDDDDD] bg-white hover:shadow-md focus-visible:shadow-md focus-visible:ring-0 transition-shadow text-[15px] font-medium text-[#222222] placeholder:text-[#717171]"
          />
        </div>
      </div>

      {/* ACTIVE FILTER BADGES */}
      {(query || status !== 'all' || type !== 'all' || isReadParam !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <span className="text-[12px] font-bold text-[#717171] uppercase tracking-widest mr-2">Filters:</span>
          {query && (
            <Badge variant="secondary" className="bg-white border-[#DDDDDD] text-[#222222] px-4 py-1.5 rounded-full gap-2 text-[14px] font-medium">
              "{query}" <X className="w-3.5 h-3.5 text-[#717171] hover:text-[#222222] cursor-pointer" onClick={() => setQuery('')} />
            </Badge>
          )}
          {status !== 'all' && (
            <Badge variant="secondary" className="bg-white border-[#DDDDDD] text-[#222222] px-4 py-1.5 rounded-full gap-2 text-[14px] font-medium">
              Status: <span className="capitalize">{status.toLowerCase()}</span> <X className="w-3.5 h-3.5 text-[#717171] hover:text-[#222222] cursor-pointer" onClick={() => setStatus('all')} />
            </Badge>
          )}
          {type !== 'all' && (
            <Badge variant="secondary" className="bg-white border-[#DDDDDD] text-[#222222] px-4 py-1.5 rounded-full gap-2 text-[14px] font-medium">
              Type: <span className="capitalize">{type.toLowerCase()}</span> <X className="w-3.5 h-3.5 text-[#717171] hover:text-[#222222] cursor-pointer" onClick={() => setType('all')} />
            </Badge>
          )}
          {isReadParam !== 'all' && (
            <Badge variant="secondary" className="bg-white border-[#DDDDDD] text-[#222222] px-4 py-1.5 rounded-full gap-2 text-[14px] font-medium">
              {isReadParam === 'true' ? 'Read' : 'Unread'} <X className="w-3.5 h-3.5 text-[#717171] hover:text-[#222222] cursor-pointer" onClick={() => setIsReadParam('all')} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setStatus('all'); setType('all'); setIsReadParam('all'); }} className="text-[13px] text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] font-semibold ml-1">
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedInquiries.size > 0 && (
        <div className="bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-[#222222]">
              {selectedInquiries.size} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markMultipleAsRead} className="bg-white hover:bg-[#F7F7F7] border-[#DDDDDD] text-[#222222]">
              <CheckCircle className="h-4 w-4 mr-2" /> Mark as Read
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedInquiries(new Set())} className="text-[#717171] hover:text-[#222222] hover:bg-[#EBEBEB]">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* TABLE AREA */}
      <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-x-auto mt-4">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse">
            <TableHeader className="bg-[#F7F7F7] border-b border-[#DDDDDD]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-12 py-4 px-5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedInquiries.size === validInquiries.length && validInquiries.length > 0}
                    onChange={selectAllInquiries}
                    className="rounded border-[#DDDDDD] accent-[#222222]"
                  />
                </TableHead>
                <TableHead className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Client</TableHead>
                <TableHead className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Property</TableHead>
                <TableHead className="hidden md:table-cell px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Type</TableHead>
                <TableHead className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Status</TableHead>
                <TableHead className="hidden lg:table-cell px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-right px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#DDDDDD]">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`} className="border-none">
                  <TableCell className="text-center py-4 px-5"><Skeleton className="h-4 w-4 rounded inline-block bg-[#F7F7F7]" /></TableCell>
                  <TableCell className="py-4 px-5"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full bg-[#F7F7F7]" /><div className="space-y-1.5"><Skeleton className="h-4 w-28 rounded-full bg-[#F7F7F7]" /><Skeleton className="h-3 w-32 rounded-full bg-[#F7F7F7]" /></div></div></TableCell>
                  <TableCell className="py-4 px-5"><div className="space-y-1.5"><Skeleton className="h-4 w-32 rounded-full bg-[#F7F7F7]" /><Skeleton className="h-3 w-20 rounded-full bg-[#F7F7F7]" /><Skeleton className="h-3 w-24 rounded-full bg-[#F7F7F7]" /></div></TableCell>
                  <TableCell className="hidden md:table-cell py-4 px-5"><Skeleton className="h-5 w-20 rounded-full bg-[#F7F7F7]" /></TableCell>
                  <TableCell className="py-4 px-5"><Skeleton className="h-6 w-24 rounded-full bg-[#F7F7F7]" /></TableCell>
                  <TableCell className="hidden lg:table-cell py-4 px-5"><div className="space-y-1.5"><Skeleton className="h-4 w-20 rounded-full bg-[#F7F7F7]" /><Skeleton className="h-3 w-16 rounded-full bg-[#F7F7F7]" /></div></TableCell>
                  <TableCell className="text-right py-4 pr-6 px-5"><Skeleton className="h-8 w-8 rounded-full ml-auto bg-[#F7F7F7]" /></TableCell>
                </TableRow>
              ))}

              {!loading && validInquiries.map((inquiry) => (
                <TableRow
                  key={inquiry._id}
                  className={`
                    cursor-pointer transition-colors group border-none
                    ${!inquiry.isRead ? 'bg-[#F7F7F7]' : 'hover:bg-[#F7F7F7]'}
                    ${selectedInquiries.has(inquiry._id) ? 'bg-[#F7F7F7]' : ''}
                  `}
                  onClick={() => viewInquiry(inquiry)}
                >
                  <TableCell className="text-center px-5 py-5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedInquiries.has(inquiry._id)}
                      onChange={(e) => toggleSelectInquiry(inquiry._id, e)}
                      className="rounded border-[#DDDDDD] accent-[#222222] cursor-pointer w-4 h-4"
                    />
                  </TableCell>
                  <TableCell className="py-5 px-5">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border border-[#DDDDDD] font-semibold text-[14px]">
                        <AvatarImage src={inquiry.userId?.profilePicture} />
                        <AvatarFallback className="bg-[#EBEBEB] text-[#717171]">
                          {inquiry.userId?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[15px] truncate ${!inquiry.isRead ? 'font-semibold text-[#222222]' : 'font-medium text-[#222222]'}`}>
                          {inquiry.userId?.name || 'Unknown User'}
                        </p>
                        <p className="text-[13px] text-[#717171] truncate mt-0.5">
                          {inquiry.userId?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-5 px-5">
                    <div className="min-w-0 space-y-1">
                      <p className={`text-[15px] truncate w-[160px] ${!inquiry.isRead ? 'font-semibold text-[#222222]' : 'font-medium text-[#222222]'}`}>
                        {inquiry.propertyId?.title || 'Property Unavailable'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#EBEBEB] text-[#222222] hover:bg-[#EBEBEB] border-none px-1.5 py-0 text-[10px] uppercase font-bold">
                          {inquiry.propertyId?.type || 'N/A'}
                        </Badge>
                        <span className="text-[13px] font-semibold text-[#717171]">
                          XAF {inquiry.propertyId?.price?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#717171] truncate flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 stroke-[2]" />
                        {inquiry.propertyId?.location?.city || 'Unknown location'}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell py-5 px-5">
                    <Badge variant="secondary" className="bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] gap-1.5 px-3 py-1 text-[13px] font-semibold">
                      {getTypeIcon(inquiry.type)}
                      <span className="capitalize">{inquiry.type.toLowerCase()}</span>
                    </Badge>
                  </TableCell>

                  <TableCell className="py-5 px-5">
                    {getStatusBadge(inquiry.status, inquiry.isRead)}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell py-5 px-5">
                    <div className="space-y-0.5">
                      <div className="text-[14px] font-medium text-[#222222]">
                        {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-[13px] text-[#717171] font-medium">
                        {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right py-5 pr-6 px-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {inquiry.status === 'PENDING' && (
                        <Dialog open={dialogOpen && selectedInquiry?._id === inquiry._id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) { setSelectedInquiry(inquiry); setResponseText(''); }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#222222] border border-transparent hover:border-[#DDDDDD] hover:bg-[#F7F7F7] rounded-full" title="Respond">
                              <Send className="h-4 w-4 stroke-[2]" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl rounded-2xl bg-white border-[#DDDDDD] p-0 overflow-hidden">
                            <DialogHeader className="p-6 border-b border-[#DDDDDD]">
                              <DialogTitle className="flex items-center gap-2 text-[22px] font-semibold text-[#222222]">
                                <Send className="h-5 w-5 text-[#222222]" />
                                Respond to Inquiry
                              </DialogTitle>
                              <DialogDescription className="text-[15px] text-[#717171] mt-2">
                                Respond to <strong className="text-[#222222]">{inquiry.userId?.name}</strong> regarding <strong className="text-[#222222]">{inquiry.propertyId?.title}</strong>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 px-6 py-6">
                              <div className="rounded-xl bg-[#F7F7F7] border border-[#DDDDDD] p-5">
                                <h4 className="text-[12px] font-bold text-[#717171] uppercase tracking-wider mb-2">Original Message:</h4>
                                <p className="text-[15px] text-[#222222] whitespace-pre-wrap leading-relaxed">{inquiry.message}</p>
                              </div>
                              <div>
                                <Label htmlFor="response" className="text-[#222222] font-semibold mb-3 block text-[15px]">Your Response</Label>
                                <Textarea
                                  id="response"
                                  placeholder="Type your professional response here..."
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  rows={5}
                                  className="resize-none bg-white border border-[#DDDDDD] focus-visible:ring-1 focus-visible:ring-[#222222] rounded-xl text-[15px]"
                                />
                                <div className="flex justify-end text-[12px] text-[#717171] mt-2 font-medium">
                                  <span>{responseText.length}/2000</span>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="p-6 border-t border-[#EBEBEB] bg-[#F7F7F7]">
                              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-12 w-[120px] text-[15px] font-semibold border-blue-600 text-[#222222] hover:bg-[#EBEBEB]">Cancel</Button>
                              <Button
                                onClick={() => respondToInquiry(inquiry._id)}
                                disabled={respondingTo === inquiry._id || !responseText.trim()}
                                className="rounded-xl blue-blue-600 blue-blue-700 text-white text-[15px] font-semibold h-12 min-w-[140px] px-6 transition-colors"
                              >
                                {respondingTo === inquiry._id ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                ) : (
                                  <>Send message</>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#222222] hover:bg-[#F7F7F7] rounded-full border border-transparent hover:border-[#DDDDDD]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#DDDDDD] shadow-md p-2">
                          <DropdownMenuItem onClick={() => viewInquiry(inquiry)} className="cursor-pointer text-[14px] font-medium text-[#222222] focus:bg-[#F7F7F7] focus:text-[#222222] rounded-lg py-2">
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {!inquiry.isRead && (
                            <DropdownMenuItem onClick={() => markAsRead(inquiry._id)} className="cursor-pointer text-[14px] font-medium text-[#222222] focus:bg-[#F7F7F7] focus:text-[#222222] rounded-lg py-2">
                              <CheckCircle className="h-4 w-4 mr-2 text-[#00A699]" /> Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-[#EBEBEB] my-1" />
                          <DropdownMenuItem className="cursor-pointer text-[14px] font-medium text-[#222222] focus:bg-[#F7F7F7] focus:text-[#222222] rounded-lg py-2">
                            <Mail className="h-4 w-4 mr-2 stroke-[2]" /> Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-[14px] font-medium text-[#222222] focus:bg-[#F7F7F7] focus:text-[#222222] rounded-lg py-2">
                            <Phone className="h-4 w-4 mr-2 stroke-[2]" /> Call Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && validInquiries.length === 0 && (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#F7F7F7] border border-[#DDDDDD] flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-[#717171] stroke-[1.5]" />
                      </div>
                      <h3 className="text-[22px] font-semibold text-[#222222]">No inquiries found</h3>
                      <p className="text-[#717171] text-[15px] max-w-sm">
                        {(status !== 'all' || type !== 'all' || query || isReadParam !== 'all')
                          ? "We couldn't find any inquiries matching your filters."
                          : "When you receive new inquiries, they will appear here."}
                      </p>
                      {(status !== 'all' || type !== 'all' || query || isReadParam !== 'all') && (
                        <Button variant="outline" className="mt-4 rounded-xl h-12 px-6 border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[15px]" onClick={() => { setStatus('all'); setType('all'); setIsReadParam('all'); setQuery(''); }}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-[#DDDDDD] bg-white">
            <div className="text-[14px] font-medium text-[#717171]">
              Showing <span className="text-[#222222]">{validInquiries.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-10 px-4 rounded-lg font-semibold text-[14px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7]">
                Previous
              </Button>
              <div className="flex items-center gap-1 hidden sm:flex">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm" className={`w-10 h-10 p-0 rounded-lg font-semibold text-[14px] ${currentPage === page ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222]'}`} onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-10 px-4 rounded-lg font-semibold text-[14px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7]">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function InquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium">Loading inquiries...</p>
        </div>
      }
    >
      <InquiriesContent />
    </Suspense>
  );
}