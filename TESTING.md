# Manual Testing Checklist & QA Playbook

This document outlines the validation procedures, sample store benchmarks, expected outputs, and edge cases to test the Shopify CRO Opportunity Engine for production-readiness.

---

## 1. Manual Testing Checklist

### Landing Page & Input Form
- [ ] **URL Prefixer**: Inputting `allbirds.com` instead of `https://allbirds.com` automatically prepends `https://`.
- [ ] **Validations**: Submitting non-URL text throws a clean validation error: *"Please enter a valid Shopify store URL"*.
- [ ] **Optional Competitor Input**: Submitting without competitor URL works seamlessly; submitting with an invalid competitor URL returns validation error.
- [ ] **Loading Overlay transition**: On successful submit, the screen transitions to the Loading State with rotating DTC audit progress messages and a growing progress meter.

### CRO Diagnostics Dashboard
- [ ] **Overall Health Score Gauge**: Circular gauge showing overall CRO Health score calculated dynamically from opportunities.
- [ ] **8x KPI Cards**: Showing CRO Score, Total Opportunities, High Impact, Avg Confidence, Avg Priority, Est. Revenue Lift, Quick Wins, and High Effort.
- [ ] **Interactive Visualizations (Recharts)**:
  - [ ] Priority Bar Chart (Horizontal, Top 5 opportunities by ICE score).
  - [ ] Impact vs Effort Scatter Matrix (Reference area highlighting Top-Left "Quick Wins", colored dots by category).
  - [ ] Category Breakdown (Vertical bar chart grouping counts by page template).
  - [ ] Impact Distribution (Donut chart showing Low/Medium/High counts).
- [ ] **Export Actions (No-Print classes checked)**:
  - [ ] **JSON**: Triggers a direct file download containing the full schema `AuditResponse`.
  - [ ] **CSV**: Downloads a clean spreadsheet table with all opportunities and criteria values.
  - [ ] **PDF**: Launches `window.print()` using print media CSS queries that hide headers, buttons, and footers, and format charts cleanly.
- [ ] **Opportunities Matrix Table**:
  - [ ] Allow sorting by columns (Score, Title, Category, Impact, Effort, Confidence).
  - [ ] Allow live search filtering matching titles or recommendations.
  - [ ] Verify pagination controls (10 rows per page limit).
- [ ] **Detailed Opportunity Cards**:
  - [ ] Click **"Generate A/B Test Brief"** to display collapsible hypothesis cards fetching metrics via `/api/experiment/brief/{id}` with hover details.

---

## 2. Sample Shopify Stores for Testing

Use these live Shopify store URLs to run audits:
1. **Allbirds**: `https://www.allbirds.com`
2. **Gymshark**: `https://www.gymshark.com`
3. **Bombas**: `https://bombas.com`
4. **Chubbies**: `https://www.chubbiesshorts.com`
5. **Kylie Cosmetics**: `https://kyliecosmetics.com`

---

## 3. Expected Output Examples

### Standard Fallback Audit Output (No Gemini Key)
When the Gemini API key is missing or set to a placeholder, the backend runs the **Local Diagnostic Engine**. Expected values:
- **Opportunities Count**: ~3 to 8 recommendations based on scraped pages.
- **CRO Health Score**: Color-coded score (e.g., ~75/100).
- **KPI Metrics**: Dynamic lift based on standard DTC matrices.
- **Summary**: Contains *"Notice: Run in Local Diagnostic Mode..."* banner.

---

## 4. Testing Edge Cases

- [ ] **Non-Shopify URL**: Auditing a non-Shopify URL (e.g., `https://google.com`) should complete but will raise a detailed notice or proceed with fallback diagnostics.
- [ ] **Invalid/Offline Store**: Auditing a non-existent domain (e.g. `https://non-existent-shopify-store-url.myshopify.com`) returns a clean `422 Unprocessable Entity` with details: *"Failed to scrape primary store homepage. Ensure the store is public and accessible."*
- [ ] **Password Protected Stores**: Storefronts with password access will return a `403` or redirect pages. The scraper handles status codes properly and falls back gracefully.
- [ ] **CORS Security**: Attempting to query the backend endpoint from unauthorized domains returns a CORS origin block.
