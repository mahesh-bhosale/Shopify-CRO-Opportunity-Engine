import google.generativeai as genai
from app.config import settings
from typing import Dict, List


class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
    async def analyze_store(self, parsed_data: List[Dict]) -> List[Dict]:
        prompt = self._build_prompt(parsed_data)
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_response(response.text)
        except Exception as e:
            print(f"Gemini API error: {e}")
            return []
    
    def _build_prompt(self, parsed_data: List[Dict]) -> str:
        prompt = "Analyze this Shopify store data and identify CRO opportunities:\n\n"
        
        for page in parsed_data:
            prompt += f"Page: {page['url']}\n"
            prompt += f"Title: {page['title']}\n"
            prompt += f"Has Reviews: {page['has_reviews']}\n"
            prompt += f"Has Trust Badges: {page['has_trust_badges']}\n"
            prompt += f"Checkout Elements: {page['checkout_flow']}\n\n"
        
        prompt += """
        Identify 5-10 specific CRO opportunities with:
        - Title
        - Category (Product Page, Cart, Trust, Navigation, etc.)
        - Impact (High/Medium/Low)
        - Confidence (0.0-1.0)
        - Effort (Low/Medium/High)
        - Evidence (specific observation)
        - Recommendation (specific action)
        
        Format as JSON array.
        """
        
        return prompt
    
    def _parse_response(self, response_text: str) -> List[Dict]:
        import json
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return []
