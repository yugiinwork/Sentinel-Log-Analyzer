import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { analyzeLogsWithGemini } from './services/geminiService';
import { AnalysisResult } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (content: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeLogsWithGemini(content);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetAnalysis}>
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <Shield className="text-emerald-500" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sentinel <span className="text-slate-500 font-medium hidden sm:inline">| Security Log Analyzer</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-xs text-slate-500 hidden sm:block">Powered by Gemini 2.5 Flash</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Shield className="text-red-500" size={20} />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-xs hover:underline opacity-80">Dismiss</button>
          </div>
        )}

        {!analysis ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Intelligent Threat Detection
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Upload your server logs, firewall traces, or application events. 
                Our AI engine parses thousands of lines instantly to identify vulnerabilities, brute force attacks, and anomalies.
              </p>
            </div>
            <FileUpload onAnalyze={handleAnalyze} isAnalyzing={loading} />
          </div>
        ) : (
          <Dashboard data={analysis} onReset={resetAnalysis} />
        )}

      </main>
    </div>
  );
};

export default App;