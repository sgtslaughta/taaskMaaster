"""
Notification API endpoints for TaaskMaaster.

This module contains FastAPI routes for notification-related operations.
"""

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.logging import get_logger
from app.schemas.notification import (
    NotificationGetRequest,
    NotificationListResponse,
    NotificationMarkReadRequest,
    NotificationMarkReadResponse,
    NotificationDeleteRequest,
    NotificationDeleteResponse,
    NotificationStatsResponse,
)
from app.services.notification_persistence_service import NotificationPersistenceService

logger = get_logger(__name__)

router = APIRouter()


def get_user_data_from_header(x_user_data: Optional[str] = Header(None)) -> dict:
    """
    Extract user data from X-User-Data header.
    
    Args:
        x_user_data: JSON string containing user data
        
    Returns:
        Dictionary with user data
        
    Raises:
        HTTPException: If header is missing or invalid
    """
    if not x_user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Data header is required"
        )
    
    try:
        user_data = json.loads(x_user_data)
        if 'user_id' not in user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required in X-User-Data header"
            )
        return user_data
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in X-User-Data header"
        )


@router.post("/", response_model=NotificationListResponse)
async def get_notifications(
    request_data: NotificationGetRequest,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get notifications for the current user.
    
    **Headers:**
    - X-User-Data: JSON containing user information
      ```json
      {
        "user_id": 123,
        "username": "john_doe",
        "role": "user"
      }
      ```
    
    **Request Body:**
    ```json
    {
        "skip": 0,
        "limit": 50,
        "unread_only": false,
        "notification_types": ["task_comment", "task_assigned"]
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        notification_service = NotificationPersistenceService(db)
        result = notification_service.get_user_notifications(
            user_id=user_id,
            skip=request_data.skip,
            limit=request_data.limit,
            unread_only=request_data.unread_only,
            notification_types=request_data.notification_types
        )
        
        logger.info(f"Retrieved {len(result['notifications'])} notifications for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving notifications for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/mark-read", response_model=NotificationMarkReadResponse)
async def mark_notifications_read(
    request_data: NotificationMarkReadRequest,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Mark notifications as read.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Request Body:**
    ```json
    {
        "notification_ids": [1, 2, 3]
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        notification_service = NotificationPersistenceService(db)
        marked_count = notification_service.mark_notifications_read(
            user_id=user_id,
            notification_ids=request_data.notification_ids
        )
        
        logger.info(f"Marked {marked_count} notifications as read for user {user_id}")
        return {
            "marked_read": marked_count,
            "success": True
        }
        
    except ValueError as e:
        logger.warning(f"Invalid request to mark notifications read: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error marking notifications read for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/delete", response_model=NotificationDeleteResponse)
async def delete_notifications(
    request_data: NotificationDeleteRequest,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Delete notifications.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Request Body:**
    ```json
    {
        "notification_ids": [1, 2, 3]
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        notification_service = NotificationPersistenceService(db)
        deleted_count = notification_service.delete_notifications(
            user_id=user_id,
            notification_ids=request_data.notification_ids
        )
        
        logger.info(f"Deleted {deleted_count} notifications for user {user_id}")
        return {
            "deleted": deleted_count,
            "success": True
        }
        
    except ValueError as e:
        logger.warning(f"Invalid request to delete notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting notifications for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/stats", response_model=NotificationStatsResponse)
async def get_notification_stats(
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get notification statistics for the current user.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        notification_service = NotificationPersistenceService(db)
        stats = notification_service.get_notification_stats(user_id)
        
        logger.info(f"Retrieved notification stats for user {user_id}")
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving notification stats for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/mark-all-read", response_model=NotificationMarkReadResponse)
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Mark all notifications as read for the current user.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        notification_service = NotificationPersistenceService(db)
        marked_count = notification_service.mark_all_notifications_read(user_id)
        
        logger.info(f"Marked all {marked_count} notifications as read for user {user_id}")
        return {
            "marked_read": marked_count,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error marking all notifications read for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
