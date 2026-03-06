"use client";
import React, { useMemo, useState } from "react";
import ProfileCompletionCard from "./CompleteYourProfile";
import HelpCard from "./HelpCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LifeBuoy, Mail, MessageSquare, Phone, Search } from "lucide-react";

const HelpSupport = () => {
  const percentage = 89; // pourcentage dynamique

  const [query, setQuery] = useState("");

  const quickLinks = useMemo(
    () => [
      {
        title: "Chat with support",
        description: "Get help in minutes from our team",
        icon: MessageSquare,
      },
      {
        title: "Email us",
        description: "support@horohouse.com",
        icon: Mail,
      },
      {
        title: "Call us",
        description: "+1 (000) 000-0000",
        icon: Phone,
      },
    ],
    []
  );

  return (
    <div className="px-4 py-6 lg:px-10 lg:py-7">
      <div className="max-w-6xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 md:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                  Help & Support
                </h1>
                <p className="mt-1 text-sm md:text-base text-slate-600">
                  Find answers fast, or reach our team when you need it.
                </p>
              </div>

              <div className="w-full md:w-[420px]">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search help articles, topics, and keywords..."
                    className="pl-9 bg-white/80"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="bg-white/80 hover:bg-white">
                Getting Started
              </Button>
              <Button type="button" size="sm" variant="outline" className="bg-white/80 hover:bg-white">
                Payments
              </Button>
              <Button type="button" size="sm" variant="outline" className="bg-white/80 hover:bg-white">
                Account
              </Button>
              <Button type="button" size="sm" variant="outline" className="bg-white/80 hover:bg-white">
                Security
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="center" className="w-full mt-6">
          <TabsList className="w-full md:w-fit bg-white border border-slate-200 shadow-sm">
            <TabsTrigger value="center" className="gap-2">
              <LifeBuoy className="h-4 w-4" />
              Help Center
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Customer Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="center" className="mt-6">
            <div className="rounded-2xl bg-slate-50/40 p-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-2xl">
                <div className="lg:col-span-2 space-y-6">
                  {/* Help Card */}
                  <HelpCard count={12} variant="large" />

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Popular topics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button type="button" variant="outline" className="justify-start bg-white hover:bg-slate-50">
                        Account & Profile
                      </Button>
                      <Button type="button" variant="outline" className="justify-start bg-white hover:bg-slate-50">
                        Listings & Properties
                      </Button>
                      <Button type="button" variant="outline" className="justify-start bg-white hover:bg-slate-50">
                        Payments & Billing
                      </Button>
                      <Button type="button" variant="outline" className="justify-start bg-white hover:bg-slate-50">
                        Security
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Profile Completion Card */}
                  <ProfileCompletionCard percentage={percentage} variant="large" />

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Need help now?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quickLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.title}
                            className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 hover:shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            type="button"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-lg bg-slate-100 p-2.5 text-slate-700">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-500">{item.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Contact support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    Search query: {query || "—"}
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Support hours</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    Mon–Fri, 9:00am – 6:00pm
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HelpSupport;
