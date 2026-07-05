from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal
from datetime import datetime
import uuid


class AuditRequest(BaseModel):
    url: HttpUrl
    competitor_url: Optional[HttpUrl] = None


class Opportunity(BaseModel):
    id: str
    title: str
    category: str
    impact: Literal["High", "Medium", "Low"]
    confidence: float
    effort: Literal["Low", "Medium", "High"]
    score: float
    evidence: str
    recommendation: str
    page_url: Optional[str] = None


class ExperimentBrief(BaseModel):
    opportunity_id: str
    hypothesis: str
    control: str
    variant: str
    primary_metric: str
    secondary_metrics: list[str]
    estimated_duration: str


class AuditResponse(BaseModel):
    store_url: str
    scraped_pages: list[str]
    opportunities: list[Opportunity]
    summary: str
    generated_at: str
