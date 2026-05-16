'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import {
    Megaphone, MousePointerClick, Eye, TrendingUp, Calendar,
    MapPin, CheckCircle2, PauseCircle, Plus, Sparkles, Building2,
    AlertCircle, ArrowRight
} from 'lucide-react';

// Mock Data
const initialCampaignsData = [
    { id: '1', property: 'Villa Océane, Assinie', type: 'Homepage Spotlight', spend: 45000, maxBudget: 100000, clicks: 1250, ctr: '8.4%', status: 'Active' },
    { id: '2', property: 'Plateau Business Center', type: 'Featured Search', spend: 80000, maxBudget: 80000, clicks: 2100, ctr: '12.1%', status: 'Completed' },
    { id: '3', property: 'Cocody Riviera 3 Duplex', type: 'Email Newsletter', spend: 15000, maxBudget: 50000, clicks: 340, ctr: '5.2%', status: 'Active' },
];

const recommendationsData = [
    { id: '101', property: 'Marcory Zone 4 Apt', reason: 'High demand in this area this week', estReach: '+5,000 views' },
    { id: '102', property: 'Bingerville Family Home', reason: 'Price recently reduced', estReach: '+3,200 views' },
];

const DashboardHeader = ({ onNewCampaign }: { onNewCampaign: () => void }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-xl bg-slate-900 text-white -sm">
                    <Megaphone className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Promotions & Ads</h1>
                </div>
            </div>
            <p className="text-slate-500 pl-11">Manage property boosts and track your marketing campaign performance.</p>
        </div>

        <div className="flex items-center gap-3">
            <Button variant="default" onClick={onNewCampaign} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold h-11 px-6 -sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
            </Button>
        </div>
    </div>
);

const KPICard = ({ title, amount, subtext, icon: Icon, colorClass, isCurrency = false }: any) => {
    const variants: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    return (
        <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden group hover:-md transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${variants[colorClass]} transition-transform duration-500 group-hover:scale-110`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-baseline gap-1">
                        {amount.toLocaleString()}
                        {isCurrency && <span className="text-base font-bold text-slate-400 uppercase">FCFA</span>}
                        {!isCurrency && typeof amount === 'number' && amount % 1 !== 0 && <span className="text-base font-bold text-slate-400">%</span>}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
                        {subtext}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

const PromotionsPage = () => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [budget, setBudget] = useState("50000");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState('1');
    const [selectedGoal, setSelectedGoal] = useState('visibility');

    // Manage active campaigns
    const [campaigns, setCampaigns] = useState(initialCampaignsData);

    const handleLaunch = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const propName = selectedProperty === '1' ? 'Riviera Palmeraie Villa' : selectedProperty === '2' ? 'Cocody Danga Apartment' : 'Assinie Beachfront Plot';
            const typeName = selectedGoal === 'visibility' ? 'Maximize Visibility' : selectedGoal === 'leads' ? 'Generate Leads' : 'Urgent Sale';

            setCampaigns([{
                id: Math.random().toString(),
                property: propName,
                type: typeName,
                spend: 0,
                maxBudget: Number(budget),
                clicks: 0,
                ctr: '0%',
                status: 'Active'
            }, ...campaigns]);

            setIsSubmitting(false);
            setIsSheetOpen(false);
            setCurrentStep(1);
        }, 1500);
    };

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="p-4 md:p-8 pt-6">
                        <div className="max-w-6xl mx-auto pb-12">
                            <DashboardHeader onNewCampaign={() => setIsSheetOpen(true)} />

                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <KPICard
                                    title="Active Campaigns"
                                    amount={3}
                                    subtext={<><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Out of 12 listings</>}
                                    icon={Megaphone}
                                    colorClass="blue"
                                />
                                <KPICard
                                    title="Total Impressions"
                                    amount={45200}
                                    subtext={<><Eye className="w-3.5 h-3.5 text-indigo-500" /> +24% this week</>}
                                    icon={Eye}
                                    colorClass="indigo"
                                />
                                <KPICard
                                    title="Total Clicks"
                                    amount={3850}
                                    subtext={<><MousePointerClick className="w-3.5 h-3.5 text-emerald-500" /> 8.5% CTR avg</>}
                                    icon={MousePointerClick}
                                    colorClass="emerald"
                                />
                                <KPICard
                                    title="Ad Spend"
                                    amount={125000}
                                    subtext={<><AlertCircle className="w-3.5 h-3.5 text-blue-500" /> 25k remaining budget</>}
                                    icon={Sparkles}
                                    colorClass="blue"
                                    isCurrency={true}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                                {/* Active Campaigns Table */}
                                <div className="lg:col-span-8">
                                    <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden h-full">
                                        <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50 flex flex-row items-center justify-between">
                                            <CardTitle className="text-lg font-bold text-slate-800">Your Campaigns</CardTitle>
                                        </CardHeader>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Property & Type</th>
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Spend / Budget</th>
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Performance</th>
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {campaigns.map((campaign) => (
                                                        <tr key={campaign.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <p className="text-sm font-bold text-slate-800">{campaign.property}</p>
                                                                <p className="text-xs text-slate-500 font-medium">{campaign.type}</p>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex flex-col gap-1.5 w-32">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="font-bold text-slate-700">{campaign.spend.toLocaleString()} FCFA</span>
                                                                        <span className="text-slate-400">{campaign.maxBudget.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${campaign.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                            style={{ width: `${(campaign.spend / campaign.maxBudget) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <p className="text-sm font-bold text-slate-800">{campaign.clicks.toLocaleString()} clicks</p>
                                                                <p className="text-xs text-slate-500 font-medium">{campaign.ctr} CTR</p>
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                {campaign.status === 'Active' ? (
                                                                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-2.5 py-1">Active</Badge>
                                                                ) : (
                                                                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2.5 py-1">Completed</Badge>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>

                                {/* Recommendations Panel */}
                                <div className="lg:col-span-4">
                                    <div className="space-y-6">
                                        <Card className="rounded-3xl border-slate-200 -sm bg-blue-500 text-white overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 transition-transform duration-500 group-hover:scale-110">
                                                <Megaphone className="w-32 h-32" />
                                            </div>
                                            <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between gap-6">
                                                <div>
                                                    <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 mb-4 uppercase tracking-widest text-[10px] items-center gap-1"><Sparkles className="w-3 h-3" /> Top Opportunity</Badge>
                                                    <h3 className="text-xl font-bold leading-tight mb-2">Boost your listings to close faster.</h3>
                                                    <p className="text-blue-100 text-sm">Promoted properties get up to 4x more leads within the first 48 hours.</p>
                                                </div>
                                                <Button onClick={() => setIsSheetOpen(true)} className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold -sm transition-all h-11 rounded-xl">
                                                    Start New Promotion
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden">
                                            <CardHeader className="border-b border-slate-50 pb-3 pt-5 px-5 bg-slate-50/50">
                                                <CardTitle className="text-lg font-bold text-slate-800">Recommendations</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y divide-slate-100">
                                                    {recommendationsData.map((rec) => (
                                                        <div key={rec.id} className="p-5 hover:bg-slate-50/50 transition-colors cursor-pointer group flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                                <TrendingUp className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-bold text-slate-800 truncate">{rec.property}</h4>
                                                                <p className="text-xs text-slate-500 line-clamp-1 mb-1">{rec.reason}</p>
                                                                <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 font-semibold px-1.5 py-0 items-center justify-center h-5">{rec.estReach}</Badge>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors mt-3 shrink-0" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>

                {/* Campaign Creation Slide-out Panel */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="w-full sm:max-w-xl md:max-w-xl p-0 border-l border-slate-200 bg-white -2xl flex flex-col">
                        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <SheetTitle className="text-xl font-bold text-slate-900">Create Campaign</SheetTitle>
                            <SheetDescription>Configure a new marketing boost for your property.</SheetDescription>

                            {/* Stepper */}
                            <div className="flex items-center gap-2 mt-4">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex items-center gap-2 flex-1">
                                        <div className={`h-1.5 w-full rounded-full transition-colors ${step <= currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                    </div>
                                ))}
                            </div>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-6">
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">Select Property</h3>
                                        <p className="text-sm text-slate-500 mb-4">Choose which listing you want to promote.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {[{ id: '1', name: 'Riviera Palmeraie Villa', price: '85,000,000 FCFA' }, { id: '2', name: 'Cocody Danga Apartment', price: '45,000,000 FCFA' }, { id: '3', name: 'Assinie Beachfront Plot', price: '120,000,000 FCFA' }].map(prop => (
                                            <div
                                                key={prop.id}
                                                onClick={() => setSelectedProperty(prop.id)}
                                                className={`p-4 rounded-2xl border-1 cursor-pointer transition-all flex items-center gap-4 ${selectedProperty === prop.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                    <Building2 className={`w-6 h-6 ${selectedProperty === prop.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-bold ${selectedProperty === prop.id ? 'text-slate-900' : 'text-slate-700'}`}>{prop.name}</h4>
                                                    <p className="text-sm text-slate-500">{prop.price}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-1 flex items-center justify-center ${selectedProperty === prop.id ? 'border-blue-600' : 'border-slate-300'}`}>
                                                    {selectedProperty === prop.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">Marketing Goal</h3>
                                        <p className="text-sm text-slate-500 mb-4">What do you want to achieve with this campaign?</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { id: 'visibility', title: 'Maximize Visibility', desc: 'Show at the top of search results and homepage.', icon: Eye, color: 'blue' },
                                            { id: 'leads', title: 'Generate Leads', desc: 'Targeted ads to buyers looking in this area.', icon: MousePointerClick, color: 'emerald' },
                                            { id: 'urgent', title: 'Urgent Sale', desc: 'Aggressive marketing and email blasts to network.', icon: AlertCircle, color: 'rose' }
                                        ].map(goal => (
                                            <div
                                                key={goal.id}
                                                onClick={() => setSelectedGoal(goal.id)}
                                                className={`p-5 rounded-2xl border-1 cursor-pointer transition-all flex items-start gap-4 ${selectedGoal === goal.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedGoal === goal.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    <goal.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-bold mb-1 ${selectedGoal === goal.id ? 'text-slate-900' : 'text-slate-700'}`}>{goal.title}</h4>
                                                    <p className="text-sm text-slate-500 leading-snug">{goal.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">Budget & Launch</h3>
                                        <p className="text-sm text-slate-500 mb-4">Set your daily budget to control your ad spend.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="budget" className="font-bold text-slate-700">Daily Budget (FCFA)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="budget"
                                                    type="number"
                                                    value={budget}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                    className="pl-4 pr-16 h-12 rounded-xl border-slate-200 text-lg font-bold"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-sm pointer-events-none">
                                                    FCFA
                                                </div>
                                            </div>
                                        </div>

                                        <Card className="rounded-2xl border-slate-100 bg-slate-50 mt-6 -none">
                                            <CardContent className="p-5 space-y-3 text-sm">
                                                <div className="flex justify-between font-medium text-slate-600">
                                                    <span>Est. Daily Impressions</span>
                                                    <span className="text-slate-900">~{Math.floor(Number(budget) / 10).toLocaleString()} views</span>
                                                </div>
                                                <div className="flex justify-between font-medium text-slate-600">
                                                    <span>Campaign Duration</span>
                                                    <span className="text-slate-900">Continuous</span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-base">
                                                    <span className="text-slate-900">Total Authorization</span>
                                                    <span className="text-blue-600">{Number(budget).toLocaleString()} FCFA / day</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </div>

                        <SheetFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between sm:justify-between gap-4">
                            <Button
                                variant="outline"
                                onClick={currentStep === 1 ? () => setIsSheetOpen(false) : handleBack}
                                className="h-11 px-6 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-100"
                                disabled={isSubmitting}
                            >
                                {currentStep === 1 ? 'Cancel' : 'Back'}
                            </Button>
                            <Button
                                onClick={currentStep === 3 ? handleLaunch : handleNext}
                                className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white -sm"
                                disabled={isSubmitting || (currentStep === 1 && !selectedProperty) || (currentStep === 2 && !selectedGoal) || (currentStep === 3 && !budget)}
                            >
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : currentStep === 3 ? (
                                    <>Launch Campaign</>
                                ) : (
                                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </SidebarProvider>
    );
};

export default PromotionsPage;
