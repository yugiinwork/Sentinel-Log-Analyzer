import React, { useEffect, useState, useRef } from 'react';
import { Severity, AlertNotification } from '../types';
import { AlertOctagon, AlertTriangle, Shield, Activity, X, Terminal, Wifi } from 'lucide-react';

const MOCK_IPS = ['192.168.1.45', '10.0.0.12', '45.33.22.11', '203.0.113.4', '172.16.5.4'];
const MOCK_PATHS = ['/login.php', '/api/v1/user', '/admin', '/var/www/html', '/etc/passwd'];

const LiveMonitor: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of log window
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      generateMockLog();
    }, 1200); // New log every 1.2 seconds

    return () => clearInterval(interval);
  }, []);

  const generateMockLog = () => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const ip = MOCK_IPS[Math.floor(Math.random() * MOCK_IPS.length)];
    const isAttack = Math.random() > 0.7; // 30% chance of interesting event
    
    let message = "";
    let severity = Severity.LOW;

    if (isAttack) {
      const attackType = Math.random();
      if (attackType > 0.8) {
        message = `[CRITICAL] auth[999]: Failed password for root from ${ip} - Possible Brute Force`;
        severity = Severity.CRITICAL;
      } else if (attackType > 0.5) {
         message = `[HIGH] ids[555]: SQL Injection Attempt detected from ${ip} on ${MOCK_PATHS[Math.floor(Math.random() * MOCK_PATHS.length)]}`;
         severity = Severity.HIGH;
      } else {
        message = `[WARN] firewall[450]: BLOCK input IN=eth0 SRC=${ip} DST=192.168.1.10`;
        severity = Severity.MEDIUM;
      }
    } else {
      message = `[INFO] nginx[882]: 200 OK GET ${MOCK_PATHS[Math.floor(Math.random() * MOCK_PATHS.length)]} from ${ip}`;
      severity = Severity.LOW;
    }

    // Add to console log
    setLogs(prev => [...prev.slice(-19), `${timestamp} ${message}`]);

    // Trigger Alert for High/Critical
    if (severity === Severity.HIGH || severity === Severity.CRITICAL) {
      addAlert(message, severity, timestamp);
    }
  };

  const addAlert = (message: string, severity: Severity, timestamp: string) => {
    const newAlert: AlertNotification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      severity,
      timestamp
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep max 5 visible

    // Auto dismiss
    setTimeout(() => {
      removeAlert(newAlert.id);
    }, 5000);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getSeverityIcon = (severity: Severity) => {
    if (severity === Severity.CRITICAL) return <AlertOctagon className="text-red-500" size={20} />;
    if (severity === Severity.HIGH) return <AlertTriangle className="text-orange-500" size={20} />;
    return <Shield className="text-blue-400" size={20} />;
  };

  return (
    <div className="relative w-full space-y-6">
      
      {/* Live Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="text-lg font-semibold text-slate-200">Real-time Network Monitor</h2>
        </div>
        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <Wifi size={14} />
            WS://STREAM.SENTINEL.LOCAL:8080 (SIMULATED)
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs sm:text-sm h-96 overflow-y-auto shadow-inner relative">
        <div className="absolute top-2 right-2 opacity-20 pointer-events-none">
            <Terminal size={100} />
        </div>
        {logs.map((log, idx) => {
            const isCritical = log.includes('CRITICAL');
            const isHigh = log.includes('HIGH');
            const colorClass = isCritical ? 'text-red-500 font-bold' : isHigh ? 'text-orange-400' : 'text-slate-400';
            
            return (
                <div key={idx} className={`mb-1 ${colorClass} animate-in fade-in slide-in-from-left-2 duration-300`}>
                    <span className="opacity-50 mr-2">{'>'}</span>
                    {log}
                </div>
            );
        })}
        <div ref={logsEndRef} />
      </div>

      {/* Stats Summary (Fake) */}
      <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
             <div className="text-slate-500 text-xs uppercase font-bold">Packets / Sec</div>
             <div className="text-2xl text-emerald-400 font-mono">1,240</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
             <div className="text-slate-500 text-xs uppercase font-bold">Active Threats</div>
             <div className="text-2xl text-orange-400 font-mono">{alerts.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
             <div className="text-slate-500 text-xs uppercase font-bold">Bandwidth</div>
             <div className="text-2xl text-blue-400 font-mono">45 MB/s</div>
          </div>
      </div>

      {/* Floating Notifications Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80 sm:w-96 pointer-events-none">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-500"
          >
            <div className="mt-1 shrink-0">
                {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold ${alert.severity === Severity.CRITICAL ? 'text-red-400' : 'text-orange-400'}`}>
                        {alert.severity} THREAT DETECTED
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {alert.message}
                </p>
            </div>
            <button 
                onClick={() => removeAlert(alert.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
            >
                <X size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default LiveMonitor;