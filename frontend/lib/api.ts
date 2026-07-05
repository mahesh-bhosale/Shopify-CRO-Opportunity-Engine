import axios from "axios";
import { AuditResponse, ExperimentBrief } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function runAudit(url: string, competitorUrl?: string): Promise<AuditResponse> {
  const response = await axios.post(`${API_URL}/api/audit`, {
    url,
    competitor_url: competitorUrl,
  });
  return response.data;
}

export async function getExperimentBrief(opportunityId: string): Promise<ExperimentBrief> {
  const response = await axios.get(`${API_URL}/api/experiment/brief/${opportunityId}`);
  return response.data;
}
