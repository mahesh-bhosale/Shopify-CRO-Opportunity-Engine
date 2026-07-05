from app.services.scorer import calculate_opportunity_score

def test_calculate_opportunity_score():
    # Formula: Score = (Impact_Score + Ease_Score) / 2 * Confidence
    # Impact: High=10.0, Medium=7.0, Low=4.0
    # Ease: Low effort=10.0, Medium effort=6.0, High effort=3.0
    
    # High impact (10.0), Low effort (10.0), confidence 1.0 => (10 + 10) / 2 * 1.0 = 10.0
    assert calculate_opportunity_score("High", 1.0, "Low") == 10.0
    
    # Medium impact (7.0), Medium effort (6.0), confidence 0.8 => (7 + 6) / 2 * 0.8 = 5.2
    assert calculate_opportunity_score("Medium", 0.8, "Medium") == 5.2
    
    # Low impact (4.0), High effort (3.0), confidence 0.5 => (4 + 3) / 2 * 0.5 = 1.75
    assert calculate_opportunity_score("Low", 0.5, "High") == 1.75
    
    # Bounds check
    assert calculate_opportunity_score("High", 1.5, "Low") == 10.0
    assert calculate_opportunity_score("High", -0.5, "Low") == 0.0
