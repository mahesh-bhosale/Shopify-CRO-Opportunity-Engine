from fastapi import APIRouter, HTTPException
from app.models import AuditRequest, AuditResponse, Opportunity
from datetime import datetime
import uuid

router = APIRouter()


@router.post("/audit", response_model=AuditResponse)
def run_audit(request: AuditRequest):
    dummy_opportunities = [
        Opportunity(
            id=str(uuid.uuid4())[:8],
            title="Add product reviews to product pages",
            category="Product Page",
            impact="High",
            confidence=0.85,
            effort="Medium",
            score=8.5,
            evidence="No customer reviews visible on product pages",
            recommendation="Implement a review system with star ratings and customer testimonials",
            page_url=str(request.url)
        ),
        Opportunity(
            id=str(uuid.uuid4())[:8],
            title="Optimize checkout flow",
            category="Cart",
            impact="High",
            confidence=0.75,
            effort="Low",
            score=7.5,
            evidence="Checkout requires account creation before purchase",
            recommendation="Enable guest checkout to reduce friction",
            page_url=str(request.url)
        ),
        Opportunity(
            id=str(uuid.uuid4())[:8],
            title="Add trust badges to cart page",
            category="Trust",
            impact="Medium",
            confidence=0.65,
            effort="Low",
            score=6.5,
            evidence="No security badges or trust indicators visible",
            recommendation="Add SSL badge, payment method icons, and money-back guarantee",
            page_url=str(request.url)
        )
    ]
    
    return AuditResponse(
        store_url=str(request.url),
        scraped_pages=[str(request.url)],
        opportunities=dummy_opportunities,
        summary="This store has significant CRO opportunities around social proof and checkout optimization. Implementing product reviews and guest checkout could significantly improve conversion rates.",
        generated_at=datetime.utcnow().isoformat()
    )


@router.get("/audit/status")
def audit_status():
    return {"ready": True}
