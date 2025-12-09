"""
Service Request models and schemas.
Contains all service request related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from enum import Enum
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa

from .base import BasePublicList

if TYPE_CHECKING:
    from .customer import Customer
    from .service_request_timeline import ServiceRequestTimeline
    from .service import Service
    from .branch import Branch


class ServiceRequestStatus(str, Enum):
    """Enum for service request status values."""
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Service Request Models
class ServiceRequestBase(SQLModel):
    """Base service request model with shared properties."""
    description: Optional[str] = Field(default=None, max_length=1000)
    preferred_date: Optional[str] = Field(default=None, description="Preferred date in ISO format")
    preferred_time: Optional[str] = Field(default=None, description="Preferred time in HH:MM format")
    urgent: bool = False
    customer_latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Customer location latitude")
    customer_longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Customer location longitude")
    status: ServiceRequestStatus = Field(default=ServiceRequestStatus.PENDING, description="Current status of the service request")


class ServiceRequestCreate(ServiceRequestBase):
    """Schema for service request creation via API."""
    service_id: uuid.UUID


class ServiceRequestUpdate(ServiceRequestBase):
    """Schema for service request updates via API."""
    service_id: Optional[uuid.UUID] = None
    status: Optional[ServiceRequestStatus] = None


# Database model for service requests
class ServiceRequest(ServiceRequestBase, table=True):
    """Service request database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    customer_id: uuid.UUID = Field(
        foreign_key="customer.id", nullable=False, ondelete="CASCADE"
    )
    service_id: uuid.UUID = Field(
        foreign_key="service.id", nullable=False, ondelete="CASCADE"
    )
    branch_id: Optional[uuid.UUID] = Field(
        foreign_key="branch.id", nullable=True, ondelete="SET NULL"
    )
    created_at: Optional[str] = Field(default=None, description="Request creation timestamp")
    updated_at: Optional[str] = Field(default=None, description="Last update timestamp")
    
    # Override status field to use proper SQLAlchemy type
    status: ServiceRequestStatus = Field(
        default=ServiceRequestStatus.PENDING,
        sa_column=sa.Column(
            sa.Enum(ServiceRequestStatus, name="servicerequeststatus", create_type=False),
            nullable=False
        )
    )
    
    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="service_requests")
    service: Optional["Service"] = Relationship()
    branch: Optional["Branch"] = Relationship()
    timeline: List["ServiceRequestTimeline"] = Relationship(back_populates="service_request")


# Properties to return via API for service requests
class ServiceRequestPublic(ServiceRequestBase):
    """Public service request schema for API responses."""
    id: uuid.UUID
    customer_id: uuid.UUID
    service_id: uuid.UUID
    branch_id: Optional[uuid.UUID]
    created_at: Optional[str]
    updated_at: Optional[str]


# Properties to return via API with detailed information
class ServiceRequestWithDetailsPublic(ServiceRequestBase):
    """Service request schema with detailed information for API responses."""
    id: uuid.UUID
    customer_id: uuid.UUID
    service_id: uuid.UUID
    branch_id: Optional[uuid.UUID]
    created_at: Optional[str]
    updated_at: Optional[str]
    customer_name: str
    service_name: str
    branch_name: Optional[str]
    company_name: Optional[str]


class ServiceRequestsPublic(BasePublicList):
    """Schema for paginated service request list responses."""
    data: List[ServiceRequestPublic]


class ServiceRequestsWithDetailsPublic(BasePublicList):
    """Schema for paginated service request list responses with detailed information."""
    data: List[ServiceRequestWithDetailsPublic]