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
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 animate-pulse font-semibold px-2.5 py-1">
          <AlertCircle className="h-3 w-3 mr-1" /> New
        </Badge>
      );
    }
    switch (stat) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2.5 py-1">Pending</Badge>;
      case 'RESPONDED': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold px-2.5 py-1">Responded</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold px-2.5 py-1">Closed</Badge>;
      default: return <Badge variant="outline" className="capitalize font-semibold px-2.5 py-1">{stat}</Badge>;
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'VIEWING': return <Eye className="h-3.5 w-3.5 text-blue-500" />;
      case 'BUYING': return <Home className="h-3.5 w-3.5 text-green-500" />;
      case 'RENTING': return <Calendar className="h-3.5 w-3.5 text-purple-500" />;
      default: return <MessageCircle className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, bg }: any) => (
    <Card className="rounded-2xl border-slate-200 -sm transition-all hover:-md">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            {title}
            {trend !== null && trend !== 0 && (
              <span className={`flex items-center text-[10px] ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingUp className="h-2.5 w-2.5 mr-0.5 rotate-180" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Property Inquiries</h1>
          </div>
          <p className="text-slate-500 pl-11">Manage and respond to property inquiries from potential clients</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-6 -sm border-slate-200 text-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={MessageCircle} trend={previousStats ? getTrend(stats.total, previousStats.total) : null} color="text-violet-600" bg="bg-violet-50" />
        <StatCard title="Unread" value={stats.unread} icon={AlertCircle} trend={previousStats ? getTrend(stats.unread, previousStats.unread) : null} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} trend={previousStats ? getTrend(stats.pending, previousStats.pending) : null} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Responded" value={stats.responded} icon={CheckCircle} trend={previousStats ? getTrend(stats.responded, previousStats.responded) : null} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Closed" value={stats.closed} icon={XCircle} trend={previousStats ? getTrend(stats.closed, previousStats.closed) : null} color="text-slate-600" bg="bg-slate-50" />
      </div>

      {/* MODERN FILTER BAR */}
      <div className="bg-white p-2 rounded-2xl -sm border border-slate-200 sticky top-4 z-10 transition-all">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inquiries..."
              className="pl-11 border-none bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-500 h-11 rounded-xl text-sm"
            />
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-10" />

          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            <Tabs value={status} onValueChange={(v) => setStatus(v)} className="w-fit">
              <TabsList className="bg-slate-50/80 p-1 h-11 rounded-xl">
                <TabsTrigger value="all" className="px-3 h-9 rounded-lg text-sm">All</TabsTrigger>
                <TabsTrigger value="PENDING" className="px-3 h-9 rounded-lg text-sm">Pending</TabsTrigger>
                <TabsTrigger value="RESPONDED" className="px-3 h-9 rounded-lg text-sm">Responded</TabsTrigger>
                <TabsTrigger value="CLOSED" className="px-3 h-9 rounded-lg text-sm">Closed</TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="hidden lg:block h-10 mx-1" />

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px] h-11 border-none bg-slate-50 rounded-xl text-sm text-slate-600">
                <ListFilter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Type</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="VIEWING">Viewing</SelectItem>
                <SelectItem value="BUYING">Buying</SelectItem>
                <SelectItem value="RENTING">Renting</SelectItem>
              </SelectContent>
            </Select>

            <Select value={isReadParam} onValueChange={setIsReadParam}>
              <SelectTrigger className="w-[140px] h-11 border-none bg-slate-50 rounded-xl text-sm text-slate-600">
                <SelectValue placeholder="Read Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="false">Unread Only</SelectItem>
                <SelectItem value="true">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ACTIVE FILTER BADGES */}
      {(query || status !== 'all' || type !== 'all' || isReadParam !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Filters:</span>
          {query && (
            <Badge variant="secondary" className="bg-white border -sm text-slate-600 px-3 py-1.5 rounded-full gap-2 text-sm font-medium">
              "{query}" <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setQuery('')} />
            </Badge>
          )}
          {status !== 'all' && (
            <Badge variant="secondary" className="bg-white border -sm text-slate-600 px-3 py-1.5 rounded-full gap-2 text-sm font-medium">
              Status: <span className="capitalize">{status.toLowerCase()}</span> <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setStatus('all')} />
            </Badge>
          )}
          {type !== 'all' && (
            <Badge variant="secondary" className="bg-white border -sm text-slate-600 px-3 py-1.5 rounded-full gap-2 text-sm font-medium">
              Type: <span className="capitalize">{type.toLowerCase()}</span> <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setType('all')} />
            </Badge>
          )}
          {isReadParam !== 'all' && (
            <Badge variant="secondary" className="bg-white border -sm text-slate-600 px-3 py-1.5 rounded-full gap-2 text-sm font-medium">
              {isReadParam === 'true' ? 'Read' : 'Unread'} <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setIsReadParam('all')} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setStatus('all'); setType('all'); setIsReadParam('all'); }} className="text-xs text-slate-400 hover:text-red-500 font-bold ml-1">
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedInquiries.size > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-800">
              {selectedInquiries.size} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markMultipleAsRead} className="bg-white hover:bg-slate-50 border-blue-200 text-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Mark as Read
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedInquiries(new Set())} className="text-slate-500 hover:text-slate-700">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* TABLE AREA */}
      <div className="bg-white rounded-2xl -sm border border-slate-200 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 h-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedInquiries.size === validInquiries.length && validInquiries.length > 0}
                    onChange={selectAllInquiries}
                    className="rounded border-slate-300 accent-blue-600"
                  />
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Client</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Property</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-slate-600 h-12">Type</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-slate-600 h-12">Date</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell className="text-center py-4"><Skeleton className="h-4 w-4 rounded inline-block" /></TableCell>
                  <TableCell className="py-4"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-28 rounded-full" /><Skeleton className="h-3 w-32 rounded-full" /></div></div></TableCell>
                  <TableCell className="py-4"><div className="space-y-1.5"><Skeleton className="h-4 w-32 rounded-full" /><Skeleton className="h-3 w-20 rounded-full" /><Skeleton className="h-3 w-24 rounded-full" /></div></TableCell>
                  <TableCell className="hidden md:table-cell py-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell className="hidden lg:table-cell py-4"><div className="space-y-1.5"><Skeleton className="h-4 w-20 rounded-full" /><Skeleton className="h-3 w-16 rounded-full" /></div></TableCell>
                  <TableCell className="text-right py-4 pr-6"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))}

              {!loading && validInquiries.map((inquiry) => (
                <TableRow
                  key={inquiry._id}
                  className={`
                    cursor-pointer transition-colors group
                    ${!inquiry.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'}
                    ${selectedInquiries.has(inquiry._id) ? 'bg-slate-50/80' : ''}
                  `}
                  onClick={() => viewInquiry(inquiry)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedInquiries.has(inquiry._id)}
                      onChange={(e) => toggleSelectInquiry(inquiry._id, e)}
                      className="rounded border-slate-300 accent-blue-600 cursor-pointer w-4 h-4 ml-2"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border-1 border-white -sm font-bold">
                        <AvatarImage src={inquiry.userId?.profilePicture} />
                        <AvatarFallback className="bg-slate-100 text-slate-600">
                          {inquiry.userId?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${!inquiry.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {inquiry.userId?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {inquiry.userId?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="min-w-0 space-y-1">
                      <p className={`text-sm truncate w-[160px] ${!inquiry.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {inquiry.propertyId?.title || 'Property Unavailable'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none px-1.5 py-0 text-[10px] uppercase font-bold">
                          {inquiry.propertyId?.type || 'N/A'}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-500">
                          XAF {inquiry.propertyId?.price?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inquiry.propertyId?.location?.city || 'Unknown location'}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell py-4">
                    <Badge variant="secondary" className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 px-2.5 py-1 text-xs font-semibold">
                      {getTypeIcon(inquiry.type)}
                      <span className="capitalize">{inquiry.type.toLowerCase()}</span>
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4">
                    {getStatusBadge(inquiry.status, inquiry.isRead)}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell py-4">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-700">
                        {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right py-4 pr-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {inquiry.status === 'PENDING' && (
                        <Dialog open={dialogOpen && selectedInquiry?._id === inquiry._id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) { setSelectedInquiry(inquiry); setResponseText(''); }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Respond">
                              <Send className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-xl">
                                <Send className="h-5 w-5 text-blue-600" />
                                Respond to Inquiry
                              </DialogTitle>
                              <DialogDescription>
                                Respond to <strong className="text-slate-900">{inquiry.userId?.name}</strong> regarding <strong className="text-slate-900">{inquiry.propertyId?.title}</strong>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original Message:</h4>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{inquiry.message}</p>
                              </div>
                              <div>
                                <Label htmlFor="response" className="text-slate-700 font-semibold mb-2 block">Your Response</Label>
                                <Textarea
                                  id="response"
                                  placeholder="Type your professional response here..."
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  rows={5}
                                  className="resize-none bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                />
                                <div className="flex justify-end text-xs text-slate-400 mt-2 font-medium">
                                  <span>{responseText.length}/2000</span>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="pt-2">
                              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-full">Cancel</Button>
                              <Button
                                onClick={() => respondToInquiry(inquiry._id)}
                                disabled={respondingTo === inquiry._id || !responseText.trim()}
                                className="rounded-full bg-blue-600 hover:bg-blue-700 -md min-w-[120px]"
                              >
                                {respondingTo === inquiry._id ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                ) : (
                                  <><Send className="mr-2 h-4 w-4" /> Send</>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl -lg">
                          <DropdownMenuItem onClick={() => viewInquiry(inquiry)} className="cursor-pointer text-slate-700">
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {!inquiry.isRead && (
                            <DropdownMenuItem onClick={() => markAsRead(inquiry._id)} className="cursor-pointer text-slate-700">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-slate-700">
                            <Mail className="h-4 w-4 mr-2" /> Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-slate-700">
                            <Phone className="h-4 w-4 mr-2" /> Call Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && validInquiries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-[300px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">No inquiries found</h3>
                      <p className="text-slate-500 text-sm max-w-sm">
                        {(status !== 'all' || type !== 'all' || query || isReadParam !== 'all')
                          ? "We couldn't find any inquiries matching your filters."
                          : "When you receive new inquiries, they will appear here."}
                      </p>
                      {(status !== 'all' || type !== 'all' || query || isReadParam !== 'all') && (
                        <Button variant="outline" className="mt-2 rounded-full" onClick={() => { setStatus('all'); setType('all'); setIsReadParam('all'); setQuery(''); }}>
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
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="text-sm font-medium text-slate-500">
              Showing <span className="text-slate-900">{validInquiries.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 rounded-lg -sm">
                Previous
              </Button>
              <div className="flex items-center gap-1 hidden sm:flex">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm" className={`w-8 h-8 p-0 rounded-lg ${currentPage === page ? 'bg-slate-900 -sm' : 'text-slate-600 hover:bg-slate-200'}`} onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 rounded-lg -sm">
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