from fastapi import APIRouter

router = APIRouter()


@router.get("/experiment/brief/{opportunity_id}")
def get_experiment_brief(opportunity_id: str):
    return {
        "opportunity_id": opportunity_id,
        "hypothesis": "Adding product reviews will increase conversion by 15%",
        "control": "Current product page without reviews",
        "variant": "Product page with customer reviews and ratings",
        "primary_metric": "Conversion rate",
        "secondary_metrics": ["Add to cart rate", "Time on page", "Bounce rate"],
        "estimated_duration": "2 weeks"
    }
