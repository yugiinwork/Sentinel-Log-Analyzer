import React, { useState } from 'react';
import { Incident, Severity } from '../types';
import { 
  Briefcase, CheckCircle2, Clock, AlertCircle, Search, Filter, 
  User, Calendar, ArrowRight, MessageSquare, MoreHorizontal, LayoutList 
} from 'lucide-react';

interface IncidentManagerProps {
  incidents: Incident[];
  onUpdateStatus: (id: string, status: Incident['status']) => void;
}

const IncidentManager: React.FC<IncidentManagerProps> = ({ incidents, onUpdateStatus }) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      inc.title.toLowerCase().includes(filter.toLowerCase()) || 
      inc.description.toLowerCase().includes(filter.toLowerCase()) ||
      inc.id.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CLOSED': return 'bg-slate-800 text-slate-500 border-slate-700';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const stats = {
    open: incidents.filter(i => i.status === 'OPEN').length,
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length,
    critical: incidents.filter(i => i.severity === Severity.CRITICAL && i.status !== 'CLOSED').length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Open Cases" value={stats.open} icon={<AlertCircle size={20} className="text-red-500" />} />
        <StatCard label="In Investigation" value={stats.inProgress} icon={<Clock size={20} className="text-blue-500" />} />
        <StatCard label="Resolved / Closed" value={stats.resolved} icon={<CheckCircle2 size={20} className="text-emerald-500" />} />
        <StatCard label="Active Critical" value={stats.critical} icon={<Briefcase size={20} className="text-orange-500" />} highlight={stats.critical > 0} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
           <LayoutList size={20} className="text-blue-500" /> Case Management
        </h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search incidents (ID, Title)..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-1">
             {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    statusFilter === status 
                    ? 'bg-slate-800 text-white shadow' 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
             ))}
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
           <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
              <Briefcase size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-medium">No incidents found matching filters</h3>
           </div>
        ) : (
          filteredIncidents.map(incident => (
            <div key={incident.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                
                {/* Left: Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700`}>
                      {incident.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                       incident.severity === Severity.CRITICAL ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                       incident.severity === Severity.HIGH ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                       'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                       {incident.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(incident.status)}`}>
                       {incident.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {incident.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {incident.timestamp}</span>
                    <span className="flex items-center gap-1"><AlertCircle size={12}/> Source: {incident.source}</span>
                    <span className="flex items-center gap-1"><User size={12}/> Assigned: {incident.assignee}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-end justify-between border-l border-slate-800 pl-4 min-w-[140px]">
                   <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                         <MessageSquare size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                         <MoreHorizontal size={16} />
                      </button>
                   </div>

                   <div className="w-full space-y-2">
                      {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                        <button 
                          onClick={() => onUpdateStatus(incident.id, 'RESOLVED')}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          <CheckCircle2 size={14} /> Resolve Case
                        </button>
                      )}
                      
                      {incident.status === 'OPEN' && (
                        <button 
                          onClick={() => onUpdateStatus(incident.id, 'IN_PROGRESS')}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ArrowRight size={14} /> Investigate
                        </button>
                      )}
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
  <div className={`bg-slate-900 border rounded-xl p-4 flex items-center justify-between shadow-lg transition-all
    ${highlight ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800'}
  `}>
    <div>
       <p className="text-slate-500 text-xs font-semibold uppercase mb-1">{label}</p>
       <span className="text-2xl font-bold text-slate-100">{value}</span>
    </div>
    <div className={`p-3 rounded-lg ${highlight ? 'bg-red-500/10' : 'bg-slate-800'}`}>
      {icon}
    </div>
  </div>
);

export default IncidentManager;