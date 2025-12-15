import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Severity } from "../types";

// Increased to ~2MB to handle larger network traffic logs while staying within reason for browser memory
const MAX_LOG_LENGTH = 2000000; 

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise executive summary of the log analysis, highlighting major threats or anomalies.",
    },
    riskScore: {
      type: Type.INTEGER,
      description: "A calculated risk score from 0 to 100 based on the severity of events found.",
    },
    events: {
      type: Type.ARRAY,
      description: "A list of parsed and analyzed significant log events.",
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "ISO timestamp or extracted time string." },
          severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          type: { type: Type.STRING, description: "Category of the event (e.g., SQL Injection, Failed Login)." },
          source: { type: Type.STRING, description: "Source IP, User, or System component." },
          message: { type: Type.STRING, description: "Brief description of what happened." },
          remediation: { type: Type.STRING, description: "Suggested action to fix or investigate." },
        },
        required: ["timestamp", "severity", "type", "source", "message", "remediation"],
      },
    },
    topAttackTypes: {
      type: Type.ARRAY,
      description: "Aggregated count of attack/event types.",
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
      description: "Time-series data for visualization.",
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING, description: "Time bucket label (e.g., '10:00')" },
          count: { type: Type.INTEGER },
          severityScore: { type: Type.INTEGER, description: "Weighted score for severity in this bucket" },
        },
        required: ["time", "count", "severityScore"],
      },
    },
  },
  required: ["summary", "riskScore", "events", "topAttackTypes", "timelineData"],
};

export const analyzeLogsWithGemini = async (logContent: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Truncate if necessary to prevent payload errors, though Flash has a large context window.
  const processedContent = logContent.length > MAX_LOG_LENGTH 
    ? logContent.substring(0, MAX_LOG_LENGTH) + "\n...[TRUNCATED]" 
    : logContent;

  const prompt = `
    Analyze the following security logs. 
    Identify security incidents, anomalies, and operational issues.
    Categorize severity accurately based on standard cybersecurity practices.
    Provide actionable remediation steps for high/critical issues.
    Extract timeline data suitable for a chart.
    
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
        systemInstruction: "You are an expert cybersecurity analyst. Your job is to parse raw logs into structured threat intelligence.",
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