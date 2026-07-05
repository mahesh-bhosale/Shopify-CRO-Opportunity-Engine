from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import audit, experiment

app = FastAPI(title="Shopify CRO Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit.router, prefix="/api")
app.include_router(experiment.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
