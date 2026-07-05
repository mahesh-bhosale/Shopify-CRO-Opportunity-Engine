from fastapi import APIRouter, HTTPException
from app.models import AuditRequest, AuditResponse, Opportunity
from app.utils.helpers import validate_url
from app.services.scraper import scrape_store
from app.services.parser import parse_all_pages
from app.services.gemini import create_gemini_service
from app.services.scorer import calculate_opportunity_score
from app.config import settings
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/audit", response_model=AuditResponse)
def run_audit(request: AuditRequest):
    # 1. Validate URLs
    primary_url_str = str(request.url)
    if not validate_url(primary_url_str):
        raise HTTPException(status_code=400, detail="Invalid primary store URL format.")
    
    competitor_url_str = None
    if request.competitor_url:
        competitor_url_str = str(request.competitor_url)
        if not validate_url(competitor_url_str):
            raise HTTPException(status_code=400, detail="Invalid competitor store URL format.")

    # 2. Scrape pages
    try:
        primary_pages = scrape_store(primary_url_str)
    except Exception as exc:
        logger.error("Failed to scrape primary store: %s", exc)
        raise HTTPException(status_code=502, detail=f"Failed to scrape primary store: {str(exc)}")
    
    if not primary_pages or "homepage" not in primary_pages or primary_pages["homepage"].get("status_code") not in (200, 304):
        raise HTTPException(
            status_code=422,
            detail="Failed to scrape primary store homepage. Ensure the store is public and accessible."
        )

    # Scrape competitor pages if competitor_url is provided
    competitor_pages = None
    if competitor_url_str:
        try:
            competitor_pages = scrape_store(competitor_url_str)
        except Exception as exc:
            logger.error("Failed to scrape competitor store: %s", exc)
            raise HTTPException(status_code=502, detail=f"Failed to scrape competitor store: {str(exc)}")
        
        if not competitor_pages or "homepage" not in competitor_pages or competitor_pages["homepage"].get("status_code") not in (200, 304):
            raise HTTPException(
                status_code=422,
                detail="Failed to scrape competitor store homepage. Ensure the store is public and accessible."
            )

    # 3. Parse HTML
    try:
        primary_signals = parse_all_pages(primary_pages)
    except Exception as exc:
        logger.error("Failed to parse primary store pages: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to parse signals from primary store HTML.")
    
    competitor_signals = None
    if competitor_pages:
        try:
            competitor_signals = parse_all_pages(competitor_pages)
        except Exception as exc:
            logger.error("Failed to parse competitor store pages: %s", exc)
            raise HTTPException(status_code=500, detail="Failed to parse signals from competitor store HTML.")

    # 4. Generate Gemini audit
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured in backend settings.")

    try:
        gemini_svc = create_gemini_service(
            api_key=settings.GEMINI_API_KEY,
            model_name=settings.GEMINI_MODEL
        )
    except Exception as exc:
        logger.error("Failed to initialize GeminiService: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to initialize Gemini AI service.")

    try:
        if competitor_signals and competitor_url_str:
            analysis = gemini_svc.analyze_with_competitor(
                store_pages=primary_signals,
                competitor_pages=competitor_signals,
                store_url=primary_url_str,
                competitor_url=competitor_url_str
            )
        else:
            analysis = gemini_svc.analyze_cro(
                parsed_pages=primary_signals,
                store_url=primary_url_str
            )
    except Exception as exc:
        logger.error("Failed executing Gemini analysis: %s", exc)
        raise HTTPException(status_code=502, detail=f"Gemini AI analysis failed: {str(exc)}")

    # 5. Compute scores and map to Opportunity models
    raw_ops = analysis.get("opportunities", [])
    if not raw_ops:
        summary_msg = analysis.get("summary", "")
        if "failed" in summary_msg.lower() or "error" in summary_msg.lower():
            raise HTTPException(status_code=502, detail=f"Gemini CRO analysis failed: {summary_msg}")

    opportunities = []
    for op in raw_ops:
        try:
            impact = op.get("impact", "Medium")
            confidence = op.get("confidence", 0.5)
            effort = op.get("effort", "Medium")
            
            # Compute ICE score
            score = calculate_opportunity_score(impact, confidence, effort)
            
            opportunities.append(
                Opportunity(
                    id=str(uuid.uuid4())[:8],
                    title=op.get("title", "Optimize page element"),
                    category=op.get("category", "General"),
                    impact=impact,
                    confidence=confidence,
                    effort=effort,
                    score=score,
                    evidence=op.get("evidence", "Visual audit signal"),
                    recommendation=op.get("recommendation", "Improve UX design"),
                    page_url=op.get("page_url") or primary_url_str
                )
            )
        except Exception as exc:
            logger.warning("Error mapping raw opportunity %s: %s", op, exc)
            continue

    # Sort opportunities by score descending
    opportunities.sort(key=lambda x: x.score, reverse=True)

    # 6. Return AuditResponse
    summary = analysis.get("summary", "Analysis completed successfully.")
    competitor_gaps = analysis.get("competitor_gaps", [])
    if competitor_gaps and competitor_url_str:
        summary += f"\n\n### Competitor Comparison vs {competitor_url_str}\n"
        summary += "Here are the key gaps identified when comparing your store to the competitor:\n\n"
        for gap in competitor_gaps:
            adv = gap.get("advantage", "")
            ev = gap.get("evidence", "")
            rec = gap.get("recommendation", "")
            summary += f"- **Advantage:** {adv}\n"
            summary += f"  - *Evidence:* {ev}\n"
            summary += f"  - *Recommendation:* {rec}\n"

    scraped_pages = [page_info.get("url") for page_info in primary_pages.values() if page_info.get("url")]
    if not scraped_pages:
        scraped_pages = [primary_url_str]

    return AuditResponse(
        store_url=primary_url_str,
        scraped_pages=scraped_pages,
        opportunities=opportunities,
        summary=summary,
        generated_at=datetime.utcnow().isoformat()
    )


@router.get("/audit/status")
def audit_status():
    return {"ready": True}

