'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
     Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Activity,
     Download, Clock, CheckCircle2, Building2, Smartphone,
     ArrowRight, Landmark, CreditCard, HeartHandshake, FileText, TrendingUp
 } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data
const revenueData = [
    { name: 'Sep', amount: 1200000 },
    { name: 'Oct', amount: 850000 },
    { name: 'Nov', amount: 2100000 },
    { name: 'Dec', amount: 1600000 },
    { name: 'Jan', amount: 1950000 },
    { name: 'Feb', amount: 2400000 },
];

const transactions = [
    { id: 'TRX-8942', date: 'Feb 26, 2026', property: 'Villa Océane, Assinie', type: 'Sale Commission', amount: 1250000, status: 'completed' },
    { id: 'TRX-8941', date: 'Feb 24, 2026', property: 'Plateau Business Center', type: 'Rental Commission', amount: 450000, status: 'pending' },
    { id: 'TRX-8938', date: 'Feb 18, 2026', property: 'Cocody Riviera 3 Duplex', type: 'Sale Commission', amount: 850000, status: 'completed' },
    { id: 'TRX-8935', date: 'Feb 12, 2026', property: 'Marcory Zone 4 Apt', type: 'Rental Commission', amount: 300000, status: 'completed' },
    { id: 'TRX-8929', date: 'Feb 05, 2026', property: 'Withdrawal to Bank', type: 'Payout', amount: -2000000, status: 'completed' },
];

// --- Sub-Components ---

const DashboardHeader = () => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-xl bg-slate-900 text-white shadow-sm">
                    <Wallet className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Earnings & Payouts</h1>
                </div>
            </div>
            <p className="text-slate-500 pl-11">Track your revenue, commissions, and upcoming transfer payments.</p>
        </div>

        <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold h-11 px-4">
                <Download className="w-4 h-4 mr-2" />
                Export Statement
            </Button>
        </div>
    </div>
);

// Sub components
const KPICard = ({ title, amount, subtext, icon: Icon, colorClass, isCurrency = true }: any) => {
    const variants: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    return (
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
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
                        {!isCurrency && <span className="text-base font-bold text-slate-400">%</span>}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
                        {subtext}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

// Main Page
const EarningsPage = () => {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="p-4 md:p-8 pt-6">
                        <div className="max-w-6xl mx-auto pb-12">
                            <DashboardHeader />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <KPICard
                                    title="Available Balance"
                                    amount={1250000}
                                    subtext={<><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Ready to withdraw</>}
                                    icon={Wallet}
                                    colorClass="emerald"
                                />
                                <KPICard
                                    title="Total Earnings"
                                    amount={8450000}
                                    subtext={<><ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> +14% from last month</>}
                                    icon={Landmark}
                                    colorClass="blue"
                                />
                                <KPICard
                                    title="Pending Payouts"
                                    amount={450000}
                                    subtext={<><Clock className="w-3.5 h-3.5 text-amber-500" /> Clearing in 2-3 days</>}
                                    icon={Activity}
                                    colorClass="amber"
                                />
                                <KPICard
                                    title="Avg. Commission"
                                    amount={2.8}
                                    subtext={<><TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Across 12 properties</>}
                                    icon={HeartHandshake}
                                    colorClass="indigo"
                                    isCurrency={false}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Revenue Chart */}
                                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden lg:col-span-2">
                                    <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-800">Revenue Overview</CardTitle>
                                            <CardDescription>Last 6 months performance</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">6 Months</Badge>
                                            <Badge variant="outline" className="text-slate-500 hover:bg-slate-50 cursor-pointer">1 Year</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                        formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenue']}
                                                    />
                                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Request Payout */}
                                <Card className="rounded-3xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-6 opacity-10 transition-transform duration-500 group-hover:scale-110">
                                        <Landmark className="w-40 h-40" />
                                    </div>
                                    <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-6 shadow-lg">
                                                <ArrowUpRight className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">Request Payout</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                                Withdraw your available balance securely to your linked bank account or mobile money wallet.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-slate-800/80 rounded-2xl p-4 flex items-center justify-between border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-700 rounded-lg"><Building2 className="w-4 h-4 text-blue-400" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">Ecobank</p>
                                                        <p className="text-xs text-slate-400">**** 4589</p>
                                                    </div>
                                                </div>
                                                <div className="w-4 h-4 rounded-full border-4 border-blue-500 bg-white"></div>
                                            </div>

                                            <div className="bg-slate-800/40 rounded-2xl p-4 flex items-center justify-between border border-slate-700/50 cursor-pointer hover:bg-slate-800/60 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-700/50 rounded-lg"><Smartphone className="w-4 h-4 text-orange-400" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-300">Orange Money</p>
                                                        <p className="text-xs text-slate-500">+225 ** ** ** 45</p>
                                                    </div>
                                                </div>
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
                                            </div>

                                            <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold mt-4 shadow-md transition-all">
                                                Withdraw 1,250,000 FCFA
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Transactions */}
                            <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="border-b border-slate-50 pb-4 pt-6 px-6 bg-slate-50/50 flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg font-bold text-slate-800">Recent Transactions</CardTitle>
                                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold h-9 px-3">
                                        View All
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transactions.map((t) => (
                                                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <span className="text-sm font-semibold text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-md">{t.id}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-500 font-medium whitespace-nowrap">{t.date}</td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm font-bold text-slate-800">{t.property}</p>
                                                        <p className="text-xs text-slate-500">{t.type}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {t.status === 'completed' ? (
                                                            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-2.5 py-1">Completed</Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none px-2.5 py-1">Pending</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className={`text-sm font-black flex items-center justify-end gap-1 ${t.amount > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase">FCFA</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default EarningsPage;
