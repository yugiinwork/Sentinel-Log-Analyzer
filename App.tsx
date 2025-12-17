import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiveMonitor from './components/LiveMonitor';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import Connectors from './components/Connectors';
import { AnalysisResult } from './types';
import { analyzeLogsWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('live');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center px-6 justify-between shrink-0">
          <h2 className="text-lg font-bold text-white capitalize flex items-center gap-2">
             {currentView === 'live' ? 'Security Operations Center' : 
              currentView === 'forensics' ? 'Digital Forensics Lab' : 
              'Data Ingestion Pipelines'}
          </h2>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-xs font-mono text-slate-400">
                v2.5.0-stable
             </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
           {currentView === 'live' && <LiveMonitor />}
           
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
                 <Dashboard data={analysis} onReset={() => setAnalysis(null)} />
               )}
             </div>
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