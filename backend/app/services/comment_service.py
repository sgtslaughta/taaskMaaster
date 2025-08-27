"""
Comment service for TaaskMaaster.

This module contains business logic for task comments, direct messages,
task chat messages, and related functionality.
"""

from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session, joinedload

from app.core.logging import get_logger
from app.models.comment import (
    CommentMediaAttachment,
    DirectMessage,
    MessageReadReceipt,
    TaskChatMessage,
    TaskComment,
    TaskStatusHistory,
    UserStatus,
)
from app.models.media import MediaAttachment
from app.models.task import Task
from app.models.user import User

logger = get_logger(__name__)


class CommentService:
    """Service for managing task comments and related functionality."""

    def __init__(self, db: Session):
        """Initialize comment service with database session."""
        self.db = db

    # Task Comment methods
    def create_task_comment(
        self,
        task_id: int,
        user_id: int,
        content: str,
        content_type: str = "markdown",
        parent_comment_id: Optional[int] = None,
        is_system_comment: bool = False,
        media_attachment_ids: Optional[List[int]] = None,
    ) -> TaskComment:
        """
        Create a new task comment.

        Args:
            task_id: ID of the task to comment on
            user_id: ID of the user creating the comment
            content: Comment content
            content_type: Content format (markdown, html, text)
            parent_comment_id: Parent comment ID for replies
            is_system_comment: Whether this is a system-generated comment
            media_attachment_ids: List of media attachment IDs

        Returns:
            Created TaskComment instance

        Raises:
            ValueError: If task doesn't exist or user lacks permission
        """
        # Verify task exists and user has access
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        # Create comment
        comment = TaskComment(
            task_id=task_id,
            user_id=user_id,
            content=content,
            content_type=content_type,
            parent_comment_id=parent_comment_id,
            is_system_comment=is_system_comment,
        )

        self.db.add(comment)
        self.db.flush()  # Get the comment ID

        # Add media attachments if provided
        if media_attachment_ids:
            for media_id in media_attachment_ids:
                # Verify media attachment exists
                media = self.db.query(MediaAttachment).filter(
                    MediaAttachment.id == media_id
                ).first()
                if media:
                    attachment = CommentMediaAttachment(
                        comment_id=comment.id,
                        media_attachment_id=media_id
                    )
                    self.db.add(attachment)

        self.db.commit()
        self.db.refresh(comment)

        logger.info(
            f"Created task comment {comment.id} for task {task_id} by user {user_id}"
        )
        return comment

    def get_task_comments(
        self,
        task_id: int,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        include_system: bool = True,
    ) -> Tuple[List[TaskComment], int]:
        """
        Get comments for a task.

        Args:
            task_id: Task ID
            user_id: User ID for permission checking
            skip: Number of records to skip
            limit: Maximum number of records to return
            include_system: Whether to include system comments

        Returns:
            Tuple of (comments list, total count)
        """
        # Verify user has access to task
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        # Build query
        query = self.db.query(TaskComment).filter(TaskComment.task_id == task_id)

        if not include_system:
            query = query.filter(TaskComment.is_system_comment == False)

        # Get total count
        total = query.count()

        # Get comments with relationships
        comments = (
            query.options(
                joinedload(TaskComment.user),
                joinedload(TaskComment.media_attachments).joinedload(
                    CommentMediaAttachment.media_attachment
                ),
            )
            .order_by(TaskComment.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return comments, total

    def update_task_comment(
        self,
        comment_id: int,
        user_id: int,
        content: str,
        content_type: str = "markdown",
    ) -> TaskComment:
        """
        Update a task comment.

        Args:
            comment_id: Comment ID
            user_id: User ID (must be comment author)
            content: New content
            content_type: Content format

        Returns:
            Updated TaskComment instance

        Raises:
            ValueError: If comment not found or user lacks permission
        """
        comment = self.db.query(TaskComment).filter(
            TaskComment.id == comment_id
        ).first()

        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        if comment.user_id != user_id:
            raise ValueError("Only comment author can edit comment")

        comment.content = content
        comment.content_type = content_type
        comment.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(comment)

        logger.info(f"Updated comment {comment_id} by user {user_id}")
        return comment

    def delete_task_comment(
        self,
        comment_id: int,
        user_id: int,
    ) -> bool:
        """
        Delete a task comment.

        Args:
            comment_id: Comment ID
            user_id: User ID (must be comment author or task owner)

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If comment not found or user lacks permission
        """
        comment = (
            self.db.query(TaskComment)
            .options(joinedload(TaskComment.task))
            .filter(TaskComment.id == comment_id)
            .first()
        )

        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        # Check if user can delete (author or task creator)
        if comment.user_id != user_id and comment.task.created_by_id != user_id:
            raise ValueError("Insufficient permissions to delete comment")

        self.db.delete(comment)
        self.db.commit()

        logger.info(f"Deleted comment {comment_id} by user {user_id}")
        return True

    def get_comment_by_id(
        self,
        comment_id: int,
        user_id: int,
    ) -> Optional[TaskComment]:
        """
        Get a comment by ID.

        Args:
            comment_id: Comment ID
            user_id: User ID for permission checking

        Returns:
            TaskComment instance or None
        """
        comment = (
            self.db.query(TaskComment)
            .options(
                joinedload(TaskComment.user),
                joinedload(TaskComment.task),
                joinedload(TaskComment.media_attachments).joinedload(
                    CommentMediaAttachment.media_attachment
                ),
            )
            .filter(TaskComment.id == comment_id)
            .first()
        )

        if not comment:
            return None

        # Verify user has access to the task
        if not self._user_has_task_access(comment.task_id, user_id):
            return None

        return comment

    def add_comment_media_attachment(
        self,
        comment_id: int,
        media_attachment_id: int,
        user_id: int,
    ) -> CommentMediaAttachment:
        """
        Add media attachment to a comment.

        Args:
            comment_id: Comment ID
            media_attachment_id: Media attachment ID
            user_id: User ID (must be comment author)

        Returns:
            Created CommentMediaAttachment instance

        Raises:
            ValueError: If comment not found or user lacks permission
        """
        comment = self.db.query(TaskComment).filter(
            TaskComment.id == comment_id
        ).first()

        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        if comment.user_id != user_id:
            raise ValueError("Only comment author can add attachments")

        # Verify media attachment exists
        media = self.db.query(MediaAttachment).filter(
            MediaAttachment.id == media_attachment_id
        ).first()
        if not media:
            raise ValueError(f"Media attachment {media_attachment_id} not found")

        # Check if attachment already exists
        existing = self.db.query(CommentMediaAttachment).filter(
            and_(
                CommentMediaAttachment.comment_id == comment_id,
                CommentMediaAttachment.media_attachment_id == media_attachment_id,
            )
        ).first()

        if existing:
            return existing

        attachment = CommentMediaAttachment(
            comment_id=comment_id,
            media_attachment_id=media_attachment_id,
        )

        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)

        logger.info(
            f"Added media attachment {media_attachment_id} to comment {comment_id}"
        )
        return attachment

    def remove_comment_media_attachment(
        self,
        comment_id: int,
        media_attachment_id: int,
        user_id: int,
    ) -> bool:
        """
        Remove media attachment from a comment.

        Args:
            comment_id: Comment ID
            media_attachment_id: Media attachment ID
            user_id: User ID (must be comment author)

        Returns:
            True if removed successfully

        Raises:
            ValueError: If comment not found or user lacks permission
        """
        comment = self.db.query(TaskComment).filter(
            TaskComment.id == comment_id
        ).first()

        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        if comment.user_id != user_id:
            raise ValueError("Only comment author can remove attachments")

        attachment = self.db.query(CommentMediaAttachment).filter(
            and_(
                CommentMediaAttachment.comment_id == comment_id,
                CommentMediaAttachment.media_attachment_id == media_attachment_id,
            )
        ).first()

        if attachment:
            self.db.delete(attachment)
            self.db.commit()
            logger.info(
                f"Removed media attachment {media_attachment_id} from comment {comment_id}"
            )

        return True

    def _user_has_task_access(self, task_id: int, user_id: int) -> bool:
        """
        Check if user has access to a task.

        Args:
            task_id: Task ID
            user_id: User ID

        Returns:
            True if user has access
        """
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False

        # User has access if they are the creator, assignee, or admin
        return (
            task.created_by_id == user_id
            or task.assigned_to_id == user_id
            # TODO: Add admin role check
        )

    def create_system_comment(
        self,
        task_id: int,
        content: str,
        user_id: Optional[int] = None,
    ) -> TaskComment:
        """
        Create a system-generated comment for workflow changes.

        Args:
            task_id: Task ID
            content: System comment content
            user_id: Optional user ID who triggered the change

        Returns:
            Created TaskComment instance
        """
        # Use system user ID if no user provided
        if user_id is None:
            # TODO: Get system user ID or use a default
            user_id = 1  # Temporary - use admin user

        return self.create_task_comment(
            task_id=task_id,
            user_id=user_id,
            content=content,
            content_type="text",
            is_system_comment=True,
        )
