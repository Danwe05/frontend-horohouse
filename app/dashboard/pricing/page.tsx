'use client';

import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import {
    Sparkles, Building2, MapPin, Ruler, BedDouble, Bath,
    Car, Home, Calendar, TrendingUp, AlertCircle, CheckCircle2,
    ChevronRight, ArrowRight, Activity, Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// --- Sub-Components ---

const DashboardHeader = () => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute -inset-1 bg-purple-500 rounded-xl blur opacity-25 animate-pulse"></div>
                    <div className="relative p-2 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Price Estimator</h1>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-none font-bold uppercase text-[10px] tracking-widest px-2 py-0.5">
                        <Zap className="w-3 h-3 mr-1 fill-purple-600" />
                        Beta
                    </Badge>
                </div>
            </div>
            <p className="text-slate-500 pl-11">Advanced machine learning models predicting real-time market value</p>
        </div>
    </div>
);

// Main Page
const PricingToolPage = () => {
    const [formData, setFormData] = useState({
        address: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        condition: 'good'
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(0);
    const [result, setResult] = useState<any>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAnalyze = () => {
        if (!formData.address || !formData.area) return; // Basic validation

        setIsAnalyzing(true);
        setAnalysisStep(0);
        setResult(null);

        // Mock analysis steps
        const steps = [
            "Scanning local comparables...",
            "Analyzing historical price trends...",
            "Evaluating neighborhood amenities...",
            "Calculating final valuation model..."
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (currentStep >= steps.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsAnalyzing(false);
                    // Mock Result
                    const basePrice = parseInt(formData.area) * 350 + (parseInt(formData.bedrooms || '0') * 50000);
                    setResult({
                        estimatedValue: basePrice,
                        lowRange: basePrice * 0.95,
                        highRange: basePrice * 1.08,
                        confidence: 94,
                        sqftPrice: 350,
                        comparablesCount: 142
                    });
                }, 800);
            } else {
                setAnalysisStep(currentStep);
            }
        }, 1500);
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="p-4 md:p-8 pt-6">
                        <div className="max-w-6xl mx-auto pb-12">
                            <DashboardHeader />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Main Form Area */}
                                <div className="lg:col-span-8">
                                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                                        <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50">
                                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                Property Details
                                            </CardTitle>
                                            <CardDescription>Enter as much detail as possible for the most accurate estimate.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {/* Address */}
                                                <div className="space-y-3">
                                                    <Label className="text-slate-700 font-bold">Property Address *</Label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input
                                                            placeholder="123 Main St, City, State, ZIP"
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                                            value={formData.address}
                                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Detail Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-slate-700 font-bold">Property Type</Label>
                                                        <Select value={formData.propertyType} onValueChange={(val) => handleInputChange('propertyType', val)}>
                                                            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                                                                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="house">Single Family House</SelectItem>
                                                                <SelectItem value="apartment">Apartment / Condo</SelectItem>
                                                                <SelectItem value="townhouse">Townhouse</SelectItem>
                                                                <SelectItem value="multi">Multi-Family</SelectItem>
                                                                <SelectItem value="land">Vacant Land</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="text-slate-700 font-bold">Square Feet *</Label>
                                                        <div className="relative">
                                                            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <Input
                                                                type="number"
                                                                placeholder="e.g. 2000"
                                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                                                value={formData.area}
                                                                onChange={(e) => handleInputChange('area', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="text-slate-700 font-bold">Bedrooms</Label>
                                                        <div className="relative">
                                                            <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <Input
                                                                type="number"
                                                                placeholder="e.g. 3"
                                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                                                value={formData.bedrooms}
                                                                onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="text-slate-700 font-bold">Bathrooms</Label>
                                                        <div className="relative">
                                                            <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <Input
                                                                type="number"
                                                                placeholder="e.g. 2"
                                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                                                                value={formData.bathrooms}
                                                                onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                                    <Button
                                                        onClick={handleAnalyze}
                                                        disabled={isAnalyzing || !formData.address || !formData.area}
                                                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all font-bold text-base"
                                                    >
                                                        {isAnalyzing ? (
                                                            <><Activity className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                                        ) : (
                                                            <><Sparkles className="w-5 h-5 mr-2" /> Generate AI Estimate</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Side Panel / Info */}
                                <div className="lg:col-span-4 space-y-6">
                                    {isAnalyzing ? (
                                        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden h-full">
                                            <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center space-y-6">
                                                <div className="relative">
                                                    <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl animate-pulse"></div>
                                                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center relative z-10 shadow-lg animate-bounce">
                                                        <Sparkles className="w-10 h-10 text-white" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-slate-800">Analyzing Property</h3>
                                                    <p className="text-sm font-medium text-slate-500 h-10 animate-pulse">{["Scanning comparables...", "Analyzing historical price trends...", "Evaluating neighborhood amenities...", "Calculating final valuation model..."][analysisStep] || "Processing..."}</p>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${((analysisStep + 1) / 4) * 100}%` }}></div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : result ? (
                                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                            <Card className="rounded-3xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative">
                                                <CardContent className="p-8 relative z-10">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs uppercase tracking-widest">Analysis Complete</Badge>
                                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setResult(null)}><Sparkles className="w-4 h-4" /></Button>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Value</p>
                                                    <h2 className="text-5xl font-black text-white tracking-tight mb-2">
                                                        {result.estimatedValue.toLocaleString()} FCFA
                                                    </h2>
                                                    <p className="text-slate-400 font-medium flex items-center gap-2">
                                                        {result.lowRange.toLocaleString()} FCFA — {result.highRange.toLocaleString()} FCFA Range
                                                    </p>

                                                    <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Confidence Score</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-2xl font-black text-emerald-400">{result.confidence}%</div>
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Comparables Analyzed</p>
                                                            <div className="text-2xl font-black text-white">{result.comparablesCount}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                                                <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50">
                                                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                        <TrendingUp className="w-5 h-5 text-blue-500" /> Market Insights
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-6">
                                                    <div className="space-y-4">
                                                        <div className="flex gap-3">
                                                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 h-fit"><Activity className="w-4 h-4" /></div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">High Demand Area</p>
                                                                <p className="text-xs text-slate-500 leading-snug">Properties in this zip code sell 14% faster than the city average.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 h-fit"><Home className="w-4 h-4" /></div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">Price per SqFt</p>
                                                                <p className="text-xs text-slate-500 leading-snug">At {result.sqftPrice} FCFA/sqft, this property is aligned with the neighborhood median of 345 FCFA/sqft.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ) : (
                                        <Card className="rounded-3xl border-slate-200 shadow-sm bg-indigo-600 text-white overflow-hidden relative opacity-100 transition-opacity">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <Activity className="w-32 h-32" />
                                            </div>
                                            <CardContent className="p-6 relative z-10">
                                                <Sparkles className="w-8 h-8 mb-4 text-purple-200" />
                                                <h3 className="text-xl font-bold mb-2">How it works</h3>
                                                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                                    Our AI analyzes millions of data points including historical sales, real-time market trends, comparable listings, and neighborhood statistics to generate a highly accurate valuation range.
                                                </p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-sm font-medium text-blue-50">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span>100,000+ local comparables</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm font-medium text-blue-50">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span>Neighborhood trend analysis</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm font-medium text-blue-50">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span>Automated outlier detection</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default PricingToolPage;
