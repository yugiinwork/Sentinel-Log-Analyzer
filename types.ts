export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface LogEvent {
  timestamp: string;
  severity: Severity;
  type: string;
  source: string;
  message: string;
  remediation: string;
}

export interface AlertNotification {
  id: string;
  message: string;
  severity: Severity;
  timestamp: string;
}

export interface AnalysisStats {
  totalEvents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  uniqueSources: number;
}

export interface AnalysisResult {
  summary: string;
  riskScore: number; // 0-100
  events: LogEvent[];
  topAttackTypes: { name: string; count: number }[];
  timelineData: { time: string; count: number; severityScore: number }[];
}

export interface LogFile {
  name: string;
  content: string;
  size: number;
}