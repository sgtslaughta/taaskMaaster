"""
Messaging API endpoints for TaaskMaaster.

This module contains FastAPI routes for messaging-related operations.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.logging import get_logger
from app.schemas.messaging import (
    ConversationListResponse,
    DirectMessageCreate,
    DirectMessageListResponse,
    DirectMessageResponse,
    MessageHistoryRequest,
    MessageReadRequest,
    OnlineUsersResponse,
    TaskChatMessageCreate,
    TaskChatMessageListResponse,
    TaskChatMessageResponse,
    TypingIndicatorRequest,
    UserStatusResponse,
    UserStatusUpdate,
)
from app.services.messaging_service import MessagingService, UserStatusService
from app.services.websocket_service import websocket_manager

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


# Direct Message endpoints
@router.post("/direct", response_model=DirectMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_direct_message(
    message_data: DirectMessageCreate,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Send a direct message to another user.
    
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
      "to_user_id": 456,
      "content": "Hey, can you review this task?",
      "content_type": "text",
      "thread_id": "optional-thread-id",
      "media_attachment_ids": [789, 790]
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        messaging_service = MessagingService(db)
        message = messaging_service.send_direct_message(
            from_user_id=user_id,
            to_user_id=message_data.to_user_id,
            content=message_data.content,
            content_type=message_data.content_type,
            thread_id=message_data.thread_id,
            media_attachment_ids=message_data.media_attachment_ids,
        )
        
        # Send real-time notification
        await websocket_manager.send_message(
            message_data.to_user_id,
            {
                "type": "direct_message",
                "message_id": message.id,
                "from_user_id": user_id,
                "from_username": user_data.get("username", "Unknown"),
                "content": message.content,
                "timestamp": message.created_at.isoformat(),
            }
        )
        
        logger.info(f"Sent direct message {message.id} from user {user_id} to user {message_data.to_user_id}")
        return message
        
    except ValueError as e:
        logger.warning(f"Failed to send direct message: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error sending direct message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/direct/{other_user_id}", response_model=DirectMessageListResponse)
async def get_direct_messages(
    other_user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get direct messages between current user and another user.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Query Parameters:**
    - skip: Number of messages to skip (pagination)
    - limit: Maximum number of messages to return
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        messaging_service = MessagingService(db)
        messages, total = messaging_service.get_direct_messages(
            user_id=user_id,
            other_user_id=other_user_id,
            skip=skip,
            limit=limit,
        )
        
        return DirectMessageListResponse(
            messages=messages,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Unexpected error getting direct messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get list of conversations for the current user.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Query Parameters:**
    - skip: Number of conversations to skip (pagination)
    - limit: Maximum number of conversations to return
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        messaging_service = MessagingService(db)
        conversations = messaging_service.get_user_conversations(
            user_id=user_id,
            skip=skip,
            limit=limit,
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=len(conversations)
        )
        
    except Exception as e:
        logger.error(f"Unexpected error getting conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Task Chat Message endpoints
@router.post("/task-chat", response_model=TaskChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_task_chat_message(
    message_data: TaskChatMessageCreate,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Send a message to a task's chat channel.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Request Body:**
    ```json
    {
      "task_id": 123,
      "content": "Just pushed the latest changes!",
      "content_type": "text",
      "parent_message_id": 456,
      "media_attachment_ids": [789]
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        messaging_service = MessagingService(db)
        message = messaging_service.send_task_chat_message(
            task_id=message_data.task_id,
            from_user_id=user_id,
            content=message_data.content,
            content_type=message_data.content_type,
            parent_message_id=message_data.parent_message_id,
            media_attachment_ids=message_data.media_attachment_ids,
        )
        
        # Get task participants for broadcasting
        from app.services.task_service import TaskService
        task_service = TaskService(db)
        participants = task_service.get_task_participants(message_data.task_id)
        
        # Remove sender from recipients
        recipients = [p for p in participants if p != user_id]
        
        # Send real-time notification to task participants
        await websocket_manager.broadcast_messages(
            recipients,
            {
                "type": "task_chat_message",
                "message_id": message.id,
                "task_id": message_data.task_id,
                "from_user_id": user_id,
                "from_username": user_data.get("username", "Unknown"),
                "content": message.content,
                "timestamp": message.created_at.isoformat(),
            }
        )
        
        logger.info(f"Sent task chat message {message.id} to task {message_data.task_id} by user {user_id}")
        return message
        
    except ValueError as e:
        logger.warning(f"Failed to send task chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error sending task chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/task-chat/{task_id}", response_model=TaskChatMessageListResponse)
async def get_task_chat_messages(
    task_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get chat messages for a specific task.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Query Parameters:**
    - skip: Number of messages to skip (pagination)
    - limit: Maximum number of messages to return
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        messaging_service = MessagingService(db)
        messages, total = messaging_service.get_task_chat_messages(
            task_id=task_id,
            user_id=user_id,
            skip=skip,
            limit=limit,
        )
        
        return TaskChatMessageListResponse(
            messages=messages,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except ValueError as e:
        logger.warning(f"Failed to get task chat messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error getting task chat messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Message Read Status endpoints
@router.post("/mark-read")
async def mark_messages_as_read(
    read_request: MessageReadRequest,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Mark messages as read.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Request Body:**
    ```json
    {
      "message_ids": [123, 456, 789]
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        messaging_service = MessagingService(db)
        success_count = 0
        
        for message_id in read_request.message_ids:
            try:
                # Try direct message first
                messaging_service.mark_direct_message_as_read(message_id, user_id)
                success_count += 1
            except ValueError:
                try:
                    # Try task chat message
                    messaging_service.mark_task_chat_message_as_read(message_id, user_id)
                    success_count += 1
                except ValueError:
                    logger.warning(f"Could not mark message {message_id} as read for user {user_id}")
        
        return {
            "message": f"Marked {success_count} messages as read",
            "success_count": success_count,
            "total_requested": len(read_request.message_ids)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error marking messages as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# User Status endpoints
@router.post("/users/status", response_model=UserStatusResponse)
async def update_user_status(
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Update user's online status.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Request Body:**
    ```json
    {
      "status": "online",
      "custom_message": "Working on project tasks"
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        status_service = UserStatusService(db)
        user_status = status_service.update_user_status(
            user_id=user_id,
            status=status_update.status,
            custom_message=status_update.custom_message,
        )
        
        # Broadcast status change via WebSocket
        await websocket_manager.update_user_status(user_id, status_update.status, db)
        
        logger.info(f"Updated status for user {user_id} to {status_update.status}")
        return user_status
        
    except Exception as e:
        logger.error(f"Unexpected error updating user status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/users/status/{user_id}", response_model=UserStatusResponse)
async def get_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get a user's current status.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    """
    user_data = get_user_data_from_header(x_user_data)
    
    try:
        status_service = UserStatusService(db)
        user_status = status_service.get_user_status(user_id)
        
        if not user_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Status for user {user_id} not found"
            )
        
        return user_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting user status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/users/online", response_model=OnlineUsersResponse)
async def get_online_users(
    limit: int = 100,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Get list of currently online users.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Query Parameters:**
    - limit: Maximum number of users to return
    """
    user_data = get_user_data_from_header(x_user_data)
    
    try:
        status_service = UserStatusService(db)
        online_users = status_service.get_online_users(limit=limit)
        
        return OnlineUsersResponse(
            online_users=online_users,
            total=len(online_users)
        )
        
    except Exception as e:
        logger.error(f"Unexpected error getting online users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Typing Indicator endpoint
@router.post("/typing")
async def send_typing_indicator(
    typing_request: TypingIndicatorRequest,
    db: Session = Depends(get_db),
    x_user_data: Optional[str] = Header(None)
):
    """
    Send typing indicator for real-time messaging.
    
    **Headers:**
    - X-User-Data: JSON containing user information
    
    **Request Body:**
    ```json
    {
      "context_type": "task_chat",
      "context_id": 123,
      "is_typing": true
    }
    ```
    """
    user_data = get_user_data_from_header(x_user_data)
    user_id = user_data["user_id"]
    
    try:
        await websocket_manager.handle_typing_indicator(
            user_id=user_id,
            context_type=typing_request.context_type,
            context_id=typing_request.context_id,
            is_typing=typing_request.is_typing,
            db=db
        )
        
        return {"message": "Typing indicator sent successfully"}
        
    except Exception as e:
        logger.error(f"Unexpected error sending typing indicator: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
