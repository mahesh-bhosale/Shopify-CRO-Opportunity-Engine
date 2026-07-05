"""
Gemini service: sends structured page signals to Gemini 1.5 Flash and
returns a parsed list of CRO opportunities plus an overall summary.

Design rules
------------
1. Temperature is kept low (0.3) for consistent, structured output.
2. The prompt forbids generic advice — every recommendation must cite
   a specific field value from the data.
3. JSON is extracted with a two-pass approach:
     Pass 1 — strip markdown fences, try json.loads()
     Pass 2 — ask Gemini to "return only the raw JSON" and retry once
4. On any failure we return a degraded response rather than raising.
"""

import json
import logging
import re
from typing import Any

import google.generativeai as genai

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

CRO_SYSTEM_CONTEXT = """
You are a senior conversion-rate-optimization (CRO) specialist with 10+ years
of experience auditing Shopify stores for 7–8 figure DTC brands. You have deep
expertise in buyer psychology, product page design, trust signals, catalog
merchandising, and checkout flow.

CRITICAL RULES — follow every one, no exceptions:
1. Every opportunity MUST cite specific evidence from the provided data.
   Quote actual field names and values, e.g.:
     "images_count: 1", "reviews_count: 0", "has_trust_section: False",
     "has_free_shipping_badge: False", "faq_present: False".
   Do NOT invent details that are not in the data.
2. Be specific about WHAT to change and WHERE, not just that something is missing.
3. Every opportunity must be actionable inside Shopify without a bespoke
   development team (theme editor, apps, or Shopify admin are all fair game).
4. Rank by expected impact on conversion rate (CVR), add-to-cart rate (ATC),
   or revenue per visitor (RPV).
5. Output ONLY a valid JSON object — no markdown, no explanation, no text
   outside the JSON object itself.

OUTPUT FORMAT (strict — do not add or remove keys):
{
  "summary": "<2-sentence overall assessment of the store's CRO maturity and single biggest opportunity area>",
  "opportunities": [
    {
      "title":          "<action-oriented title, max 8 words>",
      "category":       "<one of: Product Page | Collection | Homepage | Cart | Trust & Social Proof | Merchandising | Mobile UX>",
      "impact":         "<High | Medium | Low>",
      "confidence":     <float 0.0–1.0, how strongly the data supports this>,
      "effort":         "<Low | Medium | High>",
      "evidence":       "<specific data fields that justify this, e.g. 'images_count: 1 on product_1, reviews_count: 0'>",
      "recommendation": "<concrete action: what exactly to add, change, or remove and where>"
    }
  ]
}

Produce 8–12 opportunities, ordered highest to lowest expected CVR impact.
""".strip()

COMPETITOR_EXTRA_CONTEXT = """

ADDITIONAL TASK — COMPETITOR COMPARISON:
You are comparing TWO stores: a primary store and a competitor.
Add a "competitor_gaps" key to your JSON output (at the same level as
"opportunities").  This is a list of things the COMPETITOR does well that
the PRIMARY STORE does not.

Each gap object:
{
  "advantage":       "<what the competitor does better>",
  "evidence":        "<specific data diff between the two stores>",
  "recommendation":  "<how the primary store can match or surpass it>"
}

Produce 3–6 competitor gaps.
""".strip()

EXPERIMENT_BRIEF_PROMPT = """
Given this Shopify CRO opportunity:
{opportunity_json}

Write an A/B test experiment brief as a JSON object with exactly these keys:
{{
  "hypothesis":          "<If we [change], then [metric] will [direction] because [reason]>",
  "control":             "<description of the current state>",
  "variant":             "<description of what will be tested>",
  "primary_metric":      "<single most important metric, e.g. Add-to-Cart Rate>",
  "secondary_metrics":   ["<metric 1>", "<metric 2>"],
  "estimated_duration":  "<e.g. 2–3 weeks at 1 000 daily visitors>"
}}

Output ONLY the JSON object — no markdown, no additional text.
""".strip()


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------


def _extract_json(text: str) -> Any:
    """
    Try to parse JSON from a Gemini response string.

    Strips common markdown fences (```json ... ```) and leading/trailing
    whitespace before attempting to parse.  Raises json.JSONDecodeError on
    failure so the caller can decide to retry.
    """
    # Remove markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())
    return json.loads(cleaned.strip())


# ---------------------------------------------------------------------------
# GeminiService
# ---------------------------------------------------------------------------


class GeminiService:
    """
    Wrapper around the google-generativeai SDK for CRO analysis.

    The service is stateless — create one instance per request or reuse
    a single instance (the underlying SDK client is thread-safe).
    """

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash") -> None:
        genai.configure(api_key=api_key)
        self._generation_config = genai.GenerationConfig(
            temperature=0.3,
            max_output_tokens=4096,
            # candidate_count defaults to 1 which is what we want
        )
        self._model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=self._generation_config,
        )
        logger.info("GeminiService initialised with model '%s'", model_name)

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def analyze_cro(
        self,
        parsed_pages: list[dict[str, Any]],
        store_url: str,
    ) -> dict[str, Any]:
        """
        Analyse parsed page data and return CRO opportunities.

        Returns:
            {
                "opportunities": list[dict],
                "summary":       str,
            }
        On any failure a degraded result with empty opportunities is returned;
        this method never raises.
        """
        prompt = self._build_cro_prompt(parsed_pages, store_url)
        raw = self._call_gemini(prompt)

        if raw is None:
            return self._empty_result("Gemini call failed — please try again.")

        parsed = self._parse_json(raw, prompt)
        if parsed is None:
            return self._empty_result(
                "Could not parse Gemini response as JSON — please try again."
            )

        opportunities = parsed.get("opportunities", [])
        summary = parsed.get("summary", "No summary returned.")

        if not isinstance(opportunities, list):
            opportunities = []

        logger.info(
            "analyze_cro: received %d opportunities for %s",
            len(opportunities),
            store_url,
        )
        return {"opportunities": opportunities, "summary": summary}

    def analyze_with_competitor(
        self,
        store_pages: list[dict[str, Any]],
        competitor_pages: list[dict[str, Any]],
        store_url: str,
        competitor_url: str,
    ) -> dict[str, Any]:
        """
        Like analyze_cro but also compares against a competitor store.

        Returns:
            {
                "opportunities":    list[dict],
                "summary":          str,
                "competitor_gaps":  list[dict],
            }
        """
        prompt = self._build_competitor_prompt(
            store_pages, competitor_pages, store_url, competitor_url
        )
        raw = self._call_gemini(prompt)

        if raw is None:
            return {**self._empty_result("Gemini call failed."), "competitor_gaps": []}

        parsed = self._parse_json(raw, prompt)
        if parsed is None:
            return {
                **self._empty_result("Could not parse Gemini response."),
                "competitor_gaps": [],
            }

        return {
            "opportunities": parsed.get("opportunities", []),
            "summary": parsed.get("summary", ""),
            "competitor_gaps": parsed.get("competitor_gaps", []),
        }

    def generate_experiment_brief(
        self, opportunity: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Generate an A/B test experiment brief for a single opportunity.

        Returns the brief dict, or an empty dict on failure.
        """
        opportunity_json = json.dumps(opportunity, indent=2)
        prompt = EXPERIMENT_BRIEF_PROMPT.format(opportunity_json=opportunity_json)

        raw = self._call_gemini(prompt)
        if raw is None:
            logger.warning("generate_experiment_brief: Gemini call failed")
            return {}

        parsed = self._parse_json(raw, prompt)
        if not isinstance(parsed, dict):
            logger.warning("generate_experiment_brief: unexpected type %s", type(parsed))
            return {}

        logger.info(
            "generate_experiment_brief: generated brief for '%s'",
            opportunity.get("title", "?"),
        )
        return parsed

    # ------------------------------------------------------------------
    # Prompt builders
    # ------------------------------------------------------------------

    def _build_cro_prompt(
        self,
        parsed_pages: list[dict[str, Any]],
        store_url: str,
    ) -> str:
        data_block = json.dumps(parsed_pages, indent=2)
        return (
            f"{CRO_SYSTEM_CONTEXT}\n\n"
            f"Store URL: {store_url}\n\n"
            f"Extracted page data:\n{data_block}"
        )

    def _build_competitor_prompt(
        self,
        store_pages: list[dict[str, Any]],
        competitor_pages: list[dict[str, Any]],
        store_url: str,
        competitor_url: str,
    ) -> str:
        return (
            f"{CRO_SYSTEM_CONTEXT}\n\n"
            f"{COMPETITOR_EXTRA_CONTEXT}\n\n"
            f"PRIMARY STORE URL: {store_url}\n"
            f"PRIMARY STORE DATA:\n{json.dumps(store_pages, indent=2)}\n\n"
            f"COMPETITOR URL: {competitor_url}\n"
            f"COMPETITOR DATA:\n{json.dumps(competitor_pages, indent=2)}"
        )

    # ------------------------------------------------------------------
    # Gemini call + JSON parsing (with one retry)
    # ------------------------------------------------------------------

    def _call_gemini(self, prompt: str) -> str | None:
        """
        Send a prompt to Gemini and return the raw text response.
        Returns None on any exception.
        """
        try:
            response = self._model.generate_content(prompt)
            text = response.text
            logger.debug("Gemini raw response length: %d chars", len(text))
            return text
        except Exception as exc:
            logger.error("Gemini API call failed: %s", exc, exc_info=True)
            return None

    def _parse_json(self, raw: str, original_prompt: str) -> Any:
        """
        Two-pass JSON extraction:
          Pass 1 — strip markdown fences, try json.loads()
          Pass 2 — ask Gemini to reformat and try again

        Returns the parsed object or None on complete failure.
        """
        # Pass 1
        try:
            return _extract_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning("Pass 1 JSON parse failed: %s. Retrying…", exc)

        # Pass 2 — ask Gemini to clean up its own output
        retry_prompt = (
            "The following text should be a valid JSON object but failed to parse.\n"
            "Return ONLY the corrected raw JSON object — no markdown, no explanation.\n\n"
            f"{raw}"
        )
        raw2 = self._call_gemini(retry_prompt)
        if raw2 is None:
            logger.error("Retry Gemini call also failed.")
            return None

        try:
            return _extract_json(raw2)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error("Pass 2 JSON parse also failed: %s", exc)
            return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _empty_result(message: str) -> dict[str, Any]:
        return {"opportunities": [], "summary": message}


# ---------------------------------------------------------------------------
# Factory helper (used by routers to avoid importing config directly)
# ---------------------------------------------------------------------------


def create_gemini_service(api_key: str, model_name: str = "gemini-1.5-flash") -> GeminiService:
    """Convenience factory — keeps router code clean."""
    return GeminiService(api_key=api_key, model_name=model_name)