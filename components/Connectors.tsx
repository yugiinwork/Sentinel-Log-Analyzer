import React, { useState } from 'react';
import { Cloud, Database, Globe, CheckCircle2, Plus, Loader2, XCircle, RefreshCw } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'aws' | 'azure' | 'splunk' | 'gcp' | 'generic';
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastSync: string;
  description: string;
}

const Connectors: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: 'aws-1',
      name: 'AWS CloudWatch',
      type: 'aws',
      icon: <Cloud className="text-orange-400" size={24} />,
      status: 'connected',
      lastSync: '2 mins ago',
      description: 'Ingest VPC Flow Logs and CloudTrail events.'
    },
    {
      id: 'azure-1',
      name: 'Azure Sentinel',
      type: 'azure',
      icon: <Globe className="text-blue-400" size={24} />,
      status: 'disconnected',
      lastSync: '-',
      description: 'Stream security events from Azure Monitor.'
    },
    {
      id: 'splunk-1',
      name: 'Splunk HEC',
      type: 'splunk',
      icon: <Database className="text-emerald-400" size={24} />,
      status: 'disconnected',
      lastSync: '-',
      description: 'Direct HTTP Event Collector integration.'
    }
  ]);

  const [isAdding, setIsAdding] = useState(false);

  const toggleConnection = (id: string) => {
    setSources(prev => prev.map(source => {
      if (source.id !== id) return source;

      if (source.status === 'connected') {
        return { ...source, status: 'disconnected', lastSync: '-' };
      }

      // Simulate connection process
      return { ...source, status: 'connecting' };
    }));

    // Async effect for connection
    setTimeout(() => {
      setSources(prev => prev.map(source => {
        if (source.id === id && source.status === 'connecting') {
          return { 
            ...source, 
            status: 'connected', 
            lastSync: 'Just now' 
          };
        }
        return source;
      }));
    }, 2000);
  };

  const handleAddSource = () => {
    setIsAdding(true);
    // Simulate adding a new source after delay
    setTimeout(() => {
      const newSource: DataSource = {
        id: `gcp-${Date.now()}`,
        name: 'Google Cloud Logging',
        type: 'gcp',
        icon: <Cloud className="text-blue-500" size={24} />,
        status: 'disconnected',
        lastSync: '-',
        description: 'Aggregate logs from GCP Stackdriver.'
      };
      setSources(prev => [...prev, newSource]);
      setIsAdding(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-white">Data Integrations</h2>
           <p className="text-sm text-slate-400">Manage scalable log ingestion pipelines from cloud providers.</p>
        </div>
        <button 
          onClick={handleAddSource}
          disabled={isAdding}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
        >
            {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isAdding ? 'Adding...' : 'Add Source'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div key={source.id} className={`bg-slate-900 border rounded-xl p-6 relative group transition-all duration-300 ${source.status === 'connected' ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-slate-800 hover:border-slate-700'}`}>
            <div className="flex justify-between items-start mb-4">
               <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                 {source.icon}
               </div>
               <div className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1 transition-all ${
                 source.status === 'connected' 
                 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                 : source.status === 'connecting'
                 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                 : 'bg-slate-800 text-slate-500 border-slate-700'
               }`}>
                  {source.status === 'connected' && <CheckCircle2 size={10} />}
                  {source.status === 'connecting' && <Loader2 size={10} className="animate-spin" />}
                  {source.status === 'disconnected' && <XCircle size={10} />}
                  {source.status.toUpperCase()}
               </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{source.name}</h3>
            <p className="text-sm text-slate-400 mb-6 min-h-[40px] leading-relaxed">{source.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
               <span className="text-xs text-slate-500 flex items-center gap-1">
                 {source.status === 'connected' && <RefreshCw size={10} className="text-emerald-500" />}
                 Sync: {source.lastSync}
               </span>
               <button 
                 onClick={() => toggleConnection(source.id)}
                 disabled={source.status === 'connecting'}
                 className={`text-sm font-medium transition-colors ${
                    source.status === 'connected' 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-emerald-400 hover:text-emerald-300'
                 }`}
               >
                  {source.status === 'connected' ? 'Disconnect' : source.status === 'connecting' ? 'Connecting...' : 'Connect'}
               </button>
            </div>
          </div>
        ))}
        
        {/* 'New' Placeholder */}
        <div 
          onClick={handleAddSource}
          className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group h-full min-h-[220px]"
        >
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 text-slate-600 group-hover:text-emerald-400 transition-colors border border-slate-800 group-hover:border-emerald-500/50">
                <Plus size={24} />
            </div>
            <h3 className="text-slate-300 font-medium group-hover:text-white transition-colors">Connect New Source</h3>
            <p className="text-xs text-slate-500 mt-1">Syslog, Kafka, or REST API</p>
        </div>
      </div>
    </div>
  );
};

export default Connectors;