# Task Workflow Enhancement Implementation Plan

## Executive Summary

This document outlines a comprehensive implementation plan to enhance the TaaskMaaster task system with workflow management, rich comments, and approval mechanisms. The enhancement will transform the current basic task status system into a structured workflow that enforces proper task progression and approval processes.

### Key Enhancements
- **Structured Workflow**: assigned → in_progress → submitted_for_approval → done (with approval)
- **Rich Comments System**: SMS-like interface with rich text, media attachments, and timestamps
- **Approval System**: Only task creators/assigners can approve task completion
- **Media Integration**: Enhanced media support for task comments and attachments

---

## Current System Analysis

### ✅ **Existing Infrastructure**
- **Task Model**: Complete with status enum (TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED)
- **Media System**: Fully implemented MediaAttachment model with MinIO storage
- **User System**: User roles and authentication in place
- **API Structure**: RESTful API with proper authentication and authorization

### ❌ **Missing Components**
- **Workflow Enforcement**: No rules preventing invalid status transitions
- **Comment System**: No task commenting functionality
- **Approval Process**: No mechanism for task creator approval
- **Rich Text Support**: No rich text editing or display capabilities
- **Workflow History**: No tracking of status changes and approvals

---

## New Requirements Specification

### 1. **Task Workflow System**
- **Status Flow**: ASSIGNED → IN_PROGRESS → SUBMITTED_FOR_APPROVAL → DONE
- **Role-Based Permissions**:
  - **Assigned User**: Can move task from ASSIGNED → IN_PROGRESS → SUBMITTED_FOR_APPROVAL
  - **Task Creator**: Can approve SUBMITTED_FOR_APPROVAL → DONE or reject back to IN_PROGRESS
  - **Admin**: Can override any workflow step
- **Workflow Validation**: Prevent invalid status transitions
- **Audit Trail**: Track all status changes with timestamps and user information

### 2. **Comments System**
- **Rich Text Support**: Markdown or WYSIWYG editor with formatting options
- **Media Attachments**: Photos, videos, documents attached to comments
- **SMS-like Interface**: Chronological display with user avatars and timestamps
- **Real-time Updates**: Live comment updates for active task viewers
- **Comment Threading**: Optional reply-to-comment functionality

### 3. **Approval System**
- **Creator Approval**: Only task creator can approve final completion
- **Rejection Workflow**: Ability to reject with comments and send back to IN_PROGRESS
- **Notification System**: Email/in-app notifications for approval requests
- **Approval History**: Track all approval/rejection actions

---

## Database Schema Changes

### 1. **Enhanced Task Status Enum**
```sql
-- Update TaskStatus enum to include new statuses
ALTER TYPE TaskStatus ADD VALUE 'ASSIGNED';
ALTER TYPE TaskStatus ADD VALUE 'SUBMITTED_FOR_APPROVAL';
```

### 2. **New TaskComment Model**
```python
class TaskComment(Base):
    __tablename__ = "task_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)  # Rich text content
    content_type = Column(String(50), default="markdown")  # markdown, html
    parent_comment_id = Column(Integer, ForeignKey("task_comments.id"), nullable=True)
    is_system_comment = Column(Boolean, default=False)  # For workflow changes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    user = relationship("User")
    parent_comment = relationship("TaskComment", remote_side=[id])
    media_attachments = relationship("CommentMediaAttachment", back_populates="comment")
```

### 3. **TaskStatusHistory Model**
```python
class TaskStatusHistory(Base):
    __tablename__ = "task_status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    previous_status = Column(SQLEnum(TaskStatus), nullable=True)
    new_status = Column(SQLEnum(TaskStatus), nullable=False)
    comment = Column(Text, nullable=True)  # Optional comment with status change
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="status_history")
    user = relationship("User")
```

### 4. **CommentMediaAttachment Model**
```python
class CommentMediaAttachment(Base):
    __tablename__ = "comment_media_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("task_comments.id"), nullable=False)
    media_attachment_id = Column(Integer, ForeignKey("media_attachments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    comment = relationship("TaskComment", back_populates="media_attachments")
    media_attachment = relationship("MediaAttachment")
```

### 5. **Enhanced Task Model**
```python
# Add new relationships to existing Task model
class Task(Base):
    # ... existing fields ...
    
    # New fields
    submitted_for_approval_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # New relationships
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    status_history = relationship("TaskStatusHistory", back_populates="task", cascade="all, delete-orphan")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    chat_messages = relationship("TaskChatMessage", back_populates="task", cascade="all, delete-orphan")
```

### 6. **Real-time Messaging Models**

**DirectMessage Model**
```python
class DirectMessage(Base):
    __tablename__ = "direct_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), default="text")  # text, markdown
    thread_id = Column(String(100), nullable=True)  # For threaded conversations
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
    media_attachments = relationship("DirectMessageMedia", back_populates="message")
    read_receipts = relationship("MessageReadReceipt", back_populates="message")
```

**TaskChatMessage Model**
```python
class TaskChatMessage(Base):
    __tablename__ = "task_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), default="text")  # text, markdown
    parent_message_id = Column(Integer, ForeignKey("task_chat_messages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="chat_messages")
    from_user = relationship("User")
    parent_message = relationship("TaskChatMessage", remote_side=[id])
    media_attachments = relationship("TaskChatMessageMedia", back_populates="message")
    read_receipts = relationship("MessageReadReceipt", back_populates="task_message")
```

**MessageReadReceipt Model**
```python
class MessageReadReceipt(Base):
    __tablename__ = "message_read_receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("direct_messages.id"), nullable=True)
    task_message_id = Column(Integer, ForeignKey("task_chat_messages.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("DirectMessage", back_populates="read_receipts")
    task_message = relationship("TaskChatMessage", back_populates="read_receipts")
    user = relationship("User")
```

**DirectMessageMedia & TaskChatMessageMedia Models**
```python
class DirectMessageMedia(Base):
    __tablename__ = "direct_message_media"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("direct_messages.id"), nullable=False)
    media_attachment_id = Column(Integer, ForeignKey("media_attachments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("DirectMessage", back_populates="media_attachments")
    media_attachment = relationship("MediaAttachment")

class TaskChatMessageMedia(Base):
    __tablename__ = "task_chat_message_media"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("task_chat_messages.id"), nullable=False)
    media_attachment_id = Column(Integer, ForeignKey("media_attachments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("TaskChatMessage", back_populates="media_attachments")
    media_attachment = relationship("MediaAttachment")
```

**UserStatus Model**
```python
class UserStatus(Base):
    __tablename__ = "user_status"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    status = Column(String(20), default="offline")  # online, away, busy, offline
    last_seen = Column(DateTime, default=datetime.utcnow)
    custom_message = Column(String(255), nullable=True)  # Optional status message
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
```

---

## Phase 1: Database & Backend Core (2-3 weeks)

### Week 1: Database Schema Implementation ✅ **COMPLETED**
- [x] Create database migration scripts for new tables (comments, messaging, status history)
- [x] Update existing Task model with new fields and relationships
- [x] Add new enum values to TaskStatus
- [x] Create messaging-related tables (DirectMessage, TaskChatMessage, UserStatus, etc.)
- [x] Create database indexes for performance optimization
- [x] Write/update database seeding scripts for development/testing

### Week 2: Core Backend Models & Services ✅ **COMPLETED**
- [x] Implement TaskComment model and service
- [x] Implement TaskStatusHistory model and service
- [x] Create CommentMediaAttachment model
- [x] Implement DirectMessage and TaskChatMessage models and services
- [x] Create UserStatus model and service for online presence
- [x] Update TaskService with workflow validation logic
- [x] Create WorkflowService for status transition management
- [x] Implement enhanced WebSocketManager for notifications and messaging

### Week 3: Basic API Endpoints ✅ **COMPLETED**
- [x] Create comment CRUD endpoints (`/api/v1/comments`)
- [x] Create workflow transition endpoints (`/api/v1/workflow/transition`)
- [x] Add approval endpoints (`/api/v1/workflow/approve`, `/api/v1/workflow/reject`)
- [x] Implement messaging endpoints (`/api/v1/messages/direct`, `/api/v1/messages/task-chat`)
- [x] Implement WebSocket endpoints (`/ws/notifications`, `/ws/messaging`) with authentication
- [x] Create user status endpoints (`/api/v1/users/status`)
- [x] Update existing task endpoints to include comments and workflow data
- [x] Add proper error handling and validation

---

## Phase 2: Workflow & Comments System (3-4 weeks)

### Week 1: Workflow Engine
- [ ] Implement workflow validation service
- [ ] Create status transition rules and permissions
- [ ] Add workflow event triggers with WebSocket notifications
- [ ] Implement approval/rejection logic with real-time updates
- [ ] Create system comment generation for workflow changes
- [ ] Integrate NotificationService with workflow events

### Week 2: Comments & Messaging System Backend
- [ ] Rich text content validation and sanitization
- [ ] Media attachment integration for comments and messages
- [ ] Comment threading and reply functionality
- [ ] Real-time messaging service implementation
- [ ] WebSocket notification system for real-time updates
- [ ] Message read receipts and typing indicators
- [ ] Comment and message search and filtering

### Week 3: Advanced Features
- [ ] WebSocket notification broadcasting for workflow changes
- [ ] Email notifications for approval requests
- [ ] Comment mention system (@username) with WebSocket notifications
- [ ] User online presence and status management
- [ ] Message threading and conversation history
- [ ] Comment editing and deletion with audit trail
- [ ] Bulk comment and message operations

### Week 4: API Optimization & Security
- [ ] Rate limiting for comment creation and messaging
- [ ] Permission-based comment and message visibility
- [ ] API response optimization (pagination, filtering)
- [ ] WebSocket connection scaling and load balancing
- [ ] Message delivery reliability and queuing
- [ ] Security audit and vulnerability testing
- [ ] Performance optimization and caching

---

## Phase 3: Frontend Implementation (4-5 weeks)

### Week 1: Workflow UI Components
- [ ] Create TaskWorkflowControls component
- [ ] Implement status transition buttons with validation
- [ ] Add approval/rejection modal dialogs
- [ ] Create workflow status indicator component
- [ ] Implement workflow history timeline

### Week 2: Comments & Messaging Interface
- [ ] Create TaskCommentsSection component (SMS-like design)
- [ ] Implement DirectMessaging component for user-to-user chat
- [ ] Create TaskChatSection component for task-specific conversations
- [ ] Implement rich text editor (TinyMCE or similar)
- [ ] Add media upload functionality for comments and messages
- [ ] Create message display with user avatars and timestamps
- [ ] Implement WebSocket client for real-time notifications and messaging
- [ ] Add typing indicators and online status display

### Week 3: Advanced UI Features
- [ ] Comment and message threading interface
- [ ] Media attachment viewer (lightbox for images, video player)
- [ ] Comment and message editing/deletion UI
- [ ] User mention autocomplete (@username)
- [ ] Message read receipts display
- [ ] Conversation history and search interface
- [ ] User presence indicators and status management
- [ ] Comment and message search and filtering interface

### Week 4: Integration & Polish
- [ ] Integrate workflow controls with existing task views
- [ ] Update task list to show workflow status
- [ ] Add workflow statistics to dashboard
- [ ] Add WebSocket notification UI for real-time updates
- [ ] Implement notification toasts for approval requests and messages
- [ ] Create messaging sidebar/panel for easy access
- [ ] Add unread message indicators and counters
- [ ] Mobile responsiveness optimization for messaging interface

### Week 5: UX Enhancements
- [ ] Add loading states and error handling for messaging
- [ ] Implement optimistic updates for comments and messages
- [ ] Add keyboard shortcuts for power users (quick message sending, navigation)
- [ ] Create onboarding tooltips for new workflow and messaging features
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Message delivery status indicators (sent, delivered, read)
- [ ] Offline message queuing and sync

---

## Phase 4: Integration & Testing (2-3 weeks)

### Week 1: End-to-End Testing
- [ ] Create comprehensive test suites for workflow
- [ ] Test all permission scenarios and edge cases
- [ ] Performance testing with large comment volumes
- [ ] WebSocket connection and notification testing
- [ ] Cross-browser compatibility testing
- [ ] Mobile device testing

### Week 2: Security & Performance
- [ ] Security audit of new endpoints
- [ ] Performance optimization and profiling
- [ ] Database query optimization
- [ ] Frontend bundle size optimization
- [ ] CDN integration for media assets

### Week 3: Deployment & Documentation
- [ ] Production deployment scripts
- [ ] Database migration procedures
- [ ] User documentation and training materials
- [ ] API documentation updates
- [ ] Monitoring and alerting setup

---

## API Design & WebSocket Notification System

### JSON Header Authentication
All API endpoints use JSON request bodies with authentication and identification data in headers:

#### Standard Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>",
  "X-User-Data": "{\"user_id\": 123, \"username\": \"john_doe\", \"role\": \"user\"}"
}
```

#### Example API Endpoints

**Create Comment**
```http
POST /api/v1/comments
Content-Type: application/json
X-User-Data: {"user_id": 123, "username": "john_doe", "role": "user"}

{
  "task_id": 456,
  "content": "This task is **almost complete**! Just need to finalize the documentation.",
  "content_type": "markdown",
  "parent_comment_id": null,
  "media_attachment_ids": [789, 790]
}
```

**Workflow Transition**
```http
POST /api/v1/workflow/transition
Content-Type: application/json
X-User-Data: {"user_id": 123, "username": "john_doe", "role": "user"}

{
  "task_id": 456,
  "new_status": "submitted_for_approval",
  "comment": "Ready for review - all requirements completed"
}
```

**Approve Task**
```http
POST /api/v1/workflow/approve
Content-Type: application/json
X-User-Data: {"user_id": 789, "username": "jane_manager", "role": "admin"}

{
  "task_id": 456,
  "approval_comment": "Great work! Task approved."
}
```

**Reject Task**
```http
POST /api/v1/workflow/reject
Content-Type: application/json
X-User-Data: {"user_id": 789, "username": "jane_manager", "role": "admin"}

{
  "task_id": 456,
  "rejection_reason": "Please add more test coverage before completion",
  "return_to_status": "in_progress"
}
```

**Send Direct Message**
```http
POST /api/v1/messages/direct
Content-Type: application/json
X-User-Data: {"user_id": 123, "username": "john_doe", "role": "user"}

{
  "to_user_id": 789,
  "content": "Hey! Can you review the latest changes when you have a moment?",
  "content_type": "text",
  "thread_id": null,
  "media_attachment_ids": [891, 892]
}
```

**Send Task Chat Message**
```http
POST /api/v1/messages/task-chat
Content-Type: application/json
X-User-Data: {"user_id": 123, "username": "john_doe", "role": "user"}

{
  "task_id": 456,
  "content": "Just pushed the latest changes to the auth branch! 🚀",
  "content_type": "text",
  "parent_message_id": null,
  "media_attachment_ids": [893]
}
```

**Mark Message as Read**
```http
POST /api/v1/messages/mark-read
Content-Type: application/json
X-User-Data: {"user_id": 789, "username": "jane_reviewer", "role": "user"}

{
  "message_id": "msg_123456",
  "message_type": "direct" // or "task_chat"
}
```

**Update User Status**
```http
POST /api/v1/users/status
Content-Type: application/json
X-User-Data: {"user_id": 123, "username": "john_doe", "role": "user"}

{
  "status": "busy",
  "custom_message": "In a meeting until 3 PM"
}
```

**Get Conversation History**
```http
POST /api/v1/messages/history
Content-Type: application/json
X-User-Data: {"user_id": 123, "username": "john_doe", "role": "user"}

{
  "conversation_type": "direct", // or "task_chat"
  "conversation_id": 789, // user_id for direct, task_id for task_chat
  "limit": 50,
  "offset": 0,
  "before_timestamp": "2024-01-15T12:00:00Z"
}
```

### WebSocket Real-time Messaging & Notification System

#### Connection Establishment
```javascript
// Frontend WebSocket connection for notifications
const wsNotifications = new WebSocket('ws://localhost:8000/ws/notifications');

// Frontend WebSocket connection for real-time messaging
const wsMessaging = new WebSocket('ws://localhost:8000/ws/messaging');

// Authentication for both connections
wsNotifications.onopen = () => {
  wsNotifications.send(JSON.stringify({
    type: 'authenticate',
    token: localStorage.getItem('jwt_token'),
    user_id: currentUser.id
  }));
};

wsMessaging.onopen = () => {
  wsMessaging.send(JSON.stringify({
    type: 'authenticate',
    token: localStorage.getItem('jwt_token'),
    user_id: currentUser.id
  }));
};
```

#### Notification Event Types

**Task Comment Added**
```json
{
  "type": "task_comment_added",
  "timestamp": "2024-01-15T10:30:00Z",
  "task_id": 456,
  "comment": {
    "id": 123,
    "content": "Task looks good to me!",
    "user": {
      "id": 789,
      "username": "jane_reviewer",
      "avatar_url": "/avatars/jane.jpg"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "media_attachments": []
  },
  "recipients": [123, 456, 789] // user_ids who should receive this
}
```

**Workflow Status Changed**
```json
{
  "type": "task_status_changed",
  "timestamp": "2024-01-15T10:35:00Z",
  "task_id": 456,
  "task_title": "Implement user authentication",
  "previous_status": "in_progress",
  "new_status": "submitted_for_approval",
  "changed_by": {
    "id": 123,
    "username": "john_doe"
  },
  "comment": "Ready for review - all requirements completed",
  "recipients": [789, 101] // task creator and assigned reviewers
}
```

**Task Approval Request**
```json
{
  "type": "approval_requested",
  "timestamp": "2024-01-15T10:35:00Z",
  "task_id": 456,
  "task_title": "Implement user authentication",
  "requested_by": {
    "id": 123,
    "username": "john_doe"
  },
  "message": "Task is ready for final approval",
  "recipients": [789] // task creator/approver
}
```

**Task Approved/Rejected**
```json
{
  "type": "task_approved", // or "task_rejected"
  "timestamp": "2024-01-15T11:00:00Z",
  "task_id": 456,
  "task_title": "Implement user authentication",
  "approved_by": {
    "id": 789,
    "username": "jane_manager"
  },
  "comment": "Great work! Task approved.",
  "recipients": [123] // task assignee
}
```

**User Mentioned in Comment**
```json
{
  "type": "user_mentioned",
  "timestamp": "2024-01-15T10:45:00Z",
  "task_id": 456,
  "comment_id": 124,
  "mentioned_by": {
    "id": 123,
    "username": "john_doe"
  },
  "comment_excerpt": "Hey @jane_reviewer, could you take a look at this?",
  "recipients": [789] // mentioned user
}
```

**Media Attachment Added**
```json
{
  "type": "media_attached",
  "timestamp": "2024-01-15T10:50:00Z",
  "task_id": 456,
  "comment_id": 125,
  "media": {
    "id": 890,
    "filename": "screenshot.png",
    "media_type": "image",
    "thumbnail_url": "/media/thumbnails/890.jpg"
  },
  "uploaded_by": {
    "id": 123,
    "username": "john_doe"
  },
  "recipients": [789, 101] // task participants
}
```

#### Real-time Messaging Event Types

**Direct Message Sent**
```json
{
  "type": "direct_message",
  "timestamp": "2024-01-15T11:15:00Z",
  "message_id": "msg_123456",
  "from_user": {
    "id": 123,
    "username": "john_doe",
    "avatar_url": "/avatars/john.jpg"
  },
  "to_user": {
    "id": 789,
    "username": "jane_reviewer"
  },
  "content": "Hey, can you review the latest changes when you have a moment?",
  "content_type": "text", // or "markdown"
  "thread_id": null, // for threaded conversations
  "media_attachments": [],
  "recipients": [789] // target user
}
```

**Task Chat Message**
```json
{
  "type": "task_chat_message",
  "timestamp": "2024-01-15T11:20:00Z",
  "message_id": "msg_123457",
  "task_id": 456,
  "task_title": "Implement user authentication",
  "from_user": {
    "id": 123,
    "username": "john_doe",
    "avatar_url": "/avatars/john.jpg"
  },
  "content": "Just pushed the latest changes to the auth branch!",
  "content_type": "text",
  "media_attachments": [
    {
      "id": 891,
      "filename": "auth_flow_diagram.png",
      "media_type": "image",
      "thumbnail_url": "/media/thumbnails/891.jpg"
    }
  ],
  "recipients": [456, 789, 101] // all task participants
}
```

**Typing Indicator**
```json
{
  "type": "typing_indicator",
  "timestamp": "2024-01-15T11:22:00Z",
  "user": {
    "id": 123,
    "username": "john_doe"
  },
  "context": {
    "type": "task_chat", // or "direct_message"
    "context_id": 456 // task_id or user_id
  },
  "is_typing": true,
  "recipients": [789, 101] // other participants
}
```

**Message Read Receipt**
```json
{
  "type": "message_read",
  "timestamp": "2024-01-15T11:25:00Z",
  "message_id": "msg_123456",
  "read_by": {
    "id": 789,
    "username": "jane_reviewer"
  },
  "context": {
    "type": "task_chat",
    "context_id": 456
  },
  "recipients": [123] // message sender
}
```

**User Online Status**
```json
{
  "type": "user_status_changed",
  "timestamp": "2024-01-15T11:30:00Z",
  "user": {
    "id": 789,
    "username": "jane_reviewer"
  },
  "status": "online", // online, away, busy, offline
  "last_seen": "2024-01-15T11:30:00Z",
  "recipients": [123, 456, 101] // connected users who should see this
}
```

#### WebSocket Backend Implementation

**Connection Management**
```python
# Enhanced WebSocket connection manager for notifications and messaging
class WebSocketManager:
    def __init__(self):
        self.notification_connections: Dict[int, List[WebSocket]] = {}
        self.messaging_connections: Dict[int, List[WebSocket]] = {}
        self.user_status: Dict[int, str] = {}  # online, away, busy, offline
        self.typing_status: Dict[str, Dict[int, datetime]] = {}  # context -> {user_id: last_typed}
    
    async def connect_notifications(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.notification_connections:
            self.notification_connections[user_id] = []
        self.notification_connections[user_id].append(websocket)
        
        # Update user status to online
        await self.update_user_status(user_id, "online")
    
    async def connect_messaging(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.messaging_connections:
            self.messaging_connections[user_id] = []
        self.messaging_connections[user_id].append(websocket)
    
    async def disconnect_notifications(self, websocket: WebSocket, user_id: int):
        if user_id in self.notification_connections:
            self.notification_connections[user_id].remove(websocket)
            if not self.notification_connections[user_id]:
                del self.notification_connections[user_id]
                # Update status to offline if no connections remain
                if user_id not in self.messaging_connections:
                    await self.update_user_status(user_id, "offline")
    
    async def disconnect_messaging(self, websocket: WebSocket, user_id: int):
        if user_id in self.messaging_connections:
            self.messaging_connections[user_id].remove(websocket)
            if not self.messaging_connections[user_id]:
                del self.messaging_connections[user_id]
                # Update status to offline if no connections remain
                if user_id not in self.notification_connections:
                    await self.update_user_status(user_id, "offline")
    
    async def send_notification(self, user_id: int, message: dict):
        if user_id in self.notification_connections:
            for connection in self.notification_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    # Handle disconnected websockets
                    await self.disconnect_notifications(connection, user_id)
    
    async def send_message(self, user_id: int, message: dict):
        if user_id in self.messaging_connections:
            for connection in self.messaging_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    # Handle disconnected websockets
                    await self.disconnect_messaging(connection, user_id)
    
    async def broadcast_notifications(self, user_ids: List[int], message: dict):
        for user_id in user_ids:
            await self.send_notification(user_id, message)
    
    async def broadcast_messages(self, user_ids: List[int], message: dict):
        for user_id in user_ids:
            await self.send_message(user_id, message)
    
    async def update_user_status(self, user_id: int, status: str):
        self.user_status[user_id] = status
        
        # Broadcast status change to relevant users
        status_message = {
            "type": "user_status_changed",
            "timestamp": datetime.utcnow().isoformat(),
            "user": {"id": user_id},  # Will be populated with full user data
            "status": status,
            "last_seen": datetime.utcnow().isoformat()
        }
        
        # Get users who should receive this status update
        # (task collaborators, direct message contacts, etc.)
        relevant_users = await self.get_relevant_users_for_status(user_id)
        await self.broadcast_notifications(relevant_users, status_message)
    
    async def handle_typing_indicator(self, user_id: int, context_type: str, context_id: int, is_typing: bool):
        context_key = f"{context_type}_{context_id}"
        
        if is_typing:
            if context_key not in self.typing_status:
                self.typing_status[context_key] = {}
            self.typing_status[context_key][user_id] = datetime.utcnow()
        else:
            if context_key in self.typing_status and user_id in self.typing_status[context_key]:
                del self.typing_status[context_key][user_id]
        
        # Broadcast typing indicator
        typing_message = {
            "type": "typing_indicator",
            "timestamp": datetime.utcnow().isoformat(),
            "user": {"id": user_id},  # Will be populated with full user data
            "context": {
                "type": context_type,
                "context_id": context_id
            },
            "is_typing": is_typing
        }
        
        # Get other participants in this context
        participants = await self.get_context_participants(context_type, context_id)
        recipients = [p for p in participants if p != user_id]
        await self.broadcast_messages(recipients, typing_message)
```

**Messaging & Notification Service Integration**
```python
# Enhanced service for handling notifications and messaging
class MessagingService:
    def __init__(self, db: Session, ws_manager: WebSocketManager):
        self.db = db
        self.ws_manager = ws_manager
    
    # Notification methods
    async def notify_comment_added(self, comment: TaskComment, task: Task):
        recipients = self.get_task_participants(task.id)
        
        notification = {
            "type": "task_comment_added",
            "timestamp": datetime.utcnow().isoformat(),
            "task_id": task.id,
            "comment": self.serialize_comment(comment),
            "recipients": recipients
        }
        
        await self.ws_manager.broadcast_notifications(recipients, notification)
    
    async def notify_status_changed(self, task: Task, previous_status: str, changed_by: User):
        recipients = self.get_task_stakeholders(task.id)
        
        notification = {
            "type": "task_status_changed",
            "timestamp": datetime.utcnow().isoformat(),
            "task_id": task.id,
            "task_title": task.title,
            "previous_status": previous_status,
            "new_status": task.status,
            "changed_by": self.serialize_user(changed_by),
            "recipients": recipients
        }
        
        await self.ws_manager.broadcast_notifications(recipients, notification)
    
    # Real-time messaging methods
    async def send_direct_message(self, from_user_id: int, to_user_id: int, content: str, 
                                  content_type: str = "text", media_attachments: List[int] = None):
        """Send a direct message between two users."""
        # Store message in database
        message = DirectMessage(
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            content=content,
            content_type=content_type,
            media_attachment_ids=media_attachments or []
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        # Send via WebSocket
        message_data = {
            "type": "direct_message",
            "timestamp": message.created_at.isoformat(),
            "message_id": f"msg_{message.id}",
            "from_user": self.serialize_user(message.from_user),
            "to_user": self.serialize_user(message.to_user),
            "content": content,
            "content_type": content_type,
            "media_attachments": [self.serialize_media(m) for m in message.media_attachments],
            "recipients": [to_user_id]
        }
        
        await self.ws_manager.send_message(to_user_id, message_data)
        return message
    
    async def send_task_chat_message(self, task_id: int, from_user_id: int, content: str,
                                     content_type: str = "text", media_attachments: List[int] = None):
        """Send a message to a task's chat channel."""
        # Store message in database
        message = TaskChatMessage(
            task_id=task_id,
            from_user_id=from_user_id,
            content=content,
            content_type=content_type,
            media_attachment_ids=media_attachments or []
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        # Get all task participants
        participants = self.get_task_participants(task_id)
        
        # Send via WebSocket
        message_data = {
            "type": "task_chat_message",
            "timestamp": message.created_at.isoformat(),
            "message_id": f"msg_{message.id}",
            "task_id": task_id,
            "task_title": message.task.title,
            "from_user": self.serialize_user(message.from_user),
            "content": content,
            "content_type": content_type,
            "media_attachments": [self.serialize_media(m) for m in message.media_attachments],
            "recipients": [p for p in participants if p != from_user_id]
        }
        
        await self.ws_manager.broadcast_messages(participants, message_data)
        return message
    
    async def mark_message_as_read(self, message_id: str, user_id: int):
        """Mark a message as read and notify sender."""
        # Update read status in database
        read_receipt = MessageReadReceipt(
            message_id=message_id,
            user_id=user_id,
            read_at=datetime.utcnow()
        )
        self.db.add(read_receipt)
        self.db.commit()
        
        # Get original message to find sender
        message = self.get_message_by_id(message_id)
        if message:
            read_notification = {
                "type": "message_read",
                "timestamp": datetime.utcnow().isoformat(),
                "message_id": message_id,
                "read_by": self.serialize_user_basic(user_id),
                "context": self.get_message_context(message),
                "recipients": [message.from_user_id]
            }
            
            await self.ws_manager.send_message(message.from_user_id, read_notification)
```

---

## Technical Specifications

### Backend Technology Stack
- **Framework**: FastAPI (existing)
- **Database**: SQLite with SQLAlchemy ORM (existing)
- **Storage**: MinIO for media files (existing)
- **Rich Text**: Markdown processing with sanitization
- **Real-time**: WebSocket for notifications and live updates
- **Notifications**: WebSocket + Email service integration
- **WebSocket**: FastAPI WebSocket support with connection management

### Frontend Technology Stack
- **Framework**: React with TypeScript (existing)
- **Rich Text Editor**: TinyMCE or Draft.js
- **Real-time**: WebSocket client for notifications and live updates
- **Media Upload**: Drag-and-drop with progress indicators
- **Styling**: Tailwind CSS (existing)
- **State Management**: React Query for server state

### Security Considerations
- **Input Validation**: Strict validation for all comment content
- **XSS Prevention**: Content sanitization for rich text
- **File Upload Security**: MIME type validation, file size limits
- **Permission Enforcement**: Role-based access control
- **Rate Limiting**: Prevent comment spam and abuse

### Performance Requirements
- **Comment Loading**: < 200ms for 100 comments
- **Media Upload**: Progress indicators for files > 1MB
- **Real-time Updates**: < 1s latency for WebSocket notifications
- **WebSocket Connections**: Support 1000+ concurrent connections
- **Notification Delivery**: < 500ms from event to user notification
- **Database**: Optimized queries with proper indexing
- **Caching**: Redis for frequently accessed data

---

## Risk Assessment & Mitigation

### High Risk
1. **Database Migration Complexity**
   - **Risk**: Data loss during schema changes
   - **Mitigation**: Comprehensive backup strategy, staged rollout

2. **Performance Impact**
   - **Risk**: Slow page loads with many comments
   - **Mitigation**: Pagination, lazy loading, database optimization

### Medium Risk
1. **WebSocket Connection Management**
   - **Risk**: Connection drops, memory leaks, scaling issues
   - **Mitigation**: Connection pooling, heartbeat monitoring, graceful reconnection

2. **Real-time Notification Reliability**
   - **Risk**: Messages lost, duplicate notifications, ordering issues
   - **Mitigation**: Message queuing, deduplication, sequence numbers

3. **Rich Text Security**
   - **Risk**: XSS attacks through comment content
   - **Mitigation**: Strict content sanitization, CSP headers

### Low Risk
1. **User Adoption**
   - **Risk**: Users may resist new workflow
   - **Mitigation**: Gradual rollout, training materials, feedback collection

---

## Timeline & Milestones

### Total Duration: 10-15 weeks

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2-3 weeks | Database schema, basic API endpoints |
| Phase 2 | 3-4 weeks | Workflow engine, comments system |
| Phase 3 | 4-5 weeks | Complete frontend implementation |
| Phase 4 | 2-3 weeks | Testing, optimization, deployment |

### Critical Milestones
- **Week 3**: Database migration complete
- **Week 6**: Core workflow functionality working
- **Week 9**: Comments system fully functional
- **Week 12**: Production-ready implementation
- **Week 15**: Full deployment and user training

---

## Success Criteria

### Functional Requirements ✓
- [ ] Task workflow enforces proper status progression
- [ ] Only task creators can approve completion
- [ ] Rich text comments with media attachments work seamlessly
- [ ] SMS-like comment interface is intuitive and responsive
- [ ] All existing functionality remains intact

### Performance Requirements ✓
- [ ] Comment loading time < 200ms
- [ ] Media upload with progress indicators
- [ ] WebSocket notifications delivered < 500ms
- [ ] Real-time updates with < 1s latency
- [ ] Support 1000+ concurrent WebSocket connections
- [ ] Mobile-responsive design works on all devices

### Security Requirements ✓
- [ ] All user inputs are properly validated and sanitized
- [ ] File uploads are secure with proper validation
- [ ] Permission system prevents unauthorized actions
- [ ] Audit trail captures all workflow changes

---

## Next Steps

1. **Review and Approval**: Stakeholder review of this implementation plan
2. **Resource Allocation**: Assign development team and timeline
3. **Environment Setup**: Prepare development and staging environments
4. **Phase 1 Kickoff**: Begin database schema design and implementation

---

*This document should be reviewed and updated as implementation progresses. Regular milestone reviews will ensure the project stays on track and meets all requirements.*
