"""
Service Request Timeline models.
Contains timeline tracking for service request status changes.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa
from .base import BasePublicList

if TYPE_CHECKING:
    from .service_request import ServiceRequest, ServiceRequestStatus
else:
    from .service_request import ServiceRequestStatus


class ServiceRequestTimelineBase(SQLModel):
    """Base timeline model with shared properties."""
    status: ServiceRequestStatus = Field(description="Service request status")
    notes: Optional[str] = Field(default=None, max_length=500, description="Optional notes about the status change")
    changed_by_user_id: Optional[uuid.UUID] = Field(default=None, description="User who made the change")
    changed_by_user_type: Optional[str] = Field(default=None, max_length=50, description="Type of user (customer, branch_user, admin)")
    timestamp: str = Field(description="When the status change occurred (ISO format)")


class ServiceRequestTimelineCreate(ServiceRequestTimelineBase):
    """Schema for timeline entry creation."""
    service_request_id: uuid.UUID


class ServiceRequestTimelineUpdate(SQLModel):
    """Schema for timeline entry updates (limited)."""
    notes: Optional[str] = Field(default=None, max_length=500)


# Database model for service request timeline
class ServiceRequestTimeline(ServiceRequestTimelineBase, table=True):
    """Service request timeline database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    service_request_id: uuid.UUID = Field(
        foreign_key="servicerequest.id", nullable=False, ondelete="CASCADE"
    )
    
    # Override status field to use proper SQLAlchemy type
    status: ServiceRequestStatus = Field(
        sa_column=sa.Column(
            sa.Enum(ServiceRequestStatus, name="servicerequeststatus", create_type=False),
            nullable=False
        )
    )
    
    # Relationships - using TYPE_CHECKING to avoid circular imports
    service_request: Optional["ServiceRequest"] = Relationship(back_populates="timeline")


# Properties to return via API
class ServiceRequestTimelinePublic(ServiceRequestTimelineBase):
    """Public timeline schema for API responses."""
    id: uuid.UUID
    service_request_id: uuid.UUID


class ServiceRequestTimelinesPublic(BasePublicList):
    """Schema for paginated timeline list responses."""
    data: List[ServiceRequestTimelinePublic]


# Action request schemas for branch users
class ServiceRequestAction(SQLModel):
    """Base schema for service request actions."""
    notes: Optional[str] = Field(default=None, max_length=500, description="Optional notes about the action")


class ServiceRequestAccept(ServiceRequestAction):
    """Schema for accepting a service request."""
    pass


class ServiceRequestStart(ServiceRequestAction):
    """Schema for starting work on a service request."""
    pass


class ServiceRequestComplete(ServiceRequestAction):
    """Schema for completing a service request."""
    pass


class ServiceRequestReschedule(ServiceRequestAction):
    """Schema for rescheduling a service request."""
    new_date: str = Field(description="New preferred date in ISO format")
    new_time: str = Field(description="New preferred time in HH:MM format")


class ServiceRequestCancel(ServiceRequestAction):
    """Schema for cancelling a service request."""
    reason: Optional[str] = Field(default=None, max_length=500, description="Reason for cancellation")
