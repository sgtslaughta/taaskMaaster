"""
Task service for TaaskMaaster.

This module contains business logic for advanced task management including
templates, categories, tags, dependencies, and recurring tasks.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.task import (
    RecurrenceType,
    Task,
    TaskCategory,
    TaskPriority,
    TaskStatus,
    TaskTag,
    TaskTagAssociation,
    TaskTemplate,
)
from app.schemas.task import (
    TaskCategoryCreate,
    TaskCreate,
    TaskTagCreate,
    TaskTemplateCreate,
    TaskUpdate,
)
from app.services.redis_service import redis_service

logger = get_logger(__name__)


class TaskService:
    """Service for task management operations."""

    def __init__(self, db: Session):
        """Initialize task service with database session."""
        self.db = db

    def create_task(self, task_data: TaskCreate, created_by_id: int) -> Task:
        """
        Create a new task with advanced features.

        Args:
            task_data: Task creation data
            created_by_id: ID of user creating the task

        Returns:
            Created task instance
        """
        # Create task instance
        task = Task(
            title=task_data.title,
            description=task_data.description,
            priority=task_data.priority,
            due_date=task_data.due_date,
            estimated_hours=task_data.estimated_hours,
            points=task_data.points,
            is_recurring=task_data.is_recurring,
            recurrence_pattern=task_data.recurrence_pattern,
            template_id=task_data.template_id,
            category_id=task_data.category_id,
            created_by_id=created_by_id,
            assigned_to_id=task_data.assigned_to_id,
            parent_task_id=task_data.parent_task_id,
        )

        self.db.add(task)
        self.db.flush()  # Get the task ID

        # Add tags if provided
        if task_data.tag_names:
            self._add_tags_to_task(task.id, task_data.tag_names, created_by_id)

        self.db.commit()
        self.db.refresh(task)

        # Invalidate cache for the user
        redis_service.invalidate_task_cache(created_by_id, task.id)
        if task.assigned_to_id and task.assigned_to_id != created_by_id:
            redis_service.invalidate_task_cache(task.assigned_to_id, task.id)

        logger.info(f"Created task {task.id} by user {created_by_id}")
        return task

    def get_task(self, task_id: int, user_id: int) -> Optional[Task]:
        """
        Get a task by ID with full relationships.

        Args:
            task_id: Task ID
            user_id: User ID for access control

        Returns:
            Task instance or None
        """
        # Try to get from cache first
        cached_task = redis_service.get_task_details(task_id)
        if cached_task and cached_task.get("user_id") == user_id:
            logger.info(f"Task {task_id} retrieved from cache")
            # Convert back to Task object if needed
            return self._dict_to_task(cached_task)
        
        # Get from database
        task = (
            self.db.query(Task)
            .filter(
                Task.id == task_id,
                or_(
                    Task.created_by_id == user_id,
                    Task.assigned_to_id == user_id,
                ),
            )
            .first()
        )
        
        # Cache the task if found
        if task:
            task_dict = self._task_to_dict(task)
            redis_service.cache_task_details(task_id, task_dict)
        
        return task

    def get_tasks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        category_id: Optional[int] = None,
        assigned_to_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Task], int]:
        """
        Get tasks with filtering and pagination.

        Args:
            user_id: User ID for access control
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by task status
            priority: Filter by task priority
            category_id: Filter by category
            assigned_to_id: Filter by assigned user
            search: Search in title and description

        Returns:
            Tuple of (tasks, total_count)
        """
        # Try to get from cache if no filters applied (most common case)
        if not any([status, priority, category_id, assigned_to_id, search]) and skip == 0:
            cached_tasks = redis_service.get_user_tasks(user_id)
            if cached_tasks:
                logger.info(f"User {user_id} tasks retrieved from cache")
                # Convert cached data back to Task objects
                tasks = [self._dict_to_task(task_dict) for task_dict in cached_tasks[:limit]]
                return tasks, len(cached_tasks)
        
        # Get from database
        query = self.db.query(Task).filter(
            or_(Task.created_by_id == user_id, Task.assigned_to_id == user_id)
        )

        # Apply filters
        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)
        if category_id:
            query = query.filter(Task.category_id == category_id)
        if assigned_to_id:
            query = query.filter(Task.assigned_to_id == assigned_to_id)
        if search:
            search_filter = or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        total = query.count()
        tasks = (
            query.order_by(desc(Task.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

        # Cache the results if no filters applied
        if not any([status, priority, category_id, assigned_to_id, search]) and skip == 0:
            task_dicts = [self._task_to_dict(task) for task in tasks]
            redis_service.cache_user_tasks(user_id, task_dicts)

        return tasks, total

    def update_task(
        self, task_id: int, task_data: TaskUpdate, user_id: int
    ) -> Optional[Task]:
        """
        Update a task.

        Args:
            task_id: Task ID
            task_data: Task update data
            user_id: User ID for access control

        Returns:
            Updated task instance or None
        """
        task = self.get_task(task_id, user_id)
        if not task:
            return None

        # Update fields
        update_data = task_data.dict(exclude_unset=True)

        # Handle tags separately
        tag_names = update_data.pop("tag_names", None)
        if tag_names is not None:
            self._update_task_tags(task_id, tag_names, user_id)

        for field, value in update_data.items():
            setattr(task, field, value)

        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)

        # Invalidate cache for the user
        redis_service.invalidate_task_cache(user_id, task_id)
        if task.assigned_to_id and task.assigned_to_id != user_id:
            redis_service.invalidate_task_cache(task.assigned_to_id, task_id)

        logger.info(f"Updated task {task_id} by user {user_id}")
        return task

    def delete_task(self, task_id: int, user_id: int) -> bool:
        """
        Delete a task.

        Args:
            task_id: Task ID
            user_id: User ID for access control

        Returns:
            True if deleted, False otherwise
        """
        task = self.get_task(task_id, user_id)
        if not task:
            return False

        self.db.delete(task)
        self.db.commit()

        # Invalidate cache for the user
        redis_service.invalidate_task_cache(user_id, task_id)
        if task.assigned_to_id and task.assigned_to_id != user_id:
            redis_service.invalidate_task_cache(task.assigned_to_id, task_id)

        logger.info(f"Deleted task {task_id} by user {user_id}")
        return True

    def complete_task(
        self, task_id: int, user_id: int, actual_hours: Optional[float] = None
    ) -> Optional[Task]:
        """
        Mark a task as completed.

        Args:
            task_id: Task ID
            user_id: User ID for access control
            actual_hours: Actual hours spent on task

        Returns:
            Updated task instance or None
        """
        task = self.get_task(task_id, user_id)
        if not task:
            return None

        task.status = TaskStatus.DONE
        task.completed_at = datetime.utcnow()
        if actual_hours is not None:
            task.actual_hours = actual_hours

        self.db.commit()
        self.db.refresh(task)

        logger.info(f"Completed task {task_id} by user {user_id}")
        return task

    def create_task_template(
        self, template_data: TaskTemplateCreate, created_by_id: int
    ) -> TaskTemplate:
        """
        Create a new task template.

        Args:
            template_data: Template creation data
            created_by_id: ID of user creating the template

        Returns:
            Created template instance
        """
        template = TaskTemplate(
            name=template_data.name,
            description=template_data.description,
            title_pattern=template_data.title_pattern,
            description_template=template_data.description_template,
            estimated_hours=template_data.estimated_hours,
            points=template_data.points,
            priority=template_data.priority,
            category_id=template_data.category_id,
            tags=template_data.tags,
            is_public=template_data.is_public,
            created_by_id=created_by_id,
        )

        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)

        logger.info(
            f"Created task template {template.id} by user {created_by_id}"
        )
        return template

    def get_task_templates(
        self, user_id: int, include_public: bool = True
    ) -> List[TaskTemplate]:
        """
        Get task templates available to user.

        Args:
            user_id: User ID
            include_public: Whether to include public templates

        Returns:
            List of task templates
        """
        query = self.db.query(TaskTemplate).filter(
            TaskTemplate.created_by_id == user_id
        )

        if include_public:
            query = query.union(
                self.db.query(TaskTemplate).filter(TaskTemplate.is_public)
            )

        return query.all()

    def create_task_from_template(
        self, template_id: int, user_id: int, **kwargs
    ) -> Optional[Task]:
        """
        Create a task from a template.

        Args:
            template_id: Template ID
            user_id: User ID creating the task
            **kwargs: Additional task data

        Returns:
            Created task instance or None
        """
        template = (
            self.db.query(TaskTemplate)
            .filter(TaskTemplate.id == template_id)
            .first()
        )
        if not template:
            return None

        # Create task data from template
        task_data = TaskCreate(
            title=kwargs.get("title", template.title_pattern),
            description=kwargs.get(
                "description", template.description_template
            ),
            priority=kwargs.get("priority", template.priority),
            estimated_hours=kwargs.get(
                "estimated_hours", template.estimated_hours
            ),
            points=kwargs.get("points", template.points),
            category_id=kwargs.get("category_id", template.category_id),
            tag_names=kwargs.get("tag_names", template.tags),
            **kwargs,
        )

        return self.create_task(task_data, user_id)

    def create_category(
        self, category_data: TaskCategoryCreate, created_by_id: int
    ) -> TaskCategory:
        """
        Create a new task category.

        Args:
            category_data: Category creation data
            created_by_id: ID of user creating the category

        Returns:
            Created category instance
        """
        category = TaskCategory(
            name=category_data.name,
            description=category_data.description,
            color=category_data.color,
            icon=category_data.icon,
            parent_id=category_data.parent_id,
            created_by_id=created_by_id,
        )

        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)

        logger.info(
            f"Created task category {category.id} by user {created_by_id}"
        )
        return category

    def get_categories(self, user_id: int) -> List[TaskCategory]:
        """
        Get task categories for user.

        Args:
            user_id: User ID

        Returns:
            List of task categories
        """
        return (
            self.db.query(TaskCategory)
            .filter(TaskCategory.created_by_id == user_id)
            .all()
        )

    def create_tag(
        self, tag_data: TaskTagCreate, created_by_id: int
    ) -> TaskTag:
        """
        Create a new task tag.

        Args:
            tag_data: Tag creation data
            created_by_id: ID of user creating the tag

        Returns:
            Created tag instance
        """
        tag = TaskTag(
            name=tag_data.name,
            color=tag_data.color,
            created_by_id=created_by_id,
        )

        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)

        logger.info(f"Created task tag {tag.id} by user {created_by_id}")
        return tag

    def get_tags(self) -> List[TaskTag]:
        """
        Get all task tags.

        Returns:
            List of task tags
        """
        return self.db.query(TaskTag).all()

    def _add_tags_to_task(
        self, task_id: int, tag_names: List[str], user_id: int
    ):
        """Add tags to a task."""
        for tag_name in tag_names:
            # Get or create tag
            tag = (
                self.db.query(TaskTag).filter(TaskTag.name == tag_name).first()
            )
            if not tag:
                tag = TaskTag(name=tag_name, created_by_id=user_id)
                self.db.add(tag)
                self.db.flush()

            # Create association if it doesn't exist
            existing = (
                self.db.query(TaskTagAssociation)
                .filter(
                    and_(
                        TaskTagAssociation.task_id == task_id,
                        TaskTagAssociation.tag_id == tag.id,
                    )
                )
                .first()
            )

            if not existing:
                association = TaskTagAssociation(
                    task_id=task_id, tag_id=tag.id
                )
                self.db.add(association)

    def _update_task_tags(
        self, task_id: int, tag_names: List[str], user_id: int
    ):
        """Update tags for a task."""
        # Remove existing associations
        self.db.query(TaskTagAssociation).filter(
            TaskTagAssociation.task_id == task_id
        ).delete()

        # Add new tags
        self._add_tags_to_task(task_id, tag_names, user_id)

    def create_recurring_tasks(self) -> int:
        """
        Create recurring tasks based on patterns.

        Returns:
            Number of tasks created
        """
        # Get all recurring tasks that need new instances
        recurring_tasks = (
            self.db.query(Task)
            .filter(
                and_(
                    Task.is_recurring,
                    Task.recurrence_pattern.isnot(None),
                )
            )
            .all()
        )

        created_count = 0
        for task in recurring_tasks:
            if self._should_create_recurring_instance(task):
                new_task = self._create_recurring_instance(task)
                if new_task:
                    created_count += 1

        self.db.commit()
        logger.info(f"Created {created_count} recurring task instances")
        return created_count

    def _should_create_recurring_instance(self, task: Task) -> bool:
        """Check if a recurring task should create a new instance."""
        if not task.recurrence_pattern:
            return False

        # Check if the last instance was completed and enough time has passed
        last_instance = (
            self.db.query(Task)
            .filter(
                and_(
                    Task.template_id == task.template_id,
                    Task.created_at > task.created_at,
                )
            )
            .order_by(desc(Task.created_at))
            .first()
        )

        if not last_instance:
            return True

        # Check recurrence pattern
        pattern = task.recurrence_pattern
        recurrence_type = pattern.get("type")

        if recurrence_type == RecurrenceType.DAILY:
            return (datetime.utcnow() - last_instance.created_at).days >= 1
        elif recurrence_type == RecurrenceType.WEEKLY:
            return (datetime.utcnow() - last_instance.created_at).days >= 7
        elif recurrence_type == RecurrenceType.MONTHLY:
            return (datetime.utcnow() - last_instance.created_at).days >= 30

        return False

    def _create_recurring_instance(self, task: Task) -> Optional[Task]:
        """Create a new instance of a recurring task."""
        new_task = Task(
            title=task.title,
            description=task.description,
            priority=task.priority,
            estimated_hours=task.estimated_hours,
            points=task.points,
            is_recurring=task.is_recurring,
            recurrence_pattern=task.recurrence_pattern,
            template_id=task.template_id,
            category_id=task.category_id,
            created_by_id=task.created_by_id,
            assigned_to_id=task.assigned_to_id,
        )

        # Calculate new due date based on recurrence pattern
        if task.due_date and task.recurrence_pattern:
            new_task.due_date = self._calculate_next_due_date(
                task.due_date, task.recurrence_pattern
            )

        self.db.add(new_task)
        return new_task

    def _calculate_next_due_date(
        self, current_due_date: datetime, pattern: Dict[str, Any]
    ) -> datetime:
        """Calculate the next due date based on recurrence pattern."""
        recurrence_type = pattern.get("type")

        if recurrence_type == RecurrenceType.DAILY:
            return current_due_date + timedelta(days=1)
        elif recurrence_type == RecurrenceType.WEEKLY:
            return current_due_date + timedelta(weeks=1)
        elif recurrence_type == RecurrenceType.MONTHLY:
            # Simple monthly calculation
            return current_due_date + timedelta(days=30)
        elif recurrence_type == RecurrenceType.YEARLY:
            return current_due_date + timedelta(days=365)

        return current_due_date

    def to_task_response(self, task: Task) -> Dict[str, Any]:
        """
        Convert a Task model instance to a TaskResponse dictionary.
        
        Args:
            task: Task model instance
            
        Returns:
            Dictionary representation suitable for TaskResponse
        """
        # Convert assigned_to User object to dictionary
        assigned_to_dict = None
        if task.assigned_to:
            assigned_to_dict = {
                "id": task.assigned_to.id,
                "username": task.assigned_to.username,
                "email": task.assigned_to.email,
                "first_name": getattr(task.assigned_to, 'first_name', None),
                "last_name": getattr(task.assigned_to, 'last_name', None),
            }
        
        # Convert category to dictionary
        category_dict = None
        if task.category:
            category_dict = {
                "id": task.category.id,
                "name": task.category.name,
                "description": task.category.description,
                "color": task.category.color,
                "icon": task.category.icon,
            }
        
        # Convert template to dictionary
        template_dict = None
        if task.template:
            template_dict = {
                "id": task.template.id,
                "name": task.template.name,
                "description": task.template.description,
                "title_pattern": task.template.title_pattern,
                "description_template": task.template.description_template,
                "estimated_hours": task.template.estimated_hours,
                "points": task.template.points,
                "priority": task.template.priority.value,
                "is_public": task.template.is_public,
            }
        
        # Convert tags to list of dictionaries
        tags_list = []
        if task.tags:
            for tag in task.tags:
                tags_list.append({
                    "id": tag.id,
                    "name": tag.name,
                    "color": tag.color,
                })
        
        # Convert subtasks to list of dictionaries
        subtasks_list = []
        if task.subtasks:
            for subtask in task.subtasks:
                subtasks_list.append(self.to_task_response(subtask))
        
        # Convert dependencies to list of dictionaries
        dependencies_list = []
        if task.dependencies:
            for dep in task.dependencies:
                dependencies_list.append({
                    "id": dep.id,
                    "dependent_task_id": dep.dependent_task_id,
                    "dependency_type": dep.dependency_type.value if hasattr(dep.dependency_type, 'value') else dep.dependency_type,
                })
        
        # Convert media attachments to list of dictionaries
        media_list = []
        if task.media_attachments:
            for media in task.media_attachments:
                media_list.append({
                    "id": media.id,
                    "filename": media.filename,
                    "file_path": media.file_path,
                    "file_size": media.file_size,
                    "mime_type": media.mime_type,
                    "uploaded_at": media.uploaded_at.isoformat() if media.uploaded_at else None,
                })
        
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "estimated_hours": task.estimated_hours,
            "actual_hours": task.actual_hours,
            "points": task.points,
            "is_recurring": task.is_recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "created_by_id": task.created_by_id,
            "assigned_to_id": task.assigned_to_id,
            "category_id": task.category_id,
            "template_id": task.template_id,
            "parent_task_id": task.parent_task_id,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "assigned_to": assigned_to_dict,
            "category": category_dict,
            "template": template_dict,
            "tags": tags_list,
            "subtasks": subtasks_list,
            "dependencies": dependencies_list,
            "media_attachments": media_list,
        }

    def _task_to_dict(self, task: Task) -> Dict[str, Any]:
        """
        Convert Task object to dictionary for caching.
        
        Args:
            task: Task object
            
        Returns:
            Dictionary representation of task
        """
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "estimated_hours": task.estimated_hours,
            "actual_hours": task.actual_hours,
            "points": task.points,
            "is_recurring": task.is_recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "created_by_id": task.created_by_id,
            "assigned_to_id": task.assigned_to_id,
            "category_id": task.category_id,
            "template_id": task.template_id,
            "parent_task_id": task.parent_task_id,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "user_id": task.created_by_id,  # For cache key identification
        }

    def _dict_to_task(self, task_dict: Dict[str, Any]) -> Task:
        """
        Convert dictionary back to Task object.
        
        Args:
            task_dict: Dictionary representation of task
            
        Returns:
            Task object
        """
        # Create a minimal Task object with cached data
        task = Task()
        task.id = task_dict["id"]
        task.title = task_dict["title"]
        task.description = task_dict["description"]
        task.status = TaskStatus(task_dict["status"])
        task.priority = TaskPriority(task_dict["priority"])
        task.due_date = datetime.fromisoformat(task_dict["due_date"]) if task_dict["due_date"] else None
        task.completed_at = datetime.fromisoformat(task_dict["completed_at"]) if task_dict["completed_at"] else None
        task.estimated_hours = task_dict["estimated_hours"]
        task.actual_hours = task_dict["actual_hours"]
        task.points = task_dict["points"]
        task.is_recurring = task_dict["is_recurring"]
        task.recurrence_pattern = task_dict["recurrence_pattern"]
        task.created_by_id = task_dict["created_by_id"]
        task.assigned_to_id = task_dict["assigned_to_id"]
        task.category_id = task_dict["category_id"]
        task.template_id = task_dict["template_id"]
        task.parent_task_id = task_dict["parent_task_id"]
        task.created_at = datetime.fromisoformat(task_dict["created_at"])
        task.updated_at = datetime.fromisoformat(task_dict["updated_at"])
        
        return task
