#!/usr/bin/env python3
"""
Script to create a test user for TaaskMaaster.

This script creates a test user with admin privileges for development and testing.
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import get_db_session
from app.schemas.user import UserCreate
from app.services.user_service import UserService


def create_test_user():
    """Create a test user with admin privileges."""

    # Test user data
    test_user_data = UserCreate(
        username="admin",
        email="admin@taaskmaaster.com",
        full_name="Administrator",
        password="admin123",
        timezone="UTC",
    )

    try:
        # Get database session
        db = next(get_db_session())
        user_service = UserService(db)

        # Check if user already exists
        existing_user = user_service.get_user_by_username(
            test_user_data.username
        )
        if existing_user:
            print(f"User '{test_user_data.username}' already exists.")
            return

        # Create the user
        user = user_service.create_user(test_user_data)

        # Make the user a superuser
        user.is_superuser = True
        user.is_active = True
        db.commit()

        print("✅ Test user created successfully!")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Full Name: {user.full_name}")
        print(f"   Is Superuser: {user.is_superuser}")
        print(f"   Is Active: {user.is_active}")
        print(f"   User ID: {user.id}")
        print()
        print("You can now use these credentials to log in:")
        print(f"   Username: {user.username}")
        print(f"   Password: {test_user_data.password}")

    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating test user for TaaskMaaster...")
    create_test_user()
