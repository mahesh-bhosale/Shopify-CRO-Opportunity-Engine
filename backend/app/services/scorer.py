from typing import Dict


class Scorer:
    def calculate_score(self, impact: str, confidence: float, effort: str) -> float:
        impact_weights = {"High": 3.0, "Medium": 2.0, "Low": 1.0}
        effort_weights = {"Low": 1.0, "Medium": 0.7, "High": 0.4}
        
        impact_score = impact_weights.get(impact, 1.0)
        effort_score = effort_weights.get(effort, 0.7)
        
        composite_score = (impact_score * confidence * 10) / effort_score
        return round(min(composite_score, 10.0), 1)
    
    def rank_opportunities(self, opportunities: list[Dict]) -> list[Dict]:
        scored = []
        for opp in opportunities:
            score = self.calculate_score(
                opp["impact"],
                opp["confidence"],
                opp["effort"]
            )
            opp["score"] = score
            scored.append(opp)
        
        return sorted(scored, key=lambda x: x["score"], reverse=True)
