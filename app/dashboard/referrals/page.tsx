'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Network, Users, ArrowUpRight, Copy, CheckCircle2,
    Share2, Award, Landmark, Building2, TrendingUp, Info, Activity
} from 'lucide-react';

// Mock Data
const networkData = [
    { id: '1', name: 'Kouakou Jean', date: 'Feb 12, 2026', status: 'Active', bonus: 150000, deals: 2 },
    { id: '2', name: 'Aminata Touré', date: 'Feb 05, 2026', status: 'Pending', bonus: 0, deals: 0 },
    { id: '3', name: 'Soro G. Marc', date: 'Jan 28, 2026', status: 'Active', bonus: 450000, deals: 3 },
    { id: '4', name: 'Diarra Fatou', date: 'Jan 15, 2026', status: 'Active', bonus: 210000, deals: 1 },
    { id: '5', name: 'Bamba Ali', date: 'Dec 10, 2025', status: 'Inactive', bonus: 0, deals: 0 },
];

const DashboardHeader = () => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-xl bg-slate-900 text-white -sm">
                    <Network className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Referral Network</h1>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-2 py-0.5 font-bold uppercase tracking-widest text-[10px]">
                        Beta Program
                    </Badge>
                </div>
            </div>
            <p className="text-slate-500 pl-11">Invite agents, grow your network, and earn passive bonuses on their sales.</p>
        </div>

        <div className="flex items-center gap-3">
            <Button variant="default" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 -sm">
                <Share2 className="w-4 h-4 mr-2" />
                Invite Agent
            </Button>
        </div>
    </div>
);

const KPICard = ({ title, amount, subtext, icon: Icon, colorClass, isCurrency = false }: any) => {
    const variants: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
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

const ReferralsPage = () => {
    const [copied, setCopied] = useState(false);
    const referralLink = "https://horohouse.com/join/ref-ax89b2";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                                {/* Referral Link Card */}
                                <div className="lg:col-span-12">
                                    <Card className="rounded-3xl border-slate-200 -sm bg-slate-900 text-white overflow-hidden relative">
                                        <div className="absolute right-0 top-0 w-64 h-full bg-blue-600 transform skew-x-12 translate-x-16 opacity-20"></div>
                                        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-full bg-blue-500/20 text-blue-400">
                                                    <Award className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold mb-1">Your Personal Invitation Link</h2>
                                                    <p className="text-slate-400 text-sm">Share this link with other agents. You earn 5% of their first 3 sales commissions.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center w-full md:w-auto gap-2 bg-slate-800 rounded-2xl p-2 border border-slate-700/50">
                                                <code className="px-4 py-2 text-blue-300 font-mono text-sm w-full md:w-64 truncate">
                                                    {referralLink}
                                                </code>
                                                <Button
                                                    onClick={handleCopy}
                                                    className={`rounded-xl h-10 px-4 shrink-0 transition-all font-bold ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                >
                                                    {copied ? (
                                                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Copied</>
                                                    ) : (
                                                        <><Copy className="w-4 h-4 mr-2" /> Copy Link</>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <KPICard
                                    title="Invites Sent"
                                    amount={24}
                                    subtext={<><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> +3 this month</>}
                                    icon={Share2}
                                    colorClass="blue"
                                />
                                <KPICard
                                    title="Active Network"
                                    amount={8}
                                    subtext={<><Users className="w-3.5 h-3.5 text-emerald-500" /> Agents closing deals</>}
                                    icon={Users}
                                    colorClass="emerald"
                                />
                                <KPICard
                                    title="Total Bonus Earned"
                                    amount={1850000}
                                    subtext={<><ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" /> +450k pending</>}
                                    icon={Landmark}
                                    colorClass="indigo"
                                    isCurrency={true}
                                />
                                <KPICard
                                    title="Conversion Rate"
                                    amount={33.3}
                                    subtext={<><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> Above average</>}
                                    icon={Activity}
                                    colorClass="purple"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Network Table */}
                                <div className="lg:col-span-8">
                                    <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden h-full">
                                        <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50 flex flex-row items-center justify-between">
                                            <CardTitle className="text-lg font-bold text-slate-800">Network Activity</CardTitle>
                                        </CardHeader>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Agent</th>
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Bonuses</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {networkData.map((agent) => (
                                                        <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                                        {agent.name.substring(0, 2)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                                                                        <p className="text-xs text-slate-500">{agent.deals} sales</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-sm text-slate-500 font-medium">{agent.date}</td>
                                                            <td className="py-4 px-6">
                                                                {agent.status === 'Active' && <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-2 py-0.5">Active</Badge>}
                                                                {agent.status === 'Pending' && <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none px-2 py-0.5">Pending Action</Badge>}
                                                                {agent.status === 'Inactive' && <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2 py-0.5">Inactive</Badge>}
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <div className={`text-sm font-black flex items-center justify-end gap-1 ${agent.bonus > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                                                                    {agent.bonus > 0 ? agent.bonus.toLocaleString() : '-'}
                                                                    {agent.bonus > 0 && <span className="text-xs font-bold text-slate-400 uppercase">FCFA</span>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>

                                {/* Information Panel */}
                                <div className="lg:col-span-4">
                                    <Card className="rounded-3xl border-slate-200 -sm bg-white overflow-hidden">
                                        <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50">
                                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Info className="w-5 h-5 text-blue-500" /> How it Works
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                                                <div className="relative flex items-start">
                                                    <div className="bg-blue-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white -sm z-10">1</div>
                                                    <div className="ml-4 pb-6 w-full">
                                                        <h4 className="text-sm font-bold text-slate-800 mb-1">Invite Agents</h4>
                                                        <p className="text-xs text-slate-500">Share your unique personal link.</p>
                                                    </div>
                                                </div>
                                                <div className="relative flex items-start">
                                                    <div className="bg-blue-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white -sm z-10">2</div>
                                                    <div className="ml-4 pb-6 w-full">
                                                        <h4 className="text-sm font-bold text-slate-800 mb-1">They Close Deals</h4>
                                                        <p className="text-xs text-slate-500">Your referred agents use the platform to close property deals.</p>
                                                    </div>
                                                </div>
                                                <div className="relative flex items-start">
                                                    <div className="bg-emerald-500 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white -sm z-10">3</div>
                                                    <div className="ml-4 w-full">
                                                        <h4 className="text-sm font-bold text-slate-800 mb-1">You Earn 5%</h4>
                                                        <p className="text-xs text-slate-500">You automatically receive 5% of their commission for their first 3 sales.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default ReferralsPage;
