'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Home,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ViewingEvent {
  id: string;
  title: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  agentId: string;
  agentName: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  reminderSent: boolean;
}

interface PropertyCalendarProps {
  userRole: 'registered_user' | 'agent' | 'admin';
  userId?: string;
}

const CalendarGrid: React.FC<{
  currentDate: Date;
  events: ViewingEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: ViewingEvent) => void;
}> = ({ currentDate, events, onDateClick, onEventClick }) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());

  const days = [];
  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayEvents = events.filter(event => 
      event.startTime.toDateString() === date.toDateString()
    );

    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;

    days.push(
      <div
        key={i}
        className={`min-h-[100px] border border-gray-200 p-2 ${
          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
        } ${isToday ? 'bg-blue-50 border-blue-300' : ''} ${
          isPast ? 'opacity-50' : ''
        } cursor-pointer hover:bg-gray-50 transition-colors`}
        onClick={() => onDateClick(date)}
      >
        <div className={`text-sm font-medium mb-1 ${
          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
        } ${isToday ? 'text-blue-600' : ''}`}>
          {date.getDate()}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className={`text-xs p-1 rounded cursor-pointer truncate ${
                event.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : event.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : event.status === 'confirmed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(event);
              }}
            >
              {event.startTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })} - {event.clientName}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-gray-500">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700">
          {day}
        </div>
      ))}
      {days}
    </div>
  );
};

const EventModal: React.FC<{
  event: ViewingEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ViewingEvent) => void;
  onDelete: (eventId: string) => void;
  properties: Array<{ id: string; title: string; address: string }>;
  clients: Array<{ id: string; name: string; email: string; phone: string }>;
}> = ({ event, isOpen, onClose, onSave, onDelete, properties, clients }) => {
  const [formData, setFormData] = useState<Partial<ViewingEvent>>({});

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        title: '',
        propertyId: '',
        clientId: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        status: 'scheduled',
        notes: ''
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      onSave(formData as ViewingEvent);
    } else {
      onSave({
        ...formData,
        id: `event-${Date.now()}`,
        propertyTitle: properties.find(p => p.id === formData.propertyId)?.title || '',
        propertyAddress: properties.find(p => p.id === formData.propertyId)?.address || '',
        clientName: clients.find(c => c.id === formData.clientId)?.name || '',
        clientEmail: clients.find(c => c.id === formData.clientId)?.email || '',
        clientPhone: clients.find(c => c.id === formData.clientId)?.phone || '',
        agentId: 'current-agent',
        agentName: 'Current Agent',
        reminderSent: false
      } as ViewingEvent);
    }
    onClose();
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Viewing' : 'Schedule New Viewing'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Viewing Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="property">Property</Label>
              <Select
                value={formData.propertyId || ''}
                onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} - {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId || ''}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'scheduled'}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime ? new Date(formData.startTime.getTime() - formData.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime ? new Date(formData.endTime.getTime() - formData.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-between">
            <div>
              {event && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {event ? 'Update' : 'Schedule'} Viewing
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PropertyCalendar: React.FC<PropertyCalendarProps> = ({ userRole, userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ViewingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ViewingEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sample data
  const properties = [
    { id: 'prop-1', title: 'Luxury Downtown Apartment', address: '123 Main St, Downtown' },
    { id: 'prop-2', title: 'Modern Family Home', address: '456 Oak Ave, Suburbs' },
    { id: 'prop-3', title: 'Beachfront Villa', address: '789 Ocean Dr, Beachfront' },
    { id: 'prop-4', title: 'Mountain Cabin', address: '321 Pine Rd, Mountains' }
  ];

  const clients = [
    { id: 'client-1', name: 'John Smith', email: 'john@example.com', phone: '+1-555-0123' },
    { id: 'client-2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1-555-0456' },
    { id: 'client-3', name: 'Mike Davis', email: 'mike@example.com', phone: '+1-555-0789' },
    { id: 'client-4', name: 'Emily Wilson', email: 'emily@example.com', phone: '+1-555-0321' }
  ];

  useEffect(() => {
    loadCalendarData();
  }, [userRole, userId, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate sample events
      const sampleEvents: ViewingEvent[] = [
        {
          id: 'event-1',
          title: 'Property Tour',
          propertyId: 'prop-1',
          propertyTitle: 'Luxury Downtown Apartment',
          propertyAddress: '123 Main St, Downtown',
          clientId: 'client-1',
          clientName: 'John Smith',
          clientEmail: 'john@example.com',
          clientPhone: '+1-555-0123',
          agentId: 'agent-1',
          agentName: 'Current Agent',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
          status: 'scheduled',
          notes: 'First time viewing, interested in downtown living',
          reminderSent: false
        },
        {
          id: 'event-2',
          title: 'Follow-up Viewing',
          propertyId: 'prop-2',
          propertyTitle: 'Modern Family Home',
          propertyAddress: '456 Oak Ave, Suburbs',
          clientId: 'client-2',
          clientName: 'Sarah Johnson',
          clientEmail: 'sarah@example.com',
          clientPhone: '+1-555-0456',
          agentId: 'agent-1',
          agentName: 'Current Agent',
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // Day after tomorrow + 1.5 hours
          status: 'confirmed',
          notes: 'Second viewing, very interested',
          reminderSent: true
        },
        {
          id: 'event-3',
          title: 'Property Inspection',
          propertyId: 'prop-3',
          propertyTitle: 'Beachfront Villa',
          propertyAddress: '789 Ocean Dr, Beachfront',
          clientId: 'client-3',
          clientName: 'Mike Davis',
          clientEmail: 'mike@example.com',
          clientPhone: '+1-555-0789',
          agentId: 'agent-1',
          agentName: 'Current Agent',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // Yesterday + 2 hours
          status: 'completed',
          notes: 'Inspection completed successfully',
          reminderSent: true
        }
      ];

      setEvents(sampleEvents);
    } catch (err: any) {
      console.error('Failed to load calendar data:', err);
      setError(err?.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: ViewingEvent) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (event: ViewingEvent) => {
    if (event.id && events.find(e => e.id === event.id)) {
      // Update existing event
      setEvents(events.map(e => e.id === event.id ? event : e));
    } else {
      // Add new event
      setEvents([...events, event]);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredEvents = events.filter(event => 
    statusFilter === 'all' || event.status === statusFilter
  );

  const upcomingEvents = events
    .filter(event => event.startTime >= new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Property Calendar</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <CalendarIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadCalendarData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Calendar</h2>
          <p className="text-gray-600">Schedule and manage property viewings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadCalendarData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Viewing
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Viewings</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{events.filter(e => e.startTime >= new Date() && e.status !== 'cancelled').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{events.filter(e => e.status === 'completed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => 
                    e.startTime.getMonth() === currentDate.getMonth() && 
                    e.startTime.getFullYear() === currentDate.getFullYear()
                  ).length}
                </p>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendar View</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[120px] text-center">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CalendarGrid
                currentDate={currentDate}
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Viewings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Viewings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming viewings</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.propertyTitle}</h4>
                          <p className="text-xs text-gray-600">{event.clientName}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.startTime.toLocaleDateString()} at {event.startTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(event.status)}
                        </div>
                      </div>
                      <Badge className={`mt-2 text-xs ${getStatusColor(event.status)}`}>
                        {event.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Viewing
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Calendar
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Filter Viewings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        properties={properties}
        clients={clients}
      />
    </div>
  );
};
