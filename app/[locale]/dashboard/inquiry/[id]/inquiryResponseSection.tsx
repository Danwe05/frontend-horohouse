'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  MessageCircle,
  Send,
  Loader2,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';

// Use the same interface structure as your main component
interface InquiryResponseSectionProps {
  inquiry: {
    _id: string;
    response?: string;
    respondedAt?: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      phoneNumber?: string;
      profilePicture?: string;
    };
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
  };
  canRespond: boolean;
  onSendResponse: (response: string) => Promise<void>;
}

export const InquiryResponseSection: React.FC<InquiryResponseSectionProps> = ({
  inquiry,
  canRespond,
  onSendResponse,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState(inquiry.response || '');
  const [responding, setResponding] = useState(false);

  // Safely extract user name - now we know it's always an object
  const getUserName = () => {
    return inquiry.userId?.name || 'the user';
  };

  // Safely extract property title - now we know it's always an object
  const getPropertyTitle = () => {
    return inquiry.propertyId?.title || 'this property';
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      return;
    }

    try {
      setResponding(true);
      await onSendResponse(responseText);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setResponding(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      setResponseText(inquiry.response || '');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Response</CardTitle>
          {inquiry.response && canRespond && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Update Response
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Update Response</DialogTitle>
                  <DialogDescription>
                    Update your response to {getUserName()}
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
                      rows={8}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Be professional and helpful in your response
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogOpen(false)}
                    disabled={responding}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendResponse}
                    disabled={responding || !responseText.trim()}
                  >
                    {responding && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Response
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {inquiry.response ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Agent Response</Label>
              <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {inquiry.response}
                </p>
              </div>
            </div>
            {inquiry.respondedAt && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Responded on {format(new Date(inquiry.respondedAt), 'MMM d, yyyy')} at{' '}
                  {format(new Date(inquiry.respondedAt), 'h:mm a')}
                </span>
              </div>
            )}
          </div>
        ) : canRespond ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No response yet</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Respond to this inquiry to help {getUserName()} with their questions about{' '}
              {getPropertyTitle()}
            </p>

            <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Send Response
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Respond to Inquiry</DialogTitle>
                  <DialogDescription>
                    Send a response to {getUserName()} about their inquiry for{' '}
                    {getPropertyTitle()}
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
                      rows={8}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Be professional and helpful. Include relevant details about the property and
                      next steps.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogOpen(false)}
                    disabled={responding}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendResponse}
                    disabled={responding || !responseText.trim()}
                  >
                    {responding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Response
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Waiting for agent response</p>
            <p className="text-sm text-muted-foreground">
              The agent will respond to your inquiry soon
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};