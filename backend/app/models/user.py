"""
User model for TaaskMaaster.

This module contains the User model for authentication and user management.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    """
    User model for authentication and user management.

    Attributes:
        id: Primary key
        username: Unique username
        email: Unique email address
        hashed_password: Hashed password
        full_name: User's full name
        is_active: Whether user account is active
        is_superuser: Whether user has superuser privileges
        created_at: Account creation timestamp
        updated_at: Last update timestamp
        profile_picture: URL to profile picture
        timezone: User's timezone
        preferences: JSON string of user preferences
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    profile_picture = Column(String(500), nullable=True)
    timezone = Column(String(50), default="UTC")
    preferences = Column(Text, nullable=True)  # JSON string

    # Relationships
    tasks = relationship(
        "Task",
        back_populates="assigned_to",
        foreign_keys="Task.assigned_to_id",
    )
    created_tasks = relationship(
        "Task", back_populates="created_by", foreign_keys="Task.created_by_id"
    )
    goals = relationship("Goal", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    points = relationship("Points", back_populates="user")

    def __repr__(self) -> str:
        """String representation of User."""
        return (
            f"<User(id={self.id}, username='{self.username}', "
            f"email='{self.email}')>"
        )
