import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Bookmark, Heart, TrendingUp } from 'lucide-react';

const SingleBarChart = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

  const rawSeries: (number | string)[][] = [
    [120, 200, 150, 80, 70, 110, 130],
    [10, 46, 64, '-', 0, '-', 0],
    [30, '-', 0, 20, 10, '-', 0],
    [30, '-', 0, 20, 10, '-', 0],
    [10, 20, 150, 0, '-', 50, 10]
  ];

  const getChartData = () => {
    let labels: any = [];
    let data = [];
    const now = new Date();

    if (period === 'day') {
      labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
      data = labels.map(() => Math.floor(Math.random() * 100));
    } else if (period === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = labels.map((_, i) =>
        rawSeries.reduce((sum, series) => {
          const val = series[i];
          return sum + (typeof val === 'number' ? val : 0);
        }, 0)
      );
    } else if (period === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      data = labels.map(() => Math.floor(Math.random() * 200));
    } else if (period === 'year') {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = labels.map(() => Math.floor(Math.random() * 1000));
    }

    const maxValue = Math.max(...data);
    const seriesData = data.map(value => ({
      value,
      itemStyle: {
        borderRadius: [100, 100, 100, 100],
        color: value === maxValue ? '#3B82F6' : '#DBEAFE'
      }
    }));

    return { labels, seriesData };
  };

  const { labels, seriesData } = getChartData();

  const option = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      padding: [8, 12]
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: 500
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    series: [{
      type: 'bar',
      data: seriesData,
      barWidth: '50%'
    }],
    grid: {
      left: '3%',
      right: '3%',
      bottom: '8%',
      top: '5%',
      containLabel: true
    }
  };

  const stats = { saved: 40, liked: 16 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
          </div>
          <p className="text-slate-500 ml-11">Track your engagement and activity metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Total Saved</p>
                <p className="text-4xl font-bold text-slate-800">{stats.saved}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <Bookmark className="w-7 h-7 text-blue-600" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Total Liked</p>
                <p className="text-4xl font-bold text-slate-800">{stats.liked}</p>
              </div>
              <div className="bg-pink-100 p-4 rounded-xl">
                <Heart className="w-7 h-7 text-pink-600" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">Activity Overview</h2>
            
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['day', 'week', 'month', 'year'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    period === p
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ReactECharts option={option} style={{ height: '380px', width: '100%' }} />
        </div>

      </div>
    </div>
  );
};

export default SingleBarChart;