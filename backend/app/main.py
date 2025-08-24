"""
Main FastAPI application for TaaskMaaster.

This module contains the main FastAPI application with health checks,
monitoring, and basic API endpoints.
"""

import time
from typing import Any, Dict

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.core.logging import configure_logging, get_logger
from app.core.monitoring import MetricsMiddleware, get_health_status, get_metrics

# Configure logging
configure_logging()
logger = get_logger(__name__)

# Create FastAPI application
fastapi_app = FastAPI(
    title="TaaskMaaster API",
    description="A comprehensive task management system for families",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add FastAPI middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
fastapi_app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "taaskmaaster-backend"],
)


@fastapi_app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    start_time = time.time()

    # Log request
    logger.info(
        "Incoming request",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # Process request
    response = await call_next(request)

    # Calculate response time
    response_time = time.time() - start_time

    # Log response
    logger.info(
        "Response sent",
        status_code=response.status_code,
        response_time=response_time,
        content_length=response.headers.get("content-length"),
    )

    # Add response time header
    response.headers["X-Response-Time"] = str(response_time)

    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"

    return response


# Create the final app with ASGI middleware
app = MetricsMiddleware(fastapi_app)


@fastapi_app.get("/")
async def root() -> Dict[str, Any]:
    """
    Root endpoint providing basic API information.

    Returns:
        Dictionary containing API information
    """
    return {
        "message": "Welcome to TaaskMaaster API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@fastapi_app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for monitoring.

    Returns:
        Dictionary containing health status information
    """
    return get_health_status()


@fastapi_app.get("/metrics")
async def metrics() -> Response:
    """
    Prometheus metrics endpoint.

    Returns:
        Prometheus metrics in text format
    """
    return Response(content=get_metrics(), media_type="text/plain")


@fastapi_app.get("/api/v1/status")
async def api_status() -> Dict[str, Any]:
    """
    API status endpoint for versioned API.

    Returns:
        Dictionary containing API status information
    """
    return {
        "api_version": "v1",
        "status": "healthy",
        "timestamp": time.time(),
        "features": [
            "task_management",
            "user_management",
            "gamification",
            "file_storage",
        ],
    }


@fastapi_app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle 404 errors."""
    logger.warning("404 error", path=request.url.path, method=request.method)
    return JSONResponse(status_code=404, content={"detail": "Endpoint not found"})


@fastapi_app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle 500 errors."""
    logger.error(
        "Internal server error",
        path=request.url.path,
        method=request.method,
        error=str(exc),
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# Startup event
@fastapi_app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("TaaskMaaster API starting up")

    # Initialize services here
    # await initialize_database()
    # await initialize_redis()
    # await initialize_minio()

    logger.info("TaaskMaaster API startup complete")


# Shutdown event
@fastapi_app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("TaaskMaaster API shutting down")

    # Cleanup services here
    # await cleanup_database()
    # await cleanup_redis()
    # await cleanup_minio()

    logger.info("TaaskMaaster API shutdown complete")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info"
    )
