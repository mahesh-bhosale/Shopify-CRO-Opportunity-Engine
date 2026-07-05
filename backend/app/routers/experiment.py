from fastapi import APIRouter

from app.models import ExperimentBrief

router = APIRouter()


@router.get("/experiment/brief/{opportunity_id}", response_model=ExperimentBrief)
def get_experiment_brief(opportunity_id: str):
    """
    Return an A/B test experiment brief for a given opportunity.

    Note: This is a static stub. When a Gemini API key is configured,
    the audit router can generate dynamic briefs via GeminiService.
    """
    return ExperimentBrief(
        opportunity_id=opportunity_id,
        hypothesis="If we add product reviews and star ratings to the PDP, then add-to-cart rate will increase by 12-18% because social proof reduces purchase hesitation.",
        control="Current product page without a review section",
        variant="Product page with customer reviews, star ratings, and review count badge",
        primary_metric="Add-to-Cart Rate",
        secondary_metrics=["Conversion Rate", "Time on Page", "Bounce Rate"],
        estimated_duration="2-3 weeks at 1,000+ daily visitors",
    )
