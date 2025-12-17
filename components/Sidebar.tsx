import React from 'react';
import { Activity, FileText, Network, Shield } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menu = [
    { id: 'live', label: 'Live Operations', icon: <Activity size={20} /> },
    { id: 'forensics', label: 'Forensics Lab', icon: <FileText size={20} /> },
    { id: 'connectors', label: 'Data Sources', icon: <Network size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
          <Shield className="text-emerald-500" size={20} />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Sentinel</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Module</div>
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentView === item.id 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
         <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
              OP
            </div>
            <div className="overflow-hidden">
               <div className="text-sm font-bold text-white truncate">Operator</div>
               <div className="text-xs text-emerald-500 truncate flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                 Online
               </div>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;