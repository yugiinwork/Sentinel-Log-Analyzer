import React, { useState } from 'react';
import { LogEvent, Severity } from '../types';
import { AlertTriangle, Shield, Info, AlertOctagon, ChevronDown, Search } from 'lucide-react';

interface LogTableProps {
  events: LogEvent[];
}

const LogTable: React.FC<LogTableProps> = ({ events }) => {
  const [filter, setFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.message.toLowerCase().includes(filter.toLowerCase()) ||
      event.source.toLowerCase().includes(filter.toLowerCase()) ||
      event.type.toLowerCase().includes(filter.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || event.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL:
        return <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold border border-red-500/20"><AlertOctagon size={12}/> CRITICAL</span>;
      case Severity.HIGH:
        return <span className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded text-xs font-bold border border-orange-500/20"><AlertTriangle size={12}/> HIGH</span>;
      case Severity.MEDIUM:
        return <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-xs font-bold border border-amber-400/20"><Shield size={12}/> MEDIUM</span>;
      case Severity.LOW:
        return <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded text-xs font-bold border border-blue-400/20"><Info size={12}/> LOW</span>;
      default:
        return <span className="text-slate-400 text-xs">{severity}</span>;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-100">Detailed Event Log</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search IPs, messages..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-emerald-500 outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950 text-slate-200 font-medium uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 w-1/3">Message & Remediation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSeverityBadge(event.severity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-300">
                    {event.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-300">
                    {event.source}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-200 line-clamp-2">{event.message}</p>
                      {event.severity !== Severity.LOW && (
                         <p className="text-emerald-500/80 text-xs flex items-center gap-1 mt-1">
                           <Shield size={10} /> Remediation: {event.remediation}
                         </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No events found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogTable;