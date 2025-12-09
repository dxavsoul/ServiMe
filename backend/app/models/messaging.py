"""
Enhanced messaging models for customer-company communication after appointment scheduling.
"""
import uuid
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, UTC
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList

if TYPE_CHECKING:
    from .user import User
    from .company import Company

# Base messaging models
class MessageBase(SQLModel):
    """Base message model with shared properties."""
    content: str = Field(max_length=1000, description="Message content")
    sender_type: str = Field(max_length=20, description="Type of sender: 'customer' or 'company'")
    is_read: bool = Field(default=False, description="Whether the message has been read")


class ConversationBase(SQLModel):
    """Base conversation model with shared properties."""
    subject: Optional[str] = Field(default=None, max_length=255, description="Conversation subject")
    status: str = Field(default="active", max_length=20, description="Conversation status: active, closed, archived")
    is_company_available: bool = Field(default=True, description="Whether company is available for messaging")


# Database models
class Conversation(ConversationBase, table=True):
    """Conversation between customer and company after appointment scheduling."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    customer_id: uuid.UUID = Field(foreign_key="user.id", description="Customer user ID")
    company_id: uuid.UUID = Field(foreign_key="company.id", description="Company ID")
    appointment_id: Optional[uuid.UUID] = Field(default=None, description="Related appointment ID")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationships
    messages: List["Message"] = Relationship(back_populates="conversation")
    customer: Optional["User"] = Relationship()
    company: Optional["Company"] = Relationship()


class Message(MessageBase, table=True):
    """Individual message in a conversation."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id", ondelete="CASCADE")
    sender_id: uuid.UUID = Field(foreign_key="user.id", description="ID of the user who sent the message")
    sent_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    read_at: Optional[datetime] = Field(default=None, description="When the message was read")

    # Relationships
    conversation: Optional[Conversation] = Relationship(back_populates="messages")
    sender: Optional["User"] = Relationship()


class CompanyAvailability(SQLModel, table=True):
    """Company messaging availability status."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", unique=True)
    is_available: bool = Field(default=True, description="Whether company is available for messaging")
    availability_message: Optional[str] = Field(default=None, max_length=255, description="Custom availability message")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_by: uuid.UUID = Field(foreign_key="user.id", description="User who updated the availability")

    # Relationships
    company: Optional["Company"] = Relationship()
    updater: Optional["User"] = Relationship()


# API Schemas
class ConversationCreate(SQLModel):
    """Schema for creating a new conversation."""
    customer_id: uuid.UUID
    company_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    subject: Optional[str] = Field(default=None, max_length=255)


class MessageCreate(SQLModel):
    """Schema for creating a new message."""
    conversation_id: uuid.UUID
    content: str = Field(max_length=1000)


class MessageUpdate(SQLModel):
    """Schema for updating a message (mark as read)."""
    is_read: bool = True


class ConversationUpdate(SQLModel):
    """Schema for updating conversation status."""
    status: Optional[str] = Field(default=None, max_length=20)
    is_company_available: Optional[bool] = None


class CompanyAvailabilityUpdate(SQLModel):
    """Schema for updating company availability."""
    is_available: bool
    availability_message: Optional[str] = Field(default=None, max_length=255)


# Public response schemas
class MessagePublic(MessageBase):
    """Public message schema for API responses."""
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    sent_at: datetime
    read_at: Optional[datetime] = None
    sender_name: Optional[str] = None  # Will be populated from sender relationship


class ConversationPublic(ConversationBase):
    """Public conversation schema for API responses."""
    id: uuid.UUID
    customer_id: uuid.UUID
    company_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    company_name: Optional[str] = None
    unread_count: int = 0
    last_message: Optional[MessagePublic] = None


class ConversationWithMessages(ConversationPublic):
    """Conversation with all messages."""
    messages: List[MessagePublic] = []


class CompanyAvailabilityPublic(SQLModel):
    """Public company availability schema."""
    id: uuid.UUID
    company_id: uuid.UUID
    is_available: bool
    availability_message: Optional[str] = None
    updated_at: datetime
    company_name: Optional[str] = None
    updater_name: Optional[str] = None


# List response schemas
class ConversationsPublic(BasePublicList):
    """Schema for paginated conversation list responses."""
    data: List[ConversationPublic]


class MessagesPublic(BasePublicList):
    """Schema for paginated message list responses."""
    data: List[MessagePublic]
