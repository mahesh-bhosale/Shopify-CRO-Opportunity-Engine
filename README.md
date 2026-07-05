# Shopify CRO Opportunity Engine

A monorepo application for analyzing Shopify stores and identifying Conversion Rate Optimization (CRO) opportunities using AI-powered analysis.

## Architecture

This is a monorepo with two main applications:

- **Backend**: FastAPI-based Python service for scraping, parsing, and analyzing Shopify stores
- **Frontend**: Next.js 14 application with TypeScript and Tailwind CSS for the user interface

## Project Structure

```
Shopify-CRO-Opportunity-Engine/
  backend/
    app/
      main.py              # FastAPI application entry point
      config.py            # Configuration using pydantic-settings
      models.py            # Pydantic models for request/response
      routers/
        audit.py           # Audit endpoints
        experiment.py      # Experiment brief endpoints (stub)
      services/
        scraper.py         # Web scraping service
        parser.py          # HTML parsing service
        gemini.py          # Google Gemini AI integration
        scorer.py          # Opportunity scoring algorithm
      utils/
        helpers.py         # Utility functions
    requirements.txt       # Python dependencies
    .env.example          # Environment variables template

  frontend/
    app/
      page.tsx             # Landing page
      results/
        page.tsx           # Results display page
      components/
        UrlForm.tsx        # URL input form
        ResultsTable.tsx   # Results table component
        OpportunityCard.tsx # Individual opportunity card
        LoadingState.tsx   # Loading animation
        ScoreBadge.tsx     # Score display badge
        ExperimentBrief.tsx # Experiment brief component (stub)
    lib/
      api.ts              # API client functions
      types.ts            # TypeScript type definitions
    package.json          # Node.js dependencies
    .env.local.example    # Frontend environment variables

  README.md
  .gitignore
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Add your Google Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

6. Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.local.example`:
```bash
cp .env.local.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Returns `{"status": "ok"}`

### Audit
- `POST /api/audit` - Run a CRO audit on a Shopify store
  - Request body: `{"url": "https://store.com", "competitor_url": "https://competitor.com"}`
  - Returns: `AuditResponse` with opportunities and summary
- `GET /api/audit/status` - Check if audit service is ready

### Experiment
- `GET /api/experiment/brief/{opportunity_id}` - Get experiment brief for an opportunity

## Features

- **Automated Store Analysis**: Scrapes and analyzes Shopify store pages
- **AI-Powered Insights**: Uses Google Gemini to identify CRO opportunities
- **Prioritized Recommendations**: Opportunities scored by impact, confidence, and effort
- **Experiment Briefs**: Suggested A/B test setups for each opportunity
- **Competitor Comparison**: Optional competitor analysis (bonus feature)

## Development Notes

- The backend currently returns dummy data in the audit endpoint. Integration with actual scraping and Gemini services is implemented but requires proper API keys and testing.
- The experiment router is a stub and can be expanded with full A/B test management features.
- Frontend uses Next.js 14 App Router with TypeScript for type safety.
- Tailwind CSS is used for styling with a modern, clean UI.

## License

MIT