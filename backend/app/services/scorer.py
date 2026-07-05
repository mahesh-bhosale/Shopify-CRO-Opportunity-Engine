"""
Scorer service: computes a prioritized ICE score for CRO opportunities.
Formula:
    Score = (Impact_Score + Ease_Score) / 2 * Confidence
where:
    Impact: High = 10.0, Medium = 7.0, Low = 4.0
    Ease: Low effort = 10.0, Medium effort = 6.0, High effort = 3.0
    Confidence: 0.0 - 1.0 (float)
"""

import logging

logger = logging.getLogger(__name__)

IMPACT_MAP = {
    "high": 10.0,
    "medium": 7.0,
    "low": 4.0
}

EASE_MAP = {
    "low": 10.0,      # Low effort = High ease
    "medium": 6.0,
    "high": 3.0       # High effort = Low ease
}


def calculate_opportunity_score(impact: str, confidence: float, effort: str) -> float:
    """
    Computes a CRO opportunity score (0.0 to 10.0) based on ICE scoring.
    """
    try:
        # Normalize strings
        imp = str(impact).strip().lower()
        eff = str(effort).strip().lower()
        
        impact_val = IMPACT_MAP.get(imp, 5.0)
        ease_val = EASE_MAP.get(eff, 5.0)
        
        # Ensure confidence is within bounds
        conf = float(confidence) if confidence is not None else 0.5
        conf = max(0.0, min(1.0, conf))
        
        score = ((impact_val + ease_val) / 2.0) * conf
        return round(score, 2)
    except Exception as exc:
        logger.warning("Error calculating opportunity score for impact=%s, confidence=%s, effort=%s: %s", impact, confidence, effort, exc)
        return 5.0