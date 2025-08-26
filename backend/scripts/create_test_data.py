#!/usr/bin/env python3
"""
Test Data Generation Script for TaaskMaaster

This script creates comprehensive test data including:
- Users with different roles
- Task categories with colors and icons
- Task templates with various configurations
- Tasks with different statuses, priorities, and reward types
- Task lists and associations

Usage:
    python create_test_data.py
"""

import sys
import os
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.user import User
from app.models.task import (
    Task, TaskCategory, TaskTemplate, TaskList, TaskListAssociation,
    TaskPriority, TaskStatus, RewardType
)
from app.models.gamification import Points, PointsType
from app.schemas.user import UserCreate
from app.schemas.task import (
    TaskCreate, TaskCategoryCreate, TaskTemplateCreate, TaskListCreate
)
from app.services.user_service import UserService
from app.services.task_service import TaskService


class TestDataGenerator:
    """Test data generator for TaaskMaaster"""

    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
        self.task_service = TaskService(db)
        self.users: List[User] = []
        self.categories: List[TaskCategory] = []
        self.templates: List[TaskTemplate] = []
        self.tasks: List[Task] = []
        self.lists: List[TaskList] = []

    def create_users(self) -> None:
        """Create test users with different roles"""
        print("Creating users...")
        
        user_data = [
            {
                "username": "admin",
                "email": "admin@taaskmaaster.com",
                "full_name": "Admin User",
                "is_active": True,
                "is_superuser": True
            },
            {
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "is_superuser": False
            },
            {
                "username": "jane_smith",
                "email": "jane@example.com",
                "full_name": "Jane Smith",
                "is_active": True,
                "is_superuser": False
            },
            {
                "username": "bob_wilson",
                "email": "bob@example.com",
                "full_name": "Bob Wilson",
                "is_active": True,
                "is_superuser": False
            },
            {
                "username": "alice_brown",
                "email": "alice@example.com",
                "full_name": "Alice Brown",
                "is_active": True,
                "is_superuser": False
            }
        ]

        for user_info in user_data:
            # Check if user already exists
            existing_user = self.user_service.get_user_by_username(user_info["username"])
            if existing_user:
                print(f"  User already exists: {existing_user.username} ({existing_user.email})")
                self.users.append(existing_user)
                continue
            
            user_create = UserCreate(
                username=user_info["username"],
                email=user_info["email"],
                full_name=user_info["full_name"],
                password="password123",
                is_active=user_info["is_active"],
                is_superuser=user_info["is_superuser"]
            )
            
            user = self.user_service.create_user(user_create)
            self.users.append(user)
            
            # Create initial points record for user
            initial_points = Points(
                user_id=user.id,
                points_type=PointsType.BONUS,
                amount=random.randint(100, 1000),
                description="Initial points bonus"
            )
            self.db.add(initial_points)
            
            print(f"  Created user: {user.username} ({user.email})")

        self.db.commit()
        print(f"Total users available: {len(self.users)}")

    def create_categories(self) -> None:
        """Create task categories with colors and icons"""
        print("Creating categories...")
        
        category_data = [
            {"name": "Chores", "color": "#3B82F6", "icon": "🧹", "description": "Household chores and cleaning tasks"},
            {"name": "Homework", "color": "#10B981", "icon": "📚", "description": "Academic assignments and study tasks"},
            {"name": "Work", "color": "#F59E0B", "icon": "💼", "description": "Professional and work-related tasks"},
            {"name": "Shopping", "color": "#EF4444", "icon": "🛒", "description": "Shopping and errand tasks"},
            {"name": "Health", "color": "#8B5CF6", "icon": "🏃", "description": "Health and fitness activities"},
            {"name": "Social", "color": "#EC4899", "icon": "👥", "description": "Social activities and events"},
            {"name": "Projects", "color": "#06B6D4", "icon": "🔧", "description": "Personal and professional projects"},
            {"name": "Learning", "color": "#84CC16", "icon": "🎓", "description": "Learning and skill development"}
        ]

        for cat_info in category_data:
            category_create = TaskCategoryCreate(
                name=cat_info["name"],
                description=cat_info["description"],
                color=cat_info["color"],
                icon=cat_info["icon"]
            )
            
            category = self.task_service.create_category(category_create, self.users[0].id)
            self.categories.append(category)
            print(f"  Created category: {category.name}")

        self.db.commit()
        print(f"Created {len(self.categories)} categories")

    def create_templates(self) -> None:
        """Create task templates with various configurations"""
        print("Creating templates...")
        
        template_data = [
            {
                "name": "Daily Chore Template",
                "description": "Template for daily household chores",
                "title_pattern": "Clean {room}",
                "description_template": "Clean and organize the {room} area",
                "estimated_hours": 0.5,
                "points": 10,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Chores",
                "tags": ["daily", "cleaning", "household"],
                "is_public": True
            },
            {
                "name": "Homework Assignment",
                "description": "Template for academic homework assignments",
                "title_pattern": "Complete {subject} homework",
                "description_template": "Complete the assigned homework for {subject} class",
                "estimated_hours": 2.0,
                "points": 25,
                "priority": TaskPriority.HIGH,
                "category_name": "Homework",
                "tags": ["academic", "study", "assignment"],
                "is_public": True
            },
            {
                "name": "Shopping Trip",
                "description": "Template for shopping and errand tasks",
                "title_pattern": "Buy {items}",
                "description_template": "Purchase {items} from the store",
                "estimated_hours": 1.0,
                "points": 15,
                "priority": TaskPriority.LOW,
                "category_name": "Shopping",
                "tags": ["shopping", "errands", "purchase"],
                "is_public": True
            },
            {
                "name": "Work Meeting",
                "description": "Template for work-related meetings",
                "title_pattern": "Attend {meeting_type} meeting",
                "description_template": "Participate in {meeting_type} meeting with team",
                "estimated_hours": 1.5,
                "points": 20,
                "priority": TaskPriority.HIGH,
                "category_name": "Work",
                "tags": ["work", "meeting", "professional"],
                "is_public": False
            },
            {
                "name": "Exercise Routine",
                "description": "Template for fitness and exercise activities",
                "title_pattern": "Complete {exercise_type} workout",
                "description_template": "Perform {exercise_type} workout routine",
                "estimated_hours": 0.75,
                "points": 30,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Health",
                "tags": ["fitness", "exercise", "health"],
                "is_public": True
            },
            {
                "name": "Project Milestone",
                "description": "Template for project milestone tasks",
                "title_pattern": "Complete {milestone_name} milestone",
                "description_template": "Finish the {milestone_name} milestone for the project",
                "estimated_hours": 4.0,
                "points": 50,
                "priority": TaskPriority.URGENT,
                "category_name": "Projects",
                "tags": ["project", "milestone", "deadline"],
                "is_public": False
            },
            {
                "name": "Social Event",
                "description": "Template for social activities and events",
                "title_pattern": "Attend {event_type}",
                "description_template": "Participate in {event_type} event",
                "estimated_hours": 3.0,
                "points": 20,
                "priority": TaskPriority.LOW,
                "category_name": "Social",
                "tags": ["social", "event", "fun"],
                "is_public": True
            },
            {
                "name": "Learning Session",
                "description": "Template for learning and skill development",
                "title_pattern": "Study {topic}",
                "description_template": "Learn and practice {topic}",
                "estimated_hours": 2.5,
                "points": 35,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Learning",
                "tags": ["learning", "study", "skill"],
                "is_public": True
            }
        ]

        for template_info in template_data:
            # Find the category
            category = next((cat for cat in self.categories if cat.name == template_info["category_name"]), None)
            
            template_create = TaskTemplateCreate(
                name=template_info["name"],
                description=template_info["description"],
                title_pattern=template_info["title_pattern"],
                description_template=template_info["description_template"],
                estimated_hours=template_info["estimated_hours"],
                points=template_info["points"],
                priority=template_info["priority"],
                category_id=category.id if category else None,
                tags=template_info["tags"],
                is_public=template_info["is_public"]
            )
            
            template = self.task_service.create_task_template(template_create, self.users[0].id)
            self.templates.append(template)
            print(f"  Created template: {template.name}")

        self.db.commit()
        print(f"Created {len(self.templates)} templates")

    def create_tasks(self) -> None:
        """Create tasks with various statuses, priorities, and reward types"""
        print("Creating tasks...")
        
        task_data = [
            # Completed tasks
            {
                "title": "Clean Kitchen",
                "description": "Wash dishes, wipe counters, sweep floor",
                "status": TaskStatus.DONE,
                "priority": TaskPriority.HIGH,
                "category_name": "Chores",
                "assigned_to": "john_doe",
                "created_by": "jane_smith",
                "due_date": datetime.now() - timedelta(days=1),
                "completed_at": datetime.now() - timedelta(hours=2),
                "estimated_hours": 0.5,
                "actual_hours": 0.75,
                "points": 10,
                "reward_type": RewardType.POINTS,
                "reward_value": 10,
                "reward_description": None
            },
            {
                "title": "Complete Math Homework",
                "description": "Finish algebra problems 1-20",
                "status": TaskStatus.DONE,
                "priority": TaskPriority.HIGH,
                "category_name": "Homework",
                "assigned_to": "john_doe",
                "created_by": "john_doe",
                "due_date": datetime.now() - timedelta(days=2),
                "completed_at": datetime.now() - timedelta(days=1),
                "estimated_hours": 2.0,
                "actual_hours": 1.5,
                "points": 25,
                "reward_type": RewardType.MONETARY,
                "reward_value": 5.00,
                "reward_description": None
            },
            {
                "title": "Buy Groceries",
                "description": "Purchase milk, bread, eggs, and vegetables",
                "status": TaskStatus.DONE,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Shopping",
                "assigned_to": "jane_smith",
                "created_by": "jane_smith",
                "due_date": datetime.now() - timedelta(days=3),
                "completed_at": datetime.now() - timedelta(days=2),
                "estimated_hours": 1.0,
                "actual_hours": 0.75,
                "points": 15,
                "reward_type": RewardType.TIME,
                "reward_value": 30,
                "reward_description": "30 minutes of screen time"
            },
            
            # In Progress tasks
            {
                "title": "Write Project Report",
                "description": "Complete the quarterly project report",
                "status": TaskStatus.IN_PROGRESS,
                "priority": TaskPriority.URGENT,
                "category_name": "Work",
                "assigned_to": "bob_wilson",
                "created_by": "bob_wilson",
                "due_date": datetime.now() + timedelta(days=1),
                "completed_at": None,
                "estimated_hours": 4.0,
                "actual_hours": 2.5,
                "points": 50,
                "reward_type": RewardType.CUSTOM,
                "reward_value": 0,
                "reward_description": "Team lunch celebration"
            },
            {
                "title": "Study for Science Test",
                "description": "Review chapters 5-8 for upcoming test",
                "status": TaskStatus.IN_PROGRESS,
                "priority": TaskPriority.HIGH,
                "category_name": "Homework",
                "assigned_to": "alice_brown",
                "created_by": "alice_brown",
                "due_date": datetime.now() + timedelta(days=2),
                "completed_at": None,
                "estimated_hours": 3.0,
                "actual_hours": 1.0,
                "points": 30,
                "reward_type": RewardType.POINTS,
                "reward_value": 30,
                "reward_description": None
            },
            
            # Pending tasks
            {
                "title": "Organize Garage",
                "description": "Sort and organize items in the garage",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.LOW,
                "category_name": "Chores",
                "assigned_to": "john_doe",
                "created_by": "jane_smith",
                "due_date": datetime.now() + timedelta(days=7),
                "completed_at": None,
                "estimated_hours": 3.0,
                "actual_hours": 0,
                "points": 20,
                "reward_type": RewardType.MONETARY,
                "reward_value": 20.00,
                "reward_description": None
            },
            {
                "title": "Attend Yoga Class",
                "description": "Go to the weekly yoga session",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Health",
                "assigned_to": "jane_smith",
                "created_by": "jane_smith",
                "due_date": datetime.now() + timedelta(days=1),
                "completed_at": None,
                "estimated_hours": 1.0,
                "actual_hours": 0,
                "points": 25,
                "reward_type": RewardType.TIME,
                "reward_value": 60,
                "reward_description": "1 hour of relaxation time"
            },
            {
                "title": "Learn Python Programming",
                "description": "Complete online Python course modules 1-5",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Learning",
                "assigned_to": "bob_wilson",
                "created_by": "bob_wilson",
                "due_date": datetime.now() + timedelta(days=14),
                "completed_at": None,
                "estimated_hours": 8.0,
                "actual_hours": 0,
                "points": 100,
                "reward_type": RewardType.CUSTOM,
                "reward_value": 0,
                "reward_description": "New programming book"
            },
            
            # Overdue tasks
            {
                "title": "Fix Broken Fence",
                "description": "Repair the broken section of the backyard fence",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.HIGH,
                "category_name": "Projects",
                "assigned_to": "john_doe",
                "created_by": "john_doe",
                "due_date": datetime.now() - timedelta(days=3),
                "completed_at": None,
                "estimated_hours": 2.0,
                "actual_hours": 0,
                "points": 30,
                "reward_type": RewardType.MONETARY,
                "reward_value": 50.00,
                "reward_description": None
            },
            {
                "title": "Plan Birthday Party",
                "description": "Organize decorations and activities for birthday celebration",
                "status": TaskStatus.TODO,
                "priority": TaskPriority.MEDIUM,
                "category_name": "Social",
                "assigned_to": "alice_brown",
                "created_by": "alice_brown",
                "due_date": datetime.now() - timedelta(days=1),
                "completed_at": None,
                "estimated_hours": 2.5,
                "actual_hours": 0,
                "points": 20,
                "reward_type": RewardType.CUSTOM,
                "reward_value": 0,
                "reward_description": "Special birthday treat"
            }
        ]

        for task_info in task_data:
            # Find the category
            category = next((cat for cat in self.categories if cat.name == task_info["category_name"]), None)
            
            # Find assigned user
            assigned_user = next((user for user in self.users if user.username == task_info["assigned_to"]), None)
            created_user = next((user for user in self.users if user.username == task_info["created_by"]), None)
            
            task_create = TaskCreate(
                title=task_info["title"],
                description=task_info["description"],
                status=task_info["status"],
                priority=task_info["priority"],
                category_id=category.id if category else None,
                assigned_to_id=assigned_user.id if assigned_user else None,
                due_date=task_info["due_date"],
                estimated_hours=task_info["estimated_hours"],
                actual_hours=task_info["actual_hours"],
                points=task_info["points"],
                reward_type=task_info["reward_type"],
                reward_value=task_info["reward_value"],
                reward_description=task_info["reward_description"]
            )
            
            task = self.task_service.create_task(task_create, created_user.id if created_user else self.users[0].id)
            
            # Set completion time if task is done
            if task_info["status"] == TaskStatus.DONE and task_info["completed_at"]:
                task.completed_at = task_info["completed_at"]
            
            self.tasks.append(task)
            print(f"  Created task: {task.title} ({task.status.value})")

        self.db.commit()
        print(f"Created {len(self.tasks)} tasks")

    def create_task_lists(self) -> None:
        """Create task lists and associate tasks with them"""
        print("Creating task lists...")
        
        list_data = [
            {
                "name": "Daily Chores",
                "description": "Routine daily household tasks",
                "is_public": True,
                "tasks": ["Clean Kitchen", "Organize Garage"]
            },
            {
                "name": "Weekly Goals",
                "description": "Important weekly objectives",
                "is_public": False,
                "tasks": ["Write Project Report", "Study for Science Test", "Attend Yoga Class"]
            },
            {
                "name": "Shopping List",
                "description": "Items to purchase",
                "is_public": True,
                "tasks": ["Buy Groceries"]
            },
            {
                "name": "Home Projects",
                "description": "Home improvement and maintenance tasks",
                "is_public": False,
                "tasks": ["Fix Broken Fence", "Organize Garage"]
            },
            {
                "name": "Learning Goals",
                "description": "Educational and skill development tasks",
                "is_public": True,
                "tasks": ["Learn Python Programming", "Study for Science Test"]
            }
        ]

        for list_info in list_data:
            # Create task list directly
            task_list = TaskList(
                name=list_info["name"],
                description=list_info["description"],
                is_public=list_info["is_public"],
                created_by_id=self.users[0].id
            )
            self.db.add(task_list)
            self.db.flush()  # Get the ID
            self.lists.append(task_list)
            
            # Associate tasks with the list
            for task_title in list_info["tasks"]:
                task = next((t for t in self.tasks if t.title == task_title), None)
                if task:
                    association = TaskListAssociation(
                        list_id=task_list.id,
                        task_id=task.id
                    )
                    self.db.add(association)
            
            print(f"  Created list: {task_list.name}")

        self.db.commit()
        print(f"Created {len(self.lists)} task lists")

    def create_tasks_from_templates(self) -> None:
        """Create some tasks from templates to demonstrate template usage"""
        print("Creating tasks from templates...")
        
        template_tasks = [
            {
                "template_name": "Daily Chore Template",
                "title": "Clean Living Room",
                "description": "Clean and organize the living room area",
                "assigned_to": "john_doe",
                "created_by": "jane_smith"
            },
            {
                "template_name": "Homework Assignment",
                "title": "Complete English Essay",
                "description": "Complete the assigned essay for English class",
                "assigned_to": "alice_brown",
                "created_by": "alice_brown"
            },
            {
                "template_name": "Shopping Trip",
                "title": "Buy Office Supplies",
                "description": "Purchase office supplies from the store",
                "assigned_to": "bob_wilson",
                "created_by": "bob_wilson"
            }
        ]

        for task_info in template_tasks:
            # Find the template
            template = next((t for t in self.templates if t.name == task_info["template_name"]), None)
            if not template:
                continue
            
            # Find assigned user
            assigned_user = next((user for user in self.users if user.username == task_info["assigned_to"]), None)
            created_user = next((user for user in self.users if user.username == task_info["created_by"]), None)
            
            task = self.task_service.create_task_from_template(
                template.id,
                created_user.id if created_user else self.users[0].id
            )
            
            if assigned_user:
                task.assigned_to_id = assigned_user.id
            
            self.tasks.append(task)
            print(f"  Created task from template: {task.title}")

        self.db.commit()
        print("Created tasks from templates")

    def generate_all_data(self) -> None:
        """Generate all test data"""
        print("Starting test data generation...")
        print("=" * 50)
        
        try:
            self.create_users()
            self.create_categories()
            self.create_templates()
            self.create_tasks()
            self.create_task_lists()
            self.create_tasks_from_templates()
            
            print("=" * 50)
            print("Test data generation completed successfully!")
            print(f"Summary:")
            print(f"  - Users: {len(self.users)}")
            print(f"  - Categories: {len(self.categories)}")
            print(f"  - Templates: {len(self.templates)}")
            print(f"  - Tasks: {len(self.tasks)}")
            print(f"  - Task Lists: {len(self.lists)}")
            
        except Exception as e:
            print(f"Error generating test data: {e}")
            self.db.rollback()
            raise


def main():
    """Main function to run the test data generation"""
    print("TaaskMaaster Test Data Generator")
    print("=" * 50)
    
    # Get database session
    db = next(get_db_session())
    
    try:
        # Create test data generator
        generator = TestDataGenerator(db)
        
        # Generate all data
        generator.generate_all_data()
        
    except Exception as e:
        print(f"Failed to generate test data: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
