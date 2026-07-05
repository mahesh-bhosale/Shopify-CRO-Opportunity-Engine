from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
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


def _generate_fallback_analysis(
    primary_signals: list[dict],
    competitor_signals: list[dict] = None,
    competitor_url: str = None
) -> dict:
    opportunities = []
    
    # Locate page types
    homepage = next((p for p in primary_signals if p.get("page_type") == "homepage"), {})
    collection = next((p for p in primary_signals if p.get("page_type") == "collection"), {})
    cart = next((p for p in primary_signals if p.get("page_type") == "cart"), {})
    products = [p for p in primary_signals if "product" in p.get("page_type", "")]
    
    # 1. Product page checks
    for idx, prod in enumerate(products, start=1):
        img_count = prod.get("images_count", 0)
        p_url = prod.get("url")
        p_title = prod.get("product_title") or f"Product {idx}"
        if img_count < 3:
            opportunities.append({
                "title": f"Increase gallery images for {p_title}",
                "category": "Product Page",
                "impact": "High",
                "confidence": 0.85,
                "effort": "Low",
                "evidence": f"images_count: {img_count} on product page",
                "recommendation": f"Add at least 3-4 zoomable product photos showing different angles of {p_title}.",
                "page_url": p_url
            })
            
        reviews = prod.get("reviews_count", 0)
        has_rev = prod.get("has_review_section", False)
        if reviews == 0 or not has_rev:
            opportunities.append({
                "title": f"Add social proof and reviews to {p_title}",
                "category": "Trust & Social Proof",
                "impact": "High",
                "confidence": 0.9,
                "effort": "Medium",
                "evidence": f"reviews_count: {reviews} and has_review_section: {has_rev}",
                "recommendation": "Install a Shopify review app (e.g. Judge.me) to collect and showcase star ratings.",
                "page_url": p_url
            })
            
        has_trust = prod.get("has_trust_section", False)
        if not has_trust:
            opportunities.append({
                "title": "Display trust and security badges near CTA",
                "category": "Trust & Social Proof",
                "impact": "Medium",
                "confidence": 0.75,
                "effort": "Low",
                "evidence": "has_trust_section: False on product page",
                "recommendation": "Embed secure payment badges and money-back guarantee details near the 'Add to Cart' button.",
                "page_url": p_url
            })

        has_shipping = prod.get("has_free_shipping_badge", False)
        if not has_shipping:
            opportunities.append({
                "title": "Promote free shipping threshold on PDP",
                "category": "Merchandising",
                "impact": "High",
                "confidence": 0.8,
                "effort": "Low",
                "evidence": "has_free_shipping_badge: False on product page",
                "recommendation": "Add a visual badge or text indicator highlighting free shipping rules below the product price.",
                "page_url": p_url
            })

        has_faq = prod.get("faq_present", False)
        if not has_faq:
            opportunities.append({
                "title": "Implement accordion FAQ section",
                "category": "Product Page",
                "impact": "Medium",
                "confidence": 0.7,
                "effort": "Medium",
                "evidence": "faq_present: False on product page",
                "recommendation": "Create a collapsible FAQ section covering product sizing, delivery time, and return queries.",
                "page_url": p_url
            })

    # 2. Collection page checks
    if collection:
        has_filters = collection.get("has_filters", False)
        col_title = collection.get("collection_title") or "Collection"
        col_url = collection.get("url")
        if not has_filters:
            opportunities.append({
                "title": f"Enable product filtering on {col_title}",
                "category": "Collection",
                "impact": "High",
                "confidence": 0.85,
                "effort": "Medium",
                "evidence": "has_filters: False on collection page",
                "recommendation": "Enable Shopify Search & Discovery app filters for price, size, and availability.",
                "page_url": col_url
            })
            
        has_sorting = collection.get("has_sorting", False)
        if not has_sorting:
            opportunities.append({
                "title": "Add collection sorting option",
                "category": "Collection",
                "impact": "Medium",
                "confidence": 0.75,
                "effort": "Low",
                "evidence": "has_sorting: False on collection page",
                "recommendation": "Enable the collection page drop-down sorting (Best selling, price, date) in theme settings.",
                "page_url": col_url
            })

    # 3. Homepage hero checks
    if homepage:
        has_hero = homepage.get("has_hero_section", False)
        home_url = homepage.get("url")
        if not has_hero:
            opportunities.append({
                "title": "Design a high-converting hero banner",
                "category": "Homepage",
                "impact": "High",
                "confidence": 0.8,
                "effort": "Medium",
                "evidence": "has_hero_section: False on homepage",
                "recommendation": "Create a bold hero banner with a clear headline, value proposition, and 'Shop Now' call to action.",
                "page_url": home_url
            })
            
        has_announcement = homepage.get("has_announcement_bar", False)
        if not has_announcement:
            opportunities.append({
                "title": "Add promo announcement bar",
                "category": "Homepage",
                "impact": "Medium",
                "confidence": 0.7,
                "effort": "Low",
                "evidence": "has_announcement_bar: False on homepage",
                "recommendation": "Activate the top announcement bar to promote key offers, discounts, or shipping information.",
                "page_url": home_url
            })

    # 4. Cart upsell checks
    if cart:
        has_upsell = cart.get("has_cart_upsell", False)
        cart_url = cart.get("url")
        if not has_upsell:
            opportunities.append({
                "title": "Implement cart upsell carousel",
                "category": "Cart",
                "impact": "High",
                "confidence": 0.85,
                "effort": "Medium",
                "evidence": "has_cart_upsell: False on cart page",
                "recommendation": "Show complement/accessory upsell products inside the cart drawer/page to boost average order value.",
                "page_url": cart_url
            })

    # Fallback default if nothing collected
    if not opportunities:
        opportunities.append({
            "title": "Optimize mobile product layout",
            "category": "Mobile UX",
            "impact": "High",
            "confidence": 0.8,
            "effort": "Medium",
            "evidence": "General site audit",
            "recommendation": "Ensure CTA button remains sticky at the bottom on mobile screen resolutions to reduce purchase friction."
        })

    summary = (
        "Notice: Run in Local Diagnostic Mode. The system generated this prioritized audit report using local "
        "rule-based DTC CRO matrices because the Gemini API key was invalid or model requests failed. "
        "The roadmap addresses key friction points across PDP layouts, social proof, navigation, and cart UX."
    )

    competitor_gaps = []
    if competitor_url and competitor_signals:
        comp_prod = next((p for p in competitor_signals if "product" in p.get("page_type", "")), {})
        prim_prod = next((p for p in primary_signals if "product" in p.get("page_type", "")), {})
        if comp_prod and prim_prod:
            comp_reviews = comp_prod.get("reviews_count", 0)
            prim_reviews = prim_prod.get("reviews_count", 0)
            if comp_reviews > prim_reviews and prim_reviews == 0:
                competitor_gaps.append({
                    "advantage": "Active customer reviews section",
                    "evidence": f"Competitor has reviews visible on PDP, primary store has reviews_count={prim_reviews}",
                    "recommendation": "Install a customer review collection app immediately to match the competitor's social proof."
                })
        
        comp_collection = next((p for p in competitor_signals if p.get("page_type") == "collection"), {})
        if comp_collection and collection:
            comp_fil = comp_collection.get("has_filters", False)
            prim_fil = collection.get("has_filters", False)
            if comp_fil and not prim_fil:
                competitor_gaps.append({
                    "advantage": "Advanced collection page filtering",
                    "evidence": "Competitor provides filter controls for products, primary store has has_filters=False",
                    "recommendation": "Enable collection filtering on collections/all using Shopify Search & Discovery."
                })

        if not competitor_gaps:
            competitor_gaps.append({
                "advantage": "Faster visual page load speeds",
                "evidence": "Competitor relies on a lightweight theme framework with optimized images",
                "recommendation": "Compress theme imagery assets and defer non-critical JavaScript payloads."
            })

    return {
        "summary": summary,
        "opportunities": opportunities[:10],
        "competitor_gaps": competitor_gaps
    }


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
    fallback_mode = False
    analysis = {}
    
    if not settings.GEMINI_API_KEY or "your_actual" in settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.warning("Mock Gemini API Key template detected. Using local rule-based diagnostic engine.")
        fallback_mode = True
    else:
        try:
            gemini_svc = create_gemini_service(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.GEMINI_MODEL
            )
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
            
            if not analysis or not analysis.get("opportunities"):
                logger.warning("Gemini returned empty opportunities. Falling back to local diagnostic engine.")
                fallback_mode = True
        except Exception as exc:
            logger.error("Gemini AI analysis failed: %s. Falling back to local diagnostic engine.", exc)
            fallback_mode = True

    if fallback_mode:
        analysis = _generate_fallback_analysis(
            primary_signals=primary_signals,
            competitor_signals=competitor_signals,
            competitor_url=competitor_url_str
        )

    # 5. Compute scores and map to Opportunity models
    raw_ops = analysis.get("opportunities", [])
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


@router.get("/gemini/test")
def test_gemini():
    """
    Health check endpoint to test Gemini API connectivity.
    """
    logger.info("✓ Gemini request started")
    api_key = settings.GEMINI_API_KEY
    if not api_key or "your_actual" in api_key or api_key == "your_gemini_api_key_here":
        logger.error("✗ Gemini request failed")
        return JSONResponse(
            status_code=400,
            content={
                "connected": False,
                "error": "Gemini API key is not configured or is a placeholder."
            }
        )

    try:
        from app.services.gemini_client import get_gemini_client, map_exception
        client = get_gemini_client()
        
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Reply with exactly: GEMINI_CONNECTION_OK"
        )
        text = response.text.strip()
        logger.info("✓ Gemini response received")
        return {
            "connected": True,
            "model": settings.GEMINI_MODEL,
            "response": text
        }
    except Exception as exc:
        logger.error("✗ Gemini request failed")
        from app.services.gemini_client import map_exception
        mapped_exc = map_exception(exc)
        logger.error("Gemini test connection failed: %s", mapped_exc)
        return JSONResponse(
            status_code=500,
            content={
                "connected": False,
                "error": str(mapped_exc)
            }
        )


