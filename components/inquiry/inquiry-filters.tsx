'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';

interface InquiryFiltersProps {
  filters: {
    status: string;
    type: string;
    isRead: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  stats?: {
    total: number;
    pending: number;
    responded: number;
    closed: number;
    unread: number;
  };
}

export const InquiryFilters: React.FC<InquiryFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  stats,
}) => {
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== 'all' && value !== ''
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search inquiries..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">
                  Pending {stats && `(${stats.pending})`}
                </SelectItem>
                <SelectItem value="RESPONDED">
                  Responded {stats && `(${stats.responded})`}
                </SelectItem>
                <SelectItem value="CLOSED">
                  Closed {stats && `(${stats.closed})`}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, type: value })
              }
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

          <div>
            <Label>Read Status</Label>
            <Select
              value={filters.isRead}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, isRead: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">
                  Unread {stats && `(${stats.unread})`}
                </SelectItem>
                <SelectItem value="true">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};