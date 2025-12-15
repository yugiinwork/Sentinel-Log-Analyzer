import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { AnalysisResult, Severity } from '../types';

interface ChartsProps {
  data: AnalysisResult;
}

const COLORS = {
  LOW: '#3B82F6',      // Blue
  MEDIUM: '#F59E0B',   // Amber
  HIGH: '#EF4444',     // Red
  CRITICAL: '#7F1D1D'  // Dark Red
};

const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="font-semibold text-slate-200 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const TimelineChart: React.FC<{ data: AnalysisResult['timelineData'] }> = ({ data }) => {
  return (
    <div className="h-[300px] w-full">
      <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Event Volume Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="time" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="Events"
            stroke="#10B981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AttackDistributionChart: React.FC<{ data: AnalysisResult['topAttackTypes'] }> = ({ data }) => {
  return (
    <div className="h-[300px] w-full">
      <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Top Detected Events</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#94a3b8" 
            fontSize={11} 
            width={100}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
          <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SeverityChart: React.FC<{ events: AnalysisResult['events'] }> = ({ events }) => {
  const severityCounts = events.reduce((acc, curr) => {
    acc[curr.severity] = (acc[curr.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.keys(Severity).map(key => ({
    name: key,
    value: severityCounts[key as any] || 0
  })).filter(d => d.value > 0);

  return (
    <div className="h-[300px] w-full">
      <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Severity Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};