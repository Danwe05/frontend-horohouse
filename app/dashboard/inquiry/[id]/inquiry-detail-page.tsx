'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  MessageCircle,
  Home,
  User,
  Send,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { InquiryResponseSection } from './inquiryResponseSection';

// Types
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

const InquiryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please login to view inquiries');
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load inquiry details
  const loadInquiry = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await apiClient.getInquiry(inquiryId);

      setInquiry(data);
      setNewStatus(data.status);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load inquiry:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load inquiry';
      setError(errorMessage);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/auth/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view this inquiry.');
        router.push('/dashboard/inquiry');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async (responseText: string) => {
    const data = await apiClient.updateInquiry(inquiryId, {
      response: responseText,
      status: 'RESPONDED',
    });

    setInquiry(data);
    toast.success('Response sent successfully');
  };

  // Update status
  const updateStatus = async () => {
    try {
      await apiClient.updateInquiry(inquiryId, {
        status: newStatus,
      });

      setInquiry(prev => prev ? { ...prev, status: newStatus as any } : null);
      setStatusDialogOpen(false);
      toast.success('Status updated successfully');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
      toast.error(errorMessage);

      if (error.response?.status === 403) {
        toast.error('You do not have permission to update this inquiry');
      }
    }
  };

  useEffect(() => {
    if (inquiryId && isAuthenticated && !authLoading) {
      loadInquiry();
    }
  }, [inquiryId, isAuthenticated, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'RESPONDED':
        return <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Responded
        </Badge>;
      case 'CLOSED':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="w-3 h-3 mr-1" />
          Closed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIEWING':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'BUYING':
        return <Home className="h-4 w-4 text-green-600" />;
      case 'RENTING':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Show loading state while checking auth
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error or not found state
  if (error || !inquiry) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {error?.includes('permission') || error?.includes('Access') ? 'Access Denied' : 'Inquiry Not Found'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {error || 'The inquiry you are looking for does not exist or has been removed.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => router.push('/dashboard/inquiry')}>
            View All Inquiries
          </Button>
        </div>
      </div>
    );
  }

  // Enhanced permission check with better debugging
  const userRole = user?.role?.toUpperCase();
  const userId = user?._id || user?.id || (user as any)?._id;
  const agentId = inquiry.agentId;
  
  // Check if user can respond (agent or admin)
  const canRespond = Boolean(user && (
    userRole === 'ADMIN' || 
    userRole === 'AGENT' || 
    String(agentId) === String(userId)
  ));

  // Debug info (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Permission Debug:', {
      userRole,
      userId,
      agentId,
      rawUser: JSON.stringify(user),
      canRespond,
      comparison: String(agentId) === String(userId)
    });
  }

  // Helper to safely render ids or user-like objects in the UI
  const formatIdOrUser = (val: any) => {
    if (!val && val !== 0) return 'N/A';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return (val as any)._id || (val as any).id || (val as any).name || JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <div className="space-y-6 p-6">
    
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inquiry Details</h1>
            <p className="text-muted-foreground">
              #{inquiry._id.slice(-8)} • {format(new Date(inquiry.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(inquiry.status)}

          {canRespond && (
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Inquiry Status</DialogTitle>
                  <DialogDescription>
                    Change the status of this inquiry
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="RESPONDED">Responded</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateStatus}>
                    Update Status
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inquiry Message */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getTypeIcon(inquiry.type)}
                  <span>{inquiry.type.charAt(0) + inquiry.type.slice(1).toLowerCase()} Inquiry</span>
                </CardTitle>
                {!inquiry.isRead && (
                  <Badge variant="destructive" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Message</Label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <p className="whitespace-pre-wrap">{inquiry.message}</p>
                  </div>
                </div>

                {/* Additional Details */}
                {inquiry.viewingDate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Preferred Viewing Date:</span>
                    <span>{format(new Date(inquiry.viewingDate), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {inquiry.budget && (
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Budget:</span>
                    <span>${inquiry.budget.toLocaleString()}</span>
                  </div>
                )}

                {inquiry.moveInDate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Move-in Date:</span>
                    <span>{format(new Date(inquiry.moveInDate), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {inquiry.preferredContactMethod && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Preferred Contact:</span>
                    <span className="capitalize">{inquiry.preferredContactMethod}</span>
                  </div>
                )}

                {inquiry.preferredContactTime && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Preferred Contact Time:</span>
                    <span>{inquiry.preferredContactTime}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Response Section */}
          <InquiryResponseSection
            inquiry={inquiry}
            canRespond={canRespond}
            onSendResponse={handleSendResponse}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={inquiry.userId.profilePicture} />
                    <AvatarFallback>
                      {inquiry.userId.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{inquiry.userId.name}</h3>
                    <p className="text-sm text-muted-foreground">Client</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {inquiry.contactEmail || inquiry.userId.email}
                      </p>
                    </div>
                  </div>

                  {(inquiry.contactPhone || inquiry.userId.phoneNumber) && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {inquiry.contactPhone || inquiry.userId.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {canRespond && (
                  <div className="flex space-x-2">
                    <a 
                      href={`mailto:${inquiry.contactEmail || inquiry.userId.email}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </a>
                    {(inquiry.contactPhone || inquiry.userId.phoneNumber) && (
                      <a 
                        href={`tel:${inquiry.contactPhone || inquiry.userId.phoneNumber}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inquiry.propertyId.images && inquiry.propertyId.images.length > 0 && (
                  <div className="relative aspect-video rounded-md overflow-hidden">
                    <Image
                      src={inquiry.propertyId.images[0]}
                      alt={inquiry.propertyId.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold">{inquiry.propertyId.title}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${inquiry.propertyId.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{inquiry.propertyId.type}</span>
                </div>

                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{inquiry.propertyId.location.address}</p>
                    <p className="text-muted-foreground">
                      {inquiry.propertyId.location.city}, {inquiry.propertyId.location.state}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a href={`/properties/${inquiry.propertyId._id}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Property
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Inquiry Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inquiry.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                {inquiry.readAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Marked as Read</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inquiry.readAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}

                {inquiry.respondedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Response Sent</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inquiry.respondedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InquiryDetailPage;