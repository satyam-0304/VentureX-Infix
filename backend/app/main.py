from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import HealthResponse
from app.services.gemini import is_gemini_configured

app = FastAPI(
    title="InSitu Tutor API",
    description="Contextual, grounded in-situ learning companion for video lectures.",
    version="1.0.0",
)

# Configure CORS for Next.js frontend (local & production Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.environment == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Verify backend health and Gemini configuration status."""
    return HealthResponse(
        status="ok",
        service="insitu-tutor-api",
        gemini_configured=is_gemini_configured(),
        environment=settings.environment,
    )


@app.get("/", tags=["System"])
async def root():
    """Root status greeting."""
    return {
        "message": "InSitu Tutor API is running.",
        "docs": "/docs",
        "health": "/health",
    }

