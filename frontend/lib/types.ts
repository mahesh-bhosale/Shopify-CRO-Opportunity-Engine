export type Impact = "High" | "Medium" | "Low";
export type Effort = "Low" | "Medium" | "High";

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  impact: Impact;
  confidence: number;
  effort: Effort;
  score: number;
  evidence: string;
  recommendation: string;
  page_url?: string;
}

export interface ExperimentBrief {
  opportunity_id: string;
  hypothesis: string;
  control: string;
  variant: string;
  primary_metric: string;
  secondary_metrics: string[];
  estimated_duration: string;
}

export interface AuditResponse {
  store_url: string;
  scraped_pages: string[];
  opportunities: Opportunity[];
  summary: string;
  generated_at: string;
}

export interface AuditRequest {
  url: string;
  competitor_url?: string;
}
