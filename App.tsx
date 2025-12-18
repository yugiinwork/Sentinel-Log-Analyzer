import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiveMonitor from './components/LiveMonitor';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import Connectors from './components/Connectors';
import IncidentManager from './components/IncidentManager';
import { AnalysisResult, Incident, Severity } from './types';
import { analyzeLogsWithGemini } from './services/geminiService';

const SAMPLE_INCIDENTS: Incident[] = [
  {
    id: 'INC-2023-089',
    title: 'Data Exfiltration via DNS Tunneling',
    severity: Severity.HIGH,
    status: 'IN_PROGRESS',
    assignee: 'Analyst_01',
    timestamp: '2023-10-27 09:42:15',
    source: 'Live Monitor',
    description: 'Anomalous volume of TXT record queries to unknown domain "xyz-cdn.com". Potential C2 channel detected.',
    notes: ['Initial triage complete.', 'Firewall rules updated to block domain.']
  },
  {
    id: 'INC-2023-088',
    title: 'Brute Force Attack on SSH Gateway',
    severity: Severity.CRITICAL,
    status: 'OPEN',
    assignee: 'Unassigned',
    timestamp: '2023-10-27 08:15:22',
    source: 'Log Analysis',
    description: '450 failed login attempts detected from IP 45.33.22.11 within 5 minutes. Root account targeted.',
    notes: []
  },
  {
    id: 'INC-2023-085',
    title: 'Suspicious PowerShell Execution',
    severity: Severity.MEDIUM,
    status: 'RESOLVED',
    assignee: 'Analyst_03',
    timestamp: '2023-10-26 14:20:00',
    source: 'Endpoint Agent',
    description: 'Encoded PowerShell command executed on HR-WORKSTATION-04. Determined to be legitimate admin activity after review.',
    notes: ['False positive confirmed by IT admin.']
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('live');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Global Incident State
  const [incidents, setIncidents] = useState<Incident[]>(SAMPLE_INCIDENTS);

  const handleAnalyze = async (content: string, privacyMode: boolean) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeLogsWithGemini(content, privacyMode);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateIncident = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const handleUpdateIncidentStatus = (id: string, status: Incident['status']) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status } : inc
    ));
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} incidentCount={incidents.filter(i => i.status === 'OPEN').length} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center px-6 justify-between shrink-0">
          <h2 className="text-lg font-bold text-white capitalize flex items-center gap-2">
             {currentView === 'live' ? 'Security Operations Center' : 
              currentView === 'forensics' ? 'Digital Forensics Lab' : 
              currentView === 'incidents' ? 'Incident Response' :
              'Data Ingestion Pipelines'}
          </h2>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-xs font-mono text-slate-400">
                v2.6.0-enterprise
             </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
           {currentView === 'live' && (
             <LiveMonitor onCreateIncident={handleCreateIncident} />
           )}
           
           {currentView === 'forensics' && (
             <div className="animate-in fade-in duration-300">
               {!analysis ? (
                 <div className="max-w-4xl mx-auto mt-8">
                    <div className="mb-8 p-6 bg-slate-900 rounded-xl border border-slate-800">
                       <h1 className="text-2xl font-bold text-white mb-2">Log Analysis Engine</h1>
                       <p className="text-slate-400 text-sm">Upload raw server logs, firewall traces, or application events. Sentinel's AI will parse, categorize, and identify threats implicitly.</p>
                    </div>
                    {error && <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg mb-6 text-sm">{error}</div>}
                    <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                 </div>
               ) : (
                 <Dashboard 
                    data={analysis} 
                    onReset={() => setAnalysis(null)} 
                    onCreateIncident={handleCreateIncident}
                 />
               )}
             </div>
           )}

           {currentView === 'incidents' && (
              <IncidentManager incidents={incidents} onUpdateStatus={handleUpdateIncidentStatus} />
           )}

           {currentView === 'connectors' && (
             <div className="animate-in fade-in duration-300">
                <Connectors />
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;