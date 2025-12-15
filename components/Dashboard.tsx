import React, { useState } from 'react';
import { AnalysisResult, Severity } from '../types';
import { TimelineChart, AttackDistributionChart, SeverityChart } from './Charts';
import LogTable from './LogTable';
import LiveMonitor from './LiveMonitor';
import { ShieldAlert, ShieldCheck, Activity, Terminal, Radio } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'live'>('report');

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 50) return "text-orange-500";
    if (score >= 20) return "text-amber-400";
    return "text-emerald-400";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return "CRITICAL RISK";
    if (score >= 50) return "HIGH RISK";
    if (score >= 20) return "MEDIUM RISK";
    return "LOW RISK";
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Top Controls */}
      <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
        <div className="flex gap-2">
            <button
                onClick={() => setActiveTab('report')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'report' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                Analysis Report
            </button>
            <button
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Radio size={16} className={activeTab === 'live' ? 'animate-pulse' : ''} />
                Live Monitor
            </button>
        </div>
        <button 
          onClick={onReset}
          className="text-slate-400 hover:text-white transition-colors text-sm px-4"
        >
          New Upload
        </button>
      </div>

      {activeTab === 'live' ? (
        <LiveMonitor />
      ) : (
        <>
            {/* Header Summary */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Risk Score Card */}
                <div className="flex-none lg:w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <ShieldAlert size={120} />
                </div>
                <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Security Posture</h2>
                <div className="flex items-end gap-4">
                    <span className={`text-6xl font-bold ${getRiskColor(data.riskScore)}`}>
                    {data.riskScore}
                    </span>
                    <div className="flex flex-col mb-2">
                    <span className={`text-xl font-bold ${getRiskColor(data.riskScore)}`}>
                        / 100
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 ${getRiskColor(data.riskScore)}`}>
                        {getRiskLabel(data.riskScore)}
                    </span>
                    </div>
                </div>
                <p className="mt-4 text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
                    {data.summary}
                </p>
                </div>

                {/* Quick Stats */}
                <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard 
                    label="Total Events" 
                    value={data.events.length} 
                    icon={<Activity size={20} className="text-blue-400"/>} 
                />
                <StatCard 
                    label="Critical Threats" 
                    value={data.events.filter(e => e.severity === Severity.CRITICAL).length} 
                    icon={<ShieldAlert size={20} className="text-red-500"/>} 
                    highlight={data.events.filter(e => e.severity === Severity.CRITICAL).length > 0}
                />
                <StatCard 
                    label="Unique Sources" 
                    value={new Set(data.events.map(e => e.source)).size} 
                    icon={<Terminal size={20} className="text-amber-400"/>} 
                />
                <StatCard 
                    label="Clean Events" 
                    value={data.events.filter(e => e.severity === Severity.LOW).length} 
                    icon={<ShieldCheck size={20} className="text-emerald-400"/>} 
                />
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg lg:col-span-2">
                <TimelineChart data={data.timelineData} />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <SeverityChart events={data.events} />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <AttackDistributionChart data={data.topAttackTypes} />
            </div>

            {/* Detailed Table */}
            <LogTable events={data.events} />
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
  <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between shadow-lg transition-all
    ${highlight ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 hover:border-slate-700'}
  `}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-slate-500 text-xs font-semibold uppercase">{label}</span>
      {icon}
    </div>
    <span className="text-2xl font-bold text-slate-100">{value}</span>
  </div>
);

export default Dashboard;