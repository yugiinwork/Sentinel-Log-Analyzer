import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Severity, AlertNotification, PlaybookResponse } from '../types';
import { generatePlaybook } from '../services/geminiService';
import PlaybookPanel from './PlaybookPanel';
import { 
  AlertTriangle, Shield, X, Terminal, Wifi, Power, 
  WifiOff, Activity, Zap, BarChart3, Search, ArrowRightCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface TrafficPoint {
  time: string;
  eps: number; // Events Per Second
}

interface ExtendedAlert extends AlertNotification {
  escalated?: boolean;
}

const LiveMonitor: React.FC = () => {
  const [wsUrl, setWsUrl] = useState('ws://localhost:8080');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<ExtendedAlert[]>([]);
  
  // Stats
  const [packetCount, setPacketCount] = useState(0);
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const packetCountRef = useRef(0);
  const lastPacketCountRef = useRef(0);
  
  // Playbook State
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [currentPlaybook, setCurrentPlaybook] = useState<PlaybookResponse | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize Traffic Chart Data
  useEffect(() => {
    const initialData = Array(20).fill(0).map((_, i) => ({
      time: new Date(Date.now() - (20 - i) * 1000).toLocaleTimeString(),
      eps: 0
    }));
    setTrafficData(initialData);

    // Traffic Monitor Interval
    const trafficInterval = setInterval(() => {
      const currentPackets = packetCountRef.current;
      const eps = currentPackets - lastPacketCountRef.current;
      lastPacketCountRef.current = currentPackets;

      setTrafficData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString(),
          eps: eps
        }];
        return newData;
      });
    }, 1000);

    // Auto-connect on mount
    initConnection(wsUrl);

    return () => {
        clearInterval(trafficInterval);
        if (ws.current) ws.current.close();
    };
  }, []);
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleRemediate = async (alert: ExtendedAlert) => {
    setIsPlaybookOpen(true);
    setPlaybookLoading(true);
    setCurrentPlaybook(null);
    try {
        const pseudoEvent = {
            timestamp: alert.timestamp,
            severity: alert.severity,
            type: 'LIVE_THREAT',
            source: 'Live Monitor',
            message: alert.message,
            remediation: 'Pending Analysis'
        };
        const playbook = await generatePlaybook(pseudoEvent);
        setCurrentPlaybook(playbook);
    } catch (err) {
        console.error("Failed to generate playbook", err);
    } finally {
        setPlaybookLoading(false);
    }
  };

  const handleEscalate = (id: string) => {
      setAlerts(prev => prev.map(alert => 
          alert.id === id ? { ...alert, escalated: true } : alert
      ));
  };

  const initConnection = (url: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    setStatus('connecting');
    setErrorMessage('');
    
    try {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        setLogs(prev => [...prev, `[SYSTEM] Connected to Sentinel Sensor at ${url}`]);
      };

      socket.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };

      socket.onerror = () => {
        setStatus('error');
        setErrorMessage(`Sensor unreachable. Ensure 'node server.js' is running with sudo.`);
      };

      socket.onclose = () => {
        if (status !== 'error') setStatus('disconnected');
      };
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setStatus('disconnected');
  };

  const handleIncomingMessage = useCallback((data: any) => {
    setPacketCount(prev => prev + 1);
    packetCountRef.current += 1;
    
    let logMessage = typeof data === 'string' ? data : JSON.stringify(data);
    const timestamp = new Date().toLocaleTimeString();
    
    // Ensure timestamp format
    if(!logMessage.startsWith('[')) {
        logMessage = `[${timestamp}] ${logMessage}`;
    }

    setLogs(prev => [...prev.slice(-99), logMessage]);
    analyzeLogForThreats(logMessage, timestamp);
  }, []);

  const analyzeLogForThreats = (message: string, timestamp: string) => {
    if (!message) return;
    const lowerMsg = message.toLowerCase();
    
    let severity: Severity | null = null;
    let threatLabel = '';

    // Analysis Logic
    if (lowerMsg.includes('critical') || lowerMsg.includes('malware') || lowerMsg.includes('botnet')) {
      severity = Severity.CRITICAL;
      threatLabel = 'MALWARE DETECTED';
    } else if (lowerMsg.includes('injection') || lowerMsg.includes('attack') || lowerMsg.includes('exploit')) {
      severity = Severity.CRITICAL;
      threatLabel = 'EXPLOIT ATTEMPT';
    } else if (lowerMsg.includes('block') || lowerMsg.includes('denied') || lowerMsg.includes('failure')) {
      severity = Severity.HIGH;
      threatLabel = 'ACCESS DENIED';
    } else if (lowerMsg.includes('warn') || lowerMsg.includes('alert') || lowerMsg.includes('high')) {
      severity = Severity.MEDIUM;
      threatLabel = 'SUSPICIOUS ACTIVITY';
    }

    if (severity) {
      addAlert(message, severity, timestamp, threatLabel);
    }
  };

  const addAlert = (message: string, severity: Severity, timestamp: string, label: string) => {
    // Avoid duplicate floods
    setAlerts(prev => {
        if (prev.length > 0 && prev[0].message.includes(message)) return prev;
        const newAlert: ExtendedAlert = {
            id: Math.random().toString(36).substr(2, 9),
            message: label ? `[${label}] ${message}` : message,
            severity,
            timestamp,
            escalated: false
        };
        return [newAlert, ...prev].slice(0, 15);
    }); 
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="relative w-full space-y-6">
      
      {/* Playbook Overlay */}
      {isPlaybookOpen && (
        <PlaybookPanel 
          playbook={currentPlaybook} 
          isLoading={playbookLoading} 
          onClose={() => setIsPlaybookOpen(false)} 
        />
      )}

      {/* Top Bar: Controls & Traffic Viz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                      <Activity className="text-emerald-500" size={20} />
                      Real-Time Network Monitor
                  </h2>
                  <p className="text-xs text-slate-400 mb-6">Monitoring interface for {wsUrl}</p>
                  
                  <div className="flex items-center gap-3 mb-6">
                        <div className={`flex items-center justify-center h-12 w-12 rounded-full transition-colors ${
                            status === 'connected' ? 'bg-emerald-500/20 text-emerald-500' :
                            status === 'error' ? 'bg-red-500/20 text-red-500' :
                            'bg-slate-800 text-slate-500'
                        }`}>
                            {status === 'connected' ? <Wifi size={24} /> : <WifiOff size={24} />}
                        </div>
                        <div>
                            <div className="text-2xl font-mono font-bold text-white">
                                {trafficData[trafficData.length-1]?.eps || 0}
                            </div>
                            <div className="text-xs text-slate-500 uppercase font-semibold">Packets / Sec</div>
                        </div>
                  </div>
                  
                  {errorMessage && (
                      <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded text-xs text-red-300">
                          {errorMessage}
                      </div>
                  )}
              </div>

              <div className="space-y-3">
                 {status === 'connected' ? (
                    <button 
                        onClick={disconnect}
                        className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Power size={18} /> Disconnect Sensor
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={wsUrl}
                            onChange={(e) => setWsUrl(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                            placeholder="ws://localhost:8080"
                        />
                        <button 
                            onClick={() => initConnection(wsUrl)} 
                            className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center"
                        >
                            <RefreshCw size={18} className={status === 'connecting' ? 'animate-spin' : ''} />
                        </button>
                    </div>
                )}
              </div>
          </div>

          {/* Traffic Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[250px] relative shadow-lg">
             <div className="absolute top-4 left-4 z-10">
                 <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <BarChart3 size={14} /> Live Traffic Volume
                 </h3>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                    <defs>
                        <linearGradient id="colorEps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }} 
                        itemStyle={{ color: '#10B981' }}
                    />
                    <Area type="monotone" dataKey="eps" stroke="#10B981" fillOpacity={1} fill="url(#colorEps)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Alerts Column */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500" /> 
                    Threat Detections ({alerts.length})
                </h3>
                {alerts.length > 0 && (
                    <button onClick={() => setAlerts([])} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold">Clear All</button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                        <Shield size={32} className="opacity-20" />
                        <p className="text-xs">System Secure. No active threats detected.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className={`bg-slate-950 border p-3 rounded-lg transition-all group ${
                            alert.escalated ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                        }`}>
                             <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    alert.escalated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    alert.severity === Severity.CRITICAL ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    alert.severity === Severity.HIGH ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                    {alert.escalated ? 'ESCALATED' : alert.severity}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3 line-clamp-3 break-words">
                                 {alert.message}
                             </p>
                             
                             {alert.escalated ? (
                                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-medium px-2 py-1.5 bg-emerald-500/10 rounded">
                                    <CheckCircle2 size={12} /> Ticket #INC-{Math.floor(Math.random() * 10000)} Created
                                </div>
                             ) : (
                                 <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleRemediate(alert)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded transition-colors border border-slate-700"
                                    >
                                        <Zap size={10} /> REMEDIATE
                                    </button>
                                    <button 
                                        onClick={() => handleEscalate(alert.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-200 text-[10px] font-bold rounded transition-colors border border-slate-700 hover:border-orange-500"
                                    >
                                        <ArrowRightCircle size={10} /> ESCALATE
                                    </button>
                                    <button 
                                        onClick={() => removeAlert(alert.id)}
                                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-colors border border-slate-700"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                             )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Live Logs Column */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs flex flex-col h-full shadow-inner relative group">
            <div className="flex justify-between items-center mb-2 opacity-50">
                <span className="text-slate-400 font-bold flex items-center gap-2"><Terminal size={12}/> LIVE PACKET STREAM</span>
                <span className="text-[10px] text-slate-600">{packetCount} Packets captured</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {logs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-700">
                        Initializing stream from {wsUrl}...
                    </div>
                )}
                {logs.map((log, idx) => {
                    const lowerLog = log.toLowerCase();
                    const isCritical = lowerLog.includes('critical') || lowerLog.includes('malware');
                    const isWarn = lowerLog.includes('warn') || lowerLog.includes('block') || lowerLog.includes('high');
                    
                    return (
                        <div key={idx} className={`break-all whitespace-pre-wrap flex gap-2 hover:bg-slate-900/50 p-0.5 rounded ${
                            isCritical ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                            <span className="opacity-30 shrink-0">{log.substring(1, 26)}</span>
                            <span>{log.substring(27)}</span>
                        </div>
                    );
                })}
                <div ref={logsEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;