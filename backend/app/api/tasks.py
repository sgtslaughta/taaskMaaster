"""
Tasks API router for TaaskMaaster.

This module contains API endpoints for advanced task management features.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.task import TaskPriority, TaskStatus
from app.schemas.task import (
    TaskCategoryCreate,
    TaskCategoryResponse,
    TaskCreate,
    TaskList,
    TaskResponse,
    TaskTagCreate,
    TaskTagResponse,
    TaskTemplateCreate,
    TaskTemplateResponse,
    TaskUpdate,
)
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post(
    "/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED
)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """
    Create a new task with advanced features.

    Supports templates, categories, tags, dependencies, and recurring tasks.
    """
    task_service = TaskService(db)
    task = task_service.create_task(task_data, current_user_id)
    return task


@router.get("/", response_model=TaskList)
async def get_tasks(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    status: Optional[TaskStatus] = Query(
        None, description="Filter by task status"
    ),
    priority: Optional[TaskPriority] = Query(
        None, description="Filter by task priority"
    ),
    category_id: Optional[int] = Query(
        None, description="Filter by category ID"
    ),
    assigned_to_id: Optional[int] = Query(
        None, description="Filter by assigned user ID"
    ),
    search: Optional[str] = Query(
        None, description="Search in title and description"
    ),
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """
    Get tasks with filtering and pagination.

    Supports filtering by status, priority, category, assigned user, and text
    search.
    """
    task_service = TaskService(db)
    tasks, total = task_service.get_tasks(
        user_id=current_user_id,
        skip=skip,
        limit=limit,
        status=status,
        priority=priority,
        category_id=category_id,
        assigned_to_id=assigned_to_id,
        search=search,
    )

    pages = (total + limit - 1) // limit
    page = (skip // limit) + 1

    return TaskList(
        tasks=tasks, total=total, page=page, size=limit, pages=pages
    )


# Task Templates
@router.post(
    "/templates",
    response_model=TaskTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_template(
    template_data: TaskTemplateCreate,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Create a new task template."""
    task_service = TaskService(db)
    template = task_service.create_task_template(
        template_data, current_user_id
    )
    return template


@router.get("/templates", response_model=List[TaskTemplateResponse])
async def get_task_templates(
    include_public: bool = Query(True, description="Include public templates"),
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Get task templates available to the user."""
    task_service = TaskService(db)
    templates = task_service.get_task_templates(
        current_user_id, include_public
    )
    return templates


@router.post(
    "/templates/{template_id}/create",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_from_template(
    template_id: int,
    title: Optional[str] = Query(None, description="Override template title"),
    description: Optional[str] = Query(
        None, description="Override template description"
    ),
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Create a task from a template."""
    task_service = TaskService(db)
    task = task_service.create_task_from_template(
        template_id, current_user_id, title=title, description=description
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    return task


# Task Categories
@router.post(
    "/categories",
    response_model=TaskCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_category(
    category_data: TaskCategoryCreate,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Create a new task category."""
    task_service = TaskService(db)
    category = task_service.create_category(category_data, current_user_id)
    return category


@router.get("/categories", response_model=List[TaskCategoryResponse])
async def get_task_categories(
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Get task categories for the user."""
    task_service = TaskService(db)
    categories = task_service.get_categories(current_user_id)
    return categories


# Task Tags
@router.post(
    "/tags",
    response_model=TaskTagResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_tag(
    tag_data: TaskTagCreate,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Create a new task tag."""
    task_service = TaskService(db)
    tag = task_service.create_tag(tag_data, current_user_id)
    return tag


@router.get("/tags", response_model=List[TaskTagResponse])
async def get_task_tags(db: Session = Depends(get_db_session)):
    """Get all task tags."""
    task_service = TaskService(db)
    tags = task_service.get_tags()
    return tags


# Recurring Tasks
@router.get("/recurring", response_model=List[TaskResponse])
async def get_recurring_tasks(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Get recurring tasks."""
    TaskService(db)
    # For now, return empty list - in a real app, you would filter for recurring tasks
    return []


@router.post("/recurring/create", status_code=status.HTTP_200_OK)
async def create_recurring_tasks(db: Session = Depends(get_db_session)):
    """Create recurring task instances based on patterns."""
    task_service = TaskService(db)
    created_count = task_service.create_recurring_tasks()

    return {
        "message": f"Created {created_count} recurring task instances",
        "created_count": created_count,
    }


# Individual Task Operations (must come after specific routes)
@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Get a specific task by ID."""
    task_service = TaskService(db)
    task = task_service.get_task(task_id, current_user_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Update a task."""
    task_service = TaskService(db)
    task = task_service.update_task(task_id, task_data, current_user_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Delete a task."""
    task_service = TaskService(db)
    success = task_service.delete_task(task_id, current_user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    actual_hours: Optional[float] = Query(
        None, ge=0, description="Actual hours spent"
    ),
    db: Session = Depends(get_db_session),
    # TODO: Add authentication dependency
    current_user_id: int = 1,  # Temporary for development
):
    """Mark a task as completed."""
    task_service = TaskService(db)
    task = task_service.complete_task(task_id, current_user_id, actual_hours)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return task
