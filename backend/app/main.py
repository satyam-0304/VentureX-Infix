from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import HealthResponse
from app.services.gemini import is_gemini_configured
from app.routes.chat import router as chat_router
from app.routes.quiz import router as quiz_router

app = FastAPI(
    title="Lurnix Tutor API",
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

# Register route modules
app.include_router(chat_router)
app.include_router(quiz_router)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Verify backend health and Gemini configuration status."""
    return HealthResponse(
        status="ok",
        service="lurnix-tutor-api",
        gemini_configured=is_gemini_configured(),
        environment=settings.environment,
    )


@app.get("/", tags=["System"])
async def root():
    """Root status greeting."""
    return {
        "message": "Lurnix Tutor API is running.",
        "docs": "/docs",
        "health": "/health",
    }

