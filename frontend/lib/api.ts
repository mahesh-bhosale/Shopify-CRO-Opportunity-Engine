import axios from "axios";
import { AuditResponse, ExperimentBrief } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 75000, // 75 seconds because scraping + Gemini AI analysis can take time
  headers: {
    "Content-Type": "application/json",
  },
});

export async function runAudit(url: string, competitorUrl?: string): Promise<AuditResponse> {
  try {
    const response = await apiClient.post<AuditResponse>("/api/audit", {
      url,
      competitor_url: competitorUrl || undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error in runAudit:", error);
    
    let message = "An unexpected error occurred while running the audit.";
    if (error.response) {
      // Backend returned an error response
      const detail = error.response.data?.detail;
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        // Validation errors
        message = detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
      } else if (detail && typeof detail === "object") {
        message = detail.message || JSON.stringify(detail);
      }
    } else if (error.request) {
      // Request was made but no response received
      message = "No response from audit server. Please check if the server is running.";
    } else {
      message = error.message || message;
    }
    
    throw new Error(message);
  }
}

export async function getExperimentBrief(opportunityId: string): Promise<ExperimentBrief> {
  try {
    const response = await apiClient.get<ExperimentBrief>(`/api/experiment/brief/${opportunityId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error in getExperimentBrief:", error);
    
    let message = "Failed to load experiment brief.";
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      message = typeof detail === "string" ? detail : JSON.stringify(detail);
    }
    
    throw new Error(message);
  }
}
