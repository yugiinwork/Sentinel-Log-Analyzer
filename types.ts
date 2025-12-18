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

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignee: string;
  timestamp: string;
  source: string;
  description: string;
  notes: string[];
}

export interface AnalysisStats {
  totalEvents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  uniqueSources: number;
}

export interface GeoData {
  country: string;
  count: number;
}

export interface Metric {
  label: string;
  value: string | number;
  subtext?: string;
  status: 'good' | 'neutral' | 'warning' | 'critical';
}

export interface AnalysisResult {
  summary: string;
  riskScore: number; // 0-100
  events: LogEvent[];
  topAttackTypes: { name: string; count: number }[];
  timelineData: { time: string; count: number; severityScore: number }[];
  geoData: GeoData[];
  baselineMetrics: Metric[];
  logTypes: { type: string; count: number }[];
}

export interface LogFile {
  name: string;
  content: string;
  size: number;
}

export interface PlaybookAction {
  type: 'CLI' | 'TICKET' | 'EMAIL' | 'NOTE';
  label: string;
  content: string;
  language?: string;
}

export interface PlaybookResponse {
  title: string;
  description: string;
  actions: PlaybookAction[];
}