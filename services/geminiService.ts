import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Severity, LogEvent, PlaybookResponse } from "../types";

const MAX_LOG_LENGTH = 2000000; 

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    riskScore: { type: Type.INTEGER },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          type: { type: Type.STRING }, // e.g., SSH, HTTP, Firewall
          source: { type: Type.STRING },
          message: { type: Type.STRING },
          remediation: { type: Type.STRING },
        },
        required: ["timestamp", "severity", "type", "source", "message", "remediation"],
      },
    },
    topAttackTypes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          count: { type: Type.INTEGER },
        },
        required: ["name", "count"],
      },
    },
    timelineData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING },
          count: { type: Type.INTEGER },
          severityScore: { type: Type.INTEGER },
        },
        required: ["time", "count", "severityScore"],
      },
    },
    geoData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          count: { type: Type.INTEGER },
        },
        required: ["country", "count"],
      },
    },
    baselineMetrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING },
          subtext: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["good", "neutral", "warning", "critical"] },
        },
        required: ["label", "value", "status"],
      },
    },
    logTypes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          count: { type: Type.INTEGER },
        },
        required: ["type", "count"],
      },
    },
  },
  required: ["summary", "riskScore", "events", "topAttackTypes", "timelineData", "geoData", "baselineMetrics", "logTypes"],
};

const playbookSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["CLI", "TICKET", "EMAIL", "NOTE"] },
          label: { type: Type.STRING },
          content: { type: Type.STRING },
          language: { type: Type.STRING },
        },
        required: ["type", "label", "content"],
      },
    },
  },
  required: ["title", "description", "actions"],
};

export const maskPII = (content: string): string => {
  // Simple regex-based masking for demo purposes
  // Masks IPv4 addresses
  let masked = content.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, 'XXX.XXX.XXX.XXX');
  // Masks Email addresses
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  return masked;
};

export const analyzeLogsWithGemini = async (logContent: string, isPrivacyMode: boolean = false): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let contentToAnalyze = logContent;
  if (isPrivacyMode) {
    contentToAnalyze = maskPII(logContent);
  }

  const processedContent = contentToAnalyze.length > MAX_LOG_LENGTH 
    ? contentToAnalyze.substring(0, MAX_LOG_LENGTH) + "\n...[TRUNCATED]" 
    : contentToAnalyze;

  const prompt = `
    You are a Tier-3 SOC Analyst. Analyze the provided logs to generate a comprehensive threat report.

    1. **Summary & Risk**: Assess the overall security posture (0-100 Risk Score) and summarize findings.
    2. **Events**: Extract key security events. Map 'type' to categories like 'AUTH', 'WEB', 'SYSTEM', 'FIREWALL'.
    3. **Baseline Metrics**: Extract high-level operational metrics (e.g., "Failed Login Rate", "Avg Request Latency", "Unique IPs", "Error Rate").
       - Compare implicitly against standard baselines.
       - status: 'critical' if > 50% failure/error rate, 'warning' if elevated, 'good' if normal.
    4. **Geo Intelligence**: If IP addresses are present, infer plausible country of origin for top attackers (approximate is fine based on common ranges or just label "External/Internal").
    5. **Timeline**: Aggregate event volume by time bucket.
    6. **Log Types**: Count events by category (Web, Auth, System, etc).
    
    LOG DATA:
    ${processedContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a SOC analyst analyzing server and security logs for threats and misconfigurations.",
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generatePlaybook = async (event: LogEvent): Promise<PlaybookResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a security remediation playbook for this specific event:
    Event Type: ${event.type}
    Severity: ${event.severity}
    Message: ${event.message}
    Source: ${event.source}

    I need specific technical actions.
    1. A CLI command to block or investigate (e.g., iptables, AWS CLI, grep).
    2. A structured ticket description for Jira/ServiceNow.
    3. An email template to the relevant team or user.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: playbookSchema,
    }
  });

  if (!response.text) throw new Error("Failed to generate playbook");
  return JSON.parse(response.text) as PlaybookResponse;
};