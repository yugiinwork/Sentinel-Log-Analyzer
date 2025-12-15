import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, XCircle } from 'lucide-react';

interface FileUploadProps {
  onAnalyze: (content: string) => void;
  isAnalyzing: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, isAnalyzing }) => {
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setValidationError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller log file or split it into chunks.`);
      setFileName(null);
      setTextInput('');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setTextInput(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setValidationError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (textInput.trim().length === 0) return;
    onAnalyze(textInput);
  };

  const loadSampleLogs = () => {
    setValidationError(null);
    const sample = `
2023-10-27 08:12:01 [INFO] sshd[1234]: Accepted publickey for user admin from 192.168.1.50 port 55422 ssh2
2023-10-27 08:15:22 [WARN] firewall[450]: BLOCK input IN=eth0 OUT= MAC=00:00:00:00:00:00 SRC=10.0.0.5 DST=192.168.1.10 PROTO=TCP DPT=445
2023-10-27 08:22:11 [ERROR] nginx[882]: [error] 23#23: *145 directory index of "/var/www/html/" is forbidden, client: 45.33.22.11, server: localhost, request: "GET / HTTP/1.1", host: "192.168.1.10"
2023-10-27 08:25:00 [CRITICAL] auth[999]: Failed password for root from 203.0.113.4 port 3345 ssh2 - Possible Brute Force
2023-10-27 08:25:02 [CRITICAL] auth[999]: Failed password for root from 203.0.113.4 port 3345 ssh2
2023-10-27 08:25:05 [CRITICAL] auth[999]: Failed password for root from 203.0.113.4 port 3345 ssh2
2023-10-27 08:45:12 [WARN] database[3306]: Aborted connection 112233 to db: 'users' user: 'app_svc' host: '192.168.1.20' (Got an error reading communication packets)
2023-10-27 09:10:01 [INFO] cron[112]: (CRON) info (No MTA installed, discarding output)
2023-10-27 09:12:33 [HIGH] ids[555]: SQL Injection Attempt detected from 172.16.5.4 on /login.php params: user=' OR 1=1;--
    `;
    setTextInput(sample.trim());
    setFileName("sample_security.log");
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Upload Box */}
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out
          ${validationError ? 'border-red-500/50 bg-red-500/5' : dragActive ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={`p-4 rounded-full transition-colors ${
            validationError ? 'bg-red-500/20 text-red-400' :
            fileName ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
          }`}>
            {validationError ? <XCircle size={32} /> : fileName ? <FileText size={32} /> : <UploadCloud size={32} />}
          </div>
          
          <div className="space-y-1">
            <h3 className={`text-lg font-medium ${validationError ? 'text-red-400' : 'text-slate-200'}`}>
              {validationError ? "Upload Failed" : fileName ? fileName : "Upload log file"}
            </h3>
            <p className="text-sm text-slate-400">
              Drag and drop or <label htmlFor="file-upload" className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium hover:underline">browse</label>
            </p>
          </div>
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            onChange={handleChange}
            accept=".log,.txt,.csv,.json"
          />
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p>{validationError}</p>
        </div>
      )}

      {/* Manual Input */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-300">Or paste raw log content</label>
          <button 
            onClick={loadSampleLogs}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Load Sample Data
          </button>
        </div>
        <textarea
          value={textInput}
          onChange={(e) => {
            setTextInput(e.target.value);
            setValidationError(null);
          }}
          placeholder="Paste system logs, firewall logs, or error traces here..."
          className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none transition-all placeholder:text-slate-600"
        />
        <div className="flex items-start gap-2 text-xs text-slate-500">
            <AlertCircle size={14} className="mt-0.5" />
            <p>For best results, ensure logs contain timestamps and event details. Max file size: {MAX_FILE_SIZE_MB}MB.</p>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleSubmit}
        disabled={isAnalyzing || !textInput || !!validationError}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200
          ${isAnalyzing || !textInput || !!validationError
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:transform active:scale-[0.99]'}
        `}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing Logs with Gemini...
          </span>
        ) : (
          "Analyze Logs"
        )}
      </button>
    </div>
  );
};

export default FileUpload;