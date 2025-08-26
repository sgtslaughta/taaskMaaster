"""
API package for TaaskMaaster.

This package contains all API endpoints and routers.
"""

from .auth import router as auth_router
from .gamification import router as gamification_router
from .goals import router as goals_router
from .media import router as media_router
from .redis import router as redis_router
from .tasks import router as tasks_router
from .users import router as users_router

__all__ = [
    "auth_router",
    "tasks_router",
    "goals_router",
    "gamification_router",
    "media_router",
    "users_router",
]
