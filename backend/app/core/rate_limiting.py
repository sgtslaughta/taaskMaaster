"""
Rate limiting middleware for TaaskMaaster.

This module provides rate limiting functionality using Redis to prevent
API abuse and ensure fair usage of the application.
"""

import os
import time
from typing import Callable, Optional

from fastapi import HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.services.redis_service import redis_service

logger = get_logger(__name__)


class RateLimiter:
    """
    Rate limiter middleware for API endpoints.
    
    Provides different rate limiting strategies:
    - IP-based rate limiting
    - User-based rate limiting
    - Endpoint-specific rate limiting
    """

    def __init__(self):
        """Initialize rate limiter with default configurations."""
        # Check if we're in development mode
        is_development = os.getenv("ENVIRONMENT", "development") == "development"
        
        # Default rate limits (requests per window)
        # Much more lenient in development mode
        if is_development:
            self.default_limits = {
                "auth": {"max_requests": 100, "window": 300},    # 100 requests per 5 minutes
                "api": {"max_requests": 1000, "window": 60},     # 1000 requests per minute
                "upload": {"max_requests": 100, "window": 300},  # 100 uploads per 5 minutes
                "admin": {"max_requests": 5000, "window": 60},   # 5000 requests per minute
            }
        else:
            self.default_limits = {
                "auth": {"max_requests": 20, "window": 300},     # 20 requests per 5 minutes
                "api": {"max_requests": 200, "window": 60},      # 200 requests per minute
                "upload": {"max_requests": 20, "window": 300},   # 20 uploads per 5 minutes
                "admin": {"max_requests": 1000, "window": 60},   # 1000 requests per minute
            }

    def get_client_identifier(self, request: Request) -> str:
        """
        Get unique identifier for rate limiting.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Unique identifier string
        """
        # Try to get user ID from request if authenticated
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return f"ip:{real_ip}"
        
        # Use client host
        return f"ip:{request.client.host}"

    def get_rate_limit_config(self, path: str) -> dict:
        """
        Get rate limit configuration for a specific path.
        
        Args:
            path: Request path
            
        Returns:
            Rate limit configuration dictionary
        """
        # Auth endpoints
        if path.startswith("/api/v1/auth"):
            return self.default_limits["auth"]
        
        # Upload endpoints
        if "/upload" in path or "/media" in path:
            return self.default_limits["upload"]
        
        # Admin endpoints (if implemented)
        if path.startswith("/api/v1/admin"):
            return self.default_limits["admin"]
        
        # Default API rate limit
        return self.default_limits["api"]

    async def check_rate_limit(self, request: Request) -> dict:
        """
        Check rate limit for the current request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Rate limit status dictionary
        """
        identifier = self.get_client_identifier(request)
        config = self.get_rate_limit_config(request.url.path)
        
        return redis_service.check_rate_limit(
            identifier=identifier,
            max_requests=config["max_requests"],
            window=config["window"]
        )

    def create_rate_limit_response(self, rate_limit_status: dict) -> JSONResponse:
        """
        Create rate limit exceeded response.
        
        Args:
            rate_limit_status: Rate limit status from Redis
            
        Returns:
            JSONResponse with rate limit information
        """
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded",
                "retry_after": rate_limit_status["reset"] - int(time.time()),
                "limit_reset": rate_limit_status["reset"]
            },
            headers={
                "X-RateLimit-Limit": str(rate_limit_status.get("limit", 0)),
                "X-RateLimit-Remaining": str(rate_limit_status.get("remaining", 0)),
                "X-RateLimit-Reset": str(rate_limit_status.get("reset", 0)),
                "Retry-After": str(rate_limit_status["reset"] - int(time.time()))
            }
        )


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next: Callable) -> Response:
    """
    Rate limiting middleware for FastAPI.
    
    Args:
        request: FastAPI request object
        call_next: Next middleware or endpoint handler
        
    Returns:
        FastAPI response
        
    Raises:
        HTTPException: If rate limit is exceeded
    """
    # Check if we're in development mode
    is_development = os.getenv("ENVIRONMENT", "development") == "development"
    
    # Skip rate limiting for health checks, metrics, and CORS preflight requests
    skip_paths = ["/health", "/metrics", "/docs", "/redoc", "/openapi.json"]
    if request.url.path in skip_paths or request.method == "OPTIONS":
        return await call_next(request)
    
    # Optionally disable rate limiting in development mode
    if os.getenv("DISABLE_RATE_LIMITING", "false").lower() == "true":
        return await call_next(request)
    
    # In development mode, completely bypass rate limiting for login attempts
    if is_development and request.url.path.startswith("/api/v1/auth/login") and request.method == "POST":
        if os.getenv("DISABLE_LOGIN_RATE_LIMIT", "true").lower() == "true":
            return await call_next(request)
    
    # Skip rate limiting for initial setup and development
    if request.url.path.startswith("/api/v1/auth/login") and request.method == "POST":
        # Allow much more lenient rate limiting for login attempts in development
        rate_limit_status = await rate_limiter.check_rate_limit(request)
        if is_development:
            # In development, allow at least 20 login attempts
            if rate_limit_status["remaining"] < 20:
                logger.warning(
                    "Login rate limit exceeded (development)",
                    identifier=rate_limiter.get_client_identifier(request),
                    path=request.url.path,
                    method=request.method,
                    remaining=rate_limit_status["remaining"]
                )
                return rate_limiter.create_rate_limit_response(rate_limit_status)
        else:
            # In production, allow at least 10 login attempts
            if rate_limit_status["remaining"] < 10:
                logger.warning(
                    "Login rate limit exceeded (production)",
                    identifier=rate_limiter.get_client_identifier(request),
                    path=request.url.path,
                    method=request.method,
                    remaining=rate_limit_status["remaining"]
                )
                return rate_limiter.create_rate_limit_response(rate_limit_status)
    else:
        # Check rate limit for other requests
        rate_limit_status = await rate_limiter.check_rate_limit(request)
        
        if not rate_limit_status["allowed"]:
            logger.warning(
                "Rate limit exceeded",
                identifier=rate_limiter.get_client_identifier(request),
                path=request.url.path,
                method=request.method
            )
            return rate_limiter.create_rate_limit_response(rate_limit_status)
    
    # Add rate limit headers to response
    response = await call_next(request)
    
    # Get final rate limit status for headers
    final_rate_limit_status = await rate_limiter.check_rate_limit(request)
    response.headers["X-RateLimit-Limit"] = str(final_rate_limit_status.get("limit", 0))
    response.headers["X-RateLimit-Remaining"] = str(final_rate_limit_status.get("remaining", 0))
    response.headers["X-RateLimit-Reset"] = str(final_rate_limit_status.get("reset", 0))
    
    return response


def get_rate_limit_status(request: Request) -> dict:
    """
    Get current rate limit status for debugging/monitoring.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Rate limit status dictionary
    """
    identifier = rate_limiter.get_client_identifier(request)
    config = rate_limiter.get_rate_limit_config(request.url.path)
    
    return {
        "identifier": identifier,
        "path": request.url.path,
        "method": request.method,
        "limit_config": config,
        "current_status": redis_service.check_rate_limit(
            identifier=identifier,
            max_requests=config["max_requests"],
            window=config["window"]
        )
    }
