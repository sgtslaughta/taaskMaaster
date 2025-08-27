"""
Database models for TaaskMaaster.

This package contains all SQLAlchemy models for the application.
"""

from .comment import (
    CommentMediaAttachment,
    DirectMessage,
    DirectMessageMedia,
    MessageReadReceipt,
    TaskChatMessage,
    TaskChatMessageMedia,
    TaskComment,
    TaskStatusHistory,
    UserStatus,
)
from .gamification import Achievement, Leaderboard, Points, UserAchievement
from .goal import Goal, GoalProgress
from .media import MediaAttachment
from .task import Task, TaskCategory, TaskDependency, TaskTag, TaskTemplate
from .user import User

__all__ = [
    "User",
    "Task",
    "TaskTemplate",
    "TaskCategory",
    "TaskTag",
    "TaskDependency",
    "Goal",
    "GoalProgress",
    "Achievement",
    "UserAchievement",
    "Points",
    "Leaderboard",
    "MediaAttachment",
    # New comment and messaging models
    "TaskComment",
    "TaskStatusHistory",
    "CommentMediaAttachment",
    "DirectMessage",
    "TaskChatMessage",
    "MessageReadReceipt",
    "DirectMessageMedia",
    "TaskChatMessageMedia",
    "UserStatus",
]
