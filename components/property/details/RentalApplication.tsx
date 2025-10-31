"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Video, Phone, Mail } from "lucide-react";

interface RentalApplicationProps {
  propertyId: string;
}

const RentalApplication = ({ propertyId }: RentalApplicationProps) => {
  return (
    <section className="bg-card rounded-2xl p-6 space-y-6">
      <h2 className="text-2xl font-bold">Schedule a Tour</h2>
      
      {/* Tour Options */}
      <div className="grid md:grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Video className="h-6 w-6 text-primary" />
          <span className="font-semibold">Video Tour</span>
          <span className="text-xs text-muted-foreground">Live virtual walkthrough</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="font-semibold">In-Person Tour</span>
          <span className="text-xs text-muted-foreground">Visit the property</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Phone className="h-6 w-6 text-primary" />
          <span className="font-semibold">Call Agent</span>
          <span className="text-xs text-muted-foreground">Speak with landlord</span>
        </Button>
      </div>

      {/* Contact Form */}
      <form className="space-y-4 pt-4 border-t border-border">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Doe" />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" placeholder="(555) 123-4567" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea 
            id="message" 
            placeholder="Tell us about yourself and when you'd like to move in..."
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="terms" />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            I agree to be contacted about this property
          </label>
        </div>

        <Button className="w-full h-12 text-base font-semibold">
          <Mail className="mr-2 h-5 w-5" />
          Request Information
        </Button>
      </form>

      {/* Landlord Info */}
      <div className="pt-4 border-t border-border flex items-center gap-4">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
          SP
        </div>
        <div>
          <p className="font-semibold text-lg">Sarah Peterson</p>
          <p className="text-sm text-muted-foreground">Property Manager</p>
          <p className="text-sm text-primary mt-1">Typically responds within 1 hour</p>
        </div>
      </div>
    </section>
  );
};

export default RentalApplication;
