'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Eye,
  MessageCircle,
  Calendar,
  Home,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface InquiryCardProps {
  inquiry: {
    _id: string;
    propertyId: {
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
    };
    userId: {
      _id: string;
      name: string;
      email: string;
      phoneNumber?: string;
      profilePicture?: string;
    };
    message: string;
    type: 'GENERAL' | 'VIEWING' | 'BUYING' | 'RENTING';
    status: 'PENDING' | 'RESPONDED' | 'CLOSED';
    isRead: boolean;
    createdAt: string;
    viewingDate?: string;
    budget?: number;
  };
  onMarkAsRead?: (inquiryId: string) => void;
  onRespond?: (inquiry: any) => void;
}

export const InquiryCard: React.FC<InquiryCardProps> = ({
  inquiry,
  onMarkAsRead,
  onRespond,
}) => {
  const router = useRouter();

  const getStatusBadge = (status: string, isRead: boolean) => {
    if (!isRead) {
      return <Badge variant="destructive" className="text-xs">New</Badge>;
    }
    
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
      case 'RESPONDED':
        return <Badge variant="default" className="text-xs">Responded</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary" className="text-xs">Closed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        !inquiry.isRead ? 'border-blue-200 bg-blue-50/30' : ''
      }`}
      onClick={() => router.push(`/dashboard/inquiries/${inquiry._id}`)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={inquiry.userId.profilePicture} />
                <AvatarFallback>
                  {inquiry.userId.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{inquiry.userId.name}</h3>
                <p className="text-sm text-muted-foreground">{inquiry.userId.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(inquiry.status, inquiry.isRead)}
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTypeIcon(inquiry.type)}
                <span className="capitalize">{inquiry.type.toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Property Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{inquiry.propertyId.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {inquiry.propertyId.location.city}, {inquiry.propertyId.location.state}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  ${inquiry.propertyId.price.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {inquiry.propertyId.type}
                </p>
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {inquiry.message}
            </p>
          </div>

          {/* Additional Details */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              {inquiry.viewingDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Viewing: {format(new Date(inquiry.viewingDate), 'MMM d')}</span>
                </div>
              )}
              {inquiry.budget && (
                <div className="flex items-center space-x-1">
                  <span>Budget: ${inquiry.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(inquiry.createdAt), 'MMM d, h:mm a')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              {inquiry.userId.phoneNumber && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${inquiry.userId.phoneNumber}`);
                  }}
                  className="text-xs"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${inquiry.userId.email}`);
                }}
                className="text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </div>
            
            {inquiry.status === 'PENDING' && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRespond?.(inquiry);
                }}
                className="text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Respond
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
