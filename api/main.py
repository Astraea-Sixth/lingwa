"""
Lingwa API — FastAPI backend
Port: 5003

Routes:
  /health            — health check
  /api/chat          — AI tutor conversation
  /api/languages     — list/get language configs
  /api/curriculum    — get lesson curriculum
  /api/tts           — text-to-speech (future: Kokoro ONNX)
  /api/evaluate      — LLM-based answer evaluation
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

# Import routers
from routers import chat, lessons, tts, stt

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────

app = FastAPI(
    title="Lingwa API",
    description="Open-source language learning with AI conversation",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Next.js frontend on port 3004
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins — local network + cloudflare tunnels
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Include routers
# ─────────────────────────────────────────────

app.include_router(chat.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(stt.router, prefix="/api")

# ─────────────────────────────────────────────
# Core routes
# ─────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from services.llm import get_llm_status
    llm_status = await get_llm_status()
    return {
        "status": "ok",
        "version": "0.1.0",
        "llm": llm_status,
    }


@app.get("/")
async def root():
    return {
        "name": "Lingwa API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


# ─────────────────────────────────────────────
# Exception handlers
# ─────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"error": "Not found", "path": str(request.url)})


@app.exception_handler(500)
async def server_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("API_PORT", "5003")),
        reload=True,
        log_level="info",
    )
