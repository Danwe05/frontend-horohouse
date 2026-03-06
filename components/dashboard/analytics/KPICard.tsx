import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { KPICardProps } from '@/app/dashboard/analytics/types';

export const KPICard = ({ title, value, change, trend, icon: Icon, loading }: KPICardProps) => (
    <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <h3 className="text-3xl font-bold mt-2 text-gray-900">{value}</h3>
                        {change !== undefined && change !== null && (
                            <div className="flex items-center mt-2">
                                {trend === 'up' ? (
                                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                ) : trend === 'down' ? (
                                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                ) : null}
                                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                    {change > 0 ? '+' : ''}{change}%
                                </span>
                                <span className="text-xs text-gray-500 ml-1">vs last period</span>
                            </div>
                        )}
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
);
